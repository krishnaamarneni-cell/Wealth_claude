// =============================================
// WEALTHCLAUDE TIER CONFIGURATION
// =============================================

export type Tier = 'free' | 'pro' | 'premium'
export type BillingInterval = 'monthly' | 'annual'

// ─── Stripe Price IDs ────────────────────────────────────────────────────────
export const STRIPE_PRICES = {
  pro: {
    monthly: 'price_1TDGjpIcEsshLKBciiKr605J',
    annual: 'price_1TDGkWIcEsshLKBchuQ8c9Wx',
  },
  premium: {
    monthly: 'price_1TDGlMIcEsshLKBcALVwhGr3',
    annual: 'price_1TDGm0IcEsshLKBcHTxijoaZ',
  },
} as const

// ─── Pricing Display ─────────────────────────────────────────────────────────
export const PRICING = {
  free: {
    name: 'Free',
    description: 'Basic portfolio tracking',
    monthlyPrice: 0,
    annualPrice: 0,
    features: [
      'Portfolio overview',
      'Holdings tracking',
      'Transaction history',
      'Heat maps',
      'Stock comparison',
    ],
  },
  pro: {
    name: 'Pro',
    description: 'Advanced analytics & insights',
    monthlyPrice: 5.99,
    annualPrice: 59.99,
    trialDays: 7,
    features: [
      'Everything in Free',
      'Performance analytics',
      'Portfolio breakdown',
      'Trade analysis',
      'Goal tracker',
      'Priority support',
    ],
  },
  premium: {
    name: 'Premium',
    description: 'AI-powered portfolio assistant',
    monthlyPrice: 9.99,
    annualPrice: 99.99,
    features: [
      'Everything in Pro',
      'AI portfolio assistant',
      'Personalized insights',
      'Smart recommendations',
      'Unlimited AI queries',
    ],
  },
} as const

// ─── Page Access Rules ───────────────────────────────────────────────────────
// Define which pages each tier can access
export const PAGE_ACCESS: Record<string, Tier[]> = {
  // Free tier pages (accessible to all)
  '/dashboard': ['free', 'pro', 'premium'],
  '/dashboard/holdings': ['free', 'pro', 'premium'],
  '/dashboard/transactions': ['free', 'pro', 'premium'],
  '/dashboard/heat-maps': ['free', 'pro', 'premium'],
  '/dashboard/compare': ['free', 'pro', 'premium'],
  '/dashboard/profile': ['free', 'pro', 'premium'],

  // Pro tier pages
  '/dashboard/performance': ['pro', 'premium'],
  '/dashboard/portfolio': ['pro', 'premium'],
  '/dashboard/trade-analysis': ['pro', 'premium'],
  '/dashboard/goals': ['pro', 'premium'],
}

// ─── Feature Access ──────────────────────────────────────────────────────────
export const FEATURE_ACCESS = {
  'ai-chat': ['premium'] as Tier[],
  'performance': ['pro', 'premium'] as Tier[],
  'portfolio-breakdown': ['pro', 'premium'] as Tier[],
  'trade-analysis': ['pro', 'premium'] as Tier[],
  'goals': ['pro', 'premium'] as Tier[],
}

// ─── Helper Functions ────────────────────────────────────────────────────────

/**
 * Check if a tier has access to a specific page
 */
export function canAccessPage(tier: Tier, path: string): boolean {
  // Normalize path (remove trailing slash, query params)
  const normalizedPath = path.split('?')[0].replace(/\/$/, '')

  const allowedTiers = PAGE_ACCESS[normalizedPath]

  // If page isn't in our access list, allow access (public pages)
  if (!allowedTiers) return true

  return allowedTiers.includes(tier)
}

/**
 * Check if a tier has access to a specific feature
 */
export function canAccessFeature(tier: Tier, feature: keyof typeof FEATURE_ACCESS): boolean {
  return FEATURE_ACCESS[feature].includes(tier)
}

/**
 * Get the minimum tier required for a page
 */
export function getRequiredTier(path: string): Tier {
  const normalizedPath = path.split('?')[0].replace(/\/$/, '')
  const allowedTiers = PAGE_ACCESS[normalizedPath]

  if (!allowedTiers) return 'free'

  // Return the lowest tier that has access
  if (allowedTiers.includes('free')) return 'free'
  if (allowedTiers.includes('pro')) return 'pro'
  return 'premium'
}

/**
 * Get upgrade message for a locked page
 */
export function getUpgradeMessage(path: string): { title: string; description: string; requiredTier: Tier } {
  const requiredTier = getRequiredTier(path)

  const messages: Record<string, { title: string; description: string }> = {
    '/dashboard/performance': {
      title: 'Unlock Performance Analytics',
      description: 'Track your portfolio performance over time with detailed charts, metrics, and insights.',
    },
    '/dashboard/portfolio': {
      title: 'Unlock Portfolio Breakdown',
      description: 'See detailed breakdowns of your portfolio by sector, asset type, and more.',
    },
    '/dashboard/trade-analysis': {
      title: 'Unlock Trade Analysis',
      description: 'Analyze your trading patterns, win rates, and get insights to improve your strategy.',
    },
    '/dashboard/goals': {
      title: 'Unlock Goal Tracker',
      description: 'Set financial goals, track your progress, and get personalized recommendations.',
    },
  }

  const defaultMessage = {
    title: 'Upgrade Required',
    description: 'This feature requires a higher tier subscription.',
  }

  return {
    ...(messages[path] || defaultMessage),
    requiredTier,
  }
}

/**
 * Server-side helper: fetch whether subscription plans are enabled globally.
 * Reads from app_settings table. Falls back to `false` (plans disabled) on error.
 *
 * When plans are disabled, all users effectively get Premium-level access.
 * The /upgrade page + pricing UI should be hidden.
 *
 * Use this in server components that need to redirect based on plan state.
 */
export async function arePlansEnabled(): Promise<boolean> {
  try {
    const { createClient } = await import('@supabase/supabase-js')
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
    )
    const { data } = await supabase
      .from('app_settings')
      .select('value')
      .eq('key', 'plans_enabled')
      .maybeSingle()

    if (!data) return false // default: plans disabled
    // value is JSONB, could be boolean or string
    const v = data.value
    return v === true || v === 'true'
  } catch {
    return false
  }
}

/**
 * Get price ID for a tier and interval
 */
export function getPriceId(tier: 'pro' | 'premium', interval: BillingInterval): string {
  return STRIPE_PRICES[tier][interval]
}

/**
 * Check if tier includes trial
 */
export function hasTrial(tier: 'pro' | 'premium'): boolean {
  return tier === 'pro'
}

/**
 * Get trial days for a tier
 */
export function getTrialDays(tier: 'pro' | 'premium'): number {
  return tier === 'pro' ? 7 : 0
}
