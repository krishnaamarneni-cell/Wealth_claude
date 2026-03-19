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

// Pricing
const PRICES = {
  one_time: 499, // $4.99
  monthly: 299,  // $2.99/month
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { email, portfolioSlug, planType, sessionToken } = body

    if (!email || !portfolioSlug || !planType) {
      return NextResponse.json(
        { error: 'Email, portfolio slug, and plan type are required' },
        { status: 400 }
      )
    }

    if (!['one_time', 'monthly'].includes(planType)) {
      return NextResponse.json(
        { error: 'Invalid plan type. Must be "one_time" or "monthly".' },
        { status: 400 }
      )
    }

    const normalizedEmail = email.toLowerCase().trim()

    // Verify session token if provided
    if (sessionToken) {
      const { data: session } = await supabase
        .from('portfolio_sessions')
        .select('email')
        .eq('session_token', sessionToken)
        .eq('portfolio_slug', portfolioSlug)
        .gt('expires_at', new Date().toISOString())
        .single()

      if (session && session.email !== normalizedEmail) {
        return NextResponse.json(
          { error: 'Email does not match verified session' },
          { status: 400 }
        )
      }
    }

    // Check if user already has access
    const { data: existingSubscription } = await supabase
      .from('portfolio_subscriptions')
      .select('*')
      .eq('email', normalizedEmail)
      .eq('portfolio_slug', portfolioSlug)
      .in('status', ['active', 'trialing'])
      .single()

    if (existingSubscription) {
      return NextResponse.json({
        alreadySubscribed: true,
        message: 'You already have an active subscription',
        subscription: existingSubscription,
      })
    }

    // Check for existing one-time payment
    const { data: existingPayment } = await supabase
      .from('portfolio_payments')
      .select('*')
      .eq('email', normalizedEmail)
      .eq('status', 'completed')
      .single()

    if (existingPayment) {
      return NextResponse.json({
        alreadyPaid: true,
        message: 'You already have lifetime access',
      })
    }

    // Get or create Stripe customer
    let customerId: string

    const existingCustomers = await stripe.customers.list({
      email: normalizedEmail,
      limit: 1,
    })

    if (existingCustomers.data.length > 0) {
      customerId = existingCustomers.data[0].id
    } else {
      const customer = await stripe.customers.create({
        email: normalizedEmail,
        metadata: {
          portfolio_slug: portfolioSlug,
        },
      })
      customerId = customer.id
    }

    const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://wealthclaude.com'

    if (planType === 'monthly') {
      // Create a product and price for subscription
      const product = await stripe.products.create({
        name: `Portfolio Access - Monthly`,
        description: 'Live updates, buy/sell alerts, and monthly insights',
      })

      const price = await stripe.prices.create({
        product: product.id,
        unit_amount: PRICES.monthly,
        currency: 'usd',
        recurring: {
          interval: 'month',
        },
      })

      // Create subscription checkout session
      const session = await stripe.checkout.sessions.create({
        customer: customerId,
        payment_method_types: ['card'],
        line_items: [
          {
            price: price.id,
            quantity: 1,
          },
        ],
        mode: 'subscription',
        success_url: `${baseUrl}/u/${portfolioSlug}/portfolio?subscription_success=true&session_id={CHECKOUT_SESSION_ID}`,
        cancel_url: `${baseUrl}/u/${portfolioSlug}/portfolio?canceled=true`,
        metadata: {
          email: normalizedEmail,
          portfolioSlug,
          planType: 'monthly',
        },
        subscription_data: {
          metadata: {
            email: normalizedEmail,
            portfolioSlug,
          },
        },
      })

      return NextResponse.json({
        checkoutUrl: session.url,
        sessionId: session.id,
        planType: 'monthly',
      })

    } else {
      // One-time payment
      const session = await stripe.checkout.sessions.create({
        customer: customerId,
        payment_method_types: ['card'],
        line_items: [
          {
            price_data: {
              currency: 'usd',
              product_data: {
                name: 'Portfolio Access - Lifetime Snapshot',
                description: 'One-time access to current portfolio holdings',
              },
              unit_amount: PRICES.one_time,
            },
            quantity: 1,
          },
        ],
        mode: 'payment',
        success_url: `${baseUrl}/u/${portfolioSlug}/portfolio?payment_success=true&session_id={CHECKOUT_SESSION_ID}`,
        cancel_url: `${baseUrl}/u/${portfolioSlug}/portfolio?canceled=true`,
        metadata: {
          email: normalizedEmail,
          portfolioSlug,
          planType: 'one_time',
        },
      })

      // Store pending payment
      await supabase.from('portfolio_payments').insert({
        email: normalizedEmail,
        portfolio_id: portfolioSlug,
        stripe_session_id: session.id,
        amount_paid: PRICES.one_time,
        plan_type: 'one_time',
        status: 'pending',
      })

      return NextResponse.json({
        checkoutUrl: session.url,
        sessionId: session.id,
        planType: 'one_time',
      })
    }

  } catch (error: any) {
    console.error('[stripe-subscription] Error:', error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
