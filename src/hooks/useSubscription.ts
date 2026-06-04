import { useEffect, useState, useRef } from 'react'
import { createClient } from '@/lib/supabase/client'
import type { Profile } from '@/types'

export type SubscriptionStatus = 'trial' | 'active' | 'free' | 'expired' | 'loading'

// Module-level cache so the DB is only hit once per session
let cachedStatus: SubscriptionStatus | null = null
let cachedProfile: Profile | null = null
let cachedDaysLeft: number | null = null
let checkPromise: Promise<void> | null = null

export function useSubscription() {
  const [status, setStatus] = useState<SubscriptionStatus>(cachedStatus ?? 'loading')
  const [profile, setProfile] = useState<Profile | null>(cachedProfile)
  const [daysLeft, setDaysLeft] = useState<number | null>(cachedDaysLeft)
  const checked = useRef(false)

  useEffect(() => {
    if (cachedStatus !== null) {
      setStatus(cachedStatus)
      setProfile(cachedProfile)
      setDaysLeft(cachedDaysLeft)
      return
    }
    if (checked.current) return
    checked.current = true
    check()
  }, [])

  async function check() {
    // Deduplicate concurrent calls
    if (!checkPromise) {
      checkPromise = doCheck()
    }
    await checkPromise
    setStatus(cachedStatus!)
    setProfile(cachedProfile)
    setDaysLeft(cachedDaysLeft)
  }

  async function doCheck() {
    const supabase = createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) { cachedStatus = 'expired'; return }

    const { data: prof } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', user.id)
      .single()

    if (!prof) { cachedStatus = 'expired'; return }
    cachedProfile = prof

    const sub = prof.subscription_status ?? 'trial'

    if (sub === 'active' || sub === 'free') {
      if (prof.subscription_expires_at && new Date(prof.subscription_expires_at) < new Date()) {
        await supabase.from('profiles').update({ subscription_status: 'expired' }).eq('id', user.id)
        cachedStatus = 'expired'
        return
      }
      cachedStatus = sub as SubscriptionStatus
      return
    }

    if (sub === 'trial') {
      const trialEnd = prof.trial_ends_at ? new Date(prof.trial_ends_at) : null
      if (!trialEnd || trialEnd > new Date()) {
        const diff = trialEnd ? Math.ceil((trialEnd.getTime() - Date.now()) / 86400000) : 14
        cachedDaysLeft = Math.max(0, diff)
        cachedStatus = 'trial'
      } else {
        await supabase.from('profiles').update({ subscription_status: 'expired' }).eq('id', user.id)
        cachedStatus = 'expired'
      }
      return
    }

    cachedStatus = 'expired'
  }

  function recheck() {
    // Force fresh check
    cachedStatus = null
    cachedProfile = null
    cachedDaysLeft = null
    checkPromise = null
    checked.current = false
    check()
  }

  const hasAccess = status === 'trial' || status === 'active' || status === 'free'

  return { status, profile, daysLeft, hasAccess, recheck }
}
