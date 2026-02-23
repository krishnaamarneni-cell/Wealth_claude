import { Header } from "@/components/header"
import { HeroSection } from "@/components/hero-section"
import { LivePreviewSection } from "@/components/live-preview-section"
import { FeaturesSection } from "@/components/features-section"
import { PricingSection } from "@/components/pricing-section"
import { BrokersSection } from "@/components/brokers-section"
import { BlogSection } from "@/components/blog-section"
import { FaqSection } from "@/components/faq-section"
import { Footer } from "@/components/footer"

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
