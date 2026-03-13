import { NextResponse } from "next/server"
import { createClient } from "@supabase/supabase-js"

export const runtime = "nodejs"
export const maxDuration = 30

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

const CACHE_MS = 24 * 60 * 60 * 1000 // 24 hours

const INDICATORS: Record<string, string> = {
  inflation: "FP.CPI.TOTL.ZG",    // Consumer Price Index YoY
  gdpGrowth: "NY.GDP.MKTP.KD.ZG",  // GDP annual growth rate
  gdp: "NY.GDP.MKTP.CD",     // GDP current USD
  unemployment: "SL.UEM.TOTL.ZS",    // Unemployment % of labor force
  debtToGdp: "GC.DOD.TOTL.GD.ZS", // Central govt debt % of GDP
  currentAccount: "BN.CAB.XOKA.GD.ZS", // Current account balance % of GDP
  fdi: "BX.KLT.DINV.WD.GD.ZS", // FDI net inflows % of GDP
}

async function fetchIndicator(indicator: string): Promise<Record<string, number>> {
  // mrv=5 = up to 5 most recent years per country (fixes Debt/GDP coverage)
  // per_page=1500 = 300 countries × 5 years
  const url = `https://api.worldbank.org/v2/country/all/indicator/${indicator}?format=json&mrv=5&per_page=1500`
  const res = await fetch(url, { signal: AbortSignal.timeout(20000) })
  if (!res.ok) throw new Error(`World Bank API ${res.status}`)

  const json = await res.json()
  const rows = json[1] ?? []

  // Group by country — take the first non-null value (most recent available year)
  const result: Record<string, number> = {}
  for (const row of rows) {
    const iso = row.countryiso3code
    if (!iso || result[iso] !== undefined) continue // skip if no iso or already have value
    if (row.value !== null && row.value !== undefined) {
      result[iso] = row.value
    }
  }
  return result
}

export async function GET() {
  // 1. Check Supabase cache
  const { data: cached } = await supabase
    .from("macro_cache")
    .select("data, fetched_at")
    .eq("id", 1)
    .single()

  if (cached?.fetched_at) {
    const age = Date.now() - new Date(cached.fetched_at).getTime()
    if (age < CACHE_MS && cached.data) {
      return NextResponse.json(
        { data: cached.data, fetchedAt: cached.fetched_at, cached: true },
        { headers: { "Cache-Control": "public, s-maxage=3600, stale-while-revalidate=7200" } }
      )
    }
  }

  // 2. Fetch fresh from World Bank — all 5 indicators in parallel
  try {
    const [inflation, gdpGrowth, gdp, unemployment, debtToGdp, currentAccount, fdi] = await Promise.all(
      Object.values(INDICATORS).map(ind => fetchIndicator(ind))
    )

    const data = { inflation, gdpGrowth, gdp, unemployment, debtToGdp, currentAccount, fdi }
    const fetchedAt = new Date().toISOString()

    // 3. Cache in Supabase
    await supabase
      .from("macro_cache")
      .upsert({ id: 1, data, fetched_at: fetchedAt })

    return NextResponse.json(
      { data, fetchedAt, cached: false },
      { headers: { "Cache-Control": "public, s-maxage=3600, stale-while-revalidate=7200" } }
    )
  } catch {
    // Serve stale cache on error rather than failing
    if (cached?.data) {
      return NextResponse.json(
        { data: cached.data, fetchedAt: cached.fetched_at, cached: true, stale: true }
      )
    }
    return NextResponse.json({ error: "Failed to fetch macro data" }, { status: 500 })
  }
}