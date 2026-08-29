'use client'

import { useEffect } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import {
  Calendar,
  CheckSquare,
  ShoppingCart,
  Users,
  Trophy,
  Bell,
  ArrowRight,
  Heart,
  Home as HomeIcon,
  Sparkles,
  Zap,
  User,
  Layers,
  CheckCircle2,
} from 'lucide-react'
import { LandingHeader } from '@/components/landing/landing-header'
import { AppPreviewMockup } from '@/components/landing/app-preview-mockup'
import { isDevModeActive, enableDevMode } from '@/lib/dev-mode'
import { getStoredSession } from '@/lib/user-session'
import { createClient } from '@/lib/supabase'

export default function LandingPage() {
  const router = useRouter()

  const handleCreateSpace = (e: React.MouseEvent) => {
    if (isDevModeActive()) {
      e.preventDefault()
      enableDevMode()
      router.push('/app')
    }
  }

  return (
    <div className="min-h-screen min-h-[100dvh] w-full max-w-full overflow-x-hidden bg-background text-foreground selection:bg-primary selection:text-primary-foreground">
      {/* Header */}
      <LandingHeader />

      <main className="w-full max-w-full overflow-x-hidden">
        {/* HERO SECTION */}
        <section className="relative pt-8 pb-14 sm:pt-14 sm:pb-20 lg:pt-20 lg:pb-28">
          {/* Ambient Background Gradients */}
          <div className="pointer-events-none absolute inset-0 -z-10 overflow-hidden">
            <div className="absolute -top-40 left-1/2 -translate-x-1/2 size-[320px] sm:size-[600px] rounded-full bg-primary/15 blur-[100px] sm:blur-[140px]" />
            <div className="absolute top-1/3 right-0 size-[250px] sm:size-[400px] rounded-full bg-accent/15 blur-[80px] sm:blur-[110px]" />
          </div>

          <div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8">
            {/* Intro visual sequence badge */}
            <div className="mb-5 flex flex-col items-center justify-center text-center">
              <div className="inline-flex items-center gap-2 rounded-full border border-primary/25 bg-primary/10 px-3.5 py-1.5 text-xs font-bold text-primary animate-fade-in shadow-2xs">
                <Sparkles className="size-3.5 text-primary shrink-0" />
                <span className="truncate">USYTask — Universal System for Tasks</span>
              </div>
            </div>

            <div className="grid grid-cols-1 items-center gap-10 lg:grid-cols-12 lg:gap-8">
              {/* Left Column: Headline & CTAs */}
              <div className="flex flex-col items-center text-center lg:col-span-7 lg:items-start lg:text-left min-w-0">
                <h1 className="text-4xl font-black tracking-tight text-foreground sm:text-6xl lg:text-7xl leading-[1.1] sm:leading-[1.05]">
                  USYTask
                </h1>
                <p className="mt-1 text-xs sm:text-sm font-extrabold tracking-widest text-primary uppercase">
                  Universal System for Tasks
                </p>

                <h2 className="mt-4 sm:mt-5 text-xl font-extrabold tracking-tight text-foreground sm:text-3xl lg:text-4xl text-balance leading-snug">
                  Todo lo importante de tu vida, bajo control.
                </h2>

                <p className="mt-3 sm:mt-4 max-w-xl text-sm sm:text-base lg:text-lg font-medium text-muted-foreground text-balance leading-relaxed">
                  Calendario, tareas, compras, hogar y personas importantes. Todo organizado desde un único lugar.
                </p>

                {/* Primary CTA Button */}
                <div className="mt-6 sm:mt-8 flex items-center justify-center lg:justify-start w-full sm:w-auto">
                  <Link
                    href="/register"
                    onClick={handleCreateSpace}
                    className="flex h-12 sm:h-13 w-full sm:w-auto sm:min-w-[260px] items-center justify-center gap-2.5 rounded-2xl bg-primary px-8 text-sm sm:text-base font-bold text-primary-foreground shadow-soft-lg transition-all active:scale-95 hover:bg-primary/90"
                  >
                    <span>Crear mi espacio</span>
                    <ArrowRight className="size-5 shrink-0" />
                  </Link>
                </div>

                {/* Trust badges */}
                <div className="mt-6 sm:mt-8 flex flex-wrap items-center justify-center lg:justify-start gap-3 sm:gap-6 text-xs font-semibold text-muted-foreground">
                  <span className="flex items-center gap-1.5">
                    <Zap className="size-4 text-primary shrink-0" /> Configuración en 1 minuto
                  </span>
                  <span className="flex items-center gap-1.5">
                    <Layers className="size-4 text-primary shrink-0" /> Multi-dispositivo
                  </span>
                  <span className="flex items-center gap-1.5">
                    <CheckCircle2 className="size-4 text-primary shrink-0" /> Todo en un solo lugar
                  </span>
                </div>
              </div>

              {/* Right Column: App Mockup Preview */}
              <div className="lg:col-span-5 w-full min-w-0">
                <AppPreviewMockup />
              </div>
            </div>
          </div>
        </section>

        {/* SECCIÓN “TODO VUESTRO DÍA” */}
        <section className="border-t border-border/50 bg-secondary/30 py-12 sm:py-20 lg:py-24">
          <div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8">
            <div className="mx-auto max-w-2xl text-center mb-8 sm:mb-14">
              <h2 className="text-2xl sm:text-3xl lg:text-4xl font-black tracking-tight text-foreground">
                Todo lo importante, sin perderos nada.
              </h2>
              <p className="mt-2.5 sm:mt-3 text-sm sm:text-base font-medium text-muted-foreground text-balance">
                Un sistema completo diseñado para tener tu día a día, hogar y tareas bajo control.
              </p>
            </div>

            <div className="grid grid-cols-1 gap-3.5 sm:gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {/* Feature 1 - Calendario */}
              <div className="group flex flex-col rounded-3xl border border-border/80 bg-card/80 p-5 sm:p-6 shadow-soft transition-all duration-300 hover:border-primary/40 hover:-translate-y-1 hover:shadow-soft-lg">
                <div className="mb-3.5 sm:mb-4 flex size-11 sm:size-12 items-center justify-center rounded-2xl bg-primary/10 border border-primary/20 text-primary transition-colors group-hover:bg-primary/20">
                  <Calendar className="size-5 sm:size-6" />
                </div>
                <h3 className="text-base sm:text-lg font-bold text-foreground">Calendario compartido</h3>
                <p className="mt-1.5 sm:mt-2 text-xs sm:text-sm font-medium text-muted-foreground leading-relaxed">
                  Eventos, médicos, colegio, deporte y planes de todos en una vista unificada.
                </p>
              </div>

              {/* Feature 2 - Tareas */}
              <div className="group flex flex-col rounded-3xl border border-border/80 bg-card/80 p-5 sm:p-6 shadow-soft transition-all duration-300 hover:border-primary/40 hover:-translate-y-1 hover:shadow-soft-lg">
                <div className="mb-3.5 sm:mb-4 flex size-11 sm:size-12 items-center justify-center rounded-2xl bg-primary/10 border border-primary/20 text-primary transition-colors group-hover:bg-primary/20">
                  <CheckSquare className="size-5 sm:size-6" />
                </div>
                <h3 className="text-base sm:text-lg font-bold text-foreground">Tareas</h3>
                <p className="mt-1.5 sm:mt-2 text-xs sm:text-sm font-medium text-muted-foreground leading-relaxed">
                  Reparte tareas del hogar de forma justa y sabe qué queda pendiente en cada momento.
                </p>
              </div>

              {/* Feature 3 - Compra */}
              <div className="group flex flex-col rounded-3xl border border-border/80 bg-card/80 p-5 sm:p-6 shadow-soft transition-all duration-300 hover:border-primary/40 hover:-translate-y-1 hover:shadow-soft-lg">
                <div className="mb-3.5 sm:mb-4 flex size-11 sm:size-12 items-center justify-center rounded-2xl bg-primary/10 border border-primary/20 text-primary transition-colors group-hover:bg-primary/20">
                  <ShoppingCart className="size-5 sm:size-6" />
                </div>
                <h3 className="text-base sm:text-lg font-bold text-foreground">Compra</h3>
                <p className="mt-1.5 sm:mt-2 text-xs sm:text-sm font-medium text-muted-foreground leading-relaxed">
                  Una lista compartida en tiempo real que todos pueden actualizar en el supermercado.
                </p>
              </div>

              {/* Feature 4 - Familia y Hogar */}
              <div className="group flex flex-col rounded-3xl border border-border/80 bg-card/80 p-5 sm:p-6 shadow-soft transition-all duration-300 hover:border-primary/40 hover:-translate-y-1 hover:shadow-soft-lg">
                <div className="mb-3.5 sm:mb-4 flex size-11 sm:size-12 items-center justify-center rounded-2xl bg-primary/10 border border-primary/20 text-primary transition-colors group-hover:bg-primary/20">
                  <Users className="size-5 sm:size-6" />
                </div>
                <h3 className="text-base sm:text-lg font-bold text-foreground">Familia y Hogar</h3>
                <p className="mt-1.5 sm:mt-2 text-xs sm:text-sm font-medium text-muted-foreground leading-relaxed">
                  Toda la información importante de vuestro hogar y miembros centralizada en un solo sitio.
                </p>
              </div>

              {/* Feature 5 - Puntos y recompensas */}
              <div className="group flex flex-col rounded-3xl border border-border/80 bg-card/80 p-5 sm:p-6 shadow-soft transition-all duration-300 hover:border-primary/40 hover:-translate-y-1 hover:shadow-soft-lg">
                <div className="mb-3.5 sm:mb-4 flex size-11 sm:size-12 items-center justify-center rounded-2xl bg-primary/10 border border-primary/20 text-primary transition-colors group-hover:bg-primary/20">
                  <Trophy className="size-5 sm:size-6" />
                </div>
                <h3 className="text-base sm:text-lg font-bold text-foreground">Puntos y recompensas</h3>
                <p className="mt-1.5 sm:mt-2 text-xs sm:text-sm font-medium text-muted-foreground leading-relaxed">
                  Convierte las tareas diarias en retos divertidos y recompensas motivadoras.
                </p>
              </div>

              {/* Feature 6 - Recordatorios */}
              <div className="group flex flex-col rounded-3xl border border-border/80 bg-card/80 p-5 sm:p-6 shadow-soft transition-all duration-300 hover:border-primary/40 hover:-translate-y-1 hover:shadow-soft-lg">
                <div className="mb-3.5 sm:mb-4 flex size-11 sm:size-12 items-center justify-center rounded-2xl bg-primary/10 border border-primary/20 text-primary transition-colors group-hover:bg-primary/20">
                  <Bell className="size-5 sm:size-6" />
                </div>
                <h3 className="text-base sm:text-lg font-bold text-foreground">Recordatorios</h3>
                <p className="mt-1.5 sm:mt-2 text-xs sm:text-sm font-medium text-muted-foreground leading-relaxed">
                  No vuelvas a olvidar citas médicas, facturas o vencimientos de documentos importantes.
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* SECCIÓN “CÓMO FUNCIONA” */}
        <section id="como-funciona" className="py-12 sm:py-20 lg:py-24 scroll-mt-20">
          <div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8">
            <div className="mx-auto max-w-2xl text-center mb-8 sm:mb-14">
              <h2 className="text-2xl sm:text-3xl lg:text-4xl font-black tracking-tight text-foreground">
                Cómo funciona USYTask
              </h2>
              <p className="mt-2.5 sm:mt-3 text-sm sm:text-base font-medium text-muted-foreground text-balance">
                Tres sencillos pasos para poner todo en orden.
              </p>
            </div>

            <div className="grid grid-cols-1 gap-4 sm:gap-6 md:grid-cols-3">
              {/* Step 1 */}
              <div className="relative flex flex-col items-center text-center rounded-3xl border border-border/80 bg-card/80 p-6 sm:p-8 shadow-soft transition-all duration-300 hover:border-primary/40 hover:-translate-y-1">
                <span className="flex size-12 sm:size-14 items-center justify-center rounded-2xl bg-primary text-lg sm:text-xl font-black text-primary-foreground mb-4 sm:mb-6 shadow-soft">
                  1
                </span>
                <h3 className="text-lg sm:text-xl font-extrabold text-foreground mb-2">Crea tu espacio</h3>
                <p className="text-xs sm:text-sm font-medium text-muted-foreground leading-relaxed">
                  Crea un espacio para tu familia, pareja, compañeros de piso o para ti.
                </p>
              </div>

              {/* Step 2 */}
              <div className="relative flex flex-col items-center text-center rounded-3xl border border-border/80 bg-card/80 p-6 sm:p-8 shadow-soft transition-all duration-300 hover:border-primary/40 hover:-translate-y-1">
                <span className="flex size-12 sm:size-14 items-center justify-center rounded-2xl bg-primary text-lg sm:text-xl font-black text-primary-foreground mb-4 sm:mb-6 shadow-soft">
                  2
                </span>
                <h3 className="text-lg sm:text-xl font-extrabold text-foreground mb-2">Añade lo importante</h3>
                <p className="text-xs sm:text-sm font-medium text-muted-foreground leading-relaxed">
                  Tareas, eventos, compras, recordatorios y organización diaria.
                </p>
              </div>

              {/* Step 3 */}
              <div className="relative flex flex-col items-center text-center rounded-3xl border border-border/80 bg-card/80 p-6 sm:p-8 shadow-soft transition-all duration-300 hover:border-primary/40 hover:-translate-y-1">
                <span className="flex size-12 sm:size-14 items-center justify-center rounded-2xl bg-primary text-lg sm:text-xl font-black text-primary-foreground mb-4 sm:mb-6 shadow-soft">
                  3
                </span>
                <h3 className="text-lg sm:text-xl font-extrabold text-foreground mb-2">Tenlo todo bajo control</h3>
                <p className="text-xs sm:text-sm font-medium text-muted-foreground leading-relaxed">
                  Todos los miembros pueden ver y actualizar la información desde un único lugar.
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* TIPOS DE USUARIO */}
        <section className="border-t border-border/50 bg-secondary/30 py-12 sm:py-20 lg:py-24">
          <div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8">
            <div className="mx-auto max-w-2xl text-center mb-8 sm:mb-14">
              <h2 className="text-2xl sm:text-3xl lg:text-4xl font-black tracking-tight text-foreground">
                USYTask se adapta a vosotros.
              </h2>
              <p className="mt-2.5 sm:mt-3 text-sm sm:text-base font-medium text-muted-foreground text-balance">
                Sea cual sea la estructura de tu hogar o tu día a día, USYTask se ajusta a tus necesidades.
              </p>
            </div>

            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
              {/* Type 1 */}
              <div className="group flex flex-col rounded-3xl border border-border/80 bg-card/80 p-5 sm:p-6 shadow-soft transition-all duration-300 hover:border-primary/40 hover:-translate-y-1">
                <div className="mb-3.5 sm:mb-4 flex size-11 sm:size-12 items-center justify-center rounded-2xl bg-primary/10 border border-primary/20 text-primary transition-colors group-hover:bg-primary/20">
                  <Users className="size-5 sm:size-6" />
                </div>
                <h3 className="text-lg sm:text-xl font-extrabold text-foreground mb-1.5 sm:mb-2">Familia</h3>
                <p className="text-xs sm:text-sm font-medium text-muted-foreground leading-relaxed">
                  Organiza hijos, tareas, calendario y casa.
                </p>
              </div>

              {/* Type 2 */}
              <div className="group flex flex-col rounded-3xl border border-border/80 bg-card/80 p-5 sm:p-6 shadow-soft transition-all duration-300 hover:border-primary/40 hover:-translate-y-1">
                <div className="mb-3.5 sm:mb-4 flex size-11 sm:size-12 items-center justify-center rounded-2xl bg-primary/10 border border-primary/20 text-primary transition-colors group-hover:bg-primary/20">
                  <Heart className="size-5 sm:size-6" />
                </div>
                <h3 className="text-lg sm:text-xl font-extrabold text-foreground mb-1.5 sm:mb-2">Pareja</h3>
                <p className="text-xs sm:text-sm font-medium text-muted-foreground leading-relaxed">
                  Planes, compras, eventos y vida compartida.
                </p>
              </div>

              {/* Type 3 */}
              <div className="group flex flex-col rounded-3xl border border-border/80 bg-card/80 p-5 sm:p-6 shadow-soft transition-all duration-300 hover:border-primary/40 hover:-translate-y-1">
                <div className="mb-3.5 sm:mb-4 flex size-11 sm:size-12 items-center justify-center rounded-2xl bg-primary/10 border border-primary/20 text-primary transition-colors group-hover:bg-primary/20">
                  <HomeIcon className="size-5 sm:size-6" />
                </div>
                <h3 className="text-lg sm:text-xl font-extrabold text-foreground mb-1.5 sm:mb-2">Compañeros de piso</h3>
                <p className="text-xs sm:text-sm font-medium text-muted-foreground leading-relaxed">
                  Tareas, compra, organización y gastos del hogar.
                </p>
              </div>

              {/* Type 4 */}
              <div className="group flex flex-col rounded-3xl border border-border/80 bg-card/80 p-5 sm:p-6 shadow-soft transition-all duration-300 hover:border-primary/40 hover:-translate-y-1">
                <div className="mb-3.5 sm:mb-4 flex size-11 sm:size-12 items-center justify-center rounded-2xl bg-primary/10 border border-primary/20 text-primary transition-colors group-hover:bg-primary/20">
                  <User className="size-5 sm:size-6" />
                </div>
                <h3 className="text-lg sm:text-xl font-extrabold text-foreground mb-1.5 sm:mb-2">Personal</h3>
                <p className="text-xs sm:text-sm font-medium text-muted-foreground leading-relaxed">
                  Tus metas, hábitos, calendario y proyectos individuales.
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* CTA FINAL */}
        <section className="relative py-12 sm:py-20 lg:py-24">
          <div className="mx-auto max-w-4xl px-4 sm:px-6 lg:px-8">
            <div className="relative overflow-hidden rounded-3xl sm:rounded-[36px] bg-gradient-to-br from-primary via-primary/90 to-accent/90 p-6 sm:p-12 text-center text-primary-foreground shadow-2xl">
              <div className="relative z-10">
                <h2 className="text-2xl sm:text-4xl lg:text-5xl font-black tracking-tight text-balance">
                  Menos caos. Más control.
                </h2>
                <p className="mt-3 sm:mt-4 text-sm sm:text-base lg:text-lg font-medium opacity-90">
                  Empieza creando tu espacio USYTask.
                </p>
                <div className="mt-6 sm:mt-8 flex flex-col items-center justify-center gap-2.5">
                  <Link
                    href="/register"
                    onClick={handleCreateSpace}
                    className="inline-flex h-12 sm:h-14 w-full sm:w-auto items-center justify-center rounded-2xl bg-background px-8 text-sm sm:text-base font-bold text-foreground shadow-lg transition-transform active:scale-95 hover:bg-background/90"
                  >
                    Crear cuenta gratis
                  </Link>
                  <p className="mt-1.5 text-xs font-semibold opacity-80">
                    No necesitas instalar nada para empezar.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </section>
      </main>

      {/* FOOTER */}
      <footer className="border-t border-border/60 bg-card py-8 text-center text-xs font-medium text-muted-foreground">
        <div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <span className="font-bold text-foreground">USYTask</span>
            <span>— Universal System for Tasks</span>
          </div>
          <p>© {new Date().getFullYear()} USYTask. Todos los derechos reservados.</p>
        </div>
      </footer>
    </div>
  )
}
