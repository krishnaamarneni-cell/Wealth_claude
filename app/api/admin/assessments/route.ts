import { NextRequest, NextResponse } from "next/server"
import { createClient } from "@supabase/supabase-js"
import { requireAdmin } from "@/lib/admin-auth"

function getServiceClient() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  )
}

export async function GET(request: NextRequest) {
  const auth = await requireAdmin()
  if ('error' in auth) return auth.error
  const serviceSupabase = getServiceClient()

  try {
    const { searchParams } = new URL(request.url)
    const sessionId = searchParams.get("sessionId")

    if (sessionId) {
      const { data: session, error } = await serviceSupabase
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

      const { data: result } = await serviceSupabase
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

    const { data: sessions, error } = await serviceSupabase
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

    const sessionIds = sessions.map(s => s.id)
    const { data: results } = await serviceSupabase
      .from("assessment_results")
      .select("session_id, overall_score, personality_type")
      .in("session_id", sessionIds)

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
