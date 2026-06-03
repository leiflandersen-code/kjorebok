import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { limits } from '@/lib/ratelimit'

export async function POST(req: NextRequest) {
  const ip = req.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ?? 'unknown'
  const { allowed, resetIn, remaining } = limits.login(ip)

  if (!allowed) {
    return NextResponse.json(
      { error: 'too_many_requests', retryAfter: Math.ceil(resetIn / 1000) },
      { status: 429 }
    )
  }

  const { email, password } = await req.json()
  if (!email || !password) {
    return NextResponse.json({ error: 'missing_fields' }, { status: 400 })
  }

  const supabase = await createClient()
  const { error } = await supabase.auth.signInWithPassword({ email, password })

  if (error) {
    return NextResponse.json(
      { error: 'invalid_credentials', remaining },
      { status: 401 }
    )
  }

  return NextResponse.json({ success: true })
}
