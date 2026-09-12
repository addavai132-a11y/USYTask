import type { Metadata } from 'next'

// Desactivar caché estática en el Dashboard / Listado de familias
export const dynamic = 'force-dynamic'
export const revalidate = 0

export const metadata: Metadata = {
  title: 'Dashboard | USYTask',
}

export default function AppDashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return <>{children}</>
}
