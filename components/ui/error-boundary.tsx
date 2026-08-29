'use client'

import React, { Component, type ReactNode } from 'react'
import { AlertTriangle, RefreshCw, Home } from 'lucide-react'
import { UsyTaskLogo } from './usytask-logo'

interface Props {
  children: ReactNode
  fallbackTitle?: string
}

interface State {
  hasError: boolean
  error?: Error
}

export class ErrorBoundary extends Component<Props, State> {
  public state: State = {
    hasError: false,
  }

  public static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error }
  }

  public componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error('USYTask Uncaught Error Boundary:', error, errorInfo)
  }

  private handleReload = () => {
    if (typeof window !== 'undefined') {
      window.location.reload()
    }
  }

  private handleGoHome = () => {
    if (typeof window !== 'undefined') {
      window.location.href = '/app'
    }
  }

  public render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen min-h-[100dvh] flex flex-col items-center justify-center bg-[#05050a] text-white px-4 py-8 relative overflow-hidden">
          {/* Ambient Glow */}
          <div className="pointer-events-none absolute -top-40 -left-40 size-96 rounded-full bg-purple-600/15 blur-[120px]" />
          <div className="pointer-events-none absolute -bottom-40 -right-40 size-96 rounded-full bg-indigo-600/15 blur-[120px]" />

          <div className="relative z-10 mx-auto max-w-md w-full rounded-3xl border border-white/10 bg-white/[0.03] backdrop-blur-2xl p-6 sm:p-8 text-center shadow-2xl animate-fade-in flex flex-col items-center">
            <UsyTaskLogo size="md" className="mb-4" />

            <div className="flex size-14 items-center justify-center rounded-2xl bg-rose-500/15 border border-rose-500/30 text-rose-400 mb-3 shadow-inner">
              <AlertTriangle className="size-7" />
            </div>

            <h2 className="text-xl font-black tracking-tight text-white sm:text-2xl">
              {this.props.fallbackTitle || 'Algo no cargó correctamente'}
            </h2>
            <p className="mt-2 text-xs sm:text-sm font-medium text-slate-400 leading-relaxed max-w-xs">
              Hemos detectado un problema al cargar esta vista. No te preocupes, tus datos están a salvo.
            </p>

            {this.state.error?.message && (
              <div className="mt-3 w-full rounded-xl bg-black/40 border border-white/10 p-2.5 text-left text-[11px] font-mono text-slate-400 overflow-x-auto max-h-24">
                {this.state.error.message}
              </div>
            )}

            <div className="mt-6 flex flex-col sm:flex-row items-center gap-2.5 w-full">
              <button
                type="button"
                onClick={this.handleReload}
                className="flex h-12 w-full items-center justify-center gap-2 rounded-2xl bg-emerald-600 hover:bg-emerald-700 dark:bg-purple-600 dark:hover:bg-purple-500 font-bold text-white text-sm shadow-md transition-all active:scale-95"
              >
                <RefreshCw className="size-4" />
                <span>Recargar aplicación</span>
              </button>

              <button
                type="button"
                onClick={this.handleGoHome}
                className="flex h-12 w-full items-center justify-center gap-2 rounded-2xl border border-white/10 bg-white/[0.04] hover:bg-white/[0.08] font-bold text-slate-300 text-sm transition-all active:scale-95"
              >
                <Home className="size-4" />
                <span>Ir al Centro de Control</span>
              </button>
            </div>
          </div>
        </div>
      )
    }

    return this.props.children
  }
}
