import type { Metadata, Viewport } from 'next'
import { GeistSans } from 'geist/font/sans'
import { GeistMono } from 'geist/font/mono'
import './globals.css'

export const metadata: Metadata = {
  title: 'Osmium — PC gaming. Anywhere.',
  description: 'Osmium is a pocketable gaming PC: Intel Arc G3 Extreme, 6-inch 120 Hz OLED, 190 × 84 × 19.5 mm. Engineering preview.',
  metadataBase: new URL('https://osmium.proxima-3d.com'),
  openGraph: { title: 'Osmium', description: 'PC gaming. Anywhere.', images: ['/renders/01_hero_front_3q.png'] },
}
export const viewport: Viewport = { themeColor: '#060708', width: 'device-width', initialScale: 1 }

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={`${GeistSans.variable} ${GeistMono.variable}`}>
      <body>{children}</body>
    </html>
  )
}
