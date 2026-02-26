// lib/dividend-forecast.ts

import { getTransactionsFromStorage } from './transaction-storage';
import { Transaction, Holding } from './transaction-types'; // Declare Transaction and Holding variables
import { getHoldings } from './portfolio-engine';

// ============================================================================

// TYPES
// ============================================================================

export interface DividendForecast {
  symbol: string;
  date: string; // YYYY-MM-DD
  amount: number; // Per share
  totalAmount: number; // amount × shares
  shares: number;
  type: 'received' | 'upcoming';
  source: 'finnhub' | 'polygon' | 'historical' | 'calculated' | 'estimated';
}

interface CachedDividendData {
  symbol: string;
  forecasts: DividendForecast[];
  timestamp: number;
}

interface HistoricalDividend {
  date: string;
  amount: number;
  shares: number;
}

interface DividendEvent {
  exDate: string;
  payDate?: string;
  amount: number; // per share
}

// ============================================================================

// CACHE CONFIGURATION
// ============================================================================

const CACHE_KEY_PREFIX = 'dividend_forecast_';
const CACHE_DURATION = 24 * 60 * 60 * 1000; // 24 hours

// ============================================================================

// CACHE HELPERS
// ============================================================================

function getCachedDividends(symbol: string): DividendForecast[] | null {
  try {
    const cached = localStorage.getItem(`${CACHE_KEY_PREFIX}${symbol}`);
    if (!cached) return null;

    const data: CachedDividendData = JSON.parse(cached);
    const age = Date.now() - data.timestamp;

    if (age > CACHE_DURATION) {
      localStorage.removeItem(`${CACHE_KEY_PREFIX}${symbol}`);
      return null;
    }

    return data.forecasts;
  } catch (error) {
    console.error(`Cache read error for ${symbol}:`, error);
    return null;
  }
}

function setCachedDividends(symbol: string, forecasts: DividendForecast[]): void {
  try {
    const cacheData: CachedDividendData = {
      symbol,
      forecasts,
      timestamp: Date.now(),
    };
    localStorage.setItem(`${CACHE_KEY_PREFIX}${symbol}`, JSON.stringify(cacheData));
  } catch (error) {
    console.error(`Cache write error for ${symbol}:`, error);
  }
}

export function clearDividendCache(symbol?: string): void {
  try {
    if (symbol) {
      localStorage.removeItem(`${CACHE_KEY_PREFIX}${symbol}`);
    } else {
      // Clear all dividend caches
      Object.keys(localStorage).forEach((key) => {
        if (key.startsWith(CACHE_KEY_PREFIX)) {
          localStorage.removeItem(key);
        }
      });
    }
  } catch (error) {
    console.error('Cache clear error:', error);
  }
}

// ============================================================================

// API FETCHERS
// ============================================================================

async function fetchFinnhubDividends(symbol: string): Promise<DividendForecast[]> {
  try {
    // Call server endpoint instead of exposing API key to client
    const response = await fetch(`/api/dividends/upcoming?symbol=${symbol}&source=finnhub`)

    if (!response.ok) {
      console.warn(`Server API failed for ${symbol}: ${response.status}`)
      return []
    }

    const result = await response.json()
    const data = result.data || []

    if (!Array.isArray(data)) {
      return []
    }

    // Get current shares from transactions
    const currentShares = getCurrentShares(symbol)

    return data
      .filter((d: any) => d.date && d.amount)
      .map((d: any) => ({
        symbol,
        date: d.date,
        amount: d.amount,
        totalAmount: d.amount * currentShares,
        shares: currentShares,
        type: 'upcoming' as const,
        source: 'finnhub' as const,
      }))
  } catch (error) {
    console.error(`Finnhub fetch error for ${symbol}:`, error)
    return []
  }
}

async function fetchPolygonDividends(symbol: string): Promise<DividendForecast[]> {
  try {
    // Call server endpoint instead of exposing API key to client
    const response = await fetch(`/api/dividends/upcoming?symbol=${symbol}&source=polygon`)
    
    if (!response.ok) {
      console.warn(`Server API failed for ${symbol}: ${response.status}`)
      return []
    }

    const result = await response.json()
    const data = result.data || []

    if (!Array.isArray(data)) {
      return []
    }

    // Get current shares from transactions
    const currentShares = getCurrentShares(symbol)

    return data
      .filter((d: any) => d.ex_dividend_date && d.cash_amount)
      .map((d: any) => ({
        symbol,
        date: d.ex_dividend_date,
        amount: d.cash_amount,
        totalAmount: d.cash_amount * currentShares,
        shares: currentShares,
        type: 'upcoming' as const,
        source: 'polygon' as const,
      }))
  } catch (error) {
    console.error(`Polygon fetch error for ${symbol}:`, error)
    return []
  }
}

