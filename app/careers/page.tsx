import { Metadata } from 'next'
import Link from 'next/link'
import { LineChart, ArrowLeft } from 'lucide-react'
import { Footer } from '@/components/footer'

export const metadata: Metadata = {
  title: 'Careers | WealthClaude',
  description: 'Join the WealthClaude team and help build the future of personal finance.',
}

export default function CareersPage() {
  return (
    <>
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

      <main className="max-w-3xl mx-auto px-6 py-20">
        <h1 className="text-4xl font-bold text-foreground mb-4">Careers</h1>
        <p className="text-muted-foreground text-lg mb-6">
          We are a small but growing team passionate about fintech and great user experiences.
        </p>
        <p className="text-muted-foreground text-lg">
          No open positions right now — but check back soon or reach out at{' '}
          <a href="mailto:careers@wealthclaude.com" className="text-primary hover:underline">
            careers@wealthclaude.com
          </a>
        </p>
      </main>

      <Footer />
    </>
  )
}
