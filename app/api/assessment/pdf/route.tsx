import { NextRequest, NextResponse } from "next/server"
import { createClient } from "@supabase/supabase-js"
import { jsPDF } from "jspdf"

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

const personalityLabels: Record<string, { label: string; description: string }> = {
  cautious_saver: { label: "Cautious Saver", description: "Security-focused, prefers low-risk strategies" },
  balanced_planner: { label: "Balanced Planner", description: "Methodical approach, balances risk and reward" },
  growth_investor: { label: "Growth Investor", description: "Focused on wealth building, embraces calculated risks" },
  spontaneous_spender: { label: "Spontaneous Spender", description: "Impulse-driven, benefits from automation" },
  risk_taker: { label: "Risk Taker", description: "High risk tolerance, seeks aggressive returns" },
  money_avoider: { label: "Money Avoider", description: "Needs guidance and simplified strategies" },
  security_seeker: { label: "Security Seeker", description: "Prioritizes stability over growth" }
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
      .select("full_name, email, problem_type")
      .eq("id", sessionId)
      .single()

    if (sessionError || !session) {
      return NextResponse.json({ error: "Session not found" }, { status: 404 })
    }

    // Get result
    const { data: result, error: resultError } = await supabase
      .from("assessment_results")
      .select("overall_score, personality_type, factor_scores, strengths, weaknesses")
      .eq("session_id", sessionId)
      .single()

    if (resultError || !result) {
      return NextResponse.json({ error: "Results not found" }, { status: 404 })
    }

    // Get plan
    const { data: plan, error: planError } = await supabase
      .from("financial_plans")
      .select("*")
      .eq("id", planId)
      .single()

    if (planError || !plan) {
      return NextResponse.json({ error: "Plan not found" }, { status: 404 })
    }

    // Parse data
    const goals = (plan.goals || []) as Array<{ goal: string; target: string; timeline: string; type: string }>
    const actionItems = (plan.action_items || []) as Array<{ action: string }>
    const factorScores = (result.factor_scores || []) as Array<{ factorId: string; score: number }>
    const strengths = (result.strengths || []) as string[]
    const weaknesses = (result.weaknesses || []) as string[]

    let warnings: string[] = []
    let recommendations: Array<{ area: string; advice: string }> = []
    try {
      warnings = JSON.parse(plan.ai_warnings || "[]")
      recommendations = JSON.parse(plan.ai_recommendations || "[]")
    } catch { /* ignore */ }

    const personality = personalityLabels[result.personality_type] || {
      label: result.personality_type,
      description: "Financial personality profile"
    }

    // Create PDF
    const doc = new jsPDF()
    const pageWidth = doc.internal.pageSize.getWidth()
    const pageHeight = doc.internal.pageSize.getHeight()
    const margin = 15
    const contentWidth = pageWidth - (margin * 2)
    let y = 0

    // Colors
    const primaryGreen = [22, 163, 74] as const
    const darkGreen = [21, 128, 61] as const
    const purple = [147, 51, 234] as const
    const darkText = [24, 24, 27] as const
    const grayText = [113, 113, 122] as const
    const lightBg = [250, 250, 250] as const
    const cardBg = [255, 255, 255] as const
    const amberBg = [254, 243, 199] as const
    const amberText = [180, 83, 9] as const

    // Helper: Draw rounded rectangle
    const roundedRect = (x: number, y: number, w: number, h: number, r: number, fill: readonly [number, number, number]) => {
      doc.setFillColor(fill[0], fill[1], fill[2])
      doc.roundedRect(x, y, w, h, r, r, "F")
    }

    // Helper: Draw progress bar
    const drawProgressBar = (x: number, y: number, width: number, height: number, progress: number, color: readonly [number, number, number]) => {
      doc.setFillColor(229, 231, 235)
      doc.roundedRect(x, y, width, height, height / 2, height / 2, "F")
      if (progress > 0) {
        doc.setFillColor(color[0], color[1], color[2])
        doc.roundedRect(x, y, Math.max(width * (progress / 100), height), height, height / 2, height / 2, "F")
      }
    }

    // Helper: Wrapped text
    const addWrappedText = (text: string, x: number, startY: number, maxWidth: number, lineHeight: number = 5): number => {
      const lines = doc.splitTextToSize(text, maxWidth)
      lines.forEach((line: string) => {
        if (startY > 275) {
          doc.addPage()
          startY = margin + 10
        }
        doc.text(line, x, startY)
        startY += lineHeight
      })
      return startY
    }

    // Helper: Add new page if needed
    const checkPageBreak = (neededSpace: number): void => {
      if (y + neededSpace > pageHeight - 20) {
        doc.addPage()
        y = margin + 10
      }
    }

    // ============ PAGE 1: COVER ============

    // Gradient Header (simulated with rectangles)
    for (let i = 0; i < 60; i++) {
      const ratio = i / 60
      const r = Math.round(primaryGreen[0] + (purple[0] - primaryGreen[0]) * ratio)
      const g = Math.round(primaryGreen[1] + (purple[1] - primaryGreen[1]) * ratio)
      const b = Math.round(primaryGreen[2] + (purple[2] - primaryGreen[2]) * ratio)
      doc.setFillColor(r, g, b)
      doc.rect(0, i, pageWidth, 1, "F")
    }

    // Logo & Title
    doc.setTextColor(255, 255, 255)
    doc.setFontSize(28)
    doc.setFont("helvetica", "bold")
    doc.text("WEALTHCLAUDE", margin, 28)

    doc.setFontSize(14)
    doc.setFont("helvetica", "normal")
    doc.text("Your Personal Financial Plan", margin, 38)

    doc.setFontSize(10)
    doc.text("Prepared for " + session.full_name + "  |  " + new Date().toLocaleDateString("en-US", { month: "long", day: "numeric", year: "numeric" }), margin, 52)

    y = 75

    // Score Cards Row
    const cardWidth = (contentWidth - 10) / 3
    const cardHeight = 45

    // Card 1: Score
    roundedRect(margin, y, cardWidth, cardHeight, 4, cardBg)
    doc.setFillColor(primaryGreen[0], primaryGreen[1], primaryGreen[2])
    doc.roundedRect(margin, y, cardWidth, 4, 2, 2, "F")

    doc.setTextColor(primaryGreen[0], primaryGreen[1], primaryGreen[2])
    doc.setFontSize(32)
    doc.setFont("helvetica", "bold")
    doc.text(String(result.overall_score), margin + cardWidth / 2, y + 25, { align: "center" })

    doc.setTextColor(grayText[0], grayText[1], grayText[2])
    doc.setFontSize(9)
    doc.setFont("helvetica", "normal")
    doc.text("Financial Score", margin + cardWidth / 2, y + 38, { align: "center" })

    // Card 2: Personality
    const card2X = margin + cardWidth + 5
    roundedRect(card2X, y, cardWidth, cardHeight, 4, cardBg)
    doc.setFillColor(purple[0], purple[1], purple[2])
    doc.roundedRect(card2X, y, cardWidth, 4, 2, 2, "F")

    doc.setTextColor(purple[0], purple[1], purple[2])
    doc.setFontSize(11)
    doc.setFont("helvetica", "bold")
    doc.text(personality.label, card2X + cardWidth / 2, y + 22, { align: "center" })

    doc.setTextColor(grayText[0], grayText[1], grayText[2])
    doc.setFontSize(8)
    doc.setFont("helvetica", "normal")
    const descLines = doc.splitTextToSize(personality.description, cardWidth - 10)
    doc.text(descLines, card2X + cardWidth / 2, y + 32, { align: "center" })

    // Card 3: Plan Type
    const card3X = margin + (cardWidth + 5) * 2
    roundedRect(card3X, y, cardWidth, cardHeight, 4, cardBg)
    doc.setFillColor(darkGreen[0], darkGreen[1], darkGreen[2])
    doc.roundedRect(card3X, y, cardWidth, 4, 2, 2, "F")

    doc.setTextColor(darkGreen[0], darkGreen[1], darkGreen[2])
    doc.setFontSize(14)
    doc.setFont("helvetica", "bold")
    doc.text(plan.plan_type.charAt(0).toUpperCase() + plan.plan_type.slice(1), card3X + cardWidth / 2, y + 22, { align: "center" })

    doc.setTextColor(grayText[0], grayText[1], grayText[2])
    doc.setFontSize(9)
    doc.setFont("helvetica", "normal")
    doc.text("Plan Type", card3X + cardWidth / 2, y + 34, { align: "center" })

    y += cardHeight + 15

    // Section: Score Breakdown
    doc.setTextColor(darkText[0], darkText[1], darkText[2])
    doc.setFontSize(14)
    doc.setFont("helvetica", "bold")
    doc.text("Your Financial Health Breakdown", margin, y)
    y += 10

    // Progress bars for each factor
    const barHeight = 6
    const sortedFactors = [...factorScores].sort((a, b) => b.score - a.score)

    sortedFactors.slice(0, 6).forEach((factor) => {
      checkPageBreak(15)

      const label = factor.factorId.replace(/_/g, " ").replace(/\b\w/g, l => l.toUpperCase())
      const score = factor.score

      let statusColor: readonly [number, number, number]
      if (score >= 70) {
        statusColor = primaryGreen
      } else if (score >= 40) {
        statusColor = [234, 179, 8]
      } else {
        statusColor = [239, 68, 68]
      }

      doc.setFillColor(statusColor[0], statusColor[1], statusColor[2])
      doc.circle(margin + 3, y - 1, 2, "F")

      doc.setTextColor(darkText[0], darkText[1], darkText[2])
      doc.setFontSize(9)
      doc.setFont("helvetica", "normal")
      doc.text(label, margin + 8, y)

      doc.setTextColor(grayText[0], grayText[1], grayText[2])
      doc.setFontSize(9)
      doc.setFont("helvetica", "bold")
      doc.text(score + "%", pageWidth - margin, y, { align: "right" })

      y += 4
      drawProgressBar(margin + 8, y, contentWidth - 30, barHeight, score, statusColor)
      y += barHeight + 8
    })

    y += 5

    // Strengths & Weaknesses
    checkPageBreak(50)

    const halfWidth = (contentWidth - 10) / 2

    // Strengths Card
    roundedRect(margin, y, halfWidth, 45, 4, [240, 253, 244])
    doc.setTextColor(primaryGreen[0], primaryGreen[1], primaryGreen[2])
    doc.setFontSize(10)
    doc.setFont("helvetica", "bold")
    doc.text("Strengths", margin + 8, y + 12)

    doc.setTextColor(darkText[0], darkText[1], darkText[2])
    doc.setFontSize(8)
    doc.setFont("helvetica", "normal")
    let strengthY = y + 20
    strengths.slice(0, 3).forEach(s => {
      doc.text("- " + s.replace(/_/g, " "), margin + 8, strengthY)
      strengthY += 7
    })

    // Weaknesses Card
    const weakX = margin + halfWidth + 10
    roundedRect(weakX, y, halfWidth, 45, 4, [254, 242, 242])
    doc.setTextColor(239, 68, 68)
    doc.setFontSize(10)
    doc.setFont("helvetica", "bold")
    doc.text("Areas to Improve", weakX + 8, y + 12)

    doc.setTextColor(darkText[0], darkText[1], darkText[2])
    doc.setFontSize(8)
    doc.setFont("helvetica", "normal")
    let weakY = y + 20
    weaknesses.slice(0, 3).forEach(w => {
      doc.text("- " + w.replace(/_/g, " "), weakX + 8, weakY)
      weakY += 7
    })

    // ============ PAGE 2: ACTION PLAN ============
    doc.addPage()
    y = margin

    // Header bar
    doc.setFillColor(primaryGreen[0], primaryGreen[1], primaryGreen[2])
    doc.rect(0, 0, pageWidth, 8, "F")

    doc.setTextColor(darkText[0], darkText[1], darkText[2])
    doc.setFontSize(18)
    doc.setFont("helvetica", "bold")
    doc.text("Your Action Plan", margin, y + 18)
    y += 28

    // Executive Summary
    roundedRect(margin, y, contentWidth, 40, 4, lightBg)
    doc.setTextColor(grayText[0], grayText[1], grayText[2])
    doc.setFontSize(8)
    doc.setFont("helvetica", "bold")
    doc.text("EXECUTIVE SUMMARY", margin + 8, y + 10)

    doc.setTextColor(darkText[0], darkText[1], darkText[2])
    doc.setFontSize(9)
    doc.setFont("helvetica", "normal")
    const summaryLines = doc.splitTextToSize(plan.executive_summary || "", contentWidth - 16)
    doc.text(summaryLines.slice(0, 4), margin + 8, y + 18)
    y += 50

    // First Steps
    doc.setTextColor(darkText[0], darkText[1], darkText[2])
    doc.setFontSize(12)
    doc.setFont("helvetica", "bold")
    doc.text("Your First Steps (Next 30 Days)", margin, y)
    y += 8

    actionItems.slice(0, 5).forEach((item, i) => {
      checkPageBreak(18)

      // Number badge
      doc.setFillColor(primaryGreen[0], primaryGreen[1], primaryGreen[2])
      doc.circle(margin + 6, y + 4, 5, "F")
      doc.setTextColor(255, 255, 255)
      doc.setFontSize(8)
      doc.setFont("helvetica", "bold")
      doc.text(String(i + 1), margin + 4.5, y + 6)

      // Action text
      doc.setTextColor(darkText[0], darkText[1], darkText[2])
      doc.setFontSize(9)
      doc.setFont("helvetica", "normal")
      const actionLines = doc.splitTextToSize(item.action, contentWidth - 20)
      doc.text(actionLines[0], margin + 16, y + 5)
      if (actionLines[1]) {
        doc.text(actionLines[1], margin + 16, y + 10)
      }
      y += actionLines.length > 1 ? 16 : 12
    })

    y += 10

    // Short-Term Goals
    const shortTermGoals = goals.filter(g => g.type === "short_term")
    if (shortTermGoals.length > 0) {
      checkPageBreak(30)

      doc.setTextColor(darkText[0], darkText[1], darkText[2])
      doc.setFontSize(12)
      doc.setFont("helvetica", "bold")
      doc.text("Short-Term Goals (1-6 Months)", margin, y)
      y += 8

      shortTermGoals.forEach((goal) => {
        checkPageBreak(22)

        roundedRect(margin, y, contentWidth, 18, 3, cardBg)
        doc.setDrawColor(229, 231, 235)
        doc.roundedRect(margin, y, contentWidth, 18, 3, 3, "S")

        doc.setTextColor(darkText[0], darkText[1], darkText[2])
        doc.setFontSize(9)
        doc.setFont("helvetica", "bold")
        doc.text(goal.goal, margin + 6, y + 7)

        doc.setTextColor(grayText[0], grayText[1], grayText[2])
        doc.setFontSize(8)
        doc.setFont("helvetica", "normal")
        doc.text("Target: " + goal.target + "  |  " + (goal.timeline || ""), margin + 6, y + 14)

        y += 22
      })
    }

    y += 5

    // Medium-Term Goals
    const mediumTermGoals = goals.filter(g => g.type === "medium_term")
    if (mediumTermGoals.length > 0) {
      checkPageBreak(30)

      doc.setTextColor(darkText[0], darkText[1], darkText[2])
      doc.setFontSize(12)
      doc.setFont("helvetica", "bold")
      doc.text("Medium-Term Goals (6-12 Months)", margin, y)
      y += 8

      mediumTermGoals.forEach((goal) => {
        checkPageBreak(22)

        roundedRect(margin, y, contentWidth, 18, 3, cardBg)
        doc.setDrawColor(229, 231, 235)
        doc.roundedRect(margin, y, contentWidth, 18, 3, 3, "S")

        doc.setTextColor(darkText[0], darkText[1], darkText[2])
        doc.setFontSize(9)
        doc.setFont("helvetica", "bold")
        doc.text(goal.goal, margin + 6, y + 7)

        doc.setTextColor(grayText[0], grayText[1], grayText[2])
        doc.setFontSize(8)
        doc.setFont("helvetica", "normal")
        doc.text("Target: " + goal.target + "  |  " + (goal.timeline || ""), margin + 6, y + 14)

        y += 22
      })
    }

    // ============ PAGE 3: RECOMMENDATIONS ============
    doc.addPage()
    y = margin

    // Header bar
    doc.setFillColor(purple[0], purple[1], purple[2])
    doc.rect(0, 0, pageWidth, 8, "F")

    doc.setTextColor(darkText[0], darkText[1], darkText[2])
    doc.setFontSize(18)
    doc.setFont("helvetica", "bold")
    doc.text("Personalized Recommendations", margin, y + 18)
    y += 30

    // Recommendations
    recommendations.forEach((rec) => {
      checkPageBreak(35)

      doc.setFillColor(purple[0], purple[1], purple[2])
      doc.circle(margin + 4, y + 2, 3, "F")

      doc.setTextColor(darkText[0], darkText[1], darkText[2])
      doc.setFontSize(11)
      doc.setFont("helvetica", "bold")
      doc.text(rec.area.replace(/_/g, " ").replace(/\b\w/g, l => l.toUpperCase()), margin + 12, y + 4)
      y += 10

      doc.setTextColor(grayText[0], grayText[1], grayText[2])
      doc.setFontSize(9)
      doc.setFont("helvetica", "normal")
      y = addWrappedText(rec.advice, margin + 12, y, contentWidth - 12, 5)
      y += 10
    })

    y += 10

    // Warnings
    if (warnings.length > 0) {
      checkPageBreak(40)

      doc.setTextColor(amberText[0], amberText[1], amberText[2])
      doc.setFontSize(12)
      doc.setFont("helvetica", "bold")
      doc.text("Important Considerations", margin, y)
      y += 10

      warnings.forEach((warning) => {
        checkPageBreak(25)

        roundedRect(margin, y, contentWidth, 18, 3, amberBg)
        doc.setDrawColor(251, 191, 36)
        doc.roundedRect(margin, y, contentWidth, 18, 3, 3, "S")

        doc.setTextColor(amberText[0], amberText[1], amberText[2])
        doc.setFontSize(8)
        doc.setFont("helvetica", "normal")
        const warningLines = doc.splitTextToSize(warning, contentWidth - 16)
        doc.text(warningLines.slice(0, 2), margin + 8, y + 8)

        y += 22
      })
    }

    // ============ FOOTER ON ALL PAGES ============
    const totalPages = doc.getNumberOfPages()
    for (let i = 1; i <= totalPages; i++) {
      doc.setPage(i)

      // Footer line
      doc.setDrawColor(229, 231, 235)
      doc.setLineWidth(0.5)
      doc.line(margin, pageHeight - 15, pageWidth - margin, pageHeight - 15)

      // Footer text
      doc.setTextColor(grayText[0], grayText[1], grayText[2])
      doc.setFontSize(7)
      doc.setFont("helvetica", "normal")
      doc.text("WEALTHCLAUDE", margin, pageHeight - 8)
      doc.text("wealthclaude.com", margin + 30, pageHeight - 8)
      doc.text("Confidential", pageWidth / 2, pageHeight - 8, { align: "center" })
      doc.text("Page " + i + " of " + totalPages, pageWidth - margin, pageHeight - 8, { align: "right" })
    }

    // Generate PDF buffer
    const pdfBuffer = Buffer.from(doc.output("arraybuffer"))

    return new NextResponse(pdfBuffer, {
      headers: {
        "Content-Type": "application/pdf",
        "Content-Disposition": "attachment; filename=\"" + session.full_name.replace(/\s+/g, "_") + "_WealthClaude_Plan.pdf\""
      }
    })
  } catch (err) {
    console.error("PDF generation error:", err)
    return NextResponse.json(
      { error: "Failed to generate PDF: " + (err instanceof Error ? err.message : "Unknown error") },
      { status: 500 }
    )
  }
}