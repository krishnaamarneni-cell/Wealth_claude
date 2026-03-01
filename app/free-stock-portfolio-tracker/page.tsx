import type { Metadata } from 'next'
import Link from 'next/link'

export const metadata: Metadata = {
  metadataBase: new URL('https://www.wealthclaude.com'),
  title: 'Free Stock Portfolio Tracker with AI Insights — WealthClaude',
  description:
    'Track your stock portfolio for free with AI-powered insights, live market news, real-time heatmaps, dividend tracking, and rebalancing tools. No bank account linking. Upload a CSV and start in minutes.',
  keywords:
    'free stock portfolio tracker, free portfolio tracker, stock portfolio tracker, free investment tracker, portfolio tracker no bank linking, AI stock tracker, free portfolio tracker CSV upload',
  alternates: {
    canonical: 'https://www.wealthclaude.com/free-stock-portfolio-tracker',
  },
  openGraph: {
    title: 'Free Stock Portfolio Tracker with AI Insights — WealthClaude',
    description:
      'Track your stock portfolio for free with AI insights, live market news, real-time heatmaps, and dividend tracking. No bank account linking required.',
    url: 'https://www.wealthclaude.com/free-stock-portfolio-tracker',
    siteName: 'WealthClaude',
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Free Stock Portfolio Tracker with AI Insights — WealthClaude',
    description:
      'Track your stock portfolio for free with AI insights, live market news, real-time heatmaps, and dividend tracking. No bank account linking required.',
  },
  robots: 'index, follow',
}

const features = [
  {
    tag: 'AI Insights',
    title: 'AI-Powered Portfolio Analysis',
    description:
      'WealthClaude AI continuously analyzes your holdings and surfaces insights on concentration risk, sector exposure, and performance trends — giving you a professional-grade analysis for free.',
  },
  {
    tag: 'CSV Import',
    title: 'Import from Any Broker',
    description:
      'Upload a CSV from Fidelity, Schwab, IBKR, Robinhood, TD Ameritrade, or any major broker. No bank account linking, no credential sharing. Your portfolio is ready in minutes.',
  },
  {
    tag: 'Growth Projections',
    title: 'Stock Growth Projections',
    description:
      'Model how your portfolio compounds over 5, 10, and 20 years based on your current holdings and contribution rate. Understand exactly where you are headed financially.',
  },
  {
    tag: 'DRIP Calculator',
    title: 'Dividend Reinvestment Modeling',
    description:
      'See the full compounding effect of reinvesting your dividends automatically. WealthClaude models DRIP returns on a per-stock and whole-portfolio level.',
  },
  {
    tag: 'Rebalancing',
    title: 'Portfolio Rebalancing Tool',
    description:
      'When your allocation drifts from your targets, WealthClaude calculates exactly what trades bring you back into balance. No spreadsheets, no manual calculations.',
  },
  {
    tag: 'Trade Analysis',
    title: 'Analyze Every Trade Decision',
    description:
      'Every buy and sell in your history is analyzed against benchmark performance. See which decisions helped your returns and which ones cost you — and learn from the pattern.',
  },
  {
    tag: 'Market News',
    title: 'Live Market News Feed',
    description:
      'A curated news feed updated 6 times daily covers pre-market briefings, sector analysis, and stock-specific news relevant to your holdings — all inside your dashboard.',
  },
  {
    tag: 'Heatmaps',
    title: 'Real-Time Market Heatmaps',
    description:
      'See the entire S&P 500 and NASDAQ at a glance with live color-coded heatmaps. Spot sector momentum and market trends instantly without switching between tools.',
  },
]

const steps = [
  {
    step: '01',
    title: 'Create a Free Account',
    desc: 'Sign up at WealthClaude in seconds. No credit card required. No bank account linking ever.',
  },
  {
    step: '02',
    title: 'Export CSV from Your Broker',
    desc: 'Download your transaction history as a CSV from Fidelity, Schwab, IBKR, Robinhood, or any major broker.',
  },
  {
    step: '03',
    title: 'Upload and Track',
    desc: 'Upload your CSV to WealthClaude. Your full dashboard with AI insights, projections, news, and heatmaps is ready instantly.',
  },
]

const brokers = [
  'Fidelity',
  'Charles Schwab',
  'Interactive Brokers',
  'Robinhood',
  'TD Ameritrade',
  'E*TRADE',
  'Webull',
  'Merrill Edge',
]

