/**
 * Phase 4 — Step 15: Question Classifier
 * 
 * Classifies user questions into:
 *   - "portfolio"  → uses Groq with portfolio context (existing behavior)
 *   - "market"     → uses Perplexity for real-time market data
 *   - "mixed"      → uses Perplexity for market data, then Groq to reason over portfolio + market
 * 
 * Place this file at: lib/ai-chat/question-classifier.ts
 */

export type QuestionCategory = 'portfolio' | 'market' | 'mixed'

interface ClassificationResult {
  category: QuestionCategory
  confidence: number        // 0-1
  marketQuery: string | null // search query for Perplexity (if market or mixed)
  reasoning: string          // why this classification was chosen
}

// ── Keyword lists ────────────────────────────────────────────────────────

const PORTFOLIO_KEYWORDS = [
  // Direct portfolio references
  'my portfolio', 'my holdings', 'my stocks', 'my shares', 'my positions',
  'my investment', 'my investments', 'my returns', 'my gains', 'my losses',
  'my dividends', 'my allocation', 'my sectors', 'my performance',
  'my cost basis', 'my average cost', 'my profit', 'my loss',
  // Questions about their data
  'how many holdings', 'how many stocks', 'how much am i', 'how am i doing',
  'what do i own', 'what am i invested in', 'what is my',
  'am i diversified', 'am i overweight', 'am i underweight',
  'should i rebalance', 'should i sell', 'should i buy more',
  // Debt & goals
  'my debt', 'my debts', 'my goal', 'my goals', 'my savings',
  'my income', 'my expenses', 'my budget', 'my net worth',
  'pay off my', 'debt payoff', 'debt snowball', 'debt avalanche',
  // Tax
  'my tax', 'my taxes', 'tax loss harvest', 'capital gains',
]

const MARKET_KEYWORDS = [
  // Market-wide questions
  'market today', 'stock market', 'markets today', 'market news',
  'what happened in the market', 'market crash', 'market rally',
  'bull market', 'bear market', 'market outlook', 'market forecast',
  // Specific asset research
  'what is the price of', 'stock price', 'current price',
  'tell me about', 'what do you think about', 'is it a good time to buy',
  'should i invest in', 'what are the risks of',
  'earnings report', 'earnings call', 'quarterly results',
  // Economic data
  'interest rate', 'fed rate', 'federal reserve', 'inflation',
  'cpi', 'gdp', 'unemployment', 'jobs report', 'economic',
  'treasury', 'bond yield', 'yield curve',
  // Sector/industry research
  'tech sector', 'energy sector', 'healthcare sector',
  'best performing', 'worst performing', 'trending stocks',
  'top gainers', 'top losers', 'most active',
  // Crypto
  'bitcoin', 'ethereum', 'crypto market', 'cryptocurrency',
  // Specific tickers not in portfolio context
  'spy', 'qqq', 'dia', 'vti', 'voo',
  // News
  'latest news', 'recent news', 'breaking news', 'what happened with',
]

const MIXED_INDICATORS = [
  // Comparing portfolio to market
  'compared to', 'versus the market', 'vs s&p', 'vs nasdaq',
  'benchmark', 'outperform', 'underperform',
  // Asking about portfolio stocks with market context
  'how is .* doing', 'what.*news about.*my',
  'should i hold', 'should i sell .* given',
  'impact on my portfolio', 'affect my portfolio',
  'how does .* affect my', 'what does .* mean for my',
  // Rebalance with market awareness
  'rebalance given', 'adjust my portfolio',
  'rotate into', 'rotate out of',
]

// ── Classifier ───────────────────────────────────────────────────────────

