'use client'
import dynamic from 'next/dynamic'
import { useCallback, useEffect, useRef, useState } from 'react'
import { stage, type SectionId } from '@/lib/stage'
import { SPECS, PERF, PERF_BASIS, CONFIGS, FINISHES, PARTS, STATUS_LABEL, STATUS_NOTE, type Status } from '@/lib/spec'

const Experience = dynamic(() => import('./Experience'), { ssr: false })

const ORDER: SectionId[] = ['intro', 'reveal', 'perf', 'hw', 'pocket', 'desk', 'eng', 'config', 'specs', 'store']

/* ------------------------------ scroll driver ------------------------------ */
function useScrollDriver(onSection: (s: SectionId) => void) {
  useEffect(() => {
    let raf = 0, last: SectionId | null = null
    const tick = () => {
      const vh = window.innerHeight
      let active: SectionId = 'intro', prog = 0
      for (const id of ORDER) {
        const el = document.querySelector<HTMLElement>(`[data-stage="${id}"]`)
        if (!el) continue
        const r = el.getBoundingClientRect()
        if (r.top <= vh * 0.5 && r.bottom > vh * 0.5) {
          active = id
          const span = r.height - vh
          prog = span > 0 ? Math.min(1, Math.max(0, -r.top / span)) : Math.min(1, Math.max(0, (vh * 0.5 - r.top) / r.height))
          break
        }
      }
      stage.section = active; stage.p = prog
      if (active !== last) { last = active; onSection(active) }
      raf = requestAnimationFrame(tick)
    }
    raf = requestAnimationFrame(tick)
    return () => cancelAnimationFrame(raf)
  }, [onSection])
}

function useStep(id: SectionId, thresholds: number[]) {
  const [step, setStep] = useState(0)
  useEffect(() => {
    let raf = 0, s = -1
    const tick = () => {
      if (stage.section === id) {
        let n = 0
        thresholds.forEach((t, i) => { if (stage.p >= t) n = i })
        if (n !== s) { s = n; setStep(n) }
      }
      raf = requestAnimationFrame(tick)
    }
    raf = requestAnimationFrame(tick)
    return () => cancelAnimationFrame(raf)
  }, [id, thresholds])
  return step
}

function webglOK() {
  try {
    const c = document.createElement('canvas')
    return !!(c.getContext('webgl2') || c.getContext('webgl'))
  } catch { return false }
}

/* --------------------------------- bits ----------------------------------- */
function Badge({ s }: { s: Status }) {
  return <span className="chip" title={STATUS_NOTE[s]}><span className={`h-1.5 w-1.5 rounded-full dot-${s}`} />{STATUS_LABEL[s]}</span>
}

function Caption({ show, children, className = '' }: { show: boolean; children: React.ReactNode; className?: string }) {
  return (
    <div aria-hidden={!show} className={`transition-all duration-700 ease-out ${show ? 'opacity-100 translate-y-0' : 'pointer-events-none opacity-0 translate-y-6'} ${className}`}>
      {children}
    </div>
  )
}

const money = (n: number) => `$${n.toLocaleString('en-US')}`

/* -------------------------------- sections -------------------------------- */
function Nav() {
  const go = (id: string) => document.getElementById(id)?.scrollIntoView({ behavior: stage.reduced ? 'auto' : 'smooth' })
  return (
    <header className="fixed inset-x-0 top-0 z-40">
      <div className="mx-auto flex h-14 max-w-[1280px] items-center justify-between px-5 md:px-8">
        <button onClick={() => window.scrollTo({ top: 0, behavior: stage.reduced ? 'auto' : 'smooth' })} className="text-[15px] font-semibold tracking-[0.32em]">OSMIUM</button>
        <nav className="hidden items-center gap-7 text-[13px] text-[var(--color-dim)] md:flex">
          {[['Design', 'hardware'], ['Performance', 'performance'], ['Engineering', 'engineering'], ['Specs', 'specs']].map(([l, id]) => (
            <button key={id} onClick={() => go(id)} className="transition-colors hover:text-white">{l}</button>
          ))}
        </nav>
        <button onClick={() => go('store')} className="rounded-full bg-white px-4 py-1.5 text-[13px] font-medium text-black transition-transform hover:scale-[1.03]">Reserve</button>
      </div>
      <div className="pointer-events-none absolute inset-x-0 top-0 -z-10 h-20 bg-gradient-to-b from-[#060708] to-transparent" />
    </header>
  )
}

