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
  const body = await request.text()
  const signature = request.headers.get('stripe-signature')!

  let event: Stripe.Event

  try {
    event = stripe.webhooks.constructEvent(
      body,
      signature,
      process.env.STRIPE_WEBHOOK_SECRET!
    )
  } catch (err: any) {
    console.error('[stripe-webhook] Signature verification failed:', err.message)
    return NextResponse.json({ error: 'Invalid signature' }, { status: 400 })
  }

  try {
    switch (event.type) {
      // One-time payment completed
      case 'checkout.session.completed': {
        const session = event.data.object as Stripe.Checkout.Session
        const email = session.metadata?.email || session.customer_email
        const portfolioSlug = session.metadata?.portfolioSlug
        const planType = session.metadata?.planType

        if (!email || !portfolioSlug) {
          console.error('[stripe-webhook] Missing email or portfolioSlug in metadata')
          break
        }

        if (planType === 'one_time') {
          // Update payment status
          await supabase
            .from('portfolio_payments')
            .update({
              status: 'completed',
              stripe_payment_intent: session.payment_intent as string,
              updated_at: new Date().toISOString(),
            })
            .eq('stripe_session_id', session.id)

          // Also create subscription record for tracking
          await supabase.from('portfolio_subscriptions').upsert({
            email: email.toLowerCase(),
            portfolio_slug: portfolioSlug,
            stripe_customer_id: session.customer as string,
            plan_type: 'one_time',
            status: 'active',
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
          }, {
            onConflict: 'email,portfolio_slug',
          })
        }

        // Log the event
        await supabase.from('portfolio_access_logs').insert({
          email: email.toLowerCase(),
          portfolio_slug: portfolioSlug,
          action: 'payment',
          success: true,
          metadata: { 
            plan_type: planType,
            amount: session.amount_total,
            session_id: session.id,
          },
        })

        break
      }

      // Subscription created
      case 'customer.subscription.created': {
        const subscription = event.data.object as Stripe.Subscription
        const customerId = subscription.customer as string
        
        // Get customer email
        const customer = await stripe.customers.retrieve(customerId)
        const email = (customer as Stripe.Customer).email
        const portfolioSlug = subscription.metadata?.portfolioSlug

        if (!email || !portfolioSlug) {
          console.error('[stripe-webhook] Missing email or portfolioSlug')
          break
        }

        await supabase.from('portfolio_subscriptions').upsert({
          email: email.toLowerCase(),
          portfolio_slug: portfolioSlug,
          stripe_customer_id: customerId,
          stripe_subscription_id: subscription.id,
          plan_type: 'monthly',
          status: subscription.status,
          current_period_start: new Date(subscription.current_period_start * 1000).toISOString(),
          current_period_end: new Date(subscription.current_period_end * 1000).toISOString(),
          updated_at: new Date().toISOString(),
        }, {
          onConflict: 'email,portfolio_slug',
        })

        break
      }

      // Subscription updated (renewal, plan change, etc.)
      case 'customer.subscription.updated': {
        const subscription = event.data.object as Stripe.Subscription

        await supabase
          .from('portfolio_subscriptions')
          .update({
            status: subscription.status,
            current_period_start: new Date(subscription.current_period_start * 1000).toISOString(),
            current_period_end: new Date(subscription.current_period_end * 1000).toISOString(),
            updated_at: new Date().toISOString(),
          })
          .eq('stripe_subscription_id', subscription.id)

        break
      }

      // Subscription cancelled or expired
      case 'customer.subscription.deleted': {
        const subscription = event.data.object as Stripe.Subscription

        await supabase
          .from('portfolio_subscriptions')
          .update({
            status: 'cancelled',
            updated_at: new Date().toISOString(),
          })
          .eq('stripe_subscription_id', subscription.id)

        break
      }

      // Payment failed
      case 'invoice.payment_failed': {
        const invoice = event.data.object as Stripe.Invoice
        const subscriptionId = invoice.subscription as string

        if (subscriptionId) {
          await supabase
            .from('portfolio_subscriptions')
            .update({
              status: 'past_due',
              updated_at: new Date().toISOString(),
            })
            .eq('stripe_subscription_id', subscriptionId)
        }

        break
      }
    }

    return NextResponse.json({ received: true })

  } catch (error: any) {
    console.error('[stripe-webhook] Error processing event:', error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
