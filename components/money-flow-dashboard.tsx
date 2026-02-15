"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import {
  TrendingUp,
  TrendingDown,
  DollarSign,
  Coins,
  Gem,
  Droplet,
  Landmark,
  Bitcoin,
  Lightbulb
} from "lucide-react"

interface AssetClass {
  name: string
  symbol: string
  price: string
  change: number
  changePercent: number
  flow: 'bought' | 'sold' | 'neutral'
  icon: React.ReactNode
  color: string
}

// Mock data - represents TODAY's "risk-off" day where money flowed out of stocks into safety
const MOCK_ASSET_DATA: AssetClass[] = [
  {
    name: 'Stocks',
    symbol: 'SPY',
    price: '$498.20',
    change: -25.80,
    changePercent: -5.2,
    flow: 'sold',
    icon: <TrendingUp className="h-5 w-5" />,
    color: 'red'
  },
  {
    name: 'Bonds',
    symbol: 'AGG',
    price: '$102.40',
    change: 3.10,
    changePercent: 3.1,
    flow: 'bought',
    icon: <Landmark className="h-5 w-5" />,
    color: 'green'
  },
  {
    name: 'Gold',
    symbol: 'GLD',
    price: '$204.50',
    change: 4.00,
    changePercent: 2.0,
    flow: 'bought',
    icon: <Gem className="h-5 w-5" />,
    color: 'green'
  },
  {
    name: 'Crypto',
    symbol: 'BTC',
    price: '$51,240',
    change: 510,
    changePercent: 1.0,
    flow: 'bought',
    icon: <Bitcoin className="h-5 w-5" />,
    color: 'yellow'
  },
  {
    name: 'Oil',
    symbol: 'USO',
    price: '$72.50',
    change: 0.58,
    changePercent: 0.8,
    flow: 'bought',
    icon: <Droplet className="h-5 w-5" />,
    color: 'green'
  },
  {
    name: 'US Dollar',
    symbol: 'DXY',
    price: '103.45',
    change: -0.52,
    changePercent: -0.5,
    flow: 'sold',
    icon: <DollarSign className="h-5 w-5" />,
    color: 'red'
  },
]

// Rules-based narrative generation for TODAY
function generateNarrative(assets: AssetClass[]): string {
  const stocks = assets.find(a => a.symbol === 'SPY')
  const bonds = assets.find(a => a.symbol === 'AGG')
  const gold = assets.find(a => a.symbol === 'GLD')
  const crypto = assets.find(a => a.symbol === 'BTC')

  if (!stocks || !bonds || !gold || !crypto) return ''

  // Risk-off scenario: Stocks down, bonds/gold up
  if (stocks.changePercent < -3 && bonds.changePercent > 1 && gold.changePercent > 1) {
    return `Risk-off rotation today: Investors sold growth stocks (${stocks.changePercent.toFixed(1)}%) and moved capital into safe-haven assets like bonds (+${bonds.changePercent.toFixed(1)}%) and gold (+${gold.changePercent.toFixed(1)}%). This flight to safety suggests increased market uncertainty.`
  }

  // Risk-on scenario: Stocks up, bonds/gold down
  if (stocks.changePercent > 2 && bonds.changePercent < -1) {
    return `Risk-on rally today: Strong buying in equities (+${stocks.changePercent.toFixed(1)}%) as investors rotated out of defensive assets. This suggests growing confidence in economic growth and corporate earnings.`
  }

  // Crypto surge scenario
  if (crypto.changePercent > 5 && stocks.changePercent > 0) {
    return `Broad risk appetite today: Both traditional markets (+${stocks.changePercent.toFixed(1)}%) and crypto (+${crypto.changePercent.toFixed(1)}%) rallied, indicating strong investor confidence and liquidity flowing into risk assets across the board.`
  }

  // Mixed/choppy market
  return `Mixed signals today: Markets showed no clear directional bias with stocks ${stocks.changePercent > 0 ? 'up' : 'down'} ${Math.abs(stocks.changePercent).toFixed(1)}%. Investors appear cautious, waiting for clearer catalysts before making large allocation shifts.`
}

