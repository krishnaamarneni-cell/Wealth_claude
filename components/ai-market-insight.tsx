"use client"

import { useEffect, useState } from "react"
import { Card, CardContent } from "@/components/ui/card"
import { Brain, RefreshCw } from "lucide-react"

// ── Types ────────────────────────────────────────────────────────────────
interface Item { price: number; change: number; changePercent: number }
interface Sector { name: string; changePercent: number }
interface Mover { symbol: string; price: number; change: number; changePercent: number }

interface Insight {
  icon: string
  title: string
  text: string
  color: string
}

// ── Helpers ──────────────────────────────────────────────────────────────
function pick<T>(arr: T[]): T { return arr[Math.floor(Math.random() * arr.length)] }
function pct(v: number) { return `${v >= 0 ? '+' : ''}${Math.abs(v).toFixed(2)}%` }
function dollar(v: number) { return `$${Math.abs(v).toFixed(2)}` }

// ── Section 1: Market Pulse ──────────────────────────────────────────────
function buildPulse(sp: Item, nq: Item, dj: Item): Insight {
  const mag = Math.abs(sp.changePercent)
  const up = sp.changePercent > 0.1
  const dn = sp.changePercent < -0.1

  let opening: string
  if (!up && !dn) {
    opening = pick([
      `Markets were flat today 😐 — the S&P 500 barely moved (${pct(sp.changePercent)}). Think of it like a tug-of-war where neither buyers nor sellers won.`,
      `A sleepy session 😴 — the S&P 500 finished nearly unchanged at ${pct(sp.changePercent)}. Quiet days like this are totally normal.`,
    ])
  } else if (up) {
    opening = mag >= 2
      ? pick([
        `Big green day 🚀 — the S&P 500 surged ${pct(sp.changePercent)}, one of the strongest moves in recent sessions. Investors were in full buying mode.`,
        `Stocks roared higher today 🚀 — the S&P 500 jumped ${pct(sp.changePercent)}. It's like the whole market went on sale… in reverse.`,
      ])
      : mag >= 0.5
        ? pick([
          `Solid day for stocks 📈 — the S&P 500 gained ${pct(sp.changePercent)}. More stocks rose than fell, and investors left the day in a good mood.`,
          `Markets moved higher today 📈 — the S&P 500 added ${pct(sp.changePercent)}. A healthy step forward.`,
        ])
        : pick([
          `Small but positive day 💚 — the S&P 500 edged up ${pct(sp.changePercent)}. Not exciting, but green is green.`,
          `Markets inched higher 💚 — the S&P 500 gained a modest ${pct(sp.changePercent)} today.`,
        ])
  } else {
    opening = mag >= 2
      ? pick([
        `Rough day 💥 — the S&P 500 dropped ${pct(sp.changePercent)}, a sharp selloff. Think of it like a fire sale — prices fell fast.`,
        `Ouch 📉 — the S&P 500 tumbled ${pct(sp.changePercent)}. One of those days most investors prefer to forget.`,
      ])
      : mag >= 0.5
        ? pick([
          `A down session 📉 — the S&P 500 fell ${pct(sp.changePercent)}. More stocks declined than rose, and sellers were in control.`,
          `Markets pulled back today 📉 — the S&P 500 lost ${pct(sp.changePercent)}. A step back after recent moves.`,
        ])
        : pick([
          `Slightly negative day 🔴 — the S&P 500 dipped ${pct(sp.changePercent)}. Small pullbacks like this happen all the time and are totally normal.`,
          `Minor losses today 🔴 — the S&P 500 slipped a small ${pct(sp.changePercent)}.`,
        ])
  }

  const compare = nq.changePercent > sp.changePercent + 0.3
    ? `The Nasdaq led with ${pct(nq.changePercent)} — tech stocks outpaced the broader market today.`
    : nq.changePercent < sp.changePercent - 0.3
      ? `The Nasdaq lagged at ${pct(nq.changePercent)} — tech stocks underperformed the broader market.`
      : `All 3 major indexes moved together: Nasdaq ${pct(nq.changePercent)}, Dow ${pct(dj.changePercent)}. A broad, unified move.`

  return { icon: '📈', title: 'Market Pulse', text: `${opening} ${compare}`, color: 'border-blue-500/30 bg-blue-500/5' }
}

