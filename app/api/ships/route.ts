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
  const ships: any[] = []
  const seen = new Set<number>()

  await new Promise<void>((resolve) => {
    const ws = new WebSocket("wss://stream.aisstream.io/v0/stream")

    const timeout = setTimeout(() => {
      ws.terminate()
      resolve()
    }, 20000)

    ws.on("open", () => {
      ws.send(JSON.stringify({
        APIKey: "41b8f108a358a50f74de1fcbb1e852b3efdf2aaa",
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
            ships.push({
              mmsi: m.MMSI,
              name: m.ShipName?.trim() || "Unknown",
              lat: m.latitude,
              lng: m.longitude,
              speed: p.Sog ?? 0,
              heading: p.TrueHeading ?? p.Cog ?? 0,
              type: p.NavigationalStatus ?? 0,
            })
          }
        }
      } catch { /* skip */ }
    })

    ws.on("error", () => { clearTimeout(timeout); resolve() })
    ws.on("close", () => { clearTimeout(timeout); resolve() })
  })

  return NextResponse.json({
    ships,
    count: ships.length,
    fetchedAt: new Date().toISOString(),
  }, {
    headers: { "Cache-Control": "public, s-maxage=60, stale-while-revalidate=120" }
  })
}