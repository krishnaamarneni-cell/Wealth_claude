"use client"

import { useState, useEffect } from "react"
import Link from "next/link"
import { Header } from "@/components/header"
import { Footer } from "@/components/footer"
import {
  PieChart,
  Pie,
  Cell,
  Tooltip,
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  ReferenceLine,
} from "recharts"

// ── Types ──────────────────────────────────────────────────
interface Holding {
  id: number
  name: string
  currentValue: number
  targetPct: number
}

interface RebalanceResult {
  id: number
  name: string
  currentValue: number
  currentPct: number
  targetPct: number
  targetValue: number
  difference: number
  action: "buy" | "sell" | "hold"
  drift: number
}

// ── Constants ──────────────────────────────────────────────
const COLORS = ["#4ade80", "#60a5fa", "#fbbf24", "#f87171", "#a78bfa", "#34d399", "#fb923c", "#e879f9"]

const RELATED_TOOLS = [
  { icon: "🥧", name: "Portfolio Weight", href: "/tools/portfolio-weight" },
  { icon: "📈", name: "Time-Weighted Return", href: "/tools/time-weighted-return" },
  { icon: "📊", name: "Money-Weighted Return", href: "/tools/money-weighted-return" },
  { icon: "💵", name: "Stock Profit", href: "/tools/stock-profit-calculator" },
  { icon: "💰", name: "Dividend Calculator", href: "/tools/dividend-calculator" },
  { icon: "🔄", name: "DCA Calculator", href: "/tools/dca-calculator" },
]

const FAQS = [
  {
    q: "What is portfolio rebalancing?",
    a: "Portfolio rebalancing is the process of realigning the weights of your portfolio assets back to your target allocation. Over time, assets that perform well become a larger portion of your portfolio than intended, increasing risk. Rebalancing involves selling overweight assets and buying underweight ones to restore your desired risk/return profile.",
  },
  {
    q: "How often should I rebalance my portfolio?",
    a: "The two most common approaches are calendar rebalancing (quarterly or annually) and threshold rebalancing (when any asset drifts more than 5% from its target). Research suggests annual or semi-annual rebalancing strikes the best balance between maintaining your target allocation and minimizing transaction costs and taxes. Over-rebalancing can hurt returns through excessive trading costs.",
  },
  {
    q: "What is portfolio drift?",
    a: "Portfolio drift is how far an asset's current weight has moved from its target weight. For example, if stocks were 60% of your target but grew to 70%, the drift is +10%. Significant drift means your portfolio now has a different risk profile than you intended — usually more risk in bull markets (stocks grew) or more risk aversion in bear markets.",
  },
  {
    q: "Should I rebalance by selling or by directing new contributions?",
    a: "Directing new contributions to underweight assets is the most tax-efficient rebalancing method — you avoid triggering capital gains taxes. This works well if you're regularly investing. If your portfolio is large relative to contributions, you may also need to sell overweight assets. In tax-advantaged accounts (IRA, 401k), selling to rebalance has no immediate tax consequences.",
  },
  {
    q: "What are good target allocations?",
    a: "Common allocations include: 80/20 (80% stocks, 20% bonds) for aggressive growth, 60/40 (stocks/bonds) for balanced growth, and 40/60 for conservative near-retirement. Within stocks: 70% US / 30% international is common. The right allocation depends on your time horizon, risk tolerance, and financial goals. Younger investors typically hold more stocks; those near retirement shift toward bonds.",
  },
  {
    q: "Does rebalancing improve returns?",
    a: "Rebalancing doesn't necessarily improve absolute returns — in a persistent bull market, rebalancing away from stocks actually reduces returns. Its main benefit is risk control: it ensures you don't accidentally take on more risk than intended. Studies show rebalanced portfolios have better risk-adjusted returns (Sharpe ratio) than drift portfolios over full market cycles.",
  },
  {
    q: "What is a 5/25 rebalancing rule?",
    a: "The 5/25 rule, popularized by Larry Swedroe, says to rebalance when an asset class drifts more than 5 percentage points OR 25% relative from its target. Example: a 40% target allocation triggers rebalancing if it reaches 45% (5% absolute) or 50% (25% relative, since 40% × 1.25 = 50%). This avoids rebalancing tiny allocations too frequently while catching large drifts.",
  },
]

// ── Helpers ────────────────────────────────────────────────
function fmtFull(n: number): string {
  const abs = Math.abs(n)
  const str = abs.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })
  return (n < 0 ? "−$" : "$") + str
}

