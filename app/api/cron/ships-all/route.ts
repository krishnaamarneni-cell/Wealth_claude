import { NextRequest, NextResponse } from "next/server"
import WebSocket from "ws"
import { createClient } from "@supabase/supabase-js"

export const runtime = "nodejs"
export const maxDuration = 60

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

const LANES = [
  { name: "North Atlantic", box: [[35, -70], [55, 10]] },
  { name: "English Channel", box: [[49, -5], [52, 5]] },
  { name: "Mediterranean", box: [[30, -6], [46, 37]] },
  { name: "Suez / Red Sea", box: [[12, 32], [32, 44]] },
  { name: "Persian Gulf", box: [[22, 48], [28, 57]] },
  { name: "Strait of Malacca", box: [[1, 98], [7, 106]] },
  { name: "South China Sea", box: [[5, 105], [25, 125]] },
  { name: "North Pacific", box: [[30, 140], [50, 180]] },
  { name: "East Asia", box: [[20, 118], [38, 130]] },
  { name: "South Atlantic", box: [[-40, -50], [-10, 20]] },
  { name: "Indian Ocean", box: [[-10, 55], [25, 80]] },
  { name: "West Africa", box: [[-5, -20], [20, 15]] },
]

async function fetchLane(lane: typeof LANES[0], limit = 50): Promise<any[]> {
  return new Promise((resolve) => {
    const collected: any[] = []
    const seen = new Set<number>()
    const ws = new WebSocket("wss://stream.aisstream.io/v0/stream")
    const timeout = setTimeout(() => { ws.terminate(); resolve(collected) }, 8000)

    ws.on("open", () => {
      ws.send(JSON.stringify({
        APIKey: "41b8f108a358a50f74de1fcbb1e852b3efdf2aaa",
        BoundingBoxes: [lane.box],
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
            collected.push({
              mmsi: m.MMSI,
              name: m.ShipName?.trim() || "Unknown",
              lat: m.latitude,
              lng: m.longitude,
              speed: p.Sog ?? 0,
              heading: p.TrueHeading ?? p.Cog ?? 0,
              type: p.NavigationalStatus ?? 0,
              lane: lane.name,
            })
            if (collected.length >= limit) {
              clearTimeout(timeout)
              ws.terminate()
              resolve(collected)
            }
          }
        }
      } catch { /* skip */ }
    })

    ws.on("error", () => { clearTimeout(timeout); resolve(collected) })
    ws.on("close", () => { clearTimeout(timeout); resolve(collected) })
  })
}

export async function GET(req: NextRequest) {
  const results: Record<string, number> = {}

  // Process all lanes sequentially to avoid overwhelming AISstream
  // Process all lanes in parallel, 8 second timeout per lane
  const laneResults = await Promise.all(
    LANES.map(async (lane) => {
      const ships = await fetchLane(lane, 40)
      await supabase
        .from("ship_cache")
        .upsert({
          region: lane.name,
          ships: ships,
          updated_at: new Date().toISOString(),
        }, { onConflict: "region" })
      return { name: lane.name, count: ships.length }
    })
  )
  laneResults.forEach(r => { results[r.name] = r.count })

  const total = Object.values(results).reduce((a, b) => a + b, 0)

  return NextResponse.json({ ok: true, total, regions: results })
}