function Intro() {
  const step = useStep('intro', [0, 0.3, 0.86])
  return (
    <section data-stage="intro" className="span-intro relative">
      <div className="sticky-stage px-6 md:px-12">
        <Caption show={step === 0} className="absolute inset-x-0 top-24 text-center">
          <p className="eyebrow">Engineering preview · November 2026</p>
          <p className="mx-auto mt-4 max-w-md text-[15px] text-[var(--color-dim)]">Every part on this page comes from the Osmium V1 CAD model.</p>
        </Caption>
        <Caption show={step === 1} className="absolute inset-x-0 bottom-16 mx-auto max-w-xl px-6 text-center">
          <p className="display-m">Twenty parts. 190 millimetres.</p>
          <p className="lede mt-3">Display, frame, battery, mainboard, cooling and back plate close up into one shell.</p>
        </Caption>
        <Caption show={step === 2} className="absolute inset-x-0 bottom-10 text-center md:bottom-14">
          <h1 className="display-xl">OSMIUM</h1>
          <p className="lede mt-3">Your entire gaming world. Anywhere.</p>
        </Caption>
        <div className={`absolute inset-x-0 bottom-8 mx-auto flex flex-col items-center gap-2 text-[11px] tracking-[0.2em] text-[var(--color-faint)] transition-opacity ${step === 0 ? 'opacity-100' : 'opacity-0'}`}>
          SCROLL<span className="block h-8 w-px animate-pulse bg-[var(--color-faint)]" />
        </div>
      </div>
    </section>
  )
}

function Reveal() {
  const step = useStep('reveal', [0, 0.22])
  return (
    <section data-stage="reveal" className="span-reveal relative">
      <div className="sticky-stage mx-auto flex max-w-[1280px] items-start px-6 pt-24 md:items-center md:px-12 md:pt-0">
        <Caption show={step === 1} className="max-w-[520px]">
          <p className="eyebrow">Osmium V1</p>
          <h2 className="display-l mt-4">PC gaming.<br />Anywhere.</h2>
          <p className="lede mt-5">A full Windows-class PC with a 6-inch OLED, built to fit in a jacket pocket. It runs your Steam library natively. No streaming, no cloud.</p>
          <div className="pointer-events-auto mt-6 flex flex-wrap gap-2">
            {['6.0″ 120 Hz OLED', 'Intel Arc G3 Extreme', '190 × 84 × 19.5 mm', '375 g target'].map((x) => <span key={x} className="chip">{x}</span>)}
          </div>
        </Caption>
      </div>
    </section>
  )
}

