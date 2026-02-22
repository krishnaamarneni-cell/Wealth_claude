"use client"

import { useMemo } from "react"
import { Card, CardContent } from "@/components/ui/card"
import { Lightbulb, TrendingUp, TrendingDown, Target, Zap, Shield, BarChart3, DollarSign } from "lucide-react"

// ─── TYPES ────────────────────────────────────────────────────────────────

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

interface Props {
  mode: "portfolio" | "rebalance"
  holdings: Holding[]
  totalPortfolioValue: number
  rebalanceRecommendations?: RebalanceRecommendation[]
  driftScore?: number
  riskScore?: number
}

// ─── CONSTANTS ────────────────────────────────────────────────────────────

const SP500_WEIGHTS: Record<string, number> = {
  "Technology": 29,
  "Financial Services": 13,
  "Healthcare": 12,
  "Consumer Cyclical": 10,
  "Communication Services": 9,
  "Industrials": 8,
  "Consumer Defensive": 6,
  "Energy": 4,
  "Real Estate": 2,
  "Utilities": 2,
  "Basic Materials": 2,
}

const SECTOR_BETA: Record<string, number> = {
  "Technology": 1.3,
  "Communication Services": 1.2,
  "Consumer Cyclical": 1.2,
  "Financial Services": 1.1,
  "Industrials": 1.0,
  "Energy": 0.9,
  "Healthcare": 0.8,
  "Real Estate": 0.8,
  "Consumer Defensive": 0.6,
  "Utilities": 0.5,
  "Basic Materials": 0.9,
}

const DEFENSIVE_SECTORS = ["Healthcare", "Utilities", "Consumer Defensive", "Financial Services"]
const GROWTH_SECTORS = ["Technology", "Communication Services", "Consumer Cyclical"]
const CORRELATED_GROWTH = ["Technology", "Communication Services", "Consumer Cyclical"]

// Blueprint targets per style
const BLUEPRINTS: Record<string, Record<string, number>> = {
  aggressive: {
    "Technology": 35, "Communication Services": 12, "Consumer Cyclical": 12,
    "Healthcare": 15, "Financial Services": 10, "Industrials": 6,
    "Consumer Defensive": 4, "Energy": 3, "Utilities": 2, "Real Estate": 1,
  },
  balanced: {
    "Technology": 25, "Healthcare": 15, "Financial Services": 12,
    "Consumer Cyclical": 10, "Communication Services": 8, "Industrials": 8,
    "Consumer Defensive": 8, "Energy": 5, "Real Estate": 4, "Utilities": 3, "Basic Materials": 2,
  },
  defensive: {
    "Healthcare": 20, "Consumer Defensive": 15, "Financial Services": 15,
    "Technology": 15, "Utilities": 10, "Industrials": 8,
    "Consumer Cyclical": 6, "Communication Services": 5, "Energy": 4, "Real Estate": 2,
  },
  income: {
    "Financial Services": 20, "Consumer Defensive": 15, "Utilities": 12,
    "Healthcare": 12, "Technology": 12, "Real Estate": 10,
    "Energy": 7, "Industrials": 6, "Communication Services": 4, "Consumer Cyclical": 2,
  },
}

// ─── HELPERS ──────────────────────────────────────────────────────────────

function fmt(v: number) {
  return new Intl.NumberFormat("en-US", { style: "currency", currency: "USD", maximumFractionDigits: 0 }).format(v)
}

function buildSectorMap(holdings: Holding[]): Record<string, number> {
  const map: Record<string, number> = {}
  holdings.forEach((h) => {
    const sec = h.sector || "Unknown"
    map[sec] = (map[sec] || 0) + h.allocation
  })
  return map
}

