import { Header } from "@/components/header"
import MarketTicker from "@/components/market-ticker"
import { NewsHub } from "@/components/news-hub"
import type { Metadata } from "next"

export const metadata: Metadata = {
  title: 'Market News — WealthClaude | AI-Powered Finance News',
  description: 'Stay ahead of the market with AI-powered US stock market news, pre-market previews, geopolitical analysis and finance education updated 6 times daily.',
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
