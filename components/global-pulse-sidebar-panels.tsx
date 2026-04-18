"use client"

import { useEffect, useState } from "react"
import { TrendingUp, TrendingDown, Bitcoin, Coins, Activity, Package, ChevronUp, ChevronDown } from "lucide-react"

// ─── Crypto Panel ────────────────────────────────────────────────────────
interface Coin {
  id: string
  symbol: string
  name: string
  price: number
  change24h: number
  image?: string
}

export function CryptoPanel() {
  const [coins, setCoins] = useState<Coin[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetch('/api/global-pulse/crypto')
      .then(r => r.json())
      .then(d => setCoins(d.coins || []))
      .catch(() => {})
      .finally(() => setLoading(false))
  }, [])

  if (loading) return <SidebarSkeleton label="Crypto" rows={3} />
  if (coins.length === 0) return null

  return (
    <SidebarCard storageKey="crypto" title="Crypto" icon={<Bitcoin className="h-4 w-4 text-amber-500" />}>
      <div className="space-y-2">
        {coins.slice(0, 5).map(c => {
          const up = c.change24h >= 0
          return (
            <div key={c.id} className="flex items-center justify-between gap-2 py-1">
              <div className="flex items-center gap-2 min-w-0">
                {c.image && <img src={c.image} alt={c.symbol} className="w-5 h-5 rounded-full shrink-0" />}
                <div className="min-w-0">
                  <p className="text-xs font-bold">{c.symbol}</p>
                  <p className="text-[10px] text-muted-foreground truncate max-w-[80px]">{c.name}</p>
                </div>
              </div>
              <div className="text-right shrink-0">
                <p className="text-xs font-semibold tabular-nums">
                  ${c.price < 1 ? c.price.toFixed(4) : c.price.toLocaleString('en-US', { maximumFractionDigits: 2 })}
                </p>
                <p className={`text-[10px] font-semibold tabular-nums ${up ? 'text-green-500' : 'text-red-500'}`}>
                  {up ? '+' : ''}{c.change24h?.toFixed(2)}%
                </p>
              </div>
            </div>
          )
        })}
      </div>
    </SidebarCard>
  )
}

// ─── Commodities Panel ──────────────────────────────────────────────────
interface Ticker {
  price: number
  change: number
  changePercent: number
}

export function CommoditiesPanel() {
  const [data, setData] = useState<Record<string, Ticker | null>>({})
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetch('/api/market-overview')
      .then(r => r.json())
      .then(d => {
        setData({
          gold: d.ticker?.gold,
          silver: d.ticker?.silver,
          oil: d.ticker?.oil,
          natgas: d.ticker?.natgas,
          copper: d.ticker?.copper,
        })
      })
      .catch(() => {})
      .finally(() => setLoading(false))
  }, [])

  const items = [
    { key: 'gold', label: 'Gold', icon: '🥇', symbol: 'GLD' },
    { key: 'silver', label: 'Silver', icon: '🥈', symbol: 'SLV' },
    { key: 'oil', label: 'Oil', icon: '🛢️', symbol: 'USO' },
    { key: 'natgas', label: 'Nat Gas', icon: '🔥', symbol: 'UNG' },
    { key: 'copper', label: 'Copper', icon: '🟫', symbol: 'CPER' },
  ]

  if (loading) return <SidebarSkeleton label="Commodities" rows={3} />

  const visible = items.filter(i => data[i.key])
  if (visible.length === 0) return null

  return (
    <SidebarCard storageKey="commodities" title="Commodities" icon={<Package className="h-4 w-4 text-amber-500" />}>
      <div className="space-y-2">
        {visible.map(i => {
          const t = data[i.key]!
          const up = t.changePercent >= 0
          return (
            <div key={i.key} className="flex items-center justify-between gap-2 py-1">
              <div className="flex items-center gap-2 min-w-0">
                <span className="text-base">{i.icon}</span>
                <div>
                  <p className="text-xs font-bold">{i.label}</p>
                  <p className="text-[10px] text-muted-foreground">{i.symbol}</p>
                </div>
              </div>
              <div className="text-right shrink-0">
                <p className="text-xs font-semibold tabular-nums">
                  ${t.price.toLocaleString('en-US', { maximumFractionDigits: 2 })}
                </p>
                <p className={`text-[10px] font-semibold tabular-nums ${up ? 'text-green-500' : 'text-red-500'}`}>
                  {up ? '+' : ''}{t.changePercent.toFixed(2)}%
                </p>
              </div>
            </div>
          )
        })}
      </div>
    </SidebarCard>
  )
}

// ─── Macro Stress Panel ─────────────────────────────────────────────────
interface MacroItem { symbol: string; price: number; change: number; changePct: number }

