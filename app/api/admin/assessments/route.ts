import { NextRequest, NextResponse } from "next/server"
import { createClient } from "@supabase/supabase-js"

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

// GET - Get all assessments or single by ID
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const sessionId = searchParams.get("sessionId")

    if (sessionId) {
      // Get single assessment
      const { data: session, error } = await supabase
        .from("assessment_sessions")
        .select("*")
        .eq("id", sessionId)
        .single()

      if (error || !session) {
        return NextResponse.json(
          { error: "Session not found" },
          { status: 404 }
        )
      }

      // Get result for score
      const { data: result } = await supabase
        .from("assessment_results")
        .select("overall_score, personality_type")
        .eq("session_id", sessionId)
        .single()

      return NextResponse.json({
        ...session,
        overall_score: result?.overall_score,
        personality_type: result?.personality_type
      })
    }

    // Get all assessments with scores
    const { data: sessions, error } = await supabase
      .from("assessment_sessions")
      .select("*")
      .order("created_at", { ascending: false })

    if (error) {
      console.error("Error fetching sessions:", error)
      return NextResponse.json(
        { error: "Failed to fetch assessments" },
        { status: 500 }
      )
    }

    // Get results for all sessions
    const sessionIds = sessions.map(s => s.id)
    const { data: results } = await supabase
      .from("assessment_results")
      .select("session_id, overall_score, personality_type")
      .in("session_id", sessionIds)

    // Merge results with sessions
    const resultsMap = new Map(
      (results || []).map(r => [r.session_id, r])
    )

    const assessmentsWithScores = sessions.map(session => ({
      ...session,
      overall_score: resultsMap.get(session.id)?.overall_score,
      personality_type: resultsMap.get(session.id)?.personality_type
    }))

    return NextResponse.json(assessmentsWithScores)
  } catch (err) {
    console.error("Admin assessments error:", err)
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    )
  }
}