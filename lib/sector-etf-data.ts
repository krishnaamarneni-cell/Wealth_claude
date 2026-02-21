export const SECTOR_ETFS: Record<string, string> = {
  'Technology': 'XLK',
  'Communication Services': 'XLC',
  'Financials': 'XLF',
  'Healthcare': 'XLV',
  'Consumer Discretionary': 'XLY',
  'Consumer Staples': 'XLP',
  'Energy': 'XLE',
  'Industrials': 'XLI',
  'Utilities': 'XLU',
  'Real Estate': 'XLRE',
  'Materials': 'XLB',
}

export const ALL_SECTORS = Object.keys(SECTOR_ETFS)

export const SP500_SECTOR_WEIGHTS: Record<string, number> = {
  'Technology': 28.5,
  'Healthcare': 13.2,
  'Financials': 12.8,
  'Consumer Discretionary': 10.5,
  'Communication Services': 8.9,
  'Industrials': 8.4,
  'Consumer Staples': 6.8,
  'Energy': 4.2,
  'Utilities': 2.8,
  'Real Estate': 2.5,
  'Materials': 2.4,
}

export function mapSectorName(apiSector: string): string {
  const map: Record<string, string> = {
    'Financial Services': 'Financials',
    'Consumer Cyclical': 'Consumer Discretionary',
    'Consumer Defensive': 'Consumer Staples',
    'Basic Materials': 'Materials',
    'Technology': 'Technology',
    'Healthcare': 'Healthcare',
    'Health Care': 'Healthcare',
    'Communication Services': 'Communication Services',
    'Energy': 'Energy',
    'Real Estate': 'Real Estate',
    'Industrials': 'Industrials',
    'Utilities': 'Utilities',
  }
  return map[apiSector] || 'Other'
}

export interface SectorEtfData {
  sector: string
  etf: string
  price: number
  change: number
  changePercent: number
}

const CACHE_KEY = 'sectorEtfDailyCache'

function getLastTradingDay(): string {
  const now = new Date(new Date().toLocaleString('en-US', { timeZone: 'America/New_York' }))
  const day = now.getDay()
  const hour = now.getHours()
  const d = new Date(now)
  if (day === 0) d.setDate(d.getDate() - 2)
  else if (day === 6) d.setDate(d.getDate() - 1)
  else if (day === 1 && hour < 16) d.setDate(d.getDate() - 3)
  else if (day > 1 && hour < 16) d.setDate(d.getDate() - 1)
  return d.toISOString().split('T')[0]
}

export function getCachedSectorData(): SectorEtfData[] | null {
  if (typeof window === 'undefined') return null
  try {
    const raw = localStorage.getItem(CACHE_KEY)
    if (!raw) return null
    const parsed = JSON.parse(raw)
    if (parsed.tradingDay === getLastTradingDay()) return parsed.data
    return null
  } catch {
    return null
  }
}

function setCachedSectorData(data: SectorEtfData[]): void {
  if (typeof window === 'undefined') return
  try {
    localStorage.setItem(CACHE_KEY, JSON.stringify({
      data,
      tradingDay: getLastTradingDay(),
      timestamp: Date.now(),
    }))
  } catch { }
}

export async function fetchSectorEtfData(): Promise<SectorEtfData[]> {
  const cached = getCachedSectorData()
  if (cached) return cached

  const results: SectorEtfData[] = []

  for (const [sector, etf] of Object.entries(SECTOR_ETFS)) {
    try {
      const res = await fetch(`/api/stock-info?symbol=${etf}&t=${Date.now()}`, {
        cache: 'no-store',
      })
      if (res.ok) {
        const d = await res.json()
        const changePercent =
          typeof d.changePercent === 'number' && d.changePercent !== 0
            ? d.changePercent
            : (d.returns?.['1D'] ?? 0)
        results.push({
          sector,
          etf,
          price: d.price || 0,
          change: d.change || 0,
          changePercent,
        })
      } else {
        results.push({ sector, etf, price: 0, change: 0, changePercent: 0 })
      }
    } catch {
      results.push({ sector, etf, price: 0, change: 0, changePercent: 0 })
    }
    await new Promise(r => setTimeout(r, 150))
  }

  if (results.length > 0) setCachedSectorData(results)
  return results
}

export function getTradingDayLabel(): string {
  const now = new Date(new Date().toLocaleString('en-US', { timeZone: 'America/New_York' }))
  const day = now.getDay()
  if (day === 0 || day === 6) return "Friday's Closing Data"
  if (now.getHours() < 16) return 'Previous Close'
  return "Today's Closing Data"
}
