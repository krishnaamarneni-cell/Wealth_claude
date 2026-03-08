import { Header } from "@/components/header"
import MarketTicker from "@/components/market-ticker"
import { NewsHub } from "@/components/news-hub"
import { Footer } from "@/components/footer"
import type { Metadata } from "next"

export const metadata: Metadata = {
  title: 'Market News — WealthClaude | AI-Powered Finance News',
  description: 'Stay ahead of the market with AI-powered US stock market news, pre-market previews, geopolitical analysis and finance education updated 6 times daily.',
  alternates: { canonical: 'https://www.wealthclaude.com/news' },
  openGraph: {
    title: 'Market News — WealthClaude | AI-Powered Finance News',
    description: 'Stay ahead of the market with AI-powered US stock market news, pre-market previews, geopolitical analysis and finance education updated 6 times daily.',
    url: 'https://www.wealthclaude.com/news',
    siteName: 'WealthClaude',
    type: 'website',
    images: [{ url: '/favicon-512.jpg', width: 512, height: 512, alt: 'WealthClaude Market News' }],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Market News — WealthClaude | AI-Powered Finance News',
    description: 'Stay ahead of the market with AI-powered US stock market news, pre-market previews, geopolitical analysis and finance education updated 6 times daily.',
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
          <NewsHub />
        </div>
      </div>
      <Footer />
    </div>
  )
}
