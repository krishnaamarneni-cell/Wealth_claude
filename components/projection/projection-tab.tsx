"use client"

import { useState, useEffect, useCallback, useMemo, useRef } from "react"
import {
  ComposedChart, Line, Area, XAxis, YAxis, CartesianGrid,
  Tooltip, ResponsiveContainer, ReferenceLine, Legend
} from "recharts"
import {
  Search, RefreshCw, RotateCcw, TrendingUp,
  TrendingDown, Minus, BarChart3, ChevronDown
} from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"

// ── Types ─────────────────────────────────────────────────────────────
interface StockData {
  symbol: string
  name: string
  logo: string | null
  exchange: string | null
  sector: string | null
  marketCap: number | null
  price: number
  eps: number | null
  netMargin: number | null
  pe: number | null
  revGrowth: number | null
  revenue: number | null
  sharesOut: number | null
}

interface CaseAssumptions {
  revGrowth: number
  netMargin: number
  peLow: number
  peHigh: number
}

interface Assumptions {
  bear: CaseAssumptions
  base: CaseAssumptions
  bull: CaseAssumptions
}

interface YearRow {
  year: number
  revenue: number
  netIncome: number
  margin: number
  eps: number
  peLow: number
  peHigh: number
  priceLow: number
  priceHigh: number
  cagrLow: number
  cagrHigh: number
}

type CaseKey = 'bear' | 'base' | 'bull'

// ── Formatters ────────────────────────────────────────────────────────
function fmtBig(v: number | null): string {
  if (v == null || !isFinite(v)) return '—'
  if (v >= 1e12) return `$${(v / 1e12).toFixed(2)}T`
  if (v >= 1e9) return `$${(v / 1e9).toFixed(2)}B`
  if (v >= 1e6) return `$${(v / 1e6).toFixed(2)}M`
  return `$${v.toLocaleString()}`
}
function fmtShares(v: number | null): string {
  if (v == null || !isFinite(v)) return '—'
  if (v >= 1e9) return `${(v / 1e9).toFixed(2)}B`
  if (v >= 1e6) return `${(v / 1e6).toFixed(2)}M`
  return v.toLocaleString()
}
function fmtP(v: number): string {
  return new Intl.NumberFormat('en-US', {
    style: 'currency', currency: 'USD',
    minimumFractionDigits: 0, maximumFractionDigits: 0,
  }).format(v)
}
function fmtPExact(v: number): string {
  return new Intl.NumberFormat('en-US', {
    style: 'currency', currency: 'USD',
    minimumFractionDigits: 2,
  }).format(v)
}
function fmtPct(v: number, sign = true): string {
  return `${sign && v >= 0 ? '+' : ''}${v.toFixed(1)}%`
}
function fmtNum(v: number): string {
  return v.toFixed(2)
}

// ── Build defaults from Finnhub TTM ──────────────────────────────────
function buildDefaults(s: StockData): Assumptions {
  const rg = s.revGrowth ?? 10
  const nm = s.netMargin ?? 15
  const pe = s.pe ?? 20

  return {
    bear: {
      revGrowth: +Math.max(rg - 5, 0).toFixed(1),
      netMargin: +Math.max(nm - 3, 1).toFixed(1),
      peLow: +Math.max(pe * 0.70, 5).toFixed(1),
      peHigh: +Math.max(pe * 0.85, 8).toFixed(1),
    },
    base: {
      revGrowth: +rg.toFixed(1),
      netMargin: +nm.toFixed(1),
      peLow: +(pe * 0.90).toFixed(1),
      peHigh: +(pe * 1.10).toFixed(1),
    },
    bull: {
      revGrowth: +(rg + 8).toFixed(1),
      netMargin: +(nm + 5).toFixed(1),
      peLow: +pe.toFixed(1),
      peHigh: +(pe * 1.30).toFixed(1),
    },
  }
}

