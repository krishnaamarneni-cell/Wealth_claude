// Mock portfolio data - In production, this would come from a database

export interface Holding {
  symbol: string
  name: string
  shares: number
  avgCost: number
  currentPrice: number
  marketValue: number
  costBasis: number
  allocation: number
  dailyChange: number
  dailyChangePercent: number
  totalGain: number
  totalGainPercent: number
  sector: string
  industry: string
  country: string
  assetType: 'Stock' | 'ETF'
  logo?: string
}

export interface PerformanceData {
  date: string
  portfolio: number
  sp500: number
  nasdaq: number
  dowjones: number
  russell2000: number
  totalmarket: number
  international: number
  savings: number
}

export interface DividendPayment {
  date: string
  symbol: string
  amount: number
  shares: number
  total: number
}

export interface Trade {
  date: string
  symbol: string
  type: 'BUY' | 'SELL'
  shares: number
  price: number
  total: number
  fees: number
}

export interface BenchmarkReturn {
  name: string
  id: string
  '1M': number | null
  '3M': number | null
  '6M': number | null
  'YTD': number | null
  '1Yr': number | null
  '2Yr': number | null
  '5Yr': number | null
  'All': number | null
  'Annualized': number | null
}

export interface HistoricalReturn {
  period: string
  portfolio: number
  benchmark?: number
}

export const portfolioSummary = {
  totalValue: 0,
  totalCost: 0,
  todayChange: 0,
  todayChangePercent: 0,
  yesterdayChange: 0,
  yesterdayChangePercent: 0,
  totalGain: 0,
  totalGainPercent: 0,
  unrealizedGains: 0,
  realizedGains: 0,
  dividends: 0,
  fees: 0,
  taxes: 0,
  interests: 0,
  lastUpdated: '',
}

export const keyStats = {
  allTimeHigh: 0,
  weekHigh52: 0,
  dividendYield: 0,
  maxDrawdown: 0,
  maxDrawdownDuration: 0,
  sharpeRatio: 0,
  beta: 0,
}

export const periodReturns = {
  '1W': { gain: 0, percent: 0 },
  '1M': { gain: 0, percent: 0 },
  '3M': { gain: 0, percent: 0 },
  '6M': { gain: 0, percent: 0 },
  'YTD': { gain: 0, percent: 0 },
  '1Y': { gain: 0, percent: 0 },
  'ALL': { gain: 0, percent: 0 },
}

export const holdings: Holding[] = []

// Historical performance data for charts (last 12 months) - scaled to realistic values
export const performanceHistory: PerformanceData[] = [
  { date: 'Jan 1', portfolio: 50, sp500: 50, nasdaq: 50, dowjones: 50, russell2000: 50, totalmarket: 50, international: 50, savings: 50 },
  { date: 'Feb 1', portfolio: 51.20, sp500: 50.80, nasdaq: 51.50, dowjones: 50.40, russell2000: 51.20, totalmarket: 50.90, international: 50.30, savings: 50.17 },
  { date: 'Mar 1', portfolio: 49.80, sp500: 49.20, nasdaq: 50.10, dowjones: 48.90, russell2000: 49.50, totalmarket: 49.30, international: 49.10, savings: 50.34 },
  { date: 'Apr 1', portfolio: 52.50, sp500: 51.80, nasdaq: 53.20, dowjones: 51.20, russell2000: 52.10, totalmarket: 51.90, international: 50.80, savings: 50.51 },
  { date: 'May 1', portfolio: 54.30, sp500: 53.20, nasdaq: 55.80, dowjones: 52.60, russell2000: 53.80, totalmarket: 53.40, international: 51.90, savings: 50.68 },
  { date: 'Jun 1', portfolio: 53.10, sp500: 52.40, nasdaq: 54.20, dowjones: 51.80, russell2000: 52.50, totalmarket: 52.70, international: 50.90, savings: 50.85 },
  { date: 'Jul 1', portfolio: 55.80, sp500: 54.90, nasdaq: 57.50, dowjones: 53.90, russell2000: 55.10, totalmarket: 54.80, international: 52.60, savings: 51.00 },
  { date: 'Aug 1', portfolio: 57.20, sp500: 56.10, nasdaq: 59.20, dowjones: 55.20, russell2000: 56.40, totalmarket: 56.10, international: 53.70, savings: 51.17 },
  { date: 'Sep 1', portfolio: 56.40, sp500: 55.30, nasdaq: 58.10, dowjones: 54.10, russell2000: 55.20, totalmarket: 55.20, international: 52.80, savings: 51.34 },
  { date: 'Oct 1', portfolio: 58.90, sp500: 57.60, nasdaq: 60.80, dowjones: 56.40, russell2000: 57.80, totalmarket: 57.50, international: 54.60, savings: 51.50 },
  { date: 'Nov 1', portfolio: 60.20, sp500: 58.90, nasdaq: 62.10, dowjones: 57.60, russell2000: 59.10, totalmarket: 58.80, international: 55.50, savings: 51.67 },
  { date: 'Dec 1', portfolio: 62.50, sp500: 60.30, nasdaq: 64.50, dowjones: 58.90, russell2000: 61.20, totalmarket: 60.50, international: 56.80, savings: 51.84 },
]

