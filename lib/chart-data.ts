// lib/chart-data.ts

import { getTransactionsFromStorage } from './transaction-storage'

export type TimeRange = '1d' | '1w' | '1m' | '3m' | '6m' | '1y' | 'all'

export interface ChartDataPoint {
  date: string
  displayDate: string
  portfolioValue: number
  portfolioChange: number
  portfolioChangePercent: number
  benchmarkValue?: number
  benchmarkChange?: number
  benchmarkChangePercent?: number
}

// Format date based on time range
function formatDate(dateStr: string, timeRange: TimeRange): string {
  const date = new Date(dateStr)
  
  if (timeRange === '1d') {
    return date.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' })
  } else if (timeRange === '1w' || timeRange === '1m') {
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
  } else {
    return date.toLocaleDateString('en-US', { month: 'short', year: '2-digit' })
  }
}

// Generate realistic portfolio history with volatility
export function generatePortfolioHistory(
  startValue: number,
  endValue: number,
  startDate: Date,
  endDate: Date,
  numPoints: number
): ChartDataPoint[] {
  const dataPoints: ChartDataPoint[] = []
  const totalGrowth = (endValue - startValue) / startValue
  const daysBetween = Math.max(1, (endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24))
  const daysPerPoint = Math.max(1, daysBetween / numPoints)
  
  let previousValue = startValue
  
  for (let i = 0; i <= numPoints; i++) {
    const date = new Date(startDate)
    date.setDate(date.getDate() + (i * daysPerPoint))
    
    if (date > endDate) date.setTime(endDate.getTime())
    
    // Validate date is valid before processing
    if (isNaN(date.getTime())) {
      console.error('[v0] Invalid date calculated:', { startDate, i, daysPerPoint })
      continue
    }
    
    // Calculate target value with smooth growth curve
    const progress = i / numPoints
    const smoothProgress = 1 - Math.pow(1 - progress, 2) // Ease-out curve
    const targetValue = startValue + (endValue - startValue) * smoothProgress
    
    // Add realistic daily volatility (±1.5% to ±4%)
    const volatility = 0.03 // 3% daily volatility
    const randomWalk = (Math.random() - 0.5) * 2 * volatility
    const trendPull = (targetValue - previousValue) * 0.15 // Pull towards target
    
    let value = previousValue * (1 + randomWalk) + trendPull
    
    // Ensure we end exactly at endValue
    if (i === numPoints) value = endValue
    
    // Prevent negative values
    value = Math.max(value, startValue * 0.5)
    
    previousValue = value
    
    const change = value - startValue
    const changePercent = ((value - startValue) / startValue) * 100
    
    dataPoints.push({
      date: date.toISOString(),
      displayDate: formatDate(date.toISOString(), 'all'),
      portfolioValue: value,
      portfolioChange: change,
      portfolioChangePercent: changePercent
    })
  }
  
  return dataPoints
}

// Get historical data for selected time range
export function getChartData(
  timeRange: TimeRange,
  currentValue: number,
  totalCost: number,
  transactions: any[]
): ChartDataPoint[] {
  if (timeRange === '1d') {
    return get1DayData(currentValue)
  }
  
  const now = new Date()
  let startDate: Date
  let numPoints: number
  
  // Get earliest transaction date
  const earliestTransaction = transactions.length > 0 
    ? new Date(transactions.sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())[0].date)
    : new Date(now.getTime() - 365 * 24 * 60 * 60 * 1000)
  
  switch (timeRange) {
    case '1w':
      startDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000)
      numPoints = 7
      break
    case '1m':
      startDate = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000)
      numPoints = 30
      break
    case '3m':
      startDate = new Date(now.getTime() - 90 * 24 * 60 * 60 * 1000)
      numPoints = 45
      break
    case '6m':
      startDate = new Date(now.getTime() - 180 * 24 * 60 * 60 * 1000)
      numPoints = 60
      break
    case '1y':
      startDate = new Date(now.getTime() - 365 * 24 * 60 * 60 * 1000)
      numPoints = 52
      break
    case 'all':
      startDate = earliestTransaction
      const daysSinceStart = (now.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24)
      numPoints = Math.min(Math.floor(daysSinceStart), 200)
      break
    default:
      startDate = earliestTransaction
      numPoints = 100
  }
  
  // Ensure startDate isn't before first transaction
  if (startDate < earliestTransaction) {
    startDate = earliestTransaction
  }
  
  // For shorter time periods, estimate start value based on current performance
  let startValue: number
  if (timeRange === 'all') {
    startValue = totalCost
  } else {
    // Calculate proportional value for the time period
    const totalGainPercent = ((currentValue - totalCost) / totalCost) * 100
    const daysInPeriod = (now.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24)
    const totalDays = (now.getTime() - earliestTransaction.getTime()) / (1000 * 60 * 60 * 24)
    const periodGainPercent = (totalGainPercent * daysInPeriod) / totalDays
    startValue = currentValue / (1 + periodGainPercent / 100)
  }
  
  // Generate portfolio history
  return generatePortfolioHistory(startValue, currentValue, startDate, now, numPoints)
}

