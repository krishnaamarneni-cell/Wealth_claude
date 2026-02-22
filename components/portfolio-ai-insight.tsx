"use client"

import { useMemo } from "react"
import { Card, CardContent } from "@/components/ui/card"
import { Lightbulb, TrendingUp, TrendingDown, Target, Zap, DollarSign } from "lucide-react"

interface Holding {
  symbol: string
  shares: number
  totalCost: number
  avgCost: number
  marketValue: number
  currentPrice: number
  todayGain: number
  todayGainPercent: number
  totalGain: number
  totalGainPercent: number
  allocation: number
  sector?: string
  industry?: string
  assetType?: string
  country?: string
}

interface AllocationHistory {
  month: string
  [key: string]: number | string
}

interface RebalanceRecommendation {
  symbol: string
  currentAllocation: number
  targetAllocation: number
  currentValue: number
  targetValue: number
  action: "BUY" | "SELL" | "HOLD"
  amount: number
  shares: number
  drift: number
  taxImpact: number
  costBasis: number
}

interface WhatIfAllocation {
  symbol: string
  amount: number
  percentage: number
  shares: number
  reason: string
}

interface Props {
  mode: "portfolio" | "rebalance"
  holdings: Holding[]
  totalPortfolioValue: number
  allocationHistory: AllocationHistory[]
  rebalanceRecommendations?: RebalanceRecommendation[]
  whatIfScenario?: WhatIfAllocation[]
  whatIfAmount?: number
  driftScore?: number
  riskScore?: number
}

function fmt(v: number) {
  return new Intl.NumberFormat("en-US", { style: "currency", currency: "USD", maximumFractionDigits: 0 }).format(v)
}
function fmtExact(v: number) {
  return new Intl.NumberFormat("en-US", { style: "currency", currency: "USD", minimumFractionDigits: 2 }).format(v)
}
function pct(v: number) {
  return `${v >= 0 ? "+" : ""}${v.toFixed(1)}%`
}

// ─── PORTFOLIO MODE INSIGHTS ───────────────────────────────────────────────

function usePortfolioInsights(holdings: Holding[], allocationHistory: AllocationHistory[]) {
  return useMemo(() => {
    if (!holdings || holdings.length === 0) return null

    // ── Character Summary ──
    const sectorMap: Record<string, number> = {}
    const assetMap: Record<string, number> = {}
    holdings.forEach((h) => {
      const sec = h.sector || "Unknown"
      const asset = h.assetType || "Stock"
      sectorMap[sec] = (sectorMap[sec] || 0) + h.allocation
      assetMap[asset] = (assetMap[asset] || 0) + h.allocation
    })

    const topSectors = Object.entries(sectorMap).sort((a, b) => b[1] - a[1]).slice(0, 2)
    const techAndGrowth = (sectorMap["Technology"] || 0) + (sectorMap["Communication Services"] || 0) + (sectorMap["Consumer Cyclical"] || 0)
    const defensivePct = (sectorMap["Consumer Defensive"] || 0) + (sectorMap["Healthcare"] || 0) + (sectorMap["Utilities"] || 0)
    const etfPct = assetMap["ETF"] || 0
    const totalGain = holdings.reduce((s, h) => s + h.totalGain, 0)
    const totalCost = holdings.reduce((s, h) => s + h.totalCost, 0)
    const totalGainPct = totalCost > 0 ? (totalGain / totalCost) * 100 : 0

    let characterType = ""
    let characterDesc = ""

    if (techAndGrowth > 60) {
      characterType = "🚀 Aggressive Growth"
      characterDesc = `${techAndGrowth.toFixed(0)}% in growth sectors (tech, comm, consumer). High upside, high volatility.`
    } else if (defensivePct > 40) {
      characterType = "🛡️ Conservative Defensive"
      characterDesc = `${defensivePct.toFixed(0)}% in defensive sectors. Lower volatility, more capital preservation.`
    } else if (etfPct > 40) {
      characterType = "📊 Passive Index-Oriented"
      characterDesc = `${etfPct.toFixed(0)}% ETFs — low-cost, broad market exposure with minimal stock picking.`
    } else if (techAndGrowth > 35 && defensivePct > 20) {
      characterType = "⚖️ Balanced Growth"
      characterDesc = `Mix of growth (${techAndGrowth.toFixed(0)}%) and defensive (${defensivePct.toFixed(0)}%) — moderate risk profile.`
    } else {
      characterType = "🌐 Diversified Mixed"
      characterDesc = "Spread across many sectors with no dominant style — broadly diversified."
    }

    const characterLines: string[] = [
      `${characterType} — ${characterDesc}`,
      `Top sector exposures: ${topSectors.map(([s, v]) => `${s} (${v.toFixed(0)}%)`).join(", ")}.`,
      totalGainPct >= 0
        ? `Overall portfolio is up ${totalGainPct.toFixed(1)}% on a cost basis of ${fmt(totalCost)}.`
        : `Overall portfolio is down ${Math.abs(totalGainPct).toFixed(1)}% on a cost basis of ${fmt(totalCost)}.`,
    ]

    // ── 12-Month Trend Alert ──
    const trendLines: string[] = []

    if (allocationHistory && allocationHistory.length >= 2) {
      const firstMonth = allocationHistory[0]
      const lastMonth = allocationHistory[allocationHistory.length - 1]

      const drifters: { symbol: string; change: number; from: number; to: number }[] = []
      holdings.forEach((h) => {
        const start = (firstMonth[h.symbol] as number) || 0
        const end = (lastMonth[h.symbol] as number) || 0
        const change = end - start
        if (Math.abs(change) >= 2) {
          drifters.push({ symbol: h.symbol, change, from: start, to: end })
        }
      })
      drifters.sort((a, b) => Math.abs(b.change) - Math.abs(a.change))

      const bigGrowers = drifters.filter((d) => d.change > 0).slice(0, 2)
      const bigShrinkers = drifters.filter((d) => d.change < 0).slice(0, 1)

      if (bigGrowers.length > 0) {
        bigGrowers.forEach((d) => {
          trendLines.push(
            `📈 ${d.symbol} grew from ${d.from.toFixed(1)}% → ${d.to.toFixed(1)}% over 12 months — driven by price appreciation, not new buys.`
          )
        })
      }
      if (bigShrinkers.length > 0) {
        bigShrinkers.forEach((d) => {
          trendLines.push(
            `📉 ${d.symbol} shrank from ${d.from.toFixed(1)}% → ${d.to.toFixed(1)}% — underperformed or was partially trimmed.`
          )
        })
      }
      if (drifters.length === 0) {
        trendLines.push("✅ Your allocation has been relatively stable over the past 12 months — no major unintended drift.")
      }

      const biggestDrifter = drifters[0]
      if (biggestDrifter && Math.abs(biggestDrifter.change) > 5) {
        trendLines.push(
          `⚠️ ${biggestDrifter.symbol}'s weight shifted ${Math.abs(biggestDrifter.change).toFixed(1)}% — largest organic drift in your portfolio.`
        )
      }
    } else {
      trendLines.push("Not enough history to calculate 12-month trends yet.")
      trendLines.push("Trends will appear once you have at least 2 months of transaction data.")
    }

    return { characterLines, trendLines }
  }, [holdings, allocationHistory])
}

