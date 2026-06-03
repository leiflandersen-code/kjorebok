import { openDB, type DBSchema, type IDBPDatabase } from 'idb'
import type { ActiveTrip, LocalTrip } from '@/types'

interface KjorebokDB extends DBSchema {
  active_trip: {
    key: string
    value: ActiveTrip
  }
  pending_trips: {
    key: string
    value: LocalTrip
    indexes: { 'by-status': string }
  }
}

let db: IDBPDatabase<KjorebokDB> | null = null

export async function getDB() {
  if (!db) {
    db = await openDB<KjorebokDB>('kjorebok', 1, {
      upgrade(database) {
        database.createObjectStore('active_trip', { keyPath: 'id' })
        const pendingStore = database.createObjectStore('pending_trips', { keyPath: 'id' })
        pendingStore.createIndex('by-status', 'syncStatus')
      },
    })
  }
  return db
}

export async function saveActiveTrip(trip: ActiveTrip) {
  const database = await getDB()
  await database.put('active_trip', trip)
}

export async function getActiveTrip(): Promise<ActiveTrip | undefined> {
  const database = await getDB()
  const all = await database.getAll('active_trip')
  return all[0]
}

export async function clearActiveTrip() {
  const database = await getDB()
  const all = await database.getAll('active_trip')
  for (const trip of all) {
    await database.delete('active_trip', trip.id)
  }
}

export async function savePendingTrip(trip: LocalTrip) {
  const database = await getDB()
  await database.put('pending_trips', trip)
}

export async function getPendingTrips(): Promise<LocalTrip[]> {
  const database = await getDB()
  return database.getAllFromIndex('pending_trips', 'by-status', 'pending')
}

export async function deletePendingTrip(id: string) {
  const database = await getDB()
  await database.delete('pending_trips', id)
}
