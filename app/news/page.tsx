import { Header } from "@/components/header"
import MarketTicker from "@/components/market-ticker"
import MoneyFlowDashboard from "@/components/money-flow-dashboard"
import GlobalMarkets from "@/components/global-markets"
import { PublicNewsSection } from "@/components/public-news-section"
import type { Metadata } from "next"

export const metadata: Metadata = {
  title: "Market News — TrackFolio",
  description: "Latest stock market news, S&P 500 updates, global markets, and financial analysis",
}

export default function NewsPage() {
  return (
    <div className="min-h-screen bg-background">
      <Header />

      {/* pt-16 accounts for fixed header height */}
      <div className="pt-16">

        {/* Scrolling ticker — full width */}
        <MarketTicker />

        <div className="container mx-auto px-4 py-8 space-y-8">

          {/* Money Flow (3/5) + Global Markets (2/5) */}
          <div className="grid grid-cols-1 xl:grid-cols-5 gap-6">
            <div className="xl:col-span-3">
              <MoneyFlowDashboard />
            </div>
            <div className="xl:col-span-2">
              <GlobalMarkets />
            </div>
          </div>

          {/* Main news feed + sidebar */}
          <PublicNewsSection />

        </div>
      </div>
    </div>
  )
}
