"use client"

import { useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Switch } from "@/components/ui/switch"
import { Label } from "@/components/ui/label"
import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  Tooltip, 
  Legend, 
  ResponsiveContainer, 
  ReferenceLine,
  Cell
} from "recharts"

interface HistoricalReturnsChartProps {
  data: Array<{
    period: string
    portfolio: number
    benchmark?: number
  }>
  period: 'monthly' | 'quarterly' | 'yearly'
  onPeriodChange: (period: 'monthly' | 'quarterly' | 'yearly') => void
  showExcessReturn: boolean
  onExcessReturnToggle: (value: boolean) => void
}

const GREEN = '#16a34a'
const GREEN_LIGHT = '#22c55e'
const RED = '#dc2626'
const RED_LIGHT = '#ef4444'
const BLUE = '#2563eb'
const BLUE_LIGHT = '#3b82f6'

// Format date labels
const formatDateLabel = (period: string) => {
  // If format is "2025-03", convert to "Mar 25"
  if (period.match(/^\d{4}-\d{2}$/)) {
    const [year, month] = period.split('-')
    const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']
    const monthIndex = parseInt(month) - 1
    return `${monthNames[monthIndex]} ${year.slice(2)}`
  }
  return period
}

export function HistoricalReturnsChart({
  data,
  period,
  onPeriodChange,
  showExcessReturn,
  onExcessReturnToggle
}: HistoricalReturnsChartProps) {
  
  const [hoveredIndex, setHoveredIndex] = useState<number | null>(null)
  
  const chartData = data.map(item => ({
    period: formatDateLabel(item.period),
    portfolio: item.portfolio,
    benchmark: item.benchmark || 0,
    excessReturn: item.portfolio - (item.benchmark || 0)
  }))

  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-background border-2 border-border rounded-lg p-4 shadow-2xl">
          <p className="font-bold mb-3 text-base">{label}</p>
          {payload.map((entry: any, index: number) => {
            const value = entry.value
            const color = entry.fill || entry.color
            const isPositive = value >= 0
            
            return (
              <div 
                key={index} 
                className="flex items-center gap-2 py-1"
              >
                <div 
                  className="w-3 h-3 rounded-sm" 
                  style={{ backgroundColor: color }}
                />
                <span className="font-semibold text-sm">
                  {entry.name}:
                </span>
                <span 
                  className="font-bold text-base ml-auto"
                  style={{ color: color }}
                >
                  {isPositive ? '+' : ''}{value.toFixed(2)}%
                </span>
              </div>
            )
          })}
        </div>
      )
    }
    return null
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <CardTitle className="text-lg">Historical Returns</CardTitle>
            <p className="text-sm text-muted-foreground">
              {period === 'monthly' ? 'Monthly' : period === 'quarterly' ? 'Quarterly' : 'Yearly'} performance breakdown
            </p>
          </div>
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2 p-1 bg-secondary rounded-lg">
              <Button
                variant={period === 'monthly' ? 'default' : 'ghost'}
                size="sm"
                onClick={() => onPeriodChange('monthly')}
              >
                M
              </Button>
              <Button
                variant={period === 'quarterly' ? 'default' : 'ghost'}
                size="sm"
                onClick={() => onPeriodChange('quarterly')}
              >
                Q
              </Button>
              <Button
                variant={period === 'yearly' ? 'default' : 'ghost'}
                size="sm"
                onClick={() => onPeriodChange('yearly')}
              >
                Y
              </Button>
            </div>

            <div className="flex items-center gap-2">
              <Switch
                checked={showExcessReturn}
                onCheckedChange={onExcessReturnToggle}
                id="excess-return"
              />
              <Label htmlFor="excess-return" className="text-sm cursor-pointer">
                Excess Return
              </Label>
            </div>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <div className="h-[500px] w-full">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart 
              data={chartData}
              margin={{ top: 20, right: 30, left: 20, bottom: period === 'monthly' ? 100 : 80 }}
              onMouseMove={(state: any) => {
                if (state && state.activeTooltipIndex !== undefined) {
                  setHoveredIndex(state.activeTooltipIndex)
                }
              }}
              onMouseLeave={() => setHoveredIndex(null)}
            >
              <XAxis 
                dataKey="period"
                angle={period === 'monthly' ? -45 : 0}
                textAnchor={period === 'monthly' ? 'end' : 'middle'}
                interval={0}
                height={period === 'monthly' ? 100 : 60}
                tick={{ fontSize: 12 }}
              />
              <YAxis 
                tickFormatter={(value) => `${value}%`}
                tick={{ fontSize: 12 }}
                width={60}
              />
              <Tooltip 
                content={<CustomTooltip />}
                cursor={{ fill: 'transparent' }}
              />
              <Legend 
                verticalAlign="top"
                height={50}
                wrapperStyle={{ paddingBottom: '20px' }}
              />
              <ReferenceLine y={0} stroke="#888" strokeWidth={2} />
              
              {showExcessReturn ? (
                <Bar 
                  dataKey="excessReturn" 
                  name="Excess Return vs Benchmark"
                  radius={[6, 6, 0, 0]}
                >
                  {chartData.map((entry, index) => {
                    const isHovered = hoveredIndex === index
                    const isPositive = entry.excessReturn >= 0
                    const baseColor = isPositive ? GREEN : RED
                    const hoverColor = isPositive ? GREEN_LIGHT : RED_LIGHT
                    
                    return (
                      <Cell 
                        key={`excess-${index}`} 
                        fill={isHovered ? hoverColor : baseColor}
                        style={{ 
                          transition: 'fill 0.2s ease',
                          cursor: 'pointer'
                        }}
                      />
                    )
                  })}
                </Bar>
              ) : (
                <>
                  <Bar 
                    dataKey="portfolio" 
                    name="My Portfolio"
                    radius={[6, 6, 0, 0]}
                  >
                    {chartData.map((entry, index) => {
                      const isHovered = hoveredIndex === index
                      const isPositive = entry.portfolio >= 0
                      const baseColor = isPositive ? GREEN : RED
                      const hoverColor = isPositive ? GREEN_LIGHT : RED_LIGHT
                      
                      return (
                        <Cell 
                          key={`portfolio-${index}`} 
                          fill={isHovered ? hoverColor : baseColor}
                          style={{ 
                            transition: 'fill 0.2s ease',
                            cursor: 'pointer'
                          }}
                        />
                      )
                    })}
                  </Bar>
                  <Bar 
                    dataKey="benchmark" 
                    name="S&P 500"
                    radius={[6, 6, 0, 0]}
                  >
                    {chartData.map((entry, index) => {
                      const isHovered = hoveredIndex === index
                      
                      return (
                        <Cell 
                          key={`benchmark-${index}`} 
                          fill={isHovered ? BLUE_LIGHT : BLUE}
                          style={{ 
                            transition: 'fill 0.2s ease',
                            cursor: 'pointer'
                          }}
                        />
                      )
                    })}
                  </Bar>
                </>
              )}
            </BarChart>
          </ResponsiveContainer>
        </div>
      </CardContent>
    </Card>
  )
}
