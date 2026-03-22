import { NextRequest, NextResponse } from "next/server"
import { createClient } from "@supabase/supabase-js"

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

// GET - Get detailed results for a session
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

    const { data: result, error } = await supabase
      .from("assessment_results")
      .select("*")
      .eq("session_id", sessionId)
      .single()

    if (error || !result) {
      return NextResponse.json(
        { error: "Results not found" },
        { status: 404 }
      )
    }

    return NextResponse.json(result)
  } catch (err) {
    console.error("Admin results error:", err)
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    )
  }
}
