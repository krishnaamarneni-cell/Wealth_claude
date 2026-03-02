"use client"

import { useState, useEffect } from "react"
import Link from "next/link"
import { Header } from "@/components/header"
import { Footer } from "@/components/footer"
import {
  LineChart,
  Line,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  ReferenceLine,
} from "recharts"

// ── Types ──────────────────────────────────────────────────
interface Results {
  totalInvested: number
  finalValue: number
  totalGrowth: number
  totalReturn: number
  avgCostBasis: number
  totalShares: number
  bestMonth: { value: number; month: number; year: number }
  worstMonth: { value: number; month: number; year: number }
}

interface DataPoint {
  label: string
  dcaValue: number
  lumpSumValue: number
  totalInvested: number
  shares: number
  monthIndex: number
}

// ── Constants ──────────────────────────────────────────────
const MONTH_NAMES = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"]

const RELATED_TOOLS = [
  { icon: "🔥", name: "Fat FIRE", href: "/tools/fat-fire-calculator" },
  { icon: "💰", name: "Dividend Calculator", href: "/tools/dividend-calculator" },
  { icon: "💵", name: "Stock Profit", href: "/tools/stock-profit-calculator" },
  { icon: "⚖️", name: "Portfolio Rebalancing", href: "/tools/portfolio-rebalancing" },
  { icon: "🌊", name: "Coast FIRE", href: "/tools/coast-fire-calculator" },
  { icon: "🏖️", name: "Early Retirement", href: "/tools/early-retirement-calculator" },
]

const FAQS = [
  {
    q: "What is Dollar-Cost Averaging (DCA)?",
    a: "Dollar-Cost Averaging (DCA) is an investment strategy where you invest a fixed amount of money at regular intervals — regardless of market conditions. Instead of trying to time the market with a large lump sum, you buy more shares when prices are low and fewer when prices are high. Over time this averages out your cost per share and removes emotion from investing decisions.",
  },
  {
    q: "Is DCA better than lump sum investing?",
    a: "Research consistently shows that lump sum investing outperforms DCA about 2/3 of the time in rising markets, since markets trend upward over time and a lump sum benefits from more time in the market. However, DCA wins in volatile or declining markets, and it's psychologically easier — most people don't have a large lump sum available and DCA fits naturally with monthly income. The best strategy is the one you can stick with consistently.",
  },
  {
    q: "How often should I invest with DCA?",
    a: "The most common approach is monthly, aligned with your paycheck. Some investors go weekly or bi-weekly. The frequency matters less than consistency — the key is automating contributions so you never miss an investment period. Research shows that the difference in returns between weekly and monthly DCA is minimal over long periods.",
  },
  {
    q: "Does DCA reduce risk?",
    a: "DCA reduces timing risk — the risk of investing a large sum right before a market drop. It doesn't reduce market risk (the inherent risk of owning stocks). In a long-term rising market, DCA means you 'miss out' on some gains compared to lump sum. But in volatile markets, it smooths your average entry price and reduces the psychological pain of large losses early in your investment journey.",
  },
  {
    q: "What should I DCA into?",
    a: "Broad market index funds (like VTI, VOO, or VXUS) are ideal for DCA — they're diversified, low-cost, and have historically trended upward over long periods. DCA works best in assets with long-term upward trends. Avoid DCA into single stocks, speculative assets, or assets in structural decline, where averaging down can accelerate losses.",
  },
  {
    q: "Should I stop DCA during a market crash?",
    a: "Counterintuitively, market crashes are the best time for DCA — you're buying more shares at lower prices. The worst thing you can do is stop investing during a downturn. Investors who continued DCA through the 2008 crash and COVID crash saw their average cost basis stay low, which maximized returns in the subsequent recovery. Crashes are DCA's best friend.",
  },
  {
    q: "How do I account for inflation with DCA?",
    a: "To keep your DCA contributions real over time, increase your monthly contribution by the inflation rate each year. For example, if you invest $500/month this year, invest $515/month next year at 3% inflation. Our calculator includes a contribution growth rate field to model this. Many investors also simply increase contributions whenever they get a raise.",
  },
]

