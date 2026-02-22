"use client"

import { useState, useEffect, useCallback, useMemo, useRef } from "react"
import {
  ComposedChart, Line, Area, XAxis, YAxis, CartesianGrid,
  Tooltip, ResponsiveContainer, ReferenceLine,
} from "recharts"
import {
  Search, RefreshCw, RotateCcw,
  TrendingUp, TrendingDown, Minus,
  BarChart3, Settings2, Check,
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

interface YearlyValues {
  y1: number; y2: number; y3: number; y4: number; y5: number
}

interface FieldData {
  average: number
  yearly: YearlyValues
  useYearly: boolean
}

interface CaseAssumptions {
  revGrowth: FieldData
  netMargin: FieldData
  peLow: FieldData
  peHigh: FieldData
}

interface Assumptions {
  bear: CaseAssumptions
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

type CaseKey = 'bear' | 'current' | 'bull'
type FieldKey = keyof CaseAssumptions

// ── Constants ─────────────────────────────────────────────────────────
const CUR_YEAR = new Date().getFullYear()

const CASES: {
  key: CaseKey
  label: string
  color: string
  areaColor: string
  icon: any
  editable: boolean
}[] = [
    { key: 'bear', label: 'Bear', color: '#ef4444', areaColor: 'rgba(239,68,68,0.10)', icon: TrendingDown, editable: true },
    { key: 'current', label: 'Current', color: '#94a3b8', areaColor: 'rgba(148,163,184,0.10)', icon: Minus, editable: false },
    { key: 'bull', label: 'Bull', color: '#22c55e', areaColor: 'rgba(34,197,94,0.10)', icon: TrendingUp, editable: true },
  ]

const FIELDS: { key: FieldKey; label: string; suffix: string; hint: string }[] = [
  { key: 'revGrowth', label: 'Revenue Growth', suffix: '%', hint: 'Annual growth rate' },
  { key: 'netMargin', label: 'Net Margin', suffix: '%', hint: 'Net income ÷ revenue' },
  { key: 'peLow', label: 'P/E Low Est', suffix: 'x', hint: 'Price floor multiple' },
  { key: 'peHigh', label: 'P/E High Est', suffix: 'x', hint: 'Price ceiling multiple' },
]

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
function fmtP0(v: number): string {
  return new Intl.NumberFormat('en-US', {
    style: 'currency', currency: 'USD',
    minimumFractionDigits: 0, maximumFractionDigits: 0,
  }).format(v)
}
function fmtP2(v: number): string {
  return new Intl.NumberFormat('en-US', {
    style: 'currency', currency: 'USD',
    minimumFractionDigits: 2,
  }).format(v)
}
function fmtPct(v: number): string {
  return `${v >= 0 ? '+' : ''}${v.toFixed(1)}%`
}

// ── Helpers ───────────────────────────────────────────────────────────
function getYearVal(fd: FieldData, y: number): number {
  if (!fd.useYearly) return fd.average
  return fd.yearly[`y${y}` as keyof YearlyValues]
}

function calcAvg(yearly: YearlyValues): number {
  const vals = [yearly.y1, yearly.y2, yearly.y3, yearly.y4, yearly.y5]
  return parseFloat((vals.reduce((a, b) => a + b, 0) / 5).toFixed(1))
}

function makeFD(avg: number): FieldData {
  const a = parseFloat(avg.toFixed(1))
  return { average: a, yearly: { y1: a, y2: a, y3: a, y4: a, y5: a }, useYearly: false }
}

function buildDefaults(s: StockData): Assumptions {
  const rg = s.revGrowth ?? 10
  const nm = s.netMargin ?? 15
  const pe = s.pe ?? 20
  return {
    bear: {
      revGrowth: makeFD(Math.max(rg - 5, 0)),
      netMargin: makeFD(Math.max(nm - 3, 1)),
      peLow: makeFD(Math.max(pe * 0.70, 5)),
      peHigh: makeFD(Math.max(pe * 0.85, 8)),
    },
    bull: {
      revGrowth: makeFD(rg + 8),
      netMargin: makeFD(nm + 5),
      peLow: makeFD(pe),
      peHigh: makeFD(pe * 1.30),
    },
  }
}

function buildCurrentCase(s: StockData): CaseAssumptions {
  const rg = s.revGrowth ?? 10
  const nm = s.netMargin ?? 15
  const pe = s.pe ?? 20
  return {
    revGrowth: makeFD(rg),
    netMargin: makeFD(nm),
    peLow: makeFD(pe * 0.95),
    peHigh: makeFD(pe * 1.05),
  }
}

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
    const rg = getYearVal(a.revGrowth, y)
    const nm = getYearVal(a.netMargin, y)
    const pl = getYearVal(a.peLow, y)
    const ph = getYearVal(a.peHigh, y)
    const revenue = prevRev * (1 + rg / 100)
    const netIncome = revenue * (nm / 100)
    const eps = shares > 0 ? netIncome / shares : 0
    const priceLow = eps * pl
    const priceHigh = eps * ph
    const cagrLow = s.price > 0 ? (Math.pow(priceLow / s.price, 1 / y) - 1) * 100 : 0
    const cagrHigh = s.price > 0 ? (Math.pow(priceHigh / s.price, 1 / y) - 1) * 100 : 0
    rows.push({
      year: CUR_YEAR + y,
      revenue, netIncome,
      margin: nm, eps,
      peLow: pl, peHigh: ph,
      priceLow, priceHigh, cagrLow, cagrHigh,
    })
    prevRev = revenue
  }
  return rows
}

