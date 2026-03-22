import { NextRequest, NextResponse } from "next/server"
import { createClient } from "@supabase/supabase-js"
import { Resend } from "resend"

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

const resend = process.env.RESEND_API_KEY ? new Resend(process.env.RESEND_API_KEY) : null

// POST - Send invite email
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { email, firstName, lastName } = body

    if (!email || !firstName) {
      return NextResponse.json(
        { error: "Email and first name required" },
        { status: 400 }
      )
    }

    if (!resend) {
      return NextResponse.json(
        { error: "Email service not configured. Add RESEND_API_KEY to environment." },
        { status: 500 }
      )
    }

    // Create invite record
    const { data: invite, error: inviteError } = await supabase
      .from("assessment_invites")
      .insert({
        email: email.toLowerCase().trim(),
        first_name: firstName.trim(),
        last_name: lastName?.trim() || null
      })
      .select()
      .single()

    if (inviteError) {
      console.error("Error creating invite:", inviteError)
      return NextResponse.json(
        { error: "Failed to create invite" },
        { status: 500 }
      )
    }

    const appUrl = process.env.NEXT_PUBLIC_APP_URL || "https://wealthclaude.com"
    const assessmentLink = `${appUrl}/assessment/start?invite=${invite.invite_token}`
    const fullName = lastName ? `${firstName} ${lastName}` : firstName

    // Send email
    const { error: emailError } = await resend.emails.send({
      from: "WealthClaude <hello@wealthclaude.com>",
      to: email,
      subject: "Your Personal Financial Assessment Invitation",
      html: `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
</head>
<body style="margin: 0; padding: 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; background-color: #f4f4f5;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background-color: #f4f4f5; padding: 40px 20px;">
    <tr>
      <td align="center">
        <table width="600" cellpadding="0" cellspacing="0" style="background-color: #ffffff; border-radius: 12px; overflow: hidden; box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);">
          
          <!-- Header -->
          <tr>
            <td style="background: linear-gradient(135deg, #16a34a 0%, #15803d 100%); padding: 40px; text-align: center;">
              <h1 style="color: #ffffff; margin: 0; font-size: 28px; font-weight: 600;">WealthClaude</h1>
              <p style="color: rgba(255,255,255,0.9); margin: 10px 0 0; font-size: 14px;">Your Path to Financial Clarity</p>
            </td>
          </tr>
          
          <!-- Content -->
          <tr>
            <td style="padding: 40px;">
              <h2 style="color: #18181b; margin: 0 0 20px; font-size: 22px;">Hi ${firstName},</h2>
              
              <p style="color: #3f3f46; font-size: 16px; line-height: 1.6; margin: 0 0 20px;">
                I'd like to better understand your financial situation so I can provide you with personalized advice and a tailored action plan.
              </p>
              
              <p style="color: #3f3f46; font-size: 16px; line-height: 1.6; margin: 0 0 30px;">
                Please take a few minutes to complete this confidential financial assessment. Your responses will help me identify your strengths, areas for improvement, and create a roadmap for achieving your goals.
              </p>
              
              <!-- CTA Button -->
              <table width="100%" cellpadding="0" cellspacing="0">
                <tr>
                  <td align="center" style="padding: 10px 0 30px;">
                    <a href="${assessmentLink}" style="display: inline-block; background-color: #16a34a; color: #ffffff; text-decoration: none; padding: 16px 40px; border-radius: 8px; font-size: 16px; font-weight: 600;">
                      Start Your Assessment →
                    </a>
                  </td>
                </tr>
              </table>
              
              <!-- What to expect -->
              <div style="background-color: #f4f4f5; border-radius: 8px; padding: 24px; margin-bottom: 30px;">
                <h3 style="color: #18181b; margin: 0 0 15px; font-size: 16px;">What to expect:</h3>
                <ul style="color: #3f3f46; font-size: 14px; line-height: 1.8; margin: 0; padding-left: 20px;">
                  <li><strong>Time:</strong> About 10-15 minutes</li>
                  <li><strong>Questions:</strong> Multiple choice about your financial habits</li>
                  <li><strong>Privacy:</strong> Your responses are completely confidential</li>
                  <li><strong>Next step:</strong> I'll review your results and create a personalized plan</li>
                </ul>
              </div>
              
              <p style="color: #3f3f46; font-size: 16px; line-height: 1.6; margin: 0 0 10px;">
                After you complete the assessment, I'll be in touch within 24-48 hours to discuss your results and next steps.
              </p>
              
              <p style="color: #3f3f46; font-size: 16px; line-height: 1.6; margin: 30px 0 0;">
                Best regards,<br>
                <strong style="color: #18181b;">Krishna</strong><br>
                <span style="color: #71717a; font-size: 14px;">WealthClaude Financial Advisory</span>
              </p>
            </td>
          </tr>
          
          <!-- Footer -->
          <tr>
            <td style="background-color: #18181b; padding: 30px; text-align: center;">
              <p style="color: #a1a1aa; font-size: 12px; margin: 0 0 10px;">
                This email was sent to ${email} because you were invited to take a financial assessment.
              </p>
              <p style="color: #71717a; font-size: 12px; margin: 0;">
                © ${new Date().getFullYear()} WealthClaude. All rights reserved.
              </p>
            </td>
          </tr>
          
        </table>
      </td>
    </tr>
  </table>
</body>
</html>
      `
    })

    if (emailError) {
      console.error("Error sending email:", emailError)
      // Still return success since invite was created
      return NextResponse.json({
        success: true,
        invite,
        emailSent: false,
        emailError: emailError.message
      })
    }

    return NextResponse.json({
      success: true,
      invite,
      emailSent: true,
      assessmentLink
    })
  } catch (err) {
    console.error("Invite error:", err)
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Internal server error" },
      { status: 500 }
    )
  }
}

