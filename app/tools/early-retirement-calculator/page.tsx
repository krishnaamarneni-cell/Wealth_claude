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
  Cell,
} from "recharts"

// ── Types ──────────────────────────────────────────────────
interface Results {
  fireTarget: number
  yearsToRetire: number
  retirementYear: number
  retirementAge: number
  retirementMonth: number
  projectedPortfolio: number
  savingsRate: number
  totalContributions: number
  totalGrowth: number
  monthlyPassiveIncome: number
  shortfall: number
  onTrack: boolean
}

interface ChartPoint {
  year: number
  age: number
  portfolio: number
  target: number
  contributions: number
  growth: number
}

// ── Constants ──────────────────────────────────────────────
const MONTH_NAMES = [
  "January", "February", "March", "April", "May", "June",
  "July", "August", "September", "October", "November", "December",
]
const MONTHS_SHORT = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"]

const RELATED_TOOLS = [
  { icon: "🔥", name: "Fat FIRE", href: "/tools/fat-fire-calculator" },
  { icon: "☕", name: "Barista FIRE", href: "/tools/barista-fire-calculator" },
  { icon: "🌿", name: "Lean FIRE", href: "/tools/lean-fire-calculator" },
  { icon: "🌊", name: "Coast FIRE", href: "/tools/coast-fire-calculator" },
  { icon: "💰", name: "Dividend Calculator", href: "/tools/dividend-calculator" },
  { icon: "🔄", name: "DCA Calculator", href: "/tools/dca-calculator" },
]

