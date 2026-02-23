import { Header } from "@/components/header"
import MarketTicker from "@/components/market-ticker"
import MoneyFlowDashboard from "@/components/money-flow-dashboard"
import GlobalMarkets from "@/components/global-markets"
import { TrendingNews } from "@/components/trending-news"
import { PublicNewsSection } from "@/components/public-news-section"
import type { Metadata } from "next"

export const metadata: Metadata = {
  title: "Market News — TrackFolio",
  description: "Latest stock market news, S&P 500 updates, global markets and financial analysis",
}

export default function NewsPage() {
  return (
    <div className="min-h-screen bg-background">
      <Header />

      <div className="pt-16">

        {/* Ticker — full width */}
        <MarketTicker />

        <div className="container mx-auto px-4 py-8 space-y-6">

          {/* Money Flow — compact, full width, no Market Interpretation */}
          <MoneyFlowDashboard compact />

          {/* Global Markets + Trending side by side */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <GlobalMarkets compact />
            <TrendingNews />
          </div>

          {/* Main news feed + sidebar */}
          <PublicNewsSection />

        </div>
      </div>
    </div>
  )
}