// GET - Get all invites or check invite token
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const token = searchParams.get("token")
    const listAll = searchParams.get("list") === "true"

    if (token) {
      // Verify invite token
      const { data: invite, error } = await supabase
        .from("assessment_invites")
        .select("*")
        .eq("invite_token", token)
        .single()

      if (error || !invite) {
        return NextResponse.json(
          { error: "Invalid invite token" },
          { status: 404 }
        )
      }

      return NextResponse.json(invite)
    }

    if (listAll) {
      // List all invites for admin
      const { data: invites, error } = await supabase
        .from("assessment_invites")
        .select("*")
        .order("invited_at", { ascending: false })
        .limit(100)

      if (error) {
        console.error("Error fetching invites:", error)
        return NextResponse.json(
          { error: "Failed to fetch invites" },
          { status: 500 }
        )
      }

      return NextResponse.json(invites || [])
    }

    return NextResponse.json(
      { error: "Provide token or list=true parameter" },
      { status: 400 }
    )
  } catch (err) {
    console.error("Get invite error:", err)
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    )
  }
}

// PATCH - Update invite status (when user starts/completes assessment)
export async function PATCH(request: NextRequest) {
  try {
    const body = await request.json()
    const { token, action, sessionId } = body

    if (!token || !action) {
      return NextResponse.json(
        { error: "Token and action required" },
        { status: 400 }
      )
    }

    const updates: Record<string, unknown> = {}

    switch (action) {
      case "opened":
        updates.opened_at = new Date().toISOString()
        break
      case "started":
        updates.started_at = new Date().toISOString()
        if (sessionId) updates.session_id = sessionId
        break
      case "completed":
        updates.completed_at = new Date().toISOString()
        if (sessionId) updates.session_id = sessionId
        break
      default:
        return NextResponse.json(
          { error: "Invalid action" },
          { status: 400 }
        )
    }

    const { data, error } = await supabase
      .from("assessment_invites")
      .update(updates)
      .eq("invite_token", token)
      .select()
      .single()

    if (error) {
      console.error("Error updating invite:", error)
      return NextResponse.json(
        { error: "Failed to update invite" },
        { status: 500 }
      )
    }

    return NextResponse.json(data)
  } catch (err) {
    console.error("Update invite error:", err)
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    )
  }
}
