'use client'

import type { WarRoomData } from '@/types/intelligence'
import { StatCard, HeatBar, LiveDot, ActionLinks } from '../shared'
import { ExternalLink } from 'lucide-react'

export function WarRoom({ data }: { data: WarRoomData }) {
  if (!data || !data.stats) return <EmptyState />

  const { stats, conflicts, escalation_heat, headlines, analysis, action_links } = data

  return (
    <div className="space-y-6">
      {/* Stats row */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <StatCard label={stats.active_conflicts_label || 'Active Conflicts'} value={String(stats.active_conflicts)} color="#ef4444" />
        <StatCard label={stats.key_deadline_label || 'Key Deadline'} value={stats.key_deadline} />
        <StatCard label={stats.commodity_label || 'Commodity'} value={stats.commodity_price} />
        <StatCard label={stats.doomsday_label || 'Doomsday Clock'} value={stats.doomsday_metric} color="#f59e0b" />
      </div>

      {/* Conflicts */}
      {conflicts && conflicts.length > 0 && (
        <div className="space-y-3">
          <h3 className="text-sm font-semibold">Active Conflicts</h3>
          <div className="space-y-2">
            {conflicts.map((c, i) => (
              <div key={i} className="bg-card border rounded-xl p-4">
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2">
                    {c.is_live && <LiveDot />}
                    <span className="font-semibold text-sm">{c.name}</span>
                  </div>
                  <span className="text-xs font-medium" style={{ color: c.escalation_pct > 70 ? '#ef4444' : c.escalation_pct > 40 ? '#f59e0b' : '#10b981' }}>
                    {c.escalation_pct}% escalation
                  </span>
                </div>
                <p className="text-xs text-muted-foreground mb-2">{c.description}</p>
                <HeatBar value={c.escalation_pct} color={c.escalation_pct > 70 ? '#ef4444' : c.escalation_pct > 40 ? '#f59e0b' : '#10b981'} />
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Escalation Heat Map */}
      {escalation_heat && escalation_heat.length > 0 && (
        <div className="space-y-3">
          <h3 className="text-sm font-semibold">Escalation Heat by Region</h3>
          <div className="bg-card border rounded-xl p-4 space-y-3">
            {escalation_heat.map((r, i) => (
              <HeatBar
                key={i}
                value={r.heat_pct}
                color={r.heat_pct > 70 ? '#ef4444' : r.heat_pct > 40 ? '#f59e0b' : '#10b981'}
                label={r.region}
              />
            ))}
          </div>
        </div>
      )}

      {/* Headlines */}
      {headlines && headlines.length > 0 && (
        <div className="space-y-3">
          <h3 className="text-sm font-semibold">Latest Headlines</h3>
          <div className="space-y-2">
            {headlines.map((h, i) => (
              <div key={i} className="flex items-start gap-3 bg-card border rounded-xl p-3">
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium leading-snug">{h.text}</p>
                  <div className="flex items-center gap-2 mt-1 text-[10px] text-muted-foreground">
                    <span>{h.source}</span>
                    <span>•</span>
                    <span>{h.time_ago}</span>
                  </div>
                </div>
                {h.url && (
                  <a href={h.url} target="_blank" rel="noopener noreferrer" className="shrink-0 text-primary">
                    <ExternalLink className="h-3.5 w-3.5" />
                  </a>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Analysis */}
      {analysis && (
        <div className="bg-card border rounded-xl p-4">
          <h3 className="text-sm font-semibold mb-2">Analysis</h3>
          <p className="text-sm text-muted-foreground leading-relaxed">{analysis}</p>
        </div>
      )}

      <ActionLinks links={action_links} />
    </div>
  )
}

function EmptyState() {
  return (
    <div className="text-center py-12 text-muted-foreground">
      <p className="text-sm">No war room data available yet.</p>
    </div>
  )
}
