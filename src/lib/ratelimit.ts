/**
 * Rate limiting for Kjørebok
 *
 * Bruker en enkel in-memory løsning som fungerer per Vercel-instans.
 * For produksjon med høy trafikk: bytt til Upstash Redis (gratis tier).
 *
 * Grenser:
 * - Registrering:    5 forsøk per IP per time
 * - Innlogging:      10 forsøk per IP per 15 min
 * - Promo-koder:     5 forsøk per IP per time
 * - Generelt:        100 requests per IP per minutt
 */

interface RateLimitEntry {
  count: number
  resetAt: number
}

// In-memory store — tilstrekkelig for denne appens skala
const store = new Map<string, RateLimitEntry>()

// Rydd opp utløpte entries hvert 5. minutt
setInterval(() => {
  const now = Date.now()
  for (const [key, entry] of store.entries()) {
    if (entry.resetAt < now) store.delete(key)
  }
}, 5 * 60 * 1000)

export function checkRateLimit(
  key: string,
  limit: number,
  windowMs: number
): { allowed: boolean; remaining: number; resetIn: number } {
  const now = Date.now()
  const entry = store.get(key)

  if (!entry || entry.resetAt < now) {
    store.set(key, { count: 1, resetAt: now + windowMs })
    return { allowed: true, remaining: limit - 1, resetIn: windowMs }
  }

  if (entry.count >= limit) {
    return {
      allowed: false,
      remaining: 0,
      resetIn: entry.resetAt - now,
    }
  }

  entry.count++
  return {
    allowed: true,
    remaining: limit - entry.count,
    resetIn: entry.resetAt - now,
  }
}

// Ferdigdefinerte grenser
export const limits = {
  register: (ip: string) =>
    checkRateLimit(`register:${ip}`, 5, 60 * 60 * 1000),       // 5/time
  login: (ip: string) =>
    checkRateLimit(`login:${ip}`, 10, 15 * 60 * 1000),         // 10/15min
  promo: (ip: string) =>
    checkRateLimit(`promo:${ip}`, 5, 60 * 60 * 1000),          // 5/time
  general: (ip: string) =>
    checkRateLimit(`general:${ip}`, 100, 60 * 1000),           // 100/min
}
