# Kjørebok — Oppsett

## Teknologier
- Next.js 14 App Router + TypeScript
- Tailwind CSS + shadcn/ui (mørkt tema, grønn CTA)
- Supabase Auth + Postgres + Storage
- Zustand (offline state, localStorage persist)
- idb (IndexedDB for offline trips)
- jsPDF + jspdf-autotable (PDF-rapport)

## 1. Opprett Supabase-prosjekt

1. Gå til [supabase.com](https://supabase.com) og opprett et nytt prosjekt
2. Kopier **Project URL** og **anon key** fra Settings → API
3. Legg inn i `.env.local`:

```
NEXT_PUBLIC_SUPABASE_URL=https://xxxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbG...
```

## 2. Kjør databasemigrasjon

I Supabase Dashboard → SQL Editor, kopier inn innholdet fra:
```
supabase/migrations/001_initial_schema.sql
```

Kjør hele filen.

## 3. Opprett brukere

I Supabase Dashboard → Authentication → Users:
- Legg til Leif: leif@epost.no
- Legg til Kamila: kamila@epost.no

Eller bruk `/register`-siden i appen.

## 4. Kjør lokalt

```bash
npm install
npm run dev
```

Åpne http://localhost:3000

## 5. PWA på iPhone

1. Deploy til Vercel: `npx vercel`
2. Åpne siden i Safari på iPhone
3. Del-knapp → "Legg til på hjem-skjerm"

## Appsider

| Side | URL |
|------|-----|
| Dashboard (Start/Stopp tur) | /dashboard |
| Alle turer | /trips |
| Turdetaljer + rediger | /trip/[id] |
| Manuell ny tur | /trip/new |
| Kunder | /customers |
| Rapporter + eksport | /reports |
| Innstillinger + kjøretøy | /settings |

## Viktig om beregnet godtgjørelse

Appen beregner **estimert km-godtgjørelse** basert på Agencia Tributaria sin sats (0,26 €/km per Orden HFP/792/2023). Dette er **ikke** en godkjenning av skattefradrag — regnskapsfører/rådgiver må vurdere den faktiske behandlingen.

## Legg til kjøretøy

Gå til **Innstillinger** → legg til bil med navn og reg.nr. Sett gjerne en standard-bil per bruker.
