

import { NextRequest, NextResponse } from "next/server"
import { createClient } from "@supabase/supabase-js"

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

// GET - Get contact log for a session
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

    const { data: logs, error } = await supabase
      .from("assessment_contact_log")
      .select("*")
      .eq("session_id", sessionId)
      .order("created_at", { ascending: false })
      .limit(50)

    if (error) {
      console.error("Error fetching contact log:", error)
      return NextResponse.json(
        { error: "Failed to fetch contact log" },
        { status: 500 }
      )
    }

    return NextResponse.json(logs || [])
  } catch (err) {
    console.error("Get contact log error:", err)
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    )
  }
}

// POST - Add a log entry
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { sessionId, actionType, description, metadata } = body

    if (!sessionId || !actionType) {
      return NextResponse.json(
        { error: "Session ID and action type required" },
        { status: 400 }
      )
    }

    const validActions = [
      'invite_sent',
      'assessment_started',
      'assessment_completed',
      'plan_generated',
      'plan_shared',
      'email_sent',
      'call_scheduled',
      'note_added',
      'chat_session'
    ]

    if (!validActions.includes(actionType)) {
      return NextResponse.json(
        { error: "Invalid action type" },
        { status: 400 }
      )
    }

    const { data, error } = await supabase
      .from("assessment_contact_log")
      .insert({
        session_id: sessionId,
        action_type: actionType,
        description: description || null,
        metadata: metadata || {}
      })
      .select()
      .single()

    if (error) {
      console.error("Error adding log entry:", error)
      return NextResponse.json(
        { error: "Failed to add log entry" },
        { status: 500 }
      )
    }

    return NextResponse.json(data)
  } catch (err) {
    console.error("Add log entry error:", err)
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    )
  }
}
