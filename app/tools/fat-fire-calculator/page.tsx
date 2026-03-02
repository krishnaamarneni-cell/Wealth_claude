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
} from "recharts"

// ── Types ──────────────────────────────────────────────────
interface MonthData {
  portfolio: number
  gain: number
  contrib: number
}

interface YearMap {
  [year: number]: (MonthData | null)[]
}

interface Results {
  fireTarget: number
  projectedAtTarget: number
  fireAge: number | null
  yearsUntil: number | null
  fireMonth: number | null
  fireYear: number | null
}

interface ChartPoint {
  year: number
  portfolio: number
  target: number
}

// ── Constants ──────────────────────────────────────────────
const MONTH_NAMES = [
  "January", "February", "March", "April", "May", "June",
  "July", "August", "September", "October", "November", "December",
]
const MONTHS_SHORT = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"]

const RELATED_TOOLS = [
  { icon: "☕", name: "Barista FIRE", href: "/tools/barista-fire-calculator" },
  { icon: "🌿", name: "Lean FIRE", href: "/tools/lean-fire-calculator" },
  { icon: "🌊", name: "Coast FIRE", href: "/tools/coast-fire-calculator" },
  { icon: "⚖️", name: "Portfolio Rebalancing", href: "/tools/portfolio-rebalancing" },
  { icon: "💰", name: "Dividend Calculator", href: "/tools/dividend-calculator" },
  { icon: "🔄", name: "DCA Calculator", href: "/tools/dca-calculator" },
]

