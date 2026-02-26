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
          html: `
            <div style="max-width:600px;margin:0 auto;padding:40px 24px;background:#0a0a0a;font-family:Arial,sans-serif;">
              <div style="text-align:center;margin-bottom:32px;">
                <div style="display:inline-block;background:#22c55e;padding:14px 28px;border-radius:20px;">
                  <h1 style="color:#fff;font-size:28px;font-weight:900;margin:0;">WealthClaude</h1>
                </div>
                <p style="color:#94a3b8;margin:10px 0 0;">AI-Powered Market Intelligence</p>
              </div>
              <div style="border:1px solid rgba(34,197,94,0.3);border-radius:20px;padding:36px;margin-bottom:28px;">
                <h2 style="color:#fff;font-size:26px;text-align:center;margin:0 0 16px;">You're In! 🎯</h2>
                <p style="color:#94a3b8;font-size:15px;line-height:1.7;text-align:center;">
                  Every morning at <strong style="color:#22c55e;">7AM EST</strong> you'll receive our AI-powered market brief.
                </p>
                <table width="100%" cellpadding="0" cellspacing="0" style="margin:24px 0;">
                  <tr>
                    <td style="background:rgba(255,255,255,0.05);border-radius:12px;padding:16px;width:48%;">
                      <div style="font-size:22px;">📈</div>
                      <div style="color:#fff;font-weight:600;margin-top:6px;">Market Movers</div>
                    </td>
                    <td width="4%"></td>
                    <td style="background:rgba(255,255,255,0.05);border-radius:12px;padding:16px;width:48%;">
                      <div style="font-size:22px;">🤖</div>
                      <div style="color:#fff;font-weight:600;margin-top:6px;">AI Analysis</div>
                    </td>
                  </tr>
                  <tr><td colspan="3" height="12"></td></tr>
                  <tr>
                    <td style="background:rgba(255,255,255,0.05);border-radius:12px;padding:16px;">
                      <div style="font-size:22px;">💡</div>
                      <div style="color:#fff;font-weight:600;margin-top:6px;">Trade Insights</div>
                    </td>
                    <td width="4%"></td>
                    <td style="background:rgba(255,255,255,0.05);border-radius:12px;padding:16px;">
                      <div style="font-size:22px;">⚡</div>
                      <div style="color:#fff;font-weight:600;margin-top:6px;">Real-Time Alerts</div>
                    </td>
                  </tr>
                </table>
                <div style="text-align:center;">
                  <a href="https://wealthclaude.com/news"
                    style="display:inline-block;background:#22c55e;color:#000;padding:14px 36px;border-radius:12px;text-decoration:none;font-weight:800;font-size:15px;">
                    Read Today's Brief →
                  </a>
                </div>
              </div>
              <p style="color:#475569;font-size:12px;text-align:center;margin:0;">
                WealthClaude · <a href="https://wealthclaude.com" style="color:#64748b;">wealthclaude.com</a> · 
                <a href="#" style="color:#64748b;">Unsubscribe</a>
              </p>
            </div>
          `,
        }).catch((err) => {
          console.warn('Email send failed:', err)
        })
      } catch (emailError) {
        console.warn('Email service not available:', emailError)
      }
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Subscribe error:', error)
    return NextResponse.json({ error: 'Server error' }, { status: 500 })
  }
}
