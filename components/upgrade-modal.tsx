'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Switch } from '@/components/ui/switch'
import { 
  Check, 
  Zap, 
  Crown, 
  Loader2,
  Sparkles,
  X
} from 'lucide-react'
import { PRICING, Tier } from '@/lib/tier-config'
import { cn } from '@/lib/utils'

interface UpgradeModalProps {
  open: boolean
  onClose: () => void
  highlightTier?: Tier
}

export function UpgradeModal({ open, onClose, highlightTier = 'pro' }: UpgradeModalProps) {
  const router = useRouter()
  const [isAnnual, setIsAnnual] = useState(false)
  const [loadingTier, setLoadingTier] = useState<string | null>(null)

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
        // Redirect to Stripe Checkout
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
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[700px] p-0 gap-0 overflow-hidden">
        {/* Header */}
        <DialogHeader className="p-6 pb-4 bg-gradient-to-r from-primary/10 via-purple-500/10 to-pink-500/10">
          <div className="flex items-center justify-between">
            <div>
              <DialogTitle className="text-2xl flex items-center gap-2">
                <Sparkles className="w-6 h-6 text-primary" />
                Upgrade Your Plan
              </DialogTitle>
              <p className="text-sm text-muted-foreground mt-1">
                Unlock powerful features to grow your portfolio
              </p>
            </div>
          </div>
        </DialogHeader>

        {/* Billing toggle */}
        <div className="flex items-center justify-center gap-3 py-4 border-b">
          <span className={cn("text-sm", !isAnnual && "font-medium")}>Monthly</span>
          <Switch
            checked={isAnnual}
            onCheckedChange={setIsAnnual}
          />
          <span className={cn("text-sm", isAnnual && "font-medium")}>
            Annual
            <span className="ml-1.5 text-xs bg-green-500/10 text-green-600 px-1.5 py-0.5 rounded-full">
              Save 17%
            </span>
          </span>
        </div>

        {/* Pricing cards */}
        <div className="p-6 grid md:grid-cols-2 gap-4">
          {/* Pro Plan */}
          <PricingCard
            tier="pro"
            isAnnual={isAnnual}
            isHighlighted={highlightTier === 'pro'}
            isLoading={loadingTier === 'pro'}
            onUpgrade={() => handleUpgrade('pro')}
          />

          {/* Premium Plan */}
          <PricingCard
            tier="premium"
            isAnnual={isAnnual}
            isHighlighted={highlightTier === 'premium'}
            isLoading={loadingTier === 'premium'}
            onUpgrade={() => handleUpgrade('premium')}
          />
        </div>

        {/* Footer */}
        <div className="px-6 pb-6 text-center">
          <p className="text-xs text-muted-foreground">
            All plans include a 30-day money-back guarantee. Cancel anytime.
          </p>
        </div>
      </DialogContent>
    </Dialog>
  )
}

// ─── Pricing Card Component ──────────────────────────────────────────────────
function PricingCard({
  tier,
  isAnnual,
  isHighlighted,
  isLoading,
  onUpgrade,
}: {
  tier: 'pro' | 'premium'
  isAnnual: boolean
  isHighlighted: boolean
  isLoading: boolean
  onUpgrade: () => void
}) {
  const pricing = PRICING[tier]
  const Icon = tier === 'pro' ? Zap : Crown
  const price = isAnnual ? pricing.annualPrice : pricing.monthlyPrice
  const monthlyEquivalent = isAnnual ? (pricing.annualPrice / 12).toFixed(2) : null

  return (
    <div
      className={cn(
        "relative flex flex-col rounded-xl border-2 p-5 transition-all",
        isHighlighted 
          ? "border-primary bg-primary/5 shadow-lg shadow-primary/10" 
          : "border-border hover:border-primary/50"
      )}
    >
      {/* Popular badge */}
      {isHighlighted && (
        <div className="absolute -top-3 left-1/2 -translate-x-1/2">
          <span className="bg-primary text-primary-foreground text-xs font-bold uppercase tracking-wider px-3 py-1 rounded-full">
            {tier === 'pro' ? 'Most Popular' : 'Best Value'}
          </span>
        </div>
      )}

      {/* Header */}
      <div className="flex items-center gap-2 mb-3">
        <div className={cn(
          "p-2 rounded-lg",
          tier === 'premium' ? "bg-yellow-500/10" : "bg-primary/10"
        )}>
          <Icon className={cn(
            "w-5 h-5",
            tier === 'premium' ? "text-yellow-500" : "text-primary"
          )} />
        </div>
        <div>
          <h3 className="font-bold text-lg">{pricing.name}</h3>
          <p className="text-xs text-muted-foreground">{pricing.description}</p>
        </div>
      </div>

      {/* Price */}
      <div className="mb-4">
        <div className="flex items-baseline gap-1">
          <span className="text-3xl font-bold">${price}</span>
          <span className="text-muted-foreground">/{isAnnual ? 'year' : 'month'}</span>
        </div>
        {monthlyEquivalent && (
          <p className="text-xs text-muted-foreground">
            ${monthlyEquivalent}/month billed annually
          </p>
        )}
        {tier === 'pro' && !isAnnual && (
          <p className="text-xs text-green-600 mt-1">
            Includes 7-day free trial
          </p>
        )}
      </div>

      {/* Features */}
      <ul className="space-y-2 mb-5 flex-1">
        {pricing.features.map((feature, i) => (
          <li key={i} className="flex items-start gap-2 text-sm">
            <Check className="w-4 h-4 text-green-500 mt-0.5 shrink-0" />
            <span>{feature}</span>
          </li>
        ))}
      </ul>

      {/* CTA Button */}
      <Button
        className="w-full"
        variant={isHighlighted ? "default" : "outline"}
        onClick={onUpgrade}
        disabled={isLoading}
      >
        {isLoading ? (
          <Loader2 className="w-4 h-4 animate-spin" />
        ) : tier === 'pro' && !isAnnual ? (
          'Start Free Trial'
        ) : (
          'Upgrade Now'
        )}
      </Button>
    </div>
  )
}

// ─── Standalone Upgrade Button ───────────────────────────────────────────────
export function UpgradeButton({ 
  className,
  variant = 'default',
  size = 'default'
}: { 
  className?: string
  variant?: 'default' | 'outline' | 'ghost'
  size?: 'default' | 'sm' | 'lg'
}) {
  const [showModal, setShowModal] = useState(false)

  return (
    <>
      <Button 
        className={className} 
        variant={variant}
        size={size}
        onClick={() => setShowModal(true)}
      >
        <Sparkles className="w-4 h-4 mr-2" />
        Upgrade
      </Button>
      <UpgradeModal open={showModal} onClose={() => setShowModal(false)} />
    </>
  )
}
