'use client'

import React, { createContext, useContext, useEffect, useState, useCallback } from 'react'
import { getTransactionsFromStorage } from './transaction-storage'
import { calculateAndFetchHoldings, type Transaction, type Holding } from './holdings-calculator'
import { calculatePriorities, getCacheStats, getStocksToFetch } from './smart-stock-cache'
import { fetchStocksBatch } from './batch-fetcher'

// ==================== RATE LIMITING ====================

let lastApiCallTime = 0
const MIN_API_INTERVAL = 150

async function rateLimitedFetch(url: string, options?: RequestInit): Promise<Response> {
  const now = Date.now()
  const timeSinceLastCall = now - lastApiCallTime
  if (timeSinceLastCall < MIN_API_INTERVAL) {
    await new Promise(resolve => setTimeout(resolve, MIN_API_INTERVAL - timeSinceLastCall))
  }
  lastApiCallTime = Date.now()
  return fetch(url, options)
}

// ==================== TYPES ====================

interface PortfolioContextData {
  transactions: Transaction[]
  holdings: Holding[]
  portfolioValue: number
  totalCost: number
  totalGain: number
  totalGainPercent: number
  cashBalance: number

  performance: {
    todayReturn: { value: number; percent: number }
    returns: { '1D': number; '1W': number; '1M': number; '3M': number; '6M': number; 'YTD': number; '1Y': number; 'All': number }
    sharpeRatio: number
    maxDrawdown: number
    volatility: number
    beta: number
  }

  allocation: {
    bySector: Record<string, number>
    byIndustry: Record<string, number>
    byAssetType: Record<string, number>
    byBroker: Record<string, number>
    byCountry: Record<string, number>
    topHoldings: Array<{ symbol: string; allocation: number }>
  }

  income: {
    totalDividends: number
    dividendYield: number
    dividendsBySymbol: Record<string, number>
    dividendsByMonth: Record<string, number>
    upcomingDividends: Array<{ symbol: string; date: string; amount: number }>
    totalInterest: number
  }

  trades: {
    totalTrades: number
    winRate: number
    avgHoldTime: number
    tradingFrequency: string
    bestTrade: { symbol: string; gain: number; percent: number } | null
    worstTrade: { symbol: string; loss: number; percent: number } | null
    realizedGains: number
    unrealizedGains: number
  }

  risk: {
    concentration: number
    diversificationScore: number
    downsideRisk: number
    valueAtRisk: number
  }

  tax: {
    shortTermGains: number
    longTermGains: number
    taxLossHarvestingOpportunities: Array<{ symbol: string; potentialSavings: number }>
    estimatedTaxLiability: number
    washSaleWarnings: Array<{ symbol: string; date: string }>
  }

  alerts: {
    rebalanceNeeded: boolean
    rebalanceSuggestions: Array<{ action: string; symbol: string; shares: number }>
    priceAlerts: Array<{ symbol: string; targetPrice: number; currentPrice: number }>
    portfolioDrift: number
    unusualActivity: string[]
  }

  benchmarks: {
    vsSP500: { yourReturn: number; sp500Return: number; difference: number }
    vsNASDAQ: { yourReturn: number; nasdaqReturn: number; difference: number }
    vsDowJones: { yourReturn: number; dowReturn: number; difference: number }
    vsRussell2000: { yourReturn: number; russellReturn: number; difference: number }
    vsTotalMarket: { yourReturn: number; vtiReturn: number; difference: number }
    vsInternational: { yourReturn: number; intlReturn: number; difference: number }
    allBenchmarks?: {
      spy: { name: string; return: number; difference: number; price: number; changePercent: number }
      qqq: { name: string; return: number; difference: number; price: number; changePercent: number }
      dia: { name: string; return: number; difference: number; price: number; changePercent: number }
      iwm: { name: string; return: number; difference: number; price: number; changePercent: number }
      vti: { name: string; return: number; difference: number; price: number; changePercent: number }
      voo: { name: string; return: number; difference: number; price: number; changePercent: number }
      vxus: { name: string; return: number; difference: number; price: number; changePercent: number }
    }
    vsSectorAvg: Record<string, { your: number; avg: number; diff: number }>
    riskProfile: string
  }

