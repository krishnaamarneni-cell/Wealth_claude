import { Header } from "@/components/header"
import { HeroSection } from "@/components/hero-section"
import { LivePreviewSection } from "@/components/live-preview-section"
import { FeaturesSection } from "@/components/features-section"
import { PricingSection } from "@/components/pricing-section"
import { BrokersSection } from "@/components/brokers-section"
import { BlogSection } from "@/components/blog-section"
import { FaqSection } from "@/components/faq-section"
import { Footer } from "@/components/footer"
import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'WealthClaude — Free AI Portfolio Tracker & Market Intelligence',
  description: 'Track your stock portfolio with AI-powered insights, real-time market news and performance analytics. Free to start. No bank account linking required.',
}

export default function Home() {
  return (
    <main className="min-h-screen bg-background">
      <Header />
      <HeroSection />
      <LivePreviewSection />
      <FeaturesSection />
      <PricingSection />
      <BrokersSection />
      <BlogSection />
      <FaqSection />
      <Footer />
    </main>
  )
}
