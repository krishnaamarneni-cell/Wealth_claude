import { Metadata } from 'next'
import Link from 'next/link'
import { LineChart, ArrowLeft } from 'lucide-react'
import { Footer } from '@/components/footer'

export const metadata: Metadata = {
  title: 'Cookie Policy | WealthClaude',
  description: 'Read the WealthClaude cookie policy.',
}

export default function CookiePolicyPage() {
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
        <h1 className="text-4xl font-bold text-foreground mb-4">Cookie Policy</h1>
        <p className="text-muted-foreground text-sm mb-8">Last updated: March 1, 2026</p>
        <section className="mb-8">
          <h2 className="text-xl font-semibold text-foreground mb-2">What Are Cookies</h2>
          <p className="text-muted-foreground">
            Cookies are small text files stored on your device to help us remember your preferences
            and improve your experience on WealthClaude.
          </p>
        </section>
        <section className="mb-8">
          <h2 className="text-xl font-semibold text-foreground mb-2">How We Use Cookies</h2>
          <p className="text-muted-foreground">
            We use essential cookies for authentication and session management, and optional analytics
            cookies to understand how users interact with our platform.
          </p>
        </section>
        <section className="mb-8">
          <h2 className="text-xl font-semibold text-foreground mb-2">Managing Cookies</h2>
          <p className="text-muted-foreground">
            You can disable cookies in your browser settings at any time, though some features of
            WealthClaude may not function correctly without them.
          </p>
        </section>
      </main>

      <Footer />
    </>
  )
}
