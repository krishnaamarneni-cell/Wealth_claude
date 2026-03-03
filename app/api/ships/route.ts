import { NextResponse } from "next/server"
import WebSocket from "ws"

export const runtime = "nodejs"
export const maxDuration = 30

const BOUNDING_BOXES = [
  [[35, -70], [55, 10]],   // North Atlantic
  [[49, -5], [52, 5]],    // English Channel
  [[30, -6], [46, 37]],   // Mediterranean
  [[27, 30], [33, 37]],   // Suez Canal
  [[1, 98], [7, 106]],  // Strait of Malacca
  [[5, 105], [25, 125]],  // South China Sea
]

export async function GET() {
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

  const PER_LANE = 35 // ~35 ships per lane = ~420 total spread evenly

  const laneResults = await Promise.all(
    LANES.map(lane => new Promise<any[]>((resolve) => {
      const collected: any[] = []
      const seen = new Set<number>()

      const ws = new WebSocket("wss://stream.aisstream.io/v0/stream")

      const timeout = setTimeout(() => { ws.terminate(); resolve(collected) }, 12000)

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
              if (collected.length >= PER_LANE) {
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
    }))
  )

  const ships = laneResults.flat()

  return NextResponse.json({
    ships,
    count: ships.length,
    fetchedAt: new Date().toISOString(),
  }, {
    headers: { "Cache-Control": "public, s-maxage=60, stale-while-revalidate=120" }
  })
}