function detectStyle(sectorMap: Record<string, number>): "aggressive" | "balanced" | "defensive" | "income" | "mixed" {
  const growthPct = GROWTH_SECTORS.reduce((s, sec) => s + (sectorMap[sec] || 0), 0)
  const defensivePct = DEFENSIVE_SECTORS.reduce((s, sec) => s + (sectorMap[sec] || 0), 0)
  const financialPct = sectorMap["Financial Services"] || 0
  const utilPct = sectorMap["Utilities"] || 0
  const defConsumer = sectorMap["Consumer Defensive"] || 0

  if (growthPct > 55) return "aggressive"
  if (growthPct >= 35 && defensivePct >= 15) return "balanced"
  if (defensivePct > 35) return "defensive"
  if (financialPct + utilPct + defConsumer > 35) return "income"
  return "mixed"
}

function calcPortfolioBeta(sectorMap: Record<string, number>): number {
  let beta = 0
  let totalPct = 0
  Object.entries(sectorMap).forEach(([sector, pct]) => {
    const sectorBeta = SECTOR_BETA[sector] || 1.0
    beta += (pct / 100) * sectorBeta
    totalPct += pct
  })
  return totalPct > 0 ? beta : 1.0
}

// ─── PORTFOLIO MODE INSIGHTS ──────────────────────────────────────────────

