import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import Stripe from 'stripe'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: '2023-10-16',
})

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { sessionToken, portfolioSlug } = body

    if (!sessionToken || !portfolioSlug) {
      return NextResponse.json(
        { error: 'Session token and portfolio slug are required' },
        { status: 400 }
      )
    }

    // Validate session token
    const { data: session, error: sessionError } = await supabase
      .from('portfolio_sessions')
      .select('*')
      .eq('session_token', sessionToken)
      .eq('portfolio_slug', portfolioSlug)
      .gt('expires_at', new Date().toISOString())
      .single()

    if (sessionError || !session) {
      return NextResponse.json({
        valid: false,
        error: 'Session expired or invalid. Please verify your email again.',
      }, { status: 401 })
    }

    // Update last accessed time
    await supabase
      .from('portfolio_sessions')
      .update({ last_accessed_at: new Date().toISOString() })
      .eq('id', session.id)

    const email = session.email

    // Check subscription in database
    const { data: subscription } = await supabase
      .from('portfolio_subscriptions')
      .select('*')
      .eq('email', email)
      .eq('portfolio_slug', portfolioSlug)
      .single()

    // If monthly subscription, verify with Stripe
    if (subscription?.stripe_subscription_id && subscription.plan_type === 'monthly') {
      try {
        const stripeSubscription = await stripe.subscriptions.retrieve(
          subscription.stripe_subscription_id
        )

        const isActive = ['active', 'trialing'].includes(stripeSubscription.status)

        // Update database if status changed
        if (subscription.status !== stripeSubscription.status) {
          await supabase
            .from('portfolio_subscriptions')
            .update({
              status: stripeSubscription.status,
              current_period_end: new Date(stripeSubscription.current_period_end * 1000).toISOString(),
              updated_at: new Date().toISOString(),
            })
            .eq('id', subscription.id)
        }

        return NextResponse.json({
          valid: true,
          hasAccess: isActive,
          email,
          subscription: {
            planType: 'monthly',
            status: stripeSubscription.status,
            currentPeriodEnd: new Date(stripeSubscription.current_period_end * 1000).toISOString(),
            cancelAtPeriodEnd: stripeSubscription.cancel_at_period_end,
          },
        })
      } catch (stripeError: any) {
        console.error('[check-subscription] Stripe error:', stripeError.message)
        // Fall back to database status
      }
    }

    // Check one-time payment
    const { data: oneTimePayment } = await supabase
      .from('portfolio_payments')
      .select('*')
      .eq('email', email)
      .eq('status', 'completed')
      .single()

    if (oneTimePayment) {
      return NextResponse.json({
        valid: true,
        hasAccess: true,
        email,
        subscription: {
          planType: 'one_time',
          status: 'lifetime',
          purchasedAt: oneTimePayment.created_at,
        },
      })
    }

    // Check if subscription exists and is active
    if (subscription && ['active', 'trialing'].includes(subscription.status)) {
      return NextResponse.json({
        valid: true,
        hasAccess: true,
        email,
        subscription: {
          planType: subscription.plan_type,
          status: subscription.status,
          currentPeriodEnd: subscription.current_period_end,
        },
      })
    }

    // Session valid but no active subscription
    return NextResponse.json({
      valid: true,
      hasAccess: false,
      email,
      subscription: null,
    })

  } catch (error: any) {
    console.error('[check-subscription] Error:', error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
