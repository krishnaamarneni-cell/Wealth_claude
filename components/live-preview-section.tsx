"use client"

import { useEffect, useRef } from "react"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { ArrowRight } from "lucide-react"

function HeatmapEmbed() {
  const containerRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!containerRef.current) return
    containerRef.current.innerHTML = ""

    const iframe = document.createElement("iframe")
    iframe.scrolling = "no"
    iframe.style.cssText = "width:100%;height:400px;border:none;display:block;pointer-events:none;"

    const config = JSON.stringify({
      exchanges: [],
      dataSource: "SPX500",
      grouping: "sector",
      blockSize: "market_cap_basic",
      blockColor: "change",
      locale: "en",
      colorTheme: "dark",
      hasTopBar: false,
      isDataSetEnabled: false,
      isZoomEnabled: false,
      hasSymbolTooltip: false,
      isMonoSize: false,
      width: "100%",
      height: 400,
    })

    const html = `<!DOCTYPE html>
<html>
  <head>
    <meta charset="utf-8"/>
    <style>
      *{margin:0;padding:0;box-sizing:border-box}
      html,body{width:100%;height:100%;background:#0f0f0f;overflow:hidden}
      .tradingview-widget-container,.tradingview-widget-container__widget{width:100%;height:400px}
    </style>
  </head>
  <body>
    <div class="tradingview-widget-container">
      <div class="tradingview-widget-container__widget"></div>
      <script type="text/javascript"
        src="https://s3.tradingview.com/external-embedding/embed-widget-stock-heatmap.js"
        async>${config}</script>
    </div>
  </body>
</html>`

    const doc = iframe.contentDocument ?? iframe.contentWindow?.document
    containerRef.current.appendChild(iframe)
    if (doc) { doc.open(); doc.write(html); doc.close() }

    return () => { if (containerRef.current) containerRef.current.innerHTML = "" }
  }, [])

  return <div ref={containerRef} style={{ height: 400, width: "100%" }} />
}

export function LivePreviewSection() {
  return (
    <section className="py-16 px-4">
      <div className="container mx-auto">
        <div className="text-center mb-10">
          <h2 className="text-3xl md:text-4xl font-bold text-foreground mb-4">
            Live Market Heatmap
          </h2>
          <p className="text-muted-foreground max-w-xl mx-auto">
            See the entire S&P 500 at a glance — real-time. Green is up, red is down,
            size is market cap. This is just one of the tools inside your dashboard.
          </p>
        </div>

        {/* Heatmap with overlay blur at bottom to tease more */}
        <div className="relative max-w-5xl mx-auto rounded-2xl border border-border overflow-hidden shadow-2xl">
          <HeatmapEmbed />

          {/* Gradient overlay — teases more content below */}
          <div className="absolute bottom-0 left-0 right-0 h-32 bg-gradient-to-t from-background to-transparent flex items-end justify-center pb-6">
            <Button asChild size="lg" className="shadow-lg">
              <Link href="/dashboard">
                Open Full Dashboard
                <ArrowRight className="ml-2 h-4 w-4" />
              </Link>
            </Button>
          </div>
        </div>

        {/* Stats row */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-6 max-w-3xl mx-auto mt-10 text-center">
          {[
            { value: "500+", label: "S&P 500 Stocks" },
            { value: "100+", label: "NASDAQ Stocks" },
            { value: "Live", label: "Real-Time Data" },
            { value: "Free", label: "No Login Needed" },
          ].map(({ value, label }) => (
            <div key={label}>
              <p className="text-2xl font-bold text-primary">{value}</p>
              <p className="text-sm text-muted-foreground">{label}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}
