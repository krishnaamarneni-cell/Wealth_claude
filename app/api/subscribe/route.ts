import { createServerClient } from '@supabase/ssr'
import { NextRequest, NextResponse } from 'next/server'
import * as React from 'react'  // ✅ Added for React emails

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

    const { error: dbError } = await supabase
      .from('subscribers')
      .upsert({ email }, { onConflict: 'email' })

    if (dbError) {
      console.error('DB error:', dbError)
      return NextResponse.json({ error: 'Subscription failed' }, { status: 500 })
    }

    // Send beautiful React email  
    console.log('🔍 RESEND_API_KEY exists:', !!process.env.RESEND_API_KEY)
    if (process.env.RESEND_API_KEY) {
      try {
        console.log('🔍 Importing Resend...')
        const { Resend } = await import('resend')
        const { WelcomeEmail } = await import('@/emails/welcome')
        const resend = new Resend(process.env.RESEND_API_KEY)

        console.log('🔍 Sending to:', email)

        await resend.emails.send({
          from: 'WealthClaude <noreply@wealthclaude.com>',
          to: [email],
          subject: "You're In! 🎯 WealthClaude Daily Brief",
          react: React.createElement(WelcomeEmail, { email }),
        })

        console.log(`✅ Welcome email sent to ${email}`)
      } catch (emailError) {
        console.error('❌ EMAIL ERROR:', emailError)  // Shows exact problem!
      }
    } else {
      console.log('⚠️ No RESEND_API_KEY')
    }


    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Subscribe error:', error)
    return NextResponse.json({ error: 'Server error' }, { status: 500 })
  }
}