// NEW: Benchmark comparison data
export const benchmarkReturns: BenchmarkReturn[] = []

// NEW: Available benchmarks with metadata
export const availableBenchmarks = [
  { id: 'sp500', name: 'S&P 500', region: 'US', description: 'Top 500 US companies' },
  { id: 'nasdaq', name: 'NASDAQ', region: 'US', description: 'Tech-heavy US index' },
  { id: 'nyse', name: 'NYSE', region: 'US', description: 'NYSE Composite Index' },
  { id: 'spy', name: 'SPY ETF', region: 'US', description: 'S&P 500 ETF' },
  { id: 'nifty50', name: 'NIFTY 50', region: 'India', description: 'Top 50 Indian companies' },
  { id: 'nifty100', name: 'NIFTY 100', region: 'India', description: 'Top 100 Indian companies' },
  { id: 'nifty500', name: 'NIFTY 500', region: 'India', description: 'Top 500 Indian companies' },
  { id: 'sensex', name: 'SENSEX', region: 'India', description: 'BSE Sensex 30' },
  { id: 'ftse100', name: 'FTSE 100', region: 'UK', description: 'Top 100 UK companies' },
  { id: 'dax', name: 'DAX', region: 'Germany', description: 'German stock index' },
]

// NEW: Historical returns data (Monthly/Quarterly/Yearly)
export const historicalReturnsMonthly: HistoricalReturn[] = []

export const historicalReturnsQuarterly: HistoricalReturn[] = []

export const historicalReturnsYearly: HistoricalReturn[] = []

export const sectorAllocation = [
  { name: 'Technology', value: 74.26, marketValue: 44711.50, costBasis: 33187.00, gain: 11524.50 },
  { name: 'Consumer Cyclical', value: 18.66, marketValue: 11233.50, costBasis: 9311.00, gain: 1922.50 },
  { name: 'Financial', value: 12.67, marketValue: 7633.00, costBasis: 5950.00, gain: 1683.00 },
  { name: 'Diversified', value: 4.17, marketValue: 2512.50, costBasis: 2250.00, gain: 262.50 },
]

export const industryAllocation = [
  { name: 'Consumer Electronics', value: 14.82, marketValue: 8925.00 },
  { name: 'Software', value: 18.84, marketValue: 11346.00 },
  { name: 'Internet Services', value: 9.42, marketValue: 5672.00 },
  { name: 'Semiconductors', value: 28.33, marketValue: 17062.50 },
  { name: 'E-Commerce', value: 10.40, marketValue: 6261.50 },
  { name: 'Auto Manufacturers', value: 8.26, marketValue: 4972.00 },
  { name: 'Banking', value: 8.10, marketValue: 4880.00 },
  { name: 'Payment Services', value: 4.57, marketValue: 2753.00 },
  { name: 'Index Fund', value: 7.02, marketValue: 4227.50 },
]

export const countryAllocation = [
  { name: 'USA', value: 100, marketValue: 60219.77 },
]

export const assetTypeAllocation = [
  { name: 'Stocks', value: 92.98, marketValue: 55992.27 },
  { name: 'ETFs', value: 7.02, marketValue: 4227.50 },
]

export const dividendHistory: DividendPayment[] = []

export const tradeHistory: Trade[] = []

export const goalTracker = {
  targetValue: 100000,
  currentValue: 60219.77,
  targetDate: '2028-01-01',
  monthlyContribution: 500,
  projectedCompletion: '2027-08-15',
  progressPercent: 60.22,
}

export const rebalanceRecommendations = []
