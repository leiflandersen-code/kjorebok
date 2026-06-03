import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import { translations, type Lang, type Translations } from '@/lib/translations'

interface LangStore {
  lang: Lang
  t: Translations
  setLang: (lang: Lang) => void
}

export const useLang = create<LangStore>()(
  persist(
    (set) => ({
      lang: 'no',
      t: translations['no'],
      setLang: (lang) => set({ lang, t: translations[lang] }),
    }),
    { name: 'kjorebok-lang' }
  )
)
