import { NextRequest, NextResponse } from "next/server"
import { createClient } from "@supabase/supabase-js"

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

// POST - Submit a single answer
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { sessionId, testId, questionId, answerValue, answerScore } = body

    if (!sessionId || !testId || !questionId || answerValue === undefined) {
      return NextResponse.json(
        { error: "Missing required fields" },
        { status: 400 }
      )
    }

    // Upsert answer (update if exists, insert if not)
    const { error } = await supabase
      .from("assessment_responses")
      .upsert(
        {
          session_id: sessionId,
          test_id: testId,
          question_id: questionId,
          answer_value: String(answerValue),
          answer_score: answerScore ?? null,
          answered_at: new Date().toISOString()
        },
        {
          onConflict: "session_id,question_id"
        }
      )

    if (error) {
      console.error("Error saving answer:", error)
      return NextResponse.json(
        { error: "Failed to save answer" },
        { status: 500 }
      )
    }

    // Update session status to tests_in_progress if not already
    await supabase
      .from("assessment_sessions")
      .update({ status: "tests_in_progress" })
      .eq("id", sessionId)
      .eq("status", "intake_complete")

    return NextResponse.json({ success: true })
  } catch (err) {
    console.error("Submit error:", err)
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    )
  }
}
