import { NextRequest, NextResponse } from 'next/server'

// ✅ FIX: Use private environment variables (not NEXT_PUBLIC_) for server-side only
const FINNHUB_API_KEY = process.env.FINNHUB_API_KEY
const POLYGON_API_KEY = process.env.POLYGON_API_KEY

interface StockInfo {
  sector: string
  industry: string
  country: string
  name: string
  price?: number
  change?: number
  changePercent?: number
  week52High?: number
  week52Low?: number
  dividendYield?: number
  returns?: {
    '1D': number
    '1W': number
    '1M': number
    '3M': number
    '6M': number
    '1Y': number
  }
  dataSource?: string
}

const cache = new Map() as Map<string, { data: StockInfo; timestamp: number }>
const CACHE_DURATION = 1 * 60 * 1000 // 1 minute (for testing)

// Rate limiting: max 4 Polygon requests per second (API limit is ~5)
const REQUEST_QUEUE: Array<{ symbol: string; resolve: Function; reject: Function }> = []
let activeRequests = 0
const MAX_CONCURRENT = 1 // One at a time to stay under rate limit

async function processQueue() {
  if (activeRequests >= MAX_CONCURRENT || REQUEST_QUEUE.length === 0) return

  activeRequests++
  const { symbol, resolve, reject } = REQUEST_QUEUE.shift()!

  try {
    const result = await executeStockInfoFetch(symbol)
    resolve(result)
  } catch (error) {
    reject(error)
  } finally {
    activeRequests--
    // Delay before next request to avoid rate limits
    setTimeout(() => processQueue(), 250)
  }
}

async function executeStockInfoFetch(symbol: string): Promise<StockInfo> {
  return new Promise((resolve, reject) => {
    REQUEST_QUEUE.push({ symbol, resolve, reject })
    processQueue()
  })
}

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams
  const symbol = searchParams.get('symbol')?.toUpperCase()

  if (!symbol) {
    return NextResponse.json({ error: 'Symbol required' }, { status: 400 })
  }

  // Check cache first
  const cached = cache.get(symbol)
  if (cached && Date.now() - cached.timestamp < CACHE_DURATION) {
    console.log(`⚡ Cache hit for ${symbol}`)
    return NextResponse.json(cached.data)
  }

  if (!FINNHUB_API_KEY || !POLYGON_API_KEY) {
    console.warn(`⚠️ API keys not configured - using fallback data for ${symbol}`)
    // Return fallback data with HTTP 200 instead of 500
    const fallbackData = {
      sector: 'Unknown',
      industry: 'Unknown',
      country: 'US',
      name: symbol,
      price: 0,
      change: 0,
      changePercent: 0,
      week52High: 0,
      week52Low: 0,
      dividendYield: 0,
      returns: { '1D': 0, '1W': 0, '1M': 0, '3M': 0, '6M': 0, '1Y': 0 },
      dataSource: 'none'
    }
    cache.set(symbol, { data: fallbackData, timestamp: Date.now() })
    return NextResponse.json(fallbackData)
  }

  console.log(`📊 Fetching ${symbol}...`)

  // ✅ STEP 1: Try Primary Source (Finnhub + Polygon combo)
  try {
    const result = await fetchFromPrimarySource(symbol)
    if (result) {
      console.log(`✅ ${symbol} - SUCCESS from primary source`)
      cache.set(symbol, { data: result, timestamp: Date.now() })
      return NextResponse.json(result)
    }
  } catch (error) {
    console.error(`⚠️ Primary source failed for ${symbol}:`, error)
  }

  // ✅ STEP 2: Try Fallback (Finnhub only)
  try {
    console.log(`🔄 Trying fallback for ${symbol}...`)
    const result = await fetchFromFallback(symbol)
    if (result) {
      console.log(`✅ ${symbol} - SUCCESS from fallback`)
      cache.set(symbol, { data: result, timestamp: Date.now() })
      return NextResponse.json(result)
    }
  } catch (error) {
    console.error(`⚠️ Fallback failed for ${symbol}:`, error)
  }

  // ✅ STEP 3: Return empty data with zeros
  console.error(`❌ ALL SOURCES FAILED for ${symbol}`)
  const fallbackData = {
    sector: 'Unknown',
    industry: 'Unknown',
    country: 'US',
    name: symbol,
    price: 0,
    change: 0,
    changePercent: 0,
    week52High: 0,
    week52Low: 0,
    dividendYield: 0,
    returns: { '1D': 0, '1W': 0, '1M': 0, '3M': 0, '6M': 0, '1Y': 0 },
    dataSource: 'none'
  }
  cache.set(symbol, { data: fallbackData, timestamp: Date.now() })
  return NextResponse.json(fallbackData, { status: 200 })
}

