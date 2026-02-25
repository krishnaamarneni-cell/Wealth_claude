import { createServerClient } from '@supabase/ssr'
import { Resend } from 'resend'
import { NextRequest, NextResponse } from 'next/server'
import { WelcomeEmail } from '@/emails/welcome'
import * as React from 'react'

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

    // Save to Supabase
    const supabase = getSupabase()
    const { error: dbError } = await supabase
      .from('subscribers')
      .upsert({ email }, { onConflict: 'email' })

    if (dbError) {
      console.error('DB error:', dbError)
      return NextResponse.json({ error: 'Subscription failed' }, { status: 500 })
    }

    // Send welcome email
    const resend = new Resend(process.env.RESEND_API_KEY!)
    await resend.emails.send({
      from: 'WealthClaude <noreply@wealthclaude.com>',
      to: [email],
      subject: "You're in — WealthClaude Daily Brief 🎯",
      react: React.createElement(WelcomeEmail, { email }),
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Subscribe error:', error)
    return NextResponse.json({ error: 'Server error' }, { status: 500 })
  }
}
