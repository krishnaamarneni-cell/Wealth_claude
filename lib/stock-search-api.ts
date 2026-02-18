// TEMPORARY: Hardcode for V0 testing
const FMP_API_KEY = process.env.NEXT_PUBLIC_FMP_API_KEY || 'jfw2V9VKgYfjOBTWmKpjpNQonAmI26rF'

export interface StockSearchResult {
  symbol: string
  name: string
  currency: string
  stockExchange: string
  exchangeShortName: string
}

export interface StockQuote {
  symbol: string
  name: string
  price: number
  changesPercentage: number
  change: number
  dayLow: number
  dayHigh: number
  yearHigh: number
  yearLow: number
  marketCap: number
  priceAvg50: number
  priceAvg200: number
  volume: number
  avgVolume: number
  exchange: string
  open: number
  previousClose: number
  eps: number
  pe: number
  earningsAnnouncement: string
  sharesOutstanding: number
  timestamp: number
}

/**
 * Search stocks by symbol or company name
 */
export const searchStocks = async (query: string): Promise<StockSearchResult[]> => {
  if (!query || query.trim().length === 0) {
    return []
  }

  if (!FMP_API_KEY || FMP_API_KEY === 'YOUR_API_KEY_HERE') {
    console.error('❌ FMP API key not configured')
    alert('Please add your FMP API key to lib/stock-search-api.ts')
    return []
  }

  try {
    const url = `https://financialmodelingprep.com/api/v3/search?query=${encodeURIComponent(query)}&limit=10&apikey=${FMP_API_KEY}`
    console.log('🔍 Searching stocks:', query)
    console.log('🔑 API Key:', FMP_API_KEY.substring(0, 10) + '...')

    const response = await fetch(url)

    console.log('📡 Response status:', response.status)

    if (!response.ok) {
      const errorText = await response.text()
      console.error('❌ API Error:', errorText)
      throw new Error(`API returned ${response.status}`)
    }

    const data: StockSearchResult[] = await response.json()
    console.log('✅ Raw results:', data)

    // If no results, return everything to debug
    if (data.length === 0) {
      console.warn('⚠️ No results found for:', query)
      return []
    }

    // Filter to major exchanges
    const filtered = data.filter(stock =>
      ['NASDAQ', 'NYSE', 'AMEX', 'NYSEArca', 'NYSEARCA'].includes(stock.exchangeShortName)
    )

    console.log('✅ Filtered results:', filtered.length, 'stocks')

    // If filtered is empty but data exists, return all data for debugging
    if (filtered.length === 0 && data.length > 0) {
      console.warn('⚠️ All results filtered out. Returning all exchanges.')
      return data
    }

    return filtered
  } catch (error) {
    console.error('❌ Search error:', error)
    alert(`Search failed: ${error}`)
    return []
  }
}

/**
 * Get real-time quote for a single stock
 */
export const getStockQuote = async (symbol: string): Promise<StockQuote | null> => {
  if (!FMP_API_KEY || FMP_API_KEY === 'YOUR_API_KEY_HERE') {
    console.error('❌ FMP API key not configured')
    return null
  }

  try {
    const url = `https://financialmodelingprep.com/api/v3/quote/${symbol}?apikey=${FMP_API_KEY}`
    console.log('📊 Fetching quote for:', symbol)
    console.log('🔗 URL:', url.replace(FMP_API_KEY, 'API_KEY'))

    const response = await fetch(url)

    console.log('📡 Quote response status:', response.status)

    if (!response.ok) {
      const errorText = await response.text()
      console.error('❌ Quote API Error:', errorText)
      return null
    }

    const data: StockQuote[] = await response.json()
    console.log('✅ Quote data received:', data)

    if (data.length === 0) {
      console.error('❌ No data returned for:', symbol)
      return null
    }

    console.log('✅ Quote for', symbol, ':', data[0].price)
    return data[0]
  } catch (error) {
    console.error(`❌ Quote fetch error for ${symbol}:`, error)
    return null
  }
}

/**
 * Get real-time quotes for multiple stocks (batched)
 */
export const getBatchStockQuotes = async (symbols: string[]): Promise<Record<string, StockQuote>> => {
  if (symbols.length === 0) {
    return {}
  }

  if (!FMP_API_KEY || FMP_API_KEY === 'YOUR_API_KEY_HERE') {
    console.error('❌ FMP API key not configured')
    return {}
  }

  try {
    const symbolsParam = symbols.join(',')
    const url = `https://financialmodelingprep.com/api/v3/quote/${symbolsParam}?apikey=${FMP_API_KEY}`
    console.log('📊 Fetching batch quotes for:', symbols)

    const response = await fetch(url)

    if (!response.ok) {
      const errorText = await response.text()
      console.error('❌ Batch API Error:', errorText)
      throw new Error('Failed to fetch batch quotes')
    }

    const data: StockQuote[] = await response.json()
    console.log('✅ Batch quotes received:', data.length)

    const quotes: Record<string, StockQuote> = {}
    data.forEach(quote => {
      quotes[quote.symbol] = quote
    })

    return quotes
  } catch (error) {
    console.error('❌ Batch fetch error:', error)
    return {}
  }
}

/**
 * Get dividend data for a stock
 */
export const getStockDividend = async (symbol: string): Promise<number> => {
  if (!FMP_API_KEY || FMP_API_KEY === 'YOUR_API_KEY_HERE') {
    return 0
  }

  try {
    const url = `https://financialmodelingprep.com/api/v3/historical-price-full/stock_dividend/${symbol}?apikey=${FMP_API_KEY}`
    const response = await fetch(url)

    if (!response.ok) {
      return 0
    }

    const data = await response.json()

    if (data.historical && data.historical.length > 0) {
      const lastDividend = data.historical[0].dividend || 0
      return lastDividend
    }

    return 0
  } catch (error) {
    return 0
  }
}
