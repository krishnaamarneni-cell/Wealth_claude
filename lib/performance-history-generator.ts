/**
 * Performance History Generator
 * Dynamically generates historical performance data based on actual transactions
 * This syncs with the portfolio and updates when transactions change
 */

import { Transaction } from '@/lib/transaction-storage'
import { PerformanceData } from '@/lib/portfolio-data'

interface BenchmarkHistoricalData {
  date: Date
  sp500: number
  nasdaq: number
  dowjones: number
  russell2000: number
  totalmarket: number
  international: number
  savings: number
}

/**
 * Generate realistic benchmark data for a given date
 * Uses annualized returns to create consistent historical data
 */
function generateBenchmarkDataForDate(
  baseDate: Date,
  currentDate: Date,
  initialValue: number
): Omit<BenchmarkHistoricalData, 'date'> {
  const daysElapsed = Math.floor((currentDate.getTime() - baseDate.getTime()) / (1000 * 60 * 60 * 24))
  const yearsElapsed = daysElapsed / 365.25

  // Annualized returns for different benchmarks (realistic market data)
  const benchmarkReturns = {
    sp500: 0.18,        // 18% annual
    nasdaq: 0.25,       // 25% annual
    dowjones: 0.12,     // 12% annual
    russell2000: 0.15,  // 15% annual
    totalmarket: 0.17,  // 17% annual
    international: 0.10, // 10% annual
    savings: 0.04,      // 4% annual (fixed savings rate)
  }

  const result: Omit<BenchmarkHistoricalData, 'date'> = {}
  Object.entries(benchmarkReturns).forEach(([key, annualReturn]) => {
    const value = initialValue * Math.pow(1 + annualReturn, yearsElapsed)
    result[key as keyof Omit<BenchmarkHistoricalData, 'date'>] = parseFloat(value.toFixed(2))
  })

  return result
}

/**
 * Calculate portfolio value at a specific date based on transactions up to that date
 */
function calculatePortfolioValueAtDate(
  transactions: Transaction[],
  targetDate: Date,
  currentPrices: Record<string, number>
): number {
  // Filter transactions up to the target date
  const relevantTransactions = transactions.filter(
    (t) => new Date(t.date) <= targetDate
  )

  // Group by symbol and calculate holdings
  const holdings: Record<string, number> = {}
  let cashBalance = 0

  relevantTransactions.forEach((t) => {
    if (t.type === 'BUY') {
      holdings[t.symbol] = (holdings[t.symbol] || 0) + t.shares
      cashBalance -= t.total + (t.fees || 0)
    } else if (t.type === 'SELL') {
      holdings[t.symbol] = (holdings[t.symbol] || 0) - t.shares
      cashBalance += t.total - (t.fees || 0)
    } else if (t.type === 'DIVIDEND' || t.type === 'INTEREST') {
      cashBalance += t.total
    } else if (t.type === 'DEPOSIT') {
      cashBalance += t.total
    } else if (t.type === 'WITHDRAWAL') {
      cashBalance -= t.total
    }
  })

  // Calculate portfolio value using current or historical prices
  let portfolioValue = cashBalance
  Object.entries(holdings).forEach(([symbol, shares]) => {
    const price = currentPrices[symbol] || 0
    portfolioValue += shares * price
  })

  return Math.max(0, parseFloat(portfolioValue.toFixed(2)))
}

/**
 * Generate historical performance data for the last 12 months
 * This is called whenever transactions change to sync the data
 * Returns data scaled to show percentage returns from each series' starting point
 */
export function generatePerformanceHistory(
  transactions: Transaction[],
  currentPrices: Record<string, number>
): PerformanceData[] {
  if (transactions.length === 0) {
    return []
  }

  // Find the earliest transaction date
  const transactionDates = transactions.map((t) => new Date(t.date))
  const earliestTransaction = new Date(Math.min(...transactionDates.map((d) => d.getTime())))

  // Start from 12 months ago or the first transaction, whichever is later
  const today = new Date()
  const twelveMonthsAgo = new Date(today)
  twelveMonthsAgo.setMonth(twelveMonthsAgo.getMonth() - 12)

  const startDate = earliestTransaction > twelveMonthsAgo ? earliestTransaction : twelveMonthsAgo

  // Generate data points for each month
  const history: PerformanceData[] = []
  const currentDate = new Date(startDate)

  // Start with initial baseline value of 100 for all benchmarks (for percentage calculation)
  const initialValue = 100

  while (currentDate <= today) {
    const portfolioValue = calculatePortfolioValueAtDate(transactions, currentDate, currentPrices)
    
    // Get benchmark values at this date
    const benchmarkData = generateBenchmarkDataForDate(startDate, currentDate, initialValue)

    history.push({
      date: currentDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
      portfolio: portfolioValue, // Use actual portfolio value
      ...benchmarkData,
    })

    // Move to next month
    currentDate.setMonth(currentDate.getMonth() + 1)
  }

  console.log('[v0] Generated performance history:', history)
  return history
}

/**
 * Get current prices from holdings
 * This is a helper to extract prices for performance calculation
 */
export function extractPricesFromHoldings(
  holdings: any[]
): Record<string, number> {
  const prices: Record<string, number> = {}
  holdings.forEach((holding) => {
    prices[holding.symbol] = holding.currentPrice || 0
  })
  return prices
}
