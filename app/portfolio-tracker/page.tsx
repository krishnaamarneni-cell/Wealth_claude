import type { Metadata } from 'next'
import Link from 'next/link'

export const metadata: Metadata = {
  metadataBase: new URL('https://www.wealthclaude.com'),
  title: 'Free AI Portfolio Tracker with Market News — WealthClaude',
  description:
    'Track your stock portfolio free with AI insights, live market news, S&P 500 heatmaps and dividend analytics. No bank account linking required. Upload CSV and start in minutes.',
  keywords:
    'AI portfolio tracker with market news, portfolio tracker with CSV upload, free portfolio tracker with AI insights, portfolio tracker no account linking required, free stock portfolio tracker, AI investment tracker',
  alternates: {
    canonical: 'https://www.wealthclaude.com/portfolio-tracker',
  },
  openGraph: {
    title: 'Free AI Portfolio Tracker with Market News — WealthClaude',
    description:
      'Track your stock portfolio free with AI insights, live market news, S&P 500 heatmaps and dividend analytics. No bank account linking required.',
    url: 'https://www.wealthclaude.com/portfolio-tracker',
    siteName: 'WealthClaude',
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Free AI Portfolio Tracker with Market News — WealthClaude',
    description:
      'Track your stock portfolio free with AI insights, live market news, S&P 500 heatmaps and dividend analytics. No bank account linking required.',
  },
  robots: 'index, follow',
}

const features = [
  {
    tag: 'AI Insights',
    title: 'AI-Powered Portfolio Analysis',
    description:
      'Get intelligent insights on your portfolio performance, risk exposure, and opportunities. WealthClaude\'s AI analyzes your holdings and delivers actionable recommendations — something no other free tracker offers.',
  },
  {
    tag: 'Market News',
    title: 'Live Market News Feed',
    description:
      'Stay ahead with a curated market news feed updated 6 times daily. Pre-market previews, geopolitical analysis, and stock-specific news — all in the same place as your portfolio.',
  },
  {
    tag: 'CSV Upload',
    title: 'Import via CSV — No Bank Linking',
    description:
      'No need to connect your brokerage account. Simply export a CSV from your broker and upload it to WealthClaude. Your portfolio is set up in minutes, and your credentials stay private.',
  },
  {
    tag: 'Live Heatmaps',
    title: 'S&P 500 & NASDAQ Live Heatmaps',
    description:
      'See the entire market at a glance with real-time heatmaps. Green is up, red is down, size is market cap. Spot sector trends and market momentum instantly without switching tabs.',
  },
  {
    tag: 'Dividend Tracker',
    title: 'Global Dividend Tracking',
    description:
      'Track dividend income from US, UK, European, Canadian, Australian, and Asian stocks in one place. See historical payouts, forecast future income, and monitor your passive income growth.',
  },
  {
    tag: 'Performance',
    title: 'Portfolio Performance Analytics',
    description:
      'Measure performance at customizable time intervals. Compare against benchmarks, track your cost basis, and analyze each holding's contribution to overall returns.',
  },
  {
    tag: 'Trade Analysis',
    title: 'Analyze Every Decision',
    description:
      'Review every trade you've made and see its impact on your portfolio.Compare decisions against benchmarks to learn from your history and sharpen your strategy.',
  },
  {
    tag: 'Goals',
    title: 'Investment Goal Setting',
    description:
      'Set portfolio goals and track your progress over time. Whether you're building toward retirement, a down payment, or financial independence — WealthClaude keeps you on track.',
  },
]

const comparison = [
  {
    feature: 'AI Portfolio Insights',
    wealthclaude: true,
    blossom: false,
    portseido: false,
  },
  {
    feature: 'Live Market News Feed',
    wealthclaude: true,
    blossom: false,
    portseido: false,
  },
  {
    feature: 'Live Market Heatmaps',
    wealthclaude: true,
    blossom: false,
    portseido: false,
  },
  {
    feature: 'No Bank Account Linking Required',
    wealthclaude: true,
    blossom: false,
    portseido: true,
  },
  {
    feature: 'CSV Import',
    wealthclaude: true,
    blossom: false,
    portseido: true,
  },
  {
    feature: 'Dividend Tracking',
    wealthclaude: true,
    blossom: true,
    portseido: true,
  },
  {
    feature: 'Performance vs Benchmarks',
    wealthclaude: true,
    blossom: false,
    portseido: true,
  },
  {
    feature: 'Goal Setting',
    wealthclaude: true,
    blossom: false,
    portseido: false,
  },
  {
    feature: 'Trade Analysis',
    wealthclaude: true,
    blossom: false,
    portseido: false,
  },
  {
    feature: 'Free Forever',
    wealthclaude: true,
    blossom: false,
    portseido: false,
  },
  {
    feature: 'Web App',
    wealthclaude: true,
    blossom: false,
    portseido: true,
  },
]

function Check() {
  return (
    <svg className="w-5 h-5 text-primary mx-auto" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
    </svg>
  )
}

function Cross() {
  return (
    <svg className="w-5 h-5 text-muted-foreground/40 mx-auto" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
    </svg>
  )
}

