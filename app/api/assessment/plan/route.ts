import { NextRequest, NextResponse } from "next/server"
import { createClient } from "@supabase/supabase-js"

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

// POST - Generate AI financial plan (with versioning)
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { sessionId, planType, source = "preset", customPrompt } = body

    if (!sessionId || !planType) {
      return NextResponse.json(
        { error: "Session ID and plan type required" },
        { status: 400 }
      )
    }

    if (!process.env.GROQ_API_KEY) {
      return NextResponse.json(
        { error: "GROQ_API_KEY not configured" },
        { status: 500 }
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

    // Get results
    const { data: result, error: resultError } = await supabase
      .from("assessment_results")
      .select("*")
      .eq("session_id", sessionId)
      .single()

    if (resultError || !result) {
      return NextResponse.json(
        { error: "Assessment results not found" },
        { status: 404 }
      )
    }

    // Get next version number
    const { data: maxVersionData } = await supabase
      .from("financial_plans")
      .select("version")
      .eq("session_id", sessionId)
      .order("version", { ascending: false })
      .limit(1)
      .single()

    const nextVersion = (maxVersionData?.version || 0) + 1

    // Build AI prompt
    const problemLabels: Record<string, string> = {
      debt: "paying off debt",
      investments: "growing investments",
      retirement: "planning for retirement",
      budgeting: "managing budget and cash flow",
      complete_checkup: "comprehensive financial improvement"
    }

    const planTypeDescriptions: Record<string, string> = {
      aggressive: "Create an aggressive plan with ambitious goals and faster timelines.",
      moderate: "Create a balanced plan with achievable goals and reasonable timelines.",
      conservative: "Create a conservative plan with cautious goals and longer timelines."
    }

    const factorScores = (result.factor_scores || []) as Array<{ factorId: string; score: number }>
    const scoresText = factorScores
      .map(f => `- ${f.factorId.replace(/_/g, " ")}: ${f.score}/100`)
      .join("\n")

    const strengths = (result.strengths || []) as string[]
    const weaknesses = (result.weaknesses || []) as string[]

    let prompt = `You are a certified financial planner creating a personalized financial plan.

CLIENT PROFILE:
- Name: ${session.full_name}
- Primary Goal: ${problemLabels[session.problem_type] || session.problem_type}
- Priority: ${session.primary_goal || "Not specified"}
- Timeline: ${session.timeline || "Not specified"}

ASSESSMENT RESULTS:
- Overall Score: ${result.overall_score}/100
- Personality Type: ${(result.personality_type || "unknown").replace(/_/g, " ")}
- Strengths: ${strengths.length > 0 ? strengths.join(", ") : "Not identified"}
- Weaknesses: ${weaknesses.length > 0 ? weaknesses.join(", ") : "Not identified"}

DETAILED SCORES:
${scoresText}

PLAN REQUIREMENTS:
${planTypeDescriptions[planType]}`

    // Add custom prompt if provided (from chat)
    if (customPrompt) {
      prompt += `\n\nADDITIONAL REQUIREMENTS FROM ADVISOR:
${customPrompt}`
    }

    prompt += `

Create a comprehensive financial plan with these sections in JSON format:
{
  "executiveSummary": "2-3 paragraph personalized overview",
  "immediatePriorities": ["5 action items for first 30 days"],
  "shortTermGoals": [{"goal": "string", "target": "string", "timeframe": "string"}],
  "mediumTermGoals": [{"goal": "string", "target": "string", "timeframe": "string"}],
  "longTermVision": "1-5 year vision paragraph",
  "recommendations": [{"area": "string", "advice": "string"}],
  "warnings": ["2-3 pitfalls to avoid"],
  "nextSteps": ["clear first week actions"]
}`

    // Call Groq
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
            content: "You are an expert financial planner. Respond with valid JSON only."
          },
          { role: "user", content: prompt }
        ],
        temperature: 0.7,
        max_tokens: 4000,
        response_format: { type: "json_object" }
      })
    })

    if (!groqResponse.ok) {
      const errorText = await groqResponse.text()
      console.error("Groq error:", errorText)
      return NextResponse.json(
        { error: "AI service error" },
        { status: 500 }
      )
    }

    const groqData = await groqResponse.json()
    const aiResponse = groqData.choices?.[0]?.message?.content

    if (!aiResponse) {
      return NextResponse.json(
        { error: "No AI response" },
        { status: 500 }
      )
    }

    let planContent
    try {
      planContent = JSON.parse(aiResponse)
    } catch {
      console.error("Parse error:", aiResponse)
      return NextResponse.json(
        { error: "Invalid AI response format" },
        { status: 500 }
      )
    }

    // Format for database
    const goals = [
      ...(planContent.shortTermGoals || []).map((g: { goal: string; target: string; timeframe: string }, i: number) => ({
        ...g,
        priority: i + 1,
        type: "short_term"
      })),
      ...(planContent.mediumTermGoals || []).map((g: { goal: string; target: string; timeframe: string }, i: number) => ({
        ...g,
        priority: i + 1,
        type: "medium_term"
      }))
    ]

    const actionItems = (planContent.immediatePriorities || []).map((action: string, i: number) => ({
      action,
      category: "immediate",
      priority: i + 1
    }))

    // Insert new plan version (trigger will deactivate old ones)
    const { data: plan, error: planError } = await supabase
      .from("financial_plans")
      .insert({
        session_id: sessionId,
        result_id: result.id,
        plan_type: planType,
        version: nextVersion,
        is_active: true,
        source,
        executive_summary: planContent.executiveSummary,
        goals,
        action_items: actionItems,
        milestones: (planContent.nextSteps || []).map((step: string, i: number) => ({
          milestone: step,
          priority: i + 1
        })),
        ai_recommendations: JSON.stringify(planContent.recommendations || []),
        ai_warnings: JSON.stringify(planContent.warnings || [])
      })
      .select()
      .single()

    if (planError) {
      console.error("Save error:", planError)
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

    // Log the action
    await supabase
      .from("assessment_contact_log")
      .insert({
        session_id: sessionId,
        action_type: "plan_generated",
        description: `Generated ${planType} plan v${nextVersion}`,
        metadata: { planId: plan.id, version: nextVersion, source }
      })

    return NextResponse.json({
      success: true,
      planId: plan.id,
      version: nextVersion,
      plan: planContent
    })
  } catch (err) {
    console.error("Plan error:", err)
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Internal server error" },
      { status: 500 }
    )
  }
}

