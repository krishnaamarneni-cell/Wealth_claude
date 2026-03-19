import { NextRequest, NextResponse } from 'next/server'
import Stripe from 'stripe'
import { createClient } from '@supabase/supabase-js'

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: '2023-10-16',
})

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { sessionId } = body

    if (!sessionId) {
      return NextResponse.json(
        { error: 'Session ID is required' },
        { status: 400 }
      )
    }

    // Retrieve the session from Stripe
    const session = await stripe.checkout.sessions.retrieve(sessionId)

    if (session.payment_status === 'paid') {
      const email = session.customer_email || session.metadata?.email
      const portfolioSlug = session.metadata?.portfolioSlug
      const planType = session.metadata?.planType

      // Update payment record in database
      if (planType === 'one_time') {
        await supabase
          .from('portfolio_payments')
          .update({
            status: 'completed',
            stripe_payment_intent: session.payment_intent as string,
            updated_at: new Date().toISOString(),
          })
          .eq('stripe_session_id', sessionId)
      }

      // Create or update subscription record
      if (email && portfolioSlug) {
        await supabase.from('portfolio_subscriptions').upsert({
          email: email.toLowerCase(),
          portfolio_slug: portfolioSlug,
          stripe_customer_id: session.customer as string,
          plan_type: planType || 'one_time',
          status: 'active',
          updated_at: new Date().toISOString(),
        }, {
          onConflict: 'email,portfolio_slug',
        })
      }

      return NextResponse.json({
        verified: true,
        email: email?.toLowerCase(),
        portfolioSlug,
        planType,
      })
    } else {
      return NextResponse.json({
        verified: false,
        status: session.payment_status,
      })
    }

  } catch (error: any) {
    console.error('[verify-payment] Error:', error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
