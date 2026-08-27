'use client'

import { useState } from 'react'
import {
  X,
  ArrowRight,
  ArrowLeft,
  Check,
  Copy,
  Users,
  Home,
  Heart,
  User,
  ShieldCheck,
  Sparkles,
  Share2,
  MessageCircle,
} from 'lucide-react'
import { useApp } from './app-context'
import { useToast } from '@/components/ui/toast'
import type { GroupType } from '@/types'
import { generateHouseholdCode } from '@/lib/group-store'
import { getInvitationUrl } from '@/lib/invitation'
import { cn } from '@/lib/utils'

interface SpaceTypeOption {
  id: GroupType
  title: string
  subtitle: string
  icon: string
  badge: string
}

const SPACE_TYPES: SpaceTypeOption[] = [
  {
    id: 'family',
    title: 'Familia',
    subtitle: 'Para hogares familiares con padres, hijos o tutores.',
    icon: '👨‍👩‍👧‍👦',
    badge: 'Hogar Familiar',
  },
  {
    id: 'roommates',
    title: 'Piso Compartido',
    subtitle: 'Para compañeros de piso, amigos o alquiler conjunto.',
    icon: '🏠',
    badge: 'Compañeros',
  },
  {
    id: 'couple',
    title: 'Pareja',
    subtitle: 'Para convivencia en pareja y metas en común.',
    icon: '💑',
    badge: 'Pareja',
  },
  {
    id: 'personal',
    title: 'Personal / Proyecto',
    subtitle: 'Para uso individual, hábitos o proyectos personales.',
    icon: '👤',
    badge: 'Individual',
  },
]

interface RoleOption {
  id: string
  title: string
  description: string
  icon: string
}

function getRolesForSpaceType(type: GroupType): RoleOption[] {
  switch (type) {
    case 'family':
      return [
        {
          id: 'adult',
          title: 'Adulto / Padre / Madre',
          description: 'Gestión completa del hogar, finanzas y retos con puntos.',
          icon: '👑',
        },
        {
          id: 'tutor',
          title: 'Tutor / Supervisor',
          description: 'Supervisión de actividades, tareas y calendario del hogar.',
          icon: '🛡️',
        },
      ]
    case 'roommates':
      return [
        {
          id: 'admin_piso',
          title: 'Administrador del Piso',
          description: 'Coordinación de gastos, facturas comunes y reparto de tareas.',
          icon: '🔑',
        },
        {
          id: 'roommate',
          title: 'Compañero / Inquilino',
          description: 'Participación en el reparto de tareas y gastos compartidos.',
          icon: '🤝',
        },
      ]
    case 'couple':
      return [
        {
          id: 'principal',
          title: 'Miembro de la Pareja',
          description: 'Gestión conjunta de presupuesto, citas y proyectos.',
          icon: '❤️',
        },
      ]
    case 'personal':
    default:
      return [
        {
          id: 'principal',
          title: 'Propietario / Titular',
          description: 'Control y organización integral de tu espacio privado.',
          icon: '👤',
        },
      ]
  }
}

