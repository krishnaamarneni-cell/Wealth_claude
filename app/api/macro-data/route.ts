import { NextResponse } from "next/server"
import { createClient } from "@supabase/supabase-js"

export const runtime = "nodejs"
export const maxDuration = 30

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

const CACHE_MS = 24 * 60 * 60 * 1000 // 24 hours — World Bank data is annual

const INDICATORS = {
  inflation: "FP.CPI.TOTL.ZG",   // Consumer Price Index YoY
  gdpGrowth: "NY.GDP.MKTP.KD.ZG", // GDP growth rate
  gdp: "NY.GDP.MKTP.CD",    // GDP current USD
  unemployment: "SL.UEM.TOTL.ZS",   // Unemployment % of labor force
  debtToGdp: "GC.DOD.TOTL.GD.ZS", // Central govt debt % of GDP
}

async function fetchIndicator(indicator: string): Promise<Record<string, number>> {
  // mrv=1 = most recent value, per_page=300 covers all countries
  const url = `https://api.worldbank.org/v2/country/all/indicator/${indicator}?format=json&mrv=1&per_page=300`
  const res = await fetch(url, { signal: AbortSignal.timeout(15000) })
  if (!res.ok) throw new Error(`World Bank API error: ${res.status}`)
  const json = await res.json()
  const rows = json[1] ?? []

  const result: Record<string, number> = {}
  for (const row of rows) {
    if (row.value !== null && row.value !== undefined && row.countryiso3code) {
      result[row.countryiso3code] = row.value
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

  // 2. Fetch fresh from World Bank (all 5 indicators in parallel)
  try {
    const [inflation, gdpGrowth, gdp, unemployment, debtToGdp] = await Promise.all([
      fetchIndicator(INDICATORS.inflation),
      fetchIndicator(INDICATORS.gdpGrowth),
      fetchIndicator(INDICATORS.gdp),
      fetchIndicator(INDICATORS.unemployment),
      fetchIndicator(INDICATORS.debtToGdp),
    ])

    const data = { inflation, gdpGrowth, gdp, unemployment, debtToGdp }
    const fetchedAt = new Date().toISOString()

    // 3. Save to Supabase
    await supabase
      .from("macro_cache")
      .upsert({ id: 1, data, fetched_at: fetchedAt })

    return NextResponse.json(
      { data, fetchedAt, cached: false },
      { headers: { "Cache-Control": "public, s-maxage=3600, stale-while-revalidate=7200" } }
    )
  } catch (err) {
    // Serve stale cache rather than error
    if (cached?.data) {
      return NextResponse.json(
        { data: cached.data, fetchedAt: cached.fetched_at, cached: true, stale: true },
        { headers: { "Cache-Control": "public, s-maxage=300" } }
      )
    }
    return NextResponse.json({ error: "Failed to fetch macro data" }, { status: 500 })
  }
}