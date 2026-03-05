import { NextRequest, NextResponse } from 'next/server'
import { cookies } from 'next/headers'
import { createServerSideClient } from '@/lib/supabase'
import pdfParse from 'pdf-parse'

const SPENDING_CATEGORIES: Record<string, string[]> = {
  'Dining': ['mcdonalds', 'starbucks', 'restaurant', 'cafe', 'pizza', 'sushi', 'chipotle', 'doordash', 'ubereats', 'grubhub', 'burger', 'taco', 'subway', 'wendys', 'panera', 'chick-fil'],
  'Groceries': ['walmart', 'costco', 'kroger', 'trader joe', 'safeway', 'grocery', 'supermarket', 'whole foods', 'aldi', 'publix', 'wegmans', 'heb', 'food lion'],
  'Transportation': ['shell', 'bp', 'exxon', 'chevron', 'gas station', 'fuel', 'uber', 'lyft', 'transit', 'parking', 'toll', 'wawa', 'speedway', 'taxi', 'metro'],
  'Entertainment': ['netflix', 'spotify', 'hulu', 'disney+', 'amazon prime', 'cinema', 'movie', 'theater', 'regal', 'amc', 'steam', 'xbox', 'playstation', 'youtube premium'],
  'Shopping': ['amazon', 'target', 'best buy', 'apple store', 'zara', 'h&m', 'macys', 'nordstrom', 'gap', 'ebay', 'etsy', 'tj maxx', 'marshalls', 'ross', 'ikea'],
  'Healthcare': ['cvs', 'walgreens', 'pharmacy', 'hospital', 'clinic', 'doctor', 'medical', 'dental', 'vision', 'health', 'rite aid', 'urgent care'],
  'Bills & Utilities': ['electric', 'utility', 'water bill', 'internet', 'verizon', 'at&t', 'comcast', 't-mobile', 'sprint', 'insurance', 'cable', 'xfinity'],
  'Travel': ['airline', 'hotel', 'airbnb', 'expedia', 'booking.com', 'delta', 'united', 'southwest', 'american airlines', 'marriott', 'hilton', 'rental car', 'hertz'],
}

function categorizeTransaction(description: string): string {
  const desc = description.toLowerCase()
  for (const [category, keywords] of Object.entries(SPENDING_CATEGORIES)) {
    if (keywords.some(k => desc.includes(k))) return category
  }
  return 'Other'
}

function analyzeSpending(transactions: Array<{ date: string; description: string; amount: number }>) {
  const categories: Record<string, { amount: number; percentage: number; count: number }> = {}
  const totalSpending = transactions.reduce((s, t) => s + t.amount, 0)

  for (const tx of transactions) {
    const cat = categorizeTransaction(tx.description)
    if (!categories[cat]) categories[cat] = { amount: 0, percentage: 0, count: 0 }
    categories[cat].amount += tx.amount
    categories[cat].count += 1
  }
  for (const cat of Object.keys(categories)) {
    categories[cat].percentage = totalSpending > 0 ? (categories[cat].amount / totalSpending) * 100 : 0
  }

  const sorted = Object.entries(categories).sort((a, b) => b[1].amount - a[1].amount)
  const topCategory = sorted[0]?.[0] || 'Other'
  const topPercent = categories[topCategory]?.percentage || 0

  let spendingNature = 'Mixed / Unknown'
  if (topPercent >= 50) spendingNature = `Primarily ${topCategory}`
  else if (topPercent >= 35) spendingNature = `Mixed — Mostly ${topCategory}`

  const TIPS: Record<string, string> = {
    'Dining': 'High dining spend detected. Cutting $100–200/month here and applying it as extra debt payment could save years off your payoff.',
    'Entertainment': 'Entertainment spending is significant. Pausing some subscriptions and redirecting to debt can accelerate payoff.',
    'Shopping': 'High shopping spend detected. Track impulse purchases and redirect savings to debt payments for faster payoff.',
    'Travel': 'Travel spending is notable. Pausing trips temporarily and applying that budget to debt can speed payoff dramatically.',
    'Groceries': 'Groceries are your top spend — meal planning could reduce costs and free up extra debt payments.',
    'Bills & Utilities': 'Spending is mostly fixed. Review subscriptions you can cancel to free up extra payment capacity.',
  }

  const strategyTip = TIPS[topCategory] || 'Avalanche is the safest default when spending patterns are unclear.'

  const dates = transactions.map(t => t.date).filter(Boolean).sort()
  const monthsDiff = dates.length >= 2
    ? Math.max(1, Math.ceil((new Date(dates[dates.length - 1]).getTime() - new Date(dates[0]).getTime()) / (30 * 24 * 60 * 60 * 1000)))
    : 1

  return { totalTransactions: transactions.length, totalSpending, categories, topCategory, spendingNature, strategyTip, monthlyAverage: totalSpending / monthsDiff }
}

