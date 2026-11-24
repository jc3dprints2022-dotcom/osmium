// Single source of truth for every number on the site.
// Status tags:
//   verified  – published by the component vendor / independently measured (sources in the V1 engineering doc)
//   target    – Osmium V1 engineering target, from the design stack-up; not yet measured on hardware
//   estimate  – modelled (performance, battery life, price); will change after prototypes

export type Status = 'verified' | 'target' | 'estimate'

export const STATUS_LABEL: Record<Status, string> = {
  verified: 'Verified',
  target: 'Engineering target',
  estimate: 'Estimate',
}

export const STATUS_NOTE: Record<Status, string> = {
  verified: 'Published by the component vendor or measured independently.',
  target: 'Osmium V1 design target from the engineering stack-up. Not yet measured on hardware.',
  estimate: 'Modelled from measured data on related hardware. Will be replaced by prototype measurements.',
}

export type SpecRow = { label: string; value: string; status: Status; note?: string }
export type SpecGroup = { title: string; rows: SpecRow[] }

export const SPECS: SpecGroup[] = [
  {
    title: 'Processor',
    rows: [
      { label: 'Chip', value: 'Intel Arc G3 Extreme (Arc G3 on the $1,299 model)', status: 'verified' },
      { label: 'CPU', value: '14 cores: 2 P-cores, 8 E-cores, 4 LP E-cores', status: 'verified' },
      { label: 'Graphics', value: 'Arc B390, 12 Xe3 cores at 2.3 GHz (Arc G3: 10 Xe3 cores)', status: 'verified' },
      { label: 'Power modes', value: 'Battery 8 W · Balanced 12 W · Performance 15 W · Docked 20 W', status: 'target' },
    ],
  },
  {
    title: 'Memory and storage',
    rows: [
      { label: 'Memory', value: '24 GB or 32 GB LPDDR5X-8533, 128-bit (~136 GB/s)', status: 'target', note: 'Bandwidth follows from the memory standard and bus width.' },
      { label: 'Storage', value: '512 GB or 1 TB PCIe 4.0 NVMe, M.2 2230, user-replaceable', status: 'target' },
      { label: 'Expansion', value: 'microSD (UHS-I)', status: 'target' },
    ],
  },
  {
    title: 'Display',
    rows: [
      { label: 'Panel', value: '6.0-inch AMOLED, 1920 × 1080, 120 Hz, 367 ppi, touch', status: 'target', note: 'A shipping 6-inch 1080p 120 Hz AMOLED exists (AYN Odin 3). Supply for Osmium is not yet secured.' },
      { label: 'Cover', value: '0.55 mm aluminosilicate glass', status: 'target' },
      { label: 'Variable refresh', value: 'Stretch goal; 40 fps frame-paced mode on the 120 Hz panel', status: 'target' },
    ],
  },
  {
    title: 'Size and weight',
    rows: [
      { label: 'Dimensions', value: '190 × 84 × 19.5 mm (17.5 mm at the centre)', status: 'target' },
      { label: 'Weight', value: '375 g ± 15 g', status: 'target' },
    ],
  },
  {
    title: 'Battery and power',
    rows: [
      { label: 'Battery', value: '36 Wh, 2S silicon-carbon, user-replaceable in under 10 minutes', status: 'target' },
      { label: 'AAA games, Balanced 12 W', value: '≈ 2.0 hours', status: 'estimate' },
      { label: 'AAA games, Performance 15 W', value: '≈ 1.6 hours', status: 'estimate' },
      { label: 'Lighter games, 5 W', value: '≈ 4.1 hours', status: 'estimate' },
      { label: 'Video playback', value: '≈ 7.8 hours', status: 'estimate' },
      { label: 'Charging', value: 'USB-C PD, 65 W; 0–80% in about 45 min', status: 'target' },
    ],
  },
  {
    title: 'Cooling',
    rows: [
      { label: 'System', value: 'Copper vapour chamber, one 45 mm blower, top-edge exhaust', status: 'target' },
      { label: 'Sustained power', value: '15 W for 60 min at 25 °C without throttling', status: 'target' },
      { label: 'Fan noise', value: '≤ 33 dBA at 15 W (30 cm)', status: 'target' },
    ],
  },
  {
    title: 'Controls and connectivity',
    rows: [
      { label: 'Sticks', value: 'TMR thumbsticks, swappable modules', status: 'target' },
      { label: 'Triggers and buttons', value: 'Hall-effect analog triggers, bumpers, ABXY, D-pad, 2 back buttons', status: 'target' },
      { label: 'Sensors and feel', value: '6-axis gyro, 2 LRA haptic motors', status: 'target' },
      { label: 'Ports', value: 'USB4 40 Gbps (DisplayPort 2.1, charging), USB-C 10 Gbps, 3.5 mm audio', status: 'target' },
      { label: 'Wireless', value: 'Wi-Fi 7, Bluetooth 5.4', status: 'target' },
    ],
  },
  {
    title: 'Software',
    rows: [
      { label: 'Operating system', value: 'SteamOS with Osmium Control; Windows 11 image available', status: 'target', note: 'SteamOS officially supports Intel handhelds as of SteamOS 3.10.' },
    ],
  },
]

