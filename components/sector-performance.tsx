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
  type SectorEtfData,
} from "@/lib/sector-etf-data"

interface SectorRow {
  name: string
  etf: string
  price: number
  change: number
  changePercent: number
  yourExposure: number
  holdingsCount: number
  dataSource: string
}

type SortColumn = 'sector' | 'price' | 'changeDollar' | 'changePercent' | 'exposure' | 'holdings'
type SortDirection = 'asc' | 'desc'

function formatCurrency(value: number): string {
  return new Intl.NumberFormat('en-US', {
    style: 'currency', currency: 'USD',
    minimumFractionDigits: 2, maximumFractionDigits: 2,
  }).format(value)
}

function formatPercent(value: number): string {
  return `${value >= 0 ? '+' : ''}${value.toFixed(2)}%`
}

const ALL_SECTORS_ORDER = [
  'Technology', 'Communication Services', 'Financials', 'Healthcare',
  'Consumer Discretionary', 'Consumer Staples', 'Energy', 'Industrials',
  'Utilities', 'Real Estate', 'Materials',
]

const SECTOR_ETFS: Record<string, string> = {
  'Technology': 'XLK', 'Communication Services': 'XLC', 'Financials': 'XLF',
  'Healthcare': 'XLV', 'Consumer Discretionary': 'XLY', 'Consumer Staples': 'XLP',
  'Energy': 'XLE', 'Industrials': 'XLI', 'Utilities': 'XLU',
  'Real Estate': 'XLRE', 'Materials': 'XLB',
}

