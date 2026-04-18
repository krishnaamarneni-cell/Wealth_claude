'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Switch } from '@/components/ui/switch'
import {
  Check,
  Zap,
  Crown,
  Loader2,
  ArrowLeft,
  Sparkles,
  Shield,
  Clock,
  CreditCard
} from 'lucide-react'
import { PRICING } from '@/lib/tier-config'
import { useTier } from '@/lib/tier-context'
import { cn } from '@/lib/utils'

export default function UpgradePage() {
  const { tier: currentTier, plansEnabled, isLoading: tierLoading } = useTier()
  const router = useRouter()
  const [isAnnual, setIsAnnual] = useState(false)
  const [loadingTier, setLoadingTier] = useState<string | null>(null)

  // When plans are disabled globally, this page shouldn't be accessible
  useEffect(() => {
    if (!tierLoading && !plansEnabled) {
      router.replace('/dashboard')
    }
  }, [plansEnabled, tierLoading, router])

  // Show nothing while redirect is happening
  if (!tierLoading && !plansEnabled) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    )
  }

  const handleUpgrade = async (tier: 'pro' | 'premium') => {
    setLoadingTier(tier)
    
    try {
      const response = await fetch('/api/create-subscription', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          tier,
          interval: isAnnual ? 'annual' : 'monthly',
        }),
      })

      const data = await response.json()

      if (data.error) {
        throw new Error(data.error)
      }

      if (data.url) {
        window.location.href = data.url
      }
    } catch (error) {
      console.error('Error creating subscription:', error)
      alert('Failed to start checkout. Please try again.')
    } finally {
      setLoadingTier(null)
    }
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <Link href="/dashboard" className="flex items-center gap-2 text-muted-foreground hover:text-foreground">
            <ArrowLeft className="w-4 h-4" />
            Back to Dashboard
          </Link>
        </div>
      </header>

      <main className="container mx-auto px-4 py-12">
        {/* Hero */}
        <div className="text-center mb-12">
          <div className="inline-flex items-center gap-2 bg-primary/10 text-primary px-4 py-2 rounded-full mb-4">
            <Sparkles className="w-4 h-4" />
            <span className="text-sm font-medium">Upgrade Your Experience</span>
          </div>
          <h1 className="text-4xl font-bold mb-4">Choose Your Plan</h1>
          <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
            Unlock powerful features to track, analyze, and grow your portfolio
          </p>
        </div>

        {/* Billing toggle */}
        <div className="flex items-center justify-center gap-4 mb-10">
          <span className={cn("text-sm font-medium", !isAnnual && "text-foreground", isAnnual && "text-muted-foreground")}>
            Monthly
          </span>
          <Switch
            checked={isAnnual}
            onCheckedChange={setIsAnnual}
            className="data-[state=checked]:bg-primary"
          />
          <span className={cn("text-sm font-medium", isAnnual && "text-foreground", !isAnnual && "text-muted-foreground")}>
            Annual
            <span className="ml-2 text-xs bg-green-500/10 text-green-600 px-2 py-1 rounded-full">
              2 months free
            </span>
          </span>
        </div>

        {/* Pricing cards */}
        <div className="grid md:grid-cols-3 gap-6 max-w-5xl mx-auto">
          {/* Free Plan */}
          <div className="rounded-2xl border-2 border-border p-6 bg-card">
            <div className="mb-4">
              <h3 className="text-xl font-bold">Free</h3>
              <p className="text-sm text-muted-foreground mt-1">Basic portfolio tracking</p>
            </div>
            
            <div className="mb-6">
              <span className="text-4xl font-bold">$0</span>
              <span className="text-muted-foreground">/month</span>
            </div>

            <Button 
              variant="outline" 
              className="w-full mb-6"
              disabled={currentTier === 'free'}
            >
              {currentTier === 'free' ? 'Current Plan' : 'Downgrade'}
            </Button>

            <ul className="space-y-3">
              {PRICING.free.features.map((feature, i) => (
                <li key={i} className="flex items-start gap-2 text-sm">
                  <Check className="w-4 h-4 text-green-500 mt-0.5 shrink-0" />
                  <span>{feature}</span>
                </li>
              ))}
            </ul>
          </div>

          {/* Pro Plan */}
          <div className="relative rounded-2xl border-2 border-primary p-6 bg-card shadow-lg shadow-primary/10">
            <div className="absolute -top-3 left-1/2 -translate-x-1/2">
              <span className="bg-primary text-primary-foreground text-xs font-bold uppercase tracking-wider px-3 py-1 rounded-full">
                Most Popular
              </span>
            </div>

            <div className="mb-4 flex items-center gap-2">
              <div className="p-2 rounded-lg bg-primary/10">
                <Zap className="w-5 h-5 text-primary" />
              </div>
              <div>
                <h3 className="text-xl font-bold">Pro</h3>
                <p className="text-sm text-muted-foreground">Advanced analytics</p>
              </div>
            </div>
            
            <div className="mb-2">
              <span className="text-4xl font-bold">
                ${isAnnual ? PRICING.pro.annualPrice : PRICING.pro.monthlyPrice}
              </span>
              <span className="text-muted-foreground">/{isAnnual ? 'year' : 'month'}</span>
            </div>
            {isAnnual && (
              <p className="text-xs text-muted-foreground mb-4">
                ${(PRICING.pro.annualPrice / 12).toFixed(2)}/month billed annually
              </p>
            )}
            {!isAnnual && (
              <p className="text-xs text-green-600 mb-4">
                Includes 7-day free trial
              </p>
            )}

            <Button 
              className="w-full mb-6"
              onClick={() => handleUpgrade('pro')}
              disabled={loadingTier === 'pro' || currentTier === 'pro' || currentTier === 'premium'}
            >
              {loadingTier === 'pro' ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : currentTier === 'pro' ? (
                'Current Plan'
              ) : currentTier === 'premium' ? (
                'Included in Premium'
              ) : !isAnnual ? (
                'Start Free Trial'
              ) : (
                'Upgrade to Pro'
              )}
            </Button>

            <ul className="space-y-3">
              {PRICING.pro.features.map((feature, i) => (
                <li key={i} className="flex items-start gap-2 text-sm">
                  <Check className="w-4 h-4 text-green-500 mt-0.5 shrink-0" />
                  <span>{feature}</span>
                </li>
              ))}
            </ul>
          </div>

          {/* Premium Plan */}
          <div className="rounded-2xl border-2 border-border p-6 bg-card hover:border-yellow-500/50 transition-colors">
            <div className="mb-4 flex items-center gap-2">
              <div className="p-2 rounded-lg bg-yellow-500/10">
                <Crown className="w-5 h-5 text-yellow-500" />
              </div>
              <div>
                <h3 className="text-xl font-bold">Premium</h3>
                <p className="text-sm text-muted-foreground">AI-powered insights</p>
              </div>
            </div>
            
            <div className="mb-2">
              <span className="text-4xl font-bold">
                ${isAnnual ? PRICING.premium.annualPrice : PRICING.premium.monthlyPrice}
              </span>
              <span className="text-muted-foreground">/{isAnnual ? 'year' : 'month'}</span>
            </div>
            {isAnnual && (
              <p className="text-xs text-muted-foreground mb-6">
                ${(PRICING.premium.annualPrice / 12).toFixed(2)}/month billed annually
              </p>
            )}
            {!isAnnual && <div className="mb-6" />}

            <Button 
              variant="outline"
              className="w-full mb-6 border-yellow-500/50 hover:bg-yellow-500/10"
              onClick={() => handleUpgrade('premium')}
              disabled={loadingTier === 'premium' || currentTier === 'premium'}
            >
              {loadingTier === 'premium' ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : currentTier === 'premium' ? (
                'Current Plan'
              ) : (
                'Upgrade to Premium'
              )}
            </Button>

            <ul className="space-y-3">
              {PRICING.premium.features.map((feature, i) => (
                <li key={i} className="flex items-start gap-2 text-sm">
                  <Check className="w-4 h-4 text-green-500 mt-0.5 shrink-0" />
                  <span className={feature.includes('AI') ? 'font-medium' : ''}>{feature}</span>
                </li>
              ))}
            </ul>
          </div>
        </div>

        {/* Trust badges */}
        <div className="flex flex-wrap items-center justify-center gap-8 mt-12 text-sm text-muted-foreground">
          <div className="flex items-center gap-2">
            <Shield className="w-4 h-4" />
            <span>30-day money-back guarantee</span>
          </div>
          <div className="flex items-center gap-2">
            <Clock className="w-4 h-4" />
            <span>Cancel anytime</span>
          </div>
          <div className="flex items-center gap-2">
            <CreditCard className="w-4 h-4" />
            <span>Secure payment via Stripe</span>
          </div>
        </div>

        {/* FAQ teaser */}
        <div className="text-center mt-12">
          <p className="text-muted-foreground">
            Have questions?{' '}
            <Link href="/faq" className="text-primary hover:underline">
              Check our FAQ
            </Link>
            {' '}or{' '}
            <Link href="/contact" className="text-primary hover:underline">
              contact support
            </Link>
          </p>
        </div>
      </main>
    </div>
  )
}
