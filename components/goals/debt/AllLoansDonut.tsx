"use client"

import { Card, CardContent } from "@/components/ui/card"
import { SVGDonut, type DonutSegment } from "@/components/goals/shared/SVGDonut"
import type { Debt } from "@/components/goals/types"
import { DEBT_COLORS, formatCompact } from "@/components/goals/types"

interface AllLoansDonutProps {
  debts: Debt[]
}

const TYPE_COLORS: Record<string, string> = {
  "Credit Card": "#22c55e",
  "Auto Loan": "#3b82f6",
  Mortgage: "#eab308",
  "Student Loan": "#8b5cf6",
  "Personal Loan": "#f97316",
  Other: "#6b7280",
}

export function AllLoansDonut({ debts }: AllLoansDonutProps) {
  const totalDebt = debts.reduce((sum, d) => sum + d.balance, 0)

  // Group by debt type
  const byType: Record<string, number> = {}
  debts.forEach((d) => {
    byType[d.type] = (byType[d.type] || 0) + d.balance
  })

  const segments: DonutSegment[] = Object.entries(byType).map(
    ([type, value]) => ({
      label: type,
      value,
      color: TYPE_COLORS[type] || "#6b7280",
    })
  )

  const typeCount = Object.keys(byType).length

  if (typeCount <= 1) return null // Only show when multiple debt types exist

  return (
    <Card className="border-border bg-card">
      <CardContent className="pt-6">
        <p className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground mb-4">
          All Loans Overview
        </p>
        <div className="flex items-center gap-6">
          <SVGDonut
            segments={segments}
            centerLabel="Total Debt"
            centerValue={formatCompact(totalDebt)}
            centerSublabel={`${typeCount} types`}
          />
          <div className="flex-1 space-y-2">
            {segments.map((seg) => (
              <div key={seg.label} className="flex items-center gap-2">
                <div
                  className="w-2.5 h-2.5 rounded-full flex-shrink-0"
                  style={{ backgroundColor: seg.color }}
                />
                <span className="text-sm text-foreground flex-1">
                  {seg.label}
                </span>
                <span className="text-xs font-medium text-muted-foreground">
                  {totalDebt > 0
                    ? ((seg.value / totalDebt) * 100).toFixed(1)
                    : 0}
                  %
                </span>
                <span className="text-sm text-foreground">
                  {formatCompact(seg.value)}
                </span>
              </div>
            ))}
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
