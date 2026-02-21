"use client"

import { useEffect, useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Globe, TrendingUp, TrendingDown } from "lucide-react"

interface GlobalMarket {
  flag: string
  label: string
  region: string
  symbol: string
  price: number
  change: number
  changePercent: number
}

function fmt(p: number): string {
  return p >= 100
    ? p.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })
    : p.toFixed(2)
}

export default function GlobalMarkets() {
  const [markets, setMarkets] = useState<GlobalMarket[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetch('/api/market-overview')
      .then(r => r.json())
      .then(data => { setMarkets(data.globalMarkets ?? []); setLoading(false) })
      .catch(() => setLoading(false))
  }, [])

  if (loading) return (
    <Card className="border-border bg-card">
      <CardHeader><div className="h-6 w-40 bg-secondary rounded animate-pulse" /></CardHeader>
      <CardContent>
        <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-7 gap-3">
          {[...Array(7)].map((_, i) => (
            <div key={i} className="h-20 bg-secondary rounded-lg animate-pulse" />
          ))}
        </div>
      </CardContent>
    </Card>
  )

  if (markets.length === 0) return null

  return (
    <Card className="border-border bg-card">
      <CardHeader>
        <CardTitle className="text-xl font-bold flex items-center gap-2">
          <Globe className="h-5 w-5 text-blue-500" />
          Global Markets
        </CardTitle>
        <p className="text-sm text-muted-foreground">Major equity markets around the world</p>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-7 gap-3">
          {markets.map(m => {
            const up = m.changePercent >= 0
            return (
              <div
                key={m.symbol}
                className={`p-3 rounded-xl border-2 transition-all hover:scale-105 cursor-default ${up ? 'bg-green-500/5 border-green-500/20' : 'bg-red-500/5 border-red-500/20'
                  }`}
              >
                <div className="text-2xl mb-1">{m.flag}</div>
                <p className="text-xs font-bold truncate">{m.region}</p>
                <p className="text-[10px] text-muted-foreground">{m.label}</p>
                <p className="font-bold text-sm mt-1">${fmt(m.price)}</p>
                <div className={`flex items-center gap-0.5 text-xs font-semibold mt-0.5 ${up ? 'text-green-500' : 'text-red-500'}`}>
                  {up ? <TrendingUp className="h-3 w-3" /> : <TrendingDown className="h-3 w-3" />}
                  {m.changePercent >= 0 ? '+' : ''}{m.changePercent.toFixed(2)}%
                </div>
              </div>
            )
          })}
        </div>
      </CardContent>
    </Card>
  )
}
