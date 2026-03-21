import { NextRequest, NextResponse } from 'next/server'
import { cookies } from 'next/headers'
import { createServerSideClient } from '@/lib/supabase'
import Stripe from 'stripe'
import { getPriceId, getTrialDays, BillingInterval } from '@/lib/tier-config'

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: '2024-06-20',
})

export async function POST(request: NextRequest) {
  try {
    const cookieStore = await cookies()
    const supabase = createServerSideClient(cookieStore)

    // Get authenticated user
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Parse request body
    const body = await request.json()
    const { tier, interval } = body as { tier: 'pro' | 'premium'; interval: BillingInterval }

    if (!tier || !['pro', 'premium'].includes(tier)) {
      return NextResponse.json({ error: 'Invalid tier' }, { status: 400 })
    }

    if (!interval || !['monthly', 'annual'].includes(interval)) {
      return NextResponse.json({ error: 'Invalid interval' }, { status: 400 })
    }

    // Get user's profile to check for existing Stripe customer
    const { data: profile } = await supabase
      .from('profiles')
      .select('stripe_customer_id, full_name')
      .eq('user_id', user.id)
      .single()

    let customerId = profile?.stripe_customer_id

    // Create Stripe customer if doesn't exist
    if (!customerId) {
      const customer = await stripe.customers.create({
        email: user.email,
        name: profile?.full_name || undefined,
        metadata: {
          user_id: user.id,
        },
      })
      customerId = customer.id

      // Save customer ID to profile
      await supabase
        .from('profiles')
        .update({ stripe_customer_id: customerId })
        .eq('user_id', user.id)
    }

    // Get the price ID
    const priceId = getPriceId(tier, interval)
    
    // Determine trial days (only for Pro monthly)
    const trialDays = tier === 'pro' && interval === 'monthly' ? getTrialDays('pro') : 0

    // Create checkout session
    const session = await stripe.checkout.sessions.create({
      customer: customerId,
      mode: 'subscription',
      payment_method_types: ['card'],
      line_items: [
        {
          price: priceId,
          quantity: 1,
        },
      ],
      ...(trialDays > 0 && {
        subscription_data: {
          trial_period_days: trialDays,
        },
      }),
      success_url: `${process.env.NEXT_PUBLIC_APP_URL}/dashboard?upgrade=success&tier=${tier}`,
      cancel_url: `${process.env.NEXT_PUBLIC_APP_URL}/dashboard?upgrade=canceled`,
      metadata: {
        user_id: user.id,
        tier,
        interval,
      },
      allow_promotion_codes: true,
    })

    console.log('[create-subscription] ✅ Created checkout session:', session.id)

    return NextResponse.json({ 
      url: session.url,
      sessionId: session.id,
    })

  } catch (error: any) {
    console.error('[create-subscription] Error:', error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
