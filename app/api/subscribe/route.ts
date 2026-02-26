import { createServerClient } from '@supabase/ssr'
import { NextRequest, NextResponse } from 'next/server'
import * as React from 'react'
import { Resend } from 'resend'
import { WelcomeEmail } from '@/emails/welcome'

const resend = new Resend(process.env.RESEND_API_KEY)

function getSupabase() {
  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    { cookies: { getAll: () => [], setAll: () => { } } }
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
      return NextResponse.json({ error: 'Subscription failed' }, { status: 500 })
    }

    // ✅ Email wrapped in try/catch — never breaks subscription
    try {
      await resend.emails.send({
        from: 'WealthClaude <noreply@wealthclaude.com>',
        to: [email],
        subject: "You're in — WealthClaude Daily Brief 🎯",
        react: React.createElement(WelcomeEmail, { email }),
      })
      console.log('✅ Email sent to:', email)
    } catch (emailError) {
      console.error('❌ Email error:', emailError)
      // Don't return error — subscription already saved!
    }

    return NextResponse.json({ success: true }) // ✅ Always returns success
  } catch (error) {
    console.error('Subscribe error:', error)
    return NextResponse.json({ error: 'Server error' }, { status: 500 })
  }
}
