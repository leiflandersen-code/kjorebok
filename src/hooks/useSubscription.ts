import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import type { Profile } from '@/types'

export type SubscriptionStatus = 'trial' | 'active' | 'free' | 'expired' | 'loading'

export function useSubscription() {
  const [status, setStatus] = useState<SubscriptionStatus>('loading')
  const [profile, setProfile] = useState<Profile | null>(null)
  const [daysLeft, setDaysLeft] = useState<number | null>(null)

  useEffect(() => {
    check()
  }, [])

  async function check() {
    const supabase = createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) { setStatus('expired'); return }

    const { data: prof } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', user.id)
      .single()

    if (!prof) { setStatus('expired'); return }
    setProfile(prof)

    const sub = prof.subscription_status ?? 'trial'

    if (sub === 'active' || sub === 'free') {
      // Check active subscription hasn't expired
      if (prof.subscription_expires_at && new Date(prof.subscription_expires_at) < new Date()) {
        await supabase.from('profiles').update({ subscription_status: 'expired' }).eq('id', user.id)
        setStatus('expired')
        return
      }
      setStatus(sub as SubscriptionStatus)
      return
    }

    if (sub === 'trial') {
      const trialEnd = prof.trial_ends_at ? new Date(prof.trial_ends_at) : null
      if (!trialEnd || trialEnd > new Date()) {
        const diff = trialEnd ? Math.ceil((trialEnd.getTime() - Date.now()) / 86400000) : 14
        setDaysLeft(Math.max(0, diff))
        setStatus('trial')
      } else {
        await supabase.from('profiles').update({ subscription_status: 'expired' }).eq('id', user.id)
        setStatus('expired')
      }
      return
    }

    setStatus('expired')
  }

  const hasAccess = status === 'trial' || status === 'active' || status === 'free'

  return { status, profile, daysLeft, hasAccess, recheck: check }
}
