// Procedural screen content: an original real-time landscape "game", the
// SteamOS-style library, the Osmium Control quick-access panel, and the docked
// desktop. Nothing here is captured gameplay or third-party art.
import type { ScreenMode } from './stage'

export const SW = 1280, SH = 720

const TITLES = [
  { name: 'Ridgeline', hue: 28 }, { name: 'Saltmarsh', hue: 190 }, { name: 'Low Orbit', hue: 230 },
  { name: 'Copperfield', hue: 14 }, { name: 'Night Ferry', hue: 260 }, { name: 'Kestrel', hue: 120 },
  { name: 'Glasswork', hue: 170 }, { name: 'Overpass', hue: 340 },
]

function ridge(x: number, seed: number, amp: number) {
  return Math.sin(x * 0.0021 + seed) * amp * 0.55 + Math.sin(x * 0.0057 + seed * 2.3) * amp * 0.3 + Math.sin(x * 0.013 + seed * 5.1) * amp * 0.15
}

export function drawLandscape(c: CanvasRenderingContext2D, t: number, w = SW, h = SH, ox = 0, oy = 0) {
  c.save(); c.translate(ox, oy)
  c.beginPath(); c.rect(0, 0, w, h); c.clip()
  const sky = c.createLinearGradient(0, 0, 0, h * 0.7)
  sky.addColorStop(0, '#2c3d5a'); sky.addColorStop(0.55, '#c9876a'); sky.addColorStop(1, '#f2c48d')
  c.fillStyle = sky; c.fillRect(0, 0, w, h)
  // sun
  const sx = w * 0.68, sy = h * 0.5
  const g = c.createRadialGradient(sx, sy, 0, sx, sy, h * 0.45)
  g.addColorStop(0, 'rgba(255,236,200,0.95)'); g.addColorStop(0.08, 'rgba(255,220,170,0.7)'); g.addColorStop(1, 'rgba(255,200,150,0)')
  c.fillStyle = g; c.fillRect(0, 0, w, h)
  // clouds
  c.fillStyle = 'rgba(255,230,210,0.18)'
  for (let i = 0; i < 6; i++) {
    const cx = ((i * 260 + t * 6) % (w + 400)) - 200, cy = h * (0.16 + (i % 3) * 0.07)
    c.beginPath(); c.ellipse(cx, cy, 160, 14, 0, 0, Math.PI * 2); c.fill()
  }
  const layers = [
    { y: 0.5, amp: 70, col: '#9c6f6a', sp: 4, seed: 1 },
    { y: 0.58, amp: 80, col: '#6c4f5a', sp: 9, seed: 4 },
    { y: 0.67, amp: 60, col: '#3e3443', sp: 18, seed: 7 },
    { y: 0.78, amp: 45, col: '#1f1c25', sp: 34, seed: 11 },
  ]
  for (const L of layers) {
    c.fillStyle = L.col; c.beginPath(); c.moveTo(0, h)
    const s = (t * L.sp) / (w / SW)
    for (let x = 0; x <= w; x += 8) c.lineTo(x, h * L.y - ridge(x / (w / SW) + s, L.seed, L.amp) * (h / SH))
    c.lineTo(w, h); c.fill()
    // haze between layers
    const hz = c.createLinearGradient(0, h * (L.y - 0.1), 0, h)
    hz.addColorStop(0, 'rgba(242,196,141,0)'); hz.addColorStop(1, 'rgba(242,196,141,0.10)')
    c.fillStyle = hz; c.fillRect(0, h * (L.y - 0.1), w, h)
  }
  // foreground trees
  c.fillStyle = '#0f0e13'
  for (let i = 0; i < 14; i++) {
    const tx = ((i * 137 - t * 60) % (w + 200) + w + 200) % (w + 200) - 100
    const th = (90 + (i * 53) % 70) * (h / SH), base = h * 0.95
    c.beginPath(); c.moveTo(tx, base - th); c.lineTo(tx - th * 0.22, base); c.lineTo(tx + th * 0.22, base); c.fill()
  }
  c.fillRect(0, h * 0.94, w, h * 0.06)
  c.restore()
}

