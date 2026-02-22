import { NextRequest, NextResponse } from "next/server"

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url)
  const dataSource = searchParams.get("market") || "SPX500"
  const height = parseInt(searchParams.get("height") || "620")

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
      html, body { width: 100%; height: 100%; background: #0f0f0f; overflow: hidden; }
      .tradingview-widget-container { width: 100%; height: ${height}px; }
      .tradingview-widget-container__widget { width: 100%; height: ${height}px; }
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

  return new NextResponse(html, {
    headers: {
      "Content-Type": "text/html",
      "Cache-Control": "no-store, no-cache, must-revalidate",
    },
  })
}