// ============================================================================

// HISTORICAL CALCULATION
// ============================================================================

function getCurrentShares(symbol: string): number {
  const transactions = getTransactionsFromStorage();
  let shares = 0;

  transactions
    .filter((t) => t.symbol === symbol)
    .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())
    .forEach((t) => {
      if (t.type === 'BUY') {
        shares += t.shares || 0;
      } else if (t.type === 'SELL') {
        shares -= t.shares || 0;
      }
    });

  return shares;
}

function getHistoricalDividends(symbol: string): HistoricalDividend[] {
  const transactions = getTransactionsFromStorage();
  
  return transactions
    .filter((t) => t.symbol === symbol && t.type === 'DIVIDEND')
    .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())
    .map((t) => ({
      date: t.date,
      amount: Math.abs(t.total || 0), // Total dividend amount received
      shares: getCurrentSharesAtDate(symbol, t.date),
    }));
}

function getCurrentSharesAtDate(symbol: string, date: string): number {
  const transactions = getTransactionsFromStorage();
  let shares = 0;

  transactions
    .filter((t) => t.symbol === symbol && new Date(t.date) <= new Date(date))
    .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())
    .forEach((t) => {
      if (t.type === 'BUY') {
        shares += t.shares || 0;
      } else if (t.type === 'SELL') {
        shares -= t.shares || 0;
      }
    });

  return shares;
}

function calculateHistoricalForecast(symbol: string): DividendForecast[] {
  const historicalDividends = getHistoricalDividends(symbol)
  
  if (historicalDividends.length === 0) {
    console.log(`[v0] No historical dividends for ${symbol}`)
    return []
  }

  console.log(`[v0] Historical dividends for ${symbol}: ${historicalDividends.length} payments`)
  console.log(`[v0] Last 4 payments:`, historicalDividends.slice(-4).map(d => `$${d.amount.toFixed(2)} on ${d.date}`))

  // Get last 4 dividends (or all if less than 4)
  const recentDividends = historicalDividends.slice(-4)
  
  // Calculate average dividend per share from recent payments ONLY
  const avgDividendPerShare = recentDividends.reduce((sum, d) => {
    const perShare = d.shares > 0 ? d.amount / d.shares : 0
    return sum + perShare
  }, 0) / recentDividends.length

  console.log(`[v0] Average per-share dividend from last 4: $${avgDividendPerShare.toFixed(4)}`)

  // Get current shares
  const currentShares = getCurrentShares(symbol)
  
  console.log(`[v0] Current shares: ${currentShares}, calculating quarterly projection: $${(avgDividendPerShare * currentShares).toFixed(2)}`)

  // Determine payment frequency (find most common gap between payments)
  const gaps: number[] = []
  for (let i = 1; i < historicalDividends.length; i++) {
    const days = Math.round(
      (new Date(historicalDividends[i].date).getTime() - 
       new Date(historicalDividends[i - 1].date).getTime()) / 
      (1000 * 60 * 60 * 24)
    )
    gaps.push(days)
  }

  const avgGap = gaps.length > 0 
    ? Math.round(gaps.reduce((a, b) => a + b, 0) / gaps.length)
    : 90 // Default to quarterly

  console.log(`[v0] Average payment gap: ${avgGap} days`)

  // Project next 4 quarters only (12 months)
  const forecasts: DividendForecast[] = []
  const today = new Date()
  const lastPaymentDate = new Date(historicalDividends[historicalDividends.length - 1].date)
  
  let nextDate = new Date(lastPaymentDate)
  nextDate.setDate(nextDate.getDate() + avgGap)

  // Only generate 4 future payments (1 year for quarterly dividends)
  let paymentCount = 0
  while (paymentCount < 4 && nextDate <= new Date(today.getTime() + 365 * 24 * 60 * 60 * 1000)) {
    const quarterlyAmount = avgDividendPerShare * currentShares
    forecasts.push({
      symbol,
      date: nextDate.toISOString().split('T')[0],
      amount: avgDividendPerShare,
      totalAmount: quarterlyAmount,
      shares: currentShares,
      type: 'upcoming',
      source: 'historical',
    })

    console.log(`[v0] Projected payment ${paymentCount + 1}: $${quarterlyAmount.toFixed(2)} on ${nextDate.toISOString().split('T')[0]}`)

    nextDate = new Date(nextDate)
    nextDate.setDate(nextDate.getDate() + avgGap)
    paymentCount++
  }

  console.log(`[v0] Total projected: $${forecasts.reduce((sum, f) => sum + f.totalAmount, 0).toFixed(2)}`)

  return forecasts
}

