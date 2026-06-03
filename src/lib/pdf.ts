import jsPDF from 'jspdf'
import autoTable from 'jspdf-autotable'
import type { Trip, Profile, Vehicle } from '@/types'
import { translations, getLocale, type Lang } from '@/lib/translations'

export function generateMonthlyPDF(
  trips: Trip[],
  month: string,
  userProfile: Profile,
  vehicles: Vehicle[],
  lang: Lang = 'no'
) {
  const p = translations[lang].pdf
  const locale = getLocale(lang)
  const doc = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' })

  const totalKm = trips.reduce((s, t) => s + (t.adjusted_distance_km ?? t.calculated_distance_km ?? 0), 0)
  const totalReimbursement = trips.reduce((s, t) => s + (t.calculated_reimbursement ?? 0), 0)
  const totalParking = trips.reduce((s, t) => s + t.parking_cost, 0)
  const totalToll = trips.reduce((s, t) => s + t.toll_cost, 0)

  doc.setFontSize(20)
  doc.setFont('helvetica', 'bold')
  doc.text(p.title, 14, 20)

  doc.setFontSize(12)
  doc.setFont('helvetica', 'normal')
  doc.text(`${p.user}: ${userProfile.name}`, 14, 30)
  doc.text(`${p.period}: ${month}`, 14, 37)
  doc.text(`${p.generated}: ${new Date().toLocaleDateString(locale)}`, 14, 44)

  doc.setFillColor(15, 23, 42)
  doc.roundedRect(14, 52, 182, 42, 3, 3, 'F')
  doc.setTextColor(248, 250, 252)
  doc.setFontSize(10)
  doc.text(p.summary, 20, 61)
  doc.setFontSize(9)
  doc.text(`${p.totalKm}: ${totalKm.toFixed(2)} km`, 20, 70)
  doc.text(`${p.totalReimbursement}: € ${totalReimbursement.toFixed(2)}`, 20, 77)
  doc.text(`${p.parking}: € ${totalParking.toFixed(2)}`, 20, 84)
  doc.text(`${p.toll}: € ${totalToll.toFixed(2)}`, 90, 84)
  doc.text(`${p.trips}: ${trips.length}`, 90, 70)
  doc.setTextColor(0, 0, 0)

  autoTable(doc, {
    startY: 102,
    head: [[p.date, p.vehicle, p.category, p.purposeCustomer, p.km, p.amount]],
    body: trips.map((t) => {
      const vehicle = vehicles.find((v) => v.id === t.vehicle_id)
      const km = t.adjusted_distance_km ?? t.calculated_distance_km ?? 0
      const catKey = t.category as keyof typeof translations['no']['categories']
      const cat = translations[lang].categories[catKey] ?? t.category
      return [
        new Date(t.start_time).toLocaleDateString(locale),
        vehicle?.name ?? '-',
        cat,
        t.customer_free_text ?? t.purpose ?? '-',
        km.toFixed(2),
        (t.calculated_reimbursement ?? 0).toFixed(2),
      ]
    }),
    styles: { fontSize: 8 },
    headStyles: { fillColor: [15, 23, 42] },
    alternateRowStyles: { fillColor: [248, 250, 252] },
  })

  const categories = [...new Set(trips.map((t) => t.category))]
  const catData = categories.map((cat) => {
    const catTrips = trips.filter((t) => t.category === cat)
    const km = catTrips.reduce((s, t) => s + (t.adjusted_distance_km ?? t.calculated_distance_km ?? 0), 0)
    const catKey = cat as keyof typeof translations['no']['categories']
    return [translations[lang].categories[catKey] ?? cat, catTrips.length.toString(), km.toFixed(2)]
  })

  const finalY = (doc as any).lastAutoTable?.finalY ?? 180
  autoTable(doc, {
    startY: finalY + 10,
    head: [[p.categorySummary, p.tripCount, p.totalKmShort]],
    body: catData,
    styles: { fontSize: 8 },
    headStyles: { fillColor: [34, 197, 94] },
  })

  const disclaimerY = (doc as any).lastAutoTable?.finalY ?? 220
  doc.setFontSize(7)
  doc.setTextColor(100, 100, 100)
  doc.text(p.disclaimer, 14, disclaimerY + 10, { maxWidth: 182 })

  return doc
}

export function generateCSV(trips: Trip[], vehicles: Vehicle[], lang: Lang = 'no'): string {
  const locale = getLocale(lang)
  const header = translations[lang].csv.headers

  const rows = trips.map((t) => {
    const vehicle = vehicles.find((v) => v.id === t.vehicle_id)
    const catKey = t.category as keyof typeof translations['no']['categories']
    const cat = translations[lang].categories[catKey] ?? t.category
    const statusKey = t.status as keyof typeof translations['no']['statuses']
    const status = translations[lang].statuses[statusKey] ?? t.status
    return [
      new Date(t.start_time).toLocaleDateString(locale),
      new Date(t.start_time).toLocaleTimeString(locale),
      t.stop_time ? new Date(t.stop_time).toLocaleTimeString(locale) : '',
      vehicle?.name ?? '',
      cat,
      t.customer_free_text ?? '',
      t.purpose ?? '',
      t.calculated_distance_km?.toFixed(2) ?? '',
      t.adjusted_distance_km?.toFixed(2) ?? '',
      t.mileage_rate.toFixed(4),
      t.parking_cost.toFixed(2),
      t.toll_cost.toFixed(2),
      t.other_cost.toFixed(2),
      (t.calculated_reimbursement ?? 0).toFixed(2),
      status,
      (t.notes ?? '').replace(/;/g, ','),
    ].join(';')
  })

  return [header, ...rows].join('\n')
}
