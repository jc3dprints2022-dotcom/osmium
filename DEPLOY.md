# Osmium website: deployment

This is a static Next.js export. `npm run build` writes the whole site to `out/` (HTML, JS, CSS, a 669 KB GLB model and the fallback renders). There is no server code, database, payment provider or form backend.

The brief targeted `pocket.proxima-3d.com`. Since the product is now Osmium, these steps use **`osmium.proxima-3d.com`**. Any subdomain works: swap in the one you want.

## 0. Before you touch anything

I had no access to Proxima hosting or DNS, so nothing has been deployed and no DNS records have changed.

1. Find out where `proxima-3d.com` DNS is managed (registrar, Cloudflare, etc.): `dig NS proxima-3d.com +short`
2. List the existing records and **leave every one of them alone**, especially the ones serving `proxima-3d.com`, `www` and `saga.proxima-3d.com`. You only add one new record for the new subdomain.
3. Check the subdomain is free: `dig osmium.proxima-3d.com +short` should return nothing.

## 1. Build

```bash
npm ci
npm run build          # -> out/
npx serve out          # optional local check at http://localhost:3000
```

Node 20+ required. To regenerate the model from the CAD: `python to_glb.py` (osmium-web-assets), then `npm run assets`.

## 2. Pick one host

### Option A: Vercel (simplest)
1. Push this folder to a new Git repo (don't reuse the Saga repo).
2. On vercel.com, choose New Project, import the repo, and accept the detected Next.js settings. Vercel uses the static export automatically.
3. Go to Project → Settings → Domains → Add `osmium.proxima-3d.com`. Vercel shows the record to create, normally:
   `CNAME  osmium  →  cname.vercel-dns.com`

### Option B: Cloudflare Pages
1. Go to Pages → Create project and connect the repo. Build command `npm run build`, output directory `out`.
2. Go to Custom domains → `osmium.proxima-3d.com`. If the zone is already on Cloudflare, it adds the CNAME for you. Otherwise create `CNAME osmium → <project>.pages.dev`.

### Option C: Netlify
1. Add a new site from Git. Build command `npm run build`, publish directory `out`.
2. Go to Domain settings → Add `osmium.proxima-3d.com` and create `CNAME osmium → <site>.netlify.app`.


### Option E: GitHub Pages (this repo)

This repository is set up like `sagaleaf`: static export at the repo root, `CNAME` `osmium.proxima-3d.com`, and `.nojekyll`.

1. Push to `jc3dprints2022-dotcom/osmium` on branch `main`.
2. In the repo, enable Pages from `main` / root (already the intended settings).
3. In Wix DNS for `proxima-3d.com`, add only:
   `CNAME  osmium  →  jc3dprints2022-dotcom.github.io`
   Leave `proxima-3d.com`, `www`, and `saga` unchanged.

Rebuild and refresh the published files with `cd site && npm run publish`, then commit the repo-root export.

### Option D: the server that already hosts saga.proxima-3d.com
Upload the **contents** of `out/` to a **new** directory, e.g. `/var/www/osmium`, not the Saga directory. Then add a new vhost:

```nginx
server {
  server_name osmium.proxima-3d.com;
  root /var/www/osmium;
  location / { try_files $uri $uri/ /index.html; }
  location /_next/static/ { add_header Cache-Control "public, max-age=31536000, immutable"; }
  location /models/ { add_header Cache-Control "public, max-age=604800"; types { model/gltf-binary glb; } }
}
```

Then run `sudo certbot --nginx -d osmium.proxima-3d.com` and add an `A` (or `CNAME`) record for `osmium` pointing at that server.

## 3. Verify
- `https://osmium.proxima-3d.com` loads and the 3D device assembles as you scroll.
- `curl -I https://osmium.proxima-3d.com/models/osmium_v1.glb` returns 200.
- `proxima-3d.com` and `saga.proxima-3d.com` still behave exactly as before.

## 4. Things that are intentionally off
- **Reserve** opens a "Reservations aren't open yet" dialog. There is no checkout, no form and no data collection. Wiring up real reservations or payments (e.g. Stripe Checkout) is a separate change. Don't do it until it's explicitly approved.
- Prices on the page are estimates from the V1 economics model and are labelled as such.

## Notes
- `?snap` on the URL turns off camera easing. It's only used for automated screenshots.
- With reduced motion turned on, easing and auto-animation stop and scroll spans collapse. Without WebGL, the site falls back to static renders.