const FAQS = [
  {
    q: "What is Fat FIRE (Financial Independence, Retire Early)?",
    a: 'Fat FIRE is an acronym for "Financial Independence, Retire Early" — specifically the version that allows for a more comfortable and lavish approach to early retirement. Unlike Lean FIRE, the Fat FIRE goal is to amass substantial wealth that allows for a higher standard of living during retirement — typically targeting $100,000 or more in annual retirement spending.',
  },
  {
    q: "How does Fat FIRE differ from Lean FIRE or Barista FIRE?",
    a: "Lean FIRE targets a frugal lifestyle, often under $40,000/year. Barista FIRE is semi-retirement where part-time income supplements a smaller portfolio. Fat FIRE is the most ambitious — targeting $100,000–$300,000+ per year in retirement spending, requiring a nest egg of typically $2.5M–$10M+.",
  },
  {
    q: "What is a Safe Withdrawal Rate (SWR) and why does it matter?",
    a: "The Safe Withdrawal Rate is the percentage of your portfolio you can withdraw annually without running out of money. The classic '4% rule' suggests withdrawing 4% per year. For Fat FIRE, many advisors recommend a more conservative 3–3.5% given longer retirement horizons.",
  },
  {
    q: "How do I use the WealthClaude Fat FIRE calculator?",
    a: "Enter your current net worth, expected return, and monthly contributions on the left. On the right, enter your age, planned retirement spending, and withdrawal rate. Hit Calculate to see your FIRE number and a full month-by-month projection.",
  },
  {
    q: "How is the required retirement wealth calculated?",
    a: "Required Wealth = Annual Spending ÷ Withdrawal Rate. For example, $200,000 spending at 4% = $5,000,000 required. The calculator then projects how your savings and contributions grow to reach this target.",
  },
  {
    q: "What does the portfolio projection chart show?",
    a: "The green line shows your portfolio growing over time. The red dashed line shows your Fat FIRE target. Where they intersect is when you achieve Fat FIRE. A vertical marker shows the exact year.",
  },
  {
    q: "Should I account for inflation in my Fat FIRE planning?",
    a: "Yes — over 30 years at 3% inflation, $200,000 today requires ~$485,000 to maintain the same purchasing power. Our calculator adjusts your required retirement spending for inflation.",
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

// ── Custom Recharts Tooltip ────────────────────────────────
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
export default function FatFireCalculatorPage() {
  const [netWorth, setNetWorth] = useState(500000)
  const [annualReturn, setAnnualReturn] = useState(7)
  const [contribution, setContribution] = useState(3000)
  const [frequency, setFrequency] = useState(12)
  const [contribGrowth, setContribGrowth] = useState(0)
  const [currentAge, setCurrentAge] = useState(30)
  const [targetAge, setTargetAge] = useState(55)
  const [annualSpend, setAnnualSpend] = useState(200000)
  const [withdrawalRate, setWithdrawalRate] = useState(4)
  const [inflation, setInflation] = useState(3)

  const [results, setResults] = useState<Results | null>(null)
  const [yearData, setYearData] = useState<YearMap>({})
  const [chartData, setChartData] = useState<ChartPoint[]>([])
  const [activeTab, setActiveTab] = useState<"value" | "contribution" | "return">("value")
  const [openFaq, setOpenFaq] = useState<number | null>(null)

  function calculate() {
    const monthlyReturn = (annualReturn / 100) / 12
    const fireTarget = annualSpend / (withdrawalRate / 100)
    const yearsToTarget = targetAge - currentAge
    const maxMonths = yearsToTarget * 12
    const monthlyContrib = (contribution * frequency) / 12

    let portfolio = netWorth
    let fireAchievedMonth: number | null = null
    let fireAchievedYear: number | null = null

    const now = new Date()
    const startYear = now.getFullYear()
    const startMonth = now.getMonth()
    const map: YearMap = {}

    for (let m = 0; m <= maxMonths + 60; m++) {
      const calYear = startYear + Math.floor((startMonth + m) / 12)
      const calMonth = (startMonth + m) % 12
      const yearIdx = Math.floor(m / 12)
      const contrib = monthlyContrib * Math.pow(1 + contribGrowth / 100, yearIdx)
      const gain = portfolio * monthlyReturn
      portfolio += gain + contrib

      if (!map[calYear]) map[calYear] = Array(12).fill(null)
      map[calYear][calMonth] = { portfolio, gain, contrib }

      if (fireAchievedMonth === null && portfolio >= fireTarget) {
        fireAchievedMonth = calMonth
        fireAchievedYear = calYear
      }
    }

    const tgtYear = startYear + yearsToTarget
    const projected = map[tgtYear]?.[startMonth]?.portfolio ?? 0
    const fireAge = fireAchievedYear !== null ? currentAge + (fireAchievedYear - startYear) : null
    const yearsUntil = fireAchievedYear !== null ? fireAchievedYear - startYear : null

    const points: ChartPoint[] = Object.keys(map)
      .map(Number).sort()
      .map((y) => {
        const dec = map[y][11] ?? map[y].find(Boolean)
        return { year: y, portfolio: dec ? Math.round(dec.portfolio) : 0, target: Math.round(fireTarget) }
      })

    setResults({ fireTarget, projectedAtTarget: projected, fireAge, yearsUntil, fireMonth: fireAchievedMonth, fireYear: fireAchievedYear })
    setYearData(map)
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
            Fat FIRE Calculator
          </h1>
          <p className="text-muted-foreground text-sm max-w-md mx-auto leading-relaxed">
            Calculate and plan your Fat FIRE progress. See exactly when you can retire in luxury — with full projections, charts, and insights.
          </p>
        </div>

        <div className="max-w-5xl mx-auto px-4 sm:px-6 pb-20 space-y-4">

          {/* Calculator Card */}
          <div className="rounded-2xl border border-border bg-card overflow-hidden">
            <div className="grid grid-cols-1 md:grid-cols-2">

              {/* Left */}
              <div className="p-6 space-y-4">
                <div className="text-[10px] font-bold tracking-widest uppercase text-muted-foreground">Your Investment Inputs</div>

                <div className="grid grid-cols-2 gap-3">
                  <div className="flex flex-col gap-1.5">
                    <label className="text-xs font-medium text-muted-foreground">Current Net Worth</label>
                    <div className="relative">
                      <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm text-muted-foreground">$</span>
                      <input type="number" value={netWorth} min={0} onChange={(e) => setNetWorth(+e.target.value || 0)} className={inputCls + " pl-7"} />
                    </div>
                  </div>
                  <div className="flex flex-col gap-1.5">
                    <label className="text-xs font-medium text-muted-foreground">Expected Annual Return</label>
                    <div className="relative">
                      <input type="number" value={annualReturn} min={0} max={30} step={0.1} onChange={(e) => setAnnualReturn(+e.target.value || 0)} className={inputCls + " px-3 pr-8"} />
                      <span className="absolute right-3 top-1/2 -translate-y-1/2 text-sm text-muted-foreground">%</span>
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-3 gap-3">
                  <div className="col-span-2 flex flex-col gap-1.5">
                    <label className="text-xs font-medium text-muted-foreground">Additional Contribution</label>
                    <div className="relative">
                      <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm text-muted-foreground">$</span>
                      <input type="number" value={contribution} min={0} onChange={(e) => setContribution(+e.target.value || 0)} className={inputCls + " pl-7"} />
                    </div>
                  </div>
                  <div className="flex flex-col gap-1.5">
                    <label className="text-xs font-medium text-muted-foreground">Frequency</label>
                    <select value={frequency} onChange={(e) => setFrequency(+e.target.value)} className={inputCls + " px-3"}>
                      <option value={12}>Monthly</option>
                      <option value={4}>Quarterly</option>
                      <option value={1}>Yearly</option>
                    </select>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div className="flex flex-col gap-1.5">
                    <label className="text-xs font-medium text-muted-foreground">Contribution Growth</label>
                    <div className="relative">
                      <input type="number" value={contribGrowth} min={0} max={20} step={0.5} onChange={(e) => setContribGrowth(+e.target.value || 0)} className={inputCls + " px-3 pr-8"} />
                      <span className="absolute right-3 top-1/2 -translate-y-1/2 text-sm text-muted-foreground">%</span>
                    </div>
                  </div>
                  <div className="flex flex-col gap-1.5">
                    <label className="text-xs font-medium text-muted-foreground">Growth Period</label>
                    <select className={inputCls + " px-3"}>
                      <option>Year over Year</option>
                      <option>Month over Month</option>
                    </select>
                  </div>
                </div>
              </div>

              {/* Right */}
              <div className="p-6 space-y-4 border-t md:border-t-0 md:border-l border-border">
                <div className="text-[10px] font-bold tracking-widest uppercase text-muted-foreground">Your Fat FIRE Number Inputs</div>

                <div className="grid grid-cols-2 gap-3">
                  <div className="flex flex-col gap-1.5">
                    <label className="text-xs font-medium text-muted-foreground">Current Age</label>
                    <input type="number" value={currentAge} min={18} max={80} onChange={(e) => setCurrentAge(+e.target.value || 0)} className={inputCls + " px-3"} />
                  </div>
                  <div className="flex flex-col gap-1.5">
                    <label className="text-xs font-medium text-muted-foreground">Target Retirement Age</label>
                    <input type="number" value={targetAge} min={30} max={90} onChange={(e) => setTargetAge(+e.target.value || 0)} className={inputCls + " px-3"} />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div className="flex flex-col gap-1.5">
                    <label className="text-xs font-medium text-muted-foreground">Retirement Annual Spending</label>
                    <div className="relative">
                      <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm text-muted-foreground">$</span>
                      <input type="number" value={annualSpend} min={0} onChange={(e) => setAnnualSpend(+e.target.value || 0)} className={inputCls + " pl-7"} />
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
                    <label className="text-xs font-medium text-muted-foreground">Life Expectancy</label>
                    <input type="number" defaultValue={90} min={60} max={110} className={inputCls + " px-3"} />
                  </div>
                  <div className="flex flex-col gap-1.5">
                    <label className="text-xs font-medium text-muted-foreground">Inflation Rate</label>
                    <div className="relative">
                      <input type="number" value={inflation} min={0} max={15} step={0.1} onChange={(e) => setInflation(+e.target.value || 0)} className={inputCls + " px-3 pr-8"} />
                      <span className="absolute right-3 top-1/2 -translate-y-1/2 text-sm text-muted-foreground">%</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Submit */}
            <div className="px-6 py-4 border-t border-border">
              <button onClick={calculate} className="w-full bg-primary text-primary-foreground font-bold rounded-xl py-3 text-sm tracking-wide hover:opacity-90 active:scale-[0.99] transition-all">
                🔥 Calculate My Fat FIRE Number
              </button>
            </div>
          </div>

          {/* Results Banner */}
          {results && (
            <div className="rounded-2xl border border-primary/20 bg-primary/5 p-6">
              <div className="flex items-center gap-2 text-[10px] font-bold tracking-widest uppercase text-primary mb-5">
                <span className="w-1.5 h-1.5 rounded-full bg-primary inline-block" />
                Your Fat FIRE Goal
              </div>
              <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-4">
                <div>
                  <div className="text-xs text-muted-foreground mb-1">Required Wealth for Retirement</div>
                  <div className="text-xl sm:text-2xl font-extrabold text-primary tracking-tight">{fmtFull(results.fireTarget)}</div>
                </div>
                <div>
                  <div className="text-xs text-muted-foreground mb-1">Projected Wealth at Retirement</div>
                  <div className="text-lg font-bold text-foreground">{results.projectedAtTarget > 0 ? fmtFull(results.projectedAtTarget) : "—"}</div>
                </div>
                <div>
                  <div className="text-xs text-muted-foreground mb-1">Retirement Age</div>
                  <div className="text-lg font-bold text-foreground">{results.fireAge !== null ? results.fireAge + " yrs" : ">" + targetAge}</div>
                </div>
                <div>
                  <div className="text-xs text-muted-foreground mb-1">Years Until Retirement</div>
                  <div className="text-lg font-bold text-foreground">{results.yearsUntil !== null ? results.yearsUntil + " years" : "—"}</div>
                </div>
                <div>
                  <div className="text-xs text-muted-foreground mb-1">Retirement Month</div>
                  <div className="text-lg font-bold text-foreground">
                    {results.fireMonth !== null && results.fireYear !== null ? MONTH_NAMES[results.fireMonth] + " " + results.fireYear : "—"}
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Chart */}
          {results && chartData.length > 0 && (
            <div className="rounded-2xl border border-border bg-card overflow-hidden">
              <div className="flex items-center justify-between px-6 py-4 border-b border-border">
                <div className="text-sm font-bold text-foreground">Portfolio Growth Projection</div>
                <div className="flex items-center gap-4 text-xs text-muted-foreground">
                  <span className="flex items-center gap-1.5">
                    <span className="w-4 h-0.5 bg-primary inline-block rounded" />
                    Portfolio Value
                  </span>
                  <span className="flex items-center gap-1.5">
                    <span className="w-4 h-0.5 bg-red-400 inline-block rounded" />
                    FIRE Target
                  </span>
                </div>
              </div>
              <div className="p-6">
                <ResponsiveContainer width="100%" height={300}>
                  <LineChart data={chartData} margin={{ top: 5, right: 10, left: 10, bottom: 5 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.04)" />
                    <XAxis dataKey="year" tick={{ fill: "#71717a", fontSize: 11 }} axisLine={false} tickLine={false} />
                    <YAxis
                      tick={{ fill: "#71717a", fontSize: 11 }}
                      axisLine={false}
                      tickLine={false}
                      width={72}
                      tickFormatter={(v) => {
                        if (v >= 1e6) return "$" + (v / 1e6).toFixed(1) + "M"
                        if (v >= 1e3) return "$" + (v / 1e3).toFixed(0) + "K"
                        return "$" + v
                      }}
                    />
                    <Tooltip content={<CustomTooltip />} />
                    <Line type="monotone" dataKey="portfolio" name="Portfolio Value" stroke="#4ade80" strokeWidth={2.5} dot={false} activeDot={{ r: 5, fill: "#4ade80" }} />
                    <Line type="monotone" dataKey="target" name="Fat FIRE Target" stroke="#f87171" strokeWidth={1.5} strokeDasharray="6 4" dot={false} activeDot={{ r: 4, fill: "#f87171" }} />
                    {results.fireYear && (
                      <ReferenceLine x={results.fireYear} stroke="#4ade80" strokeDasharray="4 4" strokeOpacity={0.4} label={{ value: "🔥 FIRE!", position: "top", fill: "#4ade80", fontSize: 11 }} />
                    )}
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </div>
          )}

          {/* Table */}
          {results && Object.keys(yearData).length > 0 && (
            <div className="rounded-2xl border border-border bg-card overflow-hidden">
              <div className="flex items-center justify-between px-6 py-4 border-b border-border">
                <div className="text-sm font-bold text-foreground">Year-by-Year Projection</div>
                <div className="flex gap-1 bg-muted/20 rounded-lg p-1">
                  {(["value", "contribution", "return"] as const).map((t) => (
                    <button key={t} onClick={() => setActiveTab(t)}
                      className={`px-3 py-1 rounded-md text-xs font-medium capitalize transition-all ${activeTab === t ? "bg-card text-foreground shadow-sm" : "text-muted-foreground hover:text-foreground"}`}>
                      {t.charAt(0).toUpperCase() + t.slice(1)}
                    </button>
                  ))}
                </div>
              </div>
              <div className="overflow-x-auto max-h-80 overflow-y-auto">
                <table className="w-full text-xs">
                  <thead className="sticky top-0 bg-card/95 backdrop-blur-sm">
                    <tr>
                      <th className="text-left px-4 py-3 text-muted-foreground font-semibold uppercase tracking-wider text-[10px]">Year</th>
                      {MONTHS_SHORT.map((m) => (
                        <th key={m} className="text-right px-3 py-3 text-muted-foreground font-semibold uppercase tracking-wider text-[10px] whitespace-nowrap">{m}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {Object.keys(yearData).map(Number).sort().map((y) => {
                      const isFireYear = y === results.fireYear
                      return (
                        <tr key={y} className="border-t border-border hover:bg-muted/10 transition-colors">
                          <td className={`px-4 py-2 font-semibold whitespace-nowrap ${isFireYear ? "text-primary" : "text-foreground"}`}>
                            {y}{isFireYear ? " 🔥" : ""}
                          </td>
                          {yearData[y].map((d, mi) => {
                            let val = "—"
                            if (d) {
                              if (activeTab === "value") val = fmt(d.portfolio)
                              else if (activeTab === "contribution") val = fmt(d.contrib)
                              else val = fmt(d.gain)
                            }
                            return (
                              <td key={mi} className={`px-3 py-2 text-right tabular-nums ${isFireYear ? "text-primary" : "text-muted-foreground"}`}>
                                {val}
                              </td>
                            )
                          })}
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