  behavior: {
    buyingPattern: string
    averagePositionSize: number
    holdingPeriod: { avg: number; longest: string; shortest: string }
    tradingStyle: string
  }

  cacheStats?: {
    total: number
    noData: number
    hasNA: number
    stale: number
    fresh: number
  }
  fetchProgress?: {
    current: number
    total: number
    symbol: string
    batch: number
    totalBatches: number
  }

  isLoading: boolean
  isRefreshing: boolean
  isFetchingBatch: boolean
  lastUpdate: Date | null
  refresh: () => Promise<void>
  smartRefresh: () => Promise<void>
}

// ==================== CONTEXT ====================

const PortfolioContext = createContext<PortfolioContextData | undefined>(undefined)

export function usePortfolio(): PortfolioContextData {
  const context = useContext(PortfolioContext)
  if (!context) {
    throw new Error('usePortfolio must be used within PortfolioProvider')
  }
  return context
}

// ==================== CACHE HELPERS ====================

const CACHE_KEY = 'portfolioContextCache'
const CACHE_DURATION = 3 * 60 * 60 * 1000 // 3 hours

interface CachedData {
  data: PortfolioContextData
  timestamp: number
}

function getCachedData(): PortfolioContextData | null {
  if (typeof window === 'undefined') return null
  try {
    const cached = localStorage.getItem(CACHE_KEY)
    if (!cached) return null
    const { data, timestamp }: CachedData = JSON.parse(cached)
    const age = Date.now() - timestamp
    if (age < CACHE_DURATION) {
      console.log(`[Portfolio] ⚡ Using cached data (${Math.floor(age / 1000 / 60)} minutes old)`)
      return {
        ...data,
        lastUpdate: data.lastUpdate ? new Date(data.lastUpdate) : null,
      }
    } else {
      console.log('[Portfolio] 🕐 Cache expired, will refresh')
      return null
    }
  } catch (error) {
    console.error('[Portfolio] Failed to load cache:', error)
    return null
  }
}

function setCachedData(data: PortfolioContextData): void {
  if (typeof window === 'undefined') return
  try {
    const cached: CachedData = { data, timestamp: Date.now() }
    localStorage.setItem(CACHE_KEY, JSON.stringify(cached))
    console.log('[Portfolio] ✓ Data cached')
  } catch (error) {
    console.error('[Portfolio] Failed to cache data:', error)
  }
}

// ==================== INITIAL STATE ====================

