import { Metadata } from 'next'
import Link from 'next/link'
import { LineChart, ArrowLeft } from 'lucide-react'
import { Footer } from '@/components/footer'

export const metadata: Metadata = {
  title: 'Terms of Service | WealthClaude',
  description: 'Read the WealthClaude terms of service.',
}

export default function TermsOfServicePage() {
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
        <h1 className="text-4xl font-bold text-foreground mb-4">Terms of Service</h1>
        <p className="text-muted-foreground text-sm mb-8">Last updated: March 1, 2026</p>
        <section className="mb-8">
          <h2 className="text-xl font-semibold text-foreground mb-2">Use of Service</h2>
          <p className="text-muted-foreground">
            WealthClaude provides financial tracking tools for informational purposes only. Nothing
            on this platform constitutes financial advice.
          </p>
        </section>
        <section className="mb-8">
          <h2 className="text-xl font-semibold text-foreground mb-2">Account Responsibility</h2>
          <p className="text-muted-foreground">
            You are responsible for maintaining the security of your account credentials and all
            activity that occurs under your account.
          </p>
        </section>
        <section className="mb-8">
          <h2 className="text-xl font-semibold text-foreground mb-2">Contact</h2>
          <p className="text-muted-foreground">
            Questions about our terms? Email{' '}
            <a href="mailto:legal@wealthclaude.com" className="text-primary hover:underline">
              legal@wealthclaude.com
            </a>
          </p>
        </section>
      </main>

      <Footer />
    </>
  )
}
