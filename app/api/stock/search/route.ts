import { NextRequest, NextResponse } from 'next/server'

async function tFetch(url: string, ms = 5000) {
  const c = new AbortController()
  const t = setTimeout(() => c.abort(), ms)
  try {
    return await fetch(url, {
      signal: c.signal,
      cache: 'no-store',
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
        'Accept': 'application/json',
        'Referer': 'https://finance.yahoo.com/',
      },
    })
  } finally { clearTimeout(t) }
}

export async function GET(req: NextRequest) {
  const q = new URL(req.url).searchParams.get('q')?.trim()
  if (!q || q.length < 1) return NextResponse.json([])

  try {
    const r = await tFetch(
      `https://query1.finance.yahoo.com/v1/finance/search?q=${encodeURIComponent(q)}&quotesCount=8&newsCount=0&enableFuzzyQuery=true&quotesQueryId=tss_match_phrase_query`
    )
    if (!r.ok) return NextResponse.json([])
    const j = await r.json()

    const results = (j?.quotes ?? [])
      .filter((item: any) =>
        item.symbol &&
        item.quoteType === 'EQUITY' &&
        !item.symbol.includes('.') // filter out non-US exchanges
      )
      .slice(0, 6)
      .map((item: any) => ({
        symbol: item.symbol,
        name: item.longname ?? item.shortname ?? item.symbol,
        exchange: item.exchDisp ?? item.exchange ?? '',
        type: item.quoteType ?? '',
      }))

    return NextResponse.json(results)
  } catch (e: any) {
    console.error('[Search]', e.message)
    return NextResponse.json([])
  }
}
