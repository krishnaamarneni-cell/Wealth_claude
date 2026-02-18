// Multi-API Stock Search with Fallback Support
// Supports: Polygon.io, Finnhub, Financial Modeling Prep

// Configure your API keys here (or use environment variables)
const POLYGON_API_KEY = process.env.NEXT_PUBLIC_POLYGON_API_KEY || 'YOUR_POLYGON_KEY'
const FINNHUB_API_KEY = process.env.NEXT_PUBLIC_FINNHUB_API_KEY || 'YOUR_FINNHUB_KEY'
const FMP_API_KEY = process.env.NEXT_PUBLIC_FMP_API_KEY || 'YOUR_FMP_KEY'

export interface StockSearchResult {
  symbol: string
  name: string
  currency?: string
  stockExchange?: string
  exchangeShortName?: string
  type?: string
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
  volume: number
  pe: number
  timestamp: number
}

// ============= POLYGON.IO API =============

async function searchStocksPolygon(query: string): Promise<StockSearchResult[]> {
  try {
    console.log('🔷 Trying Polygon API...')
    const url = `https://api.polygon.io/v3/reference/tickers?search=${encodeURIComponent(query)}&active=true&limit=10&apiKey=${POLYGON_API_KEY}`

    const response = await fetch(url)

    if (!response.ok) {
      throw new Error(`Polygon API: ${response.status}`)
    }

    const data = await response.json()

    if (!data.results || data.results.length === 0) {
      console.log('⚠️ Polygon: No results')
      return []
    }

    const results: StockSearchResult[] = data.results
      .filter((item: any) => item.market === 'stocks' && item.primary_exchange)
      .map((item: any) => ({
        symbol: item.ticker,
        name: item.name,
        currency: item.currency_name || 'USD',
        stockExchange: item.primary_exchange,
        exchangeShortName: item.primary_exchange,
        type: item.type
      }))

    console.log('✅ Polygon: Found', results.length, 'stocks')
    return results
  } catch (error) {
    console.error('❌ Polygon failed:', error)
    return []
  }
}

async function getQuotePolygon(symbol: string): Promise<StockQuote | null> {
  try {
    console.log('🔷 Fetching quote from Polygon:', symbol)

    // Get previous close
    const prevUrl = `https://api.polygon.io/v2/aggs/ticker/${symbol}/prev?adjusted=true&apiKey=${POLYGON_API_KEY}`
    const prevResponse = await fetch(prevUrl)

    if (!prevResponse.ok) {
      throw new Error(`Polygon prev close: ${prevResponse.status}`)
    }

    const prevData = await prevResponse.json()

    if (!prevData.results || prevData.results.length === 0) {
      throw new Error('No previous close data')
    }

    const prevClose = prevData.results[0].c
    const open = prevData.results[0].o
    const high = prevData.results[0].h
    const low = prevData.results[0].l
    const volume = prevData.results[0].v

    // Get ticker details for company name
    const detailsUrl = `https://api.polygon.io/v3/reference/tickers/${symbol}?apiKey=${POLYGON_API_KEY}`
    const detailsResponse = await fetch(detailsUrl)
    const detailsData = await detailsResponse.json()

    const companyName = detailsData.results?.name || symbol
    const marketCap = detailsData.results?.market_cap || 0

    // Calculate change (using previous close as current for now)
    const change = prevClose - open
    const changePercent = (change / open) * 100

    const quote: StockQuote = {
      symbol: symbol,
      name: companyName,
      price: prevClose,
      changesPercentage: changePercent,
      change: change,
      dayLow: low,
      dayHigh: high,
      yearHigh: high, // Polygon doesn't provide 52w high easily
      yearLow: low,
      marketCap: marketCap,
      volume: volume,
      pe: 0, // Not available in basic Polygon call
      timestamp: Date.now()
    }

    console.log('✅ Polygon quote:', quote.price)
    return quote
  } catch (error) {
    console.error('❌ Polygon quote failed:', error)
    return null
  }
}

