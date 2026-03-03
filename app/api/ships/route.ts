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
```

---

**FILE 2 — Add ships toggle to `app / globe / page.tsx`**

FIND:
```
const [selectedCountry, setSelectedCountry] = useState<string | null>(null)
const [selectedName, setSelectedName] = useState<string | null>(null)
  ```
REPLACE:
```
const [selectedCountry, setSelectedCountry] = useState<string | null>(null)
const [selectedName, setSelectedName] = useState<string | null>(null)
const [showShips, setShowShips] = useState(false)
  ```

Then add toggle button in the top bar. FIND:
```
  < div className = "hidden sm:flex items-center gap-1.5 text-[10px] text-white/30 bg-white/5 border border-white/8 rounded-full px-3 py-1.5" >
    ```
REPLACE:
```
    < button
onClick = {() => setShowShips(s => !s)}
className = {`hidden sm:flex items-center gap-1.5 text-[10px] rounded-full px-3 py-1.5 border transition-all ${showShips ? "bg-blue-500/20 border-blue-400/40 text-blue-300" : "bg-white/5 border-white/8 text-white/30 hover:text-white/50"}`}
            >
  <span className="text-sm" >🚢</span>
Ships
  </button>
  < div className = "hidden sm:flex items-center gap-1.5 text-[10px] text-white/30 bg-white/5 border border-white/8 rounded-full px-3 py-1.5" >
    ```

Then pass `showShips` to `GlobeWrapper`. FIND:
```
  < GlobeWrapper
marketData = { marketData }
selectedCountry = { selectedCountry }
onCountrySelect = { handleCountrySelect }
  />
  ```
REPLACE:
```
  < GlobeWrapper
marketData = { marketData }
selectedCountry = { selectedCountry }
onCountrySelect = { handleCountrySelect }
showShips = { showShips }
  />
  ```

---

**FILE 3 — Add ships to `GlobeWrapper.tsx`**

FIND:
```
interface GlobeWrapperProps {
  marketData: MarketDataMap
  selectedCountry: string | null
  onCountrySelect: (isoA3: string | null, name: string | null) => void
}
```
REPLACE:
```
interface GlobeWrapperProps {
  marketData: MarketDataMap
  selectedCountry: string | null
  onCountrySelect: (isoA3: string | null, name: string | null) => void
  showShips?: boolean
}
```

FIND:
```
export function GlobeWrapper({ marketData, selectedCountry, onCountrySelect }: GlobeWrapperProps) {
  ```
REPLACE:
```
  export function GlobeWrapper({ marketData, selectedCountry, onCountrySelect, showShips = false }: GlobeWrapperProps) {
    ```

Then add ship state and fetch effect. FIND:
```
    const [introPlaying, setIntroPlaying] = useState(true)
    const introRef = useRef(false)
      ```
REPLACE:
```
    const [introPlaying, setIntroPlaying] = useState(true)
    const introRef = useRef(false)
    const [ships, setShips] = useState<any[]>([])
    const shipsLoadedRef = useRef(false)
      ```

Then add fetch effect after the resize handler. FIND:
```
    // Resize handler
    useEffect(() => {
      ```
REPLACE:
```
      // Fetch ships when toggled on
      useEffect(() => {
        if (!showShips || !globeRef.current) return
        if (shipsLoadedRef.current) {
          globeRef.current.pointsData(ships)
          return
        }
        const fetchShips = async () => {
          try {
            const res = await fetch("/api/ships")
            const json = await res.json()
            if (json.ships?.length) {
              shipsLoadedRef.current = true
              setShips(json.ships)
              globeRef.current?.pointsData(json.ships)
            }
          } catch { /* silent */ }
        }
        fetchShips()
        // Refresh every 60 seconds
        const interval = setInterval(fetchShips, 60000)
        return () => clearInterval(interval)
      }, [showShips, globeRef.current])

      // Hide ships when toggled off
      useEffect(() => {
        if (!globeRef.current) return
        if (!showShips) {
          globeRef.current.pointsData([])
        }
      }, [showShips])

      // Resize handler
      useEffect(() => {
        ```

Then configure points layer on globe init. FIND:
```
          .onPolygonHover((feat: any) => {
            ```
REPLACE:
```
              // Ships layer
              .pointsData([])
              .pointLat((s: any) => s.lat)
              .pointLng((s: any) => s.lng)
              .pointAltitude(0.005)
              .pointRadius(0.25)
              .pointColor((s: any) => {
                // Color by navigational status/type
                const t = s.type
                if (t === 1 || t === 2 || t === 3) return "#22d3ee" // underway
                if (t === 5) return "#f97316"                        // moored
                if (t === 8) return "#a855f7"                        // fishing
                return "#60a5fa"                                      // default blue
              })
              .pointLabel((s: any) => `
          <div style="background:rgba(2,12,27,0.95);border:1px solid rgba(100,160,220,0.3);border-radius:8px;padding:8px 12px;font-family:system-ui,sans-serif;min-width:140px">
            <div style="color:rgba(255,255,255,0.9);font-size:11px;font-weight:700">${s.name}</div>
            <div style="color:rgba(255,255,255,0.4);font-size:10px;margin-top:2px">${s.lane}</div>
            <div style="color:#60a5fa;font-size:10px">Speed: ${s.speed?.toFixed(1)} kn</div>
          </div>
        `)
              // End of points layer — polygon interactions below
              .onPolygonHover((feat: any) => {