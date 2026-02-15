import { Header } from "@/components/header"
import { HeroSection } from "@/components/hero-section"
import { HeatmapsSection } from "@/components/heatmaps-section"
import { FeaturesSection } from "@/components/features-section"
import { BrokersSection } from "@/components/brokers-section"
import { FaqSection } from "@/components/faq-section"
import { Footer } from "@/components/footer"

export default function Home() {
  return (
    <main className="min-h-screen bg-background">
      <Header />
      <HeroSection />
      <HeatmapsSection />
      <FeaturesSection />
      <BrokersSection />
      <FaqSection />
      <Footer />
    </main>
  )
}
