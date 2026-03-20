"use client"

import { useState, useEffect, useCallback } from "react"
import { useParams, useSearchParams } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import {
  InputOTP,
  InputOTPGroup,
  InputOTPSlot,
} from "@/components/ui/input-otp"
import {
  TrendingUp,
  Lock,
  Unlock,
  Loader2,
  CheckCircle2,
  ExternalLink,
  DollarSign,
  Percent,
  BarChart3,
  Mail,
  Shield,
  AlertTriangle,
  Eye,
  EyeOff,
  Clock
} from "lucide-react"
import Link from "next/link"

// =============================================
// SECURITY CONFIGURATION
// =============================================
const PAID_PORTFOLIO_SLUG = "krishna-amarneni"
const SESSION_STORAGE_KEY = 'wc_portfolio_session'
const SESSION_DURATION_MS = 24 * 60 * 60 * 1000 // 24 hours

// =============================================
// TYPES
// =============================================
interface Holding {
  symbol: string
  shares: number | null
  avgCost: number | null
  currentPrice: number | null
  marketValue: number | null
  totalGain: number | null
  totalGainPercent: number
  todayGain: number | null
  todayGainPercent: number
  allocation: number | null
  sector: string
}

interface PortfolioData {
  displayName: string
  totalGainPercent: number
  todayGainPercent: number
  totalValue: number | null
  totalCost: number | null
  holdings: Holding[]
  updatedAt: string
}

interface SessionData {
  token: string
  email: string
  slug: string
  expiresAt: string
  deviceFingerprint: string
}

interface SubscriptionInfo {
  planType: 'one_time' | 'monthly'
  status: string
  currentPeriodEnd?: string
  purchasedAt?: string
}

// =============================================
// SECURITY UTILITIES
// =============================================

// Generate device fingerprint (basic version)
function generateDeviceFingerprint(): string {
  const canvas = document.createElement('canvas')
  const ctx = canvas.getContext('2d')
  ctx?.fillText('fingerprint', 10, 10)

  const components = [
    navigator.userAgent,
    navigator.language,
    screen.width + 'x' + screen.height,
    screen.colorDepth,
    new Date().getTimezoneOffset(),
    canvas.toDataURL(),
  ]

  // Simple hash
  let hash = 0
  const str = components.join('|')
  for (let i = 0; i < str.length; i++) {
    const char = str.charCodeAt(i)
    hash = ((hash << 5) - hash) + char
    hash = hash & hash
  }

  return Math.abs(hash).toString(36)
}

// Get stored session
function getStoredSession(slug: string): SessionData | null {
  try {
    const stored = localStorage.getItem(SESSION_STORAGE_KEY)
    if (!stored) return null

    const sessions = JSON.parse(stored)
    const session = sessions[slug]

    if (!session) return null

    // Check expiry
    if (new Date(session.expiresAt) < new Date()) {
      // Expired, remove it
      delete sessions[slug]
      localStorage.setItem(SESSION_STORAGE_KEY, JSON.stringify(sessions))
      return null
    }

    // Verify device fingerprint
    const currentFingerprint = generateDeviceFingerprint()
    if (session.deviceFingerprint !== currentFingerprint) {
      // Different device, invalidate
      delete sessions[slug]
      localStorage.setItem(SESSION_STORAGE_KEY, JSON.stringify(sessions))
      return null
    }

    return session
  } catch {
    return null
  }
}

// Store session
function storeSession(session: SessionData): void {
  try {
    const stored = localStorage.getItem(SESSION_STORAGE_KEY)
    const sessions = stored ? JSON.parse(stored) : {}
    sessions[session.slug] = session
    localStorage.setItem(SESSION_STORAGE_KEY, JSON.stringify(sessions))
  } catch (e) {
    console.error('Failed to store session:', e)
  }
}

// Clear session
function clearSession(slug: string): void {
  try {
    const stored = localStorage.getItem(SESSION_STORAGE_KEY)
    if (stored) {
      const sessions = JSON.parse(stored)
      delete sessions[slug]
      localStorage.setItem(SESSION_STORAGE_KEY, JSON.stringify(sessions))
    }
  } catch (e) {
    console.error('Failed to clear session:', e)
  }
}