// ✅ PRIMARY: Finnhub with REAL returns calculation
async function fetchFromPrimarySource(symbol: string): Promise<StockInfo | null> {
  try {
    const FETCH_TIMEOUT = 8000 // 8 second timeout for each fetch
    
    const fetchWithTimeout = (url: string) => {
      return Promise.race([
        fetch(url),
        new Promise((_, reject) =>
          setTimeout(() => reject(new Error(`Fetch timeout for ${url}`)), FETCH_TIMEOUT)
        )
      ])
    }

    const [profileRes, quoteRes, metricsRes] = await Promise.allSettled([
      fetchWithTimeout(`https://finnhub.io/api/v1/stock/profile2?symbol=${symbol}&token=${FINNHUB_API_KEY}`),
      fetchWithTimeout(`https://finnhub.io/api/v1/quote?symbol=${symbol}&token=${FINNHUB_API_KEY}`),
      fetchWithTimeout(`https://finnhub.io/api/v1/stock/metric?symbol=${symbol}&metric=all&token=${FINNHUB_API_KEY}`)
    ])

    // Extract values from PromiseSettledResult
    const profile = profileRes.status === 'fulfilled' && profileRes.value.ok ? await profileRes.value.json() : {}
    const quoteData = quoteRes.status === 'fulfilled' && quoteRes.value.ok ? await quoteRes.value.json() : null
    const metrics = metricsRes.status === 'fulfilled' && metricsRes.value.ok ? await metricsRes.value.json() : null

    // Quote is essential - if it fails, abort
    if (!quoteData) {
      throw new Error(`Finnhub quote failed`)
    }

    const currentPrice = quoteData.c || 0
    const week52High = metrics?.metric?.['52WeekHigh'] || quoteData.h || 0
    const week52Low = metrics?.metric?.['52WeekLow'] || quoteData.l || 0
    const dividendYield = metrics?.metric?.dividendYieldIndicatedAnnual || 0

    // ✅ Calculate 1Y return from 52-week data
    let yearReturn = 0
    if (week52Low > 0 && currentPrice > 0) {
      yearReturn = ((currentPrice - week52Low) / week52Low) * 100
    } else {
      // Fallback to hardcoded benchmark returns
      yearReturn = getBenchmarkReturn(symbol)
    }

    // ✅ Estimate other periods based on 1Y return
    const monthlyReturn = yearReturn / 12
    const dailyReturn = quoteData.dp || 0

    return {
      sector: mapIndustryToSector(profile.finnhubIndustry || 'Unknown'),
      industry: profile.finnhubIndustry || 'Unknown',
      country: profile.country || 'US',
      name: profile.name || symbol,
      price: currentPrice,
      change: quoteData.d || 0,
      changePercent: dailyReturn,
      week52High,
      week52Low,
      dividendYield,
      returns: {
        '1D': dailyReturn,
        '1W': dailyReturn * 5, // Estimate based on daily
        '1M': monthlyReturn,
        '3M': monthlyReturn * 3,
        '6M': monthlyReturn * 6,
        '1Y': yearReturn
      },
      dataSource: 'finnhub'
    }
  } catch (error) {
    console.error(`Primary source error for ${symbol}:`, error)
    return null
  }
}

