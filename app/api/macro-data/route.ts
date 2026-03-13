import { NextResponse } from "next/server"
import { createClient } from "@supabase/supabase-js"

export const runtime = "nodejs"
export const maxDuration = 30

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

const CACHE_MS = 24 * 60 * 60 * 1000

const WB_INDICATORS: Record<string, string> = {
  inflation: "FP.CPI.TOTL.ZG",
  gdpGrowth: "NY.GDP.MKTP.KD.ZG",
  gdp: "NY.GDP.MKTP.CD",
  unemployment: "SL.UEM.TOTL.ZS",
}

async function fetchWB(indicator: string): Promise<Record<string, number>> {
  const url = `https://api.worldbank.org/v2/country/all/indicator/${indicator}?format=json&mrv=5&per_page=1500`
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
  return result
}


async function fetchIMFDebt(): Promise<Record<string, number>> {
  const url = "https://www.imf.org/external/datamapper/api/v1/GGXWDG_NGDP"
  const res = await fetch(url, { signal: AbortSignal.timeout(20000) })
  if (!res.ok) throw new Error(`IMF API ${res.status}`)
  const json = await res.json()
  const values = json?.values?.GGXWDG_NGDP ?? {}
  const result: Record<string, number> = {}
  // IMF API already returns ISO3 codes — use them directly
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
  return result
}

export async function GET() {
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

  try {
    const [inflation, gdpGrowth, gdp, unemployment, debtToGdp] = await Promise.all([
      fetchWB(WB_INDICATORS.inflation),
      fetchWB(WB_INDICATORS.gdpGrowth),
      fetchWB(WB_INDICATORS.gdp),
      fetchWB(WB_INDICATORS.unemployment),
      fetchIMFDebt(),
    ])

    const data = { inflation, gdpGrowth, gdp, unemployment, debtToGdp }
    const fetchedAt = new Date().toISOString()

    await supabase.from("macro_cache").upsert({ id: 1, data, fetched_at: fetchedAt })

    return NextResponse.json(
      { data, fetchedAt, cached: false },
      { headers: { "Cache-Control": "public, s-maxage=3600, stale-while-revalidate=7200" } }
    )
  } catch {
    if (cached?.data) {
      return NextResponse.json(
        { data: cached.data, fetchedAt: cached.fetched_at, cached: true, stale: true }
      )
    }
    return NextResponse.json({ error: "Failed to fetch macro data" }, { status: 500 })
  }
}