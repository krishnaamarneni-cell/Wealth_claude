'use client'

import React, { createContext, useContext, useState, useEffect, useCallback } from 'react'
import { createClient } from '@/lib/supabase'
import { Tier, canAccessPage, canAccessFeature, FEATURE_ACCESS } from '@/lib/tier-config'

// ─── Types ───────────────────────────────────────────────────────────────────
interface TierContextType {
  tier: Tier
  isLoading: boolean
  isTrialing: boolean
  trialEndsAt: Date | null
  subscriptionStatus: string | null
  currentPeriodEnd: Date | null
  cancelAtPeriodEnd: boolean
  canAccess: (path: string) => boolean
  canUseFeature: (feature: keyof typeof FEATURE_ACCESS) => boolean
  refreshTier: () => Promise<void>
}

// ─── Context ─────────────────────────────────────────────────────────────────
const TierContext = createContext<TierContextType | undefined>(undefined)

// ─── Provider ────────────────────────────────────────────────────────────────
export function TierProvider({ children }: { children: React.ReactNode }) {
  const [tier, setTier] = useState<Tier>('free')
  const [isLoading, setIsLoading] = useState(true)
  const [subscriptionStatus, setSubscriptionStatus] = useState<string | null>(null)
  const [trialEndsAt, setTrialEndsAt] = useState<Date | null>(null)
  const [currentPeriodEnd, setCurrentPeriodEnd] = useState<Date | null>(null)
  const [cancelAtPeriodEnd, setCancelAtPeriodEnd] = useState(false)

  const supabase = createClient()

  const fetchTier = useCallback(async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser()
      
      if (!user) {
        setTier('free')
        setIsLoading(false)
        return
      }

      const { data: profile, error } = await supabase
        .from('profiles')
        .select('tier, subscription_status, trial_ends_at, current_period_end, cancel_at_period_end')
        .eq('user_id', user.id)
        .single()

      if (error) {
        console.error('[TierContext] Error fetching profile:', error)
        setTier('free')
      } else if (profile) {
        setTier((profile.tier as Tier) || 'free')
        setSubscriptionStatus(profile.subscription_status)
        setTrialEndsAt(profile.trial_ends_at ? new Date(profile.trial_ends_at) : null)
        setCurrentPeriodEnd(profile.current_period_end ? new Date(profile.current_period_end) : null)
        setCancelAtPeriodEnd(profile.cancel_at_period_end || false)
      }
    } catch (error) {
      console.error('[TierContext] Error:', error)
      setTier('free')
    } finally {
      setIsLoading(false)
    }
  }, [supabase])

  // Fetch tier on mount
  useEffect(() => {
    fetchTier()
  }, [fetchTier])

  // Listen for auth changes
  useEffect(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event) => {
      if (event === 'SIGNED_IN' || event === 'TOKEN_REFRESHED') {
        fetchTier()
      } else if (event === 'SIGNED_OUT') {
        setTier('free')
        setSubscriptionStatus(null)
        setTrialEndsAt(null)
        setCurrentPeriodEnd(null)
        setCancelAtPeriodEnd(false)
      }
    })

    return () => subscription.unsubscribe()
  }, [supabase, fetchTier])

  // Check if user is in trial period
  const isTrialing = subscriptionStatus === 'trialing' && trialEndsAt && new Date() < trialEndsAt

  // Access check functions
  const canAccess = useCallback((path: string) => canAccessPage(tier, path), [tier])
  const canUseFeature = useCallback((feature: keyof typeof FEATURE_ACCESS) => canAccessFeature(tier, feature), [tier])

  const value: TierContextType = {
    tier,
    isLoading,
    isTrialing: !!isTrialing,
    trialEndsAt,
    subscriptionStatus,
    currentPeriodEnd,
    cancelAtPeriodEnd,
    canAccess,
    canUseFeature,
    refreshTier: fetchTier,
  }

  return (
    <TierContext.Provider value={value}>
      {children}
    </TierContext.Provider>
  )
}

// ─── Hook ────────────────────────────────────────────────────────────────────
export function useTier() {
  const context = useContext(TierContext)
  if (context === undefined) {
    throw new Error('useTier must be used within a TierProvider')
  }
  return context
}

// ─── Utility Hook: Check specific page access ────────────────────────────────
export function usePageAccess(path: string) {
  const { tier, isLoading, canAccess } = useTier()
  return {
    hasAccess: canAccess(path),
    tier,
    isLoading,
  }
}

// ─── Utility Hook: Check specific feature access ─────────────────────────────
export function useFeatureAccess(feature: keyof typeof FEATURE_ACCESS) {
  const { tier, isLoading, canUseFeature } = useTier()
  return {
    hasAccess: canUseFeature(feature),
    tier,
    isLoading,
  }
}
