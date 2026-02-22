"use client"

interface TradingViewHeatmapProps {
  dataSource: string
  height?: number
}

export function TradingViewHeatmap({
  dataSource,
  height = 620,
}: TradingViewHeatmapProps) {
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

  const html = `
    <!DOCTYPE html>
    <html>
      <head>
        <meta charset="utf-8" />
        <style>
          * { margin: 0; padding: 0; box-sizing: border-box; }
          html, body {
            width: 100%;
            height: 100%;
            background: transparent;
            overflow: hidden;
          }
          .tradingview-widget-container,
          .tradingview-widget-container__widget,
          iframe {
            width: 100% !important;
            height: 100% !important;
          }
        </style>
      </head>
      <body>
        <div
          class="tradingview-widget-container"
          style="width:100%;height:${height}px"
        >
          <div
            class="tradingview-widget-container__widget"
            style="width:100%;height:${height}px"
          ></div>
          <script
            type="text/javascript"
            src="https://s3.tradingview.com/external-embedding/embed-widget-stock-heatmap.js"
            async
          >${config}</script>
        </div>
      </body>
    </html>
  `

  return (
    <iframe
      key={dataSource}
      srcDoc={html}
      width="100%"
      height={height}
      frameBorder="0"
      scrolling="no"
      title={`${dataSource} Heatmap`}
      style={{ display: "block", border: "none" }}
    />
  )
}
