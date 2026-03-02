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
} from "recharts"

// ── Types ──────────────────────────────────────────────────
interface Holding {
  id: number
  name: string
  ticker: string
  shares: number
  price: number
  category: string
}

interface HoldingResult extends Holding {
  value: number
  weight: number
  categoryWeight: number
}

interface CategorySummary {
  category: string
  value: number
  weight: number
  count: number
}

// ── Constants ──────────────────────────────────────────────
const COLORS = ["#4ade80", "#60a5fa", "#fbbf24", "#f87171", "#a78bfa", "#34d399", "#fb923c", "#e879f9", "#38bdf8", "#a3e635"]

const CATEGORIES = ["Stocks", "ETF", "Bonds", "Real Estate", "Crypto", "Cash", "Commodities", "Other"]

const RELATED_TOOLS = [
  { icon: "⚖️", name: "Portfolio Rebalancing", href: "/tools/portfolio-rebalancing" },
  { icon: "📈", name: "Time-Weighted Return", href: "/tools/time-weighted-return" },
  { icon: "📊", name: "Money-Weighted Return", href: "/tools/money-weighted-return" },
  { icon: "💵", name: "Stock Profit", href: "/tools/stock-profit-calculator" },
  { icon: "💰", name: "Dividend Calculator", href: "/tools/dividend-calculator" },
  { icon: "🔄", name: "DCA Calculator", href: "/tools/dca-calculator" },
]

const FAQS = [
  {
    q: "What is portfolio weight?",
    a: "Portfolio weight is the percentage of your total portfolio that a single holding represents. It's calculated as: Weight = (Position Value ÷ Total Portfolio Value) × 100. For example, if you hold $10,000 of AAPL in a $100,000 portfolio, AAPL has a 10% weight. Understanding weights helps you see concentration risk and ensure diversification.",
  },
  {
    q: "What is a good portfolio weight for a single stock?",
    a: "Most financial advisors recommend keeping any single stock below 5–10% of your portfolio to limit concentration risk. Index funds and ETFs naturally diversify across hundreds of stocks. If you hold individual stocks, keeping each under 5% and your top 10 holdings under 50% is a common guideline for managing idiosyncratic risk.",
  },
  {
    q: "How do I calculate portfolio weight?",
    a: "Portfolio weight = (Number of Shares × Current Price) ÷ Total Portfolio Value × 100. For example: 50 shares of a $200 stock = $10,000 position. If your total portfolio is $80,000, the weight is $10,000 ÷ $80,000 × 100 = 12.5%. Our calculator does this automatically for all your positions.",
  },
  {
    q: "What is sector or category weight?",
    a: "Sector/category weight is the combined weight of all holdings in a given category (e.g., Technology, Bonds, Real Estate). It tells you how much of your portfolio is exposed to a particular market segment. Over-concentration in one sector increases risk — if that sector underperforms, it disproportionately impacts your portfolio.",
  },
  {
    q: "How does portfolio weight relate to diversification?",
    a: "Proper diversification means no single holding or sector dominates your portfolio. A well-diversified portfolio typically spreads weight across asset classes (stocks, bonds, real estate), geographies (US, international, emerging markets), and sectors (technology, healthcare, energy, etc.). Weight analysis reveals where you're over- or under-concentrated.",
  },
  {
    q: "Should I equal-weight or market-cap weight my portfolio?",
    a: "Market-cap weighting (like the S&P 500) gives more weight to larger companies, which tend to be more stable. Equal weighting gives every holding the same allocation, providing more exposure to smaller companies and potentially higher returns but with more volatility. Many investors use a blend — market-cap weight for core holdings and equal weight for satellite positions.",
  },
  {
    q: "How often should I review portfolio weights?",
    a: "Most investors review portfolio weights quarterly or after significant market moves. As positions grow or shrink with price changes, weights drift from your original targets. Regular review helps you spot excessive concentration before it becomes a risk. Many advisors recommend rebalancing when any position drifts more than 5 percentage points from its target.",
  },
]

// ── Helpers ────────────────────────────────────────────────
function fmt(n: number): string {
  if (n >= 1e9) return "$" + (n / 1e9).toFixed(2) + "B"
  if (n >= 1e6) return "$" + (n / 1e6).toFixed(2) + "M"
  if (n >= 1e3) return "$" + (n / 1e3).toFixed(1) + "K"
  return "$" + n.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })
}

function fmtFull(n: number): string {
  return "$" + n.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })
}

