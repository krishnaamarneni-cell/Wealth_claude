import type { Metadata } from 'next'
import Link from 'next/link'

export const metadata: Metadata = {
  metadataBase: new URL('https://www.wealthclaude.com'),
  title: 'Free Dividend Tracker — Track Dividend Income with AI — WealthClaude',
  description:
    'Track your dividend income for free with WealthClaude. Monitor payouts, forecast future income, model DRIP reinvestment, and analyze dividend growth across US, UK, European, Canadian and Asian stocks.',
  keywords:
    'free dividend tracker, dividend portfolio tracker, dividend income tracker, DRIP calculator, dividend reinvestment tracker, stock dividend tracker, passive income tracker',
  alternates: {
    canonical: 'https://www.wealthclaude.com/dividend-tracker',
  },
  openGraph: {
    title: 'Free Dividend Tracker — Track Dividend Income with AI — WealthClaude',
    description:
      'Track your dividend income for free. Monitor payouts, forecast future income, model DRIP reinvestment, and analyze dividend growth across global markets.',
    url: 'https://www.wealthclaude.com/dividend-tracker',
    siteName: 'WealthClaude',
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Free Dividend Tracker — Track Dividend Income with AI — WealthClaude',
    description:
      'Track your dividend income for free. Monitor payouts, forecast future income, and model DRIP reinvestment across global markets.',
  },
  robots: 'index, follow',
}

const features = [
  {
    tag: 'Dividend History',
    title: 'Complete Dividend Payment History',
    description:
      'See every dividend payment logged automatically against your holdings. Track payout dates, amounts per share, and total income received — organized by stock, sector, and time period.',
  },
  {
    tag: 'Income Forecast',
    title: 'Future Dividend Income Forecast',
    description:
      'WealthClaude projects your forward dividend income based on current holdings and payout schedules. See exactly how much passive income you are on track to receive in the next 12 months.',
  },
  {
    tag: 'DRIP Modeling',
    title: 'Dividend Reinvestment (DRIP) Calculator',
    description:
      'Model the full compounding effect of reinvesting your dividends automatically. See how DRIP accelerates portfolio growth on a per-stock and whole-portfolio level over 5, 10, and 20 years.',
  },
  {
    tag: 'Yield Analysis',
    title: 'Dividend Yield and Growth Analysis',
    description:
      'Track yield on cost, current yield, and dividend growth rate for every holding. Identify which stocks are growing their dividends consistently and which ones are at risk of a cut.',
  },
  {
    tag: 'Global Markets',
    title: 'Global Dividend Tracking',
    description:
      'Track dividends from US, UK, European, Canadian, Australian, Singapore, South Korean, and Brazilian stocks in one unified dashboard. All currencies converted automatically.',
  },
  {
    tag: 'AI Insights',
    title: 'AI Dividend Portfolio Analysis',
    description:
      'The WealthClaude AI analyzes your dividend portfolio and surfaces insights on income concentration risk, payout sustainability, sector diversification, and growth trajectory.',
  },
  {
    tag: 'Calendar',
    title: 'Dividend Payment Calendar',
    description:
      'See all upcoming ex-dividend dates and payment dates for your holdings in a clean calendar view. Never miss a dividend or an ex-date again.',
  },
  {
    tag: 'CSV Import',
    title: 'Import from Any Broker',
    description:
      'Upload a CSV from Fidelity, Schwab, IBKR, Robinhood, or any major broker. No bank account linking required. Your dividend dashboard is ready in minutes.',
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
    title: 'Upload Your CSV',
    desc: 'Export your transaction history from your broker and upload it to WealthClaude. Fidelity, Schwab, IBKR, Robinhood, and all major brokers supported.',
  },
  {
    step: '03',
    title: 'Track Every Dividend',
    desc: 'Your dividend dashboard populates instantly — payment history, income forecast, DRIP modeling, yield analysis, and AI insights all ready in one place.',
  },
]

const markets = [
  'United States',
  'United Kingdom',
  'Europe',
  'Canada',
  'Australia',
  'Singapore',
  'South Korea',
  'Brazil',
  'Japan',
  'Hong Kong',
]

export default function DividendTrackerPage() {
  return (
    <main className="min-h-screen bg-background">

      {/* Hero */}
      <section className="relative pt-32 pb-20 px-4 overflow-hidden">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,rgba(74,222,128,0.1),transparent_50%)]" />
        <div className="container mx-auto relative z-10">
          <div className="max-w-4xl mx-auto text-center">
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-secondary/50 border border-border mb-8">
              <span className="w-2 h-2 rounded-full bg-primary animate-pulse" />
              <span className="text-sm text-muted-foreground">Free Dividend Tracker — Global Markets — No Bank Linking</span>
            </div>
            <h1 className="text-4xl md:text-6xl lg:text-7xl font-bold text-foreground mb-6 text-balance leading-tight">
              Track Your Dividend Income{' '}
              <span className="text-primary">Free with AI</span>
            </h1>
            <p className="text-lg md:text-xl text-muted-foreground mb-8 max-w-2xl mx-auto">
              WealthClaude is a free dividend tracker that monitors your payout history,
              forecasts future income, models DRIP reinvestment, and analyzes dividend
              growth across global markets — all without linking your bank account.
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
                See All Features
              </Link>
            </div>
            <div className="flex flex-wrap items-center justify-center gap-6 text-sm text-muted-foreground">
              {[
                'Free forever',
                'Global dividend tracking',
                'DRIP modeling included',
                'No bank linking',
                'AI insights',
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

      {/* Global Markets */}
      <section className="py-12 px-4 bg-secondary/20">
        <div className="container mx-auto">
          <div className="text-center mb-8">
            <p className="text-muted-foreground font-medium">Dividend tracking across global markets</p>
          </div>
          <div className="flex flex-wrap items-center justify-center gap-4 max-w-3xl mx-auto">
            {markets.map((market) => (
              <span
                key={market}
                className="px-4 py-2 rounded-full bg-card border border-border text-sm text-foreground font-medium"
              >
                {market}
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
              Everything a Dividend Investor Needs — Free
            </h2>
            <p className="text-muted-foreground max-w-2xl mx-auto text-lg">
              From payout history to DRIP modeling to AI-powered yield analysis —
              WealthClaude gives dividend investors a complete free toolkit.
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
              Set Up Your Dividend Dashboard in Minutes
            </h2>
            <p className="text-muted-foreground max-w-xl mx-auto">
              No bank linking, no complex setup. Upload a CSV from your broker and your
              full dividend dashboard is ready instantly.
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
              { value: '10+', label: 'Global Markets' },
              { value: 'Free', label: 'Forever Plan' },
              { value: 'DRIP', label: 'Modeling Included' },
              { value: 'AI', label: 'Yield Analysis' },
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
              Start Tracking Your Dividends Free Today
            </h2>
            <p className="text-muted-foreground mb-8 text-lg">
              Join dividend investors already using WealthClaude to track income,
              model DRIP returns, and grow passive income — completely free.
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
