import { generateInvitationToken } from './invitation'

export type SpaceType = 'family' | 'couple' | 'roommates' | 'personal' | 'other'

export interface SpaceMember {
  id: string
  name: string
  role: 'adult' | 'child'
  initials: string
  colorVar: string
  points: number
  streak: number
  isOwner?: boolean
}

export interface SpaceData {
  id: string
  name: string
  type: SpaceType
  icon: string
  createdAt: string
  inviteToken: string
  isOwner: boolean
  members: SpaceMember[]
  events: any[]
  tasks: any[]
  shoppingLists: any[]
  reminders: any[]
  expenses: any[]
  plans: any[]
  documents: any[]
  wishlists: any[]
  challenges: any[]
  rewards: any[]
  activities: any[]
}

const SPACES_LIST_KEY = 'usytask_spaces_list'
const ACTIVE_SPACE_ID_KEY = 'usytask_active_space_id'

export const spaceTypeLabels: Record<SpaceType, { label: string; icon: string }> = {
  family: { label: 'Familia', icon: '👨👩👧' },
  couple: { label: 'Pareja', icon: '❤️' },
  roommates: { label: 'Compañeros de piso', icon: '🏠' },
  personal: { label: 'Personal', icon: '👤' },
  other: { label: 'Otro espacio', icon: '✨' },
}

