"use client"

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

// Helper to determine label from value
function getLabel(value: number): string {
  if (value <= 25) return 'Extreme Fear'
  if (value <= 45) return 'Fear'
  if (value <= 55) return 'Neutral'
  if (value <= 75) return 'Greed'
  return 'Extreme Greed'
}

// Helper to get color based on value
function getColor(value: number): string {
  if (value <= 25) return 'text-red-600'
  if (value <= 45) return 'text-orange-500'
  if (value <= 55) return 'text-yellow-500'
  if (value <= 75) return 'text-green-500'
  return 'text-emerald-600'
}

function getBgColor(value: number): string {
  if (value <= 25) return 'bg-red-500'
  if (value <= 45) return 'bg-orange-500'
  if (value <= 55) return 'bg-yellow-500'
  if (value <= 75) return 'bg-green-500'
  return 'bg-emerald-500'
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
  const percentage = value
  const color = getColor(value)
  const bgColor = getBgColor(value)

  return (
    <div className="flex flex-col items-center">
      {/* Title */}
      <h3 className="font-bold text-lg mb-1">{title}</h3>
      <p className="text-xs text-muted-foreground mb-4">{description}</p>

      {/* Circular Gauge */}
      <div className="relative w-40 h-40 mb-4">
        {/* Background circle */}
        <svg className="w-full h-full transform -rotate-90">
          <circle
            cx="80"
            cy="80"
            r="70"
            fill="none"
            stroke="currentColor"
            strokeWidth="12"
            className="text-secondary"
          />
          {/* Progress circle */}
          <circle
            cx="80"
            cy="80"
            r="70"
            fill="none"
            stroke="currentColor"
            strokeWidth="12"
            strokeDasharray={`${(percentage / 100) * 440} 440`}
            className={bgColor}
            strokeLinecap="round"
          />
        </svg>

        {/* Center value */}
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <span className={`text-4xl font-bold ${color}`}>{value}</span>
          <span className="text-xs text-muted-foreground">/ 100</span>
        </div>
      </div>

      {/* Label */}
      <div className={`text-2xl font-bold mb-2 ${color}`}>
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
        {/* Dual Gauges */}
        <div className="grid md:grid-cols-2 gap-8 divide-x-0 md:divide-x divide-border">
          {/* Stock Market Gauge */}
          <FearGreedGauge
            value={stock.value}
            label={stock.label}
            previousValue={stock.previousValue}
            change={stock.change}
            title="Stock Market"
            description="CNN Fear & Greed Index"
          />

          {/* Crypto Market Gauge */}
          <FearGreedGauge
            value={crypto.value}
            label={crypto.label}
            previousValue={crypto.previousValue}
            change={crypto.change}
            title="Crypto Market"
            description="Alternative.me Index"
          />
        </div>

        {/* What This Means */}
        <div className="mt-6 p-4 rounded-lg bg-secondary/30 border border-border">
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
        <div className="mt-4 p-4 rounded-lg bg-secondary/20">
          <h4 className="font-semibold text-xs mb-3 text-muted-foreground">SCALE:</h4>
          <div className="flex justify-between items-center text-xs">
            <div className="flex flex-col items-center">
              <div className="w-3 h-3 rounded-full bg-red-600 mb-1"></div>
              <span className="text-red-600 font-semibold">0-25</span>
              <span className="text-muted-foreground">Extreme Fear</span>
            </div>
            <div className="flex flex-col items-center">
              <div className="w-3 h-3 rounded-full bg-orange-500 mb-1"></div>
              <span className="text-orange-500 font-semibold">26-45</span>
              <span className="text-muted-foreground">Fear</span>
            </div>
            <div className="flex flex-col items-center">
              <div className="w-3 h-3 rounded-full bg-yellow-500 mb-1"></div>
              <span className="text-yellow-500 font-semibold">46-55</span>
              <span className="text-muted-foreground">Neutral</span>
            </div>
            <div className="flex flex-col items-center">
              <div className="w-3 h-3 rounded-full bg-green-500 mb-1"></div>
              <span className="text-green-500 font-semibold">56-75</span>
              <span className="text-muted-foreground">Greed</span>
            </div>
            <div className="flex flex-col items-center">
              <div className="w-3 h-3 rounded-full bg-emerald-600 mb-1"></div>
              <span className="text-emerald-600 font-semibold">76-100</span>
              <span className="text-muted-foreground">Extreme Greed</span>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
