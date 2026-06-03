export async function reverseGeocode(lat: number, lng: number): Promise<string | null> {
  try {
    const res = await fetch(
      `https://nominatim.openstreetmap.org/reverse?lat=${lat}&lon=${lng}&format=json&accept-language=no`,
      { headers: { 'User-Agent': 'Kjorebok/1.0 (leif.landersen@gmail.com)' } }
    )
    if (!res.ok) return null
    const data = await res.json()
    const a = data.address
    if (!a) return null

    // Build a short readable address: "Calle Mayor, Marbella" or "N-340, Estepona"
    const parts = [
      a.road ?? a.pedestrian ?? a.footway ?? a.path,
      a.house_number,
      a.city ?? a.town ?? a.village ?? a.municipality,
    ].filter(Boolean)

    return parts.join(', ') || data.display_name?.split(',').slice(0, 2).join(',') || null
  } catch {
    return null
  }
}