function Perf() {
  const step = useStep('perf', [0, 0.22, 0.42, 0.64])
  const caps = [
    { k: 'Display', t: 'A 6-inch, 120 Hz OLED.', b: '1920 × 1080 at 367 pixels per inch, under 0.55 mm cover glass. Deep blacks for night scenes, fast response for shooters.', s: 'target' as Status },
    { k: 'Real games', t: 'Real PC games. Not streams.', b: 'Arc B390 graphics with 12 Xe3 cores. This scene is an original real-time environment made for this site, not captured gameplay.', s: 'verified' as Status },
    { k: 'Library', t: 'Your library, ready to play.', b: 'SteamOS with the Osmium Control plugin out of the box. A Windows 11 image is available if you need other launchers.', s: 'target' as Status },
    { k: 'Osmium Control', t: 'Adaptive power, per game.', b: 'Pick Battery, Balanced or Performance and Osmium sets the power limit, frame cap, fan and refresh rate together.', s: 'estimate' as Status },
  ]
  return (
    <section id="performance" data-stage="perf" className="span-perf relative">
      <div className="sticky-stage mx-auto flex max-w-[1280px] items-end px-4 pb-6 md:px-12 md:pb-12">
        <div className="relative w-full max-w-[440px]">
          {caps.map((c, i) => (
            <Caption key={c.k} show={step === i} className="glass absolute bottom-0 left-0 w-full rounded-2xl p-5 md:p-6">
              <div className="flex items-center justify-between"><p className="eyebrow">{c.k}</p><Badge s={c.s} /></div>
              <p className="mt-3 text-[22px] font-semibold leading-tight tracking-tight md:text-[26px]">{c.t}</p>
              <p className="mt-2 text-[14px] leading-relaxed text-[var(--color-dim)] md:text-[15px]">{c.b}</p>
              {i === 3 && <PowerDemo />}
            </Caption>
          ))}
        </div>
      </div>
    </section>
  )
}

function PowerDemo() {
  const [m, setM] = useState(-1)
  useEffect(() => () => { stage.qamOverride = -1 }, [])
  const modes = [['Battery', '8 W', '≈ 2.6 h'], ['Balanced', '12 W', '≈ 2.0 h'], ['Performance', '15 W', '≈ 1.6 h']]
  return (
    <div className="pointer-events-auto mt-4 grid grid-cols-3 gap-2">
      {modes.map(([n, w, h], i) => (
        <button key={n} onClick={() => { setM(i); stage.qamOverride = i }}
          className={`rounded-xl border px-3 py-2 text-left transition-colors ${m === i ? 'border-white bg-white text-black' : 'border-white/10 hover:border-white/30'}`}>
          <span className="block text-[13px] font-medium">{n}</span>
          <span className={`block font-mono text-[11px] ${m === i ? 'text-black/60' : 'text-[var(--color-dim)]'}`}>{w} · {h}</span>
        </button>
      ))}
      <p className="col-span-3 mt-1 text-[11px] text-[var(--color-faint)]">AAA battery life, modelled from the 36 Wh pack. Tap to preview on the screen.</p>
    </div>
  )
}

function Hardware() {
  const step = useStep('hw', [0, 0.31, 0.57, 0.81])
  const caps = [
    { t: 'Full-size controls.', b: 'TMR thumbsticks that don\'t drift, Hall-effect analog triggers, two back buttons, a gyro and dual haptic motors. The sticks sit in recessed wells so they don\'t catch in a pocket.' },
    { t: 'Heat goes up and out.', b: 'Air leaves through the top edge, away from your hands. Bumpers and triggers stay inside the profile. A 10 Gbps USB-C port sits up top for accessories.' },
    { t: 'One driver opens it.', b: 'Six T5 screws hold the bead-blasted aluminium back. Battery, SSD, fan and stick modules are all replaceable. The intake has a removable dust filter.' },
    { t: 'Ports where docks expect them.', b: 'USB4 at 40 Gbps on the bottom edge handles charging, DisplayPort 2.1 and docks. There is a real 3.5 mm headphone jack and stereo speakers either side.' },
  ]
  return (
    <section id="hardware" data-stage="hw" className="span-hw relative">
      <div className="sticky-stage mx-auto flex max-w-[1280px] items-start px-6 pt-20 md:items-center md:px-12 md:pt-0">
        <div className="relative w-full max-w-[420px]">
          {caps.map((c, i) => (
            <Caption key={i} show={step === i} className={i === 0 ? 'relative' : 'absolute inset-x-0 top-0'}>
              <p className="eyebrow">Hardware · {['Front', 'Top', 'Back', 'Bottom'][i]}</p>
              <h2 className="display-m mt-3">{c.t}</h2>
              <p className="mt-3 text-[15px] leading-relaxed text-[var(--color-dim)] md:text-[17px]">{c.b}</p>
            </Caption>
          ))}
        </div>
        <p className="absolute bottom-6 left-1/2 -translate-x-1/2 font-mono text-[11px] tracking-[0.16em] text-[var(--color-faint)]">DRAG TO ROTATE</p>
      </div>
    </section>
  )
}

