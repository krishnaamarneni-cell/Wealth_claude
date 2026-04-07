'use client'

import type { TechAIData } from '@/types/intelligence'
import { StatCard, Section, ActionLinks } from '../shared'

export function TechAI({ data }: { data: TechAIData }) {
  if (!data) return <EmptyState />

  const { stats, sections, description } = data

  return (
    <div className="space-y-6">
      {/* Stats */}
      {stats && stats.length > 0 && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          {stats.map((s, i) => (
            <StatCard key={i} label={s.label} value={s.value} subtitle={s.subtitle} />
          ))}
        </div>
      )}

      {/* Sections */}
      {sections && sections.map((sec, i) => (
        <Section key={i} title={sec.title} badge={sec.badge} badgeColor={sec.badge_color}>
          <div className="bg-card border rounded-xl p-4 space-y-3">
            <p className="text-sm text-muted-foreground leading-relaxed">{sec.content}</p>

            {sec.subsections && sec.subsections.length > 0 && (
              <div className="space-y-2 pt-2 border-t border-border/50">
                {sec.subsections.map((sub, j) => (
                  <div key={j} className="flex items-start gap-2">
                    {sub.flag && <span className="text-base shrink-0">{sub.flag}</span>}
                    <div>
                      <span className="text-sm font-medium">{sub.label}</span>
                      <p className="text-xs text-muted-foreground">{sub.text}</p>
                    </div>
                  </div>
                ))}
              </div>
            )}

            {sec.action_links && <ActionLinks links={sec.action_links} />}
          </div>
        </Section>
      ))}

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
      <p className="text-sm">No tech & AI data available yet.</p>
    </div>
  )
}
