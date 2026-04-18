'use client'

import React, { createContext, useContext, useState, useEffect, useCallback } from 'react'
import { createClient } from '@/lib/supabase'
import { Tier, canAccessPage, canAccessFeature, FEATURE_ACCESS } from '@/lib/tier-config'

// ─── Types ───────────────────────────────────────────────────────────────────
interface TierContextType {
  tier: Tier
  actualTier: Tier // user's real tier from DB (may differ from effective `tier` when plans are disabled)
  plansEnabled: boolean // global flag — when false, all gating is bypassed
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
  const [actualTier, setActualTier] = useState<Tier>('free')
  const [plansEnabled, setPlansEnabled] = useState<boolean>(false)
  const [isLoading, setIsLoading] = useState(true)
  const [subscriptionStatus, setSubscriptionStatus] = useState<string | null>(null)
  const [trialEndsAt, setTrialEndsAt] = useState<Date | null>(null)
  const [currentPeriodEnd, setCurrentPeriodEnd] = useState<Date | null>(null)
  const [cancelAtPeriodEnd, setCancelAtPeriodEnd] = useState(false)

  const supabase = createClient()

  // Fetch global plans_enabled flag from app_settings
  const fetchPlansEnabled = useCallback(async () => {
    try {
      const res = await fetch('/api/admin/settings', { cache: 'no-store' })
      if (!res.ok) {
        setPlansEnabled(false)
        return
      }
      const settings = await res.json()
      const v = settings.plans_enabled
      setPlansEnabled(v === true || v === 'true')
    } catch {
      setPlansEnabled(false)
    }
  }, [])

  const fetchTier = useCallback(async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser()

      if (!user) {
        setActualTier('free')
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
        setActualTier('free')
      } else if (profile) {
        setActualTier((profile.tier as Tier) || 'free')
        setSubscriptionStatus(profile.subscription_status)
        setTrialEndsAt(profile.trial_ends_at ? new Date(profile.trial_ends_at) : null)
        setCurrentPeriodEnd(profile.current_period_end ? new Date(profile.current_period_end) : null)
        setCancelAtPeriodEnd(profile.cancel_at_period_end || false)
      }
    } catch (error) {
      console.error('[TierContext] Error:', error)
      setActualTier('free')
    } finally {
      setIsLoading(false)
    }
  }, [supabase])

  // Fetch tier + plans flag on mount
  useEffect(() => {
    fetchTier()
    fetchPlansEnabled()
  }, [fetchTier, fetchPlansEnabled])

  // Listen for auth changes
  useEffect(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event) => {
      if (event === 'SIGNED_IN' || event === 'TOKEN_REFRESHED') {
        fetchTier()
      } else if (event === 'SIGNED_OUT') {
        setActualTier('free')
        setSubscriptionStatus(null)
        setTrialEndsAt(null)
        setCurrentPeriodEnd(null)
        setCancelAtPeriodEnd(false)
      }
    })

    return () => subscription.unsubscribe()
  }, [supabase, fetchTier])

  // Effective tier: when plans are disabled globally, everyone gets 'premium' access.
  // This makes all existing canAccessPage() / canAccessFeature() checks naturally return true.
  const tier: Tier = plansEnabled ? actualTier : 'premium'

  // Check if user is in trial period
  const isTrialing = subscriptionStatus === 'trialing' && trialEndsAt && new Date() < trialEndsAt

  // Access check functions — use effective tier
  const canAccess = useCallback((path: string) => {
    if (!plansEnabled) return true
    return canAccessPage(tier, path)
  }, [tier, plansEnabled])

  const canUseFeature = useCallback((feature: keyof typeof FEATURE_ACCESS) => {
    if (!plansEnabled) return true
    return canAccessFeature(tier, feature)
  }, [tier, plansEnabled])

  const value: TierContextType = {
    tier,
    actualTier,
    plansEnabled,
    isLoading,
    isTrialing: !!isTrialing,
    trialEndsAt,
    subscriptionStatus,
    currentPeriodEnd,
    cancelAtPeriodEnd,
    canAccess,
    canUseFeature,
    refreshTier: async () => {
      await Promise.all([fetchTier(), fetchPlansEnabled()])
    },
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
