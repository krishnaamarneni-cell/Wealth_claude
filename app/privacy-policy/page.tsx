import { Metadata } from 'next'
import Link from 'next/link'
import { LineChart, ArrowLeft } from 'lucide-react'
import { Footer } from '@/components/footer'

export const metadata: Metadata = {
  title: 'Privacy Policy | WealthClaude',
  description: 'Read the WealthClaude privacy policy.',
}

export default function PrivacyPolicyPage() {
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
        <h1 className="text-4xl font-bold text-foreground mb-4">Privacy Policy</h1>
        <p className="text-muted-foreground text-sm mb-8">Last updated: March 1, 2026</p>
        <section className="mb-8">
          <h2 className="text-xl font-semibold text-foreground mb-2">Information We Collect</h2>
          <p className="text-muted-foreground">
            We collect information you provide directly, such as your email address when you sign up,
            and usage data to improve the platform experience.
          </p>
        </section>
        <section className="mb-8">
          <h2 className="text-xl font-semibold text-foreground mb-2">How We Use Your Data</h2>
          <p className="text-muted-foreground">
            Your data is used solely to provide and improve WealthClaude services. We do not sell
            your personal information to third parties.
          </p>
        </section>
        <section className="mb-8">
          <h2 className="text-xl font-semibold text-foreground mb-2">Contact</h2>
          <p className="text-muted-foreground">
            For privacy concerns, contact us at{' '}
            <a href="mailto:privacy@wealthclaude.com" className="text-primary hover:underline">
              privacy@wealthclaude.com
            </a>
          </p>
        </section>
      </main>

      <Footer />
    </>
  )
}
