/**
 * Phase 5 — Step 20: Fallback Portfolio Fetch
 * 
 * When the frontend doesn't send portfolioSnapshot (user opened chat
 * before loading dashboard), we fetch transactions from Supabase
 * and build a basic portfolio summary server-side.
 * 
 * This is a LIGHTWEIGHT version — no real-time prices, just positions
 * and cost basis from transaction history. Enough for the AI to answer
 * basic questions like "what do I own" and "how many holdings".
 * 
 * Place this file at: lib/ai-chat/fallback-portfolio.ts
 */

import { SupabaseClient } from '@supabase/supabase-js'

interface FallbackHolding {
  symbol: string
  shares: number
  avgCost: number
  totalCost: number
  sector: string
}

interface FallbackPortfolio {
  holdings: FallbackHolding[]
  holdingsCount: number
  totalCost: number
  symbols: string[]
}

interface Transaction {
  symbol: string
  type: string
  shares: number
  price: number
  total: number
  date: string
  fees: number
}

/**
 * Fetch transactions from Supabase and calculate basic holdings.
 * Returns a simplified portfolio that can be injected into the AI prompt.
 */
export async function fetchFallbackPortfolio(
  supabase: SupabaseClient,
  userId: string
): Promise<FallbackPortfolio | null> {
  try {
    console.log('[Fallback Portfolio] Fetching transactions from Supabase...')

    const { data: transactions, error } = await supabase
      .from('transactions')
      .select('symbol, type, shares, price, total, date, fees')
      .eq('user_id', userId)
      .order('date', { ascending: true })

    if (error) {
      console.error('[Fallback Portfolio] Supabase error:', error.message)
      return null
    }

    if (!transactions || transactions.length === 0) {
      console.log('[Fallback Portfolio] No transactions found')
      return null
    }

    console.log(`[Fallback Portfolio] Found ${transactions.length} transactions`)

    // Calculate holdings from transactions
    const holdingsMap = new Map<string, { shares: number; totalCost: number; buyCount: number }>()

    for (const tx of transactions as Transaction[]) {
      const symbol = tx.symbol?.toUpperCase()
      if (!symbol) continue

      const current = holdingsMap.get(symbol) || { shares: 0, totalCost: 0, buyCount: 0 }

      const txType = (tx.type || '').toUpperCase()
      const shares = Number(tx.shares) || 0
      const price = Number(tx.price) || 0
      const total = Number(tx.total) || (shares * price)

      if (txType === 'BUY') {
        current.shares += shares
        current.totalCost += total
        current.buyCount += 1
      } else if (txType === 'SELL') {
        // Reduce shares, adjust cost basis proportionally
        if (current.shares > 0) {
          const costPerShare = current.totalCost / current.shares
          current.shares -= shares
          current.totalCost = current.shares * costPerShare
        }
      }
      // DIVIDEND type doesn't affect shares or cost

      holdingsMap.set(symbol, current)
    }

    // Build holdings array (only stocks with shares > 0)
    const holdings: FallbackHolding[] = []
    let totalPortfolioCost = 0

    for (const [symbol, data] of holdingsMap) {
      if (data.shares > 0) {
        const avgCost = data.totalCost / data.shares
        holdings.push({
          symbol,
          shares: Math.round(data.shares * 10000) / 10000, // 4 decimal places
          avgCost: Math.round(avgCost * 100) / 100,
          totalCost: Math.round(data.totalCost * 100) / 100,
          sector: 'Unknown', // We don't have sector data server-side without API calls
        })
        totalPortfolioCost += data.totalCost
      }
    }

    // Sort by total cost (largest positions first)
    holdings.sort((a, b) => b.totalCost - a.totalCost)

    console.log(`[Fallback Portfolio] Calculated ${holdings.length} active holdings`)

    return {
      holdings,
      holdingsCount: holdings.length,
      totalCost: Math.round(totalPortfolioCost * 100) / 100,
      symbols: holdings.map((h) => h.symbol),
    }
  } catch (error) {
    console.error('[Fallback Portfolio] Error:', error)
    return null
  }
}

/**
 * Build a system prompt section from fallback portfolio data.
 * This is a simpler version than the full snapshot — no live prices,
 * no sector allocation, no risk metrics.
 */
export function buildFallbackPromptSection(portfolio: FallbackPortfolio): string {
  let prompt = `=== USER'S PORTFOLIO (from transaction history — no live prices) ===
Number of Holdings: ${portfolio.holdingsCount}
Total Cost Basis: $${portfolio.totalCost.toLocaleString()}
Note: Live prices are not available in this view. Data is based on transaction history only.

`

  if (portfolio.holdings.length > 0) {
    prompt += `=== HOLDINGS (by cost basis) ===\n`
    portfolio.holdings.forEach((h) => {
      prompt += `${h.symbol}: ${h.shares} shares | Avg Cost: $${h.avgCost.toFixed(2)} | Total Invested: $${h.totalCost.toLocaleString()}\n`
    })
    prompt += '\n'

    prompt += `IMPORTANT: You have the user's holdings and cost basis but NOT current prices.
- You CAN answer: what they own, how many holdings, how much they invested, average cost per share.
- You CANNOT answer: current value, gains/losses, today's change, allocation percentages (without live prices).
- If asked about current value or gains, tell the user to load their dashboard first for live data, or ask a market question so you can look up prices.
\n`
  }

  return prompt
}