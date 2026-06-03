'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import Link from 'next/link'
import type { Trip, Vehicle, Profile } from '@/types'
import { ChevronRight, MapPin, User } from 'lucide-react'

const statusColor: Record<string, string> = {
  'Utkast': 'bg-slate-700 text-slate-300',
  'Klar til rapport': 'bg-blue-500/20 text-blue-400',
  'Eksportert': 'bg-green-500/20 text-green-400',
}

export default function TripsPage() {
  const [trips, setTrips] = useState<(Trip & { vehicle?: Vehicle; user?: Profile })[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    loadTrips()
  }, [])

  async function loadTrips() {
    const supabase = createClient()
    const { data } = await supabase
      .from('trips')
      .select('*, vehicle:vehicles(*), user:profiles(*)')
      .order('start_time', { ascending: false })
      .limit(100)

    setTrips(data ?? [])
    setLoading(false)
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p className="text-slate-400">Laster turer...</p>
      </div>
    )
  }

  return (
    <div className="min-h-screen p-4 max-w-md mx-auto">
      <div className="flex items-center justify-between mb-6 pt-2">
        <h1 className="text-xl font-bold text-white">Alle turer</h1>
        <Link
          href="/trip/new"
          className="text-sm text-green-400 hover:text-green-300 cursor-pointer font-medium"
        >
          + Ny tur
        </Link>
      </div>

      {trips.length === 0 ? (
        <div className="text-center py-16">
          <MapPin size={40} className="text-slate-600 mx-auto mb-3" />
          <p className="text-slate-400">Ingen turer ennå</p>
          <p className="text-slate-500 text-sm mt-1">Trykk &quot;Start tur&quot; på dashbordet</p>
        </div>
      ) : (
        <div className="space-y-3">
          {trips.map((trip) => {
            const km = trip.adjusted_distance_km ?? trip.calculated_distance_km ?? 0
            const date = new Date(trip.start_time)
            return (
              <Link key={trip.id} href={`/trip/${trip.id}`} className="block cursor-pointer">
                <Card className="bg-slate-900 border-slate-700 hover:border-slate-500 transition-colors">
                  <CardContent className="p-4">
                    <div className="flex items-start justify-between">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                          <span className="text-white font-medium text-sm">
                            {date.toLocaleDateString('nb-NO', { weekday: 'short', day: 'numeric', month: 'short' })}
                          </span>
                          <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${statusColor[trip.status]}`}>
                            {trip.status}
                          </span>
                        </div>
                        <div className="flex items-center gap-3 text-sm text-slate-400">
                          <span>{trip.category}</span>
                          {trip.vehicle && (
                            <span className="truncate">{trip.vehicle.name}</span>
                          )}
                        </div>
                        {(trip.customer_free_text || trip.purpose) && (
                          <p className="text-slate-500 text-xs mt-1 truncate">
                            {trip.customer_free_text ?? trip.purpose}
                          </p>
                        )}
                        <div className="flex items-center gap-1 mt-1">
                          <User size={11} className="text-slate-500" />
                          <span className="text-slate-500 text-xs">{trip.user?.name}</span>
                        </div>
                      </div>
                      <div className="flex items-center gap-2 ml-3">
                        <div className="text-right">
                          <p className="text-white font-bold">{km.toFixed(1)} km</p>
                          <p className="text-green-400 text-xs">€ {(trip.calculated_reimbursement ?? 0).toFixed(2)}</p>
                        </div>
                        <ChevronRight size={16} className="text-slate-600" />
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </Link>
            )
          })}
        </div>
      )}
    </div>
  )
}
