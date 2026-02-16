"use client"

import { useEffect, useRef } from "react"

interface TradingViewHeatmapProps {
  dataSource: "SPX500" | "NASDAQ100"
  title?: string
  height?: number
}

export function TradingViewHeatmap({ dataSource, title, height = 500 }: TradingViewHeatmapProps) {
  const containerRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!containerRef.current) return

    try {
      const script = document.createElement("script")
      script.src = "https://s3.tradingview.com/external-embedding/embed-widget-stock-heatmap.js"
      script.type = "text/javascript"
      script.async = true

      const config = {
        exchanges: [],
        dataSource: dataSource,
        grouping: "sector",
        blockSize: "market_cap_basic",
        blockColor: "change",
        locale: "en",
        symbolUrl: "",
        colorTheme: "dark",
        hasTopBar: false,
        isDataSet498nabled: false,
        isZoomEnabled: true,
        hasSymbolTooltip: true,
        width: "100%",
        height: height,
      }

      script.innerHTML = JSON.stringify(config)

      containerRef.current.innerHTML = ""
      containerRef.current.appendChild(script)
    } catch (error) {
      console.warn('Failed to load TradingView heatmap')
    }

    return () => {
      if (containerRef.current) {
        containerRef.current.innerHTML = ""
      }
    }
  }, [dataSource, height])

  return (
    <div className="flex flex-col gap-3">
      {title && <h3 className="text-xl font-semibold text-foreground">{title}</h3>}
      <div
        ref={containerRef}
        className="tradingview-widget-container rounded-lg overflow-hidden"
        style={{ height: height }}
      />
    </div>
  )
}
