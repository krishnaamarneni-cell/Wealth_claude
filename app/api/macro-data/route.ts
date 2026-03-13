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

const ISO2_TO_ISO3: Record<string, string> = {
  AF: "AFG", AL: "ALB", DZ: "DZA", AO: "AGO", AR: "ARG", AM: "ARM", AU: "AUS", AT: "AUT", AZ: "AZE",
  BS: "BHS", BH: "BHR", BD: "BGD", BY: "BLR", BE: "BEL", BZ: "BLZ", BJ: "BEN", BT: "BTN", BO: "BOL",
  BA: "BIH", BW: "BWA", BR: "BRA", BN: "BRN", BG: "BGR", BF: "BFA", BI: "BDI", CV: "CPV", KH: "KHM",
  CM: "CMR", CA: "CAN", CF: "CAF", TD: "TCD", CL: "CHL", CN: "CHN", CO: "COL", KM: "COM", CD: "COD",
  CG: "COG", CR: "CRI", CI: "CIV", HR: "HRV", CU: "CUB", CY: "CYP", CZ: "CZE", DK: "DNK", DJ: "DJI",
  DO: "DOM", EC: "ECU", EG: "EGY", SV: "SLV", GQ: "GNQ", ER: "ERI", EE: "EST", ET: "ETH", FJ: "FJI",
  FI: "FIN", FR: "FRA", GA: "GAB", GM: "GMB", GE: "GEO", DE: "DEU", GH: "GHA", GR: "GRC", GT: "GTM",
  GN: "GIN", GW: "GNB", GY: "GUY", HT: "HTI", HN: "HND", HU: "HUN", IS: "ISL", IN: "IND", ID: "IDN",
  IR: "IRN", IQ: "IRQ", IE: "IRL", IL: "ISR", IT: "ITA", JM: "JAM", JP: "JPN", JO: "JOR", KZ: "KAZ",
  KE: "KEN", KR: "KOR", KW: "KWT", KG: "KGZ", LA: "LAO", LV: "LVA", LB: "LBN", LR: "LBR", LY: "LBY",
  LT: "LTU", LU: "LUX", MG: "MDG", MW: "MWI", MY: "MYS", MV: "MDV", ML: "MLI", MT: "MLT", MR: "MRT",
  MU: "MUS", MX: "MEX", MD: "MDA", MN: "MNG", ME: "MNE", MA: "MAR", MZ: "MOZ", MM: "MMR", NA: "NAM",
  NP: "NPL", NL: "NLD", NZ: "NZL", NI: "NIC", NE: "NER", NG: "NGA", MK: "MKD", NO: "NOR", OM: "OMN",
  PK: "PAK", PA: "PAN", PG: "PNG", PY: "PRY", PE: "PER", PH: "PHL", PL: "POL", PT: "PRT", QA: "QAT",
  RO: "ROU", RU: "RUS", RW: "RWA", SA: "SAU", SN: "SEN", RS: "SRB", SL: "SLE", SG: "SGP", SK: "SVK",
  SI: "SVN", SO: "SOM", ZA: "ZAF", SS: "SSD", ES: "ESP", LK: "LKA", SD: "SDN", SR: "SUR", SE: "SWE",
  CH: "CHE", SY: "SYR", TJ: "TJK", TZ: "TZA", TH: "THA", TG: "TGO", TT: "TTO", TN: "TUN", TR: "TUR",
  TM: "TKM", UG: "UGA", UA: "UKR", AE: "ARE", GB: "GBR", US: "USA", UY: "URY", UZ: "UZB", VE: "VEN",
  VN: "VNM", YE: "YEM", ZM: "ZMB", ZW: "ZWE", TW: "TWN", HK: "HKG",
}

async function fetchIMFDebt(): Promise<Record<string, number>> {
  const url = "https://www.imf.org/external/datamapper/api/v1/GGXWDG_NGDP"
  const res = await fetch(url, { signal: AbortSignal.timeout(20000) })
  if (!res.ok) throw new Error(`IMF API ${res.status}`)
  const json = await res.json()
  const values = json?.values?.GGXWDG_NGDP ?? {}
  const result: Record<string, number> = {}
  for (const [iso2, yearMap] of Object.entries(values)) {
    const iso3 = ISO2_TO_ISO3[iso2]
    if (!iso3) continue
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