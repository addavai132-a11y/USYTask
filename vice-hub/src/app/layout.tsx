import type { Metadata, Viewport } from 'next'
import { Inter, Outfit } from 'next/font/google'
import './globals.css'
import { AppShell } from '@/components/app-shell'

const inter = Inter({
  subsets: ['latin'],
  variable: '--font-inter',
})

const outfit = Outfit({
  subsets: ['latin'],
  variable: '--font-outfit',
})

export const metadata: Metadata = {
  title: 'VICE HUB - GTA VI Community',
  description: 'Comunidad, mapas, secretos y guías para GTA VI.',
}

export const viewport: Viewport = {
  themeColor: '#09070D',
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="es" className={`${inter.variable} ${outfit.variable} dark`}>
      <body className="antialiased min-h-screen bg-[var(--color-background)] text-[var(--color-foreground)] selection:bg-[var(--color-vice-pink)] selection:text-white">
        <AppShell>{children}</AppShell>
      </body>
    </html>
  )
}