function usePortfolioInsights(holdings: Holding[]) {
  return useMemo(() => {
    if (!holdings || holdings.length === 0) return null

    const sectorMap = buildSectorMap(holdings)
    const style = detectStyle(sectorMap)
    const assetMap: Record<string, number> = {}
    holdings.forEach((h) => {
      const a = h.assetType || "Stock"
      assetMap[a] = (assetMap[a] || 0) + h.allocation
    })

    const topSectors = Object.entries(sectorMap).sort((a, b) => b[1] - a[1]).slice(0, 3)
    const growthPct = GROWTH_SECTORS.reduce((s, sec) => s + (sectorMap[sec] || 0), 0)
    const defPct = DEFENSIVE_SECTORS.reduce((s, sec) => s + (sectorMap[sec] || 0), 0)
    const etfPct = assetMap["ETF"] || 0
    const stockPct = assetMap["Stock"] || 0

    // ── Q1: Character vs S&P ──
    const styleLabel: Record<string, string> = {
      aggressive: "🚀 Aggressive Growth",
      balanced: "⚖️ Balanced Growth",
      defensive: "🛡️ Defensive",
      income: "💰 Income-Oriented",
      mixed: "🌐 Diversified Mixed",
    }

    // Find biggest deviations from S&P
    const deviations = Object.entries(SP500_WEIGHTS)
      .map(([sector, spWeight]) => ({
        sector,
        yours: sectorMap[sector] || 0,
        sp500: spWeight,
        diff: (sectorMap[sector] || 0) - spWeight,
      }))
      .sort((a, b) => Math.abs(b.diff) - Math.abs(a.diff))
      .slice(0, 3)

    const biggestOver = deviations.find((d) => d.diff > 3)
    const biggestUnder = deviations.find((d) => d.diff < -3)

    const characterLines: string[] = [
      `${styleLabel[style]} — ${growthPct.toFixed(0)}% growth sectors, ${defPct.toFixed(0)}% defensive.`,
      `Top sectors: ${topSectors.map(([s, v]) => `${s} (${v.toFixed(0)}%)`).join(", ")}.`,
    ]
    if (biggestOver) {
      characterLines.push(
        `vs S&P 500: ${biggestOver.diff > 0 ? "+" : ""}${biggestOver.diff.toFixed(0)}% ${biggestOver.sector} (you: ${biggestOver.yours.toFixed(0)}%, S&P: ${biggestOver.sp500}%).`
      )
    }
    if (biggestUnder) {
      characterLines.push(
        `Underweight vs S&P: ${biggestUnder.sector} (you: ${biggestUnder.yours.toFixed(0)}%, S&P: ${biggestUnder.sp500}%) — a gap of ${Math.abs(biggestUnder.diff).toFixed(0)}%.`
      )
    }

    // ── Q2: Volatility Profile ──
    const beta = calcPortfolioBeta(sectorMap)
    const volatilityLabel = beta >= 1.25 ? "🔴 High" : beta >= 1.05 ? "🟡 Medium" : "🟢 Low"
    const drop10 = (beta * 10).toFixed(1)
    const drop20 = (beta * 20).toFixed(1)
    const corrCluster = CORRELATED_GROWTH.reduce((s, sec) => s + (sectorMap[sec] || 0), 0)

    const volatilityLines: string[] = [
      `Volatility: ${volatilityLabel} — estimated beta ${beta.toFixed(2)}x vs S&P 500.`,
      `In a 10% market drop → your portfolio historically drops ~${drop10}%. In a 20% crash → ~${drop20}%.`,
    ]
    if (corrCluster > 40) {
      volatilityLines.push(
        `⚠️ ${corrCluster.toFixed(0)}% in correlated growth cluster (Tech + Comm + Cyclical) — they tend to fall together in downturns.`
      )
    } else {
      volatilityLines.push(`Correlated growth cluster (Tech + Comm + Cyclical) is at ${corrCluster.toFixed(0)}% — within a reasonable range.`)
    }

    // ── Q3: Defensive Coverage ──
    const defBreakdown = DEFENSIVE_SECTORS
      .filter((s) => (sectorMap[s] || 0) > 0)
      .map((s) => `${s} ${(sectorMap[s] || 0).toFixed(0)}%`)
      .join(", ")
    const missingDefensive = DEFENSIVE_SECTORS.filter((s) => !sectorMap[s] || sectorMap[s] < 1)

    let defRating = ""
    if (defPct >= 30) defRating = "🟢 Strong"
    else if (defPct >= 20) defRating = "🟡 Moderate"
    else if (defPct >= 10) defRating = "🟠 Weak"
    else defRating = "🔴 Minimal"

    const defensiveLines: string[] = [
      `Defensive coverage: ${defRating} (${defPct.toFixed(0)}% vs recommended 25–35%).`,
      defBreakdown ? `Covered by: ${defBreakdown}.` : "No defensive sectors in portfolio.",
    ]
    if (missingDefensive.length > 0 && defPct < 20) {
      defensiveLines.push(`Missing entirely: ${missingDefensive.slice(0, 2).join(", ")} — consider adding for downside protection.`)
    }
    if (defPct >= 25) {
      defensiveLines.push("Portfolio has a meaningful cushion if growth sectors sell off.")
    } else {
      defensiveLines.push(`Each 10% growth sector drop impacts you ~${(growthPct / 10).toFixed(1)}x harder than a well-hedged portfolio.`)
    }

    // ── Q4: Asset Type Intelligence ──
    const countryMap: Record<string, number> = {}
    holdings.forEach((h) => {
      const c = h.country || "US"
      countryMap[c] = (countryMap[c] || 0) + h.allocation
    })
    const usPct = countryMap["US"] || countryMap["United States"] || 0
    const intlPct = 100 - usPct - (assetMap["Cash"] || 0)

    const assetLines: string[] = [
      `Asset mix: ${stockPct.toFixed(0)}% individual stocks, ${etfPct.toFixed(0)}% ETFs, ${Object.entries(assetMap).filter(([k]) => k !== "Stock" && k !== "ETF").map(([k, v]) => `${v.toFixed(0)}% ${k}`).join(", ") || "0% other"}.`,
    ]
    if (etfPct === 0) {
      assetLines.push("⚠️ No ETFs — 100% active stock picking. Historically 85% of active portfolios underperform index ETFs over 10 years.")
    } else if (etfPct > 60) {
      assetLines.push(`${etfPct.toFixed(0)}% ETFs — mostly passive. Low cost, broad exposure but limited alpha potential.`)
    } else {
      assetLines.push(`Healthy ${etfPct.toFixed(0)}% ETF foundation with ${stockPct.toFixed(0)}% active stock picks on top.`)
    }
    if (intlPct < 5 && usPct > 90) {
      assetLines.push("⚠️ Near-zero international exposure — global markets are 60% of world market cap outside the US.")
    } else if (intlPct > 0) {
      assetLines.push(`~${intlPct.toFixed(0)}% international exposure — some global diversification present.`)
    }

    return { characterLines, volatilityLines, defensiveLines, assetLines }
  }, [holdings])
}

