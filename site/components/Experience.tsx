'use client'
import { Canvas, useFrame, useThree, type ThreeEvent } from '@react-three/fiber'
import { useGLTF, Environment, Lightformer, Html, RoundedBox } from '@react-three/drei'
import { Suspense, useEffect, useMemo, useRef, useState } from 'react'
import * as THREE from 'three'
import { stage, getPose, type Pose, type Vec3 } from '@/lib/stage'
import { drawDevice, drawMonitor, SW, SH } from '@/lib/screens'
import { FINISHES } from '@/lib/spec'

const MODEL = 'models/osmium_v1.glb'

// part -> explorer group, explode offset (three units, along the part's own direction)
const PART_GROUP: Record<string, { g: string; e: Vec3 }> = {
  display: { g: 'display', e: [0, 0, 1.05] },
  front_shell: { g: 'front', e: [0, 0, 0.72] },
  stick_l_cap: { g: 'front', e: [0, 0, 0.9] }, stick_r_cap: { g: 'front', e: [0, 0, 0.9] },
  dpad: { g: 'front', e: [0, 0, 0.88] }, abxy: { g: 'front', e: [0, 0, 0.88] },
  stick_l_module: { g: 'front', e: [0, 0, 0.42] }, stick_r_module: { g: 'front', e: [0, 0, 0.42] },
  ctrl_pcb_l: { g: 'controls', e: [-0.12, 0, 0.3] }, ctrl_pcb_r: { g: 'controls', e: [0.12, 0, 0.3] },
  speaker_l: { g: 'controls', e: [-0.1, -0.08, 0.2] }, speaker_r: { g: 'controls', e: [0.1, -0.08, 0.2] },
  battery_a: { g: 'battery', e: [0, 0.06, 0.16] }, battery_b: { g: 'battery', e: [0, -0.06, 0.16] },
  mainboard: { g: 'board', e: [0, 0, 0] }, soc: { g: 'board', e: [0, 0, -0.08] },
  vapor_chamber: { g: 'thermal', e: [0, 0, -0.24] }, fan: { g: 'thermal', e: [0, 0, -0.36] }, fin_stack: { g: 'thermal', e: [0, 0.08, -0.36] },
  back_cover: { g: 'back', e: [0, 0, -0.78] },
}

function makeMaterials() {
  const m = {
    frame: new THREE.MeshPhysicalMaterial({ color: '#1b1e22', roughness: 0.5, metalness: 0, clearcoat: 0.15, clearcoatRoughness: 0.6 }),
    back: new THREE.MeshPhysicalMaterial({ color: '#5b6672', roughness: 0.38, metalness: 0.92 }),
    glass: new THREE.MeshPhysicalMaterial({ color: '#050607', roughness: 0.06, metalness: 0.1, clearcoat: 1, clearcoatRoughness: 0.03 }),
    rubber: new THREE.MeshStandardMaterial({ color: '#111214', roughness: 0.82 }),
    button: new THREE.MeshPhysicalMaterial({ color: '#202327', roughness: 0.35, clearcoat: 0.4 }),
    pouch: new THREE.MeshStandardMaterial({ color: '#8d939b', roughness: 0.45, metalness: 0.55 }),
    pcb: new THREE.MeshStandardMaterial({ color: '#13261f', roughness: 0.55, metalness: 0.15 }),
    chip: new THREE.MeshStandardMaterial({ color: '#16171a', roughness: 0.35, metalness: 0.3 }),
    die: new THREE.MeshStandardMaterial({ color: '#3a3f47', roughness: 0.18, metalness: 0.8 }),
    copper: new THREE.MeshStandardMaterial({ color: '#b87350', roughness: 0.32, metalness: 1 }),
    alu: new THREE.MeshStandardMaterial({ color: '#b9bec5', roughness: 0.3, metalness: 1 }),
    darkPlastic: new THREE.MeshStandardMaterial({ color: '#202226', roughness: 0.7 }),
    speaker: new THREE.MeshStandardMaterial({ color: '#2b2e33', roughness: 0.6, metalness: 0.2 }),
  }
  return m
}
type Mats = ReturnType<typeof makeMaterials>

