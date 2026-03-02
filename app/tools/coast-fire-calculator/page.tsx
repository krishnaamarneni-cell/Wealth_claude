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
interface Results {
  coastNumber: number
  fullFireTarget: number
  currentShortfall: number
  hasCoasted: boolean
  coastAge: number | null
  coastYear: number | null
  coastMonth: number | null
  yearsUntilCoast: number | null
  portfolioAtRetirement: number
  yearsOfGrowth: number
}

interface ChartPoint {
  year: number
  portfolio: number
  coastTarget: number
  fireTarget: number
  age: number
}

// ── Constants ──────────────────────────────────────────────
const MONTH_NAMES = [
  "January", "February", "March", "April", "May", "June",
  "July", "August", "September", "October", "November", "December",
]

const RELATED_TOOLS = [
  { icon: "🔥", name: "Fat FIRE", href: "/tools/fat-fire-calculator" },
  { icon: "☕", name: "Barista FIRE", href: "/tools/barista-fire-calculator" },
  { icon: "🌿", name: "Lean FIRE", href: "/tools/lean-fire-calculator" },
  { icon: "🏖️", name: "Early Retirement", href: "/tools/early-retirement-calculator" },
  { icon: "💰", name: "Dividend Calculator", href: "/tools/dividend-calculator" },
  { icon: "🔄", name: "DCA Calculator", href: "/tools/dca-calculator" },
]

