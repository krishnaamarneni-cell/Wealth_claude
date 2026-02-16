"use client"

import { useEffect, useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { TrendingUp, TrendingDown, Minus } from "lucide-react"

interface FearGreedData {
  value: number
  label: string
  previousValue: number
  change: number
}

// Mock data - will replace with real API
const MOCK_FEAR_GREED_DATA = {
  stock: {
    value: 35,
    label: 'Fear',
    previousValue: 42,
    change: -7
  },
  crypto: {
    value: 48,
    label: 'Neutral',
    previousValue: 52,
    change: -4
  }
}

// Helper to get color based on value
function getColorClass(value: number): string {
  if (value <= 25) return '#dc2626' // red-600
  if (value <= 45) return '#f97316' // orange-500
  if (value <= 55) return '#eab308' // yellow-500
  if (value <= 75) return '#22c55e' // green-500
  return '#10b981' // emerald-500
}

function getTextColorClass(value: number): string {
  if (value <= 25) return 'text-red-600'
  if (value <= 45) return 'text-orange-500'
  if (value <= 55) return 'text-yellow-500'
  if (value <= 75) return 'text-green-500'
  return 'text-emerald-500'
}

interface SpeedometerProps {
  value: number
  label: string
  previousValue: number
  change: number
  title: string
  description: string
}

function Speedometer({ value, label, previousValue, change, title, description }: SpeedometerProps) {
  const [animatedValue, setAnimatedValue] = useState(0)
  const color = getColorClass(value)
  const textColor = getTextColorClass(value)

  // Animate needle from 0 to value on mount
  useEffect(() => {
    const duration = 2000 // 2 seconds
    const steps = 100
    const stepValue = value / steps
    const stepDuration = duration / steps

    let currentStep = 0
    const timer = setInterval(() => {
      currentStep++
      setAnimatedValue(Math.min(currentStep * stepValue, value))

      if (currentStep >= steps) {
        clearInterval(timer)
      }
    }, stepDuration)

    return () => clearInterval(timer)
  }, [value])

  // Calculate needle rotation angle
  // Range: -135deg (left) to +135deg (right) = 270 degrees total
  const rotation = -135 + (animatedValue / 100) * 270

  // Calculate arc path for the gauge background
  const radius = 80
  const centerX = 100
  const centerY = 100
  const strokeWidth = 16

  return (
    <div className="flex flex-col items-center w-full">
      {/* Title */}
      <h3 className="font-bold text-lg mb-1">{title}</h3>
      <p className="text-xs text-muted-foreground mb-6">{description}</p>

      {/* Speedometer Container */}
      <div className="relative w-full max-w-[240px] aspect-square mb-6">
        <svg viewBox="0 0 200 130" className="w-full h-auto">
          {/* Background Arc - Gray */}
          <path
            d="M 30 100 A 70 70 0 0 1 170 100"
            fill="none"
            stroke="hsl(var(--muted))"
            strokeWidth={strokeWidth}
            strokeLinecap="round"
          />

          {/* Colored Zones */}
          {/* Extreme Fear: 0-25 (Red) */}
          <path
            d="M 30 100 A 70 70 0 0 1 56 45"
            fill="none"
            stroke="#dc2626"
            strokeWidth={strokeWidth}
            strokeLinecap="round"
            opacity="0.6"
          />

          {/* Fear: 25-45 (Orange) */}
          <path
            d="M 56 45 A 70 70 0 0 1 85 25"
            fill="none"
            stroke="#f97316"
            strokeWidth={strokeWidth}
            strokeLinecap="round"
            opacity="0.6"
          />

          {/* Neutral: 45-55 (Yellow) */}
          <path
            d="M 85 25 A 70 70 0 0 1 115 25"
            fill="none"
            stroke="#eab308"
            strokeWidth={strokeWidth}
            strokeLinecap="round"
            opacity="0.6"
          />

          {/* Greed: 55-75 (Green) */}
          <path
            d="M 115 25 A 70 70 0 0 1 144 45"
            fill="none"
            stroke="#22c55e"
            strokeWidth={strokeWidth}
            strokeLinecap="round"
            opacity="0.6"
          />

          {/* Extreme Greed: 75-100 (Emerald) */}
          <path
            d="M 144 45 A 70 70 0 0 1 170 100"
            fill="none"
            stroke="#10b981"
            strokeWidth={strokeWidth}
            strokeLinecap="round"
            opacity="0.6"
          />

          {/* Needle */}
          <g transform={`rotate(${rotation} 100 100)`}>
            <line
              x1="100"
              y1="100"
              x2="100"
              y2="35"
              stroke="hsl(var(--foreground))"
              strokeWidth="3"
              strokeLinecap="round"
            />
            {/* Needle tip triangle */}
            <polygon
              points="100,35 95,45 105,45"
              fill="hsl(var(--foreground))"
            />
          </g>

          {/* Center circle */}
          <circle
            cx="100"
            cy="100"
            r="8"
            fill="hsl(var(--background))"
            stroke="hsl(var(--foreground))"
            strokeWidth="2"
          />
        </svg>

        {/* Value Display Below Gauge */}
        <div className="absolute -bottom-6 left-1/2 transform -translate-x-1/2 text-center w-full">
          <div className="flex items-center justify-center gap-1">
            <span className={`text-5xl font-bold ${textColor}`}>
              {Math.round(animatedValue)}
            </span>
            <span className="text-sm text-muted-foreground mt-2">/ 100</span>
          </div>
        </div>
      </div>

      {/* Label */}
      <div className={`text-2xl font-bold mb-3 mt-8 ${textColor}`}>
        {label}
      </div>

      {/* Change from previous day */}
      <div className="flex items-center gap-2 text-sm">
        {change > 0 ? (
          <>
            <TrendingUp className="h-4 w-4 text-green-500" />
            <span className="text-green-500">+{change} from yesterday</span>
          </>
        ) : change < 0 ? (
          <>
            <TrendingDown className="h-4 w-4 text-red-500" />
            <span className="text-red-500">{change} from yesterday</span>
          </>
        ) : (
          <>
            <Minus className="h-4 w-4 text-muted-foreground" />
            <span className="text-muted-foreground">Unchanged</span>
          </>
        )}
      </div>
    </div>
  )
}

export default function FearGreed() {
  const { stock, crypto } = MOCK_FEAR_GREED_DATA

  return (
    <Card className="border-border bg-card">
      <CardHeader>
        <CardTitle className="text-xl font-bold flex items-center gap-2">
          🎭 Market Sentiment
        </CardTitle>
        <p className="text-sm text-muted-foreground">
          Real-time fear and greed indicators for stocks and crypto
        </p>
      </CardHeader>

      <CardContent>
        {/* Dual Speedometers */}
        <div className="grid md:grid-cols-2 gap-12 md:gap-8">
          {/* Stock Market Speedometer */}
          <Speedometer
            value={stock.value}
            label={stock.label}
            previousValue={stock.previousValue}
            change={stock.change}
            title="Stock Market"
            description="CNN Fear & Greed Index"
          />

          {/* Crypto Market Speedometer */}
          <Speedometer
            value={crypto.value}
            label={crypto.label}
            previousValue={crypto.previousValue}
            change={crypto.change}
            title="Crypto Market"
            description="Alternative.me Index"
          />
        </div>

        {/* What This Means */}
        <div className="mt-8 p-4 rounded-lg bg-secondary/30 border border-border">
          <h4 className="font-semibold text-sm mb-2 flex items-center gap-2">
            💡 What this means:
          </h4>
          <div className="space-y-2 text-sm text-muted-foreground">
            {stock.value <= 45 && (
              <p>
                <strong className="text-orange-500">Stock Market Fear:</strong> Investors are nervous.
                This often presents buying opportunities for long-term investors, but expect continued volatility.
              </p>
            )}
            {stock.value >= 55 && (
              <p>
                <strong className="text-green-500">Stock Market Greed:</strong> Investors are optimistic.
                Watch for overheating—consider taking profits or rebalancing.
              </p>
            )}
            {crypto.value >= 45 && crypto.value <= 55 && (
              <p>
                <strong className="text-yellow-500">Crypto Market Neutral:</strong> Balanced sentiment.
                No extreme fear or greed driving crypto prices right now.
              </p>
            )}
            {crypto.value < 45 && (
              <p>
                <strong className="text-orange-500">Crypto Market Fear:</strong> Risk-off sentiment in crypto.
                Expect volatility and possible further downside.
              </p>
            )}
            {crypto.value > 55 && (
              <p>
                <strong className="text-green-500">Crypto Market Greed:</strong> Strong buying momentum.
                Be cautious of FOMO—prices may be overextended.
              </p>
            )}
          </div>
        </div>

        {/* Scale Legend */}
        <div className="mt-6 p-4 rounded-lg bg-secondary/20">
          <h4 className="font-semibold text-xs mb-3 text-muted-foreground uppercase">Scale Guide:</h4>
          <div className="flex flex-wrap justify-between items-start gap-4 text-xs">
            <div className="flex flex-col items-center">
              <div className="w-4 h-4 rounded-full bg-red-600 mb-1.5"></div>
              <span className="text-red-600 font-semibold">0-25</span>
              <span className="text-muted-foreground text-center">Extreme<br />Fear</span>
            </div>
            <div className="flex flex-col items-center">
              <div className="w-4 h-4 rounded-full bg-orange-500 mb-1.5"></div>
              <span className="text-orange-500 font-semibold">26-45</span>
              <span className="text-muted-foreground">Fear</span>
            </div>
            <div className="flex flex-col items-center">
              <div className="w-4 h-4 rounded-full bg-yellow-500 mb-1.5"></div>
              <span className="text-yellow-500 font-semibold">46-55</span>
              <span className="text-muted-foreground">Neutral</span>
            </div>
            <div className="flex flex-col items-center">
              <div className="w-4 h-4 rounded-full bg-green-500 mb-1.5"></div>
              <span className="text-green-500 font-semibold">56-75</span>
              <span className="text-muted-foreground">Greed</span>
            </div>
            <div className="flex flex-col items-center">
              <div className="w-4 h-4 rounded-full bg-emerald-500 mb-1.5"></div>
              <span className="text-emerald-500 font-semibold">76-100</span>
              <span className="text-muted-foreground text-center">Extreme<br />Greed</span>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
