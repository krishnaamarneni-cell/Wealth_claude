import { NextRequest, NextResponse } from "next/server"
import { createClient } from "@supabase/supabase-js"
import { Resend } from "resend"

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

const resend = new Resend(process.env.RESEND_API_KEY)

// POST - Share plan with client via email
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { sessionId, planId } = body

    if (!sessionId || !planId) {
      return NextResponse.json(
        { error: "Session ID and Plan ID required" },
        { status: 400 }
      )
    }

    // Get session
    const { data: session, error: sessionError } = await supabase
      .from("assessment_sessions")
      .select("*")
      .eq("id", sessionId)
      .single()

    if (sessionError || !session) {
      return NextResponse.json(
        { error: "Session not found" },
        { status: 404 }
      )
    }

    // Get plan
    const { data: plan, error: planError } = await supabase
      .from("financial_plans")
      .select("*")
      .eq("id", planId)
      .single()

    if (planError || !plan) {
      return NextResponse.json(
        { error: "Plan not found" },
        { status: 404 }
      )
    }

    // Get results
    const { data: result } = await supabase
      .from("assessment_results")
      .select("overall_score, personality_type")
      .eq("session_id", sessionId)
      .single()

    // Parse goals and action items
    const goals = plan.goals as Array<{ goal: string; target: string; timeline: string; type: string }>
    const shortTermGoals = goals.filter((g) => g.type === "short_term")
    const mediumTermGoals = goals.filter((g) => g.type === "medium_term")
    const actionItems = plan.action_items as Array<{ action: string }>

    let recommendations: Array<{ area: string; advice: string }> = []
    let warnings: string[] = []
    
    try {
      recommendations = JSON.parse(plan.ai_recommendations || "[]")
      warnings = JSON.parse(plan.ai_warnings || "[]")
    } catch {
      // Ignore parse errors
    }

    const personalityLabels: Record<string, string> = {
      cautious_saver: "Cautious Saver",
      balanced_planner: "Balanced Planner",
      growth_investor: "Growth Investor",
      spontaneous_spender: "Spontaneous Spender",
      risk_taker: "Risk Taker",
      money_avoider: "Money Avoider",
      security_seeker: "Security Seeker"
    }

    // Send email
    await resend.emails.send({
      from: "WealthClaude <plans@wealthclaude.com>",
      to: session.email,
      subject: `Your Personalized Financial Plan - WealthClaude`,
      html: `
        <!DOCTYPE html>
        <html>
        <head>
          <style>
            body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; }
            .header { background: #16a34a; color: white; padding: 30px; text-align: center; }
            .header h1 { margin: 0; font-size: 24px; }
            .content { padding: 30px; }
            .score-box { background: #f4f4f5; padding: 20px; border-radius: 8px; text-align: center; margin: 20px 0; }
            .score { font-size: 48px; font-weight: bold; color: #16a34a; }
            .section { margin: 30px 0; }
            .section h2 { color: #16a34a; border-bottom: 2px solid #e5e5e5; padding-bottom: 10px; }
            .goal-item { background: #f9fafb; padding: 15px; border-radius: 8px; margin: 10px 0; }
            .goal-item h4 { margin: 0 0 5px 0; color: #333; }
            .goal-item p { margin: 0; color: #666; font-size: 14px; }
            .action-item { display: flex; align-items: flex-start; margin: 10px 0; }
            .action-number { background: #16a34a; color: white; width: 24px; height: 24px; border-radius: 50%; display: flex; align-items: center; justify-content: center; font-size: 12px; margin-right: 12px; flex-shrink: 0; }
            .warning { background: #fef3c7; border-left: 4px solid #f59e0b; padding: 15px; margin: 10px 0; }
            .footer { background: #f4f4f5; padding: 20px; text-align: center; color: #666; font-size: 14px; }
          </style>
        </head>
        <body>
          <div class="header">
            <h1>Your Personalized Financial Plan</h1>
            <p style="margin: 10px 0 0 0; opacity: 0.9;">Prepared exclusively for ${session.full_name}</p>
          </div>
          
          <div class="content">
            <div class="score-box">
              <div class="score">${result?.overall_score || "N/A"}</div>
              <p style="margin: 5px 0 0 0; color: #666;">Your Financial Health Score</p>
              <p style="margin: 10px 0 0 0; font-size: 14px; color: #888;">
                Personality Type: <strong>${personalityLabels[result?.personality_type || ""] || result?.personality_type}</strong>
              </p>
            </div>

            <div class="section">
              <h2>Executive Summary</h2>
              <p>${plan.executive_summary}</p>
            </div>

            <div class="section">
              <h2>Your First Steps (This Week)</h2>
              ${actionItems.slice(0, 5).map((item, i) => `
                <div class="action-item">
                  <div class="action-number">${i + 1}</div>
                  <div>${item.action}</div>
                </div>
              `).join("")}
            </div>

            <div class="section">
              <h2>Short-Term Goals (1-6 Months)</h2>
              ${shortTermGoals.map(goal => `
                <div class="goal-item">
                  <h4>${goal.goal}</h4>
                  <p><strong>Target:</strong> ${goal.target} | <strong>Timeline:</strong> ${goal.timeline}</p>
                </div>
              `).join("")}
            </div>

            <div class="section">
              <h2>Medium-Term Goals (6-12 Months)</h2>
              ${mediumTermGoals.map(goal => `
                <div class="goal-item">
                  <h4>${goal.goal}</h4>
                  <p><strong>Target:</strong> ${goal.target} | <strong>Timeline:</strong> ${goal.timeline}</p>
                </div>
              `).join("")}
            </div>

            ${recommendations.length > 0 ? `
            <div class="section">
              <h2>Personalized Recommendations</h2>
              ${recommendations.map(rec => `
                <div class="goal-item">
                  <h4>${rec.area.replace(/_/g, " ")}</h4>
                  <p>${rec.advice}</p>
                </div>
              `).join("")}
            </div>
            ` : ""}

            ${warnings.length > 0 ? `
            <div class="section">
              <h2>Important Considerations</h2>
              ${warnings.map(warning => `
                <div class="warning">
                  ${warning}
                </div>
              `).join("")}
            </div>
            ` : ""}

            <div class="section" style="background: #ecfdf5; padding: 20px; border-radius: 8px; text-align: center;">
              <h3 style="color: #16a34a; margin-top: 0;">Questions About Your Plan?</h3>
              <p style="margin-bottom: 0;">Simply reply to this email and we'll be happy to help clarify anything or discuss next steps.</p>
            </div>
          </div>

          <div class="footer">
            <p><strong>WealthClaude</strong><br>Your Personal Financial Intelligence</p>
            <p style="font-size: 12px; color: #999;">This plan is based on your assessment responses and is intended for educational purposes. Please consult with a licensed financial advisor before making major financial decisions.</p>
          </div>
        </body>
        </html>
      `
    })

    // Update plan and session
    await supabase
      .from("financial_plans")
      .update({ pdf_shared_at: new Date().toISOString() })
      .eq("id", planId)

    await supabase
      .from("assessment_sessions")
      .update({ status: "plan_shared", is_contacted: true })
      .eq("id", sessionId)

    return NextResponse.json({ success: true })
  } catch (err) {
    console.error("Share error:", err)
    return NextResponse.json(
      { error: "Failed to send email" },
      { status: 500 }
    )
  }
}
