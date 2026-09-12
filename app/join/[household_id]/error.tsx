'use client'

import { useEffect } from 'react'
import Link from 'next/link'
import { AlertOctagon, RefreshCw, Home } from 'lucide-react'
import { UsyTaskLogo } from '@/components/ui/usytask-logo'

interface ErrorProps {
  error: Error & { digest?: string }
  reset: () => void
}

/**
 * REGLA 4: ERROR BOUNDARY
 * Captura cualquier fallo de renderizado o error no controlado en la ruta dinámica /join/[household_id]
 * mostrando una UI elegante e integrada en el diseño en lugar de la pantalla nativa blanca de Vercel.
 */
export default function JoinHouseholdErrorBoundary({ error, reset }: ErrorProps) {
  useEffect(() => {
    // Log para Vercel Analytics y la consola del navegador
    console.error('[Join Household Error Boundary] Error capturado en la página de invitación:', error)
  }, [error])

  return (
    <div className="flex min-h-screen flex-col items-center justify-between p-4 sm:p-6 bg-background text-foreground">
      <div className="w-full max-w-md pt-6 flex justify-center">
        <UsyTaskLogo size="md" />
      </div>

      <div className="w-full max-w-md my-auto rounded-[32px] border border-destructive/30 bg-card p-6 sm:p-8 shadow-2xl flex flex-col items-center text-center animate-fade-in">
        <div className="mx-auto flex size-14 items-center justify-center rounded-2xl bg-destructive/10 text-destructive mb-4">
          <AlertOctagon className="size-7" />
        </div>

        <span className="rounded-full bg-destructive/10 px-3 py-1 text-xs font-mono font-bold text-destructive border border-destructive/20">
          Error 500 — Servidor
        </span>

        <h1 className="text-2xl font-black text-foreground mt-3">
          No pudimos cargar la invitación
        </h1>

        <p className="mt-2 text-sm text-muted-foreground max-w-xs">
          Ha ocurrido un problema inesperado al cargar los datos de la familia. Por favor, reintenta o accede desde el inicio.
        </p>

        {error.digest && (
          <p className="mt-3 text-[11px] font-mono text-muted-foreground bg-secondary/80 px-3 py-1.5 rounded-xl border border-border">
            ID de seguimiento: <span className="text-foreground font-bold">{error.digest}</span>
          </p>
        )}

        <div className="mt-6 flex flex-col gap-2.5 w-full">
          <button
            type="button"
            onClick={() => reset()}
            className="flex h-12 w-full items-center justify-center gap-2 rounded-2xl bg-primary text-sm font-bold text-primary-foreground shadow-soft transition-transform active:scale-95"
          >
            <RefreshCw className="size-4" />
            <span>Reintentar</span>
          </button>

          <Link
            href="/app"
            className="flex h-12 w-full items-center justify-center gap-2 rounded-2xl border border-border bg-card text-sm font-bold text-foreground shadow-soft transition-transform active:scale-95 hover:bg-secondary"
          >
            <Home className="size-4 text-primary" />
            <span>Volver al Inicio</span>
          </Link>
        </div>
      </div>

      <div className="w-full max-w-md pb-4 text-center">
        <p className="text-[11px] text-muted-foreground">
          USYTask — Organización y colaboración para el hogar
        </p>
      </div>
    </div>
  )
}
