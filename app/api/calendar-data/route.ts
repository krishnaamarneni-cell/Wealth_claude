import { NextResponse } from "next/server"
import { createClient } from "@supabase/supabase-js"

export const runtime = "nodejs"
export const maxDuration = 30

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

const FINNHUB_KEY = process.env.FINNHUB_API_KEY!
const CACHE_MS = 60 * 60 * 1000 // 1 hour

// ── helpers ──────────────────────────────────────────────────────────────────
function weekBounds(dateStr: string): { from: string; to: string } {
  const d = new Date(dateStr)
  const day = d.getUTCDay()                      // 0=Sun … 6=Sat
  const mon = new Date(d)
  mon.setUTCDate(d.getUTCDate() - ((day + 6) % 7)) // Monday
  const sun = new Date(mon)
  sun.setUTCDate(mon.getUTCDate() + 6)              // Sunday
  const fmt = (x: Date) => x.toISOString().slice(0, 10)
  return { from: fmt(mon), to: fmt(sun) }
}

async function finnhub(path: string) {
  const url = `https://finnhub.io/api/v1${path}&token=${FINNHUB_KEY}`
  const res = await fetch(url, { signal: AbortSignal.timeout(15000) })
  if (!res.ok) throw new Error(`Finnhub ${res.status}: ${path}`)
  return res.json()
}

// ── main handler ─────────────────────────────────────────────────────────────
export async function GET(req: Request) {
  const { searchParams } = new URL(req.url)
  const date = searchParams.get("date") ?? new Date().toISOString().slice(0, 10)
  const { from, to } = weekBounds(date)
  const cacheKey = `calendar_${from}`

  // Check cache
  const { data: cached } = await supabase
    .from("macro_cache")
    .select("data, fetched_at")
    .eq("id", cacheKey)
    .single()

  if (cached?.fetched_at) {
    const age = Date.now() - new Date(cached.fetched_at).getTime()
    if (age < CACHE_MS && cached.data) {
      return NextResponse.json({ ...cached.data, from, to, cached: true })
    }
  }

  try {
    const [econ, earnings, ipo] = await Promise.all([
      finnhub(`/calendar/economic?from=${from}&to=${to}`),
      finnhub(`/calendar/earnings?from=${from}&to=${to}`),
      finnhub(`/calendar/ipo?from=${from}&to=${to}`),
    ])

    const data = {
      economic: econ?.economicCalendar ?? [],
      earnings: earnings?.earningsCalendar ?? [],
      ipo: ipo?.ipoCalendar ?? [],
    }

    const fetchedAt = new Date().toISOString()
    await supabase.from("macro_cache").upsert({ id: cacheKey, data, fetched_at: fetchedAt })

    return NextResponse.json({ ...data, from, to, cached: false })
  } catch (err) {
    if (cached?.data) {
      return NextResponse.json({ ...cached.data, from, to, cached: true, stale: true })
    }
    return NextResponse.json({ error: String(err) }, { status: 500 })
  }
}