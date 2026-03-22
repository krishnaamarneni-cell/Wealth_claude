import { NextRequest, NextResponse } from "next/server"
import { createClient } from "@supabase/supabase-js"

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

// Problem to tests mapping
const problemToTests: Record<string, string[]> = {
  debt: ["financial_health", "debt_management", "money_mindset"],
  investments: ["financial_personality", "investment_profile", "money_mindset"],
  retirement: ["retirement_readiness", "investment_profile", "financial_health"],
  budgeting: ["budget_cashflow", "financial_personality", "financial_health"],
  complete_checkup: [
    "financial_personality",
    "financial_health",
    "investment_profile",
    "money_mindset",
    "debt_management",
    "retirement_readiness",
    "budget_cashflow",
    "income_career",
    "insurance_protection"
  ]
}

// POST - Create new session
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { fullName, email, phone, problemType } = body

    // Validate required fields
    if (!fullName || !email || !problemType) {
      return NextResponse.json(
        { error: "Missing required fields" },
        { status: 400 }
      )
    }

    // Validate problem type
    if (!problemToTests[problemType]) {
      return NextResponse.json(
        { error: "Invalid problem type" },
        { status: 400 }
      )
    }

    // Get assigned tests based on problem
    const assignedTests = problemToTests[problemType]

    // Create session
    const { data, error } = await supabase
      .from("assessment_sessions")
      .insert({
        full_name: fullName,
        email: email.toLowerCase(),
        phone: phone || null,
        problem_type: problemType,
        assigned_tests: assignedTests,
        status: "intake_complete"
      })
      .select("id")
      .single()

    if (error) {
      console.error("Error creating session:", error)
      return NextResponse.json(
        { error: "Failed to create session" },
        { status: 500 }
      )
    }

    return NextResponse.json({ sessionId: data.id })
  } catch (err) {
    console.error("Session POST error:", err)
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    )
  }
}

// GET - Get session data
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const id = searchParams.get("id")

    if (!id) {
      return NextResponse.json(
        { error: "Session ID required" },
        { status: 400 }
      )
    }

    // Get session
    const { data: session, error: sessionError } = await supabase
      .from("assessment_sessions")
      .select("*")
      .eq("id", id)
      .single()

    if (sessionError || !session) {
      return NextResponse.json(
        { error: "Session not found" },
        { status: 404 }
      )
    }

    // Get responses
    const { data: responses } = await supabase
      .from("assessment_responses")
      .select("question_id, answer_value, answer_score")
      .eq("session_id", id)

    return NextResponse.json({
      ...session,
      responses: responses || []
    })
  } catch (err) {
    console.error("Session GET error:", err)
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    )
  }
}

// PATCH - Update session
export async function PATCH(request: NextRequest) {
  try {
    const body = await request.json()
    const { sessionId, ...updates } = body

    if (!sessionId) {
      return NextResponse.json(
        { error: "Session ID required" },
        { status: 400 }
      )
    }

    // Build update object
    const updateData: Record<string, unknown> = {}
    
    if (updates.status) updateData.status = updates.status
    if (updates.primaryGoal) updateData.primary_goal = updates.primaryGoal
    if (updates.timeline) updateData.timeline = updates.timeline
    if (updates.additionalNotes !== undefined) updateData.additional_notes = updates.additionalNotes
    if (updates.completedTests) updateData.completed_tests = updates.completedTests
    if (updates.isViewed !== undefined) updateData.is_viewed = updates.isViewed
    if (updates.isContacted !== undefined) updateData.is_contacted = updates.isContacted
    if (updates.adminNotes !== undefined) updateData.admin_notes = updates.adminNotes

    // Set completed_at if goals are complete
    if (updates.status === "goals_complete") {
      updateData.completed_at = new Date().toISOString()
    }

    const { error } = await supabase
      .from("assessment_sessions")
      .update(updateData)
      .eq("id", sessionId)

    if (error) {
      console.error("Error updating session:", error)
      return NextResponse.json(
        { error: "Failed to update session" },
        { status: 500 }
      )
    }

    return NextResponse.json({ success: true })
  } catch (err) {
    console.error("Session PATCH error:", err)
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    )
  }
}