// ── Run 5-year projection for one case ───────────────────────────────
function runCase(s: StockData, a: CaseAssumptions): YearRow[] {
  const startRev =
    s.revenue ??
    (s.eps && s.sharesOut && s.netMargin
      ? (s.eps * s.sharesOut) / (s.netMargin / 100)
      : 1)
  const shares = s.sharesOut ?? 1
  const rows: YearRow[] = []
  let prevRev = startRev

  for (let y = 1; y <= 5; y++) {
    const revenue = prevRev * (1 + a.revGrowth / 100)
    const netIncome = revenue * (a.netMargin / 100)
    const eps = shares > 0 ? netIncome / shares : 0
    const priceLow = eps * a.peLow
    const priceHigh = eps * a.peHigh
    const cagrLow = s.price > 0 ? (Math.pow(priceLow / s.price, 1 / y) - 1) * 100 : 0
    const cagrHigh = s.price > 0 ? (Math.pow(priceHigh / s.price, 1 / y) - 1) * 100 : 0
    rows.push({
      year: new Date().getFullYear() + y,
      revenue, netIncome, margin: a.netMargin,
      eps, peLow: a.peLow, peHigh: a.peHigh,
      priceLow, priceHigh, cagrLow, cagrHigh,
    })
    prevRev = revenue
  }
  return rows
}

// ── localStorage ──────────────────────────────────────────────────────
const lsKey = (sym: string) => `projection_assumptions_${sym}`
function lsLoad(sym: string): Assumptions | null {
  try { const r = localStorage.getItem(lsKey(sym)); return r ? JSON.parse(r) : null }
  catch { return null }
}
function lsSave(sym: string, a: Assumptions) {
  try { localStorage.setItem(lsKey(sym), JSON.stringify(a)) } catch { }
}

// ── Case config ───────────────────────────────────────────────────────
const CASES: { key: CaseKey; label: string; color: string; areaColor: string; icon: any }[] = [
  { key: 'bear', label: 'Bear', color: '#ef4444', areaColor: 'rgba(239,68,68,0.12)', icon: TrendingDown },
  { key: 'base', label: 'Base', color: '#94a3b8', areaColor: 'rgba(148,163,184,0.12)', icon: Minus },
  { key: 'bull', label: 'Bull', color: '#22c55e', areaColor: 'rgba(34,197,94,0.12)', icon: TrendingUp },
]

const FIELDS: { key: keyof CaseAssumptions; label: string; suffix: string; hint: string }[] = [
  { key: 'revGrowth', label: 'Rev Growth', suffix: '%', hint: 'Annual revenue growth rate' },
  { key: 'netMargin', label: 'Net Margin', suffix: '%', hint: 'Net income ÷ revenue' },
  { key: 'peLow', label: 'P/E Low Est', suffix: 'x', hint: 'Conservative price multiple' },
  { key: 'peHigh', label: 'P/E High Est', suffix: 'x', hint: 'Optimistic price multiple' },
]

// ── Custom Tooltip ────────────────────────────────────────────────────
function ChartTooltip({ active, payload, label }: any) {
  if (!active || !payload?.length) return null
  return (
    <div className="bg-card border border-border rounded-lg px-3 py-2.5 shadow-xl text-xs space-y-1 min-w-[180px]">
      <p className="font-semibold text-foreground mb-1.5">{label}</p>
      {CASES.map(c => {
        const lo = payload.find((p: any) => p.dataKey === `${c.key}_low`)?.value
        const hi = payload.find((p: any) => p.dataKey === `${c.key}_high`)?.value
        if (lo == null && hi == null) return null
        return (
          <div key={c.key} className="flex items-center justify-between gap-4">
            <div className="flex items-center gap-1.5">
              <div className="h-2 w-2 rounded-full" style={{ backgroundColor: c.color }} />
              <span style={{ color: '#94a3b8' }}>{c.label}</span>
            </div>
            <span className="font-medium" style={{ color: c.color }}>
              {lo != null && hi != null ? `${fmtP(lo)} – ${fmtP(hi)}` : '—'}
            </span>
          </div>
        )
      })}
    </div>
  )
}

