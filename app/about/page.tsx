import { Metadata } from 'next'
import Link from 'next/link'
import { LineChart, ArrowLeft } from 'lucide-react'
import { Footer } from '@/components/footer'

export const metadata: Metadata = {
  title: 'About Us | WealthClaude',
  description: 'Learn about WealthClaude — the free stock portfolio tracker built for modern investors.',
}

export default function AboutPage() {
  return (
    <>
      {/* Navbar */}
      <nav className="border-b border-border px-6 py-4 flex items-center justify-between bg-background">
        <Link href="/" className="flex items-center gap-2">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary">
            <LineChart className="h-5 w-5 text-primary-foreground" />
          </div>
          <span className="font-semibold text-foreground">WealthClaude</span>
        </Link>
        <Link href="/" className="flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground transition-colors">
          <ArrowLeft className="h-4 w-4" />
          Back to Home
        </Link>
      </nav>

      {/* Content */}
      <main className="max-w-3xl mx-auto px-6 py-20">
        <h1 className="text-4xl font-bold text-foreground mb-4">About WealthClaude</h1>
        <p className="text-muted-foreground text-lg mb-6">
          WealthClaude is a free portfolio tracking platform built for individual investors who want
          real-time insights into their stocks, dividends, and overall portfolio performance.
        </p>
        <p className="text-muted-foreground text-lg">
          Our mission is to make professional-grade financial analytics accessible to everyone —
          no subscriptions, no paywalls, just powerful tools.
        </p>
      </main>

      <Footer />
    </>
  )
}
