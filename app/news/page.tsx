import { Header } from "@/components/header"
import MarketTicker from "@/components/market-ticker"
import { GlobalIntelligence } from "@/components/news/GlobalIntelligence"
import { Footer } from "@/components/footer"
import type { Metadata } from "next"

export const metadata: Metadata = {
  title: 'Global Intelligence Dashboard — WealthClaude | AI-Powered Analysis',
  description: 'AI-powered global intelligence dashboard. Geopolitics, markets, tech, climate, and threat analysis synthesized from 50+ sources. Updated 2x daily.',
  alternates: { canonical: 'https://www.wealthclaude.com/news' },
  openGraph: {
    title: 'Global Intelligence Dashboard — WealthClaude | AI-Powered Analysis',
    description: 'AI-powered global intelligence dashboard. Geopolitics, markets, tech, climate, and threat analysis synthesized from 50+ sources.',
    url: 'https://www.wealthclaude.com/news',
    siteName: 'WealthClaude',
    type: 'website',
    images: [{ url: '/favicon-512.jpg', width: 512, height: 512, alt: 'WealthClaude Market Intelligence' }],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Global Intelligence Dashboard — WealthClaude | AI-Powered Analysis',
    description: 'AI-powered global intelligence dashboard. Updated 2x daily.',
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
          <GlobalIntelligence />
        </div>
      </div>
      <Footer />
    </div>
  )
}