// Expected frame rates — 1080p output, upscaled from 540–720p, no frame generation.
export type PerfRow = { game: string; settings: string; w12: number; w15: number; basis: 'M' | 'E' | 'S' }
export const PERF: PerfRow[] = [
  { game: 'Cyberpunk 2077', settings: 'Steam Deck preset', w12: 41, w15: 46, basis: 'E' },
  { game: 'Returnal', settings: 'Medium', w12: 50, w15: 56, basis: 'M' },
  { game: 'Forza Horizon 6', settings: 'Medium, XeSS Quality', w12: 45, w15: 50, basis: 'E' },
  { game: 'Red Dead Redemption 2', settings: 'Low/medium, upscaled', w12: 39, w15: 43, basis: 'S' },
  { game: 'Elden Ring', settings: 'Medium', w12: 48, w15: 53, basis: 'S' },
  { game: 'Clair Obscur: Expedition 33', settings: 'Low, TSR', w12: 26, w15: 28, basis: 'E' },
]
export const PERF_BASIS: Record<PerfRow['basis'], string> = {
  M: 'Anchored to a measurement on the same chip',
  E: 'Extrapolated from measurements on related hardware',
  S: 'Speculative model estimate',
}

// Configurations supported by the V1 design.
export type Config = { id: string; chip: string; memory: string; storage: string; price: number; note: string }
export const CONFIGS: Config[] = [
  { id: 'g3-24-512', chip: 'Intel Arc G3', memory: '24 GB', storage: '512 GB', price: 1299, note: '10 Xe3 graphics cores' },
  { id: 'g3x-24-1t', chip: 'Intel Arc G3 Extreme', memory: '24 GB', storage: '1 TB', price: 1499, note: '12 Xe3 graphics cores' },
  { id: 'g3x-32-1t', chip: 'Intel Arc G3 Extreme', memory: '32 GB', storage: '1 TB', price: 1699, note: '12 Xe3 graphics cores' },
]

export type Finish = { id: string; name: string; back: string; frame: string; note: string }
export const FINISHES: Finish[] = [
  { id: 'osmium', name: 'Osmium', back: '#5b6672', frame: '#1b1e22', note: 'Blue-grey anodised aluminium back, graphite frame' },
  { id: 'graphite', name: 'Graphite', back: '#2a2d31', frame: '#141619', note: 'Dark anodised aluminium back, black frame' },
]

// Components for the engineering explorer (ids match 3D groups).
export type Part = { id: string; name: string; spec: string; detail: string; status: Status }
export const PARTS: Part[] = [
  { id: 'display', name: 'Display', spec: '6.0" AMOLED · 1920 × 1080 · 120 Hz', detail: '136 × 78 mm module with 0.55 mm cover glass. It drops into the bezel from the front and rests on a 1.2 mm ledge.', status: 'target' },
  { id: 'front', name: 'Front frame and controls', spec: 'Glass-fibre PC/ABS · TMR sticks · Hall triggers', detail: 'Sticks sit in 0.8 mm recessed wells so they don\'t snag in a pocket. The bumpers and triggers stay inside the top-edge profile.', status: 'target' },
  { id: 'battery', name: 'Battery', spec: '36 Wh · 2 × 84 × 36 × 7.5 mm Si-C cells', detail: '2S pack, about 125 g, in a magnesium tray with aerogel insulation behind it. Four screws and one connector; no glue.', status: 'target' },
  { id: 'board', name: 'Mainboard', spec: 'Arc G3 Extreme · 24/32 GB LPDDR5X-8533 · M.2 2230', detail: 'About 88 × 70 mm, 10-layer any-layer HDI. The SoC and memory face the vapour chamber; the SSD is replaceable.', status: 'target' },
  { id: 'thermal', name: 'Cooling', spec: 'Vapour chamber · 45 × 45 × 7 mm blower · 40 × 12 × 7 mm fins', detail: 'Air comes in through the back grille and leaves through the top edge, away from your hands. Designed for 15 W sustained, about 2 CFM.', status: 'target' },
  { id: 'controls', name: 'Control boards', spec: '2 × 20.5 × 69 mm side boards', detail: 'One board in each 27 mm side bay. They carry the stick connectors, face buttons and D-pad, and connect to the mainboard.', status: 'target' },
  { id: 'back', name: 'Back plate', spec: 'Bead-blasted 6061 aluminium · 6 × T5 screws', detail: 'Removes with one driver for battery, SSD, fan and stick service. Micro-perforated intake with a replaceable dust filter.', status: 'target' },
]