function Pocket() {
  const step = useStep('pocket', [0, 0.25])
  return (
    <section data-stage="pocket" className="span-pocket relative">
      <div className="sticky-stage mx-auto flex max-w-[1280px] items-start px-6 pt-20 md:items-center md:px-12 md:pt-0">
        <Caption show={step === 1} className="max-w-[400px]">
          <p className="eyebrow">Pocketability · to scale</p>
          <h2 className="display-m mt-3">Built for real pockets.</h2>
          <p className="mt-3 text-[15px] leading-relaxed text-[var(--color-dim)] md:text-[17px]">190 × 84 mm, 19.5 mm at the grips and 17.5 mm in the middle. That's 27 mm longer than a 6.9-inch phone, with nothing sticking out.</p>
          <ul className="mt-5 space-y-2 text-[14px] text-[var(--color-dim)]">
            <li>✓ Jacket, cargo and most back pockets</li>
            <li>◦ Front jeans pockets: being checked in a 30-garment fit survey</li>
          </ul>
          <div className="mt-5 flex gap-2"><Badge s="target" /></div>
        </Caption>
      </div>
    </section>
  )
}

function Desk() {
  const step = useStep('desk', [0, 0.45])
  return (
    <section data-stage="desk" className="span-desk relative">
      <div className="sticky-stage mx-auto flex max-w-[1280px] flex-col items-center px-6 pt-20 text-center md:pt-24">
        <Caption show={step === 0}>
          <p className="eyebrow">Desktop mode</p>
          <h2 className="display-m mt-3">Drop it in the dock.</h2>
        </Caption>
        <Caption show={step === 1} className="absolute top-20 md:top-24">
          <p className="eyebrow">Desktop mode</p>
          <h2 className="display-m mt-3">Now it's your desktop.</h2>
          <p className="mx-auto mt-3 max-w-xl text-[15px] text-[var(--color-dim)] md:text-[17px]">One USB4 cable carries DisplayPort 2.1, power and peripherals. Docked mode raises the power limit to 20 W.</p>
        </Caption>
      </div>
    </section>
  )
}

function Engineering({ selected, setSelected }: { selected: string | null; setSelected: (s: string | null) => void }) {
  const part = PARTS.find((p) => p.id === selected)
  return (
    <section id="engineering" data-stage="eng" className="span-eng relative">
      <div className="sticky-stage mx-auto flex max-w-[1280px] flex-col justify-between px-4 pb-6 pt-20 md:flex-row md:items-center md:px-12 md:py-0">
        <div className="max-w-[400px]">
          <p className="eyebrow">Inside Osmium</p>
          <h2 className="display-m mt-3">Every part has a job.</h2>
          <p className="mt-3 hidden text-[16px] text-[var(--color-dim)] md:block">Select a component in the model or the list below.</p>
          <div className="pointer-events-auto mt-4 flex flex-wrap gap-1.5 md:mt-6">
            {PARTS.map((p) => (
              <button key={p.id} onClick={() => setSelected(selected === p.id ? null : p.id)}
                className={`rounded-full border px-3 py-1.5 text-[12px] transition-colors md:text-[13px] ${selected === p.id ? 'border-white bg-white text-black' : 'border-white/12 text-[var(--color-dim)] hover:border-white/35 hover:text-white'}`}>
                {p.name}
              </button>
            ))}
          </div>
        </div>
        <div className="w-full md:w-[340px]">
          {part ? (
            <div key={part.id} className="glass pointer-events-auto rounded-2xl p-5">
              <div className="flex items-center justify-between"><p className="eyebrow">{part.name}</p><Badge s={part.status} /></div>
              <p className="mt-3 font-mono text-[13px] text-[var(--color-steel)]">{part.spec}</p>
              <p className="mt-3 text-[14px] leading-relaxed text-[var(--color-dim)]">{part.detail}</p>
              <button onClick={() => setSelected(null)} className="mt-4 text-[12px] text-[var(--color-faint)] hover:text-white">Close</button>
            </div>
          ) : (
            <p className="hidden text-right font-mono text-[11px] tracking-[0.16em] text-[var(--color-faint)] md:block">CLICK A COMPONENT · DRAG TO ROTATE</p>
          )}
        </div>
      </div>
    </section>
  )
}

