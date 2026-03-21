import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import Stripe from 'stripe'
import { STRIPE_PRICES } from '@/lib/tier-config'

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: '2024-06-20',
})

// Use service role client to bypass RLS
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

// Helper to determine tier from price ID
function getTierFromPriceId(priceId: string): 'pro' | 'premium' | null {
  if (priceId === STRIPE_PRICES.pro.monthly || priceId === STRIPE_PRICES.pro.annual) {
    return 'pro'
  }
  if (priceId === STRIPE_PRICES.premium.monthly || priceId === STRIPE_PRICES.premium.annual) {
    return 'premium'
  }
  return null
}

export async function POST(request: NextRequest) {
  const body = await request.text()
  const signature = request.headers.get('stripe-signature')

  if (!signature) {
    console.error('[stripe-webhook] Missing signature')
    return NextResponse.json({ error: 'Missing signature' }, { status: 400 })
  }

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

  console.log('[stripe-webhook] Received event:', event.type)

  try {
    switch (event.type) {
      // ─── Checkout completed ────────────────────────────────────────────
      case 'checkout.session.completed': {
        const session = event.data.object as Stripe.Checkout.Session
        
        if (session.mode === 'subscription') {
          const userId = session.metadata?.user_id
          const tier = session.metadata?.tier as 'pro' | 'premium'
          const subscriptionId = session.subscription as string

          if (userId && tier) {
            // Get subscription details
            const subscription = await stripe.subscriptions.retrieve(subscriptionId)

            await supabase
              .from('profiles')
              .update({
                tier,
                subscription_id: subscriptionId,
                subscription_status: subscription.status,
                trial_ends_at: subscription.trial_end 
                  ? new Date(subscription.trial_end * 1000).toISOString() 
                  : null,
                current_period_end: new Date(subscription.current_period_end * 1000).toISOString(),
                cancel_at_period_end: subscription.cancel_at_period_end,
                updated_at: new Date().toISOString(),
              })
              .eq('user_id', userId)

            console.log(`[stripe-webhook] ✅ User ${userId} upgraded to ${tier}`)
          }
        }
        break
      }

      // ─── Subscription created ──────────────────────────────────────────
      case 'customer.subscription.created': {
        const subscription = event.data.object as Stripe.Subscription
        const customerId = subscription.customer as string
        const priceId = subscription.items.data[0]?.price.id
        const tier = getTierFromPriceId(priceId)

        if (!tier) {
          console.log('[stripe-webhook] Unknown price ID:', priceId)
          break
        }

        // Find user by Stripe customer ID
        const { data: profile } = await supabase
          .from('profiles')
          .select('user_id')
          .eq('stripe_customer_id', customerId)
          .single()

        if (profile) {
          await supabase
            .from('profiles')
            .update({
              tier,
              subscription_id: subscription.id,
              subscription_status: subscription.status,
              trial_ends_at: subscription.trial_end 
                ? new Date(subscription.trial_end * 1000).toISOString() 
                : null,
              current_period_end: new Date(subscription.current_period_end * 1000).toISOString(),
              cancel_at_period_end: subscription.cancel_at_period_end,
              updated_at: new Date().toISOString(),
            })
            .eq('user_id', profile.user_id)

          console.log(`[stripe-webhook] ✅ Subscription created for user ${profile.user_id}`)
        }
        break
      }

      // ─── Subscription updated ──────────────────────────────────────────
      case 'customer.subscription.updated': {
        const subscription = event.data.object as Stripe.Subscription
        const customerId = subscription.customer as string
        const priceId = subscription.items.data[0]?.price.id
        const tier = getTierFromPriceId(priceId)

        // Find user by Stripe customer ID
        const { data: profile } = await supabase
          .from('profiles')
          .select('user_id')
          .eq('stripe_customer_id', customerId)
          .single()

        if (profile) {
          await supabase
            .from('profiles')
            .update({
              ...(tier && { tier }),
              subscription_status: subscription.status,
              trial_ends_at: subscription.trial_end 
                ? new Date(subscription.trial_end * 1000).toISOString() 
                : null,
              current_period_end: new Date(subscription.current_period_end * 1000).toISOString(),
              cancel_at_period_end: subscription.cancel_at_period_end,
              updated_at: new Date().toISOString(),
            })
            .eq('user_id', profile.user_id)

          console.log(`[stripe-webhook] ✅ Subscription updated for user ${profile.user_id}`)
        }
        break
      }

      // ─── Subscription deleted (canceled or expired) ────────────────────
      case 'customer.subscription.deleted': {
        const subscription = event.data.object as Stripe.Subscription
        const customerId = subscription.customer as string

        // Find user by Stripe customer ID
        const { data: profile } = await supabase
          .from('profiles')
          .select('user_id')
          .eq('stripe_customer_id', customerId)
          .single()

        if (profile) {
          await supabase
            .from('profiles')
            .update({
              tier: 'free',
              subscription_id: null,
              subscription_status: 'canceled',
              trial_ends_at: null,
              current_period_end: null,
              cancel_at_period_end: false,
              updated_at: new Date().toISOString(),
            })
            .eq('user_id', profile.user_id)

          console.log(`[stripe-webhook] ✅ User ${profile.user_id} downgraded to free`)
        }
        break
      }

      // ─── Invoice payment failed ────────────────────────────────────────
      case 'invoice.payment_failed': {
        const invoice = event.data.object as Stripe.Invoice
        const customerId = invoice.customer as string

        // Find user by Stripe customer ID
        const { data: profile } = await supabase
          .from('profiles')
          .select('user_id')
          .eq('stripe_customer_id', customerId)
          .single()

        if (profile) {
          await supabase
            .from('profiles')
            .update({
              subscription_status: 'past_due',
              updated_at: new Date().toISOString(),
            })
            .eq('user_id', profile.user_id)

          console.log(`[stripe-webhook] ⚠️ Payment failed for user ${profile.user_id}`)
        }
        break
      }

      // ─── Trial will end (send reminder) ────────────────────────────────
      case 'customer.subscription.trial_will_end': {
        const subscription = event.data.object as Stripe.Subscription
        const customerId = subscription.customer as string

        // Find user by Stripe customer ID
        const { data: profile } = await supabase
          .from('profiles')
          .select('user_id')
          .eq('stripe_customer_id', customerId)
          .single()

        if (profile) {
          console.log(`[stripe-webhook] 📧 Trial ending soon for user ${profile.user_id}`)
          // TODO: Send email reminder about trial ending
        }
        break
      }

      default:
        console.log(`[stripe-webhook] Unhandled event type: ${event.type}`)
    }

    return NextResponse.json({ received: true })

  } catch (error: any) {
    console.error('[stripe-webhook] Error processing event:', error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
