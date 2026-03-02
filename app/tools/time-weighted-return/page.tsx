"use client"

import { useState, useEffect } from "react"
import Link from "next/link"
import { Header } from "@/components/header"
import { Footer } from "@/components/footer"
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  ReferenceLine,
  BarChart,
  Bar,
  Cell,
} from "recharts"

// ── Types ──────────────────────────────────────────────────
interface Period {
  id: number
  label: string
  beginValue: number
  endValue: number
  cashFlow: number
  cashFlowTiming: "start" | "end"
}

interface PeriodResult {
  id: number
  label: string
  hpr: number          // Holding Period Return
  adjustedBegin: number
  adjustedEnd: number
}

interface Results {
  twr: number
  annualizedTwr: number
  totalPeriods: number
  bestPeriod: PeriodResult
  worstPeriod: PeriodResult
  positivePeriods: number
  negativePeriods: number
  geometricMean: number
}

// ── Constants ──────────────────────────────────────────────
const RELATED_TOOLS = [
  { icon: "📊", name: "Money-Weighted Return", href: "/tools/money-weighted-return" },
  { icon: "⚖️", name: "Portfolio Rebalancing", href: "/tools/portfolio-rebalancing" },
  { icon: "🥧", name: "Portfolio Weight", href: "/tools/portfolio-weight" },
  { icon: "💵", name: "Stock Profit", href: "/tools/stock-profit-calculator" },
  { icon: "🔄", name: "DCA Calculator", href: "/tools/dca-calculator" },
  { icon: "💰", name: "Dividend Calculator", href: "/tools/dividend-calculator" },
]

const FAQS = [
  {
    q: "What is Time-Weighted Return (TWR)?",
    a: "Time-Weighted Return (TWR) measures the compound rate of growth of a portfolio, eliminating the distorting effects of cash flows (deposits and withdrawals). It's the standard method used by fund managers and the CFA Institute to evaluate investment performance because it reflects the manager's skill rather than the timing of investor contributions.",
  },
  {
    q: "How is TWR calculated?",
    a: "TWR is calculated in two steps: (1) Calculate the Holding Period Return (HPR) for each sub-period between cash flows: HPR = (End Value − Cash Flow) ÷ Begin Value − 1. (2) Chain-link all HPRs together: TWR = [(1+HPR1) × (1+HPR2) × ... × (1+HPRn)] − 1. This geometric linking eliminates the impact of when money was added or withdrawn.",
  },
  {
    q: "What's the difference between TWR and Money-Weighted Return (MWR)?",
    a: "TWR eliminates the effect of cash flow timing — it measures how well the investment strategy performed. MWR (or IRR) includes the effect of cash flow timing — it measures how well the investor did. If you added money right before a crash, your MWR would be worse than the TWR. TWR is better for comparing managers; MWR is better for understanding your personal financial outcome.",
  },
  {
    q: "When should I use TWR vs MWR?",
    a: "Use TWR when: comparing portfolio managers or funds, evaluating investment strategy performance, benchmarking against an index. Use MWR when: calculating your personal investment returns, understanding the actual dollar impact of your investing decisions, tax planning or reporting actual gains.",
  },
  {
    q: "What counts as a cash flow for TWR purposes?",
    a: "Cash flows are any external money movements: deposits (contributions), withdrawals (distributions), and dividends taken as cash (not reinvested). Internal transactions like selling one stock to buy another don't count as cash flows. Each cash flow creates a new sub-period boundary in the TWR calculation.",
  },
  {
    q: "What is a good TWR?",
    a: "Compare TWR to your benchmark. If your portfolio returned 12% TWR and the S&P 500 returned 10%, you outperformed by 2%. Annual TWR above 10% over long periods is excellent (matching the long-run S&P 500 average). A negative TWR means the portfolio lost value on a time-weighted basis, regardless of cash flow timing.",
  },
  {
    q: "How do I annualize TWR?",
    a: "Annualized TWR = (1 + TWR)^(1/Years) − 1. For example, a 3-year TWR of 33.1% annualizes to (1.331)^(1/3) − 1 = 10% per year. Annualizing allows fair comparison between periods of different lengths. Our calculator automatically annualizes based on the number of periods you enter.",
  },
]

