# QUICK START: LOCAL STORAGE INTEGRATION

## Files Created
1. **`/lib/local-storage-utils.ts`** - All calculation functions
2. **`/lib/LOCALSTORAGE_INTEGRATION_GUIDE.md`** - Detailed implementation guide

## 3-Step Implementation for Each Page

### Step 1: Import
```typescript
import { usePortfolioData, calculate[PageName] } from "@/lib/local-storage-utils"
```

### Step 2: Get Data
```typescript
const { transactions, isEmpty, isLoading } = usePortfolioData()
```

### Step 3: Check Empty & Calculate
```typescript
if (!isLoading && isEmpty) {
  // Show "No data available" screen (template provided in guide)
}

const calculatedData = calculate[PageName](transactions)
```

---

## What Each Page Needs

### 1. Dashboard (/app/dashboard/page.tsx)
**Imports:** `calculatePortfolioSummary`, `calculateHoldings`
**Replaces:** `portfolioSummary`, `mockHoldings`
**Calculations:** Total value, gains, holdings, top gainers/losers

### 2. Dividends (/app/dashboard/dividends/page.tsx)
**Imports:** `calculateDividends`, `getTotalDividends`
**Replaces:** `dividendHistory`
**Calculations:** Total dividends, monthly/quarterly/yearly breakdown

### 3. Trades (/app/dashboard/trades/page.tsx)
**Imports:** `calculateTrades`, `getTradeStats`
**Replaces:** `tradeHistory`
**Calculations:** Trade counts, buy/sell volumes, trade statistics

### 4. Performance (/app/dashboard/performance/page.tsx)
**Imports:** `calculateReturns`
**Replaces:** `periodReturns`, `portfolioSummary`
**Calculations:** Returns by period (1M, 3M, 1Y, ALL), gains percentage

---

## Data Structure (localStorage)

**Key:** `"transactions"`
**Type:** Array

```typescript
{
  ticker: string      // e.g., "AAPL"
  quantity: number    // e.g., 10
  price: number       // e.g., 150.25
  date: string        // "YYYY-MM-DD" format
  type: 'buy' | 'sell' | 'dividend' | 'fee' | 'tax' | 'interest'
}
```

### Example:
```javascript
[
  { ticker: 'AAPL', quantity: 10, price: 150, date: '2024-01-15', type: 'buy' },
  { ticker: 'MSFT', quantity: 5, price: 300, date: '2024-02-01', type: 'buy' },
  { ticker: 'AAPL', quantity: 5, price: 5, date: '2024-03-15', type: 'dividend' },
]
```

---

## Key Functions

### Universal
- `getTransactionsFromStorage()` - Read transactions from localStorage
- `hasTransactions()` - Check if any transactions exist
- `usePortfolioData()` - Hook to get transactions + loading state

### Dashboard
- `calculateHoldings(transactions)` - Current positions
- `calculatePortfolioSummary(transactions)` - Totals and stats

### Dividends
- `calculateDividends(transactions)` - Dividend list with period data
- `getTotalDividends(dividends)` - Sum of all dividends
- `getDividendsByPeriod(dividends, period, view)` - Filtered amount

### Trades
- `calculateTrades(transactions)` - Trade list with totals
- `getTradeStats(trades)` - Buy/sell counts and volumes

### Performance
- `calculateReturns(transactions)` - Returns for all periods

---

## Empty State Message

**If `isEmpty === true`:**
Show: "No data available" + Link to add transactions

Each page has a specific message (see guide for templates)

---

## Testing Checklist

- [ ] localStorage has no transactions → see empty state
- [ ] Add 1 BUY → Dashboard shows data
- [ ] Add 1 SELL → Trades page shows data
- [ ] Add 1 DIVIDEND → Dividends page shows data
- [ ] All totals calculate correctly
- [ ] Empty state shows when localStorage is cleared

---

## Next Steps

1. Read `/lib/LOCALSTORAGE_INTEGRATION_GUIDE.md` for detailed implementation
2. Update each page following the 3-step pattern
3. Test with mock data in browser console
4. Remove/archive old mock data imports

---

## Full Guide Location

📖 See `LOCALSTORAGE_INTEGRATION_GUIDE.md` for complete code examples
