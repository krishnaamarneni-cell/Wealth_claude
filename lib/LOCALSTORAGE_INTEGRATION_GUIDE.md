# LOCAL STORAGE INTEGRATION GUIDE

## Overview
Convert 4 pages to use real transaction data from localStorage instead of mock data.

**localStorage key:** `"transactions"`
**Data structure:** Array of `Transaction` objects with: `{ ticker, quantity, price, date, type }`

---

## 1. DASHBOARD/OVERVIEW PAGE (/app/dashboard/page.tsx)

### What to Replace
- `portfolioSummary` (mock data)
- `holdings` (mock data)
- `performanceHistory` (mock data)

### Import Statement
```typescript
import { 
  usePortfolioData, 
  calculatePortfolioSummary, 
  calculateHoldings 
} from "@/lib/local-storage-utils"
```

### Implementation
```typescript
"use client"

import { usePortfolioData, calculatePortfolioSummary, calculateHoldings } from "@/lib/local-storage-utils"

export default function DashboardPage() {
  const { transactions, isEmpty, isLoading } = usePortfolioData()

  // EMPTY STATE
  if (!isLoading && isEmpty) {
    return (
      <div className="p-4 lg:p-6 flex items-center justify-center min-h-screen">
        <Card className="w-full max-w-md">
          <CardContent className="pt-8 text-center">
            <p className="text-muted-foreground mb-4">No data available</p>
            <p className="text-sm text-muted-foreground mb-6">Add your first transaction to get started</p>
            <Button asChild>
              <Link href="/dashboard/transactions">Add Transaction</Link>
            </Button>
          </CardContent>
        </Card>
      </div>
    )
  }

  // CALCULATE REAL DATA
  const holdings = calculateHoldings(transactions)
  const summary = calculatePortfolioSummary(transactions)

  // USE THE DATA
  const totalPortfolioValue = summary.totalValue
  const totalCost = summary.totalCost
  const totalGain = summary.totalGain
  const totalGainPercent = summary.totalGainPercent
  const unrealizedGains = holdings.filter(h => h.totalGain > 0).reduce((sum, h) => sum + h.totalGain, 0)

  // ... rest of JSX stays the same
}
```

### Calculations Explained
- **totalValue:** Sum of all current holdings (cost + unrealized gains)
- **totalGain:** totalValue - totalCost
- **totalGainPercent:** (totalGain / totalCost) * 100
- **holdings:** Array of current positions from BUY/SELL transactions

---

## 2. DIVIDENDS PAGE (/app/dashboard/dividends/page.tsx)

### What to Replace
- `dividendHistory` (mock data)
- All calculations based on `dividendHistory`

### Import Statement
```typescript
import { 
  usePortfolioData, 
  calculateDividends, 
  getTotalDividends,
  getDividendsByPeriod 
} from "@/lib/local-storage-utils"
```

### Implementation
```typescript
"use client"

import { usePortfolioData, calculateDividends, getTotalDividends } from "@/lib/local-storage-utils"

export default function DividendsPage() {
  const { transactions, isEmpty, isLoading } = usePortfolioData()
  const [viewType, setViewType] = useState<ViewType>("monthly")

  // EMPTY STATE
  if (!isLoading && isEmpty) {
    return (
      <div className="p-4 lg:p-6 flex items-center justify-center min-h-screen">
        <Card className="w-full max-w-md">
          <CardContent className="pt-8 text-center">
            <p className="text-muted-foreground mb-4">No data available</p>
            <p className="text-sm text-muted-foreground mb-6">Add dividend transactions to view dividend history</p>
            <Button asChild>
              <Link href="/dashboard/transactions">Add Transaction</Link>
            </Button>
          </CardContent>
        </Card>
      </div>
    )
  }

  // CALCULATE REAL DATA
  const dividends = calculateDividends(transactions)
  const totalReceived = getTotalDividends(dividends)
  const avgMonthlyDividend = dividends.length > 0 ? totalReceived / 12 : 0 // Rough estimate

  // Group by month/quarter/year (keep existing code logic)
  const monthlyDividends = dividends.reduce((acc, div) => {
    const month = div.month
    if (!acc[month]) acc[month] = 0
    acc[month] += div.amount
    return acc
  }, {} as Record<string, number>)

  // ... rest stays the same
}
```

### Calculations Explained
- **dividends:** Filtered array of DIVIDEND type transactions with calculated amounts
- **totalReceived:** Sum of all dividend.amount values
- **monthly/quarterly/yearly:** Group dividends by time period

---

## 3. TRADES PAGE (/app/dashboard/trades/page.tsx)

### What to Replace
- `tradeHistory` (mock data)
- All trade stats calculations

### Import Statement
```typescript
import { 
  usePortfolioData, 
  calculateTrades, 
  getTradeStats 
} from "@/lib/local-storage-utils"
```

