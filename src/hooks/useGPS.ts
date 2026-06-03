'use client'

import { useState, useCallback } from 'react'

interface GPSPosition {
  lat: number
  lng: number
  accuracy: number
}

export function useGPS() {
  const [position, setPosition] = useState<GPSPosition | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)

  const getPosition = useCallback((): Promise<GPSPosition> => {
    setLoading(true)
    setError(null)

    return new Promise((resolve, reject) => {
      if (!navigator.geolocation) {
        const msg = 'GPS ikke støttet av nettleseren'
        setError(msg)
        setLoading(false)
        reject(new Error(msg))
        return
      }

      navigator.geolocation.getCurrentPosition(
        (pos) => {
          const gps: GPSPosition = {
            lat: pos.coords.latitude,
            lng: pos.coords.longitude,
            accuracy: pos.coords.accuracy,
          }
          setPosition(gps)
          setLoading(false)
          resolve(gps)
        },
        (err) => {
          const msg = err.code === 1
            ? 'GPS-tilgang nektet. Tillat posisjon i nettleserinnstillinger.'
            : 'Kunne ikke hente GPS-posisjon'
          setError(msg)
          setLoading(false)
          reject(new Error(msg))
        },
        { enableHighAccuracy: true, timeout: 10000, maximumAge: 0 }
      )
    })
  }, [])

  return { position, error, loading, getPosition }
}
