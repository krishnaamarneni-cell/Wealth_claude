"use client"

import { useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { TrendingUp, TrendingDown, PieChart } from "lucide-react"
import { usePortfolio } from "@/lib/portfolio-context"

export default function SectorPerformance() {
  const { holdings, portfolioValue } = usePortfolio()

  // Group holdings by sector
  const sectorData = holdings.reduce((acc: Record<string, any>, holding: any) => {
    const sector = holding.sector || "Other"
    if (!acc[sector]) {
      acc[sector] = { count: 0, value: 0 }
    }
    acc[sector].count += 1
    acc[sector].value += holding.value || 0
    return acc
  }, {})

  // Sort by exposure value
  const sortedSectors = Object.entries(sectorData)
    .map(([sector, data]) => ({
      sector,
      count: data.count,
      value: data.value,
      percent: portfolioValue > 0 ? (data.value / portfolioValue) * 100 : 0,
    }))
    .sort((a, b) => b.value - a.value)

  const formatCurrency = (val: number) =>
    new Intl.NumberFormat("en-US", { style: "currency", currency: "USD" }).format(val)

  if (holdings.length === 0) {
    return (
      <Card className="border-border bg-card">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base">
            <PieChart className="h-5 w-5" />
            Sector Exposure
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground">No holdings to display sector breakdown</p>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card className="border-border bg-card">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-base">
          <PieChart className="h-5 w-5" />
          Sector Exposure ({sortedSectors.length})
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-3">
          {sortedSectors.map((item) => (
            <div key={item.sector} className="space-y-1">
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium text-foreground">{item.sector}</span>
                <span className="text-sm text-muted-foreground">{item.percent.toFixed(1)}%</span>
              </div>
              <div className="w-full bg-secondary rounded-full h-2">
                <div
                  className="bg-primary h-2 rounded-full transition-all"
                  style={{ width: `${Math.min(item.percent, 100)}%` }}
                />
              </div>
              <div className="flex justify-between text-xs text-muted-foreground">
                <span>{item.count} holding{item.count !== 1 ? "s" : ""}</span>
                <span>{formatCurrency(item.value)}</span>
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  )
}
