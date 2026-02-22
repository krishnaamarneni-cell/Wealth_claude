"use client"

import { useEffect, useRef } from "react"

interface TradingViewHeatmapProps {
  dataSource: string
  height?: number
}

function buildHtml(dataSource: string, height: number): string {
  const isCrypto = dataSource === "CRYPTO"

  const scriptSrc = isCrypto
    ? "https://s3.tradingview.com/external-embedding/embed-widget-crypto-coins-heatmap.js"
    : "https://s3.tradingview.com/external-embedding/embed-widget-stock-heatmap.js"

  const config = isCrypto
    ? JSON.stringify({
      dataSource: "Crypto",
      blockSize: "market_cap_calc",
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
    : JSON.stringify({
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

  return `<!DOCTYPE html>
<html>
  <head>
    <meta charset="utf-8"/>
    <style>
      *{margin:0;padding:0;box-sizing:border-box}
      html,body{width:100%;height:100%;background:#0f0f0f;overflow:hidden}
      .tradingview-widget-container,
      .tradingview-widget-container__widget{
        width:100%;height:${height}px
      }
    </style>
  </head>
  <body>
    <div class="tradingview-widget-container">
      <div class="tradingview-widget-container__widget"></div>
      <script type="text/javascript" src="${scriptSrc}" async>${config}</script>
    </div>
  </body>
</html>`
}

export function TradingViewHeatmap({ dataSource, height = 620 }: TradingViewHeatmapProps) {
  const containerRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!containerRef.current) return

    const iframe = document.createElement("iframe")
    iframe.scrolling = "no"
    iframe.style.cssText = `width:100%;height:${height}px;border:none;display:block;`
    containerRef.current.appendChild(iframe)

    const doc = iframe.contentDocument ?? iframe.contentWindow?.document
    if (doc) {
      doc.open()
      doc.write(buildHtml(dataSource, height))
      doc.close()
    }

    return () => {
      if (containerRef.current) containerRef.current.innerHTML = ""
    }
  }, []) // mount once, never re-renders

  return (
    <div ref={containerRef} style={{ width: "100%", height: `${height}px` }} />
  )
}
