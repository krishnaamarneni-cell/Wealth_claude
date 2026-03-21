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
  fallback?: React.ReactNode
}

/**
 * Wraps content that requires a specific tier.
 * Shows blurred content with upgrade prompt if user doesn't have access.
 */
export function TierGate({ 
  children, 
  requiredTier,
  feature,
  fallback 
}: TierGateProps) {
  const pathname = usePathname()
  const { tier, isLoading, canAccess } = useTier()
  const [showUpgradeModal, setShowUpgradeModal] = useState(false)

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

  // User has access - show content
  if (hasAccess) {
    return <>{children}</>
  }

  // User doesn't have access - show upgrade prompt
  const upgradeInfo = getUpgradeMessage(pathname)
  const effectiveRequiredTier = requiredTier || upgradeInfo.requiredTier

  return (
    <>
      <div className="relative min-h-[500px]">
        {/* Blurred fallback content */}
        <div className="absolute inset-0 overflow-hidden">
          {fallback ? (
            <div className="blur-sm pointer-events-none opacity-50">
              {fallback}
            </div>
          ) : (
            <div className="blur-sm pointer-events-none opacity-50">
              <PlaceholderContent />
            </div>
          )}
        </div>

        {/* Overlay with upgrade prompt */}
        <div className="absolute inset-0 bg-background/80 backdrop-blur-sm flex items-center justify-center z-10">
          <div className="max-w-md w-full mx-4">
            <div className="bg-card border border-border rounded-2xl p-8 shadow-2xl text-center">
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

// ─── Placeholder Content (shown blurred) ─────────────────────────────────────
function PlaceholderContent() {
  return (
    <div className="p-6 space-y-6">
      {/* Header placeholder */}
      <div className="flex justify-between items-center">
        <div className="h-8 w-48 bg-muted rounded" />
        <div className="h-10 w-32 bg-muted rounded" />
      </div>

      {/* Stats row */}
      <div className="grid grid-cols-4 gap-4">
        {[1, 2, 3, 4].map((i) => (
          <div key={i} className="bg-card border rounded-lg p-4">
            <div className="h-4 w-20 bg-muted rounded mb-2" />
            <div className="h-8 w-24 bg-muted rounded" />
          </div>
        ))}
      </div>

      {/* Chart placeholder */}
      <div className="bg-card border rounded-lg p-6">
        <div className="h-4 w-32 bg-muted rounded mb-4" />
        <div className="h-64 bg-muted rounded" />
      </div>

      {/* Table placeholder */}
      <div className="bg-card border rounded-lg p-6">
        <div className="h-4 w-40 bg-muted rounded mb-4" />
        <div className="space-y-3">
          {[1, 2, 3, 4, 5].map((i) => (
            <div key={i} className="flex gap-4">
              <div className="h-4 w-24 bg-muted rounded" />
              <div className="h-4 w-32 bg-muted rounded" />
              <div className="h-4 w-20 bg-muted rounded" />
              <div className="h-4 flex-1 bg-muted rounded" />
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}

// ─── AI Chat Gate (for the chat button) ──────────────────────────────────────
export function AIChatGate({ children }: { children: React.ReactNode }) {
  const { canUseFeature } = useTier()
  const [showUpgradeModal, setShowUpgradeModal] = useState(false)

  if (canUseFeature('ai-chat')) {
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
