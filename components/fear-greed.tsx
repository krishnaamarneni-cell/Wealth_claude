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
function getGaugeColor(value: number): string {
  if (value <= 25) return '#d32f2f' // Extreme Fear - Red
  if (value <= 45) return '#ff6f00' // Fear - Orange
  if (value <= 55) return '#fbc02d' // Neutral - Yellow
  if (value <= 75) return '#7cb342' // Greed - Light Green
  return '#388e3c' // Extreme Greed - Dark Green
}

function getTextColor(value: number): string {
  if (value <= 25) return 'text-red-600'
  if (value <= 45) return 'text-orange-600'
  if (value <= 55) return 'text-yellow-600'
  if (value <= 75) return 'text-green-600'
  return 'text-green-700'
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
  const [isAnimating, setIsAnimating] = useState(true)

  const gaugeColor = getGaugeColor(value)
  const textColor = getTextColor(value)

  // Animate needle from 0 to value on mount
  useEffect(() => {
    setIsAnimating(true)
    setAnimatedValue(0)

    const duration = 2000 // 2 seconds
    const fps = 60
    const frames = (duration / 1000) * fps
    const increment = value / frames

    let currentFrame = 0

    const animation = setInterval(() => {
      currentFrame++
      const newValue = Math.min(increment * currentFrame, value)
      setAnimatedValue(newValue)

      if (currentFrame >= frames) {
        clearInterval(animation)
        setAnimatedValue(value)
        setIsAnimating(false)
      }
    }, 1000 / fps)

    return () => clearInterval(animation)
  }, [value])

  // Calculate rotation for needle (-90 to +90 degrees)
  const rotation = -90 + (animatedValue * 1.8) // 180 degree range

  return (
    <div className="flex flex-col items-center py-4">
      {/* Title */}
      <div className="text-center mb-6">
        <h3 className="font-bold text-xl mb-1">{title}</h3>
        <p className="text-xs text-muted-foreground">{description}</p>
      </div>

      {/* Gauge Container */}
      <div className="relative w-64 h-40 mb-8">
        {/* Canvas for gauge */}
        <svg
          width="256"
          height="160"
          viewBox="0 0 256 160"
          className="w-full h-full"
        >
          {/* Background semi-circle (gray) */}
          <path
            d="M 28 128 A 100 100 0 0 1 228 128"
            fill="none"
            stroke="#e0e0e0"
            strokeWidth="28"
            strokeLinecap="round"
          />

          {/* Gradient colored arc based on current value */}
          {/* Extreme Fear - Red */}
          <path
            d="M 28 128 A 100 100 0 0 1 78 45"
            fill="none"
            stroke="#d32f2f"
            strokeWidth="28"
            strokeLinecap="round"
          />

          {/* Fear - Orange */}
          <path
            d="M 78 45 A 100 100 0 0 1 128 28"
            fill="none"
            stroke="#ff6f00"
            strokeWidth="28"
            strokeLinecap="round"
          />

          {/* Neutral - Yellow */}
          <path
            d="M 128 28 A 100 100 0 0 1 178 45"
            fill="none"
            stroke="#fbc02d"
            strokeWidth="28"
            strokeLinecap="round"
          />

          {/* Greed - Light Green */}
          <path
            d="M 178 45 A 100 100 0 0 1 228 128"
            fill="none"
            stroke="#7cb342"
            strokeWidth="28"
            strokeLinecap="round"
          />

          {/* Needle with shadow */}
          <g
            transform={`rotate(${rotation} 128 128)`}
            style={{
              transition: isAnimating ? 'none' : 'transform 0.3s ease-out',
            }}
          >
            {/* Shadow */}
            <line
              x1="128"
              y1="128"
              x2="128"
              y2="48"
              stroke="rgba(0,0,0,0.3)"
              strokeWidth="5"
              strokeLinecap="round"
              transform="translate(2, 2)"
            />
            {/* Main needle - BLACK for visibility */}
            <line
              x1="128"
              y1="128"
              x2="128"
              y2="48"
              stroke="#000000"
              strokeWidth="4"
              strokeLinecap="round"
            />
            {/* Needle tip circle */}
            <circle
              cx="128"
              cy="48"
              r="4"
              fill="#000000"
            />
          </g>

          {/* Center pivot circle with border */}
          <circle
            cx="128"
            cy="128"
            r="10"
            fill="#ffffff"
            stroke="#000000"
            strokeWidth="2"
          />

          {/* Scale markers */}
          <text x="28" y="145" fontSize="10" fill="#666" textAnchor="start">0</text>
          <text x="228" y="145" fontSize="10" fill="#666" textAnchor="end">100</text>
          <text x="128" y="20" fontSize="10" fill="#666" textAnchor="middle">50</text>
        </svg>

        {/* Large value display */}
        <div className="absolute bottom-0 left-1/2 transform -translate-x-1/2 text-center">
          <div className={`text-6xl font-bold ${textColor}`}>
            {Math.round(animatedValue)}
          </div>
        </div>
      </div>

      {/* Label below */}
      <div className="text-center mb-4">
        <div className={`text-3xl font-bold ${textColor} uppercase`}>
          {label}
        </div>
      </div>

      {/* Change indicator */}
      <div className="flex items-center gap-2 text-sm bg-secondary/50 px-4 py-2 rounded-full">
        {change > 0 ? (
          <>
            <TrendingUp className="h-4 w-4 text-green-500" />
            <span className="text-green-500 font-semibold">+{change} from yesterday</span>
          </>
        ) : change < 0 ? (
          <>
            <TrendingDown className="h-4 w-4 text-red-500" />
            <span className="text-red-500 font-semibold">{change} from yesterday</span>
          </>
        ) : (
          <>
            <Minus className="h-4 w-4 text-muted-foreground" />
            <span className="text-muted-foreground font-semibold">Unchanged</span>
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
        {/* Dual Speedometers - Side by side */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 divide-y md:divide-y-0 md:divide-x divide-border">
          {/* Stock Market Speedometer */}
          <div className="pt-4 md:pt-0">
            <Speedometer
              value={stock.value}
              label={stock.label}
              previousValue={stock.previousValue}
              change={stock.change}
              title="Stock Market"
              description="CNN Fear & Greed Index"
            />
          </div>

          {/* Crypto Market Speedometer */}
          <div className="pt-8 md:pt-0 md:pl-8">
            <Speedometer
              value={crypto.value}
              label={crypto.label}
              previousValue={crypto.previousValue}
              change={crypto.change}
              title="Crypto Market"
              description="Alternative.me Index"
            />
          </div>
        </div>

        {/* What This Means */}
        <div className="mt-8 p-4 rounded-lg bg-blue-500/10 border border-blue-500/30">
          <h4 className="font-semibold text-sm mb-2 flex items-center gap-2">
            💡 What this means:
          </h4>
          <div className="space-y-2 text-sm text-muted-foreground">
            {stock.value <= 45 && (
              <p>
                <strong className="text-orange-600">Stock Market Fear:</strong> Investors are nervous.
                This often presents buying opportunities for long-term investors, but expect continued volatility.
              </p>
            )}
            {stock.value >= 55 && (
              <p>
                <strong className="text-green-600">Stock Market Greed:</strong> Investors are optimistic.
                Watch for overheating—consider taking profits or rebalancing.
              </p>
            )}
            {stock.value > 45 && stock.value < 55 && (
              <p>
                <strong className="text-yellow-600">Stock Market Neutral:</strong> Balanced sentiment.
                Markets are neither fearful nor greedy.
              </p>
            )}
            {crypto.value >= 45 && crypto.value <= 55 && (
              <p>
                <strong className="text-yellow-600">Crypto Market Neutral:</strong> Balanced sentiment.
                No extreme fear or greed driving crypto prices right now.
              </p>
            )}
            {crypto.value < 45 && (
              <p>
                <strong className="text-orange-600">Crypto Market Fear:</strong> Risk-off sentiment in crypto.
                Expect volatility and possible further downside.
              </p>
            )}
            {crypto.value > 55 && (
              <p>
                <strong className="text-green-600">Crypto Market Greed:</strong> Strong buying momentum.
                Be cautious of FOMO—prices may be overextended.
              </p>
            )}
          </div>
        </div>

        {/* Scale Legend */}
        <div className="mt-6 p-4 rounded-lg bg-secondary/30 border border-border">
          <div className="flex items-center justify-between text-xs">
            <div className="flex flex-col items-center gap-1">
              <div className="w-6 h-6 rounded-full" style={{ backgroundColor: '#d32f2f' }}></div>
              <span className="font-semibold text-red-600">0-25</span>
              <span className="text-muted-foreground text-center text-[10px]">Extreme<br />Fear</span>
            </div>
            <div className="flex flex-col items-center gap-1">
              <div className="w-6 h-6 rounded-full" style={{ backgroundColor: '#ff6f00' }}></div>
              <span className="font-semibold text-orange-600">26-45</span>
              <span className="text-muted-foreground text-[10px]">Fear</span>
            </div>
            <div className="flex flex-col items-center gap-1">
              <div className="w-6 h-6 rounded-full" style={{ backgroundColor: '#fbc02d' }}></div>
              <span className="font-semibold text-yellow-600">46-55</span>
              <span className="text-muted-foreground text-[10px]">Neutral</span>
            </div>
            <div className="flex flex-col items-center gap-1">
              <div className="w-6 h-6 rounded-full" style={{ backgroundColor: '#7cb342' }}></div>
              <span className="font-semibold text-green-600">56-75</span>
              <span className="text-muted-foreground text-[10px]">Greed</span>
            </div>
            <div className="flex flex-col items-center gap-1">
              <div className="w-6 h-6 rounded-full" style={{ backgroundColor: '#388e3c' }}></div>
              <span className="font-semibold text-green-700">76-100</span>
              <span className="text-muted-foreground text-center text-[10px]">Extreme<br />Greed</span>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
