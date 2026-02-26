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

    // Email sending is optional - skip if Resend API key is not configured
    if (process.env.RESEND_API_KEY) {
      try {
        const { Resend } = await import('resend')
        const resend = new Resend(process.env.RESEND_API_KEY)

        // Attempt to send welcome email, but don't fail if it doesn't work
        await resend.emails.send({
          from: 'WealthClaude <noreply@wealthclaude.com>',
          to: [email],
          subject: "You're in — WealthClaude Daily Brief 🎯",
          html: `<p>Welcome to WealthClaude! You've been subscribed to receive daily insights.</p>`,
        }).catch((err) => {
          console.warn('Email send failed (non-critical):', err)
        })
      } catch (emailError) {
        console.warn('Email service not available (non-critical):', emailError)
      }
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Subscribe error:', error)
    return NextResponse.json({ error: 'Server error' }, { status: 500 })
  }
}

