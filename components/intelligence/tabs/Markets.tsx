'use client'

import type { MarketsData } from '@/types/intelligence'
import { Section, ActionLinks } from '../shared'
import { TrendingUp, TrendingDown, Minus, Eye, Ban } from 'lucide-react'

export function Markets({ data }: { data: MarketsData }) {
  if (!data) return <EmptyState />

  const { commodities, strong_buy, watch, avoid, petrodollar_erosion, safe_haven, description, action_links } = data

  return (
    <div className="space-y-6">
      {/* Commodities */}
      {commodities && commodities.length > 0 && (
        <Section title="Commodities">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            {commodities.map((c, i) => {
              const changeColor = c.change_color === 'green' ? '#10b981' : c.change_color === 'red' ? '#ef4444' : '#94a3b8'
              return (
                <div key={i} className="bg-card border rounded-xl p-3">
                  <div className="text-xs text-muted-foreground mb-1">{c.name}</div>
                  <div className="text-lg font-bold">{c.price}</div>
                  <div className="flex items-center gap-1 text-xs font-medium" style={{ color: changeColor }}>
                    {c.change_color === 'green' ? <TrendingUp className="h-3 w-3" /> :
                     c.change_color === 'red' ? <TrendingDown className="h-3 w-3" /> :
                     <Minus className="h-3 w-3" />}
                    {c.change}
                  </div>
                </div>
              )
            })}
          </div>
        </Section>
      )}

      {/* Buy / Watch / Avoid */}
      <div className="grid md:grid-cols-3 gap-4">
        {/* Strong Buy */}
        {strong_buy && strong_buy.length > 0 && (
          <div className="bg-emerald-500/5 border border-emerald-500/20 rounded-xl p-4">
            <div className="flex items-center gap-2 mb-3">
              <TrendingUp className="h-4 w-4 text-emerald-500" />
              <h3 className="text-sm font-semibold text-emerald-500">Strong Buy</h3>
            </div>
            <div className="space-y-2">
              {strong_buy.map((item, i) => (
                <div key={i} className="text-sm">
                  <span className="font-medium">{item.ticker_or_label}</span>
                  <p className="text-xs text-muted-foreground mt-0.5">{item.reason}</p>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Watch */}
        {watch && watch.length > 0 && (
          <div className="bg-amber-500/5 border border-amber-500/20 rounded-xl p-4">
            <div className="flex items-center gap-2 mb-3">
              <Eye className="h-4 w-4 text-amber-500" />
              <h3 className="text-sm font-semibold text-amber-500">Watch</h3>
            </div>
            <div className="space-y-2">
              {watch.map((item, i) => (
                <div key={i} className="text-sm">
                  <span className="font-medium">{item.ticker_or_label}</span>
                  <p className="text-xs text-muted-foreground mt-0.5">{item.reason}</p>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Avoid */}
        {avoid && avoid.length > 0 && (
          <div className="bg-red-500/5 border border-red-500/20 rounded-xl p-4">
            <div className="flex items-center gap-2 mb-3">
              <Ban className="h-4 w-4 text-red-500" />
              <h3 className="text-sm font-semibold text-red-500">Avoid</h3>
            </div>
            <div className="space-y-2">
              {avoid.map((item, i) => (
                <div key={i} className="text-sm">
                  <span className="font-medium">{item.ticker_or_label}</span>
                  <p className="text-xs text-muted-foreground mt-0.5">{item.reason}</p>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Petrodollar Erosion */}
      {petrodollar_erosion && (
        <div className="bg-card border rounded-xl p-4">
          <h3 className="text-sm font-semibold mb-2">{petrodollar_erosion.title}</h3>
          <p className="text-sm text-muted-foreground leading-relaxed">{petrodollar_erosion.text}</p>
        </div>
      )}

      {/* Safe Haven */}
      {safe_haven && safe_haven.length > 0 && (
        <Section title="Safe Haven Allocation">
          <div className="bg-card border rounded-xl p-4 space-y-3">
            {safe_haven.map((item, i) => (
              <div key={i} className="flex items-center justify-between">
                <span className="text-sm">{item.asset}</span>
                <div className="flex items-center gap-3 flex-1 max-w-[200px] ml-4">
                  <div className="flex-1 h-2 bg-secondary rounded-full overflow-hidden">
                    <div
                      className="h-full bg-primary rounded-full"
                      style={{ width: `${item.allocation_pct}%` }}
                    />
                  </div>
                  <span className="text-xs font-medium w-8 text-right">{item.allocation_pct}%</span>
                </div>
              </div>
            ))}
          </div>
        </Section>
      )}

      {/* Description */}
      {description && (
        <p className="text-sm text-muted-foreground leading-relaxed">{description}</p>
      )}

      <ActionLinks links={action_links} />
    </div>
  )
}

function EmptyState() {
  return (
    <div className="text-center py-12 text-muted-foreground">
      <p className="text-sm">No market data available yet.</p>
    </div>
  )
}
