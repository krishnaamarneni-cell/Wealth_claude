/**
 * PORTFOLIO ENGINE INTEGRATION GUIDE
 * 
 * This file shows how to integrate PortfolioEngine into your existing pages.
 * Copy the relevant code snippet for each page you want to update.
 * 
 * Key Rules:
 * - Keep all existing UI components and styling unchanged
 * - Only replace the calculation logic
 * - Call clearCache() after adding new transactions
 * - Import only the functions you need from portfolio-engine
 */

// ============================================================================
// HOLDINGS PAGE INTEGRATION
// ============================================================================
// File: app/dashboard/holdings/page.tsx

/*
"use client"

import { Suspense } from "react"
import HoldingsTable from "@/components/dashboard/holdings-table"

function HoldingsPageSkeleton() {
  // Keep existing skeleton code
}

export default function HoldingsPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-foreground">Holdings</h1>
        <p className="text-muted-foreground">View and manage your stock positions</p>
      </div>

      <Suspense fallback={<HoldingsPageSkeleton />}>
        <HoldingsTable />
      </Suspense>
    </div>
  )
}
*/

// Update HoldingsTable component to use PortfolioEngine:
// File: components/dashboard/holdings-table.tsx

/*
"use client"

import { useState, useEffect } from "react"
import { getHoldings, getPortfolioSummary, clearCache } from "@/lib/portfolio-engine"
// ... keep all other imports

export default function HoldingsTable() {
  const [holdings, setHoldings] = useState([])
  const [portfolioSummary, setPortfolioSummary] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const loadData = async () => {
      setLoading(true)
      try {
        const holdingsData = getHoldings()
        const summaryData = getPortfolioSummary()
        
        setHoldings(holdingsData)
        setPortfolioSummary(summaryData)
      } catch (error) {
        console.error('Error loading portfolio data:', error)
      } finally {
        setLoading(false)
      }
    }

    loadData()
  }, [])

  // Add new transaction and refresh
  const handleAddTransaction = () => {
    clearCache() // Clear cache to force recalculation
    // Then trigger reload of data
  }

  // Keep all existing UI code unchanged
  return (
    // ... existing JSX
  )
}
*/

// ============================================================================
// DASHBOARD PAGE INTEGRATION
// ============================================================================
// File: app/dashboard/page.tsx

/*
"use client"

import { useState, useEffect } from "react"
import { getAllPortfolioData, getHoldings } from "@/lib/portfolio-engine"
// ... keep all other imports

export default function DashboardPage() {
  const [portfolioData, setPortfolioData] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const loadData = async () => {
      setLoading(true)
      try {
        // Get all calculated data at once
        const data = getAllPortfolioData()
        setPortfolioData(data)
      } catch (error) {
        console.error('Error loading portfolio data:', error)
      } finally {
        setLoading(false)
      }
    }

    loadData()
  }, [])

  if (loading || !portfolioData) {
    return <div>Loading...</div>
  }

  const { summary, holdings } = portfolioData

  return (
    <div className="space-y-6">
      {/* Keep all existing UI components */}
      {/* Just replace data sources */}
      {/* Example: */}
      {/* <PortfolioSummary 
        totalValue={summary.totalValue}
        totalGain={summary.totalGain}
        totalGainPercent={summary.totalGainPercent}
      /> */}
    </div>
  )
}
*/

// ============================================================================
// ALLOCATION PAGE INTEGRATION
// ============================================================================
// File: app/dashboard/allocation/page.tsx

/*
"use client"

import { useState, useEffect } from "react"
import { getAllocation } from "@/lib/portfolio-engine"
// ... keep all other imports

export default function AllocationPage() {
  const [allocation, setAllocation] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const loadData = async () => {
      setLoading(true)
      try {
        const allocationData = getAllocation()
        setAllocation(allocationData)
      } catch (error) {
        console.error('Error loading allocation data:', error)
      } finally {
        setLoading(false)
      }
    }

    loadData()
  }, [])

  if (loading || !allocation) {
    return <div>Loading...</div>
  }

  return (
    <div className="space-y-6">
      {/* Replace allocation data sources with allocation.sector, allocation.industry, etc. */}
      {/* Example pie chart: */}
      {/* <PieChart data={Object.entries(allocation.sector).map(([name, value]) => ({
        name,
        value
      }))} /> */}
    </div>
  )
}
*/

// ============================================================================
// PERFORMANCE PAGE INTEGRATION
// ============================================================================
// File: app/dashboard/performance/page.tsx

/*
"use client"

import { useState, useEffect } from "react"
import { getPerformance, getPortfolioSummary } from "@/lib/portfolio-engine"
// ... keep all other imports

export default function PerformancePage() {
  const [performance, setPerformance] = useState(null)
  const [summary, setSummary] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const loadData = async () => {
      setLoading(true)
      try {
        const performanceData = getPerformance()
        const summaryData = getPortfolioSummary()
        
        setPerformance(performanceData)
        setSummary(summaryData)
      } catch (error) {
        console.error('Error loading performance data:', error)
      } finally {
        setLoading(false)
      }
    }

    loadData()
  }, [])

  return (
    <div className="space-y-6">
      {/* Use performance.dailyReturn, performance.yearlyReturn, etc. */}
      {/* Use summary.totalGainPercent for overall performance */}
    </div>
  )
}
*/

