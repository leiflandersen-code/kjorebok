'use client'

import { useEffect, useRef } from 'react'
import { useTripStore } from '@/store/tripStore'
import { haversineKm } from '@/lib/distance'

const MIN_DISTANCE_M = 10   // ignore jitter under 10 meter
const MAX_ACCURACY_M = 50   // ignore positions worse than 50m accuracy

export function useGPSTracking() {
  const { activeTrip, updateTracking } = useTripStore()
  const watchIdRef = useRef<number | null>(null)
  const lastPosRef = useRef<{ lat: number; lng: number } | null>(null)

  useEffect(() => {
    if (!activeTrip) {
      // Trip stopped — clear watch
      if (watchIdRef.current !== null) {
        navigator.geolocation.clearWatch(watchIdRef.current)
        watchIdRef.current = null
        lastPosRef.current = null
      }
      return
    }

    if (!navigator.geolocation) return
    if (watchIdRef.current !== null) return // already watching

    // Seed last position from trip start if available
    if (activeTrip.startLat && activeTrip.startLng) {
      lastPosRef.current = { lat: activeTrip.startLat, lng: activeTrip.startLng }
    }

    watchIdRef.current = navigator.geolocation.watchPosition(
      (pos) => {
        if (pos.coords.accuracy > MAX_ACCURACY_M) return

        const current = { lat: pos.coords.latitude, lng: pos.coords.longitude }
        const last = lastPosRef.current

        if (last) {
          const deltaKm = haversineKm(last.lat, last.lng, current.lat, current.lng)
          const deltaM = deltaKm * 1000

          if (deltaM >= MIN_DISTANCE_M) {
            updateTracking(deltaKm, current.lat, current.lng)
            lastPosRef.current = current
          }
        } else {
          lastPosRef.current = current
        }
      },
      (err) => {
        console.warn('GPS watch error:', err.message)
      },
      {
        enableHighAccuracy: true,
        timeout: 15000,
        maximumAge: 5000,
      }
    )

    return () => {
      if (watchIdRef.current !== null) {
        navigator.geolocation.clearWatch(watchIdRef.current)
        watchIdRef.current = null
      }
    }
  }, [activeTrip?.id]) // re-run only when trip id changes
}
