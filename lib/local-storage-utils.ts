'use client'

import { useEffect, useState } from 'react'

export interface Transaction {
  id?: string
  ticker: string
  quantity: number
  price: number
  date: string
  type: 'buy' | 'sell' | 'dividend' | 'fee' | 'tax' | 'interest'
}

// ============================================
// LOCALSTORAGE UTILITIES
// ============================================

export const getTransactionsFromStorage = (): Transaction[] => {
  if (typeof window === 'undefined') return []
  
  try {
    const data = localStorage.getItem('transactions')
    return data ? JSON.parse(data) : []
  } catch (error) {
    console.error('Error reading transactions from localStorage:', error)
    return []
  }
}

export const hasTransactions = (): boolean => {
  return getTransactionsFromStorage().length > 0
}

// ============================================
// DASHBOARD PAGE CALCULATIONS
// ============================================

export interface Holding {
  ticker: string
  shares: number
  totalCost: number
  avgCost: number
  totalGain: number
  totalGainPercent: number
}

export const calculateHoldings = (transactions: Transaction[]): Holding[] => {
  const holdings: Record<string, Holding> = {}
  
  // Process only BUY and SELL transactions
  const trades = transactions.filter(t => ['buy', 'sell'].includes(t.type))
  
  trades.forEach(tx => {
    if (!holdings[tx.ticker]) {
      holdings[tx.ticker] = {
        ticker: tx.ticker,
        shares: 0,
        totalCost: 0,
        avgCost: 0,
        totalGain: 0,
        totalGainPercent: 0,
      }
    }
    
    const holding = holdings[tx.ticker]
    
    if (tx.type === 'buy') {
      const cost = tx.quantity * tx.price
      holding.totalCost += cost
      holding.shares += tx.quantity
    } else if (tx.type === 'sell') {
      const cost = (tx.quantity * tx.price)
      holding.totalCost -= cost
      holding.shares -= tx.quantity
    }
    
    // Calculate average cost
    if (holding.shares > 0) {
      holding.avgCost = holding.totalCost / holding.shares
    }
  })
  
  // Remove closed positions and calculate gains
  return Object.values(holdings)
    .filter(h => h.shares > 0)
    .map(h => ({
      ...h,
      totalGain: h.totalCost > 0 ? (h.shares * h.avgCost) - h.totalCost : 0,
      totalGainPercent: h.totalCost > 0 ? ((h.shares * h.avgCost) - h.totalCost) / h.totalCost * 100 : 0,
    }))
}

export const calculatePortfolioSummary = (transactions: Transaction[]) => {
  const holdings = calculateHoldings(transactions)
  
  const totalCost = holdings.reduce((sum, h) => sum + h.totalCost, 0)
  const totalGain = holdings.reduce((sum, h) => sum + h.totalGain, 0)
  const totalValue = totalCost + totalGain
  
  return {
    totalValue,
    totalCost,
    totalGain,
    totalGainPercent: totalCost > 0 ? (totalGain / totalCost) * 100 : 0,
    holdingCount: holdings.length,
  }
}

// ============================================
// DIVIDENDS PAGE CALCULATIONS
// ============================================

export interface DividendData {
  ticker: string
  date: string
  amount: number
  month: string // "YYYY-MM"
  quarter: string // "YYYY-Q1"
  year: string
}

export const calculateDividends = (transactions: Transaction[]): DividendData[] => {
  return transactions
    .filter(t => t.type === 'dividend')
    .map(tx => {
      const date = new Date(tx.date)
      return {
        ticker: tx.ticker,
        date: tx.date,
        amount: tx.quantity * tx.price, // For dividends, quantity*price = total dividend
        month: tx.date.substring(0, 7), // "YYYY-MM"
        quarter: `${tx.date.substring(0, 4)}-Q${Math.ceil(parseInt(tx.date.substring(5, 7)) / 3)}`,
        year: tx.date.substring(0, 4),
      }
    })
    .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
}

export const getDividendsByPeriod = (dividends: DividendData[], period: string, view: 'monthly' | 'quarterly' | 'yearly') => {
  return dividends.reduce((acc, div) => {
    const key = view === 'monthly' ? div.month : view === 'quarterly' ? div.quarter : div.year
    if (key === period) {
      acc += div.amount
    }
    return acc
  }, 0)
}

