interface StockPrice {
  symbol: string
  price: number
  change: number
  percentChange: number
  sector?: string
  industry?: string
  country?: string
}

export async function fetchStockPrices(symbols: string[]): Promise<Record<string, StockPrice>> {
  const prices: Record<string, StockPrice> = {}
  
  try {
    // Fetch prices for all symbols using YOUR existing API
    const promises = symbols.map(async (symbol) => {
      try {
        const response = await fetch(`/api/stock-info?symbol=${symbol}`)
        const data = await response.json()
        
        if (data.price > 0) {
          prices[symbol] = {
            symbol,
            price: data.price,
            change: data.change || 0,
            percentChange: data.changePercent || 0,
            sector: data.sector,
            industry: data.industry,
            country: data.country,
          }
        }
      } catch (error) {
        console.error(`Failed to fetch ${symbol}:`, error)
      }
    })
    
    await Promise.all(promises)
  } catch (error) {
    console.error('Error fetching prices:', error)
  }
  
  return prices
}

export async function fetchSinglePrice(symbol: string): Promise<number | null> {
  try {
    const response = await fetch(`/api/stock-info?symbol=${symbol}`)
    const data = await response.json()
    return data.price > 0 ? data.price : null
  } catch (error) {
    console.error(`Failed to fetch ${symbol}:`, error)
    return null
  }
}
