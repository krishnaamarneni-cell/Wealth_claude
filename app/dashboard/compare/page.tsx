"use client"

import { useState, useMemo, useCallback, useRef, useEffect } from "react"
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid,
  Tooltip, Legend, ResponsiveContainer, ReferenceLine,
} from "recharts"
import {
  X, Plus, Search, RefreshCw,
  BarChart3, ArrowUpRight, ArrowDownRight,
} from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import {
  Table, TableBody, TableCell,
  TableHead, TableHeader, TableRow,
} from "@/components/ui/table"
import ProjectionTab from "@/components/projection/projection-tab"

// ── Types ─────────────────────────────────────────────────────────────
type HistoryPoint = { date: string; price: number }
type PageTab = 'compare' | 'projection'

interface SearchResult {
  symbol: string
  name: string
  exchange: string
}

interface FundData {
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

interface StockEntry {
  symbol: string
  color: string
  history: HistoryPoint[]
  fund: FundData | null
}

// ── Constants ─────────────────────────────────────────────────────────
const COLORS = [
  '#22c55e', '#3b82f6', '#f59e0b', '#ef4444', '#8b5cf6',
  '#ec4899', '#06b6d4', '#f97316', '#84cc16', '#a855f7',
]
const CHART_PERIODS = ['1M', '3M', '6M', '1Y', '5Y'] as const
type ChartPeriod = typeof CHART_PERIODS[number]
const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']
const LS_SYMBOLS_KEY = 'compare_saved_symbols'

// ── Formatters ────────────────────────────────────────────────────────
const fmtPrice = (v: any) => {
  if (v == null || !isFinite(v)) return '—'
  return new Intl.NumberFormat('en-US', {
    style: 'currency', currency: 'USD', minimumFractionDigits: 2,
  }).format(v)
}
const fmtCap = (v: any) => {
  if (v == null || !isFinite(v) || v === 0) return '—'
  if (v >= 1e12) return `$${(v / 1e12).toFixed(2)}T`
  if (v >= 1e9) return `$${(v / 1e9).toFixed(2)}B`
  if (v >= 1e6) return `$${(v / 1e6).toFixed(2)}M`
  return `$${v.toLocaleString()}`
}
const fmtPct = (v: any) => v == null || !isFinite(v) ? '—' : `${v >= 0 ? '+' : ''}${Number(v).toFixed(2)}%`
const fmtNum = (v: any, d = 2) => v == null || !isFinite(v) ? '—' : Number(v).toFixed(d)
const fmtDolr = (v: any) => v == null || !isFinite(v) ? '—' : `$${Number(v).toFixed(2)}`

function getPeriodCutoff(p: ChartPeriod) {
  const d = new Date()
  if (p === '1M') d.setMonth(d.getMonth() - 1)
  if (p === '3M') d.setMonth(d.getMonth() - 3)
  if (p === '6M') d.setMonth(d.getMonth() - 6)
  if (p === '1Y') d.setFullYear(d.getFullYear() - 1)
  if (p === '5Y') d.setFullYear(d.getFullYear() - 5)
  return d.toISOString().split('T')[0]
}

function getBestWorst(vals: (number | null)[], higher: boolean) {
  const v = vals.filter(x => x != null) as number[]
  if (v.length < 2) return { best: null, worst: null }
  return {
    best: higher ? Math.max(...v) : Math.min(...v),
    worst: higher ? Math.min(...v) : Math.max(...v),
  }
}

function cellCls(val: number | null, best: number | null, worst: number | null) {
  if (val == null || best == null || worst == null) return ''
  if (val === best) return 'text-green-500 font-semibold'
  if (val === worst) return 'text-red-500'
  return ''
}

const METRICS = [
  { label: 'Current Price', key: 'price', fmt: fmtPrice, hb: null },
  { label: 'Market Cap', key: 'marketCap', fmt: fmtCap, hb: null },
  { label: 'P/E (TTM)', key: 'pe', fmt: fmtNum, hb: false },
  { label: 'EPS (TTM)', key: 'eps', fmt: fmtDolr, hb: true },
  { label: 'Price to Book', key: 'pb', fmt: fmtNum, hb: false },
  { label: 'Revenue Growth YoY', key: 'revenueGrowth', fmt: fmtPct, hb: true },
  { label: 'EPS Growth YoY', key: 'epsGrowth', fmt: fmtPct, hb: true },
  { label: 'Net Profit Margin', key: 'netMargin', fmt: (v: any) => fmtNum(v) === '—' ? '—' : `${fmtNum(v)}%`, hb: true },
  { label: 'Gross Margin', key: 'grossMargin', fmt: (v: any) => fmtNum(v) === '—' ? '—' : `${fmtNum(v)}%`, hb: true },
  { label: 'ROE', key: 'roe', fmt: (v: any) => fmtNum(v) === '—' ? '—' : `${fmtNum(v)}%`, hb: true },
  { label: 'Beta', key: 'beta', fmt: fmtNum, hb: false },
  { label: 'Debt to Equity', key: 'debtToEquity', fmt: fmtNum, hb: false },
  { label: 'Dividend Yield', key: 'divYield', fmt: (v: any) => fmtNum(v) === '—' ? '—' : `${fmtNum(v)}%`, hb: true },
  { label: 'Dividend Amount', key: 'divAmt', fmt: fmtDolr, hb: true },
  { label: '52-Wk Range', key: '__52wk__', fmt: null, hb: null },
] as const

// ── Skeleton ──────────────────────────────────────────────────────────
function CompareSkeleton() {
  return (
    <div className="space-y-4 animate-pulse">
      <Card>
        <CardContent className="pt-4 pb-4 space-y-3">
          <div className="flex gap-2 flex-wrap">
            {[120, 100, 110].map((w, i) => (
              <div key={i} className="h-8 rounded-lg bg-muted" style={{ width: w }} />
            ))}
          </div>
          <div className="flex gap-2">
            <div className="h-9 flex-1 max-w-sm bg-muted rounded-md" />
            <div className="h-9 w-16 bg-muted rounded-md" />
          </div>
          <div className="h-3 w-40 bg-muted rounded" />
        </CardContent>
      </Card>
      <div className="flex gap-1">
        {CHART_PERIODS.map(p => (
          <div key={p} className="h-6 w-10 bg-muted rounded-md" />
        ))}
      </div>
      <Card>
        <CardContent className="pt-5 pb-5">
          <div className="h-5 w-44 bg-muted rounded mb-1.5" />
          <div className="h-3 w-64 bg-muted rounded mb-6" />
          <div className="h-[380px] bg-muted rounded-lg" />
        </CardContent>
      </Card>
    </div>
  )
}

// ── Compare Tab ───────────────────────────────────────────────────────
function CompareTab() {
  const [stocks, setStocks] = useState<StockEntry[]>([])
  const [restoring, setRestoring] = useState(true)
  const [period, setPeriod] = useState<ChartPeriod>('1Y')
  const [input, setInput] = useState('')
  const [loading, setLoading] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [suggests, setSuggests] = useState<SearchResult[]>([])
  const [searching, setSearching] = useState(false)
  const [showDrop, setShowDrop] = useState(false)

  const colorIdx = useRef(0)
  const isRestoringRef = useRef(true)
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null)
  const dropRef = useRef<HTMLDivElement>(null)

