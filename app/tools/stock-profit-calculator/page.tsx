"use client"

import { useState, useEffect } from "react"
import Link from "next/link"
import { Header } from "@/components/header"
import { Footer } from "@/components/footer"
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Cell,
  ReferenceLine,
} from "recharts"

// ── Types ──────────────────────────────────────────────────
interface Trade {
  id: number
  ticker: string
  shares: number
  buyPrice: number
  sellPrice: number
  commission: number
  holdingDays: number
}

interface TradeResult {
  id: number
  ticker: string
  grossProfit: number
  netProfit: number
  totalCost: number
  totalRevenue: number
  returnPct: number
  annualizedReturn: number
  isProfit: boolean
  breakEvenPrice: number
}

interface Summary {
  totalInvested: number
  totalRevenue: number
  totalNetProfit: number
  totalGrossProfit: number
  totalCommissions: number
  overallReturnPct: number
  winningTrades: number
  losingTrades: number
  winRate: number
  bestTrade: TradeResult | null
  worstTrade: TradeResult | null
}

// ── Constants ──────────────────────────────────────────────
const RELATED_TOOLS = [
  { icon: "🔄", name: "DCA Calculator", href: "/tools/dca-calculator" },
  { icon: "💰", name: "Dividend Calculator", href: "/tools/dividend-calculator" },
  { icon: "⚖️", name: "Portfolio Rebalancing", href: "/tools/portfolio-rebalancing" },
  { icon: "🥧", name: "Portfolio Weight", href: "/tools/portfolio-weight" },
  { icon: "📈", name: "Time-Weighted Return", href: "/tools/time-weighted-return" },
  { icon: "📊", name: "Money-Weighted Return", href: "/tools/money-weighted-return" },
]

const FAQS = [
  {
    q: "How is stock profit calculated?",
    a: "Stock profit = (Sell Price × Shares) − (Buy Price × Shares) − Total Commissions. Your net profit accounts for broker fees on both the buy and sell side. The return percentage is calculated as Net Profit ÷ Total Cost × 100, where Total Cost = (Buy Price × Shares) + Buy Commission.",
  },
  {
    q: "What is annualized return and why does it matter?",
    a: "Annualized return converts your total return into a per-year equivalent, making it easier to compare trades held for different periods. A 50% return in 6 months is much better than 50% in 3 years. The formula is: ((1 + Total Return)^(365/Days Held))^1 − 1. This lets you compare any trade to benchmarks like the S&P 500's ~10% annual return.",
  },
  {
    q: "What is the break-even price?",
    a: "The break-even price is the sell price at which you neither gain nor lose money after accounting for commissions. It's calculated as: (Total Cost including buy commission) ÷ Number of Shares + Sell Commission per share. Any sell price above this means profit; below means a loss.",
  },
  {
    q: "How do commissions affect my returns?",
    a: "Commissions reduce your effective return, especially on smaller trades. On a $1,000 trade with $10 commissions each way, you're paying 2% just to break even. Modern brokers like Robinhood, Fidelity, and Schwab offer $0 commission trades on stocks and ETFs, which significantly improves returns for frequent traders and small investors.",
  },
  {
    q: "What is the difference between realized and unrealized profit?",
    a: "Realized profit is profit from trades you've already closed (sold). Unrealized profit is the paper gain/loss on positions you still hold. This calculator computes realized profit. Tax implications differ — realized gains may be taxable in the year they occur, while unrealized gains are not taxed until you sell.",
  },
  {
    q: "How are stock profits taxed?",
    a: "In the US, stocks held less than 1 year are taxed as ordinary income (short-term capital gains). Stocks held more than 1 year qualify for long-term capital gains rates of 0%, 15%, or 20% depending on your income. This is a major reason why many investors hold positions for at least a year — the tax savings can be substantial.",
  },
  {
    q: "What is a good return on a stock trade?",
    a: "Context matters enormously. A 10% return in 1 week is exceptional; a 10% return in 5 years is poor. The S&P 500 returns about 10% per year on average. A good trade beats the market's risk-adjusted return for the same period. Focus on annualized return for fair comparisons across trades held for different durations.",
  },
]

// ── Helpers ────────────────────────────────────────────────
function fmtFull(n: number): string {
  const abs = Math.abs(n)
  const str = abs.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })
  return (n < 0 ? "−$" : "$") + str
}

function fmtPct(n: number): string {
  return (n >= 0 ? "+" : "") + n.toFixed(2) + "%"
}

