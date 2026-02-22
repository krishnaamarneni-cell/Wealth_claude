"use client"

import { useEffect, useRef } from "react"

interface TradingViewHeatmapProps {
  dataSource: string
  height?: number
}

export function TradingViewHeatmap({ dataSource, height = 600 }: TradingViewHeatmapProps) {
  const containerRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!containerRef.current) return

    // Clear previous widget
    containerRef.current.innerHTML = ""

    const widgetDiv = document.createElement("div")
    widgetDiv.className = "tradingview-widget-container__widget"
    widgetDiv.style.height = `${height - 32}px`
    widgetDiv.style.width = "100%"

    const script = document.createElement("script")
    script.type = "text/javascript"
    script.src =
      "https://s3.tradingview.com/external-embedding/embed-widget-stock-heatmap.js"
    script.async = true
    script.innerHTML = JSON.stringify({
      exchanges: [],
      dataSource,
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
      isMonoSize: false,
      width: "100%",
      height: "100%",
    })

    containerRef.current.appendChild(widgetDiv)
    containerRef.current.appendChild(script)

    return () => {
      if (containerRef.current) {
        containerRef.current.innerHTML = ""
      }
    }
  }, [dataSource, height])

  return (
    <div
      ref={containerRef}
      className="tradingview-widget-container"
      style={{ height: `${height}px`, width: "100%" }}
    />
  )
}
