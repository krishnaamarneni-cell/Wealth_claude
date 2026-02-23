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
        <div className="flex gap-3 overflow-x-auto pb-1">
          {[...Array(7)].map((_, i) => (
            <div key={i} className="h-20 w-28 bg-secondary rounded-lg animate-pulse shrink-0" />
          ))}
        </div>
      </CardContent>
    </Card>
  )

  if (markets.length === 0) return null

  return (
    <Card className="border-border bg-card h-full">
      <CardHeader className="pb-2">
        <CardTitle className="text-base font-bold flex items-center gap-2">
          <Globe className="h-4 w-4 text-blue-500" />
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
        <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-hide">
          {markets.map((m) => {
            const up = m.changePercent >= 0
            return (
              <div
                key={m.symbol}
                className={`shrink-0 p-2.5 rounded-xl border-2 transition-all hover:scale-105 cursor-default min-w-[90px] ${up
                    ? "bg-green-500/5 border-green-500/20"
                    : "bg-red-500/5 border-red-500/20"
                  }`}
              >
                <div className="text-xl mb-1">{m.flag}</div>
                <p className="text-xs font-bold truncate">{m.region}</p>
                <p className="font-bold text-xs mt-1">${fmt(m.price)}</p>
                <div className={`flex items-center gap-0.5 text-xs font-semibold mt-0.5 ${up ? "text-green-500" : "text-red-500"
                  }`}>
                  {up
                    ? <TrendingUp className="h-2.5 w-2.5" />
                    : <TrendingDown className="h-2.5 w-2.5" />
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
