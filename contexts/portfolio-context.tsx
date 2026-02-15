"use client"

import React, { createContext, useContext, useState, useEffect } from 'react'

interface Transaction {
  id: string
  date: string
  type: 'BUY' | 'SELL' | 'DIVIDEND' | 'DEPOSIT' | 'WITHDRAWAL'
  symbol: string
  shares: number
  price: number
  total: number
  broker: string
  fees: number
}

interface Holding {
  symbol: string
  name: string
  shares: number
  avgCost: number
  totalCost: number
  currentPrice: number
  marketValue: number
  gainLoss: number
  gainLossPercent: number
}

interface PortfolioContextType {
  transactions: Transaction[]
  holdings: Holding[]
  addTransaction: (transaction: Transaction) => void
  addTransactions: (transactions: Transaction[]) => void
  deleteTransaction: (id: string) => void
  calculateHoldings: () => void
  clearAllData: () => void
}

const PortfolioContext = createContext<PortfolioContextType | undefined>(undefined)

const STORAGE_KEY = 'portfolio_transactions'

export function PortfolioProvider({ children }: { children: React.ReactNode }) {
  const [transactions, setTransactions] = useState<Transaction[]>([])
  const [holdings, setHoldings] = useState<Holding[]>([])

  // Load transactions from localStorage on mount
  useEffect(() => {
    const stored = localStorage.getItem(STORAGE_KEY)
    if (stored) {
      try {
        const parsed = JSON.parse(stored)
        setTransactions(parsed)
      } catch (err) {
        console.error('Error loading transactions:', err)
      }
    }
  }, [])

  // Save transactions to localStorage whenever they change
 useEffect(() => {
  if (transactions.length > 0) {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(transactions))
    calculateHoldings()
    calculateIncome() // ← This should run!
  } else {
    // Reset income when no transactions
    setIncome({
      totalDividends: 0,
      dividendYield: 0,
      dividendsByMonth: {},
      dividendsBySymbol: {}
    })
  }
}, [transactions]) // ← Missing dependency!
  const addTransaction = (transaction: Transaction) => {
    setTransactions(prev => [transaction, ...prev])
  }

  const addTransactions = (newTransactions: Transaction[]) => {
    setTransactions(prev => [...newTransactions, ...prev])
  }

  const deleteTransaction = (id: string) => {
    setTransactions(prev => prev.filter(t => t.id !== id))
  }

  const clearAllData = () => {
    setTransactions([])
    setHoldings([])
    localStorage.removeItem(STORAGE_KEY)
  }

  // Calculate holdings from transactions
  const calculateHoldings = () => {
    // Group transactions by symbol
    const holdingsMap = new Map<string, {
      shares: number
      totalCost: number
      transactions: Transaction[]
    }>()

    // Process transactions in chronological order (oldest first)
    const sortedTransactions = [...transactions].sort((a, b) => 
      new Date(a.date).getTime() - new Date(b.date).getTime()
    )

    sortedTransactions.forEach(transaction => {
      if (transaction.type === 'BUY' || transaction.type === 'SELL') {
        const existing = holdingsMap.get(transaction.symbol) || {
          shares: 0,
          totalCost: 0,
          transactions: []
        }

        if (transaction.type === 'BUY') {
          existing.shares += transaction.shares
          existing.totalCost += transaction.total + transaction.fees
        } else if (transaction.type === 'SELL') {
          // Calculate average cost per share
          const avgCostPerShare = existing.shares > 0 ? existing.totalCost / existing.shares : 0
          
          // Reduce shares
          existing.shares -= transaction.shares
          
          // Reduce total cost proportionally
          existing.totalCost -= avgCostPerShare * transaction.shares
        }

        existing.transactions.push(transaction)
        holdingsMap.set(transaction.symbol, existing)
      }
    })

    // Convert to holdings array (filter out zero/negative positions)
    const calculatedHoldings: Holding[] = []
    
    holdingsMap.forEach((value, symbol) => {
      // Only include if we currently hold shares
      if (value.shares > 0.001) { // Use small threshold for floating point
        const avgCost = value.totalCost / value.shares
        
        calculatedHoldings.push({
          symbol,
          name: getStockName(symbol), // You'll need to implement this
          shares: value.shares,
          avgCost,
          totalCost: value.totalCost,
          currentPrice: 0, // Will be updated with real-time data
          marketValue: 0, // Will be updated with real-time data
          gainLoss: 0, // Will be calculated with real-time data
          gainLossPercent: 0 // Will be calculated with real-time data
        })
      }
    })

    setHoldings(calculatedHoldings)
  }

  // Helper function to get stock name (you can expand this)
  const getStockName = (symbol: string): string => {
    const names: Record<string, string> = {
      'AAPL': 'Apple Inc.',
      'MSFT': 'Microsoft Corporation',
      'GOOGL': 'Alphabet Inc.',
      'AMZN': 'Amazon.com Inc.',
      'NVDA': 'NVIDIA Corporation',
      'TSLA': 'Tesla Inc.',
      'META': 'Meta Platforms',
      'SPY': 'SPDR S&P 500 ETF',
      'QQQ': 'Invesco QQQ Trust',
      'JPM': 'JPMorgan Chase',
      'V': 'Visa Inc.',
      'NKE': 'Nike Inc.',
      'CRM': 'Salesforce',
      'UBER': 'Uber Technologies',
      'CELH': 'Celsius Holdings',
      'LULU': 'Lululemon',
      'UNH': 'UnitedHealth',
      'HCA': 'HCA Healthcare',
      'NLY': 'Annaly Capital',
      'COIN': 'Coinbase',
      'ARM': 'Arm Holdings',
      'CRWD': 'CrowdStrike',
      'GXO': 'GXO Logistics',
      'PLTD': 'Direxion PLTR Bear',
      'SPCE': 'Virgin Galactic',
      'BYND': 'Beyond Meat',
      'TSLZ': 'T-Rex 2X Inverse Tesla',
      'KULR': 'KULR Technology',
      'FUBO': 'fuboTV',
      'ELF': 'e.l.f. Beauty',
      'SOFI': 'SoFi Technologies',
      'TTD': 'The Trade Desk',
      'RIVN': 'Rivian Automotive',
      'WMT': 'Walmart'
    }
    return names[symbol] || symbol
  }

  return (
    <PortfolioContext.Provider
      value={{
        transactions,
        holdings,
        addTransaction,
        addTransactions,
        deleteTransaction,
        calculateHoldings,
        clearAllData
      }}
    >
      {children}
    </PortfolioContext.Provider>
  )
}

export function usePortfolio() {
  const context = useContext(PortfolioContext)
  if (context === undefined) {
    throw new Error('usePortfolio must be used within a PortfolioProvider')
  }
  return context
}
