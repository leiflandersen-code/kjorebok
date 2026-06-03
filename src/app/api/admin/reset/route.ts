import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

// TEMPORARY - delete after use
export async function POST(req: NextRequest) {
  const { secret, email, password } = await req.json()

  // Simple guard so random people can't use this
  if (secret !== 'kjorebok-admin-2025') {
    return NextResponse.json({ error: 'forbidden' }, { status: 403 })
  }

  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  )

  const { data: users } = await supabase.auth.admin.listUsers()
  const user = users?.users?.find(u => u.email === email)

  if (!user) {
    return NextResponse.json({ error: 'user not found' }, { status: 404 })
  }

  const { error } = await supabase.auth.admin.updateUserById(user.id, { password })

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return NextResponse.json({ success: true })
}
