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
  getTradingDayLabel,
  type SectorEtfData,
} from "@/lib/sector-etf-data"

function fmt(value: number, dec = 2): string {
  return `${value >= 0 ? '+' : ''}${value.toFixed(dec)}%`
}

export default function PortfolioVsMarket() {
  const { holdings, performance } = usePortfolio()

  const [sectorData, setSectorData] = useState<SectorEtfData[]>([])
  const [spyPercent, setSpyPercent] = useState<number>(0)
  const [loading, setLoading] = useState(true)
  const [activeCard, setActiveCard] = useState(0)
  const [showInfo, setShowInfo] = useState(false)
  const [tradingDay, setTradingDay] = useState('')

  useEffect(() => {
    async function load() {
      setLoading(true)
      try {
        const etfData = await fetchSectorEtfData()
        setSectorData(etfData)

        const spyEntry = etfData.find(d => d.etf === 'SPY')
        if (spyEntry) {
          setSpyPercent(spyEntry.changePercent)
        } else {
          try {
            const res = await fetch(`/api/stock-info?symbol=SPY&t=${Date.now()}`, { cache: 'no-store' })
            if (res.ok) {
              const d = await res.json()
              const pct = typeof d.changePercent === 'number' && d.changePercent !== 0
                ? d.changePercent
                : (d.returns?.['1D'] ?? 0)
              setSpyPercent(pct)
            }
          } catch { }
        }

        setTradingDay(getTradingDayLabel())
      } catch (e) {
        console.error('[PortfolioVsMarket] Load error:', e)
      } finally {
        setLoading(false)
      }
    }
    load()
  }, [])

  // Auto-advance carousel every 35 seconds
  useEffect(() => {
    const t = setInterval(() => setActiveCard(p => (p + 1) % 2), 35000)
    return () => clearInterval(t)
  }, [])

  // Build sector allocation map
  const totalValue = holdings.reduce((sum, h) => sum + h.marketValue, 0)
  const yourAlloc: Record<string, number> = {}
  holdings.forEach(h => {
    const sector = mapSectorName(h.sector || '')
    if (sector !== 'Other' && totalValue > 0) {
      yourAlloc[sector] = (yourAlloc[sector] || 0) + (h.marketValue / totalValue) * 100
    }
  })

  const sectorMap: Record<string, SectorEtfData> = {}
  sectorData.forEach(d => { sectorMap[d.sector] = d })

  const yourPerformance = performance?.todayReturn?.percent ?? 0
  const outperformance = yourPerformance - spyPercent
  const didOutperform = outperformance > 0

  // Owned sectors first, sorted by allocation desc, then unowned
  const sortedSectors = [...ALL_SECTORS].sort((a, b) => {
    const aP = yourAlloc[a] || 0
    const bP = yourAlloc[b] || 0
    if (aP > 0 && bP === 0) return -1
    if (aP === 0 && bP > 0) return 1
    return bP - aP
  })

  return (
    <>
      <Card className="border-border bg-card">
        <CardHeader>
          <div className="flex items-start justify-between gap-2">
            <div>
              <CardTitle className="text-xl font-bold flex items-center gap-2">
                <Target className="h-5 w-5 text-blue-500" />
                Your Portfolio vs Market Today
              </CardTitle>
              <p className="text-xs text-muted-foreground mt-1">
                📅 <span className="font-semibold">{tradingDay}</span>
                {' · '}Updates once per day after market close (4PM EST)
              </p>
            </div>
            <button
              onClick={() => setShowInfo(true)}
              className="p-2 rounded-full hover:bg-secondary transition-colors shrink-0"
            >
              <Info className="h-5 w-5 text-blue-500" />
            </button>
          </div>

          {/* 3-stat bar */}
          <div className="grid grid-cols-3 gap-3 mt-4">
            <div className="p-3 rounded-lg bg-secondary/40 border border-border text-center">
              <p className="text-xs text-muted-foreground mb-1">S&P 500 (SPY)</p>
              {loading
                ? <div className="h-7 w-16 bg-secondary animate-pulse rounded mx-auto" />
                : <p className={`text-xl font-bold ${spyPercent >= 0 ? 'text-green-500' : 'text-red-500'}`}>{fmt(spyPercent)}</p>
              }
            </div>
            <div className="p-3 rounded-lg bg-secondary/40 border border-border text-center">
              <p className="text-xs text-muted-foreground mb-1">Your Portfolio</p>
              <p className={`text-xl font-bold ${yourPerformance >= 0 ? 'text-green-500' : 'text-red-500'}`}>
                {fmt(yourPerformance)}
              </p>
            </div>
            <div className={`p-3 rounded-lg border text-center ${didOutperform ? 'bg-green-500/10 border-green-500/30' : 'bg-red-500/10 border-red-500/30'}`}>
              <p className="text-xs text-muted-foreground mb-1">
                {didOutperform ? '🎯 Beat Market by' : '📉 Behind by'}
              </p>
              <p className={`text-xl font-bold ${didOutperform ? 'text-green-500' : 'text-red-500'}`}>
                {fmt(Math.abs(outperformance))}
              </p>
            </div>
          </div>
        </CardHeader>

        <CardContent className="space-y-4">

          {/* ===== CARD 1: Your Sectors Today ===== */}
          {activeCard === 0 && (
            <div>
              <p className="text-base font-bold mb-1">📊 Your Sectors Today</p>
              <p className="text-xs text-muted-foreground mb-3">
                Which sectors in your portfolio went up or down
              </p>
              <div className="space-y-2">
                {sortedSectors.map(sector => {
                  const owned = (yourAlloc[sector] || 0) > 0
                  const etf = sectorMap[sector]
                  const pct = etf?.changePercent ?? 0
                  const isUp = pct >= 0
                  const yourPct = yourAlloc[sector] || 0

                  return (
                    <div
                      key={sector}
                      className={`flex items-center gap-3 p-3 rounded-lg border transition-all ${!owned
                          ? 'opacity-30 bg-secondary/10 border-border'
                          : isUp
                            ? 'bg-green-500/5 border-green-500/20'
                            : 'bg-red-500/5 border-red-500/20'
                        }`}
                    >
                      {/* Sector name */}
                      <div className="w-40 shrink-0">
                        <p className={`text-sm font-semibold leading-tight ${!owned ? 'text-muted-foreground' : ''}`}>
                          {sector}
                        </p>
                        <p className="text-xs text-muted-foreground">{etf?.etf ?? ''}</p>
                      </div>

                      {/* Allocation bar */}
                      <div className="flex-1">
                        {owned ? (
                          <div className="flex items-center gap-2">
                            <div className="flex-1 h-2.5 bg-secondary rounded-full overflow-hidden">
                              <div
                                className={`h-full rounded-full ${isUp ? 'bg-green-500' : 'bg-red-500'}`}
                                style={{ width: `${Math.min(yourPct * 2.5, 100)}%` }}
                              />
                            </div>
                            <span className="text-xs font-bold w-14 text-right">
                              {yourPct.toFixed(1)}% of you
                            </span>
                          </div>
                        ) : (
                          <div className="h-2.5 bg-secondary/20 rounded-full" />
                        )}
                      </div>

                      {/* % change */}
                      <div className="w-24 text-right shrink-0">
                        {loading ? (
                          <div className="h-5 w-14 bg-secondary animate-pulse rounded ml-auto" />
                        ) : (
                          <>
                            <span className={`text-sm font-bold ${!owned ? 'text-muted-foreground' : isUp ? 'text-green-500' : 'text-red-500'
                              }`}>
                              {etf ? `${isUp ? '↑' : '↓'} ${Math.abs(pct).toFixed(2)}%` : '—'}
                            </span>
                            {owned && (
                              <p className="text-xs text-muted-foreground">
                                {isUp ? 'Gained today' : 'Lost today'}
                              </p>
                            )}
                          </>
                        )}
                      </div>
                    </div>
                  )
                })}
              </div>
              <p className="text-xs text-muted-foreground text-center mt-3">
                Faded = sectors you don't own · Bar size = your allocation
              </p>
            </div>
          )}

          {/* ===== CARD 2: You vs S&P 500 ===== */}
          {activeCard === 1 && (
            <div>
              <p className="text-base font-bold mb-1">⚖️ You vs S&P 500 Mix</p>
              <p className="text-xs text-muted-foreground mb-3">
                Do you own more or less of each sector vs the average market investor?
              </p>
              <div className="space-y-2">
                {sortedSectors.map(sector => {
                  const yourPct = yourAlloc[sector] || 0
                  const marketPct = SP500_SECTOR_WEIGHTS[sector] || 0
                  const owned = yourPct > 0
                  const diff = yourPct - marketPct
                  const similar = Math.abs(diff) <= 1.5
                  const label = similar ? 'Similar to market' : diff > 0 ? '↑ You own more' : '↓ You own less'
                  const labelColor = similar ? 'text-muted-foreground' : diff > 0 ? 'text-blue-400' : 'text-purple-400'
                  const labelBg = similar ? 'bg-secondary' : diff > 0 ? 'bg-blue-500/20' : 'bg-purple-500/20'

                  return (
                    <div
                      key={sector}
                      className={`p-3 rounded-lg border ${!owned ? 'opacity-30 border-border bg-secondary/10' : 'border-border bg-secondary/20'
                        }`}
                    >
                      <div className="flex items-center justify-between mb-2">
                        <span className={`text-sm font-bold ${!owned ? 'text-muted-foreground' : ''}`}>
                          {sector}
                        </span>
                        {owned && (
                          <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${labelBg} ${labelColor}`}>
                            {label}
                          </span>
                        )}
                      </div>
                      <div className="space-y-1.5">
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
              </div>
              <p className="text-xs text-muted-foreground text-center mt-3">
                🔵 Your allocation · ⬜ S&P 500 average
              </p>
            </div>
          )}

          {/* Carousel dots */}
          <div className="flex items-center justify-center gap-4 pt-1">
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
                    : 'w-2.5 h-2.5 bg-muted-foreground/30 group-hover:bg-muted-foreground/60'
                  }`} />
                <span className={`text-xs ${activeCard === i ? 'text-foreground font-semibold' : 'text-muted-foreground'
                  }`}>
                  {label}
                </span>
              </button>
            ))}
          </div>

        </CardContent>
      </Card>

      {showInfo && <InfoModal onClose={() => setShowInfo(false)} />}
    </>
  )
}

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
          <button
            onClick={onClose}
            className="p-1.5 hover:bg-secondary rounded-lg transition-colors"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        <div className="space-y-3 text-sm">
          <div className="p-3 rounded-lg bg-secondary/50 border border-border">
            <p className="font-bold mb-1">📈 S&P 500 % (SPY)</p>
            <p className="text-muted-foreground leading-relaxed">
              We use <strong className="text-foreground">SPY</strong> — the world's most popular S&P 500 fund.
              When SPY moves, the whole market moved by roughly the same amount.
            </p>
          </div>
          <div className="p-3 rounded-lg bg-secondary/50 border border-border">
            <p className="font-bold mb-1">💼 Your Portfolio %</p>
            <p className="text-muted-foreground leading-relaxed">
              Each of your stocks' price change today, weighted by how much of your portfolio it takes up.
            </p>
          </div>
          <div className="p-3 rounded-lg bg-secondary/50 border border-border">
            <p className="font-bold mb-1">📊 Sector % Change (Card 1)</p>
            <p className="text-muted-foreground leading-relaxed">
              Each sector uses its official SPDR ETF: Tech → XLK, Comm → XLC, Financials → XLF, Healthcare → XLV, etc.
              These ETFs track hundreds of stocks in that sector, so their daily % = that sector's daily move.
            </p>
          </div>
          <div className="p-3 rounded-lg bg-secondary/50 border border-border">
            <p className="font-bold mb-1">⚖️ S&P 500 Mix (Card 2)</p>
            <p className="text-muted-foreground leading-relaxed">
              These are approximate S&P 500 weights (e.g. Tech = 28.5%). If you hold more Tech than 28.5%,
              you have more Tech exposure than the average market investor.
            </p>
          </div>
          <div className="p-3 rounded-lg bg-blue-500/10 border border-blue-500/30">
            <p className="font-bold mb-1">🕐 When does data update?</p>
            <p className="text-muted-foreground leading-relaxed">
              <strong className="text-foreground">Once per day after market close (4PM EST, weekdays only).</strong>{' '}
              On weekends it always shows Friday's closing data — which is correct since markets are closed.
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
