"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { TrendingUp, TrendingDown, PieChart, ArrowUpDown } from "lucide-react"
import { usePortfolio } from "@/lib/portfolio-context"
import { useRouter } from "next/navigation"
import {
  fetchSectorEtfData,
  mapSectorName,
  getTradingDayLabel,
  type SectorEtfData,
} from "@/lib/sector-etf-data"

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

interface SectorRow {
  name: string
  etf: string
  price: number
  change: number
  changePercent: number
  yourExposure: number
  holdingsCount: number
}

type SortCol = 'sector' | 'price' | 'changeDollar' | 'changePercent' | 'exposure' | 'holdings'
type SortDir = 'asc' | 'desc'

function fmtCurrency(v: number) {
  return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', minimumFractionDigits: 2 }).format(v)
}
function fmtPct(v: number) { return `${v >= 0 ? '+' : ''}${v.toFixed(2)}%` }

export default function SectorPerformance() {
  const { holdings, portfolioValue } = usePortfolio()
  const router = useRouter()
  const [rows, setRows] = useState<SectorRow[]>([])
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

        const built: SectorRow[] = ALL_SECTORS_ORDER.map(sector => {
          const exp = exposure[sector] || { value: 0, count: 0 }
          const pct = portfolioValue > 0 ? (exp.value / portfolioValue) * 100 : 0
          const etf = etfMap[sector]
          return {
            name: sector,
            etf: SECTOR_ETFS[sector] || '',
            price: etf?.price || 0,
            change: etf?.change || 0,
            changePercent: etf?.changePercent || 0,
            yourExposure: pct,
            holdingsCount: exp.count,
          }
        })

        setRows(built)
        setTradingDay(getTradingDayLabel())
      } finally {
        setLoading(false)
      }
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

  const SortIcon = ({ col }: { col: SortCol }) => {
    if (sortCol !== col) return <ArrowUpDown className="h-3 w-3 text-muted-foreground ml-1" />
    return sortDir === 'asc'
      ? <TrendingUp className="h-3 w-3 text-primary ml-1" />
      : <TrendingDown className="h-3 w-3 text-primary ml-1" />
  }

  const totalShown = rows.reduce((s, r) => s + r.holdingsCount, 0)
  const sectorsOwned = rows.filter(r => r.holdingsCount > 0).length

  return (
    <Card className="border-border bg-card">
      <CardHeader>
        <CardTitle className="text-xl font-bold flex items-center gap-2">
          <PieChart className="h-5 w-5 text-blue-500" />
          Sector Performance
        </CardTitle>
        <p className="text-xs text-muted-foreground mt-1">
          {loading
            ? 'Loading real sector ETF data...'
            : `${totalShown} of ${holdings.length} holdings across ${sectorsOwned} sectors · ${tradingDay}`
          }
        </p>
      </CardHeader>

      <CardContent>
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
                  <TableHead
                    key={col}
                    className="font-semibold cursor-pointer hover:bg-secondary/70 transition-colors"
                    onClick={() => handleSort(col)}
                  >
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
                      <TableCell key={j}>
                        <div className="h-4 bg-secondary animate-pulse rounded w-3/4" />
                      </TableCell>
                    ))}
                  </TableRow>
                ))
                : sorted.map(row => (
                  <TableRow
                    key={row.name}
                    className="cursor-pointer hover:bg-secondary/50 transition-colors"
                    onClick={() => router.push('/dashboard/portfolio')}
                  >
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <div className={`w-2 h-2 rounded-full ${row.yourExposure > 0 ? 'bg-blue-500' : 'bg-muted'}`} />
                        <div>
                          <span className="font-semibold">{row.name}</span>
                          <span className="text-xs text-muted-foreground ml-2">{row.etf}</span>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell className="text-right font-medium">
                      {row.price > 0 ? fmtCurrency(row.price) : '—'}
                    </TableCell>
                    <TableCell className="text-right">
                      {row.change !== 0 ? (
                        <div className="flex items-center justify-end gap-1">
                          {row.change >= 0
                            ? <TrendingUp className="h-3 w-3 text-green-500" />
                            : <TrendingDown className="h-3 w-3 text-red-500" />}
                          <span className={`font-medium ${row.change >= 0 ? 'text-green-500' : 'text-red-500'}`}>
                            {fmtCurrency(Math.abs(row.change))}
                          </span>
                        </div>
                      ) : <span className="text-muted-foreground">—</span>}
                    </TableCell>
                    <TableCell className="text-right">
                      {row.changePercent !== 0 ? (
                        <span className={`font-bold ${row.changePercent >= 0 ? 'text-green-500' : 'text-red-500'}`}>
                          {fmtPct(row.changePercent)}
                        </span>
                      ) : <span className="text-muted-foreground">—</span>}
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
                      {row.holdingsCount > 0 ? (
                        <Badge variant="secondary" className="text-xs">
                          {row.holdingsCount} {row.holdingsCount === 1 ? 'stock' : 'stocks'}
                        </Badge>
                      ) : <span className="text-muted-foreground text-sm">—</span>}
                    </TableCell>
                  </TableRow>
                ))
              }
            </TableBody>
          </Table>
        </div>

        <div className="flex items-center justify-center gap-6 mt-4 text-xs text-muted-foreground flex-wrap">
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 rounded-full bg-blue-500" />
            <span>You own stocks in this sector</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 rounded-full bg-muted" />
            <span>No holdings</span>
          </div>
          <span>Click column header to sort · Click row to view allocation</span>
        </div>
      </CardContent>
    </Card>
  )
}
