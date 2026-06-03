'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import { generateMonthlyPDF, generateCSV } from '@/lib/pdf'
import type { Trip, Vehicle, Profile, TripCategory, TripStatus } from '@/types'
import { FileText, Download, Filter } from 'lucide-react'
import { toast } from 'sonner'

const CATEGORIES: TripCategory[] = [
  'Næring', 'Privat', 'Kundevisning', 'Befaring', 'Innkjøp', 'Service/vedlikehold', 'Annet'
]

export default function ReportsPage() {
  const [trips, setTrips] = useState<Trip[]>([])
  const [vehicles, setVehicles] = useState<Vehicle[]>([])
  const [profiles, setProfiles] = useState<Profile[]>([])
  const [currentProfile, setCurrentProfile] = useState<Profile | null>(null)
  const [filters, setFilters] = useState({
    dateFrom: new Date(new Date().getFullYear(), new Date().getMonth(), 1).toISOString().slice(0, 10),
    dateTo: new Date().toISOString().slice(0, 10),
    userId: '',
    vehicleId: '',
    category: '',
    status: '',
  })
  const [loading, setLoading] = useState(false)

  useEffect(() => { loadData() }, [])

  async function loadData() {
    const supabase = createClient()
    const { data: { user } } = await supabase.auth.getUser()
    const [{ data: veh }, { data: prof }, { data: myProf }] = await Promise.all([
      supabase.from('vehicles').select('*'),
      supabase.from('profiles').select('*'),
      supabase.from('profiles').select('*').eq('id', user?.id ?? '').single(),
    ])
    setVehicles(veh ?? [])
    setProfiles(prof ?? [])
    setCurrentProfile(myProf)
    await loadTrips(filters)
  }

  async function loadTrips(f: typeof filters) {
    setLoading(true)
    const supabase = createClient()
    let query = supabase
      .from('trips')
      .select('*, vehicle:vehicles(*), customer:customers(*), user:profiles(*)')
      .gte('start_time', f.dateFrom + 'T00:00:00')
      .lte('start_time', f.dateTo + 'T23:59:59')
      .not('stop_time', 'is', null)
      .order('start_time', { ascending: true })

    if (f.userId) query = query.eq('user_id', f.userId)
    if (f.vehicleId) query = query.eq('vehicle_id', f.vehicleId)
    if (f.category) query = query.eq('category', f.category)
    if (f.status) query = query.eq('status', f.status)

    const { data } = await query
    setTrips(data ?? [])
    setLoading(false)
  }

  function handleFilterChange(key: string, value: string) {
    const next = { ...filters, [key]: value }
    setFilters(next)
    loadTrips(next)
  }

  async function handlePDF() {
    if (!currentProfile) return
    const month = new Date(filters.dateFrom).toLocaleDateString('nb-NO', { month: 'long', year: 'numeric' })
    const doc = generateMonthlyPDF(trips, month, currentProfile, vehicles)
    doc.save(`kjorebok-${filters.dateFrom.slice(0, 7)}.pdf`)
    toast.success('PDF lastet ned')
  }

  function handleCSV() {
    const csv = generateCSV(trips, vehicles)
    const blob = new Blob(['﻿' + csv], { type: 'text/csv;charset=utf-8;' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `kjorebok-${filters.dateFrom.slice(0, 7)}.csv`
    a.click()
    toast.success('CSV lastet ned')
  }

  const totalKm = trips.reduce((s, t) => s + (t.adjusted_distance_km ?? t.calculated_distance_km ?? 0), 0)
  const totalReimbursement = trips.reduce((s, t) => s + (t.calculated_reimbursement ?? 0), 0)

  return (
    <div className="min-h-screen p-4 max-w-md mx-auto">
      <h1 className="text-xl font-bold text-white mb-6 pt-2">Rapporter</h1>

      {/* Filters */}
      <Card className="bg-slate-900 border-slate-700 mb-4">
        <CardHeader className="pb-2 pt-4 px-4">
          <CardTitle className="text-sm text-slate-300 flex items-center gap-2">
            <Filter size={14} />
            Filter
          </CardTitle>
        </CardHeader>
        <CardContent className="px-4 pb-4 space-y-3">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label className="text-slate-400 text-xs mb-1 block">Fra dato</Label>
              <input
                type="date"
                value={filters.dateFrom}
                onChange={(e) => handleFilterChange('dateFrom', e.target.value)}
                className="w-full bg-slate-800 border border-slate-600 text-white rounded-lg px-3 py-2 text-sm cursor-pointer"
              />
            </div>
            <div>
              <Label className="text-slate-400 text-xs mb-1 block">Til dato</Label>
              <input
                type="date"
                value={filters.dateTo}
                onChange={(e) => handleFilterChange('dateTo', e.target.value)}
                className="w-full bg-slate-800 border border-slate-600 text-white rounded-lg px-3 py-2 text-sm cursor-pointer"
              />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label className="text-slate-400 text-xs mb-1 block">Bruker</Label>
              <select
                value={filters.userId}
                onChange={(e) => handleFilterChange('userId', e.target.value)}
                className="w-full bg-slate-800 border border-slate-600 text-white rounded-lg px-3 py-2 text-sm cursor-pointer"
              >
                <option value="">Alle brukere</option>
                {profiles.map((p) => <option key={p.id} value={p.id}>{p.name}</option>)}
              </select>
            </div>
            <div>
              <Label className="text-slate-400 text-xs mb-1 block">Kjøretøy</Label>
              <select
                value={filters.vehicleId}
                onChange={(e) => handleFilterChange('vehicleId', e.target.value)}
                className="w-full bg-slate-800 border border-slate-600 text-white rounded-lg px-3 py-2 text-sm cursor-pointer"
              >
                <option value="">Alle kjøretøy</option>
                {vehicles.map((v) => <option key={v.id} value={v.id}>{v.name}</option>)}
              </select>
            </div>
            <div>
              <Label className="text-slate-400 text-xs mb-1 block">Kategori</Label>
              <select
                value={filters.category}
                onChange={(e) => handleFilterChange('category', e.target.value)}
                className="w-full bg-slate-800 border border-slate-600 text-white rounded-lg px-3 py-2 text-sm cursor-pointer"
              >
                <option value="">Alle kategorier</option>
                {CATEGORIES.map((c) => <option key={c} value={c}>{c}</option>)}
              </select>
            </div>
            <div>
              <Label className="text-slate-400 text-xs mb-1 block">Status</Label>
              <select
                value={filters.status}
                onChange={(e) => handleFilterChange('status', e.target.value)}
                className="w-full bg-slate-800 border border-slate-600 text-white rounded-lg px-3 py-2 text-sm cursor-pointer"
              >
                <option value="">Alle statuser</option>
                <option value="Utkast">Utkast</option>
                <option value="Klar til rapport">Klar til rapport</option>
                <option value="Eksportert">Eksportert</option>
              </select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Summary */}
      <Card className="bg-slate-900 border-slate-700 mb-4">
        <CardContent className="p-4">
          <div className="grid grid-cols-3 gap-4 text-center">
            <div>
              <p className="text-2xl font-bold text-white">{trips.length}</p>
              <p className="text-slate-400 text-xs">turer</p>
            </div>
            <div>
              <p className="text-2xl font-bold text-white">{totalKm.toFixed(1)}</p>
              <p className="text-slate-400 text-xs">km</p>
            </div>
            <div>
              <p className="text-2xl font-bold text-green-400">€ {totalReimbursement.toFixed(2)}</p>
              <p className="text-slate-400 text-xs">beregnet</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Export buttons */}
      <div className="grid grid-cols-2 gap-3 mb-6">
        <Button
          onClick={handlePDF}
          disabled={trips.length === 0}
          className="h-14 flex flex-col items-center gap-1 bg-slate-800 hover:bg-slate-700 border border-slate-600 text-white cursor-pointer"
        >
          <FileText size={20} />
          <span className="text-xs">Last ned PDF</span>
        </Button>
        <Button
          onClick={handleCSV}
          disabled={trips.length === 0}
          className="h-14 flex flex-col items-center gap-1 bg-slate-800 hover:bg-slate-700 border border-slate-600 text-white cursor-pointer"
        >
          <Download size={20} />
          <span className="text-xs">Last ned CSV</span>
        </Button>
      </div>

      {/* Trip list */}
      {loading ? (
        <p className="text-slate-400 text-center py-8">Laster...</p>
      ) : trips.length === 0 ? (
        <p className="text-slate-400 text-center py-8">Ingen turer i valgt periode</p>
      ) : (
        <div className="space-y-2">
          {trips.map((t) => {
            const km = t.adjusted_distance_km ?? t.calculated_distance_km ?? 0
            return (
              <div key={t.id} className="flex items-center justify-between p-3 bg-slate-900 border border-slate-700 rounded-xl text-sm">
                <div>
                  <span className="text-white">{new Date(t.start_time).toLocaleDateString('nb-NO')}</span>
                  <span className="text-slate-400 ml-2">{t.category}</span>
                </div>
                <div className="text-right">
                  <span className="text-white font-medium">{km.toFixed(1)} km</span>
                  <span className="text-green-400 text-xs ml-2">€ {(t.calculated_reimbursement ?? 0).toFixed(2)}</span>
                </div>
              </div>
            )
          })}
        </div>
      )}

      {/* Disclaimer */}
      <p className="text-slate-500 text-xs text-center mt-6 leading-relaxed">
        Beløpene er beregnet dokumentasjon basert på valgt kilometersats.
        Skattemessig behandling må vurderes av regnskapsfører/rådgiver.
      </p>
    </div>
  )
}
