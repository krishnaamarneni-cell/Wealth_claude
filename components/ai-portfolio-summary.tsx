"use client"

import { useEffect, useState } from "react"
import { Card, CardContent } from "@/components/ui/card"
import { Sparkles, RefreshCw, TrendingUp, TrendingDown, Minus } from "lucide-react"
import { usePortfolio } from "@/lib/portfolio-context"

// ==================== HELPERS ====================

function pickRandom<T>(arr: T[]): T {
  return arr[Math.floor(Math.random() * arr.length)]
}

function fmtDollar(v: number): string {
  try {
    const abs = Math.abs(v)
    if (abs >= 1000) return `$${(abs / 1000).toFixed(1)}k`
    return `$${abs.toFixed(0)}`
  } catch {
    return '$0'
  }
}

function fmtPct(v: number): string {
  try {
    return `${v >= 0 ? '+' : ''}${v.toFixed(2)}%`
  } catch {
    return '0.00%'
  }
}

// ==================== SENTENCE GENERATORS ====================

function getSentence1(pct: number, dollar: number): string {
  try {
    if (pct >= 2.0) return pickRandom([
      `Excellent session — your portfolio surged ${fmtPct(pct)}, adding ${fmtDollar(dollar)} in a single day.`,
      `Strong day — your portfolio jumped ${fmtPct(pct)}, gaining ${fmtDollar(dollar)} today.`,
      `Outstanding — your portfolio climbed ${fmtPct(pct)}, putting ${fmtDollar(dollar)} back in your pocket.`,
    ])
    if (pct >= 0.5) return pickRandom([
      `Solid day — your portfolio gained ${fmtPct(pct)}, adding ${fmtDollar(dollar)} to your total value.`,
      `Your portfolio moved higher today, up ${fmtPct(pct)} for a gain of ${fmtDollar(dollar)}.`,
      `Good session — your holdings climbed ${fmtPct(pct)}, bringing in ${fmtDollar(dollar)} today.`,
    ])
    if (pct >= 0.1) return pickRandom([
      `Quiet but positive — your portfolio edged up ${fmtPct(pct)}, gaining ${fmtDollar(dollar)} today.`,
      `A steady session — modest gains of ${fmtPct(pct)}, adding ${fmtDollar(dollar)}.`,
      `Small win today — your portfolio crept up ${fmtPct(pct)}.`,
    ])
    if (pct >= -0.1) return pickRandom([
      `Flat session today — your portfolio barely moved, finishing near unchanged.`,
      `A quiet day — your portfolio held its ground, moving just ${fmtPct(pct)}.`,
      `Not much action today — your portfolio stayed nearly flat.`,
    ])
    if (pct >= -0.5) return pickRandom([
      `Small step back — your portfolio dipped ${fmtPct(pct)}, losing ${fmtDollar(dollar)} today.`,
      `Mild pressure today — your portfolio slipped ${fmtPct(pct)}.`,
      `Minor headwinds — your portfolio fell ${fmtPct(pct)}, giving back ${fmtDollar(dollar)}.`,
    ])
    if (pct >= -2.0) return pickRandom([
      `Tough session — your portfolio dropped ${fmtPct(pct)}, losing ${fmtDollar(dollar)} today.`,
      `Rough day — your portfolio fell ${fmtPct(pct)}, shedding ${fmtDollar(dollar)}.`,
      `Markets weighed on your portfolio — down ${fmtPct(pct)}, losing ${fmtDollar(dollar)}.`,
    ])
    return pickRandom([
      `Difficult day — your portfolio took a hard hit, down ${fmtPct(pct)} losing ${fmtDollar(dollar)}.`,
      `Sharp selloff — your portfolio dropped ${fmtPct(pct)}, losing ${fmtDollar(dollar)}.`,
      `One of those days — your portfolio fell ${fmtPct(pct)}, giving back ${fmtDollar(dollar)}.`,
    ])
  } catch {
    return `Your portfolio moved ${fmtPct(pct)} today.`
  }
}