function Configurator({ cfg, setCfg, finish, setFinish }: { cfg: string; setCfg: (s: string) => void; finish: string; setFinish: (s: string) => void }) {
  const c = CONFIGS.find((x) => x.id === cfg)!
  const extreme = c.chip.includes('Extreme')
  const pickChip = (x: boolean) => setCfg(x ? (c.memory === '32 GB' ? 'g3x-32-1t' : 'g3x-24-1t') : 'g3-24-512')
  const pickMem = (m: string) => { if (!extreme && m === '32 GB') return; setCfg(m === '32 GB' ? 'g3x-32-1t' : extreme ? 'g3x-24-1t' : 'g3-24-512') }
  const Opt = ({ on, disabled, onClick, title, sub }: { on: boolean; disabled?: boolean; onClick: () => void; title: string; sub: string }) => (
    <button disabled={disabled} onClick={onClick}
      className={`flex w-full items-center justify-between rounded-xl border px-4 py-3 text-left transition-colors ${on ? 'border-white' : 'border-white/10 hover:border-white/30'} ${disabled ? 'cursor-not-allowed opacity-35 hover:border-white/10' : ''}`}>
      <span className="text-[15px] font-medium">{title}</span><span className="text-[12px] text-[var(--color-dim)]">{sub}</span>
    </button>
  )
  return (
    <section data-stage="config" className="relative min-h-screen py-24">
      <div className="mx-auto flex max-w-[1280px] justify-end px-4 md:px-12">
        <div className="pointer-events-auto mt-[38vh] w-full max-w-[460px] md:mt-0">
          <p className="eyebrow">Configure</p>
          <h2 className="display-m mt-3">Choose your Osmium.</h2>
          <p className="mt-2 text-[14px] text-[var(--color-dim)]">Only combinations the V1 mainboard supports are offered.</p>

          <p className="mt-7 text-[13px] text-[var(--color-dim)]">Processor</p>
          <div className="mt-2 space-y-2">
            <Opt on={!extreme} onClick={() => pickChip(false)} title="Intel Arc G3" sub="10 Xe3 cores" />
            <Opt on={extreme} onClick={() => pickChip(true)} title="Intel Arc G3 Extreme" sub="12 Xe3 cores" />
          </div>
          <p className="mt-5 text-[13px] text-[var(--color-dim)]">Memory · LPDDR5X-8533</p>
          <div className="mt-2 grid grid-cols-2 gap-2">
            <Opt on={c.memory === '24 GB'} onClick={() => pickMem('24 GB')} title="24 GB" sub="" />
            <Opt on={c.memory === '32 GB'} disabled={!extreme} onClick={() => pickMem('32 GB')} title="32 GB" sub={extreme ? '+$200' : 'Extreme only'} />
          </div>
          <p className="mt-5 text-[13px] text-[var(--color-dim)]">Storage · M.2 2230, replaceable</p>
          <div className="mt-2 grid grid-cols-2 gap-2">
            <Opt on={c.storage === '512 GB'} disabled={extreme} onClick={() => setCfg('g3-24-512')} title="512 GB" sub={extreme ? 'Arc G3 only' : ''} />
            <Opt on={c.storage === '1 TB'} disabled={!extreme} onClick={() => setCfg('g3x-24-1t')} title="1 TB" sub={!extreme ? 'Extreme only' : ''} />
          </div>
          <p className="mt-5 text-[13px] text-[var(--color-dim)]">Finish · anodised back (finish options under evaluation)</p>
          <div className="mt-2 flex gap-3">
            {FINISHES.map((f) => (
              <button key={f.id} onClick={() => setFinish(f.id)} aria-label={f.name}
                className={`flex items-center gap-2 rounded-full border py-1.5 pl-1.5 pr-4 text-[13px] ${finish === f.id ? 'border-white' : 'border-white/10'}`}>
                <span className="h-6 w-6 rounded-full border border-white/20" style={{ background: `linear-gradient(135deg, ${f.back}, ${f.frame})` }} />{f.name}
              </button>
            ))}
          </div>
          <div className="mt-7 flex items-end justify-between border-t border-white/10 pt-5">
            <div><p className="text-[13px] text-[var(--color-dim)]">Estimated price</p><p className="text-[34px] font-semibold tracking-tight">{money(c.price)}</p></div>
            <Badge s="estimate" />
          </div>
        </div>
      </div>
    </section>
  )
}