function CustomPieTooltip({ active, payload }: any) {
  if (!active || !payload?.length) return null
  const d = payload[0]
  return (
    <div className="bg-card border border-border rounded-xl px-4 py-3 shadow-xl text-xs">
      <div className="font-semibold text-foreground mb-1">{d.name}</div>
      <div className="text-muted-foreground">Value: <span className="text-foreground font-semibold">{fmt(d.value)}</span></div>
      <div className="text-muted-foreground">Weight: <span className="text-foreground font-semibold">{d.payload.weight?.toFixed(2)}%</span></div>
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
          <span className="font-semibold text-foreground">{p.value.toFixed(2)}%</span>
        </div>
      ))}
    </div>
  )
}

// ── Default holdings ───────────────────────────────────────
const DEFAULT_HOLDINGS: Holding[] = [
  { id: 1, name: "Apple", ticker: "AAPL", shares: 20, price: 185, category: "Stocks" },
  { id: 2, name: "Microsoft", ticker: "MSFT", shares: 10, price: 415, category: "Stocks" },
  { id: 3, name: "Vanguard S&P 500", ticker: "VOO", shares: 15, price: 490, category: "ETF" },
  { id: 4, name: "NVIDIA", ticker: "NVDA", shares: 8, price: 875, category: "Stocks" },
  { id: 5, name: "US Treasury ETF", ticker: "BND", shares: 50, price: 73, category: "Bonds" },
  { id: 6, name: "Vanguard REIT", ticker: "VNQ", shares: 25, price: 82, category: "Real Estate" },
]

// ── Concentration risk color ───────────────────────────────
function getRiskColor(weight: number): string {
  if (weight >= 20) return "text-red-400"
  if (weight >= 10) return "text-amber-400"
  return "text-green-400"
}
function getRiskLabel(weight: number): string {
  if (weight >= 20) return "High"
  if (weight >= 10) return "Medium"
  return "Low"
}
function getRiskBg(weight: number): string {
  if (weight >= 20) return "bg-red-400/10 border-red-400/20 text-red-400"
  if (weight >= 10) return "bg-amber-400/10 border-amber-400/20 text-amber-400"
  return "bg-green-400/10 border-green-400/20 text-green-400"
}

