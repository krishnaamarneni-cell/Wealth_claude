'use client'

import { TrendingUp, TrendingDown, Minus, ExternalLink } from 'lucide-react'

// ─── Heat Bar (0-100 colored bar) ─────────────────────────────────────────────
export function HeatBar({ value, color, label, showPct = true }: {
  value: number
  color: string
  label?: string
  showPct?: boolean
}) {
  return (
    <div className="space-y-1">
      {label && (
        <div className="flex items-center justify-between text-xs">
          <span className="text-muted-foreground">{label}</span>
          {showPct && <span className="font-medium" style={{ color }}>{value}%</span>}
        </div>
      )}
      <div className="h-2 bg-secondary rounded-full overflow-hidden">
        <div
          className="h-full rounded-full transition-all duration-500"
          style={{ width: `${Math.min(100, Math.max(0, value))}%`, backgroundColor: color }}
        />
      </div>
    </div>
  )
}

// ─── Status Badge ─────────────────────────────────────────────────────────────
const statusStyles: Record<string, { bg: string; text: string }> = {
  breaking: { bg: 'bg-red-500/20', text: 'text-red-400' },
  escalating: { bg: 'bg-orange-500/20', text: 'text-orange-400' },
  structural: { bg: 'bg-blue-500/20', text: 'text-blue-400' },
  watch: { bg: 'bg-amber-500/20', text: 'text-amber-400' },
  emerging: { bg: 'bg-purple-500/20', text: 'text-purple-400' },
  'de-escalating': { bg: 'bg-green-500/20', text: 'text-green-400' },
  'peak-risk': { bg: 'bg-red-600/20', text: 'text-red-500' },
  underdeveloped: { bg: 'bg-gray-500/20', text: 'text-gray-400' },
  '20yr-signal': { bg: 'bg-indigo-500/20', text: 'text-indigo-400' },
}

export function StatusBadge({ status }: { status: string }) {
  const style = statusStyles[status] || { bg: 'bg-secondary', text: 'text-muted-foreground' }
  return (
    <span className={`text-[10px] font-semibold uppercase tracking-wide px-2 py-0.5 rounded ${style.bg} ${style.text}`}>
      {status.replace('-', ' ')}
    </span>
  )
}

// ─── Stat Card ────────────────────────────────────────────────────────────────
export function StatCard({ label, value, subtitle, color }: {
  label: string
  value: string
  subtitle?: string
  color?: string
}) {
  return (
    <div className="bg-card border rounded-xl p-4">
      <div className="text-[10px] font-medium uppercase tracking-wide text-muted-foreground mb-1">{label}</div>
      <div className="text-xl font-bold" style={color ? { color } : undefined}>{value}</div>
      {subtitle && <div className="text-xs text-muted-foreground mt-0.5">{subtitle}</div>}
    </div>
  )
}

// ─── Noise/Signal Dots ────────────────────────────────────────────────────────
export function NoiseDots({ level, type }: { level: number; type: 'noise' | 'signal' }) {
  const color = type === 'noise' ? '#ef4444' : '#10b981'
  return (
    <div className="flex gap-0.5">
      {[1, 2, 3, 4, 5].map(i => (
        <div
          key={i}
          className="w-1.5 h-1.5 rounded-full"
          style={{ backgroundColor: i <= level ? color : 'rgba(255,255,255,0.1)' }}
        />
      ))}
    </div>
  )
}

// ─── Trend Indicator ──────────────────────────────────────────────────────────
export function TrendIndicator({ trend }: { trend: 'up' | 'down' | 'flat' }) {
  if (trend === 'up') return <TrendingUp className="h-3.5 w-3.5 text-red-400" />
  if (trend === 'down') return <TrendingDown className="h-3.5 w-3.5 text-green-400" />
  return <Minus className="h-3.5 w-3.5 text-muted-foreground" />
}

// ─── Section Wrapper ──────────────────────────────────────────────────────────
export function Section({ title, badge, badgeColor, children }: {
  title: string
  badge?: string
  badgeColor?: string
  children: React.ReactNode
}) {
  return (
    <div className="space-y-3">
      <div className="flex items-center gap-2">
        <h3 className="text-sm font-semibold">{title}</h3>
        {badge && (
          <span
            className="text-[10px] font-medium px-2 py-0.5 rounded"
            style={{ backgroundColor: `${badgeColor || '#6366f1'}20`, color: badgeColor || '#6366f1' }}
          >
            {badge}
          </span>
        )}
      </div>
      {children}
    </div>
  )
}

// ─── Action Links ─────────────────────────────────────────────────────────────
export function ActionLinks({ links }: { links: { label: string; url?: string }[] }) {
  if (!links || links.length === 0) return null
  return (
    <div className="flex flex-wrap gap-2 pt-3 border-t border-border/50">
      {links.map((link, i) => (
        link.url ? (
          <a
            key={i}
            href={link.url}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-1 text-xs text-primary hover:underline"
          >
            {link.label} <ExternalLink className="h-3 w-3" />
          </a>
        ) : (
          <span key={i} className="text-xs text-muted-foreground">{link.label}</span>
        )
      ))}
    </div>
  )
}

// ─── Live Dot ─────────────────────────────────────────────────────────────────
export function LiveDot() {
  return <div className="w-2 h-2 bg-red-500 rounded-full animate-pulse" />
}
