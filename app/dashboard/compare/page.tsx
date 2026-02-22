"use client"

import { useState, useMemo, useCallback } from "react"
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid,
  Tooltip, Legend, ResponsiveContainer, ReferenceLine
} from "recharts"
import {
  X, Plus, Search, RefreshCw, BarChart3,
  ArrowUpRight, ArrowDownRight
} from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import {
  Table, TableBody, TableCell,
  TableHead, TableHeader, TableRow
} from "@/components/ui/table"

// ── Types ─────────────────────────────────────────────────────────────
interface HistoryPoint { date: string; price: number }

interface ChartStock {
  symbol: string
  color: string
  history: HistoryPoint[]
}

interface FundStock {
  symbol: string
  color: string
  name: string
  logo: string | null
  sector: string | null
  exchange: string | null
  price: number | null
  change: number | null
  changePercent: number | null
  marketCap: number | null
  pe: number | null
  eps: number | null
  beta: number | null
  pb: number | null
  roe: number | null
  netMargin: number | null
  grossMargin: number | null
  revenueGrowth: number | null
  epsGrowth: number | null
  debtToEquity: number | null
  divYield: number | null
  divAmt: number | null
  high52: number | null
  low52: number | null
}

// ── Constants ─────────────────────────────────────────────────────────
const COLORS = [
  '#22c55e', '#3b82f6', '#f59e0b', '#ef4444', '#8b5cf6',
  '#ec4899', '#06b6d4', '#f97316', '#84cc16', '#a855f7'
]
const CHART_PERIODS = ['1M', '3M', '6M', '1Y'] as const
type ChartPeriod = typeof CHART_PERIODS[number]

// ── Formatters ────────────────────────────────────────────────────────
function fmtPrice(v: number | null | undefined) {
  if (v == null || !isFinite(v)) return '—'
  return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', minimumFractionDigits: 2 }).format(v)
}
function fmtCap(v: number | null | undefined) {
  if (v == null || !isFinite(v) || v === 0) return '—'
  if (v >= 1e12) return `$${(v / 1e12).toFixed(2)}T`
  if (v >= 1e9) return `$${(v / 1e9).toFixed(2)}B`
  if (v >= 1e6) return `$${(v / 1e6).toFixed(2)}M`
  return `$${v.toLocaleString()}`
}
function fmtPct(v: number | null | undefined) {
  if (v == null || !isFinite(v)) return '—'
  return `${v >= 0 ? '+' : ''}${v.toFixed(2)}%`
}
function fmtNum(v: number | null | undefined, dec = 2) {
  if (v == null || !isFinite(v)) return '—'
  return v.toFixed(dec)
}

// ── Period cutoff date ────────────────────────────────────────────────
function getPeriodCutoff(period: ChartPeriod): string {
  const d = new Date()
  if (period === '1M') d.setMonth(d.getMonth() - 1)
  if (period === '3M') d.setMonth(d.getMonth() - 3)
  if (period === '6M') d.setMonth(d.getMonth() - 6)
  if (period === '1Y') d.setFullYear(d.getFullYear() - 1)
  return d.toISOString().split('T')[0]
}

// ── Best/worst highlighter ────────────────────────────────────────────
function getBestWorst(values: (number | null)[], higherIsBetter: boolean) {
  const valid = values.filter(v => v != null) as number[]
  if (valid.length < 2) return { best: null, worst: null }
  return {
    best: higherIsBetter ? Math.max(...valid) : Math.min(...valid),
    worst: higherIsBetter ? Math.min(...valid) : Math.max(...valid),
  }
}
function cellClass(value: number | null, best: number | null, worst: number | null) {
  if (value == null || best == null || worst == null) return ''
  if (value === best) return 'text-green-500 font-semibold'
  if (value === worst) return 'text-red-500'
  return ''
}

