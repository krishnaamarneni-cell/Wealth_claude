"use client"

import { useEffect, useRef } from "react"

interface TradingViewHeatmapProps {
  dataSource: string
  height?: number
}

export function TradingViewHeatmap({
  dataSource,
  height = 620,
}: TradingViewHeatmapProps) {
  const containerRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!containerRef.current) return

    // Fully wipe previous iframe
    containerRef.current.innerHTML = ""

    // Create a brand new iframe each time
    const iframe = document.createElement("iframe")
    iframe.style.cssText = `
      width: 100%;
      height: ${height}px;
      border: none;
      display: block;
    `
    iframe.scrolling = "no"
    containerRef.current.appendChild(iframe)

    const config = JSON.stringify({
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
      height,
    })

    const html = `<!DOCTYPE html>
<html>
  <head>
    <meta charset="utf-8" />
    <style>
      * { margin: 0; padding: 0; box-sizing: border-box; }
      html, body {
        width: 100%;
        height: 100%;
        background: #0f0f0f;
        overflow: hidden;
      }
      .tradingview-widget-container {
        width: 100%;
        height: ${height}px;
      }
      .tradingview-widget-container__widget {
        width: 100%;
        height: ${height}px;
      }
    </style>
  </head>
  <body>
    <div class="tradingview-widget-container">
      <div class="tradingview-widget-container__widget"></div>
      <script
        type="text/javascript"
        src="https://s3.tradingview.com/external-embedding/embed-widget-stock-heatmap.js"
        async
      >${config}</script>
    </div>
  </body>
</html>`

    // Write directly into iframe document — most reliable approach
    const doc = iframe.contentDocument
    if (doc) {
      doc.open()
      doc.write(html)
      doc.close()
    }

    return () => {
      if (containerRef.current) {
        containerRef.current.innerHTML = ""
      }
    }
  }, [dataSource, height])

  return (
    <div
      ref={containerRef}
      style={{ height: `${height}px`, width: "100%" }}
    />
  )
}
