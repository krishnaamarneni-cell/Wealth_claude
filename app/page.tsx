import { Header } from "@/components/header"
import { HeroSection } from "@/components/hero-section"
import { LivePreviewSection } from "@/components/live-preview-section"
import { FeaturesSection } from "@/components/features-section"
import { BrokersSection } from "@/components/brokers-section"
import { BlogSection } from "@/components/blog-section"
import { FaqSection } from "@/components/faq-section"
import { Footer } from "@/components/footer"
import type { Metadata } from "next"

export const metadata: Metadata = {
  title: "WealthClaude — Global Stock Markets on a 3D Globe",
  description:
    "Track 51 global stock markets in real time on an interactive 3D globe. AI-powered market news, flat map view, portfolio analytics. Free to use.",
}

export default function Home() {
  return (
    <main className="min-h-screen bg-[#060a10]">
      <Header />
      <HeroSection />
      <LivePreviewSection />
      <FeaturesSection />
      <BrokersSection />
      <BlogSection />
      <FaqSection />
      <Footer />
    </main>
  )
}