function matFor(name: string, m: Mats) {
  if (name === 'front_shell') return m.frame
  if (name === 'back_cover') return m.back
  if (name === 'display') return m.glass
  if (name.includes('cap')) return m.rubber
  if (name === 'dpad' || name === 'abxy') return m.button
  if (name.startsWith('battery')) return m.pouch
  if (name === 'mainboard' || name.startsWith('ctrl_pcb')) return m.pcb
  if (name === 'soc') return m.die
  if (name === 'vapor_chamber') return m.copper
  if (name === 'fin_stack') return m.alu
  if (name === 'fan') return m.darkPlastic
  if (name.startsWith('speaker')) return m.speaker
  if (name.includes('module')) return m.darkPlastic
  return m.darkPlastic
}

const damp = (a: number, b: number, k: number, dt: number) => a + (b - a) * (1 - Math.exp(-k * dt))
const damp3 = (a: Vec3, b: Vec3, k: number, dt: number) => { a[0] = damp(a[0], b[0], k, dt); a[1] = damp(a[1], b[1], k, dt); a[2] = damp(a[2], b[2], k, dt) }

// Shared, damped "current pose" so props and device agree.
const cur = {
  explode: 1, rot: [0.62, -0.82, 0.04] as Vec3, pos: [0, 0, 0] as Vec3, look: [0, 0, 0] as Vec3,
  camPos: [0, 0.2, 4] as Vec3, presence: 1, pocket: 0, desk: 0, monitorOn: 0, shift: [0, 0, 0] as Vec3,
  drag: [0, 0] as [number, number], pose: getPose('intro', 0) as Pose,
}

/* ---------- procedural detail at CAD dimensions (three units = 100 mm) ---------- */
function BoardDetail({ m }: { m: Mats }) {
  // mainboard top face z = (4.7+0.8-8.75)/100 ; components hang below toward the vapour chamber side
  const zTop = (4.7 + 0.8 - 8.75) / 100, zBot = (4.7 - 8.75) / 100
  return (
    <group>
      {/* LPDDR5X packages flank the SoC */}
      {[[-0.06, 0.24], [-0.06, -0.14], [0.19, 0.24], [0.19, -0.14]].map(([x, y], i) => (
        <mesh key={i} position={[x - 0.25 + 0.31, y, zBot - 0.006]} material={m.chip}><boxGeometry args={[0.12, 0.13, 0.012]} /></mesh>
      ))}
      {/* M.2 2230 SSD on the top face */}
      <group position={[-0.47, -0.13, zTop + 0.012]}>
        <mesh material={m.pcb}><boxGeometry args={[0.3, 0.22, 0.008]} /></mesh>
        <mesh position={[0.02, 0, 0.008]} material={m.chip}><boxGeometry args={[0.15, 0.13, 0.01]} /></mesh>
        <mesh position={[-0.11, 0, 0.006]} material={m.chip}><boxGeometry args={[0.04, 0.06, 0.006]} /></mesh>
      </group>
      {/* passives / PMIC scatter */}
      {Array.from({ length: 22 }).map((_, i) => (
        <mesh key={i} position={[-0.62 + (i % 11) * 0.075, 0.2 + Math.floor(i / 11) * 0.09, zTop + 0.004]} material={i % 3 ? m.chip : m.alu}>
          <boxGeometry args={[0.03 + (i % 3) * 0.01, 0.02, 0.008]} />
        </mesh>
      ))}
    </group>
  )
}

