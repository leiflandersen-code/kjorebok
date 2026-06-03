import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { limits } from '@/lib/ratelimit'

export async function POST(req: NextRequest) {
  const ip = req.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ?? 'unknown'
  const { allowed, resetIn } = limits.promo(ip)

  if (!allowed) {
    return NextResponse.json(
      { error: 'too_many_requests', retryAfter: Math.ceil(resetIn / 1000) },
      { status: 429 }
    )
  }

  const { code } = await req.json()
  if (!code) {
    return NextResponse.json({ error: 'missing_code' }, { status: 400 })
  }

  const supabase = await createClient()
  const { data, error } = await supabase.rpc('redeem_promo_code', { p_code: code })

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 400 })
  }

  return NextResponse.json(data)
}
