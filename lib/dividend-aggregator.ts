// lib/dividend-aggregator.ts
import { DividendService, DividendResponse } from './dividend-service'
import { DividendCalculator } from './dividend-calculator'

export interface DividendBreakdown {
  actualDividends: number        // From CSV (CDIV transactions)
  estimatedDividends: number     // Calculated from API
  totalDividends: number          // Sum of both
  isEstimated: boolean           // true if no CSV data
  breakdown: Array<{
    date: string
    amount: number
    type: 'actual' | 'estimated'
  }>
  source: 'CSV' | 'ESTIMATED' | 'MIXED'
}

interface Transaction {
  date: string
  symbol: string
  type: string
  shares: number
  price: number
  total: number
}

export class DividendAggregator {
  /**
   * Calculate total dividends for a stock (CSV + Estimated)
   */
  static async calculateStockDividends(
    symbol: string,
    shares: number,
    purchaseDate: string,
    transactions: Transaction[]
  ): Promise<DividendBreakdown> {
    
    // Step 1: Get actual dividends from CSV (CDIV transactions)
    const actualDividends = this.getActualDividendsFromCSV(symbol, transactions)
    
    // Step 2: If we have CSV data, use it primarily
    if (actualDividends.total > 0) {
      return {
        actualDividends: actualDividends.total,
        estimatedDividends: 0,
        totalDividends: actualDividends.total,
        isEstimated: false,
        breakdown: actualDividends.breakdown,
        source: 'CSV'
      }
    }
    
    // Step 3: No CSV data - estimate from API
    const estimated = await this.estimateDividendsFromAPI(
      symbol,
      shares,
      purchaseDate
    )
    
    return {
      actualDividends: 0,
      estimatedDividends: estimated.total,
      totalDividends: estimated.total,
      isEstimated: true,
      breakdown: estimated.breakdown,
      source: 'ESTIMATED'
    }
  }
  
  /**
   * Get actual dividends from CSV transactions
   */
  private static getActualDividendsFromCSV(
    symbol: string,
    transactions: Transaction[]
  ): { total: number; breakdown: any[] } {
    const dividendTxns = transactions.filter(
      t => t.symbol === symbol && t.type === 'DIVIDEND'
    )
    
    const breakdown = dividendTxns.map(txn => ({
      date: txn.date,
      amount: txn.total,
      type: 'actual' as const
    }))
    
    const total = dividendTxns.reduce((sum, txn) => sum + txn.total, 0)
    
    return { total, breakdown }
  }
  
  /**
   * Estimate dividends from Finnhub API
   */
  private static async estimateDividendsFromAPI(
    symbol: string,
    shares: number,
    purchaseDate: string
  ): Promise<{ total: number; breakdown: any[] }> {
    try {
      const dividendData = await DividendService.fetchDividendData(symbol)
      
      if (!dividendData.data || dividendData.data.length === 0) {
        return { total: 0, breakdown: [] }
      }
      
      const purchaseDateObj = new Date(purchaseDate)
      
      // Filter dividends that occurred AFTER purchase date
      const relevantDividends = dividendData.data.filter(div => {
        const divDate = new Date(div.payDate || div.date)
        return divDate >= purchaseDateObj
      })
      
      // Calculate estimated dividend income
      const breakdown = relevantDividends.map(div => ({
        date: div.payDate || div.date,
        amount: div.amount * shares,
        type: 'estimated' as const
      }))
      
      const total = breakdown.reduce((sum, item) => sum + item.amount, 0)
      
      return { total, breakdown }
      
    } catch (error) {
      console.error(`Error estimating dividends for ${symbol}:`, error)
      return { total: 0, breakdown: [] }
    }
  }
  
  /**
   * Batch calculate dividends for multiple stocks
   */
  static async calculatePortfolioDividends(
    holdings: Array<{
      symbol: string
      shares: number
      purchaseDate: string
    }>,
    transactions: Transaction[]
  ): Promise<Record<string, DividendBreakdown>> {
    const results: Record<string, DividendBreakdown> = {}
    
    // Process in batches to avoid rate limits
    for (const holding of holdings) {
      results[holding.symbol] = await this.calculateStockDividends(
        holding.symbol,
        holding.shares,
        holding.purchaseDate,
        transactions
      )
      
      // Small delay to respect API rate limits
      await new Promise(resolve => setTimeout(resolve, 200))
    }
    
    return results
  }
}