// =============================================
// MAIN COMPONENT
// =============================================
export default function SecurePortfolioPage() {
  const params = useParams()
  const searchParams = useSearchParams()
  const slug = params.slug as string

  const requiresPayment = slug === PAID_PORTFOLIO_SLUG

  // =============================================
  // STATE
  // =============================================

  // Auth state
  const [authStep, setAuthStep] = useState<'loading' | 'email' | 'code' | 'authenticated' | 'payment'>('loading')
  const [email, setEmail] = useState("")
  const [verificationCode, setVerificationCode] = useState("")
  const [maskedEmail, setMaskedEmail] = useState("")
  const [sessionToken, setSessionToken] = useState<string | null>(null)
  const [verifiedEmail, setVerifiedEmail] = useState<string | null>(null)

  // Loading states
  const [isSendingCode, setIsSendingCode] = useState(false)
  const [isVerifyingCode, setIsVerifyingCode] = useState(false)
  const [isCheckingSubscription, setIsCheckingSubscription] = useState(false)
  const [isProcessingPayment, setIsProcessingPayment] = useState(false)

  // Data state
  const [portfolio, setPortfolio] = useState<PortfolioData | null>(null)
  const [subscription, setSubscription] = useState<SubscriptionInfo | null>(null)
  const [hasAccess, setHasAccess] = useState(false)

  // Error state
  const [error, setError] = useState<string | null>(null)

  // Security state
  const [isBlurred, setIsBlurred] = useState(false)
  const [codeExpiresIn, setCodeExpiresIn] = useState<number>(0)
  const [sessionExpiresAt, setSessionExpiresAt] = useState<Date | null>(null)

  // =============================================
  // SECURITY: Blur on tab switch
  // =============================================
  useEffect(() => {
    if (!hasAccess) return

    const handleVisibilityChange = () => {
      if (document.hidden) {
        setIsBlurred(true)
      } else {
        // Small delay before unblurring
        setTimeout(() => setIsBlurred(false), 500)
      }
    }

    const handleBlur = () => setIsBlurred(true)
    const handleFocus = () => setTimeout(() => setIsBlurred(false), 500)

    document.addEventListener('visibilitychange', handleVisibilityChange)
    window.addEventListener('blur', handleBlur)
    window.addEventListener('focus', handleFocus)

    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange)
      window.removeEventListener('blur', handleBlur)
      window.removeEventListener('focus', handleFocus)
    }
  }, [hasAccess])

  // =============================================
  // SECURITY: Disable right-click and keyboard shortcuts
  // =============================================
  useEffect(() => {
    if (!hasAccess) return

    const handleContextMenu = (e: MouseEvent) => {
      e.preventDefault()
      return false
    }

    const handleKeyDown = (e: KeyboardEvent) => {
      // Disable Print Screen, Ctrl+P, Ctrl+S, Ctrl+Shift+S
      if (
        e.key === 'PrintScreen' ||
        (e.ctrlKey && e.key === 'p') ||
        (e.ctrlKey && e.key === 's') ||
        (e.ctrlKey && e.shiftKey && e.key === 's') ||
        (e.metaKey && e.key === 'p') ||
        (e.metaKey && e.key === 's')
      ) {
        e.preventDefault()
        setIsBlurred(true)
        setTimeout(() => setIsBlurred(false), 2000)
        return false
      }
    }

    document.addEventListener('contextmenu', handleContextMenu)
    document.addEventListener('keydown', handleKeyDown)

    return () => {
      document.removeEventListener('contextmenu', handleContextMenu)
      document.removeEventListener('keydown', handleKeyDown)
    }
  }, [hasAccess])

  // =============================================
  // CODE EXPIRY TIMER
  // =============================================
  useEffect(() => {
    if (codeExpiresIn <= 0) return

    const timer = setInterval(() => {
      setCodeExpiresIn(prev => {
        if (prev <= 1) {
          clearInterval(timer)
          return 0
        }
        return prev - 1
      })
    }, 1000)

    return () => clearInterval(timer)
  }, [codeExpiresIn])

  // =============================================
  // INITIAL LOAD: Check for existing session or payment callback
  // =============================================
  useEffect(() => {
    const initialize = async () => {
      // Check for payment callback
      const paymentSuccess = searchParams.get('payment_success')
      const subscriptionSuccess = searchParams.get('subscription_success')
      const sessionId = searchParams.get('session_id')

      if ((paymentSuccess === 'true' || subscriptionSuccess === 'true') && sessionId) {
        await handlePaymentCallback(sessionId)
        return
      }

      // Check for existing session
      const existingSession = getStoredSession(slug)
      if (existingSession) {
        setSessionToken(existingSession.token)
        setVerifiedEmail(existingSession.email)
        setSessionExpiresAt(new Date(existingSession.expiresAt))
        await checkSubscription(existingSession.token)
        return
      }

      // No session, show email input
      setAuthStep('email')
    }

    initialize()
  }, [slug, searchParams])

  // =============================================
  // HANDLE PAYMENT CALLBACK
  // =============================================
  const handlePaymentCallback = async (sessionId: string) => {
    setAuthStep('loading')

    try {
      // Verify payment with Stripe
      const res = await fetch('/api/verify-payment', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ sessionId }),
      })

      const data = await res.json()

      if (data.verified && data.email) {
        // Create a new session for this verified user
        const deviceFingerprint = generateDeviceFingerprint()
        const expiresAt = new Date(Date.now() + SESSION_DURATION_MS)

        // Generate session token
        const tokenRes = await fetch('/api/verify-code', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            email: data.email,
            code: 'PAYMENT_VERIFIED', // Special code for payment verification
            portfolioSlug: slug,
            deviceFingerprint,
            bypassCode: true,
          }),
        })

        // For now, just store a simple session
        const newSession: SessionData = {
          token: sessionId, // Use session ID as token temporarily
          email: data.email,
          slug,
          expiresAt: expiresAt.toISOString(),
          deviceFingerprint,
        }

        storeSession(newSession)
        setSessionToken(sessionId)
        setVerifiedEmail(data.email)
        setSessionExpiresAt(expiresAt)
        setHasAccess(true)

        // Fetch portfolio
        await fetchPortfolio(data.email)
        setAuthStep('authenticated')

        // Clean URL
        window.history.replaceState({}, '', `/u/${slug}/portfolio`)
      } else {
        setAuthStep('email')
      }
    } catch (err) {
      console.error('Payment verification failed:', err)
      setAuthStep('email')
    }
  }

  // =============================================
  // SEND VERIFICATION CODE
  // =============================================
  const sendVerificationCode = async () => {
    if (!email) return

    setIsSendingCode(true)
    setError(null)

    try {
      const res = await fetch('/api/send-verification-code', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: email.toLowerCase().trim(),
          portfolioSlug: slug,
        }),
      })

      const data = await res.json()

      if (!res.ok) {
        throw new Error(data.error || 'Failed to send code')
      }

      setMaskedEmail(data.maskedEmail)
      setCodeExpiresIn(data.expiresIn)
      setAuthStep('code')
    } catch (err: any) {
      setError(err.message)
    } finally {
      setIsSendingCode(false)
    }
  }

  // =============================================
  // VERIFY CODE
  // =============================================
  const verifyCode = async () => {
    if (verificationCode.length !== 6) return

    setIsVerifyingCode(true)
    setError(null)

    try {
      const deviceFingerprint = generateDeviceFingerprint()

      const res = await fetch('/api/verify-code', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: email.toLowerCase().trim(),
          code: verificationCode,
          portfolioSlug: slug,
          deviceFingerprint,
        }),
      })

      const data = await res.json()

      if (!res.ok) {
        throw new Error(data.error || 'Verification failed')
      }

      // Store session
      const session: SessionData = {
        token: data.sessionToken,
        email: email.toLowerCase().trim(),
        slug,
        expiresAt: data.expiresAt,
        deviceFingerprint,
      }

      storeSession(session)
      setSessionToken(data.sessionToken)
      setVerifiedEmail(email.toLowerCase().trim())
      setSessionExpiresAt(new Date(data.expiresAt))

      if (data.hasAccess) {
        setHasAccess(true)
        setSubscription(data.subscription)
        await fetchPortfolio(email)
        setAuthStep('authenticated')
      } else {
        // No subscription, show payment options
        await fetchPortfolio(email) // Fetch limited view
        setAuthStep('payment')
      }
    } catch (err: any) {
      setError(err.message)
      setVerificationCode("")
    } finally {
      setIsVerifyingCode(false)
    }
  }

  // =============================================
  // CHECK SUBSCRIPTION
  // =============================================
  const checkSubscription = async (token: string) => {
    setIsCheckingSubscription(true)

    try {
      const res = await fetch('/api/check-subscription', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          sessionToken: token,
          portfolioSlug: slug,
        }),
      })

      const data = await res.json()

      if (!data.valid) {
        // Session invalid, clear and restart
        clearSession(slug)
        setAuthStep('email')
        return
      }

      setVerifiedEmail(data.email)

      if (data.hasAccess) {
        setHasAccess(true)
        setSubscription(data.subscription)
        await fetchPortfolio(data.email)
        setAuthStep('authenticated')
      } else {
        await fetchPortfolio(data.email)
        setAuthStep('payment')
      }
    } catch (err: any) {
      console.error('Subscription check failed:', err)
      clearSession(slug)
      setAuthStep('email')
    } finally {
      setIsCheckingSubscription(false)
    }
  }

  // =============================================
  // FETCH PORTFOLIO
  // =============================================
  const fetchPortfolio = async (userEmail: string) => {
    try {
      const url = `/api/portfolio-share/public?slug=${slug}&email=${encodeURIComponent(userEmail)}`
      const res = await fetch(url)
      const data = await res.json()

      if (!res.ok) {
        throw new Error(data.error || 'Portfolio not found')
      }

      setPortfolio(data)
    } catch (err: any) {
      setError(err.message)
    }
  }

  // =============================================
  // HANDLE PAYMENT
  // =============================================
  const handlePayment = async (planType: 'one_time' | 'monthly') => {
    setIsProcessingPayment(true)
    setError(null)

    try {
      const res = await fetch('/api/stripe-subscription', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: verifiedEmail,
          portfolioSlug: slug,
          planType,
          sessionToken,
        }),
      })

      const data = await res.json()

      if (data.alreadySubscribed || data.alreadyPaid) {
        setHasAccess(true)
        await fetchPortfolio(verifiedEmail!)
        setAuthStep('authenticated')
        return
      }

      if (data.checkoutUrl) {
        window.location.href = data.checkoutUrl
      }
    } catch (err: any) {
      setError(err.message)
    } finally {
      setIsProcessingPayment(false)
    }
  }

  // =============================================
  // HELPERS
  // =============================================
  const formatCurrency = (value: number | null) => {
    if (value === null) return "—"
    return new Intl.NumberFormat("en-US", { style: "currency", currency: "USD" }).format(value)
  }

  const formatPercent = (value: number | null) => {
    if (value === null) return "—"
    return `${value > 0 ? "+" : ""}${value.toFixed(2)}%`
  }

  const formatTimeRemaining = (seconds: number) => {
    const mins = Math.floor(seconds / 60)
    const secs = seconds % 60
    return `${mins}:${secs.toString().padStart(2, '0')}`
  }

  // =============================================
  // RENDER: Loading
  // =============================================
  if (authStep === 'loading') {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center gap-4">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
        <p className="text-muted-foreground">Loading...</p>
      </div>
    )
  }

  // =============================================
  // RENDER: Email Input
  // =============================================
  if (authStep === 'email') {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-b from-background to-muted/30 p-4">
        <Card className="w-full max-w-md">
          <CardHeader className="text-center">
            <div className="mx-auto mb-4 h-12 w-12 rounded-full bg-primary/10 flex items-center justify-center">
              <Shield className="h-6 w-6 text-primary" />
            </div>
            <CardTitle>Secure Portfolio Access</CardTitle>
            <CardDescription>
              Enter your email to verify your identity
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {error && (
              <div className="p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg flex items-center gap-2 text-red-600 dark:text-red-400 text-sm">
                <AlertTriangle className="h-4 w-4 flex-shrink-0" />
                {error}
              </div>
            )}

            <div className="space-y-2">
              <Label htmlFor="email">Email Address</Label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  id="email"
                  type="email"
                  placeholder="you@example.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && sendVerificationCode()}
                  className="pl-10"
                />
              </div>
            </div>

            <Button
              className="w-full"
              onClick={sendVerificationCode}
              disabled={isSendingCode || !email}
            >
              {isSendingCode ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin mr-2" />
                  Sending Code...
                </>
              ) : (
                <>
                  <Mail className="h-4 w-4 mr-2" />
                  Send Verification Code
                </>
              )}
            </Button>

            <p className="text-xs text-center text-muted-foreground">
              We'll send a 6-digit code to verify your identity.
              <br />
              This protects the portfolio owner's data.
            </p>
          </CardContent>
        </Card>
      </div>
    )
  }

  // =============================================
  // RENDER: Verification Code Input
  // =============================================
  if (authStep === 'code') {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-b from-background to-muted/30 p-4">
        <Card className="w-full max-w-md">
          <CardHeader className="text-center">
            <div className="mx-auto mb-4 h-12 w-12 rounded-full bg-primary/10 flex items-center justify-center">
              <Lock className="h-6 w-6 text-primary" />
            </div>
            <CardTitle>Enter Verification Code</CardTitle>
            <CardDescription>
              We sent a 6-digit code to {maskedEmail}
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            {error && (
              <div className="p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg flex items-center gap-2 text-red-600 dark:text-red-400 text-sm">
                <AlertTriangle className="h-4 w-4 flex-shrink-0" />
                {error}
              </div>
            )}

            <div className="flex justify-center">
              <InputOTP
                maxLength={6}
                value={verificationCode}
                onChange={setVerificationCode}
              >
                <InputOTPGroup>
                  <InputOTPSlot index={0} />
                  <InputOTPSlot index={1} />
                  <InputOTPSlot index={2} />
                  <InputOTPSlot index={3} />
                  <InputOTPSlot index={4} />
                  <InputOTPSlot index={5} />
                </InputOTPGroup>
              </InputOTP>
            </div>

            {codeExpiresIn > 0 && (
              <div className="flex items-center justify-center gap-2 text-sm text-muted-foreground">
                <Clock className="h-4 w-4" />
                Code expires in {formatTimeRemaining(codeExpiresIn)}
              </div>
            )}

            <Button
              className="w-full"
              onClick={verifyCode}
              disabled={isVerifyingCode || verificationCode.length !== 6}
            >
              {isVerifyingCode ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin mr-2" />
                  Verifying...
                </>
              ) : (
                <>
                  <CheckCircle2 className="h-4 w-4 mr-2" />
                  Verify Code
                </>
              )}
            </Button>

            <div className="flex justify-between text-sm">
              <button
                className="text-muted-foreground hover:text-foreground"
                onClick={() => {
                  setAuthStep('email')
                  setVerificationCode("")
                  setError(null)
                }}
              >
                ← Use different email
              </button>
              <button
                className="text-primary hover:underline"
                onClick={sendVerificationCode}
                disabled={isSendingCode}
              >
                Resend code
              </button>
            </div>
          </CardContent>
        </Card>
      </div>
    )
  }

  // =============================================
  // RENDER: Payment Options
  // =============================================
  if (authStep === 'payment') {
    return (
      <div className="min-h-screen bg-gradient-to-b from-background to-muted/30 p-4">
        <div className="container mx-auto max-w-4xl py-8">
          <div className="text-center mb-8">
            <Badge className="mb-4 bg-green-100 text-green-700">
              <CheckCircle2 className="h-3 w-3 mr-1" />
              Email Verified: {verifiedEmail}
            </Badge>
            <h1 className="text-3xl font-bold mb-2">Choose Your Access Plan</h1>
            <p className="text-muted-foreground">
              Get access to {portfolio?.displayName}'s portfolio
            </p>
          </div>

          {error && (
            <div className="mb-6 p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg flex items-center gap-2 text-red-600 dark:text-red-400 text-sm max-w-md mx-auto">
              <AlertTriangle className="h-4 w-4 flex-shrink-0" />
              {error}
            </div>
          )}

          <div className="grid md:grid-cols-2 gap-6 max-w-2xl mx-auto">
            {/* One-Time Plan */}
            <Card className="relative">
              <CardHeader>
                <CardTitle className="flex items-center justify-between">
                  <span>Snapshot</span>
                  <Badge variant="secondary">One-time</Badge>
                </CardTitle>
                <CardDescription>
                  See current portfolio holdings
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="text-center">
                  <span className="text-3xl font-bold">$4.99</span>
                  <span className="text-muted-foreground ml-1">one-time</span>
                </div>

                <ul className="space-y-2 text-sm">
                  <li className="flex items-center gap-2">
                    <CheckCircle2 className="h-4 w-4 text-green-500" />
                    All current holdings
                  </li>
                  <li className="flex items-center gap-2">
                    <CheckCircle2 className="h-4 w-4 text-green-500" />
                    Share quantities & prices
                  </li>
                  <li className="flex items-center gap-2">
                    <CheckCircle2 className="h-4 w-4 text-green-500" />
                    Allocations & gains
                  </li>
                  <li className="flex items-center gap-2 text-muted-foreground">
                    <EyeOff className="h-4 w-4" />
                    Snapshot only (frozen)
                  </li>
                </ul>

                <Button
                  className="w-full"
                  variant="outline"
                  onClick={() => handlePayment('one_time')}
                  disabled={isProcessingPayment}
                >
                  {isProcessingPayment ? (
                    <Loader2 className="h-4 w-4 animate-spin mr-2" />
                  ) : null}
                  Get Snapshot
                </Button>
              </CardContent>
            </Card>

            {/* Monthly Plan */}
            <Card className="relative border-primary">
              <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                <Badge className="bg-primary">🔥 Recommended</Badge>
              </div>
              <CardHeader>
                <CardTitle className="flex items-center justify-between">
                  <span>Live Access</span>
                  <Badge>Monthly</Badge>
                </CardTitle>
                <CardDescription>
                  Real-time updates & alerts
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="text-center">
                  <span className="text-3xl font-bold">$2.99</span>
                  <span className="text-muted-foreground ml-1">/month</span>
                </div>

                <ul className="space-y-2 text-sm">
                  <li className="flex items-center gap-2">
                    <CheckCircle2 className="h-4 w-4 text-green-500" />
                    Everything in Snapshot
                  </li>
                  <li className="flex items-center gap-2">
                    <CheckCircle2 className="h-4 w-4 text-green-500" />
                    <strong>Live portfolio updates</strong>
                  </li>
                  <li className="flex items-center gap-2">
                    <CheckCircle2 className="h-4 w-4 text-green-500" />
                    <strong>Buy/sell alerts</strong>
                  </li>
                  <li className="flex items-center gap-2">
                    <CheckCircle2 className="h-4 w-4 text-green-500" />
                    Cancel anytime
                  </li>
                </ul>

                <Button
                  className="w-full"
                  onClick={() => handlePayment('monthly')}
                  disabled={isProcessingPayment}
                >
                  {isProcessingPayment ? (
                    <Loader2 className="h-4 w-4 animate-spin mr-2" />
                  ) : null}
                  Subscribe Now
                </Button>
              </CardContent>
            </Card>
          </div>

          {/* Limited Preview - MOCK DATA */}
          <Card className="mt-8 max-w-2xl mx-auto">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Eye className="h-5 w-5" />
                Limited Preview
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 gap-4 mb-4">
                <div className="p-4 bg-muted rounded-lg text-center">
                  <p className="text-sm text-muted-foreground">Total Return</p>
                  <p className="text-2xl font-bold text-green-600">+120.47%</p>
                </div>
                <div className="p-4 bg-muted rounded-lg text-center">
                  <p className="text-sm text-muted-foreground">Holdings</p>
                  <p className="text-2xl font-bold">10</p>
                </div>
              </div>

              <div className="relative">
                <div className="absolute inset-0 bg-gradient-to-b from-transparent via-background/50 to-background flex items-end justify-center pb-4 z-10">
                  <Lock className="h-8 w-8 text-muted-foreground" />
                </div>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Symbol</TableHead>
                      <TableHead>Return</TableHead>
                      <TableHead className="text-muted-foreground">Shares</TableHead>
                      <TableHead className="text-muted-foreground">Value</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    <TableRow>
                      <TableCell className="font-medium">NVDA</TableCell>
                      <TableCell className="text-green-600">+285.32%</TableCell>
                      <TableCell className="text-muted-foreground">•••</TableCell>
                      <TableCell className="text-muted-foreground">•••</TableCell>
                    </TableRow>
                    <TableRow>
                      <TableCell className="font-medium">TSLA</TableCell>
                      <TableCell className="text-green-600">+142.18%</TableCell>
                      <TableCell className="text-muted-foreground">•••</TableCell>
                      <TableCell className="text-muted-foreground">•••</TableCell>
                    </TableRow>
                    <TableRow>
                      <TableCell className="font-medium">AAPL</TableCell>
                      <TableCell className="text-green-600">+89.45%</TableCell>
                      <TableCell className="text-muted-foreground">•••</TableCell>
                      <TableCell className="text-muted-foreground">•••</TableCell>
                    </TableRow>
                    <TableRow>
                      <TableCell className="font-medium">GOOGL</TableCell>
                      <TableCell className="text-green-600">+76.21%</TableCell>
                      <TableCell className="text-muted-foreground">•••</TableCell>
                      <TableCell className="text-muted-foreground">•••</TableCell>
                    </TableRow>
                    <TableRow>
                      <TableCell className="font-medium">AMZN</TableCell>
                      <TableCell className="text-green-600">+54.67%</TableCell>
                      <TableCell className="text-muted-foreground">•••</TableCell>
                      <TableCell className="text-muted-foreground">•••</TableCell>
                    </TableRow>
                  </TableBody>
                </Table>
              </div>

              <p className="text-center text-xs text-muted-foreground mt-4">
                + 5 more holdings hidden • Unlock to see all details
              </p>
            </CardContent>
          </Card>
        </div>
      </div>
    )
  }

  // =============================================
  // RENDER: Authenticated - Full Portfolio View
  // =============================================
  if (authStep === 'authenticated' && portfolio) {
    return (
      <div className={`min-h-screen bg-gradient-to-b from-background to-muted/30 transition-all duration-300 ${isBlurred ? 'blur-xl' : ''}`}>
        {/* Security overlay when blurred */}
        {isBlurred && (
          <div className="fixed inset-0 bg-background/80 z-50 flex items-center justify-center">
            <Card className="text-center p-6">
              <Shield className="h-12 w-12 mx-auto mb-4 text-primary" />
              <p className="font-medium">Content Protected</p>
              <p className="text-sm text-muted-foreground">Return to this tab to view</p>
            </Card>
          </div>
        )}

        {/* Watermark */}
        <div
          className="fixed inset-0 pointer-events-none z-40 opacity-[0.03] select-none"
          style={{
            backgroundImage: `repeating-linear-gradient(
              -45deg,
              transparent,
              transparent 100px,
              currentColor 100px,
              currentColor 101px
            )`,
          }}
        >
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="text-2xl font-bold rotate-[-30deg] whitespace-nowrap">
              Licensed to: {verifiedEmail} • Licensed to: {verifiedEmail} • Licensed to: {verifiedEmail}
            </div>
          </div>
        </div>

        <div className="container mx-auto px-4 py-8 max-w-6xl relative z-10">
          {/* Header */}
          <div className="mb-8">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h1 className="text-3xl font-bold">{portfolio.displayName}'s Portfolio</h1>
                <p className="text-muted-foreground">
                  Last updated: {new Date(portfolio.updatedAt).toLocaleDateString()}
                </p>
              </div>
              <div className="flex items-center gap-2">
                <Badge className="bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-300">
                  <Unlock className="h-3 w-3 mr-1" />
                  {subscription?.planType === 'monthly' ? 'Live Access' : 'Full Access'}
                </Badge>
              </div>
            </div>

            {/* Session info */}
            <div className="flex items-center gap-4 text-sm text-muted-foreground">
              <span className="flex items-center gap-1">
                <Mail className="h-3 w-3" />
                {verifiedEmail}
              </span>
              {sessionExpiresAt && (
                <span className="flex items-center gap-1">
                  <Clock className="h-3 w-3" />
                  Session expires: {sessionExpiresAt.toLocaleString()}
                </span>
              )}
              {subscription?.planType === 'monthly' && subscription.currentPeriodEnd && (
                <span className="flex items-center gap-1">
                  <CheckCircle2 className="h-3 w-3 text-green-500" />
                  Renews: {new Date(subscription.currentPeriodEnd).toLocaleDateString()}
                </span>
              )}
            </div>
          </div>

          {/* Summary Cards */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
            <Card>
              <CardContent className="pt-4">
                <div className="flex items-center gap-2 mb-1">
                  <Percent className="h-4 w-4 text-muted-foreground" />
                  <p className="text-sm text-muted-foreground">Total Return</p>
                </div>
                <p className={`text-2xl font-bold ${portfolio.totalGainPercent >= 0 ? "text-green-600" : "text-red-600"}`}>
                  {formatPercent(portfolio.totalGainPercent)}
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="pt-4">
                <div className="flex items-center gap-2 mb-1">
                  <TrendingUp className="h-4 w-4 text-muted-foreground" />
                  <p className="text-sm text-muted-foreground">Today</p>
                </div>
                <p className={`text-2xl font-bold ${portfolio.todayGainPercent >= 0 ? "text-green-600" : "text-red-600"}`}>
                  {formatPercent(portfolio.todayGainPercent)}
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="pt-4">
                <div className="flex items-center gap-2 mb-1">
                  <DollarSign className="h-4 w-4 text-muted-foreground" />
                  <p className="text-sm text-muted-foreground">Portfolio Value</p>
                </div>
                <p className="text-2xl font-bold">
                  {formatCurrency(portfolio.totalValue)}
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="pt-4">
                <div className="flex items-center gap-2 mb-1">
                  <BarChart3 className="h-4 w-4 text-muted-foreground" />
                  <p className="text-sm text-muted-foreground">Cost Basis</p>
                </div>
                <p className="text-2xl font-bold">
                  {formatCurrency(portfolio.totalCost)}
                </p>
              </CardContent>
            </Card>
          </div>

          {/* Holdings Table */}
          <Card>
            <CardHeader>
              <CardTitle>Holdings ({portfolio.holdings.length})</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Symbol</TableHead>
                      <TableHead>Sector</TableHead>
                      <TableHead className="text-right">Shares</TableHead>
                      <TableHead className="text-right">Avg Cost</TableHead>
                      <TableHead className="text-right">Price</TableHead>
                      <TableHead className="text-right">Value</TableHead>
                      <TableHead className="text-right">Gain</TableHead>
                      <TableHead className="text-right">Return</TableHead>
                      <TableHead className="text-right">Allocation</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {portfolio.holdings.map((holding) => (
                      <TableRow key={holding.symbol}>
                        <TableCell className="font-medium">{holding.symbol}</TableCell>
                        <TableCell>
                          <Badge variant="outline" className="text-xs">
                            {holding.sector}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-right">{holding.shares?.toFixed(2)}</TableCell>
                        <TableCell className="text-right">{formatCurrency(holding.avgCost)}</TableCell>
                        <TableCell className="text-right">{formatCurrency(holding.currentPrice)}</TableCell>
                        <TableCell className="text-right font-medium">{formatCurrency(holding.marketValue)}</TableCell>
                        <TableCell className={`text-right ${(holding.totalGain || 0) >= 0 ? "text-green-600" : "text-red-600"}`}>
                          {formatCurrency(holding.totalGain)}
                        </TableCell>
                        <TableCell className={`text-right font-medium ${holding.totalGainPercent >= 0 ? "text-green-600" : "text-red-600"}`}>
                          {formatPercent(holding.totalGainPercent)}
                        </TableCell>
                        <TableCell className="text-right">{holding.allocation?.toFixed(1)}%</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>

              {/* Watermark footer */}
              <div className="mt-6 p-4 bg-muted/30 rounded-lg text-center text-xs text-muted-foreground">
                <Shield className="h-4 w-4 inline mr-1" />
                This data is licensed exclusively to <strong>{verifiedEmail}</strong>.
                <br />
                Unauthorized sharing violates our terms of service.
              </div>
            </CardContent>
          </Card>

          {/* CTA */}
          <Card className="mt-8 border-2 border-primary/20">
            <CardContent className="pt-6">
              <div className="flex flex-col md:flex-row items-center justify-between gap-4">
                <div>
                  <h3 className="text-lg font-semibold mb-1">Want to Track Your Own Portfolio?</h3>
                  <p className="text-muted-foreground">
                    Start tracking your investments with WealthClaude for free
                  </p>
                </div>
                <Link href="/start">
                  <Button size="lg">
                    Get Started Free
                    <ExternalLink className="ml-2 h-4 w-4" />
                  </Button>
                </Link>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    )
  }

  // Fallback
  return null
}
