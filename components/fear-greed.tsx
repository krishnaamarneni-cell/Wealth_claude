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

// Get label from value
function getLabel(value: number): string {
  if (value <= 25) return 'Extreme Fear'
  if (value <= 45) return 'Fear'
  if (value <= 55) return 'Neutral'
  if (value <= 75) return 'Greed'
  return 'Extreme Greed'
}

// Get text color class
function getTextColorClass(value: number): string {
  if (value <= 25) return 'text-red-500'
  if (value <= 45) return 'text-orange-500'
  if (value <= 55) return 'text-yellow-500'
  if (value <= 75) return 'text-green-500'
  return 'text-emerald-500'
}

interface GaugeProps {
  value: number
  label: string
  previousValue: number
  change: number
  title: string
  description: string
}

function FearGreedGauge({ value, label, previousValue, change, title, description }: GaugeProps) {
  const [displayValue, setDisplayValue] = useState(0)

  const textColor = getTextColorClass(value)

  // Animate from 0 to value
  useEffect(() => {
    let start = 0
    const end = value
    const duration = 2000 // 2 seconds
    const increment = end / (duration / 16) // 60fps

    const timer = setInterval(() => {
      start += increment
      if (start >= end) {
        setDisplayValue(end)
        clearInterval(timer)
      } else {
        setDisplayValue(start)
      }
    }, 16)

    return () => clearInterval(timer)
  }, [value])

  // Calculate needle angle: -90deg (left/0) to +90deg (right/100)
  const needleAngle = -90 + (displayValue * 1.8)

  return (
    <div className="flex flex-col items-center w-full px-4 py-6">
      {/* Title */}
      <h3 className="font-bold text-xl mb-1">{title}</h3>
      <p className="text-xs text-muted-foreground mb-8">{description}</p>

      {/* Gauge SVG */}
      <div className="relative w-full max-w-[280px] mb-4">
        <svg viewBox="0 0 200 120" className="w-full h-auto">
          {/* Define gradient for the arc */}
          <defs>
            <linearGradient id={`gradient-${title}`} x1="0%" y1="0%" x2="100%" y2="0%">
              <stop offset="0%" stopColor="#ef4444" />
              <stop offset="25%" stopColor="#f97316" />
              <stop offset="50%" stopColor="#eab308" />
              <stop offset="75%" stopColor="#22c55e" />
              <stop offset="100%" stopColor="#10b981" />
            </linearGradient>
          </defs>

          {/* Background arc */}
          <path
            d="M 20 100 A 80 80 0 0 1 180 100"
            fill="none"
            stroke="hsl(var(--muted))"
            strokeWidth="20"
            strokeLinecap="round"
          />

          {/* Colored arc with gradient */}
          <path
            d="M 20 100 A 80 80 0 0 1 180 100"
            fill="none"
            stroke={`url(#gradient-${title})`}
            strokeWidth="20"
            strokeLinecap="round"
          />

          {/* Needle - WHITE for visibility */}
          <g transform={`rotate(${needleAngle} 100 100)`}>
            <line
              x1="100"
              y1="100"
              x2="100"
              y2="30"
              stroke="#ffffff"
              strokeWidth="4"
              strokeLinecap="round"
            />
            <circle
              cx="100"
              cy="30"
              r="5"
              fill="#ffffff"
            />
          </g>

          {/* Center pivot */}
          <circle
            cx="100"
            cy="100"
            r="8"
            fill="hsl(var(--background))"
            stroke="#ffffff"
            strokeWidth="3"
          />
        </svg>

        {/* Value display - positioned BELOW the gauge */}
        <div className="absolute -bottom-2 left-1/2 transform -translate-x-1/2 text-center">
          <div className={`text-6xl font-bold ${textColor}`}>
            {Math.round(displayValue)}
          </div>
        </div>
      </div>

      {/* Label */}
      <div className={`text-3xl font-bold uppercase mt-12 ${textColor}`}>
        {label}
      </div>

      {/* Change indicator */}
      <div className="flex items-center gap-2 text-sm mt-3">
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
        {/* Dual Gauges */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 lg:gap-12">
          {/* Stock Market */}
          <FearGreedGauge
            value={stock.value}
            label={stock.label}
            previousValue={stock.previousValue}
            change={stock.change}
            title="Stock Market"
            description="CNN Fear & Greed Index"
          />

          {/* Crypto Market */}
          <FearGreedGauge
            value={crypto.value}
            label={crypto.label}
            previousValue={crypto.previousValue}
            change={crypto.change}
            title="Crypto Market"
            description="Alternative.me Index"
          />
        </div>

        {/* Interpretation */}
        <div className="mt-8 p-4 rounded-lg bg-blue-500/10 border border-blue-500/30">
          <h4 className="font-semibold text-sm mb-2 flex items-center gap-2">
            💡 What this means:
          </h4>
          <div className="space-y-2 text-sm text-muted-foreground">
            {stock.value <= 45 && (
              <p>
                <strong className="text-orange-500">Stock Market Fear:</strong> Investors are nervous.
                This often presents buying opportunities for long-term investors.
              </p>
            )}
            {stock.value > 45 && stock.value <= 55 && (
              <p>
                <strong className="text-yellow-500">Stock Market Neutral:</strong> Balanced sentiment.
                Markets are neither fearful nor greedy.
              </p>
            )}
            {stock.value > 55 && (
              <p>
                <strong className="text-green-500">Stock Market Greed:</strong> Investors are optimistic.
                Watch for overheating.
              </p>
            )}
            {crypto.value <= 45 && (
              <p>
                <strong className="text-orange-500">Crypto Market Fear:</strong> Risk-off sentiment.
                Expect volatility.
              </p>
            )}
            {crypto.value > 45 && crypto.value <= 55 && (
              <p>
                <strong className="text-yellow-500">Crypto Market Neutral:</strong> Balanced sentiment.
              </p>
            )}
            {crypto.value > 55 && (
              <p>
                <strong className="text-green-500">Crypto Market Greed:</strong> Strong buying momentum.
              </p>
            )}
          </div>
        </div>

        {/* Scale */}
        <div className="mt-6 p-4 rounded-lg bg-secondary/30">
          <h4 className="text-xs font-semibold mb-3 text-muted-foreground uppercase">Scale Guide</h4>
          <div className="flex justify-between items-center">
            <div className="flex flex-col items-center gap-1">
              <div className="w-4 h-4 rounded-full bg-red-500"></div>
              <span className="text-xs font-semibold text-red-500">0-25</span>
              <span className="text-[10px] text-muted-foreground">Extreme Fear</span>
            </div>
            <div className="flex flex-col items-center gap-1">
              <div className="w-4 h-4 rounded-full bg-orange-500"></div>
              <span className="text-xs font-semibold text-orange-500">26-45</span>
              <span className="text-[10px] text-muted-foreground">Fear</span>
            </div>
            <div className="flex flex-col items-center gap-1">
              <div className="w-4 h-4 rounded-full bg-yellow-500"></div>
              <span className="text-xs font-semibold text-yellow-500">46-55</span>
              <span className="text-[10px] text-muted-foreground">Neutral</span>
            </div>
            <div className="flex flex-col items-center gap-1">
              <div className="w-4 h-4 rounded-full bg-green-500"></div>
              <span className="text-xs font-semibold text-green-500">56-75</span>
              <span className="text-[10px] text-muted-foreground">Greed</span>
            </div>
            <div className="flex flex-col items-center gap-1">
              <div className="w-4 h-4 rounded-full bg-emerald-500"></div>
              <span className="text-xs font-semibold text-emerald-500">76-100</span>
              <span className="text-[10px] text-muted-foreground">Extreme Greed</span>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
