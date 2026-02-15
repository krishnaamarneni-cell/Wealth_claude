export interface Transaction {
  id: string
  date: string
  type: 'BUY' | 'SELL' | 'DIVIDEND' | 'DEPOSIT' | 'WITHDRAWAL'
  symbol: string
  shares: number
  price: number
  total: number
  broker: string
  fees: number
}

export interface Holding {
  symbol: string
  name: string
  shares: number
  avgCost: number
  totalCost: number
  currentPrice: number
  marketValue: number
  gainLoss: number
  gainLossPercent: number
  dividendYield?: number
}