// ── Section 2: Today's Winners ───────────────────────────────────────────
function buildWinners(sectors: Sector[], topGainer: Mover | null): Insight {
  const sorted = [...sectors].sort((a, b) => b.changePercent - a.changePercent)
  const best = sorted[0]
  const second = sorted[1]

  if (!best || best.changePercent <= 0) {
    return {
      icon: '🏆', title: "Today's Winners", color: 'border-green-500/30 bg-green-500/5',
      text: `No sectors finished positive today — even the "winner", ${best?.name ?? 'every sector'}, still lost ${best?.changePercent.toFixed(2) ?? 0}%. On days like this, holding steady and not panic-selling is its own kind of winning. 💪`,
    }
  }

  const sectorLine = pick([
    `${best.name} was today's star sector 🏆, gaining ${pct(best.changePercent)}. Think of sectors like sports teams — ${best.name} was the winning team today.${second?.changePercent > 0 ? ` ${second.name} also performed well at ${pct(second.changePercent)}.` : ''}`,
    `🏆 ${best.name} led the market with ${pct(best.changePercent)} today.${second?.changePercent > 0 ? ` Close behind was ${second.name} at ${pct(second.changePercent)}.` : ''} These sectors had more buyers than sellers — that pushed prices up.`,
  ])

  const stockLine = topGainer
    ? ` Best individual stock: ${topGainer.symbol} jumped ${pct(topGainer.changePercent)} today — that's like a $1,000 investment turning into $${(1000 * (1 + topGainer.changePercent / 100)).toFixed(0)} in a single day.`
    : ''

  return { icon: '🏆', title: "Today's Winners", text: `${sectorLine}${stockLine}`, color: 'border-green-500/30 bg-green-500/5' }
}

// ── Section 3: Today's Losers ────────────────────────────────────────────
function buildLosers(sectors: Sector[], topLoser: Mover | null): Insight {
  const sorted = [...sectors].sort((a, b) => a.changePercent - b.changePercent)
  const worst = sorted[0]
  const second = sorted[1]

  if (!worst || worst.changePercent >= 0) {
    return {
      icon: '📉', title: "Today's Losers", color: 'border-orange-500/30 bg-orange-500/5',
      text: `Almost no losers today 🙌 — even the weakest sector, ${worst?.name ?? 'Real Estate'}, barely moved at ${worst?.changePercent.toFixed(2) ?? 0}%. When almost everything goes up together, it's called a "broad rally" — a healthy sign for the market.`,
    }
  }

  const sectorLine = pick([
    `${worst.name} had the toughest day 📉, falling ${pct(worst.changePercent)}. Investors were selling these stocks — when more people sell than buy, prices fall.${second?.changePercent < 0 ? ` ${second.name} also struggled at ${pct(second.changePercent)}.` : ''}`,
    `📉 Investors steered clear of ${worst.name} stocks today — the sector dropped ${pct(worst.changePercent)}.${second?.changePercent < 0 ? ` ${second.name} (${pct(second.changePercent)}) also saw selling pressure.` : ''}`,
  ])

  const stockLine = topLoser
    ? ` Hardest-hit stock: ${topLoser.symbol} dropped ${pct(topLoser.changePercent)} today — meaning a $1,000 position is now worth $${(1000 * (1 + topLoser.changePercent / 100)).toFixed(0)}.`
    : ''

  return { icon: '📉', title: "Today's Losers", text: `${sectorLine}${stockLine}`, color: 'border-red-500/30 bg-red-500/5' }
}

