"use client"

import { useEffect, useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Target, Info, X } from "lucide-react"
import { usePortfolio } from "@/lib/portfolio-context"
import {
  fetchSectorEtfData,
  SP500_SECTOR_WEIGHTS,
  ALL_SECTORS,
  mapSectorName,
  type SectorEtfData,
} from "@/lib/sector-etf-data"

function formatPercent(value: number, decimals = 2): string {
  return `${value >= 0 ? '+' : ''}${value.toFixed(decimals)}%`
}

export default function PortfolioVsMarket() {
  const { holdings, performance } = usePortfolio()

  const [sectorData, setSectorData] = useState<SectorEtfData[]>([])
  const [spyPercent, setSpyPercent] = useState<number>(0)
  const [loading, setLoading] = useState(true)
  const [activeCard, setActiveCard] = useState(0)
  const [showInfo, setShowInfo] = useState(false)
  const [tradingDay, setTradingDay] = useState('')

  // ==================== FETCH DATA ====================
  useEffect(() => {
    async function load() {
      setLoading(true)
      try {
        const [etfData, spyRes] = await Promise.all([
          fetchSectorEtfData(),
          fetch(`/api/stock-info?symbol=SPY&t=${Date.now()}`, { cache: 'no-store' }),
        ])
        setSectorData(etfData)

        if (spyRes.ok) {
          const spyJson = await spyRes.json()
          const pct =
            typeof spyJson.changePercent === 'number' && spyJson.changePercent !== 0
              ? spyJson.changePercent
              : (spyJson.returns?.['1D'] ?? 0)
          setSpyPercent(pct)
        }

        // Determine label for trading day
        const now = new Date(new Date().toLocaleString('en-US', { timeZone: 'America/New_York' }))
        const day = now.getDay()
        setTradingDay(
          day === 0 || day === 6
            ? "Friday's Closing Data"
            : now.getHours() < 16
              ? 'Previous Close'
              : "Today's Closing Data"
        )
      } finally {
        setLoading(false)
      }
    }
    load()
  }, [])

  // Auto-advance carousel every 35 seconds
  useEffect(() => {
    const interval = setInterval(() => setActiveCard(p => (p + 1) % 2), 35000)
    return () => clearInterval(interval)
  }, [])

  // ==================== COMPUTE ALLOCATION ====================
  const totalValue = holdings.reduce((sum, h) => sum + h.marketValue, 0)
  const yourSectorAllocation: Record<string, number> = {}
  holdings.forEach(h => {
    const mapped = mapSectorName(h.sector || '')
    if (mapped !== 'Other' && totalValue > 0) {
      yourSectorAllocation[mapped] = (yourSectorAllocation[mapped] || 0) +
        (h.marketValue / totalValue) * 100
    }
  })

  const sectorMap: Record<string, SectorEtfData> = {}
  sectorData.forEach(d => { sectorMap[d.sector] = d })

  const yourPerformance = performance.todayReturn.percent || 0
  const outperformance = yourPerformance - spyPercent
  const didOutperform = outperformance > 0

  // Sort: owned sectors first (by your allocation desc), unowned last
  const sortedSectors = [...ALL_SECTORS].sort((a, b) => {
    const aOwn = yourSectorAllocation[a] || 0
    const bOwn = yourSectorAllocation[b] || 0
    if (aOwn > 0 && bOwn === 0) return -1
    if (aOwn === 0 && bOwn > 0) return 1
    return bOwn - aOwn
  })

  return (
    <>
      <Card className="border-border bg-card">
        <CardHeader>
          {/* Title row */}
          <div className="flex items-start justify-between gap-2">
            <div>
              <CardTitle className="text-xl font-bold flex items-center gap-2">
                <Target className="h-5 w-5 text-blue-500" />
                Your Portfolio vs Market Today
              </CardTitle>
              <p className="text-xs text-muted-foreground mt-1">
                📅 Showing: <span className="font-semibold">{tradingDay}</span>
                {' · '}Data updates once per day after market close (4PM EST)
              </p>
            </div>
            <button
              onClick={() => setShowInfo(true)}
              className="p-2 rounded-full hover:bg-secondary transition-colors shrink-0"
              title="How is this calculated?"
            >
              <Info className="h-5 w-5 text-blue-500" />
            </button>
          </div>

          {/* 3-stat summary bar */}
          <div className="grid grid-cols-3 gap-3 mt-4">
            <div className="p-3 rounded-lg bg-secondary/40 border border-border text-center">
              <p className="text-xs text-muted-foreground mb-1">S&P 500 (SPY)</p>
              {loading ? (
                <div className="h-7 w-16 bg-secondary animate-pulse rounded mx-auto" />
              ) : (
                <p className={`text-xl font-bold ${spyPercent >= 0 ? 'text-green-500' : 'text-red-500'}`}>
                  {formatPercent(spyPercent)}
                </p>
              )}
            </div>

            <div className="p-3 rounded-lg bg-secondary/40 border border-border text-center">
              <p className="text-xs text-muted-foreground mb-1">Your Portfolio</p>
              <p className={`text-xl font-bold ${yourPerformance >= 0 ? 'text-green-500' : 'text-red-500'}`}>
                {formatPercent(yourPerformance)}
              </p>
            </div>

            <div className={`p-3 rounded-lg border text-center ${didOutperform
                ? 'bg-green-500/10 border-green-500/30'
                : 'bg-red-500/10 border-red-500/30'
              }`}>
              <p className="text-xs text-muted-foreground mb-1">
                {didOutperform ? '🎯 Beat Market by' : '📉 Behind Market by'}
              </p>
              <p className={`text-xl font-bold ${didOutperform ? 'text-green-500' : 'text-red-500'}`}>
                {formatPercent(Math.abs(outperformance))}
              </p>
            </div>
          </div>
        </CardHeader>

        <CardContent className="space-y-4">
          {/* ==================== CAROUSEL ==================== */}
          <div className="relative overflow-hidden rounded-lg">
            <div
              className="flex transition-transform duration-500 ease-in-out"
              style={{ transform: `translateX(-${activeCard * 100}%)` }}
            >
              {/* Card 1: Your Sectors Today */}
              <div className="w-full shrink-0">
                <div className="space-y-2">
                  <div className="flex items-center gap-2 mb-3">
                    <span className="text-base font-bold">📊 Your Sectors Today</span>
                    <span className="text-xs text-muted-foreground">— which sectors went up or down</span>
                  </div>

                  {sortedSectors.map(sector => {
                    const owned = (yourSectorAllocation[sector] || 0) > 0
                    const etf = sectorMap[sector]
                    const changePct = etf?.changePercent ?? 0
                    const isUp = changePct >= 0
                    const yourPct = yourSectorAllocation[sector] || 0

                    return (
                      <div
                        key={sector}
                        className={`flex items-center gap-3 p-3 rounded-lg border transition-all ${!owned
                            ? 'opacity-35 bg-secondary/10 border-border'
                            : isUp
                              ? 'bg-green-500/5 border-green-500/20'
                              : 'bg-red-500/5 border-red-500/20'
                          }`}
                      >
                        {/* Sector name */}
                        <div className="w-44 shrink-0">
                          <p className={`text-sm font-semibold leading-tight ${!owned ? 'text-muted-foreground' : ''}`}>
                            {sector}
                          </p>
                          {!owned && (
                            <p className="text-xs text-muted-foreground">You don't own this</p>
                          )}
                          {owned && (
                            <p className="text-xs text-muted-foreground">{etf?.etf}</p>
                          )}
                        </div>

                        {/* Allocation bar */}
                        <div className="flex-1">
                          {owned ? (
                            <div className="flex items-center gap-2">
                              <div className="flex-1 h-2.5 bg-secondary rounded-full overflow-hidden">
                                <div
                                  className={`h-full rounded-full ${isUp ? 'bg-green-500' : 'bg-red-500'}`}
                                  style={{ width: `${Math.min(yourPct * 2.2, 100)}%` }}
                                />
                              </div>
                              <span className="text-xs font-bold text-foreground w-12 text-right">
                                {yourPct.toFixed(1)}% of you
                              </span>
                            </div>
                          ) : (
                            <div className="h-2.5 bg-secondary/20 rounded-full" />
                          )}
                        </div>

                        {/* Today % change */}
                        <div className="w-24 text-right shrink-0">
                          {loading ? (
                            <div className="h-5 w-16 bg-secondary animate-pulse rounded ml-auto" />
                          ) : (
                            <div>
                              <span className={`text-sm font-bold ${!owned
                                  ? 'text-muted-foreground'
                                  : isUp ? 'text-green-500' : 'text-red-500'
                                }`}>
                                {etf
                                  ? `${isUp ? '↑' : '↓'} ${Math.abs(changePct).toFixed(2)}%`
                                  : '—'}
                              </span>
                              {owned && (
                                <p className="text-xs text-muted-foreground">
                                  {isUp ? 'Gained' : 'Lost'} today
                                </p>
                              )}
                            </div>
                          )}
                        </div>
                      </div>
                    )
                  })}

                  <p className="text-xs text-muted-foreground text-center pt-1">
                    Faded rows = sectors you don't own · Bar = how much of your portfolio
                  </p>
                </div>
              </div>

              {/* Card 2: You vs S&P 500 */}
              <div className="w-full shrink-0">
                <div className="space-y-2">
                  <div className="flex items-center gap-2 mb-3">
                    <span className="text-base font-bold">⚖️ You vs S&P 500</span>
                    <span className="text-xs text-muted-foreground">— is your mix different from the market?</span>
                  </div>

                  {sortedSectors.map(sector => {
                    const yourPct = yourSectorAllocation[sector] || 0
                    const marketPct = SP500_SECTOR_WEIGHTS[sector] || 0
                    const owned = yourPct > 0
                    const diff = yourPct - marketPct
                    const ownsMore = diff > 1.5
                    const ownsSimilar = Math.abs(diff) <= 1.5

                    return (
                      <div
                        key={sector}
                        className={`p-3 rounded-lg border ${!owned
                            ? 'opacity-35 border-border bg-secondary/10'
                            : 'border-border bg-secondary/20'
                          }`}
                      >
                        <div className="flex items-center justify-between mb-2">
                          <span className={`text-sm font-bold ${!owned ? 'text-muted-foreground' : ''}`}>
                            {sector}
                          </span>
                          {owned && (
                            <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${ownsSimilar
                                ? 'bg-secondary text-muted-foreground'
                                : ownsMore
                                  ? 'bg-blue-500/20 text-blue-400'
                                  : 'bg-purple-500/20 text-purple-400'
                              }`}>
                              {ownsSimilar ? 'Similar to market' : ownsMore ? '↑ You own more' : '↓ You own less'}
                            </span>
                          )}
                        </div>

                        <div className="space-y-1.5">
                          {/* Your bar */}
                          <div className="flex items-center gap-2">
                            <span className="text-xs text-muted-foreground w-16 shrink-0">You</span>
                            <div className="flex-1 h-2.5 bg-secondary rounded-full overflow-hidden">
                              <div
                                className="h-full bg-blue-500 rounded-full"
                                style={{ width: `${Math.min(yourPct * 2.8, 100)}%` }}
                              />
                            </div>
                            <span className="text-xs font-bold text-blue-400 w-10 text-right shrink-0">
                              {yourPct > 0 ? `${yourPct.toFixed(1)}%` : '—'}
                            </span>
                          </div>
                          {/* Market bar */}
                          <div className="flex items-center gap-2">
                            <span className="text-xs text-muted-foreground w-16 shrink-0">S&P 500</span>
                            <div className="flex-1 h-2.5 bg-secondary rounded-full overflow-hidden">
                              <div
                                className="h-full bg-zinc-400 rounded-full"
                                style={{ width: `${Math.min(marketPct * 2.8, 100)}%` }}
                              />
                            </div>
                            <span className="text-xs font-bold text-muted-foreground w-10 text-right shrink-0">
                              {marketPct.toFixed(1)}%
                            </span>
                          </div>
                        </div>
                      </div>
                    )
                  })}

                  <p className="text-xs text-muted-foreground text-center pt-1">
                    🔵 Your allocation · ⬜ S&P 500 reference weight
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Carousel dots */}
          <div className="flex items-center justify-center gap-3 pt-1">
            {[
              { i: 0, label: 'Your Sectors Today' },
              { i: 1, label: 'You vs S&P 500' },
            ].map(({ i, label }) => (
              <button
                key={i}
                onClick={() => setActiveCard(i)}
                className="flex items-center gap-2 group"
              >
                <div className={`transition-all rounded-full ${activeCard === i
                    ? 'w-6 h-2.5 bg-blue-500'
                    : 'w-2.5 h-2.5 bg-muted-foreground/30 group-hover:bg-muted-foreground'
                  }`} />
                <span className={`text-xs ${activeCard === i ? 'text-foreground font-semibold' : 'text-muted-foreground'}`}>
                  {label}
                </span>
              </button>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Info Modal */}
      {showInfo && <InfoModal onClose={() => setShowInfo(false)} />}
    </>
  )
}

// ==================== INFO MODAL ====================
function InfoModal({ onClose }: { onClose: () => void }) {
  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70"
      onClick={onClose}
    >
      <div
        className="bg-card border border-border rounded-xl max-w-lg w-full p-6 shadow-2xl"
        onClick={e => e.stopPropagation()}
      >
        <div className="flex items-center justify-between mb-5">
          <h3 className="font-bold text-lg flex items-center gap-2">
            <Info className="h-5 w-5 text-blue-500" />
            How is this data calculated?
          </h3>
          <button onClick={onClose} className="p-1.5 hover:bg-secondary rounded-lg transition-colors">
            <X className="h-4 w-4" />
          </button>
        </div>

        <div className="space-y-3 text-sm">
          <div className="p-3 rounded-lg bg-secondary/50 border border-border">
            <p className="font-bold mb-1">📈 S&P 500 Today %</p>
            <p className="text-muted-foreground leading-relaxed">
              We use <strong className="text-foreground">SPY</strong> — the world's most popular S&P 500 fund.
              When SPY goes up 0.72%, the S&P 500 went up roughly the same. It's the easiest way to compare your portfolio to "the market."
            </p>
          </div>

          <div className="p-3 rounded-lg bg-secondary/50 border border-border">
            <p className="font-bold mb-1">💼 Your Portfolio %</p>
            <p className="text-muted-foreground leading-relaxed">
              Calculated from your actual holdings. Each stock's price change today is weighted by how much of your portfolio it represents.
            </p>
          </div>

          <div className="p-3 rounded-lg bg-secondary/50 border border-border">
            <p className="font-bold mb-1">📊 Sector Performance % (Card 1)</p>
            <p className="text-muted-foreground leading-relaxed">
              Each sector uses its official <strong className="text-foreground">SPDR ETF</strong> as a proxy:
              Tech → XLK, Communication → XLC, Financials → XLF, Healthcare → XLV, etc.
              These ETFs hold hundreds of stocks in that sector, so their daily % = the sector's daily move.
            </p>
          </div>

          <div className="p-3 rounded-lg bg-secondary/50 border border-border">
            <p className="font-bold mb-1">⚖️ S&P 500 Sector Weights (Card 2)</p>
            <p className="text-muted-foreground leading-relaxed">
              These are approximate S&P 500 weights (e.g. Tech = 28.5%). If you own more Tech than 28.5% of your portfolio, you have more "Tech exposure" than the average S&P 500 investor.
            </p>
          </div>

          <div className="p-3 rounded-lg bg-blue-500/10 border border-blue-500/30">
            <p className="font-bold mb-1">🕐 When does data update?</p>
            <p className="text-muted-foreground leading-relaxed">
              Data updates <strong className="text-foreground">once per day after market close (4PM EST, weekdays only)</strong>.
              On Saturday & Sunday, it always shows Friday's closing prices — which is correct, since the market is closed on weekends.
            </p>
          </div>
        </div>

        <button
          onClick={onClose}
          className="w-full mt-5 py-2.5 bg-blue-500 hover:bg-blue-600 text-white rounded-lg font-bold transition-colors"
        >
          Got it!
        </button>
      </div>
    </div>
  )
}
