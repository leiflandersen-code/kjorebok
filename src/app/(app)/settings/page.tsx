'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { toast } from 'sonner'
import type { Profile, Vehicle } from '@/types'
import { LogOut, Car, User, Plus, Trash2 } from 'lucide-react'

export default function SettingsPage() {
  const router = useRouter()
  const [profile, setProfile] = useState<Profile | null>(null)
  const [vehicles, setVehicles] = useState<Vehicle[]>([])
  const [profileName, setProfileName] = useState('')
  const [defaultVehicle, setDefaultVehicle] = useState('')
  const [newVehicle, setNewVehicle] = useState({ name: '', registration: '' })
  const [saving, setSaving] = useState(false)

  useEffect(() => { load() }, [])

  async function load() {
    const supabase = createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return

    const [{ data: prof }, { data: veh }] = await Promise.all([
      supabase.from('profiles').select('*').eq('id', user.id).single(),
      supabase.from('vehicles').select('*').order('name'),
    ])
    if (prof) {
      setProfile(prof)
      setProfileName(prof.name)
      setDefaultVehicle(prof.default_vehicle_id ?? '')
    }
    setVehicles(veh ?? [])
  }

  async function saveProfile() {
    if (!profile) return
    setSaving(true)
    const supabase = createClient()
    const { error } = await supabase.from('profiles').update({
      name: profileName,
      default_vehicle_id: defaultVehicle || null,
    }).eq('id', profile.id)

    if (error) toast.error('Feil ved lagring')
    else toast.success('Profil oppdatert')
    setSaving(false)
  }

  async function addVehicle() {
    if (!newVehicle.name.trim() || !newVehicle.registration.trim()) return
    const supabase = createClient()
    const { data: { user } } = await supabase.auth.getUser()
    const { error } = await supabase.from('vehicles').insert({
      ...newVehicle,
      owner_id: user?.id,
    })
    if (error) toast.error('Feil ved lagring')
    else {
      toast.success('Kjøretøy lagt til')
      setNewVehicle({ name: '', registration: '' })
      load()
    }
  }

  async function deleteVehicle(id: string) {
    const supabase = createClient()
    await supabase.from('vehicles').delete().eq('id', id)
    toast.success('Kjøretøy slettet')
    load()
  }

  async function handleLogout() {
    const supabase = createClient()
    await supabase.auth.signOut()
    router.push('/login')
  }

  return (
    <div className="min-h-screen p-4 max-w-md mx-auto">
      <h1 className="text-xl font-bold text-white mb-6 pt-2">Innstillinger</h1>

      {/* Profile */}
      <Card className="bg-slate-900 border-slate-700 mb-4">
        <CardHeader className="pb-2 pt-4 px-4">
          <CardTitle className="text-sm text-slate-300 flex items-center gap-2">
            <User size={14} />
            Profil
          </CardTitle>
        </CardHeader>
        <CardContent className="px-4 pb-4 space-y-3">
          <div>
            <Label className="text-slate-400 text-xs mb-1 block">Navn</Label>
            <Input
              value={profileName}
              onChange={(e) => setProfileName(e.target.value)}
              className="bg-slate-800 border-slate-600 text-white h-12 text-base"
            />
          </div>
          <div>
            <Label className="text-slate-400 text-xs mb-1 block">E-post</Label>
            <Input
              value={profile?.email ?? ''}
              disabled
              className="bg-slate-800/50 border-slate-700 text-slate-400 h-12 text-base"
            />
          </div>
          {vehicles.length > 0 && (
            <div>
              <Label className="text-slate-400 text-xs mb-1 block">Standard kjøretøy</Label>
              <select
                value={defaultVehicle}
                onChange={(e) => setDefaultVehicle(e.target.value)}
                className="w-full bg-slate-800 border border-slate-600 text-white rounded-lg px-3 py-3 text-base cursor-pointer"
              >
                <option value="">Ingen standard</option>
                {vehicles.map((v) => <option key={v.id} value={v.id}>{v.name} ({v.registration})</option>)}
              </select>
            </div>
          )}
          <Button
            onClick={saveProfile}
            disabled={saving}
            className="w-full h-12 bg-green-500 hover:bg-green-400 text-slate-900 font-semibold cursor-pointer"
          >
            {saving ? 'Lagrer...' : 'Lagre profil'}
          </Button>
        </CardContent>
      </Card>

      {/* Vehicles */}
      <Card className="bg-slate-900 border-slate-700 mb-4">
        <CardHeader className="pb-2 pt-4 px-4">
          <CardTitle className="text-sm text-slate-300 flex items-center gap-2">
            <Car size={14} />
            Kjøretøy
          </CardTitle>
        </CardHeader>
        <CardContent className="px-4 pb-4 space-y-3">
          {vehicles.map((v) => (
            <div key={v.id} className="flex items-center justify-between p-3 bg-slate-800 rounded-xl">
              <div>
                <p className="text-white font-medium text-sm">{v.name}</p>
                <p className="text-slate-400 text-xs">{v.registration}</p>
              </div>
              <button
                onClick={() => deleteVehicle(v.id)}
                className="p-2 rounded-xl hover:bg-slate-700 cursor-pointer transition-colors"
              >
                <Trash2 size={16} className="text-red-400" />
              </button>
            </div>
          ))}
          <div className="pt-2 border-t border-slate-700 space-y-2">
            <p className="text-slate-400 text-xs font-medium">Legg til kjøretøy</p>
            <Input
              placeholder="Navn (f.eks. VW Golf)"
              value={newVehicle.name}
              onChange={(e) => setNewVehicle({ ...newVehicle, name: e.target.value })}
              className="bg-slate-800 border-slate-600 text-white h-12 text-base"
            />
            <Input
              placeholder="Reg.nr. (f.eks. AB12345)"
              value={newVehicle.registration}
              onChange={(e) => setNewVehicle({ ...newVehicle, registration: e.target.value })}
              className="bg-slate-800 border-slate-600 text-white h-12 text-base"
            />
            <Button
              onClick={addVehicle}
              disabled={!newVehicle.name.trim() || !newVehicle.registration.trim()}
              className="w-full h-12 bg-slate-700 hover:bg-slate-600 text-white cursor-pointer"
            >
              <Plus size={16} className="mr-2" />
              Legg til
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Logout */}
      <Button
        onClick={handleLogout}
        variant="outline"
        className="w-full h-12 border-red-500/30 text-red-400 hover:bg-red-500/10 hover:border-red-500/50 cursor-pointer"
      >
        <LogOut size={16} className="mr-2" />
        Logg ut
      </Button>

      <p className="text-slate-600 text-xs text-center mt-6">
        Kjørebok v1.0 · For Leif og Kamila
      </p>
    </div>
  )
}
