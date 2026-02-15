// lib/dividend-service.ts
// ✅ SECURITY: This service calls the private /api/dividends route instead of exposing the API key

const CACHE_DURATION = 24 * 60 * 60 * 1000 // 24 hours

export interface DividendData {
  date: string           // Ex-dividend date
  amount: number         // Dividend per share
  adjustedAmount: number
  declarationDate: string
  recordDate: string
  payDate: string
  currency: string
}

export interface DividendResponse {
  symbol: string
  data: DividendData[]
}

export class DividendService {
  /**
   * Fetch dividend data for a single ticker via secure API route
   */
  static async fetchDividendData(ticker: string): Promise<DividendResponse> {
    try {
      // Check cache first
      const cached = this.getCachedDividend(ticker)
      if (cached && !this.isCacheExpired(cached)) {
        console.log(`✅ Using cached dividend data for ${ticker}`)
        return cached.data
      }

      // Fetch from secure server-side API route
      console.log(`📡 Fetching dividend data for ${ticker}...`)
      const response = await fetch(`/api/dividends?ticker=${ticker}`)

      if (!response.ok) {
        throw new Error(`API error: ${response.status}`)
      }

      const result = await response.json()

      // Cache the result
      this.cacheDividend(ticker, result)

      console.log(`✅ Fetched ${result.data.length} dividends for ${ticker}`)
      return result
    } catch (error) {
      console.error(`❌ Error fetching dividend for ${ticker}:`, error)
      return { symbol: ticker, data: [] }
    }
  }

  /**
   * Batch fetch dividends for multiple tickers (with rate limiting)
   */
  static async fetchBatchDividends(tickers: string[]): Promise<Record<string, DividendResponse>> {
    const results: Record<string, DividendResponse> = {};
    const BATCH_SIZE = 5;  // Finnhub allows 60/min, stay safe with 5/second
    const DELAY = 1000;    // 1 second between batches

    console.log(`📊 Fetching dividends for ${tickers.length} stocks...`);

    for (let i = 0; i < tickers.length; i += BATCH_SIZE) {
      const batch = tickers.slice(i, i + BATCH_SIZE);
      
      const batchPromises = batch.map(ticker => 
        this.fetchDividendData(ticker)
          .then(data => ({ ticker, data }))
          .catch(err => ({ ticker, data: { symbol: ticker, data: [] }, error: err }))
      );

      const batchResults = await Promise.all(batchPromises);
      
      batchResults.forEach(({ ticker, data }: any) => {
        results[ticker] = data;
      });

      // Wait before next batch (except last one)
      if (i + BATCH_SIZE < tickers.length) {
        console.log(`⏳ Waiting 1s before next batch...`);
        await new Promise(resolve => setTimeout(resolve, DELAY));
      }
    }

    console.log(`✅ Completed fetching dividends for all stocks`);
    return results;
  }

  /**
   * Cache dividend data
   */
  static cacheDividend(ticker: string, data: DividendResponse): void {
    if (typeof window === 'undefined') return;
    
    const cacheKey = `dividend_${ticker}`;
    const cacheData = {
      data,
      timestamp: Date.now(),
      expiresAt: Date.now() + CACHE_DURATION
    };
    localStorage.setItem(cacheKey, JSON.stringify(cacheData));
  }

  /**
   * Get cached dividend data
   */
  static getCachedDividend(ticker: string): any {
    if (typeof window === 'undefined') return null;
    
    const cacheKey = `dividend_${ticker}`;
    const cached = localStorage.getItem(cacheKey);
    return cached ? JSON.parse(cached) : null;
  }

  /**
   * Check if cache is expired
   */
  static isCacheExpired(cached: any): boolean {
    return Date.now() > cached.expiresAt;
  }

  /**
   * Clear all dividend cache
   */
  static clearCache(): void {
    if (typeof window === 'undefined') return;
    
    const keys = Object.keys(localStorage);
    keys.forEach(key => {
      if (key.startsWith('dividend_')) {
        localStorage.removeItem(key);
      }
    });
    console.log('🗑️ Cleared all dividend cache');
  }
}