  // ── Restore saved symbols on mount ────────────────────────────────
  useEffect(() => {
    let cancelled = false
    const raw = localStorage.getItem(LS_SYMBOLS_KEY)
    const saved: string[] = raw ? JSON.parse(raw) : []
    const symbols = saved.length > 0 ? saved : ['AAPL']

    Promise.all(
      symbols.map(async (symbol, i) => {
        const color = COLORS[i % COLORS.length]
        const willBeFund = i < 3
        try {
          const [chartRes, fundRes] = await Promise.all([
            fetch(`/api/stock/compare?symbols=${symbol}&mode=chart`).then(r => r.json()),
            willBeFund
              ? fetch(`/api/stock/compare?symbols=${symbol}&mode=fundamentals`).then(r => r.json())
              : Promise.resolve(null),
          ])
          if (!Array.isArray(chartRes) || !chartRes[0]?.history?.length) return null
          const history = chartRes[0].history as HistoryPoint[]
          const fund: FundData | null =
            Array.isArray(fundRes) && fundRes[0] ? (fundRes[0] as FundData) : null
          return { symbol, color, history, fund } as StockEntry
        } catch { return null }
      })
    ).then(results => {
      if (cancelled) return
      const valid = results.filter(Boolean) as StockEntry[]
      colorIdx.current = valid.length
      setStocks(valid)
    }).finally(() => {
      if (cancelled) return
      isRestoringRef.current = false
      setRestoring(false)
    })

    return () => { cancelled = true }
  }, [])