// ─── REBALANCE MODE INSIGHTS ───────────────────────────────────────────────

function useRebalanceInsights(
  holdings: Holding[],
  recommendations: RebalanceRecommendation[],
  whatIfScenario: WhatIfAllocation[],
  whatIfAmount: number,
  totalPortfolioValue: number,
  driftScore: number
) {
  return useMemo(() => {
    if (!holdings || holdings.length === 0) return null

    // ── Action Narrative ──
    const actionLines: string[] = []
    const buys = (recommendations || []).filter((r) => r.action === "BUY").sort((a, b) => b.amount - a.amount)
    const sells = (recommendations || []).filter((r) => r.action === "SELL").sort((a, b) => b.amount - a.amount)
    const totalBuyAmount = buys.reduce((s, r) => s + r.amount, 0)
    const totalSellAmount = sells.reduce((s, r) => s + r.amount, 0)

    if (buys.length === 0 && sells.length === 0) {
      actionLines.push("✅ Your portfolio is well balanced — no rebalancing actions needed right now.")
      actionLines.push(`Balance Score: ${driftScore.toFixed(0)}/100. Keep your current allocation and monitor monthly.`)
    } else {
      if (buys.length > 0) {
        const top3Buys = buys.slice(0, 3).map((r) => `${r.symbol} (${fmt(r.amount)})`).join(", ")
        actionLines.push(`🟢 Buy priority: ${top3Buys}.`)
        actionLines.push(`Total capital needed for buys: ${fmt(totalBuyAmount)} across ${buys.length} position${buys.length > 1 ? "s" : ""}.`)
      }
      if (sells.length > 0) {
        const top2Sells = sells.slice(0, 2).map((r) => `${r.symbol} (${fmt(r.amount)})`).join(", ")
        actionLines.push(`🔴 Trim: ${top2Sells} — overweight relative to target.`)
      }
      const taxWarnings = (recommendations || []).filter((r) => r.action === "SELL" && r.taxImpact > 100)
      if (taxWarnings.length > 0) {
        actionLines.push(`⚠️ ${taxWarnings.map((r) => r.symbol).join(", ")} ${taxWarnings.length === 1 ? "has" : "have"} estimated tax impact — consider timing carefully.`)
      }
    }

    // ── No-Sell Rebalance Path ──
    const noSellLines: string[] = []

    if ((whatIfScenario || []).length > 0 && whatIfAmount > 0) {
      const totalAllocated = whatIfScenario.reduce((s, w) => s + w.amount, 0)
      const top3 = whatIfScenario.slice(0, 3).map((w) => `${w.symbol} (${fmt(w.amount)})`).join(", ")
      noSellLines.push(`With ${fmt(whatIfAmount)} of new capital, you can rebalance without selling a single position.`)
      noSellLines.push(`Suggested allocation: ${top3}.`)
      if (totalAllocated < whatIfAmount) {
        noSellLines.push(`${fmt(whatIfAmount - totalAllocated)} would go unallocated — consider increasing target allocations or the investment amount.`)
      }
    } else {
      // Calculate how much NEW capital would bring the portfolio into balance without selling
      const underweightTotal = (recommendations || [])
        .filter((r) => r.action === "BUY")
        .reduce((s, r) => s + r.amount, 0)
      if (underweightTotal > 0) {
        noSellLines.push(`To rebalance without selling, you'd need to deploy ~${fmt(underweightTotal)} of new capital.`)
        const top3NeedsBuy = buys.slice(0, 3).map((r) => `${r.symbol} (+${fmt(r.amount)})`).join(", ")
        noSellLines.push(`Priority positions to fund: ${top3NeedsBuy}.`)
        noSellLines.push("This avoids realizing any capital gains or triggering taxable events.")
      } else {
        noSellLines.push("✅ No underweight positions detected — new capital can go to any position without disrupting balance.")
      }
    }

    // Add total portfolio context
    noSellLines.push(`Current portfolio value: ${fmt(totalPortfolioValue)}.`)

    return { actionLines, noSellLines }
  }, [holdings, recommendations, whatIfScenario, whatIfAmount, totalPortfolioValue, driftScore])
}

