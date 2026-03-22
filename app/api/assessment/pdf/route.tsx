import { NextRequest, NextResponse } from "next/server"
import { createClient } from "@supabase/supabase-js"
import { jsPDF } from "jspdf"

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

const personalityLabels: Record<string, string> = {
  cautious_saver: "Cautious Saver",
  balanced_planner: "Balanced Planner",
  growth_investor: "Growth Investor",
  spontaneous_spender: "Spontaneous Spender",
  risk_taker: "Risk Taker",
  money_avoider: "Money Avoider",
  security_seeker: "Security Seeker"
}

// POST - Generate PDF
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { sessionId, planId } = body

    if (!sessionId || !planId) {
      return NextResponse.json(
        { error: "Session ID and Plan ID required" },
        { status: 400 }
      )
    }

    // Get session
    const { data: session, error: sessionError } = await supabase
      .from("assessment_sessions")
      .select("full_name")
      .eq("id", sessionId)
      .single()

    if (sessionError || !session) {
      return NextResponse.json(
        { error: "Session not found" },
        { status: 404 }
      )
    }

    // Get result
    const { data: result, error: resultError } = await supabase
      .from("assessment_results")
      .select("overall_score, personality_type")
      .eq("session_id", sessionId)
      .single()

    if (resultError || !result) {
      return NextResponse.json(
        { error: "Results not found" },
        { status: 404 }
      )
    }

    // Get plan
    const { data: plan, error: planError } = await supabase
      .from("financial_plans")
      .select("*")
      .eq("id", planId)
      .single()

    if (planError || !plan) {
      return NextResponse.json(
        { error: "Plan not found" },
        { status: 404 }
      )
    }

    // Parse plan data
    const goals = (plan.goals || []) as Array<{ goal: string; target: string; timeline: string; type: string }>
    const actionItems = (plan.action_items || []) as Array<{ action: string }>
    let warnings: string[] = []
    let recommendations: Array<{ area: string; advice: string }> = []

    try {
      warnings = JSON.parse(plan.ai_warnings || "[]")
      recommendations = JSON.parse(plan.ai_recommendations || "[]")
    } catch {
      // Ignore parse errors
    }

    // Create PDF
    const doc = new jsPDF()
    const pageWidth = doc.internal.pageSize.getWidth()
    const margin = 20
    const contentWidth = pageWidth - (margin * 2)
    let y = margin

    // Helper function for wrapped text
    const addWrappedText = (text: string, x: number, startY: number, maxWidth: number, lineHeight: number = 7): number => {
      const lines = doc.splitTextToSize(text, maxWidth)
      lines.forEach((line: string) => {
        if (startY > 270) {
          doc.addPage()
          startY = margin
        }
        doc.text(line, x, startY)
        startY += lineHeight
      })
      return startY
    }

    // ============ PAGE 1 ============

    // Header
    doc.setFillColor(22, 163, 74) // Green
    doc.rect(0, 0, pageWidth, 40, "F")

    doc.setTextColor(255, 255, 255)
    doc.setFontSize(24)
    doc.setFont("helvetica", "bold")
    doc.text("Financial Plan", margin, 25)

    doc.setFontSize(12)
    doc.setFont("helvetica", "normal")
    doc.text(`Prepared for ${session.full_name}`, margin, 35)

    y = 55

    // Score Box
    doc.setFillColor(244, 244, 245)
    doc.roundedRect(margin, y, contentWidth, 35, 3, 3, "F")

    doc.setTextColor(22, 163, 74)
    doc.setFontSize(28)
    doc.setFont("helvetica", "bold")
    doc.text(String(result.overall_score), margin + 30, y + 22)

    doc.setTextColor(100, 100, 100)
    doc.setFontSize(10)
    doc.setFont("helvetica", "normal")
    doc.text("Financial Health Score", margin + 15, y + 30)

    doc.setTextColor(51, 51, 51)
    doc.setFontSize(14)
    doc.setFont("helvetica", "bold")
    const personalityText = personalityLabels[result.personality_type] || result.personality_type
    doc.text(personalityText, margin + 100, y + 20)

    doc.setTextColor(100, 100, 100)
    doc.setFontSize(10)
    doc.setFont("helvetica", "normal")
    doc.text("Personality Type", margin + 100, y + 30)

    y += 50

    // Plan Type Badge
    doc.setFillColor(22, 163, 74)
    const planTypeText = `${plan.plan_type.charAt(0).toUpperCase() + plan.plan_type.slice(1)} Plan`
    doc.roundedRect(margin, y, 60, 8, 2, 2, "F")
    doc.setTextColor(255, 255, 255)
    doc.setFontSize(9)
    doc.text(planTypeText, margin + 5, y + 6)

    y += 20

    // Executive Summary
    doc.setTextColor(22, 163, 74)
    doc.setFontSize(14)
    doc.setFont("helvetica", "bold")
    doc.text("Executive Summary", margin, y)
    y += 8

    doc.setTextColor(60, 60, 60)
    doc.setFontSize(10)
    doc.setFont("helvetica", "normal")
    y = addWrappedText(plan.executive_summary || "", margin, y, contentWidth, 6)

    y += 10

    // Immediate Actions
    if (actionItems.length > 0) {
      doc.setTextColor(22, 163, 74)
      doc.setFontSize(14)
      doc.setFont("helvetica", "bold")
      doc.text("Your First Steps", margin, y)
      y += 10

      doc.setFontSize(10)
      actionItems.slice(0, 5).forEach((item, i) => {
        if (y > 270) {
          doc.addPage()
          y = margin
        }

        // Number circle
        doc.setFillColor(22, 163, 74)
        doc.circle(margin + 5, y - 2, 4, "F")
        doc.setTextColor(255, 255, 255)
        doc.setFont("helvetica", "bold")
        doc.text(String(i + 1), margin + 3.5, y)

        // Action text
        doc.setTextColor(60, 60, 60)
        doc.setFont("helvetica", "normal")
        y = addWrappedText(item.action, margin + 15, y, contentWidth - 15, 6)
        y += 4
      })
    }

    // ============ PAGE 2 ============
    doc.addPage()
    y = margin

    // Short-Term Goals
    const shortTermGoals = goals.filter(g => g.type === "short_term")
    if (shortTermGoals.length > 0) {
      doc.setTextColor(22, 163, 74)
      doc.setFontSize(14)
      doc.setFont("helvetica", "bold")
      doc.text("Short-Term Goals (1-6 Months)", margin, y)
      y += 10

      shortTermGoals.forEach((goal) => {
        if (y > 260) {
          doc.addPage()
          y = margin
        }

        doc.setFillColor(249, 250, 251)
        doc.roundedRect(margin, y - 4, contentWidth, 20, 2, 2, "F")

        doc.setTextColor(51, 51, 51)
        doc.setFontSize(11)
        doc.setFont("helvetica", "bold")
        doc.text(goal.goal, margin + 5, y + 3)

        doc.setTextColor(100, 100, 100)
        doc.setFontSize(9)
        doc.setFont("helvetica", "normal")
        doc.text(`Target: ${goal.target} | Timeline: ${goal.timeline}`, margin + 5, y + 12)

        y += 25
      })
    }

    y += 5

    // Medium-Term Goals
    const mediumTermGoals = goals.filter(g => g.type === "medium_term")
    if (mediumTermGoals.length > 0) {
      doc.setTextColor(22, 163, 74)
      doc.setFontSize(14)
      doc.setFont("helvetica", "bold")
      doc.text("Medium-Term Goals (6-12 Months)", margin, y)
      y += 10

      mediumTermGoals.forEach((goal) => {
        if (y > 260) {
          doc.addPage()
          y = margin
        }

        doc.setFillColor(249, 250, 251)
        doc.roundedRect(margin, y - 4, contentWidth, 20, 2, 2, "F")

        doc.setTextColor(51, 51, 51)
        doc.setFontSize(11)
        doc.setFont("helvetica", "bold")
        doc.text(goal.goal, margin + 5, y + 3)

        doc.setTextColor(100, 100, 100)
        doc.setFontSize(9)
        doc.setFont("helvetica", "normal")
        doc.text(`Target: ${goal.target} | Timeline: ${goal.timeline}`, margin + 5, y + 12)

        y += 25
      })
    }

    y += 5

    // Recommendations
    if (recommendations.length > 0) {
      if (y > 220) {
        doc.addPage()
        y = margin
      }

      doc.setTextColor(22, 163, 74)
      doc.setFontSize(14)
      doc.setFont("helvetica", "bold")
      doc.text("Personalized Recommendations", margin, y)
      y += 10

      recommendations.forEach((rec) => {
        if (y > 250) {
          doc.addPage()
          y = margin
        }

        doc.setTextColor(51, 51, 51)
        doc.setFontSize(11)
        doc.setFont("helvetica", "bold")
        doc.text(`• ${rec.area.replace(/_/g, " ")}`, margin, y)
        y += 6

        doc.setTextColor(80, 80, 80)
        doc.setFontSize(10)
        doc.setFont("helvetica", "normal")
        y = addWrappedText(rec.advice, margin + 5, y, contentWidth - 5, 5)
        y += 5
      })
    }

    y += 5

    // Warnings
    if (warnings.length > 0) {
      if (y > 230) {
        doc.addPage()
        y = margin
      }

      doc.setTextColor(217, 119, 6) // Amber
      doc.setFontSize(14)
      doc.setFont("helvetica", "bold")
      doc.text("⚠ Important Considerations", margin, y)
      y += 10

      warnings.forEach((warning) => {
        if (y > 260) {
          doc.addPage()
          y = margin
        }

        doc.setFillColor(254, 243, 199) // Amber light
        doc.roundedRect(margin, y - 4, contentWidth, 15, 2, 2, "F")

        doc.setTextColor(146, 64, 14) // Amber dark
        doc.setFontSize(9)
        doc.setFont("helvetica", "normal")
        y = addWrappedText(warning, margin + 5, y + 2, contentWidth - 10, 5)
        y += 8
      })
    }

    // Footer on all pages
    const totalPages = doc.getNumberOfPages()
    for (let i = 1; i <= totalPages; i++) {
      doc.setPage(i)
      doc.setTextColor(150, 150, 150)
      doc.setFontSize(8)
      doc.setFont("helvetica", "normal")
      doc.text(
        `WealthClaude | wealthclaude.com | Generated ${new Date().toLocaleDateString()} | Page ${i} of ${totalPages}`,
        pageWidth / 2,
        287,
        { align: "center" }
      )
    }

    // Generate PDF buffer
    const pdfBuffer = Buffer.from(doc.output("arraybuffer"))

    // Return PDF
    return new NextResponse(pdfBuffer, {
      headers: {
        "Content-Type": "application/pdf",
        "Content-Disposition": `attachment; filename="${session.full_name.replace(/\s+/g, "_")}_Financial_Plan.pdf"`
      }
    })
  } catch (err) {
    console.error("PDF generation error:", err)
    return NextResponse.json(
      { error: `Failed to generate PDF: ${err instanceof Error ? err.message : "Unknown error"}` },
      { status: 500 }
    )
  }
}