// ── Helpers ────────────────────────────────────────────────
function fmtFull(n: number): string {
  return "$" + Math.abs(n).toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })
}

function fmtPct(n: number, decimals = 2): string {
  return (n >= 0 ? "+" : "") + n.toFixed(decimals) + "%"
}

function CustomTooltip({ active, payload, label }: any) {
  if (!active || !payload?.length) return null
  return (
    <div className="bg-card border border-border rounded-xl px-4 py-3 shadow-xl text-xs">
      <div className="text-muted-foreground font-semibold mb-2">{label}</div>
      {payload.map((p: any) => (
        <div key={p.dataKey} className="flex items-center gap-2 mb-1">
          <span className="w-2 h-2 rounded-full" style={{ background: p.color }} />
          <span className="text-muted-foreground">{p.name}:</span>
          <span className={`font-semibold ${p.value >= 0 ? "text-green-400" : "text-red-400"}`}>
            {p.dataKey === "hpr" ? fmtPct(p.value) : fmtFull(p.value)}
          </span>
        </div>
      ))}
    </div>
  )
}

// ── Default periods ────────────────────────────────────────
const DEFAULT_PERIODS: Period[] = [
  { id: 1, label: "Q1 2024", beginValue: 100000, endValue: 108000, cashFlow: 0, cashFlowTiming: "start" },
  { id: 2, label: "Q2 2024", beginValue: 108000, endValue: 103500, cashFlow: 5000, cashFlowTiming: "start" },
  { id: 3, label: "Q3 2024", beginValue: 108500, endValue: 119350, cashFlow: 0, cashFlowTiming: "start" },
  { id: 4, label: "Q4 2024", beginValue: 119350, endValue: 115000, cashFlow: -2000, cashFlowTiming: "end" },
]

