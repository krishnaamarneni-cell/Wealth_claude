import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import crypto from 'crypto'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

// Max verification attempts per code
const MAX_ATTEMPTS = 5

// Session duration: 24 hours
const SESSION_DURATION_HOURS = 24

function generateSessionToken(): string {
  return crypto.randomBytes(32).toString('hex')
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { email, code, portfolioSlug, deviceFingerprint } = body

    if (!email || !code || !portfolioSlug) {
      return NextResponse.json(
        { error: 'Email, code, and portfolio slug are required' },
        { status: 400 }
      )
    }

    const normalizedEmail = email.toLowerCase().trim()
    const normalizedCode = code.trim()

    // Get the most recent unused code for this email
    const { data: verificationCode, error: codeError } = await supabase
      .from('verification_codes')
      .select('*')
      .eq('email', normalizedEmail)
      .eq('used', false)
      .gt('expires_at', new Date().toISOString())
      .order('created_at', { ascending: false })
      .limit(1)
      .single()

    if (codeError || !verificationCode) {
      // Log failed attempt
      await supabase.from('portfolio_access_logs').insert({
        email: normalizedEmail,
        portfolio_slug: portfolioSlug,
        action: 'verify_failed',
        success: false,
        metadata: { reason: 'No valid code found' }
      })

      return NextResponse.json(
        { error: 'Invalid or expired code. Please request a new one.' },
        { status: 400 }
      )
    }

    // Check max attempts
    if (verificationCode.attempts >= MAX_ATTEMPTS) {
      // Mark code as used (exhausted)
      await supabase
        .from('verification_codes')
        .update({ used: true })
        .eq('id', verificationCode.id)

      await supabase.from('portfolio_access_logs').insert({
        email: normalizedEmail,
        portfolio_slug: portfolioSlug,
        action: 'verify_failed',
        success: false,
        metadata: { reason: 'Max attempts exceeded' }
      })

      return NextResponse.json(
        { error: 'Too many failed attempts. Please request a new code.' },
        { status: 400 }
      )
    }

    // Verify the code
    if (verificationCode.code !== normalizedCode) {
      // Increment attempts
      await supabase
        .from('verification_codes')
        .update({ attempts: verificationCode.attempts + 1 })
        .eq('id', verificationCode.id)

      await supabase.from('portfolio_access_logs').insert({
        email: normalizedEmail,
        portfolio_slug: portfolioSlug,
        action: 'verify_failed',
        success: false,
        metadata: { reason: 'Wrong code', attempts: verificationCode.attempts + 1 }
      })

      const remainingAttempts = MAX_ATTEMPTS - verificationCode.attempts - 1
      return NextResponse.json(
        { error: `Invalid code. ${remainingAttempts} attempts remaining.` },
        { status: 400 }
      )
    }

    // Code is valid! Mark as used
    await supabase
      .from('verification_codes')
      .update({ used: true })
      .eq('id', verificationCode.id)

    // Check if user has active subscription
    const { data: subscription } = await supabase
      .from('portfolio_subscriptions')
      .select('*')
      .eq('email', normalizedEmail)
      .eq('portfolio_slug', portfolioSlug)
      .in('status', ['active', 'trialing'])
      .single()

    // Also check one-time payments
    const { data: oneTimePayment } = await supabase
      .from('portfolio_payments')
      .select('*')
      .eq('email', normalizedEmail)
      .eq('status', 'completed')
      .single()

    const hasAccess = !!subscription || !!oneTimePayment

    // Create session token
    const sessionToken = generateSessionToken()
    const expiresAt = new Date(Date.now() + SESSION_DURATION_HOURS * 60 * 60 * 1000)

    // Get IP from request
    const ip = request.headers.get('x-forwarded-for')?.split(',')[0] || 
               request.headers.get('x-real-ip') || 
               'unknown'

    // Store session
    await supabase.from('portfolio_sessions').insert({
      email: normalizedEmail,
      portfolio_slug: portfolioSlug,
      session_token: sessionToken,
      device_fingerprint: deviceFingerprint || null,
      ip_address: ip,
      expires_at: expiresAt.toISOString(),
    })

    // Log success
    await supabase.from('portfolio_access_logs').insert({
      email: normalizedEmail,
      portfolio_slug: portfolioSlug,
      action: 'verify_success',
      success: true,
      ip_address: ip,
      metadata: { has_access: hasAccess }
    })

    return NextResponse.json({
      success: true,
      verified: true,
      hasAccess,
      sessionToken,
      expiresAt: expiresAt.toISOString(),
      subscription: subscription ? {
        planType: subscription.plan_type,
        status: subscription.status,
        currentPeriodEnd: subscription.current_period_end,
      } : null,
    })

  } catch (error: any) {
    console.error('[verify-code] Error:', error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
