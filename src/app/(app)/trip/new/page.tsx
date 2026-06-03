'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { toast } from 'sonner'
import type { Vehicle, Customer, TripCategory } from '@/types'
import { calculateReimbursement } from '@/lib/distance'
import { ChevronLeft } from 'lucide-react'
import Link from 'next/link'
import { v4 as uuidv4 } from 'uuid'

const CATEGORIES: TripCategory[] = [
  'Næring', 'Privat', 'Kundevisning', 'Befaring', 'Innkjøp', 'Service/vedlikehold', 'Annet'
]

export default function NewTripPage() {
  const router = useRouter()
  const [vehicles, setVehicles] = useState<Vehicle[]>([])
  const [customers, setCustomers] = useState<Customer[]>([])
  const [saving, setSaving] = useState(false)
  const [form, setForm] = useState({
    date: new Date().toISOString().slice(0, 10),
    startTime: new Date().toTimeString().slice(0, 5),
    stopTime: '',
    vehicleId: '',
    category: 'Næring' as TripCategory,
    distanceKm: '',
    customerId: '',
    customerFreeText: '',
    purpose: '',
    notes: '',
    parkingCost: '0',
    tollCost: '0',
    otherCost: '0',
    mileageRate: '0.26',
  })

  useEffect(() => { load() }, [])

  async function load() {
    const supabase = createClient()
    const [{ data: veh }, { data: cust }] = await Promise.all([
      supabase.from('vehicles').select('*'),
      supabase.from('customers').select('*').order('name'),
    ])
    setVehicles(veh ?? [])
    setCustomers(cust ?? [])
    if (veh?.[0]) setForm((f) => ({ ...f, vehicleId: veh[0].id }))
  }

  function set(key: string, value: string) {
    setForm((f) => ({ ...f, [key]: value }))
  }

  async function handleSave() {
    if (!form.distanceKm || parseFloat(form.distanceKm) <= 0) {
      toast.error('Legg inn antall kilometer')
      return
    }
    setSaving(true)

    const supabase = createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return

    const km = parseFloat(form.distanceKm)
    const rate = parseFloat(form.mileageRate) || 0.26
    const parking = parseFloat(form.parkingCost) || 0
    const toll = parseFloat(form.tollCost) || 0
    const other = parseFloat(form.otherCost) || 0
    const reimbursement = calculateReimbursement(km, rate, parking, toll, other)

    const startTime = new Date(`${form.date}T${form.startTime}`).toISOString()
    const stopTime = form.stopTime ? new Date(`${form.date}T${form.stopTime}`).toISOString() : null

    const { data, error } = await supabase.from('trips').insert({
      id: uuidv4(),
      user_id: user.id,
      vehicle_id: form.vehicleId || null,
      start_time: startTime,
      stop_time: stopTime,
      calculated_distance_km: km,
      adjusted_distance_km: km,
      category: form.category,
      customer_id: form.customerId || null,
      customer_free_text: form.customerFreeText || null,
      purpose: form.purpose || null,
      notes: form.notes || null,
      parking_cost: parking,
      toll_cost: toll,
      other_cost: other,
      mileage_rate: rate,
      calculated_reimbursement: reimbursement,
      status: 'Utkast',
    }).select().single()

    if (error) {
      toast.error('Feil ved lagring')
    } else {
      toast.success('Tur lagret')
      router.push(`/trip/${data.id}`)
    }
    setSaving(false)
  }

  const km = parseFloat(form.distanceKm) || 0
  const rate = parseFloat(form.mileageRate) || 0.26
  const reimbursement = calculateReimbursement(km, rate, parseFloat(form.parkingCost) || 0, parseFloat(form.tollCost) || 0, parseFloat(form.otherCost) || 0)

  return (
    <div className="min-h-screen p-4 max-w-md mx-auto">
      <div className="flex items-center gap-3 mb-6 pt-2">
        <Link href="/trips" className="p-2 rounded-xl hover:bg-slate-800 cursor-pointer transition-colors">
          <ChevronLeft size={20} className="text-slate-300" />
        </Link>
        <h1 className="text-lg font-bold text-white flex-1">Ny tur (manuell)</h1>
        <Button
          onClick={handleSave}
          disabled={saving}
          size="sm"
          className="bg-green-500 hover:bg-green-400 text-slate-900 font-semibold cursor-pointer"
        >
          {saving ? 'Lagrer...' : 'Lagre'}
        </Button>
      </div>

      <div className="space-y-4">
        {/* Date & time */}
        <div className="grid grid-cols-3 gap-3">
          <div className="col-span-1">
            <Label className="text-slate-300 mb-2 block text-xs">Dato</Label>
            <input
              type="date"
              value={form.date}
              onChange={(e) => set('date', e.target.value)}
              className="w-full bg-slate-800 border border-slate-600 text-white rounded-lg px-3 py-3 text-sm cursor-pointer"
            />
          </div>
          <div>
            <Label className="text-slate-300 mb-2 block text-xs">Fra</Label>
            <input
              type="time"
              value={form.startTime}
              onChange={(e) => set('startTime', e.target.value)}
              className="w-full bg-slate-800 border border-slate-600 text-white rounded-lg px-3 py-3 text-sm cursor-pointer"
            />
          </div>
          <div>
            <Label className="text-slate-300 mb-2 block text-xs">Til</Label>
            <input
              type="time"
              value={form.stopTime}
              onChange={(e) => set('stopTime', e.target.value)}
              className="w-full bg-slate-800 border border-slate-600 text-white rounded-lg px-3 py-3 text-sm cursor-pointer"
            />
          </div>
        </div>

        {/* Category */}
        <div>
          <Label className="text-slate-300 mb-2 block">Kategori</Label>
          <div className="flex flex-wrap gap-2">
            {CATEGORIES.map((cat) => (
              <button
                key={cat}
                onClick={() => set('category', cat)}
                className={`text-sm px-3 py-2 rounded-xl border transition-colors cursor-pointer ${
                  form.category === cat
                    ? 'bg-green-500 border-green-500 text-slate-900 font-semibold'
                    : 'border-slate-600 text-slate-400 hover:border-slate-400'
                }`}
              >
                {cat}
              </button>
            ))}
          </div>
        </div>

        {/* Vehicle */}
        {vehicles.length > 0 && (
          <div>
            <Label className="text-slate-300 mb-2 block">Kjøretøy</Label>
            <div className="flex gap-2">
              {vehicles.map((v) => (
                <button
                  key={v.id}
                  onClick={() => set('vehicleId', v.id)}
                  className={`flex-1 py-3 px-4 rounded-xl border text-sm font-medium transition-colors cursor-pointer ${
                    form.vehicleId === v.id
                      ? 'bg-green-500/20 border-green-500/50 text-green-400'
                      : 'border-slate-600 text-slate-400 hover:border-slate-400'
                  }`}
                >
                  {v.name}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Distance */}
        <div>
          <Label htmlFor="km" className="text-slate-300 mb-2 block">Kilometer *</Label>
          <Input
            id="km"
            type="number"
            step="0.1"
            min="0"
            placeholder="0.0"
            value={form.distanceKm}
            onChange={(e) => set('distanceKm', e.target.value)}
            className="bg-slate-800 border-slate-600 text-white h-12 text-base"
          />
        </div>

        {/* Customer */}
        <div>
          <Label className="text-slate-300 mb-2 block">Kunde / prosjekt</Label>
          {customers.length > 0 && (
            <select
              value={form.customerId}
              onChange={(e) => set('customerId', e.target.value)}
              className="w-full bg-slate-800 border border-slate-600 text-white rounded-lg px-3 py-3 text-base cursor-pointer mb-2"
            >
              <option value="">Velg fra kundeliste...</option>
              {customers.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
            </select>
          )}
          <Input
            placeholder="Fritekst kunde / prosjekt"
            value={form.customerFreeText}
            onChange={(e) => set('customerFreeText', e.target.value)}
            className="bg-slate-800 border-slate-600 text-white h-12 text-base"
          />
        </div>

        {/* Purpose */}
        <div>
          <Label className="text-slate-300 mb-2 block">Formål</Label>
          <Input
            value={form.purpose}
            onChange={(e) => set('purpose', e.target.value)}
            className="bg-slate-800 border-slate-600 text-white h-12 text-base"
          />
        </div>

        {/* Notes */}
        <div>
          <Label className="text-slate-300 mb-2 block">Notater</Label>
          <Textarea
            value={form.notes}
            onChange={(e) => set('notes', e.target.value)}
            className="bg-slate-800 border-slate-600 text-white resize-none"
            rows={3}
          />
        </div>

        {/* Costs & summary */}
        <Card className="bg-slate-900 border-slate-700">
          <CardHeader className="pb-2 pt-4 px-4">
            <CardTitle className="text-sm text-slate-300">Kostnader</CardTitle>
          </CardHeader>
          <CardContent className="px-4 pb-4 space-y-3">
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label className="text-slate-400 text-xs mb-1 block">Parkering (€)</Label>
                <Input type="number" step="0.01" min="0" value={form.parkingCost} onChange={(e) => set('parkingCost', e.target.value)} className="bg-slate-800 border-slate-600 text-white h-10 text-sm" />
              </div>
              <div>
                <Label className="text-slate-400 text-xs mb-1 block">Bomvei (€)</Label>
                <Input type="number" step="0.01" min="0" value={form.tollCost} onChange={(e) => set('tollCost', e.target.value)} className="bg-slate-800 border-slate-600 text-white h-10 text-sm" />
              </div>
              <div>
                <Label className="text-slate-400 text-xs mb-1 block">Andre kostnader (€)</Label>
                <Input type="number" step="0.01" min="0" value={form.otherCost} onChange={(e) => set('otherCost', e.target.value)} className="bg-slate-800 border-slate-600 text-white h-10 text-sm" />
              </div>
              <div>
                <Label className="text-slate-400 text-xs mb-1 block">Km-sats (€/km)</Label>
                <Input type="number" step="0.01" min="0" value={form.mileageRate} onChange={(e) => set('mileageRate', e.target.value)} className="bg-slate-800 border-slate-600 text-white h-10 text-sm" />
              </div>
            </div>
            <div className="flex items-center justify-between pt-2 border-t border-slate-700">
              <span className="text-slate-300 text-sm font-medium">Beregnet totalt</span>
              <span className="text-green-400 font-bold">€ {reimbursement.toFixed(2)}</span>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
