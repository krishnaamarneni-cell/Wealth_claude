"use client"

import { useMemo } from "react"
import { Card, CardContent } from "@/components/ui/card"
import { TrendingUp, TrendingDown, AlertTriangle, Lightbulb, ShieldCheck } from "lucide-react"

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
  broker?: string
}

interface Props {
  holdings: Holding[]
  totalPortfolioValue: number
  totalGain: number
  totalGainPercent: number
  todayGain: number
  todayGainPercent: number
}

function fmt(v: number) {
  return new Intl.NumberFormat("en-US", { style: "currency", currency: "USD", maximumFractionDigits: 0 }).format(v)
}
function pct(v: number) {
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

    // ── Portfolio Health ──
    const sorted = [...holdings].sort((a, b) => b.allocation - a.allocation)
    const top3Pct = sorted.slice(0, 3).reduce((s, h) => s + (h.allocation || 0), 0)
    const top1 = sorted[0]

    const sectorMap: Record<string, number> = {}
    holdings.forEach((h) => {
      const sec = h.sector || "Unknown"
      sectorMap[sec] = (sectorMap[sec] || 0) + (h.allocation || 0)
    })
    const topSector = Object.entries(sectorMap).sort((a, b) => b[1] - a[1])[0]

    const grade =
      holdings.length >= 15 && top3Pct < 50 ? "A" :
        holdings.length >= 10 && top3Pct < 60 ? "B" :
          holdings.length >= 5 && top3Pct < 75 ? "C" : "D"

    const healthLines: string[] = []
    healthLines.push(`Your top 3 holdings make up ${top3Pct.toFixed(0)}% of the portfolio — ${top3Pct > 60 ? "high concentration." : "within a healthy range."}`)
    if (top1) healthLines.push(`${top1.symbol} is your largest position at ${(top1.allocation || 0).toFixed(1)}%.${(top1.allocation || 0) > 25 ? " Consider if that's intentional." : ""}`)
    if (topSector) healthLines.push(`Biggest sector exposure: ${topSector[0]} at ${topSector[1].toFixed(1)}%.`)
    healthLines.push(`Diversification grade: ${grade} (${holdings.length} positions, ${Object.keys(sectorMap).length} sectors).`)

    // ── Today's Impact ──
    const byDailyGain = [...holdings].sort((a, b) => b.todayGain - a.todayGain)
    const topGainer = byDailyGain[0]
    const topLoser = byDailyGain[byDailyGain.length - 1]

    const todayLines: string[] = []
    todayLines.push(todayGain >= 0
      ? `Your portfolio is up ${fmt(todayGain)} today (${pct(todayGainPercent)}).`
      : `Your portfolio is down ${fmt(Math.abs(todayGain))} today (${pct(todayGainPercent)}).`)
    if (topGainer?.todayGain > 0)
      todayLines.push(`📈 ${topGainer.symbol} leads gains at ${pct(topGainer.todayGainPercent)}, contributing ${fmt(topGainer.todayGain)}.`)
    if (topLoser?.todayGain < 0)
      todayLines.push(`📉 ${topLoser.symbol} is the biggest drag at ${pct(topLoser.todayGainPercent)} (${fmt(topLoser.todayGain)}).`)

    // ── Position Alerts ──
    const alerts: string[] = []
    const oversized = holdings.filter((h) => (h.allocation || 0) > 25)
    const bigWinners = holdings.filter((h) => h.totalGainPercent > 50)
    const bigLosers = holdings.filter((h) => h.totalGainPercent < -20)

    if (oversized.length > 0) alerts.push(`⚠️ ${oversized.map((h) => h.symbol).join(", ")} ${oversized.length === 1 ? "is" : "are"} above 25% — high single-stock risk.`)
    if (bigWinners.length > 0) alerts.push(`🚀 ${bigWinners.map((h) => `${h.symbol} (+${h.totalGainPercent.toFixed(0)}%)`).join(", ")} — up significantly. Review target allocation.`)
    if (bigLosers.length > 0) alerts.push(`🔻 ${bigLosers.map((h) => `${h.symbol} (${h.totalGainPercent.toFixed(0)}%)`).join(", ")} — down over 20%. Worth revisiting the thesis.`)
    if (alerts.length === 0) alerts.push("✅ No major position alerts. All holdings look within normal parameters.")

    // ── Tax Opportunity ──
    const lossHoldings = holdings.filter((h) => h.totalGain < 0)
    const harvestable = lossHoldings.reduce((s, h) => s + Math.abs(h.totalGain), 0)
    const estimatedSaving = harvestable * 0.24
    const taxLines: string[] = []
    if (lossHoldings.length > 0) {
      taxLines.push(`You have ${lossHoldings.length} position${lossHoldings.length > 1 ? "s" : ""} at a loss totaling ${fmt(harvestable)}.`)
      taxLines.push(`If harvested, you could offset ~${fmt(estimatedSaving)} in taxes (est. 24% bracket).`)
      taxLines.push(`Candidates: ${lossHoldings.sort((a, b) => a.totalGain - b.totalGain).slice(0, 3).map((h) => h.symbol).join(", ")}.`)
    } else {
      taxLines.push("✅ No unrealized losses — nothing to harvest right now.")
      taxLines.push(`Your portfolio is up ${fmt(totalGain)} (${pct(totalGainPercent)}) all-time.`)
    }

    return { healthLines, todayLines, alerts, taxLines, grade }
  }, [holdings, totalGain, totalGainPercent, todayGain, todayGainPercent])

  if (!insights) return null

  const gradeColor =
    insights.grade === "A" ? "text-green-500" :
      insights.grade === "B" ? "text-blue-500" :
        insights.grade === "C" ? "text-yellow-500" : "text-red-500"

  return (
    <Card className="border-border bg-card">
      <CardContent className="pt-4 pb-4">
        {/* Header */}
        <div className="flex items-center gap-2 mb-4">
          <Lightbulb className="h-5 w-5 text-yellow-500" />
          <h3 className="text-base font-semibold">AI Portfolio Insights</h3>
          <span className="text-sm text-muted-foreground ml-auto">Based on your current holdings</span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Portfolio Health */}
          <div className="rounded-lg bg-muted/40 p-3 space-y-2">
            <div className="flex items-center gap-2 mb-2">
              <ShieldCheck className="h-4 w-4 text-blue-500" />
              <span className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Portfolio Health</span>
              <span className={`ml-auto text-sm font-bold ${gradeColor}`}>Grade: {insights.grade}</span>
            </div>
            {insights.healthLines.map((line, i) => (
              <p key={i} className="text-sm text-foreground leading-relaxed">{line}</p>
            ))}
          </div>

          {/* Today's Impact */}
          <div className="rounded-lg bg-muted/40 p-3 space-y-2">
            <div className="flex items-center gap-2 mb-2">
              {todayGain >= 0
                ? <TrendingUp className="h-4 w-4 text-green-500" />
                : <TrendingDown className="h-4 w-4 text-red-500" />}
              <span className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Today's Impact</span>
            </div>
            {insights.todayLines.map((line, i) => (
              <p key={i} className="text-sm text-foreground leading-relaxed">{line}</p>
            ))}
          </div>

          {/* Position Alerts */}
          <div className="rounded-lg bg-muted/40 p-3 space-y-2">
            <div className="flex items-center gap-2 mb-2">
              <AlertTriangle className="h-4 w-4 text-yellow-500" />
              <span className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Position Alerts</span>
            </div>
            {insights.alerts.map((line, i) => (
              <p key={i} className="text-sm text-foreground leading-relaxed">{line}</p>
            ))}
          </div>

          {/* Tax Opportunity */}
          <div className="rounded-lg bg-muted/40 p-3 space-y-2">
            <div className="flex items-center gap-2 mb-2">
              <Lightbulb className="h-4 w-4 text-purple-500" />
              <span className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Tax Opportunity</span>
            </div>
            {insights.taxLines.map((line, i) => (
              <p key={i} className="text-sm text-foreground leading-relaxed">{line}</p>
            ))}
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