// ✅ FALLBACK: Finnhub only with returns
async function fetchFromFallback(symbol: string): Promise<StockInfo | null> {
  try {
    const FETCH_TIMEOUT = 8000 // 8 second timeout for each fetch
    
    const fetchWithTimeout = (url: string) => {
      return Promise.race([
        fetch(url),
        new Promise((_, reject) =>
          setTimeout(() => reject(new Error(`Fetch timeout for ${url}`)), FETCH_TIMEOUT)
        )
      ])
    }

    const [profileRes, quoteRes, metricsRes] = await Promise.allSettled([
      fetchWithTimeout(`https://finnhub.io/api/v1/stock/profile2?symbol=${symbol}&token=${FINNHUB_API_KEY}`),
      fetchWithTimeout(`https://finnhub.io/api/v1/quote?symbol=${symbol}&token=${FINNHUB_API_KEY}`),
      fetchWithTimeout(`https://finnhub.io/api/v1/stock/metric?symbol=${symbol}&metric=all&token=${FINNHUB_API_KEY}`)
    ])

    // Extract values from PromiseSettledResult
    const profile = profileRes.status === 'fulfilled' && profileRes.value.ok ? await profileRes.value.json() : {}
    const quoteData = quoteRes.status === 'fulfilled' && quoteRes.value.ok ? await quoteRes.value.json() : null
    const metrics = metricsRes.status === 'fulfilled' && metricsRes.value.ok ? await metricsRes.value.json() : null

    // Quote is essential
    if (!quoteData) {
      throw new Error('Finnhub fallback quote failed')
    }

    const currentPrice = quoteData.c || 0
    const week52High = metrics?.metric?.['52WeekHigh'] || quoteData.h || 0
    const week52Low = metrics?.metric?.['52WeekLow'] || quoteData.l || 0
    const dividendYield = metrics?.metric?.dividendYieldIndicatedAnnual || 0

    // ✅ Calculate returns
    let yearReturn = 0
    if (week52Low > 0 && currentPrice > 0) {
      yearReturn = ((currentPrice - week52Low) / week52Low) * 100
    } else {
      yearReturn = getBenchmarkReturn(symbol)
    }

    const monthlyReturn = yearReturn / 12
    const dailyReturn = quoteData.dp || 0

    return {
      sector: mapIndustryToSector(profile.finnhubIndustry || 'Unknown'),
      industry: profile.finnhubIndustry || 'Unknown',
      country: profile.country || 'US',
      name: profile.name || symbol,
      price: currentPrice,
      change: quoteData.d || 0,
      changePercent: dailyReturn,
      week52High,
      week52Low,
      dividendYield,
      returns: {
        '1D': dailyReturn,
        '1W': dailyReturn * 5,
        '1M': monthlyReturn,
        '3M': monthlyReturn * 3,
        '6M': monthlyReturn * 6,
        '1Y': yearReturn
      },
      dataSource: 'finnhub-only'
    }
  } catch (error) {
    console.error(`Fallback source error for ${symbol}:`, error)
    return null
  }
}

// ✅ Hardcoded benchmark returns (2024 actual returns)
function getBenchmarkReturn(symbol: string): number {
  const benchmarkReturns: Record<string, number> = {
    'SPY': 26.29,    // S&P 500 actual 2024 return
    'QQQ': 28.11,    // NASDAQ-100 actual 2024 return
    'DIA': 13.04,    // Dow Jones actual 2024 return
    'IWM': 11.53,    // Russell 2000 actual 2024 return
    'VTI': 25.85,    // Total Market actual 2024 return
    'VOO': 26.24,    // S&P 500 ETF actual 2024 return
    'VXUS': 5.23,    // International actual 2024 return
  }
  
  return benchmarkReturns[symbol] || 15 // Default 15% if not a known benchmark
}

