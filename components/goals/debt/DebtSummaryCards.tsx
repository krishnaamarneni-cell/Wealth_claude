"use client"

import { Card, CardContent } from "@/components/ui/card"
import type { Debt } from "@/components/goals/types"
import {
  formatCompact,
  formatPrecise,
  getAPRColor,
  calculateMonthlyInterest,
  calculateAnnualInterest,
} from "@/components/goals/types"

interface DebtSummaryCardsProps {
  debts: Debt[]
}

export function DebtSummaryCards({ debts }: DebtSummaryCardsProps) {
  const totalDebt = debts.reduce((sum, d) => sum + d.balance, 0)
  const totalMonthlyInterest = debts.reduce(
    (sum, d) => sum + calculateMonthlyInterest(d),
    0
  )
  const totalAnnualInterest = debts.reduce(
    (sum, d) => sum + calculateAnnualInterest(d),
    0
  )
  const weightedAvgAPR =
    totalDebt > 0
      ? debts.reduce((sum, d) => sum + d.balance * d.apr, 0) / totalDebt
      : 0

  return (
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
      <Card className="border-border bg-card">
        <CardContent className="pt-6">
          <p className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground mb-1">
            Total Debt
          </p>
          <p className="text-2xl font-bold text-red-500">
            {formatCompact(totalDebt)}
          </p>
          <p className="text-xs text-muted-foreground mt-1">
            You&apos;re {formatCompact(totalDebt)} away from financial freedom
          </p>
        </CardContent>
      </Card>

      <Card className="border-border bg-card">
        <CardContent className="pt-6">
          <p className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground mb-1">
            Avg APR
          </p>
          <p
            className="text-2xl font-bold"
            style={{ color: getAPRColor(weightedAvgAPR) }}
          >
            {weightedAvgAPR.toFixed(2)}%
          </p>
          <p className="text-xs text-muted-foreground mt-1">Weighted average</p>
        </CardContent>
      </Card>

      <Card className="border-border bg-card">
        <CardContent className="pt-6">
          <p className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground mb-1">
            Monthly Interest
          </p>
          <p className="text-2xl font-bold text-orange-500">
            {formatPrecise(totalMonthlyInterest)}
          </p>
          <p className="text-xs text-muted-foreground mt-1">per month</p>
        </CardContent>
      </Card>

      <Card className="border-border bg-card">
        <CardContent className="pt-6">
          <p className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground mb-1">
            Yearly Interest
          </p>
          <p className="text-2xl font-bold text-red-500">
            {formatCompact(totalAnnualInterest)}
          </p>
          <p className="text-xs text-muted-foreground mt-1">annual cost</p>
        </CardContent>
      </Card>
    </div>
  )
}