function pill(c: CanvasRenderingContext2D, x: number, y: number, w: number, h: number, r: number) {
  c.beginPath(); c.roundRect(x, y, w, h, r)
}

function hud(c: CanvasRenderingContext2D) {
  c.font = '500 20px system-ui, sans-serif'; c.fillStyle = 'rgba(255,255,255,0.85)'
  c.fillText('Reach the ridge before dark', 48, 60)
  c.fillStyle = 'rgba(255,255,255,0.45)'; c.font = '16px system-ui, sans-serif'
  c.fillText('Ridgeline  ·  original demo scene', 48, 86)
  c.fillStyle = 'rgba(0,0,0,0.35)'; pill(c, SW - 230, 36, 184, 36, 18); c.fill()
  c.fillStyle = '#e9edf2'; c.font = '500 15px ui-monospace, monospace'; c.fillText('BALANCED · 12 W', SW - 210, 59)
}

function library(c: CanvasRenderingContext2D, t: number) {
  c.fillStyle = '#0d0f12'; c.fillRect(0, 0, SW, SH)
  const hero = c.createLinearGradient(0, 0, SW, 300)
  hero.addColorStop(0, '#1d2733'); hero.addColorStop(1, '#0d0f12'); c.fillStyle = hero; c.fillRect(0, 0, SW, 320)
  drawLandscape(c, t, 520, 250, SW - 580, 40)
  c.fillStyle = '#fff'; c.font = '600 44px system-ui, sans-serif'; c.fillText('Ridgeline', 56, 140)
  c.fillStyle = 'rgba(255,255,255,0.55)'; c.font = '18px system-ui, sans-serif'; c.fillText('Continue · last played 2 hours ago', 56, 176)
  c.fillStyle = '#e9edf2'; pill(c, 56, 206, 150, 48, 24); c.fill()
  c.fillStyle = '#0d0f12'; c.font = '600 18px system-ui, sans-serif'; c.fillText('Play', 110, 237)
  c.fillStyle = 'rgba(255,255,255,0.75)'; c.font = '600 20px system-ui, sans-serif'; c.fillText('Library', 56, 368)
  const sel = Math.floor(t / 1.6) % 6
  for (let i = 0; i < 6; i++) {
    const T = TITLES[i], x = 56 + i * 196, y = 392, w = 176, h = 236
    const gr = c.createLinearGradient(x, y, x + w, y + h)
    gr.addColorStop(0, `hsl(${T.hue} 45% 42%)`); gr.addColorStop(1, `hsl(${(T.hue + 40) % 360} 40% 14%)`)
    c.fillStyle = gr; pill(c, x, y, w, h, 14); c.fill()
    c.fillStyle = 'rgba(255,255,255,0.12)'
    c.beginPath(); c.arc(x + w * 0.7, y + h * 0.35, 38, 0, Math.PI * 2); c.fill()
    c.fillStyle = 'rgba(0,0,0,0.25)'; c.beginPath(); c.moveTo(x, y + h * 0.75); c.lineTo(x + w * 0.5, y + h * 0.5); c.lineTo(x + w, y + h * 0.72); c.lineTo(x + w, y + h); c.lineTo(x, y + h); c.fill()
    c.fillStyle = '#fff'; c.font = '600 19px system-ui, sans-serif'; c.fillText(T.name, x + 14, y + h - 18)
    if (i === sel) { c.strokeStyle = '#e9edf2'; c.lineWidth = 4; pill(c, x - 4, y - 4, w + 8, h + 8, 17); c.stroke() }
  }
  c.fillStyle = 'rgba(255,255,255,0.45)'; c.font = '15px ui-monospace, monospace'
  c.fillText('Ⓐ SELECT    Ⓑ BACK    ☰ OSMIUM CONTROL', 56, SH - 34)
  c.textAlign = 'right'; c.fillText('Wi-Fi 7   ▮▮▮▯ 74%', SW - 56, SH - 34); c.textAlign = 'left'
}

const MODES = [
  { name: 'Battery', w: 8, est: '≈ 2.6 h' },
  { name: 'Balanced', w: 12, est: '≈ 2.0 h' },
  { name: 'Performance', w: 15, est: '≈ 1.6 h' },
]

