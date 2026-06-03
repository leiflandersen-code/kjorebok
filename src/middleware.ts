import { type NextRequest, NextResponse } from 'next/server'
import { updateSession } from '@/lib/supabase/middleware'

// Enkel in-memory rate limit for edge middleware
// (deles ikke på tvers av Vercel-instanser, men tilstrekkelig for denne appen)
const ipHits = new Map<string, { count: number; resetAt: number }>()

function isRateLimited(ip: string, limit: number, windowMs: number): boolean {
  const now = Date.now()
  const entry = ipHits.get(ip)
  if (!entry || entry.resetAt < now) {
    ipHits.set(ip, { count: 1, resetAt: now + windowMs })
    return false
  }
  if (entry.count >= limit) return true
  entry.count++
  return false
}

export async function middleware(request: NextRequest) {
  const ip = request.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ?? 'unknown'
  const path = request.nextUrl.pathname

  // Strengere grenser på auth-endepunkter
  if (path.startsWith('/api/auth/register')) {
    if (isRateLimited(ip + ':reg', 5, 60 * 60 * 1000)) {
      return NextResponse.json(
        { error: 'For mange forsøk. Prøv igjen om en time.' },
        { status: 429 }
      )
    }
  }

  if (path.startsWith('/api/auth/login')) {
    if (isRateLimited(ip + ':login', 10, 15 * 60 * 1000)) {
      return NextResponse.json(
        { error: 'For mange innloggingsforsøk. Prøv igjen om 15 minutter.' },
        { status: 429 }
      )
    }
  }

  if (path.startsWith('/api/promo')) {
    if (isRateLimited(ip + ':promo', 5, 60 * 60 * 1000)) {
      return NextResponse.json(
        { error: 'For mange forsøk. Prøv igjen om en time.' },
        { status: 429 }
      )
    }
  }

  // Generell grense: 200 requests per minutt per IP
  if (isRateLimited(ip + ':gen', 200, 60 * 1000)) {
    return NextResponse.json(
      { error: 'For mange forespørsler.' },
      { status: 429 }
    )
  }

  return await updateSession(request)
}

export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico|manifest.json|icons|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
}
