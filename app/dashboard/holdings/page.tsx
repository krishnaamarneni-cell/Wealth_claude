"use client"

import { useState } from "react"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Button } from "@/components/ui/button"
import { RefreshCw } from "lucide-react"
import { usePortfolio } from "@/lib/portfolio-context"
import HoldingsTab from "@/components/holdings-tab"
import DividendsTab from "@/components/dividends-tab"
import StockDetailModal from "@/components/stock-detail-modal"

export default function HoldingsPage() {
  const [activeTab, setActiveTab] = useState<"holdings" | "dividends">("holdings")
  const [selectedSymbol, setSelectedSymbol] = useState<string | null>(null)
  const { refresh, isRefreshing } = usePortfolio()

  const handleRefresh = async () => {
    console.log("[Holdings Page] Refreshing all data...")
    await refresh()
  }

  return (
    <div className="p-4 lg:p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Portfolio Dashboard</h1>
          <p className="text-muted-foreground mt-1">
            Track your holdings, dividends, and performance
          </p>
        </div>
        <Button
          onClick={handleRefresh}
          disabled={isRefreshing}
          variant="outline"
          size="sm"
          className="gap-2"
        >
          <RefreshCw className={`h-4 w-4 ${isRefreshing ? "animate-spin" : ""}`} />
          {isRefreshing ? "Refreshing..." : "Refresh All"}
        </Button>
      </div>

      {/* Tabs */}
      <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as "holdings" | "dividends")}>
        <TabsList className="grid w-full max-w-md grid-cols-2">
          <TabsTrigger value="holdings">Holdings</TabsTrigger>
          <TabsTrigger value="dividends">Dividends</TabsTrigger>
        </TabsList>

        <TabsContent value="holdings" className="space-y-6 mt-6">
          <HoldingsTab onStockClick={(symbol) => setSelectedSymbol(symbol)} />
        </TabsContent>

        <TabsContent value="dividends" className="space-y-6 mt-6">
          <DividendsTab />
        </TabsContent>
      </Tabs>

      {/* Stock Detail Modal */}
      <StockDetailModal
        symbol={selectedSymbol}
        open={!!selectedSymbol}
        onClose={() => setSelectedSymbol(null)}
      />
    </div>
  )
}