function qam(c: CanvasRenderingContext2D, t: number, mode: number) {
  drawLandscape(c, t)
  c.fillStyle = 'rgba(6,7,9,0.55)'; c.fillRect(0, 0, SW, SH)
  const x = SW - 470, w = 440
  c.fillStyle = 'rgba(16,18,22,0.96)'; pill(c, x, 24, w, SH - 48, 22); c.fill()
  c.fillStyle = '#fff'; c.font = '600 24px system-ui, sans-serif'; c.fillText('Osmium Control', x + 28, 72)
  c.fillStyle = 'rgba(255,255,255,0.45)'; c.font = '14px ui-monospace, monospace'; c.fillText('PER-GAME PROFILE · RIDGELINE', x + 28, 98)
  c.fillStyle = 'rgba(255,255,255,0.7)'; c.font = '500 16px system-ui, sans-serif'; c.fillText('Power mode', x + 28, 140)
  for (let i = 0; i < 3; i++) {
    const bx = x + 28 + i * 132, on = i === mode
    c.fillStyle = on ? '#e9edf2' : 'rgba(255,255,255,0.07)'; pill(c, bx, 154, 122, 64, 14); c.fill()
    c.fillStyle = on ? '#0d0f12' : 'rgba(255,255,255,0.8)'; c.font = '600 16px system-ui, sans-serif'; c.fillText(MODES[i].name, bx + 14, 182)
    c.font = '14px ui-monospace, monospace'; c.fillText(`${MODES[i].w} W`, bx + 14, 204)
  }
  const m = MODES[mode]
  const rows: [string, string][] = [
    ['Processor power limit', `${m.w} W`], ['Frame limit', mode === 0 ? '40 fps' : '60 fps'],
    ['Fan profile', mode === 2 ? 'Performance' : 'Quiet'], ['Refresh rate', mode === 0 ? '80 Hz' : '120 Hz'],
  ]
  rows.forEach(([k, v], i) => {
    const y = 262 + i * 54
    c.fillStyle = 'rgba(255,255,255,0.06)'; c.fillRect(x + 28, y + 22, w - 56, 1)
    c.fillStyle = 'rgba(255,255,255,0.75)'; c.font = '17px system-ui, sans-serif'; c.fillText(k, x + 28, y + 6)
    c.textAlign = 'right'; c.fillStyle = '#fff'; c.font = '500 17px ui-monospace, monospace'; c.fillText(v, x + w - 28, y + 6); c.textAlign = 'left'
  })
  c.fillStyle = 'rgba(255,255,255,0.06)'; pill(c, x + 28, 500, w - 56, 150, 16); c.fill()
  c.fillStyle = 'rgba(255,255,255,0.55)'; c.font = '14px ui-monospace, monospace'; c.fillText('ESTIMATED BATTERY · AAA GAME', x + 48, 534)
  c.fillStyle = '#fff'; c.font = '600 46px system-ui, sans-serif'; c.fillText(m.est, x + 48, 590)
  c.fillStyle = 'rgba(255,255,255,0.45)'; c.font = '14px system-ui, sans-serif'; c.fillText('Modelled from the 36 Wh pack. Not yet measured.', x + 48, 624)
}

function boot(c: CanvasRenderingContext2D, p: number) {
  c.fillStyle = '#000'; c.fillRect(0, 0, SW, SH)
  c.globalAlpha = Math.min(1, p * 1.6)
  c.fillStyle = 'rgba(255,255,255,0.15)'; c.fillRect(SW / 2 - 120, SH / 2 + 60, 240, 3)
  c.fillStyle = '#e9edf2'; c.fillRect(SW / 2 - 120, SH / 2 + 60, 240 * p, 3)
  c.textAlign = 'left'; c.globalAlpha = 1
}

function docked(c: CanvasRenderingContext2D) {
  c.fillStyle = '#050607'; c.fillRect(0, 0, SW, SH)
  c.textAlign = 'center'; c.fillStyle = 'rgba(233,237,242,0.8)'; c.font = '600 34px system-ui, sans-serif'
  c.fillText('Docked · 20 W', SW / 2, SH / 2 - 6)
  c.fillStyle = 'rgba(255,255,255,0.4)'; c.font = '20px system-ui, sans-serif'
  c.fillText('Showing on external display over USB4', SW / 2, SH / 2 + 32); c.textAlign = 'left'
}