// ── Fundamentals row definitions ──────────────────────────────────────
const FUND_METRICS = [
  { label: 'Current Price', key: 'price', fmt: fmtPrice, higherBetter: null },
  { label: 'Market Cap', key: 'marketCap', fmt: fmtCap, higherBetter: null },
  { label: 'P/E (TTM)', key: 'pe', fmt: (v: any) => fmtNum(v), higherBetter: false },
  { label: 'EPS (TTM)', key: 'eps', fmt: (v: any) => v != null ? `$${Number(v).toFixed(2)}` : '—', higherBetter: true },
  { label: 'Price to Book', key: 'pb', fmt: (v: any) => fmtNum(v), higherBetter: false },
  { label: 'Revenue Growth YoY', key: 'revenueGrowth', fmt: (v: any) => fmtPct(v), higherBetter: true },
  { label: 'EPS Growth YoY', key: 'epsGrowth', fmt: (v: any) => fmtPct(v), higherBetter: true },
  { label: 'Net Profit Margin', key: 'netMargin', fmt: (v: any) => v != null ? `${Number(v).toFixed(2)}%` : '—', higherBetter: true },
  { label: 'Gross Margin', key: 'grossMargin', fmt: (v: any) => v != null ? `${Number(v).toFixed(2)}%` : '—', higherBetter: true },
  { label: 'ROE', key: 'roe', fmt: (v: any) => v != null ? `${Number(v).toFixed(2)}%` : '—', higherBetter: true },
  { label: 'Beta', key: 'beta', fmt: (v: any) => fmtNum(v), higherBetter: false },
  { label: 'Debt to Equity', key: 'debtToEquity', fmt: (v: any) => fmtNum(v), higherBetter: false },
  { label: 'Dividend Yield', key: 'divYield', fmt: (v: any) => v != null ? `${Number(v).toFixed(2)}%` : '—', higherBetter: true },
  { label: 'Dividend Amount', key: 'divAmt', fmt: (v: any) => v != null ? `$${Number(v).toFixed(2)}` : '—', higherBetter: true },
  { label: '52-Wk Range', key: '__52wk__', fmt: null, higherBetter: null },
] as const

