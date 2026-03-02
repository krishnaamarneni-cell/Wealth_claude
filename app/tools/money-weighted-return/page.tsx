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
interface CashFlow {
  id: number
  label: string
  date: string
  amount: number
  type: "deposit" | "withdrawal" | "ending"
}

interface Results {
  mwr: number
  annualizedMwr: number
  totalInvested: number
  totalWithdrawn: number
  endingValue: number
  netProfit: number
  totalDays: number
  totalYears: number
  simpleReturn: number
}

interface ChartPoint {
  label: string
  cashFlow: number
  cumulative: number
}

// ── Constants ──────────────────────────────────────────────
const RELATED_TOOLS = [
  { icon: "📈", name: "Time-Weighted Return", href: "/tools/time-weighted-return" },
  { icon: "⚖️", name: "Portfolio Rebalancing", href: "/tools/portfolio-rebalancing" },
  { icon: "🥧", name: "Portfolio Weight", href: "/tools/portfolio-weight" },
  { icon: "💵", name: "Stock Profit", href: "/tools/stock-profit-calculator" },
  { icon: "🔄", name: "DCA Calculator", href: "/tools/dca-calculator" },
  { icon: "💰", name: "Dividend Calculator", href: "/tools/dividend-calculator" },
]

const FAQS = [
  {
    q: "What is Money-Weighted Return (MWR)?",
    a: "Money-Weighted Return (MWR), also known as the Internal Rate of Return (IRR), is the rate of return that accounts for the size and timing of all cash flows into and out of a portfolio. Unlike TWR, MWR reflects the actual investor experience — if you invested a large amount right before a crash, your MWR will be worse than the portfolio's TWR.",
  },
  {
    q: "How is MWR calculated?",
    a: "MWR is the discount rate that makes the Net Present Value (NPV) of all cash flows equal to zero. It's solved iteratively: 0 = CF0 + CF1/(1+r)^t1 + CF2/(1+r)^t2 + ... + CFn/(1+r)^tn. Deposits are negative cash flows (money out of your pocket) and withdrawals plus ending value are positive (money back to you). Our calculator uses Newton's method to solve for r.",
  },
  {
    q: "When is MWR more useful than TWR?",
    a: "MWR is more useful when you want to understand your personal financial outcome — how much did your specific investment decisions, including when you added or withdrew money, actually earn you? TWR is better for evaluating a fund manager's skill. If you DCA'd into a volatile fund, your MWR shows the actual return you achieved on your dollars.",
  },
  {
    q: "Can MWR be misleading?",
    a: "Yes — MWR can be heavily influenced by cash flow timing rather than investment skill. If you withdrew a large amount just before a big rally, your MWR looks worse than the portfolio's actual performance. Conversely, adding money just before a rally boosts your MWR above the portfolio's TWR. That's why fund managers report TWR but investors often care more about MWR.",
  },
  {
    q: "What's the difference between MWR and simple return?",
    a: "Simple return = (Ending Value + Withdrawals − Deposits) ÷ Deposits. It doesn't account for timing — a 50% return over 1 year and 50% over 10 years look the same. MWR annualizes the return and accounts for when each cash flow occurred, making it a true annualized per-dollar return. For multi-year portfolios with multiple contributions, MWR is far more accurate.",
  },
  {
    q: "What counts as a cash flow in MWR?",
    a: "Initial investment (deposit), additional contributions (deposits), dividends taken as cash (withdrawals), partial or full withdrawals, and the final ending portfolio value (treated as a final cash inflow to you). Reinvested dividends and internal trades don't count — only external money flows in or out of the portfolio.",
  },
  {
    q: "What is a good MWR?",
    a: "Compare your MWR to relevant benchmarks for the same period. A 10%+ annualized MWR over a decade is excellent. Compare to the S&P 500's annualized return over the same period — if the index returned 12% and your MWR is 8%, your cash flow timing or asset selection cost you 4%/year. Positive MWR means you made money; negative means losses on a time-adjusted basis.",
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

function fmtPct(n: number, dec = 2): string {
  return (n >= 0 ? "+" : "") + n.toFixed(dec) + "%"
}

function daysBetween(d1: string, d2: string): number {
  const diff = new Date(d2).getTime() - new Date(d1).getTime()
  return Math.max(1, Math.round(diff / (1000 * 60 * 60 * 24)))
}

// Newton's method to solve for IRR/MWR
function solveIRR(cashFlows: { amount: number; days: number }[]): number {
  let rate = 0.1
  for (let iter = 0; iter < 1000; iter++) {
    let npv = 0
    let dnpv = 0
    for (const cf of cashFlows) {
      const t = cf.days / 365
      const pv = cf.amount / Math.pow(1 + rate, t)
      npv += pv
      dnpv -= t * cf.amount / Math.pow(1 + rate, t + 1)
    }
    const newRate = rate - npv / dnpv
    if (Math.abs(newRate - rate) < 1e-8) return newRate
    rate = newRate
    // Clamp to prevent divergence
    if (rate < -0.999) rate = -0.5
    if (rate > 100) rate = 1
  }
  return rate
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
            {fmt(p.value)}
          </span>
        </div>
      ))}
    </div>
  )
}

