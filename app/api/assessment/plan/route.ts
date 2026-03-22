import { NextRequest, NextResponse } from "next/server"
import { createClient } from "@supabase/supabase-js"

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

// POST - Generate AI financial plan
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { sessionId, planType } = body // planType: aggressive, moderate, conservative

    if (!sessionId || !planType) {
      return NextResponse.json(
        { error: "Session ID and plan type required" },
        { status: 400 }
      )
    }

    // Check for GROQ API key
    if (!process.env.GROQ_API_KEY) {
      console.error("GROQ_API_KEY not configured")
      return NextResponse.json(
        { error: "AI service not configured. Please add GROQ_API_KEY to environment variables." },
        { status: 500 }
      )
    }

    // Get session with results
    const { data: session, error: sessionError } = await supabase
      .from("assessment_sessions")
      .select("*")
      .eq("id", sessionId)
      .single()

    if (sessionError || !session) {
      console.error("Session error:", sessionError)
      return NextResponse.json(
        { error: "Session not found" },
        { status: 404 }
      )
    }

    const { data: result, error: resultError } = await supabase
      .from("assessment_results")
      .select("*")
      .eq("session_id", sessionId)
      .single()

    if (resultError || !result) {
      console.error("Result error:", resultError)
      return NextResponse.json(
        { error: "Assessment results not found. The user may not have completed the assessment." },
        { status: 404 }
      )
    }

    // Build context for AI
    const problemNames: Record<string, string> = {
      debt: "paying off debt",
      investments: "growing investments",
      retirement: "planning for retirement",
      budgeting: "managing budget and cash flow",
      complete_checkup: "comprehensive financial improvement"
    }

    const priorityDescriptions: Record<string, string> = {
      pay_debt_first: "They want to focus on paying off debt before building investments.",
      build_investments_first: "They want to prioritize investment growth while managing debt.",
      balanced_approach: "They want a balanced approach between debt payoff and investing."
    }

    const timelineDescriptions: Record<string, string> = {
      aggressive: "1-2 years (aggressive pace, maximum effort)",
      moderate: "3-5 years (steady progress with flexibility)",
      slow_steady: "5+ years (gradual changes, sustainable habits)"
    }

    const planTypeDescriptions: Record<string, string> = {
      aggressive: "Create an aggressive plan with ambitious goals and faster timelines.",
      moderate: "Create a balanced plan with achievable goals and reasonable timelines.",
      conservative: "Create a conservative plan with cautious goals and longer timelines."
    }

    // Format factor scores for context
    const factorScores = (result.factor_scores || []) as Array<{ factorId: string; score: number; status: string }>
    const scoresText = factorScores
      .map(f => `- ${f.factorId.replace(/_/g, " ")}: ${f.score}/100 (${f.status})`)
      .join("\n")

    const strengths = (result.strengths || []) as string[]
    const weaknesses = (result.weaknesses || []) as string[]

    const prompt = `You are a certified financial planner creating a personalized financial plan.

CLIENT PROFILE:
- Name: ${session.full_name}
- Primary Goal: ${problemNames[session.problem_type] || session.problem_type}
- Priority: ${priorityDescriptions[session.primary_goal] || "Not specified"}
- Timeline: ${timelineDescriptions[session.timeline] || "Not specified"}
${session.additional_notes ? `- Additional Context: ${session.additional_notes}` : ""}

ASSESSMENT RESULTS:
- Overall Financial Health Score: ${result.overall_score}/100
- Financial Personality Type: ${(result.personality_type || "unknown").replace(/_/g, " ")}
- Strengths: ${strengths.length > 0 ? strengths.join(", ") : "Not identified"}
- Areas for Improvement: ${weaknesses.length > 0 ? weaknesses.join(", ") : "Not identified"}

DETAILED SCORES:
${scoresText || "No detailed scores available"}

PLAN REQUIREMENTS:
${planTypeDescriptions[planType]}

Please create a comprehensive financial plan with the following sections:

1. EXECUTIVE SUMMARY (2-3 paragraphs)
A personalized overview addressing their specific situation, goals, and personality type.

2. IMMEDIATE PRIORITIES (First 30 Days)
List 3-5 specific action items they should start immediately.

3. SHORT-TERM GOALS (1-6 Months)
List 3-5 measurable goals with specific targets.

4. MEDIUM-TERM GOALS (6-12 Months)
List 3-5 measurable goals building on the short-term foundation.

5. LONG-TERM VISION (1-5 Years)
Describe where they should be and key milestones.

6. SPECIFIC RECOMMENDATIONS
Based on their weak areas, provide tailored advice.

7. WARNINGS & CONSIDERATIONS
List 2-3 potential pitfalls to avoid based on their personality type.

8. NEXT STEPS
Clear action items for their first week.

Format your response as JSON with this structure:
{
  "executiveSummary": "string",
  "immediatePriorities": ["string"],
  "shortTermGoals": [{"goal": "string", "target": "string", "timeframe": "string"}],
  "mediumTermGoals": [{"goal": "string", "target": "string", "timeframe": "string"}],
  "longTermVision": "string",
  "recommendations": [{"area": "string", "advice": "string"}],
  "warnings": ["string"],
  "nextSteps": ["string"]
}`

    // Call Groq API directly using fetch
    const groqResponse = await fetch("https://api.groq.com/openai/v1/chat/completions", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${process.env.GROQ_API_KEY}`,
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        model: "llama-3.3-70b-versatile",
        messages: [
          {
            role: "system",
            content: "You are an expert financial planner. Always respond with valid JSON only, no additional text or markdown."
          },
          {
            role: "user",
            content: prompt
          }
        ],
        temperature: 0.7,
        max_tokens: 4000,
        response_format: { type: "json_object" }
      })
    })

    if (!groqResponse.ok) {
      const errorText = await groqResponse.text()
      console.error("Groq API error:", errorText)
      return NextResponse.json(
        { error: "AI service error. Please try again." },
        { status: 500 }
      )
    }

    const groqData = await groqResponse.json()
    const aiResponse = groqData.choices?.[0]?.message?.content

    if (!aiResponse) {
      console.error("No response from Groq")
      return NextResponse.json(
        { error: "No response from AI" },
        { status: 500 }
      )
    }

    // Parse AI response
    let planContent
    try {
      planContent = JSON.parse(aiResponse)
    } catch (parseErr) {
      console.error("Failed to parse AI response:", aiResponse)
      return NextResponse.json(
        { error: "Invalid AI response format" },
        { status: 500 }
      )
    }

    // Format goals and action items for database
    const goals = [
      ...(planContent.shortTermGoals || []).map((g: { goal: string; target: string; timeframe: string }, i: number) => ({
        goal: g.goal,
        target: g.target,
        timeline: g.timeframe,
        priority: i + 1,
        type: "short_term"
      })),
      ...(planContent.mediumTermGoals || []).map((g: { goal: string; target: string; timeframe: string }, i: number) => ({
        goal: g.goal,
        target: g.target,
        timeline: g.timeframe,
        priority: i + 1,
        type: "medium_term"
      }))
    ]

    const actionItems = (planContent.immediatePriorities || []).map((action: string, i: number) => ({
      action,
      category: "immediate",
      week: 1,
      priority: i + 1
    }))

    const milestones = (planContent.nextSteps || []).map((step: string, i: number) => ({
      milestone: step,
      priority: i + 1
    }))

    // Check if plan already exists
    const { data: existingPlan } = await supabase
      .from("financial_plans")
      .select("id")
      .eq("session_id", sessionId)
      .single()

    let plan
    let planError

    if (existingPlan) {
      // Update existing plan
      const { data, error } = await supabase
        .from("financial_plans")
        .update({
          plan_type: planType,
          executive_summary: planContent.executiveSummary,
          goals,
          action_items: actionItems,
          milestones,
          ai_recommendations: JSON.stringify(planContent.recommendations),
          ai_warnings: JSON.stringify(planContent.warnings),
          updated_at: new Date().toISOString()
        })
        .eq("id", existingPlan.id)
        .select("id")
        .single()

      plan = data
      planError = error
    } else {
      // Insert new plan
      const { data, error } = await supabase
        .from("financial_plans")
        .insert({
          session_id: sessionId,
          result_id: result.id,
          plan_type: planType,
          executive_summary: planContent.executiveSummary,
          goals,
          action_items: actionItems,
          milestones,
          ai_recommendations: JSON.stringify(planContent.recommendations),
          ai_warnings: JSON.stringify(planContent.warnings)
        })
        .select("id")
        .single()

      plan = data
      planError = error
    }

    if (planError) {
      console.error("Error saving plan:", planError)
      return NextResponse.json(
        { error: `Failed to save plan: ${planError.message}` },
        { status: 500 }
      )
    }

    // Update session status
    await supabase
      .from("assessment_sessions")
      .update({ status: "plan_generated" })
      .eq("id", sessionId)

    return NextResponse.json({
      success: true,
      planId: plan?.id,
      plan: planContent
    })
  } catch (err) {
    console.error("Plan generation error:", err)
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Internal server error" },
      { status: 500 }
    )
  }
}

// GET - Get existing plan
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const sessionId = searchParams.get("sessionId")

    if (!sessionId) {
      return NextResponse.json(
        { error: "Session ID required" },
        { status: 400 }
      )
    }

    const { data: plan, error } = await supabase
      .from("financial_plans")
      .select("*")
      .eq("session_id", sessionId)
      .single()

    if (error || !plan) {
      return NextResponse.json(
        { error: "Plan not found" },
        { status: 404 }
      )
    }

    return NextResponse.json(plan)
  } catch (err) {
    console.error("Get plan error:", err)
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    )
  }
}