// ============================================================================

// MAIN FUNCTION
// ============================================================================

export async function getDividendForecast(symbol: string): Promise<DividendForecast[]> {
  // Check cache first
  const cached = getCachedDividends(symbol);
  if (cached) {
    console.log(`[v0] Using cached dividends for ${symbol}`);
    return cached;
  }

  console.log(`[v0] Fetching fresh dividend data for ${symbol}`);

  // Try Finnhub first
  let upcomingDividends = await fetchFinnhubDividends(symbol);
  
  // Try Polygon if Finnhub failed
  if (upcomingDividends.length === 0) {
    console.log(`[v0] Finnhub failed for ${symbol}, trying Polygon...`);
    upcomingDividends = await fetchPolygonDividends(symbol);
  }

  // Use historical calculation if both APIs failed
  if (upcomingDividends.length === 0) {
    console.log(`[v0] Both APIs failed for ${symbol}, using historical data...`);
    upcomingDividends = calculateHistoricalForecast(symbol);
  }

  // Final fallback: use yield-based estimate from portfolio holdings
  if (upcomingDividends.length === 0) {
    console.log(`[v0] No historical data for ${symbol}, trying yield-based estimate...`);
    const transactions = getTransactionsFromStorage();
    const holdings = getHoldings();
    
    const holding = holdings.find(h => h.symbol === symbol);
    if (holding && holding.dividendYield && holding.dividendYield > 0) {
      const yieldForecasts = buildYieldBasedDividends(transactions, [holding]);
      upcomingDividends = yieldForecasts;
      console.log(`[v0] Generated ${upcomingDividends.length} yield-based forecasts for ${symbol}`);
    } else {
      console.log(`[v0] No dividend yield for ${symbol}`);
    }
  }

  // Cache the results
  setCachedDividends(symbol, upcomingDividends);

  return upcomingDividends;
}

// ============================================================================

// GET RECEIVED DIVIDENDS (Last 12 months)
// ============================================================================

export function getReceivedDividends(symbol: string): DividendForecast[] {
  const transactions = getTransactionsFromStorage();
  const oneYearAgo = new Date();
  oneYearAgo.setFullYear(oneYearAgo.getFullYear() - 1);

  return transactions
    .filter((t) => 
      t.symbol === symbol && 
      t.type === 'DIVIDEND' &&
      new Date(t.date) >= oneYearAgo
    )
    .map((t) => ({
      symbol,
      date: t.date,
      amount: Math.abs(t.total || 0) / (t.shares || 1), // Per share
      totalAmount: Math.abs(t.total || 0),
      shares: t.shares || 0,
      type: 'received' as const,
      source: 'historical' as const,
    }));
}

// ============================================================================

// GET COMPLETE DIVIDEND DATA (24 months: 12 past + 12 future)
// ============================================================================

export async function getCompleteDividendData(symbol: string): Promise<DividendForecast[]> {
  const received = getReceivedDividends(symbol);
  const upcoming = await getDividendForecast(symbol);

  return [...received, ...upcoming].sort(
    (a, b) => new Date(a.date).getTime() - new Date(b.date).getTime()
  );
}

// ============================================================================

// BATCH FETCH FOR MULTIPLE SYMBOLS
// ============================================================================

export async function getDividendForecastForPortfolio(symbols: string[]): Promise<Map<string, DividendForecast[]>> {
  const results = new Map<string, DividendForecast[]>();

  // Fetch in parallel with delay to avoid rate limits
  for (const symbol of symbols) {
    try {
      const data = await getCompleteDividendData(symbol);
      results.set(symbol, data);
      
      // Small delay between API calls to respect rate limits
      await new Promise(resolve => setTimeout(resolve, 200));
    } catch (error) {
      console.error(`Error fetching dividends for ${symbol}:`, error);
      results.set(symbol, []);
    }
  }

  return results;
}