function FanDetail({ m }: { m: Mats }) {
  const ref = useRef<THREE.Group>(null)
  useFrame((_, dt) => { if (ref.current && !stage.reduced) ref.current.rotation.z += dt * 6 })
  const z = (2.0 + 3.5 - 8.75) / 100
  return (
    <group position={[0.435, 0.035, z]}>
      <group ref={ref}>
        {Array.from({ length: 17 }).map((_, i) => (
          <group key={i} rotation={[0, 0, (i / 17) * Math.PI * 2]}>
            <mesh position={[0, 0.15, 0]} rotation={[0, 0.5, 0]} material={m.alu}><boxGeometry args={[0.006, 0.12, 0.05]} /></mesh>
          </group>
        ))}
        <mesh rotation={[Math.PI / 2, 0, 0]} material={m.darkPlastic}><cylinderGeometry args={[0.08, 0.08, 0.06, 32]} /></mesh>
      </group>
    </group>
  )
}

function FinDetail({ m }: { m: Mats }) {
  const z = (2.0 + 3.5 - 8.75) / 100
  return (
    <group position={[0.435, 0.325, z]}>
      {Array.from({ length: 30 }).map((_, i) => (
        <mesh key={i} position={[-0.195 + i * 0.0134, 0, 0]} material={m.alu}><boxGeometry args={[0.003, 0.118, 0.069]} /></mesh>
      ))}
    </group>
  )
}