const FAQS = [
  {
    q: "What is Coast FIRE?",
    a: "Coast FIRE means you've saved enough money that — even if you never contribute another dollar — your portfolio will grow on its own to fund your retirement by your target retirement age. You can 'coast' to retirement by only covering your current living expenses through work, without needing to save anything extra. It's financial independence without fully retiring yet.",
  },
  {
    q: "How is the Coast FIRE number calculated?",
    a: "Coast FIRE Number = Full FIRE Target ÷ (1 + Annual Return)^Years Until Retirement. For example, if you need $1,000,000 at 65 and expect 7% returns, your Coast FIRE number at age 35 is $1,000,000 ÷ (1.07)^30 = ~$131,000. If you have $131,000 today and never add another dollar, compound growth will get you to $1,000,000 by retirement.",
  },
  {
    q: "What changes when I hit Coast FIRE?",
    a: "Once you hit your Coast FIRE number, you no longer need to save for retirement. You only need to earn enough to cover your current day-to-day living expenses. This is incredibly liberating — you can take lower-paying jobs you enjoy, work part-time, start a passion project, or move somewhere cheaper. Your retirement is already funded.",
  },
  {
    q: "What's the difference between Coast FIRE and Barista FIRE?",
    a: "They're similar but distinct. Coast FIRE is a milestone — the point where you can stop contributing and still reach retirement. Barista FIRE is a lifestyle — semi-retiring early and using part-time income to cover expenses. You can achieve Coast FIRE and then choose to live a Barista FIRE lifestyle while your portfolio coasts to full FIRE.",
  },
  {
    q: "Is Coast FIRE risky?",
    a: "The main risk is that investment returns don't match your assumptions. If markets underperform over a long period, your portfolio may not reach your full FIRE target by retirement. To manage this risk, use a conservative return estimate (5–6% real returns rather than 7–8%), hit your Coast FIRE number with some buffer, and keep earning enough to cover current expenses so you don't draw down the portfolio early.",
  },
  {
    q: "What return rate should I use?",
    a: "For a conservative estimate, use 5–6% (accounting for inflation). For a more optimistic projection, use 7–8%. The S&P 500 has historically returned about 10% nominally and 7% after inflation over long periods. Since Coast FIRE depends entirely on compound growth over many years, being conservative here is wise — small differences in assumed return rates make a big difference over 20–30 years.",
  },
  {
    q: "Can I speed up reaching Coast FIRE?",
    a: "Yes — the two levers are saving more now (increasing contributions) and starting earlier (giving compound growth more time). Each additional year of compounding reduces your Coast FIRE number significantly. For example, at 7% returns, money doubles roughly every 10 years. So hitting Coast FIRE at 35 vs 45 means needing roughly half as much saved.",
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
export default function CoastFireCalculatorPage() {
  const [netWorth, setNetWorth] = useState(80000)
  const [annualReturn, setAnnualReturn] = useState(7)
  const [contribution, setContribution] = useState(1000)
  const [frequency, setFrequency] = useState(12)
  const [currentAge, setCurrentAge] = useState(30)
  const [retirementAge, setRetirementAge] = useState(65)
  const [annualSpend, setAnnualSpend] = useState(50000)
  const [withdrawalRate, setWithdrawalRate] = useState(4)

  const [results, setResults] = useState<Results | null>(null)
  const [chartData, setChartData] = useState<ChartPoint[]>([])
  const [openFaq, setOpenFaq] = useState<number | null>(null)

  function calculate() {
    const r = annualReturn / 100
    const fullFireTarget = annualSpend / (withdrawalRate / 100)
    const yearsToRetire = retirementAge - currentAge
    const monthlyReturn = r / 12
    const monthlyContrib = (contribution * frequency) / 12

    const now = new Date()
    const startYear = now.getFullYear()
    const startMonth = now.getMonth()

    // Build year-by-year chart WITH contributions
    const points: ChartPoint[] = []
    let portfolio = netWorth
    let coastAchievedMonth: number | null = null
    let coastAchievedYear: number | null = null
    let coastAchievedAge: number | null = null

    for (let yr = 0; yr <= yearsToRetire; yr++) {
      const calYear = startYear + yr
      const age = currentAge + yr
      const yearsLeft = retirementAge - age

      // Coast number for this age = fullFireTarget / (1+r)^yearsLeft
      const coastNumberThisYear = yearsLeft > 0
        ? fullFireTarget / Math.pow(1 + r, yearsLeft)
        : fullFireTarget

      points.push({
        year: calYear,
        age,
        portfolio: Math.round(portfolio),
        coastTarget: Math.round(coastNumberThisYear),
        fireTarget: Math.round(fullFireTarget),
      })

      if (coastAchievedYear === null && portfolio >= coastNumberThisYear) {
        coastAchievedYear = calYear
        coastAchievedMonth = startMonth
        coastAchievedAge = age
      }

      // Grow portfolio for next year (monthly compounding with contributions)
      for (let m = 0; m < 12; m++) {
        portfolio += portfolio * monthlyReturn + monthlyContrib
      }
    }

    // Today's Coast FIRE number
    const coastNumber = fullFireTarget / Math.pow(1 + r, yearsToRetire)
    const currentShortfall = Math.max(0, coastNumber - netWorth)
    const hasCoasted = netWorth >= coastNumber
    const yearsUntilCoast = coastAchievedYear !== null ? coastAchievedYear - startYear : null

    // Portfolio at retirement (no contributions after coast point, just growth)
    const portfolioAtRetirement = hasCoasted
      ? netWorth * Math.pow(1 + r, yearsToRetire)
      : (coastAchievedYear !== null
        ? (() => {
          // grow from coast point with no contributions
          const yrsLeft = retirementAge - (coastAchievedAge ?? currentAge)
          const coastPortfolio = points.find(p => p.year === coastAchievedYear)?.portfolio ?? netWorth
          return coastPortfolio * Math.pow(1 + r, yrsLeft)
        })()
        : portfolio)

    setResults({
      coastNumber,
      fullFireTarget,
      currentShortfall,
      hasCoasted,
      coastAge: coastAchievedAge,
      coastYear: coastAchievedYear,
      coastMonth: coastAchievedMonth,
      yearsUntilCoast,
      portfolioAtRetirement,
      yearsOfGrowth: yearsToRetire,
    })
    setChartData(points)
  }

  useEffect(() => { calculate() }, []) // eslint-disable-line

  const inputCls = "w-full bg-background border border-border rounded-lg py-2.5 text-sm text-foreground outline-none focus:border-primary/50 transition-colors"

  // Progress % toward coast number
  const progressPct = results
    ? Math.min(100, Math.round((netWorth / results.coastNumber) * 100))
    : 0

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <Header />

      <main className="pt-16 flex-1">

        {/* Page Header */}
        <div className="max-w-5xl mx-auto px-4 sm:px-6 pt-12 pb-8 text-center">
          <div className="text-xs font-bold tracking-widest uppercase text-primary mb-3">Free Tools</div>
          <h1 className="text-3xl sm:text-4xl font-extrabold tracking-tight text-foreground mb-3">
            Coast FIRE Calculator
          </h1>
          <p className="text-muted-foreground text-sm max-w-lg mx-auto leading-relaxed">
            Find the amount you need saved <span className="text-foreground font-medium">today</span> so
            that compound growth alone carries your portfolio to full retirement —
            no more contributions required.
          </p>
        </div>

        <div className="max-w-5xl mx-auto px-4 sm:px-6 pb-20 space-y-4">

          {/* How Coast FIRE works */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            {[
              { icon: "💾", step: "01", title: "Save to your Coast number", desc: "A smaller target than full FIRE" },
              { icon: "🌊", step: "02", title: "Stop contributing", desc: "Just cover living expenses from work" },
              { icon: "📈", step: "03", title: "Let compounding do the rest", desc: "Portfolio grows to full FIRE by retirement" },
            ].map((s) => (
              <div key={s.step} className="bg-card border border-border rounded-2xl px-5 py-4">
                <div className="flex items-center gap-2 mb-2">
                  <span className="text-lg">{s.icon}</span>
                  <span className="text-xs font-bold text-primary">{s.step}</span>
                </div>
                <div className="text-sm font-semibold text-foreground mb-0.5">{s.title}</div>
                <div className="text-xs text-muted-foreground">{s.desc}</div>
              </div>
            ))}
          </div>

          {/* Calculator */}
          <div className="rounded-2xl border border-border bg-card overflow-hidden">
            <div className="grid grid-cols-1 md:grid-cols-2">

              {/* Left */}
              <div className="p-6 space-y-4">
                <div className="text-[10px] font-bold tracking-widest uppercase text-muted-foreground">Your Current Situation</div>

                <div className="grid grid-cols-2 gap-3">
                  <div className="flex flex-col gap-1.5">
                    <label className="text-xs font-medium text-muted-foreground">Current Portfolio Value</label>
                    <div className="relative">
                      <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm text-muted-foreground">$</span>
                      <input type="number" value={netWorth} min={0} onChange={(e) => setNetWorth(+e.target.value || 0)} className={inputCls + " pl-7"} />
                    </div>
                  </div>
                  <div className="flex flex-col gap-1.5">
                    <label className="text-xs font-medium text-muted-foreground">Expected Annual Return</label>
                    <div className="relative">
                      <input type="number" value={annualReturn} min={0} max={20} step={0.1} onChange={(e) => setAnnualReturn(+e.target.value || 0)} className={inputCls + " px-3 pr-8"} />
                      <span className="absolute right-3 top-1/2 -translate-y-1/2 text-sm text-muted-foreground">%</span>
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-3 gap-3">
                  <div className="col-span-2 flex flex-col gap-1.5">
                    <label className="text-xs font-medium text-muted-foreground">Current Contribution</label>
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

                {/* Progress bar toward coast number */}
                {results && (
                  <div className="rounded-xl bg-primary/5 border border-primary/15 px-4 py-3">
                    <div className="flex justify-between text-xs mb-2">
                      <span className="text-muted-foreground font-medium">Progress to Coast FIRE</span>
                      <span className="font-bold text-primary">{progressPct}%</span>
                    </div>
                    <div className="w-full bg-border rounded-full h-2">
                      <div
                        className="h-2 rounded-full bg-primary transition-all duration-500"
                        style={{ width: `${progressPct}%` }}
                      />
                    </div>
                    <div className="flex justify-between text-xs mt-2 text-muted-foreground">
                      <span>{fmtFull(netWorth)} saved</span>
                      <span>{fmtFull(results.coastNumber)} needed</span>
                    </div>
                  </div>
                )}
              </div>

              {/* Right */}
              <div className="p-6 space-y-4 border-t md:border-t-0 md:border-l border-border">
                <div className="text-[10px] font-bold tracking-widest uppercase text-muted-foreground">Your Retirement Targets</div>

                <div className="grid grid-cols-2 gap-3">
                  <div className="flex flex-col gap-1.5">
                    <label className="text-xs font-medium text-muted-foreground">Current Age</label>
                    <input type="number" value={currentAge} min={18} max={70} onChange={(e) => setCurrentAge(+e.target.value || 0)} className={inputCls + " px-3"} />
                  </div>
                  <div className="flex flex-col gap-1.5">
                    <label className="text-xs font-medium text-muted-foreground">Target Retirement Age</label>
                    <input type="number" value={retirementAge} min={40} max={90} onChange={(e) => setRetirementAge(+e.target.value || 0)} className={inputCls + " px-3"} />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div className="flex flex-col gap-1.5">
                    <label className="text-xs font-medium text-muted-foreground">Annual Retirement Spending</label>
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

                {/* Key insight box */}
                <div className="rounded-xl bg-card border border-border px-4 py-3 text-xs space-y-2">
                  <div className="font-semibold text-foreground mb-1">How Coast FIRE works</div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Full FIRE target</span>
                    <span className="font-semibold text-foreground">{results ? fmtFull(results.fullFireTarget) : "—"}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Years of compounding</span>
                    <span className="font-semibold text-foreground">{retirementAge - currentAge} years</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Expected return</span>
                    <span className="font-semibold text-foreground">{annualReturn}% / yr</span>
                  </div>
                  <div className="flex justify-between border-t border-border/50 pt-2 mt-1">
                    <span className="text-muted-foreground font-medium">Coast FIRE number today</span>
                    <span className="font-bold text-primary">{results ? fmtFull(results.coastNumber) : "—"}</span>
                  </div>
                </div>
              </div>
            </div>

            <div className="px-6 py-4 border-t border-border">
              <button onClick={calculate} className="w-full bg-primary text-primary-foreground font-bold rounded-xl py-3 text-sm tracking-wide hover:opacity-90 active:scale-[0.99] transition-all">
                🌊 Calculate My Coast FIRE Number
              </button>
            </div>
          </div>

          {/* Results Banner */}
          {results && (
            <div className={`rounded-2xl border p-6 ${results.hasCoasted ? "border-primary/30 bg-primary/8" : "border-primary/20 bg-primary/5"}`}>
              <div className="flex items-center gap-2 text-[10px] font-bold tracking-widest uppercase text-primary mb-5">
                <span className="w-1.5 h-1.5 rounded-full bg-primary inline-block" />
                {results.hasCoasted ? "🎉 You've Already Hit Coast FIRE!" : "Your Coast FIRE Goal"}
              </div>
              <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-4">
                <div>
                  <div className="text-xs text-muted-foreground mb-1">Coast FIRE Number</div>
                  <div className="text-xl sm:text-2xl font-extrabold text-primary tracking-tight">{fmtFull(results.coastNumber)}</div>
                </div>
                <div>
                  <div className="text-xs text-muted-foreground mb-1">Full FIRE Target</div>
                  <div className="text-lg font-bold text-foreground">{fmtFull(results.fullFireTarget)}</div>
                </div>
                <div>
                  <div className="text-xs text-muted-foreground mb-1">{results.hasCoasted ? "Already Surpassed By" : "Still Need to Save"}</div>
                  <div className={`text-lg font-bold ${results.hasCoasted ? "text-green-400" : "text-foreground"}`}>
                    {results.hasCoasted
                      ? fmtFull(netWorth - results.coastNumber)
                      : fmtFull(results.currentShortfall)}
                  </div>
                </div>
                <div>
                  <div className="text-xs text-muted-foreground mb-1">Portfolio at Retirement</div>
                  <div className="text-lg font-bold text-foreground">{fmtFull(results.portfolioAtRetirement)}</div>
                </div>
                <div>
                  <div className="text-xs text-muted-foreground mb-1">Coast FIRE Age</div>
                  <div className="text-lg font-bold text-foreground">
                    {results.hasCoasted ? "Now (" + currentAge + " yrs)" : results.coastAge !== null ? results.coastAge + " yrs" : "—"}
                  </div>
                </div>
                <div>
                  <div className="text-xs text-muted-foreground mb-1">Coast FIRE Date</div>
                  <div className="text-lg font-bold text-foreground">
                    {results.hasCoasted
                      ? "Already!"
                      : results.coastMonth !== null && results.coastYear !== null
                        ? MONTH_NAMES[results.coastMonth] + " " + results.coastYear
                        : "—"}
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Chart */}
          {results && chartData.length > 0 && (
            <div className="rounded-2xl border border-border bg-card overflow-hidden">
              <div className="flex items-center justify-between px-6 py-4 border-b border-border">
                <div className="text-sm font-bold text-foreground">Coast FIRE Projection</div>
                <div className="flex items-center gap-4 text-xs text-muted-foreground">
                  <span className="flex items-center gap-1.5">
                    <span className="w-4 h-0.5 bg-primary inline-block rounded" />
                    Portfolio (with contributions)
                  </span>
                  <span className="flex items-center gap-1.5">
                    <span className="w-4 h-0.5 bg-blue-400 inline-block rounded" />
                    Coast FIRE Target
                  </span>
                  <span className="flex items-center gap-1.5">
                    <span className="w-4 h-0.5 bg-red-400 inline-block rounded" />
                    Full FIRE Target
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
                    <Line type="monotone" dataKey="coastTarget" name="Coast FIRE Target" stroke="#60a5fa" strokeWidth={1.5} strokeDasharray="6 4" dot={false} activeDot={{ r: 4, fill: "#60a5fa" }} />
                    <Line type="monotone" dataKey="fireTarget" name="Full FIRE Target" stroke="#f87171" strokeWidth={1.5} strokeDasharray="4 4" dot={false} activeDot={{ r: 4, fill: "#f87171" }} />
                    {results.coastYear && !results.hasCoasted && (
                      <ReferenceLine
                        x={results.coastYear}
                        stroke="#4ade80"
                        strokeDasharray="4 4"
                        strokeOpacity={0.5}
                        label={{ value: "🌊 Coast!", position: "top", fill: "#4ade80", fontSize: 11 }}
                      />
                    )}
                  </LineChart>
                </ResponsiveContainer>
              </div>

              {/* Chart explanation */}
              <div className="px-6 pb-5">
                <div className="rounded-xl bg-blue-500/5 border border-blue-500/15 px-4 py-3 text-xs text-muted-foreground leading-relaxed">
                  <span className="font-semibold text-foreground">Reading this chart: </span>
                  The blue dashed line (Coast Target) slopes downward because the closer you are to retirement, the more you need saved today.
                  When your portfolio (green) crosses the blue line, you've hit Coast FIRE and can stop contributing.
                  The red line shows your full FIRE target at retirement.
                </div>
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
