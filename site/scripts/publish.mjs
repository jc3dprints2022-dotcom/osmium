// Builds the static export and publishes it to the repo root (GitHub Pages at osmium.proxima-3d.com).
// Replaces only export artifacts; leaves site/, CNAME, .nojekyll, README, and .git untouched.
import { execSync } from 'node:child_process'
import { cpSync, existsSync, lstatSync, mkdirSync, readdirSync, rmSync, statSync, writeFileSync } from 'node:fs'
import { dirname, join, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'

const site = resolve(dirname(fileURLToPath(import.meta.url)), '..')
const repo = resolve(site, '..')
const out = join(site, 'out')

const EXPORT_NAMES = new Set([
  '_next',
  'models',
  'renders',
  '404',
  '404.html',
  'index.html',
  'index.txt',
  'icon.svg',
])

if (!process.argv.includes('--no-build')) {
  execSync('npx next build', { cwd: site, stdio: 'inherit' })
}
if (!existsSync(join(out, 'index.html'))) throw new Error('export missing: site/out/index.html')
if (!existsSync(join(repo, 'CNAME')) || !existsSync(join(repo, 'site', 'package.json'))) {
  throw new Error('refusing to publish: repo root not recognised')
}

for (const name of readdirSync(repo)) {
  if (EXPORT_NAMES.has(name)) rmSync(join(repo, name), { recursive: true, force: true })
}
for (const name of readdirSync(out)) {
  cpSync(join(out, name), join(repo, name), { recursive: true })
}
writeFileSync(join(repo, '.nojekyll'), '')
console.log(`published ${out} -> ${repo}`)