/* --------------------------------- device ---------------------------------- */
function Device({ selected }: { selected: string | null }) {
  const gltf = useGLTF(MODEL)
  const m = useMemo(makeMaterials, [])
  const root = useRef<THREE.Group>(null)
  const parts = useRef<Record<string, THREE.Group | null>>({})
  const screenRef = useRef<THREE.Group>(null)

  const geos = useMemo(() => {
    const out: { name: string; geo: THREE.BufferGeometry }[] = []
    gltf.scene.traverse((o) => {
      const mesh = o as THREE.Mesh
      if (mesh.isMesh) {
        let name = mesh.name
        if (!PART_GROUP[name] && mesh.parent && PART_GROUP[mesh.parent.name]) name = mesh.parent.name
        if (PART_GROUP[name] && !out.find((x) => x.name === name)) {
          const g = mesh.geometry.clone()
          mesh.updateWorldMatrix(true, false)
          g.applyMatrix4(mesh.matrixWorld)
          out.push({ name, geo: g })
        }
      }
    })
    return out
  }, [gltf])

  // screen canvas
  const { canvas, tex } = useMemo(() => {
    const canvas = document.createElement('canvas'); canvas.width = SW; canvas.height = SH
    const tex = new THREE.CanvasTexture(canvas); tex.colorSpace = THREE.SRGBColorSpace; tex.anisotropy = 4
    return { canvas, tex }
  }, [])
  const ctx = useMemo(() => canvas.getContext('2d')!, [canvas])
  const acc = useRef({ t: 0, last: -1 })

  useEffect(() => {
    // highlight selected group in the explorer
    for (const { name } of geos) {
      const g = parts.current[name]; if (!g) continue
      g.traverse((o) => {
        const mesh = o as THREE.Mesh
        if (!mesh.isMesh) return
        const base = mesh.userData.baseMat ?? mesh.material
        mesh.userData.baseMat = base
        if (selected && PART_GROUP[name].g === selected) {
          const h = (base as THREE.MeshStandardMaterial).clone()
          h.emissive = new THREE.Color('#5d86ad'); h.emissiveIntensity = 0.45
          mesh.material = h
        } else mesh.material = base
      })
    }
  }, [selected, geos])

  useFrame((_, dtRaw) => {
    const dt = Math.min(dtRaw, 0.1)
    const pose = cur.pose
    const k = (stage.reduced || stage.snap) ? 1000 : 3.2
    cur.explode = damp(cur.explode, pose.explode, k, dt)
    // finish
    const f = FINISHES.find((x) => x.id === stage.finish) ?? FINISHES[0]
    m.back.color.lerp(new THREE.Color(f.back), 1 - Math.exp(-6 * dt))
    m.frame.color.lerp(new THREE.Color(f.frame), 1 - Math.exp(-6 * dt))

    for (const { name } of geos) {
      const g = parts.current[name]; if (!g) continue
      const e = PART_GROUP[name].e
      g.position.set(e[0] * cur.explode, e[1] * cur.explode, e[2] * cur.explode)
    }
    if (screenRef.current) screenRef.current.position.z = 0.0885 + PART_GROUP.display.e[2] * cur.explode

    if (root.current) {
      root.current.rotation.set(cur.rot[0] + cur.drag[1], cur.rot[1] + cur.drag[0], cur.rot[2])
      root.current.position.set(cur.pos[0], cur.pos[1], cur.pos[2])
      const s = Math.max(0.0001, cur.presence)
      root.current.scale.setScalar(s)
      root.current.visible = cur.presence > 0.01
    }

    // screen: redraw at ~30 fps when visible
    acc.current.t += stage.reduced ? 0 : dt
    if (cur.presence > 0.01 && acc.current.t - acc.current.last > 1 / 30) {
      acc.current.last = acc.current.t
      const qam = stage.qamOverride >= 0 && stage.section === 'perf' ? stage.qamOverride : pose.qam
      drawDevice(ctx, pose.screen, acc.current.t + 4, qam, pose.screenP)
      tex.needsUpdate = true
    }
  })

  const onClick = (name: string) => (e: ThreeEvent<MouseEvent>) => {
    if (stage.section !== 'eng') return
    e.stopPropagation()
    const id = PART_GROUP[name].g
    window.dispatchEvent(new CustomEvent('osmium:select', { detail: id }))
  }
  const onOver = (name: string) => (e: ThreeEvent<PointerEvent>) => {
    if (stage.section !== 'eng') return
    e.stopPropagation(); document.body.style.cursor = 'pointer'; stage.hovered = PART_GROUP[name].g
  }
  const onOut = () => { document.body.style.cursor = ''; stage.hovered = null }

  return (
    <group ref={root}>
      {geos.map(({ name, geo }) => (
        <group key={name} ref={(r) => { parts.current[name] = r }}>
          <mesh geometry={geo} material={matFor(name, m)} castShadow receiveShadow
            onClick={onClick(name)} onPointerOver={onOver(name)} onPointerOut={onOut} />
          {name === 'mainboard' && <BoardDetail m={m} />}
          {name === 'fan' && <FanDetail m={m} />}
          {name === 'fin_stack' && <FinDetail m={m} />}
        </group>
      ))}
      <group ref={screenRef} position={[0, 0, 0.0885]}>
        <mesh>
          <planeGeometry args={[1.34, 0.755]} />
          <meshBasicMaterial map={tex} toneMapped={false} />
        </mesh>
        {/* glass reflection layer */}
        <mesh position={[0, 0, 0.0008]}>
          <planeGeometry args={[1.34, 0.755]} />
          <meshPhysicalMaterial color="#000" transparent opacity={0.08} roughness={0.04} metalness={0.2} clearcoat={1} />
        </mesh>
      </group>
      <Hotspots />
    </group>
  )
}

