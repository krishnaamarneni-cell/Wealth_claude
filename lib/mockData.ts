import { COUNTRY_INDEX_MAP } from "./countryIndexMap"

export interface MarketDataPoint {
  ticker: string
  countryCode: string   // ISO alpha-3
  indexName: string
  exchange: string
  currency: string
  price: number
  change: number        // absolute change
  changePct: number     // % change
  previousClose: number
  lastUpdated: string   // ISO date string
  isOpen: boolean
}

export type MarketDataMap = Record<string, MarketDataPoint> // keyed by ISO alpha-3

// ── MOCK DATA (Step 1) ────────────────────────────────────────
// Realistic-looking mock data. Replace in Step 2 with live Yahoo Finance.

const MOCK_PRICES: Record<string, { price: number; changePct: number }> = {
  USA: { price: 5243.77, changePct: 0.87 },
  CAN: { price: 22134.50, changePct: 0.43 },
  MEX: { price: 52340.10, changePct: -0.62 },
  BRA: { price: 128450.0, changePct: -1.23 },
  ARG: { price: 1820400, changePct: 2.15 },
  CHL: { price: 6234.80, changePct: -0.18 },
  COL: { price: 1342.50, changePct: 0.31 },
  PER: { price: 654.30, changePct: -0.55 },

  GBR: { price: 8145.30, changePct: 0.28 },
  DEU: { price: 18432.10, changePct: 1.12 },
  FRA: { price: 7823.40, changePct: 0.76 },
  ITA: { price: 34521.80, changePct: 0.94 },
  ESP: { price: 11234.50, changePct: 0.51 },
  NLD: { price: 890.42, changePct: 0.63 },
  CHE: { price: 11876.40, changePct: -0.22 },
  SWE: { price: 2423.80, changePct: 0.38 },
  NOR: { price: 1432.60, changePct: -0.41 },
  DNK: { price: 2312.70, changePct: 0.29 },
  FIN: { price: 1876.30, changePct: -0.17 },
  BEL: { price: 4234.10, changePct: 0.44 },
  AUT: { price: 3542.90, changePct: -0.33 },
  PRT: { price: 6823.40, changePct: 0.61 },
  GRC: { price: 1456.80, changePct: -2.14 },
  POL: { price: 2345.60, changePct: 1.08 },
  CZE: { price: 1567.40, changePct: 0.23 },
  HUN: { price: 71234.0, changePct: -0.87 },
  ROU: { price: 18234.50, changePct: 0.55 },
  TUR: { price: 9832450, changePct: 3.21 },
  RUS: { price: 3234.10, changePct: -0.43 },

  JPN: { price: 39234.50, changePct: 1.43 },
  CHN: { price: 3256.40, changePct: -0.87 },
  HKG: { price: 16823.40, changePct: -1.54 },
  IND: { price: 22543.80, changePct: 0.92 },
  KOR: { price: 2634.50, changePct: 0.71 },
  AUS: { price: 7823.40, changePct: 0.34 },
  NZL: { price: 12456.70, changePct: -0.28 },
  TWN: { price: 20345.80, changePct: 1.87 },
  SGP: { price: 3456.70, changePct: 0.18 },
  MYS: { price: 1634.50, changePct: 0.43 },
  THA: { price: 1456.80, changePct: -0.63 },
  IDN: { price: 7234.50, changePct: 0.52 },
  PHL: { price: 6845.30, changePct: -0.34 },
  VNM: { price: 1312.40, changePct: 0.78 },
  PAK: { price: 78234.50, changePct: 2.34 },
  BGD: { price: 5823.40, changePct: -1.12 },
  LKA: { price: 11234.50, changePct: 0.41 },

  SAU: { price: 11823.40, changePct: -0.31 },
  ARE: { price: 4523.80, changePct: 0.67 },
  ISR: { price: 2134.60, changePct: -3.21 },
  ZAF: { price: 78234.50, changePct: 0.89 },
  EGY: { price: 28345.60, changePct: 1.43 },
  NGA: { price: 98234.50, changePct: 2.87 },
  KEN: { price: 1834.50, changePct: -0.22 },
  QAT: { price: 9823.40, changePct: 0.14 },
  KWT: { price: 7823.40, changePct: -0.08 },
  MAR: { price: 13234.50, changePct: 0.53 },
}

export function getMockMarketData(): MarketDataMap {
  const result: MarketDataMap = {}
  const today = new Date().toISOString().split("T")[0]

  for (const [code, index] of Object.entries(COUNTRY_INDEX_MAP)) {
    const mock = MOCK_PRICES[code]
    if (!mock) continue

    const change = (mock.price * mock.changePct) / 100
    const previousClose = mock.price - change

    result[code] = {
      ticker: index.ticker,
      countryCode: code,
      indexName: index.name,
      exchange: index.exchange,
      currency: index.currency,
      price: mock.price,
      change,
      changePct: mock.changePct,
      previousClose,
      lastUpdated: today,
      isOpen: false, // mock = closed
    }
  }

  return result
}

// Format a price number nicely
export function formatPrice(price: number, currency: string): string {
  if (price >= 1_000_000) return `${(price / 1_000_000).toFixed(2)}M`
  if (price >= 10_000) return price.toLocaleString("en-US", { maximumFractionDigits: 0 })
  if (price >= 1_000) return price.toLocaleString("en-US", { maximumFractionDigits: 1 })
  return price.toLocaleString("en-US", { maximumFractionDigits: 2 })
}