export default function SectorPerformance() {
  const { holdings, portfolioValue } = usePortfolio()
  const router = useRouter()

  const [sectorRows, setSectorRows] = useState<SectorRow[]>([])
  const [loading, setLoading] = useState(true)
  const [sortColumn, setSortColumn] = useState<SortColumn>('exposure')
  const [sortDirection, setSortDirection] = useState<SortDirection>('desc')
  const [tradingDay, setTradingDay] = useState('')

  useEffect(() => {
    async function load() {
      setLoading(true)
      try {
        const etfData = await fetchSectorEtfData()

        // Map to quick-lookup
        const etfMap: Record<string, SectorEtfData> = {}
        etfData.forEach(d => { etfMap[d.sector] = d })

        // Calculate your sector exposure from holdings
        const sectorExposure: Record<string, { value: number; count: number }> = {}
        holdings.forEach(holding => {
          const mapped = mapSectorName(holding.sector || '')
          if (mapped === 'Other') return
          if (!sectorExposure[mapped]) sectorExposure[mapped] = { value: 0, count: 0 }
          sectorExposure[mapped].value += holding.marketValue
          sectorExposure[mapped].count += 1
        })

        // Build rows for all 11 sectors
        const rows: SectorRow[] = ALL_SECTORS_ORDER.map(sector => {
          const exposure = sectorExposure[sector] || { value: 0, count: 0 }
          const exposurePct = portfolioValue > 0 ? (exposure.value / portfolioValue) * 100 : 0
          const etf = etfMap[sector]

          return {
            name: sector,
            etf: SECTOR_ETFS[sector] || '',
            price: etf?.price || 0,
            change: etf?.change || 0,
            changePercent: etf?.changePercent || 0,
            yourExposure: exposurePct,
            holdingsCount: exposure.count,
            dataSource: etf?.dataSource || 'none',
          }
        })

        // Determine trading day label
        const now = new Date(new Date().toLocaleString('en-US', { timeZone: 'America/New_York' }))
        const day = now.getDay()
        setTradingDay(
          day === 0 || day === 6
            ? "Friday's Close"
            : now.getHours() < 16 ? 'Previous Close' : "Today's Close"
        )

        setSectorRows(rows)
      } finally {
        setLoading(false)
      }
    }
    load()
  }, [holdings, portfolioValue])

  // ==================== SORT ====================
  const sorted = [...sectorRows].sort((a, b) => {
    const m = sortDirection === 'asc' ? 1 : -1
    switch (sortColumn) {
      case 'sector': return m * a.name.localeCompare(b.name)
      case 'price': return m * (a.price - b.price)
      case 'changeDollar': return m * (a.change - b.change)
      case 'changePercent': return m * (a.changePercent - b.changePercent)
      case 'exposure': return m * (a.yourExposure - b.yourExposure)
      case 'holdings': return m * (a.holdingsCount - b.holdingsCount)
      default: return 0
    }
  })

  const handleSort = (col: SortColumn) => {
    if (sortColumn === col) {
      setSortDirection(d => d === 'asc' ? 'desc' : 'asc')
    } else {
      setSortColumn(col)
      setSortDirection('desc')
    }
  }

  const SortIcon = ({ col }: { col: SortColumn }) => {
    if (sortColumn !== col) return <ArrowUpDown className="h-3 w-3 text-muted-foreground ml-1" />
    return sortDirection === 'asc'
      ? <TrendingUp className="h-3 w-3 text-primary ml-1" />
      : <TrendingDown className="h-3 w-3 text-primary ml-1" />
  }

  const totalShown = sectorRows.reduce((s, r) => s + r.holdingsCount, 0)
  const sectorsOwned = sectorRows.filter(r => r.holdingsCount > 0).length

  return (
    <Card className="border-border bg-card">
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="text-xl font-bold flex items-center gap-2">
              <PieChart className="h-5 w-5 text-blue-500" />
              Sector Performance
            </CardTitle>
            <p className="text-xs text-muted-foreground mt-1">
              {loading
                ? 'Loading sector data...'
                : `Showing ${totalShown} of ${holdings.length} holdings across ${sectorsOwned} sectors · ${tradingDay}`
              }
            </p>
          </div>
        </div>
      </CardHeader>

      <CardContent>
        <div className="rounded-lg border border-border overflow-hidden">
          <Table>
            <TableHeader>
              <TableRow className="bg-secondary/50">
                <TableHead
                  className="font-semibold cursor-pointer hover:bg-secondary/70 transition-colors"
                  onClick={() => handleSort('sector')}
                >
                  <div className="flex items-center">Sector <SortIcon col="sector" /></div>
                </TableHead>
                <TableHead
                  className="font-semibold text-right cursor-pointer hover:bg-secondary/70 transition-colors"
                  onClick={() => handleSort('price')}
                >
                  <div className="flex items-center justify-end">Price <SortIcon col="price" /></div>
                </TableHead>
                <TableHead
                  className="font-semibold text-right cursor-pointer hover:bg-secondary/70 transition-colors"
                  onClick={() => handleSort('changeDollar')}
                >
                  <div className="flex items-center justify-end">Change ($) <SortIcon col="changeDollar" /></div>
                </TableHead>
                <TableHead
                  className="font-semibold text-right cursor-pointer hover:bg-secondary/70 transition-colors"
                  onClick={() => handleSort('changePercent')}
                >
                  <div className="flex items-center justify-end">Change (%) <SortIcon col="changePercent" /></div>
                </TableHead>
                <TableHead
                  className="font-semibold text-right cursor-pointer hover:bg-secondary/70 transition-colors"
                  onClick={() => handleSort('exposure')}
                >
                  <div className="flex items-center justify-end">Your Exposure <SortIcon col="exposure" /></div>
                </TableHead>
                <TableHead
                  className="font-semibold text-right cursor-pointer hover:bg-secondary/70 transition-colors"
                  onClick={() => handleSort('holdings')}
                >
                  <div className="flex items-center justify-end">Holdings <SortIcon col="holdings" /></div>
                </TableHead>
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
                    {/* Sector name */}
                    <TableCell className="font-medium">
                      <div className="flex items-center gap-2">
                        <div className={`w-2 h-2 rounded-full ${row.yourExposure > 0 ? 'bg-blue-500' : 'bg-muted'}`} />
                        <div>
                          <span className="font-semibold">{row.name}</span>
                          <span className="text-xs text-muted-foreground ml-2">{row.etf}</span>
                        </div>
                      </div>
                    </TableCell>

                    {/* Price */}
                    <TableCell className="text-right font-medium">
                      {row.price > 0 ? formatCurrency(row.price) : '—'}
                    </TableCell>

                    {/* Change $ */}
                    <TableCell className="text-right">
                      {row.change !== 0 ? (
                        <div className="flex items-center justify-end gap-1">
                          {row.change >= 0
                            ? <TrendingUp className="h-3 w-3 text-green-500" />
                            : <TrendingDown className="h-3 w-3 text-red-500" />
                          }
                          <span className={`font-medium ${row.change >= 0 ? 'text-green-500' : 'text-red-500'}`}>
                            {formatCurrency(Math.abs(row.change))}
                          </span>
                        </div>
                      ) : <span className="text-muted-foreground">—</span>}
                    </TableCell>

                    {/* Change % */}
                    <TableCell className="text-right">
                      {row.changePercent !== 0 ? (
                        <span className={`font-bold ${row.changePercent >= 0 ? 'text-green-500' : 'text-red-500'}`}>
                          {formatPercent(row.changePercent)}
                        </span>
                      ) : <span className="text-muted-foreground">—</span>}
                    </TableCell>

                    {/* Your exposure */}
                    <TableCell className="text-right">
                      {row.yourExposure > 0 ? (
                        <div className="flex items-center justify-end gap-2">
                          <div className="w-16 h-2 bg-secondary rounded-full overflow-hidden">
                            <div
                              className="h-full bg-blue-500"
                              style={{ width: `${Math.min(row.yourExposure, 100)}%` }}
                            />
                          </div>
                          <span className="font-semibold text-blue-500 min-w-[45px]">
                            {row.yourExposure.toFixed(1)}%
                          </span>
                        </div>
                      ) : (
                        <span className="text-muted-foreground text-sm">—</span>
                      )}
                    </TableCell>

                    {/* Holdings count */}
                    <TableCell className="text-right">
                      {row.holdingsCount > 0 ? (
                        <Badge variant="secondary" className="text-xs">
                          {row.holdingsCount} {row.holdingsCount === 1 ? 'stock' : 'stocks'}
                        </Badge>
                      ) : (
                        <span className="text-muted-foreground text-sm">—</span>
                      )}
                    </TableCell>
                  </TableRow>
                ))
              }
            </TableBody>
          </Table>
        </div>

        {/* Legend */}
        <div className="flex items-center justify-center gap-6 mt-4 text-xs text-muted-foreground flex-wrap">
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 rounded-full bg-blue-500" />
            <span>You own stocks in this sector</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 rounded-full bg-muted" />
            <span>No holdings</span>
          </div>
          <span>Click any column header to sort · Click sector to view allocation</span>
        </div>
      </CardContent>
    </Card>
  )
}
