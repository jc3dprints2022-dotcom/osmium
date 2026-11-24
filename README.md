# Osmium

Public site for Osmium, a pocketable gaming PC from Proxima LLC.

Live (once DNS is in place): **https://osmium.proxima-3d.com**

This repo mirrors the [sagaleaf](https://github.com/jc3dprints2022-dotcom/sagaleaf) GitHub Pages layout: Next.js source in `site/`, the static export at the repo root, a `CNAME` of `osmium.proxima-3d.com`, and `.nojekyll` so Pages serves `/_next/` assets.

## Local development

Needs Node 20 or newer.

```bash
cd site
npm ci
npm run dev          # http://localhost:3000
npm run build        # writes site/out/
npm run publish      # build + copy the export to the repo root
```

`npx serve .` from the repo root (after `publish`) is the closest check to what GitHub Pages will serve at the custom domain.

## Deploy

GitHub Pages is set to serve `main` from the repo root. After changing the site:

```bash
cd site && npm run publish
git add -A && git commit && git push
```

Until the DNS record below exists, `https://jc3dprints2022-dotcom.github.io/osmium/` may load HTML but break `/_next/` assets, because the export uses root-absolute paths for the subdomain. That is expected.

## DNS (Wix)

`proxima-3d.com` nameservers are Wix (`ns12.wixdns.net`, `ns13.wixdns.net`). Add **one** new record and leave `proxima-3d.com`, `www`, and `saga` alone:

| Host | Type | Value |
|---|---|---|
| `osmium` | CNAME | `jc3dprints2022-dotcom.github.io` |

Do not change the apex or `www` records. Those currently serve a different site.

## Intentional gaps

The Reserve button opens a “Reservations aren't open yet” dialog. There is no checkout, form, or data collection. Prices on the page are estimates and are labelled as such.
