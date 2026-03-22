import { NextRequest, NextResponse } from "next/server"
import { createClient } from "@supabase/supabase-js"
import Groq from "groq-sdk"

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

const groq = new Groq({
  apiKey: process.env.GROQ_API_KEY
})

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

    // Get session with results
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

    const { data: result, error: resultError } = await supabase
      .from("assessment_results")
      .select("*")
      .eq("session_id", sessionId)
      .single()

    if (resultError || !result) {
      return NextResponse.json(
        { error: "Results not found" },
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
    const factorScores = result.factor_scores as Array<{ factorId: string; score: number; status: string }>
    const scoresText = factorScores
      .map(f => `- ${f.factorId.replace(/_/g, " ")}: ${f.score}/100 (${f.status})`)
      .join("\n")

    const prompt = `You are a certified financial planner creating a personalized financial plan.

CLIENT PROFILE:
- Name: ${session.full_name}
- Primary Goal: ${problemNames[session.problem_type]}
- Priority: ${priorityDescriptions[session.primary_goal] || "Not specified"}
- Timeline: ${timelineDescriptions[session.timeline] || "Not specified"}
${session.additional_notes ? `- Additional Context: ${session.additional_notes}` : ""}

ASSESSMENT RESULTS:
- Overall Financial Health Score: ${result.overall_score}/100
- Financial Personality Type: ${result.personality_type.replace(/_/g, " ")}
- Strengths: ${(result.strengths as string[]).join(", ")}
- Areas for Improvement: ${(result.weaknesses as string[]).join(", ")}

DETAILED SCORES:
${scoresText}

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
Based on their weak areas, provide tailored advice:
${(result.weaknesses as string[]).map(w => `- For ${w.replace(/_/g, " ")}: [specific advice]`).join("\n")}

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

    // Call Groq API
    const completion = await groq.chat.completions.create({
      messages: [
        {
          role: "system",
          content: "You are an expert financial planner. Always respond with valid JSON only, no additional text."
        },
        {
          role: "user",
          content: prompt
        }
      ],
      model: "llama-3.3-70b-versatile",
      temperature: 0.7,
      max_tokens: 4000,
      response_format: { type: "json_object" }
    })

    const aiResponse = completion.choices[0]?.message?.content
    if (!aiResponse) {
      throw new Error("No response from AI")
    }

    // Parse AI response
    let planContent
    try {
      planContent = JSON.parse(aiResponse)
    } catch {
      console.error("Failed to parse AI response:", aiResponse)
      throw new Error("Invalid AI response format")
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

    // Save plan to database
    const { data: plan, error: planError } = await supabase
      .from("financial_plans")
      .upsert(
        {
          session_id: sessionId,
          result_id: result.id,
          plan_type: planType,
          executive_summary: planContent.executiveSummary,
          goals,
          action_items: actionItems,
          milestones,
          ai_recommendations: JSON.stringify(planContent.recommendations),
          ai_warnings: JSON.stringify(planContent.warnings)
        },
        {
          onConflict: "session_id"
        }
      )
      .select("id")
      .single()

    if (planError) {
      console.error("Error saving plan:", planError)
      return NextResponse.json(
        { error: "Failed to save plan" },
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
      planId: plan.id,
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
