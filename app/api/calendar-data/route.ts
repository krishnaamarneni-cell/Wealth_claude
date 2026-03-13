import { NextResponse } from "next/server"
import { createClient } from "@supabase/supabase-js"

export const runtime = "nodejs"
export const maxDuration = 30

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

const FMP_KEY = process.env.FMP_API_KEY!
const CACHE_MS = 24 * 60 * 60 * 1000 // 24 hours

// ── helpers ──────────────────────────────────────────────────────────────────
function weekBounds(dateStr: string): { from: string; to: string } {
  const d = new Date(dateStr + "T00:00:00Z")
  const day = d.getUTCDay()
  const mon = new Date(d)
  mon.setUTCDate(d.getUTCDate() - ((day + 6) % 7))
  const sun = new Date(mon)
  sun.setUTCDate(mon.getUTCDate() + 6)
  const fmt = (x: Date) => x.toISOString().slice(0, 10)
  return { from: fmt(mon), to: fmt(sun) }
}

async function fmp(endpoint: string, from: string, to: string) {
  const url = `https://financialmodelingprep.com/stable/${endpoint}?from=${from}&to=${to}&apikey=${FMP_KEY}`
  const res = await fetch(url, { signal: AbortSignal.timeout(15000) })
  if (!res.ok) throw new Error(`FMP ${res.status}: ${endpoint}`)
  const json = await res.json()
  return Array.isArray(json) ? json : []
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

  // Use Promise.allSettled so one failure doesn't kill the others
  const [earningsResult, ipoResult] = await Promise.allSettled([
    fmp("earnings-calendar", from, to),
    fmp("ipos-calendar", from, to),
  ])

  const data = {
    // Economic: no free source — using TradingView widget client-side
    economic: [],
    earnings: earningsResult.status === "fulfilled" ? earningsResult.value : [],
    ipo: ipoResult.status === "fulfilled" ? ipoResult.value : [],
  }

  const fetchedAt = new Date().toISOString()
  await supabase.from("macro_cache").upsert({ id: cacheKey, data, fetched_at: fetchedAt })

  return NextResponse.json({ ...data, from, to, cached: false })
}