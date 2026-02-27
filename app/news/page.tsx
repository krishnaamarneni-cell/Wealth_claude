import { Header } from "@/components/header"
import MarketTicker from "@/components/market-ticker"
import { NewsHub } from "@/components/news-hub"
import type { Metadata } from "next"

export const metadata: Metadata = {
  title: "Market Intelligence — WealthClaude",
  description: "AI-powered stock market analysis, trending tickers, crypto moves and financial insights updated 3x daily.",
}

export default function NewsPage() {
  return (
    <div className="min-h-screen bg-background">
      <Header />
      <div className="pt-16">
        <MarketTicker />
        <div className="container mx-auto px-4 py-8">
          <NewsHub />
        </div>
      </div>
    </div>
  )
}
