// USYTask — Date utilities

export function getGreeting(): string {
  const h = new Date().getHours()
  if (h < 6) return 'Buenas noches'
  if (h < 14) return 'Buenos días'
  if (h < 21) return 'Buenas tardes'
  return 'Buenas noches'
}

export function getTodayLabel(): string {
  const d = new Date()
  const formatted = new Intl.DateTimeFormat('es-ES', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
  }).format(d)
  return formatted.charAt(0).toUpperCase() + formatted.slice(1)
}

/**
 * Retorna la fecha actual en formato local YYYY-MM-DD
 */
export function getTodayISO(): string {
  const d = new Date()
  const year = d.getFullYear()
  const month = String(d.getMonth() + 1).padStart(2, '0')
  const day = String(d.getDate()).padStart(2, '0')
  return `${year}-${month}-${day}`
}

/**
 * Retorna la hora actual en formato local HH:mm
 */
export function getCurrentTimeHHMM(): string {
  const d = new Date()
  const hours = String(d.getHours()).padStart(2, '0')
  const minutes = String(d.getMinutes()).padStart(2, '0')
  return `${hours}:${minutes}`
}

/**
 * Comprueba si una fecha (y opcionalmente hora) dada es anterior al momento actual del sistema.
 */
export function isPastDateTime(dateISO?: string, timeStr?: string): boolean {
  if (!dateISO) return false
  const now = new Date()
  const [y, m, d] = dateISO.split('-').map(Number)
  if (!y || !m || !d) return false

  if (timeStr && timeStr.includes(':')) {
    const [hh, mm] = timeStr.split(':').map(Number)
    const target = new Date(y, m - 1, d, hh || 0, mm || 0, 0, 0)
    return target.getTime() < now.getTime()
  } else {
    // Si solo hay fecha sin hora, comparamos si el día es anterior a hoy
    const todayISO = getTodayISO()
    return dateISO < todayISO
  }
}

export function daysUntil(dateStr: string): number {
  const target = new Date(dateStr)
  const now = new Date()
  now.setHours(0, 0, 0, 0)
  target.setHours(0, 0, 0, 0)
  return Math.max(0, Math.ceil((target.getTime() - now.getTime()) / (1000 * 60 * 60 * 24)))
}

export function getDayOfWeekFromDate(dateISO: string): string {
  try {
    const d = new Date(dateISO + 'T00:00:00')
    if (isNaN(d.getTime())) return ''
    const map = ['domingo', 'lunes', 'martes', 'miercoles', 'jueves', 'viernes', 'sabado']
    return map[d.getDay()] || ''
  } catch {
    return ''
  }
}