export async function POST(req: NextRequest) {
  try {
    const cookieStore = await cookies()
    const supabase = createServerSideClient(cookieStore)
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const formData = await req.formData()
    const file = formData.get('file') as File | null
    const loanType = (formData.get('loanType') as string) || 'Other'
    if (!file) return NextResponse.json({ error: 'No file provided' }, { status: 400 })

    const ext = file.name.split('.').pop()?.toLowerCase()
    const arrayBuffer = await file.arrayBuffer()
    const buffer = Buffer.from(arrayBuffer)

    // ── CSV ─────────────────────────────────────────────────────────
    if (ext === 'csv') {
      const text = buffer.toString('utf-8')
      const lines = text.split('\n').filter(l => l.trim())
      const headers = lines[0]?.split(',').map(h => h.trim().toLowerCase().replace(/"/g, '')) || []
      const dateIdx = headers.findIndex(h => h.includes('date') || h.includes('posted'))
      const descIdx = headers.findIndex(h => h.includes('desc') || h.includes('merchant') || h.includes('name') || h.includes('payee'))
      const amountIdx = headers.findIndex(h => h.includes('amount') || h.includes('debit') || h.includes('charge'))

      const transactions = lines.slice(1).map(line => {
        const cols = line.split(',').map(c => c.trim().replace(/"/g, ''))
        return { date: cols[dateIdx] || '', description: cols[descIdx] || cols[1] || '', amount: Math.abs(parseFloat(cols[amountIdx] || '0') || 0) }
      }).filter(t => t.amount > 0 && t.description)

      const spendingInsights = analyzeSpending(transactions)
      const fullText = text.toLowerCase()
      const balance = parseFloat(fullText.match(/(?:current balance|balance|amount owed)[:\s]+\$?([\d,]+\.?\d*)/i)?.[1]?.replace(',', '') || '0')
      const apr = parseFloat(fullText.match(/(?:apr|annual percentage rate|interest rate)[:\s]+([\d.]+)%?/i)?.[1] || '0')
      const minimumPayment = parseFloat(fullText.match(/(?:minimum payment|min payment)[:\s]+\$?([\d,]+\.?\d*)/i)?.[1]?.replace(',', '') || '0')

      return NextResponse.json({ success: true, fileType: 'csv', accountName: file.name.replace('.csv', ''), balance, apr, monthlyPayment: 0, minimumPayment, spendingInsights, transactionCount: transactions.length })
    }

    // ── PDF ─────────────────────────────────────────────────────────
    if (ext === 'pdf') {
      let pdfText = ''
      try {
        const pdfData = await pdfParse(buffer)
        pdfText = pdfData.text
      } catch {
        return NextResponse.json({ error: 'Could not read PDF. Please enter debt details manually.', fileType: 'pdf' }, { status: 422 })
      }
      if (!pdfText || pdfText.trim().length < 20) {
        return NextResponse.json({ error: 'PDF appears to be image-based. Please enter details manually.', fileType: 'pdf' }, { status: 422 })
      }

      const apiKey = process.env.GEMINI_API_KEY || process.env.NEXT_PUBLIC_GEMINI_API_KEY
      if (apiKey) {
        try {
          const prompt = `Extract financial data from this ${loanType} statement. Return ONLY valid JSON, no markdown.\n\nText:\n${pdfText.substring(0, 5000)}\n\nReturn:\n{"accountName":"string","lender":"string","balance":0,"apr":0,"monthlyPayment":0,"minimumPayment":0,"creditLimit":null,"dueDate":null}`

          const geminiRes = await fetch(
            `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${apiKey}`,
            {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ contents: [{ parts: [{ text: prompt }] }] }),
            }
          )
          const geminiData = await geminiRes.json()
          const responseText = (geminiData.candidates?.[0]?.content?.parts?.[0]?.text || '').trim()
          const extracted = JSON.parse(jsonStr)
          return NextResponse.json({ success: true, fileType: 'pdf', accountName: extracted.accountName || file.name.replace('.pdf', ''), lender: extracted.lender || '', balance: extracted.balance || 0, apr: extracted.apr || 0, monthlyPayment: extracted.monthlyPayment || 0, minimumPayment: extracted.minimumPayment || 0, creditLimit: extracted.creditLimit || null })
        } catch (geminiErr) {
          console.error('[debt-parse] Gemini error:', geminiErr)
        }
      }
      // Fallback regex
      const balance = parseFloat(pdfText.match(/(?:current balance|balance due|amount owed)[:\s]+\$?([\d,]+\.?\d*)/i)?.[1]?.replace(',', '') || '0')
      const apr = parseFloat(pdfText.match(/(?:apr|annual percentage rate)[:\s]+([\d.]+)/i)?.[1] || '0')
      const minimumPayment = parseFloat(pdfText.match(/(?:minimum payment|min.*payment)[:\s]+\$?([\d,]+\.?\d*)/i)?.[1]?.replace(',', '') || '0')
      return NextResponse.json({ success: true, fileType: 'pdf', accountName: file.name.replace('.pdf', ''), balance, apr, monthlyPayment: 0, minimumPayment, partialExtraction: true })
    }

    return NextResponse.json({ error: 'Unsupported file type. Upload PDF or CSV.' }, { status: 400 })
  } catch (err: any) {
    console.error('[debt-parse] Error:', err)
    return NextResponse.json({ error: err?.message || 'Failed to parse file' }, { status: 500 })
  }
}
