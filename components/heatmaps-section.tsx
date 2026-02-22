"use client"

interface TradingViewHeatmapProps {
  dataSource: string
  height?: number
  mountKey: number
}

export function TradingViewHeatmap({
  dataSource,
  height = 620,
  mountKey,
}: TradingViewHeatmapProps) {
  // Every unique src URL = true iframe navigation = guaranteed fresh widget
  // mountKey from parent + dataSource + timestamp = 100% unique every time
  const src = `/api/heatmap?market=${dataSource}&height=${height}&t=${mountKey}`

  return (
    <iframe
      src={src}
      width="100%"
      height={height}
      frameBorder="0"
      scrolling="no"
      title={`${dataSource} Heatmap`}
      style={{ display: "block", border: "none", width: "100%" }}
    />
  )
}
