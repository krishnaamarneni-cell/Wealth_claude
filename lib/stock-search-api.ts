const FMP_API_KEY = process.env.NEXT_PUBLIC_FMP_API_KEY

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

  try {
    const response = await fetch(
      `https://financialmodelingprep.com/api/v3/search?query=${encodeURIComponent(query)}&limit=10&apikey=${FMP_API_KEY}`
    )

    if (!response.ok) {
      throw new Error('Failed to search stocks')
    }

    const data: StockSearchResult[] = await response.json()

    // Filter to only show major exchanges
    return data.filter(stock =>
      ['NASDAQ', 'NYSE', 'AMEX', 'NYSEArca'].includes(stock.exchangeShortName)
    )
  } catch (error) {
    console.error('Stock search error:', error)
    return []
  }
}

/**
 * Get real-time quote for a single stock
 */
export const getStockQuote = async (symbol: string): Promise<StockQuote | null> => {
  try {
    const response = await fetch(
      `https://financialmodelingprep.com/api/v3/quote/${symbol}?apikey=${FMP_API_KEY}`
    )

    if (!response.ok) {
      throw new Error('Failed to fetch stock quote')
    }

    const data: StockQuote[] = await response.json()
    return data.length > 0 ? data[0] : null
  } catch (error) {
    console.error(`Failed to fetch quote for ${symbol}:`, error)
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

  try {
    // FMP supports comma-separated symbols in one request
    const symbolsParam = symbols.join(',')
    const response = await fetch(
      `https://financialmodelingprep.com/api/v3/quote/${symbolsParam}?apikey=${FMP_API_KEY}`
    )

    if (!response.ok) {
      throw new Error('Failed to fetch batch quotes')
    }

    const data: StockQuote[] = await response.json()

    // Convert array to object keyed by symbol
    const quotes: Record<string, StockQuote> = {}
    data.forEach(quote => {
      quotes[quote.symbol] = quote
    })

    return quotes
  } catch (error) {
    console.error('Batch quote fetch error:', error)
    return {}
  }
}

/**
 * Get dividend data for a stock
 */
export const getStockDividend = async (symbol: string): Promise<number> => {
  try {
    const response = await fetch(
      `https://financialmodelingprep.com/api/v3/historical-price-full/stock_dividend/${symbol}?apikey=${FMP_API_KEY}`
    )

    if (!response.ok) {
      return 0
    }

    const data = await response.json()

    if (data.historical && data.historical.length > 0) {
      // Calculate annual dividend yield
      const lastDividend = data.historical[0].dividend || 0
      return lastDividend
    }

    return 0
  } catch (error) {
    return 0
  }
}