function fmt(n: number): string {
  const abs = Math.abs(n)
  if (abs >= 1e6) return (n < 0 ? "−$" : "$") + (abs / 1e6).toFixed(2) + "M"
  if (abs >= 1e3) return (n < 0 ? "−$" : "$") + (abs / 1e3).toFixed(1) + "K"
  return fmtFull(n)
}

function CustomPieTooltip({ active, payload }: any) {
  if (!active || !payload?.length) return null
  const d = payload[0]
  return (
    <div className="bg-card border border-border rounded-xl px-4 py-3 shadow-xl text-xs">
      <div className="font-semibold text-foreground mb-1">{d.name}</div>
      <div className="text-muted-foreground">Value: <span className="text-foreground font-semibold">{fmt(d.value)}</span></div>
      <div className="text-muted-foreground">Weight: <span className="text-foreground font-semibold">{d.payload.pct?.toFixed(1)}%</span></div>
    </div>
  )
}

function CustomBarTooltip({ active, payload, label }: any) {
  if (!active || !payload?.length) return null
  return (
    <div className="bg-card border border-border rounded-xl px-4 py-3 shadow-xl text-xs">
      <div className="font-semibold text-foreground mb-2">{label}</div>
      {payload.map((p: any) => (
        <div key={p.dataKey} className="flex items-center gap-2 mb-1">
          <span className="w-2 h-2 rounded-full" style={{ background: p.color }} />
          <span className="text-muted-foreground">{p.name}:</span>
          <span className="font-semibold text-foreground">{p.value.toFixed(1)}%</span>
        </div>
      ))}
    </div>
  )
}

// ── Default holdings ───────────────────────────────────────
const DEFAULT_HOLDINGS: Holding[] = [
  { id: 1, name: "US Stocks", currentValue: 42000, targetPct: 40 },
  { id: 2, name: "Intl Stocks", currentValue: 18000, targetPct: 20 },
  { id: 3, name: "Bonds", currentValue: 22000, targetPct: 25 },
  { id: 4, name: "Real Estate", currentValue: 10000, targetPct: 10 },
  { id: 5, name: "Cash", currentValue: 8000, targetPct: 5 },
]

