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
  label: string       // what it actually represents (e.g. "S&P 500 Index")
  badge: string       // short badge text (e.g. "SPY ETF")
  symbol: string
  price: string       // primary display price
  subPrice: string       // secondary line (e.g. converted real price)
  changePercent: number
  flow: 'bought' | 'sold' | 'neutral'
  color: 'green' | 'red' | 'yellow' | 'neutral'
  icon: React.ReactNode
  isActual: boolean      // true = real price, false = ETF proxy
  infoNote: string       // shown inside info panel
}

// ── Info Panel Data ────────────────────────────────────────────────────────
const INFO_ROWS = [
  {
    symbol: 'SPY',
    asset: 'Stocks',
    type: 'ETF',
    what: 'Tracks the S&P 500 index — 500 largest US companies',
    why: 'SPY price ≈ S&P 500 index ÷ 9. Index at ~6,200 → SPY ~$689. Same % change.',
    ok: true,
  },
  {
    symbol: 'AGG',
    asset: 'Bonds',
    type: 'ETF',
    what: 'Tracks the US Aggregate Bond market (government + corporate bonds)',
    why: 'Each share = a slice of the entire US bond market. $100/share is normal.',
    ok: true,
  },
  {
    symbol: 'GLD',
    asset: 'Gold',
    type: 'ETF',
    what: 'Each share holds ~0.093 oz of physical gold in a vault',
    why: 'We calculate the real oz price: GLD price ÷ 0.093. So $274 ETF ≈ $2,946/oz.',
    ok: true,
  },
  {
    symbol: 'BTC',
    asset: 'Bitcoin',
    type: 'Actual Price',
    what: 'Real Bitcoin price pulled from Binance (BTC/USDT)',
    why: "This IS the real price — no conversion needed. What you'd see on Coinbase.",
    ok: true,
  },
  {
    symbol: 'USO',
    asset: 'Oil',
    type: 'ETF ⚠️',
    what: 'Holds WTI crude oil futures contracts — NOT physical barrels',
    why: "USO price ≠ barrel price. Oil ~$64/barrel but USO trades at its own share price due to futures rolling costs and past reverse stock splits. Use % change only.",
    ok: false,
  },
  {
    symbol: 'UUP',
    asset: 'US Dollar',
    type: 'ETF',
    what: 'Tracks the US Dollar Index (DXY) — dollar strength vs major currencies',
    why: 'Small ETF so $27/share looks odd, but % change accurately reflects if dollar is strengthening or weakening.',
    ok: true,
  },
]

// ── Helpers ────────────────────────────────────────────────────────────────
function fmtPrice(price: number, isCrypto = false): string {
  if (isCrypto && price >= 1000)
    return `$${price.toLocaleString('en-US', { maximumFractionDigits: 0 })}`
  return `$${price.toFixed(2)}`
}
function fmtPct(v: number): string {
  return `${v >= 0 ? '+' : ''}${v.toFixed(2)}%`
}

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
    <div className="rounded-xl border border-blue-500/30 bg-blue-500/5 p-4 space-y-4 animate-in fade-in slide-in-from-top-2 duration-200">

      {/* Header */}
      <div className="flex items-start justify-between gap-3">
        <div>
          <h3 className="font-bold text-sm text-blue-400 flex items-center gap-1.5">
            <Info className="h-4 w-4" />
            What are these prices?
          </h3>
          <p className="text-xs text-muted-foreground mt-1">
            Most assets here are <strong>ETFs</strong> (Exchange-Traded Funds) — not the direct commodity prices.
            The <strong>% change is always accurate</strong> for tracking money flow.
            Only the absolute price (e.g. $80 for oil) can look different from what you Google.
          </p>
        </div>
        <button
          onClick={onClose}
          className="p-1 rounded-lg hover:bg-secondary/60 transition-colors shrink-0"
        >
          <X className="h-4 w-4 text-muted-foreground" />
        </button>
      </div>

      {/* Asset breakdown table */}
      <div className="space-y-2">
        {INFO_ROWS.map(row => (
          <div
            key={row.symbol}
            className={`p-3 rounded-lg border text-xs ${row.ok
                ? 'bg-secondary/30 border-border'
                : 'bg-orange-500/10 border-orange-500/30'
              }`}
          >
            <div className="flex items-center gap-2 mb-1.5">
              {row.ok
                ? <CheckCircle2 className="h-3.5 w-3.5 text-green-500 shrink-0" />
                : <AlertTriangle className="h-3.5 w-3.5 text-orange-500 shrink-0" />
              }
              <span className="font-bold">{row.asset}</span>
              <span className="text-[10px] bg-secondary px-1.5 py-0.5 rounded font-mono text-muted-foreground">
                {row.symbol}
              </span>
              <span className={`text-[10px] px-1.5 py-0.5 rounded font-semibold ml-auto ${row.type.includes('⚠️')
                  ? 'bg-orange-500/20 text-orange-400'
                  : row.type === 'Actual Price'
                    ? 'bg-green-500/20 text-green-400'
                    : 'bg-blue-500/20 text-blue-400'
                }`}>
                {row.type}
              </span>
            </div>
            <p className="text-muted-foreground leading-relaxed pl-5">{row.what}</p>
            <p className={`mt-1 leading-relaxed pl-5 font-medium ${row.ok ? 'text-foreground/70' : 'text-orange-400'
              }`}>
              💡 {row.why}
            </p>
          </div>
        ))}
      </div>

      {/* Footer rule */}
      <div className="p-3 rounded-lg bg-green-500/10 border border-green-500/20 text-xs">
        <p className="font-semibold text-green-400 mb-0.5">✅ The Golden Rule</p>
        <p className="text-muted-foreground">
          For <strong>money flow direction</strong>, always look at the <strong>% change</strong> — not the dollar price.
          If stocks are <span className="text-green-400">+0.72%</span> and bonds are{' '}
          <span className="text-green-400">+0.03%</span>, money flowed INTO both today. That's the signal.
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
        <div className="h-6 w-48 bg-secondary rounded animate-pulse" />
        <div className="h-4 w-64 bg-secondary rounded animate-pulse mt-1" />
      </CardHeader>
      <CardContent>
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {[...Array(6)].map((_, i) => (
            <div key={i} className="h-32 bg-secondary rounded-lg animate-pulse" />
          ))}
        </div>
        <div className="h-20 bg-secondary rounded-lg animate-pulse mt-6" />
      </CardContent>
    </Card>
  )
}