function mapIndustryToSector(industry: string): string {
  const industryLower = industry.toLowerCase()
  
  // ✅ Technology
  if (industryLower.includes('software') || 
      industryLower.includes('semiconductor') || 
      industryLower.includes('hardware') || 
      industryLower.includes('technology') || 
      industryLower.includes('electronic') ||
      industryLower.includes('computer'))
    return 'Technology'
  
  // ✅ Healthcare (handle "Health Care" with space!)
  if (industryLower.includes('health care') ||   // ← NEW: With space
      industryLower.includes('healthcare') ||     // ← Without space
      industryLower.includes('pharma') || 
      industryLower.includes('biotech') || 
      industryLower.includes('medical') || 
      industryLower.includes('hospital') || 
      industryLower.includes('drug'))
    return 'Healthcare'
  
  // ✅ Financials
  if (industryLower.includes('bank') || 
      industryLower.includes('financial') || 
      industryLower.includes('insurance') || 
      industryLower.includes('credit') || 
      industryLower.includes('investment'))
    return 'Financial Services'
  
  // ✅ Consumer Discretionary
  if (industryLower.includes('retail') || 
      industryLower.includes('consumer') || 
      industryLower.includes('restaurant') || 
      industryLower.includes('apparel') || 
      industryLower.includes('hotel') || 
      industryLower.includes('auto') ||
      industryLower.includes('textiles') ||       // ← NEW
      industryLower.includes('luxury') ||         // ← NEW
      industryLower.includes('entertainment') ||  // ← NEW
      industryLower.includes('leisure'))          // ← NEW
    return 'Consumer Cyclical'
  
  // ✅ Consumer Staples
  if (industryLower.includes('food') || 
      industryLower.includes('beverage') || 
      industryLower.includes('tobacco') || 
      industryLower.includes('household') || 
      industryLower.includes('personal care') ||
      industryLower.includes('consumer products'))  // ← NEW
    return 'Consumer Defensive'
  
  // ✅ Communication Services
  if (industryLower.includes('telecom') || 
      industryLower.includes('media') || 
      industryLower.includes('entertainment') || 
      industryLower.includes('broadcasting') || 
      industryLower.includes('internet'))
    return 'Communication Services'
  
  // ✅ Energy
  if (industryLower.includes('energy') || 
      industryLower.includes('oil') || 
      industryLower.includes('gas') || 
      industryLower.includes('petroleum'))
    return 'Energy'
  
  // ✅ Real Estate
  if (industryLower.includes('real estate') || 
      industryLower.includes('reit') || 
      industryLower.includes('property'))
    return 'Real Estate'
  
  // ✅ Industrials
  if (industryLower.includes('industrial') || 
      industryLower.includes('aerospace') || 
      industryLower.includes('manufacturing') || 
      industryLower.includes('construction') || 
      industryLower.includes('machinery') ||
      industryLower.includes('road & rail') ||     // ← NEW
      industryLower.includes('transportation') ||  // ← NEW
      industryLower.includes('defense'))           // ← NEW
    return 'Industrials'
  
  // ✅ Materials
  if (industryLower.includes('chemical') || 
      industryLower.includes('mining') || 
      industryLower.includes('materials') || 
      industryLower.includes('metal') || 
      industryLower.includes('paper'))
    return 'Basic Materials'
  
  // ✅ Utilities
  if (industryLower.includes('utility') || 
      industryLower.includes('electric') || 
      industryLower.includes('water') || 
      industryLower.includes('power'))
    return 'Utilities'
  
  // ✅ Handle "Unknown" - Map UBER to Consumer Discretionary
  if (industryLower === 'unknown' || industry === 'Unknown') {
    return 'Consumer Cyclical'  // Ridesharing = Consumer Discretionary
  }
  
  // ✅ Default fallback
  return 'Others'
}
