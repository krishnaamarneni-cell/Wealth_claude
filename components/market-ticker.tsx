"use client"

import { useEffect, useRef, useState } from "react"

interface TickerItem {
  label: string
  value: string
  changePercent?: number
}

function fmt(price: number, prefix = '$'): string {
  if (price >= 10000) return `${prefix}${price.toLocaleString('en-US', { minimumFractionDigits: 0, maximumFractionDigits: 0 })}`
  if (price >= 1000) return `${prefix}${price.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
  return `${prefix}${price.toFixed(2)}`
}

export default function MarketTicker() {
  const [items, setItems] = useState<TickerItem[]>([])
  const [loading, setLoading] = useState(true)
  const tickerRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    fetch('/api/market-overview')
      .then(r => r.json())
      .then(({ ticker }) => {
        const list: TickerItem[] = []
        if (ticker.sp500) list.push({ label: 'S&P 500', value: fmt(ticker.sp500.price, ''), changePercent: ticker.sp500.changePercent })
        if (ticker.nasdaq) list.push({ label: 'Nasdaq', value: fmt(ticker.nasdaq.price, ''), changePercent: ticker.nasdaq.changePercent })
        if (ticker.dow) list.push({ label: 'Dow Jones', value: fmt(ticker.dow.price, ''), changePercent: ticker.dow.changePercent })
        if (ticker.russell2000) list.push({ label: 'Russell 2000', value: fmt(ticker.russell2000.price, ''), changePercent: ticker.russell2000.changePercent })
        if (ticker.gold) list.push({ label: 'Gold', value: fmt(ticker.gold.price), changePercent: ticker.gold.changePercent })
        if (ticker.oil) list.push({ label: 'Oil (USO)', value: fmt(ticker.oil.price), changePercent: ticker.oil.changePercent })
        if (ticker.bonds) list.push({ label: 'Bonds (AGG)', value: fmt(ticker.bonds.price), changePercent: ticker.bonds.changePercent })
        if (ticker.usdDollar) list.push({ label: 'US Dollar', value: fmt(ticker.usdDollar.price), changePercent: ticker.usdDollar.changePercent })
        if (ticker.bitcoin) list.push({ label: 'Bitcoin', value: fmt(ticker.bitcoin.price), changePercent: ticker.bitcoin.changePercent })
        setItems(list)
        setLoading(false)
      })
      .catch(() => setLoading(false))
  }, [])

  if (loading) {
    return (
      <div className="w-full overflow-hidden bg-secondary/30 border-y border-border py-2">
        <div className="flex gap-8 px-4 animate-pulse">
          {[...Array(7)].map((_, i) => (
            <div key={i} className="h-4 w-28 bg-secondary rounded" />
          ))}
        </div>
      </div>
    )
  }

  if (items.length === 0) return null

  return (
    <div className="w-full overflow-hidden bg-secondary/30 border-y border-border py-2">
      <div className="ticker-wrapper">
        <div ref={tickerRef} className="ticker-content">
          {[...items, ...items].map((item, i) => (
            <div key={i} className="flex items-center gap-2 whitespace-nowrap px-4">
              <span className="font-semibold text-sm text-muted-foreground">{item.label}:</span>
              <span className="font-bold text-sm">{item.value}</span>
              {item.changePercent !== undefined && (
                <span className={`text-xs font-semibold ${item.changePercent >= 0 ? 'text-green-500' : 'text-red-500'}`}>
                  {item.changePercent >= 0 ? '+' : ''}{item.changePercent.toFixed(2)}%
                </span>
              )}
              <span className="text-muted-foreground/40 mx-1">│</span>
            </div>
          ))}
        </div>
      </div>

      <style jsx>{`
        .ticker-wrapper { display: flex; overflow: hidden; }
        .ticker-content { display: flex; animation: ticker-scroll 50s linear infinite; }
        @keyframes ticker-scroll {
          0%   { transform: translateX(0); }
          100% { transform: translateX(-50%); }
        }
        .ticker-wrapper:hover .ticker-content { animation-play-state: paused; }
      `}</style>
    </div>
  )
}