// ── Helpers ────────────────────────────────────────────────
function fmt(n: number): string {
  if (n >= 1e9) return "$" + (n / 1e9).toFixed(2) + "B"
  if (n >= 1e6) return "$" + (n / 1e6).toFixed(2) + "M"
  if (n >= 1e3) return "$" + (n / 1e3).toFixed(1) + "K"
  return "$" + Math.round(n).toLocaleString()
}

function fmtFull(n: number): string {
  return "$" + Math.round(n).toLocaleString("en-US")
}

function CustomTooltip({ active, payload, label }: any) {
  if (!active || !payload?.length) return null
  return (
    <div className="bg-card border border-border rounded-xl px-4 py-3 shadow-xl text-xs">
      <div className="text-muted-foreground font-semibold mb-2">{label}</div>
      {payload.map((p: any) => (
        <div key={p.dataKey} className="flex items-center gap-2 mb-1">
          <span className="w-2 h-2 rounded-full inline-block" style={{ background: p.color }} />
          <span className="text-muted-foreground">{p.name}:</span>
          <span className="font-semibold text-foreground">{fmt(p.value)}</span>
        </div>
      ))}
    </div>
  )
}

// ── Main Component ─────────────────────────────────────────
export default function DCACalculatorPage() {
  const [initialInvestment, setInitialInvestment] = useState(10000)
  const [monthlyAmount, setMonthlyAmount] = useState(500)
  const [annualReturn, setAnnualReturn] = useState(10)
  const [years, setYears] = useState(20)
  const [contribGrowth, setContribGrowth] = useState(0)
  const [frequency, setFrequency] = useState<"monthly" | "quarterly" | "yearly">("monthly")
  const [volatility, setVolatility] = useState<"low" | "medium" | "high">("medium")

  const [results, setResults] = useState<Results | null>(null)
  const [chartData, setChartData] = useState<DataPoint[]>([])
  const [activeChart, setActiveChart] = useState<"comparison" | "growth" | "invested">("comparison")
  const [openFaq, setOpenFaq] = useState<number | null>(null)

  function getVolatilityFactor(): number {
    if (volatility === "low") return 0.05
    if (volatility === "high") return 0.25
    return 0.15
  }

  function calculate() {
    const monthlyReturn = (annualReturn / 100) / 12
    const totalMonths = years * 12
    const freqMonths = frequency === "monthly" ? 1 : frequency === "quarterly" ? 3 : 12
    const volFactor = getVolatilityFactor()

    // Seeded deterministic "volatility" using a simple sine wave pattern
    function getMonthReturn(m: number): number {
      const base = monthlyReturn
      const noise = Math.sin(m * 0.7) * volFactor * monthlyReturn * 3
      return base + noise
    }

    let dcaPortfolio = initialInvestment
    let lsPortfolio = initialInvestment + (monthlyAmount * totalMonths) // lump sum upfront
    let totalInvested = initialInvestment
    let totalShares = 0
    let totalCost = 0

    const points: DataPoint[] = []
    let currentContrib = monthlyAmount

    // Grow lump sum
    let lsValue = initialInvestment + (monthlyAmount * totalMonths)

    // Reset and simulate month by month
    dcaPortfolio = initialInvestment
    lsValue = initialInvestment + (monthlyAmount * totalMonths)
    totalInvested = initialInvestment
    totalShares = initialInvestment / 100 // normalized price of $100

    for (let m = 1; m <= totalMonths; m++) {
      const mReturn = getMonthReturn(m)

      // DCA: add contribution on schedule
      if (m % freqMonths === 0) {
        if (m > 1 && m % 12 === 0) {
          currentContrib *= (1 + contribGrowth / 100)
        }
        dcaPortfolio += currentContrib
        totalInvested += currentContrib
        totalShares += currentContrib / (100 * Math.pow(1 + monthlyReturn, m))
        totalCost += currentContrib
      }

      dcaPortfolio *= (1 + mReturn)
      lsValue *= (1 + mReturn)

      // Record yearly snapshots
      if (m % 12 === 0) {
        const yr = m / 12
        points.push({
          label: `Year ${yr}`,
          dcaValue: Math.round(dcaPortfolio),
          lumpSumValue: Math.round(lsValue),
          totalInvested: Math.round(totalInvested),
          shares: Math.round(totalShares * 100) / 100,
          monthIndex: m,
        })
      }
    }

    const last = points[points.length - 1]
    const avgCostBasis = totalCost > 0 ? totalCost / totalShares : 100
    const totalReturn = ((last.dcaValue - totalInvested) / totalInvested) * 100

    // Find best/worst year
    let bestVal = -Infinity, worstVal = Infinity
    let bestIdx = 0, worstIdx = 0
    points.forEach((p, i) => {
      if (p.dcaValue > bestVal) { bestVal = p.dcaValue; bestIdx = i }
      if (p.dcaValue < worstVal) { worstVal = p.dcaValue; worstIdx = i }
    })

    setResults({
      totalInvested,
      finalValue: last.dcaValue,
      totalGrowth: last.dcaValue - totalInvested,
      totalReturn,
      avgCostBasis,
      totalShares,
      bestMonth: { value: bestVal, month: 0, year: bestIdx + 1 },
      worstMonth: { value: worstVal, month: 0, year: worstIdx + 1 },
    })
    setChartData(points)
  }

  useEffect(() => { calculate() }, []) // eslint-disable-line

  const inputCls = "w-full bg-background border border-border rounded-lg py-2.5 text-sm text-foreground outline-none focus:border-primary/50 transition-colors"

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <Header />

      <main className="pt-16 flex-1">

        {/* Page Header */}
        <div className="max-w-5xl mx-auto px-4 sm:px-6 pt-12 pb-8 text-center">
          <div className="text-xs font-bold tracking-widest uppercase text-primary mb-3">Free Tools</div>
          <h1 className="text-3xl sm:text-4xl font-extrabold tracking-tight text-foreground mb-3">
            DCA Calculator
          </h1>
          <p className="text-muted-foreground text-sm max-w-md mx-auto leading-relaxed">
            Model the power of Dollar-Cost Averaging over time. Compare DCA vs lump
            sum investing and see how consistent contributions build long-term wealth.
          </p>
        </div>

        <div className="max-w-5xl mx-auto px-4 sm:px-6 pb-20 space-y-4">

          {/* DCA vs Lump Sum explainer */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div className="bg-primary/5 border border-primary/20 rounded-2xl px-5 py-4">
              <div className="text-xs font-bold text-primary mb-1">Dollar-Cost Averaging</div>
              <div className="text-sm font-semibold text-foreground mb-1">Invest fixed amounts regularly</div>
              <div className="text-xs text-muted-foreground leading-relaxed">Buy more shares when prices are low, fewer when high. Removes timing risk and emotional decision-making.</div>
            </div>
            <div className="bg-card border border-border rounded-2xl px-5 py-4">
              <div className="text-xs font-bold text-muted-foreground mb-1">Lump Sum</div>
              <div className="text-sm font-semibold text-foreground mb-1">Invest everything at once</div>
              <div className="text-xs text-muted-foreground leading-relaxed">Maximizes time in market. Historically outperforms DCA ~2/3 of the time, but requires discipline during downturns.</div>
            </div>
          </div>

          {/* Calculator */}
          <div className="rounded-2xl border border-border bg-card overflow-hidden">
            <div className="grid grid-cols-1 md:grid-cols-2">

              {/* Left */}
              <div className="p-6 space-y-4">
                <div className="text-[10px] font-bold tracking-widest uppercase text-muted-foreground">Investment Inputs</div>

                <div className="grid grid-cols-2 gap-3">
                  <div className="flex flex-col gap-1.5">
                    <label className="text-xs font-medium text-muted-foreground">Initial Investment</label>
                    <div className="relative">
                      <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm text-muted-foreground">$</span>
                      <input type="number" value={initialInvestment} min={0} onChange={(e) => setInitialInvestment(+e.target.value || 0)} className={inputCls + " pl-7"} />
                    </div>
                  </div>
                  <div className="flex flex-col gap-1.5">
                    <label className="text-xs font-medium text-muted-foreground">Recurring Amount</label>
                    <div className="relative">
                      <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm text-muted-foreground">$</span>
                      <input type="number" value={monthlyAmount} min={0} onChange={(e) => setMonthlyAmount(+e.target.value || 0)} className={inputCls + " pl-7"} />
                    </div>
                  </div>
                </div>

                {/* Frequency selector */}
                <div className="flex flex-col gap-1.5">
                  <label className="text-xs font-medium text-muted-foreground">Investment Frequency</label>
                  <div className="grid grid-cols-3 gap-2">
                    {(["monthly", "quarterly", "yearly"] as const).map((f) => (
                      <button key={f} onClick={() => setFrequency(f)}
                        className={`py-2 rounded-lg text-xs font-semibold capitalize border transition-all ${frequency === f ? "bg-primary text-black border-primary" : "bg-background border-border text-muted-foreground hover:text-foreground"}`}>
                        {f}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div className="flex flex-col gap-1.5">
                    <label className="text-xs font-medium text-muted-foreground">Expected Annual Return</label>
                    <div className="relative">
                      <input type="number" value={annualReturn} min={0} max={30} step={0.1} onChange={(e) => setAnnualReturn(+e.target.value || 0)} className={inputCls + " px-3 pr-8"} />
                      <span className="absolute right-3 top-1/2 -translate-y-1/2 text-sm text-muted-foreground">%</span>
                    </div>
                  </div>
                  <div className="flex flex-col gap-1.5">
                    <label className="text-xs font-medium text-muted-foreground">Investment Period</label>
                    <div className="relative">
                      <input type="number" value={years} min={1} max={50} onChange={(e) => setYears(+e.target.value || 1)} className={inputCls + " px-3 pr-12"} />
                      <span className="absolute right-3 top-1/2 -translate-y-1/2 text-sm text-muted-foreground">yrs</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Right */}
              <div className="p-6 space-y-4 border-t md:border-t-0 md:border-l border-border">
                <div className="text-[10px] font-bold tracking-widest uppercase text-muted-foreground">Market Assumptions</div>

                <div className="flex flex-col gap-1.5">
                  <label className="text-xs font-medium text-muted-foreground">Contribution Growth Rate (annual)</label>
                  <div className="relative">
                    <input type="number" value={contribGrowth} min={0} max={20} step={0.5} onChange={(e) => setContribGrowth(+e.target.value || 0)} className={inputCls + " px-3 pr-8"} />
                    <span className="absolute right-3 top-1/2 -translate-y-1/2 text-sm text-muted-foreground">%</span>
                  </div>
                </div>

                {/* Volatility selector */}
                <div className="flex flex-col gap-1.5">
                  <label className="text-xs font-medium text-muted-foreground">Market Volatility</label>
                  <div className="grid grid-cols-3 gap-2">
                    {([
                      { key: "low", label: "Low", desc: "Bonds/stable" },
                      { key: "medium", label: "Medium", desc: "S&P 500-like" },
                      { key: "high", label: "High", desc: "Growth stocks" },
                    ] as const).map((v) => (
                      <button key={v.key} onClick={() => setVolatility(v.key)}
                        className={`py-2 px-2 rounded-lg text-xs font-semibold border transition-all flex flex-col items-center gap-0.5 ${volatility === v.key ? "bg-primary text-black border-primary" : "bg-background border-border text-muted-foreground hover:text-foreground"}`}>
                        <span>{v.label}</span>
                        <span className={`text-[10px] font-normal ${volatility === v.key ? "text-black/70" : "text-muted-foreground"}`}>{v.desc}</span>
                      </button>
                    ))}
                  </div>
                </div>

                {/* Summary preview */}
                <div className="rounded-xl bg-primary/5 border border-primary/15 px-4 py-3 text-xs space-y-2">
                  <div className="font-semibold text-foreground mb-1">Investment Summary</div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Total contributions over {years} yrs</span>
                    <span className="font-semibold text-foreground">
                      {fmtFull(initialInvestment + monthlyAmount * (frequency === "monthly" ? years * 12 : frequency === "quarterly" ? years * 4 : years))}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Per {frequency === "monthly" ? "month" : frequency === "quarterly" ? "quarter" : "year"}</span>
                    <span className="font-semibold text-primary">{fmtFull(monthlyAmount)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Frequency</span>
                    <span className="font-semibold text-foreground capitalize">{frequency}</span>
                  </div>
                </div>
              </div>
            </div>

            <div className="px-6 py-4 border-t border-border">
              <button onClick={calculate} className="w-full bg-primary text-primary-foreground font-bold rounded-xl py-3 text-sm tracking-wide hover:opacity-90 active:scale-[0.99] transition-all">
                🔄 Calculate DCA Returns
              </button>
            </div>
          </div>

          {/* Results Banner */}
          {results && (
            <div className="rounded-2xl border border-primary/20 bg-primary/5 p-6">
              <div className="flex items-center gap-2 text-[10px] font-bold tracking-widest uppercase text-primary mb-5">
                <span className="w-1.5 h-1.5 rounded-full bg-primary inline-block" />
                After {years} Years of DCA
              </div>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-4">
                <div>
                  <div className="text-xs text-muted-foreground mb-1">Final Portfolio Value</div>
                  <div className="text-xl sm:text-2xl font-extrabold text-primary tracking-tight">{fmtFull(results.finalValue)}</div>
                </div>
                <div>
                  <div className="text-xs text-muted-foreground mb-1">Total Invested</div>
                  <div className="text-xl font-bold text-foreground">{fmtFull(results.totalInvested)}</div>
                </div>
                <div>
                  <div className="text-xs text-muted-foreground mb-1">Investment Growth</div>
                  <div className="text-xl font-bold text-green-400">{fmtFull(results.totalGrowth)}</div>
                </div>
                <div>
                  <div className="text-xs text-muted-foreground mb-1">Total Return</div>
                  <div className="text-xl font-bold text-green-400">+{results.totalReturn.toFixed(1)}%</div>
                </div>
              </div>

              {/* DCA vs Lump Sum comparison */}
              {chartData.length > 0 && (
                <div className="grid grid-cols-2 gap-4 pt-4 border-t border-border/30">
                  <div>
                    <div className="text-xs text-muted-foreground mb-1">DCA Final Value</div>
                    <div className="text-lg font-bold text-primary">{fmt(chartData[chartData.length - 1].dcaValue)}</div>
                  </div>
                  <div>
                    <div className="text-xs text-muted-foreground mb-1">Lump Sum Final Value</div>
                    <div className="text-lg font-bold text-foreground">{fmt(chartData[chartData.length - 1].lumpSumValue)}</div>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Chart */}
          {results && chartData.length > 0 && (
            <div className="rounded-2xl border border-border bg-card overflow-hidden">
              <div className="flex items-center justify-between px-6 py-4 border-b border-border">
                <div className="text-sm font-bold text-foreground">DCA Projection</div>
                <div className="flex gap-1 bg-muted/20 rounded-lg p-1">
                  {([
                    { key: "comparison", label: "DCA vs Lump Sum" },
                    { key: "growth", label: "Growth" },
                    { key: "invested", label: "Invested vs Value" },
                  ] as const).map((t) => (
                    <button key={t.key} onClick={() => setActiveChart(t.key)}
                      className={`px-3 py-1 rounded-md text-xs font-medium transition-all ${activeChart === t.key ? "bg-card text-foreground shadow-sm" : "text-muted-foreground hover:text-foreground"}`}>
                      {t.label}
                    </button>
                  ))}
                </div>
              </div>
              <div className="p-6">
                {activeChart === "comparison" && (
                  <>
                    <div className="flex items-center gap-4 text-xs text-muted-foreground mb-4">
                      <span className="flex items-center gap-1.5"><span className="w-4 h-0.5 bg-primary inline-block rounded" />DCA Strategy</span>
                      <span className="flex items-center gap-1.5"><span className="w-4 h-0.5 bg-amber-400 inline-block rounded" />Lump Sum</span>
                    </div>
                    <ResponsiveContainer width="100%" height={300}>
                      <LineChart data={chartData} margin={{ top: 5, right: 10, left: 10, bottom: 5 }}>
                        <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.04)" />
                        <XAxis dataKey="label" tick={{ fill: "#71717a", fontSize: 10 }} axisLine={false} tickLine={false} interval={Math.floor(chartData.length / 6)} />
                        <YAxis tick={{ fill: "#71717a", fontSize: 11 }} axisLine={false} tickLine={false} width={72}
                          tickFormatter={(v) => {
                            if (v >= 1e6) return "$" + (v / 1e6).toFixed(1) + "M"
                            if (v >= 1e3) return "$" + (v / 1e3).toFixed(0) + "K"
                            return "$" + v
                          }} />
                        <Tooltip content={<CustomTooltip />} />
                        <Line type="monotone" dataKey="dcaValue" name="DCA Strategy" stroke="#4ade80" strokeWidth={2.5} dot={false} activeDot={{ r: 5 }} />
                        <Line type="monotone" dataKey="lumpSumValue" name="Lump Sum" stroke="#fbbf24" strokeWidth={2} strokeDasharray="5 3" dot={false} activeDot={{ r: 4 }} />
                      </LineChart>
                    </ResponsiveContainer>
                  </>
                )}

                {activeChart === "growth" && (
                  <>
                    <div className="flex items-center gap-4 text-xs text-muted-foreground mb-4">
                      <span className="flex items-center gap-1.5"><span className="w-3 h-3 rounded-sm bg-primary inline-block" />Total Growth ($)</span>
                    </div>
                    <ResponsiveContainer width="100%" height={300}>
                      <BarChart data={chartData.filter((_, i) => i % 2 === 0 || i === chartData.length - 1)} margin={{ top: 5, right: 10, left: 10, bottom: 5 }}>
                        <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.04)" />
                        <XAxis dataKey="label" tick={{ fill: "#71717a", fontSize: 10 }} axisLine={false} tickLine={false} />
                        <YAxis tick={{ fill: "#71717a", fontSize: 11 }} axisLine={false} tickLine={false} width={72}
                          tickFormatter={(v) => {
                            if (v >= 1e6) return "$" + (v / 1e6).toFixed(1) + "M"
                            if (v >= 1e3) return "$" + (v / 1e3).toFixed(0) + "K"
                            return "$" + v
                          }} />
                        <Tooltip content={<CustomTooltip />} />
                        <Bar dataKey="totalInvested" name="Total Invested" stackId="a" fill="#334155" radius={[0, 0, 4, 4]} />
                        <Bar dataKey="dcaValue" name="DCA Value" stackId="b" fill="#4ade80" radius={[4, 4, 0, 0]} />
                      </BarChart>
                    </ResponsiveContainer>
                  </>
                )}

                {activeChart === "invested" && (
                  <>
                    <div className="flex items-center gap-4 text-xs text-muted-foreground mb-4">
                      <span className="flex items-center gap-1.5"><span className="w-4 h-0.5 bg-primary inline-block rounded" />Portfolio Value</span>
                      <span className="flex items-center gap-1.5"><span className="w-4 h-0.5 bg-slate-400 inline-block rounded" />Total Invested</span>
                    </div>
                    <ResponsiveContainer width="100%" height={300}>
                      <LineChart data={chartData} margin={{ top: 5, right: 10, left: 10, bottom: 5 }}>
                        <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.04)" />
                        <XAxis dataKey="label" tick={{ fill: "#71717a", fontSize: 10 }} axisLine={false} tickLine={false} interval={Math.floor(chartData.length / 6)} />
                        <YAxis tick={{ fill: "#71717a", fontSize: 11 }} axisLine={false} tickLine={false} width={72}
                          tickFormatter={(v) => {
                            if (v >= 1e6) return "$" + (v / 1e6).toFixed(1) + "M"
                            if (v >= 1e3) return "$" + (v / 1e3).toFixed(0) + "K"
                            return "$" + v
                          }} />
                        <Tooltip content={<CustomTooltip />} />
                        <Line type="monotone" dataKey="dcaValue" name="Portfolio Value" stroke="#4ade80" strokeWidth={2.5} dot={false} activeDot={{ r: 5 }} />
                        <Line type="monotone" dataKey="totalInvested" name="Total Invested" stroke="#94a3b8" strokeWidth={1.5} strokeDasharray="4 3" dot={false} activeDot={{ r: 4 }} />
                      </LineChart>
                    </ResponsiveContainer>
                  </>
                )}
              </div>
            </div>
          )}

          {/* Year-by-year table */}
          {results && chartData.length > 0 && (
            <div className="rounded-2xl border border-border bg-card overflow-hidden">
              <div className="px-6 py-4 border-b border-border">
                <div className="text-sm font-bold text-foreground">Year-by-Year Summary</div>
              </div>
              <div className="overflow-x-auto max-h-80 overflow-y-auto">
                <table className="w-full text-xs">
                  <thead className="sticky top-0 bg-card/95 backdrop-blur-sm">
                    <tr>
                      <th className="text-left px-4 py-3 text-muted-foreground font-semibold uppercase tracking-wider text-[10px]">Period</th>
                      <th className="text-right px-4 py-3 text-muted-foreground font-semibold uppercase tracking-wider text-[10px]">DCA Value</th>
                      <th className="text-right px-4 py-3 text-muted-foreground font-semibold uppercase tracking-wider text-[10px]">Lump Sum Value</th>
                      <th className="text-right px-4 py-3 text-muted-foreground font-semibold uppercase tracking-wider text-[10px]">Total Invested</th>
                      <th className="text-right px-4 py-3 text-muted-foreground font-semibold uppercase tracking-wider text-[10px]">DCA Growth</th>
                      <th className="text-right px-4 py-3 text-muted-foreground font-semibold uppercase tracking-wider text-[10px]">DCA vs LS</th>
                    </tr>
                  </thead>
                  <tbody>
                    {chartData.map((row, i) => {
                      const growth = row.dcaValue - row.totalInvested
                      const vsLs = row.dcaValue - row.lumpSumValue
                      const isLast = i === chartData.length - 1
                      return (
                        <tr key={row.label} className={`border-t border-border hover:bg-muted/10 transition-colors ${isLast ? "bg-primary/5" : ""}`}>
                          <td className={`px-4 py-2 font-semibold whitespace-nowrap ${isLast ? "text-primary" : "text-foreground"}`}>{row.label}</td>
                          <td className={`px-4 py-2 text-right tabular-nums font-medium ${isLast ? "text-primary" : "text-foreground"}`}>{fmt(row.dcaValue)}</td>
                          <td className="px-4 py-2 text-right tabular-nums text-muted-foreground">{fmt(row.lumpSumValue)}</td>
                          <td className="px-4 py-2 text-right tabular-nums text-muted-foreground">{fmt(row.totalInvested)}</td>
                          <td className="px-4 py-2 text-right tabular-nums text-green-400">{fmt(growth)}</td>
                          <td className={`px-4 py-2 text-right tabular-nums font-semibold ${vsLs >= 0 ? "text-green-400" : "text-red-400"}`}>
                            {vsLs >= 0 ? "+" : ""}{fmt(vsLs)}
                          </td>
                        </tr>
                      )
                    })}
                  </tbody>
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