// ── Main Component ────────────────────────────────────────────────────
export default function ProjectionTab() {
  const [stock, setStock] = useState<StockData | null>(null)
  const [assumptions, setAssumptions] = useState<Assumptions | null>(null)
  const [defaults, setDefaults] = useState<Assumptions | null>(null)
  const [input, setInput] = useState('')
  const [suggestions, setSuggestions] = useState<{ symbol: string; name: string; exchange: string }[]>([])
  const [searching, setSearching] = useState(false)
  const [showDrop, setShowDrop] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [activeCase, setActiveCase] = useState<CaseKey>('base')
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const dropRef = useRef<HTMLDivElement>(null)

  // Close dropdown on outside click
  useEffect(() => {
    const fn = (e: MouseEvent) => {
      if (dropRef.current && !dropRef.current.contains(e.target as Node))
        setShowDrop(false)
    }
    document.addEventListener('mousedown', fn)
    return () => document.removeEventListener('mousedown', fn)
  }, [])

  // Debounced search
  const handleInput = useCallback((val: string) => {
    setInput(val)
    setError(null)
    setShowDrop(true)
    if (timerRef.current) clearTimeout(timerRef.current)
    if (!val.trim()) { setSuggestions([]); setSearching(false); return }
    setSearching(true)
    timerRef.current = setTimeout(async () => {
      try {
        const r = await fetch(`/api/stock/search?q=${encodeURIComponent(val)}`)
        const d = await r.json()
        setSuggestions(Array.isArray(d) ? d : [])
      } catch { setSuggestions([]) }
      finally { setSearching(false) }
    }, 300)
  }, [])

  // Load stock
  const loadStock = useCallback(async (symbol: string) => {
    setLoading(true)
    setError(null)
    setInput('')
    setSuggestions([])
    setShowDrop(false)
    try {
      const r = await fetch(`/api/stock/projection?symbol=${symbol}`)
      const d = await r.json()
      if (d.error || !d.price) { setError(`No projection data for ${symbol}`); return }
      const s = d as StockData
      setStock(s)
      const def = buildDefaults(s)
      setDefaults(def)
      const saved = lsLoad(symbol)
      setAssumptions(saved ?? def)
    } catch { setError(`Failed to fetch ${symbol}`) }
    finally { setLoading(false) }
  }, [])

  // Edit assumption field
  const edit = useCallback((caseKey: CaseKey, field: keyof CaseAssumptions, raw: string) => {
    if (!assumptions || !stock) return
    const val = parseFloat(raw)
    const next: Assumptions = {
      ...assumptions,
      [caseKey]: { ...assumptions[caseKey], [field]: isNaN(val) ? 0 : val },
    }
    setAssumptions(next)
    lsSave(stock.symbol, next)
  }, [assumptions, stock])

  // Reset one case to Finnhub defaults
  const resetCase = useCallback((caseKey: CaseKey) => {
    if (!defaults || !assumptions || !stock) return
    const next = { ...assumptions, [caseKey]: defaults[caseKey] }
    setAssumptions(next)
    lsSave(stock.symbol, next)
  }, [defaults, assumptions, stock])

  // Reset all cases
  const resetAll = useCallback(() => {
    if (!defaults || !stock) return
    setAssumptions(defaults)
    lsSave(stock.symbol, defaults)
  }, [defaults, stock])

  // Compute projections
  const proj = useMemo(() => {
    if (!stock || !assumptions) return null
    return {
      bear: runCase(stock, assumptions.bear),
      base: runCase(stock, assumptions.base),
      bull: runCase(stock, assumptions.bull),
    }
  }, [stock, assumptions])

  // Chart data
  const chartData = useMemo(() => {
    if (!proj || !stock) return []
    const now = new Date().getFullYear()
    return [
      {
        label: 'Now',
        bear_low: stock.price, bear_high: stock.price,
        base_low: stock.price, base_high: stock.price,
        bull_low: stock.price, bull_high: stock.price,
      },
      ...proj.bear.map((_, i) => ({
        label: `Y${i + 1} ${now + i + 1}`,
        bear_low: proj.bear[i].priceLow,
        bear_high: proj.bear[i].priceHigh,
        base_low: proj.base[i].priceLow,
        base_high: proj.base[i].priceHigh,
        bull_low: proj.bull[i].priceLow,
        bull_high: proj.bull[i].priceHigh,
      })),
    ]
  }, [proj, stock])

  const y5 = proj
    ? { bear: proj.bear[4], base: proj.base[4], bull: proj.bull[4] }
    : null

  const activeRows = proj?.[activeCase] ?? []

  return (
    <div className="space-y-6">

      {/* ── Stock Search ──────────────────────────────────────── */}
      <Card>
        <CardContent className="pt-4 space-y-2">
          <div className="flex items-center justify-between">
            <p className="text-sm font-semibold">Select Stock</p>
            {stock && (
              <Button variant="ghost" size="sm" onClick={resetAll} className="h-7 text-xs gap-1.5 text-muted-foreground">
                <RotateCcw className="h-3 w-3" /> Reset all assumptions
              </Button>
            )}
          </div>

          <div className="flex gap-2 items-start">
            <div className="relative flex-1 max-w-sm" ref={dropRef}>
              <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground z-10" />
              {searching && (
                <RefreshCw className="absolute right-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 animate-spin text-muted-foreground z-10" />
              )}
              <Input
                placeholder="Search by name or ticker..."
                value={input}
                onChange={e => handleInput(e.target.value)}
                onKeyDown={e => {
                  if (e.key === 'Enter') {
                    if (suggestions.length) loadStock(suggestions[0].symbol)
                    else if (input.trim()) loadStock(input.trim().toUpperCase())
                  }
                  if (e.key === 'Escape') setShowDrop(false)
                }}
                onFocus={() => { if (input.trim()) setShowDrop(true) }}
                className="pl-8 pr-8"
                disabled={loading}
              />
              {showDrop && suggestions.length > 0 && (
                <div className="absolute top-full left-0 right-0 mt-1 bg-card border border-border rounded-lg shadow-xl z-50 overflow-hidden">
                  {suggestions.map(s => (
                    <button
                      key={s.symbol}
                      onMouseDown={e => { e.preventDefault(); loadStock(s.symbol) }}
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
            {loading && <RefreshCw className="h-5 w-5 animate-spin mt-2 text-muted-foreground flex-shrink-0" />}
          </div>

          {error && <p className="text-xs text-red-500">{error}</p>}
          {!stock && !loading && (
            <p className="text-xs text-muted-foreground">
              Assumptions auto-filled from Finnhub TTM data · Editable · Saved per stock
            </p>
          )}
        </CardContent>
      </Card>

      {/* ── Empty state ───────────────────────────────────────── */}
      {!stock && !loading && (
        <Card>
          <CardContent className="py-24 text-center">
            <BarChart3 className="h-10 w-10 mx-auto mb-3 opacity-30" style={{ color: '#94a3b8' }} />
            <p className="text-sm text-muted-foreground">Search for a stock to build a projection</p>
            <p className="text-xs text-muted-foreground mt-1 opacity-60">
              Try Apple, Microsoft, or any US stock
            </p>
          </CardContent>
        </Card>
      )}

      {stock && assumptions && proj && (
        <>
          {/* ── Snapshot Bar ────────────────────────────────────── */}
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-2">
            {[
              { label: 'Current Price', value: fmtPExact(stock.price) },
              { label: 'EPS (TTM)', value: stock.eps != null ? `$${stock.eps.toFixed(2)}` : '—' },
              { label: 'P/E (TTM)', value: stock.pe != null ? stock.pe.toFixed(1) : '—' },
              { label: 'Revenue (TTM)', value: fmtBig(stock.revenue) },
              { label: 'Net Margin (TTM)', value: stock.netMargin != null ? `${stock.netMargin.toFixed(1)}%` : '—' },
              { label: 'Shares Out', value: fmtShares(stock.sharesOut) },
            ].map(item => (
              <div key={item.label} className="bg-muted/40 rounded-lg p-3">
                <p className="text-xs text-muted-foreground mb-1">{item.label}</p>
                <p className="text-sm font-semibold text-foreground">{item.value}</p>
              </div>
            ))}
          </div>

          {/* Stock name bar */}
          <div className="flex items-center gap-3">
            {stock.logo && (
              <img
                src={stock.logo} alt={stock.symbol}
                className="h-8 w-8 rounded object-contain"
                onError={e => (e.target as HTMLImageElement).style.display = 'none'}
              />
            )}
            <div>
              <p className="font-bold text-lg leading-none">{stock.symbol}</p>
              <p className="text-xs text-muted-foreground">{stock.name}{stock.sector ? ` · ${stock.sector}` : ''}</p>
            </div>
            <p className="ml-auto text-xs text-muted-foreground">
              Defaults from Finnhub TTM · Saved to localStorage
            </p>
          </div>

          {/* ── Assumption Editor — 3 columns ──────────────────── */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {CASES.map(c => (
              <Card
                key={c.key}
                className="border-t-2"
                style={{ borderTopColor: c.color }}
              >
                <CardHeader className="pb-2 pt-4 px-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <c.icon className="h-4 w-4" style={{ color: c.color }} />
                      <CardTitle className="text-sm font-semibold" style={{ color: c.color }}>
                        {c.label} Case
                      </CardTitle>
                    </div>
                    <button
                      onClick={() => resetCase(c.key)}
                      className="flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground transition-colors"
                    >
                      <RotateCcw className="h-3 w-3" /> Reset
                    </button>
                  </div>
                </CardHeader>
                <CardContent className="px-4 pb-4 space-y-3">
                  {FIELDS.map(f => (
                    <div key={f.key}>
                      <div className="flex items-center justify-between mb-1">
                        <label className="text-xs text-muted-foreground">{f.label}</label>
                        <span className="text-xs text-muted-foreground">{f.hint}</span>
                      </div>
                      <div className="relative">
                        <Input
                          type="number"
                          step={f.suffix === '%' ? 0.5 : 1}
                          value={assumptions[c.key][f.key]}
                          onChange={e => edit(c.key, f.key, e.target.value)}
                          className="pr-7 text-sm h-8"
                        />
                        <span
                          className="absolute right-2.5 top-1/2 -translate-y-1/2 text-xs pointer-events-none"
                          style={{ color: '#94a3b8' }}
                        >
                          {f.suffix}
                        </span>
                      </div>
                    </div>
                  ))}

                  {/* Live preview of Y5 inside editor */}
                  {(() => {
                    const y5row = proj[c.key][4]
                    const upside = stock.price > 0
                      ? ((y5row.priceHigh - stock.price) / stock.price) * 100
                      : 0
                    return (
                      <div
                        className="mt-3 pt-3 border-t border-border rounded-md p-2"
                        style={{ backgroundColor: c.areaColor }}
                      >
                        <p className="text-xs text-muted-foreground mb-1">Y5 Estimate</p>
                        <p className="text-sm font-bold" style={{ color: c.color }}>
                          {fmtP(y5row.priceLow)} – {fmtP(y5row.priceHigh)}
                        </p>
                        <p className="text-xs text-muted-foreground mt-0.5">
                          EPS: ${y5row.eps.toFixed(2)} · Upside: {fmtPct(upside)}
                        </p>
                      </div>
                    )
                  })()}
                </CardContent>
              </Card>
            ))}
          </div>

          {/* ── Price Band Chart ───────────────────────────────── */}
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-base">5-Year Price Projection</CardTitle>
              <CardDescription>
                Price range bands per case · dashed line = current price ${stock.price.toFixed(2)}
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="h-[380px]">
                <ResponsiveContainer width="100%" height="100%">
                  <ComposedChart data={chartData} margin={{ top: 8, right: 24, left: 0, bottom: 0 }}>
                    <defs>
                      {CASES.map(c => (
                        <linearGradient key={c.key} id={`grad_${c.key}`} x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor={c.color} stopOpacity={0.18} />
                          <stop offset="95%" stopColor={c.color} stopOpacity={0.04} />
                        </linearGradient>
                      ))}
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                    <ReferenceLine
                      y={stock.price}
                      stroke="#94a3b8"
                      strokeDasharray="5 5"
                      strokeWidth={1.5}
                      label={{ value: `Now $${stock.price.toFixed(0)}`, position: 'insideTopRight', fill: '#94a3b8', fontSize: 10 }}
                    />
                    <XAxis
                      dataKey="label"
                      tick={{ fill: '#94a3b8', fontSize: 10 }}
                      tickLine={false}
                      axisLine={false}
                    />
                    <YAxis
                      tickFormatter={v => `$${Number(v).toFixed(0)}`}
                      tick={{ fill: '#94a3b8', fontSize: 10 }}
                      tickLine={false}
                      axisLine={false}
                      width={65}
                    />
                    <Tooltip content={<ChartTooltip />} />

                    {/* Bear band */}
                    <Area
                      type="monotone"
                      dataKey="bear_high"
                      stroke="#ef4444"
                      strokeWidth={1.5}
                      fill="url(#grad_bear)"
                      dot={false}
                      legendType="none"
                    />
                    <Line
                      type="monotone"
                      dataKey="bear_low"
                      stroke="#ef4444"
                      strokeWidth={1.5}
                      strokeDasharray="4 2"
                      dot={false}
                      name="Bear"
                    />

                    {/* Base band */}
                    <Area
                      type="monotone"
                      dataKey="base_high"
                      stroke="#94a3b8"
                      strokeWidth={1.5}
                      fill="url(#grad_base)"
                      dot={false}
                      legendType="none"
                    />
                    <Line
                      type="monotone"
                      dataKey="base_low"
                      stroke="#94a3b8"
                      strokeWidth={1.5}
                      strokeDasharray="4 2"
                      dot={false}
                      name="Base"
                    />

                    {/* Bull band */}
                    <Area
                      type="monotone"
                      dataKey="bull_high"
                      stroke="#22c55e"
                      strokeWidth={1.5}
                      fill="url(#grad_bull)"
                      dot={false}
                      legendType="none"
                    />
                    <Line
                      type="monotone"
                      dataKey="bull_low"
                      stroke="#22c55e"
                      strokeWidth={1.5}
                      strokeDasharray="4 2"
                      dot={false}
                      name="Bull"
                    />
                  </ComposedChart>
                </ResponsiveContainer>
              </div>

              {/* Y5 upside labels below chart */}
              <div className="grid grid-cols-3 gap-3 mt-4">
                {CASES.map(c => {
                  const row = proj[c.key][4]
                  const upsLo = stock.price > 0 ? ((row.priceLow - stock.price) / stock.price) * 100 : 0
                  const upsHi = stock.price > 0 ? ((row.priceHigh - stock.price) / stock.price) * 100 : 0
                  return (
                    <div
                      key={c.key}
                      className="rounded-lg p-3 text-center"
                      style={{ backgroundColor: c.areaColor, border: `1px solid ${c.color}30` }}
                    >
                      <p className="text-xs font-medium mb-1" style={{ color: c.color }}>{c.label}</p>
                      <p className="text-sm font-bold text-foreground">
                        {fmtP(row.priceLow)} – {fmtP(row.priceHigh)}
                      </p>
                      <p className="text-xs mt-0.5" style={{ color: c.color }}>
                        {fmtPct(upsLo)} to {fmtPct(upsHi)} upside
                      </p>
                    </div>
                  )
                })}
              </div>
            </CardContent>
          </Card>

          {/* ── Y5 Summary Cards ────────────────────────────────── */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {CASES.map(c => {
              const row = proj[c.key][4]
              return (
                <Card key={c.key} style={{ borderTopColor: c.color, borderTopWidth: 3 }}>
                  <CardContent className="p-4 space-y-2">
                    <div className="flex items-center gap-2">
                      <c.icon className="h-4 w-4" style={{ color: c.color }} />
                      <p className="text-sm font-semibold" style={{ color: c.color }}>{c.label} Case · Year 5</p>
                    </div>
                    <div className="space-y-1 text-sm">
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Revenue</span>
                        <span className="font-medium">{fmtBig(row.revenue)}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Net Income</span>
                        <span className="font-medium">{fmtBig(row.netIncome)}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">EPS</span>
                        <span className="font-medium">${row.eps.toFixed(2)}</span>
                      </div>
                      <div className="flex justify-between border-t border-border pt-1 mt-1">
                        <span className="text-muted-foreground">Price Range</span>
                        <span className="font-bold" style={{ color: c.color }}>
                          {fmtP(row.priceLow)} – {fmtP(row.priceHigh)}
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">CAGR Range</span>
                        <span className="font-medium">
                          {row.cagrLow.toFixed(1)}% – {row.cagrHigh.toFixed(1)}%
                        </span>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              )
            })}
          </div>

          {/* ── Year-by-Year Table — tabbed by case ─────────────── */}
          <Card>
            <CardHeader className="pb-0">
              <div className="flex items-center justify-between flex-wrap gap-3">
                <div>
                  <CardTitle className="text-base">Year-by-Year Breakdown</CardTitle>
                  <CardDescription>Detailed projections per year</CardDescription>
                </div>
                {/* Case tab switcher */}
                <div className="flex gap-0 border border-border rounded-lg overflow-hidden">
                  {CASES.map(c => (
                    <button
                      key={c.key}
                      onClick={() => setActiveCase(c.key)}
                      className="px-4 py-1.5 text-xs font-medium transition-colors"
                      style={{
                        backgroundColor: activeCase === c.key ? c.color : 'transparent',
                        color: activeCase === c.key ? '#fff' : '#94a3b8',
                      }}
                    >
                      {c.label}
                    </button>
                  ))}
                </div>
              </div>
            </CardHeader>
            <CardContent className="pt-4">
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-border text-xs text-muted-foreground">
                      <th className="text-left pb-2 font-medium">Year</th>
                      <th className="text-right pb-2 font-medium">Revenue</th>
                      <th className="text-right pb-2 font-medium">Net Income</th>
                      <th className="text-right pb-2 font-medium">Margin</th>
                      <th className="text-right pb-2 font-medium">EPS</th>
                      <th className="text-right pb-2 font-medium">P/E Lo / Hi</th>
                      <th className="text-right pb-2 font-medium">Price Lo / Hi</th>
                      <th className="text-right pb-2 font-medium">CAGR Lo / Hi</th>
                    </tr>
                  </thead>
                  <tbody>
                    {/* Current row */}
                    <tr className="border-b border-border/50">
                      <td className="py-2.5 font-medium text-muted-foreground">Now</td>
                      <td className="text-right py-2.5">{fmtBig(stock.revenue)}</td>
                      <td className="text-right py-2.5">
                        {stock.revenue && stock.netMargin
                          ? fmtBig(stock.revenue * stock.netMargin / 100)
                          : '—'}
                      </td>
                      <td className="text-right py-2.5">
                        {stock.netMargin != null ? `${stock.netMargin.toFixed(1)}%` : '—'}
                      </td>
                      <td className="text-right py-2.5">
                        {stock.eps != null ? `$${stock.eps.toFixed(2)}` : '—'}
                      </td>
                      <td className="text-right py-2.5 text-muted-foreground">—</td>
                      <td className="text-right py-2.5 font-semibold">{fmtPExact(stock.price)}</td>
                      <td className="text-right py-2.5 text-muted-foreground">—</td>
                    </tr>

                    {/* Projected rows */}
                    {activeRows.map((row, i) => {
                      const caseColor = CASES.find(c => c.key === activeCase)!.color
                      return (
                        <tr
                          key={row.year}
                          className="border-b border-border/50 hover:bg-muted/30 transition-colors"
                        >
                          <td className="py-2.5 font-semibold">{row.year}</td>
                          <td className="text-right py-2.5">{fmtBig(row.revenue)}</td>
                          <td className="text-right py-2.5">{fmtBig(row.netIncome)}</td>
                          <td className="text-right py-2.5">{row.margin.toFixed(1)}%</td>
                          <td className="text-right py-2.5">${row.eps.toFixed(2)}</td>
                          <td className="text-right py-2.5 text-muted-foreground">
                            {row.peLow.toFixed(0)}x / {row.peHigh.toFixed(0)}x
                          </td>
                          <td className="text-right py-2.5 font-semibold" style={{ color: caseColor }}>
                            {fmtP(row.priceLow)} – {fmtP(row.priceHigh)}
                          </td>
                          <td className="text-right py-2.5">
                            <span className={row.cagrLow >= 0 ? 'text-green-500' : 'text-red-500'}>
                              {row.cagrLow.toFixed(1)}%
                            </span>
                            {' / '}
                            <span className={row.cagrHigh >= 0 ? 'text-green-500' : 'text-red-500'}>
                              {row.cagrHigh.toFixed(1)}%
                            </span>
                          </td>
                        </tr>
                      )
                    })}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>
        </>
      )}
    </div>
  )
}