// ============= FINNHUB API =============

async function searchStocksFinnhub(query: string): Promise<StockSearchResult[]> {
  try {
    console.log('🔶 Trying Finnhub API...')
    const url = `https://finnhub.io/api/v1/search?q=${encodeURIComponent(query)}&token=${FINNHUB_API_KEY}`

    const response = await fetch(url)

    if (!response.ok) {
      throw new Error(`Finnhub API: ${response.status}`)
    }

    const data = await response.json()

    if (!data.result || data.result.length === 0) {
      console.log('⚠️ Finnhub: No results')
      return []
    }

    const results: StockSearchResult[] = data.result
      .filter((item: any) => item.type === 'Common Stock')
      .slice(0, 10)
      .map((item: any) => ({
        symbol: item.symbol,
        name: item.description,
        stockExchange: item.displaySymbol,
        exchangeShortName: item.displaySymbol.includes(':') ? item.displaySymbol.split(':')[0] : 'NASDAQ',
        type: item.type
      }))

    console.log('✅ Finnhub: Found', results.length, 'stocks')
    return results
  } catch (error) {
    console.error('❌ Finnhub failed:', error)
    return []
  }
}

async function getQuoteFinnhub(symbol: string): Promise<StockQuote | null> {
  try {
    console.log('🔶 Fetching quote from Finnhub:', symbol)

    // Get quote
    const quoteUrl = `https://finnhub.io/api/v1/quote?symbol=${symbol}&token=${FINNHUB_API_KEY}`
    const quoteResponse = await fetch(quoteUrl)

    if (!quoteResponse.ok) {
      throw new Error(`Finnhub quote: ${quoteResponse.status}`)
    }

    const quoteData = await quoteResponse.json()

    if (!quoteData.c || quoteData.c === 0) {
      throw new Error('Invalid quote data')
    }

    // Get company profile for name
    const profileUrl = `https://finnhub.io/api/v1/stock/profile2?symbol=${symbol}&token=${FINNHUB_API_KEY}`
    const profileResponse = await fetch(profileUrl)
    const profileData = await profileResponse.json()

    const companyName = profileData.name || symbol
    const marketCap = profileData.marketCapitalization ? profileData.marketCapitalization * 1000000 : 0

    const currentPrice = quoteData.c
    const previousClose = quoteData.pc
    const change = currentPrice - previousClose
    const changePercent = (change / previousClose) * 100

    const quote: StockQuote = {
      symbol: symbol,
      name: companyName,
      price: currentPrice,
      changesPercentage: changePercent,
      change: change,
      dayLow: quoteData.l || currentPrice,
      dayHigh: quoteData.h || currentPrice,
      yearHigh: quoteData.h || currentPrice,
      yearLow: quoteData.l || currentPrice,
      marketCap: marketCap,
      volume: 0,
      pe: 0,
      timestamp: Date.now()
    }

    console.log('✅ Finnhub quote:', quote.price)
    return quote
  } catch (error) {
    console.error('❌ Finnhub quote failed:', error)
    return null
  }
}

// ============= FMP API =============

async function searchStocksFMP(query: string): Promise<StockSearchResult[]> {
  try {
    console.log('🔵 Trying FMP API...')
    const url = `https://financialmodelingprep.com/api/v3/search?query=${encodeURIComponent(query)}&limit=10&apikey=${FMP_API_KEY}`

    const response = await fetch(url)

    if (!response.ok) {
      throw new Error(`FMP API: ${response.status}`)
    }

    const data: StockSearchResult[] = await response.json()

    if (data.length === 0) {
      console.log('⚠️ FMP: No results')
      return []
    }

    const filtered = data.filter(stock =>
      ['NASDAQ', 'NYSE', 'AMEX', 'NYSEArca', 'NYSEARCA'].includes(stock.exchangeShortName || '')
    )

    console.log('✅ FMP: Found', filtered.length, 'stocks')
    return filtered
  } catch (error) {
    console.error('❌ FMP failed:', error)
    return []
  }
}

