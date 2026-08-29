'use client'

import { useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { ArrowRight, Menu, X } from 'lucide-react'
import { UsyTaskLogo } from '@/components/ui/usytask-logo'
import { DevModeSwitch } from '@/components/dev/dev-mode-switch'
import { isDevModeActive, enableDevMode } from '@/lib/dev-mode'

export function LandingHeader() {
  const router = useRouter()
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)

  const handleScrollToHowItWorks = (e: React.MouseEvent<HTMLAnchorElement>) => {
    e.preventDefault()
    setMobileMenuOpen(false)
    const el = document.getElementById('como-funciona')
    if (el) {
      el.scrollIntoView({ behavior: 'smooth' })
    }
  }

  const handleCtaClick = (e: React.MouseEvent, targetUrl: string) => {
    if (isDevModeActive()) {
      e.preventDefault()
      enableDevMode()
      router.replace('/app')
    } else {
      router.push(targetUrl)
    }
  }

  return (
    <header className="sticky top-0 z-50 w-full border-b border-border/40 bg-background/90 backdrop-blur-2xl transition-all pt-[max(0.25rem,env(safe-area-inset-top,0.25rem))]">
      <div className="mx-auto flex h-16 sm:h-18 max-w-6xl items-center justify-between px-4 sm:px-6 lg:px-8">
        {/* Logo */}
        <Link href="/" className="transition-opacity hover:opacity-90 shrink-0">
          <UsyTaskLogo size="md" />
        </Link>

        {/* Actions Desktop */}
        <div className="hidden sm:flex items-center gap-2 sm:gap-3">
          <DevModeSwitch />

          <a
            href="#como-funciona"
            onClick={handleScrollToHowItWorks}
            className="rounded-2xl px-3 py-2 text-xs sm:text-sm font-bold text-muted-foreground transition-colors hover:text-foreground active:scale-95"
          >
            Cómo funciona
          </a>

          <Link
            href="/login"
            onClick={(e) => handleCtaClick(e, '/login')}
            className="rounded-2xl px-3 py-2 text-xs sm:text-sm font-bold text-muted-foreground transition-colors hover:text-foreground active:scale-95"
          >
            Iniciar sesión
          </Link>

          <Link
            href="/register"
            onClick={(e) => handleCtaClick(e, '/register')}
            className="inline-flex items-center gap-1.5 rounded-2xl bg-primary px-4 py-2.5 text-xs sm:text-sm font-bold text-primary-foreground shadow-soft transition-all active:scale-95 hover:bg-primary/90"
          >
            <span>Crear cuenta</span>
            <ArrowRight className="size-4 hidden sm:inline-block" />
          </Link>
        </div>

        {/* Actions Mobile */}
        <div className="flex items-center gap-2 sm:hidden">
          <Link
            href="/register"
            onClick={(e) => handleCtaClick(e, '/register')}
            className="inline-flex items-center gap-1 rounded-xl bg-primary px-3 py-2 text-xs font-bold text-primary-foreground shadow-soft active:scale-95"
          >
            <span>Empezar</span>
            <ArrowRight className="size-3.5" />
          </Link>

          <button
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="rounded-xl p-2 text-muted-foreground hover:text-foreground hover:bg-secondary active:scale-95"
            aria-label="Abrir menú"
          >
            {mobileMenuOpen ? <X className="size-5" /> : <Menu className="size-5" />}
          </button>
        </div>
      </div>

      {/* Mobile Menu Dropdown */}
      {mobileMenuOpen && (
        <div className="sm:hidden border-b border-border/40 bg-background/95 backdrop-blur-2xl px-4 pt-2 pb-4 shadow-xl animate-in slide-in-from-top-2 duration-200">
          <div className="flex flex-col gap-2">
            <div className="py-1">
              <DevModeSwitch />
            </div>
            <a
              href="#como-funciona"
              onClick={handleScrollToHowItWorks}
              className="flex items-center rounded-xl px-3 py-2.5 text-sm font-bold text-muted-foreground hover:bg-secondary hover:text-foreground transition-colors"
            >
              Cómo funciona
            </a>
            <Link
              href="/login"
              onClick={(e) => {
                setMobileMenuOpen(false)
                handleCtaClick(e, '/login')
              }}
              className="flex items-center rounded-xl px-3 py-2.5 text-sm font-bold text-muted-foreground hover:bg-secondary hover:text-foreground transition-colors"
            >
              Iniciar sesión
            </Link>
            <Link
              href="/register"
              onClick={(e) => {
                setMobileMenuOpen(false)
                handleCtaClick(e, '/register')
              }}
              className="flex items-center justify-between rounded-xl bg-primary px-4 py-2.5 text-sm font-bold text-primary-foreground transition-all active:scale-95"
            >
              <span>Crear cuenta</span>
              <ArrowRight className="size-4" />
            </Link>
          </div>
        </div>
      )}
    </header>
  )
}
