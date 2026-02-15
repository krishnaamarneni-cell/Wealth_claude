"use client"

import { useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { TrendingUp, TrendingDown, Sparkles } from "lucide-react"
import { usePortfolio } from "@/lib/portfolio-context"
import Image from "next/image"

type IndexType = 'sp500' | 'nasdaq' | 'dow'

interface Mover {
  symbol: string
  name: string
  price: number
  change: number
  changePercent: number
  logo?: string
}

const INDEXES = [
  { value: 'sp500' as IndexType, label: 'S&P 500' },
  { value: 'nasdaq' as IndexType, label: 'Nasdaq' },
  { value: 'dow' as IndexType, label: 'Dow Jones' },
]

// Mock data - TODAY only
const MOCK_GAINERS: Record<IndexType, Mover[]> = {
  sp500: [
    { symbol: 'NVDA', name: 'Nvidia Corp', price: 920.50, change: 72.30, changePercent: 8.5 },
    { symbol: 'AMD', name: 'Advanced Micro Devices', price: 185.20, change: 11.00, changePercent: 6.3 },
    { symbol: 'AVGO', name: 'Broadcom Inc', price: 1420.30, change: 69.50, changePercent: 5.1 },
    { symbol: 'TSLA', name: 'Tesla Inc', price: 195.80, change: 9.20, changePercent: 4.9 },
    { symbol: 'MSFT', name: 'Microsoft Corp', price: 412.50, change: 18.30, changePercent: 4.6 },
  ],
  nasdaq: [
    { symbol: 'SMCI', name: 'Super Micro Computer', price: 1120.00, change: 85.00, changePercent: 8.2 },
    { symbol: 'NVDA', name: 'Nvidia Corp', price: 920.50, change: 72.30, changePercent: 8.5 },
    { symbol: 'MRVL', name: 'Marvell Technology', price: 72.40, change: 4.80, changePercent: 7.1 },
    { symbol: 'AMAT', name: 'Applied Materials', price: 185.60, change: 11.20, changePercent: 6.4 },
    { symbol: 'AMD', name: 'Advanced Micro Devices', price: 185.20, change: 11.00, changePercent: 6.3 },
  ],
  dow: [
    { symbol: 'NVDA', name: 'Nvidia Corp', price: 920.50, change: 72.30, changePercent: 8.5 },
    { symbol: 'MSFT', name: 'Microsoft Corp', price: 412.50, change: 18.30, changePercent: 4.6 },
    { symbol: 'JPM', name: 'JPMorgan Chase', price: 182.30, change: 7.50, changePercent: 4.3 },
    { symbol: 'UNH', name: 'UnitedHealth Group', price: 525.80, change: 19.40, changePercent: 3.8 },
    { symbol: 'V', name: 'Visa Inc', price: 278.90, change: 9.60, changePercent: 3.6 },
  ],
}

const MOCK_LOSERS: Record<IndexType, Mover[]> = {
  sp500: [
    { symbol: 'TSLA', name: 'Tesla Inc', price: 195.50, change: -13.20, changePercent: -6.2 },
    { symbol: 'META', name: 'Meta Platforms', price: 485.30, change: -20.80, changePercent: -4.1 },
    { symbol: 'AAPL', name: 'Apple Inc', price: 178.50, change: -7.20, changePercent: -3.8 },
    { symbol: 'GOOGL', name: 'Alphabet Inc', price: 142.80, change: -5.30, changePercent: -3.6 },
    { symbol: 'NFLX', name: 'Netflix Inc', price: 612.40, change: -21.50, changePercent: -3.4 },
  ],
  nasdaq: [
    { symbol: 'RIVN', name: 'Rivian Automotive', price: 12.40, change: -0.92, changePercent: -6.9 },
    { symbol: 'TSLA', name: 'Tesla Inc', price: 195.50, change: -13.20, changePercent: -6.2 },
    { symbol: 'LCID', name: 'Lucid Group', price: 3.20, change: -0.21, changePercent: -6.1 },
    { symbol: 'META', name: 'Meta Platforms', price: 485.30, change: -20.80, changePercent: -4.1 },
    { symbol: 'AAPL', name: 'Apple Inc', price: 178.50, change: -7.20, changePercent: -3.8 },
  ],
  dow: [
    { symbol: 'BA', name: 'Boeing Co', price: 172.30, change: -8.40, changePercent: -4.6 },
    { symbol: 'DIS', name: 'Walt Disney Co', price: 98.50, change: -4.20, changePercent: -4.1 },
    { symbol: 'HD', name: 'Home Depot', price: 342.80, change: -12.60, changePercent: -3.5 },
    { symbol: 'MCD', name: 'McDonald\'s Corp', price: 287.40, change: -9.80, changePercent: -3.3 },
    { symbol: 'NKE', name: 'Nike Inc', price: 102.50, change: -3.30, changePercent: -3.1 },
  ],
}

function formatCurrency(value: number): string {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(value)
}

function formatPercent(value: number): string {
  return `${value >= 0 ? '+' : ''}${value.toFixed(2)}%`
}

export default function MarketMovers() {
  const { holdings } = usePortfolio()
  const [selectedIndex, setSelectedIndex] = useState<IndexType>('sp500')

  // Get user's holdings symbols
  const userSymbols = new Set(holdings.map(h => h.symbol))

  // Get top movers for selected index
  const topGainers = MOCK_GAINERS[selectedIndex]
  const topLosers = MOCK_LOSERS[selectedIndex]

  return (
    <Card className="border-border bg-card">
      <CardHeader>
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
          {/* Title */}
          <CardTitle className="text-xl font-bold flex items-center gap-2">
            <Sparkles className="h-5 w-5 text-yellow-500" />
            Market Movers
          </CardTitle>

          {/* Index Selector */}
          <div className="flex gap-1 bg-secondary rounded-lg p-1">
            {INDEXES.map(index => (
              <Button
                key={index.value}
                variant={selectedIndex === index.value ? 'default' : 'ghost'}
                size="sm"
                onClick={() => setSelectedIndex(index.value)}
                className="h-8 px-3"
              >
                {index.label}
              </Button>
            ))}
          </div>
        </div>
      </CardHeader>

      <CardContent>
        <div className="grid lg:grid-cols-2 gap-6">
          {/* TOP GAINERS */}
          <div className="space-y-3">
            <div className="flex items-center gap-2 mb-4">
              <TrendingUp className="h-5 w-5 text-green-500" />
              <h3 className="font-semibold text-lg">Top 5 Gainers</h3>
            </div>

            {topGainers.map((stock) => {
              const youOwn = userSymbols.has(stock.symbol)

              return (
                <div
                  key={stock.symbol}
                  className={`p-4 rounded-lg transition-all ${youOwn
                      ? 'bg-green-500/10 border-2 border-green-500/30'
                      : 'bg-secondary/50 hover:bg-secondary'
                    }`}
                >
                  <div className="flex items-center justify-between">
                    {/* Left: Stock Info */}
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-full bg-muted flex items-center justify-center">
                        <span className="font-bold text-sm">{stock.symbol.slice(0, 2)}</span>
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="font-bold">{stock.symbol}</span>
                          {youOwn && (
                            <Badge variant="secondary" className="bg-green-500 text-white text-xs">
                              YOU OWN ✓
                            </Badge>
                          )}
                        </div>
                        <p className="text-xs text-muted-foreground">{stock.name}</p>
                      </div>
                    </div>

                    {/* Right: Price & Change */}
                    <div className="text-right">
                      <p className="font-bold text-lg">{formatCurrency(stock.price)}</p>
                      <p className="text-green-500 font-semibold text-sm">
                        {formatCurrency(stock.change)} ({formatPercent(stock.changePercent)})
                      </p>
                    </div>
                  </div>
                </div>
              )
            })}
          </div>

          {/* TOP LOSERS */}
          <div className="space-y-3">
            <div className="flex items-center gap-2 mb-4">
              <TrendingDown className="h-5 w-5 text-red-500" />
              <h3 className="font-semibold text-lg">Top 5 Losers</h3>
            </div>

            {topLosers.map((stock) => {
              const youOwn = userSymbols.has(stock.symbol)

              return (
                <div
                  key={stock.symbol}
                  className={`p-4 rounded-lg transition-all ${youOwn
                      ? 'bg-red-500/10 border-2 border-red-500/30'
                      : 'bg-secondary/50 hover:bg-secondary'
                    }`}
                >
                  <div className="flex items-center justify-between">
                    {/* Left: Stock Info */}
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-full bg-muted flex items-center justify-center">
                        <span className="font-bold text-sm">{stock.symbol.slice(0, 2)}</span>
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="font-bold">{stock.symbol}</span>
                          {youOwn && (
                            <Badge variant="secondary" className="bg-red-500 text-white text-xs">
                              YOU OWN ✓
                            </Badge>
                          )}
                        </div>
                        <p className="text-xs text-muted-foreground">{stock.name}</p>
                      </div>
                    </div>

                    {/* Right: Price & Change */}
                    <div className="text-right">
                      <p className="font-bold text-lg">{formatCurrency(stock.price)}</p>
                      <p className="text-red-500 font-semibold text-sm">
                        {formatCurrency(stock.change)} ({formatPercent(stock.changePercent)})
                      </p>
                    </div>
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
