'use client'

import { usePathname } from 'next/navigation'
import { useTier } from '@/lib/tier-context'
import { getUpgradeMessage, Tier, PRICING } from '@/lib/tier-config'
import { Button } from '@/components/ui/button'
import { Lock, Sparkles, Zap, Crown } from 'lucide-react'
import { useState } from 'react'
import { UpgradeModal } from '@/components/upgrade-modal'

interface TierGateProps {
  children: React.ReactNode
  requiredTier?: Tier
  feature?: string
}

/**
 * Wraps content that requires a specific tier.
 * Shows BLURRED ACTUAL CONTENT with upgrade prompt if user doesn't have access.
 * This creates FOMO by letting users see their real data blurred out.
 */
export function TierGate({
  children,
  requiredTier,
  feature,
}: TierGateProps) {
  const pathname = usePathname()
  const { tier, isLoading, canAccess, plansEnabled } = useTier()
  const [showUpgradeModal, setShowUpgradeModal] = useState(false)

  // Plans disabled globally — everyone gets access, skip gating entirely
  if (!plansEnabled) {
    return <>{children}</>
  }

  // Determine if user has access
  const hasAccess = requiredTier
    ? (tier === requiredTier || tier === 'premium' || (tier === 'pro' && requiredTier === 'pro'))
    : canAccess(pathname)

  // Show loading state
  if (isLoading) {
    return (
      <div className="min-h-[400px] flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
      </div>
    )
  }

  // User has access - show content normally
  if (hasAccess) {
    return <>{children}</>
  }

  // User doesn't have access - show BLURRED ACTUAL CONTENT with upgrade overlay
  const upgradeInfo = getUpgradeMessage(pathname)
  const effectiveRequiredTier = requiredTier || upgradeInfo.requiredTier

  return (
    <>
      <div className="relative min-h-[500px]">
        {/* ACTUAL CONTENT - BLURRED */}
        <div className="blur-sm pointer-events-none select-none opacity-60">
          {children}
        </div>

        {/* Gradient fade at bottom for smooth transition */}
        <div className="absolute bottom-0 left-0 right-0 h-32 bg-gradient-to-t from-background to-transparent pointer-events-none" />

        {/* Overlay with upgrade prompt - positioned at top 25-30% */}
        <div className="absolute inset-0 flex items-start justify-center pt-[15%] sm:pt-[20%] z-10">
          <div className="max-w-md w-full mx-4 sticky top-8">
            <div className="bg-card/95 backdrop-blur-sm border border-border rounded-2xl p-8 shadow-2xl text-center">
              {/* Lock icon */}
              <div className="mb-6 inline-flex items-center justify-center w-16 h-16 rounded-full bg-primary/10">
                <Lock className="w-8 h-8 text-primary" />
              </div>

              {/* Title & Description */}
              <h2 className="text-2xl font-bold mb-3">{upgradeInfo.title}</h2>
              <p className="text-muted-foreground mb-6">{upgradeInfo.description}</p>

              {/* Tier badges */}
              <div className="flex gap-3 justify-center mb-6">
                {effectiveRequiredTier === 'pro' && (
                  <>
                    <TierBadge
                      tier="pro"
                      recommended
                      onClick={() => setShowUpgradeModal(true)}
                    />
                    <TierBadge
                      tier="premium"
                      onClick={() => setShowUpgradeModal(true)}
                    />
                  </>
                )}
                {effectiveRequiredTier === 'premium' && (
                  <TierBadge
                    tier="premium"
                    recommended
                    onClick={() => setShowUpgradeModal(true)}
                  />
                )}
              </div>

              {/* CTA Button */}
              <Button
                size="lg"
                className="w-full gap-2"
                onClick={() => setShowUpgradeModal(true)}
              >
                <Sparkles className="w-4 h-4" />
                Upgrade Now
              </Button>

              {/* Trial note */}
              {effectiveRequiredTier === 'pro' && (
                <p className="text-xs text-muted-foreground mt-4">
                  Start with a 7-day free trial. Cancel anytime.
                </p>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Upgrade Modal */}
      <UpgradeModal
        open={showUpgradeModal}
        onClose={() => setShowUpgradeModal(false)}
        highlightTier={effectiveRequiredTier}
      />
    </>
  )
}

// ─── Tier Badge Component ────────────────────────────────────────────────────
function TierBadge({
  tier,
  recommended = false,
  onClick
}: {
  tier: 'pro' | 'premium'
  recommended?: boolean
  onClick?: () => void
}) {
  const pricing = PRICING[tier]
  const Icon = tier === 'pro' ? Zap : Crown

  return (
    <button
      onClick={onClick}
      className={`
        relative flex flex-col items-center p-4 rounded-xl border-2 transition-all
        hover:scale-105 cursor-pointer min-w-[120px]
        ${recommended
          ? 'border-primary bg-primary/5'
          : 'border-border hover:border-primary/50'
        }
      `}
    >
      {recommended && (
        <span className="absolute -top-2.5 left-1/2 -translate-x-1/2 text-[10px] font-bold uppercase tracking-wider bg-primary text-primary-foreground px-2 py-0.5 rounded-full">
          Recommended
        </span>
      )}
      <Icon className={`w-5 h-5 mb-1 ${tier === 'premium' ? 'text-yellow-500' : 'text-primary'}`} />
      <span className="font-semibold">{pricing.name}</span>
      <span className="text-sm text-muted-foreground">${pricing.monthlyPrice}/mo</span>
    </button>
  )
}

// ─── AI Chat Gate (for the chat button) ──────────────────────────────────────
export function AIChatGate({ children }: { children: React.ReactNode }) {
  const { canUseFeature, plansEnabled } = useTier()
  const [showUpgradeModal, setShowUpgradeModal] = useState(false)

  // Plans disabled — everyone can use AI chat
  if (!plansEnabled || canUseFeature('ai-chat')) {
    return <>{children}</>
  }

  return (
    <>
      <div onClick={() => setShowUpgradeModal(true)}>
        {children}
      </div>
      <UpgradeModal
        open={showUpgradeModal}
        onClose={() => setShowUpgradeModal(false)}
        highlightTier="premium"
      />
    </>
  )
}
