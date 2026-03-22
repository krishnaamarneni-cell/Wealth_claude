import { NextRequest, NextResponse } from "next/server"
import { createClient } from "@supabase/supabase-js"

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

// POST - Send message and get AI response
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { sessionId, message, includeHistory = false } = body

    if (!sessionId || !message) {
      return NextResponse.json(
        { error: "Session ID and message required" },
        { status: 400 }
      )
    }

    if (!process.env.GROQ_API_KEY) {
      return NextResponse.json(
        { error: "GROQ_API_KEY not configured" },
        { status: 500 }
      )
    }

    // Get session data
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

    // Get assessment results
    const { data: result } = await supabase
      .from("assessment_results")
      .select("*")
      .eq("session_id", sessionId)
      .single()

    // Get current active plan if exists
    const { data: plan } = await supabase
      .from("financial_plans")
      .select("*")
      .eq("session_id", sessionId)
      .eq("is_active", true)
      .single()

    // Build context about the client
    const factorScores = (result?.factor_scores || []) as Array<{ factorId: string; score: number; status: string }>
    const strengths = (result?.strengths || []) as string[]
    const weaknesses = (result?.weaknesses || []) as string[]

    const problemLabels: Record<string, string> = {
      debt: "Debt Management",
      investments: "Investment Growth",
      retirement: "Retirement Planning",
      budgeting: "Budget & Cash Flow",
      complete_checkup: "Complete Financial Checkup"
    }

    const personalityDescriptions: Record<string, string> = {
      cautious_saver: "Cautious Saver - Conservative with money, prioritizes security over growth",
      balanced_planner: "Balanced Planner - Methodical approach, balances saving and spending",
      growth_investor: "Growth Investor - Focused on wealth building, comfortable with calculated risks",
      spontaneous_spender: "Spontaneous Spender - Impulse-driven, needs structure and automation",
      risk_taker: "Risk Taker - High risk tolerance, seeks aggressive returns",
      money_avoider: "Money Avoider - Avoids financial decisions, needs guidance and simplification",
      security_seeker: "Security Seeker - Prioritizes stability, may miss growth opportunities"
    }

    const clientContext = `
CLIENT PROFILE:
- Name: ${session.full_name}
- Primary Financial Goal: ${problemLabels[session.problem_type] || session.problem_type}
- Priority: ${session.primary_goal || "Not specified"}
- Timeline: ${session.timeline || "Not specified"}
${session.additional_notes ? `- Additional Context: ${session.additional_notes}` : ""}

ASSESSMENT RESULTS:
- Overall Financial Health Score: ${result?.overall_score || "N/A"}/100
- Personality Type: ${personalityDescriptions[result?.personality_type] || result?.personality_type || "Unknown"}
- Strengths: ${strengths.length > 0 ? strengths.map(s => s.replace(/_/g, " ")).join(", ") : "Not identified"}
- Areas Needing Improvement: ${weaknesses.length > 0 ? weaknesses.map(w => w.replace(/_/g, " ")).join(", ") : "Not identified"}

DETAILED SCORES:
${factorScores.map(f => `- ${f.factorId.replace(/_/g, " ")}: ${f.score}/100`).join("\n")}

${plan ? `
CURRENT FINANCIAL PLAN (${plan.plan_type}):
- Executive Summary: ${plan.executive_summary?.substring(0, 500)}...
` : "No financial plan has been generated yet."}
`

    // Build messages array
    const messages: Array<{ role: string; content: string }> = [
      {
        role: "system",
        content: `You are an expert financial advisor assistant helping a wealth advisor analyze and advise clients. 

You have access to the client's full assessment data. Use this to provide specific, personalized advice.

${clientContext}

GUIDELINES:
- Be specific and actionable based on their scores and personality
- Reference their actual numbers when relevant
- Consider their personality type when suggesting approaches
- If asked to generate a plan, format it clearly with sections
- If asked for call prep questions, make them specific to their weak areas
- Keep responses concise but thorough
- You can suggest saving content as a plan or copying to clipboard when appropriate`
      }
    ]

    // Optionally load chat history
    if (includeHistory) {
      const { data: chatHistory } = await supabase
        .from("assessment_chats")
        .select("role, content")
        .eq("session_id", sessionId)
        .order("created_at", { ascending: true })
        .limit(20)

      if (chatHistory && chatHistory.length > 0) {
        chatHistory.forEach(msg => {
          messages.push({
            role: msg.role,
            content: msg.content
          })
        })
      }
    }

    // Add current user message
    messages.push({
      role: "user",
      content: message
    })

    // Call Groq API
    const groqResponse = await fetch("https://api.groq.com/openai/v1/chat/completions", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${process.env.GROQ_API_KEY}`,
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        model: "llama-3.3-70b-versatile",
        messages,
        temperature: 0.7,
        max_tokens: 2000
      })
    })

    if (!groqResponse.ok) {
      const errorText = await groqResponse.text()
      console.error("Groq API error:", errorText)
      return NextResponse.json(
        { error: "AI service error" },
        { status: 500 }
      )
    }

    const groqData = await groqResponse.json()
    const assistantMessage = groqData.choices?.[0]?.message?.content

    if (!assistantMessage) {
      return NextResponse.json(
        { error: "No response from AI" },
        { status: 500 }
      )
    }

    // Save both messages to chat history
    const { error: saveError } = await supabase
      .from("assessment_chats")
      .insert([
        {
          session_id: sessionId,
          role: "user",
          content: message
        },
        {
          session_id: sessionId,
          role: "assistant",
          content: assistantMessage
        }
      ])

    if (saveError) {
      console.error("Error saving chat:", saveError)
      // Don't fail the request, just log
    }

    // Log the chat session
    await supabase
      .from("assessment_contact_log")
      .insert({
        session_id: sessionId,
        action_type: "chat_session",
        description: `Chat: ${message.substring(0, 100)}...`
      })

    return NextResponse.json({
      success: true,
      message: assistantMessage
    })
  } catch (err) {
    console.error("Chat error:", err)
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Internal server error" },
      { status: 500 }
    )
  }
}

// GET - Get chat history for a session
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const sessionId = searchParams.get("sessionId")
    const limit = parseInt(searchParams.get("limit") || "50")

    if (!sessionId) {
      return NextResponse.json(
        { error: "Session ID required" },
        { status: 400 }
      )
    }

    const { data: chats, error } = await supabase
      .from("assessment_chats")
      .select("*")
      .eq("session_id", sessionId)
      .order("created_at", { ascending: true })
      .limit(limit)

    if (error) {
      console.error("Error fetching chats:", error)
      return NextResponse.json(
        { error: "Failed to fetch chat history" },
        { status: 500 }
      )
    }

    return NextResponse.json(chats || [])
  } catch (err) {
    console.error("Get chat error:", err)
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    )
  }
}

// DELETE - Clear chat history for a session
export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const sessionId = searchParams.get("sessionId")

    if (!sessionId) {
      return NextResponse.json(
        { error: "Session ID required" },
        { status: 400 }
      )
    }

    const { error } = await supabase
      .from("assessment_chats")
      .delete()
      .eq("session_id", sessionId)

    if (error) {
      console.error("Error deleting chats:", error)
      return NextResponse.json(
        { error: "Failed to clear chat history" },
        { status: 500 }
      )
    }

    return NextResponse.json({ success: true })
  } catch (err) {
    console.error("Delete chat error:", err)
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    )
  }
}
