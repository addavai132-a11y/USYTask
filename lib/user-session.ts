export interface UserProfile {
  id: string
  fullName: string
  username: string
  dateOfBirth?: string | null
  age?: number | null
  email: string
  avatarUrl?: string
  authProvider: 'google' | 'email'
  profileCompleted: boolean
  createdAt: string
  points?: number
  isPremium?: boolean
  premiumUntil?: string | null
  premiumPlan?: string | null
}

const SESSION_KEY = 'usytask_user_session'
const USERS_DB_KEY = 'usytask_users_db'

// Generate unique internal ID (independent of display username)
export function generateUserId(): string {
  return 'usr_' + Math.random().toString(36).substring(2, 11)
}

// Dynamic age calculator based on date of birth
export function calculateAge(dateOfBirth: string | null | undefined): number | null {
  if (!dateOfBirth) return null
  const birth = new Date(dateOfBirth)
  if (isNaN(birth.getTime())) return null
  const today = new Date()
  let age = today.getFullYear() - birth.getFullYear()
  const monthDiff = today.getMonth() - birth.getMonth()
  if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birth.getDate())) {
    age--
  }
  return age < 0 ? null : age
}

// Get current session
export function getStoredSession(): UserProfile | null {
  if (typeof window === 'undefined') return null
  try {
    const raw = localStorage.getItem(SESSION_KEY)
    if (!raw) return null
    const parsed: UserProfile = JSON.parse(raw)
    // Compute age dynamically if dateOfBirth is present
    if (parsed.dateOfBirth) {
      parsed.age = calculateAge(parsed.dateOfBirth)
    }
    return parsed
  } catch {
    return null
  }
}

// Set session
export function setStoredSession(user: UserProfile): void {
  if (typeof window === 'undefined') return
  try {
    if (user.dateOfBirth) {
      user.age = calculateAge(user.dateOfBirth)
    }
    localStorage.setItem(SESSION_KEY, JSON.stringify(user))
    saveUserToDb(user)
  } catch (err) {
    console.error('Error saving user session', err)
  }
}

// Clear session
export function clearStoredSession(): void {
  if (typeof window === 'undefined') return
  try {
    localStorage.removeItem(SESSION_KEY)
  } catch {}
}

// Get all registered users from DB
export function getAllUsersFromDb(): UserProfile[] {
  if (typeof window === 'undefined') return []
  try {
    const raw = localStorage.getItem(USERS_DB_KEY)
    return raw ? JSON.parse(raw) : []
  } catch {
    return []
  }
}

// Save user to DB
export function saveUserToDb(user: UserProfile): void {
  if (typeof window === 'undefined') return
  try {
    const users = getAllUsersFromDb()
    const idx = users.findIndex((u) => u.email.toLowerCase() === user.email.toLowerCase() || u.id === user.id)
    if (idx >= 0) {
      users[idx] = { ...users[idx], ...user }
    } else {
      users.push(user)
    }
    localStorage.setItem(USERS_DB_KEY, JSON.stringify(users))
  } catch (err) {
    console.error('Error saving user to DB', err)
  }
}

// Find user by email
export function findUserByEmail(email: string): UserProfile | null {
  const users = getAllUsersFromDb()
  const found = users.find((u) => u.email.toLowerCase() === email.toLowerCase()) || null
  if (found && found.dateOfBirth) {
    found.age = calculateAge(found.dateOfBirth)
  }
  return found
}

// Username Validation Helper
export function sanitizeUsername(input: string): string {
  return input.replace(/\s+/g, ' ').trim()
}

export function validateUsername(input: string): { valid: boolean; error?: string } {
  const clean = sanitizeUsername(input)
  if (!clean) {
    return { valid: false, error: 'El nombre de usuario es obligatorio.' }
  }
  if (clean.length < 3) {
    return { valid: false, error: 'El nombre de usuario debe tener al menos 3 caracteres.' }
  }
  if (clean.length > 30) {
    return { valid: false, error: 'El nombre de usuario no debe superar los 30 caracteres.' }
  }
  const allowedRegex = /^[a-zA-Z0-9áéíóúüñÁÉÍÓÚÜÑ\s._'-]+$/
  if (!allowedRegex.test(clean)) {
    return {
      valid: false,
      error: 'Solo se permiten letras, números, espacios, guion (-), guion bajo (_), punto (.) y apóstrofe (\').',
    }
  }
  if (/[@#<>/\\]/.test(clean)) {
    return { valid: false, error: 'No se permiten símbolos como @, #, <, >, / ni \\.' }
  }
  return { valid: true }
}

// Date of Birth Validation Helper
export function validateDateOfBirth(input: string): { valid: boolean; error?: string; value: string | null } {
  if (!input || !input.trim()) {
    return { valid: false, error: 'Por favor, selecciona tu fecha de nacimiento.', value: null }
  }
  const birthDate = new Date(input)
  if (isNaN(birthDate.getTime())) {
    return { valid: false, error: 'Por favor, selecciona una fecha de nacimiento válida.', value: null }
  }
  const today = new Date()
  today.setHours(23, 59, 59, 999)
  if (birthDate > today) {
    return { valid: false, error: 'La fecha de nacimiento no puede ser en el futuro.', value: null }
  }

  const minDate = new Date()
  minDate.setFullYear(minDate.getFullYear() - 120)
  if (birthDate < minDate) {
    return { valid: false, error: 'Por favor, selecciona una fecha de nacimiento válida (máximo 120 años).', value: null }
  }

  return { valid: true, value: input.trim() }
}
