import { NextRequest, NextResponse } from 'next/server'
import pdfParse from 'pdf-parse'

const GEMINI_API_KEY = process.env.GEMINI_API_KEY || process.env.NEXT_PUBLIC_GEMINI_API_KEY || ''

// ── Regex fallback for when Gemini isn't available ──────────────────────────
function extractWithRegex(text: string) {
  const lower = text.toLowerCase()

  const balanceMatch = text.match(/(?:balance|amount due|current balance|outstanding)[:\s$]*([0-9,]+\.?[0-9]*)/i)
  const aprMatch = text.match(/(?:apr|annual percentage rate|interest rate)[:\s]*([0-9]+\.?[0-9]*)\s*%/i)
  const minPayMatch = text.match(/(?:minimum payment|min payment|minimum due|payment due)[:\s$]*([0-9,]+\.?[0-9]*)/i)
  const creditLimitMatch = text.match(/(?:credit limit|total credit line)[:\s$]*([0-9,]+\.?[0-9]*)/i)

  return {
    balance: balanceMatch ? parseFloat(balanceMatch[1].replace(/,/g, '')) : null,
    apr: aprMatch ? parseFloat(aprMatch[1]) : null,
    monthlyPayment: minPayMatch ? parseFloat(minPayMatch[1].replace(/,/g, '')) : null,
    minimumPayment: minPayMatch ? parseFloat(minPayMatch[1].replace(/,/g, '')) : null,
    creditLimit: creditLimitMatch ? parseFloat(creditLimitMatch[1].replace(/,/g, '')) : null,
    accountName: null,
    lender: null,
    dueDate: null,
  }
}

// ── CSV parser ───────────────────────────────────────────────────────────────
function parseCSV(text: string) {
  const lines = text.split('\n').filter(l => l.trim())
  if (lines.length < 2) return []

  const headers = lines[0].split(',').map(h => h.trim().toLowerCase().replace(/"/g, ''))

  return lines.slice(1).map(line => {
    const cols = line.split(',').map(c => c.trim().replace(/"/g, ''))
    const row: any = {}
    headers.forEach((h, i) => { row[h] = cols[i] || '' })

    // Try to extract date, description, amount from common CSV formats
    const date = row.date || row['transaction date'] || row['posted date'] || ''
    const description = row.description || row.merchant || row.name || row.memo || ''
    const amountRaw = row.amount || row.debit || row.charge || row['transaction amount'] || '0'
    const amount = Math.abs(parseFloat(amountRaw.replace(/[$,]/g, '')) || 0)

    return { date, description, amount }
  }).filter(r => r.amount > 0 && r.description)
}

// ── Spending category classifier ─────────────────────────────────────────────
function classifyCategory(description: string): string {
  const d = description.toLowerCase()
  if (/restaurant|cafe|coffee|pizza|burger|sushi|mcdonald|starbucks|chipotle|doordash|uber eats|grubhub|subway|taco|panera|chick/.test(d)) return 'Dining'
  if (/amazon|walmart|target|costco|whole foods|trader joe|grocery|safeway|kroger/.test(d)) return 'Shopping'
  if (/uber|lyft|gas|shell|chevron|bp|exxon|mobil|parking|toll|metro|transit/.test(d)) return 'Transport'
  if (/netflix|spotify|hulu|disney|youtube|apple|google|subscription/.test(d)) return 'Subscriptions'
  if (/electric|water|internet|phone|att|verizon|comcast|t-mobile/.test(d)) return 'Utilities'
  if (/cvs|walgreens|pharmacy|doctor|hospital|medical|dental|vision/.test(d)) return 'Healthcare'
  if (/airline|hotel|airbnb|booking|expedia|travel|delta|united|marriott/.test(d)) return 'Travel'
  return 'Other'
}

// ── Main handler ─────────────────────────────────────────────────────────────
export async function POST(req: NextRequest) {
  try {
    const formData = await req.formData()
    const file = formData.get('file') as File | null
    const loanType = (formData.get('loanType') as string) || 'Credit Card'

    if (!file) {
      return NextResponse.json({ error: 'No file provided' }, { status: 400 })
    }

    const buffer = Buffer.from(await file.arrayBuffer())
    const fileName = file.name.toLowerCase()

    // ── CSV ──────────────────────────────────────────────────────────────────
    if (fileName.endsWith('.csv')) {
      const text = await file.text()
      const transactions = parseCSV(text)
      const categorized = transactions.map(t => ({ ...t, category: classifyCategory(t.description) }))

      const totalSpend = categorized.reduce((s, t) => s + t.amount, 0)
      const categoryTotals = categorized.reduce((acc: Record<string, number>, t) => {
        acc[t.category] = (acc[t.category] || 0) + t.amount
        return acc
      }, {})
      const topCategories = Object.entries(categoryTotals)
        .sort(([, a], [, b]) => b - a)
        .slice(0, 5)
        .map(([name, amount]) => ({ name, amount, percent: Math.round((amount / totalSpend) * 100) }))

      return NextResponse.json({
        type: 'csv',
        transactions: categorized,
        totalTransactions: categorized.length,
        totalSpend,
        topCategories,
        insights: [
          `${categorized.length} transactions totaling $${totalSpend.toFixed(2)}`,
          topCategories[0] ? `Largest spending category: ${topCategories[0].name} ($${topCategories[0].amount.toFixed(2)})` : null,
        ].filter(Boolean),
      })
    }

    // ── PDF ──────────────────────────────────────────────────────────────────
    if (fileName.endsWith('.pdf')) {
      let pdfText = ''
      try {
        const parsed = await pdfParse(buffer)
        pdfText = parsed.text
      } catch {
        return NextResponse.json({ error: 'Could not read PDF. Please enter details manually.' }, { status: 422 })
      }

      if (!pdfText || pdfText.trim().length < 50) {
        return NextResponse.json({
          error: 'PDF appears to be image-based (scanned). Please enter details manually.',
          rawText: pdfText,
        }, { status: 422 })
      }

      // Try Gemini REST API first
      let extracted: any = null

      if (GEMINI_API_KEY) {
        try {
          const prompt = `Extract financial data from this ${loanType} statement. Return ONLY valid JSON with no markdown, no explanation.

Text:
${pdfText.substring(0, 6000)}

Return exactly this JSON structure (use null for missing fields):
{
  "accountName": "account or card name",
  "lender": "bank or lender name",
  "balance": 0,
  "apr": 0,
  "monthlyPayment": 0,
  "minimumPayment": 0,
  "creditLimit": null,
  "dueDate": null
}`

          const res = await fetch(
            `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${GEMINI_API_KEY}`,
            {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ contents: [{ parts: [{ text: prompt }] }] }),
            }
          )

          const geminiData = await res.json()
          const rawText = geminiData?.candidates?.[0]?.content?.parts?.[0]?.text || ''
          // Strip markdown code fences if present
          const cleaned = rawText.replace(/```json|```/g, '').trim()
          extracted = JSON.parse(cleaned)
        } catch {
          // Gemini failed — fall through to regex
          extracted = null
        }
      }

      // Regex fallback
      if (!extracted || !extracted.balance) {
        extracted = extractWithRegex(pdfText)
      }

      return NextResponse.json({
        type: 'pdf',
        loanType,
        ...extracted,
        rawTextPreview: pdfText.substring(0, 300),
      })
    }

    return NextResponse.json({ error: 'Only PDF and CSV files are supported' }, { status: 400 })

  } catch (err: any) {
    console.error('debt-parse error:', err)
    return NextResponse.json({ error: err.message || 'Server error' }, { status: 500 })
  }
}