// ── Default cash flows ─────────────────────────────────────
const DEFAULT_FLOWS: CashFlow[] = [
  { id: 1, label: "Initial Investment", date: "2022-01-01", amount: 50000, type: "deposit" },
  { id: 2, label: "Additional Deposit", date: "2022-07-01", amount: 10000, type: "deposit" },
  { id: 3, label: "Additional Deposit", date: "2023-01-01", amount: 10000, type: "deposit" },
  { id: 4, label: "Partial Withdrawal", date: "2023-06-01", amount: 5000, type: "withdrawal" },
  { id: 5, label: "Ending Portfolio", date: "2024-01-01", amount: 82000, type: "ending" },
]

// ── Main Component ─────────────────────────────────────────
export default function MoneyWeightedReturnPage() {
  const [flows, setFlows] = useState<CashFlow[]>(DEFAULT_FLOWS)
  const [results, setResults] = useState<Results | null>(null)
  const [chartData, setChartData] = useState<ChartPoint[]>([])
  const [activeChart, setActiveChart] = useState<"flows" | "cumulative">("flows")
  const [openFaq, setOpenFaq] = useState<number | null>(null)
  const [nextId, setNextId] = useState(6)
  const [error, setError] = useState<string | null>(null)

  function calculate() {
    setError(null)
    const sorted = [...flows].sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())
    if (sorted.length < 2) { setError("Add at least 2 cash flows to calculate MWR."); return }

    const startDate = sorted[0].date
    const endingFlow = sorted.find(f => f.type === "ending")
    if (!endingFlow) { setError("Add an ending portfolio value to calculate MWR."); return }

    // Build IRR cash flows: deposits = negative (outflow), withdrawals+ending = positive (inflow)
    const irrFlows = sorted.map(f => ({
      amount: f.type === "deposit" ? -f.amount : f.amount,
      days: daysBetween(startDate, f.date),
    }))

    let mwr = 0
    try {
      mwr = solveIRR(irrFlows)
    } catch {
      setError("Could not converge on MWR. Check your cash flows.")
      return
    }

    const totalDays = daysBetween(startDate, endingFlow.date)
    const totalYears = totalDays / 365
    const annualizedMwr = mwr * 100

    const totalInvested = flows.filter(f => f.type === "deposit").reduce((s, f) => s + f.amount, 0)
    const totalWithdrawn = flows.filter(f => f.type === "withdrawal").reduce((s, f) => s + f.amount, 0)
    const endingValue = endingFlow.amount
    const netProfit = endingValue + totalWithdrawn - totalInvested
    const simpleReturn = totalInvested > 0 ? (netProfit / totalInvested) * 100 : 0

    // Chart: cash flows over time
    let cumulative = 0
    const points: ChartPoint[] = sorted.map(f => {
      const amount = f.type === "deposit" ? f.amount : -f.amount
      cumulative += f.type === "ending" ? 0 : amount
      return {
        label: f.label + " (" + f.date + ")",
        cashFlow: f.type === "deposit" ? f.amount : f.type === "withdrawal" ? -f.amount : 0,
        cumulative: f.type === "ending" ? endingValue : cumulative,
      }
    })

    setResults({ mwr: annualizedMwr, annualizedMwr, totalInvested, totalWithdrawn, endingValue, netProfit, totalDays, totalYears, simpleReturn })
    setChartData(points)
  }

  useEffect(() => { calculate() }, [flows]) // eslint-disable-line

  function addFlow(type: CashFlow["type"]) {
    const lastDate = flows[flows.length - 1]?.date ?? new Date().toISOString().slice(0, 10)
    setFlows(prev => [...prev, {
      id: nextId,
      label: type === "deposit" ? "Deposit" : type === "withdrawal" ? "Withdrawal" : "Ending Portfolio",
      date: lastDate,
      amount: type === "ending" ? 0 : 1000,
      type,
    }])
    setNextId(n => n + 1)
  }

  function removeFlow(id: number) {
    setFlows(prev => prev.filter(f => f.id !== id))
  }

  function updateFlow(id: number, field: keyof CashFlow, value: any) {
    setFlows(prev => prev.map(f => f.id === id ? { ...f, [field]: value } : f))
  }

  const inputCls = "bg-background border border-border rounded-lg py-2 text-sm text-foreground outline-none focus:border-primary/50 transition-colors px-3 w-full"

  const typeColor = (type: CashFlow["type"]) =>
    type === "deposit" ? "text-green-400" : type === "withdrawal" ? "text-red-400" : "text-blue-400"
  const typeIcon = (type: CashFlow["type"]) =>
    type === "deposit" ? "↓" : type === "withdrawal" ? "↑" : "◆"
  const typeBg = (type: CashFlow["type"]) =>
    type === "deposit" ? "bg-green-400/10 border-green-400/20" : type === "withdrawal" ? "bg-red-400/10 border-red-400/20" : "bg-blue-400/10 border-blue-400/20"

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <Header />

      <main className="pt-16 flex-1">

        {/* Page Header */}
        <div className="max-w-5xl mx-auto px-4 sm:px-6 pt-12 pb-8 text-center">
          <div className="text-xs font-bold tracking-widest uppercase text-primary mb-3">Free Tools</div>
          <h1 className="text-3xl sm:text-4xl font-extrabold tracking-tight text-foreground mb-3">
            Money-Weighted Return Calculator
          </h1>
          <p className="text-muted-foreground text-sm max-w-lg mx-auto leading-relaxed">
            Calculate your true personal investment return (IRR) — accounting for
            the exact size and timing of every deposit and withdrawal you made.
          </p>
        </div>

        <div className="max-w-5xl mx-auto px-4 sm:px-6 pb-20 space-y-4">

          {/* MWR vs TWR explainer */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div className="bg-primary/5 border border-primary/20 rounded-2xl px-5 py-4">
              <div className="text-xs font-bold text-primary mb-1">Money-Weighted Return (MWR / IRR)</div>
              <div className="text-sm font-semibold text-foreground mb-1">Your personal return</div>
              <div className="text-xs text-muted-foreground leading-relaxed">Accounts for when you invested — large deposits before a crash hurt your MWR. Best for understanding your actual financial outcome.</div>
            </div>
            <div className="bg-card border border-border rounded-2xl px-5 py-4">
              <div className="text-xs font-bold text-muted-foreground mb-1">Time-Weighted Return (TWR)</div>
              <div className="text-sm font-semibold text-foreground mb-1">The portfolio's return</div>
              <div className="text-xs text-muted-foreground leading-relaxed">Eliminates cash flow timing effects. Best for evaluating fund manager skill or comparing to a benchmark index.</div>
            </div>
          </div>

          {/* Cash flow inputs */}
          <div className="rounded-2xl border border-border bg-card overflow-hidden">
            <div className="flex items-center justify-between px-6 py-4 border-b border-border">
              <div className="text-sm font-bold text-foreground">Cash Flows</div>
              <div className="flex gap-2">
                <button onClick={() => addFlow("deposit")}
                  className="px-3 py-1.5 rounded-lg bg-green-400/10 border border-green-400/25 text-green-400 text-xs font-semibold hover:bg-green-400/20 transition-all">
                  + Deposit
                </button>
                <button onClick={() => addFlow("withdrawal")}
                  className="px-3 py-1.5 rounded-lg bg-red-400/10 border border-red-400/25 text-red-400 text-xs font-semibold hover:bg-red-400/20 transition-all">
                  + Withdrawal
                </button>
                <button onClick={() => addFlow("ending")}
                  className="px-3 py-1.5 rounded-lg bg-blue-400/10 border border-blue-400/25 text-blue-400 text-xs font-semibold hover:bg-blue-400/20 transition-all">
                  + Ending Value
                </button>
              </div>
            </div>

            <div className="p-5 space-y-2">
              {/* Column headers */}
              <div className="grid grid-cols-12 gap-2 px-1 pb-1">
                <div className="col-span-1 text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">Type</div>
                <div className="col-span-3 text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">Label</div>
                <div className="col-span-3 text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">Date</div>
                <div className="col-span-4 text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">Amount</div>
                <div className="col-span-1" />
              </div>

              {[...flows].sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime()).map((f) => (
                <div key={f.id} className="grid grid-cols-12 gap-2 items-center">
                  {/* Type badge */}
                  <div className="col-span-1">
                    <div className={`rounded-lg border px-2 py-2 text-xs font-bold text-center ${typeBg(f.type)} ${typeColor(f.type)}`}>
                      {typeIcon(f.type)}
                    </div>
                  </div>
                  <div className="col-span-3">
                    <input type="text" value={f.label}
                      onChange={(e) => updateFlow(f.id, "label", e.target.value)}
                      className={inputCls} />
                  </div>
                  <div className="col-span-3">
                    <input type="date" value={f.date}
                      onChange={(e) => updateFlow(f.id, "date", e.target.value)}
                      className={inputCls} />
                  </div>
                  <div className="col-span-4 relative">
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-xs text-muted-foreground">$</span>
                    <input type="number" value={f.amount} min={0}
                      onChange={(e) => updateFlow(f.id, "amount", +e.target.value || 0)}
                      className={inputCls + " pl-6"} />
                  </div>
                  <div className="col-span-1 flex justify-center">
                    {flows.length > 2 && (
                      <button onClick={() => removeFlow(f.id)}
                        className="text-muted-foreground hover:text-red-400 transition-colors text-lg leading-none">×</button>
                    )}
                  </div>
                </div>
              ))}
            </div>

            {/* Legend */}
            <div className="px-6 py-3 border-t border-border bg-card/50 flex flex-wrap gap-4 text-xs text-muted-foreground">
              <span className="flex items-center gap-1.5"><span className="text-green-400 font-bold">↓</span> Deposit — money you put in</span>
              <span className="flex items-center gap-1.5"><span className="text-red-400 font-bold">↑</span> Withdrawal — money you took out</span>
              <span className="flex items-center gap-1.5"><span className="text-blue-400 font-bold">◆</span> Ending Value — current portfolio value</span>
            </div>
          </div>

          {/* Error */}
          {error && (
            <div className="rounded-2xl border border-amber-400/30 bg-amber-400/10 px-5 py-4 text-sm text-amber-400 font-medium">
              ⚠ {error}
            </div>
          )}

          {/* Results Banner */}
          {results && !error && (
            <div className={`rounded-2xl border p-6 ${results.mwr >= 0 ? "border-primary/20 bg-primary/5" : "border-red-400/20 bg-red-400/5"}`}>
              <div className="flex items-center gap-2 text-[10px] font-bold tracking-widest uppercase text-primary mb-5">
                <span className="w-1.5 h-1.5 rounded-full bg-primary inline-block" />
                Money-Weighted Return Results
              </div>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-4">
                <div>
                  <div className="text-xs text-muted-foreground mb-1">Annualized MWR (IRR)</div>
                  <div className={`text-2xl sm:text-3xl font-extrabold tracking-tight ${results.mwr >= 0 ? "text-primary" : "text-red-400"}`}>
                    {fmtPct(results.mwr)} / yr
                  </div>
                </div>
                <div>
                  <div className="text-xs text-muted-foreground mb-1">Net Profit / Loss</div>
                  <div className={`text-xl font-bold ${results.netProfit >= 0 ? "text-green-400" : "text-red-400"}`}>
                    {fmtFull(results.netProfit)}
                  </div>
                </div>
                <div>
                  <div className="text-xs text-muted-foreground mb-1">Simple Return</div>
                  <div className={`text-xl font-bold ${results.simpleReturn >= 0 ? "text-foreground" : "text-red-400"}`}>
                    {fmtPct(results.simpleReturn)}
                  </div>
                </div>
                <div>
                  <div className="text-xs text-muted-foreground mb-1">Investment Period</div>
                  <div className="text-xl font-bold text-foreground">
                    {results.totalYears.toFixed(1)} yrs
                  </div>
                </div>
              </div>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 pt-4 border-t border-border/30">
                <div>
                  <div className="text-xs text-muted-foreground mb-1">Total Deposited</div>
                  <div className="text-lg font-bold text-green-400">{fmtFull(results.totalInvested)}</div>
                </div>
                <div>
                  <div className="text-xs text-muted-foreground mb-1">Total Withdrawn</div>
                  <div className="text-lg font-bold text-red-400">{fmtFull(results.totalWithdrawn)}</div>
                </div>
                <div>
                  <div className="text-xs text-muted-foreground mb-1">Ending Portfolio Value</div>
                  <div className="text-lg font-bold text-blue-400">{fmtFull(results.endingValue)}</div>
                </div>
                <div>
                  <div className="text-xs text-muted-foreground mb-1">Total Days</div>
                  <div className="text-lg font-bold text-foreground">{results.totalDays.toLocaleString()} days</div>
                </div>
              </div>

              {/* MWR vs Simple Return comparison */}
              <div className="mt-4 pt-4 border-t border-border/30 rounded-xl bg-card/40 px-4 py-3 text-xs text-muted-foreground">
                <span className="font-semibold text-foreground">MWR vs Simple Return: </span>
                Your MWR of <span className={`font-bold ${results.mwr >= 0 ? "text-primary" : "text-red-400"}`}>{fmtPct(results.mwr)}/yr</span> annualizes
                your simple return of <span className="font-bold text-foreground">{fmtPct(results.simpleReturn)}</span> over{" "}
                <span className="font-bold text-foreground">{results.totalYears.toFixed(1)} years</span>, weighted by exactly when each dollar was invested.
              </div>
            </div>
          )}

          {/* Charts */}
          {chartData.length > 0 && !error && (
            <div className="rounded-2xl border border-border bg-card overflow-hidden">
              <div className="flex items-center justify-between px-6 py-4 border-b border-border">
                <div className="text-sm font-bold text-foreground">Cash Flow Visualization</div>
                <div className="flex gap-1 bg-muted/20 rounded-lg p-1">
                  <button onClick={() => setActiveChart("flows")}
                    className={`px-3 py-1 rounded-md text-xs font-medium transition-all ${activeChart === "flows" ? "bg-card text-foreground shadow-sm" : "text-muted-foreground hover:text-foreground"}`}>
                    Cash Flows
                  </button>
                  <button onClick={() => setActiveChart("cumulative")}
                    className={`px-3 py-1 rounded-md text-xs font-medium transition-all ${activeChart === "cumulative" ? "bg-card text-foreground shadow-sm" : "text-muted-foreground hover:text-foreground"}`}>
                    Portfolio Value
                  </button>
                </div>
              </div>
              <div className="p-6">
                {activeChart === "flows" ? (
                  <>
                    <div className="flex items-center gap-4 text-xs text-muted-foreground mb-4">
                      <span className="flex items-center gap-1.5"><span className="w-3 h-3 rounded-sm bg-green-400 inline-block" />Deposits</span>
                      <span className="flex items-center gap-1.5"><span className="w-3 h-3 rounded-sm bg-red-400 inline-block" />Withdrawals</span>
                    </div>
                    <ResponsiveContainer width="100%" height={280}>
                      <BarChart data={chartData} margin={{ top: 5, right: 10, left: 10, bottom: 5 }}>
                        <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.04)" />
                        <XAxis dataKey="label" tick={{ fill: "#71717a", fontSize: 9 }} axisLine={false} tickLine={false}
                          tickFormatter={(v) => v.split(" (")[0].slice(0, 12)} />
                        <YAxis tick={{ fill: "#71717a", fontSize: 11 }} axisLine={false} tickLine={false} width={72}
                          tickFormatter={(v) => {
                            const abs = Math.abs(v)
                            if (abs >= 1e3) return (v < 0 ? "−$" : "$") + (abs / 1e3).toFixed(0) + "K"
                            return "$" + v
                          }} />
                        <Tooltip content={<CustomTooltip />} />
                        <ReferenceLine y={0} stroke="#334155" strokeWidth={1.5} />
                        <Bar dataKey="cashFlow" name="Cash Flow" radius={[4, 4, 4, 4]}>
                          {chartData.map((entry, i) => (
                            <Cell key={i} fill={entry.cashFlow >= 0 ? "#4ade80" : "#f87171"} />
                          ))}
                        </Bar>
                      </BarChart>
                    </ResponsiveContainer>
                  </>
                ) : (
                  <>
                    <div className="flex items-center gap-4 text-xs text-muted-foreground mb-4">
                      <span className="flex items-center gap-1.5"><span className="w-4 h-0.5 bg-primary inline-block rounded" />Cumulative Invested / Portfolio Value</span>
                    </div>
                    <ResponsiveContainer width="100%" height={280}>
                      <LineChart data={chartData} margin={{ top: 5, right: 10, left: 10, bottom: 5 }}>
                        <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.04)" />
                        <XAxis dataKey="label" tick={{ fill: "#71717a", fontSize: 9 }} axisLine={false} tickLine={false}
                          tickFormatter={(v) => v.split(" (")[0].slice(0, 12)} />
                        <YAxis tick={{ fill: "#71717a", fontSize: 11 }} axisLine={false} tickLine={false} width={72}
                          tickFormatter={(v) => {
                            if (v >= 1e3) return "$" + (v / 1e3).toFixed(0) + "K"
                            return "$" + v
                          }} />
                        <Tooltip content={<CustomTooltip />} />
                        <Line type="monotone" dataKey="cumulative" name="Portfolio / Invested" stroke="#4ade80" strokeWidth={2.5} dot={{ fill: "#4ade80", r: 5 }} activeDot={{ r: 7 }} />
                      </LineChart>
                    </ResponsiveContainer>
                  </>
                )}
              </div>
            </div>
          )}

          {/* Cash flow summary table */}
          {flows.length > 0 && !error && (
            <div className="rounded-2xl border border-border bg-card overflow-hidden">
              <div className="px-6 py-4 border-b border-border">
                <div className="text-sm font-bold text-foreground">Cash Flow Summary</div>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-xs">
                  <thead className="bg-card/95">
                    <tr>
                      <th className="text-left px-4 py-3 text-muted-foreground font-semibold uppercase tracking-wider text-[10px]">Type</th>
                      <th className="text-left px-4 py-3 text-muted-foreground font-semibold uppercase tracking-wider text-[10px]">Label</th>
                      <th className="text-right px-4 py-3 text-muted-foreground font-semibold uppercase tracking-wider text-[10px]">Date</th>
                      <th className="text-right px-4 py-3 text-muted-foreground font-semibold uppercase tracking-wider text-[10px]">Amount</th>
                      <th className="text-right px-4 py-3 text-muted-foreground font-semibold uppercase tracking-wider text-[10px]">Days from Start</th>
                      <th className="text-right px-4 py-3 text-muted-foreground font-semibold uppercase tracking-wider text-[10px]">IRR Sign</th>
                    </tr>
                  </thead>
                  <tbody>
                    {[...flows].sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime()).map((f, i) => {
                      const startDate = [...flows].sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())[0].date
                      const days = daysBetween(startDate, f.date)
                      return (
                        <tr key={f.id} className="border-t border-border hover:bg-muted/10 transition-colors">
                          <td className="px-4 py-3">
                            <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold border ${typeBg(f.type)} ${typeColor(f.type)}`}>
                              {typeIcon(f.type)} {f.type.charAt(0).toUpperCase() + f.type.slice(1)}
                            </span>
                          </td>
                          <td className="px-4 py-3 text-foreground font-medium">{f.label}</td>
                          <td className="px-4 py-3 text-right text-muted-foreground">{f.date}</td>
                          <td className={`px-4 py-3 text-right tabular-nums font-semibold ${typeColor(f.type)}`}>
                            {fmtFull(f.amount)}
                          </td>
                          <td className="px-4 py-3 text-right tabular-nums text-muted-foreground">{days}</td>
                          <td className={`px-4 py-3 text-right tabular-nums font-bold ${f.type === "deposit" ? "text-red-400" : "text-green-400"}`}>
                            {f.type === "deposit" ? `−${fmtFull(f.amount)}` : `+${fmtFull(f.amount)}`}
                          </td>
                        </tr>
                      )
                    })}
                  </tbody>
                </table>
              </div>
              <div className="px-6 py-3 border-t border-border bg-card/50">
                <p className="text-xs text-muted-foreground">
                  <span className="font-semibold text-foreground">IRR Sign convention:</span> Deposits are negative (cash out of your pocket) and withdrawals + ending value are positive (cash back to you). MWR finds the rate that makes NPV = 0.
                </p>
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
