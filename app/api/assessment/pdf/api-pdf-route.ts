import { NextRequest, NextResponse } from "next/server"
import { createClient } from "@supabase/supabase-js"
import { renderToBuffer } from "@react-pdf/renderer"
import { Document, Page, Text, View, StyleSheet } from "@react-pdf/renderer"
import React from "react"

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

// PDF Styles
const styles = StyleSheet.create({
  page: {
    padding: 40,
    fontFamily: "Helvetica",
    fontSize: 11,
    color: "#333"
  },
  header: {
    marginBottom: 30,
    borderBottom: "2 solid #16a34a",
    paddingBottom: 20
  },
  title: {
    fontSize: 24,
    fontFamily: "Helvetica-Bold",
    color: "#16a34a",
    marginBottom: 5
  },
  subtitle: {
    fontSize: 14,
    color: "#666"
  },
  scoreBox: {
    backgroundColor: "#f4f4f5",
    padding: 20,
    borderRadius: 8,
    marginBottom: 25,
    flexDirection: "row",
    justifyContent: "space-around"
  },
  scoreItem: {
    alignItems: "center"
  },
  scoreValue: {
    fontSize: 32,
    fontFamily: "Helvetica-Bold",
    color: "#16a34a"
  },
  scoreLabel: {
    fontSize: 10,
    color: "#666",
    marginTop: 5
  },
  section: {
    marginBottom: 25
  },
  sectionTitle: {
    fontSize: 14,
    fontFamily: "Helvetica-Bold",
    color: "#16a34a",
    marginBottom: 10,
    borderBottom: "1 solid #e5e5e5",
    paddingBottom: 5
  },
  paragraph: {
    marginBottom: 10,
    lineHeight: 1.5
  },
  goalItem: {
    backgroundColor: "#f9fafb",
    padding: 12,
    marginBottom: 8,
    borderRadius: 4
  },
  goalTitle: {
    fontFamily: "Helvetica-Bold",
    marginBottom: 3
  },
  goalMeta: {
    fontSize: 10,
    color: "#666"
  },
  actionItem: {
    flexDirection: "row",
    marginBottom: 8
  },
  actionNumber: {
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: "#16a34a",
    color: "white",
    textAlign: "center",
    fontSize: 10,
    lineHeight: 20,
    marginRight: 10
  },
  actionText: {
    flex: 1
  },
  warning: {
    backgroundColor: "#fef3c7",
    borderLeft: "3 solid #f59e0b",
    padding: 12,
    marginBottom: 8
  },
  footer: {
    position: "absolute",
    bottom: 30,
    left: 40,
    right: 40,
    textAlign: "center",
    fontSize: 9,
    color: "#999",
    borderTop: "1 solid #e5e5e5",
    paddingTop: 10
  }
})

// PDF Document Component
interface PlanPDFProps {
  session: {
    full_name: string
  }
  result: {
    overall_score: number
    personality_type: string
  }
  plan: {
    plan_type: string
    executive_summary: string
    goals: Array<{ goal: string; target: string; timeline: string; type: string }>
    action_items: Array<{ action: string }>
    ai_recommendations: string
    ai_warnings: string
  }
}

const personalityLabels: Record<string, string> = {
  cautious_saver: "Cautious Saver",
  balanced_planner: "Balanced Planner",
  growth_investor: "Growth Investor",
  spontaneous_spender: "Spontaneous Spender",
  risk_taker: "Risk Taker",
  money_avoider: "Money Avoider",
  security_seeker: "Security Seeker"
}

