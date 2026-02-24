import Link from "next/link"
import { Button } from "@/components/ui/button"
import { CheckCircle2, XCircle, Zap } from "lucide-react"
import { Badge } from "@/components/ui/badge"

const FREE_FEATURES = [
  "Portfolio tracking (up to 10 holdings)",
  "Market heatmaps (S&P 500, NASDAQ, Crypto)",
  "Basic dividend tracker",
  "1 watchlist — up to 5 stocks",
  "Blog & educational content",
]

const PRO_FEATURES = [
  "Unlimited holdings & watchlists",
  "Latest market news feed",
  "AI portfolio insights",
  "Advanced performance analytics",
  "Dividend calendar & alerts",
  "Price alerts",
  "Export to CSV & PDF",
  "Performance benchmarking",
  "Priority support",
]

export function PricingSection() {
  return (
    <section id="pricing" className="py-20 px-4">
      <div className="container mx-auto">

        {/* Header */}
        <div className="text-center mb-16">
          <h2 className="text-3xl md:text-4xl font-bold text-foreground mb-4">
            Simple, Transparent Pricing
          </h2>
          <p className="text-muted-foreground max-w-xl mx-auto text-lg">
            Start free. Upgrade when you need more.
          </p>
        </div>

        <div className="grid md:grid-cols-2 gap-8 max-w-4xl mx-auto">

          {/* Free Plan */}
          <div className="rounded-2xl border border-border bg-card p-8 flex flex-col">
            <div className="mb-6">
              <h3 className="text-xl font-bold text-foreground mb-1">Free</h3>
              <p className="text-muted-foreground text-sm mb-4">
                Everything you need to get started
              </p>
              <div className="flex items-end gap-1">
                <span className="text-4xl font-bold text-foreground">$0</span>
                <span className="text-muted-foreground mb-1">/month</span>
              </div>
            </div>

            <ul className="space-y-3 flex-1 mb-8">
              {FREE_FEATURES.map((f) => (
                <li key={f} className="flex items-start gap-2 text-sm">
                  <CheckCircle2 className="h-4 w-4 text-primary mt-0.5 shrink-0" />
                  <span className="text-muted-foreground">{f}</span>
                </li>
              ))}
              <li className="flex items-start gap-2 text-sm">
                <XCircle className="h-4 w-4 text-muted-foreground/40 mt-0.5 shrink-0" />
                <span className="text-muted-foreground/40">Market news feed</span>
              </li>
              <li className="flex items-start gap-2 text-sm">
                <XCircle className="h-4 w-4 text-muted-foreground/40 mt-0.5 shrink-0" />
                <span className="text-muted-foreground/40">AI insights & advanced analytics</span>
              </li>
            </ul>

            <Button asChild variant="outline" size="lg" className="w-full">
              <Link href="/auth/login">Get Started Free</Link>
            </Button>
          </div>

          {/* Pro Plan */}
          <div className="rounded-2xl border-2 border-primary bg-card p-8 flex flex-col relative overflow-hidden">
            {/* Most popular badge */}
            <div className="absolute top-4 right-4">
              <Badge className="bg-primary text-primary-foreground gap-1">
                <Zap className="h-3 w-3" />
                Most Popular
              </Badge>
            </div>

            {/* Glow effect */}
            <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,rgba(74,222,128,0.08),transparent_60%)]" />

            <div className="relative mb-6">
              <h3 className="text-xl font-bold text-foreground mb-1">Pro</h3>
              <p className="text-muted-foreground text-sm mb-4">
                For serious investors who want the full picture
              </p>
              <div className="flex items-end gap-1">
                <span className="text-4xl font-bold text-foreground">$9</span>
                <span className="text-muted-foreground mb-1">/month</span>
              </div>
              <p className="text-xs text-primary mt-1">
                🎉 Early bird: first 100 users get $4.99/mo — locked in forever
              </p>
            </div>

            <ul className="relative space-y-3 flex-1 mb-8">
              {PRO_FEATURES.map((f) => (
                <li key={f} className="flex items-start gap-2 text-sm">
                  <CheckCircle2 className="h-4 w-4 text-primary mt-0.5 shrink-0" />
                  <span className="text-foreground">{f}</span>
                </li>
              ))}
            </ul>

            <Button asChild size="lg" className="relative w-full bg-primary text-primary-foreground hover:bg-primary/90">
              <Link href="/auth/login">
                Start 7-Day Free Trial
                <Zap className="ml-2 h-4 w-4" />
              </Link>
            </Button>
            <p className="text-xs text-center text-muted-foreground mt-3">
              No credit card required. Cancel anytime.
            </p>
          </div>
        </div>
      </div>
    </section>
  )
}
