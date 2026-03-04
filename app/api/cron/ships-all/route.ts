import { NextResponse } from "next/server"
import { createClient } from "@supabase/supabase-js"

export const runtime = "nodejs"
export const maxDuration = 60

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

const LANES = [
  { name: "North Atlantic", bbox: [-70, 35, 10, 55] },
  { name: "English Channel", bbox: [-5, 49, 5, 52] },
  { name: "Mediterranean", bbox: [-6, 30, 37, 46] },
  { name: "Suez / Red Sea", bbox: [32, 12, 44, 32] },
  { name: "Persian Gulf", bbox: [48, 22, 57, 28] },
  { name: "Strait of Malacca", bbox: [98, 1, 106, 7] },
  { name: "South China Sea", bbox: [105, 5, 125, 25] },
  { name: "North Pacific", bbox: [140, 30, 180, 50] },
  { name: "East Asia", bbox: [118, 20, 130, 38] },
  { name: "South Atlantic", bbox: [-50, -40, 20, -10] },
  { name: "Indian Ocean", bbox: [55, -10, 80, 25] },
  { name: "West Africa", bbox: [-20, -5, 15, 20] },
]

export async function GET() {
  const results: Record<string, number> = {}

  await Promise.all(
    LANES.map(async (lane) => {
      try {
        const [minLng, minLat, maxLng, maxLat] = lane.bbox
        const url = `https://api.open-ais.org/v1/latest_position?bbox=[${minLng},${minLat},${maxLng},${maxLat}]&limit=50`
        const res = await fetch(url, { signal: AbortSignal.timeout(15000) })
        if (!res.ok) throw new Error(`HTTP ${res.status}`)
        const json = await res.json()

        // OpenAIS returns GeoJSON FeatureCollection
        const features = json?.features ?? json ?? []
        const ships = features.slice(0, 50).map((f: any) => ({
          mmsi: f.properties?.mmsi ?? f.mmsi,
          name: (f.properties?.ship_name ?? f.properties?.name ?? "Unknown").trim(),
          lat: f.geometry?.coordinates?.[1] ?? f.properties?.lat,
          lng: f.geometry?.coordinates?.[0] ?? f.properties?.lon,
          speed: f.properties?.speed ?? f.properties?.sog ?? 0,
          heading: f.properties?.heading ?? f.properties?.cog ?? 0,
          type: f.properties?.nav_status ?? 0,
          lane: lane.name,
        })).filter((s: any) => s.lat && s.lng)

        await supabase
          .from("ship_cache")
          .upsert({
            region: lane.name,
            ships,
            updated_at: new Date().toISOString(),
          }, { onConflict: "region" })

        results[lane.name] = ships.length
      } catch (e: any) {
        results[lane.name] = 0
        console.error(`Lane ${lane.name} failed:`, e.message)
      }
    })
  )

  const total = Object.values(results).reduce((a, b) => a + b, 0)
  return NextResponse.json({ ok: true, total, regions: results })
}