// Initial Demo Spaces for Dev Mode & Testing
const demoSpaces: SpaceData[] = [
  {
    id: 'space_rivera',
    name: 'Familia Rivera',
    type: 'family',
    icon: '👨👩👧',
    createdAt: '2026-01-10',
    inviteToken: 'rivera2026',
    isOwner: true,
    members: [
      { id: 'marcos', name: 'Alex', role: 'adult', initials: 'A', colorVar: 'member-marcos', points: 140, streak: 5, isOwner: true },
      { id: 'marieli', name: 'Lucía', role: 'adult', initials: 'L', colorVar: 'member-marieli', points: 110, streak: 4 },
      { id: 'adrian', name: 'Nico', role: 'child', initials: 'N', colorVar: 'member-adrian', points: 350, streak: 7 },
      { id: 'celia', name: 'Carla', role: 'child', initials: 'C', colorVar: 'member-celia', points: 280, streak: 3 },
    ],
    events: [
      { id: 'e1', title: 'Entrenamiento de Nico', time: '08:30', endTime: '10:00', member: 'adrian', category: 'deporte', dayOffset: 0, location: 'Polideportivo' },
      { id: 'e2', title: 'Dentista de Lucía', time: '11:00', endTime: '11:45', member: 'marieli', category: 'medico', dayOffset: 0, location: 'Clínica Sonrisa' },
      { id: 'e3', title: 'Comprar material', time: '18:00', member: 'marcos', category: 'casa', dayOffset: 0 },
      { id: 'e4', title: 'Cena familiar', time: '20:30', member: 'marcos', category: 'plan', dayOffset: 0, location: 'Casa' },
      { id: 'e5', title: 'Colegio Carla', time: '09:00', endTime: '14:00', member: 'celia', category: 'colegio', dayOffset: 1 },
      { id: 'e6', title: 'Reunión trabajo', time: '10:30', member: 'marcos', category: 'trabajo', dayOffset: 1 },
      { id: 'e7', title: 'Entrenamiento fútbol', time: '18:30', member: 'adrian', category: 'deporte', dayOffset: 1, location: 'Campo municipal' },
    ],
    tasks: [
      { id: 't1', title: 'Sacar basura', assignee: 'marcos', done: false, section: 'casa', priority: 'medium', points: 10 },
      { id: 't2', title: 'Ordenar habitación', assignee: 'adrian', done: false, section: 'hijos', priority: 'medium', points: 15, needsApproval: true },
      { id: 't3', title: 'Comprar leche', assignee: 'marieli', done: false, section: 'familia', priority: 'low', points: 5 },
      { id: 't4', title: 'Hacer la cama', assignee: 'adrian', done: true, section: 'hijos', priority: 'low', points: 5 },
      { id: 't6', title: 'Poner lavadora', assignee: 'marieli', done: false, section: 'casa', priority: 'medium', points: 10, recurring: 'Cada 2 días' },
      { id: 't10', title: 'Pagar factura luz', assignee: 'marcos', done: false, section: 'casa', priority: 'high', recurring: 'Mensual' },
    ],
    shoppingLists: [
      {
        id: 'mercadona',
        name: 'Mercadona',
        emoji: '🛒',
        items: [
          { id: 's1', name: 'Leche desnatada', category: 'lacteos', done: false, addedBy: 'marieli' },
          { id: 's2', name: 'Huevos campero', category: 'lacteos', done: false, addedBy: 'marcos' },
          { id: 's3', name: 'Pan de molde', category: 'despensa', done: false, addedBy: 'marieli' },
          { id: 's4', name: 'Manzanas y plátanos', category: 'fruta', done: false, addedBy: 'celia' },
          { id: 's5', name: 'Pechuga de pollo', category: 'carne', done: false, addedBy: 'marcos' },
        ],
      },
      { id: 'carrefour', name: 'Carrefour', emoji: '🏬', items: [] },
    ],
    reminders: [
      { id: 'r1', title: 'ITV del coche', daysLeft: 12, type: 'itv' },
      { id: 'r2', title: 'Pasaporte de Nico', daysLeft: 65, type: 'documento' },
      { id: 'r3', title: 'Dentista de Carla', daysLeft: 3, type: 'medico' },
    ],
    expenses: [
      { id: 'x1', title: 'Mercadona', amount: 84.2, category: 'alimentacion', member: 'marieli', date: 'Hoy' },
      { id: 'x2', title: 'Gasolina', amount: 61, category: 'transporte', member: 'marcos', date: 'Ayer' },
    ],
    plans: [
      { id: 'p1', title: 'Vacaciones Verano', emoji: '🇵🇹', date: '12–19 Ago', participants: ['marcos', 'marieli', 'adrian', 'celia'], checklistDone: 6, checklistTotal: 12 },
    ],
    documents: [
      { id: 'd1', name: 'DNI Alex', type: 'dni', owner: 'marcos', createdAt: 'Ene 2020', expiresAt: 'Ene 2030', emoji: '🪪' },
      { id: 'd2', name: 'Pasaporte Nico', type: 'pasaporte', owner: 'adrian', createdAt: 'Jun 2021', expiresAt: 'Oct 2026', daysLeft: 65, emoji: '🛂' },
      { id: 'd3', name: 'Seguro hogar', type: 'seguro', owner: 'marcos', createdAt: 'Feb 2024', expiresAt: 'Feb 2027', emoji: '🛡' },
    ],
    wishlists: [],
    challenges: [],
    rewards: [],
    activities: [],
  },
  {
    id: 'space_alex_lucia',
    name: 'Alex & Lucía',
    type: 'couple',
    icon: '❤️',
    createdAt: '2026-02-14',
    inviteToken: 'alexlucia2026',
    isOwner: true,
    members: [
      { id: 'marcos', name: 'Alex', role: 'adult', initials: 'A', colorVar: 'member-marcos', points: 180, streak: 8, isOwner: true },
      { id: 'marieli', name: 'Lucía', role: 'adult', initials: 'L', colorVar: 'member-marieli', points: 150, streak: 6 },
    ],
    events: [
      { id: 'el1', title: 'Cena viernes en Restaurante Italia', time: '21:00', member: 'marcos', category: 'plan', dayOffset: 1, location: 'Restaurante Italia' },
      { id: 'el2', title: 'Viaje a Lisboa (Escapada)', time: '10:00', member: 'marieli', category: 'plan', dayOffset: 3, location: 'Lisboa' },
      { id: 'el3', title: 'Reunión arquitecto piso', time: '17:30', member: 'marcos', category: 'trabajo', dayOffset: 2 },
    ],
    tasks: [
      { id: 'tl1', title: 'Comprar vino tinto para la cena', assignee: 'marcos', done: false, section: 'familia', priority: 'high', points: 10 },
      { id: 'tl2', title: 'Reservar hotel en Lisboa', assignee: 'marieli', done: true, section: 'mias', priority: 'high', points: 20 },
      { id: 'tl3', title: 'Regar plantas de la terraza', assignee: 'marcos', done: false, section: 'casa', priority: 'low', points: 5 },
      { id: 'tl4', title: 'Revisar presupuesto viaje', assignee: 'marieli', done: false, section: 'mias', priority: 'medium', points: 15 },
    ],
    shoppingLists: [
      {
        id: 'compra_pareja',
        name: 'Compra semanal pareja',
        emoji: '🍷',
        items: [
          { id: 'sl1', name: 'Vino tinto Rioja', category: 'despensa', done: false, addedBy: 'marcos' },
          { id: 'sl2', name: 'Queso Brie', category: 'lacteos', done: false, addedBy: 'marieli' },
          { id: 'sl3', name: 'Pasta fresca', category: 'despensa', done: true, addedBy: 'marcos' },
          { id: 'sl4', name: 'Aguacates', category: 'fruta', done: false, addedBy: 'marieli' },
          { id: 'sl5', name: 'Café de especialidad', category: 'despensa', done: false, addedBy: 'marcos' },
        ],
      },
      {
        id: 'equipaje_lisboa',
        name: 'Viaje Lisboa',
        emoji: '✈️',
        items: [
          { id: 'sl6', name: 'Guía de viaje', category: 'otros', done: false, addedBy: 'marieli' },
          { id: 'sl7', name: 'Protector solar', category: 'higiene', done: false, addedBy: 'marcos' },
        ],
      },
    ],
    reminders: [
      { id: 'rl1', title: 'Recordatorio aniversario de pareja', daysLeft: 5, type: 'otros' },
      { id: 'rl2', title: 'Seguro moto Vespa', daysLeft: 18, type: 'itv' },
    ],
    expenses: [
      { id: 'xl1', title: 'Cena Restaurante Italia', amount: 78.5, category: 'ocio', member: 'marcos', date: 'Ayer' },
      { id: 'xl2', title: 'Billetes avión Lisboa', amount: 140, category: 'ocio', member: 'marieli', date: 'Hace 2 días' },
      { id: 'xl3', title: 'Supermercado Gourmet', amount: 45.2, category: 'alimentacion', member: 'marieli', date: 'Hace 3 días' },
    ],
    plans: [
      { id: 'pl1', title: 'Fin de semana en Lisboa', emoji: '🇵🇹', date: '28-30 Ago', participants: ['marcos', 'marieli'], checklistDone: 4, checklistTotal: 5 },
    ],
    documents: [
      { id: 'dl1', name: 'Contrato alquiler piso', type: 'contrato', owner: 'marcos', createdAt: 'Ene 2025', expiresAt: 'Ene 2028', emoji: '📄' },
      { id: 'dl2', name: 'Seguro de viaje Lisboa', type: 'seguro', owner: 'marieli', createdAt: 'Ago 2026', expiresAt: 'Sep 2026', daysLeft: 10, emoji: '🛡' },
    ],
    wishlists: [],
    challenges: [],
    rewards: [],
    activities: [],
  },
]