export default function FreeStockPortfolioTrackerPage() {
  return (
    <main className="min-h-screen bg-background">

      {/* Hero */}
      <section className="relative pt-32 pb-20 px-4 overflow-hidden">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,rgba(74,222,128,0.1),transparent_50%)]" />
        <div className="container mx-auto relative z-10">
          <div className="max-w-4xl mx-auto text-center">
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-secondary/50 border border-border mb-8">
              <span className="w-2 h-2 rounded-full bg-primary animate-pulse" />
              <span className="text-sm text-muted-foreground">100% Free — No Credit Card — No Bank Linking</span>
            </div>
            <h1 className="text-4xl md:text-6xl lg:text-7xl font-bold text-foreground mb-6 text-balance leading-tight">
              Free Stock Portfolio Tracker{' '}
              <span className="text-primary">with AI Insights</span>
            </h1>
            <p className="text-lg md:text-xl text-muted-foreground mb-8 max-w-2xl mx-auto">
              The most complete free stock portfolio tracker available. AI analysis, live market news,
              real-time heatmaps, growth projections, DRIP modeling, rebalancing tools, and trade
              analysis — all free, all in one place.
            </p>
            <div className="flex flex-col sm:flex-row items-center justify-center gap-4 mb-12">
              <Link
                href="/auth"
                className="inline-flex items-center justify-center rounded-md bg-primary text-primary-foreground hover:bg-primary/90 px-8 h-12 text-base font-medium transition-all"
              >
                Start Tracking Free
                <svg className="ml-2 h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M5 12h14M12 5l7 7-7 7" />
                </svg>
              </Link>
              <Link
                href="/portfolio-tracker"
                className="inline-flex items-center justify-center rounded-md border border-border text-foreground hover:bg-secondary bg-transparent px-6 h-12 text-base font-medium transition-all"
              >
                Compare Trackers
              </Link>
            </div>
            <div className="flex flex-wrap items-center justify-center gap-6 text-sm text-muted-foreground">
              {[
                'Free forever',
                'No bank account linking',
                'CSV import in minutes',
                'AI insights included',
                'No transaction limits',
              ].map((item) => (
                <div key={item} className="flex items-center gap-2">
                  <svg className="h-4 w-4 text-primary" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <circle cx="12" cy="12" r="10" />
                    <path strokeLinecap="round" strokeLinejoin="round" d="m9 12 2 2 4-4" />
                  </svg>
                  <span>{item}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Broker Support */}
      <section className="py-12 px-4 bg-secondary/20">
        <div className="container mx-auto">
          <div className="text-center mb-8">
            <p className="text-muted-foreground font-medium">CSV import supported from all major brokers</p>
          </div>
          <div className="flex flex-wrap items-center justify-center gap-4 max-w-3xl mx-auto">
            {brokers.map((broker) => (
              <span
                key={broker}
                className="px-4 py-2 rounded-full bg-card border border-border text-sm text-foreground font-medium"
              >
                {broker}
              </span>
            ))}
          </div>
        </div>
      </section>

      {/* Features */}
      <section className="py-20 px-4">
        <div className="container mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold text-foreground mb-4">
              More Than Just Charts — A Complete Free Toolkit
            </h2>
            <p className="text-muted-foreground max-w-2xl mx-auto text-lg">
              Most free trackers show you a pie chart and call it done. WealthClaude gives you
              the full toolkit serious investors need — at zero cost.
            </p>
          </div>
          <div className="grid md:grid-cols-2 gap-8 max-w-5xl mx-auto">
            {features.map((f) => (
              <div
                key={f.title}
                className="group relative bg-card rounded-2xl border border-border p-8 hover:border-primary/50 transition-all duration-300"
              >
                <span className="inline-block text-xs font-medium text-primary mb-4 px-3 py-1 bg-primary/10 rounded-full">
                  {f.tag}
                </span>
                <h3 className="text-xl font-semibold text-foreground mb-3">{f.title}</h3>
                <p className="text-muted-foreground leading-relaxed">{f.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* How It Works */}
      <section className="py-20 px-4 bg-secondary/20">
        <div className="container mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold text-foreground mb-4">
              Set Up in Under 5 Minutes
            </h2>
            <p className="text-muted-foreground max-w-xl mx-auto">
              No bank linking, no lengthy onboarding. Export a CSV from your broker and your
              full dashboard is ready instantly.
            </p>
          </div>
          <div className="grid md:grid-cols-3 gap-8 max-w-4xl mx-auto">
            {steps.map((item) => (
              <div key={item.step} className="text-center bg-card rounded-2xl border border-border p-8">
                <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center mx-auto mb-6">
                  <span className="text-primary font-bold">{item.step}</span>
                </div>
                <h3 className="text-lg font-semibold text-foreground mb-3">{item.title}</h3>
                <p className="text-muted-foreground text-sm leading-relaxed">{item.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Stats */}
      <section className="py-16 px-4">
        <div className="container mx-auto">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6 max-w-3xl mx-auto text-center">
            {[
              { value: '100%', label: 'Free Forever' },
              { value: '6x', label: 'Daily News Updates' },
              { value: '160+', label: 'Countries Supported' },
              { value: '0', label: 'Bank Links Required' },
            ].map((stat) => (
              <div key={stat.label}>
                <p className="text-2xl font-bold text-primary">{stat.value}</p>
                <p className="text-sm text-muted-foreground">{stat.label}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-20 px-4">
        <div className="container mx-auto">
          <div className="max-w-2xl mx-auto text-center bg-card rounded-2xl border border-border p-12">
            <h2 className="text-3xl md:text-4xl font-bold text-foreground mb-4">
              The Best Free Stock Portfolio Tracker Starts Here
            </h2>
            <p className="text-muted-foreground mb-8 text-lg">
              No credit card. No bank account linking. No transaction limits.
              Just upload your CSV and start tracking smarter today.
            </p>
            <Link
              href="/auth"
              className="inline-flex items-center justify-center rounded-md bg-primary text-primary-foreground hover:bg-primary/90 px-8 h-12 text-base font-medium transition-all"
            >
              Start Free Now
              <svg className="ml-2 h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M5 12h14M12 5l7 7-7 7" />
              </svg>
            </Link>
            <p className="text-muted-foreground text-sm mt-4">Free forever · No credit card · No bank linking</p>
          </div>
        </div>
      </section>

    </main>
  )
}
