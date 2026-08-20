import { UserProfile, setStoredSession, clearStoredSession, calculateAge } from './user-session'

const DEV_MODE_KEY = 'usytask_dev_mode'

/**
 * Strictly checks if the application is running in a local development environment.
 * NEVER returns true in production environments.
 */
export function isDevEnvironment(): boolean {
  if (typeof window === 'undefined') {
    return process.env.NODE_ENV === 'development'
  }
  const isLocalhost =
    window.location.hostname === 'localhost' ||
    window.location.hostname === '127.0.0.1' ||
    window.location.hostname.endsWith('.local')
  return process.env.NODE_ENV === 'development' || isLocalhost
}

/**
 * Checks if Dev Mode switch is currently ON in localStorage.
 */
export function isDevModeActive(): boolean {
  if (!isDevEnvironment()) return false
  if (typeof window === 'undefined') return false
  try {
    return localStorage.getItem(DEV_MODE_KEY) === '1'
  } catch {
    return false
  }
}

/**
 * Activates Dev Mode and seeds demo user session (Alex Martín / Casa Nexo).
 */
export function enableDevMode(): void {
  if (!isDevEnvironment()) return
  try {
    localStorage.setItem(DEV_MODE_KEY, '1')
    localStorage.setItem('lifeos-onboarded', '1')

    const demoUser: UserProfile = {
      id: 'usr_demo_alex',
      fullName: 'Alex Martín',
      username: 'alex_martin',
      dateOfBirth: '1995-06-15',
      age: calculateAge('1995-06-15'),
      email: 'alex.martin@usytask.demo',
      avatarUrl: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80',
      authProvider: 'email',
      profileCompleted: true,
      createdAt: new Date().toISOString(),
    }

    setStoredSession(demoUser)
  } catch (err) {
    console.error('Error enabling dev mode', err)
  }
}

/**
 * Disables Dev Mode, clears demo state, and cleans session.
 */
export function disableDevMode(): void {
  try {
    if (typeof window !== 'undefined') {
      localStorage.removeItem(DEV_MODE_KEY)
      localStorage.removeItem('lifeos-onboarded')
      clearStoredSession()
    }
  } catch (err) {
    console.error('Error disabling dev mode', err)
  }
}

/**
 * Toggles Dev Mode state.
 */
export function toggleDevMode(active: boolean): void {
  if (active) {
    enableDevMode()
  } else {
    disableDevMode()
  }
}
