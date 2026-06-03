'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { useLang } from '@/store/langStore'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { toast } from 'sonner'
import { Capacitor } from '@capacitor/core'
import { purchaseMonthly, restorePurchases } from '@/lib/revenuecat'
import {
  Car, Check, Tag, Zap, FileText, Wifi, Crown, ArrowRight, Gift, RotateCcw
} from 'lucide-react'

const FEATURES = [
  { icon: Car,      no: 'GPS-sporing av km i sanntid',     en: 'Real-time GPS km tracking' },
  { icon: FileText, no: 'PDF og CSV-eksport',              en: 'PDF and CSV export' },
  { icon: Zap,      no: 'Ubegrenset antall turer',        en: 'Unlimited trips' },
  { icon: Wifi,     no: 'Offline-støtte',                  en: 'Offline support' },
  { icon: Check,    no: 'To brukere inkludert',            en: 'Two users included' },
]

export default function SubscribePage() {
  const router = useRouter()
  const { lang } = useLang()
  const no = lang === 'no'

  const [promoCode, setPromoCode] = useState('')
  const [promoLoading, setPromoLoading] = useState(false)
  const [promoSuccess, setPromoSuccess] = useState(false)
  const [purchasing, setPurchasing] = useState(false)
  const [restoring, setRestoring] = useState(false)
  const isNative = Capacitor.isNativePlatform()

  async function handlePurchase() {
    if (!isNative) {
      toast.info(no ? 'Abonnement krever iOS-appen' : 'Subscription requires the iOS app')
      return
    }
    setPurchasing(true)
    const result = await purchaseMonthly()
    if (result === 'success') {
      toast.success(no ? 'Abonnement aktivert!' : 'Subscription activated!')
      router.push('/dashboard')
    } else if (result === 'cancelled') {
      toast.info(no ? 'Avbrutt' : 'Cancelled')
    } else {
      toast.error(no ? 'Noe gikk galt. Prøv igjen.' : 'Something went wrong. Please try again.')
    }
    setPurchasing(false)
  }

  async function handleRestore() {
    if (!isNative) return
    setRestoring(true)
    const ok = await restorePurchases()
    if (ok) {
      toast.success(no ? 'Kjøp gjenopprettet!' : 'Purchase restored!')
      router.push('/dashboard')
    } else {
      toast.error(no ? 'Ingen aktive kjøp funnet' : 'No active purchases found')
    }
    setRestoring(false)
  }

  const errorMessages: Record<string, string> = {
    invalid_code:  no ? 'Ugyldig kode'              : 'Invalid code',
    code_expired:  no ? 'Koden er utløpt'           : 'Code has expired',
    code_used_up:  no ? 'Koden er brukt opp'        : 'Code fully redeemed',
    already_used:  no ? 'Du har allerede brukt denne koden' : 'You already used this code',
  }

  async function handlePromo() {
    if (!promoCode.trim()) return
    setPromoLoading(true)

    const res = await fetch('/api/promo/redeem', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ code: promoCode.trim() }),
    })

    if (res.status === 429) {
      toast.error(no ? 'For mange forsøk. Prøv igjen om en time.' : 'Too many attempts. Try again in an hour.')
    } else {
      const data = await res.json()
      if (!data?.success) {
        const key = data?.error ?? 'invalid_code'
        toast.error(errorMessages[key] ?? (no ? 'Ugyldig kode' : 'Invalid code'))
      } else {
        setPromoSuccess(true)
        toast.success(no ? 'Kode aktivert! Gratis tilgang aktivert.' : 'Code activated! Free access granted.')
        setTimeout(() => router.push('/dashboard'), 1500)
      }
    }
    setPromoLoading(false)
  }

  return (
    <div className="min-h-screen bg-slate-950 flex flex-col items-center justify-start p-4 pb-16">

      {/* Logo */}
      <div className="flex flex-col items-center gap-3 mt-12 mb-8">
        <div className="w-20 h-20 rounded-3xl bg-green-500/20 border border-green-500/30 flex items-center justify-center shadow-lg shadow-green-500/10">
          <Car size={40} className="text-green-400" />
        </div>
        <h1 className="text-2xl font-bold text-white">Kjørebok</h1>
        <p className="text-slate-400 text-sm">
          {no ? 'Kjørelogg for Spania' : 'Mileage log for Spain'}
        </p>
      </div>

      {/* Trial badge */}
      <div className="flex items-center gap-2 bg-green-500/10 border border-green-500/20 rounded-full px-4 py-2 mb-8">
        <Crown size={14} className="text-green-400" />
        <span className="text-green-400 text-sm font-medium">
          {no ? '14 dager gratis prøveperiode' : '14-day free trial'}
        </span>
      </div>

      {/* Pricing card */}
      <div className="w-full max-w-sm">
        <div className="relative bg-slate-900 border border-slate-700 rounded-2xl p-6 mb-4 overflow-hidden">
          {/* Glow */}
          <div className="absolute -top-10 -right-10 w-40 h-40 bg-green-500/10 rounded-full blur-3xl pointer-events-none" />

          <div className="flex items-baseline gap-1 mb-1">
            <span className="text-4xl font-bold text-white">49</span>
            <span className="text-slate-400 text-lg">kr</span>
            <span className="text-slate-500 text-sm ml-1">/ {no ? 'mnd' : 'mo'}</span>
          </div>
          <p className="text-slate-500 text-xs mb-6">
            {no ? 'Ingen bindingstid. Avslutt når som helst.' : 'No commitment. Cancel anytime.'}
          </p>

          <ul className="space-y-3 mb-6">
            {FEATURES.map(({ icon: Icon, no: textNo, en: textEn }) => (
              <li key={textNo} className="flex items-center gap-3">
                <div className="w-5 h-5 rounded-full bg-green-500/20 flex items-center justify-center flex-shrink-0">
                  <Check size={11} className="text-green-400" />
                </div>
                <span className="text-slate-300 text-sm">{no ? textNo : textEn}</span>
              </li>
            ))}
          </ul>

          {/* Apple Subscribe button */}
          <Button
            className="w-full h-14 bg-green-500 hover:bg-green-400 text-slate-900 font-bold text-base rounded-xl cursor-pointer flex items-center justify-center gap-2 transition-all active:scale-95"
            onClick={handlePurchase}
            disabled={purchasing}
          >
            {purchasing ? (
              <div className="w-5 h-5 border-2 border-slate-900 border-t-transparent rounded-full animate-spin" />
            ) : (
              <Crown size={18} />
            )}
            {purchasing
              ? (no ? 'Behandler...' : 'Processing...')
              : (no ? 'Start gratis prøveperiode' : 'Start free trial')}
            {!purchasing && <ArrowRight size={16} className="ml-1" />}
          </Button>

          {isNative && (
            <button
              onClick={handleRestore}
              disabled={restoring}
              className="w-full text-slate-500 text-xs text-center mt-2 py-2 cursor-pointer hover:text-slate-300 transition-colors flex items-center justify-center gap-1"
            >
              <RotateCcw size={11} />
              {restoring
                ? (no ? 'Gjenoppretter...' : 'Restoring...')
                : (no ? 'Gjenopprett kjøp' : 'Restore purchases')}
            </button>
          )}

          <p className="text-slate-600 text-xs text-center mt-2">
            {no
              ? 'Betaling via App Store. Avslutt når som helst.'
              : 'Billed via App Store. Cancel anytime.'}
          </p>
        </div>

        {/* Divider */}
        <div className="flex items-center gap-3 mb-4">
          <div className="flex-1 h-px bg-slate-800" />
          <span className="text-slate-600 text-xs">{no ? 'eller' : 'or'}</span>
          <div className="flex-1 h-px bg-slate-800" />
        </div>

        {/* Promo code card */}
        <div className="bg-slate-900 border border-slate-700 rounded-2xl p-5">
          <div className="flex items-center gap-2 mb-1">
            <Gift size={16} className="text-amber-400" />
            <h3 className="text-white font-semibold text-sm">
              {no ? 'Har du en kampanjekode?' : 'Have a promo code?'}
            </h3>
          </div>
          <p className="text-slate-500 text-xs mb-4">
            {no ? 'Skriv inn koden for gratis tilgang' : 'Enter your code for free access'}
          </p>

          {promoSuccess ? (
            <div className="flex items-center gap-2 p-3 bg-green-500/10 border border-green-500/30 rounded-xl">
              <Check size={16} className="text-green-400" />
              <span className="text-green-400 text-sm font-medium">
                {no ? 'Gratis tilgang aktivert!' : 'Free access activated!'}
              </span>
            </div>
          ) : (
            <div className="flex gap-2">
              <div className="relative flex-1">
                <Tag size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" />
                <Input
                  value={promoCode}
                  onChange={(e) => setPromoCode(e.target.value.toUpperCase())}
                  onKeyDown={(e) => e.key === 'Enter' && handlePromo()}
                  placeholder={no ? 'KODE123' : 'CODE123'}
                  className="pl-9 bg-slate-800 border-slate-600 text-white h-12 text-base font-mono tracking-widest uppercase"
                  maxLength={30}
                  autoCapitalize="characters"
                  autoCorrect="off"
                  spellCheck={false}
                />
              </div>
              <Button
                onClick={handlePromo}
                disabled={promoLoading || !promoCode.trim()}
                className="h-12 px-4 bg-amber-500 hover:bg-amber-400 text-slate-900 font-bold rounded-xl cursor-pointer transition-all active:scale-95"
              >
                {promoLoading ? (
                  <div className="w-4 h-4 border-2 border-slate-900 border-t-transparent rounded-full animate-spin" />
                ) : (
                  <Check size={16} />
                )}
              </Button>
            </div>
          )}
        </div>

        <p className="text-slate-600 text-xs text-center mt-6 leading-relaxed px-2">
          {no
            ? 'Beregnet kilometergodtgjørelse er ikke skattegarantert. Vurdér med regnskapsfører.'
            : 'Estimated mileage reimbursement is not tax-guaranteed. Consult your accountant.'}
        </p>
      </div>
    </div>
  )
}
