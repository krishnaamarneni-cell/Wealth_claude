/**
 * Phase 5 — Updated /api/ai-chat/route.ts
 * 
 * Changes from Phase 4:
 *   - Step 18: Mistral fallback when Groq hits rate limits (429)
 *   - Step 20: Fallback portfolio fetch from Supabase transactions when PortfolioContext is empty
 * 
 * Replace your existing: app/api/ai-chat/route.ts
 */

import { NextRequest, NextResponse } from 'next/server'
import { cookies } from 'next/headers'
import { createServerSideClient } from '@/lib/supabase'
import { classifyQuestion } from '@/lib/ai-chat/question-classifier'
import { queryPerplexity, formatMarketResponse, formatAsGroqContext } from '@/lib/ai-chat/perplexity-client'
import { callMistral } from '@/lib/ai-chat/mistral-client'
import { fetchFallbackPortfolio, buildFallbackPromptSection } from '@/lib/ai-chat/fallback-portfolio'
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

    // ── Step 15: Classify the question ─────────────────────────────────
    const holdingSymbols = portfolioSnapshot?.holdings?.map((h) => h.symbol) ?? []
    const classification = classifyQuestion(message, holdingSymbols)

    console.log(`[AI Chat] Classification: ${classification.category} (${(classification.confidence * 100).toFixed(0)}%) — ${classification.reasoning}`)

    // ── Route based on classification ──────────────────────────────────

    // MARKET ONLY → Perplexity handles it directly
    if (classification.category === 'market') {
      return await handleMarketQuestion(message, classification.marketQuery!)
    }

    // ── Step 20: Fallback portfolio fetch if frontend didn't send data ──
    let fallbackPromptSection: string | null = null
    const hasPortfolioData = portfolioSnapshot?.portfolio?.totalValue > 0

    if (!hasPortfolioData) {
      console.log('[AI Chat] No portfolio snapshot from frontend — fetching fallback from Supabase transactions...')
      const fallbackPortfolio = await fetchFallbackPortfolio(supabase, user.id)
      if (fallbackPortfolio) {
        fallbackPromptSection = buildFallbackPromptSection(fallbackPortfolio)
        // Update holdingSymbols for classifier (re-classify with real symbols)
        const fallbackSymbols = fallbackPortfolio.symbols
        const reClassification = classifyQuestion(message, fallbackSymbols)
        if (reClassification.category === 'market' && classification.category !== 'market') {
          console.log('[AI Chat] Re-classified as market after fallback fetch')
          return await handleMarketQuestion(message, reClassification.marketQuery!)
        }
      }
    }

    // PORTFOLIO or MIXED → need Supabase data
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

    const fullSnapshot: FinancialSnapshot = {
      portfolio: portfolioSnapshot ?? ({} as any),
      debts,
      goals,
      financialProfile,
    }

    // MIXED → Fetch market data from Perplexity, then combine with portfolio in Groq
    if (classification.category === 'mixed') {
      return await handleMixedQuestion(
        message,
        classification.marketQuery!,
        fullSnapshot,
        chatHistory,
        fallbackPromptSection
      )
    }

    // PORTFOLIO → Groq only (existing Phase 3 behavior)
    return await handlePortfolioQuestion(message, fullSnapshot, chatHistory, fallbackPromptSection)

  } catch (error) {
    console.error('[AI Chat] Error:', error)
    return NextResponse.json(
      { response: 'Sorry, something went wrong. Please try again.' },
      { status: 500 }
    )
  }
}

// ── Handler: Pure market questions (Step 16) ─────────────────────────────

async function handleMarketQuestion(
  userMessage: string,
  searchQuery: string
) {
  console.log(`[AI Chat] → Perplexity (market) | Query: "${searchQuery}"`)

  const perplexityResult = await queryPerplexity(userMessage, searchQuery)

  if (!perplexityResult.success) {
    // Fallback: try Groq with a general response
    console.warn('[AI Chat] Perplexity failed, falling back to Groq for market question')
    return await fallbackGroqMarket(userMessage)
  }

  const response = formatMarketResponse(perplexityResult)

  return NextResponse.json({
    success: true,
    response,
    metadata: {
      route: 'perplexity',
      category: 'market',
    },
  })
}

