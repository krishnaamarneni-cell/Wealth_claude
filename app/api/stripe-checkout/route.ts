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

const PRICE_CENTS = 50 // $29.00

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { email, portfolioId, slug } = body

    if (!email || !portfolioId || !slug) {
      return NextResponse.json(
        { error: 'Email, portfolioId, and slug are required' },
        { status: 400 }
      )
    }

    // Check if user already has access
    const { data: existingPayment } = await supabase
      .from('portfolio_payments')
      .select('id')
      .eq('portfolio_id', portfolioId)
      .eq('email', email.toLowerCase())
      .eq('status', 'completed')
      .single()

    if (existingPayment) {
      return NextResponse.json({
        alreadyPaid: true,
        message: 'You already have access to this portfolio'
      })
    }

    // Get portfolio info for checkout description
    const { data: portfolio } = await supabase
      .from('public_portfolios')
      .select('display_name')
      .eq('id', portfolioId)
      .single()

    // Create Stripe checkout session
    const session = await stripe.checkout.sessions.create({
      payment_method_types: ['card'],
      line_items: [
        {
          price_data: {
            currency: 'usd',
            product_data: {
              name: `${portfolio?.display_name || 'Portfolio'} - Full Access`,
              description: 'Lifetime access to view complete portfolio holdings, allocations, and returns',
            },
            unit_amount: PRICE_CENTS,
          },
          quantity: 1,
        },
      ],
      mode: 'payment',
      success_url: `${process.env.NEXT_PUBLIC_APP_URL}/u/${slug}/portfolio?success=true&email=${encodeURIComponent(email)}`,
      cancel_url: `${process.env.NEXT_PUBLIC_APP_URL}/u/${slug}/portfolio?canceled=true`,
      customer_email: email,
      metadata: {
        portfolioId,
        email: email.toLowerCase(),
        slug,
      },
    })

    // Create pending payment record
    await supabase.from('portfolio_payments').insert({
      email: email.toLowerCase(),
      portfolio_id: portfolioId,
      stripe_session_id: session.id,
      amount_paid: PRICE_CENTS,
      status: 'pending',
    })

    return NextResponse.json({
      checkoutUrl: session.url,
      sessionId: session.id,
    })

  } catch (error: any) {
    console.error('[stripe-checkout] Error:', error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