// ── Main Component ─────────────────────────────────────────────────────────
export default function MoneyFlowDashboard() {
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

        // ── Stocks: SPY → show S&P 500 approximate index value ─────────
        if (ticker.sp500) {
          const indexApprox = Math.round(ticker.sp500.price * 9.0)
          built.push({
            name: 'Stocks', label: 'S&P 500 Index', badge: 'SPY ETF',
            symbol: 'SPY',
            price: `$${ticker.sp500.price.toFixed(2)}`,
            subPrice: `Index ≈ ${indexApprox.toLocaleString('en-US')}`,
            changePercent: ticker.sp500.changePercent,
            flow: flowDir(ticker.sp500.changePercent),
            color: colorDir(ticker.sp500.changePercent),
            icon: <TrendingUp className="h-5 w-5" />,
            isActual: false,
            infoNote: 'ETF price. Index value ≈ SPY × 9',
          })
        }

        // ── Bonds: AGG ─────────────────────────────────────────────────
        if (ticker.bonds) built.push({
          name: 'Bonds', label: 'US Bond Market', badge: 'AGG ETF',
          symbol: 'AGG',
          price: `$${ticker.bonds.price.toFixed(2)}`,
          subPrice: 'US Aggregate Bond Index',
          changePercent: ticker.bonds.changePercent,
          flow: flowDir(ticker.bonds.changePercent),
          color: colorDir(ticker.bonds.changePercent),
          icon: <Landmark className="h-5 w-5" />,
          isActual: false,
          infoNote: 'ETF tracking US bond market health',
        })

        // ── Gold: GLD → convert to real oz price (GLD ÷ 0.0930) ───────
        if (ticker.gold) {
          const goldOzPrice = ticker.gold.price / 0.0930
          built.push({
            name: 'Gold', label: 'Gold / Troy oz', badge: 'GLD ETF',
            symbol: 'GLD',
            price: `$${goldOzPrice.toLocaleString('en-US', { maximumFractionDigits: 0 })}/oz`,
            subPrice: `ETF share: $${ticker.gold.price.toFixed(2)}`,
            changePercent: ticker.gold.changePercent,
            flow: flowDir(ticker.gold.changePercent),
            color: colorDir(ticker.gold.changePercent),
            icon: <Gem className="h-5 w-5" />,
            isActual: false,
            infoNote: 'Converted to real oz price (GLD ÷ 0.093)',
          })
        }

        // ── Bitcoin: ACTUAL price ──────────────────────────────────────
        if (ticker.bitcoin) built.push({
          name: 'Crypto', label: 'Bitcoin', badge: 'Actual Price ✓',
          symbol: 'BTC',
          price: fmtPrice(ticker.bitcoin.price, true),
          subPrice: 'BTC / USD — Real price',
          changePercent: ticker.bitcoin.changePercent,
          flow: flowDir(ticker.bitcoin.changePercent),
          color: 'yellow',
          icon: <Bitcoin className="h-5 w-5" />,
          isActual: true,
          infoNote: 'This IS the real Bitcoin price',
        })

        // ── Oil: USO ETF — clearly labeled as NOT barrel price ─────────
        if (ticker.oil) built.push({
          name: 'Oil', label: 'Crude Oil (Proxy)', badge: 'USO ETF ≠ barrel',
          symbol: 'USO',
          price: `$${ticker.oil.price.toFixed(2)}`,
          subPrice: '⚠️ Use % change only',
          changePercent: ticker.oil.changePercent,
          flow: flowDir(ticker.oil.changePercent),
          color: colorDir(ticker.oil.changePercent),
          icon: <Droplet className="h-5 w-5" />,
          isActual: false,
          infoNote: 'USO ≠ barrel price. See ℹ️ for why',
        })

        // ── US Dollar: UUP ETF ─────────────────────────────────────────
        if (ticker.usdDollar) built.push({
          name: 'US Dollar', label: 'Dollar Strength', badge: 'UUP ETF',
          symbol: 'UUP',
          price: `$${ticker.usdDollar.price.toFixed(2)}`,
          subPrice: 'Dollar Index proxy (DXY)',
          changePercent: ticker.usdDollar.changePercent,
          flow: flowDir(ticker.usdDollar.changePercent),
          color: colorDir(ticker.usdDollar.changePercent),
          icon: <DollarSign className="h-5 w-5" />,
          isActual: false,
          infoNote: '% change = dollar strengthening/weakening',
        })

        setAssets(built)
        setLoading(false)
      })
      .catch(() => { setError(true); setLoading(false) })
  }, [])

  if (loading) return <LoadingSkeleton />
  if (error || assets.length === 0) return (
    <Card className="border-border bg-card">
      <CardContent className="p-8 text-center text-muted-foreground">
        Unable to load money flow data
      </CardContent>
    </Card>
  )

  const narrative = generateNarrative(assets)

  return (
    <Card className="border-border bg-card">
      <CardHeader>
        <div className="flex items-start justify-between gap-3">
          <div className="flex items-center gap-3">

            {/* ── Info Toggle Button ───────────────────────────────── */}
            <button
              onClick={() => setShowInfo(v => !v)}
              className={`p-1.5 rounded-full border transition-all shrink-0 ${showInfo
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
              <p className="text-sm text-muted-foreground">
                Track where money is flowing across major asset classes today
                <span className="text-xs text-blue-400 ml-2 cursor-pointer hover:underline" onClick={() => setShowInfo(v => !v)}>
                  · tap ℹ️ to understand prices
                </span>
              </p>
            </div>
          </div>
        </div>
      </CardHeader>

      <CardContent className="space-y-5">

        {/* ── Info Panel (toggle) ────────────────────────────────────── */}
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
                className={`p-4 rounded-lg border-2 transition-all hover:scale-[1.02] ${bgBorder}`}
              >
                {/* Top row */}
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-2">
                    <div className={`p-2 rounded-full bg-background ${iconColor}`}>
                      {asset.icon}
                    </div>
                    <div>
                      <p className="font-bold text-sm">{asset.label}</p>
                      {/* ETF/Actual badge */}
                      <span className={`text-[10px] px-1.5 py-0.5 rounded font-mono ${asset.isActual
                          ? 'bg-green-500/20 text-green-400'
                          : asset.badge.includes('⚠️')
                            ? 'bg-orange-500/20 text-orange-400'
                            : 'bg-secondary text-muted-foreground'
                        }`}>
                        {asset.badge}
                      </span>
                    </div>
                  </div>

                  {/* Flow indicator */}
                  <div className="flex flex-col items-end">
                    {asset.flow === 'bought' && <TrendingUp className="h-4 w-4 text-green-500" />}
                    {asset.flow === 'sold' && <TrendingDown className="h-4 w-4 text-red-500" />}
                    <span className="text-[10px] text-muted-foreground uppercase mt-1">
                      {asset.flow}
                    </span>
                  </div>
                </div>

                {/* Price */}
                <p className="text-2xl font-bold mb-0.5">{asset.price}</p>

                {/* Sub price line */}
                <p className={`text-[11px] mb-1.5 ${asset.subPrice.includes('⚠️') ? 'text-orange-400' : 'text-muted-foreground'
                  }`}>
                  {asset.subPrice}
                </p>

                {/* % Change */}
                <span className={`font-semibold text-sm ${isPos ? 'text-green-500' : 'text-red-500'}`}>
                  {fmtPct(asset.changePercent)}
                </span>
              </div>
            )
          })}
        </div>

        {/* ── Market Interpretation ──────────────────────────────────── */}
        <div className="p-4 rounded-lg bg-blue-500/10 border-2 border-blue-500/30">
          <div className="flex items-start gap-3">
            <div className="p-2 rounded-full bg-blue-500/20 mt-0.5 shrink-0">
              <Lightbulb className="h-5 w-5 text-blue-500" />
            </div>
            <div>
              <h4 className="font-semibold text-sm mb-1">Market Interpretation</h4>
              <p className="text-sm text-muted-foreground leading-relaxed">{narrative}</p>
            </div>
          </div>
        </div>

        {/* ── Legend ────────────────────────────────────────────────── */}
        <div className="flex items-center justify-center gap-6 pt-1 text-xs text-muted-foreground flex-wrap">
          <div className="flex items-center gap-1">
            <TrendingUp className="h-3 w-3 text-green-500" />
            <span>Money flowing in</span>
          </div>
          <div className="flex items-center gap-1">
            <TrendingDown className="h-3 w-3 text-red-500" />
            <span>Money flowing out</span>
          </div>
          <div className="flex items-center gap-1 opacity-60">
            <Info className="h-3 w-3 text-blue-400" />
            <span>Click ℹ️ top-left to understand each price</span>
          </div>
        </div>

      </CardContent>
    </Card>
  )
}
