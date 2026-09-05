import { Analytics } from '@vercel/analytics/next'
import type { Metadata, Viewport } from 'next'
import { Plus_Jakarta_Sans } from 'next/font/google'
import { ServiceWorkerRegister } from '@/components/pwa/service-worker-register'
import { ThemeModeProvider } from '@/components/ui/theme-mode-context'
import { HistoryLock } from '@/components/app/history-lock'
import { TrustedTypesInit } from '@/components/security/trusted-types-init'
import './globals.css'

const fontSans = Plus_Jakarta_Sans({
  subsets: ['latin'],
  variable: '--font-sans',
  display: 'swap',
  weight: ['300', '400', '500', '600', '700', '800'],
})

export const metadata: Metadata = {
  metadataBase: new URL('https://usy-task-vhza.vercel.app'),
  title: 'USYTask — Universal System for Tasks',
  description:
    'USYTask centraliza el calendario, tareas, compra, gastos y recuerdos de tu familia, pareja, compañeros de piso o uso personal.',
  applicationName: 'USYTask',
  generator: 'next',
  manifest: '/manifest.webmanifest',
  openGraph: {
    title: 'USYTask — Universal System for Tasks',
    description:
      'USYTask centraliza el calendario, tareas, compra, gastos y recuerdos de tu familia, pareja, compañeros de piso o uso personal.',
    url: 'https://usy-task-vhza.vercel.app',
    siteName: 'USYTask',
    images: [
      {
        url: '/og-image.png',
        width: 1200,
        height: 630,
        alt: 'USYTask Logo',
        type: 'image/png',
      },
    ],
    locale: 'es_ES',
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'USYTask — Universal System for Tasks',
    description:
      'USYTask centraliza el calendario, tareas, compra, gastos y recuerdos de tu familia, pareja, compañeros de piso o uso personal.',
    images: ['/og-image.png'],
  },
  appleWebApp: {
    capable: true,
    statusBarStyle: 'black-translucent',
    title: 'USYTask',
    startupImage: '/apple-touch-startup-image.png',
  },
  formatDetection: {
    telephone: false,
  },
  icons: {
    icon: [
      { url: '/favicon.png', sizes: '48x48', type: 'image/png' },
      { url: '/favicon-32x32.png', sizes: '32x32', type: 'image/png' },
      { url: '/favicon-16x16.png', sizes: '16x16', type: 'image/png' },
      { url: '/icon.svg', type: 'image/svg+xml', sizes: 'any' },
      { url: '/icon-192x192.png', type: 'image/png', sizes: '192x192' },
      { url: '/icon-512x512.png', type: 'image/png', sizes: '512x512' },
    ],
    apple: [
      { url: '/apple-touch-icon.png', sizes: '180x180', type: 'image/png' },
      { url: '/apple-icon.png', sizes: '180x180', type: 'image/png' },
    ],
    shortcut: '/favicon.png',
  },
}

export const viewport: Viewport = {
  themeColor: '#05050a',
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
    <html lang="es" className={`${fontSans.variable} dark min-h-screen min-h-[100dvh] overscroll-none`}>
      <body className="font-sans antialiased min-h-screen min-h-[100dvh] bg-background text-foreground transition-colors duration-300 overscroll-none">
        <ThemeModeProvider>
          <HistoryLock />
          {/* Fixed Ambient Aurora Glow Background Layer */}
          <div className="fixed inset-0 pointer-events-none -z-10 overflow-hidden">
            <div className="absolute top-[10%] left-[15%] size-[550px] -translate-x-1/2 -translate-y-1/2 rounded-full bg-[radial-gradient(circle,_rgba(147,51,234,0.14)_0%,_transparent_70%)] blur-3xl" />
            <div className="absolute bottom-[15%] right-[15%] size-[650px] translate-x-1/2 translate-y-1/2 rounded-full bg-[radial-gradient(circle,_rgba(99,102,241,0.10)_0%,_transparent_70%)] blur-3xl" />
            <div className="absolute top-[50%] left-[50%] size-[450px] -translate-x-1/2 -translate-y-1/2 rounded-full bg-[radial-gradient(circle,_rgba(217,70,239,0.04)_0%,_transparent_70%)] blur-3xl" />
          </div>

          {children}
          <ServiceWorkerRegister />
          <TrustedTypesInit />
          {process.env.NODE_ENV === 'production' && <Analytics />}
        </ThemeModeProvider>
      </body>
    </html>
  )
}
