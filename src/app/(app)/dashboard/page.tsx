'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { useTripStore } from '@/store/tripStore'
import { useLang } from '@/store/langStore'
import { useGPS } from '@/hooks/useGPS'
import { useGPSTracking } from '@/hooks/useGPSTracking'
import { calculateReimbursement } from '@/lib/distance'
import { reverseGeocode } from '@/lib/geocoding'
import { SyncBadge } from '@/components/layout/SyncBadge'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { toast } from 'sonner'
import type { Profile, Vehicle, TripCategory } from '@/types'
import { MapPin, Clock, TrendingUp, Euro, AlertTriangle, Navigation } from 'lucide-react'
import { v4 as uuidv4 } from 'uuid'
import { initRevenueCat } from '@/lib/revenuecat'
import { CountryOnboarding } from '@/components/layout/CountryOnboarding'

function formatDuration(start: string): string {
  const diff = Date.now() - new Date(start).getTime()
  const h = Math.floor(diff / 3600000)
  const m = Math.floor((diff % 3600000) / 60000)
  const s = Math.floor((diff % 60000) / 1000)
  return `${h > 0 ? h + 'h ' : ''}${m}m ${s}s`
}

export default function DashboardPage() {
  const router = useRouter()
  const { t, lang } = useLang()
  const {
    activeTrip, accumulatedKm, lastLat, lastLng,
    startTrip, stopTrip, updateActiveCategory,
  } = useTripStore()
  const { loading: gpsLoading, getPosition } = useGPS()
  const [profile, setProfile] = useState<Profile | null>(null)
  const [vehicles, setVehicles] = useState<Vehicle[]>([])
  const [selectedVehicle, setSelectedVehicle] = useState<string>('')
  const [monthStats, setMonthStats] = useState({ km: 0, reimbursement: 0 })
  const [timer, setTimer] = useState('')
  const [stopping, setStopping] = useState(false)
  const [startAddress, setStartAddress] = useState<string | null>(null)
  const [showCountryOnboarding, setShowCountryOnboarding] = useState(false)

  useGPSTracking()

  const CATEGORIES = Object.keys(t.categories) as TripCategory[]

  useEffect(() => { loadData() }, [])

  useEffect(() => {
    if (!activeTrip) return
    const interval = setInterval(() => setTimer(formatDuration(activeTrip.startTime)), 1000)
    return () => clearInterval(interval)
  }, [activeTrip])

  async function loadData() {
    const supabase = createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return

    const { data: prof } = await supabase.from('profiles').select('*').eq('id', user.id).single()
    if (prof) {
      setProfile(prof)
      initRevenueCat(user.id)
      if (!prof.country_selected_at) setShowCountryOnboarding(true)
    }

    const { data: veh } = await supabase.from('vehicles').select('*')
    if (veh) {
      setVehicles(veh)
      setSelectedVehicle(prof?.default_vehicle_id ?? veh[0]?.id ?? '')
    }

    const now = new Date()
    const monthStart = new Date(now.getFullYear(), now.getMonth(), 1).toISOString()
    const { data: trips } = await supabase
      .from('trips')
      .select('adjusted_distance_km, calculated_distance_km, calculated_reimbursement')
      .eq('user_id', user.id)
      .gte('start_time', monthStart)
      .not('stop_time', 'is', null)

    if (trips) {
      const km = trips.reduce((s, t) => s + (t.adjusted_distance_km ?? t.calculated_distance_km ?? 0), 0)
      const reimb = trips.reduce((s, t) => s + (t.calculated_reimbursement ?? 0), 0)
      setMonthStats({ km: Math.round(km * 10) / 10, reimbursement: Math.round(reimb * 100) / 100 })
    }
  }

  async function handleStart() {
    if (!profile) return
    try {
      const pos = await getPosition()
      const trip = {
        id: uuidv4(),
        userId: profile.id,
        vehicleId: selectedVehicle || null,
        startTime: new Date().toISOString(),
        startLat: pos.lat,
        startLng: pos.lng,
        category: (profile.default_category as TripCategory) ?? 'Næring',
        synced: false,
      }
      startTrip(trip)
      toast.success(t.dashboard.tripStarted)
      reverseGeocode(pos.lat, pos.lng).then((addr) => setStartAddress(addr))
    } catch {
      toast.error(t.dashboard.gpsError)
    }
  }

  async function handleStop() {
    if (!activeTrip || !profile) return
    setStopping(true)
    try {
      const stopLat = lastLat
      const stopLng = lastLng
      const km = Math.round(accumulatedKm * 100) / 100
      const rate = profile.mileage_rate ?? 0.26
      const reimbursement = calculateReimbursement(km, rate, 0, 0, 0)
      const stopAddress = stopLat && stopLng ? await reverseGeocode(stopLat, stopLng) : null

      const supabase = createClient()
      const { error } = await supabase.from('trips').insert({
        id: activeTrip.id,
        user_id: profile.id,
        vehicle_id: activeTrip.vehicleId,
        start_time: activeTrip.startTime,
        stop_time: new Date().toISOString(),
        start_lat: activeTrip.startLat,
        start_lng: activeTrip.startLng,
        stop_lat: stopLat,
        stop_lng: stopLng,
        start_address: startAddress,
        stop_address: stopAddress,
        calculated_distance_km: km,
        adjusted_distance_km: km,
        category: activeTrip.category,
        mileage_rate: rate,
        calculated_reimbursement: reimbursement,
        parking_cost: 0,
        toll_cost: 0,
        other_cost: 0,
        status: 'Utkast',
      })
      if (error) throw error

      stopTrip()
      toast.success(`${t.dashboard.tripSaved}: ${km.toFixed(2)} km`)
      router.push(`/trip/${activeTrip.id}`)
    } catch {
      toast.error(t.dashboard.saveError)
    } finally {
      setStopping(false)
    }
  }

  const liveReimbursement = calculateReimbursement(accumulatedKm, profile?.mileage_rate ?? 0.26, 0, 0, 0)
  const currencySymbol = profile?.currency_symbol ?? '€'

  return (
    <div className="min-h-screen p-4 max-w-md mx-auto">
      {showCountryOnboarding && profile && (
        <CountryOnboarding
          userId={profile.id}
          onDone={() => {
            setShowCountryOnboarding(false)
            loadData()
          }}
        />
      )}
      <div className="flex items-center justify-between mb-6 pt-2">
        <div>
          <h1 className="text-xl font-bold text-white">
            {t.dashboard.greeting}, {profile?.name?.split(' ')[0] ?? ''}
          </h1>
          <SyncBadge />
        </div>
        <div className="w-10 h-10 rounded-full bg-green-500/20 flex items-center justify-center">
          <span className="text-green-400 font-bold text-sm">{profile?.name?.[0] ?? '?'}</span>
        </div>
      </div>

      {activeTrip && (
        <Card className="bg-green-500/10 border-green-500/30 mb-6">
          <CardContent className="p-4">
            <div className="flex items-center gap-2 mb-3">
              <div className="w-2 h-2 rounded-full bg-green-400 animate-pulse" />
              <span className="text-green-400 font-semibold text-sm">{t.dashboard.tripActive}</span>
              <span className="text-green-300 font-mono text-sm ml-auto">{timer}</span>
            </div>
            <div className="flex items-end gap-3 mb-3">
              <div>
                <span className="text-4xl font-bold text-white tabular-nums">{accumulatedKm.toFixed(2)}</span>
                <span className="text-slate-400 text-sm ml-1">km</span>
              </div>
              <div className="pb-1">
                <span className="text-green-400 font-semibold">{currencySymbol} {liveReimbursement.toFixed(2)}</span>
              </div>
              <div className="ml-auto pb-1">
                <Navigation size={16} className="text-green-400 animate-pulse" />
              </div>
            </div>
            <div className="flex items-center gap-2 text-slate-300 text-xs mb-1">
              <Clock size={12} />
              <span>{new Date(activeTrip.startTime).toLocaleTimeString(lang === 'no' ? 'nb-NO' : 'en-GB')}</span>
            </div>
            {startAddress && (
              <div className="flex items-start gap-2 text-slate-400 text-xs mb-3">
                <MapPin size={12} className="mt-0.5 flex-shrink-0 text-green-500" />
                <span>{startAddress}</span>
              </div>
            )}
            {!startAddress && <div className="mb-3" />}
            <div className="flex flex-wrap gap-1">
              {CATEGORIES.map((cat) => (
                <button
                  key={cat}
                  onClick={() => updateActiveCategory(cat)}
                  className={`text-xs px-2 py-1 rounded-full border transition-colors cursor-pointer ${
                    activeTrip.category === cat
                      ? 'bg-green-500 border-green-500 text-slate-900 font-semibold'
                      : 'border-slate-600 text-slate-400 hover:border-slate-400'
                  }`}
                >
                  {t.categories[cat as keyof typeof t.categories]}
                </button>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {!activeTrip ? (
        <div className="mb-6">
          {vehicles.length > 1 && (
            <div className="mb-4 flex gap-2">
              {vehicles.map((v) => (
                <button
                  key={v.id}
                  onClick={() => setSelectedVehicle(v.id)}
                  className={`flex-1 py-3 px-4 rounded-xl border text-sm font-medium transition-colors cursor-pointer ${
                    selectedVehicle === v.id
                      ? 'bg-green-500/20 border-green-500/50 text-green-400'
                      : 'border-slate-700 text-slate-400 hover:border-slate-500'
                  }`}
                >
                  {v.name}
                </button>
              ))}
            </div>
          )}
          <Button
            onClick={handleStart}
            disabled={gpsLoading}
            className="w-full h-20 text-xl font-bold bg-green-500 hover:bg-green-400 text-slate-900 rounded-2xl cursor-pointer transition-transform active:scale-95"
          >
            <MapPin size={24} className={gpsLoading ? 'animate-bounce' : ''} />
            <span className="ml-2">{gpsLoading ? t.dashboard.fetchingGps : t.dashboard.startTrip}</span>
          </Button>
        </div>
      ) : (
        <Button
          onClick={handleStop}
          disabled={stopping}
          className="w-full h-20 text-xl font-bold bg-red-500 hover:bg-red-400 text-white rounded-2xl mb-6 cursor-pointer transition-transform active:scale-95"
        >
          <MapPin size={24} className={stopping ? 'animate-bounce' : ''} />
          <span className="ml-2">{stopping ? t.dashboard.saving : t.dashboard.stopTrip}</span>
        </Button>
      )}

      <div className="grid grid-cols-2 gap-3 mb-6">
        <Card className="bg-slate-900 border-slate-700">
          <CardContent className="p-4">
            <div className="flex items-center gap-2 mb-2">
              <TrendingUp size={16} className="text-green-400" />
              <span className="text-slate-400 text-xs">{t.dashboard.thisMonth}</span>
            </div>
            <p className="text-2xl font-bold text-white">{monthStats.km.toFixed(1)}</p>
            <p className="text-slate-400 text-sm">{t.dashboard.kilometers}</p>
          </CardContent>
        </Card>
        <Card className="bg-slate-900 border-slate-700">
          <CardContent className="p-4">
            <div className="flex items-center gap-2 mb-2">
              <Euro size={16} className="text-green-400" />
              <span className="text-slate-400 text-xs">{t.dashboard.estimatedRate}</span>
            </div>
            <p className="text-2xl font-bold text-white">{currencySymbol} {monthStats.reimbursement.toFixed(2)}</p>
            <p className="text-slate-400 text-sm">{t.dashboard.estimated}</p>
          </CardContent>
        </Card>
      </div>

      <div className="flex gap-2 p-3 bg-amber-500/10 border border-amber-500/20 rounded-xl">
        <AlertTriangle size={16} className="text-amber-400 flex-shrink-0 mt-0.5" />
        <p className="text-amber-300/80 text-xs leading-relaxed">{t.dashboard.disclaimer}</p>
      </div>
    </div>
  )
}
