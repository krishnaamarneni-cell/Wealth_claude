'use client'

import type { FoodClimateData } from '@/types/intelligence'
import { StatCard, Section, HeatBar, LiveDot } from '../shared'

export function FoodClimate({ data }: { data: FoodClimateData }) {
  if (!data) return <EmptyState />

  const { stats, climate_cascade, tipping_points, description } = data

  return (
    <div className="space-y-6">
      {/* Stats */}
      {stats && stats.length > 0 && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          {stats.map((s, i) => (
            <StatCard key={i} label={s.label} value={s.value} subtitle={s.subtitle} color={s.color} />
          ))}
        </div>
      )}

      {/* Climate Cascade */}
      {climate_cascade && climate_cascade.events && (
        <Section title={climate_cascade.title} badge={climate_cascade.badge} badgeColor="#ef4444">
          <div className="space-y-2">
            {climate_cascade.events.map((event, i) => (
              <div key={i} className="bg-card border rounded-xl p-4">
                <div className="flex items-center gap-2 mb-1">
                  {event.is_active && <LiveDot />}
                  <span className="text-sm font-semibold">{event.title}</span>
                </div>
                <p className="text-xs text-muted-foreground">{event.description}</p>
              </div>
            ))}
          </div>
        </Section>
      )}

      {/* Tipping Points */}
      {tipping_points && tipping_points.points && (
        <Section title={tipping_points.title} badge={tipping_points.badge} badgeColor="#f59e0b">
          <div className="bg-card border rounded-xl p-4 space-y-3">
            {tipping_points.points.map((point, i) => (
              <HeatBar
                key={i}
                value={point.progress_pct}
                color={point.color}
                label={point.name}
              />
            ))}
          </div>
        </Section>
      )}

      {/* Description */}
      {description && (
        <p className="text-sm text-muted-foreground leading-relaxed">{description}</p>
      )}
    </div>
  )
}

function EmptyState() {
  return (
    <div className="text-center py-12 text-muted-foreground">
      <p className="text-sm">No food & climate data available yet.</p>
    </div>
  )
}