// ── localStorage ──────────────────────────────────────────────────────
const lsKey = (sym: string) => `projection_v2_${sym}`
function lsLoad(sym: string): Assumptions | null {
  try { const r = localStorage.getItem(lsKey(sym)); return r ? JSON.parse(r) : null }
  catch { return null }
}
function lsSave(sym: string, a: Assumptions) {
  try { localStorage.setItem(lsKey(sym), JSON.stringify(a)) } catch { }
}

// ── FieldInput Component ──────────────────────────────────────────────
interface FieldInputProps {
  label: string
  suffix: string
  hint: string
  data: FieldData
  color: string
  onChange: (updated: FieldData) => void
}

function FieldInput({ label, suffix, hint, data, color, onChange }: FieldInputProps) {
  const [open, setOpen] = useState(false)
  const [draft, setDraft] = useState<YearlyValues>(data.yearly)
  const draftAvg = calcAvg(draft)

  const handleOpen = () => {
    setDraft(data.yearly)
    setOpen(true)
  }

  const handleDone = () => {
    const avg = calcAvg(draft)
    onChange({ ...data, yearly: draft, average: avg, useYearly: true })
    setOpen(false)
  }

  const handleCancel = () => setOpen(false)

  const handleAvgChange = (val: string) => {
    const n = parseFloat(val)
    const safe = isNaN(n) ? 0 : n
    onChange({ ...data, average: safe, useYearly: false })
  }

  const setYear = (yk: keyof YearlyValues, val: string) => {
    const n = parseFloat(val)
    setDraft(prev => ({ ...prev, [yk]: isNaN(n) ? 0 : n }))
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-1">
        <label className="text-xs text-muted-foreground">{label}</label>
        <span className="text-[10px] text-muted-foreground opacity-50 hidden sm:block">{hint}</span>
      </div>

      <div className="flex gap-1.5">
        <div className="relative flex-1">
          <Input
            type="number"
            step={suffix === '%' ? 0.5 : 1}
            value={data.average}
            onChange={e => handleAvgChange(e.target.value)}
            className="pr-6 text-sm h-8"
          />
          <span
            className="absolute right-2.5 top-1/2 -translate-y-1/2 text-xs pointer-events-none"
            style={{ color: '#94a3b8' }}
          >
            {suffix}
          </span>
        </div>

        <button
          onClick={open ? handleCancel : handleOpen}
          title="Set individual values per year"
          className="flex-shrink-0 h-8 px-2 rounded-md border text-xs font-medium transition-all flex items-center gap-1"
          style={{
            borderColor: data.useYearly ? color : 'hsl(var(--border))',
            backgroundColor: data.useYearly ? `${color}20` : 'transparent',
            color: data.useYearly ? color : '#94a3b8',
          }}
        >
          <Settings2 className="h-3 w-3" />
          {data.useYearly
            ? <Check className="h-3 w-3" />
            : <span className="text-[10px] font-semibold leading-none">Y1–Y5</span>
          }
        </button>
      </div>

      {data.useYearly && !open && (
        <p className="text-[10px] mt-0.5 font-medium" style={{ color }}>
          ✓ Custom per-year · avg {data.average.toFixed(1)}{suffix}
        </p>
      )}

      {open && (
        <div
          className="mt-2 rounded-lg bg-card p-3 space-y-2 shadow-lg border"
          style={{ borderColor: color }}
        >
          <p className="text-xs font-semibold mb-2" style={{ color }}>
            {label} — per year
          </p>

          {([1, 2, 3, 4, 5] as const).map(y => {
            const yk = `y${y}` as keyof YearlyValues
            return (
              <div key={y} className="flex items-center gap-2">
                <span className="text-xs text-muted-foreground w-20 flex-shrink-0">
                  Y{y} · {CUR_YEAR + y}
                </span>
                <div className="relative flex-1">
                  <Input
                    type="number"
                    step={suffix === '%' ? 0.5 : 1}
                    value={draft[yk]}
                    onChange={e => setYear(yk, e.target.value)}
                    className="h-7 text-xs pr-6"
                  />
                  <span
                    className="absolute right-2 top-1/2 -translate-y-1/2 text-[10px] pointer-events-none"
                    style={{ color: '#94a3b8' }}
                  >
                    {suffix}
                  </span>
                </div>
              </div>
            )
          })}

          <div className="flex items-center justify-between pt-2 border-t border-border">
            <p className="text-xs text-muted-foreground">
              Avg:{' '}
              <span className="font-bold text-foreground">
                {draftAvg.toFixed(1)}{suffix}
              </span>
            </p>
            <div className="flex gap-2">
              <button
                onClick={handleCancel}
                className="text-xs text-muted-foreground hover:text-foreground transition-colors px-2 py-1"
              >
                Cancel
              </button>
              <button
                onClick={handleDone}
                className="text-xs font-semibold px-3 py-1 rounded-md text-white transition-opacity hover:opacity-90"
                style={{ backgroundColor: color }}
              >
                Done
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

// ── Chart Tooltip ─────────────────────────────────────────────────────
function ChartTooltip({ active, payload, label }: any) {
  if (!active || !payload?.length) return null
  return (
    <div className="bg-card border border-border rounded-lg px-3 py-2.5 shadow-xl text-xs min-w-[220px]">
      <p className="font-semibold text-foreground mb-2">{label}</p>
      {CASES.map(c => {
        const lo = payload.find((p: any) => p.dataKey === `${c.key}_low`)?.value
        const hi = payload.find((p: any) => p.dataKey === `${c.key}_high`)?.value
        if (lo == null && hi == null) return null
        return (
          <div key={c.key} className="flex items-center justify-between gap-4 mb-1">
            <div className="flex items-center gap-1.5">
              <div className="h-2 w-2 rounded-full flex-shrink-0" style={{ backgroundColor: c.color }} />
              <span style={{ color: '#94a3b8' }}>{c.label}</span>
            </div>
            <span className="font-semibold" style={{ color: c.color }}>
              {lo != null && hi != null ? `${fmtP0(lo)} – ${fmtP0(hi)}` : '—'}
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
  const [currentA, setCurrentA] = useState<CaseAssumptions | null>(null)
  const [input, setInput] = useState('')
  const [suggestions, setSuggestions] = useState<{ symbol: string; name: string; exchange: string }[]>([])
  const [searching, setSearching] = useState(false)
  const [showDrop, setShowDrop] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [activeCase, setActiveCase] = useState<CaseKey>('current')
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
      setCurrentA(buildCurrentCase(s))
      const saved = lsLoad(symbol)
      setAssumptions(saved ?? def)
      setActiveCase('current')
    } catch { setError(`Failed to fetch ${symbol}`) }
    finally { setLoading(false) }
  }, [])

  // Edit a field in bear or bull
  const editField = useCallback((
    caseKey: 'bear' | 'bull',
    fieldKey: FieldKey,
    updated: FieldData,
  ) => {
    if (!assumptions || !stock) return
    const next: Assumptions = {
      ...assumptions,
      [caseKey]: { ...assumptions[caseKey], [fieldKey]: updated },
    }
    setAssumptions(next)
    lsSave(stock.symbol, next)
  }, [assumptions, stock])

  // Reset one editable case
  const resetCase = useCallback((caseKey: 'bear' | 'bull') => {
    if (!defaults || !assumptions || !stock) return
    const next = { ...assumptions, [caseKey]: defaults[caseKey] }
    setAssumptions(next)
    lsSave(stock.symbol, next)
  }, [defaults, assumptions, stock])

  // Reset all
  const resetAll = useCallback(() => {
    if (!defaults || !stock) return
    setAssumptions(defaults)
    lsSave(stock.symbol, defaults)
  }, [defaults, stock])

  // Compute projections for all 3 cases
  const proj = useMemo(() => {
    if (!stock || !assumptions || !currentA) return null
    return {
      bear: runCase(stock, assumptions.bear),
      current: runCase(stock, currentA),
      bull: runCase(stock, assumptions.bull),
    }
  }, [stock, assumptions, currentA])

  // Chart data
  const chartData = useMemo(() => {
    if (!proj || !stock) return []
    return [
      {
        label: 'Now',
        bear_low: stock.price, bear_high: stock.price,
        current_low: stock.price, current_high: stock.price,
        bull_low: stock.price, bull_high: stock.price,
      },
      ...proj.bear.map((_, i) => ({
        label: `Y${i + 1} · ${CUR_YEAR + i + 1}`,
        bear_low: proj.bear[i].priceLow,
        bear_high: proj.bear[i].priceHigh,
        current_low: proj.current[i].priceLow,
        current_high: proj.current[i].priceHigh,
        bull_low: proj.bull[i].priceLow,
        bull_high: proj.bull[i].priceHigh,
      })),
    ]
  }, [proj, stock])

  const activeRows = proj?.[activeCase] ?? []
  const activeCfg = CASES.find(c => c.key === activeCase)!

  // Case assumptions for rendering editor — current is read-only
  function getCaseAssumptions(key: CaseKey): CaseAssumptions | null {
    if (!assumptions || !currentA) return null
    if (key === 'bear') return assumptions.bear
    if (key === 'bull') return assumptions.bull
    if (key === 'current') return currentA
    return null
  }

  return (
    <div className="space-y-6">

      {/* ── Search ──────────────────────────────────────────────── */}
      <Card>
        <CardContent className="pt-4 space-y-2">
          <div className="flex items-center justify-between">
            <p className="text-sm font-semibold">Select Stock</p>
            {stock && (
              <Button
                variant="ghost" size="sm"
                onClick={resetAll}
                className="h-7 text-xs gap-1.5 text-muted-foreground"
              >
                <RotateCcw className="h-3 w-3" /> Reset all
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
            {loading && (
              <RefreshCw className="h-5 w-5 animate-spin mt-2 text-muted-foreground flex-shrink-0" />
            )}
          </div>

          {error && <p className="text-xs text-red-500">{error}</p>}
          {!stock && !loading && (
            <p className="text-xs text-muted-foreground">
              Assumptions auto-filled from Finnhub TTM · Bear & Bull are editable · Saved per stock
            </p>
          )}
        </CardContent>
      </Card>

      {/* ── Empty state ─────────────────────────────────────────── */}
      {!stock && !loading && (
        <Card>
          <CardContent className="py-24 text-center">
            <BarChart3 className="h-10 w-10 mx-auto mb-3 opacity-30" style={{ color: '#94a3b8' }} />
            <p className="text-sm text-muted-foreground">Search for a stock to build a projection</p>
            <p className="text-xs text-muted-foreground mt-1 opacity-60">
              Try "Apple", "Microsoft", or any US ticker
            </p>
          </CardContent>
        </Card>
      )}

      {stock && assumptions && currentA && proj && (
        <>
          {/* ── Stock header ──────────────────────────────────────── */}
          <div className="flex items-center gap-3">
            {stock.logo && (
              <img
                src={stock.logo} alt={stock.symbol}
                className="h-9 w-9 rounded object-contain"
                onError={e => ((e.target as HTMLImageElement).style.display = 'none')}
              />
            )}
            <div>
              <p className="font-bold text-lg leading-none">{stock.symbol}</p>
              <p className="text-xs text-muted-foreground">
                {stock.name}{stock.sector ? ` · ${stock.sector}` : ''}
              </p>
            </div>
            <div className="ml-auto text-right">
              <p className="font-bold text-lg">{fmtP2(stock.price)}</p>
              <p className="text-xs text-muted-foreground">{stock.exchange}</p>
            </div>
          </div>

          {/* ── Snapshot bar ──────────────────────────────────────── */}
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-2">
            {[
              { label: 'Current Price', value: fmtP2(stock.price) },
              { label: 'EPS (TTM)', value: stock.eps != null ? `$${stock.eps.toFixed(2)}` : '—' },
              { label: 'P/E (TTM)', value: stock.pe != null ? stock.pe.toFixed(1) : '—' },
              { label: 'Revenue (TTM)', value: fmtBig(stock.revenue) },
              { label: 'Net Margin (TTM)', value: stock.netMargin != null ? `${stock.netMargin.toFixed(1)}%` : '—' },
              { label: 'Shares Out', value: fmtShares(stock.sharesOut) },
            ].map(item => (
              <div key={item.label} className="bg-muted/40 rounded-lg p-3">
                <p className="text-xs text-muted-foreground mb-1">{item.label}</p>
                <p className="text-sm font-semibold">{item.value}</p>
              </div>
            ))}
          </div>

          {/* ── Assumption Editor — 3 columns ─────────────────────── */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {CASES.map(c => {
              const caseA = getCaseAssumptions(c.key)
              if (!caseA) return null
              const y5row = proj[c.key][4]
              const upsideHi = stock.price > 0
                ? ((y5row.priceHigh - stock.price) / stock.price) * 100
                : 0

              return (
                <Card
                  key={c.key}
                  className="border-t-2"
                  style={{ borderTopColor: c.color }}
                >
                  <CardHeader className="pb-2 pt-4 px-4">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <c.icon className="h-4 w-4" style={{ color: c.color }} />
                        <CardTitle
                          className="text-sm font-semibold"
                          style={{ color: c.color }}
                        >
                          {c.label} Case
                        </CardTitle>
                      </div>
                      {c.editable && (
                        <button
                          onClick={() => resetCase(c.key as 'bear' | 'bull')}
                          className="flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground transition-colors"
                        >
                          <RotateCcw className="h-3 w-3" /> Reset
                        </button>
                      )}
                      {!c.editable && (
                        <span className="text-[10px] text-muted-foreground bg-muted px-2 py-0.5 rounded">
                          Finnhub TTM
                        </span>
                      )}
                    </div>
                  </CardHeader>

                  <CardContent className="px-4 pb-4 space-y-3">
                    {FIELDS.map(f => {
                      const fd = caseA[f.key]
                      if (!c.editable) {
                        // Current case — read only display
                        return (
                          <div key={f.key}>
                            <div className="flex items-center justify-between mb-1">
                              <label className="text-xs text-muted-foreground">{f.label}</label>
                            </div>
                            <div
                              className="h-8 px-3 flex items-center rounded-md text-sm border border-border bg-muted/40 text-muted-foreground"
                            >
                              {fd.average.toFixed(1)}{f.suffix}
                            </div>
                          </div>
                        )
                      }

                      return (
                        <FieldInput
                          key={f.key}
                          label={f.label}
                          suffix={f.suffix}
                          hint={f.hint}
                          data={fd}
                          color={c.color}
                          onChange={updated =>
                            editField(c.key as 'bear' | 'bull', f.key, updated)
                          }
                        />
                      )
                    })}

                    {/* Y5 preview inside card */}
                    <div
                      className="mt-3 pt-3 border-t border-border rounded-lg p-3"
                      style={{ backgroundColor: c.areaColor }}
                    >
                      <p className="text-xs text-muted-foreground mb-1">Year 5 Estimate</p>
                      <p className="text-sm font-bold" style={{ color: c.color }}>
                        {fmtP0(y5row.priceLow)} – {fmtP0(y5row.priceHigh)}
                      </p>
                      <p className="text-xs text-muted-foreground mt-0.5">
                        EPS: ${y5row.eps.toFixed(2)} · Upside to high: {fmtPct(upsideHi)}
                      </p>
                    </div>
                  </CardContent>
                </Card>
              )
            })}
          </div>

          {/* ── Price Band Chart ───────────────────────────────────── */}
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-base">5-Year Price Projection</CardTitle>
              <CardDescription>
                Price range bands per case · dashed line = current price {fmtP2(stock.price)}
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="h-[400px]">
                <ResponsiveContainer width="100%" height="100%">
                  <ComposedChart data={chartData} margin={{ top: 8, right: 16, left: 0, bottom: 0 }}>
                    <defs>
                      {CASES.map(c => (
                        <linearGradient key={c.key} id={`grad_${c.key}`} x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor={c.color} stopOpacity={0.20} />
                          <stop offset="95%" stopColor={c.color} stopOpacity={0.03} />
                        </linearGradient>
                      ))}
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                    <ReferenceLine
                      y={stock.price}
                      stroke="#94a3b8"
                      strokeDasharray="5 5"
                      strokeWidth={1.5}
                      label={{
                        value: `Now ${fmtP0(stock.price)}`,
                        position: 'insideTopRight',
                        fill: '#94a3b8',
                        fontSize: 10,
                      }}
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

                    {/* Render bands: high line (solid) + low line (dashed) + area between */}
                    {CASES.map(c => (
                      <Area
                        key={`area_${c.key}`}
                        type="monotone"
                        dataKey={`${c.key}_high`}
                        stroke={c.color}
                        strokeWidth={2}
                        fill={`url(#grad_${c.key})`}
                        dot={false}
                        legendType="none"
                        name={`${c.label} High`}
                      />
                    ))}
                    {CASES.map(c => (
                      <Line
                        key={`low_${c.key}`}
                        type="monotone"
                        dataKey={`${c.key}_low`}
                        stroke={c.color}
                        strokeWidth={1.5}
                        strokeDasharray="4 3"
                        dot={false}
                        legendType="none"
                        name={`${c.label} Low`}
                      />
                    ))}
                  </ComposedChart>
                </ResponsiveContainer>
              </div>

              {/* Y5 upside summary below chart */}
              <div className="grid grid-cols-3 gap-3 mt-5">
                {CASES.map(c => {
                  const row = proj[c.key][4]
                  const upsLo = stock.price > 0 ? ((row.priceLow - stock.price) / stock.price) * 100 : 0
                  const upsHi = stock.price > 0 ? ((row.priceHigh - stock.price) / stock.price) * 100 : 0
                  return (
                    <div
                      key={c.key}
                      className="rounded-lg p-3 text-center border"
                      style={{
                        backgroundColor: c.areaColor,
                        borderColor: `${c.color}30`,
                      }}
                    >
                      <div className="flex items-center justify-center gap-1 mb-1">
                        <c.icon className="h-3.5 w-3.5" style={{ color: c.color }} />
                        <p className="text-xs font-semibold" style={{ color: c.color }}>{c.label}</p>
                      </div>
                      <p className="text-sm font-bold text-foreground">
                        {fmtP0(row.priceLow)} – {fmtP0(row.priceHigh)}
                      </p>
                      <p className="text-xs mt-0.5" style={{ color: c.color }}>
                        {fmtPct(upsLo)} to {fmtPct(upsHi)}
                      </p>
                      <p className="text-[10px] text-muted-foreground mt-0.5">
                        CAGR {row.cagrLow.toFixed(1)}% – {row.cagrHigh.toFixed(1)}%
                      </p>
                    </div>
                  )
                })}
              </div>
            </CardContent>
          </Card>

          {/* ── Year 5 Summary Cards ───────────────────────────────── */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {CASES.map(c => {
              const row = proj[c.key][4]
              return (
                <Card
                  key={c.key}
                  style={{ borderTopColor: c.color, borderTopWidth: 3 }}
                >
                  <CardContent className="p-4 space-y-2">
                    <div className="flex items-center gap-2">
                      <c.icon className="h-4 w-4" style={{ color: c.color }} />
                      <p className="text-sm font-semibold" style={{ color: c.color }}>
                        {c.label} Case · Year 5
                      </p>
                    </div>
                    <div className="space-y-1.5 text-sm">
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Revenue</span>
                        <span className="font-medium">{fmtBig(row.revenue)}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Net Income</span>
                        <span className="font-medium">{fmtBig(row.netIncome)}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Net Margin</span>
                        <span className="font-medium">{row.margin.toFixed(1)}%</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">EPS</span>
                        <span className="font-medium">${row.eps.toFixed(2)}</span>
                      </div>
                      <div className="flex justify-between border-t border-border pt-1.5 mt-1">
                        <span className="text-muted-foreground">Price Range</span>
                        <span className="font-bold" style={{ color: c.color }}>
                          {fmtP0(row.priceLow)} – {fmtP0(row.priceHigh)}
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

          {/* ── Year-by-Year Table ─────────────────────────────────── */}
          <Card>
            <CardHeader className="pb-0">
              <div className="flex items-center justify-between flex-wrap gap-3">
                <div>
                  <CardTitle className="text-base">Year-by-Year Breakdown</CardTitle>
                  <CardDescription>Detailed projection per year</CardDescription>
                </div>
                {/* Case tab switcher */}
                <div className="flex gap-0 border border-border rounded-lg overflow-hidden">
                  {CASES.map(c => (
                    <button
                      key={c.key}
                      onClick={() => setActiveCase(c.key)}
                      className="px-4 py-1.5 text-xs font-medium transition-colors flex items-center gap-1.5"
                      style={{
                        backgroundColor: activeCase === c.key ? c.color : 'transparent',
                        color: activeCase === c.key ? '#fff' : '#94a3b8',
                      }}
                    >
                      <c.icon className="h-3 w-3" />
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
                      <th className="text-left pb-3 font-medium">Year</th>
                      <th className="text-right pb-3 font-medium">Revenue</th>
                      <th className="text-right pb-3 font-medium">Net Income</th>
                      <th className="text-right pb-3 font-medium">Margin</th>
                      <th className="text-right pb-3 font-medium">EPS</th>
                      <th className="text-right pb-3 font-medium">P/E Lo / Hi</th>
                      <th className="text-right pb-3 font-medium">Price Lo / Hi</th>
                      <th className="text-right pb-3 font-medium">CAGR Lo / Hi</th>
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
                      <td className="text-right py-2.5 font-semibold">{fmtP2(stock.price)}</td>
                      <td className="text-right py-2.5 text-muted-foreground">—</td>
                    </tr>

                    {/* Projected rows */}
                    {activeRows.map(row => (
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
                        <td
                          className="text-right py-2.5 font-semibold"
                          style={{ color: activeCfg.color }}
                        >
                          {fmtP0(row.priceLow)} – {fmtP0(row.priceHigh)}
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
                    ))}
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
