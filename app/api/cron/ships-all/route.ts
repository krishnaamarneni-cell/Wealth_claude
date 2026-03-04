import { NextResponse } from "next/server"
import { createClient } from "@supabase/supabase-js"
import WebSocket from "ws"

export const runtime = "nodejs"
export const maxDuration = 60

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

const BOUNDING_BOXES = [
  [[35, -70], [55, 10]],   // North Atlantic
  [[49, -5], [52, 5]],     // English Channel
  [[30, -6], [46, 37]],    // Mediterranean
  [[12, 32], [32, 44]],    // Suez / Red Sea
  [[22, 48], [28, 57]],    // Persian Gulf
  [[1, 98], [7, 106]],     // Strait of Malacca
  [[5, 105], [25, 125]],   // South China Sea
  [[30, 140], [50, 180]],  // North Pacific
  [[20, 118], [38, 130]],  // East Asia
  [[-40, -50], [-10, 20]], // South Atlantic
  [[-10, 55], [25, 80]],   // Indian Ocean
  [[-5, -20], [20, 15]],   // West Africa
]

const LANE_NAMES: Record<string, string> = {
  "35,-70,55,10": "North Atlantic",
  "49,-5,52,5": "English Channel",
  "30,-6,46,37": "Mediterranean",
  "12,32,32,44": "Suez / Red Sea",
  "22,48,28,57": "Persian Gulf",
  "1,98,7,106": "Strait of Malacca",
  "5,105,25,125": "South China Sea",
  "30,140,50,180": "North Pacific",
  "20,118,38,130": "East Asia",
  "-40,-50,-10,20": "South Atlantic",
  "-10,55,25,80": "Indian Ocean",
  "-5,-20,20,15": "West Africa",
}

function getLaneName(lat: number, lng: number): string {
  if (lat >= 35 && lat <= 55 && lng >= -70 && lng <= 10) return "North Atlantic"
  if (lat >= 49 && lat <= 52 && lng >= -5 && lng <= 5) return "English Channel"
  if (lat >= 30 && lat <= 46 && lng >= -6 && lng <= 37) return "Mediterranean"
  if (lat >= 12 && lat <= 32 && lng >= 32 && lng <= 44) return "Suez / Red Sea"
  if (lat >= 22 && lat <= 28 && lng >= 48 && lng <= 57) return "Persian Gulf"
  if (lat >= 1 && lat <= 7 && lng >= 98 && lng <= 106) return "Strait of Malacca"
  if (lat >= 5 && lat <= 25 && lng >= 105 && lng <= 125) return "South China Sea"
  if (lat >= 30 && lat <= 50 && lng >= 140 && lng <= 180) return "North Pacific"
  if (lat >= 20 && lat <= 38 && lng >= 118 && lng <= 130) return "East Asia"
  if (lat >= -40 && lat <= -10 && lng >= -50 && lng <= 20) return "South Atlantic"
  if (lat >= -10 && lat <= 25 && lng >= 55 && lng <= 80) return "Indian Ocean"
  if (lat >= -5 && lat <= 20 && lng >= -20 && lng <= 15) return "West Africa"
  return "Other"
}

export async function GET() {
  const ships: any[] = []
  const seen = new Set<number>()
  const perLane: Record<string, any[]> = {}

  await new Promise<void>((resolve) => {
    const ws = new WebSocket("wss://stream.aisstream.io/v0/stream")
    const timeout = setTimeout(() => { ws.terminate(); resolve() }, 45000)

    ws.on("open", () => {
      ws.send(JSON.stringify({
        APIKey: process.env.AIS_API_KEY,
        BoundingBoxes: BOUNDING_BOXES,
        FilterMessageTypes: ["PositionReport"],
      }))
    })

    ws.on("message", (data: any) => {
      try {
        const msg = JSON.parse(data.toString())
        if (msg?.MessageType === "PositionReport") {
          const p = msg.Message?.PositionReport
          const m = msg.MetaData
          if (p && m && !seen.has(m.MMSI)) {
            seen.add(m.MMSI)
            const lat = m.latitude
            const lng = m.longitude
            const lane = getLaneName(lat, lng)
            const laneShips = perLane[lane] ?? []
            if (laneShips.length < 50) {
              const ship = {
                mmsi: m.MMSI,
                name: m.ShipName?.trim() || "Unknown",
                lat, lng,
                speed: p.Sog ?? 0,
                heading: p.TrueHeading ?? p.Cog ?? 0,
                type: p.NavigationalStatus ?? 0,
                lane,
              }
              laneShips.push(ship)
              perLane[lane] = laneShips
              ships.push(ship)
            }
            // Stop when all lanes have 50 ships
            const allFull = Object.keys(perLane).length >= 12 &&
              Object.values(perLane).every(l => l.length >= 50)
            if (allFull) {
              clearTimeout(timeout)
              ws.terminate()
              resolve()
            }
          }
        }
      } catch { /* skip */ }
    })

    ws.on("error", () => { clearTimeout(timeout); resolve() })
    ws.on("close", () => { clearTimeout(timeout); resolve() })
  })

  // Save all regions to Supabase
  const regionEntries = Object.entries(perLane)
  await Promise.all(
    regionEntries.map(([region, regionShips]) =>
      supabase.from("ship_cache").upsert({
        region,
        ships: regionShips,
        updated_at: new Date().toISOString(),
      }, { onConflict: "region" })
    )
  )

  const results: Record<string, number> = {}
  regionEntries.forEach(([r, s]) => { results[r] = s.length })

  return NextResponse.json({
    ok: true,
    total: ships.length,
    regions: results,
  })
}
