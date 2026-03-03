import { NextResponse } from "next/server"

export const runtime = "nodejs"
export const maxDuration = 15

// Major shipping lanes — bounding boxes [latMin, latMax, lonMin, lonMax]
const SHIPPING_LANES = [
  { name: "North Atlantic", latMin: 35, latMax: 55, lonMin: -70, lonMax: 10 },
  { name: "English Channel", latMin: 49, latMax: 52, lonMin: -5, lonMax: 5 },
  { name: "Mediterranean", latMin: 30, latMax: 46, lonMin: -6, lonMax: 37 },
  { name: "Suez Canal", latMin: 27, latMax: 33, lonMin: 30, lonMax: 37 },
  { name: "Persian Gulf", latMin: 22, latMax: 28, lonMin: 48, lonMax: 57 },
  { name: "Strait of Malacca", latMin: 1, latMax: 7, lonMin: 98, lonMax: 106 },
  { name: "South China Sea", latMin: 5, latMax: 25, lonMin: 105, lonMax: 125 },
  { name: "North Pacific", latMin: 30, latMax: 50, lonMin: 140, lonMax: 210 },
  { name: "South Atlantic", latMin: -40, latMax: -10, lonMin: -50, lonMax: 20 },
  { name: "Cape of Good Hope", latMin: -38, latMax: -28, lonMin: 15, lonMax: 35 },
]

export async function GET() {
  try {
    const ships: any[] = []

    // Fetch from 3 lanes in parallel to stay within timeout
    const selectedLanes = SHIPPING_LANES.slice(0, 6)

    await Promise.allSettled(
      selectedLanes.map(async (lane) => {
        try {
          const ws = new WebSocket("wss://stream.aisstream.io/v0/stream")

          await new Promise<void>((resolve, reject) => {
            const timeout = setTimeout(() => {
              ws.close()
              resolve()
            }, 8000)

            ws.onopen = () => {
              ws.send(JSON.stringify({
                APIKey: "41b8f108a358a50f74de1fcbb1e852b3efdf2aaa",
                BoundingBoxes: [[
                  [lane.latMin, lane.lonMin],
                  [lane.latMax, lane.lonMax]
                ]],
                FilterMessageTypes: ["PositionReport"],
              }))
            }

            ws.onmessage = (event: any) => {
              try {
                const msg = JSON.parse(event.data)
                if (msg?.MessageType === "PositionReport") {
                  const p = msg.Message?.PositionReport
                  const m = msg.MetaData
                  if (p && m) {
                    ships.push({
                      mmsi: m.MMSI,
                      name: m.ShipName?.trim() || "Unknown",
                      lat: m.latitude,
                      lng: m.longitude,
                      speed: p.Sog ?? 0,
                      heading: p.TrueHeading ?? p.Cog ?? 0,
                      type: p.NavigationalStatus ?? 0,
                      lane: lane.name,
                    })
                  }
                }
                if (ships.length >= 300) {
                  clearTimeout(timeout)
                  ws.close()
                  resolve()
                }
              } catch { /* skip */ }
            }

            ws.onerror = () => { clearTimeout(timeout); resolve() }
            ws.onclose = () => { clearTimeout(timeout); resolve() }
          })
        } catch { /* skip lane */ }
      })
    )

    // Deduplicate by MMSI
    const unique = Array.from(
      new Map(ships.map(s => [s.mmsi, s])).values()
    ).slice(0, 300)

    return NextResponse.json({
      ships: unique,
      count: unique.length,
      fetchedAt: new Date().toISOString(),
    }, {
      headers: { "Cache-Control": "public, s-maxage=60, stale-while-revalidate=120" }
    })

  } catch (e: any) {
    return NextResponse.json({ ships: [], count: 0, error: e.message }, { status: 500 })
  }
}