/* -------------------------------- hotspots --------------------------------- */
const HOTSPOTS: { phase: Pose['hwPhase']; at: Vec3; text: string }[] = [
  { phase: 'front', at: [-0.815, 0.2, 0.12], text: 'TMR thumbstick' },
  { phase: 'front', at: [0.815, 0.2, 0.11], text: 'ABXY' },
  { phase: 'front', at: [-0.815, -0.18, 0.11], text: 'D-pad' },
  { phase: 'front', at: [0.815, -0.18, 0.12], text: 'Stick module' },
  { phase: 'top', at: [-0.76, 0.43, 0.02], text: 'Hall-effect trigger' },
  { phase: 'top', at: [0.435, 0.43, 0.03], text: 'Exhaust' },
  { phase: 'top', at: [-0.4, 0.43, 0.0], text: 'USB-C 10 Gbps' },
  { phase: 'back', at: [0.435, 0.1, -0.095], text: 'Air intake + dust filter' },
  { phase: 'back', at: [-0.8, -0.16, -0.095], text: 'Back button' },
  { phase: 'back', at: [-0.815, 0.365, -0.095], text: 'T5 screw (×6)' },
  { phase: 'bottom', at: [-0.1, -0.43, 0], text: 'USB4 40 Gbps' },
  { phase: 'bottom', at: [0.08, -0.43, 0], text: '3.5 mm audio' },
  { phase: 'bottom', at: [-0.8, -0.43, 0], text: 'Speaker' },
]

function Hotspots() {
  const [phase, setPhase] = useState<Pose['hwPhase']>(null)
  useFrame(() => {
    const p = stage.section === 'hw' ? cur.pose.hwPhase : null
    if (p !== phase) setPhase(p)
  })
  if (!phase) return null
  return (
    <>
      {HOTSPOTS.filter((h) => h.phase === phase).map((h) => (
        <Html key={h.text} position={h.at} center zIndexRange={[20, 0]} style={{ pointerEvents: 'none' }}>
          <div className="hotspot"><span className="hotspot-dot" /><span className="hotspot-label">{h.text}</span></div>
        </Html>
      ))}
    </>
  )
}

/* ------------------------------ pocket props ------------------------------- */
function PocketProps() {
  const g = useRef<THREE.Group>(null)
  const labels = useRef<HTMLDivElement[]>([])
  const L = (i: number) => (el: HTMLDivElement | null) => { if (el) labels.current[i] = el }
  const mats = useMemo(() => ({
    phone: new THREE.MeshPhysicalMaterial({ color: '#4a4e55', roughness: 0.3, metalness: 0.6, transparent: true }),
    phoneGlass: new THREE.MeshPhysicalMaterial({ color: '#15181d', roughness: 0.05, clearcoat: 1, transparent: true }),
    card: new THREE.MeshStandardMaterial({ color: '#c8ccd2', roughness: 0.4, metalness: 0.2, transparent: true }),
    aa: new THREE.MeshStandardMaterial({ color: '#c79a3e', roughness: 0.35, metalness: 0.7, transparent: true }),
    aaTop: new THREE.MeshStandardMaterial({ color: '#b6bbc2', roughness: 0.25, metalness: 1, transparent: true }),
  }), [])
  useFrame((_, dt) => {
    cur.pocket = damp(cur.pocket, cur.pose.pocket, (stage.reduced || stage.snap) ? 1000 : 4, Math.min(dt, 0.1))
    const v = cur.pocket
    labels.current.forEach((el) => { el.style.opacity = String(v); el.style.display = v > 0.02 ? 'block' : 'none' })
    Object.values(mats).forEach((mt) => { mt.opacity = v })
    if (g.current) { g.current.visible = v > 0.01; g.current.position.y = -0.5 - (1 - v) * 0.3 }
  })
  // device occupies x -1.35..0.55 at y 0.42 in the pocket pose; props sit below on a shared baseline
  return (
    <group ref={g} position={[0, -0.5, 0]}>
      <group position={[-0.535, 0, 0]}>
        <RoundedBox args={[1.63, 0.77, 0.083]} radius={0.04} smoothness={4} material={mats.phone} />
        <mesh position={[0, 0, 0.0425]} material={mats.phoneGlass}><planeGeometry args={[1.58, 0.72]} /></mesh>
        <Html position={[0, -0.5, 0]} center><div ref={L(0)} className="dim-label">6.9″ phone · 163 mm</div></Html>
      </group>
      <group position={[0.86, 0.1, 0]}>
        <RoundedBox args={[0.856, 0.54, 0.0076]} radius={0.003} smoothness={2} material={mats.card} />
        <Html position={[0, -0.43, 0]} center><div ref={L(1)} className="dim-label hide-sm">Card · 85.6 mm</div></Html>
      </group>
      <group position={[1.55, 0.1, 0]}>
        <mesh material={mats.aa}><cylinderGeometry args={[0.0725, 0.0725, 0.48, 32]} /></mesh>
        <mesh position={[0, 0.25, 0]} material={mats.aaTop}><cylinderGeometry args={[0.03, 0.03, 0.025, 20]} /></mesh>
        <Html position={[0, -0.43, 0]} center><div ref={L(2)} className="dim-label hide-sm">AA · 50.5 mm</div></Html>
      </group>
      <Html position={[-0.4, 1.5, 0]} center><div ref={L(3)} className="dim-label strong">Osmium · 190 mm</div></Html>
    </group>
  )
}

