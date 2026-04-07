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

    if (!sessionId) {
      return NextResponse.json(
        { error: "Session ID required" },
        { status: 400 }
      )
    }

    const { data: result, error } = await serviceSupabase
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