// ============================================================================
// DIVIDENDS PAGE INTEGRATION
// ============================================================================
// File: app/dashboard/dividends/page.tsx

/*
"use client"

import { useState, useEffect } from "react"
import { getDividends, getHoldings } from "@/lib/portfolio-engine"
// ... keep all other imports

export default function DividendsPage() {
  const [dividendData, setDividendData] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const loadData = async () => {
      setLoading(true)
      try {
        const dividends = getDividends()
        setDividendData(dividends)
      } catch (error) {
        console.error('Error loading dividend data:', error)
      } finally {
        setLoading(false)
      }
    }

    loadData()
  }, [])

  return (
    <div className="space-y-6">
      {/* Use dividendData.totalDividends */}
      {/* Use dividendData.dividendsBySymbol for breakdown */}
      {/* Use dividendData.upcomingDividends for future payments */}
    </div>
  )
}
*/

// ============================================================================
// TRADES PAGE INTEGRATION
// ============================================================================
// File: app/dashboard/trades/page.tsx

/*
"use client"

import { useState, useEffect } from "react"
import { getTradeAnalysis, getHoldings } from "@/lib/portfolio-engine"
// ... keep all other imports

export default function TradesPage() {
  const [tradeAnalysis, setTradeAnalysis] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const loadData = async () => {
      setLoading(true)
      try {
        const analysis = getTradeAnalysis()
        setTradeAnalysis(analysis)
      } catch (error) {
        console.error('Error loading trade analysis:', error)
      } finally {
        setLoading(false)
      }
    }

    loadData()
  }, [])

  return (
    <div className="space-y-6">
      {/* Use tradeAnalysis.winRate */}
      {/* Use tradeAnalysis.bestTrade and worstTrade */}
      {/* Use tradeAnalysis.winningTrades vs losingTrades */}
    </div>
  )
}
*/

// ============================================================================
// TRANSACTIONS PAGE INTEGRATION
// ============================================================================
// File: app/dashboard/transactions/page.tsx

/*
"use client"

import { useState, useEffect } from "react"
import { clearCache } from "@/lib/portfolio-engine"
// ... keep all other imports

export default function TransactionsPage() {
  // When user adds/edits/deletes a transaction:
  
  const handleAddTransaction = (transaction) => {
    // Add to localStorage
    const existing = JSON.parse(localStorage.getItem('transactions') || '[]')
    existing.push(transaction)
    localStorage.setItem('transactions', JSON.stringify(existing))
    
    // Clear cache so next page load recalculates
    clearCache()
    
    // Show success message
    // Redirect or refresh as needed
  }

  return (
    <div className="space-y-6">
      {/* Keep all existing UI unchanged */}
    </div>
  )
}
*/

// ============================================================================
// USAGE PATTERNS
// ============================================================================

/**
 * Pattern 1: Single function usage
 * Use when you only need one type of data
 */
import { getHoldings } from "@/lib/portfolio-engine"

const holdings = getHoldings()
console.log(`Current holdings: ${holdings.length}`)

/**
 * Pattern 2: Multiple related functions
 * Use when you need complementary data
 */
import { getPortfolioSummary, getAllocation } from "@/lib/portfolio-engine"

const summary = getPortfolioSummary()
const allocation = getAllocation()

/**
 * Pattern 3: Get all data at once
 * Use for dashboard-style pages that display everything
 */
import { getAllPortfolioData } from "@/lib/portfolio-engine"

const allData = getAllPortfolioData()
const { holdings, summary, allocation, performance } = allData

/**
 * Pattern 4: Clear cache after updates
 * Use whenever transactions are added/modified/deleted
 */
import { clearCache, getHoldings } from "@/lib/portfolio-engine"

// User adds a transaction
saveTransaction(newTransaction)

// Clear the cache
clearCache()

// Next call will recalculate
const updatedHoldings = getHoldings()

// ============================================================================
// KEY BENEFITS
// ============================================================================

/**
 * 1. Single Source of Truth
 *    All calculations happen in one place (portfolio-engine.ts)
 *    Easy to find and fix calculation bugs
 *
 * 2. Automatic Caching
 *    5-minute cache prevents recalculation on every page view
 *    Dramatically improves performance
 *
 * 3. Consistent Data
 *    All pages use the same calculation logic
 *    No more discrepancies between page displays
 *
 * 4. Easy to Extend
 *    Adding new calculations is just adding a new function
 *    No need to modify existing page logic
 *
 * 5. Type Safety
 *    Full TypeScript interfaces for all return types
 *    IDE autocomplete and type checking
 *
 * 6. Testable
 *    Calculation logic isolated from UI
 *    Easy to write unit tests for each function
 */