// ── Section 4: Money Flow ────────────────────────────────────────────────
function buildMoneyFlow(sp: Item, bonds: Item | null, gold: Item | null, btc: Item | null): Insight {
  const stocksUp = sp.changePercent > 0.2
  const bondsUp = (bonds?.changePercent ?? 0) > 0.1
  const goldUp = (gold?.changePercent ?? 0) > 0.15
  const btcUp = (btc?.changePercent ?? 0) > 0.5

  let text: string

  if (stocksUp && !bondsUp && !goldUp) {
    text = pick([
      `💰 RISK-ON day — investors felt confident and poured money INTO stocks, pushing prices higher. They mostly ignored "safe" assets like bonds and gold. Think of it like people choosing to go to an exciting party instead of staying home.${btcUp ? ' Bitcoin also rose alongside stocks — another sign of high risk appetite.' : ''}`,
      `💰 Money flowed INTO the stock market today — a classic risk-on move. When investors are optimistic, they sell boring safe assets (bonds, gold) and buy growth assets (stocks). That's exactly what happened.${btcUp ? ' Even crypto joined in.' : ''}`,
    ])
  } else if (!stocksUp && (bondsUp || goldUp)) {
    text = pick([
      `💰 RISK-OFF day — nervous investors moved money OUT of stocks and INTO safer assets like${bondsUp ? ' bonds' : ''}${goldUp ? ' and gold' : ''}. Think of it like people rushing inside when storm clouds appear. This "flight to safety" is one reason stocks fell today.`,
      `💰 Investors played defense today — they sold stocks and bought ${bondsUp ? 'bonds' : ''}${goldUp ? ' and gold' : ''} (the "safe" stuff). This risk-off move is a sign of caution or fear in the market. The more this happens, the harder it is for stocks to rally.`,
    ])
  } else if (stocksUp && bondsUp) {
    text = `💰 An unusual day — both stocks AND bonds rose together 🤔. This often happens when fresh money enters the market from the sidelines, or when investors expect interest rates to fall soon. It's rare for everything to win at the same time.`
  } else {
    text = pick([
      `💰 Mixed money flow today — no clear direction. Stocks ${sp.changePercent >= 0 ? 'rose' : 'fell'} ${pct(sp.changePercent)} while bonds and gold moved similarly. Investors didn't make a strong "risk-on" or "risk-off" call — a sign of an undecided market.`,
      `💰 Investors were indecisive today — money moved around without a clear theme. This kind of mixed flow is common before big news events or when the market is waiting for fresh catalysts.`,
    ])
  }

  return { icon: '💰', title: 'Money Flow', text, color: 'border-yellow-500/30 bg-yellow-500/5' }
}

// ── Section 5: Watch Tomorrow ────────────────────────────────────────────
function buildWatch(fgValue: number, fgLabel: string, spPct: number, sectors: Sector[]): Insight {
  const moodStr = fgValue <= 25 ? 'in full panic mode 😱'
    : fgValue <= 45 ? 'nervous and cautious 😟'
      : fgValue <= 55 ? 'calm and balanced 😐'
        : fgValue <= 75 ? 'optimistic and greedy 😊'
          : 'extremely confident — almost too much 🤑'

  const outlook = fgValue <= 30
    ? 'Historically, extreme fear often creates buying opportunities for long-term investors — the best prices often appear when everyone else is scared.'
    : fgValue >= 75
      ? 'When greed runs this high, the market can sometimes be stretched thin. Not a reason to sell, but a signal to stay alert for any signs of a reversal.'
      : 'This is a normal, healthy reading — no extreme signals to worry about.'

  const momentum = Math.abs(spPct) >= 1.5
    ? ` Today's big move often sees follow-through — tomorrow could be active too.`
    : spPct > 0.2
      ? ` If buyers stay in control, today's positive momentum could carry into tomorrow.`
      : spPct < -0.2
        ? ` Watch to see if sellers keep pushing lower, or if buyers step in to support prices.`
        : ` Quiet days like today sometimes precede bigger moves — stay alert.`

  const topSector = [...sectors].sort((a, b) => b.changePercent - a.changePercent)[0]
  const sectorWatch = topSector
    ? ` Keep an eye on ${topSector.name} — it led the market today and often sets the tone for the next session.`
    : ''

  return {
    icon: '👀', title: 'Watch Tomorrow', color: 'border-purple-500/30 bg-purple-500/5',
    text: `👀 The market mood gauge (Fear & Greed) reads ${fgValue}/100 — investors are ${moodStr}. On a scale of 0 (total panic) to 100 (extreme excitement), ${fgValue} means "${fgLabel}". ${outlook}${momentum}${sectorWatch}`,
  }
}