// ── Handler: Mixed questions (Step 17) ───────────────────────────────────

async function handleMixedQuestion(
  userMessage: string,
  searchQuery: string,
  snapshot: FinancialSnapshot,
  chatHistory: Array<{ role: 'user' | 'assistant'; content: string }>,
  fallbackPromptSection: string | null = null
) {
  console.log(`[AI Chat] → Perplexity + Groq (mixed) | Query: "${searchQuery}"`)

  // Step 1: Get market data from Perplexity
  const perplexityResult = await queryPerplexity(userMessage, searchQuery)

  // Step 2: Build system prompt with BOTH portfolio data AND market data
  let systemPrompt = buildSystemPrompt(snapshot)

  // Step 20: Inject fallback portfolio data if frontend snapshot was empty
  if (fallbackPromptSection) {
    systemPrompt += fallbackPromptSection
  }

  // Inject market data into the prompt
  if (perplexityResult.success) {
    systemPrompt += formatAsGroqContext(perplexityResult)
    systemPrompt += `IMPORTANT: The user's question involves both their portfolio AND current market data.
Use the real-time market data above together with their portfolio data to give a complete answer.
When referencing market data, mention that it's from recent web sources.
When referencing portfolio data, use their specific numbers.\n\n`
  } else {
    systemPrompt += `=== MARKET DATA ===
Real-time market data lookup was attempted but unavailable.
Answer using the portfolio data you have, and note that current market data couldn't be fetched.\n\n`
  }

  // Step 3: Send combined context to Groq
  return await callGroq(systemPrompt, userMessage, chatHistory, 'mixed')
}

// ── Handler: Pure portfolio questions (existing Phase 3) ─────────────────

async function handlePortfolioQuestion(
  userMessage: string,
  snapshot: FinancialSnapshot,
  chatHistory: Array<{ role: 'user' | 'assistant'; content: string }>,
  fallbackPromptSection: string | null = null
) {
  console.log('[AI Chat] → Groq (portfolio)')

  let systemPrompt = buildSystemPrompt(snapshot)

  // Step 20: Inject fallback portfolio data if frontend snapshot was empty
  if (fallbackPromptSection) {
    systemPrompt += fallbackPromptSection
  }

  return await callGroq(systemPrompt, userMessage, chatHistory, 'portfolio')
}

// ── Groq caller (shared) ─────────────────────────────────────────────────

async function callGroq(
  systemPrompt: string,
  userMessage: string,
  chatHistory: Array<{ role: 'user' | 'assistant'; content: string }>,
  category: string
) {
  const groqApiKey = process.env.GROQ_API_KEY
  if (!groqApiKey) {
    console.error('[AI Chat] GROQ_API_KEY is not set')
    return NextResponse.json(
      { response: 'AI service is not configured. Please add your GROQ_API_KEY.' },
      { status: 500 }
    )
  }

  const recentHistory = chatHistory.slice(-10)

  const groqMessages = [
    { role: 'system' as const, content: systemPrompt },
    ...recentHistory.map((m) => ({
      role: m.role as 'user' | 'assistant',
      content: m.content,
    })),
    { role: 'user' as const, content: userMessage },
  ]

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

    // Step 18: If rate limited, try Mistral as fallback
    if (groqResponse.status === 429) {
      console.log('[AI Chat] Groq rate limited (429) — falling back to Mistral...')
      const mistralResult = await callMistral(systemPrompt, userMessage, chatHistory)

      if (mistralResult.success) {
        return NextResponse.json({
          success: true,
          response: mistralResult.content,
          metadata: {
            route: 'mistral-fallback',
            category,
            reason: 'groq-rate-limited',
          },
        })
      }

      // Both Groq and Mistral failed
      console.error('[AI Chat] Both Groq and Mistral failed')
      return NextResponse.json({
        response: "I'm experiencing high demand right now. Please try again in a moment.",
      })
    }

    // Non-429 Groq error — also try Mistral
    console.log('[AI Chat] Groq error — trying Mistral fallback...')
    const mistralResult = await callMistral(systemPrompt, userMessage, chatHistory)
    if (mistralResult.success) {
      return NextResponse.json({
        success: true,
        response: mistralResult.content,
        metadata: {
          route: 'mistral-fallback',
          category,
          reason: 'groq-error',
        },
      })
    }

    return NextResponse.json({
      response: "Sorry, I had trouble thinking about that. Please try again.",
    })
  }

  const groqData = await groqResponse.json()
  const aiResponse = groqData.choices?.[0]?.message?.content ?? "Sorry, I couldn't generate a response."

  return NextResponse.json({
    success: true,
    response: aiResponse,
    metadata: {
      route: category === 'mixed' ? 'perplexity+groq' : 'groq',
      category,
    },
  })
}

