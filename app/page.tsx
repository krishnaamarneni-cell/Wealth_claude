import { Header } from "@/components/header"
import { HeroSection } from "@/components/hero-section"
// import { HeatmapsSection } from "@/components/heatmaps-section"  // DISABLED
import { FeaturesSection } from "@/components/features-section"
import { BrokersSection } from "@/components/brokers-section"
import { FaqSection } from "@/components/faq-section"
import { Footer } from "@/components/footer"

export default function Home() {
  return (
    <main className="min-h-screen bg-background">
      <h1 className="text-4xl text-white bg-red-500 p-4">TESTING - Can you see this?</h1>
      <Header />
      <HeroSection />
      {/* <HeatmapsSection /> */}
      <FeaturesSection />
      <BrokersSection />
      <FaqSection />
      <Footer />
    </main>
  )
}