// ── Main Component ─────────────────────────────────────────
export default function PortfolioRebalancingPage() {
  const [holdings, setHoldings] = useState<Holding[]>(DEFAULT_HOLDINGS)
  const [results, setResults] = useState<RebalanceResult[]>([])
  const [totalValue, setTotalValue] = useState(0)
  const [totalTarget, setTotalTarget] = useState(100)
  const [activeChart, setActiveChart] = useState<"current" | "target" | "drift">("current")
  const [openFaq, setOpenFaq] = useState<number | null>(null)
  const [nextId, setNextId] = useState(6)

  function calculate() {
    const total = holdings.reduce((s, h) => s + h.currentValue, 0)
    setTotalValue(total)

    const sumTarget = holdings.reduce((s, h) => s + h.targetPct, 0)
    setTotalTarget(sumTarget)

    const computed: RebalanceResult[] = holdings.map(h => {
      const currentPct = total > 0 ? (h.currentValue / total) * 100 : 0
      const targetValue = (h.targetPct / 100) * total
      const difference = targetValue - h.currentValue
      const drift = currentPct - h.targetPct

      return {
        id: h.id,
        name: h.name,
        currentValue: h.currentValue,
        currentPct,
        targetPct: h.targetPct,
        targetValue,
        difference,
        drift,
        action: Math.abs(difference) < 1 ? "hold" : difference > 0 ? "buy" : "sell",
      }
    })
    setResults(computed)
  }

  useEffect(() => { calculate() }, [holdings]) // eslint-disable-line

  function addHolding() {
    setHoldings(prev => [...prev, { id: nextId, name: "", currentValue: 0, targetPct: 0 }])
    setNextId(n => n + 1)
  }

  function removeHolding(id: number) {
    setHoldings(prev => prev.filter(h => h.id !== id))
  }

  function updateHolding(id: number, field: keyof Holding, value: string | number) {
    setHoldings(prev => prev.map(h => h.id === id ? { ...h, [field]: value } : h))
  }

  const inputCls = "bg-background border border-border rounded-lg py-2 text-sm text-foreground outline-none focus:border-primary/50 transition-colors px-3 w-full"
  const targetOk = Math.abs(totalTarget - 100) < 0.01

  // Chart data
  const pieCurrentData = results.map((r, i) => ({
    name: r.name, value: r.currentValue, pct: r.currentPct, color: COLORS[i % COLORS.length]
  }))
  const pieTargetData = results.map((r, i) => ({
    name: r.name, value: r.targetValue, pct: r.targetPct, color: COLORS[i % COLORS.length]
  }))
  const driftData = results.map((r, i) => ({
    name: r.name, current: +r.currentPct.toFixed(1), target: +r.targetPct.toFixed(1), drift: +r.drift.toFixed(1), color: COLORS[i % COLORS.length]
  }))

  const totalToBuy = results.filter(r => r.action === "buy").reduce((s, r) => s + r.difference, 0)
  const totalToSell = results.filter(r => r.action === "sell").reduce((s, r) => s + Math.abs(r.difference), 0)

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <Header />

      <main className="pt-16 flex-1">

        {/* Page Header */}
        <div className="max-w-5xl mx-auto px-4 sm:px-6 pt-12 pb-8 text-center">
          <div className="text-xs font-bold tracking-widest uppercase text-primary mb-3">Free Tools</div>
          <h1 className="text-3xl sm:text-4xl font-extrabold tracking-tight text-foreground mb-3">
            Portfolio Rebalancing Calculator
          </h1>
          <p className="text-muted-foreground text-sm max-w-md mx-auto leading-relaxed">
            Enter your current holdings and target allocation. We'll calculate exactly
            how much to buy or sell of each asset to restore your ideal portfolio balance.
          </p>
        </div>

        <div className="max-w-5xl mx-auto px-4 sm:px-6 pb-20 space-y-4">

          {/* Holdings input */}
          <div className="rounded-2xl border border-border bg-card overflow-hidden">
            <div className="flex items-center justify-between px-6 py-4 border-b border-border">
              <div className="text-sm font-bold text-foreground">Your Holdings</div>
              <div className="flex items-center gap-3">
                <div className={`text-xs font-semibold px-3 py-1 rounded-lg border ${targetOk ? "text-primary border-primary/30 bg-primary/10" : "text-amber-400 border-amber-400/30 bg-amber-400/10"}`}>
                  Target total: {totalTarget.toFixed(1)}% {targetOk ? "✓" : "⚠ must equal 100%"}
                </div>
              </div>
            </div>

            <div className="p-5 space-y-2">
              {/* Column headers */}
              <div className="grid grid-cols-12 gap-3 px-1 pb-1">
                <div className="col-span-4 text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">Asset Name</div>
                <div className="col-span-3 text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">Current Value</div>
                <div className="col-span-2 text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">Target %</div>
                <div className="col-span-2 text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">Current %</div>
                <div className="col-span-1" />
              </div>

              {holdings.map((h, idx) => {
                const result = results.find(r => r.id === h.id)
                return (
                  <div key={h.id} className="grid grid-cols-12 gap-3 items-center">
                    {/* Color dot + name */}
                    <div className="col-span-4 flex items-center gap-2">
                      <span className="w-2.5 h-2.5 rounded-full shrink-0" style={{ background: COLORS[idx % COLORS.length] }} />
                      <input type="text" placeholder="Asset name" value={h.name}
                        onChange={(e) => updateHolding(h.id, "name", e.target.value)}
                        className={inputCls} />
                    </div>

                    {/* Current value */}
                    <div className="col-span-3 relative">
                      <span className="absolute left-3 top-1/2 -translate-y-1/2 text-xs text-muted-foreground">$</span>
                      <input type="number" value={h.currentValue} min={0}
                        onChange={(e) => updateHolding(h.id, "currentValue", +e.target.value || 0)}
                        className={inputCls + " pl-6"} />
                    </div>

                    {/* Target % */}
                    <div className="col-span-2 relative">
                      <input type="number" value={h.targetPct} min={0} max={100} step={0.1}
                        onChange={(e) => updateHolding(h.id, "targetPct", +e.target.value || 0)}
                        className={inputCls + " pr-6"} />
                      <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-muted-foreground">%</span>
                    </div>

                    {/* Current % (read-only) */}
                    <div className="col-span-2">
                      <div className={`rounded-lg border px-3 py-2 text-sm font-semibold text-center ${result && Math.abs(result.drift) > 5
                          ? "border-amber-400/30 bg-amber-400/10 text-amber-400"
                          : "border-border bg-background text-muted-foreground"
                        }`}>
                        {result ? result.currentPct.toFixed(1) + "%" : "—"}
                      </div>
                    </div>

                    {/* Remove */}
                    <div className="col-span-1 flex justify-center">
                      {holdings.length > 1 && (
                        <button onClick={() => removeHolding(h.id)}
                          className="text-muted-foreground hover:text-red-400 transition-colors text-lg leading-none">
                          ×
                        </button>
                      )}
                    </div>
                  </div>
                )
              })}

              {/* Add holding */}
              <button onClick={addHolding}
                className="w-full mt-2 rounded-xl border border-dashed border-border hover:border-primary/40 hover:bg-primary/5 transition-all py-3 text-sm font-semibold text-muted-foreground hover:text-primary flex items-center justify-center gap-2">
                <span className="text-lg leading-none">+</span>
                Add Asset
              </button>
            </div>

            {/* Portfolio total */}
            <div className="px-6 py-3 border-t border-border bg-card/50 flex items-center justify-between">
              <span className="text-xs text-muted-foreground font-medium">Total Portfolio Value</span>
              <span className="text-sm font-bold text-foreground">{fmt(totalValue)}</span>
            </div>
          </div>

          {/* Summary stats */}
          {results.length > 0 && totalValue > 0 && (
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              <div className="bg-card border border-border rounded-2xl px-5 py-4">
                <div className="text-xs text-muted-foreground mb-1">Total Portfolio</div>
                <div className="text-lg font-bold text-foreground">{fmt(totalValue)}</div>
              </div>
              <div className="bg-primary/5 border border-primary/20 rounded-2xl px-5 py-4">
                <div className="text-xs text-muted-foreground mb-1">Total to Buy</div>
                <div className="text-lg font-bold text-green-400">+{fmt(totalToBuy)}</div>
              </div>
              <div className="bg-red-400/5 border border-red-400/20 rounded-2xl px-5 py-4">
                <div className="text-xs text-muted-foreground mb-1">Total to Sell</div>
                <div className="text-lg font-bold text-red-400">−{fmt(totalToSell)}</div>
              </div>
              <div className="bg-card border border-border rounded-2xl px-5 py-4">
                <div className="text-xs text-muted-foreground mb-1">Assets Needing Action</div>
                <div className="text-lg font-bold text-foreground">
                  {results.filter(r => r.action !== "hold").length} / {results.length}
                </div>
              </div>
            </div>
          )}

          {/* Rebalancing action table */}
          {results.length > 0 && totalValue > 0 && (
            <div className="rounded-2xl border border-border bg-card overflow-hidden">
              <div className="px-6 py-4 border-b border-border">
                <div className="text-sm font-bold text-foreground">Rebalancing Actions</div>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-xs">
                  <thead className="bg-card/95">
                    <tr>
                      <th className="text-left px-4 py-3 text-muted-foreground font-semibold uppercase tracking-wider text-[10px]">Asset</th>
                      <th className="text-right px-4 py-3 text-muted-foreground font-semibold uppercase tracking-wider text-[10px]">Current Value</th>
                      <th className="text-right px-4 py-3 text-muted-foreground font-semibold uppercase tracking-wider text-[10px]">Current %</th>
                      <th className="text-right px-4 py-3 text-muted-foreground font-semibold uppercase tracking-wider text-[10px]">Target %</th>
                      <th className="text-right px-4 py-3 text-muted-foreground font-semibold uppercase tracking-wider text-[10px]">Target Value</th>
                      <th className="text-right px-4 py-3 text-muted-foreground font-semibold uppercase tracking-wider text-[10px]">Drift</th>
                      <th className="text-right px-4 py-3 text-muted-foreground font-semibold uppercase tracking-wider text-[10px]">Action</th>
                      <th className="text-right px-4 py-3 text-muted-foreground font-semibold uppercase tracking-wider text-[10px]">Amount</th>
                    </tr>
                  </thead>
                  <tbody>
                    {results.map((r, i) => (
                      <tr key={r.id} className="border-t border-border hover:bg-muted/10 transition-colors">
                        <td className="px-4 py-3 font-semibold text-foreground flex items-center gap-2">
                          <span className="w-2 h-2 rounded-full inline-block" style={{ background: COLORS[i % COLORS.length] }} />
                          {r.name || `Asset ${i + 1}`}
                        </td>
                        <td className="px-4 py-3 text-right tabular-nums text-muted-foreground">{fmt(r.currentValue)}</td>
                        <td className="px-4 py-3 text-right tabular-nums text-muted-foreground">{r.currentPct.toFixed(1)}%</td>
                        <td className="px-4 py-3 text-right tabular-nums text-muted-foreground">{r.targetPct.toFixed(1)}%</td>
                        <td className="px-4 py-3 text-right tabular-nums text-foreground font-medium">{fmt(r.targetValue)}</td>
                        <td className={`px-4 py-3 text-right tabular-nums font-semibold ${Math.abs(r.drift) > 5 ? "text-amber-400" : r.drift > 0 ? "text-red-400/80" : r.drift < 0 ? "text-blue-400/80" : "text-muted-foreground"}`}>
                          {r.drift > 0 ? "+" : ""}{r.drift.toFixed(1)}%
                        </td>
                        <td className="px-4 py-3 text-right">
                          <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider ${r.action === "buy" ? "bg-green-400/15 text-green-400 border border-green-400/25" :
                              r.action === "sell" ? "bg-red-400/15 text-red-400 border border-red-400/25" :
                                "bg-muted/20 text-muted-foreground border border-border"
                            }`}>
                            {r.action === "buy" ? "↑ Buy" : r.action === "sell" ? "↓ Sell" : "Hold"}
                          </span>
                        </td>
                        <td className={`px-4 py-3 text-right tabular-nums font-bold ${r.action === "buy" ? "text-green-400" : r.action === "sell" ? "text-red-400" : "text-muted-foreground"
                          }`}>
                          {r.action === "hold" ? "—" : (r.action === "buy" ? "+" : "−") + fmt(Math.abs(r.difference))}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* Charts */}
          {results.length > 0 && totalValue > 0 && (
            <div className="rounded-2xl border border-border bg-card overflow-hidden">
              <div className="flex items-center justify-between px-6 py-4 border-b border-border">
                <div className="text-sm font-bold text-foreground">Portfolio Visualization</div>
                <div className="flex gap-1 bg-muted/20 rounded-lg p-1">
                  {([
                    { key: "current", label: "Current" },
                    { key: "target", label: "Target" },
                    { key: "drift", label: "Drift" },
                  ] as const).map((t) => (
                    <button key={t.key} onClick={() => setActiveChart(t.key)}
                      className={`px-3 py-1 rounded-md text-xs font-medium transition-all ${activeChart === t.key ? "bg-card text-foreground shadow-sm" : "text-muted-foreground hover:text-foreground"}`}>
                      {t.label}
                    </button>
                  ))}
                </div>
              </div>
              <div className="p-6">
                {activeChart !== "drift" ? (
                  <div className="flex flex-col sm:flex-row items-center gap-6">
                    <ResponsiveContainer width="100%" height={280}>
                      <PieChart>
                        <Pie
                          data={activeChart === "current" ? pieCurrentData : pieTargetData}
                          cx="50%"
                          cy="50%"
                          innerRadius={70}
                          outerRadius={120}
                          paddingAngle={2}
                          dataKey="value"
                        >
                          {(activeChart === "current" ? pieCurrentData : pieTargetData).map((entry, i) => (
                            <Cell key={i} fill={entry.color} />
                          ))}
                        </Pie>
                        <Tooltip content={<CustomPieTooltip />} />
                      </PieChart>
                    </ResponsiveContainer>
                    {/* Legend */}
                    <div className="flex flex-col gap-2 min-w-[160px]">
                      {(activeChart === "current" ? pieCurrentData : pieTargetData).map((d, i) => (
                        <div key={i} className="flex items-center gap-2 text-xs">
                          <span className="w-3 h-3 rounded-sm shrink-0" style={{ background: d.color }} />
                          <span className="text-muted-foreground flex-1">{d.name || `Asset ${i + 1}`}</span>
                          <span className="font-semibold text-foreground">{d.pct?.toFixed(1)}%</span>
                        </div>
                      ))}
                    </div>
                  </div>
                ) : (
                  <>
                    <div className="flex items-center gap-4 text-xs text-muted-foreground mb-4">
                      <span className="flex items-center gap-1.5"><span className="w-3 h-3 rounded-sm bg-primary inline-block" />Current %</span>
                      <span className="flex items-center gap-1.5"><span className="w-3 h-3 rounded-sm bg-blue-400 inline-block" />Target %</span>
                    </div>
                    <ResponsiveContainer width="100%" height={280}>
                      <BarChart data={driftData} margin={{ top: 5, right: 10, left: 0, bottom: 5 }}>
                        <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.04)" />
                        <XAxis dataKey="name" tick={{ fill: "#71717a", fontSize: 11 }} axisLine={false} tickLine={false} />
                        <YAxis tick={{ fill: "#71717a", fontSize: 11 }} axisLine={false} tickLine={false} width={40}
                          tickFormatter={(v) => v + "%"} />
                        <Tooltip content={<CustomBarTooltip />} />
                        <Bar dataKey="current" name="Current %" fill="#4ade80" radius={[4, 4, 0, 0]} />
                        <Bar dataKey="target" name="Target %" fill="#60a5fa" radius={[4, 4, 0, 0]} />
                      </BarChart>
                    </ResponsiveContainer>
                  </>
                )}
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