// GET - Get plan(s) for a session
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const sessionId = searchParams.get("sessionId")
    const allVersions = searchParams.get("all") === "true"
    const planId = searchParams.get("planId")

    if (planId) {
      // Get specific plan by ID
      const { data: plan, error } = await supabase
        .from("financial_plans")
        .select("*")
        .eq("id", planId)
        .single()

      if (error || !plan) {
        return NextResponse.json(
          { error: "Plan not found" },
          { status: 404 }
        )
      }

      return NextResponse.json(plan)
    }

    if (!sessionId) {
      return NextResponse.json(
        { error: "Session ID required" },
        { status: 400 }
      )
    }

    if (allVersions) {
      // Get all plan versions
      const { data: plans, error } = await supabase
        .from("financial_plans")
        .select("*")
        .eq("session_id", sessionId)
        .order("version", { ascending: false })

      if (error) {
        return NextResponse.json(
          { error: "Failed to fetch plans" },
          { status: 500 }
        )
      }

      return NextResponse.json(plans || [])
    }

    // Get active plan only
    const { data: plan, error } = await supabase
      .from("financial_plans")
      .select("*")
      .eq("session_id", sessionId)
      .eq("is_active", true)
      .single()

    if (error || !plan) {
      return NextResponse.json(
        { error: "No active plan found" },
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

// PATCH - Set a specific version as active
export async function PATCH(request: NextRequest) {
  try {
    const body = await request.json()
    const { planId, sessionId } = body

    if (!planId || !sessionId) {
      return NextResponse.json(
        { error: "Plan ID and Session ID required" },
        { status: 400 }
      )
    }

    // Deactivate all plans for this session
    await supabase
      .from("financial_plans")
      .update({ is_active: false })
      .eq("session_id", sessionId)

    // Activate the selected plan
    const { data, error } = await supabase
      .from("financial_plans")
      .update({ is_active: true })
      .eq("id", planId)
      .select()
      .single()

    if (error) {
      return NextResponse.json(
        { error: "Failed to activate plan" },
        { status: 500 }
      )
    }

    return NextResponse.json(data)
  } catch (err) {
    console.error("Patch plan error:", err)
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    )
  }
}