async function getQuoteFMP(symbol: string): Promise<StockQuote | null> {
  try {
    console.log('🔵 Fetching quote from FMP:', symbol)
    const url = `https://financialmodelingprep.com/api/v3/quote/${symbol}?apikey=${FMP_API_KEY}`

    const response = await fetch(url)

    if (!response.ok) {
      throw new Error(`FMP quote: ${response.status}`)
    }

    const data: any[] = await response.json()

    if (data.length === 0) {
      throw new Error('No quote data')
    }

    const quote: StockQuote = {
      symbol: data[0].symbol,
      name: data[0].name || symbol,
      price: data[0].price,
      changesPercentage: data[0].changesPercentage,
      change: data[0].change,
      dayLow: data[0].dayLow,
      dayHigh: data[0].dayHigh,
      yearHigh: data[0].yearHigh,
      yearLow: data[0].yearLow,
      marketCap: data[0].marketCap,
      volume: data[0].volume,
      pe: data[0].pe,
      timestamp: Date.now()
    }

    console.log('✅ FMP quote:', quote.price)
    return quote
  } catch (error) {
    console.error('❌ FMP quote failed:', error)
    return null
  }
}

// ============= UNIFIED API WITH FALLBACK =============

/**
 * Search stocks with automatic fallback across APIs
 */
export const searchStocks = async (query: string): Promise<StockSearchResult[]> => {
  if (!query || query.trim().length === 0) {
    return []
  }

  console.log('🔍 Searching for:', query)

  // Try Polygon first
  let results = await searchStocksPolygon(query)
  if (results.length > 0) return results

  // Fallback to Finnhub
  results = await searchStocksFinnhub(query)
  if (results.length > 0) return results

  // Fallback to FMP
  results = await searchStocksFMP(query)
  if (results.length > 0) return results

  console.error('❌ All APIs failed to return results')
  alert('Unable to search stocks. Please check your API keys.')
  return []
}

/**
 * Get stock quote with automatic fallback
 */
export const getStockQuote = async (symbol: string): Promise<StockQuote | null> => {
  console.log('📊 Getting quote for:', symbol)

  // Try Polygon first
  let quote = await getQuotePolygon(symbol)
  if (quote) return quote

  // Fallback to Finnhub
  quote = await getQuoteFinnhub(symbol)
  if (quote) return quote

  // Fallback to FMP
  quote = await getQuoteFMP(symbol)
  if (quote) return quote

  console.error('❌ All APIs failed to return quote for:', symbol)
  return null
}

/**
 * Get batch quotes (tries each API in sequence)
 */
export const getBatchStockQuotes = async (symbols: string[]): Promise<Record<string, StockQuote>> => {
  if (symbols.length === 0) {
    return {}
  }

  console.log('📊 Fetching batch quotes for:', symbols.length, 'symbols')

  const quotes: Record<string, StockQuote> = {}

  // Fetch quotes one by one with fallback
  for (const symbol of symbols) {
    const quote = await getStockQuote(symbol)
    if (quote) {
      quotes[symbol] = quote
    }
  }

  console.log('✅ Successfully fetched', Object.keys(quotes).length, 'quotes')
  return quotes
}

/**
 * Get dividend data (FMP only for now)
 */
export const getStockDividend = async (symbol: string): Promise<number> => {
  try {
    const url = `https://financialmodelingprep.com/api/v3/historical-price-full/stock_dividend/${symbol}?apikey=${FMP_API_KEY}`
    const response = await fetch(url)

    if (!response.ok) {
      return 0
    }

    const data = await response.json()

    if (data.historical && data.historical.length > 0) {
      return data.historical[0].dividend || 0
    }

    return 0
  } catch (error) {
    return 0
  }
}
