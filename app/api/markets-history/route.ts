import { NextResponse } from "next/server"
import { createClient } from "@supabase/supabase-js"

export const runtime = "nodejs"
export const maxDuration = 20

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

const CACHE_MS = 60 * 60 * 1000 // 1 hour

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url)
  const symbol = searchParams.get("symbol") ?? "^GSPC"
  const range = searchParams.get("range") ?? "6mo"
  const cacheKey = `markets_history_${symbol}_${range}`

  const { data: cached } = await supabase
    .from("macro_cache")
    .select("data, fetched_at")
    .eq("id", cacheKey)
    .single()

  if (cached?.fetched_at) {
    const age = Date.now() - new Date(cached.fetched_at).getTime()
    if (age < CACHE_MS && cached.data) {
      return NextResponse.json({ history: cached.data, cached: true })
    }
  }

  try {
    const url = `https://query1.finance.yahoo.com/v8/finance/chart/${encodeURIComponent(symbol)}?interval=1d&range=${range}`
    const res = await fetch(url, {
      headers: { "User-Agent": "Mozilla/5.0" },
      signal: AbortSignal.timeout(15000),
    })
    if (!res.ok) throw new Error(`Yahoo Finance ${res.status}`)
    const json = await res.json()

    const timestamps = json?.chart?.result?.[0]?.timestamp ?? []
    const closes = json?.chart?.result?.[0]?.indicators?.quote?.[0]?.close ?? []
    const meta = json?.chart?.result?.[0]?.meta ?? {}

    const history = timestamps.map((ts: number, i: number) => ({
      date: new Date(ts * 1000).toISOString().slice(0, 10),
      close: closes[i] ?? null,
    })).filter((d: { close: number | null }) => d.close !== null)

    const data = { history, currency: meta.currency ?? "USD", name: meta.shortName ?? symbol }
    const fetchedAt = new Date().toISOString()
    await supabase.from("macro_cache").upsert({ id: cacheKey, data, fetched_at: fetchedAt })

    return NextResponse.json({ ...data, cached: false })
  } catch (err) {
    if (cached?.data) return NextResponse.json({ ...cached.data, cached: true, stale: true })
    return NextResponse.json({ error: String(err) }, { status: 500 })
  }
}