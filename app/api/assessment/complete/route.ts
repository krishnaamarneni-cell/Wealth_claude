import { NextRequest, NextResponse } from "next/server"
import { createClient } from "@supabase/supabase-js"
import { Resend } from "resend"

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

const resend = new Resend(process.env.RESEND_API_KEY)

const ADMIN_EMAIL = "krishna.amarneni@gmail.com"

// Personality type determination based on scores
function determinePersonalityType(factorScores: Record<string, number>): string {
  const { 
    savings_discipline = 0, 
    risk_tolerance = 0, 
    spending_control = 0,
    investment_readiness = 0,
    financial_planning = 0,
    money_wellness = 0
  } = factorScores

  // Calculate averages for different traits
  const savingTendency = (savings_discipline + spending_control) / 2
  const investingTendency = (risk_tolerance + investment_readiness) / 2
  const planningTendency = (financial_planning + money_wellness) / 2

  // Determine personality type
  if (savingTendency >= 70 && risk_tolerance < 50) return "cautious_saver"
  if (planningTendency >= 70 && savingTendency >= 60) return "balanced_planner"
  if (investingTendency >= 70) return "growth_investor"
  if (spending_control < 40) return "spontaneous_spender"
  if (risk_tolerance >= 80) return "risk_taker"
  if (money_wellness < 40) return "money_avoider"
  if (savingTendency >= 60 && risk_tolerance < 40) return "security_seeker"
  
  return "balanced_planner" // Default
}

// Calculate factor scores from responses
function calculateFactorScores(responses: Array<{
  test_id: string
  question_id: string
  answer_score: number | null
}>): Record<string, number> {
  // Map question prefixes to factors
  const questionFactorMap: Record<string, string[]> = {
    // Financial Personality
    fp1: ["savings_discipline"],
    fp2: ["financial_planning"],
    fp3: ["financial_planning"],
    fp4: ["spending_control"],
    fp6: ["spending_control"],
    fp7: ["money_wellness"],
    fp8: ["financial_planning"],
    fp9: ["savings_discipline"],
    fp11: ["financial_planning"],
    fp12: ["debt_management"],
    fp15: ["spending_control"],
    
    // Financial Health
    fh1: ["emergency_preparedness"],
    fh2: ["savings_discipline"],
    fh3: ["debt_management"],
    fh4: ["investment_readiness"],
    fh6: ["emergency_preparedness"],
    fh7: ["future_orientation"],
    fh12: ["emergency_preparedness"],
    
    // Investment Profile
    ip1: ["risk_tolerance"],
    ip2: ["future_orientation"],
    ip3: ["financial_literacy"],
    ip4: ["risk_tolerance"],
    ip6: ["risk_tolerance"],
    ip7: ["risk_tolerance"],
    ip8: ["investment_readiness"],
    
    // Money Mindset
    mm1: ["money_wellness"],
    mm2: ["money_wellness"],
    mm4: ["money_wellness"],
    mm5: ["money_wellness"],
    mm7: ["future_orientation"],
    mm8: ["future_orientation"],
    mm10: ["money_wellness"],
    
    // Debt Management
    dm1: ["debt_management"],
    dm2: ["debt_management"],
    dm4: ["debt_management"],
    dm5: ["debt_management"],
    dm7: ["debt_management"],
    dm12: ["debt_management"],
    
    // Retirement
    rr2: ["savings_discipline"],
    rr3: ["future_orientation"],
    rr5: ["future_orientation"],
    rr12: ["future_orientation"],
    
    // Budget
    bc1: ["spending_control"],
    bc2: ["financial_planning"],
    bc3: ["savings_discipline"],
    bc9: ["spending_control"],
    bc12: ["financial_planning"],
    
    // Income & Career
    ic2: ["future_orientation"],
    ic5: ["investment_readiness"],
    ic10: ["future_orientation"],
    
    // Insurance
    ins8: ["emergency_preparedness"]
  }

  // Aggregate scores by factor
  const factorTotals: Record<string, { sum: number; count: number }> = {}
  
  for (const response of responses) {
    if (response.answer_score === null) continue
    
    const factors = questionFactorMap[response.question_id] || []
    for (const factor of factors) {
      if (!factorTotals[factor]) {
        factorTotals[factor] = { sum: 0, count: 0 }
      }
      // Normalize score to 0-100 (assuming 1-5 scale)
      const normalizedScore = ((response.answer_score - 1) / 4) * 100
      factorTotals[factor].sum += normalizedScore
      factorTotals[factor].count += 1
    }
  }

  // Calculate averages
  const factorScores: Record<string, number> = {}
  for (const [factor, { sum, count }] of Object.entries(factorTotals)) {
    factorScores[factor] = count > 0 ? Math.round(sum / count) : 50
  }

  return factorScores
}

