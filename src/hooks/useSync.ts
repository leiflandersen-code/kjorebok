'use client'

import { useEffect, useCallback } from 'react'
import { useTripStore } from '@/store/tripStore'
import { getPendingTrips, deletePendingTrip } from '@/lib/idb'
import { createClient } from '@/lib/supabase/client'

export function useSync() {
  const { setSyncStatus, setPendingCount } = useTripStore()

  const sync = useCallback(async () => {
    const pending = await getPendingTrips()
    setPendingCount(pending.length)

    if (pending.length === 0) {
      setSyncStatus('synced')
      return
    }

    if (!navigator.onLine) {
      setSyncStatus('pending')
      return
    }

    setSyncStatus('pending')
    const supabase = createClient()

    let hasError = false
    for (const trip of pending) {
      try {
        const { syncStatus, localId, ...tripData } = trip
        const { error } = await supabase.from('trips').upsert(tripData)
        if (error) throw error
        await deletePendingTrip(trip.id)
      } catch {
        hasError = true
      }
    }

    const remaining = await getPendingTrips()
    setPendingCount(remaining.length)
    setSyncStatus(hasError ? 'error' : remaining.length === 0 ? 'synced' : 'pending')
  }, [setSyncStatus, setPendingCount])

  useEffect(() => {
    sync()

    const handleOnline = () => sync()
    window.addEventListener('online', handleOnline)
    return () => window.removeEventListener('online', handleOnline)
  }, [sync])

  return { sync }
}