export default function PortfolioTrackerPage() {
  return (
    <main className="min-h-screen bg-background">

      {/* ── Hero ─────────────────────────────────────────────────── */}
      <section className="relative pt-32 pb-20 px-4 overflow-hidden">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,rgba(74,222,128,0.1),transparent_50%)]" />
        <div className="container mx-auto relative z-10">
          <div className="max-w-4xl mx-auto text-center">
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-secondary/50 border border-border mb-8">
              <span className="w-2 h-2 rounded-full bg-primary animate-pulse" />
              <span className="text-sm text-muted-foreground">Free AI Portfolio Tracker — No Credit Card Required</span>
            </div>

            <h1 className="text-4xl md:text-6xl lg:text-7xl font-bold text-foreground mb-6 text-balance leading-tight">
              The Free Portfolio Tracker{' '}
              <span className="text-primary">With AI & Market News</span>
            </h1>

            <p className="text-lg md:text-xl text-muted-foreground mb-8 max-w-2xl mx-auto text-pretty">
              WealthClaude is the only free portfolio tracker that combines AI-powered insights,
              a live market news feed, and real-time heatmaps — all without requiring you to
              link your bank account. Upload a CSV and you're set up in minutes.
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
                href="/#features"
                className="inline-flex items-center justify-center rounded-md border border-border text-foreground hover:bg-secondary bg-transparent px-6 h-12 text-base font-medium transition-all"
              >
                See All Features
              </Link>
            </div>

            <div className="flex flex-wrap items-center justify-center gap-6 text-sm text-muted-foreground">
              {['Free forever plan', 'No bank account linking', 'CSV import in minutes', 'AI insights included'].map((item) => (
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

      {/* ── Features ─────────────────────────────────────────────── */}
      <section className="py-20 px-4">
        <div className="container mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold text-foreground mb-4">
              Everything in One Free Portfolio Tracker
            </h2>
            <p className="text-muted-foreground max-w-2xl mx-auto text-lg">
              Most portfolio trackers show you charts. WealthClaude gives you AI analysis,
              live news, and market heatmaps — all free, all in one place.
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

      {/* ── Comparison Table ─────────────────────────────────────── */}
      <section className="py-20 px-4 bg-secondary/20">
        <div className="container mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold text-foreground mb-4">
              WealthClaude vs Blossom vs Portseido
            </h2>
            <p className="text-muted-foreground max-w-2xl mx-auto text-lg">
              See how WealthClaude compares to other popular portfolio trackers.
              No other free tool gives you AI insights, market news, and heatmaps together.
            </p>
          </div>

          <div className="max-w-3xl mx-auto overflow-x-auto">
            <table className="w-full border border-border rounded-2xl overflow-hidden">
              <thead>
                <tr className="bg-card border-b border-border">
                  <th className="text-left px-6 py-4 text-foreground font-semibold w-1/2">Feature</th>
                  <th className="text-center px-6 py-4 text-primary font-semibold">WealthClaude</th>
                  <th className="text-center px-6 py-4 text-muted-foreground font-semibold">Blossom</th>
                  <th className="text-center px-6 py-4 text-muted-foreground font-semibold">Portseido</th>
                </tr>
              </thead>
              <tbody>
                {comparison.map((row, i) => (
                  <tr
                    key={row.feature}
                    className={`border-b border-border last:border-0 ${i % 2 === 0 ? 'bg-background' : 'bg-card'}`}
                  >
                    <td className="px-6 py-4 text-sm text-foreground">{row.feature}</td>
                    <td className="px-6 py-4">{row.wealthclaude ? <Check /> : <Cross />}</td>
                    <td className="px-6 py-4">{row.blossom ? <Check /> : <Cross />}</td>
                    <td className="px-6 py-4">{row.portseido ? <Check /> : <Cross />}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </section>

      {/* ── How It Works ─────────────────────────────────────────── */}
      <section className="py-20 px-4">
        <div className="container mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold text-foreground mb-4">
              Set Up in 3 Steps
            </h2>
            <p className="text-muted-foreground max-w-xl mx-auto">
              No bank linking, no lengthy setup. Go from zero to full portfolio tracking in under 5 minutes.
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-8 max-w-4xl mx-auto">
            {[
              { step: '01', title: 'Create a Free Account', desc: 'Sign up in seconds. No credit card required. Your free plan never expires.' },
              { step: '02', title: 'Upload Your CSV', desc: 'Export a CSV from your broker — Fidelity, Schwab, IBKR, Robinhood, and more. Upload it directly to WealthClaude.' },
              { step: '03', title: 'Get AI Insights', desc: 'Instantly see your portfolio performance, dividend income, heatmaps, and AI-powered analysis all in one dashboard.' },
            ].map((item) => (
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

      {/* ── CTA ──────────────────────────────────────────────────── */}
      <section className="py-20 px-4">
        <div className="container mx-auto">
          <div className="max-w-2xl mx-auto text-center bg-card rounded-2xl border border-border p-12">
            <h2 className="text-3xl md:text-4xl font-bold text-foreground mb-4">
              Start Tracking Your Portfolio Free
            </h2>
            <p className="text-muted-foreground mb-8 text-lg">
              Join investors already using WealthClaude to track stocks, analyze performance,
              and get AI insights — without linking a bank account.
            </p>
            <Link
              href="/auth"
              className="inline-flex items-center justify-center rounded-md bg-primary text-primary-foreground hover:bg-primary/90 px-8 h-12 text-base font-medium transition-all"
            >
              Get Started Free
              <svg className="ml-2 h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M5 12h14M12 5l7 7-7 7" />
              </svg>
            </Link>
            <p className="text-muted-foreground text-sm mt-4">No credit card · No bank linking · Free forever</p>
          </div>
        </div>
      </section>

    </main>
  )
}
