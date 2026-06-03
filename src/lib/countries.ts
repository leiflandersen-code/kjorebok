/**
 * Offisielle kilometersatser per land
 * Oppdateres manuelt ved behov — brukere oppfordres til å verifisere.
 * Sist oppdatert: Juni 2025
 */

export interface CountryRate {
  code: string          // ISO 3166-1 alpha-2
  flag: string
  name: { no: string; en: string }
  rate: number          // per km
  currency: string      // ISO 4217
  symbol: string        // valutasymbol
  rateLabel: string     // f.eks. "€/km" eller "kr/km"
  source: string        // navn på regelverk
  sourceUrl: string
  year: number
  notes?: { no: string; en: string }
}

export const COUNTRY_RATES: CountryRate[] = [
  {
    code: 'ES',
    flag: '🇪🇸',
    name: { no: 'Spania', en: 'Spain' },
    rate: 0.26,
    currency: 'EUR',
    symbol: '€',
    rateLabel: '€/km',
    source: 'Agencia Tributaria (Hacienda)',
    sourceUrl: 'https://www.agenciatributaria.es',
    year: 2025,
    notes: {
      no: 'Gjelder for ansatte. Selvstendig næringsdrivende har egne regler.',
      en: 'Applies to employees. Self-employed have separate rules.',
    },
  },
  {
    code: 'NO',
    flag: '🇳🇴',
    name: { no: 'Norge', en: 'Norway' },
    rate: 4.01,
    currency: 'NOK',
    symbol: 'kr',
    rateLabel: 'kr/km',
    source: 'Statens personalhåndbok / Skatteetaten',
    sourceUrl: 'https://www.skatteetaten.no',
    year: 2025,
    notes: {
      no: 'Statens sats 2025. Gjelder opp til 10 000 km. Over 10 000 km: 3,47 kr/km.',
      en: 'Government rate 2025. Applies up to 10,000 km. Above 10,000 km: NOK 3.47/km.',
    },
  },
  {
    code: 'SE',
    flag: '🇸🇪',
    name: { no: 'Sverige', en: 'Sweden' },
    rate: 2.50,
    currency: 'SEK',
    symbol: 'kr',
    rateLabel: 'kr/km',
    source: 'Skatteverket',
    sourceUrl: 'https://www.skatteverket.se',
    year: 2025,
    notes: {
      no: 'Skattefri sats for bruk av privat bil i jobben.',
      en: 'Tax-free rate for using private car for work.',
    },
  },
  {
    code: 'DK',
    flag: '🇩🇰',
    name: { no: 'Danmark', en: 'Denmark' },
    rate: 3.73,
    currency: 'DKK',
    symbol: 'kr',
    rateLabel: 'kr/km',
    source: 'Skatterådet',
    sourceUrl: 'https://www.skattestyrelsen.dk',
    year: 2025,
    notes: {
      no: 'Laveste sats (over 20 000 km/år). Under 20 000 km: 4,10 kr/km.',
      en: 'Lower rate (above 20,000 km/year). Below 20,000 km: DKK 4.10/km.',
    },
  },
  {
    code: 'DE',
    flag: '🇩🇪',
    name: { no: 'Tyskland', en: 'Germany' },
    rate: 0.30,
    currency: 'EUR',
    symbol: '€',
    rateLabel: '€/km',
    source: 'Bundesministerium der Finanzen',
    sourceUrl: 'https://www.bundesfinanzministerium.de',
    year: 2025,
    notes: {
      no: 'Skattefri sats (Kilometerpauschale) for tjenestereiser.',
      en: 'Tax-free flat rate (Kilometerpauschale) for business travel.',
    },
  },
  {
    code: 'FR',
    flag: '🇫🇷',
    name: { no: 'Frankrike', en: 'France' },
    rate: 0.529,
    currency: 'EUR',
    symbol: '€',
    rateLabel: '€/km',
    source: 'Ministère des Finances (barème fiscal)',
    sourceUrl: 'https://www.impots.gouv.fr',
    year: 2025,
    notes: {
      no: 'Gjelder 5-hesters bil opp til 5 000 km. Sats varierer etter motorstørrelse og distanse.',
      en: 'Applies to 5 CV car up to 5,000 km. Rate varies by engine size and distance.',
    },
  },
  {
    code: 'NL',
    flag: '🇳🇱',
    name: { no: 'Nederland', en: 'Netherlands' },
    rate: 0.23,
    currency: 'EUR',
    symbol: '€',
    rateLabel: '€/km',
    source: 'Belastingdienst',
    sourceUrl: 'https://www.belastingdienst.nl',
    year: 2025,
  },
  {
    code: 'PT',
    flag: '🇵🇹',
    name: { no: 'Portugal', en: 'Portugal' },
    rate: 0.36,
    currency: 'EUR',
    symbol: '€',
    rateLabel: '€/km',
    source: 'Autoridade Tributária e Aduaneira',
    sourceUrl: 'https://www.portaldasfinancas.gov.pt',
    year: 2025,
  },
  {
    code: 'GB',
    flag: '🇬🇧',
    name: { no: 'Storbritannia', en: 'United Kingdom' },
    rate: 0.28,
    currency: 'GBP',
    symbol: '£',
    rateLabel: '£/km',
    source: 'HMRC (45p/mile converted to per km)',
    sourceUrl: 'https://www.gov.uk/expenses-and-benefits-business-travel-mileage',
    year: 2025,
    notes: {
      no: '45p per mile (opp til 10 000 miles) = ca. 0,28 £/km.',
      en: '45p per mile (up to 10,000 miles) = approx £0.28/km.',
    },
  },
  {
    code: 'US',
    flag: '🇺🇸',
    name: { no: 'USA', en: 'United States' },
    rate: 0.42,
    currency: 'USD',
    symbol: '$',
    rateLabel: '$/km',
    source: 'IRS (67 cents/mile converted to per km)',
    sourceUrl: 'https://www.irs.gov/tax-professionals/standard-mileage-rates',
    year: 2025,
    notes: {
      no: 'IRS standardsats: $0,67/mile = ca. $0,42/km.',
      en: 'IRS standard rate: $0.67/mile = approx $0.42/km.',
    },
  },
  {
    code: 'OTHER',
    flag: '🌍',
    name: { no: 'Annet land', en: 'Other country' },
    rate: 0.26,
    currency: 'EUR',
    symbol: '€',
    rateLabel: '€/km',
    source: 'Manuelt satt',
    sourceUrl: '',
    year: 2025,
    notes: {
      no: 'Sett satsen manuelt basert på ditt lands regelverk.',
      en: 'Set the rate manually based on your country\'s regulations.',
    },
  },
]

export function getCountryRate(code: string): CountryRate {
  return COUNTRY_RATES.find((c) => c.code === code) ?? COUNTRY_RATES[0]
}

export const DEFAULT_COUNTRY = 'ES'
