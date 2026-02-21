"use client"

import { useEffect, useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { TrendingUp, TrendingDown, Minus } from "lucide-react"

interface FGData {
  value: number
  label: string
  previousClose: number
  change: number
  source: string
}

function getTextColor(v: number): string {
  if (v <= 25) return 'text-red-500'
  if (v <= 45) return 'text-orange-500'
  if (v <= 55) return 'text-yellow-500'
  if (v <= 75) return 'text-green-500'
  return 'text-emerald-500'
}

function Gauge({ value, label, change, title, description, source }: FGData & { title: string; description: string }) {
  const [display, setDisplay] = useState(0)
  const textColor = getTextColor(value)
  const needleAngle = -90 + display * 1.8

  useEffect(() => {
    let cur = 0
    const step = value / (1800 / 16) // animate over 1.8s at 60fps
    const id = setInterval(() => {
      cur += step
      if (cur >= value) { setDisplay(value); clearInterval(id) }
      else setDisplay(cur)
    }, 16)
    return () => clearInterval(id)
  }, [value])

  return (
    <div className="flex flex-col items-center w-full px-4 py-6">
      <h3 className="font-bold text-xl mb-1">{title}</h3>
      <p className="text-xs text-muted-foreground mb-8">{description}</p>

      <div className="w-full max-w-[280px] mb-6">
        <svg viewBox="0 0 200 120" className="w-full h-auto">
          {/* Track */}
          <path d="M 30 110 A 70 70 0 0 1 170 110" fill="none" stroke="rgba(255,255,255,0.08)" strokeWidth="24" strokeLinecap="round" />
          {/* Extreme Fear */}
          <path d="M 30 110 A 70 70 0 0 1 65 50" fill="none" stroke="#ef4444" strokeWidth="24" strokeLinecap="round" />
          {/* Fear */}
          <path d="M 65 50 A 70 70 0 0 1 100 40" fill="none" stroke="#f97316" strokeWidth="24" strokeLinecap="round" />
          {/* Neutral */}
          <path d="M 100 40 A 70 70 0 0 1 135 50" fill="none" stroke="#eab308" strokeWidth="24" strokeLinecap="round" />
          {/* Greed */}
          <path d="M 135 50 A 70 70 0 0 1 170 110" fill="none" stroke="#22c55e" strokeWidth="24" strokeLinecap="round" />
          {/* Needle */}
          <g transform={`rotate(${needleAngle} 100 110)`}>
            <line x1="100" y1="110" x2="100" y2="50" stroke="#ffffff" strokeWidth="3.5" strokeLinecap="round" />
            <polygon points="100,45 95.5,56 104.5,56" fill="#ffffff" />
          </g>
          {/* Pivot */}
          <circle cx="100" cy="110" r="7" fill="hsl(var(--background))" stroke="#ffffff" strokeWidth="3" />
        </svg>
      </div>

      <div className={`text-4xl font-bold mb-2 ${textColor}`}>{Math.round(display)}</div>
      <div className={`text-2xl font-bold uppercase ${textColor}`}>{label}</div>

      <div className="flex items-center gap-2 text-sm mt-3">
        {change > 0
          ? <><TrendingUp className="h-4 w-4 text-green-500" /><span className="text-green-500">+{change} from yesterday</span></>
          : change < 0
            ? <><TrendingDown className="h-4 w-4 text-red-500" /><span className="text-red-500">{change} from yesterday</span></>
            : <><Minus className="h-4 w-4 text-muted-foreground" /><span className="text-muted-foreground">Unchanged</span></>
        }
      </div>

      <p className="text-[10px] text-muted-foreground mt-2 opacity-60">Source: {source}</p>
    </div>
  )
}

function LoadingSkeleton() {
  return (
    <Card className="border-border bg-card">
      <CardHeader>
        <div className="h-6 w-44 bg-secondary rounded animate-pulse" />
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {[0, 1].map(i => (
            <div key={i} className="flex flex-col items-center gap-4 py-6">
              <div className="h-5 w-32 bg-secondary rounded animate-pulse" />
              <div className="w-64 h-32 bg-secondary rounded animate-pulse" />
              <div className="h-8 w-16 bg-secondary rounded animate-pulse" />
              <div className="h-6 w-24 bg-secondary rounded animate-pulse" />
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  )
}

export default function FearGreed() {
  const [stock, setStock] = useState<FGData | null>(null)
  const [crypto, setCrypto] = useState<FGData | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(false)

  useEffect(() => {
    fetch('/api/fear-greed')
      .then(r => r.json())
      .then(data => {
        setStock(data.stock)
        setCrypto(data.crypto)
        setLoading(false)
      })
      .catch(() => { setError(true); setLoading(false) })
  }, [])

  if (loading) return <LoadingSkeleton />
  if (error || !stock || !crypto) return (
    <Card className="border-border bg-card">
      <CardContent className="p-8 text-center text-muted-foreground">
        Unable to load sentiment data
      </CardContent>
    </Card>
  )

  return (
    <Card className="border-border bg-card">
      <CardHeader>
        <CardTitle className="text-xl font-bold">🎭 Market Sentiment</CardTitle>
        <p className="text-sm text-muted-foreground">
          Real-time fear and greed indicators for stocks and crypto
        </p>
      </CardHeader>

      <CardContent>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 lg:gap-12">
          <Gauge {...stock} title="Stock Market" description="CNN Fear & Greed / VIX-based" />
          <Gauge {...crypto} title="Crypto Market" description="Alternative.me Index" />
        </div>

        {/* Interpretation */}
        <div className="mt-8 p-4 rounded-lg bg-blue-500/10 border border-blue-500/30">
          <h4 className="font-semibold text-sm mb-2">💡 What this means:</h4>
          <div className="space-y-2 text-sm text-muted-foreground">
            {stock.value <= 45 && <p><strong className="text-orange-500">Stock Market Fear:</strong> Investors are nervous. This often presents buying opportunities for long-term investors.</p>}
            {stock.value > 45 && stock.value <= 55 && <p><strong className="text-yellow-500">Stock Market Neutral:</strong> Balanced sentiment — neither fearful nor greedy.</p>}
            {stock.value > 55 && <p><strong className="text-green-500">Stock Market Greed:</strong> Investors are optimistic. Watch for potential overheating.</p>}
            {crypto.value <= 45 && <p><strong className="text-orange-500">Crypto Market Fear:</strong> Risk-off sentiment. Expect volatility.</p>}
            {crypto.value > 45 && crypto.value <= 55 && <p><strong className="text-yellow-500">Crypto Market Neutral:</strong> Balanced sentiment in crypto markets.</p>}
            {crypto.value > 55 && <p><strong className="text-green-500">Crypto Market Greed:</strong> Strong buying momentum in crypto.</p>}
          </div>
        </div>

        {/* Scale */}
        <div className="mt-6 p-4 rounded-lg bg-secondary/30">
          <h4 className="text-xs font-semibold mb-3 text-muted-foreground uppercase">Scale Guide</h4>
          <div className="flex justify-between items-center">
            {[
              { range: '0–25', label: 'Extreme Fear', color: 'bg-red-500', text: 'text-red-500' },
              { range: '26–45', label: 'Fear', color: 'bg-orange-500', text: 'text-orange-500' },
              { range: '46–55', label: 'Neutral', color: 'bg-yellow-500', text: 'text-yellow-500' },
              { range: '56–75', label: 'Greed', color: 'bg-green-500', text: 'text-green-500' },
              { range: '76–100', label: 'Extr. Greed', color: 'bg-emerald-500', text: 'text-emerald-500' },
            ].map(item => (
              <div key={item.range} className="flex flex-col items-center gap-1">
                <div className={`w-4 h-4 rounded-full ${item.color}`} />
                <span className={`text-xs font-semibold ${item.text}`}>{item.range}</span>
                <span className="text-[10px] text-muted-foreground text-center">{item.label}</span>
              </div>
            ))}
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
