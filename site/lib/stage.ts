// Shared mutable stage state (read every frame by the 3D scene, written by scroll/UI).
// Plain object on purpose: no React re-renders on scroll.

export type SectionId =
  | 'intro' | 'reveal' | 'perf' | 'hw' | 'pocket' | 'desk' | 'eng' | 'config' | 'specs' | 'store'

export type ScreenMode = 'off' | 'boot' | 'game' | 'library' | 'qam' | 'docked'

export const stage = {
  section: 'intro' as SectionId,
  p: 0,
  reduced: false,
  snap: false, // test hook: ?snap disables easing so screenshots show settled poses
  dragX: 0,
  dragY: 0,
  selected: null as string | null,
  hovered: null as string | null,
  finish: 'osmium',
  qamOverride: -1, // user-picked power mode on the QAM demo
}

export type Vec3 = [number, number, number]
export type Pose = {
  explode: number
  rot: Vec3
  pos: Vec3
  dist: number          // camera distance from look target (before aspect fit)
  camDir: Vec3          // unit-ish direction from target to camera
  look: Vec3
  screen: ScreenMode
  screenP: number
  qam: number           // 0 battery, 1 balanced, 2 performance
  pocket: number
  desk: number
  monitorOn: number
  presence: number
  fitScreen: boolean
  side: 'left' | 'right' | 'center'  // where the DOM copy sits; device shifts the other way
  hwPhase: 'front' | 'top' | 'back' | 'bottom' | null
}

const clamp = (v: number, a = 0, b = 1) => Math.min(b, Math.max(a, v))
export const smooth = (a: number, b: number, v: number) => {
  const t = clamp((v - a) / (b - a))
  return t * t * (3 - 2 * t)
}
const lerp = (a: number, b: number, t: number) => a + (b - a) * t
const lerp3 = (a: Vec3, b: Vec3, t: number): Vec3 => [lerp(a[0], b[0], t), lerp(a[1], b[1], t), lerp(a[2], b[2], t)]

const base: Pose = {
  explode: 0, rot: [0, 0, 0], pos: [0, 0, 0], dist: 3, camDir: [0, 0.04, 1], look: [0, 0, 0],
  screen: 'off', screenP: 0, qam: 1, pocket: 0, desk: 0, monitorOn: 0, presence: 1, fitScreen: false,
  side: 'center', hwPhase: null,
}

function keyframes(p: number, keys: { at: number; rot: Vec3 }[]): Vec3 {
  if (p <= keys[0].at) return keys[0].rot
  for (let i = 0; i < keys.length - 1; i++) {
    const a = keys[i], b = keys[i + 1]
    if (p <= b.at) return lerp3(a.rot, b.rot, smooth(a.at, b.at, p))
  }
  return keys[keys.length - 1].rot
}

export function getPose(section: SectionId, p: number): Pose {
  switch (section) {
    case 'intro': {
      const e = smooth(0.12, 0.88, p)
      return { ...base, explode: 1 - e, rot: lerp3([0.62, -0.82, 0.04], [0.2, -0.36, 0], e), dist: lerp(3.9, 3.3, e), pos: [0, 0.14 * e, 0],
        screen: p > 0.9 ? 'boot' : 'off', screenP: smooth(0.9, 1, p) }
    }
    case 'reveal': {
      const e = smooth(0, 1, p)
      return { ...base, rot: lerp3([0.2, -0.36, 0], [0.1, 0.46, -0.03], e), dist: lerp(3.3, 4.3, e), pos: lerp3([0, 0.14, 0], [0, 0, 0], e),
        screen: 'game', screenP: 1, side: e > 0.25 ? 'left' : 'center' }
    }
    case 'perf': {
      const z = smooth(0, 0.22, p)
      let screen: ScreenMode = 'game'
      if (p > 0.42) screen = 'library'
      if (p > 0.64) screen = 'qam'
      const qam = p < 0.76 ? 0 : p < 0.88 ? 1 : 2
      return { ...base, rot: lerp3([0.1, 0.46, -0.03], [0, 0, 0], z), dist: lerp(4.3, 1.0, z), fitScreen: z > 0.5,
        screen, screenP: 1, qam, side: 'left' }
    }
    case 'hw': {
      const rot = keyframes(p, [
        { at: 0.04, rot: [0.28, -0.55, 0] },
        { at: 0.26, rot: [0.28, -0.55, 0] },
        { at: 0.36, rot: [1.18, 0.22, 0] },
        { at: 0.52, rot: [1.18, 0.22, 0] },
        { at: 0.62, rot: [0.22, Math.PI + 0.55, 0] },
        { at: 0.76, rot: [0.22, Math.PI + 0.55, 0] },
        { at: 0.86, rot: [-1.15, 0.12, 0] },
        { at: 1.0, rot: [-1.15, 0.12, 0] },
      ])
      const hwPhase = p < 0.31 ? 'front' : p < 0.57 ? 'top' : p < 0.81 ? 'back' : 'bottom'
      return { ...base, rot, dist: 4.5, screen: 'game', screenP: 1, side: 'left', hwPhase }
    }
    case 'pocket': {
      const e = smooth(0.02, 0.3, p)
      return { ...base, rot: [0, 0, 0], pos: lerp3([0, 0, 0], [-0.4, 0.42, 0], e), dist: lerp(4.5, 6.2, e),
        look: lerp3([0, 0, 0], [-0.15, -0.2, 0], e), pocket: e, screen: 'library', screenP: 1, side: 'right' }
    }
    case 'desk': {
      const d = smooth(0.04, 0.42, p)
      const on = smooth(0.42, 0.6, p)
      return { ...base, rot: lerp3([0.05, -0.2, 0], [-0.22, -0.18, 0], d), pos: lerp3([0, 0, 0], [2.6, -0.02, 0.38], d),
        dist: lerp(4.2, 11.5, d), camDir: [0.12, 0.16, 1], look: lerp3([0, 0, 0], [0.5, 1.55, -0.4], d), desk: d, monitorOn: on,
        screen: on > 0.5 ? 'docked' : 'game', screenP: 1, side: 'center' }
    }
    case 'eng': {
      const e = smooth(0, 0.25, p)
      return { ...base, explode: e, rot: [0.45, -0.62, 0], dist: 5.4, screen: 'game', screenP: 1, side: 'left' }
    }
    case 'config':
      return { ...base, rot: [0.14, -0.55 + p * 1.1, 0], dist: 4.5, screen: 'library', screenP: 1, side: 'right' }
    case 'specs':
      return { ...base, rot: [0.14, 0.55, 0], dist: 4.5, presence: 0, screen: 'library', screenP: 1, side: 'right' }
    case 'store':
      return { ...base, rot: [0.1, 0.42, -0.03], dist: 4.5, screen: 'game', screenP: 1, side: 'right' }
  }
}