// POST - Complete assessment, calculate results, send notification
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { sessionId } = body

    if (!sessionId) {
      return NextResponse.json(
        { error: "Session ID required" },
        { status: 400 }
      )
    }

    // Get session data
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

    // Get all responses
    const { data: responses, error: responsesError } = await supabase
      .from("assessment_responses")
      .select("*")
      .eq("session_id", sessionId)

    if (responsesError) {
      console.error("Error fetching responses:", responsesError)
      return NextResponse.json(
        { error: "Failed to fetch responses" },
        { status: 500 }
      )
    }

    // Calculate factor scores
    const factorScores = calculateFactorScores(responses || [])
    
    // Calculate overall score (average of all factors)
    const factorValues = Object.values(factorScores)
    const overallScore = factorValues.length > 0 
      ? Math.round(factorValues.reduce((a, b) => a + b, 0) / factorValues.length)
      : 50

    // Determine personality type
    const personalityType = determinePersonalityType(factorScores)

    // Calculate test scores
    const testScores: Record<string, number> = {}
    const testResponseCounts: Record<string, { sum: number; count: number }> = {}
    
    for (const response of responses || []) {
      if (response.answer_score === null) continue
      if (!testResponseCounts[response.test_id]) {
        testResponseCounts[response.test_id] = { sum: 0, count: 0 }
      }
      const normalizedScore = ((response.answer_score - 1) / 4) * 100
      testResponseCounts[response.test_id].sum += normalizedScore
      testResponseCounts[response.test_id].count += 1
    }
    
    for (const [testId, { sum, count }] of Object.entries(testResponseCounts)) {
      testScores[testId] = count > 0 ? Math.round(sum / count) : 50
    }

    // Determine strengths and weaknesses
    const sortedFactors = Object.entries(factorScores).sort((a, b) => b[1] - a[1])
    const strengths = sortedFactors.slice(0, 3).map(([f]) => f)
    const weaknesses = sortedFactors.slice(-3).map(([f]) => f)

    // Format factor scores for storage
    const factorScoresArray = Object.entries(factorScores).map(([factorId, score]) => ({
      factorId,
      score,
      status: score >= 70 ? "strong" : score >= 50 ? "moderate" : "needs_attention"
    }))

    // Save results
    const { data: result, error: resultError } = await supabase
      .from("assessment_results")
      .insert({
        session_id: sessionId,
        overall_score: overallScore,
        personality_type: personalityType,
        factor_scores: factorScoresArray,
        test_scores: testScores,
        strengths,
        weaknesses
      })
      .select("id")
      .single()

    if (resultError) {
      console.error("Error saving results:", resultError)
      return NextResponse.json(
        { error: "Failed to save results" },
        { status: 500 }
      )
    }

    // Get problem type display name
    const problemNames: Record<string, string> = {
      debt: "Debt Management",
      investments: "Investment Growth",
      retirement: "Retirement Planning",
      budgeting: "Budgeting & Cash Flow",
      complete_checkup: "Complete Financial Checkup"
    }

    // Send email notification to admin
    try {
      await resend.emails.send({
        from: "WealthClaude <notifications@wealthclaude.com>",
        to: ADMIN_EMAIL,
        subject: `🔔 New Assessment: ${session.full_name}`,
        html: `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
            <h2 style="color: #16a34a;">New Assessment Completed</h2>
            
            <div style="background: #f4f4f5; padding: 20px; border-radius: 8px; margin: 20px 0;">
              <h3 style="margin-top: 0;">Client Information</h3>
              <p><strong>Name:</strong> ${session.full_name}</p>
              <p><strong>Email:</strong> ${session.email}</p>
              ${session.phone ? `<p><strong>Phone:</strong> ${session.phone}</p>` : ""}
              <p><strong>Goal:</strong> ${problemNames[session.problem_type] || session.problem_type}</p>
            </div>

            <div style="background: #f4f4f5; padding: 20px; border-radius: 8px; margin: 20px 0;">
              <h3 style="margin-top: 0;">Quick Results</h3>
              <p><strong>Overall Score:</strong> ${overallScore}/100</p>
              <p><strong>Personality Type:</strong> ${personalityType.replace(/_/g, " ").replace(/\b\w/g, l => l.toUpperCase())}</p>
              <p><strong>Priority:</strong> ${session.primary_goal?.replace(/_/g, " ") || "Not specified"}</p>
              <p><strong>Timeline:</strong> ${session.timeline?.replace(/_/g, " ") || "Not specified"}</p>
            </div>

            ${session.additional_notes ? `
            <div style="background: #fef3c7; padding: 20px; border-radius: 8px; margin: 20px 0;">
              <h3 style="margin-top: 0;">Additional Notes from Client</h3>
              <p>${session.additional_notes}</p>
            </div>
            ` : ""}

            <p style="margin-top: 30px;">
              <a href="${process.env.NEXT_PUBLIC_APP_URL}/admin/assessments?view=${sessionId}" 
                 style="background: #16a34a; color: white; padding: 12px 24px; text-decoration: none; border-radius: 8px; display: inline-block;">
                View Full Results & Generate Plan
              </a>
            </p>

            <p style="color: #666; font-size: 14px; margin-top: 30px;">
              This is an automated notification from WealthClaude.
            </p>
          </div>
        `
      })
    } catch (emailError) {
      console.error("Error sending notification email:", emailError)
      // Don't fail the request if email fails
    }

    return NextResponse.json({ 
      success: true, 
      resultId: result.id,
      overallScore,
      personalityType
    })
  } catch (err) {
    console.error("Complete error:", err)
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    )
  }
}