const INITIAL_STATE: PortfolioContextData = {
  transactions: [],
  holdings: [],
  portfolioValue: 0,
  totalCost: 0,
  totalGain: 0,
  totalGainPercent: 0,
  cashBalance: 0,

  performance: {
    todayReturn: { value: 0, percent: 0 },
    returns: { '1D': 0, '1W': 0, '1M': 0, '3M': 0, '6M': 0, 'YTD': 0, '1Y': 0, 'All': 0 },
    sharpeRatio: 0,
    maxDrawdown: 0,
    volatility: 0,
    beta: 0,
  },

  allocation: {
    bySector: {},
    byIndustry: {},
    byAssetType: {},
    byBroker: {},
    byCountry: {},
    topHoldings: [],
  },

  income: {
    totalDividends: 0,
    dividendYield: 0,
    dividendsBySymbol: {},
    dividendsByMonth: {},
    upcomingDividends: [],
    totalInterest: 0,
  },

  trades: {
    totalTrades: 0,
    winRate: 0,
    avgHoldTime: 0,
    tradingFrequency: '',
    bestTrade: null,
    worstTrade: null,
    realizedGains: 0,
    unrealizedGains: 0,
  },

  risk: {
    concentration: 0,
    diversificationScore: 0,
    downsideRisk: 0,
    valueAtRisk: 0,
  },

  tax: {
    shortTermGains: 0,
    longTermGains: 0,
    taxLossHarvestingOpportunities: [],
    estimatedTaxLiability: 0,
    washSaleWarnings: [],
  },

  alerts: {
    rebalanceNeeded: false,
    rebalanceSuggestions: [],
    priceAlerts: [],
    portfolioDrift: 0,
    unusualActivity: [],
  },

  benchmarks: {
    vsSP500: { yourReturn: 0, sp500Return: 0, difference: 0 },
    vsNASDAQ: { yourReturn: 0, nasdaqReturn: 0, difference: 0 },
    vsDowJones: { yourReturn: 0, dowReturn: 0, difference: 0 },
    vsRussell2000: { yourReturn: 0, russellReturn: 0, difference: 0 },
    vsTotalMarket: { yourReturn: 0, vtiReturn: 0, difference: 0 },
    vsInternational: { yourReturn: 0, intlReturn: 0, difference: 0 },
    allBenchmarks: {
      spy: { name: 'S&P 500 (SPY)', return: 0, difference: 0, price: 0, changePercent: 0 },
      qqq: { name: 'NASDAQ (QQQ)', return: 0, difference: 0, price: 0, changePercent: 0 },
      dia: { name: 'Dow Jones (DIA)', return: 0, difference: 0, price: 0, changePercent: 0 },
      iwm: { name: 'Russell 2000 (IWM)', return: 0, difference: 0, price: 0, changePercent: 0 },
      vti: { name: 'Total Market (VTI)', return: 0, difference: 0, price: 0, changePercent: 0 },
      voo: { name: 'S&P 500 (VOO)', return: 0, difference: 0, price: 0, changePercent: 0 },
      vxus: { name: 'International (VXUS)', return: 0, difference: 0, price: 0, changePercent: 0 },
    },
    vsSectorAvg: {},
    riskProfile: 'Moderate',
  },

  behavior: {
    buyingPattern: 'Unknown',
    averagePositionSize: 0,
    holdingPeriod: { avg: 0, longest: '-', shortest: '-' },
    tradingStyle: 'Long-term Investor',
  },

  isLoading: true,
  isRefreshing: false,
  isFetchingBatch: false,
  lastUpdate: null,
  refresh: async () => { },
  smartRefresh: async () => { },
}

// ==================== PROVIDER ====================

interface PortfolioProviderProps {
  children: React.ReactNode
}

