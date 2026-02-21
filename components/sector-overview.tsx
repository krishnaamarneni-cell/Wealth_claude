"use client"

import { useEffect, useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { PieChart, TrendingUp, TrendingDown, ArrowUpDown, BarChart2 } from "lucide-react"
import { usePortfolio } from "@/lib/portfolio-context"
import { useRouter } from "next/navigation"
import {
  fetchSectorEtfData, mapSectorName, getTradingDayLabel, type SectorEtfData,
} from "@/lib/sector-etf-data"

// ── Types ────────────────────────────────────────────────────────────────
interface MarketSector { name: string; symbol: string; price: number; change: number; changePercent: number }

interface PortfolioRow {
  name: string; etf: string; price: number; change: number; changePercent: number
  yourExposure: number; holdingsCount: number
}

type SortCol = 'sector' | 'price' | 'changeDollar' | 'changePercent' | 'exposure' | 'holdings'
type SortDir = 'asc' | 'desc'

const SP500_WEIGHTS: Record<string, number> = {
  'Technology': 28.5, 'Healthcare': 13.2, 'Financials': 12.8,
  'Consumer Discretionary': 10.5, 'Communication Services': 8.9, 'Industrials': 8.4,
  'Consumer Staples': 6.8, 'Energy': 4.2, 'Utilities': 2.8, 'Real Estate': 2.5, 'Materials': 2.4,
}

const SECTOR_ETFS: Record<string, string> = {
  'Technology': 'XLK', 'Communication Services': 'XLC', 'Financials': 'XLF',
  'Healthcare': 'XLV', 'Consumer Discretionary': 'XLY', 'Consumer Staples': 'XLP',
  'Energy': 'XLE', 'Industrials': 'XLI', 'Utilities': 'XLU',
  'Real Estate': 'XLRE', 'Materials': 'XLB',
}

const ALL_SECTORS_ORDER = [
  'Technology', 'Communication Services', 'Financials', 'Healthcare',
  'Consumer Discretionary', 'Consumer Staples', 'Energy', 'Industrials',
  'Utilities', 'Real Estate', 'Materials',
]

// ── Formatters ────────────────────────────────────────────────────────────
function fmtC(v: number) {
  return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', minimumFractionDigits: 2 }).format(v)
}
function fmtPct(v: number) { return `${v >= 0 ? '+' : ''}${v.toFixed(2)}%` }

// ── Tab 1: Market Today ───────────────────────────────────────────────────
function MarketToday({ sectors }: { sectors: MarketSector[] }) {
  if (sectors.length === 0) return (
    <div className="text-center py-8 text-muted-foreground">
      <p>Unable to load sector data</p>
    </div>
  )

  const sorted = [...sectors].sort((a, b) => a.changePercent - b.changePercent)
  const max = Math.max(...sectors.map(s => Math.abs(s.changePercent)))
  const offensive = ['Technology', 'Consumer Discretionary', 'Financials', 'Energy', 'Communication Services']
  const defensive = ['Healthcare', 'Utilities', 'Consumer Staples', 'Real Estate']

  const avg = (names: string[]) => {
    const m = sectors.filter(s => names.includes(s.name))
    return m.length ? m.reduce((sum, s) => sum + s.changePercent, 0) / m.length : 0
  }

  const offAvg = avg(offensive)
  const defAvg = avg(defensive)
  const isRiskOn = offAvg > defAvg

  return (
    <div className="space-y-5">
      {/* Risk-On/Off Badge */}
      <div className={`p-3 rounded-lg border flex items-center justify-between ${isRiskOn ? 'bg-green-500/10 border-green-500/20' : 'bg-red-500/10 border-red-500/20'
        }`}>
        <div>
          <p className="text-xs text-muted-foreground mb-0.5">Market Rotation</p>
          <p className="font-bold text-sm">
            {isRiskOn
              ? <><span className="text-green-500">✅ Risk-On</span> — Growth sectors leading (tech, financials, discretionary)</>
              : <><span className="text-red-500">⚠️ Risk-Off</span> — Defensive sectors leading (utilities, staples, healthcare)</>
            }
          </p>
        </div>
        <div className="flex gap-3 text-xs">
          <div className={`px-3 py-1.5 rounded-lg border ${offAvg >= 0 ? 'bg-green-500/10 border-green-500/20' : 'bg-red-500/10 border-red-500/20'}`}>
            <p className="text-muted-foreground">Offensive</p>
            <p className={`font-bold ${offAvg >= 0 ? 'text-green-500' : 'text-red-500'}`}>{fmtPct(offAvg)}</p>
          </div>
          <div className={`px-3 py-1.5 rounded-lg border ${defAvg >= 0 ? 'bg-green-500/10 border-green-500/20' : 'bg-red-500/10 border-red-500/20'}`}>
            <p className="text-muted-foreground">Defensive</p>
            <p className={`font-bold ${defAvg >= 0 ? 'text-green-500' : 'text-red-500'}`}>{fmtPct(defAvg)}</p>
          </div>
        </div>
      </div>

      {/* Horizontal Bars — sorted worst → best */}
      <div className="space-y-2">
        {sorted.map(sector => {
          const isPos = sector.changePercent >= 0
          const weight = SP500_WEIGHTS[sector.name] ?? 3
          const barW = max > 0 ? (Math.abs(sector.changePercent) / max) * 100 : 0

          return (
            <div key={sector.symbol} className="flex items-center gap-3">
              <div className="w-36 shrink-0 text-right">
                <span className="text-xs font-medium text-muted-foreground leading-tight">{sector.name}</span>
              </div>
              <div className="flex-1 flex items-center gap-2">
                {/* Centered bar */}
                <div className="flex-1 flex items-center gap-1">
                  {!isPos && (
                    <div className="flex-1 flex justify-end">
                      <div
                        className="h-5 rounded-l bg-red-500/80 transition-all duration-500"
                        style={{ width: `${barW}%` }}
                      />
                    </div>
                  )}
                  <div className="w-px h-5 bg-border shrink-0" />
                  {isPos && (
                    <div className="flex-1">
                      <div
                        className="h-5 rounded-r bg-green-500/80 transition-all duration-500"
                        style={{ width: `${barW}%` }}
                      />
                    </div>
                  )}
                </div>
              </div>
              <div className="w-20 text-right shrink-0">
                <span className={`text-xs font-bold ${isPos ? 'text-green-500' : 'text-red-500'}`}>
                  {fmtPct(sector.changePercent)}
                </span>
                <span className="text-[10px] text-muted-foreground block">{sector.symbol} · {weight}%</span>
              </div>
            </div>
          )
        })}
      </div>

      {/* Legend */}
      <div className="flex items-center gap-4 text-xs text-muted-foreground pt-2 border-t border-border/50">
        <div className="flex items-center gap-1"><div className="w-3 h-3 rounded bg-green-500/80" /><span>Gaining</span></div>
        <div className="flex items-center gap-1"><div className="w-3 h-3 rounded bg-red-500/80" /><span>Losing</span></div>
        <span className="ml-auto opacity-60">% = S&P 500 weight</span>
      </div>
    </div>
  )
}

// ── Tab 2: Your Portfolio ─────────────────────────────────────────────────
function YourPortfolio() {
  const { holdings, portfolioValue } = usePortfolio()
  const router = useRouter()
  const [rows, setRows] = useState<PortfolioRow[]>([])
  const [loading, setLoading] = useState(true)
  const [sortCol, setSortCol] = useState<SortCol>('exposure')
  const [sortDir, setSortDir] = useState<SortDir>('desc')
  const [tradingDay, setTradingDay] = useState('')

  useEffect(() => {
    async function load() {
      setLoading(true)
      try {
        const etfData = await fetchSectorEtfData()
        const etfMap: Record<string, SectorEtfData> = {}
        etfData.forEach(d => { etfMap[d.sector] = d })

        const exposure: Record<string, { value: number; count: number }> = {}
        holdings.forEach(h => {
          const s = mapSectorName(h.sector || '')
          if (s === 'Other') return
          if (!exposure[s]) exposure[s] = { value: 0, count: 0 }
          exposure[s].value += h.marketValue
          exposure[s].count += 1
        })

        setRows(ALL_SECTORS_ORDER.map(sector => {
          const exp = exposure[sector] || { value: 0, count: 0 }
          const pct = portfolioValue > 0 ? (exp.value / portfolioValue) * 100 : 0
          const etf = etfMap[sector]
          return {
            name: sector, etf: SECTOR_ETFS[sector] || '',
            price: etf?.price || 0, change: etf?.change || 0,
            changePercent: etf?.changePercent || 0,
            yourExposure: pct, holdingsCount: exp.count,
          }
        }))
        setTradingDay(getTradingDayLabel())
      } finally { setLoading(false) }
    }
    load()
  }, [holdings, portfolioValue])

  const sorted = [...rows].sort((a, b) => {
    const m = sortDir === 'asc' ? 1 : -1
    switch (sortCol) {
      case 'sector': return m * a.name.localeCompare(b.name)
      case 'price': return m * (a.price - b.price)
      case 'changeDollar': return m * (a.change - b.change)
      case 'changePercent': return m * (a.changePercent - b.changePercent)
      case 'exposure': return m * (a.yourExposure - b.yourExposure)
      case 'holdings': return m * (a.holdingsCount - b.holdingsCount)
      default: return 0
    }
  })

  const handleSort = (col: SortCol) => {
    if (sortCol === col) setSortDir(d => d === 'asc' ? 'desc' : 'asc')
    else { setSortCol(col); setSortDir('desc') }
  }

  const SortIcon = ({ col }: { col: SortCol }) => sortCol !== col
    ? <ArrowUpDown className="h-3 w-3 text-muted-foreground ml-1" />
    : sortDir === 'asc'
      ? <TrendingUp className="h-3 w-3 text-primary ml-1" />
      : <TrendingDown className="h-3 w-3 text-primary ml-1" />

  const totalShown = rows.reduce((s, r) => s + r.holdingsCount, 0)
  const sectorsOwned = rows.filter(r => r.holdingsCount > 0).length

  return (
    <div>
      <p className="text-xs text-muted-foreground mb-3">
        {loading ? 'Loading sector ETF data...' : `${totalShown} of ${holdings.length} holdings across ${sectorsOwned} sectors · ${tradingDay}`}
      </p>
      <div className="rounded-lg border border-border overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow className="bg-secondary/50">
              {[
                { col: 'sector' as SortCol, label: 'Sector', right: false },
                { col: 'price' as SortCol, label: 'Price', right: true },
                { col: 'changeDollar' as SortCol, label: 'Change ($)', right: true },
                { col: 'changePercent' as SortCol, label: 'Change (%)', right: true },
                { col: 'exposure' as SortCol, label: 'Your Exposure', right: true },
                { col: 'holdings' as SortCol, label: 'Holdings', right: true },
              ].map(({ col, label, right }) => (
                <TableHead key={col} className="font-semibold cursor-pointer hover:bg-secondary/70" onClick={() => handleSort(col)}>
                  <div className={`flex items-center ${right ? 'justify-end' : ''}`}>
                    {label}<SortIcon col={col} />
                  </div>
                </TableHead>
              ))}
            </TableRow>
          </TableHeader>
          <TableBody>
            {loading
              ? Array.from({ length: 11 }).map((_, i) => (
                <TableRow key={i}>
                  {Array.from({ length: 6 }).map((_, j) => (
                    <TableCell key={j}><div className="h-4 bg-secondary animate-pulse rounded w-3/4" /></TableCell>
                  ))}
                </TableRow>
              ))
              : sorted.map(row => (
                <TableRow key={row.name} className="cursor-pointer hover:bg-secondary/50" onClick={() => router.push('/dashboard/portfolio')}>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <div className={`w-2 h-2 rounded-full ${row.yourExposure > 0 ? 'bg-blue-500' : 'bg-muted'}`} />
                      <span className="font-semibold">{row.name}</span>
                      <span className="text-xs text-muted-foreground">{row.etf}</span>
                    </div>
                  </TableCell>
                  <TableCell className="text-right font-medium">{row.price > 0 ? fmtC(row.price) : '—'}</TableCell>
                  <TableCell className="text-right">
                    {row.change !== 0 ? (
                      <div className="flex items-center justify-end gap-1">
                        {row.change >= 0 ? <TrendingUp className="h-3 w-3 text-green-500" /> : <TrendingDown className="h-3 w-3 text-red-500" />}
                        <span className={`font-medium ${row.change >= 0 ? 'text-green-500' : 'text-red-500'}`}>{fmtC(Math.abs(row.change))}</span>
                      </div>
                    ) : <span className="text-muted-foreground">—</span>}
                  </TableCell>
                  <TableCell className="text-right">
                    {row.changePercent !== 0
                      ? <span className={`font-bold ${row.changePercent >= 0 ? 'text-green-500' : 'text-red-500'}`}>{fmtPct(row.changePercent)}</span>
                      : <span className="text-muted-foreground">—</span>}
                  </TableCell>
                  <TableCell className="text-right">
                    {row.yourExposure > 0 ? (
                      <div className="flex items-center justify-end gap-2">
                        <div className="w-16 h-2 bg-secondary rounded-full overflow-hidden">
                          <div className="h-full bg-blue-500" style={{ width: `${Math.min(row.yourExposure, 100)}%` }} />
                        </div>
                        <span className="font-semibold text-blue-500 min-w-[45px]">{row.yourExposure.toFixed(1)}%</span>
                      </div>
                    ) : <span className="text-muted-foreground text-sm">—</span>}
                  </TableCell>
                  <TableCell className="text-right">
                    {row.holdingsCount > 0
                      ? <Badge variant="secondary" className="text-xs">{row.holdingsCount} {row.holdingsCount === 1 ? 'stock' : 'stocks'}</Badge>
                      : <span className="text-muted-foreground text-sm">—</span>}
                  </TableCell>
                </TableRow>
              ))
            }
          </TableBody>
        </Table>
      </div>
      <div className="flex items-center justify-center gap-6 mt-4 text-xs text-muted-foreground flex-wrap">
        <div className="flex items-center gap-2"><div className="w-2 h-2 rounded-full bg-blue-500" /><span>You own stocks in this sector</span></div>
        <div className="flex items-center gap-2"><div className="w-2 h-2 rounded-full bg-muted" /><span>No holdings</span></div>
        <span>Click column header to sort · Click row to view allocation</span>
      </div>
    </div>
  )
}

// ── Main Component ────────────────────────────────────────────────────────
export default function SectorOverview() {
  const [sectors, setSectors] = useState<MarketSector[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetch('/api/market-overview')
      .then(r => r.json())
      .then(data => { setSectors(data.sectors ?? []); setLoading(false) })
      .catch(() => setLoading(false))
  }, [])

  return (
    <Card className="border-border bg-card">
      <CardHeader>
        <CardTitle className="text-xl font-bold flex items-center gap-2">
          <PieChart className="h-5 w-5 text-blue-500" />
          Sector Overview
        </CardTitle>
        <p className="text-sm text-muted-foreground">
          Today's sector performance + your portfolio exposure
        </p>
      </CardHeader>
      <CardContent>
        <Tabs defaultValue="market">
          <TabsList className="mb-6">
            <TabsTrigger value="market" className="flex items-center gap-1.5">
              <BarChart2 className="h-4 w-4" /> Market Today
            </TabsTrigger>
            <TabsTrigger value="portfolio" className="flex items-center gap-1.5">
              <PieChart className="h-4 w-4" /> Your Portfolio
            </TabsTrigger>
          </TabsList>

          <TabsContent value="market">
            {loading
              ? <div className="space-y-2">{[...Array(11)].map((_, i) => <div key={i} className="h-7 bg-secondary rounded animate-pulse" />)}</div>
              : <MarketToday sectors={sectors} />
            }
          </TabsContent>

          <TabsContent value="portfolio">
            <YourPortfolio />
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  )
}
