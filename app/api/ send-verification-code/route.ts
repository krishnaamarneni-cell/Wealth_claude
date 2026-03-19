import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

// Rate limit: 3 codes per email per 15 minutes
const RATE_LIMIT_MAX = 3
const RATE_LIMIT_WINDOW_MINUTES = 15

// Code expires in 10 minutes
const CODE_EXPIRY_MINUTES = 10

function generateCode(): string {
  return Math.floor(100000 + Math.random() * 900000).toString()
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { email, portfolioSlug } = body

    if (!email || !portfolioSlug) {
      return NextResponse.json(
        { error: 'Email and portfolio slug are required' },
        { status: 400 }
      )
    }

    const normalizedEmail = email.toLowerCase().trim()

    // Check rate limit
    const windowStart = new Date(Date.now() - RATE_LIMIT_WINDOW_MINUTES * 60 * 1000)
    
    const { data: recentCodes } = await supabase
      .from('verification_codes')
      .select('id')
      .eq('email', normalizedEmail)
      .gte('created_at', windowStart.toISOString())

    if (recentCodes && recentCodes.length >= RATE_LIMIT_MAX) {
      // Log the attempt
      await supabase.from('portfolio_access_logs').insert({
        email: normalizedEmail,
        portfolio_slug: portfolioSlug,
        action: 'rate_limited',
        success: false,
        metadata: { reason: 'Too many verification code requests' }
      })

      return NextResponse.json(
        { error: 'Too many requests. Please try again in 15 minutes.' },
        { status: 429 }
      )
    }

    // Generate new code
    const code = generateCode()
    const expiresAt = new Date(Date.now() + CODE_EXPIRY_MINUTES * 60 * 1000)

    // Store code in database
    await supabase.from('verification_codes').insert({
      email: normalizedEmail,
      code,
      expires_at: expiresAt.toISOString(),
    })

    // Send email with code
    // Option 1: Use Resend
    if (process.env.RESEND_API_KEY) {
      const res = await fetch('https://api.resend.com/emails', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${process.env.RESEND_API_KEY}`,
        },
        body: JSON.stringify({
          from: process.env.EMAIL_FROM || 'WealthClaude <noreply@wealthclaude.com>',
          to: normalizedEmail,
          subject: 'Your WealthClaude Verification Code',
          html: `
            <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
              <h2 style="color: #22c55e;">WealthClaude Portfolio Access</h2>
              <p>Your verification code is:</p>
              <div style="background: #f4f4f4; padding: 20px; text-align: center; font-size: 32px; font-weight: bold; letter-spacing: 8px; margin: 20px 0;">
                ${code}
              </div>
              <p style="color: #666;">This code expires in ${CODE_EXPIRY_MINUTES} minutes.</p>
              <p style="color: #666;">If you didn't request this code, you can safely ignore this email.</p>
              <hr style="border: none; border-top: 1px solid #eee; margin: 20px 0;">
              <p style="color: #999; font-size: 12px;">WealthClaude - Track Your Path to Financial Independence</p>
            </div>
          `,
        }),
      })

      if (!res.ok) {
        console.error('[send-verification-code] Failed to send email:', await res.text())
        return NextResponse.json(
          { error: 'Failed to send verification code' },
          { status: 500 }
        )
      }
    } else {
      // Fallback: Log the code (for development)
      console.log(`[DEV] Verification code for ${normalizedEmail}: ${code}`)
    }

    // Log the attempt
    await supabase.from('portfolio_access_logs').insert({
      email: normalizedEmail,
      portfolio_slug: portfolioSlug,
      action: 'send_code',
      success: true,
    })

    // Mask email for response
    const maskedEmail = normalizedEmail.replace(
      /^(.{2})(.*)(@.*)$/,
      (_, start, middle, end) => start + '*'.repeat(Math.min(middle.length, 5)) + end
    )

    return NextResponse.json({
      success: true,
      message: `Verification code sent to ${maskedEmail}`,
      maskedEmail,
      expiresIn: CODE_EXPIRY_MINUTES * 60, // seconds
    })

  } catch (error: any) {
    console.error('[send-verification-code] Error:', error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
