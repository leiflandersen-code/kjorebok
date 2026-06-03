'use client'

import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useLang } from '@/store/langStore'
import { COUNTRY_RATES, getCountryRate } from '@/lib/countries'
import { Button } from '@/components/ui/button'
import { toast } from 'sonner'
import { MapPin, AlertTriangle, ExternalLink, ChevronRight } from 'lucide-react'

interface Props {
  userId: string
  onDone: () => void
}

export function CountryOnboarding({ userId, onDone }: Props) {
  const { lang } = useLang()
  const no = lang === 'no'
  const [selected, setSelected] = useState('ES')
  const [saving, setSaving] = useState(false)

  const country = getCountryRate(selected)

  async function handleSave() {
    setSaving(true)
    const supabase = createClient()
    const { error } = await supabase.from('profiles').update({
      country_code: country.code,
      mileage_rate: country.rate,
      currency_code: country.currency,
      currency_symbol: country.symbol,
      country_selected_at: new Date().toISOString(),
    }).eq('id', userId)

    if (error) {
      toast.error(no ? 'Feil ved lagring' : 'Error saving')
    } else {
      toast.success(no ? 'Land og sats lagret!' : 'Country and rate saved!')
      onDone()
    }
    setSaving(false)
  }

  return (
    <div className="fixed inset-0 bg-slate-950/95 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="w-full max-w-sm bg-slate-900 border border-slate-700 rounded-2xl overflow-hidden shadow-2xl">

        {/* Header */}
        <div className="p-6 pb-4 border-b border-slate-800">
          <div className="flex items-center gap-3 mb-2">
            <div className="w-10 h-10 rounded-xl bg-green-500/20 flex items-center justify-center">
              <MapPin size={20} className="text-green-400" />
            </div>
            <h2 className="text-white font-bold text-lg">
              {no ? 'Hvilket land kjører du i?' : 'Which country do you drive in?'}
            </h2>
          </div>
          <p className="text-slate-400 text-sm">
            {no
              ? 'Vi setter riktig km-sats automatisk. Du kan endre dette når som helst i innstillinger.'
              : 'We\'ll set the correct mileage rate automatically. You can change this anytime in settings.'}
          </p>
        </div>

        {/* Country list */}
        <div className="max-h-72 overflow-y-auto p-3 space-y-1">
          {COUNTRY_RATES.map((c) => (
            <button
              key={c.code}
              onClick={() => setSelected(c.code)}
              className={`w-full flex items-center justify-between px-4 py-3 rounded-xl transition-colors cursor-pointer text-left ${
                selected === c.code
                  ? 'bg-green-500/15 border border-green-500/40'
                  : 'hover:bg-slate-800 border border-transparent'
              }`}
            >
              <div className="flex items-center gap-3">
                <span className="text-xl">{c.flag}</span>
                <div>
                  <p className="text-white text-sm font-medium">{no ? c.name.no : c.name.en}</p>
                  <p className="text-slate-500 text-xs">{c.source}</p>
                </div>
              </div>
              <div className="text-right flex-shrink-0 ml-3">
                <p className={`text-sm font-bold ${selected === c.code ? 'text-green-400' : 'text-slate-300'}`}>
                  {c.rate.toFixed(2)} {c.rateLabel}
                </p>
                <p className="text-slate-600 text-xs">{c.year}</p>
              </div>
            </button>
          ))}
        </div>

        {/* Selected country detail */}
        <div className="px-4 pb-2">
          <div className="bg-slate-800 rounded-xl p-3 mb-3">
            <div className="flex items-start gap-2">
              <AlertTriangle size={14} className="text-amber-400 mt-0.5 flex-shrink-0" />
              <div className="text-xs text-slate-400 leading-relaxed">
                {no
                  ? `Beregnet sats: ${country.rate} ${country.rateLabel} (${country.source}, ${country.year}). `
                  : `Estimated rate: ${country.rate} ${country.rateLabel} (${country.source}, ${country.year}). `}
                {country.notes && (no ? country.notes.no : country.notes.en)}
                {' '}
                {no
                  ? 'Kontroller alltid gjeldende satser med regnskapsfører.'
                  : 'Always verify current rates with your accountant.'}
                {country.sourceUrl && (
                  <a
                    href={country.sourceUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1 text-green-400 ml-1 hover:underline"
                  >
                    {no ? 'Kilde' : 'Source'} <ExternalLink size={10} />
                  </a>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="px-4 pb-5">
          <Button
            onClick={handleSave}
            disabled={saving}
            className="w-full h-12 bg-green-500 hover:bg-green-400 text-slate-900 font-bold rounded-xl cursor-pointer flex items-center justify-center gap-2"
          >
            {saving ? (
              <div className="w-4 h-4 border-2 border-slate-900 border-t-transparent rounded-full animate-spin" />
            ) : (
              <>
                {no ? 'Bekreft valg' : 'Confirm selection'}
                <ChevronRight size={16} />
              </>
            )}
          </Button>
          <p className="text-slate-600 text-xs text-center mt-2">
            {no ? 'Kan endres i Innstillinger → Km-sats' : 'Can be changed in Settings → Mileage rate'}
          </p>
        </div>
      </div>
    </div>
  )
}