  // ── Save symbols whenever stocks change (skip during restoration) ──
  useEffect(() => {
    if (isRestoringRef.current) return
    const symbols = stocks.map(s => s.symbol)
    localStorage.setItem(LS_SYMBOLS_KEY, JSON.stringify(symbols))
  }, [stocks])

  // ── Close dropdown on outside click ───────────────────────────────
  useEffect(() => {
    const fn = (e: MouseEvent) => {
      if (dropRef.current && !dropRef.current.contains(e.target as Node))
        setShowDrop(false)
    }
    document.addEventListener('mousedown', fn)
    return () => document.removeEventListener('mousedown', fn)
  }, [])

  // ── Debounced search ──────────────────────────────────────────────
  const handleInput = useCallback((val: string) => {
    setInput(val)
    setError(null)
    setShowDrop(true)
    if (timer.current) clearTimeout(timer.current)
    if (!val.trim()) { setSuggests([]); setSearching(false); return }
    setSearching(true)
    timer.current = setTimeout(async () => {
      try {
        const r = await fetch(`/api/stock/search?q=${encodeURIComponent(val)}`)
        const d = await r.json()
        setSuggests(Array.isArray(d) ? d : [])
      } catch { setSuggests([]) }
      finally { setSearching(false) }
    }, 300)
  }, [])

  // ── Add stock ─────────────────────────────────────────────────────
  const addStock = useCallback(async (symOverride?: string) => {
    const symbol = (symOverride ?? input).trim().toUpperCase()
    if (!symbol) return
    if (stocks.length >= 10) { setError('Maximum 10 stocks'); return }
    if (stocks.find(s => s.symbol === symbol)) { setError(`${symbol} already added`); return }

    setError(null)
    setLoading(symbol)
    setInput('')
    setSuggests([])
    setShowDrop(false)

    const color = COLORS[colorIdx.current % COLORS.length]
    colorIdx.current++
    const willBeFund = stocks.length < 3

    try {
      const [chartRes, fundRes] = await Promise.all([
        fetch(`/api/stock/compare?symbols=${symbol}&mode=chart`).then(r => r.json()),
        willBeFund
          ? fetch(`/api/stock/compare?symbols=${symbol}&mode=fundamentals`).then(r => r.json())
          : Promise.resolve(null),
      ])
      if (!Array.isArray(chartRes) || !chartRes[0]?.history?.length) {
        setError(`No data found for ${symbol}`)
        colorIdx.current--
        return
      }
      const history = chartRes[0].history as HistoryPoint[]
      const fund: FundData | null =
        Array.isArray(fundRes) && fundRes[0] ? (fundRes[0] as FundData) : null
      setStocks(prev => [...prev, { symbol, color, history, fund }])
    } catch {
      setError(`Failed to fetch ${symbol}`)
      colorIdx.current--
    } finally { setLoading(null) }
  }, [input, stocks])

  // ── Remove + auto-promote ─────────────────────────────────────────
  const removeStock = useCallback((symbol: string) => {
    setStocks(prev => {
      const next = prev.filter(s => s.symbol !== symbol)
      const needFund = next.slice(0, 3).filter(s => s.fund === null)
      if (needFund.length > 0) {
        Promise.all(
          needFund.map(s =>
            fetch(`/api/stock/compare?symbols=${s.symbol}&mode=fundamentals`)
              .then(r => r.json())
              .then(data => ({ symbol: s.symbol, data }))
              .catch(() => ({ symbol: s.symbol, data: null }))
          )
        ).then(results => {
          setStocks(curr =>
            curr.map(s => {
              const match = results.find(r => r.symbol === s.symbol)
              if (!match || !Array.isArray(match.data) || !match.data[0]) return s
              return { ...s, fund: match.data[0] as FundData }
            })
          )
        })
      }
      return next
    })
  }, [])