// ── Main Component ─────────────────────────────────────────
export default function PortfolioWeightPage() {
  const [holdings, setHoldings] = useState<Holding[]>(DEFAULT_HOLDINGS)
  const [results, setResults] = useState<HoldingResult[]>([])
  const [categories, setCategories] = useState<CategorySummary[]>([])
  const [totalValue, setTotalValue] = useState(0)
  const [activeChart, setActiveChart] = useState<"holdings" | "categories">("holdings")
  const [sortBy, setSortBy] = useState<"weight" | "value" | "name">("weight")
  const [openFaq, setOpenFaq] = useState<number | null>(null)
  const [nextId, setNextId] = useState(7)

  function calculate() {
    const total = holdings.reduce((s, h) => s + h.shares * h.price, 0)
    setTotalValue(total)

    const computed: HoldingResult[] = holdings.map(h => ({
      ...h,
      value: h.shares * h.price,
      weight: total > 0 ? (h.shares * h.price / total) * 100 : 0,
      categoryWeight: 0,
    }))

    // Category summaries
    const catMap: Record<string, CategorySummary> = {}
    computed.forEach(r => {
      const cat = r.category || "Other"
      if (!catMap[cat]) catMap[cat] = { category: cat, value: 0, weight: 0, count: 0 }
      catMap[cat].value += r.value
      catMap[cat].weight += r.weight
      catMap[cat].count += 1
    })

    // Assign category weight to each holding
    computed.forEach(r => {
      r.categoryWeight = catMap[r.category || "Other"]?.weight ?? 0
    })

    setResults(computed)
    setCategories(Object.values(catMap).sort((a, b) => b.weight - a.weight))
  }

  useEffect(() => { calculate() }, [holdings]) // eslint-disable-line

  function addHolding() {
    setHoldings(prev => [...prev, { id: nextId, name: "", ticker: "", shares: 0, price: 0, category: "Stocks" }])
    setNextId(n => n + 1)
  }

  function removeHolding(id: number) {
    setHoldings(prev => prev.filter(h => h.id !== id))
  }

  function updateHolding(id: number, field: keyof Holding, value: string | number) {
    setHoldings(prev => prev.map(h => h.id === id ? { ...h, [field]: value } : h))
  }

  const sorted = [...results].sort((a, b) => {
    if (sortBy === "weight") return b.weight - a.weight
    if (sortBy === "value") return b.value - a.value
    return a.name.localeCompare(b.name)
  })

  const inputCls = "bg-background border border-border rounded-lg py-2 text-sm text-foreground outline-none focus:border-primary/50 transition-colors px-3 w-full"

  // Pie data
  const pieHoldingData = sorted.slice(0, 8).map((r, i) => ({
    name: r.ticker || r.name || `Asset ${i + 1}`,
    value: r.value,
    weight: r.weight,
    color: COLORS[i % COLORS.length],
  }))
  const pieCatData = categories.map((c, i) => ({
    name: c.category,
    value: c.value,
    weight: c.weight,
    color: COLORS[i % COLORS.length],
  }))
  const barData = sorted.map((r, i) => ({
    name: r.ticker || r.name?.slice(0, 8) || `#${i + 1}`,
    weight: +r.weight.toFixed(2),
    color: COLORS[i % COLORS.length],
  }))

  // Concentration metrics
  const top1 = results.length > 0 ? Math.max(...results.map(r => r.weight)) : 0
  const top3 = [...results].sort((a, b) => b.weight - a.weight).slice(0, 3).reduce((s, r) => s + r.weight, 0)
  const top5 = [...results].sort((a, b) => b.weight - a.weight).slice(0, 5).reduce((s, r) => s + r.weight, 0)
  const hhi = results.reduce((s, r) => s + Math.pow(r.weight / 100, 2), 0) * 10000 // Herfindahl index

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <Header />

      <main className="pt-16 flex-1">

        {/* Page Header */}
        <div className="max-w-5xl mx-auto px-4 sm:px-6 pt-12 pb-8 text-center">
          <div className="text-xs font-bold tracking-widest uppercase text-primary mb-3">Free Tools</div>
          <h1 className="text-3xl sm:text-4xl font-extrabold tracking-tight text-foreground mb-3">
            Portfolio Weight Calculator
          </h1>
          <p className="text-muted-foreground text-sm max-w-md mx-auto leading-relaxed">
            Calculate the weight of every holding in your portfolio. Visualize
            concentration risk, category exposure, and diversification at a glance.
          </p>
        </div>

        <div className="max-w-5xl mx-auto px-4 sm:px-6 pb-20 space-y-4">

          {/* Holdings input table */}
          <div className="rounded-2xl border border-border bg-card overflow-hidden">
            <div className="flex items-center justify-between px-6 py-4 border-b border-border">
              <div className="text-sm font-bold text-foreground">Your Holdings</div>
              <div className="text-xs text-muted-foreground">
                Total: <span className="font-bold text-foreground">{fmt(totalValue)}</span>
              </div>
            </div>

            <div className="p-5 space-y-2">
              {/* Column headers */}
              <div className="grid grid-cols-12 gap-2 px-1 pb-1">
                <div className="col-span-3 text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">Name</div>
                <div className="col-span-2 text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">Ticker</div>
                <div className="col-span-2 text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">Shares</div>
                <div className="col-span-2 text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">Price</div>
                <div className="col-span-2 text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">Category</div>
                <div className="col-span-1" />
              </div>

              {holdings.map((h, idx) => {
                const result = results.find(r => r.id === h.id)
                return (
                  <div key={h.id} className="grid grid-cols-12 gap-2 items-center">
                    <div className="col-span-3 flex items-center gap-2">
                      <span className="w-2.5 h-2.5 rounded-full shrink-0" style={{ background: COLORS[idx % COLORS.length] }} />
                      <input type="text" placeholder="Company name" value={h.name}
                        onChange={(e) => updateHolding(h.id, "name", e.target.value)}
                        className={inputCls} />
                    </div>
                    <div className="col-span-2">
                      <input type="text" placeholder="TICK" value={h.ticker}
                        onChange={(e) => updateHolding(h.id, "ticker", e.target.value.toUpperCase())}
                        className={inputCls + " uppercase font-mono"} />
                    </div>
                    <div className="col-span-2">
                      <input type="number" value={h.shares} min={0} step={0.001}
                        onChange={(e) => updateHolding(h.id, "shares", +e.target.value || 0)}
                        className={inputCls} />
                    </div>
                    <div className="col-span-2 relative">
                      <span className="absolute left-3 top-1/2 -translate-y-1/2 text-xs text-muted-foreground">$</span>
                      <input type="number" value={h.price} min={0} step={0.01}
                        onChange={(e) => updateHolding(h.id, "price", +e.target.value || 0)}
                        className={inputCls + " pl-6"} />
                    </div>
                    <div className="col-span-2">
                      <select value={h.category}
                        onChange={(e) => updateHolding(h.id, "category", e.target.value)}
                        className={inputCls + " text-xs"}>
                        {CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
                      </select>
                    </div>
                    <div className="col-span-1 flex justify-center">
                      {holdings.length > 1 && (
                        <button onClick={() => removeHolding(h.id)}
                          className="text-muted-foreground hover:text-red-400 transition-colors text-lg leading-none">×</button>
                      )}
                    </div>
                  </div>
                )
              })}

              <button onClick={addHolding}
                className="w-full mt-2 rounded-xl border border-dashed border-border hover:border-primary/40 hover:bg-primary/5 transition-all py-3 text-sm font-semibold text-muted-foreground hover:text-primary flex items-center justify-center gap-2">
                <span className="text-lg leading-none">+</span>
                Add Holding
              </button>
            </div>
          </div>

          {/* Concentration metrics */}
          {results.length > 0 && totalValue > 0 && (
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              <div className="bg-card border border-border rounded-2xl px-5 py-4">
                <div className="text-xs text-muted-foreground mb-1">Largest Position</div>
                <div className={`text-lg font-bold ${getRiskColor(top1)}`}>{top1.toFixed(1)}%</div>
                <div className={`text-[10px] mt-1 font-semibold px-2 py-0.5 rounded-full border inline-block ${getRiskBg(top1)}`}>{getRiskLabel(top1)} Risk</div>
              </div>
              <div className="bg-card border border-border rounded-2xl px-5 py-4">
                <div className="text-xs text-muted-foreground mb-1">Top 3 Combined</div>
                <div className={`text-lg font-bold ${getRiskColor(top3 / 3)}`}>{top3.toFixed(1)}%</div>
                <div className="text-[10px] text-muted-foreground mt-1">{results.length > 0 ? Math.min(3, results.length) : 0} positions</div>
              </div>
              <div className="bg-card border border-border rounded-2xl px-5 py-4">
                <div className="text-xs text-muted-foreground mb-1">Top 5 Combined</div>
                <div className={`text-lg font-bold ${getRiskColor(top5 / 5)}`}>{top5.toFixed(1)}%</div>
                <div className="text-[10px] text-muted-foreground mt-1">{results.length > 0 ? Math.min(5, results.length) : 0} positions</div>
              </div>
              <div className="bg-card border border-border rounded-2xl px-5 py-4">
                <div className="text-xs text-muted-foreground mb-1">HHI (Concentration)</div>
                <div className={`text-lg font-bold ${hhi > 2500 ? "text-red-400" : hhi > 1500 ? "text-amber-400" : "text-green-400"}`}>
                  {Math.round(hhi)}
                </div>
                <div className={`text-[10px] mt-1 font-semibold px-2 py-0.5 rounded-full border inline-block ${hhi > 2500 ? "bg-red-400/10 border-red-400/20 text-red-400" : hhi > 1500 ? "bg-amber-400/10 border-amber-400/20 text-amber-400" : "bg-green-400/10 border-green-400/20 text-green-400"}`}>
                  {hhi > 2500 ? "Concentrated" : hhi > 1500 ? "Moderate" : "Diversified"}
                </div>
              </div>
            </div>
          )}

          {/* Charts */}
          {results.length > 0 && totalValue > 0 && (
            <div className="rounded-2xl border border-border bg-card overflow-hidden">
              <div className="flex items-center justify-between px-6 py-4 border-b border-border">
                <div className="text-sm font-bold text-foreground">Portfolio Visualization</div>
                <div className="flex gap-1 bg-muted/20 rounded-lg p-1">
                  <button onClick={() => setActiveChart("holdings")}
                    className={`px-3 py-1 rounded-md text-xs font-medium transition-all ${activeChart === "holdings" ? "bg-card text-foreground shadow-sm" : "text-muted-foreground hover:text-foreground"}`}>
                    By Holding
                  </button>
                  <button onClick={() => setActiveChart("categories")}
                    className={`px-3 py-1 rounded-md text-xs font-medium transition-all ${activeChart === "categories" ? "bg-card text-foreground shadow-sm" : "text-muted-foreground hover:text-foreground"}`}>
                    By Category
                  </button>
                </div>
              </div>
              <div className="p-6">
                {activeChart === "holdings" ? (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {/* Donut */}
                    <div>
                      <div className="text-xs text-muted-foreground font-medium mb-3">Weight Distribution</div>
                      <ResponsiveContainer width="100%" height={240}>
                        <PieChart>
                          <Pie data={pieHoldingData} cx="50%" cy="50%" innerRadius={60} outerRadius={110} paddingAngle={2} dataKey="value">
                            {pieHoldingData.map((entry, i) => <Cell key={i} fill={entry.color} />)}
                          </Pie>
                          <Tooltip content={<CustomPieTooltip />} />
                        </PieChart>
                      </ResponsiveContainer>
                    </div>
                    {/* Bar chart */}
                    <div>
                      <div className="text-xs text-muted-foreground font-medium mb-3">Weight by Position (%)</div>
                      <ResponsiveContainer width="100%" height={240}>
                        <BarChart data={barData} layout="vertical" margin={{ top: 0, right: 20, left: 10, bottom: 0 }}>
                          <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.04)" horizontal={false} />
                          <XAxis type="number" tick={{ fill: "#71717a", fontSize: 10 }} axisLine={false} tickLine={false} tickFormatter={v => v + "%"} />
                          <YAxis type="category" dataKey="name" tick={{ fill: "#71717a", fontSize: 11 }} axisLine={false} tickLine={false} width={50} />
                          <Tooltip content={<CustomBarTooltip />} />
                          <Bar dataKey="weight" name="Weight" radius={[0, 4, 4, 0]}>
                            {barData.map((entry, i) => <Cell key={i} fill={entry.color} />)}
                          </Bar>
                        </BarChart>
                      </ResponsiveContainer>
                    </div>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                      <div className="text-xs text-muted-foreground font-medium mb-3">Category Allocation</div>
                      <ResponsiveContainer width="100%" height={240}>
                        <PieChart>
                          <Pie data={pieCatData} cx="50%" cy="50%" innerRadius={60} outerRadius={110} paddingAngle={2} dataKey="value">
                            {pieCatData.map((entry, i) => <Cell key={i} fill={entry.color} />)}
                          </Pie>
                          <Tooltip content={<CustomPieTooltip />} />
                        </PieChart>
                      </ResponsiveContainer>
                    </div>
                    <div className="flex flex-col justify-center gap-3">
                      {categories.map((c, i) => (
                        <div key={c.category} className="flex items-center gap-3">
                          <span className="w-3 h-3 rounded-sm shrink-0" style={{ background: COLORS[i % COLORS.length] }} />
                          <span className="text-sm text-muted-foreground flex-1">{c.category}</span>
                          <span className="text-sm font-semibold text-foreground">{fmt(c.value)}</span>
                          <span className={`text-sm font-bold w-14 text-right ${getRiskColor(c.weight / (categories.length || 1))}`}>{c.weight.toFixed(1)}%</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Holdings results table */}
          {results.length > 0 && totalValue > 0 && (
            <div className="rounded-2xl border border-border bg-card overflow-hidden">
              <div className="flex items-center justify-between px-6 py-4 border-b border-border">
                <div className="text-sm font-bold text-foreground">Holdings Breakdown</div>
                <div className="flex items-center gap-2 text-xs text-muted-foreground">
                  Sort by:
                  {(["weight", "value", "name"] as const).map(s => (
                    <button key={s} onClick={() => setSortBy(s)}
                      className={`px-2.5 py-1 rounded-md capitalize font-medium transition-all ${sortBy === s ? "bg-primary text-black" : "hover:text-foreground"}`}>
                      {s}
                    </button>
                  ))}
                </div>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-xs">
                  <thead className="bg-card/95">
                    <tr>
                      <th className="text-left px-4 py-3 text-muted-foreground font-semibold uppercase tracking-wider text-[10px]">Holding</th>
                      <th className="text-left px-4 py-3 text-muted-foreground font-semibold uppercase tracking-wider text-[10px]">Category</th>
                      <th className="text-right px-4 py-3 text-muted-foreground font-semibold uppercase tracking-wider text-[10px]">Shares</th>
                      <th className="text-right px-4 py-3 text-muted-foreground font-semibold uppercase tracking-wider text-[10px]">Price</th>
                      <th className="text-right px-4 py-3 text-muted-foreground font-semibold uppercase tracking-wider text-[10px]">Value</th>
                      <th className="text-right px-4 py-3 text-muted-foreground font-semibold uppercase tracking-wider text-[10px]">Weight</th>
                      <th className="text-right px-4 py-3 text-muted-foreground font-semibold uppercase tracking-wider text-[10px]">Risk</th>
                      <th className="px-4 py-3 text-muted-foreground font-semibold uppercase tracking-wider text-[10px]">Bar</th>
                    </tr>
                  </thead>
                  <tbody>
                    {sorted.map((r, i) => (
                      <tr key={r.id} className="border-t border-border hover:bg-muted/10 transition-colors">
                        <td className="px-4 py-3">
                          <div className="flex items-center gap-2">
                            <span className="w-2 h-2 rounded-full" style={{ background: COLORS[results.indexOf(r) % COLORS.length] }} />
                            <div>
                              <div className="font-semibold text-foreground">{r.ticker || "—"}</div>
                              <div className="text-muted-foreground text-[10px]">{r.name}</div>
                            </div>
                          </div>
                        </td>
                        <td className="px-4 py-3 text-muted-foreground">{r.category}</td>
                        <td className="px-4 py-3 text-right tabular-nums text-muted-foreground">{r.shares.toLocaleString()}</td>
                        <td className="px-4 py-3 text-right tabular-nums text-muted-foreground">{fmtFull(r.price)}</td>
                        <td className="px-4 py-3 text-right tabular-nums text-foreground font-medium">{fmt(r.value)}</td>
                        <td className={`px-4 py-3 text-right tabular-nums font-bold text-base ${getRiskColor(r.weight)}`}>{r.weight.toFixed(2)}%</td>
                        <td className="px-4 py-3 text-right">
                          <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold border ${getRiskBg(r.weight)}`}>
                            {getRiskLabel(r.weight)}
                          </span>
                        </td>
                        <td className="px-4 py-3 w-24">
                          <div className="w-full bg-border rounded-full h-1.5">
                            <div className="h-1.5 rounded-full bg-primary transition-all"
                              style={{ width: `${Math.min(100, r.weight)}%` }} />
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                  {/* Totals row */}
                  <tfoot>
                    <tr className="border-t-2 border-border bg-card/50">
                      <td colSpan={4} className="px-4 py-3 font-bold text-foreground text-xs">Total ({results.length} holdings)</td>
                      <td className="px-4 py-3 text-right tabular-nums font-bold text-foreground">{fmt(totalValue)}</td>
                      <td className="px-4 py-3 text-right tabular-nums font-bold text-primary">100.00%</td>
                      <td colSpan={2} />
                    </tr>
                  </tfoot>
                </table>
              </div>
            </div>
          )}

          {/* Category summary */}
          {categories.length > 0 && (
            <div className="rounded-2xl border border-border bg-card overflow-hidden">
              <div className="px-6 py-4 border-b border-border">
                <div className="text-sm font-bold text-foreground">Category Summary</div>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-xs">
                  <thead className="bg-card/95">
                    <tr>
                      <th className="text-left px-4 py-3 text-muted-foreground font-semibold uppercase tracking-wider text-[10px]">Category</th>
                      <th className="text-right px-4 py-3 text-muted-foreground font-semibold uppercase tracking-wider text-[10px]">Holdings</th>
                      <th className="text-right px-4 py-3 text-muted-foreground font-semibold uppercase tracking-wider text-[10px]">Total Value</th>
                      <th className="text-right px-4 py-3 text-muted-foreground font-semibold uppercase tracking-wider text-[10px]">Portfolio Weight</th>
                      <th className="px-4 py-3 text-muted-foreground font-semibold uppercase tracking-wider text-[10px]">Allocation Bar</th>
                    </tr>
                  </thead>
                  <tbody>
                    {categories.map((c, i) => (
                      <tr key={c.category} className="border-t border-border hover:bg-muted/10 transition-colors">
                        <td className="px-4 py-3 font-semibold text-foreground flex items-center gap-2">
                          <span className="w-2 h-2 rounded-full" style={{ background: COLORS[i % COLORS.length] }} />
                          {c.category}
                        </td>
                        <td className="px-4 py-3 text-right text-muted-foreground">{c.count}</td>
                        <td className="px-4 py-3 text-right tabular-nums text-foreground font-medium">{fmt(c.value)}</td>
                        <td className={`px-4 py-3 text-right tabular-nums font-bold ${getRiskColor(c.weight / Math.max(1, categories.length))}`}>{c.weight.toFixed(2)}%</td>
                        <td className="px-4 py-3 w-32">
                          <div className="w-full bg-border rounded-full h-2">
                            <div className="h-2 rounded-full transition-all" style={{ width: `${Math.min(100, c.weight)}%`, background: COLORS[i % COLORS.length] }} />
                          </div>
                        </td>
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