// ── Main Component ────────────────────────────────────────────────────────
export default function AIMarketInsight() {
  const [insights, setInsights] = useState<Insight[]>([])
  const [visible, setVisible] = useState<boolean[]>([false, false, false, false, false])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(false)
  const [refreshKey, setRefreshKey] = useState(0)
  const [isWeekend, setIsWeekend] = useState(false)

  useEffect(() => {
    const est = new Date(new Date().toLocaleString('en-US', { timeZone: 'America/New_York' }))
    setIsWeekend(est.getDay() === 0 || est.getDay() === 6)
  }, [])

  useEffect(() => {
    setLoading(true)
    setError(false)
    setVisible([false, false, false, false, false])

    Promise.all([
      fetch('/api/market-overview').then(r => r.json()),
      fetch('/api/fear-greed').then(r => r.json()),
      fetch('/api/market-movers').then(r => r.json()),
    ])
      .then(([market, fg, movers]) => {
        const { ticker, sectors } = market
        const sp = ticker?.sp500 ?? { price: 0, change: 0, changePercent: 0 }
        const nq = ticker?.nasdaq ?? { price: 0, change: 0, changePercent: 0 }
        const dj = ticker?.dow ?? { price: 0, change: 0, changePercent: 0 }
        const fgV = fg?.stock?.value ?? 50
        const fgL = fg?.stock?.label ?? 'Neutral'
        const topGainer = movers?.sp500?.gainers?.[0] ?? null
        const topLoser = movers?.sp500?.losers?.[0] ?? null

        const built: Insight[] = [
          buildPulse(sp, nq, dj),
          buildWinners(sectors ?? [], topGainer),
          buildLosers(sectors ?? [], topLoser),
          buildMoneyFlow(sp, ticker?.bonds, ticker?.gold, ticker?.bitcoin),
          buildWatch(fgV, fgL, sp.changePercent, sectors ?? []),
        ]

        setInsights(built)
        setLoading(false)
        // Stagger reveal — each section fades in 180ms apart
        built.forEach((_, i) => {
          setTimeout(() => setVisible(prev => { const n = [...prev]; n[i] = true; return n }), i * 180)
        })
      })
      .catch(() => { setError(true); setLoading(false) })
  }, [refreshKey])

  if (loading) return (
    <Card className="border-border bg-card">
      <CardContent className="p-5 space-y-4">
        <div className="flex items-center gap-2">
          <div className="h-6 w-32 bg-secondary rounded-full animate-pulse" />
          <div className="h-4 w-24 bg-secondary rounded animate-pulse" />
        </div>
        {[...Array(5)].map((_, i) => (
          <div key={i} className="h-16 bg-secondary rounded-lg animate-pulse" />
        ))}
      </CardContent>
    </Card>
  )

  if (error) return null

  return (
    <Card className="border-border bg-card">
      <CardContent className="p-5">

        {/* Header */}
        <div className="flex items-center justify-between mb-5">
          <div className="flex items-center gap-2.5">
            <div className="flex items-center gap-1.5 bg-violet-500/20 border border-violet-500/30 px-3 py-1 rounded-full">
              <Brain className="h-3.5 w-3.5 text-violet-400" />
              <span className="text-xs font-bold text-violet-400">Market Daily Brief</span>
            </div>
            {isWeekend && (
              <span className="text-xs text-muted-foreground bg-secondary/80 px-2 py-0.5 rounded-full">
                📅 Friday's close
              </span>
            )}
          </div>
          <button
            onClick={() => setRefreshKey(k => k + 1)}
            className="p-1.5 rounded-lg hover:bg-secondary/60 transition-colors group"
            title="Refresh insight"
          >
            <RefreshCw className="h-3.5 w-3.5 text-muted-foreground group-hover:text-foreground" />
          </button>
        </div>

        {/* 5 Insight Sections */}
        <div className="space-y-3">
          {insights.map((insight, i) => (
            <div
              key={i}
              className={`p-4 rounded-xl border transition-all duration-500 ${insight.color} ${visible[i] ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-2'
                }`}
              style={{ transitionDelay: `${i * 20}ms` }}
            >
              <div className="flex items-start gap-3">
                <div className="text-xl shrink-0 mt-0.5">{insight.icon}</div>
                <div className="flex-1">
                  <p className="text-xs font-bold text-muted-foreground uppercase tracking-wider mb-1">
                    {insight.title}
                  </p>
                  <p className="text-sm leading-relaxed text-foreground">
                    {insight.text}
                  </p>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Footer */}
        <p className="text-xs text-muted-foreground text-center mt-4 pt-3 border-t border-border/50">
          Based on real market data · tap refresh for a different take · not financial advice
        </p>

      </CardContent>
    </Card>
  )
}
