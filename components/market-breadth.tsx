"use client"

import { useEffect, useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Activity, TrendingUp, TrendingDown, Minus } from "lucide-react"

const SP500_WEIGHTS: Record<string, number> = {
  'Technology': 28.5, 'Healthcare': 13.2,
  'Financials': 12.8, 'Consumer Discretionary': 10.5,
  'Communication Services': 8.9, 'Industrials': 8.4,
  'Consumer Staples': 6.8, 'Energy': 4.2,
  'Utilities': 2.8, 'Real Estate': 2.5,
  'Materials': 2.4,
}

interface Sector { name: string; changePercent: number }

export default function MarketBreadth() {
  const [sectors, setSectors] = useState<Sector[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetch('/api/market-overview')
      .then(r => r.json())
      .then(data => { setSectors(data.sectors ?? []); setLoading(false) })
      .catch(() => setLoading(false))
  }, [])

  if (loading) return (
    <Card className="border-border bg-card">
      <CardHeader><div className="h-6 w-44 bg-secondary rounded animate-pulse" /></CardHeader>
      <CardContent>
        <div className="grid sm:grid-cols-3 gap-4">
          {[...Array(3)].map((_, i) => <div key={i} className="h-20 bg-secondary rounded-lg animate-pulse" />)}
        </div>
        <div className="h-6 bg-secondary rounded-full animate-pulse mt-4" />
      </CardContent>
    </Card>
  )

  if (sectors.length === 0) return null

  const advancing = sectors.filter(s => s.changePercent > 0)
  const declining = sectors.filter(s => s.changePercent < 0)
  const unchanged = sectors.filter(s => s.changePercent === 0)
  const total = sectors.length

  // Weighted breadth: sum of weights of advancing sectors
  const weightedAdv = advancing.reduce((sum, s) => sum + (SP500_WEIGHTS[s.name] ?? 3), 0)
  const weightedTot = sectors.reduce((sum, s) => sum + (SP500_WEIGHTS[s.name] ?? 3), 0)
  const breadthScore = Math.round((weightedAdv / weightedTot) * 100)

  // Breadth quality
  const quality =
    breadthScore >= 75 ? { label: 'Broad Rally', color: 'text-green-500', desc: 'Most sectors are rising together — a strong, healthy market signal.' } :
      breadthScore >= 55 ? { label: 'Narrow Rally', color: 'text-green-400', desc: 'Gains are concentrated in a few sectors — participation is selective.' } :
        breadthScore >= 45 ? { label: 'Mixed Market', color: 'text-yellow-500', desc: 'Sectors are split — no clear winner between buyers and sellers.' } :
          breadthScore >= 25 ? { label: 'Narrow Selloff', color: 'text-orange-500', desc: 'Selling is concentrated in a few sectors — not a broad market collapse.' } :
            { label: 'Broad Selloff', color: 'text-red-500', desc: 'Almost everything is falling together — broad market weakness.' }

  const topSector = [...sectors].sort((a, b) => b.changePercent - a.changePercent)[0]
  const worstSector = [...sectors].sort((a, b) => a.changePercent - b.changePercent)[0]

  return (
    <Card className="border-border bg-card">
      <CardHeader>
        <CardTitle className="text-xl font-bold flex items-center gap-2">
          <Activity className="h-5 w-5 text-blue-500" />
          Market Breadth
        </CardTitle>
        <p className="text-sm text-muted-foreground">
          How broad is today's move? — {total} S&P 500 sectors analyzed
        </p>
      </CardHeader>
      <CardContent className="space-y-5">

        {/* Stat Row */}
        <div className="grid grid-cols-3 gap-4">
          <div className="p-3 rounded-xl bg-green-500/10 border border-green-500/20 text-center">
            <TrendingUp className="h-5 w-5 text-green-500 mx-auto mb-1" />
            <p className="text-2xl font-bold text-green-500">{advancing.length}</p>
            <p className="text-xs text-muted-foreground">Advancing</p>
          </div>
          <div className="p-3 rounded-xl bg-secondary/50 border border-border text-center">
            <Minus className="h-5 w-5 text-muted-foreground mx-auto mb-1" />
            <p className="text-2xl font-bold">{unchanged.length}</p>
            <p className="text-xs text-muted-foreground">Unchanged</p>
          </div>
          <div className="p-3 rounded-xl bg-red-500/10 border border-red-500/20 text-center">
            <TrendingDown className="h-5 w-5 text-red-500 mx-auto mb-1" />
            <p className="text-2xl font-bold text-red-500">{declining.length}</p>
            <p className="text-xs text-muted-foreground">Declining</p>
          </div>
        </div>

        {/* Weighted Breadth Meter */}
        <div>
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-semibold">Breadth Score</span>
            <span className={`text-lg font-bold ${quality.color}`}>{breadthScore}/100 — {quality.label}</span>
          </div>
          <div className="relative h-5 rounded-full overflow-hidden bg-secondary/50">
            {/* Gradient track */}
            <div className="absolute inset-0 flex rounded-full overflow-hidden opacity-30">
              <div className="flex-1 bg-red-500" />
              <div className="flex-1 bg-orange-500" />
              <div className="flex-1 bg-yellow-500" />
              <div className="flex-1 bg-green-400" />
              <div className="flex-1 bg-green-600" />
            </div>
            {/* Fill bar */}
            <div
              className={`h-full rounded-full transition-all duration-700 ${breadthScore >= 55 ? 'bg-green-500' :
                  breadthScore >= 45 ? 'bg-yellow-500' : 'bg-red-500'
                } opacity-80`}
              style={{ width: `${breadthScore}%` }}
            />
            {/* Score label inside bar */}
            <div className="absolute inset-0 flex items-center justify-center">
              <span className="text-xs font-bold text-white drop-shadow">{breadthScore}%</span>
            </div>
          </div>
          <div className="flex justify-between text-[10px] text-muted-foreground mt-1">
            <span>Broad Selloff</span>
            <span>Mixed</span>
            <span>Broad Rally</span>
          </div>
        </div>

        {/* Interpretation */}
        <div className="p-3 rounded-lg bg-blue-500/10 border border-blue-500/20">
          <p className="text-sm text-foreground leading-relaxed">{quality.desc}</p>
          {topSector && worstSector && topSector.name !== worstSector.name && (
            <p className="text-xs text-muted-foreground mt-2">
              Leading: <strong className="text-green-500">{topSector.name} ({topSector.changePercent >= 0 ? '+' : ''}{topSector.changePercent.toFixed(2)}%)</strong>
              {' · '}
              Lagging: <strong className="text-red-500">{worstSector.name} ({worstSector.changePercent.toFixed(2)}%)</strong>
            </p>
          )}
        </div>

      </CardContent>
    </Card>
  )
}
