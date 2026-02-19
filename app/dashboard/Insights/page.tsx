"use client"

import { useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import {
  sectorAllocation,
  industryAllocation,
  countryAllocation,
  assetTypeAllocation,
  dividendHistory,
  portfolioSummary,
  keyStats
} from "@/lib/portfolio-data"
import {
  PieChart,
  Pie,
  Cell,
  ResponsiveContainer,
  Tooltip,
  Legend
} from "recharts"
import { CircleDollarSign, Percent, TrendingUp, Calendar } from "lucide-react"

const COLORS = ['#22c55e', '#3b82f6', '#f59e0b', '#ef4444', '#8b5cf6', '#ec4899', '#06b6d4', '#84cc16']

function formatCurrency(value: number): string {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    minimumFractionDigits: 2,
  }).format(value)
}

export default function InsightsPage() {
  const [insightView, setInsightView] = useState<'allocation' | 'dividends'>('allocation')

  const hasDividends = dividendHistory && dividendHistory.length > 0

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Insights</h1>
          <p className="text-muted-foreground">Portfolio analysis and allocations</p>
        </div>
        <div className="flex gap-2 p-1 bg-secondary rounded-lg">
          <Button
            variant={insightView === 'allocation' ? 'default' : 'ghost'}
            size="sm"
            onClick={() => setInsightView('allocation')}
          >
            Allocation
          </Button>
          <Button
            variant={insightView === 'dividends' ? 'default' : 'ghost'}
            size="sm"
            onClick={() => setInsightView('dividends')}
          >
            Dividends
          </Button>
        </div>
      </div>

      {insightView === 'allocation' ? (
        <div className="grid gap-6">
          {/* Sector Allocation */}
          <Card>
            <CardHeader>
              <CardTitle>Sector Distribution</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid lg:grid-cols-2 gap-6">
                <div className="h-[300px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={sectorAllocation}
                        cx="50%"
                        cy="50%"
                        labelLine={false}
                        label={({ name, value }) => value > 5 ? `${value.toFixed(1)}%` : ''}
                        outerRadius={100}
                        dataKey="value"
                      >
                        {sectorAllocation.map((_, index) => (
                          <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                        ))}
                      </Pie>
                      <Tooltip formatter={(value: number) => `${value.toFixed(2)}%`} />
                      <Legend />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
                <div className="space-y-4">
                  {sectorAllocation.map((sector, index) => (
                    <div key={sector.name} className="space-y-2">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <div className="w-3 h-3 rounded-full" style={{ backgroundColor: COLORS[index % COLORS.length] }} />
                          <span className="font-medium">{sector.name}</span>
                        </div>
                        <span className="font-semibold">{sector.value.toFixed(2)}%</span>
                      </div>
                      <div className="h-2 bg-secondary rounded-full overflow-hidden">
                        <div className="h-full rounded-full" style={{ width: `${sector.value}%`, backgroundColor: COLORS[index % COLORS.length] }} />
                      </div>
                      <div className="flex justify-between text-xs text-muted-foreground">
                        <span>Value: {formatCurrency(sector.marketValue)}</span>
                        <span className={sector.gain >= 0 ? 'text-green-500' : 'text-red-500'}>
                          Gain: {formatCurrency(sector.gain)}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Industry Distribution */}
          <Card>
            <CardHeader>
              <CardTitle>Industry Distribution</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                {industryAllocation.map((industry, index) => (
                  <div key={industry.name} className="flex items-center justify-between p-3 rounded-lg bg-secondary/30">
                    <div className="flex items-center gap-2">
                      <div className="w-3 h-3 rounded-full" style={{ backgroundColor: COLORS[index % COLORS.length] }} />
                      <span className="text-sm font-medium">{industry.name}</span>
                    </div>
                    <div className="flex gap-4 text-sm">
                      <span className="text-muted-foreground">{industry.value.toFixed(2)}%</span>
                      <span className="font-semibold">{formatCurrency(industry.marketValue)}</span>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Asset Type */}
          <Card>
            <CardHeader>
              <CardTitle>Asset Type Distribution</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {assetTypeAllocation.map((type, index) => (
                  <div key={type.name} className="space-y-2">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div
                          className="w-10 h-10 rounded-lg flex items-center justify-center"
                          style={{ backgroundColor: `${COLORS[index % COLORS.length]}20` }}
                        >
                          <span style={{ color: COLORS[index % COLORS.length] }} className="text-lg font-bold">
                            {type.name === 'Stocks' ? 'S' : 'E'}
                          </span>
                        </div>
                        <div>
                          <div className="font-medium">{type.name}</div>
                          <div className="text-sm text-muted-foreground">{type.value.toFixed(2)}% of portfolio</div>
                        </div>
                      </div>
                      <div className="font-semibold text-lg">{formatCurrency(type.marketValue)}</div>
                    </div>
                    <div className="h-2 bg-secondary rounded-full overflow-hidden">
                      <div className="h-full rounded-full" style={{ width: `${type.value}%`, backgroundColor: COLORS[index % COLORS.length] }} />
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>
      ) : (
        <div className="space-y-6">
          {!hasDividends ? (
            <Card>
              <CardContent className="pt-6 text-center text-muted-foreground">
                No dividend data available
              </CardContent>
            </Card>
          ) : (
            <>
              {/* Dividend Summary */}
              <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
                <Card>
                  <CardHeader className="flex flex-row items-center justify-between pb-2">
                    <CardTitle className="text-sm font-medium text-muted-foreground">Total Received</CardTitle>
                    <CircleDollarSign className="h-4 w-4 text-primary" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold text-primary">
                      {formatCurrency(portfolioSummary.dividends)}
                    </div>
                    <p className="text-xs text-muted-foreground">All-time</p>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader className="flex flex-row items-center justify-between pb-2">
                    <CardTitle className="text-sm font-medium text-muted-foreground">Yield</CardTitle>
                    <Percent className="h-4 w-4 text-primary" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">{keyStats.dividendYield}%</div>
                    <p className="text-xs text-muted-foreground">Portfolio yield</p>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader className="flex flex-row items-center justify-between pb-2">
                    <CardTitle className="text-sm font-medium text-muted-foreground">Projected</CardTitle>
                    <TrendingUp className="h-4 w-4 text-primary" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">
                      {formatCurrency(portfolioSummary.dividends * 4)}
                    </div>
                    <p className="text-xs text-muted-foreground">Annual estimate</p>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader className="flex flex-row items-center justify-between pb-2">
                    <CardTitle className="text-sm font-medium text-muted-foreground">Last Payment</CardTitle>
                    <Calendar className="h-4 w-4 text-muted-foreground" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">
                      {formatCurrency(dividendHistory[0]?.total || 0)}
                    </div>
                    <p className="text-xs text-muted-foreground">{dividendHistory[0]?.date || 'N/A'}</p>
                  </CardContent>
                </Card>
              </div>
            </>
          )}
        </div>
      )}
    </div>
  )
}