// ── Component ─────────────────────────────────────────────────────────
export default function ComparePage() {
  const [activeTab, setActiveTab] = useState<'chart' | 'fundamentals'>('chart')
  const [chartStocks, setChartStocks] = useState<ChartStock[]>([])
  const [fundStocks, setFundStocks] = useState<FundStock[]>([])
  const [chartPeriod, setChartPeriod] = useState<ChartPeriod>('1Y')
  const [searchInput, setSearchInput] = useState('')
  const [chartLoading, setChartLoading] = useState<string | null>(null)
  const [fundLoading, setFundLoading] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)

  const isLoading = chartLoading !== null || fundLoading !== null

  // ── Add stock to chart ──────────────────────────────────────────────
  const addChartStock = useCallback(async () => {
    const symbol = searchInput.trim().toUpperCase()
    if (!symbol) return
    if (chartStocks.length >= 10) { setError('Maximum 10 stocks for chart'); return }
    if (chartStocks.find(s => s.symbol === symbol)) { setError(`${symbol} already added`); return }

    setError(null)
    setChartLoading(symbol)
    setSearchInput('')

    try {
      const r = await fetch(`/api/stock/compare?symbols=${symbol}&mode=chart`)
      const data = await r.json()
      if (!Array.isArray(data) || !data[0]?.history?.length) {
        setError(`No data found for ${symbol}`)
        return
      }
      const colorIdx = chartStocks.length
      setChartStocks(prev => [...prev, { ...data[0], color: COLORS[colorIdx % COLORS.length] }])
    } catch { setError(`Failed to fetch ${symbol}`) }
    finally { setChartLoading(null) }
  }, [searchInput, chartStocks])

  // ── Add stock to fundamentals ───────────────────────────────────────
  const addFundStock = useCallback(async () => {
    const symbol = searchInput.trim().toUpperCase()
    if (!symbol) return
    if (fundStocks.length >= 3) { setError('Maximum 3 stocks for fundamentals'); return }
    if (fundStocks.find(s => s.symbol === symbol)) { setError(`${symbol} already added`); return }

    setError(null)
    setFundLoading(symbol)
    setSearchInput('')

    try {
      const r = await fetch(`/api/stock/compare?symbols=${symbol}&mode=fundamentals`)
      const data = await r.json()
      if (!Array.isArray(data) || !data[0]) {
        setError(`No data found for ${symbol}`)
        return
      }
      const colorIdx = fundStocks.length
      setFundStocks(prev => [...prev, { ...data[0], color: COLORS[colorIdx % COLORS.length] }])
    } catch { setError(`Failed to fetch ${symbol}`) }
    finally { setFundLoading(null) }
  }, [searchInput, fundStocks])

  // ── Remove handlers ─────────────────────────────────────────────────
  const removeChart = (sym: string) =>
    setChartStocks(prev => prev.filter(s => s.symbol !== sym).map((s, i) => ({ ...s, color: COLORS[i % COLORS.length] })))

  const removeFund = (sym: string) =>
    setFundStocks(prev => prev.filter(s => s.symbol !== sym).map((s, i) => ({ ...s, color: COLORS[i % COLORS.length] })))

  // ── Normalized % return chart data ──────────────────────────────────
  const normalizedData = useMemo(() => {
    if (!chartStocks.length) return []
    const cutoff = getPeriodCutoff(chartPeriod)

    const filtered = chartStocks.map(s => ({
      symbol: s.symbol,
      color: s.color,
      data: s.history.filter(p => p.date >= cutoff),
    }))

    // Base price = first price in the period
    const baseMap: Record<string, number> = {}
    filtered.forEach(s => { if (s.data.length) baseMap[s.symbol] = s.data[0].price })

    // All unique dates sorted
    const allDates = Array.from(
      new Set(filtered.flatMap(s => s.data.map(p => p.date)))
    ).sort()

    return allDates.map(date => {
      const point: Record<string, any> = { date }
      filtered.forEach(s => {
        const match = s.data.find(p => p.date === date)
        if (match && baseMap[s.symbol]) {
          point[s.symbol] = parseFloat(
            (((match.price - baseMap[s.symbol]) / baseMap[s.symbol]) * 100).toFixed(2)
          )
        }
      })
      return point
    })
  }, [chartStocks, chartPeriod])

  // Deduplicated monthly X ticks
  const xTicks = useMemo(() => {
    const seen = new Set<string>()
    const ticks: string[] = []
    for (const p of normalizedData) {
      const key = String(p.date).substring(0, 7)
      if (!seen.has(key)) { seen.add(key); ticks.push(p.date) }
    }
    return ticks
  }, [normalizedData])

  const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']
  const fmtXTick = (v: string) => {
    const parts = v.split('-')
    return MONTHS[parseInt(parts[1]) - 1] ?? v
  }

  return (
    <div className="p-4 lg:p-6 space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Compare Stocks</h1>
        <p className="text-muted-foreground">
          {activeTab === 'chart'
            ? 'Compare up to 10 stocks by % return'
            : 'Compare up to 3 stocks by fundamentals'}
        </p>
      </div>

      {/* ── Tab Bar ─────────────────────────────────────────────── */}
      <div className="flex gap-0 border-b border-border">
        {(['chart', 'fundamentals'] as const).map(tab => (
          <button
            key={tab}
            onClick={() => { setActiveTab(tab); setError(null) }}
            className={`px-5 py-2.5 text-sm font-medium capitalize border-b-2 transition-colors ${activeTab === tab
                ? 'border-primary text-foreground'
                : 'border-transparent text-muted-foreground hover:text-foreground'
              }`}
          >
            {tab === 'chart' ? 'Chart' : 'Fundamentals'}
          </button>
        ))}
      </div>

      {/* ── CHART TAB ───────────────────────────────────────────── */}
      {activeTab === 'chart' && (
        <div className="space-y-4">

          {/* Stock selector */}
          <Card>
            <CardContent className="pt-4 space-y-3">
              {/* Selected pills */}
              {chartStocks.length > 0 && (
                <div className="flex flex-wrap gap-2">
                  {chartStocks.map(stock => (
                    <div
                      key={stock.symbol}
                      className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-border bg-muted/40 text-sm"
                      style={{ borderLeftColor: stock.color, borderLeftWidth: 3 }}
                    >
                      <span className="font-semibold">{stock.symbol}</span>
                      <button onClick={() => removeChart(stock.symbol)} className="text-muted-foreground hover:text-foreground ml-1">
                        <X className="h-3.5 w-3.5" />
                      </button>
                    </div>
                  ))}
                </div>
              )}

              {/* Search input */}
              <div className="flex gap-2">
                <div className="relative flex-1 max-w-xs">
                  <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder="Enter ticker (e.g. AAPL)"
                    value={searchInput}
                    onChange={e => { setSearchInput(e.target.value.toUpperCase()); setError(null) }}
                    onKeyDown={e => e.key === 'Enter' && addChartStock()}
                    className="pl-8"
                    disabled={isLoading}
                  />
                </div>
                <Button
                  onClick={addChartStock}
                  disabled={isLoading || !searchInput.trim() || chartStocks.length >= 10}
                  size="sm"
                >
                  {chartLoading
                    ? <RefreshCw className="h-4 w-4 animate-spin mr-1" />
                    : <Plus className="h-4 w-4 mr-1" />}
                  Add
                </Button>
              </div>

              {error && <p className="text-xs text-red-500">{error}</p>}
              {chartLoading && <p className="text-xs text-muted-foreground">Fetching {chartLoading}...</p>}
              <p className="text-xs text-muted-foreground">{chartStocks.length}/10 stocks</p>
            </CardContent>
          </Card>

          {/* Empty state */}
          {chartStocks.length === 0 ? (
            <Card>
              <CardContent className="py-20 text-center">
                <BarChart3 className="h-10 w-10 mx-auto mb-3 text-muted-foreground opacity-40" />
                <p className="text-sm text-muted-foreground">Add stocks above to compare performance</p>
                <p className="text-xs text-muted-foreground mt-1 opacity-60">Try AAPL, MSFT, NVDA, TSLA...</p>
              </CardContent>
            </Card>
          ) : (
            <>
              {/* Period selector */}
              <div className="flex gap-1">
                {CHART_PERIODS.map(p => (
                  <button
                    key={p}
                    onClick={() => setChartPeriod(p)}
                    className={`px-3 py-1 text-xs font-medium rounded-md transition-colors ${chartPeriod === p
                        ? 'bg-primary text-primary-foreground'
                        : 'hover:bg-muted text-muted-foreground'
                      }`}
                  >
                    {p}
                  </button>
                ))}
              </div>

              {/* % Return chart */}
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-base">% Return — {chartPeriod}</CardTitle>
                  <CardDescription>All stocks normalized to 0% at start of period</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="h-[420px]">
                    <ResponsiveContainer width="100%" height="100%">
                      <LineChart data={normalizedData} margin={{ top: 8, right: 16, left: 0, bottom: 0 }}>
                        <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                        <ReferenceLine y={0} stroke="#94a3b8" strokeDasharray="4 4" strokeWidth={1} />
                        <XAxis
                          dataKey="date"
                          ticks={xTicks}
                          tickFormatter={fmtXTick}
                          tick={{ fill: '#94a3b8', fontSize: 10 }}
                          tickLine={false}
                          axisLine={false}
                        />
                        <YAxis
                          tickFormatter={v => `${v > 0 ? '+' : ''}${v.toFixed(0)}%`}
                          tick={{ fill: '#94a3b8', fontSize: 10 }}
                          tickLine={false}
                          axisLine={false}
                          width={58}
                        />
                        <Tooltip
                          contentStyle={{
                            backgroundColor: 'hsl(var(--card))',
                            border: '1px solid hsl(var(--border))',
                            borderRadius: '8px',
                            fontSize: 12,
                          }}
                          formatter={(v: number, name: string) => [
                            `${v >= 0 ? '+' : ''}${v.toFixed(2)}%`, name
                          ]}
                          labelStyle={{ color: '#94a3b8', fontSize: 11 }}
                        />
                        <Legend wrapperStyle={{ fontSize: 12 }} />
                        {chartStocks.map(stock => (
                          <Line
                            key={stock.symbol}
                            type="monotone"
                            dataKey={stock.symbol}
                            stroke={stock.color}
                            strokeWidth={2}
                            dot={false}
                            activeDot={{ r: 4, strokeWidth: 0 }}
                            connectNulls
                          />
                        ))}
                      </LineChart>
                    </ResponsiveContainer>
                  </div>
                </CardContent>
              </Card>
            </>
          )}
        </div>
      )}

      {/* ── FUNDAMENTALS TAB ────────────────────────────────────── */}
      {activeTab === 'fundamentals' && (
        <div className="space-y-4">

          {/* Stock selector */}
          <Card>
            <CardContent className="pt-4 space-y-3">
              {fundStocks.length > 0 && (
                <div className="flex flex-wrap gap-2">
                  {fundStocks.map(stock => (
                    <div
                      key={stock.symbol}
                      className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-border bg-muted/40 text-sm"
                      style={{ borderLeftColor: stock.color, borderLeftWidth: 3 }}
                    >
                      <span className="font-semibold">{stock.symbol}</span>
                      <span className="text-muted-foreground text-xs hidden sm:inline">{stock.name}</span>
                      <button onClick={() => removeFund(stock.symbol)} className="text-muted-foreground hover:text-foreground ml-1">
                        <X className="h-3.5 w-3.5" />
                      </button>
                    </div>
                  ))}
                </div>
              )}

              <div className="flex gap-2">
                <div className="relative flex-1 max-w-xs">
                  <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder="Enter ticker (e.g. AAPL)"
                    value={searchInput}
                    onChange={e => { setSearchInput(e.target.value.toUpperCase()); setError(null) }}
                    onKeyDown={e => e.key === 'Enter' && addFundStock()}
                    className="pl-8"
                    disabled={isLoading}
                  />
                </div>
                <Button
                  onClick={addFundStock}
                  disabled={isLoading || !searchInput.trim() || fundStocks.length >= 3}
                  size="sm"
                >
                  {fundLoading
                    ? <RefreshCw className="h-4 w-4 animate-spin mr-1" />
                    : <Plus className="h-4 w-4 mr-1" />}
                  Add
                </Button>
              </div>

              {error && <p className="text-xs text-red-500">{error}</p>}
              {fundLoading && <p className="text-xs text-muted-foreground">Fetching {fundLoading}...</p>}
              <p className="text-xs text-muted-foreground">{fundStocks.length}/3 stocks</p>
            </CardContent>
          </Card>

          {/* Empty state */}
          {fundStocks.length === 0 ? (
            <Card>
              <CardContent className="py-20 text-center">
                <BarChart3 className="h-10 w-10 mx-auto mb-3 text-muted-foreground opacity-40" />
                <p className="text-sm text-muted-foreground">Add up to 3 stocks to compare fundamentals</p>
                <p className="text-xs text-muted-foreground mt-1 opacity-60">Data sourced from Finnhub — 12hr cache</p>
              </CardContent>
            </Card>
          ) : (
            <>
              {/* Price cards */}
              <div className={`grid gap-4 grid-cols-${fundStocks.length}`}>
                {fundStocks.map(stock => (
                  <Card key={stock.symbol} style={{ borderTopColor: stock.color, borderTopWidth: 3 }}>
                    <CardContent className="p-4">
                      <div className="flex items-start justify-between mb-3">
                        <div className="min-w-0">
                          <div className="flex items-center gap-1.5 mb-0.5">
                            <p className="font-bold text-lg">{stock.symbol}</p>
                            {stock.exchange && (
                              <span className="text-xs border border-border rounded px-1.5 py-0.5" style={{ color: '#94a3b8' }}>
                                {stock.exchange}
                              </span>
                            )}
                          </div>
                          <p className="text-xs text-muted-foreground truncate">{stock.name}</p>
                          {stock.sector && <p className="text-xs text-muted-foreground opacity-70">{stock.sector}</p>}
                        </div>
                        {stock.logo && (
                          <img
                            src={stock.logo}
                            alt={stock.symbol}
                            className="h-9 w-9 rounded object-contain flex-shrink-0"
                            onError={e => (e.target as HTMLImageElement).style.display = 'none'}
                          />
                        )}
                      </div>
                      <p className="text-2xl font-bold">{fmtPrice(stock.price)}</p>
                      {stock.changePercent != null && (
                        <div className={`flex items-center gap-1 text-sm mt-1 ${stock.changePercent >= 0 ? 'text-green-500' : 'text-red-500'}`}>
                          {stock.changePercent >= 0
                            ? <ArrowUpRight className="h-4 w-4" />
                            : <ArrowDownRight className="h-4 w-4" />}
                          <span>{stock.changePercent >= 0 ? '+' : ''}{stock.changePercent.toFixed(2)}%</span>
                          <span className="text-muted-foreground text-xs">today</span>
                        </div>
                      )}
                    </CardContent>
                  </Card>
                ))}
              </div>

              {/* Fundamentals table */}
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-base">Fundamentals Comparison</CardTitle>
                  <CardDescription>
                    <span className="text-green-500 font-medium">Green</span> = best ·{' '}
                    <span className="text-red-500 font-medium">Red</span> = worst
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="overflow-x-auto">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead className="w-[180px]">Metric</TableHead>
                          {fundStocks.map(stock => (
                            <TableHead key={stock.symbol} className="text-center">
                              <div className="flex items-center justify-center gap-1.5">
                                <div className="h-2.5 w-2.5 rounded-full flex-shrink-0" style={{ backgroundColor: stock.color }} />
                                {stock.symbol}
                              </div>
                            </TableHead>
                          ))}
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {FUND_METRICS.map(metric => {
                          // 52-wk range — special composite cell
                          if (metric.key === '__52wk__') {
                            return (
                              <TableRow key="52wk">
                                <TableCell className="text-sm font-medium">52-Wk Range</TableCell>
                                {fundStocks.map(stock => (
                                  <TableCell key={stock.symbol} className="text-center text-sm">
                                    {stock.low52 && stock.high52
                                      ? `${fmtPrice(stock.low52)} – ${fmtPrice(stock.high52)}`
                                      : '—'}
                                  </TableCell>
                                ))}
                              </TableRow>
                            )
                          }

                          const values = fundStocks.map(s => (s as any)[metric.key] as number | null)
                          const { best, worst } = metric.higherBetter != null
                            ? getBestWorst(values, metric.higherBetter)
                            : { best: null, worst: null }

                          return (
                            <TableRow key={metric.label}>
                              <TableCell className="text-sm font-medium">{metric.label}</TableCell>
                              {fundStocks.map(stock => {
                                const val = (stock as any)[metric.key]
                                return (
                                  <TableCell
                                    key={stock.symbol}
                                    className={`text-center text-sm ${cellClass(val, best, worst)}`}
                                  >
                                    {(metric.fmt as Function)(val)}
                                  </TableCell>
                                )
                              })}
                            </TableRow>
                          )
                        })}
                      </TableBody>
                    </Table>
                  </div>
                </CardContent>
              </Card>
            </>
          )}
        </div>
      )}
    </div>
  )
}