// ============================================================================

// NEW: FETCH SYMBOL DIVIDEND EVENTS (for backfilling from manual transactions)
// ============================================================================

export async function fetchSymbolDividendEvents(symbol: string): Promise<DividendEvent[]> {
  try {
    // Call server endpoint instead of exposing API key to client
    const response = await fetch(`/api/dividends/upcoming?symbol=${symbol}&source=finnhub`)
    
    if (!response.ok) {
      console.warn(`Server API failed for historical dividend events: ${response.status}`)
      return []
    }

    const result = await response.json()
    const data = result.data || []
    
    if (!Array.isArray(data)) {
      return []
    }

    return data
      .filter((d: any) => d.date && d.amount)
      .map((d: any) => ({
        exDate: d.date,
        payDate: d.date,
        amount: d.amount,
      }))
      .sort((a, b) => new Date(a.exDate).getTime() - new Date(b.exDate).getTime())
  } catch (error) {
    console.error(`Error fetching historical dividend events for ${symbol}:`, error)
    return []
  }
}

// ============================================================================

// NEW: BUILD CALCULATED DIVIDENDS FROM TRANSACTIONS
// ============================================================================

export async function buildCalculatedDividendsFromTransactions(
  transactionsInput?: any[] // Accept optional transactions parameter
): Promise<DividendForecast[]> {
  // Use passed transactions or fall back to storage - MUST AWAIT async function
  let transactions = transactionsInput
  if (!transactions) {
    transactions = await getTransactionsFromStorage()
  }

  if (!Array.isArray(transactions) || transactions.length === 0) {
    return []
  }
  
  // Group by symbol
  const bySymbol: Record<string, typeof transactions> = {}
  for (const t of transactions) {
    if (!bySymbol[t.symbol]) bySymbol[t.symbol] = [];
    bySymbol[t.symbol].push(t);
  }

  const result: DividendForecast[] = [];

  for (const [symbol, txns] of Object.entries(bySymbol)) {
    // Only process if there are BUY/SELL transactions
    const trades = txns.filter((t) => t.type === 'BUY' || t.type === 'SELL');
    if (trades.length === 0) continue;

    trades.sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());

    // Build share timeline
    const shareTimeline: { date: string; shares: number }[] = [];
    let runningShares = 0;
    
    for (const t of trades) {
      const shares = Math.abs(t.shares || 0);
      if (t.type === 'BUY') {
        runningShares += shares;
      } else if (t.type === 'SELL') {
        runningShares -= shares;
      }
      shareTimeline.push({ date: t.date, shares: runningShares });
    }

    const firstBuyDate = trades[0].date;
    
    // Check if we already have dividend transactions for this symbol
    const existingDividends = txns.filter((t) => t.type === 'DIVIDEND');
    
    // If we have dividend transactions, don't need to calculate (already in CSV)
    if (existingDividends.length > 0) {
      console.log(`${symbol}: Using existing dividend transactions from CSV`);
      continue;
    }

    // Fetch dividend events for this symbol
    console.log(`${symbol}: No dividend transactions found, fetching historical events...`);
    const divEvents = await fetchSymbolDividendEvents(symbol);

    if (divEvents.length === 0) {
      console.log(`${symbol}: No dividend events found from API`);
      continue;
    }

    // Calculate dividends based on shares held at each ex-date
    for (const event of divEvents) {
      const exDate = event.exDate;
      const payDate = event.payDate || exDate;
      
      // Skip if before first purchase
      if (exDate < firstBuyDate) continue;

      // Find shares held at ex-date
      const exTime = new Date(exDate).getTime();
      let sharesAtDate = 0;
      
      for (const e of shareTimeline) {
        if (new Date(e.date).getTime() <= exTime) {
          sharesAtDate = e.shares;
        } else {
          break;
        }
      }

      if (sharesAtDate <= 0) continue;

      const amountPerShare = event.amount;
      const totalAmount = sharesAtDate * amountPerShare;

      // Determine if received or upcoming
      const today = new Date();
      const payDateTime = new Date(payDate);
      const type = payDateTime <= today ? 'received' : 'upcoming';

      result.push({
        symbol,
        date: payDate,
        amount: amountPerShare,
        shares: sharesAtDate,
        totalAmount,
        type,
        source: 'calculated', // Mark as CALCULATED from transaction analysis
      });
    }

    // Small delay between symbols to respect rate limits
    await new Promise(resolve => setTimeout(resolve, 300));
  }

  console.log(`Built ${result.length} calculated dividend entries from transactions`);
  return result;
}

