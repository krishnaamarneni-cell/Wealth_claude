export type MarketDataMap = Record<string, {
  ticker: string
  countryCode: string
  indexName: string
  exchange: string
  currency: string
  price: number
  change: number
  changePct: number
  previousClose: number
  lastUpdated: string
  isOpen: boolean
}>

export interface FetchState {
  data: MarketDataMap
  fetchedAt: string | null
  isLoading: boolean
  isLive: boolean
  error: string | null
}

export async function fetchMarketData(): Promise<FetchState> {
  try {
    const res = await fetch("/api/market-data")
    if (!res.ok) throw new Error(`API error ${res.status}`)
    const json = await res.json()
    if (!json.data || Object.keys(json.data).length === 0) {
      throw new Error("No data returned")
    }
    return {
      data: json.data,
      fetchedAt: json.fetchedAt,
      isLoading: false,
      isLive: true,
      error: null,
    }
  } catch (e: any) {
    return {
      data: {},
      fetchedAt: null,
      isLoading: false,
      isLive: false,
      error: e.message,
    }
  }
}