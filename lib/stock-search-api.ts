// Multi-API Stock Search with Fallback Support
// Supports: Polygon.io, Finnhub, Financial Modeling Prep

// Configure your API keys here (or use environment variables)
const POLYGON_API_KEY = process.env.NEXT_PUBLIC_POLYGON_API_KEY
const FINNHUB_API_KEY = process.env.NEXT_PUBLIC_FINNHUB_API_KEY
const FMP_API_KEY = process.env.NEXT_PUBLIC_FMP_API_KEY

// Mock stock database for demo without API keys
const MOCK_STOCKS: Record<string, { symbol: string; name: string; exchange: string }> = {
  'AAPL': { symbol: 'AAPL', name: 'Apple Inc.', exchange: 'NASDAQ' },
  'GOOGL': { symbol: 'GOOGL', name: 'Alphabet Inc.', exchange: 'NASDAQ' },
  'MSFT': { symbol: 'MSFT', name: 'Microsoft Corp.', exchange: 'NASDAQ' },
  'AMZN': { symbol: 'AMZN', name: 'Amazon.com Inc.', exchange: 'NASDAQ' },
  'TSLA': { symbol: 'TSLA', name: 'Tesla Inc.', exchange: 'NASDAQ' },
  'META': { symbol: 'META', name: 'Meta Platforms Inc.', exchange: 'NASDAQ' },
  'NVDA': { symbol: 'NVDA', name: 'NVIDIA Corp.', exchange: 'NASDAQ' },
  'NFLX': { symbol: 'NFLX', name: 'Netflix Inc.', exchange: 'NASDAQ' },
  'AMD': { symbol: 'AMD', name: 'Advanced Micro Devices', exchange: 'NASDAQ' },
  'PYPL': { symbol: 'PYPL', name: 'PayPal Holdings', exchange: 'NASDAQ' },
  'INTC': { symbol: 'INTC', name: 'Intel Corp.', exchange: 'NASDAQ' },
  'CSCO': { symbol: 'CSCO', name: 'Cisco Systems', exchange: 'NASDAQ' },
  'VZ': { symbol: 'VZ', name: 'Verizon Communications', exchange: 'NYSE' },
  'T': { symbol: 'T', name: 'AT&T Inc.', exchange: 'NYSE' },
  'PFE': { symbol: 'PFE', name: 'Pfizer Inc.', exchange: 'NYSE' },
  'JNJ': { symbol: 'JNJ', name: 'Johnson & Johnson', exchange: 'NYSE' },
  'MRK': { symbol: 'MRK', name: 'Merck & Co.', exchange: 'NYSE' },
  'KO': { symbol: 'KO', name: 'Coca-Cola Co.', exchange: 'NYSE' },
  'PEP': { symbol: 'PEP', name: 'PepsiCo Inc.', exchange: 'NASDAQ' },
  'WMT': { symbol: 'WMT', name: 'Walmart Inc.', exchange: 'NYSE' },
  'MCD': { symbol: 'MCD', name: "McDonald's Corp.", exchange: 'NYSE' },
  'DIS': { symbol: 'DIS', name: 'Walt Disney Co.', exchange: 'NYSE' },
  'BAC': { symbol: 'BAC', name: 'Bank of America', exchange: 'NYSE' },
  'JPM': { symbol: 'JPM', name: 'JPMorgan Chase', exchange: 'NYSE' },
  'GE': { symbol: 'GE', name: 'General Electric', exchange: 'NYSE' },
  'F': { symbol: 'F', name: 'Ford Motor Co.', exchange: 'NYSE' },
  'GM': { symbol: 'GM', name: 'General Motors', exchange: 'NYSE' },
  'SPY': { symbol: 'SPY', name: 'SPDR S&P 500 ETF', exchange: 'NYSE' },
  'QQQ': { symbol: 'QQQ', name: 'Invesco QQQ ETF', exchange: 'NASDAQ' },
  'IWM': { symbol: 'IWM', name: 'iShares Russell 2000 ETF', exchange: 'NYSE' },
}

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
 * Search stocks with mock fallback
 */
function searchMockStocks(query: string): StockSearchResult[] {
  const lowerQuery = query.toLowerCase()
  
  // Search by symbol or company name
  const results = Object.values(MOCK_STOCKS).filter(stock => 
    stock.symbol.toLowerCase().includes(lowerQuery) ||
    stock.name.toLowerCase().includes(lowerQuery)
  )
  
  return results.map(stock => ({
    symbol: stock.symbol,
    name: stock.name,
    currency: 'USD',
    stockExchange: stock.exchange,
    exchangeShortName: stock.exchange,
    type: 'Equity'
  }))
}

/**
 * Get mock quote for a stock
 */
function getMockQuote(symbol: string): StockQuote | null {
  const stock = MOCK_STOCKS[symbol.toUpperCase()]
  if (!stock) return null
  
  // Generate realistic mock data
  const basePrice = 100 + Math.random() * 300
  const change = (Math.random() - 0.5) * 20
  const changePercent = (change / basePrice) * 100
  
  return {
    symbol: stock.symbol,
    name: stock.name,
    price: basePrice,
    changesPercentage: changePercent,
    change: change,
    dayLow: basePrice - Math.random() * 10,
    dayHigh: basePrice + Math.random() * 10,
    yearHigh: basePrice + Math.random() * 50,
    yearLow: basePrice - Math.random() * 50,
    marketCap: Math.random() * 3000000000000,
    volume: Math.random() * 100000000,
    pe: 15 + Math.random() * 30,
    timestamp: Date.now()
  }
}

/**
 * Search stocks with automatic fallback across APIs
 */
export const searchStocks = async (query: string): Promise<StockSearchResult[]> => {
  if (!query || query.trim().length === 0) {
    return []
  }

  console.log('🔍 Searching for:', query)

  // Try Polygon first (only if key is configured)
  if (POLYGON_API_KEY) {
    let results = await searchStocksPolygon(query)
    if (results.length > 0) return results
  }

  // Fallback to Finnhub (only if key is configured)
  if (FINNHUB_API_KEY) {
    let results = await searchStocksFinnhub(query)
    if (results.length > 0) return results
  }

  // Fallback to FMP (only if key is configured)
  if (FMP_API_KEY) {
    let results = await searchStocksFMP(query)
    if (results.length > 0) return results
  }

  // Use mock database when no APIs are configured
  console.log('⚠️ No API keys configured, using mock stock database')
  const mockResults = searchMockStocks(query)
  if (mockResults.length > 0) return mockResults
  
  console.error('❌ No results found')
  return []
}

/**
 * Get stock quote with automatic fallback
 */
export const getStockQuote = async (symbol: string): Promise<StockQuote | null> => {
  console.log('📊 Getting quote for:', symbol)

  // Try Polygon first (only if key is configured)
  if (POLYGON_API_KEY) {
    let quote = await getQuotePolygon(symbol)
    if (quote) return quote
  }

  // Fallback to Finnhub (only if key is configured)
  if (FINNHUB_API_KEY) {
    let quote = await getQuoteFinnhub(symbol)
    if (quote) return quote
  }

  // Fallback to FMP (only if key is configured)
  if (FMP_API_KEY) {
    let quote = await getQuoteFMP(symbol)
    if (quote) return quote
  }

  // Use mock data when no APIs are configured
  console.log('⚠️ No API keys configured, using mock data for', symbol)
  const mockQuote = getMockQuote(symbol)
  if (mockQuote) return mockQuote

  console.error('❌ Quote not found for:', symbol)
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
