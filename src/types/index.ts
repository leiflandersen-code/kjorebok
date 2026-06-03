export type TripCategory =
  | 'Privat'
  | 'Næring'
  | 'Kundevisning'
  | 'Befaring'
  | 'Innkjøp'
  | 'Service/vedlikehold'
  | 'Annet'

export type TripStatus = 'Utkast' | 'Klar til rapport' | 'Eksportert'
export type SyncStatus = 'synced' | 'pending' | 'error'
export type AttachmentType = 'parking' | 'toll' | 'receipt' | 'other'

export interface Profile {
  id: string
  email: string
  name: string
  default_vehicle_id: string | null
  created_at: string
}

export interface Vehicle {
  id: string
  name: string
  registration: string
  owner_id: string | null
  created_at: string
}

export interface Customer {
  id: string
  name: string
  contact: string | null
  notes: string | null
  created_by: string | null
  created_at: string
}

export interface Trip {
  id: string
  user_id: string
  vehicle_id: string | null
  start_time: string
  stop_time: string | null
  start_lat: number | null
  start_lng: number | null
  stop_lat: number | null
  stop_lng: number | null
  calculated_distance_km: number | null
  adjusted_distance_km: number | null
  category: TripCategory
  customer_id: string | null
  customer_free_text: string | null
  purpose: string | null
  notes: string | null
  parking_cost: number
  toll_cost: number
  other_cost: number
  mileage_rate: number
  calculated_reimbursement: number | null
  status: TripStatus
  created_at: string
  updated_at: string
  // Joined
  vehicle?: Vehicle
  customer?: Customer
  user?: Profile
  attachments?: TripAttachment[]
  audit_log?: TripAuditLog[]
}

export interface TripAttachment {
  id: string
  trip_id: string
  url: string
  storage_path: string
  attachment_type: AttachmentType
  created_at: string
}

export interface TripAuditLog {
  id: string
  trip_id: string
  edited_by: string
  edited_at: string
  field_changed: string
  old_value: string | null
  new_value: string | null
  editor?: Profile
}

export interface ActiveTrip {
  id: string
  userId: string
  vehicleId: string | null
  startTime: string
  startLat: number | null
  startLng: number | null
  category: TripCategory
  synced: boolean
}

export interface LocalTrip extends Trip {
  syncStatus: SyncStatus
  localId?: string
}

export interface ReportFilters {
  dateFrom: string | null
  dateTo: string | null
  userId: string | null
  vehicleId: string | null
  category: TripCategory | null
  customerId: string | null
  status: TripStatus | null
}