export const getTotalDividends = (dividends: DividendData[]): number => {
  return dividends.reduce((sum, d) => sum + d.amount, 0)
}

// ============================================
// TRADES PAGE CALCULATIONS
// ============================================

export interface TradeData {
  ticker: string
  date: string
  type: 'buy' | 'sell'
  quantity: number
  price: number
  total: number
  month: string
}

export const calculateTrades = (transactions: Transaction[]): TradeData[] => {
  return transactions
    .filter(t => ['buy', 'sell'].includes(t.type))
    .map(tx => ({
      ticker: tx.ticker,
      date: tx.date,
      type: tx.type as 'buy' | 'sell',
      quantity: tx.quantity,
      price: tx.price,
      total: tx.quantity * tx.price,
      month: tx.date.substring(0, 7),
    }))
    .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
}

export const getTradeStats = (trades: TradeData[]) => {
  const buyTrades = trades.filter(t => t.type === 'buy')
  const sellTrades = trades.filter(t => t.type === 'sell')
  
  return {
    totalTrades: trades.length,
    buyCount: buyTrades.length,
    sellCount: sellTrades.length,
    totalBuyVolume: buyTrades.reduce((sum, t) => sum + t.total, 0),
    totalSellVolume: sellTrades.reduce((sum, t) => sum + t.total, 0),
    avgBuyPrice: buyTrades.length > 0 
      ? buyTrades.reduce((sum, t) => sum + t.price, 0) / buyTrades.length 
      : 0,
    avgSellPrice: sellTrades.length > 0
      ? sellTrades.reduce((sum, t) => sum + t.price, 0) / sellTrades.length
      : 0,
  }
}

// ============================================
// PERFORMANCE PAGE CALCULATIONS
// ============================================

export const calculateReturns = (transactions: Transaction[]) => {
  const holdings = calculateHoldings(transactions)
  
  // Simple return calculation
  const totalCost = holdings.reduce((sum, h) => sum + h.totalCost, 0)
  const totalValue = holdings.reduce((sum, h) => sum + (h.shares * h.avgCost), 0)
  const totalGain = totalValue - totalCost
  
  return {
    totalCost,
    totalValue,
    totalGain,
    totalGainPercent: totalCost > 0 ? (totalGain / totalCost) * 100 : 0,
    // Common periods - calculate based on transaction dates
    oneMonth: calculateReturnForPeriod(transactions, 30),
    threeMonth: calculateReturnForPeriod(transactions, 90),
    oneYear: calculateReturnForPeriod(transactions, 365),
    allTime: { gain: totalGain, percent: totalCost > 0 ? (totalGain / totalCost) * 100 : 0 },
  }
}

const calculateReturnForPeriod = (transactions: Transaction[], days: number) => {
  const now = new Date()
  const cutoffDate = new Date(now.getTime() - days * 24 * 60 * 60 * 1000)
  
  // Filter transactions within the period
  const periodTx = transactions.filter(t => new Date(t.date) >= cutoffDate)
  
  if (periodTx.length === 0) {
    return { gain: 0, percent: 0 }
  }
  
  const holdings = calculateHoldings(periodTx)
  const totalCost = holdings.reduce((sum, h) => sum + h.totalCost, 0)
  const totalValue = holdings.reduce((sum, h) => sum + (h.shares * h.avgCost), 0)
  const totalGain = totalValue - totalCost
  
  return {
    gain: totalGain,
    percent: totalCost > 0 ? (totalGain / totalCost) * 100 : 0,
  }
}

// ============================================
// CUSTOM HOOK FOR CLIENT COMPONENTS
// ============================================

export const usePortfolioData = () => {
  const [transactions, setTransactions] = useState<Transaction[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [isEmpty, setIsEmpty] = useState(false)

  useEffect(() => {
    const tx = getTransactionsFromStorage()
    setTransactions(tx)
    setIsEmpty(tx.length === 0)
    setIsLoading(false)
  }, [])

  return { transactions, isLoading, isEmpty }
}
