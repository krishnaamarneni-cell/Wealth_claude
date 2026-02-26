import { createServerClient } from '@supabase/ssr'
import { NextRequest, NextResponse } from 'next/server'

function getSupabase() {
  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll: () => [],
        setAll: () => { },
      },
    }
  )
}

export async function POST(request: NextRequest) {
  try {
    const { email } = await request.json()

    if (!email || !email.includes('@')) {
      return NextResponse.json({ error: 'Valid email required' }, { status: 400 })
    }

    const supabase = getSupabase()
    const { error } = await supabase
      .from('subscribers')
      .upsert({ email }, { onConflict: 'email' })

    if (error) {
      console.error('Subscribe error:', error)
      return NextResponse.json({ error: 'Subscription failed' }, { status: 500 })
    }

    if (process.env.RESEND_API_KEY) {
      try {
        const { Resend } = await import('resend')
        const resend = new Resend(process.env.RESEND_API_KEY)

        await resend.emails.send({
          from: 'WealthClaude <noreply@wealthclaude.com>',
          to: [email],
          subject: "You're in — WealthClaude Daily Brief 🎯",
          headers: {
            'X-Entity-Ref-ID': email,
          },
          // ✅ Use your Resend template
          react: undefined,
          html: undefined,
          templateId: 'daily-market-brief',  // ← PASTE YOUR TEMPLATE ID HERE
          variables: {
            email: email,
          },
        } as any)
      } catch (emailError) {
        console.warn('Email send failed:', emailError)
      }
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Subscribe error:', error)
    return NextResponse.json({ error: 'Server error' }, { status: 500 })
  }
}