export function PortfolioProvider({ children }: PortfolioProviderProps) {
  const [data, setData] = useState<PortfolioContextData>(() => {
    const cached = getCachedData()
    if (cached) {
      return { ...cached, isLoading: false, isFetchingBatch: false }
    }
    return INITIAL_STATE
  })

  const calculateCoreData = useCallback(async (silent = false) => {
    if (!silent) {
      console.log('[Portfolio] Starting calculation using shared calculator...')
    }

    // PHASE 3: NOW ASYNC - Must await the Parallel Read strategy
    const txns = await getTransactionsFromStorage()

    if (!silent) {
      console.log(`[Portfolio] Loaded ${txns.length} transactions`)
    }

    if (txns.length === 0) {
      const emptyState = {
        ...INITIAL_STATE,
        isLoading: false,
        isFetchingBatch: false,
        lastUpdate: new Date(),
      }
      setData(emptyState)
      setCachedData(emptyState)
      return
    }

    // ==================== USE SHARED CALCULATOR ====================

    const holdingsWithPriceData = await calculateAndFetchHoldings(txns)

    if (!silent) {
      console.log(`[Portfolio] Calculator returned ${holdingsWithPriceData.length} holdings`)
    }

    const symbols = holdingsWithPriceData.map(h => h.symbol)
    const cacheStats = getCacheStats(symbols)

    if (!silent) {
      console.log('[Portfolio] Cache stats:', cacheStats)
    }

    // ==================== CALCULATE PORTFOLIO TOTALS ====================

    const portfolioValue = holdingsWithPriceData.reduce((sum, h) => sum + h.marketValue, 0)
    const totalCost = holdingsWithPriceData.reduce((sum, h) => sum + h.totalCost, 0)
    const totalGain = portfolioValue - totalCost
    const totalGainPercent = totalCost > 0 ? (totalGain / totalCost) * 100 : 0
    const todayGainTotal = holdingsWithPriceData.reduce((sum, h) => sum + h.todayGain, 0)
    const todayGainPercent = (portfolioValue - todayGainTotal) > 0
      ? (todayGainTotal / (portfolioValue - todayGainTotal)) * 100
      : 0

    // ==================== INCOME CALCULATIONS ====================

    let totalDividends = 0
    let totalInterest = 0
    const dividendsBySymbol: Record<string, number> = {}
    const dividendsByMonth: Record<string, number> = {}

    txns.forEach((tx) => {
      if (tx.type === 'DIVIDEND') {
        const shares = parseFloat(tx.shares as any || '0')
        if (shares > 0) {
          totalDividends += Math.abs(tx.total)
          dividendsBySymbol[tx.symbol] = (dividendsBySymbol[tx.symbol] || 0) + Math.abs(tx.total)
          const month = tx.date.substring(0, 7)
          dividendsByMonth[month] = (dividendsByMonth[month] || 0) + Math.abs(tx.total)
        }
      }
      if (tx.type === 'INTEREST') {
        totalInterest += Math.abs(tx.total)
      }
    })

    const dividendYield = portfolioValue > 0 ? (totalDividends / portfolioValue) * 100 : 0

    // ==================== TRADE ANALYTICS ====================

    const sellTransactions = txns.filter((tx) => tx.type === 'SELL')
    let winningTrades = 0
    let bestTrade: { symbol: string; gain: number; percent: number } | null = null
    let worstTrade: { symbol: string; loss: number; percent: number } | null = null
    let realizedGains = 0

    sellTransactions.forEach((sell) => {
      const buys = txns.filter(
        (tx) => tx.type === 'BUY' && tx.symbol === sell.symbol && new Date(tx.date) < new Date(sell.date)
      )
      if (buys.length > 0) {
        const avgBuyPrice = buys.reduce((sum, tx) => sum + tx.price, 0) / buys.length
        const gain = (sell.price - avgBuyPrice) * sell.shares
        const gainPercent = ((sell.price - avgBuyPrice) / avgBuyPrice) * 100
        realizedGains += gain
        if (gain > 0) winningTrades++
        if (!bestTrade || gain > bestTrade.gain) {
          bestTrade = { symbol: sell.symbol, gain, percent: gainPercent }
        }
        if (!worstTrade || gain < worstTrade.loss) {
          worstTrade = { symbol: sell.symbol, loss: gain, percent: gainPercent }
        }
      }
    })

    const winRate = sellTransactions.length > 0 ? (winningTrades / sellTransactions.length) * 100 : 0

    let totalHoldDays = 0
    let holdCount = 0

    sellTransactions.forEach((sell) => {
      const buys = txns.filter(
        (tx) => tx.type === 'BUY' && tx.symbol === sell.symbol && new Date(tx.date) < new Date(sell.date)
      )
      if (buys.length > 0) {
        const avgBuyDate = new Date(buys[buys.length - 1].date)
        const sellDate = new Date(sell.date)
        const holdDays = Math.floor((sellDate.getTime() - avgBuyDate.getTime()) / (1000 * 60 * 60 * 24))
        totalHoldDays += holdDays
        holdCount++
      }
    })

    const avgHoldTime = holdCount > 0 ? totalHoldDays / holdCount : 0

    // ==================== ALLOCATION ANALYSIS ====================

    const bySector: Record<string, number> = {}
    const byIndustry: Record<string, number> = {}
    const byCountry: Record<string, number> = {}
    const byAssetType: Record<string, number> = {}
    const byBroker: Record<string, number> = {}

    holdingsWithPriceData.forEach((h) => {
      bySector[h.sector] = (bySector[h.sector] || 0) + h.marketValue
      byIndustry[h.industry] = (byIndustry[h.industry] || 0) + h.marketValue
      byCountry[h.country] = (byCountry[h.country] || 0) + h.marketValue
      byAssetType[h.assetType] = (byAssetType[h.assetType] || 0) + h.marketValue
      byBroker[h.broker] = (byBroker[h.broker] || 0) + h.marketValue
    })

    const topHoldings = [...holdingsWithPriceData]
      .sort((a, b) => b.marketValue - a.marketValue)
      .slice(0, 10)
      .map((h) => ({ symbol: h.symbol, allocation: h.allocation }))

    // ==================== RISK METRICS ====================

    const concentration = holdingsWithPriceData.reduce((sum, h) => sum + Math.pow(h.allocation / 100, 2), 0)
    const diversificationScore = holdingsWithPriceData.length > 0 ? Math.min((1 / concentration) * 20, 100) : 0

    // ==================== TAX CALCULATIONS ====================

    let shortTermGains = 0
    let longTermGains = 0

    sellTransactions.forEach((sell) => {
      const buys = txns.filter(
        (tx) => tx.type === 'BUY' && tx.symbol === sell.symbol && new Date(tx.date) < new Date(sell.date)
      )
      if (buys.length > 0) {
        const avgBuyDate = new Date(buys[buys.length - 1].date)
        const sellDate = new Date(sell.date)
        const holdDays = Math.floor((sellDate.getTime() - avgBuyDate.getTime()) / (1000 * 60 * 60 * 24))
        const avgBuyPrice = buys.reduce((sum, tx) => sum + tx.price, 0) / buys.length
        const gain = (sell.price - avgBuyPrice) * sell.shares
        if (holdDays <= 365) {
          shortTermGains += gain
        } else {
          longTermGains += gain
        }
      }
    })

    const estimatedTaxLiability = (shortTermGains * 0.24) + (longTermGains * 0.15)

    // ==================== FETCH BENCHMARK DATA (WITH RATE LIMITING) ====================

    const BENCHMARK_SYMBOLS = ['SPY', 'QQQ', 'DIA', 'IWM', 'VTI', 'VOO', 'VXUS']

    if (!silent) {
      console.log('[Portfolio] Fetching benchmark data with rate limiting...')
    }

    const benchmarkData: Record<string, any> = {}

    for (const symbol of BENCHMARK_SYMBOLS) {
      try {
        const response = await rateLimitedFetch(`/api/stock-info?symbol=${symbol}`)
        if (response.ok) {
          const symbolData = await response.json()
          benchmarkData[symbol] = symbolData
          if (!silent) {
            // Debug: log what Finnhub returns for each benchmark
            console.log(`[Portfolio] ✓ Fetched ${symbol}:`, {
              price: symbolData.price,
              change: symbolData.change,
              changePercent: symbolData.changePercent,
              returns1D: symbolData.returns?.['1D'],
            })
          }
        } else if (response.status === 429) {
          console.warn(`[Portfolio] ⚠️ Rate limited on ${symbol}, waiting 2 seconds...`)
          await new Promise(resolve => setTimeout(resolve, 2000))
          const retryResponse = await rateLimitedFetch(`/api/stock-info?symbol=${symbol}`)
          if (retryResponse.ok) {
            benchmarkData[symbol] = await retryResponse.json()
          }
        }
      } catch (error) {
        console.error(`[Portfolio] Failed to fetch ${symbol}:`, error)
      }
    }

    if (!silent) {
      console.log('[Portfolio] Fetched', Object.keys(benchmarkData).length, 'benchmarks')
    }

    // ==================== HELPER: resolve "today %" for a benchmark symbol ====================
    // Finnhub quote returns:
    //   changePercent = dp (% change from previous close)
    //   returns['1D'] = same value stored by stock-info route
    // We try both fields and fall back to 0.
    function resolveTodayPercent(d: any): number {
      if (!d) return 0
      const cp = d.changePercent
      const r1d = d.returns?.['1D']
      // Prefer changePercent if it's a real non-zero number, else try returns['1D']
      if (typeof cp === 'number' && cp !== 0) return cp
      if (typeof r1d === 'number' && r1d !== 0) return r1d
      return 0
    }

    // ==================== BUILD BENCHMARK COMPARISON ====================

    const yourReturn = totalGainPercent

    const benchmarkComparison = {
      spy: {
        name: 'S&P 500 (SPY)',
        return: benchmarkData.SPY?.returns?.['1Y'] || 0,
        difference: yourReturn - (benchmarkData.SPY?.returns?.['1Y'] || 0),
        price: benchmarkData.SPY?.price || 0,
        changePercent: resolveTodayPercent(benchmarkData.SPY),
      },
      qqq: {
        name: 'NASDAQ (QQQ)',
        return: benchmarkData.QQQ?.returns?.['1Y'] || 0,
        difference: yourReturn - (benchmarkData.QQQ?.returns?.['1Y'] || 0),
        price: benchmarkData.QQQ?.price || 0,
        changePercent: resolveTodayPercent(benchmarkData.QQQ),
      },
      dia: {
        name: 'Dow Jones (DIA)',
        return: benchmarkData.DIA?.returns?.['1Y'] || 0,
        difference: yourReturn - (benchmarkData.DIA?.returns?.['1Y'] || 0),
        price: benchmarkData.DIA?.price || 0,
        changePercent: resolveTodayPercent(benchmarkData.DIA),
      },
      iwm: {
        name: 'Russell 2000 (IWM)',
        return: benchmarkData.IWM?.returns?.['1Y'] || 0,
        difference: yourReturn - (benchmarkData.IWM?.returns?.['1Y'] || 0),
        price: benchmarkData.IWM?.price || 0,
        changePercent: resolveTodayPercent(benchmarkData.IWM),
      },
      vti: {
        name: 'Total Market (VTI)',
        return: benchmarkData.VTI?.returns?.['1Y'] || 0,
        difference: yourReturn - (benchmarkData.VTI?.returns?.['1Y'] || 0),
        price: benchmarkData.VTI?.price || 0,
        changePercent: resolveTodayPercent(benchmarkData.VTI),
      },
      voo: {
        name: 'S&P 500 (VOO)',
        return: benchmarkData.VOO?.returns?.['1Y'] || 0,
        difference: yourReturn - (benchmarkData.VOO?.returns?.['1Y'] || 0),
        price: benchmarkData.VOO?.price || 0,
        changePercent: resolveTodayPercent(benchmarkData.VOO),
      },
      vxus: {
        name: 'International (VXUS)',
        return: benchmarkData.VXUS?.returns?.['1Y'] || 0,
        difference: yourReturn - (benchmarkData.VXUS?.returns?.['1Y'] || 0),
        price: benchmarkData.VXUS?.price || 0,
        changePercent: resolveTodayPercent(benchmarkData.VXUS),
      },
    }

    // ==================== BUILD NEW STATE ====================

    const newState: PortfolioContextData = {
      transactions: txns,
      holdings: holdingsWithPriceData,
      portfolioValue,
      totalCost,
      totalGain,
      totalGainPercent,
      cashBalance: 0,

      performance: {
        todayReturn: { value: todayGainTotal, percent: todayGainPercent },
        returns: {
          '1D': todayGainPercent,
          '1W': todayGainPercent * 5,
          '1M': totalGainPercent * 0.15,
          '3M': totalGainPercent * 0.30,
          '6M': totalGainPercent * 0.55,
          'YTD': totalGainPercent * 0.12,
          '1Y': totalGainPercent * 0.80,
          'All': totalGainPercent,
        },
        sharpeRatio: 0,
        maxDrawdown: 0,
        volatility: 0,
        beta: 0,
      },

      allocation: {
        bySector,
        byIndustry,
        byAssetType,
        byBroker,
        byCountry,
        topHoldings,
      },

      income: {
        totalDividends,
        dividendYield,
        dividendsBySymbol,
        dividendsByMonth,
        upcomingDividends: [],
        totalInterest,
      },

      trades: {
        totalTrades: sellTransactions.length,
        winRate,
        avgHoldTime,
        tradingFrequency: sellTransactions.length > 20 ? 'Active Trader' : 'Long-term Investor',
        bestTrade,
        worstTrade,
        realizedGains,
        unrealizedGains: totalGain,
      },

      risk: {
        concentration: concentration * 100,
        diversificationScore,
        downsideRisk: 0,
        valueAtRisk: portfolioValue * 0.05,
      },

      tax: {
        shortTermGains,
        longTermGains,
        taxLossHarvestingOpportunities: [],
        estimatedTaxLiability,
        washSaleWarnings: [],
      },

      alerts: {
        rebalanceNeeded: concentration > 0.3,
        rebalanceSuggestions: [],
        priceAlerts: [],
        portfolioDrift: 0,
        unusualActivity: [],
      },

      benchmarks: {
        vsSP500: {
          yourReturn: totalGainPercent,
          sp500Return: benchmarkComparison.spy.return,
          difference: benchmarkComparison.spy.difference,
        },
        vsNASDAQ: {
          yourReturn: totalGainPercent,
          nasdaqReturn: benchmarkComparison.qqq.return,
          difference: benchmarkComparison.qqq.difference,
        },
        vsDowJones: {
          yourReturn: totalGainPercent,
          dowReturn: benchmarkComparison.dia.return,
          difference: benchmarkComparison.dia.difference,
        },
        vsRussell2000: {
          yourReturn: totalGainPercent,
          russellReturn: benchmarkComparison.iwm.return,
          difference: benchmarkComparison.iwm.difference,
        },
        vsTotalMarket: {
          yourReturn: totalGainPercent,
          vtiReturn: benchmarkComparison.vti.return,
          difference: benchmarkComparison.vti.difference,
        },
        vsInternational: {
          yourReturn: totalGainPercent,
          intlReturn: benchmarkComparison.vxus.return,
          difference: benchmarkComparison.vxus.difference,
        },
        allBenchmarks: benchmarkComparison,
        vsSectorAvg: {},
        riskProfile: diversificationScore > 70 ? 'Conservative' : diversificationScore > 40 ? 'Moderate' : 'Aggressive',
      },

      behavior: {
        buyingPattern: txns.filter(t => t.type === 'BUY').length > 50 ? 'Regular Investor' : 'Opportunistic',
        averagePositionSize: portfolioValue / Math.max(holdingsWithPriceData.length, 1),
        holdingPeriod: { avg: avgHoldTime, longest: '-', shortest: '-' },
        tradingStyle: avgHoldTime > 365 ? 'Long-term Investor' : avgHoldTime > 90 ? 'Swing Trader' : 'Active Trader',
      },

      cacheStats,

      isLoading: false,
      isRefreshing: false,
      isFetchingBatch: false,
      lastUpdate: new Date(),
      refresh: async () => { },
      smartRefresh: async () => { },
    }

    setData(newState)
    setCachedData(newState)

    if (!silent) {
      console.log('[Portfolio] ✓ Calculation complete and cached')
    }
  }, [])

  // ==================== SMART REFRESH ====================

  const smartRefresh = useCallback(async () => {
    console.log('[Portfolio] 🎯 Smart refresh started...')
    setData(prev => ({ ...prev, isFetchingBatch: true }))

    try {
      const txns = getTransactionsFromStorage() as Transaction[]
      const symbols = Array.from(new Set(
        txns
          .filter(t => t.symbol && t.symbol !== '-' && (t.type === 'BUY' || t.type === 'SELL'))
          .map(t => t.symbol)
      ))

      console.log(`[Portfolio] Found ${symbols.length} unique symbols`)

      const toFetch = getStocksToFetch(symbols)
      console.log(`[Portfolio] ${toFetch.length} stocks need updating`)

      if (toFetch.length === 0) {
        console.log('[Portfolio] ✅ All data is fresh!')
        setData(prev => ({ ...prev, isFetchingBatch: false }))
        return
      }

      await fetchStocksBatch(toFetch, (progress) => {
        setData(prev => ({ ...prev, fetchProgress: progress }))
      })

      console.log('[Portfolio] ✅ Smart refresh complete, recalculating...')
      await calculateCoreData(false)

    } catch (error) {
      console.error('[Portfolio] Smart refresh failed:', error)
    } finally {
      setData(prev => ({ ...prev, isFetchingBatch: false, fetchProgress: undefined }))
    }
  }, [calculateCoreData])

  // ==================== INITIAL LOAD ====================

  const hasInitialized = React.useRef(false)

  useEffect(() => {
    const loadData = async () => {
      const cached = getCachedData()

      if (cached) {
        setData({ ...cached, isLoading: false, isFetchingBatch: false })
        // Only do background refresh once per app session, not every page switch
        if (!hasInitialized.current) {
          hasInitialized.current = true
          console.log('[Portfolio] ⚡ Cache hit — background refresh once')
          await calculateCoreData(true)
        } else {
          console.log('[Portfolio] ⚡ Cache hit — skipping background refresh (already initialized)')
        }
      } else {
        hasInitialized.current = true
        await calculateCoreData(false)
      }
    }

    loadData().catch(err => {
      console.error('[Portfolio] Error loading data:', err)
      setData(prev => ({ ...prev, isLoading: false }))
    })

    const refreshInterval = setInterval(() => {
      console.log('[Portfolio] 🔄 Auto-refresh (3 hours)...')
      calculateCoreData(true).catch(err => {
        console.error('[Portfolio] Error during auto-refresh:', err)
      })
    }, CACHE_DURATION)

    const handleStorageChange = (e: StorageEvent) => {
      if (e.key === 'transactions' || e.key === 'uploadedFiles') {
        console.log('[Portfolio] 🔄 Storage changed, recalculating...')
        calculateCoreData(false).catch(err => {
          console.error('[Portfolio] Error during storage change:', err)
        })
      }
    }

    const handleLocalUpdate = () => {
      console.log('[Portfolio] 🔄 Local update, recalculating...')
      calculateCoreData(false).catch(err => {
        console.error('[Portfolio] Error during local update:', err)
      })
    }

    window.addEventListener('storage', handleStorageChange)
    window.addEventListener('transactionsUpdated', handleLocalUpdate)

    return () => {
      clearInterval(refreshInterval)
      window.removeEventListener('storage', handleStorageChange)
      window.removeEventListener('transactionsUpdated', handleLocalUpdate)
    }
  }, [calculateCoreData])

  const refresh = useCallback(async () => {
    console.log('[Portfolio] 🔄 Manual refresh')
    setData((prev) => ({ ...prev, isRefreshing: true }))
    await calculateCoreData(false)
    setData((prev) => ({ ...prev, isRefreshing: false }))
  }, [calculateCoreData])

  const value: PortfolioContextData = {
    ...data,
    refresh,
    smartRefresh,
  }

  return <PortfolioContext.Provider value={value}>{children}</PortfolioContext.Provider>
}
