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
    ? p.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })
    : p.toFixed(2)
}

export default function GlobalMarkets({ compact = false }: { compact?: boolean }) {
  const [markets, setMarkets] = useState<GlobalMarket[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetch("/api/market-overview")
      .then((r) => r.json())
      .then((data) => { setMarkets(data.globalMarkets ?? []); setLoading(false) })
      .catch(() => setLoading(false))
  }, [])

  if (loading) return (
    <Card className="border-border bg-card">
      <CardHeader>
        <div className="h-6 w-40 bg-secondary rounded animate-pulse" />
      </CardHeader>
      <CardContent>
        <div className="flex gap-4 overflow-x-auto pb-1">
          {[...Array(7)].map((_, i) => (
            <div key={i} className="h-36 w-44 bg-secondary rounded-lg animate-pulse shrink-0" />
          ))}
        </div>
      </CardContent>
    </Card>
  )

  if (markets.length === 0) return null

  return (
    <Card className="border-border bg-card h-full">
      <CardHeader className="pb-3">
        <CardTitle className="text-lg font-bold flex items-center gap-2">
          <Globe className="h-5 w-5 text-blue-500" />
          Global Markets
        </CardTitle>
        {!compact && (
          <p className="text-sm text-muted-foreground">
            Major equity markets around the world
          </p>
        )}
      </CardHeader>
      <CardContent>
        {/* Scrollable single row */}
        <div className="flex gap-4 overflow-x-auto pb-2 scrollbar-hide">
          {markets.map((m) => {
            const up = m.changePercent >= 0
            return (
              <div
                key={m.symbol}
                className={`shrink-0 p-4 rounded-xl border-2 transition-all hover:scale-105 cursor-default min-w-[160px] ${up
                    ? "bg-green-500/5 border-green-500/20"
                    : "bg-red-500/5 border-red-500/20"
                  }`}
              >
                <div className="text-3xl mb-2">{m.flag}</div>
                <p className="text-xs font-bold text-muted-foreground uppercase tracking-wider">{m.label}</p>
                <p className="text-sm font-semibold truncate mt-0.5">{m.region}</p>
                <p className="font-bold text-xl mt-2">${fmt(m.price)}</p>
                <div className={`flex items-center gap-1 text-sm font-semibold mt-1 ${up ? "text-green-500" : "text-red-500"
                  }`}>
                  {up
                    ? <TrendingUp className="h-4 w-4" />
                    : <TrendingDown className="h-4 w-4" />
                  }
                  {m.changePercent >= 0 ? "+" : ""}
                  {m.changePercent.toFixed(2)}%
                </div>
              </div>
            )
          })}
        </div>
      </CardContent>
    </Card>
  )
}