function getSentence2(
  gainers: number,
  losers: number,
  total: number,
  topSector: string,
  topPct: number,
  worstSector: string,
  worstPct: number
): string {
  try {
    const hasGood = topSector.length > 0 && topPct > 0.3
    const hasBad = worstSector.length > 0 && worstPct < -0.3

    if (hasGood && hasBad) return pickRandom([
      `${topSector} led your sectors with ${fmtPct(topPct)}, while ${worstSector} held you back at ${fmtPct(worstPct)}.`,
      `${worstSector} was the drag at ${fmtPct(worstPct)}, offset by strength in ${topSector} (${fmtPct(topPct)}).`,
      `Mixed bag — ${topSector} added ${fmtPct(topPct)} while ${worstSector} pulled ${fmtPct(worstPct)}.`,
    ])
    if (hasGood) return pickRandom([
      `${topSector} was your standout sector today, gaining ${fmtPct(topPct)}.`,
      `Your ${topSector} exposure paid off — up ${fmtPct(topPct)}, your best-performing sector.`,
      `${topSector} carried the day, climbing ${fmtPct(topPct)}.`,
    ])
    if (hasBad) return pickRandom([
      `${worstSector} was the main drag today, falling ${fmtPct(worstPct)}.`,
      `Your ${worstSector} exposure cost you — down ${fmtPct(worstPct)}, your weakest sector.`,
      `${worstSector} pulled your portfolio lower, dropping ${fmtPct(worstPct)}.`,
    ])
    const ratio = total > 0 ? gainers / total : 0.5
    if (ratio >= 0.6) return pickRandom([
      `${gainers} of your ${total} holdings finished in the green — broad-based strength today.`,
      `Wide rally — ${gainers} out of ${total} stocks gained today.`,
      `Most of your holdings moved higher — ${gainers} gainers vs ${losers} losers.`,
    ])
    if (ratio <= 0.4) return pickRandom([
      `Only ${gainers} of your ${total} holdings managed a gain today.`,
      `Broad weakness — just ${gainers} stocks rose while ${losers} fell.`,
      `${losers} of your ${total} stocks lost ground today.`,
    ])
    return pickRandom([
      `Your holdings were evenly split — ${gainers} gainers and ${losers} losers today.`,
      `Balanced session — ${gainers} stocks rose while ${losers} declined.`,
      `Mixed signals across your ${total} holdings — ${gainers} up, ${losers} down.`,
    ])
  } catch {
    return `You had ${gainers} gainers and ${losers} losers today.`
  }
}

function getSentence3(
  bestSymbol: string,
  bestPct: number,
  worstSymbol: string,
  worstPct: number,
  todayPct: number,
  allTimePct: number
): string {
  try {
    const hasBest = bestSymbol.length > 0 && bestPct > 0.3
    const hasWorst = worstSymbol.length > 0 && worstPct < -0.3

    if (hasBest && hasWorst) {
      if (todayPct >= 0) return pickRandom([
        `${bestSymbol} was your star today, jumping ${fmtPct(bestPct)} — keep an eye on ${worstSymbol} (${fmtPct(worstPct)}).`,
        `${bestSymbol} led your gainers at ${fmtPct(bestPct)}, offsetting weakness in ${worstSymbol} (${fmtPct(worstPct)}).`,
      ])
      return pickRandom([
        `${worstSymbol} dragged most at ${fmtPct(worstPct)}, though ${bestSymbol} bucked the trend at ${fmtPct(bestPct)}.`,
        `Despite the dip, ${bestSymbol} gained ${fmtPct(bestPct)} — ${worstSymbol} was the main laggard at ${fmtPct(worstPct)}.`,
      ])
    }
    if (hasBest) return pickRandom([
      `${bestSymbol} was your top performer today, gaining ${fmtPct(bestPct)}.`,
      `${bestSymbol} stood out with a ${fmtPct(bestPct)} gain — your best holding today.`,
    ])
    if (hasWorst) return pickRandom([
      `${worstSymbol} was the notable laggard, falling ${fmtPct(worstPct)} today.`,
      `Keep an eye on ${worstSymbol} — it slipped ${fmtPct(worstPct)}, your weakest holding today.`,
    ])
    if (allTimePct >= 0) return pickRandom([
      `Overall your portfolio is up ${fmtPct(allTimePct)} since you started — stay the course.`,
      `All-time you're up ${fmtPct(allTimePct)} — keep building.`,
    ])
    return pickRandom([
      `Your portfolio is down ${fmtPct(allTimePct)} overall — consider reviewing your allocation.`,
      `Long-term you're down ${fmtPct(allTimePct)} — a diversification review might help.`,
    ])
  } catch {
    return `Keep an eye on your holdings for opportunities.`
  }
}