// ============================================================================

// YIELD-BASED DIVIDEND ESTIMATOR (Option A)
// ============================================================================

export function buildYieldBasedDividends(
  transactions: Transaction[],
  holdings: Holding[]
): DividendForecast[] {
  const result: DividendForecast[] = [];

  // Filter holdings with positive shares and dividend yield
  const holdingsWithDividends = holdings.filter(h => {
    const shares = parseFloat(h.shares || 0)
    const yield_ = parseFloat(h.dividendYield || 0)
    return shares > 0 && yield_ > 0
  })

  if (holdingsWithDividends.length === 0) {
    console.log('[v0] No holdings with positive shares and dividend yield')
    return []
  }

  // Build map of all BUY transactions by symbol
  const buyTransactionsBySymbol: Record<string, any[]> = {}
  transactions
    .filter(t => t.type === 'BUY')
    .forEach(t => {
      if (!buyTransactionsBySymbol[t.symbol]) {
        buyTransactionsBySymbol[t.symbol] = []
      }
      buyTransactionsBySymbol[t.symbol].push(t)
    })

  const currentYear = new Date().getFullYear()
  const nextYear = currentYear + 1

  holdingsWithDividends.forEach(holding => {
    const shares = parseFloat(holding.shares)
    const currentPrice = parseFloat(holding.currentPrice || 0) // Use current share price
    const dividendYieldPercent = parseFloat(holding.dividendYield) // 5.11 format
    const dividendYield = dividendYieldPercent / 100 // Convert to decimal: 0.0511
    
    // Calculate annual dividend per share: current price × yield
    const divPerShare = currentPrice * dividendYield
    const annualDividend = divPerShare * shares

    console.log(`[v0] ${holding.symbol}: ${shares} shares @ $${currentPrice}/share, yield ${dividendYieldPercent}% = $${divPerShare.toFixed(4)}/share = $${annualDividend.toFixed(2)}/year`)

    // Get all BUY transactions for this stock
    const buyTransactions = buyTransactionsBySymbol[holding.symbol] || []
    
    // Process each BUY transaction separately
    buyTransactions.forEach(buyTx => {
      const purchaseDate = new Date(buyTx.date)
      const purchaseYear = purchaseDate.getFullYear()
      const txnShares = parseFloat(buyTx.shares)

      const txnDivPerShare = divPerShare
      const txnAnnualDividend = txnDivPerShare * txnShares

      // DIVIDEND RECEIVED: Current year (2026) with pro-rating if bought this year
      if (purchaseYear < currentYear) {
        // Bought before current year - full year dividend
        result.push({
          symbol: holding.symbol,
          date: `${currentYear}-01-01`,
          amount: txnDivPerShare,
          shares: txnShares,
          totalAmount: txnAnnualDividend,
          type: 'received' as const,
          source: 'calculated'
        })
      } else if (purchaseYear === currentYear) {
        // Bought this year - pro-rate from purchase date to year end
        const daysPurchased = Math.floor((Date.now() - purchaseDate.getTime()) / (1000 * 60 * 60 * 24))
        const daysInYear = 365
        const proRatedDividend = (txnAnnualDividend * daysPurchased) / daysInYear
        
        result.push({
          symbol: holding.symbol,
          date: buyTx.date,
          amount: txnDivPerShare,
          shares: txnShares,
          totalAmount: proRatedDividend,
          type: 'received' as const,
          source: 'calculated'
        })
      }

      // UPCOMING DIVIDENDS: Next year (2027) full year
      if (purchaseYear <= currentYear) {
        result.push({
          symbol: holding.symbol,
          date: `${nextYear}-01-01`,
          amount: txnDivPerShare,
          shares: txnShares,
          totalAmount: txnAnnualDividend,
          type: 'upcoming' as const,
          source: 'estimated'
        })
      }
    })
  })

  // Remove duplicates and sort
  const uniqueResults = Array.from(new Map(
    result.map(item => [`${item.symbol}-${item.date}-${item.type}`, item])
  ).values())
  
  uniqueResults.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())

  const totalDiv = uniqueResults.reduce((sum, d) => sum + d.totalAmount, 0)
  console.log(`💰 Total calculated dividends: $${totalDiv.toFixed(2)}`)

  return uniqueResults
}