// ── Fallback: Groq for market questions when Perplexity fails ────────────

async function fallbackGroqMarket(userMessage: string) {
  const systemPrompt = `You are WealthClaude AI, a financial assistant.
The user asked a market/financial question. You don't have access to real-time data right now.
Give the best answer you can from your training data, but clearly note that your information may not be current.
Suggest the user check a financial site like Yahoo Finance or Google Finance for the latest data.
Keep it concise. Always end with a disclaimer that you're not a licensed financial advisor.`

  return await callGroq(systemPrompt, userMessage, [], 'market-fallback')
}

// ── System Prompt Builder (unchanged from Phase 3) ───────────────────────

function buildSystemPrompt(snapshot: FinancialSnapshot): string {
  const { portfolio, debts, goals, financialProfile } = snapshot

  let prompt = `You are WealthClaude AI, a personal financial assistant built into the WealthClaude portfolio tracker.

RULES:
- Always reference the user's ACTUAL data — never give generic advice.
- Use specific numbers, symbols, and percentages from their portfolio.
- If data is missing or empty, say so honestly.
- For debt questions, explain both snowball and avalanche strategies, then recommend one.
- For diversification questions, check sector concentration and number of holdings.
- Always end with a one-line disclaimer: *Not a licensed financial advisor.*
- Be warm and helpful, like a knowledgeable friend who understands finance.

RESPONSE FORMAT — ADAPT to the question type. Do NOT use the same format for every answer.

**Type 1: Simple factual question** (e.g. "how many holdings", "what is my total value", "do I own AAPL")
→ Answer in 1-2 sentences. No table. No headers. No bullet points. Just the direct answer.
→ Example: "You have **25 holdings** with a total value of **$50,820**."
→ Add disclaimer only if you give any advice. Skip it for pure facts.

**Type 2: Comparison question** (e.g. "NVDA vs my portfolio", "compare my sectors", "am I beating the S&P")
→ Start with a **bold one-line verdict**.
→ Use a **markdown table** for side-by-side comparison.
→ Follow with 2-3 bullet points of insight.
→ End with one-line disclaimer.
→ Total: 150-300 words.

**Type 3: Analysis/advice question** (e.g. "should I rebalance", "am I diversified", "how to pay off debt")
→ Start with a **bold one-line answer**.
→ Use a **table** if showing a breakdown (sectors, debts, allocations).
→ Follow with **numbered recommendations** (2-4 steps).
→ End with disclaimer.
→ Total: 200-400 words.

**Type 4: Breakdown/list question** (e.g. "show my sectors", "list my top holdings", "what are my debts")
→ Start with a short intro sentence.
→ Use a **table** to show the data.
→ One sentence of observation after the table.
→ Total: 100-200 words.

**Type 5: Market/news question** (e.g. "what's happening with NVDA", "market today")
→ Start with the **key fact bolded**.
→ Use a **table** for stock metrics if relevant.
→ Follow with 2-3 bullet points of recent news.
→ Add sources if available.
→ Total: 150-300 words.

**Type 6: Casual/greeting** (e.g. "hi", "thanks", "what can you do")
→ Keep it friendly and short. 1-3 sentences. No formatting.

GENERAL RULES:
- Bold all **dollar amounts**, **percentages**, and **ticker symbols**.
- Never write paragraphs longer than 2 sentences.
- Use bullet points for insights, numbered lists for action steps.
- Tables ONLY when comparing or showing a data breakdown — never for a single data point.
- Match the length to the complexity. Simple question = short answer.

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