/* ------------------------------- desk props -------------------------------- */
function DeskProps() {
  const g = useRef<THREE.Group>(null)
  const { canvas, tex } = useMemo(() => {
    const canvas = document.createElement('canvas'); canvas.width = SW; canvas.height = SH
    const tex = new THREE.CanvasTexture(canvas); tex.colorSpace = THREE.SRGBColorSpace
    return { canvas, tex }
  }, [])
  const ctx = useMemo(() => canvas.getContext('2d')!, [canvas])
  const mats = useMemo(() => ({
    desk: new THREE.MeshStandardMaterial({ color: '#141518', roughness: 0.85, transparent: true }),
    dark: new THREE.MeshStandardMaterial({ color: '#1a1c20', roughness: 0.5, metalness: 0.4, transparent: true }),
    alu: new THREE.MeshStandardMaterial({ color: '#7d838b', roughness: 0.35, metalness: 1, transparent: true }),
    key: new THREE.MeshStandardMaterial({ color: '#202226', roughness: 0.7, transparent: true }),
  }), [])
  const tt = useRef({ t: 0, last: -1 })
  useFrame((_, dtRaw) => {
    const dt = Math.min(dtRaw, 0.1)
    cur.desk = damp(cur.desk, cur.pose.desk, (stage.reduced || stage.snap) ? 1000 : 3, dt)
    cur.monitorOn = damp(cur.monitorOn, cur.pose.monitorOn, (stage.reduced || stage.snap) ? 1000 : 3, dt)
    const v = cur.desk
    Object.values(mats).forEach((mt) => { mt.opacity = v })
    if (g.current) { g.current.visible = v > 0.01; g.current.position.y = -(1 - v) * 0.6 }
    tt.current.t += dt
    if (v > 0.01 && tt.current.t - tt.current.last > 1 / 30) {
      tt.current.last = tt.current.t; drawMonitor(ctx, tt.current.t, cur.monitorOn); tex.needsUpdate = true
    }
  })
  return (
    <group ref={g}>
      <mesh position={[0, -0.58, 0]} material={mats.desk} receiveShadow><boxGeometry args={[12, 0.06, 4.2]} /></mesh>
      {/* 27-inch class monitor ≈ 600 mm wide */}
      <group position={[0, 1.42, -1.25]}>
        <RoundedBox args={[6.12, 3.5, 0.12]} radius={0.04} material={mats.dark} />
        <mesh position={[0, 0.03, 0.062]}><planeGeometry args={[5.98, 3.36]} /><meshBasicMaterial map={tex} toneMapped={false} /></mesh>
        <mesh position={[0, -2.15, -0.12]} material={mats.alu}><boxGeometry args={[0.35, 1.0, 0.08]} /></mesh>
        <mesh position={[0, -1.94, -0.12]} material={mats.alu}><boxGeometry args={[1.5, 0.04, 0.9]} /></mesh>
      </group>
      {/* keyboard + mouse */}
      <group position={[-0.5, -0.53, 0.95]}>
        <RoundedBox args={[3.2, 0.06, 1.05]} radius={0.02} material={mats.dark} />
        {Array.from({ length: 5 }).map((_, r) => Array.from({ length: 15 }).map((__, c) => (
          <mesh key={`${r}-${c}`} position={[-1.47 + c * 0.21, 0.04, -0.4 + r * 0.2]} material={mats.key}><boxGeometry args={[0.17, 0.03, 0.16]} /></mesh>
        )))}
      </group>
      <group position={[1.65, -0.52, 1.05]}>
        <mesh scale={[0.32, 0.18, 0.55]} material={mats.dark}><sphereGeometry args={[1, 24, 16]} /></mesh>
      </group>
      {/* dock: weighted wedge with USB4 plug at x = -10 mm on the device's bottom edge */}
      <group position={[2.6, -0.52, 0.42]}>
        <RoundedBox args={[1.4, 0.12, 0.5]} radius={0.04} material={mats.dark} />
        <mesh position={[0, 0.16, -0.12]} rotation={[-0.22, 0, 0]} material={mats.dark}><boxGeometry args={[1.4, 0.3, 0.08]} /></mesh>
      </group>
    </group>
  )
}