export function classifyQuestion(
  message: string,
  holdingSymbols: string[] = []
): ClassificationResult {
  const lower = message.toLowerCase().trim()

  // Score each category
  let portfolioScore = 0
  let marketScore = 0
  let mixedScore = 0

  // Check portfolio keywords
  for (const kw of PORTFOLIO_KEYWORDS) {
    if (lower.includes(kw)) {
      portfolioScore += 2
    }
  }

  // Check market keywords
  for (const kw of MARKET_KEYWORDS) {
    if (lower.includes(kw)) {
      marketScore += 2
    }
  }

  // Check mixed indicators (regex patterns)
  for (const pattern of MIXED_INDICATORS) {
    try {
      if (new RegExp(pattern, 'i').test(lower)) {
        mixedScore += 3
      }
    } catch {
      if (lower.includes(pattern)) {
        mixedScore += 3
      }
    }
  }

  // Check if user mentions specific tickers they OWN
  // e.g. "how is NVDA doing" when they hold NVDA → mixed (needs market + portfolio)
  const mentionedTickers = extractTickers(message)
  const ownedMentioned = mentionedTickers.filter((t) => holdingSymbols.includes(t))
  const unknownMentioned = mentionedTickers.filter((t) => !holdingSymbols.includes(t))

  if (ownedMentioned.length > 0 && hasMarketIntent(lower)) {
    mixedScore += 3 // They own it AND want market info
  }
  if (unknownMentioned.length > 0) {
    marketScore += 2 // Asking about stocks they don't own
  }

  // Check for possessive pronouns → portfolio leaning
  if (/\b(my|mine|i own|i have|i bought|i hold)\b/i.test(lower)) {
    portfolioScore += 1
  }

  // Check for general/hypothetical → market leaning
  if (/\b(what is|who is|explain|define|how does .* work)\b/i.test(lower)) {
    marketScore += 1
  }

  // ── Determine category ───────────────────────────────────────────────
  const totalScore = portfolioScore + marketScore + mixedScore
  let category: QuestionCategory
  let confidence: number
  let reasoning: string

  if (mixedScore > 0 && (portfolioScore > 0 || ownedMentioned.length > 0) && marketScore > 0) {
    // Clear mixed signal
    category = 'mixed'
    confidence = Math.min(0.95, mixedScore / Math.max(totalScore, 1))
    reasoning = 'Question references both personal portfolio and market data'
  } else if (portfolioScore > marketScore && portfolioScore > mixedScore) {
    category = 'portfolio'
    confidence = Math.min(0.95, portfolioScore / Math.max(totalScore, 1))
    reasoning = 'Question is about personal portfolio data'
  } else if (marketScore > portfolioScore && marketScore > mixedScore) {
    category = 'market'
    confidence = Math.min(0.95, marketScore / Math.max(totalScore, 1))
    reasoning = 'Question is about general market information'
  } else if (mixedScore > 0) {
    category = 'mixed'
    confidence = 0.6
    reasoning = 'Question appears to need both portfolio and market context'
  } else if (portfolioScore === marketScore && portfolioScore > 0) {
    // Tie → default to mixed so we get the best of both
    category = 'mixed'
    confidence = 0.5
    reasoning = 'Ambiguous - using both portfolio and market context'
  } else {
    // No strong signal → default to portfolio (existing behavior)
    category = 'portfolio'
    confidence = 0.3
    reasoning = 'No strong market signal detected, defaulting to portfolio context'
  }

  // Build market query for Perplexity
  let marketQuery: string | null = null
  if (category === 'market' || category === 'mixed') {
    marketQuery = buildMarketQuery(message, mentionedTickers)
  }

  return {
    category,
    confidence,
    marketQuery,
    reasoning,
  }
}

// ── Helpers ──────────────────────────────────────────────────────────────

/**
 * Extract ticker symbols from a message.
 * Looks for 1-5 uppercase letter words that look like tickers.
 */
