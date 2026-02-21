"use client"

import { useEffect, useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { TrendingUp, TrendingDown, Sparkles, RefreshCw } from "lucide-react"
import { usePortfolio } from "@/lib/portfolio-context"

interface Mover {
  symbol: string
  name: string
  price: number
  change: number
  changePercent: number
}

function LoadingSkeleton() {
  return (
    <Card className="border-border bg-card">
      <CardHeader>
        <div className="h-6 w-40 bg-secondary rounded animate-pulse" />
      </CardHeader>
      <CardContent>
        <div className="grid lg:grid-cols-2 gap-6">
          {[0, 1].map(col => (
            <div key={col} className="space-y-3">
              {[...Array(5)].map((_, i) => (
                <div key={i} className="h-16 bg-secondary rounded-lg animate-pulse" />
              ))}
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  )
}

export default function MarketMovers() {
  const { holdings } = usePortfolio()
  const [gainers, setGainers] = useState<Mover[]>([])
  const [losers, setLosers] = useState<Mover[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(false)
  const [ts, setTs] = useState<number | null>(null)

  const userSymbols = new Set(holdings.map(h => h.symbol))

  useEffect(() => {
    fetch('/api/market-movers')
      .then(r => r.json())
      .then(data => {
        if (data.error && !data.gainers?.length) {
          setError(true)
        } else {
          setGainers(data.gainers ?? [])
          setLosers(data.losers ?? [])
          setTs(data.timestamp)
        }
        setLoading(false)
      })
      .catch(() => { setError(true); setLoading(false) })
  }, [])

  if (loading) return <LoadingSkeleton />
  if (error) return (
    <Card className="border-border bg-card">
      <CardContent className="p-8 text-center">
        <p className="text-muted-foreground">Unable to load market movers</p>
        <p className="text-xs text-muted-foreground mt-1">Polygon API may require a paid plan for this endpoint</p>
      </CardContent>
    </Card>
  )

  const MoverRow = ({ stock, side }: { stock: Mover; side: 'gain' | 'loss' }) => {
    const youOwn = userSymbols.has(stock.symbol)
    const isGain = side === 'gain'
    const bgClass = youOwn
      ? isGain ? 'bg-green-500/10 border-2 border-green-500/30' : 'bg-red-500/10 border-2 border-red-500/30'
      : 'bg-secondary/50 hover:bg-secondary border border-transparent'

    return (
      <div className={`p-4 rounded-lg transition-all ${bgClass}`}>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-muted flex items-center justify-center shrink-0">
              <span className="font-bold text-sm">{stock.symbol.slice(0, 2)}</span>
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-bold">{stock.symbol}</span>
                {youOwn && (
                  <Badge
                    variant="secondary"
                    className={`text-white text-xs ${isGain ? 'bg-green-500' : 'bg-red-500'}`}
                  >
                    YOU OWN ✓
                  </Badge>
                )}
              </div>
              <p className="text-xs text-muted-foreground truncate max-w-[160px]">{stock.name}</p>
            </div>
          </div>
          <div className="text-right">
            <p className="font-bold text-lg">
              ${stock.price >= 1000
                ? stock.price.toLocaleString('en-US', { maximumFractionDigits: 2 })
                : stock.price.toFixed(2)
              }
            </p>
            <p className={`font-semibold text-sm ${isGain ? 'text-green-500' : 'text-red-500'}`}>
              {stock.changePercent >= 0 ? '+' : ''}{stock.changePercent.toFixed(2)}%
            </p>
          </div>
        </div>
      </div>
    )
  }

  return (
    <Card className="border-border bg-card">
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="text-xl font-bold flex items-center gap-2">
            <Sparkles className="h-5 w-5 text-yellow-500" />
            Market Movers
          </CardTitle>
          <div className="flex items-center gap-2">
            <span className="text-xs text-muted-foreground bg-secondary px-2 py-1 rounded-full">
              US Market · NYSE & Nasdaq
            </span>
            {ts && (
              <span className="text-xs text-muted-foreground flex items-center gap-1">
                <RefreshCw className="h-3 w-3" />
                {new Date(ts).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })}
              </span>
            )}
          </div>
        </div>
      </CardHeader>

      <CardContent>
        <div className="grid lg:grid-cols-2 gap-6">
          {/* Gainers */}
          <div className="space-y-3">
            <div className="flex items-center gap-2 mb-4">
              <TrendingUp className="h-5 w-5 text-green-500" />
              <h3 className="font-semibold text-lg">Top Gainers</h3>
            </div>
            {gainers.slice(0, 5).map(stock => (
              <MoverRow key={stock.symbol} stock={stock} side="gain" />
            ))}
          </div>

          {/* Losers */}
          <div className="space-y-3">
            <div className="flex items-center gap-2 mb-4">
              <TrendingDown className="h-5 w-5 text-red-500" />
              <h3 className="font-semibold text-lg">Top Losers</h3>
            </div>
            {losers.slice(0, 5).map(stock => (
              <MoverRow key={stock.symbol} stock={stock} side="loss" />
            ))}
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
