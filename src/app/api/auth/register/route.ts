import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { limits } from '@/lib/ratelimit'

export async function POST(req: NextRequest) {
  const ip = req.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ?? 'unknown'
  const { allowed, resetIn } = limits.register(ip)

  if (!allowed) {
    return NextResponse.json(
      { error: 'too_many_requests', retryAfter: Math.ceil(resetIn / 1000) },
      { status: 429 }
    )
  }

  const { email, password, name } = await req.json()
  if (!email || !password || !name) {
    return NextResponse.json({ error: 'missing_fields' }, { status: 400 })
  }

  const supabase = await createClient()
  const { error } = await supabase.auth.signUp({
    email,
    password,
    options: { data: { name } },
  })

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 400 })
  }

  return NextResponse.json({ success: true })
}
