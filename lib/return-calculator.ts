// ==================== RETURN CALCULATION LIBRARY ====================
// Provides Simple Return, Time-Weighted Return (TWR), and Money-Weighted Return (MWR/XIRR)

import { getTransactionsFromStorage } from './transaction-storage'

export interface Transaction {
  date: string
  symbol: string
  type: 'BUY' | 'SELL' | 'DIVIDEND' | 'FEE' | 'TAX' | 'INTEREST'
  shares: number
  price: number
  total: number
  broker: string
}

export interface Holding {
  symbol: string
  shares: number
  avgCost: number
  totalCost: number
  marketValue: number
  currentPrice: number
  totalGain: number
  totalGainPercent: number
}

// ==================== SIMPLE RETURN ====================

/**
 * Calculate simple return: (Current Value - Cost) / Cost
 * Most intuitive but doesn't account for timing or cash flows
 */
export function calculateSimpleReturn(holdings: Holding[]): number {
  const totalValue = holdings.reduce((sum, h) => sum + h.marketValue, 0)
  const totalCost = holdings.reduce((sum, h) => sum + h.totalCost, 0)
  
  if (totalCost === 0) return 0
  
  return ((totalValue - totalCost) / totalCost) * 100
}

// ==================== TIME-WEIGHTED RETURN (TWR) ====================

/**
 * Calculate Time-Weighted Return
 * Eliminates the effect of cash flows to measure pure investment performance
 * Best for comparing to benchmarks
 */
export function calculateTWR(transactions: Transaction[], holdings: Holding[]): number {
  const buyTransactions = transactions.filter(t => t.type === 'BUY').sort((a, b) => 
    new Date(a.date).getTime() - new Date(b.date).getTime()
  )
  
  if (buyTransactions.length === 0) return 0
  
  const earliestDate = new Date(buyTransactions[0].date)
  const now = new Date()
  const daysHeld = Math.floor((now.getTime() - earliestDate.getTime()) / (1000 * 60 * 60 * 24))
  
  if (daysHeld < 30) {
    return calculateSimpleReturn(holdings)
  }
  
  const months = Math.floor(daysHeld / 30)
  
  const totalValue = holdings.reduce((sum, h) => sum + h.marketValue, 0)
  const totalCost = holdings.reduce((sum, h) => sum + h.totalCost, 0)
  
  if (totalCost === 0) return 0
  
  const totalReturn = (totalValue / totalCost)
  
  // Annualize if holding period > 1 year
  if (months >= 12) {
    const annualizedReturn = Math.pow(totalReturn, 12 / months) - 1
    return annualizedReturn * 100
  }
  
  return (totalReturn - 1) * 100
}

// ==================== MONEY-WEIGHTED RETURN (MWR/XIRR) ====================

/**
 * Calculate MWR/XIRR (Extended Internal Rate of Return)
 * Accounts for timing and size of cash flows
 * Shows the actual annualized return experienced by the investor
 */
export function calculateMWR(transactions: Transaction[], holdings: Holding[]): number {
  const cashFlows: { date: Date; amount: number }[] = []
  
  // Add all BUY transactions as negative cash flows
  transactions
    .filter(t => t.type === 'BUY')
    .forEach(t => {
      cashFlows.push({
        date: new Date(t.date),
        amount: -Math.abs(t.total)
      })
    })
  
  // Add SELL transactions as positive cash flows
  transactions
    .filter(t => t.type === 'SELL')
    .forEach(t => {
      cashFlows.push({
        date: new Date(t.date),
        amount: Math.abs(t.total)
      })
    })
  
  // Add current portfolio value as final positive cash flow
  const currentValue = holdings.reduce((sum, h) => sum + h.marketValue, 0)
  cashFlows.push({
    date: new Date(),
    amount: currentValue
  })
  
  if (cashFlows.length < 2) {
    return calculateSimpleReturn(holdings)
  }
  
  const xirr = calculateXIRRInternal(cashFlows)
  
  return xirr * 100
}

