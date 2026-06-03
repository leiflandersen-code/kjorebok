import jsPDF from 'jspdf'
import autoTable from 'jspdf-autotable'
import type { Trip, Profile, Vehicle } from '@/types'

export function generateMonthlyPDF(
  trips: Trip[],
  month: string,
  userProfile: Profile,
  vehicles: Vehicle[]
) {
  const doc = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' })

  const totalKm = trips.reduce((sum, t) => sum + (t.adjusted_distance_km ?? t.calculated_distance_km ?? 0), 0)
  const totalReimbursement = trips.reduce((sum, t) => sum + (t.calculated_reimbursement ?? 0), 0)
  const totalParking = trips.reduce((sum, t) => sum + t.parking_cost, 0)
  const totalToll = trips.reduce((sum, t) => sum + t.toll_cost, 0)
  const totalOther = trips.reduce((sum, t) => sum + t.other_cost, 0)

  // Header
  doc.setFontSize(20)
  doc.setFont('helvetica', 'bold')
  doc.text('Kjørebok', 14, 20)

  doc.setFontSize(12)
  doc.setFont('helvetica', 'normal')
  doc.text(`Bruker: ${userProfile.name}`, 14, 30)
  doc.text(`Periode: ${month}`, 14, 37)
  doc.text(`Generert: ${new Date().toLocaleDateString('nb-NO')}`, 14, 44)

  // Summary box
  doc.setFillColor(15, 23, 42)
  doc.roundedRect(14, 52, 182, 42, 3, 3, 'F')

  doc.setTextColor(248, 250, 252)
  doc.setFontSize(10)
  doc.text('Sammendrag', 20, 61)
  doc.setFontSize(9)
  doc.text(`Totalt km: ${totalKm.toFixed(2)} km`, 20, 70)
  doc.text(`Beregnet godtgjørelse: € ${totalReimbursement.toFixed(2)}`, 20, 77)
  doc.text(`Parkering: € ${totalParking.toFixed(2)}`, 20, 84)
  doc.text(`Bomvei: € ${totalToll.toFixed(2)}`, 90, 77)
  doc.text(`Andre kostnader: € ${totalOther.toFixed(2)}`, 90, 84)
  doc.text(`Antall turer: ${trips.length}`, 90, 70)

  doc.setTextColor(0, 0, 0)

  // Trip table
  autoTable(doc, {
    startY: 102,
    head: [['Dato', 'Kjøretøy', 'Kategori', 'Formål/Kunde', 'Km', '€']],
    body: trips.map((t) => {
      const vehicle = vehicles.find((v) => v.id === t.vehicle_id)
      const km = t.adjusted_distance_km ?? t.calculated_distance_km ?? 0
      return [
        new Date(t.start_time).toLocaleDateString('nb-NO'),
        vehicle?.name ?? '-',
        t.category,
        t.customer_free_text ?? t.purpose ?? '-',
        km.toFixed(2),
        (t.calculated_reimbursement ?? 0).toFixed(2),
      ]
    }),
    styles: { fontSize: 8 },
    headStyles: { fillColor: [15, 23, 42] },
    alternateRowStyles: { fillColor: [248, 250, 252] },
  })

  // Category summary
  const categories = [...new Set(trips.map((t) => t.category))]
  const catData = categories.map((cat) => {
    const catTrips = trips.filter((t) => t.category === cat)
    const km = catTrips.reduce((s, t) => s + (t.adjusted_distance_km ?? t.calculated_distance_km ?? 0), 0)
    return [cat, catTrips.length.toString(), km.toFixed(2)]
  })

  const finalY = (doc as any).lastAutoTable?.finalY ?? 180

  autoTable(doc, {
    startY: finalY + 10,
    head: [['Kategori', 'Antall turer', 'Total km']],
    body: catData,
    styles: { fontSize: 8 },
    headStyles: { fillColor: [34, 197, 94] },
  })

  // Disclaimer
  const disclaimerY = (doc as any).lastAutoTable?.finalY ?? 220
  doc.setFontSize(7)
  doc.setTextColor(100, 100, 100)
  const disclaimer = 'Beløpene er beregnet dokumentasjon basert på valgt kilometersats. Skattemessig behandling må vurderes av regnskapsfører/rådgiver.'
  doc.text(disclaimer, 14, disclaimerY + 10, { maxWidth: 182 })

  return doc
}

export function generateCSV(trips: Trip[], vehicles: Vehicle[]): string {
  const header = [
    'Dato', 'Starttid', 'Stopptid', 'Kjøretøy', 'Kategori',
    'Kunde/Prosjekt', 'Formål', 'Km (beregnet)', 'Km (justert)',
    'Sats (€/km)', 'Parkering (€)', 'Bomvei (€)', 'Andre kostnader (€)',
    'Beregnet godtgjørelse (€)', 'Status', 'Notater'
  ].join(';')

  const rows = trips.map((t) => {
    const vehicle = vehicles.find((v) => v.id === t.vehicle_id)
    return [
      new Date(t.start_time).toLocaleDateString('nb-NO'),
      new Date(t.start_time).toLocaleTimeString('nb-NO'),
      t.stop_time ? new Date(t.stop_time).toLocaleTimeString('nb-NO') : '',
      vehicle?.name ?? '',
      t.category,
      t.customer_free_text ?? '',
      t.purpose ?? '',
      t.calculated_distance_km?.toFixed(2) ?? '',
      t.adjusted_distance_km?.toFixed(2) ?? '',
      t.mileage_rate.toFixed(4),
      t.parking_cost.toFixed(2),
      t.toll_cost.toFixed(2),
      t.other_cost.toFixed(2),
      (t.calculated_reimbursement ?? 0).toFixed(2),
      t.status,
      (t.notes ?? '').replace(/;/g, ','),
    ].join(';')
  })

  return [header, ...rows].join('\n')
}