export function CreateSpaceModal() {
  const { createGroupModalOpen, closeCreateGroupModal, createGroup, switchGroup } = useApp()
  const { toast } = useToast()

  // Steps: 1 = Basic Info & Type, 2 = Creator Role, 3 = Success & Code
  const [step, setStep] = useState<1 | 2 | 3>(1)

  // Form State
  const [name, setName] = useState('')
  const [type, setType] = useState<GroupType>('family')
  const [selectedRole, setSelectedRole] = useState<string>('adult')

  // Generated Result State
  const [createdGroupId, setCreatedGroupId] = useState<string>('')
  const [generatedCode, setGeneratedCode] = useState<string>('')
  const [copiedCode, setCopiedCode] = useState(false)
  const [copiedLink, setCopiedLink] = useState(false)

  if (!createGroupModalOpen) return null

  const resetForm = () => {
    setName('')
    setType('family')
    setSelectedRole('adult')
    setStep(1)
    setCreatedGroupId('')
    setGeneratedCode('')
    setCopiedCode(false)
    setCopiedLink(false)
  }

  const handleClose = () => {
    resetForm()
    closeCreateGroupModal()
  }

  const handleSelectType = (newType: GroupType) => {
    setType(newType)
    const defaultRoles = getRolesForSpaceType(newType)
    if (defaultRoles.length > 0) {
      setSelectedRole(defaultRoles[0].id)
    }
  }

  const handleNextStep1 = (e: React.FormEvent) => {
    e.preventDefault()
    if (!name.trim()) {
      toast('Por favor, escribe un nombre para el espacio', '⚠️')
      return
    }
    setStep(2)
  }

  const handleCreateSpace = () => {
    if (!name.trim()) return

    // Generar código alfanumérico formateado HOG-XXXX
    const code = generateHouseholdCode()
    const newGroup = createGroup(name.trim(), type, selectedRole, code)

    setCreatedGroupId(newGroup.id)
    setGeneratedCode(code)
    setStep(3)

    toast(`¡Espacio "${name.trim()}" creado con éxito! 🎉`, '🏠')
  }

  const handleCopyCode = () => {
    if (typeof navigator !== 'undefined' && generatedCode) {
      navigator.clipboard.writeText(generatedCode)
      setCopiedCode(true)
      toast('Código copiado al portapapeles', '🔑')
      setTimeout(() => setCopiedCode(false), 2000)
    }
  }

  const handleCopyLink = () => {
    if (typeof navigator !== 'undefined' && generatedCode) {
      const url = getInvitationUrl(generatedCode)
      navigator.clipboard.writeText(url)
      setCopiedLink(true)
      toast('Enlace copiado al portapapeles', '📋')
      setTimeout(() => setCopiedLink(false), 2000)
    }
  }

  const handleWhatsApp = () => {
    if (!generatedCode) return
    const url = getInvitationUrl(generatedCode)
    const text = encodeURIComponent(
      `¡Hola! He creado el espacio "${name}" en USYTask.\n\n🔑 Código para unirte: ${generatedCode}\n🔗 Enlace directo:\n${url}`
    )
    window.open(`https://wa.me/?text=${text}`, '_blank')
  }

  const handleFinishAndEnter = () => {
    if (createdGroupId) {
      switchGroup(createdGroupId)
    }
    handleClose()
  }

  const currentRoleOptions = getRolesForSpaceType(type)
  const inviteUrl = generatedCode ? getInvitationUrl(generatedCode) : ''

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-background/80 backdrop-blur-md p-3 sm:p-4 animate-fade-in">
      <div className="relative w-full max-w-lg rounded-3xl border border-slate-200 bg-white p-5 sm:p-6 shadow-2xl animate-in zoom-in-95 duration-150 flex flex-col max-h-[92vh] overflow-hidden dark:border-purple-500/30 dark:bg-[#100e23]">
        {/* Cabecera */}
        <div className="flex items-center justify-between pb-3 border-b border-slate-200/80 dark:border-purple-500/20 shrink-0">
          <div className="flex items-center gap-2.5">
            <div className="flex size-10 items-center justify-center rounded-2xl bg-emerald-50 border border-emerald-200 text-emerald-700 dark:bg-purple-500/20 dark:border-purple-500/30 dark:text-purple-300 font-bold shrink-0">
              {step === 3 ? '🎉' : <Home className="size-5" />}
            </div>
            <div>
              <h2 className="text-base sm:text-lg font-black text-slate-900 dark:text-white">
                {step === 1 && '1. Crear Nuevo Espacio'}
                {step === 2 && '2. Tu Rol en el Espacio'}
                {step === 3 && '¡Espacio Listo!'}
              </h2>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                {step === 1 && 'Elige el tipo de convivencia y nombre del hogar'}
                {step === 2 && 'Define tus permisos y responsabilidades iniciales'}
                {step === 3 && 'Comparte el código con los demás integrantes'}
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={handleClose}
            className="rounded-full p-1.5 text-slate-400 hover:text-slate-700 hover:bg-slate-100 dark:hover:text-white dark:hover:bg-white/10 transition-colors"
          >
            <X className="size-5" />
          </button>
        </div>

        {/* Indicador de Progreso */}
        <div className="flex items-center gap-1.5 pt-3 pb-1 shrink-0">
          <div className={cn('h-1.5 flex-1 rounded-full transition-all', step >= 1 ? 'bg-emerald-600 dark:bg-purple-500' : 'bg-slate-200 dark:bg-white/10')} />
          <div className={cn('h-1.5 flex-1 rounded-full transition-all', step >= 2 ? 'bg-emerald-600 dark:bg-purple-500' : 'bg-slate-200 dark:bg-white/10')} />
          <div className={cn('h-1.5 flex-1 rounded-full transition-all', step >= 3 ? 'bg-emerald-600 dark:bg-purple-500' : 'bg-slate-200 dark:bg-white/10')} />
        </div>

        {/* Contenido Dinámico de los Pasos */}
        <div className="flex-1 overflow-y-auto space-y-4 py-3 pr-1 sm:pr-2 text-xs custom-fitness-scroll">
          {/* ========================================================================= */}
          {/* PASO 1: DATOS BÁSICOS Y TIPO DE ESPACIO                                   */}
          {/* ========================================================================= */}
          {step === 1 && (
            <form onSubmit={handleNextStep1} className="space-y-4">
              {/* Nombre del Espacio */}
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-700 dark:text-slate-300">
                  Nombre del espacio <span className="text-rose-500">*</span>
                </label>
                <input
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Ej: Casa Martín, Piso Estudiantes, Nuestro Hogar..."
                  autoFocus
                  required
                  className="w-full rounded-2xl border border-slate-200 bg-slate-50 py-3 px-4 text-sm font-semibold text-slate-900 outline-none focus:border-emerald-500 focus:bg-white transition-all dark:border-purple-500/30 dark:bg-white/[0.04] dark:text-white dark:focus:border-purple-400"
                />
              </div>

              {/* Selector de Tipo de Espacio */}
              <div className="space-y-2">
                <label className="text-xs font-bold text-slate-700 dark:text-slate-300">
                  Tipo de convivencia
                </label>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                  {SPACE_TYPES.map((st) => {
                    const isSelected = type === st.id
                    return (
                      <button
                        key={st.id}
                        type="button"
                        onClick={() => handleSelectType(st.id)}
                        className={cn(
                          'flex items-start gap-3 p-3 rounded-2xl border text-left transition-all active:scale-[0.98]',
                          isSelected
                            ? 'bg-emerald-50 border-emerald-500 ring-1 ring-emerald-500 shadow-sm dark:bg-purple-600/15 dark:border-purple-500 dark:ring-purple-400'
                            : 'bg-slate-50 border-slate-200 hover:bg-slate-100/80 hover:border-slate-300 dark:bg-white/[0.02] dark:border-white/10 dark:hover:bg-white/[0.05]'
                        )}
                      >
                        <span className="text-2xl shrink-0 mt-0.5">{st.icon}</span>
                        <div className="min-w-0 flex-1">
                          <div className="flex items-center justify-between gap-1">
                            <span className="font-bold text-slate-900 dark:text-white text-xs">
                              {st.title}
                            </span>
                            {isSelected && (
                              <span className="flex size-4 items-center justify-center rounded-full bg-emerald-600 text-white dark:bg-purple-600">
                                <Check className="size-2.5" />
                              </span>
                            )}
                          </div>
                          <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5 leading-snug">
                            {st.subtitle}
                          </p>
                        </div>
                      </button>
                    )
                  })}
                </div>
              </div>
            </form>
          )}

          {/* ========================================================================= */}
          {/* PASO 2: DEFINIR EL ROL DEL CREADOR                                        */}
          {/* ========================================================================= */}
          {step === 2 && (
            <div className="space-y-4 animate-fade-in">
              <div className="p-3 rounded-2xl bg-emerald-50/70 border border-emerald-200 dark:bg-purple-500/10 dark:border-purple-500/20 text-xs text-slate-700 dark:text-slate-300 flex items-center gap-2">
                <ShieldCheck className="size-4 text-emerald-600 dark:text-purple-400 shrink-0" />
                <span>
                  Creando <strong>{name}</strong> ({SPACE_TYPES.find((s) => s.id === type)?.title})
                </span>
              </div>

              <div className="space-y-2">
                <label className="text-xs font-bold text-slate-700 dark:text-slate-300">
                  Selecciona tu rol en este espacio
                </label>
                <div className="space-y-2">
                  {currentRoleOptions.map((ro) => {
                    const isSelected = selectedRole === ro.id
                    return (
                      <button
                        key={ro.id}
                        type="button"
                        onClick={() => setSelectedRole(ro.id)}
                        className={cn(
                          'w-full flex items-start gap-3 p-3.5 rounded-2xl border text-left transition-all active:scale-[0.98]',
                          isSelected
                            ? 'bg-emerald-50 border-emerald-500 ring-1 ring-emerald-500 shadow-sm dark:bg-purple-600/15 dark:border-purple-500 dark:ring-purple-400'
                            : 'bg-slate-50 border-slate-200 hover:bg-slate-100/80 hover:border-slate-300 dark:bg-white/[0.02] dark:border-white/10 dark:hover:bg-white/[0.05]'
                        )}
                      >
                        <span className="text-2xl shrink-0">{ro.icon}</span>
                        <div className="min-w-0 flex-1">
                          <div className="flex items-center justify-between gap-1">
                            <span className="font-bold text-slate-900 dark:text-white text-xs sm:text-sm">
                              {ro.title}
                            </span>
                            {isSelected && (
                              <span className="flex size-4 items-center justify-center rounded-full bg-emerald-600 text-white dark:bg-purple-600">
                                <Check className="size-2.5" />
                              </span>
                            )}
                          </div>
                          <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">
                            {ro.description}
                          </p>
                        </div>
                      </button>
                    )
                  })}
                </div>
              </div>
            </div>
          )}

          {/* ========================================================================= */}
          {/* PASO 3: CÓDIGO GENERADO Y PANTALLA DE ÉXITO                                */}
          {/* ========================================================================= */}
          {step === 3 && (
            <div className="space-y-4 animate-in zoom-in-95 duration-200">
              <div className="p-4 rounded-3xl bg-emerald-50 border border-emerald-200 text-center space-y-3 dark:bg-purple-950/40 dark:border-purple-500/30">
                <div className="flex items-center justify-center gap-1.5 text-emerald-800 dark:text-purple-300 font-extrabold text-xs uppercase tracking-wider">
                  <Sparkles className="size-4" />
                  <span>Código de Unión del Hogar</span>
                </div>

                <div className="py-2 px-3 rounded-2xl bg-white border border-emerald-200 shadow-sm dark:bg-[#16132f] dark:border-purple-500/40">
                  <span className="font-mono text-lg sm:text-xl font-bold tracking-wider break-all text-slate-900 dark:text-white select-all text-center block">
                    {generatedCode}
                  </span>
                </div>

                <p className="text-xs text-slate-600 dark:text-slate-400">
                  Comparte este código con tus familiares o compañeros para que entren a “<strong>{name}</strong>”.
                </p>

                <button
                  type="button"
                  onClick={handleCopyCode}
                  className="w-full flex items-center justify-center gap-2 py-2.5 px-4 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs shadow-sm transition-all active:scale-95 dark:bg-purple-600 dark:hover:bg-purple-500"
                >
                  {copiedCode ? <Check className="size-4" /> : <Copy className="size-4" />}
                  <span>{copiedCode ? '¡Código copiado al portapapeles!' : 'Copiar código'}</span>
                </button>
              </div>

              {/* Acciones de Difusión */}
              <div className="space-y-2">
                <div className="flex items-center gap-2 p-2 rounded-xl bg-slate-100 border border-slate-200 dark:bg-white/[0.04] dark:border-white/10 text-xs">
                  <span className="truncate font-mono text-slate-600 dark:text-slate-400 flex-1 pl-1">
                    {inviteUrl}
                  </span>
                  <button
                    type="button"
                    onClick={handleCopyLink}
                    className="px-2.5 py-1 rounded-lg bg-white hover:bg-slate-50 text-slate-800 border border-slate-200 font-bold text-xs shadow-2xs dark:bg-white/10 dark:text-white dark:border-white/10 shrink-0"
                  >
                    {copiedLink ? 'Copiado' : 'Copiar Enlace'}
                  </button>
                </div>

                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={handleWhatsApp}
                    className="flex items-center justify-center gap-2 py-2.5 px-3 rounded-xl bg-[#25D366] hover:bg-[#20bd5a] text-white font-bold text-xs shadow-sm transition-transform active:scale-95"
                  >
                    <MessageCircle className="size-4 fill-white" />
                    <span>WhatsApp</span>
                  </button>
                  <button
                    type="button"
                    onClick={handleCopyLink}
                    className="flex items-center justify-center gap-2 py-2.5 px-3 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-800 border border-slate-200 font-bold text-xs transition-transform active:scale-95 dark:bg-white/10 dark:hover:bg-white/15 dark:text-white dark:border-white/10"
                  >
                    <Share2 className="size-4 text-emerald-600 dark:text-purple-400" />
                    <span>Compartir</span>
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Barra de Acciones Inferior */}
        <div className="pt-3 border-t border-slate-200/80 dark:border-purple-500/20 flex items-center justify-between shrink-0">
          {step === 1 && (
            <div className="flex items-center justify-between w-full">
              <button
                type="button"
                onClick={handleClose}
                className="px-4 py-2 text-xs font-bold text-slate-500 hover:text-slate-900 dark:hover:text-white transition-colors"
              >
                Cancelar
              </button>
              <button
                type="button"
                onClick={handleNextStep1}
                disabled={!name.trim()}
                className="flex items-center gap-1.5 px-5 py-2.5 rounded-2xl bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 text-white font-bold text-xs transition-all active:scale-95 shadow-sm dark:bg-purple-600 dark:hover:bg-purple-500"
              >
                <span>Continuar</span>
                <ArrowRight className="size-4" />
              </button>
            </div>
          )}

          {step === 2 && (
            <div className="flex items-center justify-between w-full">
              <button
                type="button"
                onClick={() => setStep(1)}
                className="flex items-center gap-1 px-3 py-2 text-xs font-bold text-slate-500 hover:text-slate-900 dark:hover:text-white transition-colors"
              >
                <ArrowLeft className="size-3.5" />
                <span>Atrás</span>
              </button>
              <button
                type="button"
                onClick={handleCreateSpace}
                className="flex items-center gap-1.5 px-6 py-2.5 rounded-2xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs transition-all active:scale-95 shadow-sm dark:bg-purple-600 dark:hover:bg-purple-500"
              >
                <span>Crear Espacio</span>
                <Sparkles className="size-4" />
              </button>
            </div>
          )}

          {step === 3 && (
            <button
              type="button"
              onClick={handleFinishAndEnter}
              className="w-full flex items-center justify-center gap-2 py-3 rounded-2xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs sm:text-sm shadow-md transition-all active:scale-[0.99] dark:bg-purple-600 dark:hover:bg-purple-500"
            >
              <span>Entrar al espacio / Dashboard</span>
              <ArrowRight className="size-4" />
            </button>
          )}
        </div>
      </div>
    </div>
  )
}
