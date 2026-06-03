import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import type { ActiveTrip, TripCategory } from '@/types'

interface TripStore {
  activeTrip: ActiveTrip | null
  syncStatus: 'synced' | 'pending' | 'error'
  pendingCount: number

  startTrip: (trip: ActiveTrip) => void
  stopTrip: () => void
  setSyncStatus: (status: 'synced' | 'pending' | 'error') => void
  setPendingCount: (count: number) => void
  updateActiveCategory: (category: TripCategory) => void
}

export const useTripStore = create<TripStore>()(
  persist(
    (set) => ({
      activeTrip: null,
      syncStatus: 'synced',
      pendingCount: 0,

      startTrip: (trip) => set({ activeTrip: trip }),
      stopTrip: () => set({ activeTrip: null }),
      setSyncStatus: (status) => set({ syncStatus: status }),
      setPendingCount: (count) => set({ pendingCount: count }),
      updateActiveCategory: (category) =>
        set((state) => ({
          activeTrip: state.activeTrip ? { ...state.activeTrip, category } : null,
        })),
    }),
    {
      name: 'kjorebok-trip',
      partialize: (state) => ({ activeTrip: state.activeTrip }),
    }
  )
)
