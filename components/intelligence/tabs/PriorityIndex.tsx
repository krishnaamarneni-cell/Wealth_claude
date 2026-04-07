'use client'

import type { PriorityItem } from '@/types/intelligence'
import { StatusBadge, NoiseDots, TrendIndicator } from '../shared'
import { ExternalLink } from 'lucide-react'

export function PriorityIndex({ data }: { data: PriorityItem[] }) {
  if (!data || data.length === 0) return <EmptyState />

  return (
    <div className="space-y-2">
      {/* Header row */}
      <div className="hidden md:grid grid-cols-12 gap-2 px-4 py-2 text-[10px] font-medium uppercase tracking-wide text-muted-foreground">
        <div className="col-span-1">#</div>
        <div className="col-span-4">Topic</div>
        <div className="col-span-2">Status</div>
        <div className="col-span-1 text-center">Noise</div>
        <div className="col-span-1 text-center">Signal</div>
        <div className="col-span-1 text-center">Trend</div>
        <div className="col-span-2">Summary</div>
      </div>

      {/* Rows */}
      {data.map((item) => (
        <div
          key={item.rank}
          className="bg-card border rounded-xl p-4 hover:border-primary/30 transition-colors"
        >
          {/* Desktop */}
          <div className="hidden md:grid grid-cols-12 gap-2 items-center">
            <div className="col-span-1 text-lg font-bold text-muted-foreground">
              {item.rank}
            </div>
            <div className="col-span-4">
              <div className="font-semibold text-sm">{item.topic}</div>
              <div className="text-xs text-muted-foreground">{item.subtitle}</div>
            </div>
            <div className="col-span-2">
              <StatusBadge status={item.status} />
            </div>
            <div className="col-span-1 flex justify-center">
              <NoiseDots level={item.noise} type="noise" />
            </div>
            <div className="col-span-1 flex justify-center">
              <NoiseDots level={item.signal} type="signal" />
            </div>
            <div className="col-span-1 flex justify-center">
              <TrendIndicator trend={item.trend} />
            </div>
            <div className="col-span-2 text-xs text-muted-foreground line-clamp-2">
              {item.summary}
              {item.learn_more_url && (
                <a href={item.learn_more_url} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-0.5 text-primary ml-1">
                  <ExternalLink className="h-3 w-3" />
                </a>
              )}
            </div>
          </div>

          {/* Mobile */}
          <div className="md:hidden space-y-2">
            <div className="flex items-start justify-between gap-2">
              <div className="flex items-center gap-2">
                <span className="text-lg font-bold text-muted-foreground">{item.rank}</span>
                <div>
                  <div className="font-semibold text-sm">{item.topic}</div>
                  <div className="text-xs text-muted-foreground">{item.subtitle}</div>
                </div>
              </div>
              <TrendIndicator trend={item.trend} />
            </div>
            <div className="flex items-center gap-3">
              <StatusBadge status={item.status} />
              <div className="flex items-center gap-1.5 text-[10px] text-muted-foreground">
                <span>N:</span><NoiseDots level={item.noise} type="noise" />
              </div>
              <div className="flex items-center gap-1.5 text-[10px] text-muted-foreground">
                <span>S:</span><NoiseDots level={item.signal} type="signal" />
              </div>
            </div>
            <p className="text-xs text-muted-foreground">{item.summary}</p>
            {item.learn_more_url && (
              <a href={item.learn_more_url} target="_blank" rel="noopener noreferrer" className="text-xs text-primary flex items-center gap-1">
                Learn more <ExternalLink className="h-3 w-3" />
              </a>
            )}
          </div>
        </div>
      ))}
    </div>
  )
}

function EmptyState() {
  return (
    <div className="text-center py-12 text-muted-foreground">
      <p className="text-sm">No priority data available yet.</p>
    </div>
  )
}
