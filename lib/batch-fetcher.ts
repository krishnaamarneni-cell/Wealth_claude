// ==================== RATE-LIMITED BATCH FETCHER ====================
// Fetches stock data in batches of 5, respecting Polygon rate limits

import { setCachedStock, getCachedStock } from './smart-stock-cache'

const BATCH_SIZE = 5 // Polygon free tier: 5 calls per minute
const BATCH_DELAY = 60000 // 60 seconds between batches

interface FetchProgress {
  current: number
  total: number
  symbol: string
  batch: number
  totalBatches: number
}

type ProgressCallback = (progress: FetchProgress) => void

// ==================== BATCH FETCHER ====================

export async function fetchStocksBatch(
  symbols: string[],
  onProgress?: ProgressCallback
): Promise<{ success: number; failed: number }> {
  
  console.log(`\n🚀 ========== BATCH FETCH START ==========`)
  console.log(`   Stocks to fetch: ${symbols.length}`)
  
  if (symbols.length === 0) {
    console.log(`   ✅ Nothing to fetch!`)
    return { success: 0, failed: 0 }
  }

  let successCount = 0
  let failedCount = 0

  // Split into batches of 5
  const totalBatches = Math.ceil(symbols.length / BATCH_SIZE)
  console.log(`   Batches needed: ${totalBatches}`)

  for (let i = 0; i < symbols.length; i += BATCH_SIZE) {
    const batch = symbols.slice(i, i + BATCH_SIZE)
    const batchNum = Math.floor(i / BATCH_SIZE) + 1

    console.log(`\n📦 Batch ${batchNum}/${totalBatches}: ${batch.join(', ')}`)

    // Fetch all stocks in batch (parallel)
    const results = await Promise.allSettled(
      batch.map(async (symbol, idx) => {
        try {
          // Report progress
          if (onProgress) {
            onProgress({
              current: i + idx + 1,
              total: symbols.length,
              symbol,
              batch: batchNum,
              totalBatches
            })
          }

          console.log(`   🔄 Fetching ${symbol}...`)

          const response = await fetch(`/api/stock-info?symbol=${symbol}`)

          if (!response.ok) {
            throw new Error(`HTTP ${response.status}`)
          }

          const data = await response.json()

          // ✅ Accept data even if price is 0 (fallback data when API keys missing)
          // Validate that we at least have required fields
          if (!data.sector || !data.industry) {
            throw new Error('Invalid response structure')
          }

          // Cache the result
          setCachedStock(symbol, {
            symbol: data.symbol || symbol,
            price: data.price,
            change: data.change || 0,
            changePercent: data.changePercent || 0,
            sector: data.sector || 'Unknown',
            industry: data.industry || 'Unknown',
            country: data.country || 'US',
            week52High: data.week52High || 0,
            week52Low: data.week52Low || 0,
            dividendYield: data.dividendYield || 0,
            returns: data.returns || {
              '1D': 0,
              '1W': 0,
              '1M': 0,
              '3M': 0,
              '6M': 0,
              '1Y': 0
            },
            dataSource: data.dataSource || 'unknown'
          })

          console.log(`   ✅ ${symbol} fetched & cached`)
          return { symbol, success: true }

        } catch (error) {
          console.error(`   ❌ ${symbol} failed:`, error)
          return { symbol, success: false, error }
        }
      })
    )

    // Count successes and failures
    results.forEach(result => {
      if (result.status === 'fulfilled' && result.value.success) {
        successCount++
      } else {
        failedCount++
      }
    })

    console.log(`   📊 Batch ${batchNum} complete: ${batch.length} stocks`)

    // Wait before next batch (unless it's the last batch)
    if (i + BATCH_SIZE < symbols.length) {
      console.log(`   ⏳ Waiting 60 seconds before next batch...`)
      await new Promise(resolve => setTimeout(resolve, BATCH_DELAY))
    }
  }

  console.log(`\n✅ ========== BATCH FETCH COMPLETE ==========`)
  console.log(`   Success: ${successCount}/${symbols.length}`)
  console.log(`   Failed: ${failedCount}/${symbols.length}`)
  console.log(`   Time: ~${totalBatches} minutes`)

  return { success: successCount, failed: failedCount }
}

// ==================== SINGLE STOCK FETCH ====================

export async function fetchSingleStock(symbol: string): Promise<boolean> {
  try {
    console.log(`[Fetch] Fetching ${symbol}...`)

    const response = await fetch(`/api/stock-info?symbol=${symbol}`)

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}`)
    }

    const data = await response.json()

    // ✅ Accept data even with price=0 (API keys not configured)
    if (!data.sector || !data.industry) {
      throw new Error('Invalid response structure')
    }

    setCachedStock(symbol, {
      symbol: data.symbol || symbol,
      price: data.price,
      change: data.change || 0,
      changePercent: data.changePercent || 0,
      sector: data.sector || 'Unknown',
      industry: data.industry || 'Unknown',
      country: data.country || 'US',
      week52High: data.week52High || 0,
      week52Low: data.week52Low || 0,
      dividendYield: data.dividendYield || 0,
      returns: data.returns || {
        '1D': 0,
        '1W': 0,
        '1M': 0,
        '3M': 0,
        '6M': 0,
        '1Y': 0
      },
      dataSource: data.dataSource || 'unknown'
    })

    console.log(`[Fetch] ✅ ${symbol} cached`)
    return true

  } catch (error) {
    console.error(`[Fetch] ❌ ${symbol} failed:`, error)
    return false
  }
}
