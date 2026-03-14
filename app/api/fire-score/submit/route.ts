// app/api/fire-score/submit/route.ts
// API route to save FIRE Score results and send personalized email

import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { Resend } from "resend";
import FireScoreEmail from "@/emails/fire-score-email";

// Initialize clients
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

const resend = new Resend(process.env.RESEND_API_KEY);

// Types
interface Tip {
  priority: "critical" | "moderate" | "good";
  title: string;
  description: string;
  action: string;
}

interface SubmitRequest {
  name: string;
  email: string;
  answers: Record<string, string | string[]>;
  score: number;
}

// Generate tips based on answers
function generateTips(answers: Record<string, string | string[]>): Tip[] {
  const tips: Tip[] = [];

  // Income streams
  if (answers.income_streams === "1") {
    tips.push({
      priority: "critical",
      title: "Diversify Your Income",
      description:
        "You have 1 income source. The top 1% have 3-5 streams. This is your biggest vulnerability.",
      action: "Consider rental income, dividend portfolios, or a side business",
    });
  }

  // Debt ratio
  if (answers.debt_ratio === "35-50" || answers.debt_ratio === "50+") {
    tips.push({
      priority: "critical",
      title: "Reduce Debt Urgently",
      description:
        "Your debt-to-income ratio is dangerously high. This is blocking all wealth building.",
      action: "Focus on debt elimination before any other financial goal",
    });
  } else if (answers.debt_ratio === "20-35") {
    tips.push({
      priority: "moderate",
      title: "Reduce Debt Further",
      description:
        "Your debt-to-income ratio is moderate but could be improved. Target under 20%.",
      action: "Create a debt payoff plan using avalanche or snowball method",
    });
  }

  // Emergency fund
  if (answers.emergency_fund === "0" || answers.emergency_fund === "1-3") {
    tips.push({
      priority: "moderate",
      title: "Build Emergency Runway",
      description:
        "You have less than ideal emergency savings. Target is 6 months minimum.",
      action: "Automate $500/month to high-yield savings until target reached",
    });
  }

  // Tax strategy
  if (answers.tax_strategy === "none" || answers.tax_strategy === "basic") {
    tips.push({
      priority: "critical",
      title: "Implement Tax Strategy",
      description:
        "You're likely leaving $5,000-15,000 per year on the table without proper tax optimization.",
      action: "Consult with a CPA about tax-loss harvesting and entity structure",
    });
  }

  // Asset protection
  const protections = answers.asset_protection as string[];
  if (!protections || protections.length < 3 || protections.includes("none")) {
    tips.push({
      priority: "moderate",
      title: "Strengthen Asset Protection",
      description:
        "Your wealth is vulnerable. One lawsuit or life event could wipe out years of progress.",
      action: "Consider LLC structure, umbrella policy, and basic estate planning",
    });
  }

  // Retirement savings
  if (
    answers.retirement_savings === "0-5" ||
    answers.retirement_savings === "5-10"
  ) {
    tips.push({
      priority: "moderate",
      title: "Increase Retirement Contributions",
      description:
        "You're not maximizing tax-advantaged accounts. This costs you both now and later.",
      action: "Increase 401k contribution to at least get full employer match",
    });
  }

  // Investments
  const investments = answers.investments as string[];
  if (!investments || investments.length < 2 || investments.includes("none")) {
    tips.push({
      priority: "moderate",
      title: "Diversify Investments",
      description:
        "Your investment portfolio lacks diversification. This increases risk.",
      action: "Open a brokerage account and start with low-cost index funds",
    });
  }

  // If doing well, add a "good" tip
  if (tips.filter((t) => t.priority === "critical").length === 0) {
    tips.push({
      priority: "good",
      title: "You're On Track!",
      description:
        "Your fundamentals are solid. Now it's about optimization and acceleration.",
      action:
        "Consider advanced strategies like tax-loss harvesting and entity optimization",
    });
  }

  return tips.slice(0, 4); // Return max 4 tips
}

// Get percentile based on score
function getPercentile(score: number): string {
  if (score >= 85) return "top 5%";
  if (score >= 75) return "top 15%";
  if (score >= 60) return "top 30%";
  if (score >= 45) return "top 50%";
  return "bottom 50%";
}

// Identify weak areas
function getWeakAreas(answers: Record<string, string | string[]>): string[] {
  const weakAreas: string[] = [];

  if (answers.income_streams === "1") weakAreas.push("income");
  if (answers.debt_ratio === "35-50" || answers.debt_ratio === "50+")
    weakAreas.push("debt");
  if (answers.emergency_fund === "0" || answers.emergency_fund === "1-3")
    weakAreas.push("emergency");
  if (answers.tax_strategy === "none" || answers.tax_strategy === "basic")
    weakAreas.push("tax");

  const protections = answers.asset_protection as string[];
  if (!protections || protections.length < 3 || protections.includes("none"))
    weakAreas.push("protection");

  if (
    answers.retirement_savings === "0-5" ||
    answers.retirement_savings === "5-10"
  )
    weakAreas.push("retirement");

  return weakAreas;
}

export async function POST(request: NextRequest) {
  try {
    const body: SubmitRequest = await request.json();
    const { name, email, answers, score } = body;

    // Validate required fields
    if (!name || !email || !answers || score === undefined) {
      return NextResponse.json(
        { error: "Missing required fields" },
        { status: 400 }
      );
    }

    // Generate personalized content
    const tips = generateTips(answers);
    const percentile = getPercentile(score);
    const weakAreas = getWeakAreas(answers);

    // Get request metadata
    const ip = request.headers.get("x-forwarded-for") || "unknown";
    const userAgent = request.headers.get("user-agent") || "unknown";

    // Save to Supabase
    const { data: dbResult, error: dbError } = await supabase
      .from("fire_score_results")
      .insert({
        email,
        name,
        answers,
        income_streams: answers.income_streams as string,
        debt_ratio: answers.debt_ratio as string,
        emergency_fund: answers.emergency_fund as string,
        investments: answers.investments as string[],
        tax_strategy: answers.tax_strategy as string,
        asset_protection: answers.asset_protection as string[],
        retirement_savings: answers.retirement_savings as string,
        net_worth_growth: answers.net_worth_growth as string,
        total_score: score,
        percentile,
        weak_areas: weakAreas,
        tips,
        source: "website",
        ip_address: ip,
        user_agent: userAgent,
      })
      .select()
      .single();

    if (dbError) {
      console.error("Supabase error:", dbError);
      // Continue anyway - don't block the user experience
    }

    // Send email via Resend
    try {
      const { data: emailData, error: emailError } = await resend.emails.send({
        from: "WealthClaude <noreply@wealthclaude.com>", // Update with your verified domain
        to: email,
        subject: `Your FIRE Score: ${score}/100 - See Your Personalized Roadmap`,
        react: FireScoreEmail({
          name,
          score,
          percentile,
          tips,
        }),
      });

      if (emailError) {
        console.error("Resend error:", emailError);
      } else {
        // Update email_sent status in Supabase
        if (dbResult?.id) {
          await supabase
            .from("fire_score_results")
            .update({
              email_sent: true,
              email_sent_at: new Date().toISOString(),
            })
            .eq("id", dbResult.id);
        }
      }
    } catch (emailErr) {
      console.error("Email send error:", emailErr);
      // Continue anyway - don't block the user experience
    }

    // Return success with data for results page
    return NextResponse.json({
      success: true,
      data: {
        id: dbResult?.id,
        score,
        percentile,
        tips,
        weakAreas,
      },
    });
  } catch (error) {
    console.error("API error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}