// ─── REBALANCE MODE INSIGHTS ──────────────────────────────────────────────

function useRebalanceInsights(
  holdings: Holding[],
  recommendations: RebalanceRecommendation[],
  driftScore: number
) {
  return useMemo(() => {
    if (!holdings || holdings.length === 0) return null

    const sectorMap = buildSectorMap(holdings)
    const style = detectStyle(sectorMap)
    const blueprint = BLUEPRINTS[style] || BLUEPRINTS["balanced"]

    // ── Q1: Sector Over/Under Map ──
    const sectorDiffs = Object.entries(SP500_WEIGHTS).map(([sector, spWeight]) => ({
      sector,
      yours: sectorMap[sector] || 0,
      sp500: spWeight,
      blueprint: blueprint[sector] || 0,
      diff: (sectorMap[sector] || 0) - spWeight,
    })).sort((a, b) => Math.abs(b.diff) - Math.abs(a.diff))

    const overweight = sectorDiffs.filter((d) => d.diff > 5).slice(0, 3)
    const underweight = sectorDiffs.filter((d) => d.diff < -5).slice(0, 3)
    const missing = sectorDiffs.filter((d) => d.yours === 0 && d.sp500 >= 6).slice(0, 2)

    const sectorMapLines: string[] = []
    if (overweight.length > 0) {
      overweight.forEach((d) => {
        sectorMapLines.push(
          `🔴 ${d.sector}: ${d.yours.toFixed(0)}% (S&P: ${d.sp500}%) → overweight by ${d.diff.toFixed(0)}%.`
        )
      })
    }
    if (underweight.length > 0) {
      underweight.forEach((d) => {
        sectorMapLines.push(
          `🔵 ${d.sector}: ${d.yours.toFixed(0)}% (S&P: ${d.sp500}%) → underweight by ${Math.abs(d.diff).toFixed(0)}%.`
        )
      })
    }
    if (missing.length > 0) {
      sectorMapLines.push(`⚪ Missing entirely: ${missing.map((d) => `${d.sector} (S&P: ${d.sp500}%)`).join(", ")}.`)
    }
    if (sectorMapLines.length === 0) {
      sectorMapLines.push("✅ Sector weights are broadly aligned with the S&P 500 benchmark.")
    }

    // ── Q2: Rebalance Priority ──
    const corrCluster = CORRELATED_GROWTH.reduce((s, sec) => s + (sectorMap[sec] || 0), 0)
    const defPct = DEFENSIVE_SECTORS.reduce((s, sec) => s + (sectorMap[sec] || 0), 0)
    const missingDefSec = DEFENSIVE_SECTORS.filter((s) => !sectorMap[s] || sectorMap[s] < 1)

    const priorityLines: string[] = []

    // Build priority order
    const priorities: string[] = []
    if (missing.length > 0) {
      priorities.push(`1️⃣ Add ${missing[0].sector} exposure — completely absent from your portfolio`)
    }
    if (overweight.length > 0) {
      priorities.push(`2️⃣ Reduce ${overweight[0].sector} by ~${overweight[0].diff.toFixed(0)}% to move toward balance`)
    }
    if (underweight.length > 0) {
      priorities.push(`3️⃣ Grow ${underweight[0].sector} position — ${Math.abs(underweight[0].diff).toFixed(0)}% below benchmark`)
    }
    if (priorities.length === 0) {
      priorityLines.push("✅ No urgent sector changes — focus on individual position drift using the recommendations table.")
    } else {
      priorities.forEach((p) => priorityLines.push(p))
    }

    if (corrCluster > 45) {
      priorityLines.push(
        `⚠️ ${corrCluster.toFixed(0)}% in correlated growth cluster (Tech + Comm + Cyclical) increases priority to add uncorrelated sectors.`
      )
    }

    // ── Q3: Correlation Cluster ──
    const clusterLines: string[] = []
    const clusterPct = CORRELATED_GROWTH.reduce((s, sec) => s + (sectorMap[sec] || 0), 0)
    const clusterBreakdown = CORRELATED_GROWTH
      .filter((s) => (sectorMap[s] || 0) > 0)
      .map((s) => `${s} ${(sectorMap[s] || 0).toFixed(0)}%`)
      .join(" + ")

    if (clusterPct > 50) {
      clusterLines.push(`🔴 High cluster risk — ${clusterBreakdown} = ${clusterPct.toFixed(0)}% in one correlated block.`)
      clusterLines.push("In 2022, this exact cluster fell 35–45% together while defensive sectors stayed flat.")
      clusterLines.push("Effective diversification is lower than your position count suggests.")
    } else if (clusterPct > 35) {
      clusterLines.push(`🟡 Moderate cluster risk — ${clusterPct.toFixed(0)}% in correlated growth (${clusterBreakdown}).`)
      clusterLines.push("Some exposure to correlated drawdowns — consider adding uncorrelated sectors.")
    } else {
      clusterLines.push(`🟢 Low cluster risk — ${clusterPct.toFixed(0)}% in correlated growth sectors.`)
      clusterLines.push("Good spread across uncorrelated sectors reduces drawdown risk significantly.")
    }

    // ── Q4: Blueprint Comparison ──
    const styleLabel: Record<string, string> = {
      aggressive: "Aggressive Growth",
      balanced: "Balanced Growth",
      defensive: "Defensive",
      income: "Income-Oriented",
      mixed: "Diversified Mixed",
    }

    const blueprintDiffs = Object.entries(blueprint)
      .map(([sector, target]) => ({
        sector,
        yours: sectorMap[sector] || 0,
        target,
        diff: (sectorMap[sector] || 0) - target,
      }))
      .sort((a, b) => Math.abs(b.diff) - Math.abs(a.diff))
      .slice(0, 4)

    const blueprintLines: string[] = [
      `Detected style: ${styleLabel[style]}. Ideal blueprint for this style:`,
    ]
    blueprintDiffs.forEach((d) => {
      const status = Math.abs(d.diff) <= 3
        ? `✅ On target`
        : d.diff > 0
          ? `🔴 ${d.diff.toFixed(0)}% over`
          : `🔵 ${Math.abs(d.diff).toFixed(0)}% under`
      blueprintLines.push(`${d.sector}: you ${d.yours.toFixed(0)}% vs ideal ${d.target}% — ${status}`)
    })

    return { sectorMapLines, priorityLines, clusterLines, blueprintLines }
  }, [holdings, recommendations, driftScore])
}