function Specs() {
  return (
    <section id="specs" data-stage="specs" className="relative bg-[var(--color-void)] py-24 md:py-32">
      <div className="mx-auto max-w-[1100px] px-5 md:px-12">
        <p className="eyebrow">Specifications</p>
        <h2 className="display-l mt-3">The numbers, labelled honestly.</h2>
        <div className="mt-6 grid gap-3 md:grid-cols-3">
          {(['verified', 'target', 'estimate'] as Status[]).map((s) => (
            <div key={s} className="rounded-xl border border-white/8 p-4"><Badge s={s} /><p className="mt-2 text-[13px] text-[var(--color-dim)]">{STATUS_NOTE[s]}</p></div>
          ))}
        </div>
        <div className="mt-12 divide-y divide-white/8 border-y border-white/8">
          {SPECS.map((g) => (
            <div key={g.title} className="grid gap-4 py-7 md:grid-cols-[220px_1fr]">
              <h3 className="text-[17px] font-semibold">{g.title}</h3>
              <dl className="space-y-4">
                {g.rows.map((r) => (
                  <div key={r.label} className="grid gap-1 md:grid-cols-[220px_1fr_auto] md:items-baseline md:gap-4">
                    <dt className="text-[14px] text-[var(--color-dim)]">{r.label}</dt>
                    <dd className="text-[15px]">{r.value}{r.note && <span className="mt-1 block text-[12px] text-[var(--color-faint)]">{r.note}</span>}</dd>
                    <dd><Badge s={r.status} /></dd>
                  </div>
                ))}
              </dl>
            </div>
          ))}
        </div>

        <div className="mt-16">
          <div className="flex flex-wrap items-baseline justify-between gap-3">
            <h3 className="display-m">Expected frame rates</h3><Badge s="estimate" />
          </div>
          <p className="mt-3 max-w-2xl text-[14px] text-[var(--color-dim)]">Average fps, 1080p output upscaled from 540–720p, no frame generation. No Osmium hardware exists yet, so these are models, not benchmarks.</p>
          <div className="mt-6 overflow-x-auto">
            <table className="w-full min-w-[560px] text-left text-[14px]">
              <thead className="text-[12px] text-[var(--color-faint)]"><tr><th className="py-2 font-normal">Game</th><th className="font-normal">Settings</th><th className="font-normal">12 W</th><th className="font-normal">15 W</th><th className="font-normal">Basis</th></tr></thead>
              <tbody>
                {PERF.map((r) => (
                  <tr key={r.game} className="border-t border-white/8">
                    <td className="py-3">{r.game}</td><td className="text-[var(--color-dim)]">{r.settings}</td>
                    <td className="font-mono">≈{r.w12}</td><td className="font-mono">≈{r.w15}</td>
                    <td className="text-[12px] text-[var(--color-dim)]" title={PERF_BASIS[r.basis]}>{PERF_BASIS[r.basis]}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </section>
  )
}

function Store({ cfg, finish }: { cfg: string; finish: string }) {
  const c = CONFIGS.find((x) => x.id === cfg)!
  const f = FINISHES.find((x) => x.id === finish)!
  const [modal, setModal] = useState(false)
  return (
    <section id="store" data-stage="store" className="relative min-h-screen pb-10 pt-24">
      <div className="mx-auto flex max-w-[1280px] justify-end px-4 md:px-12">
        <div className="pointer-events-auto mt-[36vh] w-full max-w-[460px] md:mt-[8vh]">
          <p className="eyebrow">Osmium V1</p>
          <h2 className="display-l mt-3">Yours, soon.</h2>
          <div className="glass mt-7 rounded-2xl p-6">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-[17px] font-semibold">Osmium · {f.name}</p>
                <p className="mt-1 text-[14px] text-[var(--color-dim)]">{c.chip} · {c.memory} · {c.storage}</p>
              </div>
              <p className="text-[24px] font-semibold">{money(c.price)}</p>
            </div>
            <ul className="mt-5 space-y-1.5 border-t border-white/8 pt-4 text-[13px] text-[var(--color-dim)]">
              <li>In the box: Osmium, 65 W USB-C charger, braided USB-C cable, sleeve, T5 driver</li>
              <li>SteamOS with Osmium Control installed</li>
              <li>Replaceable battery, SSD, fan and stick modules</li>
            </ul>
            <button onClick={() => setModal(true)} className="mt-6 w-full rounded-full bg-white py-3 text-[15px] font-medium text-black transition-transform hover:scale-[1.01]">Reserve</button>
            <p className="mt-3 text-center text-[12px] text-[var(--color-faint)]">Reservations are not open. Price is an estimate.</p>
          </div>
          <p className="mt-6 text-[12px] leading-relaxed text-[var(--color-faint)]">Osmium is in engineering. Dimensions, weight, battery life and performance are design targets or estimates until prototypes are measured. Intel and Arc are trademarks of Intel Corporation; Steam and SteamOS are trademarks of Valve Corporation. Osmium is not affiliated with either.</p>
        </div>
      </div>
      {modal && (
        <div role="dialog" aria-modal="true" aria-labelledby="rsv" className="pointer-events-auto fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-6" onClick={() => setModal(false)}>
          <div className="glass max-w-sm rounded-2xl p-6" onClick={(e) => e.stopPropagation()}>
            <p id="rsv" className="text-[20px] font-semibold">Reservations aren't open yet.</p>
            <p className="mt-3 text-[14px] leading-relaxed text-[var(--color-dim)]">Osmium is still in engineering. This page takes no payments and collects no personal data. Reservations will open after the first prototypes are measured.</p>
            <button autoFocus onClick={() => setModal(false)} className="mt-5 w-full rounded-full border border-white/20 py-2.5 text-[14px] hover:border-white/50">Got it</button>
          </div>
        </div>
      )}
      <footer className="mx-auto mt-24 flex max-w-[1280px] flex-wrap items-center justify-between gap-3 px-4 text-[12px] text-[var(--color-faint)] md:px-12">
        <span className="tracking-[0.3em] text-[var(--color-dim)]">OSMIUM</span><span>A Proxima 3D project · Engineering preview, November 2026</span>
      </footer>
    </section>
  )
}

/* -------------------------------- fallback -------------------------------- */
const FALLBACK_IMG: Partial<Record<SectionId, string>> = {
  intro: 'renders/04_exploded.png', reveal: 'renders/01_hero_front_3q.png', perf: 'renders/01_hero_front_3q.png',
  hw: 'renders/03_rear_3q.png', pocket: 'renders/07_size_vs_phone.png', desk: 'renders/01_hero_front_3q.png',
  eng: 'renders/05_internal_layout.png', config: 'renders/03_rear_3q.png', store: 'renders/01_hero_front_3q.png',
}
function Fallback({ section }: { section: SectionId }) {
  const src = FALLBACK_IMG[section]
  return (
    <div className="fixed inset-0 z-0 flex items-center justify-center bg-[var(--color-void)]">
      {src && <img src={src} alt="Osmium rendering" className="max-h-[70vh] max-w-[90vw] object-contain opacity-90 md:translate-x-[15%]" />}
    </div>
  )
}

/* ---------------------------------- site ---------------------------------- */
export default function Site() {
  const [section, setSection] = useState<SectionId>('intro')
  const [gl, setGl] = useState<boolean | null>(null)
  const [ready, setReady] = useState(false)
  const [selected, setSelectedState] = useState<string | null>(null)
  const [cfg, setCfg] = useState('g3x-24-1t')
  const [finish, setFinishState] = useState('osmium')
  const onSection = useCallback((s: SectionId) => setSection(s), [])
  useScrollDriver(onSection)

  const setSelected = useCallback((s: string | null) => { stage.selected = s; setSelectedState(s) }, [])
  const setFinish = (f: string) => { stage.finish = f; setFinishState(f) }

  useEffect(() => {
    setGl(webglOK())
    const mq = window.matchMedia('(prefers-reduced-motion: reduce)')
    stage.snap = new URLSearchParams(location.search).has('snap')
    const upd = () => { stage.reduced = mq.matches }
    upd(); mq.addEventListener('change', upd)
    const sel = (e: Event) => setSelected((e as CustomEvent).detail)
    window.addEventListener('osmium:select', sel)
    const t = setTimeout(() => setReady(true), 8000) // never trap the user behind the loader
    return () => { mq.removeEventListener('change', upd); window.removeEventListener('osmium:select', sel); clearTimeout(t) }
  }, [setSelected])

  useEffect(() => { if (section !== 'eng' && selected) setSelected(null) }, [section, selected, setSelected])

  // GSAP reveals for static blocks
  const root = useRef<HTMLDivElement>(null)
  useEffect(() => {
    if (!root.current) return
    let kill = () => {}
    ;(async () => {
      const { gsap } = await import('gsap')
      const { ScrollTrigger } = await import('gsap/ScrollTrigger')
      gsap.registerPlugin(ScrollTrigger)
      if (stage.reduced) return
      const ctx = gsap.context(() => {
        gsap.utils.toArray<HTMLElement>('[data-stage="specs"] .grid, [data-stage="specs"] table').forEach((el) => {
          gsap.from(el, { opacity: 0, y: 28, duration: 0.9, ease: 'power3.out', scrollTrigger: { trigger: el, start: 'top 88%' } })
        })
      }, root)
      kill = () => ctx.revert()
    })()
    return () => kill()
  }, [])

  const interactive = section === 'hw' || section === 'eng'
  const onReady = useCallback(() => setReady(true), [])

  return (
    <div ref={root}>
      {gl === true && <Experience interactive={interactive} selected={selected} onReady={onReady} />}
      {gl === false && <Fallback section={section} />}
      <div className={`fixed inset-0 z-50 flex items-center justify-center bg-[var(--color-void)] transition-opacity duration-700 ${ready || gl === false ? 'pointer-events-none opacity-0' : 'opacity-100'}`}>
        <div className="text-center"><p className="text-[15px] font-semibold tracking-[0.5em]">OSMIUM</p><div className="mx-auto mt-4 h-px w-24 overflow-hidden bg-white/10"><div className="h-full w-1/2 animate-pulse bg-white/70" /></div></div>
      </div>
      <Nav />
      <main className="pointer-events-none relative z-10">
        <Intro /><Reveal /><Perf /><Hardware /><Pocket /><Desk />
        <Engineering selected={selected} setSelected={setSelected} />
        <Configurator cfg={cfg} setCfg={setCfg} finish={finish} setFinish={setFinish} />
        <div className="pointer-events-auto"><Specs /></div>
        <Store cfg={cfg} finish={finish} />
      </main>
    </div>
  )
}
