"use client"

import { useEffect, useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import {
  TrendingUp, TrendingDown, DollarSign, Coins, Gem,
  Droplet, Landmark, Bitcoin, Lightbulb, Info, X,
  CheckCircle2, AlertTriangle,
} from "lucide-react"

// ── Types ──────────────────────────────────────────────────────────────────
interface AssetClass {
  name: string
  label: string
  badge: string
  symbol: string
  price: string
  subPrice: string
  changePercent: number
  flow: 'bought' | 'sold' | 'neutral'
  color: 'green' | 'red' | 'yellow' | 'neutral'
  icon: React.ReactNode
  isActual: boolean
}

// ── Info Panel Data ────────────────────────────────────────────────────────
const INFO_ROWS = [
  {
    symbol: 'SPY', asset: 'Stocks', type: 'ETF',
    what: 'Tracks the S&P 500 index — the 500 largest US companies in one fund',
    why: 'SPY price ≈ S&P 500 index ÷ 9. Index at ~6,900 → SPY ~$690. The % change is identical.',
    ok: true,
  },
  {
    symbol: 'AGG', asset: 'Bonds', type: 'ETF',
    what: 'Tracks the entire US bond market — government + corporate bonds combined',
    why: 'Each $100 share = a slice of the whole US bond market. Great proxy for bond demand.',
    ok: true,
  },
  {
    symbol: 'GLD', asset: 'Gold', type: 'ETF',
    what: 'Each share holds exactly 0.093 oz of physical gold stored in a vault',
    why: 'We convert to real oz price: GLD ÷ 0.093. So $468 ETF ≈ $5,032/oz gold.',
    ok: true,
  },
  {
    symbol: 'BTC', asset: 'Bitcoin', type: 'Actual Price',
    what: 'Real Bitcoin price pulled live from Binance (BTC/USDT pair)',
    why: "This IS the real price — exactly what you'd see on Coinbase or any crypto exchange.",
    ok: true,
  },
  {
    symbol: 'USO', asset: 'Oil', type: 'ETF ⚠️',
    what: 'Holds WTI crude oil futures contracts — NOT physical barrels of oil',
    why: 'USO price ≠ barrel price at all. Oil is ~$70/barrel but USO has its own share price from futures rolling costs + past reverse stock splits. Only use the % change direction.',
    ok: false,
  },
  {
    symbol: 'UUP', asset: 'US Dollar', type: 'ETF',
    what: 'Tracks the US Dollar Index (DXY) — measures dollar strength vs 6 major currencies',
    why: 'Tiny $27/share looks odd but % change is accurate. Green = dollar strengthening.',
    ok: true,
  },
]

// ── Helpers ────────────────────────────────────────────────────────────────
function fmtPrice(price: number, isCrypto = false): string {
  if (isCrypto && price >= 1000)
    return `$${price.toLocaleString('en-US', { maximumFractionDigits: 0 })}`
  return `$${price.toFixed(2)}`
}
function fmtPct(v: number) { return `${v >= 0 ? '+' : ''}${v.toFixed(2)}%` }

// ── Narrative Builder ──────────────────────────────────────────────────────
function generateNarrative(assets: AssetClass[]): string {
  const stocks = assets.find(a => a.symbol === 'SPY')
  const bonds = assets.find(a => a.symbol === 'AGG')
  const gold = assets.find(a => a.symbol === 'GLD')
  const crypto = assets.find(a => a.symbol === 'BTC')
  if (!stocks) return 'Loading market interpretation...'
  if (stocks.changePercent < -3 && (bonds?.changePercent ?? 0) > 1 && (gold?.changePercent ?? 0) > 0)
    return `Risk-off rotation: Investors fled equities (${fmtPct(stocks.changePercent)}) into bonds and gold. This "flight to safety" signals elevated fear.`
  if (stocks.changePercent > 2 && (bonds?.changePercent ?? 0) < 0)
    return `Risk-on rally: Strong buying in stocks (${fmtPct(stocks.changePercent)}) while investors rotated out of bonds. Growing confidence in the economy.`
  if ((crypto?.changePercent ?? 0) > 5 && stocks.changePercent > 0)
    return `Broad risk appetite: Equities (${fmtPct(stocks.changePercent)}) and Bitcoin (${fmtPct(crypto!.changePercent)}) rallied together — investors are in a "buy everything" mood.`
  if (stocks.changePercent > 0.5)
    return `Positive session: Equities moved higher by ${fmtPct(stocks.changePercent)}. Investor sentiment is constructive with buying across asset classes.`
  if (stocks.changePercent < -0.5)
    return `Cautious session: Stocks pulled back ${fmtPct(stocks.changePercent)}. Investors appear to be reassessing risk before making large moves.`
  return `Mixed signals: No clear directional bias today with stocks at ${fmtPct(stocks.changePercent)}. Investors are waiting for clearer catalysts.`
}

// ── Info Panel ─────────────────────────────────────────────────────────────
function InfoPanel({ onClose }: { onClose: () => void }) {
  return (
    <div className="rounded-xl border border-blue-500/30 bg-blue-500/5 p-5 space-y-4
                    animate-in fade-in slide-in-from-top-2 duration-200">

      {/* Header */}
      <div className="flex items-start justify-between gap-3">
        <div className="flex-1">
          <h3 className="font-bold text-base text-blue-400 flex items-center gap-2">
            <Info className="h-4 w-4 shrink-0" />
            What are these prices?
          </h3>
          <p className="text-sm text-muted-foreground mt-1.5 leading-relaxed">
            Most assets here are <strong className="text-foreground">ETFs</strong> (Exchange-Traded Funds) —
            not direct commodity prices. The <strong className="text-foreground">% change is always accurate</strong>.
            Only the dollar amount can look different from what you Google.
          </p>
        </div>
        <button
          onClick={onClose}
          className="p-1.5 rounded-lg hover:bg-secondary/60 transition-colors shrink-0 mt-0.5"
        >
          <X className="h-4 w-4 text-muted-foreground" />
        </button>
      </div>

      {/* Asset rows */}
      <div className="space-y-2.5">
        {INFO_ROWS.map(row => (
          <div
            key={row.symbol}
            className={`p-4 rounded-xl border ${row.ok
              ? 'bg-secondary/30 border-border'
              : 'bg-orange-500/10 border-orange-500/30'
              }`}
          >
            <div className="flex items-center gap-2 mb-2">
              {row.ok
                ? <CheckCircle2 className="h-4 w-4 text-green-500 shrink-0" />
                : <AlertTriangle className="h-4 w-4 text-orange-500 shrink-0" />
              }
              <span className="font-bold text-sm">{row.asset}</span>
              <span className="text-xs bg-secondary px-2 py-0.5 rounded font-mono text-muted-foreground">
                {row.symbol}
              </span>
              <span className={`text-xs px-2 py-0.5 rounded font-semibold ml-auto ${row.type.includes('⚠️')
                ? 'bg-orange-500/20 text-orange-400'
                : row.type === 'Actual Price'
                  ? 'bg-green-500/20 text-green-400'
                  : 'bg-blue-500/20 text-blue-400'
                }`}>
                {row.type}
              </span>
            </div>
            <p className="text-sm text-muted-foreground leading-relaxed pl-6">
              {row.what}
            </p>
            <p className={`text-sm mt-1.5 leading-relaxed pl-6 font-medium ${row.ok ? 'text-foreground/80' : 'text-orange-400'
              }`}>
              💡 {row.why}
            </p>
          </div>
        ))}
      </div>

      {/* Golden rule */}
      <div className="p-4 rounded-xl bg-green-500/10 border border-green-500/20">
        <p className="font-bold text-sm text-green-400 mb-1.5">✅ The Golden Rule</p>
        <p className="text-sm text-muted-foreground leading-relaxed">
          For <strong className="text-foreground">money flow direction</strong>, always look at the{' '}
          <strong className="text-foreground">% change</strong> — not the dollar price.
          If stocks show <span className="text-green-400 font-bold">+0.72%</span> and bonds show{' '}
          <span className="text-green-400 font-bold">+0.03%</span>, money flowed INTO both. That's the signal.
        </p>
      </div>
    </div>
  )
}

// ── Loading Skeleton ───────────────────────────────────────────────────────
function LoadingSkeleton() {
  return (
    <Card className="border-border bg-card">
      <CardHeader>
        <div className="h-7 w-52 bg-secondary rounded animate-pulse" />
        <div className="h-5 w-72 bg-secondary rounded animate-pulse mt-2" />
      </CardHeader>
      <CardContent>
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {[...Array(6)].map((_, i) => (
            <div key={i} className="h-36 bg-secondary rounded-xl animate-pulse" />
          ))}
        </div>
        <div className="h-24 bg-secondary rounded-xl animate-pulse mt-5" />
      </CardContent>
    </Card>
  )
}

// ── Main Component ─────────────────────────────────────────────────────────
export default function MoneyFlowDashboard({ compact = false }: { compact?: boolean }) {
  const [assets, setAssets] = useState<AssetClass[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(false)
  const [showInfo, setShowInfo] = useState(false)

  useEffect(() => {
    fetch('/api/market-overview')
      .then(r => r.json())
      .then(({ ticker }) => {
        const flowDir = (pct: number): 'bought' | 'sold' | 'neutral' =>
          pct > 0.1 ? 'bought' : pct < -0.1 ? 'sold' : 'neutral'
        const colorDir = (pct: number): 'green' | 'red' =>
          pct >= 0 ? 'green' : 'red'

        const built: AssetClass[] = []

        // Stocks — SPY ETF
        if (ticker.sp500) {
          const indexApprox = Math.round(ticker.sp500.price * 9.0)
          built.push({
            name: 'Stocks', label: 'S&P 500 Index', badge: 'SPY ETF',
            symbol: 'SPY',
            price: `$${ticker.sp500.price.toFixed(2)}`,
            subPrice: `Index ≈ ${indexApprox.toLocaleString('en-US')}`,
            changePercent: ticker.sp500.changePercent,
            flow: flowDir(ticker.sp500.changePercent), color: colorDir(ticker.sp500.changePercent),
            icon: <TrendingUp className="h-5 w-5" />, isActual: false,
          })
        }

        // Bonds — AGG ETF
        if (ticker.bonds) built.push({
          name: 'Bonds', label: 'US Bond Market', badge: 'AGG ETF',
          symbol: 'AGG',
          price: `$${ticker.bonds.price.toFixed(2)}`,
          subPrice: 'US Aggregate Bond Index',
          changePercent: ticker.bonds.changePercent,
          flow: flowDir(ticker.bonds.changePercent), color: colorDir(ticker.bonds.changePercent),
          icon: <Landmark className="h-5 w-5" />, isActual: false,
        })

        // Gold — GLD converted to real oz price
        if (ticker.gold) {
          const ozPrice = ticker.gold.price / 0.0930
          built.push({
            name: 'Gold', label: 'Gold / Troy oz', badge: 'GLD ETF',
            symbol: 'GLD',
            price: `$${ozPrice.toLocaleString('en-US', { maximumFractionDigits: 0 })}/oz`,
            subPrice: `ETF share: $${ticker.gold.price.toFixed(2)}`,
            changePercent: ticker.gold.changePercent,
            flow: flowDir(ticker.gold.changePercent), color: colorDir(ticker.gold.changePercent),
            icon: <Gem className="h-5 w-5" />, isActual: false,
          })
        }

        // Bitcoin — actual price
        if (ticker.bitcoin) built.push({
          name: 'Crypto', label: 'Bitcoin', badge: 'Actual Price ✓',
          symbol: 'BTC',
          price: fmtPrice(ticker.bitcoin.price, true),
          subPrice: 'BTC / USD — Real price',
          changePercent: ticker.bitcoin.changePercent,
          flow: flowDir(ticker.bitcoin.changePercent), color: 'yellow',
          icon: <Bitcoin className="h-5 w-5" />, isActual: true,
        })

        // Oil — USO ETF (NOT barrel price)
        if (ticker.oil) built.push({
          name: 'Oil', label: 'Crude Oil (Proxy)', badge: 'USO ETF ≠ barrel',
          symbol: 'USO',
          price: `$${ticker.oil.price.toFixed(2)}`,
          subPrice: '⚠️ Use % change only',
          changePercent: ticker.oil.changePercent,
          flow: flowDir(ticker.oil.changePercent), color: colorDir(ticker.oil.changePercent),
          icon: <Droplet className="h-5 w-5" />, isActual: false,
        })

        // US Dollar — UUP ETF
        if (ticker.usdDollar) built.push({
          name: 'US Dollar', label: 'Dollar Strength', badge: 'UUP ETF',
          symbol: 'UUP',
          price: `$${ticker.usdDollar.price.toFixed(2)}`,
          subPrice: 'Dollar Index proxy (DXY)',
          changePercent: ticker.usdDollar.changePercent,
          flow: flowDir(ticker.usdDollar.changePercent), color: colorDir(ticker.usdDollar.changePercent),
          icon: <DollarSign className="h-5 w-5" />, isActual: false,
        })

        setAssets(built)
        setLoading(false)
      })
      .catch(() => { setError(true); setLoading(false) })
  }, [])

  if (loading) return <LoadingSkeleton />
  if (error || assets.length === 0) return (
    <Card className="border-border bg-card">
      <CardContent className="p-8 text-center text-muted-foreground text-base">
        Unable to load money flow data
      </CardContent>
    </Card>
  )

  const narrative = generateNarrative(assets)

  return (
    <Card className="border-border bg-card">
      <CardHeader className="pb-4">
        <div className="flex items-center gap-3">

          {/* ── ℹ️ Info Button ─────────────────────────────────────── */}
          <button
            onClick={() => setShowInfo(v => !v)}
            className={`p-2 rounded-full border transition-all shrink-0 ${showInfo
              ? 'bg-blue-500/20 border-blue-500/40 text-blue-400'
              : 'bg-secondary/60 border-border text-muted-foreground hover:text-foreground hover:bg-secondary'
              }`}
            title="What are these prices?"
          >
            {showInfo ? <X className="h-4 w-4" /> : <Info className="h-4 w-4" />}
          </button>

          <div>
            <CardTitle className="text-xl font-bold flex items-center gap-2">
              <Coins className="h-5 w-5 text-blue-500" />
              Money Flow Dashboard
            </CardTitle>
            <p className="text-sm text-muted-foreground mt-0.5">
              Track where money is flowing across major asset classes today
              <button
                onClick={() => setShowInfo(v => !v)}
                className="text-blue-400 ml-2 hover:underline text-sm"
              >
                · tap ℹ️ to understand prices
              </button>
            </p>
          </div>
        </div>
      </CardHeader>

      <CardContent className="space-y-5">

        {/* Info Panel */}
        {showInfo && <InfoPanel onClose={() => setShowInfo(false)} />}

        {/* ── Asset Grid ────────────────────────────────────────────── */}
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {assets.map(asset => {
            const isPos = asset.changePercent >= 0
            const bgBorder =
              asset.color === 'green' ? 'bg-green-500/10 border-green-500/30' :
                asset.color === 'red' ? 'bg-red-500/10 border-red-500/30' :
                  'bg-yellow-500/10 border-yellow-500/30'
            const iconColor =
              asset.color === 'green' ? 'text-green-500' :
                asset.color === 'red' ? 'text-red-500' :
                  'text-yellow-500'

            return (
              <div
                key={asset.symbol}
                className={`p-5 rounded-xl border-2 transition-all hover:scale-[1.02] ${bgBorder}`}
              >
                {/* ── Top Row: icon + label + flow ─────────────────── */}
                <div className="flex items-start justify-between mb-4">
                  <div className="flex items-center gap-3">
                    <div className={`p-2.5 rounded-full bg-background shrink-0 ${iconColor}`}>
                      {asset.icon}
                    </div>
                    <div>
                      {/* Asset name — now clearly readable */}
                      <p className="font-bold text-base leading-tight">{asset.label}</p>
                      {/* Badge */}
                      <span className={`inline-block mt-1 text-xs px-2 py-0.5 rounded-full font-medium ${asset.isActual
                        ? 'bg-green-500/20 text-green-400'
                        : asset.badge.includes('⚠️')
                          ? 'bg-orange-500/20 text-orange-400'
                          : 'bg-secondary text-muted-foreground'
                        }`}>
                        {asset.badge}
                      </span>
                    </div>
                  </div>

                  {/* Flow status */}
                  <div className="flex flex-col items-end gap-1 shrink-0">
                    {asset.flow === 'bought' && <TrendingUp className="h-5 w-5 text-green-500" />}
                    {asset.flow === 'sold' && <TrendingDown className="h-5 w-5 text-red-500" />}
                    <span className="text-xs text-muted-foreground uppercase font-medium tracking-wide">
                      {asset.flow}
                    </span>
                  </div>
                </div>

                {/* ── Price — big & bold ───────────────────────────── */}
                <p className="text-3xl font-bold tracking-tight mb-1">
                  {asset.price}
                </p>

                {/* ── Sub price ────────────────────────────────────── */}
                <p className={`text-sm mb-2 ${asset.subPrice.includes('⚠️') ? 'text-orange-400 font-medium' : 'text-muted-foreground'
                  }`}>
                  {asset.subPrice}
                </p>

                {/* ── % Change — prominent ─────────────────────────── */}
                <div className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-sm font-bold ${isPos
                  ? 'bg-green-500/20 text-green-400'
                  : 'bg-red-500/20 text-red-400'
                  }`}>
                  {isPos
                    ? <TrendingUp className="h-3.5 w-3.5" />
                    : <TrendingDown className="h-3.5 w-3.5" />
                  }
                  {fmtPct(asset.changePercent)}
                </div>
              </div>
            )
          })}
        </div>

        {/* ── Market Interpretation ──────────────────────────────────── */}
        {!compact && (
          <div className="p-5 rounded-xl bg-blue-500/10 border-2 border-blue-500/30">
            <div className="flex items-start gap-4">
              <div className="p-2.5 rounded-full bg-blue-500/20 shrink-0 mt-0.5">
                <Lightbulb className="h-5 w-5 text-blue-500" />
              </div>
              <div>
                <h4 className="font-bold text-base mb-1.5">Market Interpretation</h4>
                <p className="text-sm text-muted-foreground leading-relaxed">{narrative}</p>
              </div>
            </div>
          </div>
        )}

        {/* ── Legend ────────────────────────────────────────────────── */}
        <div className="flex items-center justify-center gap-6 pt-1 text-sm text-muted-foreground flex-wrap">
          <div className="flex items-center gap-1.5">
            <TrendingUp className="h-4 w-4 text-green-500" />
            <span>Money flowing in</span>
          </div>
          <div className="flex items-center gap-1.5">
            <TrendingDown className="h-4 w-4 text-red-500" />
            <span>Money flowing out</span>
          </div>
          <div className="flex items-center gap-1.5 opacity-70">
            <Info className="h-4 w-4 text-blue-400" />
            <span>Click ℹ️ top-left to understand each price</span>
          </div>
        </div>

      </CardContent>
    </Card>
  )
}