function extractTickers(message: string): string[] {
  const tickerRegex = /\b([A-Z]{1,5})\b/g
  const matches = message.match(tickerRegex) ?? []

  // Filter out common English words that look like tickers
  const falsePositives = new Set([
    'I', 'A', 'AM', 'IS', 'IT', 'IN', 'ON', 'AT', 'TO', 'DO', 'IF',
    'OR', 'AN', 'MY', 'ME', 'UP', 'SO', 'NO', 'BY', 'AS', 'OF',
    'THE', 'AND', 'FOR', 'ARE', 'BUT', 'NOT', 'YOU', 'ALL', 'CAN',
    'HAS', 'HER', 'WAS', 'ONE', 'OUR', 'OUT', 'HOW', 'ITS', 'LET',
    'SAY', 'SHE', 'TOO', 'USE', 'WAY', 'WHO', 'DID', 'GET', 'HIM',
    'HIS', 'OLD', 'SEE', 'NOW', 'NEW', 'MAY', 'DAY', 'HAD', 'HOT',
    'OIL', 'SIT', 'TOP', 'RED', 'RUN', 'FUN', 'YES', 'YET', 'FAR',
    'APR', 'ETF', 'IPO', 'CEO', 'CFO', 'GDP', 'CPI', 'FED',
    'BUY', 'SELL', 'HOLD', 'PUT', 'CALL', 'LONG', 'SHORT',
    'GOOD', 'BEST', 'HIGH', 'LOW', 'RISK', 'SAFE', 'WHAT', 'WHEN',
    'SOME', 'THAN', 'THEM', 'THEN', 'THIS', 'THAT', 'WITH', 'HAVE',
    'FROM', 'BEEN', 'MANY', 'MUCH', 'MORE', 'MOST', 'VERY',
    'JUST', 'LIKE', 'MAKE', 'KNOW', 'TAKE', 'COME', 'OVER',
    'ALSO', 'BACK', 'WELL', 'ONLY', 'EVEN', 'GIVE', 'TELL',
  ])

  return [...new Set(matches.filter((m) => !falsePositives.has(m)))]
}

/**
 * Check if the message has market/news intent (not just portfolio lookup).
 */
function hasMarketIntent(lower: string): boolean {
  const marketIntentPatterns = [
    'how is .* doing',
    'what.*news',
    'any news',
    'price target',
    'analyst',
    'forecast',
    'outlook',
    'earnings',
    'upgrade',
    'downgrade',
    'buy or sell',
    'good time',
    'what happened',
    'why did .* drop',
    'why did .* go up',
    'why is .* down',
    'why is .* up',
  ]

  return marketIntentPatterns.some((pattern) => {
    try {
      return new RegExp(pattern, 'i').test(lower)
    } catch {
      return lower.includes(pattern)
    }
  })
}

/**
 * Build a clean search query for Perplexity from the user's message.
 */
function buildMarketQuery(message: string, tickers: string[]): string {
  // If they mentioned specific tickers, build a focused query
  if (tickers.length > 0) {
    const tickerStr = tickers.join(' ')
    // Extract the intent
    const lower = message.toLowerCase()

    if (lower.includes('news') || lower.includes('what happened')) {
      return `${tickerStr} stock latest news today`
    }
    if (lower.includes('earnings')) {
      return `${tickerStr} latest earnings report results`
    }
    if (lower.includes('price target') || lower.includes('analyst')) {
      return `${tickerStr} stock analyst price target consensus`
    }
    if (lower.includes('why') && (lower.includes('drop') || lower.includes('down') || lower.includes('fell'))) {
      return `why did ${tickerStr} stock drop today`
    }
    if (lower.includes('why') && (lower.includes('up') || lower.includes('rally') || lower.includes('surge'))) {
      return `why did ${tickerStr} stock go up today`
    }

    return `${tickerStr} stock latest news analysis`
  }

  // General market question — clean it up for search
  let query = message
    .replace(/\b(my|portfolio|holdings|should i|do you think)\b/gi, '')
    .replace(/[?!.]/g, '')
    .trim()

  // Add "today" or "latest" for freshness if not already present
  if (!/(today|latest|recent|2024|2025|2026)/i.test(query)) {
    query += ' latest'
  }

  return query.substring(0, 200) // Perplexity has query limits
}