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
} from "recharts"

// ── Types ──────────────────────────────────────────────────
interface Results {
  totalValue: number
  totalDividends: number
  totalInvested: number
  totalGrowth: number
  finalYield: number
  finalAnnualIncome: number
  finalMonthlyIncome: number
  yoc: number // yield on cost
}

interface YearPoint {
  year: number
  portfolioValue: number
  annualDividend: number
  totalDividendsEarned: number
  shares: number
}

// ── Constants ──────────────────────────────────────────────
const RELATED_TOOLS = [
  { icon: "🔥", name: "Fat FIRE", href: "/tools/fat-fire-calculator" },
  { icon: "☕", name: "Barista FIRE", href: "/tools/barista-fire-calculator" },
  { icon: "🌊", name: "Coast FIRE", href: "/tools/coast-fire-calculator" },
  { icon: "🏖️", name: "Early Retirement", href: "/tools/early-retirement-calculator" },
  { icon: "🔄", name: "DCA Calculator", href: "/tools/dca-calculator" },
  { icon: "💵", name: "Stock Profit", href: "/tools/stock-profit-calculator" },
]

const FAQS = [
  {
    q: "What is dividend investing?",
    a: "Dividend investing is a strategy where you buy stocks or funds that regularly pay a portion of their profits to shareholders as dividends. Instead of relying solely on stock price appreciation, dividend investors build a stream of passive income. Over time, reinvesting dividends (DRIP) can dramatically accelerate portfolio growth through compounding.",
  },
  {
    q: "What is DRIP (Dividend Reinvestment Plan)?",
    a: "DRIP stands for Dividend Reinvestment Plan. Instead of receiving dividends as cash, they're automatically used to buy more shares of the same stock or fund. This creates a powerful compounding effect — more shares means more dividends, which buys even more shares. Over 20–30 years, DRIP can account for the majority of total returns in a dividend portfolio.",
  },
  {
    q: "What is a good dividend yield?",
    a: "A 'good' dividend yield depends on the context. For broad market funds like VTI, 1.5–2% is typical. For dividend-focused ETFs like SCHD or VYM, 3–4% is common. Individual dividend stocks can yield 4–8%+. Be cautious of very high yields (8%+) as they may signal financial distress or an unsustainable payout. Focus on dividend growth rate alongside yield.",
  },
  {
    q: "What is Yield on Cost (YOC)?",
    a: "Yield on Cost is your current annual dividend income divided by your original investment cost. If you invested $10,000 in a stock with a 3% yield, and the dividend has grown so your annual income is now $600, your YOC is 6% — even though the current yield might still be 3% (because the stock price also rose). YOC is a powerful metric for long-term dividend investors.",
  },
  {
    q: "How does dividend growth rate affect returns?",
    a: "Dividend growth rate (DGR) is one of the most powerful variables in dividend investing. A stock yielding 2% with 10% annual dividend growth will yield more in 15 years than a 5% yield stock with 0% growth. Over time, growing dividends provide inflation protection and exponentially increasing income. Many S&P 500 dividend growers have 5–10% annual DGRs.",
  },
  {
    q: "Should I prioritize yield or dividend growth?",
    a: "It depends on your timeline. If you're 10–20+ years from needing income, prioritize dividend growth rate — the compounding effect is extraordinary. If you're near or in retirement and need income now, a higher current yield matters more. Many investors blend both: a core of high-growth dividend stocks supplemented by higher-yield income positions.",
  },
  {
    q: "Are dividends taxed?",
    a: "In the US, qualified dividends are taxed at lower long-term capital gains rates (0%, 15%, or 20% depending on income). Ordinary dividends are taxed as regular income. In tax-advantaged accounts (Roth IRA, 401k), dividends grow tax-free or tax-deferred. Tax-efficient dividend investing often means holding high-yield assets in tax-advantaged accounts.",
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

function fmtD(n: number): string {
  return "$" + n.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })
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
export default function DividendCalculatorPage() {
  const [initialInvestment, setInitialInvestment] = useState(50000)
  const [monthlyContrib, setMonthlyContrib] = useState(500)
  const [dividendYield, setDividendYield] = useState(3.5)
  const [dividendGrowth, setDividendGrowth] = useState(6)
  const [stockGrowth, setStockGrowth] = useState(5)
  const [years, setYears] = useState(20)
  const [drip, setDrip] = useState(true)
  const [payFrequency, setPayFrequency] = useState<"monthly" | "quarterly" | "annual">("quarterly")

  const [results, setResults] = useState<Results | null>(null)
  const [yearData, setYearData] = useState<YearPoint[]>([])
  const [activeChart, setActiveChart] = useState<"value" | "income">("value")
  const [openFaq, setOpenFaq] = useState<number | null>(null)

  function calculate() {
    const annualStockGrowth = stockGrowth / 100
    const annualDivGrowth = dividendGrowth / 100
    let currentYield = dividendYield / 100

    let sharePrice = 100 // normalized
    let shares = initialInvestment / sharePrice
    let totalInvested = initialInvestment
    let totalDividends = 0

    const points: YearPoint[] = []

    for (let yr = 1; yr <= years; yr++) {
      // Stock price grows
      sharePrice *= (1 + annualStockGrowth)

      // Dividend per share this year
      const divPerShare = sharePrice * currentYield
      const annualDiv = shares * divPerShare

      totalDividends += annualDiv

      if (drip) {
        // Reinvest dividends → buy more shares
        const newShares = annualDiv / sharePrice
        shares += newShares
      }

      // Monthly contributions → buy more shares
      const monthlyShares = monthlyContrib / sharePrice
      shares += monthlyShares * 12
      totalInvested += monthlyContrib * 12

      // Dividend yield grows
      currentYield *= (1 + annualDivGrowth)

      const portfolioValue = shares * sharePrice
      const nextAnnualDiv = shares * sharePrice * currentYield

      points.push({
        year: yr,
        portfolioValue: Math.round(portfolioValue),
        annualDividend: Math.round(nextAnnualDiv),
        totalDividendsEarned: Math.round(totalDividends),
        shares: Math.round(shares * 100) / 100,
      })
    }

    const last = points[points.length - 1]

    setResults({
      totalValue: last.portfolioValue,
      totalDividends,
      totalInvested,
      totalGrowth: last.portfolioValue - totalInvested,
      finalYield: currentYield * 100,
      finalAnnualIncome: last.annualDividend,
      finalMonthlyIncome: last.annualDividend / 12,
      yoc: (last.annualDividend / initialInvestment) * 100,
    })
    setYearData(points)
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
            Dividend Calculator
          </h1>
          <p className="text-muted-foreground text-sm max-w-md mx-auto leading-relaxed">
            Project your dividend income and portfolio value over time. See the
            power of DRIP reinvestment and dividend growth on your passive income stream.
          </p>
        </div>

        <div className="max-w-5xl mx-auto px-4 sm:px-6 pb-20 space-y-4">

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
                    <label className="text-xs font-medium text-muted-foreground">Monthly Contribution</label>
                    <div className="relative">
                      <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm text-muted-foreground">$</span>
                      <input type="number" value={monthlyContrib} min={0} onChange={(e) => setMonthlyContrib(+e.target.value || 0)} className={inputCls + " pl-7"} />
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div className="flex flex-col gap-1.5">
                    <label className="text-xs font-medium text-muted-foreground">Dividend Yield</label>
                    <div className="relative">
                      <input type="number" value={dividendYield} min={0} max={30} step={0.1} onChange={(e) => setDividendYield(+e.target.value || 0)} className={inputCls + " px-3 pr-8"} />
                      <span className="absolute right-3 top-1/2 -translate-y-1/2 text-sm text-muted-foreground">%</span>
                    </div>
                  </div>
                  <div className="flex flex-col gap-1.5">
                    <label className="text-xs font-medium text-muted-foreground">Dividend Growth Rate</label>
                    <div className="relative">
                      <input type="number" value={dividendGrowth} min={0} max={30} step={0.1} onChange={(e) => setDividendGrowth(+e.target.value || 0)} className={inputCls + " px-3 pr-8"} />
                      <span className="absolute right-3 top-1/2 -translate-y-1/2 text-sm text-muted-foreground">%</span>
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div className="flex flex-col gap-1.5">
                    <label className="text-xs font-medium text-muted-foreground">Stock Price Growth</label>
                    <div className="relative">
                      <input type="number" value={stockGrowth} min={0} max={30} step={0.1} onChange={(e) => setStockGrowth(+e.target.value || 0)} className={inputCls + " px-3 pr-8"} />
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
                <div className="text-[10px] font-bold tracking-widest uppercase text-muted-foreground">Dividend Settings</div>

                {/* DRIP Toggle */}
                <div className="flex items-center justify-between rounded-xl border border-border bg-background px-4 py-3">
                  <div>
                    <div className="text-sm font-semibold text-foreground">Reinvest Dividends (DRIP)</div>
                    <div className="text-xs text-muted-foreground mt-0.5">Automatically buy more shares with dividends</div>
                  </div>
                  <button
                    onClick={() => setDrip(!drip)}
                    className={`relative w-11 h-6 rounded-full transition-colors duration-200 ${drip ? "bg-primary" : "bg-border"}`}
                  >
                    <span className={`absolute top-0.5 left-0.5 w-5 h-5 bg-white rounded-full shadow transition-transform duration-200 ${drip ? "translate-x-5" : "translate-x-0"}`} />
                  </button>
                </div>

                {/* Pay frequency */}
                <div className="flex flex-col gap-1.5">
                  <label className="text-xs font-medium text-muted-foreground">Dividend Pay Frequency</label>
                  <div className="grid grid-cols-3 gap-2">
                    {(["monthly", "quarterly", "annual"] as const).map((f) => (
                      <button key={f} onClick={() => setPayFrequency(f)}
                        className={`py-2 rounded-lg text-xs font-semibold capitalize border transition-all ${payFrequency === f ? "bg-primary text-black border-primary" : "bg-background border-border text-muted-foreground hover:text-foreground"}`}>
                        {f}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Live income preview */}
                <div className="rounded-xl bg-primary/5 border border-primary/15 px-4 py-3 text-xs space-y-2">
                  <div className="font-semibold text-foreground mb-1">Year 1 Estimated Income</div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Annual dividend income</span>
                    <span className="font-semibold text-foreground">{fmtFull(initialInvestment * (dividendYield / 100))}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">
                      {payFrequency === "monthly" ? "Monthly" : payFrequency === "quarterly" ? "Per quarter" : "Annual lump sum"}
                    </span>
                    <span className="font-semibold text-primary">
                      {payFrequency === "monthly"
                        ? fmtFull(initialInvestment * (dividendYield / 100) / 12)
                        : payFrequency === "quarterly"
                          ? fmtFull(initialInvestment * (dividendYield / 100) / 4)
                          : fmtFull(initialInvestment * (dividendYield / 100))}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">DRIP status</span>
                    <span className={`font-bold ${drip ? "text-primary" : "text-muted-foreground"}`}>{drip ? "✓ On" : "✗ Off"}</span>
                  </div>
                </div>

                {/* DRIP vs no-DRIP comparison note */}
                <div className="rounded-xl bg-blue-500/5 border border-blue-500/15 px-4 py-3 text-xs text-muted-foreground leading-relaxed">
                  <span className="font-semibold text-foreground">💡 Tip: </span>
                  Toggle DRIP on/off to see how reinvesting dividends affects your long-term portfolio value vs taking cash income.
                </div>
              </div>
            </div>

            <div className="px-6 py-4 border-t border-border">
              <button onClick={calculate} className="w-full bg-primary text-primary-foreground font-bold rounded-xl py-3 text-sm tracking-wide hover:opacity-90 active:scale-[0.99] transition-all">
                💰 Calculate Dividend Returns
              </button>
            </div>
          </div>

          {/* Results Banner */}
          {results && (
            <div className="rounded-2xl border border-primary/20 bg-primary/5 p-6">
              <div className="flex items-center gap-2 text-[10px] font-bold tracking-widest uppercase text-primary mb-5">
                <span className="w-1.5 h-1.5 rounded-full bg-primary inline-block" />
                After {years} Years {drip ? "with DRIP" : "without DRIP"}
              </div>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-4">
                <div>
                  <div className="text-xs text-muted-foreground mb-1">Total Portfolio Value</div>
                  <div className="text-xl sm:text-2xl font-extrabold text-primary tracking-tight">{fmtFull(results.totalValue)}</div>
                </div>
                <div>
                  <div className="text-xs text-muted-foreground mb-1">Annual Dividend Income</div>
                  <div className="text-xl font-bold text-foreground">{fmtFull(results.finalAnnualIncome)}</div>
                </div>
                <div>
                  <div className="text-xs text-muted-foreground mb-1">Monthly Passive Income</div>
                  <div className="text-xl font-bold text-green-400">{fmtFull(results.finalMonthlyIncome)}</div>
                </div>
                <div>
                  <div className="text-xs text-muted-foreground mb-1">Total Dividends Earned</div>
                  <div className="text-xl font-bold text-foreground">{fmtFull(results.totalDividends)}</div>
                </div>
              </div>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 pt-4 border-t border-border/30">
                <div>
                  <div className="text-xs text-muted-foreground mb-1">Total Invested</div>
                  <div className="text-lg font-bold text-foreground">{fmtFull(results.totalInvested)}</div>
                </div>
                <div>
                  <div className="text-xs text-muted-foreground mb-1">Investment Growth</div>
                  <div className="text-lg font-bold text-green-400">{fmtFull(results.totalGrowth)}</div>
                </div>
                <div>
                  <div className="text-xs text-muted-foreground mb-1">Yield on Cost (YOC)</div>
                  <div className="text-lg font-bold text-foreground">{results.yoc.toFixed(2)}%</div>
                </div>
                <div>
                  <div className="text-xs text-muted-foreground mb-1">Final Dividend Yield</div>
                  <div className="text-lg font-bold text-foreground">{results.finalYield.toFixed(2)}%</div>
                </div>
              </div>
            </div>
          )}

          {/* Chart */}
          {results && yearData.length > 0 && (
            <div className="rounded-2xl border border-border bg-card overflow-hidden">
              <div className="flex items-center justify-between px-6 py-4 border-b border-border">
                <div className="text-sm font-bold text-foreground">Dividend Projection</div>
                <div className="flex gap-1 bg-muted/20 rounded-lg p-1">
                  <button onClick={() => setActiveChart("value")}
                    className={`px-3 py-1 rounded-md text-xs font-medium transition-all ${activeChart === "value" ? "bg-card text-foreground shadow-sm" : "text-muted-foreground hover:text-foreground"}`}>
                    Portfolio Value
                  </button>
                  <button onClick={() => setActiveChart("income")}
                    className={`px-3 py-1 rounded-md text-xs font-medium transition-all ${activeChart === "income" ? "bg-card text-foreground shadow-sm" : "text-muted-foreground hover:text-foreground"}`}>
                    Dividend Income
                  </button>
                </div>
              </div>
              <div className="p-6">
                {activeChart === "value" ? (
                  <>
                    <div className="flex items-center gap-4 text-xs text-muted-foreground mb-4">
                      <span className="flex items-center gap-1.5"><span className="w-4 h-0.5 bg-primary inline-block rounded" />Portfolio Value</span>
                      <span className="flex items-center gap-1.5"><span className="w-4 h-0.5 bg-blue-400 inline-block rounded" />Total Dividends Earned</span>
                    </div>
                    <ResponsiveContainer width="100%" height={300}>
                      <LineChart data={yearData} margin={{ top: 5, right: 10, left: 10, bottom: 5 }}>
                        <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.04)" />
                        <XAxis dataKey="year" tick={{ fill: "#71717a", fontSize: 11 }} axisLine={false} tickLine={false} label={{ value: "Year", position: "insideBottom", offset: -2, fill: "#71717a", fontSize: 10 }} />
                        <YAxis tick={{ fill: "#71717a", fontSize: 11 }} axisLine={false} tickLine={false} width={72}
                          tickFormatter={(v) => {
                            if (v >= 1e6) return "$" + (v / 1e6).toFixed(1) + "M"
                            if (v >= 1e3) return "$" + (v / 1e3).toFixed(0) + "K"
                            return "$" + v
                          }} />
                        <Tooltip content={<CustomTooltip />} />
                        <Line type="monotone" dataKey="portfolioValue" name="Portfolio Value" stroke="#4ade80" strokeWidth={2.5} dot={false} activeDot={{ r: 5 }} />
                        <Line type="monotone" dataKey="totalDividendsEarned" name="Total Dividends Earned" stroke="#60a5fa" strokeWidth={2} dot={false} activeDot={{ r: 4 }} />
                      </LineChart>
                    </ResponsiveContainer>
                  </>
                ) : (
                  <>
                    <div className="flex items-center gap-4 text-xs text-muted-foreground mb-4">
                      <span className="flex items-center gap-1.5"><span className="w-3 h-3 rounded-sm bg-primary inline-block" />Annual Dividend Income</span>
                    </div>
                    <ResponsiveContainer width="100%" height={300}>
                      <BarChart data={yearData} margin={{ top: 5, right: 10, left: 10, bottom: 5 }}>
                        <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.04)" />
                        <XAxis dataKey="year" tick={{ fill: "#71717a", fontSize: 11 }} axisLine={false} tickLine={false} />
                        <YAxis tick={{ fill: "#71717a", fontSize: 11 }} axisLine={false} tickLine={false} width={72}
                          tickFormatter={(v) => {
                            if (v >= 1e6) return "$" + (v / 1e6).toFixed(1) + "M"
                            if (v >= 1e3) return "$" + (v / 1e3).toFixed(0) + "K"
                            return "$" + v
                          }} />
                        <Tooltip content={<CustomTooltip />} />
                        <Bar dataKey="annualDividend" name="Annual Dividend Income" fill="#4ade80" radius={[4, 4, 0, 0]} />
                      </BarChart>
                    </ResponsiveContainer>
                  </>
                )}
              </div>
            </div>
          )}

          {/* Year-by-year table */}
          {results && yearData.length > 0 && (
            <div className="rounded-2xl border border-border bg-card overflow-hidden">
              <div className="px-6 py-4 border-b border-border">
                <div className="text-sm font-bold text-foreground">Year-by-Year Breakdown</div>
              </div>
              <div className="overflow-x-auto max-h-80 overflow-y-auto">
                <table className="w-full text-xs">
                  <thead className="sticky top-0 bg-card/95 backdrop-blur-sm">
                    <tr>
                      <th className="text-left px-4 py-3 text-muted-foreground font-semibold uppercase tracking-wider text-[10px]">Year</th>
                      <th className="text-right px-4 py-3 text-muted-foreground font-semibold uppercase tracking-wider text-[10px]">Portfolio Value</th>
                      <th className="text-right px-4 py-3 text-muted-foreground font-semibold uppercase tracking-wider text-[10px]">Annual Income</th>
                      <th className="text-right px-4 py-3 text-muted-foreground font-semibold uppercase tracking-wider text-[10px]">Monthly Income</th>
                      <th className="text-right px-4 py-3 text-muted-foreground font-semibold uppercase tracking-wider text-[10px]">Total Dividends</th>
                      <th className="text-right px-4 py-3 text-muted-foreground font-semibold uppercase tracking-wider text-[10px]">Shares</th>
                    </tr>
                  </thead>
                  <tbody>
                    {yearData.map((row) => (
                      <tr key={row.year} className="border-t border-border hover:bg-muted/10 transition-colors">
                        <td className="px-4 py-2 font-semibold text-foreground">Year {row.year}</td>
                        <td className="px-4 py-2 text-right tabular-nums text-primary font-medium">{fmt(row.portfolioValue)}</td>
                        <td className="px-4 py-2 text-right tabular-nums text-foreground">{fmt(row.annualDividend)}</td>
                        <td className="px-4 py-2 text-right tabular-nums text-green-400">{fmt(row.annualDividend / 12)}</td>
                        <td className="px-4 py-2 text-right tabular-nums text-muted-foreground">{fmt(row.totalDividendsEarned)}</td>
                        <td className="px-4 py-2 text-right tabular-nums text-muted-foreground">{row.shares.toLocaleString()}</td>
                      </tr>
                    ))}
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
