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

  const supabase = getSupabase()
  const { error: dbError } = await supabase
    .from('subscribers')
    .upsert({ email }, { onConflict: 'email' })

  if (dbError) {
    return NextResponse.json({ error: 'Subscription failed' }, { status: 500 })
  }

  try {
    await resend.emails.send({
      from: 'WealthClaude <noreply@wealthclaude.com>',
      to: [email],
      subject: "You're In! 🎯 WealthClaude Daily Brief",
      react: React.createElement(WelcomeEmail, { email }),
    })
  } catch (e) {
    console.error('Email error:', e)
  }

  return NextResponse.json({ success: true })
}