function computeResult(trade: Trade): TradeResult {
  const totalCost = trade.buyPrice * trade.shares + trade.commission
  const totalRevenue = trade.sellPrice * trade.shares - trade.commission
  const grossProfit = (trade.sellPrice - trade.buyPrice) * trade.shares
  const netProfit = totalRevenue - (trade.buyPrice * trade.shares + trade.commission)
  const returnPct = totalCost > 0 ? (netProfit / totalCost) * 100 : 0
  const annualizedReturn = trade.holdingDays > 0
    ? (Math.pow(1 + returnPct / 100, 365 / trade.holdingDays) - 1) * 100
    : returnPct
  const breakEvenPrice = totalCost / trade.shares + trade.commission / trade.shares

  return {
    id: trade.id,
    ticker: trade.ticker || `Trade ${trade.id}`,
    grossProfit,
    netProfit,
    totalCost: trade.buyPrice * trade.shares + trade.commission,
    totalRevenue,
    returnPct,
    annualizedReturn,
    isProfit: netProfit >= 0,
    breakEvenPrice,
  }
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
          <span className={`font-semibold ${p.value >= 0 ? "text-green-400" : "text-red-400"}`}>
            {fmtFull(p.value)}
          </span>
        </div>
      ))}
    </div>
  )
}

// ── Default trades ─────────────────────────────────────────
const DEFAULT_TRADES: Trade[] = [
  { id: 1, ticker: "AAPL", shares: 10, buyPrice: 150, sellPrice: 185, commission: 0, holdingDays: 180 },
  { id: 2, ticker: "TSLA", shares: 5, buyPrice: 280, sellPrice: 220, commission: 0, holdingDays: 90 },
  { id: 3, ticker: "NVDA", shares: 8, buyPrice: 400, sellPrice: 650, commission: 9.99, holdingDays: 365 },
]