// ─── MAIN COMPONENT ───────────────────────────────────────────────────────

export default function PortfolioAIInsight({
  mode,
  holdings,
  totalPortfolioValue,
  allocationHistory,
  rebalanceRecommendations = [],
  whatIfScenario = [],
  whatIfAmount = 0,
  driftScore = 100,
  riskScore = 100,
}: Props) {
  const portfolioInsights = usePortfolioInsights(
    mode === "portfolio" ? holdings : [],
    allocationHistory
  )
  const rebalanceInsights = useRebalanceInsights(
    mode === "rebalance" ? holdings : [],
    rebalanceRecommendations,
    whatIfScenario,
    whatIfAmount,
    totalPortfolioValue,
    driftScore
  )

  if (mode === "portfolio" && !portfolioInsights) return null
  if (mode === "rebalance" && !rebalanceInsights) return null

  return (
    <Card className="border-border bg-card">
      <CardContent className="pt-4 pb-4">
        {/* Header */}
        <div className="flex items-center gap-2 mb-4">
          <Lightbulb className="h-5 w-5 text-yellow-500" />
          <h3 className="text-base font-semibold">
            {mode === "portfolio" ? "AI Portfolio Insights" : "AI Rebalance Insights"}
          </h3>
          <span className="text-sm text-muted-foreground ml-auto">
            {mode === "portfolio" ? "Based on your allocation & history" : "Based on your targets & drift"}
          </span>
        </div>

        {/* Portfolio Mode */}
        {mode === "portfolio" && portfolioInsights && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Character Summary */}
            <div className="rounded-lg bg-muted/40 p-3 space-y-2">
              <div className="flex items-center gap-2 mb-2">
                <Zap className="h-4 w-4 text-yellow-500" />
                <span className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                  Portfolio Character
                </span>
              </div>
              {portfolioInsights.characterLines.map((line, i) => (
                <p key={i} className="text-sm text-foreground leading-relaxed">{line}</p>
              ))}
            </div>

            {/* 12-Month Trend */}
            <div className="rounded-lg bg-muted/40 p-3 space-y-2">
              <div className="flex items-center gap-2 mb-2">
                <TrendingUp className="h-4 w-4 text-blue-500" />
                <span className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                  12-Month Drift Trends
                </span>
              </div>
              {portfolioInsights.trendLines.map((line, i) => (
                <p key={i} className="text-sm text-foreground leading-relaxed">{line}</p>
              ))}
            </div>
          </div>
        )}

        {/* Rebalance Mode */}
        {mode === "rebalance" && rebalanceInsights && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Action Narrative */}
            <div className="rounded-lg bg-muted/40 p-3 space-y-2">
              <div className="flex items-center gap-2 mb-2">
                <Target className="h-4 w-4 text-green-500" />
                <span className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                  Rebalance Action Plan
                </span>
              </div>
              {rebalanceInsights.actionLines.map((line, i) => (
                <p key={i} className="text-sm text-foreground leading-relaxed">{line}</p>
              ))}
            </div>

            {/* No-Sell Path */}
            <div className="rounded-lg bg-muted/40 p-3 space-y-2">
              <div className="flex items-center gap-2 mb-2">
                <DollarSign className="h-4 w-4 text-purple-500" />
                <span className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                  No-Sell Rebalance Path
                </span>
              </div>
              {rebalanceInsights.noSellLines.map((line, i) => (
                <p key={i} className="text-sm text-foreground leading-relaxed">{line}</p>
              ))}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  )
}
