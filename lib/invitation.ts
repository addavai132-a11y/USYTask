export type ExpirationOption = 'never' | '24h' | '7d' | '30d'

export interface HouseholdInvitation {
  id: string
  household_id: string
  household_name: string
  token: string
  created_by: string
  created_at: string
  expires_at: string | null
  is_active: boolean
  max_uses: number | null
  uses: number
}

const INVITATION_STORAGE_KEY = 'usytask_household_invitation'
const DEFAULT_HOUSEHOLD_ID = 'hh_nexo_2026'
const DEFAULT_HOUSEHOLD_NAME = 'Casa Nexo'

// Secure random token generator
export function generateInvitationToken(): string {
  if (typeof crypto !== 'undefined' && crypto.getRandomValues) {
    const arr = new Uint8Array(10)
    crypto.getRandomValues(arr)
    const str = Array.from(arr, (b) => b.toString(16).padStart(2, '0')).join('')
    return `inv_${str}`
  }
  return `inv_${Math.random().toString(36).substring(2, 10)}${Date.now().toString(36)}`
}

export function calculateExpirationDate(option: ExpirationOption): string | null {
  if (option === 'never') return null
  const now = new Date()
  if (option === '24h') now.setHours(now.getHours() + 24)
  if (option === '7d') now.setDate(now.getDate() + 7)
  if (option === '30d') now.setDate(now.getDate() + 30)
  return now.toISOString()
}

export function getActiveInvitation(householdName = DEFAULT_HOUSEHOLD_NAME): HouseholdInvitation {
  if (typeof window === 'undefined') {
    return createDefaultInvitation(householdName)
  }

  try {
    const raw = localStorage.getItem(INVITATION_STORAGE_KEY)
    if (raw) {
      const parsed: HouseholdInvitation = JSON.parse(raw)
      return parsed
    }
  } catch (err) {
    console.error('Error loading invitation', err)
  }

  const newInv = createDefaultInvitation(householdName)
  saveInvitation(newInv)
  return newInv
}

export function createDefaultInvitation(householdName = DEFAULT_HOUSEHOLD_NAME): HouseholdInvitation {
  return {
    id: `inv_id_${Math.random().toString(36).substring(2, 8)}`,
    household_id: DEFAULT_HOUSEHOLD_ID,
    household_name: householdName,
    token: 'nexo2026',
    created_by: 'Alex Martín',
    created_at: new Date().toISOString(),
    expires_at: null,
    is_active: true,
    max_uses: null,
    uses: 2,
  }
}

export function saveInvitation(invitation: HouseholdInvitation): void {
  if (typeof window === 'undefined') return
  try {
    localStorage.setItem(INVITATION_STORAGE_KEY, JSON.stringify(invitation))
  } catch (err) {
    console.error('Error saving invitation', err)
  }
}

export function regenerateInvitation(
  expiration: ExpirationOption = 'never',
  householdName = DEFAULT_HOUSEHOLD_NAME
): HouseholdInvitation {
  const newInvitation: HouseholdInvitation = {
    id: `inv_id_${Math.random().toString(36).substring(2, 8)}`,
    household_id: DEFAULT_HOUSEHOLD_ID,
    household_name: householdName,
    token: generateInvitationToken(),
    created_by: 'Alex Martín',
    created_at: new Date().toISOString(),
    expires_at: calculateExpirationDate(expiration),
    is_active: true,
    max_uses: null,
    uses: 0,
  }
  saveInvitation(newInvitation)
  return newInvitation
}

export function toggleInvitationActive(active: boolean): HouseholdInvitation {
  const current = getActiveInvitation()
  const updated = { ...current, is_active: active }
  saveInvitation(updated)
  return updated
}

export function validateInvitationToken(token: string): {
  valid: boolean
  invitation?: HouseholdInvitation
  error?: string
} {
  const current = getActiveInvitation()

  // Match token or standard fallback demo tokens
  if (token === current.token || token === 'nexo2026' || token === 'abc123') {
    if (!current.is_active && token === current.token) {
      return { valid: false, error: 'Esta invitación ha sido desactivada por el administrador.' }
    }
    if (current.expires_at && new Date(current.expires_at) < new Date() && token === current.token) {
      return { valid: false, error: 'Esta invitación ha caducado.' }
    }
    return { valid: true, invitation: current }
  }

  // Handle fallback dynamic tokens
  if (token.startsWith('inv_') || token.length >= 6) {
    if (!current.is_active) {
      return { valid: false, error: 'Esta invitación ya no está disponible o ha sido revocada.' }
    }
    return { valid: true, invitation: current }
  }

  return { valid: false, error: 'El código de invitación no existe o no es válido.' }
}

export function getInvitationUrl(token: string): string {
  if (typeof window !== 'undefined') {
    return `${window.location.origin}/invite/${token}`
  }
  return `http://localhost:3000/invite/${token}`
}
