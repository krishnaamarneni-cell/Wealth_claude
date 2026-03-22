import { NextRequest, NextResponse } from "next/server"
import { createClient } from "@supabase/supabase-js"

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

// GET - List all assessments with results
export async function GET(request: NextRequest) {
  try {
    // Get all sessions with their results
    const { data: sessions, error } = await supabase
      .from("assessment_sessions")
      .select(`
        *,
        assessment_results (
          overall_score,
          personality_type
        )
      `)
      .order("created_at", { ascending: false })

    if (error) {
      console.error("Error fetching assessments:", error)
      return NextResponse.json(
        { error: "Failed to fetch assessments" },
        { status: 500 }
      )
    }

    // Flatten the data
    const assessments = sessions.map(session => ({
      ...session,
      overall_score: session.assessment_results?.[0]?.overall_score || null,
      personality_type: session.assessment_results?.[0]?.personality_type || null,
      assessment_results: undefined // Remove nested object
    }))

    return NextResponse.json(assessments)
  } catch (err) {
    console.error("Admin assessments error:", err)
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    )
  }
}