function formatChange(value: number): string {
  const sign = value >= 0 ? '+' : ''
  return `${sign}${value.toFixed(2)}%`
}

export default function MoneyFlowDashboard() {
  const assets = MOCK_ASSET_DATA
  const narrative = generateNarrative(assets)

  return (
    <Card className="border-border bg-card">
      <CardHeader>
        <CardTitle className="text-xl font-bold flex items-center gap-2">
          <Coins className="h-5 w-5 text-blue-500" />
          Money Flow Dashboard
        </CardTitle>
        <p className="text-sm text-muted-foreground">
          Track where money is flowing across major asset classes today
        </p>
      </CardHeader>

      <CardContent className="space-y-6">
        {/* Asset Class Performance Grid */}
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {assets.map((asset) => {
            const isPositive = asset.changePercent >= 0
            const bgColor = asset.color === 'green'
              ? 'bg-green-500/10 border-green-500/30'
              : asset.color === 'red'
                ? 'bg-red-500/10 border-red-500/30'
                : 'bg-yellow-500/10 border-yellow-500/30'

            const iconColor = asset.color === 'green'
              ? 'text-green-500'
              : asset.color === 'red'
                ? 'text-red-500'
                : 'text-yellow-500'

            return (
              <div
                key={asset.symbol}
                className={`p-4 rounded-lg border-2 transition-all hover:scale-105 ${bgColor}`}
              >
                {/* Header */}
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-2">
                    <div className={`p-2 rounded-full bg-background ${iconColor}`}>
                      {asset.icon}
                    </div>
                    <div>
                      <p className="font-bold text-sm">{asset.name}</p>
                      <p className="text-xs text-muted-foreground">{asset.symbol}</p>
                    </div>
                  </div>
                  {/* Flow Indicator */}
                  <div className="flex flex-col items-end">
                    {asset.flow === 'bought' && (
                      <TrendingUp className="h-4 w-4 text-green-500" />
                    )}
                    {asset.flow === 'sold' && (
                      <TrendingDown className="h-4 w-4 text-red-500" />
                    )}
                    <span className="text-[10px] text-muted-foreground uppercase mt-1">
                      {asset.flow}
                    </span>
                  </div>
                </div>

                {/* Price */}
                <p className="text-2xl font-bold mb-1">{asset.price}</p>

                {/* Change */}
                <div className="flex items-center gap-2">
                  <span className={`font-semibold text-sm ${isPositive ? 'text-green-500' : 'text-red-500'}`}>
                    {formatChange(asset.changePercent)}
                  </span>
                  <span className={`text-xs ${isPositive ? 'text-green-500' : 'text-red-500'}`}>
                    ({isPositive ? '+' : ''}{asset.change.toFixed(2)})
                  </span>
                </div>
              </div>
            )
          })}
        </div>

        {/* AI-Style Narrative */}
        <div className="p-4 rounded-lg bg-blue-500/10 border-2 border-blue-500/30">
          <div className="flex items-start gap-3">
            <div className="p-2 rounded-full bg-blue-500/20 mt-0.5">
              <Lightbulb className="h-5 w-5 text-blue-500" />
            </div>
            <div className="flex-1">
              <h4 className="font-semibold text-sm mb-1 flex items-center gap-2">
                Market Interpretation
              </h4>
              <p className="text-sm text-muted-foreground leading-relaxed">
                {narrative}
              </p>
            </div>
          </div>
        </div>

        {/* Quick Legend */}
        <div className="flex items-center justify-center gap-6 pt-2 text-xs text-muted-foreground">
          <div className="flex items-center gap-1">
            <TrendingUp className="h-3 w-3 text-green-500" />
            <span>Money flowing in</span>
          </div>
          <div className="flex items-center gap-1">
            <TrendingDown className="h-3 w-3 text-red-500" />
            <span>Money flowing out</span>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
