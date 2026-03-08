import { NextRequest, NextResponse } from 'next/server'
import { cookies } from 'next/headers'
import { createServerSideClient } from '@/lib/supabase'
import type { FinancialSnapshot } from '@/components/ai-chat/financial-snapshot'

export async function POST(req: NextRequest) {
  try {
    // ── Auth check ─────────────────────────────────────────────────────
    const cookieStore = await cookies()
    const supabase = createServerSideClient(cookieStore)

    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser()

    if (!user || authError) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // ── Parse request ──────────────────────────────────────────────────
    const body = await req.json()
    const {
      message,
      portfolioSnapshot,
      chatHistory = [],
    }: {
      message: string
      portfolioSnapshot: FinancialSnapshot['portfolio'] | null
      chatHistory: Array<{ role: 'user' | 'assistant'; content: string }>
    } = body

    if (!message || typeof message !== 'string') {
      return NextResponse.json({ error: 'Message is required' }, { status: 400 })
    }

    // ── Fetch debts, goals, financial settings from Supabase ───────────
    const [debtsResult, goalsResult, settingsResult] = await Promise.all([
      supabase
        .from('user_debts')
        .select('name, type, balance, apr, min_payment')
        .eq('user_id', user.id),
      supabase
        .from('user_goals')
        .select('name, type, target_amount, current_amount, target_date')
        .eq('user_id', user.id),
      supabase
        .from('user_financial_settings')
        .select('risk_tolerance, annual_income, monthly_savings, tax_bracket')
        .eq('user_id', user.id)
        .maybeSingle(),
    ])

    const debts = (debtsResult.data ?? []).map((d: any) => ({
      name: d.name,
      type: d.type,
      balance: d.balance,
      apr: d.apr,
      minPayment: d.min_payment,
    }))

    const goals = (goalsResult.data ?? []).map((g: any) => ({
      name: g.name,
      type: g.type,
      targetAmount: g.target_amount,
      currentAmount: g.current_amount,
      targetDate: g.target_date,
    }))

    const financialProfile = settingsResult.data
      ? {
        riskTolerance: settingsResult.data.risk_tolerance ?? 'moderate',
        annualIncome: settingsResult.data.annual_income ?? 0,
        monthlyExpenses: settingsResult.data.monthly_savings ?? 0,
        taxBracket: settingsResult.data.tax_bracket ?? 0,
      }
      : null

    // ── Build full financial snapshot ───────────────────────────────────
    const fullSnapshot: FinancialSnapshot = {
      portfolio: portfolioSnapshot ?? ({} as any),
      debts,
      goals,
      financialProfile,
    }

    // ── Build system prompt ────────────────────────────────────────────
    const systemPrompt = buildSystemPrompt(fullSnapshot)

    // ── Build messages array (last 10 messages for context) ────────────
    const recentHistory = chatHistory.slice(-10)

    const messages = [
      { role: 'system' as const, content: systemPrompt },
      ...recentHistory.map((m) => ({
        role: m.role as 'user' | 'assistant',
        content: m.content,
      })),
      { role: 'user' as const, content: message },
    ]

    // ── For now, return the prepared data (LLM call comes in Phase 3) ──
    // This lets us test that data flows correctly before adding Groq
    return NextResponse.json({
      success: true,
      debug: {
        userId: user.id,
        hasPortfolioData: !!portfolioSnapshot,
        holdingsCount: portfolioSnapshot?.holdings?.length ?? 0,
        debtsCount: debts.length,
        goalsCount: goals.length,
        hasFinancialProfile: !!financialProfile,
        messageCount: messages.length,
        message: message,
      },
      // Placeholder response until Phase 3 connects Groq
      response:
        "I'm connected to your data! I can see your portfolio, debts, and goals. The LLM will be wired up in Phase 3 to give you real answers.",
    })
  } catch (error) {
    console.error('[AI Chat] Error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

// ── System Prompt Builder ────────────────────────────────────────────────

function buildSystemPrompt(snapshot: FinancialSnapshot): string {
  const { portfolio, debts, goals, financialProfile } = snapshot

  let prompt = `You are WealthClaude AI, a personal financial assistant built into the WealthClaude portfolio tracker.

RULES:
- Always reference the user's ACTUAL data — never give generic advice.
- Use specific numbers, symbols, and percentages from their portfolio.
- If data is missing or empty, say so honestly.
- For debt questions, explain both snowball (smallest balance first) and avalanche (highest APR first) strategies, then recommend which fits their situation.
- For diversification questions, check sector concentration and number of holdings.
- Always end with a brief disclaimer that you're not a licensed financial advisor.
- Keep responses concise but thorough. Use markdown for formatting.
- Be warm and helpful, like a knowledgeable friend who understands finance.

`

  // Portfolio data
  if (portfolio && portfolio.portfolio?.totalValue > 0) {
    prompt += `=== USER'S PORTFOLIO ===
Total Value: $${portfolio.portfolio.totalValue.toLocaleString()}
Total Cost: $${portfolio.portfolio.totalCost.toLocaleString()}
Total Gain: $${portfolio.portfolio.totalGain.toLocaleString()} (${portfolio.portfolio.totalGainPercent.toFixed(2)}%)
Today's Change: $${portfolio.portfolio.todayGain.toLocaleString()} (${portfolio.portfolio.todayGainPercent.toFixed(2)}%)
Number of Holdings: ${portfolio.portfolio.holdingsCount}

`

    // Holdings
    if (portfolio.holdings && portfolio.holdings.length > 0) {
      prompt += `=== HOLDINGS ===\n`
      portfolio.holdings.forEach((h) => {
        prompt += `${h.symbol}: ${h.shares} shares @ $${h.currentPrice.toFixed(2)} | Sector: ${h.sector} | Allocation: ${h.allocation.toFixed(1)}% | Gain: ${h.gainPercent.toFixed(2)}%\n`
      })
      prompt += '\n'
    }

    // Allocation
    if (portfolio.allocation?.bySector && Object.keys(portfolio.allocation.bySector).length > 0) {
      prompt += `=== SECTOR ALLOCATION ===\n`
      const totalValue = portfolio.portfolio.totalValue
      Object.entries(portfolio.allocation.bySector)
        .sort(([, a], [, b]) => (b as number) - (a as number))
        .forEach(([sector, value]) => {
          const pct = totalValue > 0 ? ((value as number) / totalValue * 100).toFixed(1) : '0'
          prompt += `${sector}: ${pct}% ($${(value as number).toLocaleString()})\n`
        })
      prompt += '\n'
    }

    // Risk
    if (portfolio.risk) {
      prompt += `=== RISK METRICS ===
Diversification Score: ${portfolio.risk.diversificationScore.toFixed(0)}/100
Concentration (HHI): ${portfolio.risk.concentration.toFixed(1)}%
Value at Risk (5%): $${portfolio.risk.valueAtRisk.toLocaleString()}

`
    }

    // Benchmarks
    if (portfolio.benchmarks) {
      prompt += `=== VS BENCHMARKS ===
vs S&P 500: ${portfolio.benchmarks.vsSP500 >= 0 ? '+' : ''}${portfolio.benchmarks.vsSP500.toFixed(2)}%
vs NASDAQ: ${portfolio.benchmarks.vsNASDAQ >= 0 ? '+' : ''}${portfolio.benchmarks.vsNASDAQ.toFixed(2)}%

`
    }

    // Tax
    if (portfolio.tax) {
      prompt += `=== TAX SITUATION ===
Short-term Gains: $${portfolio.tax.shortTermGains.toLocaleString()}
Long-term Gains: $${portfolio.tax.longTermGains.toLocaleString()}
Estimated Tax Liability: $${portfolio.tax.estimatedTaxLiability.toLocaleString()}

`
    }
  } else {
    prompt += `=== PORTFOLIO ===
No portfolio data available. The user may not have added transactions yet.

`
  }

  // Debts
  if (debts.length > 0) {
    prompt += `=== USER'S DEBTS ===\n`
    let totalDebt = 0
    debts.forEach((d) => {
      prompt += `${d.name} (${d.type}): $${d.balance.toLocaleString()} at ${d.apr}% APR | Min payment: $${d.minPayment}/month\n`
      totalDebt += d.balance
    })
    prompt += `Total Debt: $${totalDebt.toLocaleString()}\n\n`
  } else {
    prompt += `=== DEBTS ===
No debts recorded.

`
  }

  // Goals
  if (goals.length > 0) {
    prompt += `=== FINANCIAL GOALS ===\n`
    goals.forEach((g) => {
      const progress = g.targetAmount > 0 ? ((g.currentAmount / g.targetAmount) * 100).toFixed(1) : '0'
      prompt += `${g.name} (${g.type}): $${g.currentAmount.toLocaleString()} / $${g.targetAmount.toLocaleString()} (${progress}%) | Target: ${g.targetDate}\n`
    })
    prompt += '\n'
  } else {
    prompt += `=== GOALS ===
No financial goals recorded.

`
  }

  // Financial profile
  if (financialProfile) {
    prompt += `=== FINANCIAL PROFILE ===
Risk Tolerance: ${financialProfile.riskTolerance}
Annual Income: $${financialProfile.annualIncome.toLocaleString()}
Tax Bracket: ${financialProfile.taxBracket}%
`
  }

  return prompt
}