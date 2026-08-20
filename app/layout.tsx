import { Analytics } from '@vercel/analytics/next'
import type { Metadata, Viewport } from 'next'
import { Manrope } from 'next/font/google'
import { ServiceWorkerRegister } from '@/components/pwa/service-worker-register'
import './globals.css'

const manrope = Manrope({
  subsets: ['latin'],
  variable: '--font-manrope',
  display: 'swap',
})

export const metadata: Metadata = {
  title: 'USYTask — Universal System for Tasks',
  description:
    'USYTask (Universal System for Tasks) centraliza el calendario, tareas, compra, gastos y recuerdos de tu familia, pareja, compañeros de piso o uso personal. Todo lo importante, en un solo sistema.',
  applicationName: 'USYTask',
  generator: 'v0.app',
  manifest: '/manifest.webmanifest',
  appleWebApp: {
    capable: true,
    statusBarStyle: 'default',
    title: 'USYTask',
  },
  formatDetection: {
    telephone: false,
  },
  icons: {
    icon: '/icon.svg',
    apple: '/icon-192.png',
  },
}

export const viewport: Viewport = {
  themeColor: '#4f7d5e',
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
  viewportFit: 'cover',
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="es" className={`${manrope.variable} bg-background`}>
      <body className="font-sans antialiased">
        {children}
        <ServiceWorkerRegister />
        {process.env.NODE_ENV === 'production' && <Analytics />}
      </body>
    </html>
  )
}
