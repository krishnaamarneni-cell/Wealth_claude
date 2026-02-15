"use client"

import { useState } from "react"
import { ArrowDown, ArrowUp } from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { periodReturns } from "@/lib/portfolio-data"
import { cn } from "@/lib/utils"

type ReturnType = "simple" | "xirr"

function formatCurrency(value: number): string {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(value)
}

function formatPercent(value: number): string {
  return `${value >= 0 ? "+" : ""}${value.toFixed(2)}%`
}

export function PeriodReturns() {
  const [returnType, setReturnType] = useState<ReturnType>("simple")

  // For demo purposes, XIRR values are slightly different
  const getAdjustedReturn = (period: string, basePercent: number) => {
    if (returnType === "xirr") {
      // XIRR typically shows annualized returns
      const multiplier = period === "1W" ? 52 : period === "1M" ? 12 : period === "3M" ? 4 : period === "6M" ? 2 : 1
      return basePercent * multiplier * 0.8 // Simplified adjustment for demo
    }
    return basePercent
  }

  return (
    <Card className="border-border bg-card">
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle className="text-base">Period Returns</CardTitle>
        <Tabs value={returnType} onValueChange={(v) => setReturnType(v as ReturnType)}>
          <TabsList className="h-8">
            <TabsTrigger value="simple" className="h-6 px-3 text-xs">Simple Return</TabsTrigger>
            <TabsTrigger value="xirr" className="h-6 px-3 text-xs">XIRR</TabsTrigger>
          </TabsList>
        </Tabs>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-4 lg:grid-cols-7">
          {Object.entries(periodReturns).map(([period, data]) => {
            const isPositive = data.gain >= 0
            const adjustedPercent = getAdjustedReturn(period, data.percent)

            return (
              <div
                key={period}
                className="flex flex-col items-center rounded-lg border border-border bg-secondary/50 p-3"
              >
                <span className="text-xs font-medium text-muted-foreground">{period}</span>
                <div className={cn("mt-1 flex items-center gap-1", isPositive ? "text-primary" : "text-destructive")}>
                  {isPositive ? <ArrowUp className="h-3 w-3" /> : <ArrowDown className="h-3 w-3" />}
                  <span className="text-sm font-semibold">{formatPercent(adjustedPercent)}</span>
                </div>
                <span className={cn("text-xs", isPositive ? "text-primary" : "text-destructive")}>
                  {formatCurrency(data.gain)}
                </span>
              </div>
            )
          })}
        </div>
      </CardContent>
    </Card>
  )
}
