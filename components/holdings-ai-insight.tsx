"use client"

import { useMemo } from "react"
import { Card, CardContent } from "@/components/ui/card"
import { TrendingUp, TrendingDown, AlertTriangle, Lightbulb, ShieldCheck } from "lucide-react"
import type { Holding } from "@/lib/holdings-calculator"

interface Props {
  holdings: Holding[]
  totalPortfolioValue: number
  totalGain: number
  totalGainPercent: number
  todayGain: number
  todayGainPercent: number
}

function formatCurrency(v: number) {
  return new Intl.NumberFormat("en-US", { style: "currency", currency: "USD", maximumFractionDigits: 0 }).format(v)
}

function formatPercent(v: number) {
  return `${v >= 0 ? "+" : ""}${v.toFixed(2)}%`
}

export default function HoldingsAIInsight({
  holdings,
  totalPortfolioValue,
  totalGain,
  totalGainPercent,
  todayGain,
  todayGainPercent,
}: Props) {
  const insights = useMemo(() => {
    if (!holdings || holdings.length === 0) return null

    // ── 📊 Portfolio Health ──
    const sorted = [...holdings].sort((a, b) => b.allocation - a.allocation)
    const top1 = sorted[0]
    const top3Pct = sorted.slice(0, 3).reduce((s, h) => s + h.allocation, 0)
    const sectorMap: Record<string, number> = {}
    holdings.forEach((h) => {
      sectorMap[h.sector || "Unknown"] = (sectorMap[h.sector || "Unknown"] || 0) + h.allocation
    })
    const topSector = Object.entries(sectorMap).sort((a, b) => b[1] - a[1])[0]
    const diversificationGrade =
      holdings.length >= 15 && top3Pct < 50 ? "A" :
        holdings.length >= 10 && top3Pct < 60 ? "B" :
          holdings.length >= 5 && top3Pct < 75 ? "C" : "D"

    const healthLines: string[] = []
    healthLines.push(`Your top 3 holdings make up ${top3Pct.toFixed(0)}% of the portfolio — ${top3Pct > 60 ? "high concentration" : "within a healthy range"}.`)
    if (top1) healthLines.push(`${top1.symbol} is your largest position at ${top1.allocation.toFixed(1)}%.${top1.allocation > 25 ? " Consider if that's intentional." : ""}`)
    if (topSector) healthLines.push(`Biggest sector exposure: ${topSector[0]} at ${topSector[1].toFixed(1)}% of the portfolio.`)
    healthLines.push(`Diversification grade: ${diversificationGrade} (${holdings.length} positions across ${Object.keys(sectorMap).length} sectors).`)

    // ── 📈 Today's Impact ──
    const biggestDailyGainer = [...holdings].sort((a, b) => b.todayGain - a.todayGain)[0]
    const biggestDailyLoser = [...holdings].sort((a, b) => a.todayGain - b.todayGain)[0]
    const todayLines: string[] = []
    if (todayGain >= 0) {
      todayLines.push(`Your portfolio is up ${formatCurrency(todayGain)} today (${formatPercent(todayGainPercent)}).`)
    } else {
      todayLines.push(`Your portfolio is down ${formatCurrency(Math.abs(todayGain))} today (${formatPercent(todayGainPercent)}).`)
    }
    if (biggestDailyGainer && biggestDailyGainer.todayGain > 0) {
      todayLines.push(`📈 ${biggestDailyGainer.symbol} is leading gains at ${formatPercent(biggestDailyGainer.todayGainPercent)}, contributing ${formatCurrency(biggestDailyGainer.todayGain)}.`)
    }
    if (biggestDailyLoser && biggestDailyLoser.todayGain < 0) {
      todayLines.push(`📉 ${biggestDailyLoser.symbol} is the biggest drag at ${formatPercent(biggestDailyLoser.todayGainPercent)} (${formatCurrency(biggestDailyLoser.todayGain)}).`)
    }

    // ── ⚠️ Position Alerts ──
    const alerts: string[] = []
    const oversized = holdings.filter((h) => h.allocation > 25)
    const bigWinners = holdings.filter((h) => h.totalGainPercent > 50)
    const bigLosers = holdings.filter((h) => h.totalGainPercent < -20)

    if (oversized.length > 0) alerts.push(`⚠️ ${oversized.map((h) => h.symbol).join(", ")} ${oversized.length === 1 ? "is" : "are"} above 25% of your portfolio — high single-stock risk.`)
    if (bigWinners.length > 0) alerts.push(`🚀 ${bigWinners.map((h) => `${h.symbol} (+${h.totalGainPercent.toFixed(0)}%)`).join(", ")} — up significantly. Worth reviewing your target allocation.`)
    if (bigLosers.length > 0) alerts.push(`🔻 ${bigLosers.map((h) => `${h.symbol} (${h.totalGainPercent.toFixed(0)}%)`).join(", ")} — down over 20%. Worth assessing the thesis.`)
    if (alerts.length === 0) alerts.push("✅ No major position alerts. All holdings look within normal parameters.")

    // ── 💡 Tax Opportunity ──
    const taxLossHoldings = holdings.filter((h) => h.totalGain < 0)
    const totalHarvestable = taxLossHoldings.reduce((s, h) => s + Math.abs(h.totalGain), 0)
    const estimatedSaving = totalHarvestable * 0.24
    const taxLines: string[] = []
    if (taxLossHoldings.length > 0) {
      taxLines.push(`You have ${taxLossHoldings.length} position${taxLossHoldings.length > 1 ? "s" : ""} at a loss totaling ${formatCurrency(totalHarvestable)}.`)
      taxLines.push(`If harvested now, you could offset up to ${formatCurrency(estimatedSaving)} in taxes (est. at 24% bracket).`)
      taxLines.push(`Candidates: ${taxLossHoldings.sort((a, b) => a.totalGain - b.totalGain).slice(0, 3).map((h) => h.symbol).join(", ")}.`)
    } else {
      taxLines.push("✅ No unrealized losses — nothing to harvest right now.")
      taxLines.push(`Your portfolio is up ${formatCurrency(totalGain)} (${formatPercent(totalGainPercent)}) all-time.`)
    }

    return { healthLines, todayLines, alerts, taxLines, diversificationGrade }
  }, [holdings, totalGain, totalGainPercent, todayGain, todayGainPercent])

  if (!insights || holdings.length === 0) return null

  const gradeColor =
    insights.diversificationGrade === "A" ? "text-green-500" :
      insights.diversificationGrade === "B" ? "text-blue-500" :
        insights.diversificationGrade === "C" ? "text-yellow-500" : "text-red-500"

  return (
    <Card className="border-border bg-card">
      <CardContent className="pt-4 pb-4">
        {/* Header */}
        <div className="flex items-center gap-2 mb-4">
          <Lightbulb className="h-5 w-5 text-yellow-500" />
          <h3 className="text-sm font-semibold">AI Portfolio Insights</h3>
          <span className="text-xs text-muted-foreground ml-auto">Based on your current holdings</span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* 📊 Portfolio Health */}
          <div className="rounded-lg bg-muted/40 p-3 space-y-1.5">
            <div className="flex items-center gap-2 mb-1">
              <ShieldCheck className="h-4 w-4 text-blue-500" />
              <span className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Portfolio Health</span>
              <span className={`ml-auto text-sm font-bold ${gradeColor}`}>
                Grade: {insights.diversificationGrade}
              </span>
            </div>
            {insights.healthLines.map((line, i) => (
              <p key={i} className="text-xs text-foreground leading-relaxed">{line}</p>
            ))}
          </div>

          {/* 📈 Today's Impact */}
          <div className="rounded-lg bg-muted/40 p-3 space-y-1.5">
            <div className="flex items-center gap-2 mb-1">
              {todayGain >= 0
                ? <TrendingUp className="h-4 w-4 text-green-500" />
                : <TrendingDown className="h-4 w-4 text-red-500" />
              }
              <span className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Today's Impact</span>
            </div>
            {insights.todayLines.map((line, i) => (
              <p key={i} className="text-xs text-foreground leading-relaxed">{line}</p>
            ))}
          </div>

          {/* ⚠️ Position Alerts */}
          <div className="rounded-lg bg-muted/40 p-3 space-y-1.5">
            <div className="flex items-center gap-2 mb-1">
              <AlertTriangle className="h-4 w-4 text-yellow-500" />
              <span className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Position Alerts</span>
            </div>
            {insights.alerts.map((line, i) => (
              <p key={i} className="text-xs text-foreground leading-relaxed">{line}</p>
            ))}
          </div>

          {/* 💡 Tax Opportunity */}
          <div className="rounded-lg bg-muted/40 p-3 space-y-1.5">
            <div className="flex items-center gap-2 mb-1">
              <Lightbulb className="h-4 w-4 text-purple-500" />
              <span className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Tax Opportunity</span>
            </div>
            {insights.taxLines.map((line, i) => (
              <p key={i} className="text-xs text-foreground leading-relaxed">{line}</p>
            ))}
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
