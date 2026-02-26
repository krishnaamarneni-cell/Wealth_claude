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
  const { email } = await request.json()

  if (!email || !email.includes('@')) {
    return NextResponse.json({ error: 'Invalid email' }, { status: 400 })
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

  // Send email — wrapped so it never breaks subscription
  try {
    const result = await resend.emails.send({
      from: 'WealthClaude <noreply@wealthclaude.com>',
      to: [email],
      subject: "You're In! 🎯 WealthClaude Daily Brief",
      react: React.createElement(WelcomeEmail, { email }),
    })
    console.log('✅ Email sent:', result.data?.id)
  } catch (emailError) {
    console.error('❌ Email error:', emailError) // ← Shows exact Resend error
  }

  return NextResponse.json({ success: true }) // ✅ Always succeeds if DB saves
}