export function MacroStressPanel() {
  const [macro, setMacro] = useState<{ vixy?: MacroItem | null; tlt?: MacroItem | null; shy?: MacroItem | null }>({})
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetch('/api/global-pulse/macro')
      .then(r => r.json())
      .then(setMacro)
      .catch(() => {})
      .finally(() => setLoading(false))
  }, [])

  if (loading) return <SidebarSkeleton label="Macro Stress" rows={2} />
  if (!macro.vixy && !macro.tlt) return null

  // VIXY level interpretation
  const vixyPrice = macro.vixy?.price || 0
  let stressLabel = 'Low'
  let stressColor = 'text-green-500'
  if (vixyPrice > 35) { stressLabel = 'High'; stressColor = 'text-red-500' }
  else if (vixyPrice > 25) { stressLabel = 'Elevated'; stressColor = 'text-amber-500' }
  else if (vixyPrice > 18) { stressLabel = 'Moderate'; stressColor = 'text-yellow-500' }

  return (
    <SidebarCard storageKey="macro" title="Macro Stress" icon={<Activity className="h-4 w-4 text-red-500" />}>
      <div className="space-y-3">
        {macro.vixy && (
          <div>
            <div className="flex items-center justify-between mb-1">
              <span className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">Volatility (VIXY)</span>
              <span className={`text-[10px] font-bold uppercase ${stressColor}`}>{stressLabel}</span>
            </div>
            <div className="flex items-baseline gap-2">
              <span className="text-lg font-bold tabular-nums">${macro.vixy.price.toFixed(2)}</span>
              <span className={`text-xs font-semibold tabular-nums ${macro.vixy.changePct >= 0 ? 'text-red-500' : 'text-green-500'}`}>
                {macro.vixy.changePct >= 0 ? '+' : ''}{macro.vixy.changePct.toFixed(2)}%
              </span>
            </div>
          </div>
        )}

        {macro.tlt && (
          <div className="pt-2 border-t border-border/50">
            <div className="flex items-center justify-between mb-1">
              <span className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">20Y Treasury (TLT)</span>
            </div>
            <div className="flex items-baseline gap-2">
              <span className="text-sm font-semibold tabular-nums">${macro.tlt.price.toFixed(2)}</span>
              <span className={`text-xs font-semibold tabular-nums ${macro.tlt.changePct >= 0 ? 'text-green-500' : 'text-red-500'}`}>
                {macro.tlt.changePct >= 0 ? '+' : ''}{macro.tlt.changePct.toFixed(2)}%
              </span>
            </div>
          </div>
        )}
      </div>
    </SidebarCard>
  )
}

// ─── Shared UI ──────────────────────────────────────────────────────────

function SidebarCard({
  title, icon, children, defaultOpen = true, storageKey,
}: {
  title: string
  icon: React.ReactNode
  children: React.ReactNode
  defaultOpen?: boolean
  storageKey?: string
}) {
  const [open, setOpen] = useState<boolean>(() => {
    if (typeof window === 'undefined' || !storageKey) return defaultOpen
    const saved = localStorage.getItem(`gp-card-${storageKey}`)
    if (saved === null) return defaultOpen
    return saved === 'true'
  })

  const toggle = () => {
    const next = !open
    setOpen(next)
    if (storageKey && typeof window !== 'undefined') {
      localStorage.setItem(`gp-card-${storageKey}`, String(next))
    }
  }

  return (
    <div className="rounded-xl border bg-card overflow-hidden">
      <button
        onClick={toggle}
        className="w-full flex items-center gap-2 px-4 py-3 hover:bg-secondary/30 transition-colors"
        aria-expanded={open}
      >
        {icon}
        <span className="text-xs font-bold uppercase tracking-wider flex-1 text-left">{title}</span>
        {open ? <ChevronUp className="h-4 w-4 text-muted-foreground" /> : <ChevronDown className="h-4 w-4 text-muted-foreground" />}
      </button>
      {open && <div className="px-4 pb-4">{children}</div>}
    </div>
  )
}

function SidebarSkeleton({ label, rows }: { label: string; rows: number }) {
  return (
    <div className="rounded-xl border bg-card p-4">
      <div className="flex items-center gap-2 mb-3">
        <div className="h-4 w-4 bg-secondary rounded animate-pulse" />
        <span className="text-xs font-bold uppercase tracking-wider text-muted-foreground">{label}</span>
      </div>
      <div className="space-y-2">
        {[...Array(rows)].map((_, i) => (
          <div key={i} className="h-8 bg-secondary rounded animate-pulse" />
        ))}
      </div>
    </div>
  )
}