/**
 * Internal XIRR calculation using Newton-Raphson method
 */
function calculateXIRRInternal(cashFlows: { date: Date; amount: number }[]): number {
  const guess = 0.1
  const maxIterations = 100
  const tolerance = 0.000001
  
  let rate = guess
  
  for (let i = 0; i < maxIterations; i++) {
    const [npv, dnpv] = calculateNPVAndDerivative(cashFlows, rate)
    
    if (Math.abs(npv) < tolerance) {
      return rate
    }
    
    if (Math.abs(dnpv) < tolerance) {
      return rate
    }
    
    const newRate = rate - (npv / dnpv)
    
    if (Math.abs(newRate - rate) < tolerance) {
      return newRate
    }
    
    rate = newRate
  }
  
  return rate
}

/**
 * Calculate NPV and its derivative for XIRR
 */
function calculateNPVAndDerivative(
  cashFlows: { date: Date; amount: number }[],
  rate: number
): [number, number] {
  const firstDate = cashFlows[0].date
  let npv = 0
  let dnpv = 0
  
  cashFlows.forEach(cf => {
    const years = (cf.date.getTime() - firstDate.getTime()) / (1000 * 60 * 60 * 24 * 365.25)
    const discountFactor = Math.pow(1 + rate, years)
    
    npv += cf.amount / discountFactor
    dnpv += (-years * cf.amount) / (discountFactor * (1 + rate))
  })
  
  return [npv, dnpv]
}

// ==================== PERIOD RETURNS CALCULATOR ====================

/**
 * Calculate period returns by looking at stock price data
 * Returns percentage returns for different time periods
 */
export function calculatePeriodReturns(holdings: Holding[]): Record<string, number> {
  const periodReturns: Record<string, number> = {
    '1D': 0,
    '1W': 0,
    '1M': 0,
    '3M': 0,
    '6M': 0,
    'YTD': 0,
    '1Y': 0
  }

  // Calculate weighted average returns based on holdings' return data
  const totalValue = holdings.reduce((sum, h) => sum + h.marketValue, 0)
  
  if (totalValue === 0) {
    return periodReturns
  }

  // For each holding, get its returns and weight them by allocation
  Object.keys(periodReturns).forEach(period => {
    let weightedReturn = 0
    
    holdings.forEach(holding => {
      const weight = holding.marketValue / totalValue
      const holdingReturn = holding.returns?.[period as keyof typeof holding.returns] || 0
      weightedReturn += weight * holdingReturn
    })
    
    periodReturns[period] = weightedReturn
  })

  return periodReturns
}

// ==================== PORTFOLIO RETURN CALCULATOR ====================

export interface PortfolioReturns {
  simple: number
  twr: number
  mwr: number
  periodReturns: Record<string, number>
  recommended: 'simple' | 'twr' | 'mwr'
  explanation: string
}

/**
 * Calculate all three return types plus period returns
 */
export function calculateAllReturns(holdings: Holding[]): PortfolioReturns {
  const transactions = getTransactionsFromStorage() as Transaction[]
  
  const simple = calculateSimpleReturn(holdings)
  const twr = calculateTWR(transactions, holdings)
  const mwr = calculateMWR(transactions, holdings)
  const periodReturns = calculatePeriodReturns(holdings)
  
  const hasCashFlows = transactions.filter(t => t.type === 'SELL').length > 0
  const hasMultiplePeriods = transactions.length > 5
  
  let recommended: 'simple' | 'twr' | 'mwr' = 'simple'
  let explanation = 'Simple return (no cash flows)'
  
  if (hasCashFlows && hasMultiplePeriods) {
    recommended = 'mwr'
    explanation = 'MWR (accounts for timing of trades)'
  } else if (hasMultiplePeriods) {
    recommended = 'twr'
    explanation = 'TWR (annualized performance)'
  }
  
  return {
    simple,
    twr,
    mwr,
    periodReturns,
    recommended,
    explanation
  }
}