const FAQS = [
  {
    q: "What age can I realistically retire early?",
    a: "This depends entirely on your savings rate and investment returns. People with a 50%+ savings rate and 7% average returns can often retire in 15–20 years regardless of income. The math shows that at a 75% savings rate, you could retire in about 7 years. At 25%, it takes roughly 32 years. Your income matters less than the gap between what you earn and what you spend.",
  },
  {
    q: "How much do I need to retire early?",
    a: "The standard formula is: Retirement Number = Annual Spending ÷ Withdrawal Rate. With a 4% withdrawal rate, you need 25× your annual spending. So $40,000/year in expenses = $1,000,000 needed. $80,000/year = $2,000,000. Early retirees often use a more conservative 3.5% rate (28.5× spending) since they have a longer retirement horizon.",
  },
  {
    q: "What is the 4% rule and does it apply to early retirement?",
    a: "The 4% rule comes from the Trinity Study — it found that withdrawing 4% of your initial portfolio per year had a very high success rate over 30-year periods. However, early retirees may have 40–60 year retirements, where 4% is riskier. Many early retirement planners use 3–3.5% to account for this extended timeframe and sequence-of-returns risk.",
  },
  {
    q: "What investment return should I assume?",
    a: "A conservative real return (after inflation) of 5–6% is reasonable for a diversified stock/bond portfolio. Nominal returns have historically averaged around 10% for the S&P 500, but after 3% inflation that's ~7% real. Using 6–7% nominal is common in FIRE planning. Be conservative — overestimating returns is the biggest planning mistake.",
  },
  {
    q: "How does healthcare factor into early retirement?",
    a: "Healthcare is one of the biggest wildcards in early retirement, especially in the US before Medicare at 65. Budget at least $500–$1,000/month per person for health insurance premiums and out-of-pocket costs. Many early retirees use ACA marketplace plans, which can be subsidized if your income (from portfolio withdrawals) is managed carefully.",
  },
  {
    q: "What if my portfolio drops right after I retire?",
    a: "This is called sequence-of-returns risk — it's the biggest threat to early retirees. Strategies to mitigate it include: keeping 1–3 years of expenses in cash, using a flexible withdrawal strategy (spend less in down years), maintaining a bond allocation as a buffer, and having some part-time income flexibility in your early retirement years.",
  },
  {
    q: "Should I pay off my mortgage before retiring early?",
    a: "It depends on your mortgage rate vs. expected investment returns. If your mortgage rate is 3% and you expect 7% investment returns, mathematically it's better to invest than pay off the mortgage early. However, many early retirees pay off their mortgage for the psychological security and the reduced monthly cash flow requirements in retirement.",
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
export default function EarlyRetirementCalculatorPage() {
  const [currentAge, setCurrentAge] = useState(30)
  const [targetAge, setTargetAge] = useState(50)
  const [netWorth, setNetWorth] = useState(100000)
  const [annualIncome, setAnnualIncome] = useState(80000)
  const [annualSpend, setAnnualSpend] = useState(50000)
  const [annualReturn, setAnnualReturn] = useState(7)
  const [withdrawalRate, setWithdrawalRate] = useState(4)
  const [inflation, setInflation] = useState(3)

  const [results, setResults] = useState<Results | null>(null)
  const [chartData, setChartData] = useState<ChartPoint[]>([])
  const [activeChart, setActiveChart] = useState<"growth" | "breakdown">("growth")
  const [openFaq, setOpenFaq] = useState<number | null>(null)

  function calculate() {
    const yearsToRetire = targetAge - currentAge
    const annualSavings = Math.max(0, annualIncome - annualSpend)
    const savingsRate = annualIncome > 0 ? (annualSavings / annualIncome) * 100 : 0
    const monthlyContrib = annualSavings / 12
    const monthlyReturn = (annualReturn / 100) / 12
    const fireTarget = annualSpend / (withdrawalRate / 100)

    const now = new Date()
    const startYear = now.getFullYear()

    let portfolio = netWorth
    let totalContributions = 0
    let fireAchievedYear: number | null = null
    let fireAchievedAge: number | null = null
    let fireAchievedMonth: number | null = null

    const points: ChartPoint[] = []

    for (let yr = 0; yr <= Math.max(yearsToRetire, 40); yr++) {
      const calYear = startYear + yr
      const age = currentAge + yr

      points.push({
        year: calYear,
        age,
        portfolio: Math.round(portfolio),
        target: Math.round(fireTarget),
        contributions: Math.round(totalContributions),
        growth: Math.round(Math.max(0, portfolio - netWorth - totalContributions)),
      })

      if (fireAchievedYear === null && portfolio >= fireTarget) {
        fireAchievedYear = calYear
        fireAchievedAge = age
        fireAchievedMonth = now.getMonth()
      }

      // Monthly compounding
      for (let m = 0; m < 12; m++) {
        const gain = portfolio * monthlyReturn
        portfolio += gain + monthlyContrib
        totalContributions += monthlyContrib
      }
    }

    const projectedAtTarget = points.find(p => p.age === targetAge)?.portfolio ?? 0
    const onTrack = projectedAtTarget >= fireTarget
    const shortfall = Math.max(0, fireTarget - projectedAtTarget)
    const monthlyPassiveIncome = projectedAtTarget * (withdrawalRate / 100) / 12

    const actualRetirementAge = fireAchievedAge ?? targetAge
    const actualRetirementYear = fireAchievedYear ?? (startYear + yearsToRetire)
    const actualRetirementMonth = fireAchievedMonth ?? now.getMonth()

    setResults({
      fireTarget,
      yearsToRetire: fireAchievedAge !== null ? fireAchievedAge - currentAge : yearsToRetire,
      retirementYear: actualRetirementYear,
      retirementAge: actualRetirementAge,
      retirementMonth: actualRetirementMonth,
      projectedPortfolio: projectedAtTarget,
      savingsRate,
      totalContributions,
      totalGrowth: Math.max(0, projectedAtTarget - netWorth - totalContributions),
      monthlyPassiveIncome,
      shortfall,
      onTrack,
    })
    setChartData(points)
  }

  useEffect(() => { calculate() }, []) // eslint-disable-line

  const inputCls = "w-full bg-background border border-border rounded-lg py-2.5 text-sm text-foreground outline-none focus:border-primary/50 transition-colors"

  // Savings rate color
  const srColor = results
    ? results.savingsRate >= 50 ? "text-green-400"
      : results.savingsRate >= 30 ? "text-amber-400"
        : "text-red-400"
    : "text-muted-foreground"

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <Header />

      <main className="pt-16 flex-1">

        {/* Page Header */}
        <div className="max-w-5xl mx-auto px-4 sm:px-6 pt-12 pb-8 text-center">
          <div className="text-xs font-bold tracking-widest uppercase text-primary mb-3">Free Tools</div>
          <h1 className="text-3xl sm:text-4xl font-extrabold tracking-tight text-foreground mb-3">
            Early Retirement Calculator
          </h1>
          <p className="text-muted-foreground text-sm max-w-md mx-auto leading-relaxed">
            Find out exactly when you can retire early, how much you need, and
            whether you're currently on track — with a full year-by-year projection.
          </p>
        </div>

        <div className="max-w-5xl mx-auto px-4 sm:px-6 pb-20 space-y-4">

          {/* Savings Rate Benchmarks */}
          <div className="grid grid-cols-4 gap-3">
            {[
              { rate: "10–20%", years: "~40 yrs", label: "Typical", color: "text-red-400", bg: "bg-red-400/10 border-red-400/20" },
              { rate: "30–40%", years: "~25 yrs", label: "Good", color: "text-amber-400", bg: "bg-amber-400/10 border-amber-400/20" },
              { rate: "50–60%", years: "~17 yrs", label: "Great", color: "text-primary", bg: "bg-primary/10 border-primary/20" },
              { rate: "70%+", years: "~10 yrs", label: "Excellent", color: "text-primary", bg: "bg-primary/15 border-primary/30" },
            ].map((s) => (
              <div key={s.rate} className={`rounded-2xl border px-4 py-3 ${s.bg}`}>
                <div className={`text-xs font-bold mb-1 ${s.color}`}>{s.label}</div>
                <div className="text-sm font-semibold text-foreground">{s.rate} saved</div>
                <div className="text-xs text-muted-foreground mt-0.5">{s.years} to retire</div>
              </div>
            ))}
          </div>

          {/* Calculator */}
          <div className="rounded-2xl border border-border bg-card overflow-hidden">
            <div className="grid grid-cols-1 md:grid-cols-2">

              {/* Left */}
              <div className="p-6 space-y-4">
                <div className="text-[10px] font-bold tracking-widest uppercase text-muted-foreground">Your Financial Situation</div>

                <div className="grid grid-cols-2 gap-3">
                  <div className="flex flex-col gap-1.5">
                    <label className="text-xs font-medium text-muted-foreground">Current Age</label>
                    <input type="number" value={currentAge} min={18} max={70} onChange={(e) => setCurrentAge(+e.target.value || 0)} className={inputCls + " px-3"} />
                  </div>
                  <div className="flex flex-col gap-1.5">
                    <label className="text-xs font-medium text-muted-foreground">Target Retirement Age</label>
                    <input type="number" value={targetAge} min={25} max={80} onChange={(e) => setTargetAge(+e.target.value || 0)} className={inputCls + " px-3"} />
                  </div>
                </div>

                <div className="flex flex-col gap-1.5">
                  <label className="text-xs font-medium text-muted-foreground">Current Portfolio / Net Worth</label>
                  <div className="relative">
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm text-muted-foreground">$</span>
                    <input type="number" value={netWorth} min={0} onChange={(e) => setNetWorth(+e.target.value || 0)} className={inputCls + " pl-7"} />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div className="flex flex-col gap-1.5">
                    <label className="text-xs font-medium text-muted-foreground">Annual Income (after tax)</label>
                    <div className="relative">
                      <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm text-muted-foreground">$</span>
                      <input type="number" value={annualIncome} min={0} onChange={(e) => setAnnualIncome(+e.target.value || 0)} className={inputCls + " pl-7"} />
                    </div>
                  </div>
                  <div className="flex flex-col gap-1.5">
                    <label className="text-xs font-medium text-muted-foreground">Annual Spending</label>
                    <div className="relative">
                      <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm text-muted-foreground">$</span>
                      <input type="number" value={annualSpend} min={0} onChange={(e) => setAnnualSpend(+e.target.value || 0)} className={inputCls + " pl-7"} />
                    </div>
                  </div>
                </div>

                {/* Live savings rate display */}
                {annualIncome > 0 && (
                  <div className="rounded-xl bg-card border border-border px-4 py-3 text-xs space-y-2">
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Annual Income</span>
                      <span className="font-semibold text-foreground">{fmtFull(annualIncome)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Annual Spending</span>
                      <span className="font-semibold text-foreground">− {fmtFull(annualSpend)}</span>
                    </div>
                    <div className="flex justify-between border-t border-border/50 pt-1.5">
                      <span className="text-muted-foreground">Annual Savings</span>
                      <span className="font-semibold text-primary">{fmtFull(Math.max(0, annualIncome - annualSpend))}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground font-medium">Your Savings Rate</span>
                      <span className={`font-bold text-sm ${srColor}`}>
                        {annualIncome > 0 ? Math.round(Math.max(0, (annualIncome - annualSpend) / annualIncome) * 100) : 0}%
                      </span>
                    </div>
                    {/* Savings rate bar */}
                    <div className="w-full bg-border rounded-full h-1.5 mt-1">
                      <div
                        className="h-1.5 rounded-full bg-primary transition-all"
                        style={{ width: `${Math.min(100, Math.max(0, (annualIncome - annualSpend) / annualIncome) * 100)}%` }}
                      />
                    </div>
                  </div>
                )}
              </div>

              {/* Right */}
              <div className="p-6 space-y-4 border-t md:border-t-0 md:border-l border-border">
                <div className="text-[10px] font-bold tracking-widest uppercase text-muted-foreground">Retirement Assumptions</div>

                <div className="grid grid-cols-2 gap-3">
                  <div className="flex flex-col gap-1.5">
                    <label className="text-xs font-medium text-muted-foreground">Expected Annual Return</label>
                    <div className="relative">
                      <input type="number" value={annualReturn} min={0} max={20} step={0.1} onChange={(e) => setAnnualReturn(+e.target.value || 0)} className={inputCls + " px-3 pr-8"} />
                      <span className="absolute right-3 top-1/2 -translate-y-1/2 text-sm text-muted-foreground">%</span>
                    </div>
                  </div>
                  <div className="flex flex-col gap-1.5">
                    <label className="text-xs font-medium text-muted-foreground">Withdrawal Rate</label>
                    <div className="relative">
                      <input type="number" value={withdrawalRate} min={1} max={10} step={0.1} onChange={(e) => setWithdrawalRate(+e.target.value || 0)} className={inputCls + " px-3 pr-8"} />
                      <span className="absolute right-3 top-1/2 -translate-y-1/2 text-sm text-muted-foreground">%</span>
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div className="flex flex-col gap-1.5">
                    <label className="text-xs font-medium text-muted-foreground">Inflation Rate</label>
                    <div className="relative">
                      <input type="number" value={inflation} min={0} max={15} step={0.1} onChange={(e) => setInflation(+e.target.value || 0)} className={inputCls + " px-3 pr-8"} />
                      <span className="absolute right-3 top-1/2 -translate-y-1/2 text-sm text-muted-foreground">%</span>
                    </div>
                  </div>
                  <div className="flex flex-col gap-1.5">
                    <label className="text-xs font-medium text-muted-foreground">Life Expectancy</label>
                    <input type="number" defaultValue={90} min={60} max={110} className={inputCls + " px-3"} />
                  </div>
                </div>

                {/* Retirement target preview */}
                <div className="rounded-xl bg-primary/5 border border-primary/15 px-4 py-3 text-xs space-y-2">
                  <div className="font-semibold text-foreground mb-1">Your Retirement Target</div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Annual spending in retirement</span>
                    <span className="font-semibold text-foreground">{fmtFull(annualSpend)}/yr</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Withdrawal rate</span>
                    <span className="font-semibold text-foreground">{withdrawalRate}%</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Multiplier (25× rule)</span>
                    <span className="font-semibold text-foreground">{(1 / (withdrawalRate / 100)).toFixed(1)}×</span>
                  </div>
                  <div className="flex justify-between border-t border-border/50 pt-1.5">
                    <span className="text-muted-foreground font-medium">Required portfolio</span>
                    <span className="font-bold text-primary">{fmtFull(annualSpend / (withdrawalRate / 100))}</span>
                  </div>
                </div>
              </div>
            </div>

            <div className="px-6 py-4 border-t border-border">
              <button onClick={calculate} className="w-full bg-primary text-primary-foreground font-bold rounded-xl py-3 text-sm tracking-wide hover:opacity-90 active:scale-[0.99] transition-all">
                🏖️ Calculate My Early Retirement Date
              </button>
            </div>
          </div>

          {/* Results Banner */}
          {results && (
            <div className={`rounded-2xl border p-6 ${results.onTrack ? "border-primary/20 bg-primary/5" : "border-amber-400/20 bg-amber-400/5"}`}>
              <div className="flex items-center gap-2 text-[10px] font-bold tracking-widest uppercase text-primary mb-5">
                <span className="w-1.5 h-1.5 rounded-full bg-primary inline-block" />
                {results.onTrack ? "✅ You're On Track to Retire Early!" : "Your Early Retirement Projection"}
              </div>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-4">
                <div>
                  <div className="text-xs text-muted-foreground mb-1">Required Portfolio</div>
                  <div className="text-xl sm:text-2xl font-extrabold text-primary tracking-tight">{fmtFull(results.fireTarget)}</div>
                </div>
                <div>
                  <div className="text-xs text-muted-foreground mb-1">Projected Portfolio</div>
                  <div className={`text-xl font-bold ${results.onTrack ? "text-green-400" : "text-amber-400"}`}>
                    {fmtFull(results.projectedPortfolio)}
                  </div>
                </div>
                <div>
                  <div className="text-xs text-muted-foreground mb-1">Retirement Age</div>
                  <div className="text-xl font-bold text-foreground">{results.retirementAge} yrs</div>
                </div>
                <div>
                  <div className="text-xs text-muted-foreground mb-1">Retirement Date</div>
                  <div className="text-xl font-bold text-foreground">
                    {MONTH_NAMES[results.retirementMonth]} {results.retirementYear}
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 pt-4 border-t border-border/30">
                <div>
                  <div className="text-xs text-muted-foreground mb-1">Savings Rate</div>
                  <div className={`text-lg font-bold ${srColor}`}>{results.savingsRate.toFixed(1)}%</div>
                </div>
                <div>
                  <div className="text-xs text-muted-foreground mb-1">Monthly Passive Income</div>
                  <div className="text-lg font-bold text-foreground">{fmtFull(results.monthlyPassiveIncome)}/mo</div>
                </div>
                <div>
                  <div className="text-xs text-muted-foreground mb-1">Years Until Retirement</div>
                  <div className="text-lg font-bold text-foreground">{results.yearsToRetire} years</div>
                </div>
                <div>
                  <div className="text-xs text-muted-foreground mb-1">{results.onTrack ? "Surplus" : "Shortfall"}</div>
                  <div className={`text-lg font-bold ${results.onTrack ? "text-green-400" : "text-red-400"}`}>
                    {results.onTrack
                      ? fmtFull(results.projectedPortfolio - results.fireTarget)
                      : fmtFull(results.shortfall)}
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Chart */}
          {results && chartData.length > 0 && (
            <div className="rounded-2xl border border-border bg-card overflow-hidden">
              <div className="flex items-center justify-between px-6 py-4 border-b border-border">
                <div className="text-sm font-bold text-foreground">Portfolio Projection</div>
                <div className="flex gap-1 bg-muted/20 rounded-lg p-1">
                  <button onClick={() => setActiveChart("growth")}
                    className={`px-3 py-1 rounded-md text-xs font-medium transition-all ${activeChart === "growth" ? "bg-card text-foreground shadow-sm" : "text-muted-foreground hover:text-foreground"}`}>
                    Growth
                  </button>
                  <button onClick={() => setActiveChart("breakdown")}
                    className={`px-3 py-1 rounded-md text-xs font-medium transition-all ${activeChart === "breakdown" ? "bg-card text-foreground shadow-sm" : "text-muted-foreground hover:text-foreground"}`}>
                    Breakdown
                  </button>
                </div>
              </div>
              <div className="p-6">
                {activeChart === "growth" ? (
                  <>
                    <div className="flex items-center gap-4 text-xs text-muted-foreground mb-4">
                      <span className="flex items-center gap-1.5"><span className="w-4 h-0.5 bg-primary inline-block rounded" />Portfolio Value</span>
                      <span className="flex items-center gap-1.5"><span className="w-4 h-0.5 bg-red-400 inline-block rounded" />Retirement Target</span>
                    </div>
                    <ResponsiveContainer width="100%" height={300}>
                      <LineChart data={chartData} margin={{ top: 5, right: 10, left: 10, bottom: 5 }}>
                        <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.04)" />
                        <XAxis dataKey="year" tick={{ fill: "#71717a", fontSize: 11 }} axisLine={false} tickLine={false} />
                        <YAxis tick={{ fill: "#71717a", fontSize: 11 }} axisLine={false} tickLine={false} width={72}
                          tickFormatter={(v) => {
                            if (v >= 1e6) return "$" + (v / 1e6).toFixed(1) + "M"
                            if (v >= 1e3) return "$" + (v / 1e3).toFixed(0) + "K"
                            return "$" + v
                          }} />
                        <Tooltip content={<CustomTooltip />} />
                        <Line type="monotone" dataKey="portfolio" name="Portfolio Value" stroke="#4ade80" strokeWidth={2.5} dot={false} activeDot={{ r: 5, fill: "#4ade80" }} />
                        <Line type="monotone" dataKey="target" name="Retirement Target" stroke="#f87171" strokeWidth={1.5} strokeDasharray="6 4" dot={false} activeDot={{ r: 4, fill: "#f87171" }} />
                        {results.retirementYear && (
                          <ReferenceLine x={results.retirementYear} stroke="#4ade80" strokeDasharray="4 4" strokeOpacity={0.4}
                            label={{ value: "🏖️ Retire!", position: "top", fill: "#4ade80", fontSize: 11 }} />
                        )}
                      </LineChart>
                    </ResponsiveContainer>
                  </>
                ) : (
                  <>
                    <div className="flex items-center gap-4 text-xs text-muted-foreground mb-4">
                      <span className="flex items-center gap-1.5"><span className="w-3 h-3 rounded-sm bg-primary inline-block" />Contributions</span>
                      <span className="flex items-center gap-1.5"><span className="w-3 h-3 rounded-sm bg-blue-400 inline-block" />Investment Growth</span>
                    </div>
                    <ResponsiveContainer width="100%" height={300}>
                      <BarChart data={chartData.filter((_, i) => i % 2 === 0)} margin={{ top: 5, right: 10, left: 10, bottom: 5 }}>
                        <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.04)" />
                        <XAxis dataKey="year" tick={{ fill: "#71717a", fontSize: 11 }} axisLine={false} tickLine={false} />
                        <YAxis tick={{ fill: "#71717a", fontSize: 11 }} axisLine={false} tickLine={false} width={72}
                          tickFormatter={(v) => {
                            if (v >= 1e6) return "$" + (v / 1e6).toFixed(1) + "M"
                            if (v >= 1e3) return "$" + (v / 1e3).toFixed(0) + "K"
                            return "$" + v
                          }} />
                        <Tooltip content={<CustomTooltip />} />
                        <Bar dataKey="contributions" name="Contributions" stackId="a" fill="#4ade80" radius={[0, 0, 4, 4]} />
                        <Bar dataKey="growth" name="Investment Growth" stackId="a" fill="#60a5fa" radius={[4, 4, 0, 0]} />
                      </BarChart>
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
                      <th className="text-left px-4 py-3 text-muted-foreground font-semibold uppercase tracking-wider text-[10px]">Year</th>
                      <th className="text-left px-4 py-3 text-muted-foreground font-semibold uppercase tracking-wider text-[10px]">Age</th>
                      <th className="text-right px-4 py-3 text-muted-foreground font-semibold uppercase tracking-wider text-[10px]">Portfolio</th>
                      <th className="text-right px-4 py-3 text-muted-foreground font-semibold uppercase tracking-wider text-[10px]">Target</th>
                      <th className="text-right px-4 py-3 text-muted-foreground font-semibold uppercase tracking-wider text-[10px]">Contributions</th>
                      <th className="text-right px-4 py-3 text-muted-foreground font-semibold uppercase tracking-wider text-[10px]">Growth</th>
                      <th className="text-right px-4 py-3 text-muted-foreground font-semibold uppercase tracking-wider text-[10px]">Progress</th>
                    </tr>
                  </thead>
                  <tbody>
                    {chartData.map((row) => {
                      const isRetireYear = row.year === results.retirementYear
                      const pct = Math.min(100, Math.round((row.portfolio / results.fireTarget) * 100))
                      return (
                        <tr key={row.year} className={`border-t border-border hover:bg-muted/10 transition-colors ${isRetireYear ? "bg-primary/5" : ""}`}>
                          <td className={`px-4 py-2 font-semibold whitespace-nowrap ${isRetireYear ? "text-primary" : "text-foreground"}`}>
                            {row.year}{isRetireYear ? " 🏖️" : ""}
                          </td>
                          <td className="px-4 py-2 text-muted-foreground">{row.age}</td>
                          <td className={`px-4 py-2 text-right tabular-nums font-medium ${isRetireYear ? "text-primary" : "text-foreground"}`}>{fmt(row.portfolio)}</td>
                          <td className="px-4 py-2 text-right tabular-nums text-muted-foreground">{fmt(row.target)}</td>
                          <td className="px-4 py-2 text-right tabular-nums text-muted-foreground">{fmt(row.contributions)}</td>
                          <td className="px-4 py-2 text-right tabular-nums text-blue-400">{fmt(row.growth)}</td>
                          <td className="px-4 py-2 text-right">
                            <span className={`font-semibold ${pct >= 100 ? "text-primary" : "text-muted-foreground"}`}>{pct}%</span>
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
