"use client"

import { useEffect, useRef, useState } from "react"

interface TradingViewHeatmapProps {
  dataSource: "SPX500" | "NDX"
  title?: string
  height?: number
}

export function TradingViewHeatmap({ dataSource, title, height = 600 }: TradingViewHeatmapProps) {
  const containerRef = useRef<HTMLDivElement>(null)
  const [hasError, setHasError] = useState(false)

  useEffect(() => {
    if (!containerRef.current) return

    try {
      // Clear previous content
      containerRef.current.innerHTML = ""

      // Create iframe container
      const widgetContainer = document.createElement("div")
      widgetContainer.className = "tradingview-widget-container"
      widgetContainer.style.height = `${height}px`
      widgetContainer.style.width = "100%"

      // Create script element
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
        isDataSetEnabled: false,
        isZoomEnabled: true,
        hasSymbolTooltip: true,
        width: "100%",
        height: height,
      }

      script.innerHTML = JSON.stringify(config)

      widgetContainer.appendChild(script)
      containerRef.current.appendChild(widgetContainer)

      setHasError(false)
    } catch (error) {
      console.warn('Failed to load TradingView heatmap:', error)
      setHasError(true)
    }

    return () => {
      if (containerRef.current) {
        containerRef.current.innerHTML = ""
      }
    }
  }, [dataSource, height])

  if (hasError) {
    return (
      <div className="flex flex-col items-center justify-center bg-card border border-border rounded-lg p-8" style={{ height }}>
        <p className="text-muted-foreground text-center">
          Heat map temporarily unavailable. Please refresh the page.
        </p>
      </div>
    )
  }

  return (
    <div className="flex flex-col gap-3">
      {title && <h3 className="text-xl font-semibold text-foreground">{title}</h3>}
      <div
        ref={containerRef}
        className="tradingview-widget-container rounded-lg overflow-hidden bg-card border border-border"
        style={{ minHeight: height }}
      />
    </div>
  )
}