// ─── MAIN COMPONENT ───────────────────────────────────────────────────────

export default function PortfolioAIInsight({
  mode,
  holdings,
  totalPortfolioValue,
  rebalanceRecommendations = [],
  driftScore = 100,
  riskScore = 100,
}: Props) {
  const portfolioInsights = usePortfolioInsights(mode === "portfolio" ? holdings : [])
  const rebalanceInsights = useRebalanceInsights(
    mode === "rebalance" ? holdings : [],
    rebalanceRecommendations,
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
            {mode === "portfolio"
              ? "Sector allocation vs S&P 500 benchmark"
              : "Sector distribution & rebalance guidance"}
          </span>
        </div>

        {/* ── PORTFOLIO MODE ── */}
        {mode === "portfolio" && portfolioInsights && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Q1 — Character vs S&P */}
            <div className="rounded-lg bg-muted/40 p-3 space-y-2">
              <div className="flex items-center gap-2 mb-2">
                <Zap className="h-4 w-4 text-yellow-500" />
                <span className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                  Portfolio Character vs S&P 500
                </span>
              </div>
              {portfolioInsights.characterLines.map((line, i) => (
                <p key={i} className="text-sm text-foreground leading-relaxed">{line}</p>
              ))}
            </div>

            {/* Q2 — Volatility Profile */}
            <div className="rounded-lg bg-muted/40 p-3 space-y-2">
              <div className="flex items-center gap-2 mb-2">
                <TrendingUp className="h-4 w-4 text-orange-500" />
                <span className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                  Volatility Profile
                </span>
              </div>
              {portfolioInsights.volatilityLines.map((line, i) => (
                <p key={i} className="text-sm text-foreground leading-relaxed">{line}</p>
              ))}
            </div>

            {/* Q3 — Defensive Coverage */}
            <div className="rounded-lg bg-muted/40 p-3 space-y-2">
              <div className="flex items-center gap-2 mb-2">
                <Shield className="h-4 w-4 text-blue-500" />
                <span className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                  Defensive Coverage
                </span>
              </div>
              {portfolioInsights.defensiveLines.map((line, i) => (
                <p key={i} className="text-sm text-foreground leading-relaxed">{line}</p>
              ))}
            </div>

            {/* Q4 — Asset Type Intelligence */}
            <div className="rounded-lg bg-muted/40 p-3 space-y-2">
              <div className="flex items-center gap-2 mb-2">
                <BarChart3 className="h-4 w-4 text-purple-500" />
                <span className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                  Asset Type Intelligence
                </span>
              </div>
              {portfolioInsights.assetLines.map((line, i) => (
                <p key={i} className="text-sm text-foreground leading-relaxed">{line}</p>
              ))}
            </div>
          </div>
        )}

        {/* ── REBALANCE MODE ── */}
        {mode === "rebalance" && rebalanceInsights && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Q1 — Sector Over/Under Map */}
            <div className="rounded-lg bg-muted/40 p-3 space-y-2">
              <div className="flex items-center gap-2 mb-2">
                <BarChart3 className="h-4 w-4 text-blue-500" />
                <span className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                  Sector Over / Underweight Map
                </span>
              </div>
              {rebalanceInsights.sectorMapLines.map((line, i) => (
                <p key={i} className="text-sm text-foreground leading-relaxed">{line}</p>
              ))}
            </div>

            {/* Q2 — Rebalance Priority */}
            <div className="rounded-lg bg-muted/40 p-3 space-y-2">
              <div className="flex items-center gap-2 mb-2">
                <Target className="h-4 w-4 text-green-500" />
                <span className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                  Rebalance Priority Order
                </span>
              </div>
              {rebalanceInsights.priorityLines.map((line, i) => (
                <p key={i} className="text-sm text-foreground leading-relaxed">{line}</p>
              ))}
            </div>

            {/* Q3 — Correlation Cluster */}
            <div className="rounded-lg bg-muted/40 p-3 space-y-2">
              <div className="flex items-center gap-2 mb-2">
                <TrendingDown className="h-4 w-4 text-red-500" />
                <span className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                  Correlation Cluster Risk
                </span>
              </div>
              {rebalanceInsights.clusterLines.map((line, i) => (
                <p key={i} className="text-sm text-foreground leading-relaxed">{line}</p>
              ))}
            </div>

            {/* Q4 — Blueprint Comparison */}
            <div className="rounded-lg bg-muted/40 p-3 space-y-2">
              <div className="flex items-center gap-2 mb-2">
                <Zap className="h-4 w-4 text-yellow-500" />
                <span className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                  Ideal Blueprint Comparison
                </span>
              </div>
              {rebalanceInsights.blueprintLines.map((line, i) => (
                <p key={i} className="text-sm text-foreground leading-relaxed">{line}</p>
              ))}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  )
}
