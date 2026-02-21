"use client"

import { useEffect, useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { TrendingUp, TrendingDown, Sparkles, RefreshCw } from "lucide-react"
import { usePortfolio } from "@/lib/portfolio-context"

type IndexKey = 'sp500' | 'nasdaq' | 'dow'

interface Mover {
  symbol: string; name: string; price: number; change: number; changePercent: number
}

interface MoversData {
  sp500: { gainers: Mover[]; losers: Mover[] }
  nasdaq: { gainers: Mover[]; losers: Mover[] }
  dow: { gainers: Mover[]; losers: Mover[] }
  source?: string
  timestamp?: number
}

const INDEXES: { value: IndexKey; label: string }[] = [
  { value: 'sp500', label: 'S&P 500' },
  { value: 'nasdaq', label: 'Nasdaq 100' },
  { value: 'dow', label: 'Dow 30' },
]

export default function MarketMovers() {
  const { holdings } = usePortfolio()
  const [data, setData] = useState<MoversData | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(false)
  const [selected, setSelected] = useState<IndexKey>('sp500')

  const userSymbols = new Set(holdings.map(h => h.symbol))

  useEffect(() => {
    fetch('/api/market-movers')
      .then(r => r.json())
      .then(d => {
        if (d.error && !d.sp500?.gainers?.length) { setError(true) }
        else setData(d)
        setLoading(false)
      })
      .catch(() => { setError(true); setLoading(false) })
  }, [])

  if (loading) return (
    <Card className="border-border bg-card">
      <CardHeader><div className="h-6 w-40 bg-secondary rounded animate-pulse" /></CardHeader>
      <CardContent>
        <div className="grid lg:grid-cols-2 gap-6">
          {[0, 1].map(c => (
            <div key={c} className="space-y-3">
              {[...Array(5)].map((_, i) => <div key={i} className="h-16 bg-secondary rounded-lg animate-pulse" />)}
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  )

  if (error || !data) return (
    <Card className="border-border bg-card">
      <CardContent className="p-8 text-center">
        <TrendingUp className="h-10 w-10 text-muted-foreground mx-auto mb-2 opacity-30" />
        <p className="text-muted-foreground">Unable to load market movers</p>
        <p className="text-xs text-muted-foreground mt-1">Polygon requires a paid plan · Finnhub fallback also failed</p>
      </CardContent>
    </Card>
  )

  const current = data[selected]

  const MoverRow = ({ stock, side }: { stock: Mover; side: 'gain' | 'loss' }) => {
    const youOwn = userSymbols.has(stock.symbol)
    const isGain = side === 'gain'
    return (
      <div className={`p-4 rounded-lg transition-all border ${youOwn
          ? isGain ? 'bg-green-500/10 border-green-500/30' : 'bg-red-500/10 border-red-500/30'
          : 'bg-secondary/50 hover:bg-secondary border-transparent'
        }`}>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-muted flex items-center justify-center shrink-0">
              <span className="font-bold text-sm">{stock.symbol.slice(0, 2)}</span>
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-bold">{stock.symbol}</span>
                {youOwn && (
                  <Badge variant="secondary" className={`text-white text-xs ${isGain ? 'bg-green-500' : 'bg-red-500'}`}>
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
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
          <CardTitle className="text-xl font-bold flex items-center gap-2">
            <Sparkles className="h-5 w-5 text-yellow-500" />
            Market Movers
          </CardTitle>
          <div className="flex items-center gap-3">
            {/* Index Selector */}
            <div className="flex gap-1 bg-secondary rounded-lg p-1">
              {INDEXES.map(idx => (
                <Button
                  key={idx.value}
                  variant={selected === idx.value ? 'default' : 'ghost'}
                  size="sm"
                  onClick={() => setSelected(idx.value)}
                  className="h-8 px-3 text-xs"
                >
                  {idx.label}
                </Button>
              ))}
            </div>
            {data.source && (
              <span className="text-xs text-muted-foreground bg-secondary px-2 py-1 rounded-full">
                via {data.source}
              </span>
            )}
          </div>
        </div>
      </CardHeader>

      <CardContent>
        <div className="grid lg:grid-cols-2 gap-6">
          <div className="space-y-3">
            <div className="flex items-center gap-2 mb-4">
              <TrendingUp className="h-5 w-5 text-green-500" />
              <h3 className="font-semibold text-lg">Top Gainers</h3>
              <span className="text-xs text-muted-foreground">{INDEXES.find(i => i.value === selected)?.label}</span>
            </div>
            {current.gainers.length > 0
              ? current.gainers.map(s => <MoverRow key={s.symbol} stock={s} side="gain" />)
              : <p className="text-sm text-muted-foreground text-center py-4">No gainers data</p>
            }
          </div>

          <div className="space-y-3">
            <div className="flex items-center gap-2 mb-4">
              <TrendingDown className="h-5 w-5 text-red-500" />
              <h3 className="font-semibold text-lg">Top Losers</h3>
              <span className="text-xs text-muted-foreground">{INDEXES.find(i => i.value === selected)?.label}</span>
            </div>
            {current.losers.length > 0
              ? current.losers.map(s => <MoverRow key={s.symbol} stock={s} side="loss" />)
              : <p className="text-sm text-muted-foreground text-center py-4">No losers data</p>
            }
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
