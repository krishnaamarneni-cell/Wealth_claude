'use client'

import type { ThreatIndexData } from '@/types/intelligence'
import { HeatBar, Section } from '../shared'

export function ThreatIndex({ data }: { data: ThreatIndexData }) {
  if (!data) return <EmptyState />

  const { title, subtitle, dimensions, scenario_watch, contrarian } = data

  // Composite score = average of all dimensions
  const compositeScore = dimensions && dimensions.length > 0
    ? Math.round(dimensions.reduce((sum, d) => sum + d.score, 0) / dimensions.length)
    : 0

  return (
    <div className="space-y-6">
      {/* Header with composite score */}
      <div className="bg-card border rounded-xl p-6 text-center">
        <div className="text-[10px] font-medium uppercase tracking-wide text-muted-foreground mb-2">
          {title || 'Composite Threat Index'}
        </div>
        <div className="text-5xl font-bold mb-1" style={{
          color: compositeScore > 70 ? '#ef4444' : compositeScore > 40 ? '#f59e0b' : '#10b981'
        }}>
          {compositeScore}
        </div>
        <div className="text-xs text-muted-foreground">{subtitle || 'out of 100'}</div>
      </div>

      {/* Dimensions */}
      {dimensions && dimensions.length > 0 && (
        <Section title="Threat Dimensions">
          <div className="bg-card border rounded-xl p-4 space-y-3">
            {dimensions.map((d, i) => (
              <HeatBar key={i} value={d.score} color={d.color} label={d.name} />
            ))}
          </div>
        </Section>
      )}

      {/* Scenario Watch */}
      {scenario_watch && scenario_watch.length > 0 && (
        <Section title="Scenario Watch">
          <div className="space-y-2">
            {scenario_watch.map((s, i) => (
              <div key={i} className="bg-card border rounded-xl p-4">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm font-semibold">{s.scenario}</span>
                  <span className="text-xs font-medium px-2 py-0.5 rounded bg-amber-500/20 text-amber-400">
                    {s.probability}
                  </span>
                </div>
                <p className="text-xs text-muted-foreground">{s.description}</p>
              </div>
            ))}
          </div>
        </Section>
      )}

      {/* Contrarian Insight */}
      {contrarian && (
        <div className="bg-indigo-500/5 border border-indigo-500/20 rounded-xl p-4">
          <div className="flex items-center gap-2 mb-2">
            <h3 className="text-sm font-semibold text-indigo-400">{contrarian.title}</h3>
            {contrarian.badge && (
              <span className="text-[10px] font-medium px-2 py-0.5 rounded bg-indigo-500/20 text-indigo-400">
                {contrarian.badge}
              </span>
            )}
          </div>
          <p className="text-sm text-muted-foreground leading-relaxed mb-3">{contrarian.text}</p>
          {contrarian.tags && (
            <div className="flex flex-wrap gap-1">
              {contrarian.tags.map((tag, i) => (
                <span key={i} className="text-[10px] px-2 py-0.5 rounded bg-secondary text-muted-foreground">
                  {tag}
                </span>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  )
}

function EmptyState() {
  return (
    <div className="text-center py-12 text-muted-foreground">
      <p className="text-sm">No threat index data available yet.</p>
    </div>
  )
}
