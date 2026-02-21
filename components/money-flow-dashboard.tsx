"use client"

import { useEffect, useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { TrendingUp, TrendingDown, DollarSign, Coins, Gem, Droplet, Landmark, Bitcoin, Lightbulb } from "lucide-react"

interface AssetClass {
  name: string
  symbol: string
  price: string
  changePercent: number
  flow: 'bought' | 'sold' | 'neutral'
  color: 'green' | 'red' | 'yellow' | 'neutral'
  icon: React.ReactNode
}

function fmtPrice(price: number, isCrypto = false): string {
  if (isCrypto && price >= 1000) return `$${price.toLocaleString('en-US', { maximumFractionDigits: 0 })}`
  return `$${price.toFixed(2)}`
}

function fmtPct(v: number): string {
  return `${v >= 0 ? '+' : ''}${v.toFixed(2)}%`
}

function generateNarrative(assets: AssetClass[]): string {
  const stocks = assets.find(a => a.symbol === 'SPY')
  const bonds = assets.find(a => a.symbol === 'AGG')
  const gold = assets.find(a => a.symbol === 'GLD')
  const crypto = assets.find(a => a.symbol === 'BTC')
  if (!stocks) return 'Loading market interpretation...'

  if (stocks.changePercent < -3 && (bonds?.changePercent ?? 0) > 1 && (gold?.changePercent ?? 0) > 0) {
    return `Risk-off rotation today: Investors fled growth stocks (${fmtPct(stocks.changePercent)}) into safe-haven assets like bonds and gold. This flight to safety signals elevated market uncertainty.`
  }
  if (stocks.changePercent > 2 && (bonds?.changePercent ?? 0) < 0) {
    return `Risk-on rally today: Strong buying in equities (${fmtPct(stocks.changePercent)}) as investors rotated out of defensive assets. This signals growing confidence in economic growth.`
  }
  if ((crypto?.changePercent ?? 0) > 5 && stocks.changePercent > 0) {
    return `Broad risk appetite today: Both equities (${fmtPct(stocks.changePercent)}) and crypto (${fmtPct(crypto!.changePercent)}) rallied, indicating strong investor confidence and liquidity flowing into risk assets.`
  }
  if (stocks.changePercent > 0.5) {
    return `Positive session today: Equities moved higher by ${fmtPct(stocks.changePercent)}. Investor sentiment remains constructive with modest buying across asset classes.`
  }
  if (stocks.changePercent < -0.5) {
    return `Cautious session today: Stocks pulled back ${fmtPct(stocks.changePercent)}. Investors appear to be reassessing risk positions ahead of upcoming catalysts.`
  }
  return `Mixed signals today: Markets showed no clear directional bias with stocks ${fmtPct(stocks.changePercent)}. Investors appear cautious, waiting for clearer catalysts before making large allocation shifts.`
}

function LoadingSkeleton() {
  return (
    <Card className="border-border bg-card">
      <CardHeader>
        <div className="h-6 w-48 bg-secondary rounded animate-pulse" />
        <div className="h-4 w-64 bg-secondary rounded animate-pulse mt-1" />
      </CardHeader>
      <CardContent>
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {[...Array(6)].map((_, i) => (
            <div key={i} className="h-28 bg-secondary rounded-lg animate-pulse" />
          ))}
        </div>
        <div className="h-20 bg-secondary rounded-lg animate-pulse mt-6" />
      </CardContent>
    </Card>
  )
}

export default function MoneyFlowDashboard() {
  const [assets, setAssets] = useState<AssetClass[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(false)

  useEffect(() => {
    fetch('/api/market-overview')
      .then(r => r.json())
      .then(({ ticker }) => {
        const flow = (pct: number): 'bought' | 'sold' | 'neutral' =>
          pct > 0.1 ? 'bought' : pct < -0.1 ? 'sold' : 'neutral'
        const color = (pct: number): 'green' | 'red' =>
          pct >= 0 ? 'green' : 'red'

        const built: AssetClass[] = []

        if (ticker.sp500) built.push({
          name: 'Stocks', symbol: 'SPY',
          price: `$${ticker.sp500.price.toFixed(2)}`,
          changePercent: ticker.sp500.changePercent,
          flow: flow(ticker.sp500.changePercent),
          color: color(ticker.sp500.changePercent),
          icon: <TrendingUp className="h-5 w-5" />,
        })
        if (ticker.bonds) built.push({
          name: 'Bonds', symbol: 'AGG',
          price: `$${ticker.bonds.price.toFixed(2)}`,
          changePercent: ticker.bonds.changePercent,
          flow: flow(ticker.bonds.changePercent),
          color: color(ticker.bonds.changePercent),
          icon: <Landmark className="h-5 w-5" />,
        })
        if (ticker.gold) built.push({
          name: 'Gold', symbol: 'GLD',
          price: `$${ticker.gold.price.toFixed(2)}`,
          changePercent: ticker.gold.changePercent,
          flow: flow(ticker.gold.changePercent),
          color: color(ticker.gold.changePercent),
          icon: <Gem className="h-5 w-5" />,
        })
        if (ticker.bitcoin) built.push({
          name: 'Crypto', symbol: 'BTC',
          price: fmtPrice(ticker.bitcoin.price, true),
          changePercent: ticker.bitcoin.changePercent,
          flow: flow(ticker.bitcoin.changePercent),
          color: 'yellow',
          icon: <Bitcoin className="h-5 w-5" />,
        })
        if (ticker.oil) built.push({
          name: 'Oil', symbol: 'USO',
          price: `$${ticker.oil.price.toFixed(2)}`,
          changePercent: ticker.oil.changePercent,
          flow: flow(ticker.oil.changePercent),
          color: color(ticker.oil.changePercent),
          icon: <Droplet className="h-5 w-5" />,
        })
        if (ticker.usdDollar) built.push({
          name: 'US Dollar', symbol: 'UUP',
          price: `$${ticker.usdDollar.price.toFixed(2)}`,
          changePercent: ticker.usdDollar.changePercent,
          flow: flow(ticker.usdDollar.changePercent),
          color: color(ticker.usdDollar.changePercent),
          icon: <DollarSign className="h-5 w-5" />,
        })

        setAssets(built)
        setLoading(false)
      })
      .catch(() => { setError(true); setLoading(false) })
  }, [])

  if (loading) return <LoadingSkeleton />
  if (error || assets.length === 0) return (
    <Card className="border-border bg-card">
      <CardContent className="p-8 text-center text-muted-foreground">
        Unable to load money flow data
      </CardContent>
    </Card>
  )

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
        {/* Asset Grid */}
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {assets.map(asset => {
            const isPos = asset.changePercent >= 0
            const bgBorder =
              asset.color === 'green' ? 'bg-green-500/10 border-green-500/30' :
                asset.color === 'red' ? 'bg-red-500/10 border-red-500/30' :
                  'bg-yellow-500/10 border-yellow-500/30'
            const iconColor =
              asset.color === 'green' ? 'text-green-500' :
                asset.color === 'red' ? 'text-red-500' :
                  'text-yellow-500'

            return (
              <div key={asset.symbol} className={`p-4 rounded-lg border-2 transition-all hover:scale-105 ${bgBorder}`}>
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
                  <div className="flex flex-col items-end">
                    {asset.flow === 'bought' && <TrendingUp className="h-4 w-4 text-green-500" />}
                    {asset.flow === 'sold' && <TrendingDown className="h-4 w-4 text-red-500" />}
                    <span className="text-[10px] text-muted-foreground uppercase mt-1">{asset.flow}</span>
                  </div>
                </div>
                <p className="text-2xl font-bold mb-1">{asset.price}</p>
                <span className={`font-semibold text-sm ${isPos ? 'text-green-500' : 'text-red-500'}`}>
                  {fmtPct(asset.changePercent)}
                </span>
              </div>
            )
          })}
        </div>

        {/* Narrative */}
        <div className="p-4 rounded-lg bg-blue-500/10 border-2 border-blue-500/30">
          <div className="flex items-start gap-3">
            <div className="p-2 rounded-full bg-blue-500/20 mt-0.5">
              <Lightbulb className="h-5 w-5 text-blue-500" />
            </div>
            <div>
              <h4 className="font-semibold text-sm mb-1">Market Interpretation</h4>
              <p className="text-sm text-muted-foreground leading-relaxed">{narrative}</p>
            </div>
          </div>
        </div>

        {/* Legend */}
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