// ── Main Component ─────────────────────────────────────────
export default function TimeWeightedReturnPage() {
  const [periods, setPeriods] = useState<Period[]>(DEFAULT_PERIODS)
  const [results, setResults] = useState<PeriodResult[]>([])
  const [summary, setSummary] = useState<Results | null>(null)
  const [totalYears, setTotalYears] = useState(1)
  const [activeChart, setActiveChart] = useState<"growth" | "hpr">("growth")
  const [openFaq, setOpenFaq] = useState<number | null>(null)
  const [nextId, setNextId] = useState(5)

  function calculate() {
    if (periods.length === 0) return

    const computed: PeriodResult[] = periods.map(p => {
      // Adjust begin value for cash flows
      const adjustedBegin = p.cashFlowTiming === "start"
        ? p.beginValue + p.cashFlow
        : p.beginValue
      const adjustedEnd = p.cashFlowTiming === "end"
        ? p.endValue - p.cashFlow
        : p.endValue

      const hpr = adjustedBegin !== 0
        ? ((adjustedEnd - adjustedBegin) / adjustedBegin) * 100
        : 0

      return { id: p.id, label: p.label, hpr, adjustedBegin, adjustedEnd }
    })

    // Chain-link all HPRs
    const chainProduct = computed.reduce((prod, r) => prod * (1 + r.hpr / 100), 1)
    const twr = (chainProduct - 1) * 100

    // Annualize
    const annualizedTwr = totalYears > 0
      ? (Math.pow(chainProduct, 1 / totalYears) - 1) * 100
      : twr

    const best = [...computed].sort((a, b) => b.hpr - a.hpr)[0]
    const worst = [...computed].sort((a, b) => a.hpr - b.hpr)[0]
    const pos = computed.filter(r => r.hpr >= 0).length
    const neg = computed.filter(r => r.hpr < 0).length
    const geoMean = (Math.pow(chainProduct, 1 / computed.length) - 1) * 100

    setResults(computed)
    setSummary({
      twr,
      annualizedTwr,
      totalPeriods: computed.length,
      bestPeriod: best,
      worstPeriod: worst,
      positivePeriods: pos,
      negativePeriods: neg,
      geometricMean: geoMean,
    })
  }

  useEffect(() => { calculate() }, [periods, totalYears]) // eslint-disable-line

  function addPeriod() {
    const last = periods[periods.length - 1]
    setPeriods(prev => [...prev, {
      id: nextId,
      label: `Period ${nextId}`,
      beginValue: last?.endValue ?? 100000,
      endValue: last?.endValue ?? 100000,
      cashFlow: 0,
      cashFlowTiming: "start",
    }])
    setNextId(n => n + 1)
  }

  function removePeriod(id: number) {
    setPeriods(prev => prev.filter(p => p.id !== id))
  }

  function updatePeriod(id: number, field: keyof Period, value: any) {
    setPeriods(prev => prev.map(p => p.id === id ? { ...p, [field]: value } : p))
  }

  const inputCls = "bg-background border border-border rounded-lg py-2 text-sm text-foreground outline-none focus:border-primary/50 transition-colors px-3 w-full"

  // Chart: cumulative growth index (starts at 100)
  let growthIndex = 100
  const growthData = [{ label: "Start", value: 100, hpr: 0 }, ...results.map(r => {
    growthIndex *= (1 + r.hpr / 100)
    return { label: r.label, value: +growthIndex.toFixed(2), hpr: +r.hpr.toFixed(3) }
  })]

  const hprData = results.map(r => ({ label: r.label, hpr: +r.hpr.toFixed(3) }))

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <Header />

      <main className="pt-16 flex-1">

        {/* Page Header */}
        <div className="max-w-5xl mx-auto px-4 sm:px-6 pt-12 pb-8 text-center">
          <div className="text-xs font-bold tracking-widest uppercase text-primary mb-3">Free Tools</div>
          <h1 className="text-3xl sm:text-4xl font-extrabold tracking-tight text-foreground mb-3">
            Time-Weighted Return Calculator
          </h1>
          <p className="text-muted-foreground text-sm max-w-lg mx-auto leading-relaxed">
            Calculate the true performance of your portfolio by eliminating the
            distorting effects of deposits and withdrawals — the industry-standard
            method used by professional fund managers.
          </p>
        </div>

        <div className="max-w-5xl mx-auto px-4 sm:px-6 pb-20 space-y-4">

          {/* TWR explainer */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            {[
              { icon: "✂️", title: "Split into sub-periods", desc: "Each cash flow creates a new measurement period" },
              { icon: "📐", title: "Calculate each HPR", desc: "Holding Period Return = (End − Begin) ÷ Begin" },
              { icon: "🔗", title: "Chain-link the returns", desc: "Multiply (1+HPR1) × (1+HPR2) × ... − 1" },
            ].map((s, i) => (
              <div key={i} className="bg-card border border-border rounded-2xl px-5 py-4">
                <div className="flex items-center gap-2 mb-2">
                  <span className="text-lg">{s.icon}</span>
                  <span className="text-xs font-bold text-primary">0{i + 1}</span>
                </div>
                <div className="text-sm font-semibold text-foreground mb-0.5">{s.title}</div>
                <div className="text-xs text-muted-foreground">{s.desc}</div>
              </div>
            ))}
          </div>

          {/* Period inputs */}
          <div className="rounded-2xl border border-border bg-card overflow-hidden">
            <div className="flex items-center justify-between px-6 py-4 border-b border-border">
              <div className="text-sm font-bold text-foreground">Sub-Period Data</div>
              <div className="flex items-center gap-3">
                <div className="flex items-center gap-2 text-xs">
                  <span className="text-muted-foreground">Total years:</span>
                  <input type="number" value={totalYears} min={0.1} step={0.25}
                    onChange={(e) => setTotalYears(+e.target.value || 1)}
                    className="bg-background border border-border rounded-lg px-3 py-1.5 text-sm text-foreground outline-none focus:border-primary/50 w-20" />
                </div>
              </div>
            </div>

            <div className="p-5 space-y-2">
              {/* Column headers */}
              <div className="grid grid-cols-12 gap-2 px-1 pb-1">
                <div className="col-span-2 text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">Period</div>
                <div className="col-span-2 text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">Begin Value</div>
                <div className="col-span-2 text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">End Value</div>
                <div className="col-span-2 text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">Cash Flow</div>
                <div className="col-span-2 text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">Timing</div>
                <div className="col-span-1 text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">HPR</div>
                <div className="col-span-1" />
              </div>

              {periods.map((p) => {
                const result = results.find(r => r.id === p.id)
                return (
                  <div key={p.id} className="grid grid-cols-12 gap-2 items-center">
                    <div className="col-span-2">
                      <input type="text" placeholder="Q1 2024" value={p.label}
                        onChange={(e) => updatePeriod(p.id, "label", e.target.value)}
                        className={inputCls} />
                    </div>
                    <div className="col-span-2 relative">
                      <span className="absolute left-3 top-1/2 -translate-y-1/2 text-xs text-muted-foreground">$</span>
                      <input type="number" value={p.beginValue} min={0}
                        onChange={(e) => updatePeriod(p.id, "beginValue", +e.target.value || 0)}
                        className={inputCls + " pl-6"} />
                    </div>
                    <div className="col-span-2 relative">
                      <span className="absolute left-3 top-1/2 -translate-y-1/2 text-xs text-muted-foreground">$</span>
                      <input type="number" value={p.endValue} min={0}
                        onChange={(e) => updatePeriod(p.id, "endValue", +e.target.value || 0)}
                        className={inputCls + " pl-6"} />
                    </div>
                    <div className="col-span-2 relative">
                      <span className="absolute left-3 top-1/2 -translate-y-1/2 text-xs text-muted-foreground">$</span>
                      <input type="number" value={p.cashFlow}
                        onChange={(e) => updatePeriod(p.id, "cashFlow", +e.target.value || 0)}
                        className={inputCls + " pl-6"} />
                    </div>
                    <div className="col-span-2">
                      <select value={p.cashFlowTiming}
                        onChange={(e) => updatePeriod(p.id, "cashFlowTiming", e.target.value as "start" | "end")}
                        className={inputCls + " text-xs"}>
                        <option value="start">Start</option>
                        <option value="end">End</option>
                      </select>
                    </div>
                    {/* Live HPR badge */}
                    <div className="col-span-1">
                      <div className={`rounded-lg border px-2 py-2 text-xs font-bold text-center ${result === undefined ? "border-border text-muted-foreground" :
                          result.hpr >= 0
                            ? "border-green-500/20 bg-green-500/5 text-green-400"
                            : "border-red-500/20 bg-red-500/5 text-red-400"
                        }`}>
                        {result ? fmtPct(result.hpr) : "—"}
                      </div>
                    </div>
                    <div className="col-span-1 flex justify-center">
                      {periods.length > 1 && (
                        <button onClick={() => removePeriod(p.id)}
                          className="text-muted-foreground hover:text-red-400 transition-colors text-lg leading-none">×</button>
                      )}
                    </div>
                  </div>
                )
              })}

              <button onClick={addPeriod}
                className="w-full mt-2 rounded-xl border border-dashed border-border hover:border-primary/40 hover:bg-primary/5 transition-all py-3 text-sm font-semibold text-muted-foreground hover:text-primary flex items-center justify-center gap-2">
                <span className="text-lg leading-none">+</span>
                Add Period
              </button>
            </div>

            {/* Cash flow legend */}
            <div className="px-6 py-3 border-t border-border bg-card/50">
              <p className="text-xs text-muted-foreground">
                <span className="font-semibold text-foreground">Cash flow tip:</span> Positive = deposit/contribution. Negative = withdrawal. Timing affects which sub-period the flow is attributed to.
              </p>
            </div>
          </div>

          {/* Results Banner */}
          {summary && (
            <div className={`rounded-2xl border p-6 ${summary.twr >= 0 ? "border-primary/20 bg-primary/5" : "border-red-400/20 bg-red-400/5"}`}>
              <div className="flex items-center gap-2 text-[10px] font-bold tracking-widest uppercase text-primary mb-5">
                <span className="w-1.5 h-1.5 rounded-full bg-primary inline-block" />
                Time-Weighted Return Results
              </div>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-4">
                <div>
                  <div className="text-xs text-muted-foreground mb-1">Total TWR</div>
                  <div className={`text-xl sm:text-3xl font-extrabold tracking-tight ${summary.twr >= 0 ? "text-primary" : "text-red-400"}`}>
                    {fmtPct(summary.twr)}
                  </div>
                </div>
                <div>
                  <div className="text-xs text-muted-foreground mb-1">Annualized TWR</div>
                  <div className={`text-xl font-bold ${summary.annualizedTwr >= 0 ? "text-green-400" : "text-red-400"}`}>
                    {fmtPct(summary.annualizedTwr)} / yr
                  </div>
                </div>
                <div>
                  <div className="text-xs text-muted-foreground mb-1">Geometric Mean / Period</div>
                  <div className={`text-xl font-bold ${summary.geometricMean >= 0 ? "text-foreground" : "text-red-400"}`}>
                    {fmtPct(summary.geometricMean)}
                  </div>
                </div>
                <div>
                  <div className="text-xs text-muted-foreground mb-1">Periods Analyzed</div>
                  <div className="text-xl font-bold text-foreground">{summary.totalPeriods}</div>
                </div>
              </div>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 pt-4 border-t border-border/30">
                <div>
                  <div className="text-xs text-muted-foreground mb-1">Best Period</div>
                  <div className="text-lg font-bold text-green-400">
                    {summary.bestPeriod.label}: {fmtPct(summary.bestPeriod.hpr)}
                  </div>
                </div>
                <div>
                  <div className="text-xs text-muted-foreground mb-1">Worst Period</div>
                  <div className="text-lg font-bold text-red-400">
                    {summary.worstPeriod.label}: {fmtPct(summary.worstPeriod.hpr)}
                  </div>
                </div>
                <div>
                  <div className="text-xs text-muted-foreground mb-1">Positive Periods</div>
                  <div className="text-lg font-bold text-green-400">{summary.positivePeriods} / {summary.totalPeriods}</div>
                </div>
                <div>
                  <div className="text-xs text-muted-foreground mb-1">Negative Periods</div>
                  <div className="text-lg font-bold text-red-400">{summary.negativePeriods} / {summary.totalPeriods}</div>
                </div>
              </div>
            </div>
          )}

          {/* Charts */}
          {results.length > 0 && (
            <div className="rounded-2xl border border-border bg-card overflow-hidden">
              <div className="flex items-center justify-between px-6 py-4 border-b border-border">
                <div className="text-sm font-bold text-foreground">Return Visualization</div>
                <div className="flex gap-1 bg-muted/20 rounded-lg p-1">
                  <button onClick={() => setActiveChart("growth")}
                    className={`px-3 py-1 rounded-md text-xs font-medium transition-all ${activeChart === "growth" ? "bg-card text-foreground shadow-sm" : "text-muted-foreground hover:text-foreground"}`}>
                    Growth Index
                  </button>
                  <button onClick={() => setActiveChart("hpr")}
                    className={`px-3 py-1 rounded-md text-xs font-medium transition-all ${activeChart === "hpr" ? "bg-card text-foreground shadow-sm" : "text-muted-foreground hover:text-foreground"}`}>
                    Period Returns
                  </button>
                </div>
              </div>
              <div className="p-6">
                {activeChart === "growth" ? (
                  <>
                    <div className="text-xs text-muted-foreground mb-4">Cumulative growth of $100 invested (eliminates cash flow distortion)</div>
                    <ResponsiveContainer width="100%" height={280}>
                      <LineChart data={growthData} margin={{ top: 5, right: 10, left: 10, bottom: 5 }}>
                        <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.04)" />
                        <XAxis dataKey="label" tick={{ fill: "#71717a", fontSize: 11 }} axisLine={false} tickLine={false} />
                        <YAxis tick={{ fill: "#71717a", fontSize: 11 }} axisLine={false} tickLine={false} width={55}
                          tickFormatter={(v) => v.toFixed(0)} />
                        <Tooltip content={<CustomTooltip />} />
                        <ReferenceLine y={100} stroke="#334155" strokeDasharray="4 4" />
                        <Line type="monotone" dataKey="value" name="Growth Index" stroke="#4ade80" strokeWidth={2.5} dot={{ fill: "#4ade80", r: 4 }} activeDot={{ r: 6 }} />
                      </LineChart>
                    </ResponsiveContainer>
                  </>
                ) : (
                  <>
                    <div className="text-xs text-muted-foreground mb-4">Holding Period Return (HPR) for each sub-period</div>
                    <ResponsiveContainer width="100%" height={280}>
                      <BarChart data={hprData} margin={{ top: 5, right: 10, left: 10, bottom: 5 }}>
                        <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.04)" />
                        <XAxis dataKey="label" tick={{ fill: "#71717a", fontSize: 11 }} axisLine={false} tickLine={false} />
                        <YAxis tick={{ fill: "#71717a", fontSize: 11 }} axisLine={false} tickLine={false} width={55}
                          tickFormatter={(v) => v.toFixed(1) + "%"} />
                        <Tooltip content={<CustomTooltip />} />
                        <ReferenceLine y={0} stroke="#334155" strokeWidth={1.5} />
                        <Bar dataKey="hpr" name="Period Return %" radius={[4, 4, 4, 4]}>
                          {hprData.map((entry, i) => (
                            <Cell key={i} fill={entry.hpr >= 0 ? "#4ade80" : "#f87171"} />
                          ))}
                        </Bar>
                      </BarChart>
                    </ResponsiveContainer>
                  </>
                )}
              </div>
            </div>
          )}

          {/* Period-by-period breakdown table */}
          {results.length > 0 && (
            <div className="rounded-2xl border border-border bg-card overflow-hidden">
              <div className="px-6 py-4 border-b border-border">
                <div className="text-sm font-bold text-foreground">Sub-Period Breakdown</div>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-xs">
                  <thead className="bg-card/95">
                    <tr>
                      <th className="text-left px-4 py-3 text-muted-foreground font-semibold uppercase tracking-wider text-[10px]">Period</th>
                      <th className="text-right px-4 py-3 text-muted-foreground font-semibold uppercase tracking-wider text-[10px]">Begin Value</th>
                      <th className="text-right px-4 py-3 text-muted-foreground font-semibold uppercase tracking-wider text-[10px]">Cash Flow</th>
                      <th className="text-right px-4 py-3 text-muted-foreground font-semibold uppercase tracking-wider text-[10px]">Adj. Begin</th>
                      <th className="text-right px-4 py-3 text-muted-foreground font-semibold uppercase tracking-wider text-[10px]">End Value</th>
                      <th className="text-right px-4 py-3 text-muted-foreground font-semibold uppercase tracking-wider text-[10px]">HPR</th>
                      <th className="text-right px-4 py-3 text-muted-foreground font-semibold uppercase tracking-wider text-[10px]">Growth Factor</th>
                    </tr>
                  </thead>
                  <tbody>
                    {results.map((r, i) => {
                      const p = periods.find(x => x.id === r.id)!
                      return (
                        <tr key={r.id} className="border-t border-border hover:bg-muted/10 transition-colors">
                          <td className="px-4 py-3 font-semibold text-foreground">{r.label}</td>
                          <td className="px-4 py-3 text-right tabular-nums text-muted-foreground">{fmtFull(p.beginValue)}</td>
                          <td className={`px-4 py-3 text-right tabular-nums ${p.cashFlow > 0 ? "text-green-400" : p.cashFlow < 0 ? "text-red-400" : "text-muted-foreground"}`}>
                            {p.cashFlow !== 0 ? (p.cashFlow > 0 ? "+" : "−") + fmtFull(Math.abs(p.cashFlow)) : "—"}
                            {p.cashFlow !== 0 && <span className="text-muted-foreground ml-1">({p.cashFlowTiming})</span>}
                          </td>
                          <td className="px-4 py-3 text-right tabular-nums text-foreground font-medium">{fmtFull(r.adjustedBegin)}</td>
                          <td className="px-4 py-3 text-right tabular-nums text-foreground">{fmtFull(p.endValue)}</td>
                          <td className={`px-4 py-3 text-right tabular-nums font-bold ${r.hpr >= 0 ? "text-green-400" : "text-red-400"}`}>
                            {fmtPct(r.hpr)}
                          </td>
                          <td className="px-4 py-3 text-right tabular-nums text-muted-foreground">
                            ×{(1 + r.hpr / 100).toFixed(4)}
                          </td>
                        </tr>
                      )
                    })}
                  </tbody>
                  {/* TWR chain-link footer */}
                  {summary && (
                    <tfoot>
                      <tr className="border-t-2 border-border bg-card/50">
                        <td colSpan={5} className="px-4 py-3 font-bold text-foreground text-xs">
                          Chain-Linked TWR ({periods.length} periods)
                        </td>
                        <td className={`px-4 py-3 text-right tabular-nums font-extrabold text-base ${summary.twr >= 0 ? "text-primary" : "text-red-400"}`}>
                          {fmtPct(summary.twr)}
                        </td>
                        <td className="px-4 py-3 text-right tabular-nums font-bold text-foreground">
                          ×{results.reduce((p, r) => p * (1 + r.hpr / 100), 1).toFixed(4)}
                        </td>
                      </tr>
                    </tfoot>
                  )}
                </table>
              </div>
            </div>
          )}

          {/* FAQ */}
          <div className="rounded-2xl border border-border bg-card overflow-hidden">
            <div className="px-6 py-4 border-b border-border">
              <div className="text-sm font-bold text-foreground">Frequently Asked Questions</div>
            </div>
            <div className="p-4 space-y-2">
              {FAQS.map((faq, i) => (
                <div key={i} className="rounded-xl border border-border overflow-hidden">
                  <button onClick={() => setOpenFaq(openFaq === i ? null : i)}
                    className="w-full flex items-center justify-between gap-4 px-5 py-4 text-left text-sm font-medium text-foreground hover:text-primary transition-colors">
                    {faq.q}
                    <span className={`text-muted-foreground text-lg shrink-0 transition-transform duration-200 ${openFaq === i ? "rotate-45 text-primary" : ""}`}>+</span>
                  </button>
                  {openFaq === i && (
                    <div className="px-5 pb-4 text-sm text-muted-foreground leading-relaxed">{faq.a}</div>
                  )}
                </div>
              ))}
            </div>
          </div>

          {/* Related Tools */}
          <div>
            <div className="text-base font-bold text-foreground mb-4">Other Related Tools</div>
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
              {RELATED_TOOLS.map((t) => (
                <Link key={t.href} href={t.href}
                  className="group flex items-center gap-2.5 bg-card border border-border rounded-xl px-4 py-3 hover:border-primary/30 hover:bg-card/80 transition-all">
                  <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center text-base shrink-0">{t.icon}</div>
                  <span className="text-xs font-semibold text-foreground leading-tight">{t.name}</span>
                </Link>
              ))}
            </div>
          </div>

        </div>
      </main>

      <Footer />
    </div>
  )
}
