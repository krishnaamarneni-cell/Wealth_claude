"use client"

import { useMemo } from "react"
import { Card, CardContent } from "@/components/ui/card"
import { DollarSign, TrendingUp, Calendar, Lightbulb, AlertTriangle } from "lucide-react"

interface TopPayer {
  symbol: string
  total: number
  count: number
}

interface UpcomingDividend {
  date: string
  totalAmount: number
  symbol: string
}

interface MonthlyData {
  month: string
  received: number
  upcoming: number
  total: number
}

interface Props {
  ytdDividends: number
  annualProjection: number
  avgMonthlyIncome: number
  avgDailyIncome: number
  yoyGrowthRate: number
  fiveYearProjection: number
  portfolioYield: number
  yieldOnCost: number
  upcomingDividends: UpcomingDividend[]
  topPayers: TopPayer[]
  monthlyChartData: MonthlyData[]
  totalReceived: number
}

function fmt(v: number) {
  return new Intl.NumberFormat("en-US", { style: "currency", currency: "USD", maximumFractionDigits: 0 }).format(v)
}
function fmtExact(v: number) {
  return new Intl.NumberFormat("en-US", { style: "currency", currency: "USD", minimumFractionDigits: 2, maximumFractionDigits: 2 }).format(v)
}

export default function DividendsAIInsight({
  ytdDividends,
  annualProjection,
  avgMonthlyIncome,
  avgDailyIncome,
  yoyGrowthRate,
  fiveYearProjection,
  portfolioYield,
  yieldOnCost,
  upcomingDividends,
  topPayers,
  monthlyChartData,
  totalReceived,
}: Props) {
  const insights = useMemo(() => {
    const now = new Date()

    // ── Income Snapshot ──
    const incomeLines: string[] = []
    incomeLines.push(`You're earning ~${fmtExact(avgDailyIncome)}/day and ~${fmt(avgMonthlyIncome)}/month in dividends just from holding.`)
    const monthsElapsed = now.getMonth() + 1
    const ytdPace = monthsElapsed > 0 ? (ytdDividends / monthsElapsed) * 12 : 0
    if (ytdPace > 0) incomeLines.push(`At your YTD pace, you're on track for ${fmt(ytdPace)} this year vs. ${fmt(annualProjection)} projected.`)
    if (totalReceived > 0) incomeLines.push(`Total dividends received all-time: ${fmt(totalReceived)}.`)

    // ── Upcoming Income ──
    const thirtyDaysOut = new Date()
    thirtyDaysOut.setDate(thirtyDaysOut.getDate() + 30)
    const next30 = (upcomingDividends || []).filter((d) => new Date(d.date) <= thirtyDaysOut)
    const next30Total = next30.reduce((s, d) => s + d.totalAmount, 0)

    const upcomingByMonth: Record<string, number> = {}
      ; (upcomingDividends || []).forEach((d) => {
        const month = d.date.substring(0, 7)
        upcomingByMonth[month] = (upcomingByMonth[month] || 0) + d.totalAmount
      })
    const heaviestMonth = Object.entries(upcomingByMonth).sort((a, b) => b[1] - a[1])[0]

    const upcomingLines: string[] = []
    if (next30.length > 0) {
      upcomingLines.push(`${next30.length} payment${next30.length > 1 ? "s" : ""} expected in the next 30 days totaling ${fmtExact(next30Total)}.`)
    } else {
      upcomingLines.push("No dividend payments expected in the next 30 days.")
    }
    if (heaviestMonth) {
      const [year, month] = heaviestMonth[0].split("-")
      const monthName = new Date(parseInt(year), parseInt(month) - 1).toLocaleString("en-US", { month: "long", year: "numeric" })
      upcomingLines.push(`Heaviest upcoming month: ${monthName} with ${fmtExact(heaviestMonth[1])} projected.`)
    }
    if ((upcomingDividends || []).length > 0) {
      upcomingLines.push(`${upcomingDividends.length} total upcoming payments scheduled.`)
    }

    // ── Growth Trend ──
    const growthLines: string[] = []
    if (yoyGrowthRate > 0) {
      growthLines.push(`Your dividend income is growing at ${yoyGrowthRate.toFixed(1)}% year-over-year — a strong trend.`)
    } else if (yoyGrowthRate < 0) {
      growthLines.push(`Dividend income is down ${Math.abs(yoyGrowthRate).toFixed(1)}% YoY. May reflect fewer payers or reduced positions.`)
    } else {
      growthLines.push("Not enough data to calculate year-over-year growth yet.")
    }
    if (fiveYearProjection > 0 && annualProjection > 0) {
      growthLines.push(`At current growth, your income could reach ${fmt(fiveYearProjection)}/year in 5 years.`)
    }
    if ((topPayers || []).length > 0) {
      growthLines.push(`Top income driver: ${topPayers[0].symbol} with ${fmt(topPayers[0].total)} received.`)
    }

    // ── Yield Quality ──
    const yieldLines: string[] = []
    if (yieldOnCost > portfolioYield && portfolioYield > 0) {
      yieldLines.push(`Your yield on cost (${yieldOnCost.toFixed(2)}%) exceeds current portfolio yield (${portfolioYield.toFixed(2)}%) — long-term compounding at work.`)
    } else if (portfolioYield > 0) {
      yieldLines.push(`Current portfolio yield: ${portfolioYield.toFixed(2)}%. Yield on cost: ${yieldOnCost.toFixed(2)}%.`)
    }
    if (portfolioYield > 5) {
      yieldLines.push(`⚠️ Yield above 5% can signal a dividend at risk of being cut. Worth checking payout ratios.`)
    } else if (portfolioYield > 0) {
      yieldLines.push("Your yield is in a healthy range — meaningful but not dangerously high.")
    }
    if ((topPayers || []).length >= 2) {
      yieldLines.push(`Top 3 payers: ${topPayers.slice(0, 3).map((p) => p.symbol).join(", ")} — together they drive most of your income.`)
    }

    return { incomeLines, upcomingLines, growthLines, yieldLines }
  }, [ytdDividends, annualProjection, avgMonthlyIncome, avgDailyIncome, yoyGrowthRate, fiveYearProjection, portfolioYield, yieldOnCost, upcomingDividends, topPayers, totalReceived])

  if (!insights) return null

  return (
    <Card className="border-border bg-card">
      <CardContent className="pt-4 pb-4">
        {/* Header */}
        <div className="flex items-center gap-2 mb-4">
          <Lightbulb className="h-5 w-5 text-yellow-500" />
          <h3 className="text-sm font-semibold">AI Dividend Insights</h3>
          <span className="text-xs text-muted-foreground ml-auto">Based on your dividend history & projections</span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Income Snapshot */}
          <div className="rounded-lg bg-muted/40 p-3 space-y-1.5">
            <div className="flex items-center gap-2 mb-1">
              <DollarSign className="h-4 w-4 text-green-500" />
              <span className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Income Snapshot</span>
            </div>
            {insights.incomeLines.map((line, i) => (
              <p key={i} className="text-xs text-foreground leading-relaxed">{line}</p>
            ))}
          </div>

          {/* Upcoming Income */}
          <div className="rounded-lg bg-muted/40 p-3 space-y-1.5">
            <div className="flex items-center gap-2 mb-1">
              <Calendar className="h-4 w-4 text-blue-500" />
              <span className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Upcoming Income</span>
            </div>
            {insights.upcomingLines.map((line, i) => (
              <p key={i} className="text-xs text-foreground leading-relaxed">{line}</p>
            ))}
          </div>

          {/* Growth Trend */}
          <div className="rounded-lg bg-muted/40 p-3 space-y-1.5">
            <div className="flex items-center gap-2 mb-1">
              <TrendingUp className="h-4 w-4 text-purple-500" />
              <span className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Growth Trend</span>
            </div>
            {insights.growthLines.map((line, i) => (
              <p key={i} className="text-xs text-foreground leading-relaxed">{line}</p>
            ))}
          </div>

          {/* Yield Quality */}
          <div className="rounded-lg bg-muted/40 p-3 space-y-1.5">
            <div className="flex items-center gap-2 mb-1">
              <AlertTriangle className="h-4 w-4 text-orange-500" />
              <span className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Yield Quality</span>
            </div>
            {insights.yieldLines.map((line, i) => (
              <p key={i} className="text-xs text-foreground leading-relaxed">{line}</p>
            ))}
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