/* ------------------------------- camera rig -------------------------------- */
function Rig() {
  const { camera, size } = useThree()
  const tmp = useMemo(() => new THREE.Vector3(), [])
  useFrame((_, dtRaw) => {
    const dt = Math.min(dtRaw, 0.1)
    const pose = getPose(stage.section, stage.p)
    cur.pose = pose
    const k = (stage.reduced || stage.snap) ? 1000 : 3
    const aspect = size.width / size.height
    const cam = camera as THREE.PerspectiveCamera
    const halfV = Math.tan(THREE.MathUtils.degToRad(cam.fov / 2))
    const narrow = aspect < 1.05

    let dist = pose.dist
    if (pose.fitScreen) {
      // frame the 134 × 76 mm display window edge to edge
      const need = Math.max(0.76 / (2 * halfV), 1.34 / (2 * halfV * aspect)) * (narrow ? 1.04 : 1.12)
      dist = need
    } else {
      if (narrow) {
        // portrait: size the device to ~88% of the viewport width, scaled with the pose's own framing
        const sceneW = pose.pocket > 0.5 ? 3.7 : pose.desk > 0.5 ? 6.4 : 2.2 * (pose.dist / 4.4)
        dist = sceneW / (2 * halfV * aspect)
      } else dist *= Math.max(1, 1.6 / aspect)
    }

    // shift device away from the copy column
    const visW = 2 * dist * halfV * aspect, visH = 2 * dist * halfV
    const shift: Vec3 = [0, 0, 0]
    if (!pose.fitScreen && pose.desk < 0.5 && pose.pocket < 0.5) {
      if (!narrow && pose.side === 'left') shift[0] = visW * 0.15
      if (!narrow && pose.side === 'right') shift[0] = -visW * 0.15
      if (narrow && pose.side === 'left') shift[1] = -visH * 0.14
      if (narrow && pose.side === 'right') shift[1] = visH * 0.3
    }
    if (pose.pocket > 0.5) { if (narrow) shift[1] = -visH * 0.2; else shift[0] = visW * 0.12 }

    damp3(cur.shift, shift, k, dt)
    damp3(cur.rot, pose.rot, k, dt)
    damp3(cur.pos, pose.pos, k, dt)
    damp3(cur.look, pose.look, k, dt)
    cur.presence = damp(cur.presence, pose.presence, (stage.reduced || stage.snap) ? 1000 : 5, dt)

    // drag inspection (hardware + engineering sections)
    const canDrag = stage.section === 'hw' || stage.section === 'eng'
    if (!canDrag) { stage.dragX = damp(stage.dragX, 0, 3, dt); stage.dragY = damp(stage.dragY, 0, 3, dt) }
    cur.drag[0] = damp(cur.drag[0], stage.dragX, 10, dt)
    cur.drag[1] = damp(cur.drag[1], stage.dragY, 10, dt)

    const d = tmp.set(...pose.camDir).normalize().multiplyScalar(dist)
    const target: Vec3 = [cur.look[0] + d.x, cur.look[1] + d.y, cur.look[2] + d.z]
    damp3(cur.camPos, target, k, dt)
    // the layout shift moves the camera, so the device and every prop shift together
    camera.position.set(cur.camPos[0] - cur.shift[0], cur.camPos[1] - cur.shift[1], cur.camPos[2])
    camera.lookAt(cur.look[0] - cur.shift[0], cur.look[1] - cur.shift[1], cur.look[2])
  })
  return null
}

