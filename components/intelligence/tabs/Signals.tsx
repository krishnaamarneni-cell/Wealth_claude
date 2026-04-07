'use client'

import type { SignalsData } from '@/types/intelligence'
import { ActionLinks } from '../shared'
import { ExternalLink, Radio } from 'lucide-react'

export function Signals({ data }: { data: SignalsData }) {
  if (!data || !data.items || data.items.length === 0) return <EmptyState />

  const { title, subtitle, items, action_links } = data

  return (
    <div className="space-y-4">
      {/* Header */}
      {(title || subtitle) && (
        <div className="mb-2">
          {title && <h3 className="text-sm font-semibold">{title}</h3>}
          {subtitle && <p className="text-xs text-muted-foreground">{subtitle}</p>}
        </div>
      )}

      {/* Signal items */}
      <div className="space-y-2">
        {items.map((item) => (
          <div key={item.rank} className="bg-card border rounded-xl p-4 hover:border-primary/30 transition-colors">
            <div className="flex items-start gap-3">
              <div className="flex items-center justify-center w-8 h-8 rounded-lg bg-primary/10 text-primary shrink-0">
                <span className="text-sm font-bold">{item.rank}</span>
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-1">
                  <span className="font-semibold text-sm">{item.signal}</span>
                  {item.category && (
                    <span className="text-[10px] font-medium px-2 py-0.5 rounded bg-secondary text-muted-foreground">
                      {item.category}
                    </span>
                  )}
                </div>
                <p className="text-xs text-muted-foreground mb-2">{item.description}</p>
                <div className="flex items-center gap-3">
                  <span className="text-[10px] text-muted-foreground flex items-center gap-1">
                    <Radio className="h-3 w-3" /> {item.timeline}
                  </span>
                  {item.learn_more_url && (
                    <a href={item.learn_more_url} target="_blank" rel="noopener noreferrer" className="text-[10px] text-primary flex items-center gap-0.5">
                      Learn more <ExternalLink className="h-3 w-3" />
                    </a>
                  )}
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>

      <ActionLinks links={action_links} />
    </div>
  )
}

function EmptyState() {
  return (
    <div className="text-center py-12 text-muted-foreground">
      <p className="text-sm">No signals data available yet.</p>
    </div>
  )
}