function PlanPDF({ session, result, plan }: PlanPDFProps) {
  const shortTermGoals = plan.goals.filter(g => g.type === "short_term")
  const mediumTermGoals = plan.goals.filter(g => g.type === "medium_term")
  
  let recommendations: Array<{ area: string; advice: string }> = []
  let warnings: string[] = []
  
  try {
    recommendations = JSON.parse(plan.ai_recommendations || "[]")
    warnings = JSON.parse(plan.ai_warnings || "[]")
  } catch {
    // Ignore parse errors
  }

  return (
    <Document>
      <Page size="A4" style={styles.page}>
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.title}>Personalized Financial Plan</Text>
          <Text style={styles.subtitle}>Prepared for {session.full_name}</Text>
          <Text style={{ fontSize: 10, color: "#999", marginTop: 5 }}>
            Generated on {new Date().toLocaleDateString()} | {plan.plan_type.charAt(0).toUpperCase() + plan.plan_type.slice(1)} Plan
          </Text>
        </View>

        {/* Score Box */}
        <View style={styles.scoreBox}>
          <View style={styles.scoreItem}>
            <Text style={styles.scoreValue}>{result.overall_score}</Text>
            <Text style={styles.scoreLabel}>Financial Health Score</Text>
          </View>
          <View style={styles.scoreItem}>
            <Text style={{ fontSize: 14, fontFamily: "Helvetica-Bold", color: "#333" }}>
              {personalityLabels[result.personality_type] || result.personality_type}
            </Text>
            <Text style={styles.scoreLabel}>Personality Type</Text>
          </View>
        </View>

        {/* Executive Summary */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Executive Summary</Text>
          <Text style={styles.paragraph}>{plan.executive_summary}</Text>
        </View>

        {/* Immediate Actions */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Your First Steps</Text>
          {plan.action_items.slice(0, 5).map((item, i) => (
            <View key={i} style={styles.actionItem}>
              <Text style={styles.actionNumber}>{i + 1}</Text>
              <Text style={styles.actionText}>{item.action}</Text>
            </View>
          ))}
        </View>

        {/* Footer */}
        <Text style={styles.footer}>
          WealthClaude | wealthclaude.com | This plan is for educational purposes only.
        </Text>
      </Page>

      {/* Page 2 - Goals */}
      <Page size="A4" style={styles.page}>
        {/* Short-Term Goals */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Short-Term Goals (1-6 Months)</Text>
          {shortTermGoals.map((goal, i) => (
            <View key={i} style={styles.goalItem}>
              <Text style={styles.goalTitle}>{goal.goal}</Text>
              <Text style={styles.goalMeta}>Target: {goal.target} | Timeline: {goal.timeline}</Text>
            </View>
          ))}
        </View>

        {/* Medium-Term Goals */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Medium-Term Goals (6-12 Months)</Text>
          {mediumTermGoals.map((goal, i) => (
            <View key={i} style={styles.goalItem}>
              <Text style={styles.goalTitle}>{goal.goal}</Text>
              <Text style={styles.goalMeta}>Target: {goal.target} | Timeline: {goal.timeline}</Text>
            </View>
          ))}
        </View>

        {/* Recommendations */}
        {recommendations.length > 0 && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Personalized Recommendations</Text>
            {recommendations.map((rec, i) => (
              <View key={i} style={styles.goalItem}>
                <Text style={styles.goalTitle}>{rec.area.replace(/_/g, " ")}</Text>
                <Text style={{ fontSize: 10 }}>{rec.advice}</Text>
              </View>
            ))}
          </View>
        )}

        {/* Warnings */}
        {warnings.length > 0 && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Important Considerations</Text>
            {warnings.map((warning, i) => (
              <View key={i} style={styles.warning}>
                <Text style={{ fontSize: 10 }}>{warning}</Text>
              </View>
            ))}
          </View>
        )}

        {/* Footer */}
        <Text style={styles.footer}>
          WealthClaude | wealthclaude.com | This plan is for educational purposes only.
        </Text>
      </Page>
    </Document>
  )
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

    // Generate PDF
    const pdfBuffer = await renderToBuffer(
      React.createElement(PlanPDF, {
        session,
        result,
        plan: {
          plan_type: plan.plan_type,
          executive_summary: plan.executive_summary,
          goals: plan.goals as Array<{ goal: string; target: string; timeline: string; type: string }>,
          action_items: plan.action_items as Array<{ action: string }>,
          ai_recommendations: plan.ai_recommendations,
          ai_warnings: plan.ai_warnings
        }
      })
    )

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
      { error: "Failed to generate PDF" },
      { status: 500 }
    )
  }
}