export function drawDevice(c: CanvasRenderingContext2D, mode: ScreenMode, t: number, qamMode: number, p: number) {
  c.save()
  switch (mode) {
    case 'off': c.fillStyle = '#020203'; c.fillRect(0, 0, SW, SH); break
    case 'boot': boot(c, p); break
    case 'game': drawLandscape(c, t); hud(c); break
    case 'library': library(c, t); break
    case 'qam': qam(c, t, qamMode); break
    case 'docked': docked(c); break
  }
  c.restore()
}

export function drawMonitor(c: CanvasRenderingContext2D, t: number, on: number) {
  c.save()
  c.fillStyle = '#030304'; c.fillRect(0, 0, SW, SH)
  if (on <= 0.01) { c.restore(); return }
  c.globalAlpha = on
  const wp = c.createLinearGradient(0, 0, SW, SH); wp.addColorStop(0, '#1b2430'); wp.addColorStop(1, '#0b0e13')
  c.fillStyle = wp; c.fillRect(0, 0, SW, SH)
  // game window
  const gx = 40, gy = 36, gw = 820, gh = 500
  c.fillStyle = '#16191e'; pill(c, gx, gy, gw, gh + 34, 10); c.fill()
  c.fillStyle = 'rgba(255,255,255,0.7)'; c.font = '14px system-ui, sans-serif'; c.fillText('Ridgeline', gx + 16, gy + 22)
  drawLandscape(c, t, gw, gh, gx, gy + 34)
  // control window
  const cx = 890, cy = 36, cw = 350
  c.fillStyle = '#16191e'; pill(c, cx, cy, cw, 300, 10); c.fill()
  c.fillStyle = '#fff'; c.font = '600 18px system-ui, sans-serif'; c.fillText('Osmium Control', cx + 20, cy + 36)
  const rows: [string, string][] = [['Mode', 'Docked'], ['Power limit', '20 W'], ['Display', 'External · USB4'], ['Input', 'Keyboard + mouse'], ['Fan', 'Balanced']]
  rows.forEach(([k, v], i) => {
    const y = cy + 82 + i * 42
    c.fillStyle = 'rgba(255,255,255,0.6)'; c.font = '15px system-ui, sans-serif'; c.fillText(k, cx + 20, y)
    c.textAlign = 'right'; c.fillStyle = '#fff'; c.font = '15px ui-monospace, monospace'; c.fillText(v, cx + cw - 20, y); c.textAlign = 'left'
  })
  // files window
  c.fillStyle = '#16191e'; pill(c, cx, 360, cw, 210, 10); c.fill()
  c.fillStyle = '#fff'; c.font = '600 16px system-ui, sans-serif'; c.fillText('Files', cx + 20, 392)
  ;['Projects', 'Captures', 'Downloads', 'Documents'].forEach((f, i) => {
    c.fillStyle = 'rgba(169,195,220,0.5)'; c.fillRect(cx + 20, 414 + i * 36, 18, 14)
    c.fillStyle = 'rgba(255,255,255,0.75)'; c.font = '15px system-ui, sans-serif'; c.fillText(f, cx + 50, 426 + i * 36)
  })
  // taskbar
  c.fillStyle = 'rgba(10,12,15,0.92)'; c.fillRect(0, SH - 52, SW, 52)
  for (let i = 0; i < 5; i++) { c.fillStyle = i === 0 ? '#e9edf2' : 'rgba(255,255,255,0.25)'; pill(c, SW / 2 - 130 + i * 56, SH - 40, 32, 28, 8); c.fill() }
  c.fillStyle = 'rgba(255,255,255,0.6)'; c.font = '14px ui-monospace, monospace'; c.textAlign = 'right'; c.fillText('20 W  ·  ⚡ charging', SW - 24, SH - 20)
  c.textAlign = 'left'; c.globalAlpha = 1
  c.restore()
}
