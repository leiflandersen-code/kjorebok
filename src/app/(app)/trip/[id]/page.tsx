'use client'

import { useEffect, useState, useCallback } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { toast } from 'sonner'
import type { Trip, Vehicle, Customer, Profile, TripCategory, TripStatus, TripAuditLog } from '@/types'
import { calculateReimbursement } from '@/lib/distance'
import { ChevronLeft, Clock, Save, Paperclip, History } from 'lucide-react'
import Link from 'next/link'

const CATEGORIES: TripCategory[] = [
  'Næring', 'Privat', 'Kundevisning', 'Befaring', 'Innkjøp', 'Service/vedlikehold', 'Annet'
]
const STATUSES: TripStatus[] = ['Utkast', 'Klar til rapport', 'Eksportert']

export default function TripDetailPage() {
  const { id } = useParams<{ id: string }>()
  const router = useRouter()
  const [trip, setTrip] = useState<Trip | null>(null)
  const [vehicles, setVehicles] = useState<Vehicle[]>([])
  const [customers, setCustomers] = useState<Customer[]>([])
  const [auditLog, setAuditLog] = useState<(TripAuditLog & { editor?: Profile })[]>([])
  const [form, setForm] = useState<Partial<Trip>>({})
  const [saving, setSaving] = useState(false)
  const [uploading, setUploading] = useState(false)
  const [currentUser, setCurrentUser] = useState<Profile | null>(null)

  const load = useCallback(async () => {
    const supabase = createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return

    const [
      { data: prof },
      { data: tripData },
      { data: veh },
      { data: cust },
      { data: audit },
    ] = await Promise.all([
      supabase.from('profiles').select('*').eq('id', user.id).single(),
      supabase.from('trips').select('*, vehicle:vehicles(*), customer:customers(*), attachments:trip_attachments(*)').eq('id', id).single(),
      supabase.from('vehicles').select('*'),
      supabase.from('customers').select('*').order('name'),
      supabase.from('trip_audit_log').select('*, editor:profiles(*)').eq('trip_id', id).order('edited_at', { ascending: false }),
    ])

    if (prof) setCurrentUser(prof)
    if (tripData) { setTrip(tripData); setForm(tripData) }
    if (veh) setVehicles(veh)
    if (cust) setCustomers(cust)
    if (audit) setAuditLog(audit as any)
  }, [id])

  useEffect(() => { load() }, [load])

  function updateForm<K extends keyof Trip>(key: K, value: Trip[K]) {
    setForm((prev) => {
      const updated = { ...prev, [key]: value }
      const km = updated.adjusted_distance_km ?? updated.calculated_distance_km ?? 0
      updated.calculated_reimbursement = calculateReimbursement(
        km,
        updated.mileage_rate ?? 0.26,
        updated.parking_cost ?? 0,
        updated.toll_cost ?? 0,
        updated.other_cost ?? 0
      )
      return updated
    })
  }

  async function handleSave() {
    if (!trip || !currentUser) return
    setSaving(true)

    const supabase = createClient()
    const changes: { field: string; old: string; new: string }[] = []

    const trackFields: (keyof Trip)[] = [
      'adjusted_distance_km', 'category', 'customer_free_text', 'purpose',
      'notes', 'parking_cost', 'toll_cost', 'other_cost', 'mileage_rate', 'status'
    ]

    for (const field of trackFields) {
      const oldVal = String(trip[field] ?? '')
      const newVal = String(form[field] ?? '')
      if (oldVal !== newVal) {
        changes.push({ field, old: oldVal, new: newVal })
      }
    }

    const { error } = await supabase.from('trips').update(form).eq('id', id)

    if (error) {
      toast.error('Feil ved lagring')
    } else {
      if (changes.length > 0) {
        await supabase.from('trip_audit_log').insert(
          changes.map((c) => ({
            trip_id: id,
            edited_by: currentUser.id,
            field_changed: c.field,
            old_value: c.old,
            new_value: c.new,
          }))
        )
      }
      toast.success('Lagret')
      load()
    }
    setSaving(false)
  }

  async function handleFileUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return
    setUploading(true)

    const supabase = createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return

    const path = `${user.id}/${id}/${Date.now()}-${file.name}`
    const { error: uploadError } = await supabase.storage.from('receipts').upload(path, file)

    if (uploadError) {
      toast.error('Feil ved opplasting')
    } else {
      const { data: { publicUrl } } = supabase.storage.from('receipts').getPublicUrl(path)
      await supabase.from('trip_attachments').insert({
        trip_id: id,
        url: publicUrl,
        storage_path: path,
        attachment_type: 'receipt',
      })
      toast.success('Kvittering lastet opp')
      load()
    }
    setUploading(false)
  }

  if (!trip || !form) {
    return <div className="min-h-screen flex items-center justify-center"><p className="text-slate-400">Laster...</p></div>
  }

  const km = form.adjusted_distance_km ?? form.calculated_distance_km ?? 0

  return (
    <div className="min-h-screen p-4 max-w-md mx-auto">
      {/* Header */}
      <div className="flex items-center gap-3 mb-6 pt-2">
        <Link href="/trips" className="p-2 rounded-xl hover:bg-slate-800 cursor-pointer transition-colors">
          <ChevronLeft size={20} className="text-slate-300" />
        </Link>
        <div className="flex-1">
          <h1 className="text-lg font-bold text-white">
            {new Date(trip.start_time).toLocaleDateString('nb-NO', { weekday: 'long', day: 'numeric', month: 'long' })}
          </h1>
          <p className="text-slate-400 text-xs">
            Sist endret: {new Date(trip.updated_at).toLocaleString('nb-NO')}
          </p>
        </div>
        <Button
          onClick={handleSave}
          disabled={saving}
          size="sm"
          className="bg-green-500 hover:bg-green-400 text-slate-900 font-semibold cursor-pointer"
        >
          <Save size={16} className="mr-1" />
          {saving ? 'Lagrer...' : 'Lagre'}
        </Button>
      </div>

      {/* Summary card */}
      <Card className="bg-slate-900 border-slate-700 mb-4">
        <CardContent className="p-4">
          <div className="grid grid-cols-3 gap-4 text-center">
            <div>
              <p className="text-2xl font-bold text-white">{km.toFixed(1)}</p>
              <p className="text-slate-400 text-xs">km</p>
            </div>
            <div>
              <p className="text-2xl font-bold text-green-400">€ {(form.calculated_reimbursement ?? 0).toFixed(2)}</p>
              <p className="text-slate-400 text-xs">beregnet</p>
            </div>
            <div>
              <p className="text-sm font-medium text-white pt-2">
                {new Date(trip.start_time).toLocaleTimeString('nb-NO', { hour: '2-digit', minute: '2-digit' })}
                {trip.stop_time && ` – ${new Date(trip.stop_time).toLocaleTimeString('nb-NO', { hour: '2-digit', minute: '2-digit' })}`}
              </p>
              <p className="text-slate-400 text-xs">tid</p>
            </div>
          </div>
        </CardContent>
      </Card>

      <div className="space-y-4">
        {/* Category */}
        <div>
          <Label className="text-slate-300 mb-2 block">Kategori</Label>
          <div className="flex flex-wrap gap-2">
            {CATEGORIES.map((cat) => (
              <button
                key={cat}
                onClick={() => updateForm('category', cat)}
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
        <div>
          <Label className="text-slate-300 mb-2 block">Kjøretøy</Label>
          <div className="flex gap-2 flex-wrap">
            {vehicles.map((v) => (
              <button
                key={v.id}
                onClick={() => updateForm('vehicle_id', v.id)}
                className={`text-sm px-3 py-2 rounded-xl border transition-colors cursor-pointer ${
                  form.vehicle_id === v.id
                    ? 'bg-green-500/20 border-green-500/50 text-green-400'
                    : 'border-slate-600 text-slate-400 hover:border-slate-400'
                }`}
              >
                {v.name}
              </button>
            ))}
          </div>
        </div>

        {/* Distance */}
        <div>
          <Label htmlFor="distance" className="text-slate-300 mb-2 block">
            Kilometer (justert)
          </Label>
          <Input
            id="distance"
            type="number"
            step="0.1"
            value={form.adjusted_distance_km ?? ''}
            onChange={(e) => updateForm('adjusted_distance_km', parseFloat(e.target.value) || 0)}
            className="bg-slate-800 border-slate-600 text-white h-12 text-base"
          />
          {form.calculated_distance_km !== form.adjusted_distance_km && (
            <p className="text-slate-500 text-xs mt-1">GPS-beregnet: {form.calculated_distance_km?.toFixed(2)} km</p>
          )}
        </div>

        {/* Customer */}
        <div>
          <Label className="text-slate-300 mb-2 block">Kunde / prosjekt</Label>
          <div className="space-y-2">
            {customers.length > 0 && (
              <select
                value={form.customer_id ?? ''}
                onChange={(e) => updateForm('customer_id', e.target.value || null)}
                className="w-full bg-slate-800 border border-slate-600 text-white rounded-lg px-3 py-3 text-base cursor-pointer"
              >
                <option value="">Velg fra kundeliste...</option>
                {customers.map((c) => (
                  <option key={c.id} value={c.id}>{c.name}</option>
                ))}
              </select>
            )}
            <Input
              placeholder="Fritekst kunde / prosjekt"
              value={form.customer_free_text ?? ''}
              onChange={(e) => updateForm('customer_free_text', e.target.value)}
              className="bg-slate-800 border-slate-600 text-white h-12 text-base"
            />
          </div>
        </div>

        {/* Purpose */}
        <div>
          <Label htmlFor="purpose" className="text-slate-300 mb-2 block">Formål</Label>
          <Input
            id="purpose"
            value={form.purpose ?? ''}
            onChange={(e) => updateForm('purpose', e.target.value)}
            placeholder="Hva var hensikten med turen?"
            className="bg-slate-800 border-slate-600 text-white h-12 text-base"
          />
        </div>

        {/* Notes */}
        <div>
          <Label htmlFor="notes" className="text-slate-300 mb-2 block">Notater</Label>
          <Textarea
            id="notes"
            value={form.notes ?? ''}
            onChange={(e) => updateForm('notes', e.target.value)}
            className="bg-slate-800 border-slate-600 text-white text-base resize-none"
            rows={3}
          />
        </div>

        {/* Costs */}
        <Card className="bg-slate-900 border-slate-700">
          <CardHeader className="pb-2 pt-4 px-4">
            <CardTitle className="text-sm text-slate-300">Kostnader</CardTitle>
          </CardHeader>
          <CardContent className="px-4 pb-4 space-y-3">
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label className="text-slate-400 text-xs mb-1 block">Parkering (€)</Label>
                <Input
                  type="number" step="0.01" min="0"
                  value={form.parking_cost ?? 0}
                  onChange={(e) => updateForm('parking_cost', parseFloat(e.target.value) || 0)}
                  className="bg-slate-800 border-slate-600 text-white h-10 text-sm"
                />
              </div>
              <div>
                <Label className="text-slate-400 text-xs mb-1 block">Bomvei (€)</Label>
                <Input
                  type="number" step="0.01" min="0"
                  value={form.toll_cost ?? 0}
                  onChange={(e) => updateForm('toll_cost', parseFloat(e.target.value) || 0)}
                  className="bg-slate-800 border-slate-600 text-white h-10 text-sm"
                />
              </div>
              <div>
                <Label className="text-slate-400 text-xs mb-1 block">Andre kostnader (€)</Label>
                <Input
                  type="number" step="0.01" min="0"
                  value={form.other_cost ?? 0}
                  onChange={(e) => updateForm('other_cost', parseFloat(e.target.value) || 0)}
                  className="bg-slate-800 border-slate-600 text-white h-10 text-sm"
                />
              </div>
              <div>
                <Label className="text-slate-400 text-xs mb-1 block">Km-sats (€/km)</Label>
                <Input
                  type="number" step="0.01" min="0"
                  value={form.mileage_rate ?? 0.26}
                  onChange={(e) => updateForm('mileage_rate', parseFloat(e.target.value) || 0.26)}
                  className="bg-slate-800 border-slate-600 text-white h-10 text-sm"
                />
              </div>
            </div>
            <div className="flex items-center justify-between pt-2 border-t border-slate-700">
              <span className="text-slate-300 text-sm font-medium">Beregnet totalt</span>
              <span className="text-green-400 font-bold">€ {(form.calculated_reimbursement ?? 0).toFixed(2)}</span>
            </div>
          </CardContent>
        </Card>

        {/* Status */}
        <div>
          <Label className="text-slate-300 mb-2 block">Status</Label>
          <div className="flex gap-2">
            {STATUSES.map((s) => (
              <button
                key={s}
                onClick={() => updateForm('status', s)}
                className={`flex-1 py-2 px-2 text-xs rounded-xl border transition-colors cursor-pointer font-medium ${
                  form.status === s
                    ? 'bg-green-500/20 border-green-500/50 text-green-400'
                    : 'border-slate-600 text-slate-400 hover:border-slate-400'
                }`}
              >
                {s}
              </button>
            ))}
          </div>
        </div>

        {/* Attachments */}
        <div>
          <Label className="text-slate-300 mb-2 block flex items-center gap-2">
            <Paperclip size={14} />
            Kvitteringer / bilder
          </Label>
          <label className="block cursor-pointer">
            <div className="border-2 border-dashed border-slate-600 rounded-xl p-4 text-center hover:border-slate-400 transition-colors">
              <p className="text-slate-400 text-sm">
                {uploading ? 'Laster opp...' : 'Trykk for å laste opp bilde/kvittering'}
              </p>
            </div>
            <input type="file" accept="image/*,application/pdf" className="hidden" onChange={handleFileUpload} />
          </label>
          {trip.attachments && trip.attachments.length > 0 && (
            <div className="mt-2 space-y-2">
              {trip.attachments.map((att) => (
                <a
                  key={att.id}
                  href={att.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-2 p-2 bg-slate-800 rounded-lg text-sm text-slate-300 hover:text-white cursor-pointer"
                >
                  <Paperclip size={14} />
                  {att.attachment_type} — {new Date(att.created_at).toLocaleDateString('nb-NO')}
                </a>
              ))}
            </div>
          )}
        </div>

        {/* Audit log */}
        {auditLog.length > 0 && (
          <div>
            <div className="flex items-center gap-2 mb-3">
              <History size={14} className="text-slate-400" />
              <Label className="text-slate-300">Endringslogg</Label>
            </div>
            <div className="space-y-2">
              {auditLog.map((log) => (
                <div key={log.id} className="p-3 bg-slate-900 border border-slate-700 rounded-xl text-xs">
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-slate-300 font-medium">{(log.editor as any)?.name ?? 'Ukjent'}</span>
                    <span className="text-slate-500">{new Date(log.edited_at).toLocaleString('nb-NO')}</span>
                  </div>
                  <p className="text-slate-400">
                    <span className="text-slate-300">{log.field_changed}</span>:{' '}
                    <span className="line-through text-red-400/70">{log.old_value}</span>
                    {' → '}
                    <span className="text-green-400/80">{log.new_value}</span>
                  </p>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