// ── Main Component ─────────────────────────────────────────
export default function StockProfitCalculatorPage() {
  const [trades, setTrades] = useState<Trade[]>(DEFAULT_TRADES)
  const [results, setResults] = useState<TradeResult[]>([])
  const [summary, setSummary] = useState<Summary | null>(null)
  const [openFaq, setOpenFaq] = useState<number | null>(null)
  const [nextId, setNextId] = useState(4)

  function calculate() {
    const computed = trades.map(computeResult)
    setResults(computed)

    const winning = computed.filter(r => r.isProfit)
    const losing = computed.filter(r => !r.isProfit)
    const totalInvested = computed.reduce((s, r) => s + r.totalCost, 0)
    const totalRevenue = computed.reduce((s, r) => s + r.totalRevenue, 0)
    const totalNetProfit = computed.reduce((s, r) => s + r.netProfit, 0)
    const totalGross = computed.reduce((s, r) => s + r.grossProfit, 0)
    const totalComm = trades.reduce((s, t) => s + t.commission * 2, 0)

    const best = computed.reduce((a, b) => b.netProfit > a.netProfit ? b : a, computed[0])
    const worst = computed.reduce((a, b) => b.netProfit < a.netProfit ? b : a, computed[0])

    setSummary({
      totalInvested,
      totalRevenue,
      totalNetProfit,
      totalGrossProfit: totalGross,
      totalCommissions: totalComm,
      overallReturnPct: totalInvested > 0 ? (totalNetProfit / totalInvested) * 100 : 0,
      winningTrades: winning.length,
      losingTrades: losing.length,
      winRate: computed.length > 0 ? (winning.length / computed.length) * 100 : 0,
      bestTrade: best ?? null,
      worstTrade: worst ?? null,
    })
  }

  useEffect(() => { calculate() }, [trades]) // eslint-disable-line

  function addTrade() {
    setTrades(prev => [...prev, { id: nextId, ticker: "", shares: 1, buyPrice: 100, sellPrice: 110, commission: 0, holdingDays: 30 }])
    setNextId(n => n + 1)
  }

  function removeTrade(id: number) {
    setTrades(prev => prev.filter(t => t.id !== id))
  }

  function updateTrade(id: number, field: keyof Trade, value: string | number) {
    setTrades(prev => prev.map(t => t.id === id ? { ...t, [field]: value } : t))
  }

  const inputCls = "bg-background border border-border rounded-lg py-2 text-sm text-foreground outline-none focus:border-primary/50 transition-colors px-3 w-full"

  const chartData = results.map(r => ({
    name: r.ticker,
    netProfit: Math.round(r.netProfit * 100) / 100,
    returnPct: Math.round(r.returnPct * 100) / 100,
  }))

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <Header />

      <main className="pt-16 flex-1">

        {/* Page Header */}
        <div className="max-w-5xl mx-auto px-4 sm:px-6 pt-12 pb-8 text-center">
          <div className="text-xs font-bold tracking-widest uppercase text-primary mb-3">Free Tools</div>
          <h1 className="text-3xl sm:text-4xl font-extrabold tracking-tight text-foreground mb-3">
            Stock Profit Calculator
          </h1>
          <p className="text-muted-foreground text-sm max-w-md mx-auto leading-relaxed">
            Calculate your profit, loss, return %, and annualized return on any stock
            trade. Add multiple trades to get a full portfolio performance summary.
          </p>
        </div>

        <div className="max-w-5xl mx-auto px-4 sm:px-6 pb-20 space-y-4">

          {/* Trade Input Cards */}
          <div className="space-y-3">
            {trades.map((trade, idx) => {
              const result = results.find(r => r.id === trade.id)
              return (
                <div key={trade.id} className="rounded-2xl border border-border bg-card overflow-hidden">
                  {/* Trade header */}
                  <div className="flex items-center justify-between px-5 py-3 border-b border-border bg-card/50">
                    <div className="flex items-center gap-3">
                      <span className="text-xs font-bold text-muted-foreground">TRADE {idx + 1}</span>
                      <input
                        type="text"
                        placeholder="TICKER"
                        value={trade.ticker}
                        onChange={(e) => updateTrade(trade.id, "ticker", e.target.value.toUpperCase())}
                        className="bg-background border border-border rounded-lg px-3 py-1.5 text-sm font-bold text-foreground outline-none focus:border-primary/50 transition-colors w-28 uppercase"
                      />
                    </div>
                    <div className="flex items-center gap-3">
                      {result && (
                        <span className={`text-sm font-bold ${result.isProfit ? "text-green-400" : "text-red-400"}`}>
                          {result.isProfit ? "▲" : "▼"} {fmtPct(result.returnPct)}
                        </span>
                      )}
                      {trades.length > 1 && (
                        <button onClick={() => removeTrade(trade.id)}
                          className="text-muted-foreground hover:text-red-400 transition-colors text-xs font-medium px-2 py-1 rounded-lg hover:bg-red-400/10">
                          Remove
                        </button>
                      )}
                    </div>
                  </div>

                  <div className="p-5">
                    <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
                      <div className="flex flex-col gap-1.5">
                        <label className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">Shares</label>
                        <input type="number" value={trade.shares} min={0.001} step={0.001}
                          onChange={(e) => updateTrade(trade.id, "shares", +e.target.value || 0)}
                          className={inputCls} />
                      </div>
                      <div className="flex flex-col gap-1.5">
                        <label className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">Buy Price</label>
                        <div className="relative">
                          <span className="absolute left-3 top-1/2 -translate-y-1/2 text-xs text-muted-foreground">$</span>
                          <input type="number" value={trade.buyPrice} min={0} step={0.01}
                            onChange={(e) => updateTrade(trade.id, "buyPrice", +e.target.value || 0)}
                            className={inputCls + " pl-6"} />
                        </div>
                      </div>
                      <div className="flex flex-col gap-1.5">
                        <label className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">Sell Price</label>
                        <div className="relative">
                          <span className="absolute left-3 top-1/2 -translate-y-1/2 text-xs text-muted-foreground">$</span>
                          <input type="number" value={trade.sellPrice} min={0} step={0.01}
                            onChange={(e) => updateTrade(trade.id, "sellPrice", +e.target.value || 0)}
                            className={inputCls + " pl-6"} />
                        </div>
                      </div>
                      <div className="flex flex-col gap-1.5">
                        <label className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">Commission</label>
                        <div className="relative">
                          <span className="absolute left-3 top-1/2 -translate-y-1/2 text-xs text-muted-foreground">$</span>
                          <input type="number" value={trade.commission} min={0} step={0.01}
                            onChange={(e) => updateTrade(trade.id, "commission", +e.target.value || 0)}
                            className={inputCls + " pl-6"} />
                        </div>
                      </div>
                      <div className="flex flex-col gap-1.5">
                        <label className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">Days Held</label>
                        <input type="number" value={trade.holdingDays} min={1}
                          onChange={(e) => updateTrade(trade.id, "holdingDays", +e.target.value || 1)}
                          className={inputCls} />
                      </div>
                      <div className="flex flex-col gap-1.5">
                        <label className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">Break-Even</label>
                        <div className={`rounded-lg border px-3 py-2 text-sm font-semibold ${result?.isProfit ? "border-green-500/20 bg-green-500/5 text-green-400" : "border-red-500/20 bg-red-500/5 text-red-400"}`}>
                          {result ? "$" + result.breakEvenPrice.toFixed(2) : "—"}
                        </div>
                      </div>
                    </div>

                    {/* Inline result row */}
                    {result && (
                      <div className="mt-4 grid grid-cols-2 sm:grid-cols-4 gap-3 pt-3 border-t border-border/50">
                        <div className="text-xs">
                          <div className="text-muted-foreground mb-0.5">Total Cost</div>
                          <div className="font-semibold text-foreground">{fmtFull(result.totalCost)}</div>
                        </div>
                        <div className="text-xs">
                          <div className="text-muted-foreground mb-0.5">Total Revenue</div>
                          <div className="font-semibold text-foreground">{fmtFull(result.totalRevenue)}</div>
                        </div>
                        <div className="text-xs">
                          <div className="text-muted-foreground mb-0.5">Net Profit / Loss</div>
                          <div className={`font-bold text-sm ${result.isProfit ? "text-green-400" : "text-red-400"}`}>
                            {fmtFull(result.netProfit)}
                          </div>
                        </div>
                        <div className="text-xs">
                          <div className="text-muted-foreground mb-0.5">Annualized Return</div>
                          <div className={`font-bold text-sm ${result.annualizedReturn >= 0 ? "text-green-400" : "text-red-400"}`}>
                            {fmtPct(result.annualizedReturn)} / yr
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              )
            })}

            {/* Add trade button */}
            <button onClick={addTrade}
              className="w-full rounded-2xl border border-dashed border-border bg-card/50 hover:border-primary/40 hover:bg-primary/5 transition-all py-4 text-sm font-semibold text-muted-foreground hover:text-primary flex items-center justify-center gap-2">
              <span className="text-lg leading-none">+</span>
              Add Another Trade
            </button>
          </div>

          {/* Portfolio Summary Banner */}
          {summary && results.length > 0 && (
            <div className={`rounded-2xl border p-6 ${summary.totalNetProfit >= 0 ? "border-primary/20 bg-primary/5" : "border-red-400/20 bg-red-400/5"}`}>
              <div className="flex items-center gap-2 text-[10px] font-bold tracking-widest uppercase text-primary mb-5">
                <span className="w-1.5 h-1.5 rounded-full bg-primary inline-block" />
                Portfolio Summary — {trades.length} Trade{trades.length !== 1 ? "s" : ""}
              </div>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-4">
                <div>
                  <div className="text-xs text-muted-foreground mb-1">Total Net Profit/Loss</div>
                  <div className={`text-xl sm:text-2xl font-extrabold tracking-tight ${summary.totalNetProfit >= 0 ? "text-primary" : "text-red-400"}`}>
                    {fmtFull(summary.totalNetProfit)}
                  </div>
                </div>
                <div>
                  <div className="text-xs text-muted-foreground mb-1">Overall Return</div>
                  <div className={`text-xl font-bold ${summary.overallReturnPct >= 0 ? "text-green-400" : "text-red-400"}`}>
                    {fmtPct(summary.overallReturnPct)}
                  </div>
                </div>
                <div>
                  <div className="text-xs text-muted-foreground mb-1">Total Invested</div>
                  <div className="text-xl font-bold text-foreground">{fmtFull(summary.totalInvested)}</div>
                </div>
                <div>
                  <div className="text-xs text-muted-foreground mb-1">Total Revenue</div>
                  <div className="text-xl font-bold text-foreground">{fmtFull(summary.totalRevenue)}</div>
                </div>
              </div>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 pt-4 border-t border-border/30">
                <div>
                  <div className="text-xs text-muted-foreground mb-1">Win Rate</div>
                  <div className={`text-lg font-bold ${summary.winRate >= 50 ? "text-green-400" : "text-red-400"}`}>
                    {summary.winRate.toFixed(0)}%
                  </div>
                </div>
                <div>
                  <div className="text-xs text-muted-foreground mb-1">Wins / Losses</div>
                  <div className="text-lg font-bold text-foreground">
                    <span className="text-green-400">{summary.winningTrades}W</span>
                    {" / "}
                    <span className="text-red-400">{summary.losingTrades}L</span>
                  </div>
                </div>
                <div>
                  <div className="text-xs text-muted-foreground mb-1">Best Trade</div>
                  <div className="text-lg font-bold text-green-400">
                    {summary.bestTrade ? `${summary.bestTrade.ticker} (+${summary.bestTrade.returnPct.toFixed(1)}%)` : "—"}
                  </div>
                </div>
                <div>
                  <div className="text-xs text-muted-foreground mb-1">Worst Trade</div>
                  <div className="text-lg font-bold text-red-400">
                    {summary.worstTrade ? `${summary.worstTrade.ticker} (${summary.worstTrade.returnPct.toFixed(1)}%)` : "—"}
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Chart */}
          {results.length > 0 && chartData.length > 0 && (
            <div className="rounded-2xl border border-border bg-card overflow-hidden">
              <div className="px-6 py-4 border-b border-border">
                <div className="text-sm font-bold text-foreground">Profit / Loss by Trade</div>
              </div>
              <div className="p-6">
                <ResponsiveContainer width="100%" height={260}>
                  <BarChart data={chartData} margin={{ top: 10, right: 10, left: 10, bottom: 5 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.04)" />
                    <XAxis dataKey="name" tick={{ fill: "#71717a", fontSize: 12, fontWeight: 600 }} axisLine={false} tickLine={false} />
                    <YAxis tick={{ fill: "#71717a", fontSize: 11 }} axisLine={false} tickLine={false} width={80}
                      tickFormatter={(v) => "$" + v.toLocaleString()} />
                    <Tooltip content={<CustomTooltip />} />
                    <ReferenceLine y={0} stroke="#2c302c" strokeWidth={1.5} />
                    <Bar dataKey="netProfit" name="Net Profit/Loss" radius={[6, 6, 6, 6]}>
                      {chartData.map((entry, index) => (
                        <Cell key={index} fill={entry.netProfit >= 0 ? "#4ade80" : "#f87171"} />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>
          )}

          {/* Detailed results table */}
          {results.length > 0 && (
            <div className="rounded-2xl border border-border bg-card overflow-hidden">
              <div className="px-6 py-4 border-b border-border">
                <div className="text-sm font-bold text-foreground">Trade-by-Trade Results</div>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-xs">
                  <thead className="bg-card/95">
                    <tr>
                      <th className="text-left px-4 py-3 text-muted-foreground font-semibold uppercase tracking-wider text-[10px]">Ticker</th>
                      <th className="text-right px-4 py-3 text-muted-foreground font-semibold uppercase tracking-wider text-[10px]">Invested</th>
                      <th className="text-right px-4 py-3 text-muted-foreground font-semibold uppercase tracking-wider text-[10px]">Revenue</th>
                      <th className="text-right px-4 py-3 text-muted-foreground font-semibold uppercase tracking-wider text-[10px]">Gross P&L</th>
                      <th className="text-right px-4 py-3 text-muted-foreground font-semibold uppercase tracking-wider text-[10px]">Net P&L</th>
                      <th className="text-right px-4 py-3 text-muted-foreground font-semibold uppercase tracking-wider text-[10px]">Return %</th>
                      <th className="text-right px-4 py-3 text-muted-foreground font-semibold uppercase tracking-wider text-[10px]">Annualized</th>
                      <th className="text-right px-4 py-3 text-muted-foreground font-semibold uppercase tracking-wider text-[10px]">Break-Even</th>
                    </tr>
                  </thead>
                  <tbody>
                    {results.map((r) => (
                      <tr key={r.id} className="border-t border-border hover:bg-muted/10 transition-colors">
                        <td className="px-4 py-3 font-bold text-foreground">{r.ticker}</td>
                        <td className="px-4 py-3 text-right tabular-nums text-muted-foreground">{fmtFull(r.totalCost)}</td>
                        <td className="px-4 py-3 text-right tabular-nums text-muted-foreground">{fmtFull(r.totalRevenue)}</td>
                        <td className={`px-4 py-3 text-right tabular-nums ${r.grossProfit >= 0 ? "text-green-400" : "text-red-400"}`}>{fmtFull(r.grossProfit)}</td>
                        <td className={`px-4 py-3 text-right tabular-nums font-semibold ${r.netProfit >= 0 ? "text-green-400" : "text-red-400"}`}>{fmtFull(r.netProfit)}</td>
                        <td className={`px-4 py-3 text-right tabular-nums font-semibold ${r.returnPct >= 0 ? "text-green-400" : "text-red-400"}`}>{fmtPct(r.returnPct)}</td>
                        <td className={`px-4 py-3 text-right tabular-nums ${r.annualizedReturn >= 0 ? "text-green-400" : "text-red-400"}`}>{fmtPct(r.annualizedReturn)}/yr</td>
                        <td className="px-4 py-3 text-right tabular-nums text-muted-foreground">${r.breakEvenPrice.toFixed(2)}</td>
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
