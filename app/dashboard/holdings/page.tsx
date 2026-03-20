"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { RefreshCw, Share2 } from "lucide-react"
import { usePortfolio } from "@/lib/portfolio-context"
import HoldingsTab from "@/components/holdings-tab"
import DividendsTab from "@/components/dividends-tab"
import StockDetailModal from "@/components/stock-detail-modal"
import SharePortfolioModal from "@/components/share-portfolio-modal"
import { OnboardingTab } from "@/components/onboarding-spotlight"

export default function HoldingsPage() {
  const [activeTab, setActiveTab] = useState<"holdings" | "dividends">("holdings")
  const [selectedSymbol, setSelectedSymbol] = useState<string | null>(null)
  const [showShareModal, setShowShareModal] = useState(false)
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
        <div className="flex gap-2">
          <Button
            onClick={() => setShowShareModal(true)}
            variant="outline"
            size="sm"
            className="gap-2"
          >
            <Share2 className="h-4 w-4" />
            Share Portfolio
          </Button>
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
      </div>

      {/* Tabs */}
      <div className="space-y-6">
        <div className="flex gap-2">
          <OnboardingTab
            stepId="holdings"
            isSelected={activeTab === "holdings"}
            onClick={() => setActiveTab("holdings")}
          >
            Holdings
          </OnboardingTab>
          <OnboardingTab
            stepId="dividends"
            isSelected={activeTab === "dividends"}
            onClick={() => setActiveTab("dividends")}
          >
            Dividends
          </OnboardingTab>
        </div>

        {/* Tab Content */}
        <div>
          {activeTab === "holdings" && (
            <HoldingsTab onStockClick={(symbol) => setSelectedSymbol(symbol)} />
          )}
          {activeTab === "dividends" && (
            <DividendsTab />
          )}
        </div>
      </div>

      {/* Stock Detail Modal */}
      <StockDetailModal
        symbol={selectedSymbol}
        open={!!selectedSymbol}
        onClose={() => setSelectedSymbol(null)}
      />

      {/* Share Portfolio Modal */}
      <SharePortfolioModal
        open={showShareModal}
        onClose={() => setShowShareModal(false)}
      />
    </div>
  )
}