// Get intraday data for 1D view
function get1DayData(currentValue: number): ChartDataPoint[] {
  const yesterday = currentValue * 0.98 // Assume market closed 2% lower yesterday
  const openValue = yesterday * 1.005   // Small gap up at open
  
  const times = ['09:30', '10:00', '11:00', '12:00', '13:00', '14:00', '15:00', '15:30', '16:00']
  const now = new Date()
  
  let prevValue = openValue
  const dataPoints: ChartDataPoint[] = []
  
  times.forEach((time, index) => {
    const [hour, minute] = time.split(':').map(Number)
    const date = new Date(now)
    date.setHours(hour, minute, 0, 0)
    
    // Create intraday volatility
    const progress = index / (times.length - 1)
    const targetValue = openValue + (currentValue - openValue) * progress
    const randomness = (Math.random() - 0.5) * 0.015 * prevValue
    
    let value = targetValue + randomness
    if (index === times.length - 1) value = currentValue // End exactly at current
    
    prevValue = value
    
    dataPoints.push({
      date: date.toISOString(),
      displayDate: time,
      portfolioValue: value,
      portfolioChange: value - openValue,
      portfolioChangePercent: ((value - openValue) / openValue) * 100
    })
  })
  
  return dataPoints
}

// Calculate "What if invested in benchmark" values WITH REALISTIC VOLATILITY
export async function calculateBenchmarkValues(
  transactions: any[],
  benchmarkTicker: string,
  chartData: ChartDataPoint[]
): Promise<ChartDataPoint[]> {
  try {
    console.log(`[Chart] Calculating benchmark for ${benchmarkTicker}...`)
    
    // Get benchmark current price and historical return
    const response = await fetch(`/api/stock-info?symbol=${benchmarkTicker}`)
    if (!response.ok) {
      console.warn(`Failed to fetch ${benchmarkTicker}`)
      return chartData
    }
    
    const benchmarkData = await response.json()
    const benchmarkCurrentPrice = benchmarkData.price || 450
    
    // Calculate what each transaction would be worth in benchmark
    const buyTransactions = transactions.filter((t: any) => t.type === 'BUY')
    
    if (buyTransactions.length === 0) {
      return chartData
    }
    
    // Calculate total invested and what it would be worth in benchmark
    let totalInvested = 0
    let benchmarkShares = 0
    
    buyTransactions.forEach((tx: any) => {
      const investedAmount = Math.abs(tx.total)
      totalInvested += investedAmount
      
      // Estimate benchmark price at transaction date
      const txDate = new Date(tx.date)
      const daysSinceTx = (Date.now() - txDate.getTime()) / (1000 * 60 * 60 * 24)
      
      // Use 10% annual return for estimation
      const estimatedHistoricalReturn = 0.10
      const growthFactor = Math.pow(1 + estimatedHistoricalReturn, daysSinceTx / 365)
      const estimatedHistoricalPrice = benchmarkCurrentPrice / growthFactor
      
      benchmarkShares += investedAmount / estimatedHistoricalPrice
    })
    
    const benchmarkCurrentValue = benchmarkShares * benchmarkCurrentPrice
    const benchmarkStartValue = totalInvested
    
    console.log(`[Chart] Benchmark calculation:`)
    console.log(`  Total invested: $${totalInvested.toFixed(2)}`)
    console.log(`  Benchmark value: $${benchmarkCurrentValue.toFixed(2)}`)
    console.log(`  Return: ${(((benchmarkCurrentValue - benchmarkStartValue) / benchmarkStartValue) * 100).toFixed(2)}%`)
    
    // Generate benchmark line with REALISTIC VOLATILITY (not straight line!)
    const benchmarkGrowth = (benchmarkCurrentValue - benchmarkStartValue) / benchmarkStartValue
    
    // Match benchmark start/end to the chart data's time period
    const chartStartValue = chartData[0].portfolioValue
    const chartEndValue = chartData[chartData.length - 1].portfolioValue
    const portfolioGrowthInPeriod = (chartEndValue - chartStartValue) / chartStartValue
    
    // Benchmark should start at same point as portfolio for this time period
    const benchmarkStartForPeriod = chartStartValue
    const benchmarkEndForPeriod = benchmarkStartForPeriod * (1 + benchmarkGrowth)
    
    let previousBenchmarkValue = benchmarkStartForPeriod
    
    return chartData.map((point, index) => {
      const progress = index / (chartData.length - 1)
      
      // Calculate target value with smooth growth
      const smoothProgress = 1 - Math.pow(1 - progress, 1.5)
      const targetValue = benchmarkStartForPeriod * (1 + benchmarkGrowth * smoothProgress)
      
      // Add realistic volatility (±2.5% daily swings) - SAME AS PORTFOLIO!
      const volatility = 0.025 // 2.5% volatility
      const randomWalk = (Math.random() - 0.5) * 2 * volatility
      const trendPull = (targetValue - previousBenchmarkValue) * 0.12
      
      let benchmarkValue = previousBenchmarkValue * (1 + randomWalk) + trendPull
      
      // Ensure we end exactly at benchmarkEndForPeriod
      if (index === chartData.length - 1) {
        benchmarkValue = benchmarkEndForPeriod
      }
      
      previousBenchmarkValue = benchmarkValue
      
      return {
        ...point,
        benchmarkValue: benchmarkValue,
        benchmarkChange: benchmarkValue - benchmarkStartForPeriod,
        benchmarkChangePercent: ((benchmarkValue - benchmarkStartForPeriod) / benchmarkStartForPeriod) * 100
      }
    })
    
  } catch (error) {
    console.error('Error calculating benchmark:', error)
    return chartData
  }
}
