import { NextRequest, NextResponse } from 'next/server'
import { cookies } from 'next/headers'
import { createServerSideClient } from '@/lib/supabase'
import type { FinancialSnapshot } from '@/components/ai-chat/financial-snapshot'

const GROQ_API_URL = 'https://api.groq.com/openai/v1/chat/completions'
const GROQ_MODEL = 'llama-3.3-70b-versatile'

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
        .select('target_value, current_savings, contribution_amount, contribution_type, expected_return, include_portfolio')
        .eq('user_id', user.id),
      supabase
        .from('user_financial_settings')
        .select('monthly_income, monthly_expenses, include_portfolio, include_dividends')
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
      targetValue: g.target_value,
      currentSavings: g.current_savings,
      contributionAmount: g.contribution_amount,
      contributionType: g.contribution_type,
      expectedReturn: g.expected_return,
      includePortfolio: g.include_portfolio,
    }))

    const financialProfile = settingsResult.data
      ? {
        monthlyIncome: settingsResult.data.monthly_income ?? 0,
        monthlyExpenses: settingsResult.data.monthly_expenses ?? 0,
        includePortfolio: settingsResult.data.include_portfolio ?? false,
        includeDividends: settingsResult.data.include_dividends ?? false,
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

    const groqMessages = [
      { role: 'system' as const, content: systemPrompt },
      ...recentHistory.map((m) => ({
        role: m.role as 'user' | 'assistant',
        content: m.content,
      })),
      { role: 'user' as const, content: message },
    ]

    // ── Call Groq API ──────────────────────────────────────────────────
    const groqApiKey = process.env.GROQ_API_KEY
    if (!groqApiKey) {
      console.error('[AI Chat] GROQ_API_KEY is not set')
      return NextResponse.json(
        { response: 'AI service is not configured. Please add your GROQ_API_KEY.' },
        { status: 500 }
      )
    }

    const groqResponse = await fetch(GROQ_API_URL, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${groqApiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: GROQ_MODEL,
        messages: groqMessages,
        temperature: 0.7,
        max_tokens: 1024,
        top_p: 0.9,
      }),
    })

    if (!groqResponse.ok) {
      const errorText = await groqResponse.text()
      console.error('[AI Chat] Groq API error:', groqResponse.status, errorText)

      // If rate limited, return a friendly message
      if (groqResponse.status === 429) {
        return NextResponse.json({
          response: "I'm getting a lot of questions right now. Please wait a moment and try again.",
        })
      }

      return NextResponse.json({
        response: "Sorry, I had trouble thinking about that. Please try again.",
      })
    }

    const groqData = await groqResponse.json()
    const aiResponse = groqData.choices?.[0]?.message?.content ?? 'Sorry, I couldn\'t generate a response.'

    return NextResponse.json({
      success: true,
      response: aiResponse,
    })

  } catch (error) {
    console.error('[AI Chat] Error:', error)
    return NextResponse.json(
      { response: 'Sorry, something went wrong. Please try again.' },
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

    if (portfolio.holdings && portfolio.holdings.length > 0) {
      prompt += `=== HOLDINGS ===\n`
      portfolio.holdings.forEach((h) => {
        prompt += `${h.symbol}: ${h.shares} shares @ $${h.currentPrice.toFixed(2)} | Sector: ${h.sector} | Allocation: ${h.allocation.toFixed(1)}% | Gain: ${h.gainPercent.toFixed(2)}%\n`
      })
      prompt += '\n'
    }

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

    if (portfolio.risk) {
      prompt += `=== RISK METRICS ===
Diversification Score: ${portfolio.risk.diversificationScore.toFixed(0)}/100
Concentration (HHI): ${portfolio.risk.concentration.toFixed(1)}%
Value at Risk (5%): $${portfolio.risk.valueAtRisk.toLocaleString()}

`
    }

    if (portfolio.benchmarks) {
      prompt += `=== VS BENCHMARKS ===
vs S&P 500: ${portfolio.benchmarks.vsSP500 >= 0 ? '+' : ''}${portfolio.benchmarks.vsSP500.toFixed(2)}%
vs NASDAQ: ${portfolio.benchmarks.vsNASDAQ >= 0 ? '+' : ''}${portfolio.benchmarks.vsNASDAQ.toFixed(2)}%

`
    }

    if (portfolio.tax) {
      prompt += `=== TAX SITUATION ===
Short-term Gains: $${portfolio.tax.shortTermGains.toLocaleString()}
Long-term Gains: $${portfolio.tax.longTermGains.toLocaleString()}
Estimated Tax Liability: $${portfolio.tax.estimatedTaxLiability.toLocaleString()}

`
    }
  } else {
    prompt += `=== PORTFOLIO ===
No portfolio data available. The user may not have loaded their dashboard yet, or they haven't added transactions.

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
    goals.forEach((g, i) => {
      const progress = g.targetValue > 0 ? ((g.currentSavings / g.targetValue) * 100).toFixed(1) : '0'
      prompt += `Goal ${i + 1}: $${g.currentSavings.toLocaleString()} / $${g.targetValue.toLocaleString()} (${progress}%) | Contributing $${g.contributionAmount.toLocaleString()} ${g.contributionType} | Expected return: ${g.expectedReturn}%${g.includePortfolio ? ' | Includes portfolio value' : ''}\n`
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
Monthly Income: $${financialProfile.monthlyIncome.toLocaleString()}
Monthly Expenses: $${financialProfile.monthlyExpenses.toLocaleString()}
Monthly Savings Capacity: $${(financialProfile.monthlyIncome - financialProfile.monthlyExpenses).toLocaleString()}
`
  }

  return prompt
}