export function getAllSpaces(): SpaceData[] {
  if (typeof window === 'undefined') return []
  try {
    const raw = localStorage.getItem(SPACES_LIST_KEY)
    if (raw) {
      const parsed: SpaceData[] = JSON.parse(raw)
      if (parsed.length > 0) return parsed
    }
  } catch (err) {
    console.error('Error loading spaces list', err)
  }

  // No saved data — return empty (no demo seeding)
  return []
}

export function saveAllSpaces(spaces: SpaceData[]): void {
  if (typeof window === 'undefined') return
  try {
    localStorage.setItem(SPACES_LIST_KEY, JSON.stringify(spaces))
  } catch (err) {
    console.error('Error saving spaces list', err)
  }
}

export function getActiveSpaceId(): string {
  if (typeof window === 'undefined') return 'space_rivera'
  try {
    const saved = localStorage.getItem(ACTIVE_SPACE_ID_KEY)
    if (saved) {
      const spaces = getAllSpaces()
      if (spaces.some((s) => s.id === saved)) {
        return saved
      }
    }
  } catch {}
  return 'space_rivera'
}

export function setActiveSpaceId(spaceId: string): void {
  if (typeof window === 'undefined') return
  try {
    localStorage.setItem(ACTIVE_SPACE_ID_KEY, spaceId)
    // Dispatch custom event so context updates immediately across components
    window.dispatchEvent(new CustomEvent('usytask_space_change', { detail: { spaceId } }))
  } catch (err) {
    console.error('Error setting active space ID', err)
  }
}

export function getActiveSpace(): SpaceData {
  const spaces = getAllSpaces()
  const activeId = getActiveSpaceId()
  return spaces.find((s) => s.id === activeId) || spaces[0] || demoSpaces[0]
}

export function createNewSpace(name: string, type: SpaceType): SpaceData {
  const spaces = getAllSpaces()
  const typeMeta = spaceTypeLabels[type] || spaceTypeLabels.other
  const newId = `space_${Math.random().toString(36).substring(2, 10)}`
  const token = generateInvitationToken()

  const newSpace: SpaceData = {
    id: newId,
    name: name.trim(),
    type,
    icon: typeMeta.icon,
    createdAt: new Date().toISOString().split('T')[0],
    inviteToken: token,
    isOwner: true,
    members: [
      {
        id: 'marcos',
        name: 'Alex',
        role: 'adult',
        initials: 'A',
        colorVar: 'member-marcos',
        points: 50,
        streak: 1,
        isOwner: true,
      },
    ],
    events: [],
    tasks: [
      {
        id: `t_${Date.now()}_1`,
        title: 'Dar la bienvenida al espacio',
        assignee: 'marcos',
        done: false,
        section: 'casa',
        priority: 'high',
        points: 10,
      },
    ],
    shoppingLists: [],
    reminders: [],
    expenses: [],
    plans: [],
    documents: [],
    wishlists: [],
    challenges: [],
    rewards: [],
    activities: [],
  }

  const updated = [newSpace, ...spaces]
  saveAllSpaces(updated)
  setActiveSpaceId(newId)
  return newSpace
}

export function updateSpaceName(spaceId: string, newName: string): SpaceData[] {
  const spaces = getAllSpaces()
  const updated = spaces.map((s) => (s.id === spaceId ? { ...s, name: newName.trim() } : s))
  saveAllSpaces(updated)
  window.dispatchEvent(new CustomEvent('usytask_space_change', { detail: { spaceId } }))
  return updated
}

export function deleteSpace(spaceId: string): SpaceData[] {
  const spaces = getAllSpaces()
  const filtered = spaces.filter((s) => s.id !== spaceId)
  saveAllSpaces(filtered)
  if (getActiveSpaceId() === spaceId && filtered.length > 0) {
    setActiveSpaceId(filtered[0].id)
  }
  return filtered
}

export function leaveSpace(spaceId: string): SpaceData[] {
  return deleteSpace(spaceId)
}