### Implementation
```typescript
"use client"

import { usePortfolioData, calculateTrades, getTradeStats } from "@/lib/local-storage-utils"

export default function TradesPage() {
  const { transactions, isEmpty, isLoading } = usePortfolioData()

  // EMPTY STATE
  if (!isLoading && isEmpty) {
    return (
      <div className="p-4 lg:p-6 flex items-center justify-center min-h-screen">
        <Card className="w-full max-w-md">
          <CardContent className="pt-8 text-center">
            <p className="text-muted-foreground mb-4">No data available</p>
            <p className="text-sm text-muted-foreground mb-6">Add buy/sell transactions to view trade analysis</p>
            <Button asChild>
              <Link href="/dashboard/transactions">Add Transaction</Link>
            </Button>
          </CardContent>
        </Card>
      </div>
    )
  }

  // CALCULATE REAL DATA
  const trades = calculateTrades(transactions)
  const stats = getTradeStats(trades)

  // USE THE DATA FOR CARDS
  // <Card><CardContent>{stats.totalTrades}</CardContent></Card>
  // <Card><CardContent>{formatCurrency(stats.totalBuyVolume)}</CardContent></Card>
  // <Card><CardContent>{formatCurrency(stats.totalSellVolume)}</CardContent></Card>

  // Group trades by month (keep existing code)
  const monthlyTrades = trades.reduce((acc, trade) => {
    const month = trade.month
    if (!acc[month]) {
      acc[month] = { buys: 0, sells: 0 }
    }
    if (trade.type === "BUY") {
      acc[month].buys += trade.total
    } else {
      acc[month].sells += trade.total
    }
    return acc
  }, {} as Record<string, { buys: number; sells: number }>)

  // ... rest stays the same
}
```

### Calculations Explained
- **trades:** Array of BUY/SELL transactions with calculated totals
- **totalTrades:** trades.length
- **buyCount/sellCount:** Count of BUY and SELL transactions
- **totalBuyVolume/totalSellVolume:** Sum of trade totals by type

---

## 4. PERFORMANCE PAGE (/app/dashboard/performance/page.tsx)

### What to Replace
- `portfolioSummary` (mock data)
- `periodReturns` (mock data)
- `performanceHistory` (mock data)

### Import Statement
```typescript
import { 
  usePortfolioData, 
  calculateReturns 
} from "@/lib/local-storage-utils"
```

### Implementation
```typescript
"use client"

import { usePortfolioData, calculateReturns } from "@/lib/local-storage-utils"

export default function PerformancePage() {
  const { transactions, isEmpty, isLoading } = usePortfolioData()
  const [returnType, setReturnType] = useState<ReturnType>('simple')

  // EMPTY STATE
  if (!isLoading && isEmpty) {
    return (
      <div className="p-4 lg:p-6 flex items-center justify-center min-h-screen">
        <Card className="w-full max-w-md">
          <CardContent className="pt-8 text-center">
            <p className="text-muted-foreground mb-4">No data available</p>
            <p className="text-sm text-muted-foreground mb-6">Add transactions to view performance metrics</p>
            <Button asChild>
              <Link href="/dashboard/transactions">Add Transaction</Link>
            </Button>
          </CardContent>
        </Card>
      </div>
    )
  }

  // CALCULATE REAL DATA
  const returns = calculateReturns(transactions)

  // USE THE DATA
  // For period buttons:
  const periodReturns = {
    '1M': returns.oneMonth,
    '3M': returns.threeMonth,
    '1Y': returns.oneYear,
    'ALL': returns.allTime,
  }

  // When selectedPeriod changes:
  const currentReturns = periodReturns[selectedPeriod] || returns.allTime

  // ... rest stays the same
}
```

### Calculations Explained
- **totalCost:** Sum of all BUY transaction amounts
- **totalValue:** Current holdings value
- **totalGain:** totalValue - totalCost
- **totalGainPercent:** (totalGain / totalCost) * 100
- **oneMonth/threeMonth/oneYear:** Filtered returns for those periods

---

## EMPTY STATE TEMPLATE (Use for all 4 pages)

```typescript
if (!isLoading && isEmpty) {
  return (
    <div className="p-4 lg:p-6 flex items-center justify-center min-h-screen">
      <Card className="w-full max-w-md">
        <CardContent className="pt-8 text-center">
          <p className="text-muted-foreground mb-4">No data available</p>
          <p className="text-sm text-muted-foreground mb-6">
            {/* Page-specific message */}
          </p>
          <Button asChild>
            <Link href="/dashboard/transactions">Add Transaction</Link>
          </Button>
        </CardContent>
      </Card>
    </div>
  )
}
```

---

## QUICK REFERENCE: What Gets Replaced

### Dashboard Page
Replace: `portfolioSummary`, `mockHoldings`, `performanceHistory`
With: `calculatePortfolioSummary()`, `calculateHoldings()`, `calculateReturns()`

### Dividends Page
Replace: `dividendHistory`
With: `calculateDividends()`

### Trades Page
Replace: `tradeHistory`
With: `calculateTrades()`, `getTradeStats()`

### Performance Page
Replace: `portfolioSummary`, `periodReturns`, `performanceHistory`
With: `calculateReturns()`, derived from results

---

## Testing
To test with mock data in localStorage:

```javascript
// In browser console:
localStorage.setItem('transactions', JSON.stringify([
  { ticker: 'AAPL', quantity: 10, price: 150, date: '2024-01-15', type: 'buy' },
  { ticker: 'AAPL', quantity: 5, price: 165, date: '2024-02-20', type: 'sell' },
  { ticker: 'MSFT', quantity: 5, price: 300, date: '2024-01-20', type: 'buy' },
  { ticker: 'AAPL', quantity: 5, price: 3, date: '2024-03-01', type: 'dividend' },
]))

// Refresh page to see data
```
