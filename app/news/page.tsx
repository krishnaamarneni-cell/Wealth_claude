import { Header } from "@/components/header"
import MarketTicker from "@/components/market-ticker"
import { NewsIntelligence } from "@/components/news/NewsIntelligence"
import { Footer } from "@/components/footer"
import type { Metadata } from "next"

export const metadata: Metadata = {
  title: 'Market Intelligence — WealthClaude | AI-Powered Finance News',
  description: 'AI-powered market intelligence with sentiment analysis. Real-time synthesis of US stock market news, geopolitics, economy, and personal finance. Updated 3x daily.',
  alternates: { canonical: 'https://www.wealthclaude.com/news' },
  openGraph: {
    title: 'Market Intelligence — WealthClaude | AI-Powered Finance News',
    description: 'AI-powered market intelligence with sentiment analysis. Real-time synthesis of US stock market news, geopolitics, economy, and personal finance.',
    url: 'https://www.wealthclaude.com/news',
    siteName: 'WealthClaude',
    type: 'website',
    images: [{ url: '/favicon-512.jpg', width: 512, height: 512, alt: 'WealthClaude Market Intelligence' }],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Market Intelligence — WealthClaude | AI-Powered Finance News',
    description: 'AI-powered market intelligence with sentiment analysis. Updated 3x daily.',
    images: ['/favicon-512.jpg'],
  },
}

export default function NewsPage() {
  return (
    <div className="min-h-screen bg-background flex flex-col">
      <Header />
      <div className="pt-16 flex-1">
        <MarketTicker />
        <div className="container mx-auto px-4 py-8">
          <NewsIntelligence />
        </div>
      </div>
      <Footer />
    </div>
  )
}
