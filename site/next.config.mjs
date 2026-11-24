/** Static export so the site can live on any static host (Vercel, Netlify, Cloudflare Pages, S3). */
const isPreview = process.env.OSMIUM_PREVIEW === '1'
export default {
  output: 'export',
  trailingSlash: true,
  images: { unoptimized: true },
  // Preview builds use relative asset URLs so the export also runs from a sub-path.
  assetPrefix: isPreview ? '.' : undefined,
  reactStrictMode: true,
}
