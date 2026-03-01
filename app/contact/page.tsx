import { Metadata } from 'next'
import Link from 'next/link'
import { LineChart, ArrowLeft } from 'lucide-react'
import { Footer } from '@/components/footer'

export const metadata: Metadata = {
  title: 'Contact | WealthClaude',
  description: 'Get in touch with the WealthClaude team.',
}

export default function ContactPage() {
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
        <h1 className="text-4xl font-bold text-foreground mb-4">Contact Us</h1>
        <p className="text-muted-foreground text-lg mb-6">
          Have a question, feedback, or a bug to report? We would love to hear from you.
        </p>
        <a href="mailto:support@wealthclaude.com" className="text-primary text-lg hover:underline">
          support@wealthclaude.com
        </a>
      </main>

      <Footer />
    </>
  )
}
