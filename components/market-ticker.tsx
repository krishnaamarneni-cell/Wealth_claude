"use client"

import { useEffect, useRef } from "react"

interface TickerItem {
  label: string
  value: string
  change?: number
  color?: 'green' | 'red' | 'neutral'
}

// Mock data - will replace with real API
const MOCK_TICKER_DATA: TickerItem[] = [
  { label: 'S&P 500', value: '5,248.49', change: 0.45, color: 'green' },
  { label: 'Dow Jones', value: '38,521.36', change: 0.32, color: 'green' },
  { label: 'Nasdaq', value: '16,340.87', change: 0.67, color: 'green' },
  { label: 'Russell 2000', value: '2,048.52', change: -0.12, color: 'red' },
  { label: 'VIX', value: '14.2', change: -2.8, color: 'green' },
  { label: '10-Year Treasury', value: '4.25%', color: 'neutral' },
  { label: 'Gold', value: '$2,042.50', change: 1.2, color: 'green' },
  { label: 'Oil (WTI)', value: '$72.50', change: -0.8, color: 'red' },
  { label: 'Bitcoin', value: '$51,240', change: 2.3, color: 'green' },
  { label: 'USD Index', value: '103.45', change: 0.15, color: 'green' },
]

function formatChange(change?: number, color?: string): string {
  if (change === undefined) return ''
  const sign = change >= 0 ? '+' : ''
  const colorClass = color === 'green' ? 'text-green-500' : color === 'red' ? 'text-red-500' : 'text-muted-foreground'
  return `${sign}${change.toFixed(2)}%`
}

export default function MarketTicker() {
  const tickerRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const ticker = tickerRef.current
    if (!ticker) return

    // Duplicate items for seamless loop
    const items = ticker.children
    const clone = ticker.cloneNode(true) as HTMLDivElement
    ticker.parentElement?.appendChild(clone)

    // Auto-scroll animation will be handled by CSS
  }, [])

  return (
    <div className="w-full overflow-hidden bg-secondary/30 border-y border-border py-2">
      <div className="ticker-wrapper">
        <div ref={tickerRef} className="ticker-content flex gap-8 animate-scroll">
          {MOCK_TICKER_DATA.map((item, index) => (
            <div
              key={index}
              className="flex items-center gap-2 whitespace-nowrap px-4"
            >
              <span className="font-semibold text-sm">{item.label}:</span>
              <span className="font-bold text-sm">{item.value}</span>
              {item.change !== undefined && (
                <span
                  className={`text-xs font-semibold ${item.color === 'green'
                      ? 'text-green-500'
                      : item.color === 'red'
                        ? 'text-red-500'
                        : 'text-muted-foreground'
                    }`}
                >
                  {formatChange(item.change)}
                </span>
              )}
              <span className="text-muted-foreground">│</span>
            </div>
          ))}
        </div>
      </div>

      <style jsx>{`
        .ticker-wrapper {
          display: flex;
          overflow: hidden;
        }
        
        .ticker-content {
          display: flex;
          animation: scroll 40s linear infinite;
        }
        
        @keyframes scroll {
          0% {
            transform: translateX(0);
          }
          100% {
            transform: translateX(-50%);
          }
        }
        
        .ticker-wrapper:hover .ticker-content {
          animation-play-state: paused;
        }
      `}</style>
    </div>
  )
}
