'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { useLang } from '@/store/langStore'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { toast } from 'sonner'
import type { Profile, Vehicle, TripCategory } from '@/types'
import { LogOut, Car, User, Plus, Trash2, Tag, Globe, Crown, AlertTriangle } from 'lucide-react'
import type { Lang } from '@/lib/translations'
import { useSubscription } from '@/hooks/useSubscription'

export default function SettingsPage() {
  const router = useRouter()
  const { t, lang, setLang } = useLang()
  const CATEGORIES = Object.keys(t.categories) as TripCategory[]

  const { status: subStatus, daysLeft } = useSubscription()
  const [deletingAccount, setDeletingAccount] = useState(false)
  const [profile, setProfile] = useState<Profile | null>(null)
  const [vehicles, setVehicles] = useState<Vehicle[]>([])
  const [profileName, setProfileName] = useState('')
  const [defaultVehicle, setDefaultVehicle] = useState('')
  const [defaultCategory, setDefaultCategory] = useState<TripCategory>('Næring')
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
      setDefaultCategory((prof.default_category as TripCategory) ?? 'Næring')
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
      default_category: defaultCategory,
    }).eq('id', profile.id)
    if (error) toast.error(t.settings.saveError)
    else toast.success(t.settings.profileSaved)
    setSaving(false)
  }

  async function addVehicle() {
    if (!newVehicle.name.trim() || !newVehicle.registration.trim()) return
    const supabase = createClient()
    const { data: { user } } = await supabase.auth.getUser()
    const { error } = await supabase.from('vehicles').insert({ ...newVehicle, owner_id: user?.id })
    if (error) toast.error(t.settings.saveError)
    else {
      toast.success(t.settings.vehicleAdded)
      setNewVehicle({ name: '', registration: '' })
      load()
    }
  }

  async function deleteVehicle(id: string) {
    const supabase = createClient()
    await supabase.from('vehicles').delete().eq('id', id)
    toast.success(t.settings.vehicleDeleted)
    load()
  }

  async function handleLogout() {
    const supabase = createClient()
    await supabase.auth.signOut()
    router.push('/login')
  }

  async function handleDeleteAccount() {
    const confirmed = confirm(
      lang === 'no'
        ? 'Er du sikker på at du vil slette kontoen din? All data slettes permanent og kan ikke angres.'
        : 'Are you sure you want to delete your account? All data will be permanently deleted and cannot be undone.'
    )
    if (!confirmed) return
    const confirmed2 = confirm(
      lang === 'no'
        ? 'Siste sjanse: Alle turer, kunder og data slettes for alltid.'
        : 'Last chance: All trips, customers and data will be deleted forever.'
    )
    if (!confirmed2) return

    setDeletingAccount(true)
    const supabase = createClient()
    // Delete user data first (RLS will handle cascades)
    if (profile) {
      await supabase.from('trips').delete().eq('user_id', profile.id)
      await supabase.from('vehicles').delete().eq('owner_id', profile.id)
      await supabase.from('profiles').delete().eq('id', profile.id)
    }
    await supabase.auth.signOut()
    router.push('/login')
    setDeletingAccount(false)
  }

  return (
    <div className="min-h-screen p-4 max-w-md mx-auto">
      <h1 className="text-xl font-bold text-white mb-6 pt-2">{t.settings.title}</h1>

      {/* Language */}
      <Card className="bg-slate-900 border-slate-700 mb-4">
        <CardHeader className="pb-2 pt-4 px-4">
          <CardTitle className="text-sm text-slate-300 flex items-center gap-2">
            <Globe size={14} />{t.settings.language}
          </CardTitle>
        </CardHeader>
        <CardContent className="px-4 pb-4">
          <p className="text-slate-500 text-xs mb-3">{t.settings.languageHint}</p>
          <div className="flex gap-3">
            {([
              { code: 'no', label: '🇳🇴 Norsk' },
              { code: 'en', label: '🇬🇧 English' },
            ] as { code: Lang; label: string }[]).map(({ code, label }) => (
              <button
                key={code}
                onClick={() => setLang(code)}
                className={`flex-1 py-3 rounded-xl border text-sm font-medium transition-colors cursor-pointer ${
                  lang === code
                    ? 'bg-green-500 border-green-500 text-slate-900 font-semibold'
                    : 'border-slate-600 text-slate-400 hover:border-slate-400'
                }`}
              >
                {label}
              </button>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Profile */}
      <Card className="bg-slate-900 border-slate-700 mb-4">
        <CardHeader className="pb-2 pt-4 px-4">
          <CardTitle className="text-sm text-slate-300 flex items-center gap-2">
            <User size={14} />{t.settings.profile}
          </CardTitle>
        </CardHeader>
        <CardContent className="px-4 pb-4 space-y-3">
          <div>
            <Label className="text-slate-400 text-xs mb-1 block">{t.settings.name}</Label>
            <Input value={profileName} onChange={(e) => setProfileName(e.target.value)} className="bg-slate-800 border-slate-600 text-white h-12 text-base" />
          </div>
          <div>
            <Label className="text-slate-400 text-xs mb-1 block">{t.settings.email}</Label>
            <Input value={profile?.email ?? ''} disabled className="bg-slate-800/50 border-slate-700 text-slate-400 h-12 text-base" />
          </div>
          {vehicles.length > 0 && (
            <div>
              <Label className="text-slate-400 text-xs mb-1 block">{t.settings.defaultVehicle}</Label>
              <select value={defaultVehicle} onChange={(e) => setDefaultVehicle(e.target.value)} className="w-full bg-slate-800 border border-slate-600 text-white rounded-lg px-3 py-3 text-base cursor-pointer">
                <option value="">{t.settings.noDefault}</option>
                {vehicles.map((v) => <option key={v.id} value={v.id}>{v.name} ({v.registration})</option>)}
              </select>
            </div>
          )}
          <Button onClick={saveProfile} disabled={saving} className="w-full h-12 bg-green-500 hover:bg-green-400 text-slate-900 font-semibold cursor-pointer">
            {saving ? t.settings.saving : t.settings.saveProfile}
          </Button>
        </CardContent>
      </Card>

      {/* Default category */}
      <Card className="bg-slate-900 border-slate-700 mb-4">
        <CardHeader className="pb-2 pt-4 px-4">
          <CardTitle className="text-sm text-slate-300 flex items-center gap-2">
            <Tag size={14} />{t.settings.defaultCategory}
          </CardTitle>
        </CardHeader>
        <CardContent className="px-4 pb-4">
          <p className="text-slate-500 text-xs mb-3">{t.settings.defaultCategoryHint}</p>
          <div className="flex flex-wrap gap-2">
            {CATEGORIES.map((cat) => (
              <button
                key={cat}
                onClick={() => setDefaultCategory(cat)}
                className={`text-sm px-3 py-2 rounded-xl border transition-colors cursor-pointer ${
                  defaultCategory === cat
                    ? 'bg-green-500 border-green-500 text-slate-900 font-semibold'
                    : 'border-slate-600 text-slate-400 hover:border-slate-400'
                }`}
              >
                {t.categories[cat as keyof typeof t.categories]}
              </button>
            ))}
          </div>
          <Button onClick={saveProfile} disabled={saving} className="w-full h-12 bg-green-500 hover:bg-green-400 text-slate-900 font-semibold cursor-pointer mt-4">
            {saving ? t.settings.saving : t.settings.saveProfile}
          </Button>
        </CardContent>
      </Card>

      {/* Vehicles */}
      <Card className="bg-slate-900 border-slate-700 mb-4">
        <CardHeader className="pb-2 pt-4 px-4">
          <CardTitle className="text-sm text-slate-300 flex items-center gap-2">
            <Car size={14} />{t.settings.vehicles}
          </CardTitle>
        </CardHeader>
        <CardContent className="px-4 pb-4 space-y-3">
          {vehicles.map((v) => (
            <div key={v.id} className="flex items-center justify-between p-3 bg-slate-800 rounded-xl">
              <div>
                <p className="text-white font-medium text-sm">{v.name}</p>
                <p className="text-slate-400 text-xs">{v.registration}</p>
              </div>
              <button onClick={() => deleteVehicle(v.id)} className="p-2 rounded-xl hover:bg-slate-700 cursor-pointer transition-colors">
                <Trash2 size={16} className="text-red-400" />
              </button>
            </div>
          ))}
          <div className="pt-2 border-t border-slate-700 space-y-2">
            <p className="text-slate-400 text-xs font-medium">{t.settings.addVehicle}</p>
            <Input placeholder={t.settings.vehicleName} value={newVehicle.name} onChange={(e) => setNewVehicle({ ...newVehicle, name: e.target.value })} className="bg-slate-800 border-slate-600 text-white h-12 text-base" />
            <Input placeholder={t.settings.vehicleReg} value={newVehicle.registration} onChange={(e) => setNewVehicle({ ...newVehicle, registration: e.target.value })} className="bg-slate-800 border-slate-600 text-white h-12 text-base" />
            <Button onClick={addVehicle} disabled={!newVehicle.name.trim() || !newVehicle.registration.trim()} className="w-full h-12 bg-slate-700 hover:bg-slate-600 text-white cursor-pointer">
              <Plus size={16} className="mr-2" />{t.settings.addBtn}
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Subscription */}
      <Card className="bg-slate-900 border-slate-700 mb-4">
        <CardHeader className="pb-2 pt-4 px-4">
          <CardTitle className="text-sm text-slate-300 flex items-center gap-2">
            <Crown size={14} className="text-amber-400" />
            {lang === 'no' ? 'Abonnement' : 'Subscription'}
          </CardTitle>
        </CardHeader>
        <CardContent className="px-4 pb-4">
          {subStatus === 'trial' && (
            <div className="flex items-center justify-between">
              <div>
                <p className="text-white text-sm font-medium">
                  {lang === 'no' ? 'Prøveperiode' : 'Trial'}
                </p>
                <p className="text-slate-400 text-xs">
                  {lang === 'no'
                    ? `${daysLeft ?? '?'} dager igjen`
                    : `${daysLeft ?? '?'} days remaining`}
                </p>
              </div>
              <Button
                onClick={() => router.push('/subscribe')}
                size="sm"
                className="bg-green-500 hover:bg-green-400 text-slate-900 font-semibold cursor-pointer"
              >
                {lang === 'no' ? 'Oppgrader' : 'Upgrade'}
              </Button>
            </div>
          )}
          {subStatus === 'active' && (
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 rounded-full bg-green-400" />
              <p className="text-green-400 text-sm font-medium">
                {lang === 'no' ? 'Aktivt abonnement' : 'Active subscription'}
              </p>
            </div>
          )}
          {subStatus === 'free' && (
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 rounded-full bg-amber-400" />
              <p className="text-amber-400 text-sm font-medium">
                {lang === 'no' ? 'Gratis tilgang (kode)' : 'Free access (promo code)'}
              </p>
            </div>
          )}
          {subStatus === 'expired' && (
            <div className="flex items-center justify-between">
              <p className="text-red-400 text-sm">
                {lang === 'no' ? 'Abonnement utløpt' : 'Subscription expired'}
              </p>
              <Button
                onClick={() => router.push('/subscribe')}
                size="sm"
                className="bg-green-500 hover:bg-green-400 text-slate-900 font-semibold cursor-pointer"
              >
                {lang === 'no' ? 'Forny' : 'Renew'}
              </Button>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Logout */}
      <Button onClick={handleLogout} variant="outline" className="w-full h-12 border-red-500/30 text-red-400 hover:bg-red-500/10 hover:border-red-500/50 cursor-pointer mb-3">
        <LogOut size={16} className="mr-2" />{t.settings.logout}
      </Button>

      {/* Delete account */}
      <button
        onClick={handleDeleteAccount}
        disabled={deletingAccount}
        className="w-full text-slate-600 text-xs text-center py-2 hover:text-red-400 transition-colors cursor-pointer"
      >
        <AlertTriangle size={12} className="inline mr-1" />
        {lang === 'no' ? 'Slett konto og all data' : 'Delete account and all data'}
      </button>

      <p className="text-slate-600 text-xs text-center mt-6">{t.settings.footer}</p>
    </div>
  )
}