function Lights() {
  return (
    <>
      <ambientLight intensity={0.45} />
      <directionalLight position={[3, 4, 5]} intensity={2.4} castShadow={false} />
      <directionalLight position={[-4, 1.5, -3]} intensity={0.9} color="#a9c3dc" />
      <spotLight position={[0, 5, 2]} angle={0.5} penumbra={1} intensity={8} distance={14} />
      <Environment resolution={256} frames={1}>
        <Lightformer form="rect" intensity={4} position={[0, 4, 3]} scale={[8, 2, 1]} />
        <Lightformer form="rect" intensity={1.6} position={[0, 0, 6]} scale={[10, 4, 1]} />
        <Lightformer form="rect" intensity={1.2} position={[-5, 1, 1]} rotation-y={Math.PI / 2} scale={[6, 2, 1]} />
        <Lightformer form="rect" intensity={1.0} color="#a9c3dc" position={[5, 0, -1]} rotation-y={-Math.PI / 2} scale={[6, 3, 1]} />
        <Lightformer form="ring" intensity={0.8} position={[0, -3, 4]} scale={3} />
      </Environment>
    </>
  )
}

export default function Experience({ interactive, selected, onReady }: { interactive: boolean; selected: string | null; onReady: () => void }) {
  const drag = useRef<{ x: number; y: number; id: number } | null>(null)
  return (
    <div
      className="fixed inset-0 z-0"
      style={{ touchAction: interactive ? 'pan-y' : 'auto', cursor: interactive ? 'grab' : 'default' }}
      onPointerDown={(e) => { if (!interactive) return; drag.current = { x: e.clientX, y: e.clientY, id: e.pointerId } }}
      onPointerMove={(e) => {
        const d = drag.current; if (!d || d.id !== e.pointerId) return
        stage.dragX += (e.clientX - d.x) * 0.008
        stage.dragY = Math.max(-0.8, Math.min(0.8, stage.dragY + (e.clientY - d.y) * (e.pointerType === 'touch' ? 0 : 0.006)))
        d.x = e.clientX; d.y = e.clientY
      }}
      onPointerUp={() => { drag.current = null }}
      onPointerCancel={() => { drag.current = null }}
    >
      <Canvas
        dpr={[1, 1.75]}
        camera={{ fov: 30, near: 0.05, far: 60, position: [0, 0.2, 4] }}
        gl={{ antialias: true, powerPreference: 'high-performance', alpha: false }}
        onCreated={({ gl }) => { gl.toneMapping = THREE.ACESFilmicToneMapping; gl.toneMappingExposure = 1.05; gl.setClearColor('#060708') }}
        style={{ pointerEvents: interactive ? 'auto' : 'none' }}
      >
        <Suspense fallback={null}>
          <Lights />
          <Device selected={selected} />
          <PocketProps />
          <DeskProps />
          <Ready onReady={onReady} />
        </Suspense>
        <Rig />
      </Canvas>
    </div>
  )
}

function Ready({ onReady }: { onReady: () => void }) {
  useEffect(() => { const t = setTimeout(onReady, 50); return () => clearTimeout(t) }, [onReady])
  return null
}

useGLTF.preload(MODEL)
