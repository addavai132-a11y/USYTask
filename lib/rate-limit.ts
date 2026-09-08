export const rateLimitCache = new Map<string, { count: number; expiresAt: number }>()

export function checkRateLimit(ip: string, limit: number = 10, windowMs: number = 60000): boolean {
  const now = Date.now()
  const current = rateLimitCache.get(ip)

  if (!current) {
    rateLimitCache.set(ip, { count: 1, expiresAt: now + windowMs })
    return true
  }

  if (now > current.expiresAt) {
    rateLimitCache.set(ip, { count: 1, expiresAt: now + windowMs })
    return true
  }

  if (current.count >= limit) {
    return false
  }

  current.count++
  return true
}

// Memory leak protection - sweep expired entries
setInterval(() => {
  const now = Date.now()
  for (const [key, value] of rateLimitCache.entries()) {
    if (now > value.expiresAt) {
      rateLimitCache.delete(key)
    }
  }
}, 60000)
