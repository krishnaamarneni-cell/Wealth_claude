"use client"

import { useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { TradingViewHeatmap } from "@/components/tradingview-heatmap"

type HeatmapType = "sp500" | "nasdaq"

export default function HeatmapsPage() {
  const [activeHeatmap, setActiveHeatmap] = useState<HeatmapType>("sp500")

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-foreground">Market Heat Maps</h1>
        <p className="text-muted-foreground">Real-time market visualization of major indices</p>
      </div>

      <Card className="border-border bg-card">
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle className="text-base">
            {activeHeatmap === "sp500" ? "S&P 500" : "NASDAQ 100"} Heat Map
          </CardTitle>
          <Tabs value={activeHeatmap} onValueChange={(v) => setActiveHeatmap(v as HeatmapType)}>
            <TabsList>
              <TabsTrigger value="sp500">S&P 500</TabsTrigger>
              <TabsTrigger value="nasdaq">NASDAQ 100</TabsTrigger>
            </TabsList>
          </Tabs>
        </CardHeader>
        <CardContent className="p-0">
          <div className="h-[600px] w-full">
            <TradingViewHeatmap
              dataSource={activeHeatmap === "sp500" ? "SPX500" : "NASDAQ100"}
              height={600}
            />
          </div>
        </CardContent>
      </Card>

      <div className="grid gap-4 md:grid-cols-2">
        <Card className="border-border bg-card">
          <CardHeader>
            <CardTitle className="text-base">How to Read the Heat Map</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3 text-sm text-muted-foreground">
            <div className="flex items-start gap-3">
              <div className="h-4 w-4 rounded bg-primary" />
              <p><span className="font-medium text-foreground">Green:</span> Stocks that are up for the day. Darker green indicates larger gains.</p>
            </div>
            <div className="flex items-start gap-3">
              <div className="h-4 w-4 rounded bg-destructive" />
              <p><span className="font-medium text-foreground">Red:</span> Stocks that are down for the day. Darker red indicates larger losses.</p>
            </div>
            <div className="flex items-start gap-3">
              <div className="h-4 w-4 rounded bg-muted" />
              <p><span className="font-medium text-foreground">Size:</span> The size of each rectangle represents the market capitalization of the stock.</p>
            </div>
          </CardContent>
        </Card>

        <Card className="border-border bg-card">
          <CardHeader>
            <CardTitle className="text-base">Market Overview</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3 text-sm">
            <div className="flex justify-between">
              <span className="text-muted-foreground">Index</span>
              <span className="font-medium text-foreground">
                {activeHeatmap === "sp500" ? "S&P 500" : "NASDAQ 100"}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Components</span>
              <span className="font-medium text-foreground">
                {activeHeatmap === "sp500" ? "500 stocks" : "100 stocks"}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Data</span>
              <span className="font-medium text-foreground">Real-time</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Grouping</span>
              <span className="font-medium text-foreground">By Sector</span>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
