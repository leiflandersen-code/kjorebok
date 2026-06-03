export default function PrivacyPage() {
  return (
    <div className="min-h-screen bg-slate-950 text-slate-300 p-6 max-w-2xl mx-auto">
      <div className="py-12">
        <div className="flex items-center gap-3 mb-8">
          <div className="w-10 h-10 rounded-xl bg-green-500/20 flex items-center justify-center">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#22c55e" strokeWidth="2">
              <path d="M19 17H5a2 2 0 0 1-2-2V9a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2v6a2 2 0 0 1-2 2z"/>
              <path d="M12 12m-1 0a1 1 0 1 0 2 0a1 1 0 1 0-2 0"/>
              <path d="M8 9V7a4 4 0 0 1 8 0v2"/>
            </svg>
          </div>
          <div>
            <h1 className="text-xl font-bold text-white">Personvernerklæring</h1>
            <p className="text-slate-500 text-xs">Privacy Policy — Kjørebok</p>
          </div>
        </div>

        <p className="text-slate-500 text-sm mb-8">Sist oppdatert: Juni 2025</p>

        <div className="space-y-8 text-sm leading-relaxed">

          <section>
            <h2 className="text-white font-semibold text-base mb-3">1. Hvem er ansvarlig</h2>
            <p>Kjørebok-appen er utviklet og driftet som en privat tjeneste. For spørsmål om personvern, kontakt: <a href="mailto:leif.landersen@gmail.com" className="text-green-400 underline">leif.landersen@gmail.com</a></p>
          </section>

          <section>
            <h2 className="text-white font-semibold text-base mb-3">2. Hvilke data samler vi inn</h2>
            <ul className="space-y-2 list-none">
              {[
                ['GPS-posisjon', 'Brukes kun for å beregne kjørt distanse. Lagres som start- og stopppunkt per tur.'],
                ['E-postadresse', 'Brukes til innlogging. Deles ikke med tredjeparter.'],
                ['Turopplysninger', 'Dato, distanse, kategori, kjøretøy, formål og kostnader du selv legger inn.'],
                ['Profilnavn', 'Vises i apper og rapporter.'],
              ].map(([label, desc]) => (
                <li key={label} className="flex gap-3">
                  <span className="text-green-400 mt-0.5 flex-shrink-0">→</span>
                  <span><span className="text-white font-medium">{label}:</span> {desc}</span>
                </li>
              ))}
            </ul>
          </section>

          <section>
            <h2 className="text-white font-semibold text-base mb-3">3. Bakgrunns-GPS</h2>
            <p>Appen kan spore GPS-posisjon i bakgrunnen mens en tur er aktiv. Dette krever at du gir tillatelse til «Alltid» bruk av lokasjon. Sporingen stopper automatisk når turen avsluttes. Vi lagrer <strong className="text-white">ikke</strong> kontinuerlig sporingshistorikk — kun start- og sluttposisjon.</p>
          </section>

          <section>
            <h2 className="text-white font-semibold text-base mb-3">4. Hvor lagres data</h2>
            <p>All data lagres i <a href="https://supabase.com" className="text-green-400 underline">Supabase</a> (EU-region, Frankfurt). Data overføres aldri til tredjeparter for markedsføring.</p>
          </section>

          <section>
            <h2 className="text-white font-semibold text-base mb-3">5. Abonnement og betaling</h2>
            <p>Betaling håndteres utelukkende av Apple App Store. Vi lagrer ikke betalingsinformasjon. Apple sin personvernerklæring gjelder for kjøpsprosessen.</p>
          </section>

          <section>
            <h2 className="text-white font-semibold text-base mb-3">6. Dine rettigheter</h2>
            <ul className="space-y-1 list-none">
              {[
                'Innsyn i hvilke data vi har om deg',
                'Retting av feilaktige opplysninger',
                'Sletting av alle dine data (tilgjengelig i Innstillinger → Slett konto)',
                'Dataportabilitet via CSV-eksport',
              ].map((right) => (
                <li key={right} className="flex gap-3">
                  <span className="text-green-400 mt-0.5 flex-shrink-0">✓</span>
                  <span>{right}</span>
                </li>
              ))}
            </ul>
          </section>

          <section>
            <h2 className="text-white font-semibold text-base mb-3">7. Informasjonskapsler (cookies)</h2>
            <p>Appen bruker kun nødvendige sesjonsdata for innlogging. Ingen sporings-cookies eller tredjepartsanalyse.</p>
          </section>

          <section>
            <h2 className="text-white font-semibold text-base mb-3">8. Kontakt</h2>
            <p>For spørsmål eller forespørsler om dine data: <a href="mailto:leif.landersen@gmail.com" className="text-green-400 underline">leif.landersen@gmail.com</a></p>
          </section>

          <hr className="border-slate-800 my-8" />

          <section>
            <h2 className="text-white font-semibold text-base mb-3">Privacy Policy (English)</h2>

            <div className="space-y-6 text-slate-400">
              <p><strong className="text-slate-300">Last updated:</strong> June 2025</p>

              <div>
                <h3 className="text-slate-300 font-medium mb-2">Data we collect</h3>
                <ul className="space-y-1">
                  <li>→ <strong className="text-slate-300">GPS location</strong>: Used only to calculate trip distance. Stored as start/end coordinates per trip.</li>
                  <li>→ <strong className="text-slate-300">Email address</strong>: Used for authentication only. Not shared with third parties.</li>
                  <li>→ <strong className="text-slate-300">Trip data</strong>: Date, distance, category, vehicle, purpose and costs you enter.</li>
                  <li>→ <strong className="text-slate-300">Profile name</strong>: Displayed in the app and reports.</li>
                </ul>
              </div>

              <div>
                <h3 className="text-slate-300 font-medium mb-2">Background GPS</h3>
                <p>The app may track GPS in the background while a trip is active. This requires "Always" location permission. Tracking stops automatically when the trip ends. We do <strong className="text-slate-300">not</strong> store continuous tracking history — only start and end positions.</p>
              </div>

              <div>
                <h3 className="text-slate-300 font-medium mb-2">Data storage</h3>
                <p>All data is stored in Supabase (EU region, Frankfurt). Data is never transferred to third parties for marketing purposes.</p>
              </div>

              <div>
                <h3 className="text-slate-300 font-medium mb-2">Your rights</h3>
                <p>You may request access, correction, or deletion of your data at any time. Account deletion is available in Settings → Delete account.</p>
              </div>

              <div>
                <h3 className="text-slate-300 font-medium mb-2">Contact</h3>
                <p><a href="mailto:leif.landersen@gmail.com" className="text-green-400 underline">leif.landersen@gmail.com</a></p>
              </div>
            </div>
          </section>
        </div>
      </div>
    </div>
  )
}
