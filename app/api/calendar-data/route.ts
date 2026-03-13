import { NextResponse } from "next/server"
import { createClient } from "@supabase/supabase-js"

export const runtime = "nodejs"
export const maxDuration = 30

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

const FINNHUB_KEY = process.env.FINNHUB_API_KEY!
const FMP_KEY = process.env.FMP_API_KEY!
const CACHE_MS = 24 * 60 * 60 * 1000 // 24 hours — calendar data doesn't change intraday

// ── helpers ──────────────────────────────────────────────────────────────────
function weekBounds(dateStr: string): { from: string; to: string } {
  const d = new Date(dateStr + "T00:00:00Z")
  const day = d.getUTCDay()
  const mon = new Date(d)
  mon.setUTCDate(d.getUTCDate() - ((day + 6) % 7)) // Monday
  const sun = new Date(mon)
  sun.setUTCDate(mon.getUTCDate() + 6)              // Sunday
  const fmt = (x: Date) => x.toISOString().slice(0, 10)
  return { from: fmt(mon), to: fmt(sun) }
}

async function fetchFinnhub(path: string) {
  const url = `https://finnhub.io/api/v1${path}&token=${FINNHUB_KEY}`
  const res = await fetch(url, { signal: AbortSignal.timeout(15000) })
  if (!res.ok) throw new Error(`Finnhub ${res.status}: ${path}`)
  return res.json()
}

async function fetchFMPEconomic(from: string, to: string) {
  const url = `https://financialmodelingprep.com/api/v3/economic_calendar?from=${from}&to=${to}&apikey=${FMP_KEY}`
  const res = await fetch(url, { signal: AbortSignal.timeout(15000) })
  if (!res.ok) throw new Error(`FMP ${res.status}: economic_calendar`)
  const json = await res.json()
  // FMP returns array directly — normalize to match our EconEvent shape
  return (Array.isArray(json) ? json : []).map((e: Record<string, unknown>) => ({
    time: e.date ?? null,
    country: e.country ?? null,
    event: e.event ?? null,
    actual: e.actual != null ? String(e.actual) : null,
    estimate: e.estimate != null ? String(e.estimate) : null,
    prev: e.previous != null ? String(e.previous) : null,
    impact: e.impact ?? null,
    unit: null,
  }))
}

// ── main handler ─────────────────────────────────────────────────────────────
export async function GET(req: Request) {
  const { searchParams } = new URL(req.url)
  const date = searchParams.get("date") ?? new Date().toISOString().slice(0, 10)
  const { from, to } = weekBounds(date)
  const cacheKey = `calendar_${from}`

  // Check Supabase cache
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
    const [economic, earnings, ipo] = await Promise.allSettled([
      fetchFMPEconomic(from, to),                               // FMP — free tier
      fetchFinnhub(`/calendar/earnings?from=${from}&to=${to}`), // Finnhub free
      fetchFinnhub(`/calendar/ipo?from=${from}&to=${to}`),      // Finnhub free
    ])

    const data = {
      economic,
      earnings: earnings?.earningsCalendar ?? [],
      ipo: ipo?.ipoCalendar ?? [],
    }

    const fetchedAt = new Date().toISOString()
    await supabase.from("macro_cache").upsert({ id: cacheKey, data, fetched_at: fetchedAt })

    return NextResponse.json({ ...data, from, to, cached: false })
  } catch (err) {
    // Serve stale cache rather than an error if we have anything saved
    if (cached?.data) {
      return NextResponse.json({ ...cached.data, from, to, cached: true, stale: true })
    }
    return NextResponse.json({ error: String(err) }, { status: 500 })
  }
}