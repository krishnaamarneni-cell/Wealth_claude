'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase'
import { useTier } from '@/lib/tier-context'
import { usePortfolio } from '@/lib/portfolio-context'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { 
  Loader2, 
  User, 
  Mail, 
  Zap, 
  Crown, 
  CreditCard, 
  Calendar,
  TrendingUp,
  Wallet,
  PieChart,
  Sparkles,
  AlertCircle,
  Check,
  ExternalLink
} from 'lucide-react'
import { PRICING } from '@/lib/tier-config'
import { UpgradeModal } from '@/components/upgrade-modal'
import { cn } from '@/lib/utils'

export default function ProfilePage() {
  const supabase = createClient()
  const router = useRouter()
  const { tier, isTrialing, trialEndsAt, currentPeriodEnd, cancelAtPeriodEnd, subscriptionStatus, refreshTier } = useTier()
  const { portfolioData } = usePortfolio()

  const [user, setUser] = useState<any>(null)
  const [profile, setProfile] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [fullName, setFullName] = useState('')
  const [showUpgradeModal, setShowUpgradeModal] = useState(false)
  const [cancelingSubscription, setCancelingSubscription] = useState(false)
  const [resumingSubscription, setResumingSubscription] = useState(false)

  // Fetch user and profile
  useEffect(() => {
    const fetchData = async () => {
      try {
        const { data: { user } } = await supabase.auth.getUser()
        setUser(user)

        if (user) {
          const { data: profile } = await supabase
            .from('profiles')
            .select('*')
            .eq('user_id', user.id)
            .single()

          if (profile) {
            setProfile(profile)
            setFullName(profile.full_name || '')
          }
        }
      } catch (error) {
        console.error('Error fetching profile:', error)
      } finally {
        setLoading(false)
      }
    }

    fetchData()
  }, [supabase])

  // Save profile
  const handleSave = async () => {
    if (!user) return
    setSaving(true)

    try {
      const { error } = await supabase
        .from('profiles')
        .upsert({
          user_id: user.id,
          full_name: fullName,
          updated_at: new Date().toISOString(),
        }, { onConflict: 'user_id' })

      if (error) throw error
      
      setProfile({ ...profile, full_name: fullName })
    } catch (error) {
      console.error('Error saving profile:', error)
      alert('Failed to save profile')
    } finally {
      setSaving(false)
    }
  }

  // Cancel subscription
  const handleCancelSubscription = async () => {
    if (!confirm('Are you sure you want to cancel? You\'ll keep access until the end of your billing period.')) {
      return
    }

    setCancelingSubscription(true)
    try {
      const response = await fetch('/api/cancel-subscription', { method: 'POST' })
      const data = await response.json()

      if (data.error) throw new Error(data.error)

      await refreshTier()
      alert('Subscription will be canceled at the end of your billing period.')
    } catch (error) {
      console.error('Error canceling:', error)
      alert('Failed to cancel subscription')
    } finally {
      setCancelingSubscription(false)
    }
  }

  // Resume subscription
  const handleResumeSubscription = async () => {
    setResumingSubscription(true)
    try {
      const response = await fetch('/api/cancel-subscription', { method: 'DELETE' })
      const data = await response.json()

      if (data.error) throw new Error(data.error)

      await refreshTier()
      alert('Subscription resumed!')
    } catch (error) {
      console.error('Error resuming:', error)
      alert('Failed to resume subscription')
    } finally {
      setResumingSubscription(false)
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 className="w-8 h-8 animate-spin text-muted-foreground" />
      </div>
    )
  }

  const TierIcon = tier === 'premium' ? Crown : tier === 'pro' ? Zap : User
  const tierColor = tier === 'premium' ? 'text-yellow-500' : tier === 'pro' ? 'text-primary' : 'text-muted-foreground'

  return (
    <div className="container max-w-4xl mx-auto p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <div className="h-16 w-16 rounded-full bg-primary/10 flex items-center justify-center text-2xl font-bold text-primary">
          {fullName ? fullName.charAt(0).toUpperCase() : user?.email?.charAt(0).toUpperCase()}
        </div>
        <div className="flex-1">
          <h1 className="text-2xl font-bold">{fullName || 'Welcome!'}</h1>
          <p className="text-muted-foreground">{user?.email}</p>
        </div>
        <div className={cn(
          "flex items-center gap-2 px-3 py-1.5 rounded-full text-sm font-medium",
          tier === 'premium' && "bg-yellow-500/10 text-yellow-600",
          tier === 'pro' && "bg-primary/10 text-primary",
          tier === 'free' && "bg-muted text-muted-foreground"
        )}>
          <TierIcon className="w-4 h-4" />
          {PRICING[tier].name}
          {isTrialing && <span className="text-xs">(Trial)</span>}
        </div>
      </div>

      {/* Stats */}
      {portfolioData && (
        <div className="grid grid-cols-3 gap-4">
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-green-500/10">
                  <Wallet className="w-5 h-5 text-green-500" />
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Portfolio Value</p>
                  <p className="text-xl font-bold">
                    ${portfolioData.totalValue?.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 }) || '0.00'}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-blue-500/10">
                  <PieChart className="w-5 h-5 text-blue-500" />
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Holdings</p>
                  <p className="text-xl font-bold">{portfolioData.holdings?.length || 0}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center gap-3">
                <div className={cn(
                  "p-2 rounded-lg",
                  (portfolioData.totalGainPercent || 0) >= 0 ? "bg-green-500/10" : "bg-red-500/10"
                )}>
                  <TrendingUp className={cn(
                    "w-5 h-5",
                    (portfolioData.totalGainPercent || 0) >= 0 ? "text-green-500" : "text-red-500"
                  )} />
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Total Return</p>
                  <p className={cn(
                    "text-xl font-bold",
                    (portfolioData.totalGainPercent || 0) >= 0 ? "text-green-500" : "text-red-500"
                  )}>
                    {(portfolioData.totalGainPercent || 0) >= 0 ? '+' : ''}{portfolioData.totalGainPercent?.toFixed(2) || '0.00'}%
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Subscription Card */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <CreditCard className="w-5 h-5" />
            Subscription
          </CardTitle>
          <CardDescription>Manage your plan and billing</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Current Plan */}
          <div className="flex items-center justify-between p-4 rounded-lg border bg-muted/30">
            <div className="flex items-center gap-3">
              <div className={cn(
                "p-2 rounded-lg",
                tier === 'premium' && "bg-yellow-500/10",
                tier === 'pro' && "bg-primary/10",
                tier === 'free' && "bg-muted"
              )}>
                <TierIcon className={cn("w-5 h-5", tierColor)} />
              </div>
              <div>
                <p className="font-semibold">{PRICING[tier].name} Plan</p>
                <p className="text-sm text-muted-foreground">
                  {tier === 'free' ? 'Free forever' : `$${PRICING[tier].monthlyPrice}/month`}
                </p>
              </div>
            </div>

            {tier === 'free' ? (
              <Button onClick={() => setShowUpgradeModal(true)}>
                <Sparkles className="w-4 h-4 mr-2" />
                Upgrade
              </Button>
            ) : (
              <Button variant="outline" onClick={() => setShowUpgradeModal(true)}>
                Change Plan
              </Button>
            )}
          </div>

          {/* Trial/Billing Info */}
          {tier !== 'free' && (
            <div className="space-y-3">
              {isTrialing && trialEndsAt && (
                <div className="flex items-center gap-2 p-3 rounded-lg bg-blue-500/10 text-blue-600">
                  <AlertCircle className="w-4 h-4" />
                  <span className="text-sm">
                    Trial ends {trialEndsAt.toLocaleDateString()}
                  </span>
                </div>
              )}

              {cancelAtPeriodEnd && currentPeriodEnd && (
                <div className="flex items-center gap-2 p-3 rounded-lg bg-yellow-500/10 text-yellow-600">
                  <AlertCircle className="w-4 h-4" />
                  <span className="text-sm">
                    Your subscription will end on {currentPeriodEnd.toLocaleDateString()}
                  </span>
                </div>
              )}

              {currentPeriodEnd && !cancelAtPeriodEnd && (
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <Calendar className="w-4 h-4" />
                  <span>Next billing date: {currentPeriodEnd.toLocaleDateString()}</span>
                </div>
              )}

              <div className="flex gap-2 pt-2">
                {cancelAtPeriodEnd ? (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={handleResumeSubscription}
                    disabled={resumingSubscription}
                  >
                    {resumingSubscription ? (
                      <Loader2 className="w-4 h-4 animate-spin mr-2" />
                    ) : (
                      <Check className="w-4 h-4 mr-2" />
                    )}
                    Resume Subscription
                  </Button>
                ) : (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={handleCancelSubscription}
                    disabled={cancelingSubscription}
                    className="text-muted-foreground hover:text-destructive"
                  >
                    {cancelingSubscription ? (
                      <Loader2 className="w-4 h-4 animate-spin mr-2" />
                    ) : null}
                    Cancel Subscription
                  </Button>
                )}

                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => window.open('https://billing.stripe.com/p/login/test_xxx', '_blank')}
                >
                  <ExternalLink className="w-4 h-4 mr-2" />
                  Manage Billing
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Profile Settings */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <User className="w-5 h-5" />
            Profile Settings
          </CardTitle>
          <CardDescription>Update your personal information</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <label className="block text-sm font-medium mb-2">Email</label>
            <div className="flex items-center gap-2 p-3 rounded-lg border bg-muted/30">
              <Mail className="w-4 h-4 text-muted-foreground" />
              <span>{user?.email}</span>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium mb-2">Display Name</label>
            <Input
              type="text"
              placeholder="Your name"
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
            />
          </div>

          <Button onClick={handleSave} disabled={saving}>
            {saving ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Saving...
              </>
            ) : (
              'Save Changes'
            )}
          </Button>
        </CardContent>
      </Card>

      {/* Upgrade Modal */}
      <UpgradeModal 
        open={showUpgradeModal} 
        onClose={() => setShowUpgradeModal(false)} 
      />
    </div>
  )
}
