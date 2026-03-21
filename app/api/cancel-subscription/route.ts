import { NextRequest, NextResponse } from 'next/server'
import { cookies } from 'next/headers'
import { createServerSideClient } from '@/lib/supabase'
import Stripe from 'stripe'

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

    // Get user's subscription ID from profile
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('subscription_id')
      .eq('user_id', user.id)
      .single()

    if (profileError || !profile?.subscription_id) {
      return NextResponse.json({ error: 'No active subscription found' }, { status: 400 })
    }

    // Cancel at period end (user keeps access until paid period ends)
    const subscription = await stripe.subscriptions.update(profile.subscription_id, {
      cancel_at_period_end: true,
    })

    // Update profile
    await supabase
      .from('profiles')
      .update({
        cancel_at_period_end: true,
        updated_at: new Date().toISOString(),
      })
      .eq('user_id', user.id)

    console.log('[cancel-subscription] ✅ Subscription will cancel at period end:', subscription.id)

    return NextResponse.json({
      success: true,
      cancelAt: subscription.cancel_at,
      currentPeriodEnd: subscription.current_period_end,
    })

  } catch (error: any) {
    console.error('[cancel-subscription] Error:', error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}

// Resume a canceled subscription (undo cancel)
export async function DELETE(request: NextRequest) {
  try {
    const cookieStore = await cookies()
    const supabase = createServerSideClient(cookieStore)

    // Get authenticated user
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Get user's subscription ID from profile
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('subscription_id')
      .eq('user_id', user.id)
      .single()

    if (profileError || !profile?.subscription_id) {
      return NextResponse.json({ error: 'No subscription found' }, { status: 400 })
    }

    // Resume subscription (undo cancel at period end)
    const subscription = await stripe.subscriptions.update(profile.subscription_id, {
      cancel_at_period_end: false,
    })

    // Update profile
    await supabase
      .from('profiles')
      .update({
        cancel_at_period_end: false,
        updated_at: new Date().toISOString(),
      })
      .eq('user_id', user.id)

    console.log('[cancel-subscription] ✅ Subscription resumed:', subscription.id)

    return NextResponse.json({
      success: true,
      message: 'Subscription resumed',
    })

  } catch (error: any) {
    console.error('[cancel-subscription] Error:', error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
