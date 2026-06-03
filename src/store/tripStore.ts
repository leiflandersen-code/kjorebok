import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import type { ActiveTrip, TripCategory } from '@/types'

interface TripStore {
  activeTrip: ActiveTrip | null
  accumulatedKm: number
  lastLat: number | null
  lastLng: number | null
  syncStatus: 'synced' | 'pending' | 'error'
  pendingCount: number

  startTrip: (trip: ActiveTrip) => void
  stopTrip: () => void
  updateTracking: (deltaKm: number, lat: number, lng: number) => void
  updateActiveCategory: (category: TripCategory) => void
  setSyncStatus: (status: 'synced' | 'pending' | 'error') => void
  setPendingCount: (count: number) => void
}

export const useTripStore = create<TripStore>()(
  persist(
    (set) => ({
      activeTrip: null,
      accumulatedKm: 0,
      lastLat: null,
      lastLng: null,
      syncStatus: 'synced',
      pendingCount: 0,

      startTrip: (trip) => set({
        activeTrip: trip,
        accumulatedKm: 0,
        lastLat: trip.startLat,
        lastLng: trip.startLng,
      }),

      stopTrip: () => set({
        activeTrip: null,
        accumulatedKm: 0,
        lastLat: null,
        lastLng: null,
      }),

      updateTracking: (deltaKm, lat, lng) =>
        set((state) => ({
          accumulatedKm: Math.round((state.accumulatedKm + deltaKm) * 1000) / 1000,
          lastLat: lat,
          lastLng: lng,
        })),

      updateActiveCategory: (category) =>
        set((state) => ({
          activeTrip: state.activeTrip ? { ...state.activeTrip, category } : null,
        })),

      setSyncStatus: (status) => set({ syncStatus: status }),
      setPendingCount: (count) => set({ pendingCount: count }),
    }),
    {
      name: 'kjorebok-trip',
      partialize: (state) => ({
        activeTrip: state.activeTrip,
        accumulatedKm: state.accumulatedKm,
        lastLat: state.lastLat,
        lastLng: state.lastLng,
      }),
    }
  )
)