  // ── Normalized % return chart data ────────────────────────────────
  const chartData = useMemo(() => {
    if (!stocks.length) return []
    const cutoff = getPeriodCutoff(period)
    const filtered = stocks.map(s => ({
      symbol: s.symbol,
      data: s.history.filter(p => p.date >= cutoff),
    }))
    const baseMap: Record<string, number> = {}
    filtered.forEach(s => { if (s.data.length) baseMap[s.symbol] = s.data[0].price })
    const allDates = Array.from(
      new Set(filtered.flatMap(s => s.data.map(p => p.date)))
    ).sort()
    return allDates.map(date => {
      const pt: Record<string, any> = { date }
      filtered.forEach(s => {
        const bar = s.data.find(p => p.date === date)
        if (bar && baseMap[s.symbol]) {
          pt[s.symbol] = parseFloat(
            (((bar.price - baseMap[s.symbol]) / baseMap[s.symbol]) * 100).toFixed(2)
          )
        }
      })
      return pt
    })
  }, [stocks, period])

  const xTicks = useMemo(() => {
    const seen = new Set<string>()
    return chartData.reduce<string[]>((acc, p) => {
      const key = period === '5Y'
        ? String(p.date).substring(0, 4)
        : String(p.date).substring(0, 7)
      if (!seen.has(key)) { seen.add(key); acc.push(p.date) }
      return acc
    }, [])
  }, [chartData, period])

  const fmtXTick = (v: string) => {
    if (period === '5Y') return v.substring(0, 4)
    const parts = v.split('-')
    return MONTHS[parseInt(parts[1]) - 1] ?? v
  }

  const fundStocks = stocks
    .slice(0, 3)
    .filter(s => s.fund !== null) as (StockEntry & { fund: FundData })[]

  // ── Show skeleton while restoring ─────────────────────────────────
  if (restoring) return <CompareSkeleton />