// ==================== MAIN COMPONENT ====================

export default function AIPortfolioSummary() {
  const { holdings, performance, totalGainPercent } = usePortfolio()

  const [mounted, setMounted] = useState(false)
  const [lines, setLines] = useState<string[]>(['', '', ''])
  const [displayed, setDisplayed] = useState<string[]>(['', '', ''])
  const [typingDone, setTypingDone] = useState(false)
  const [refreshKey, setRefreshKey] = useState(0)
  const [isWeekend, setIsWeekend] = useState(false)

  // Step 1: mount guard
  useEffect(() => {
    setMounted(true)
    try {
      const est = new Date(
        new Date().toLocaleString('en-US', { timeZone: 'America/New_York' })
      )
      setIsWeekend(est.getDay() === 0 || est.getDay() === 6)
    } catch { }
  }, [])

  // Step 2: build sentences only after mount + holdings loaded
  useEffect(() => {
    if (!mounted) return
    if (!holdings || holdings.length === 0) return

    try {
      const todayPct = performance?.todayReturn?.percent ?? 0
      const todayDollar = performance?.todayReturn?.value ?? 0
      const allTimePct = totalGainPercent ?? 0

      const withPct = holdings.filter(h => typeof h.todayGainPercent === 'number')
      const sorted = [...withPct].sort((a, b) => b.todayGainPercent - a.todayGainPercent)
      const best = sorted[0]
      const worst = sorted[sorted.length - 1]

      const gainersCount = withPct.filter(h => h.todayGainPercent > 0).length
      const losersCount = withPct.filter(h => h.todayGainPercent < 0).length

      // Sector averages from holdings
      const sMap: Record<string, number[]> = {}
      holdings.forEach(h => {
        const s = h.sector ?? ''
        if (!s || s === 'Other' || s === 'Unknown') return
        if (!sMap[s]) sMap[s] = []
        sMap[s].push(h.todayGainPercent ?? 0)
      })
      const sEntries = Object.entries(sMap).map(([name, vals]) => ({
        name,
        avg: vals.reduce((a, b) => a + b, 0) / vals.length,
      }))
      const topS = [...sEntries].sort((a, b) => b.avg - a.avg)[0]
      const worstS = [...sEntries].sort((a, b) => a.avg - b.avg)[0]

      const s1 = getSentence1(todayPct, todayDollar)
      const s2 = getSentence2(
        gainersCount,
        losersCount,
        holdings.length,
        topS?.name ?? '',
        topS?.avg ?? 0,
        worstS?.name ?? '',
        worstS?.avg ?? 0,
      )
      const s3 = getSentence3(
        best?.symbol ?? '',
        best?.todayGainPercent ?? 0,
        worst?.symbol ?? '',
        worst?.todayGainPercent ?? 0,
        todayPct,
        allTimePct,
      )

      setLines([s1, s2, s3])
      setDisplayed(['', '', ''])
      setTypingDone(false)
    } catch (e) {
      console.error('[AIPortfolioSummary] Build error:', e)
      setLines([
        'Your portfolio is performing today.',
        'Check your sectors for more details.',
        'Review your holdings for opportunities.',
      ])
      setDisplayed(['', '', ''])
      setTypingDone(false)
    }
  }, [mounted, holdings?.length, performance?.todayReturn?.percent, refreshKey])

  // Step 3: typewriter — runs after lines are set
  useEffect(() => {
    if (!lines[0]) return

    setDisplayed(['', '', ''])
    setTypingDone(false)

    let sIdx = 0
    let cIdx = 0
    let timer: ReturnType<typeof setTimeout>

    function tick() {
      const sentence = lines[sIdx]
      if (!sentence) { setTypingDone(true); return }

      if (cIdx <= sentence.length) {
        const slice = sentence.slice(0, cIdx)
        setDisplayed(prev => {
          const next = [...prev]
          next[sIdx] = slice
          return next
        })
        cIdx++
        timer = setTimeout(tick, 14)
      } else {
        sIdx++
        cIdx = 0
        if (sIdx >= lines.length) {
          setTypingDone(true)
        } else {
          timer = setTimeout(tick, 260)
        }
      }
    }

    timer = setTimeout(tick, 300)
    return () => clearTimeout(timer)
  }, [lines.join('|||')])

  // Don't render at all until mounted
  if (!mounted || !holdings || holdings.length === 0) return null

  const todayPct = performance?.todayReturn?.percent ?? 0
  const isPositive = todayPct > 0.1
  const isNegative = todayPct < -0.1

  const gradient = isPositive
    ? 'from-green-500/10 to-green-500/5 border-green-500/20'
    : isNegative
      ? 'from-red-500/10 to-red-500/5 border-red-500/20'
      : 'from-secondary/60 to-secondary/30 border-border'

  const MoodIcon = isPositive
    ? <TrendingUp className="h-4 w-4 text-green-500" />
    : isNegative
      ? <TrendingDown className="h-4 w-4 text-red-500" />
      : <Minus className="h-4 w-4 text-muted-foreground" />

  const moodColor = isPositive ? 'text-green-500' : isNegative ? 'text-red-500' : 'text-muted-foreground'

  const badgeColors = [
    'bg-blue-500/20 text-blue-400',
    'bg-purple-500/20 text-purple-400',
    'bg-orange-500/20 text-orange-400',
  ]

  return (
    <Card className={`border bg-gradient-to-br ${gradient}`}>
      <CardContent className="p-5">

        {/* Header */}
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2.5">
            <div className="flex items-center gap-1.5 bg-blue-500/20 border border-blue-500/30 px-3 py-1 rounded-full">
              <Sparkles className="h-3.5 w-3.5 text-blue-400" />
              <span className="text-xs font-bold text-blue-400">AI Insights</span>
            </div>
            <div className="flex items-center gap-1">
              {MoodIcon}
              <span className={`text-sm font-bold ${moodColor}`}>
                {fmtPct(todayPct)} today
              </span>
            </div>
          </div>
          <div className="flex items-center gap-2">
            {isWeekend && (
              <span className="text-xs text-muted-foreground bg-secondary/80 px-2 py-0.5 rounded-full">
                📅 Friday's close
              </span>
            )}
            <button
              onClick={() => setRefreshKey(k => k + 1)}
              className="p-1.5 rounded-lg hover:bg-secondary/60 transition-colors group"
              title="Get a different insight"
            >
              <RefreshCw className="h-3.5 w-3.5 text-muted-foreground group-hover:text-foreground transition-colors" />
            </button>
          </div>
        </div>

        {/* Sentences */}
        <div className="space-y-3">
          {[0, 1, 2].map(i => (
            <div key={i} className="flex gap-3 items-start">
              <div className={`w-5 h-5 rounded-full flex items-center justify-center shrink-0 mt-0.5 text-[10px] font-bold ${badgeColors[i]}`}>
                {i + 1}
              </div>
              <p className="text-sm leading-relaxed text-foreground flex-1 min-h-[20px]">
                {displayed[i] || ''}
                {!typingDone && displayed[i] && displayed[i].length > 0 &&
                  displayed[i].length === (lines[i]?.slice(0, displayed[i].length).length ?? 0) &&
                  i === displayed.findIndex((d, idx) => lines[idx] && d.length < lines[idx].length) && (
                    <span className="inline-block w-0.5 h-[13px] bg-blue-400 ml-0.5 animate-pulse align-middle rounded-full" />
                  )}
              </p>
            </div>
          ))}
        </div>

        {/* Footer */}
        {typingDone && (
          <div className="mt-4 pt-3 border-t border-border/50 flex items-center justify-between">
            <p className="text-xs text-muted-foreground">
              Based on your real holdings · tap refresh for a different take
            </p>
            <div className="flex gap-1.5">
              {[0, 1, 2].map(i => (
                <div
                  key={i}
                  className={`rounded-full transition-all ${i === refreshKey % 3
                      ? 'w-3 h-1.5 bg-blue-500'
                      : 'w-1.5 h-1.5 bg-secondary'
                    }`}
                />
              ))}
            </div>
          </div>
        )}

      </CardContent>
    </Card>
  )
}
