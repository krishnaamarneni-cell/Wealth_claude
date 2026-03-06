"use client"

import { Card, CardContent } from "@/components/ui/card"
import { SVGDonut, type DonutSegment } from "@/components/goals/shared/SVGDonut"
import type { Debt } from "@/components/goals/types"
import { DEBT_COLORS, formatCompact } from "@/components/goals/types"

interface CreditCardDonutProps {
  debts: Debt[]
}

export function CreditCardDonut({ debts }: CreditCardDonutProps) {
  // Only credit cards for this donut
  const creditCards = debts.filter((d) => d.type === "Credit Card")
  const totalCCDebt = creditCards.reduce((sum, d) => sum + d.balance, 0)
  const totalDebt = debts.reduce((sum, d) => sum + d.balance, 0)
  const weightedAvgAPR =
    totalDebt > 0
      ? debts.reduce((sum, d) => sum + d.balance * d.apr, 0) / totalDebt
      : 0

  // If no credit cards but has other debts, show all debts in donut
  const donutDebts = creditCards.length > 0 ? creditCards : debts
  const donutTotal = donutDebts.reduce((sum, d) => sum + d.balance, 0)

  const segments: DonutSegment[] = donutDebts.map((d, i) => ({
    label: d.name,
    value: d.balance,
    color: DEBT_COLORS[i % DEBT_COLORS.length],
  }))

  return (
    <div className="grid gap-6 lg:grid-cols-2">
      {/* Balance Distribution */}
      <Card className="border-border bg-card">
        <CardContent className="pt-6">
          <p className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground mb-4">
            Balance Distribution
          </p>
          <div className="flex items-center gap-6">
            <SVGDonut
              segments={segments}
              centerLabel="Total Debt"
              centerValue={formatCompact(donutTotal)}
              centerSublabel={`${donutDebts.length} card${donutDebts.length !== 1 ? "s" : ""}`}
            />
            <div className="flex-1 space-y-2">
              {donutDebts.map((d, i) => (
                <div key={d.id} className="flex items-center gap-2">
                  <div
                    className="w-2.5 h-2.5 rounded-full flex-shrink-0"
                    style={{
                      backgroundColor: DEBT_COLORS[i % DEBT_COLORS.length],
                    }}
                  />
                  <span className="text-sm text-foreground flex-1 truncate">
                    {d.name}
                  </span>
                  <span className="text-xs font-medium text-muted-foreground">
                    {donutTotal > 0
                      ? ((d.balance / donutTotal) * 100).toFixed(1)
                      : 0}
                    %
                  </span>
                  <span className="text-sm text-foreground">
                    {formatCompact(d.balance)}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Spending Nature */}
      <Card className="border-border bg-card">
        <CardContent className="pt-6">
          <p className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground mb-4">
            Spending Nature
          </p>
          <div className="space-y-3">
            {donutDebts.map((d, i) => (
              <div key={d.id}>
                <div className="flex items-center gap-3 mb-1">
                  <div
                    className="w-2.5 h-2.5 rounded-full flex-shrink-0"
                    style={{
                      backgroundColor: DEBT_COLORS[i % DEBT_COLORS.length],
                    }}
                  />
                  <span className="text-sm font-medium text-foreground">
                    {d.name}
                  </span>
                </div>
                <div className="ml-5">
                  <span className="text-xs px-2 py-0.5 rounded bg-secondary text-muted-foreground">
                    🗂 Mixed / Unknown
                  </span>
                </div>
              </div>
            ))}
          </div>

          <div className="mt-6 space-y-3">
            <div className="p-3 rounded-lg bg-secondary/30">
              <p className="text-xs font-semibold text-foreground mb-1">
                📋 Primary Pattern
              </p>
              <p className="text-xs text-muted-foreground">
                Pull your last 3 statements and categorize each charge. You
                likely have one dominant category that can be targeted.
              </p>
            </div>
            <div className="p-3 rounded-lg bg-secondary/30">
              <p className="text-xs font-semibold text-red-500 mb-1">
                STRATEGY TIP
              </p>
              <p className="text-xs text-muted-foreground">
                {weightedAvgAPR > 20
                  ? "High APRs detected — Avalanche will save significantly on interest."
                  : debts.length > 3
                    ? "Multiple debts — Snowball method helps build momentum with quick wins."
                    : "Avalanche is the safest default when spending patterns are unclear."}
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
