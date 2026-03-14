import { NextResponse } from "next/server"
import { createClient } from "@supabase/supabase-js"

export const runtime = "nodejs"
export const maxDuration = 30

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

const CACHE_MS = 24 * 60 * 60 * 1000 // 24 hours
const CACHE_KEY = "macro_data_v1" // String key to match table structure

const WB_INDICATORS: Record<string, string> = {
  inflation: "FP.CPI.TOTL.ZG",
  gdpGrowth: "NY.GDP.MKTP.KD.ZG",
  gdp: "NY.GDP.MKTP.CD",
  unemployment: "SL.UEM.TOTL.ZS",
}

async function fetchWB(indicator: string): Promise<Record<string, number>> {
  const url = `https://api.worldbank.org/v2/country/all/indicator/${indicator}?format=json&mrv=5&per_page=1500`
  console.log(`[macro-data] Fetching WB indicator: ${indicator}`)

  const res = await fetch(url, { signal: AbortSignal.timeout(20000) })
  if (!res.ok) throw new Error(`World Bank ${res.status}`)

  const json = await res.json()
  const rows = json[1] ?? []
  const result: Record<string, number> = {}

  for (const row of rows) {
    const iso = row.countryiso3code
    if (!iso || result[iso] !== undefined) continue
    if (row.value !== null && row.value !== undefined) result[iso] = row.value
  }

  console.log(`[macro-data] ${indicator}: ${Object.keys(result).length} countries`)
  return result
}

async function fetchIMFDebt(): Promise<Record<string, number>> {
  console.log("[macro-data] Fetching IMF debt data...")
  const url = "https://www.imf.org/external/datamapper/api/v1/GGXWDG_NGDP"
  const res = await fetch(url, { signal: AbortSignal.timeout(20000) })
  if (!res.ok) throw new Error(`IMF API ${res.status}`)

  const json = await res.json()
  const values: Record<string, Record<string, number>> = json?.GGXWDG_NGDP ?? json?.values?.GGXWDG_NGDP ?? {}
  const result: Record<string, number> = {}

  const AGGREGATE_CODES = new Set([
    "ADVEC", "AFQ", "SSQ", "AS5", "APQ", "AZQ", "CBQ", "CMQ", "CAQ", "EAQ", "EEQ",
    "DA", "EDE", "OEMDC", "EURO", "EUQ", "EU", "WE", "MAE", "MEQ", "MECA", "NAQ",
    "NMQ", "OAE", "PIQ", "SMQ", "SAQ", "SEQ", "SSA", "WEQ", "WHQ", "WEOWORLD",
  ])

  for (const [iso3, yearMap] of Object.entries(values)) {
    if (AGGREGATE_CODES.has(iso3)) continue
    const years = Object.keys(yearMap as Record<string, number>).sort().reverse()
    for (const yr of years) {
      const v = (yearMap as Record<string, number>)[yr]
      if (v !== null && v !== undefined) { result[iso3] = v; break }
    }
  }

  console.log(`[macro-data] IMF debt: ${Object.keys(result).length} countries`)
  return result
}

function getMockData(): Record<string, Record<string, number>> {
  const mockCountries = ["USA", "CHN", "JPN", "DEU", "GBR", "FRA", "IND", "ITA", "BRA", "CAN", "KOR", "RUS", "AUS", "ESP", "MEX"]

  const mockInflation: Record<string, number> = {}
  const mockGdpGrowth: Record<string, number> = {}
  const mockGdp: Record<string, number> = {}
  const mockUnemployment: Record<string, number> = {}

  mockCountries.forEach((iso, i) => {
    mockInflation[iso] = 2 + Math.random() * 4
    mockGdpGrowth[iso] = 0.5 + Math.random() * 4.5
    mockGdp[iso] = (1 + i * 0.8) * 1e12
    mockUnemployment[iso] = 3 + Math.random() * 6
  })

  return {
    inflation: mockInflation,
    gdpGrowth: mockGdpGrowth,
    gdp: mockGdp,
    unemployment: mockUnemployment,
    debtToGdp: {},
  }
}