  return (
    <div className="space-y-6">

      {/* ── Stock Selector ─────────────────────────────────────── */}
      <Card>
        <CardContent className="pt-4 space-y-3">
          {stocks.length > 0 && (
            <div className="flex flex-wrap gap-2">
              {stocks.map((stock, i) => (
                <div
                  key={stock.symbol}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-border bg-muted/40 text-sm"
                  style={{ borderLeftColor: stock.color, borderLeftWidth: 3 }}
                >
                  <div
                    className="h-2 w-2 rounded-full flex-shrink-0"
                    style={{ backgroundColor: stock.color }}
                  />
                  <span className="font-semibold">{stock.symbol}</span>
                  <span
                    className="text-xs px-1.5 py-0.5 rounded font-medium"
                    style={{
                      backgroundColor: i < 3 ? 'rgba(34,197,94,0.15)' : 'rgba(148,163,184,0.12)',
                      color: i < 3 ? '#22c55e' : '#94a3b8',
                    }}
                  >
                    {i < 3 ? 'Chart + Fund' : 'Chart only'}
                  </span>
                  <button
                    onClick={() => removeStock(stock.symbol)}
                    className="text-muted-foreground hover:text-foreground ml-1 transition-colors"
                  >
                    <X className="h-3.5 w-3.5" />
                  </button>
                </div>
              ))}
            </div>
          )}

          <div className="flex gap-2 items-start">
            <div className="relative flex-1 max-w-sm" ref={dropRef}>
              <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground z-10" />
              {searching && (
                <RefreshCw className="absolute right-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 animate-spin text-muted-foreground z-10" />
              )}
              <Input
                placeholder="Search by name or ticker (e.g. Apple or AAPL)"
                value={input}
                onChange={e => handleInput(e.target.value)}
                onKeyDown={e => {
                  if (e.key === 'Enter') {
                    if (suggests.length) addStock(suggests[0].symbol)
                    else if (input.trim()) addStock()
                  }
                  if (e.key === 'Escape') setShowDrop(false)
                }}
                onFocus={() => { if (input.trim()) setShowDrop(true) }}
                className="pl-8 pr-8"
                disabled={loading !== null}
              />
              {showDrop && suggests.length > 0 && (
                <div className="absolute top-full left-0 right-0 mt-1 bg-card border border-border rounded-lg shadow-xl z-50 overflow-hidden">
                  {suggests.map(s => (
                    <button
                      key={s.symbol}
                      onMouseDown={e => { e.preventDefault(); addStock(s.symbol) }}
                      className="flex items-center justify-between w-full px-3 py-2.5 hover:bg-muted/60 transition-colors text-left"
                    >
                      <div className="flex items-center gap-2 min-w-0">
                        <span className="font-semibold text-sm w-16 flex-shrink-0">{s.symbol}</span>
                        <span className="text-xs text-muted-foreground truncate">{s.name}</span>
                      </div>
                      <span className="text-xs text-muted-foreground ml-2 flex-shrink-0">{s.exchange}</span>
                    </button>
                  ))}
                </div>
              )}
            </div>
            <Button
              onClick={() => addStock()}
              disabled={loading !== null || !input.trim() || stocks.length >= 10}
              size="sm"
              className="flex-shrink-0"
            >
              {loading
                ? <RefreshCw className="h-4 w-4 animate-spin mr-1" />
                : <Plus className="h-4 w-4 mr-1" />}
              Add
            </Button>
          </div>

          {error && <p className="text-xs text-red-500">{error}</p>}
          {loading && <p className="text-xs text-muted-foreground">Fetching {loading}...</p>}

          <p className="text-xs text-muted-foreground">
            {stocks.length}/10 stocks ·{' '}
            <span className="text-green-500">Chart + Fund</span> = first 3 ·{' '}
            <span style={{ color: '#94a3b8' }}>Chart only</span> = stocks 4–10
          </p>
        </CardContent>
      </Card>

      {/* ── Empty state ─────────────────────────────────────────── */}
      {stocks.length === 0 ? (
        <Card>
          <CardContent className="py-24 text-center">
            <BarChart3 className="h-10 w-10 mx-auto mb-3 opacity-30" style={{ color: '#94a3b8' }} />
            <p className="text-sm text-muted-foreground">Search for stocks above to start comparing</p>
            <p className="text-xs text-muted-foreground mt-1 opacity-60">
              Try "Apple", "Tesla", or type a ticker like NVDA
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-6">

          {/* ── Period Selector ──────────────────────────────────── */}
          <div className="flex gap-1">
            {CHART_PERIODS.map(p => (
              <button
                key={p}
                onClick={() => setPeriod(p)}
                className={`px-3 py-1 text-xs font-medium rounded-md transition-colors ${period === p
                    ? 'bg-primary text-primary-foreground'
                    : 'hover:bg-muted text-muted-foreground'
                  }`}
              >
                {p}
              </button>
            ))}
          </div>

          {/* ── % Return Chart ────────────────────────────────────── */}
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-base">% Return — {period}</CardTitle>
              <CardDescription>All stocks normalized to 0% at period start</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="h-[380px]">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={chartData} margin={{ top: 8, right: 16, left: 0, bottom: 0 }}>
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
                      tickFormatter={v => `${v > 0 ? '+' : ''}${Number(v).toFixed(0)}%`}
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
                        `${v >= 0 ? '+' : ''}${v.toFixed(2)}%`, name,
                      ]}
                      labelStyle={{ color: '#94a3b8', fontSize: 11 }}
                    />
                    <Legend wrapperStyle={{ fontSize: 12 }} />
                    {stocks.map(stock => (
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

          {/* ── Fundamentals ─────────────────────────────────────── */}
          {fundStocks.length > 0 && (
            <div className="space-y-4">
              <div>
                <h2 className="text-lg font-semibold">Fundamentals</h2>
                <p className="text-sm text-muted-foreground">
                  First 3 stocks · 12hr cache · Finnhub
                </p>
              </div>

              {/* Price cards */}
              <div className={`grid gap-4 ${fundStocks.length === 1 ? 'grid-cols-1 max-w-sm' :
                  fundStocks.length === 2 ? 'grid-cols-2' : 'grid-cols-3'
                }`}>
                {fundStocks.map(stock => (
                  <Card
                    key={stock.symbol}
                    style={{ borderTopColor: stock.color, borderTopWidth: 3 }}
                  >
                    <CardContent className="p-4">
                      <div className="flex items-start justify-between mb-3">
                        <div className="min-w-0">
                          <div className="flex items-center gap-1.5 mb-0.5 flex-wrap">
                            <p className="font-bold text-lg">{stock.symbol}</p>
                            {stock.fund.exchange && (
                              <span
                                className="text-xs border border-border rounded px-1.5 py-0.5"
                                style={{ color: '#94a3b8' }}
                              >
                                {stock.fund.exchange}
                              </span>
                            )}
                          </div>
                          <p className="text-xs text-muted-foreground truncate">{stock.fund.name}</p>
                          {stock.fund.sector && (
                            <p className="text-xs text-muted-foreground opacity-60">{stock.fund.sector}</p>
                          )}
                        </div>
                        {stock.fund.logo && (
                          <img
                            src={stock.fund.logo}
                            alt={stock.symbol}
                            className="h-9 w-9 rounded object-contain flex-shrink-0 ml-2"
                            onError={e => ((e.target as HTMLImageElement).style.display = 'none')}
                          />
                        )}
                      </div>
                      <p className="text-2xl font-bold">{fmtPrice(stock.fund.price)}</p>
                      {stock.fund.changePercent != null && (
                        <div className={`flex items-center gap-1 text-sm mt-1 ${stock.fund.changePercent >= 0 ? 'text-green-500' : 'text-red-500'
                          }`}>
                          {stock.fund.changePercent >= 0
                            ? <ArrowUpRight className="h-4 w-4" />
                            : <ArrowDownRight className="h-4 w-4" />}
                          <span>
                            {stock.fund.changePercent >= 0 ? '+' : ''}
                            {stock.fund.changePercent.toFixed(2)}%
                          </span>
                          <span className="text-muted-foreground text-xs">today</span>
                        </div>
                      )}
                    </CardContent>
                  </Card>
                ))}
              </div>

              {/* Comparison table */}
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-base">Side-by-Side Comparison</CardTitle>
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
                          <TableHead className="w-[190px]">Metric</TableHead>
                          {fundStocks.map(stock => (
                            <TableHead key={stock.symbol} className="text-center">
                              <div className="flex items-center justify-center gap-1.5">
                                <div
                                  className="h-2.5 w-2.5 rounded-full flex-shrink-0"
                                  style={{ backgroundColor: stock.color }}
                                />
                                {stock.symbol}
                              </div>
                            </TableHead>
                          ))}
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {METRICS.map(metric => {
                          if (metric.key === '__52wk__') {
                            return (
                              <TableRow key="52wk">
                                <TableCell className="text-sm font-medium">52-Wk Range</TableCell>
                                {fundStocks.map(stock => (
                                  <TableCell key={stock.symbol} className="text-center text-sm">
                                    {stock.fund.low52 && stock.fund.high52
                                      ? `${fmtPrice(stock.fund.low52)} – ${fmtPrice(stock.fund.high52)}`
                                      : '—'}
                                  </TableCell>
                                ))}
                              </TableRow>
                            )
                          }
                          const vals = fundStocks.map(s => (s.fund as any)[metric.key] as number | null)
                          const { best, worst } = metric.hb != null
                            ? getBestWorst(vals, metric.hb as boolean)
                            : { best: null, worst: null }
                          return (
                            <TableRow key={metric.label}>
                              <TableCell className="text-sm font-medium">{metric.label}</TableCell>
                              {fundStocks.map(stock => {
                                const val = (stock.fund as any)[metric.key]
                                return (
                                  <TableCell
                                    key={stock.symbol}
                                    className={`text-center text-sm ${cellCls(val, best, worst)}`}
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
            </div>
          )}
        </div>
      )}
    </div>
  )
}

// ── Page ──────────────────────────────────────────────────────────────
export default function ComparePage() {
  const [pageTab, setPageTab] = useState<PageTab>('compare')

  return (
    <div className="p-4 lg:p-6 space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Compare Stocks</h1>
        <p className="text-muted-foreground">
          {pageTab === 'compare'
            ? 'Up to 10 stocks on chart · fundamentals for first 3'
            : 'Build a 5-year price projection for any stock'}
        </p>
      </div>

      {/* ── Top-level tab bar ──────────────────────────────────── */}
      <div className="flex gap-0 border-b border-border">
        {([
          { key: 'compare', label: 'Compare' },
          { key: 'projection', label: 'Projection' },
        ] as { key: PageTab; label: string }[]).map(tab => (
          <button
            key={tab.key}
            onClick={() => setPageTab(tab.key)}
            className={`px-6 py-2.5 text-sm font-medium border-b-2 transition-colors ${pageTab === tab.key
                ? 'border-primary text-foreground'
                : 'border-transparent text-muted-foreground hover:text-foreground'
              }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {pageTab === 'compare' && <CompareTab />}
      {pageTab === 'projection' && <ProjectionTab />}
    </div>
  )
}