export async function GET() {
  console.log("[macro-data] ========== Request received ==========")

  try {
    // Check cache
    console.log("[macro-data] Checking cache...")
    const { data: cached, error: cacheError } = await supabase
      .from("macro_cache")
      .select("data, fetched_at")
      .eq("id", CACHE_KEY)
      .single()

    if (cacheError) {
      console.log("[macro-data] Cache read error:", cacheError.message)
    }

    if (cached?.fetched_at) {
      const age = Date.now() - new Date(cached.fetched_at).getTime()
      console.log("[macro-data] Cache age:", Math.round(age / 1000 / 60), "minutes")

      if (age < CACHE_MS && cached.data && Object.keys(cached.data).length > 0) {
        console.log("[macro-data] ✓ Returning cached data")
        return NextResponse.json(
          { data: cached.data, fetchedAt: cached.fetched_at, cached: true },
          { headers: { "Cache-Control": "public, s-maxage=3600, stale-while-revalidate=7200" } }
        )
      }
    }

    console.log("[macro-data] Cache miss or stale, fetching fresh data...")

    // Fetch World Bank data
    const [inflation, gdpGrowth, gdp, unemployment] = await Promise.all([
      fetchWB(WB_INDICATORS.inflation),
      fetchWB(WB_INDICATORS.gdpGrowth),
      fetchWB(WB_INDICATORS.gdp),
      fetchWB(WB_INDICATORS.unemployment),
    ])

    console.log("[macro-data] WB totals - inflation:", Object.keys(inflation).length,
      "gdpGrowth:", Object.keys(gdpGrowth).length,
      "gdp:", Object.keys(gdp).length,
      "unemployment:", Object.keys(unemployment).length)

    // If World Bank returns empty, use mock data
    if (Object.keys(inflation).length === 0) {
      console.log("[macro-data] ⚠ World Bank returned empty, using mock data")
      const mockData = getMockData()
      return NextResponse.json(
        { data: mockData, fetchedAt: new Date().toISOString(), cached: false, mock: true },
        { headers: { "Cache-Control": "public, s-maxage=3600" } }
      )
    }

    // Fetch IMF data (optional)
    let debtToGdp: Record<string, number> = {}
    try {
      debtToGdp = await fetchIMFDebt()
    } catch (err) {
      console.warn("[macro-data] IMF API failed (non-blocking):", err instanceof Error ? err.message : err)
    }

    const data = { inflation, gdpGrowth, gdp, unemployment, debtToGdp }
    const fetchedAt = new Date().toISOString()

    // Save to cache
    console.log("[macro-data] Saving to cache...")
    const { error: upsertError } = await supabase
      .from("macro_cache")
      .upsert({ id: CACHE_KEY, data, fetched_at: fetchedAt })

    if (upsertError) {
      console.error("[macro-data] Cache write error:", upsertError.message)
    } else {
      console.log("[macro-data] ✓ Data cached successfully")
    }

    return NextResponse.json(
      { data, fetchedAt, cached: false },
      { headers: { "Cache-Control": "public, s-maxage=3600, stale-while-revalidate=7200" } }
    )

  } catch (error) {
    console.error("[macro-data] ✗ Error:", error instanceof Error ? error.message : error)

    // Try stale cache
    try {
      const { data: cached } = await supabase
        .from("macro_cache")
        .select("data, fetched_at")
        .eq("id", CACHE_KEY)
        .single()

      if (cached?.data) {
        console.log("[macro-data] Returning stale cache due to error")
        return NextResponse.json(
          { data: cached.data, fetchedAt: cached.fetched_at, cached: true, stale: true }
        )
      }
    } catch (cacheError) {
      console.error("[macro-data] Stale cache fallback failed:", cacheError)
    }

    // Last resort: mock data
    console.log("[macro-data] Returning mock data as last resort")
    const mockData = getMockData()
    return NextResponse.json(
      { data: mockData, fetchedAt: new Date().toISOString(), cached: false, mock: true },
      { status: 200 }
    )
  }
}