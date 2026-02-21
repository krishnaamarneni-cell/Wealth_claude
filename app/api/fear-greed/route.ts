import { NextResponse } from 'next/server'
import { getMsUntilNextMarketClose, getFearGreedLabel, vixToScore } from '@/lib/market-cache-utils'

const FINNHUB_API_KEY = process.env.FINNHUB_API_KEY
const serverCache = new Map<string, { data: unknown; expiresAt: number }>()

async function getCNNData(): Promise<{ value: number; previousClose: number } | null> {
  try {
    const res = await fetch('https://production.dataviz.cnn.io/index/fearandgreed/graphdata', {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
        'Accept': 'application/json',
        'Referer': 'https://www.cnn.com/markets/fear-and-greed',
        'Origin': 'https://www.cnn.com',
      },
      cache: 'no-store',
    })
    if (!res.ok) return null
    const data = await res.json()
    const fg = data?.fear_and_greed
    if (!fg?.score) return null
    return {
      value: Math.round(fg.score),
      previousClose: Math.round(fg.previous_close ?? fg.score),
    }
  } catch {
    return null
  }
}

async function getVIXData(): Promise<{ value: number; previousClose: number } | null> {
  try {
    const res = await fetch(
      `https://finnhub.io/api/v1/quote?symbol=VIX&token=${FINNHUB_API_KEY}`,
      { cache: 'no-store' }
    )
    if (!res.ok) return null
    const data = await res.json()
    if (!data?.c) return null
    return {
      value: vixToScore(data.c),
      previousClose: vixToScore(data.pc ?? data.c),
    }
  } catch {
    return null
  }
}

async function getCryptoData(): Promise<{ value: number; previousClose: number } | null> {
  try {
    const res = await fetch('https://api.alternative.me/fng/?limit=2', { cache: 'no-store' })
    if (!res.ok) return null
    const data = await res.json()
    const [today, yesterday] = data?.data ?? []
    if (!today) return null
    return {
      value: parseInt(today.value, 10),
      previousClose: yesterday ? parseInt(yesterday.value, 10) : parseInt(today.value, 10),
    }
  } catch {
    return null
  }
}

export async function GET() {
  const CACHE_KEY = 'fear-greed'
  const cached = serverCache.get(CACHE_KEY)
  if (cached && Date.now() < cached.expiresAt) {
    return NextResponse.json({ ...cached.data, fromCache: true })
  }

  const [cnn, vix, crypto] = await Promise.all([getCNNData(), getVIXData(), getCryptoData()])

  const stock = cnn ?? vix ?? { value: 50, previousClose: 50 }
  const altCrypto = crypto ?? { value: 50, previousClose: 50 }

  const result = {
    stock: {
      value: stock.value,
      label: getFearGreedLabel(stock.value),
      previousClose: stock.previousClose,
      change: stock.value - stock.previousClose,
      source: cnn ? 'CNN Fear & Greed' : vix ? 'VIX-based' : 'Estimated',
    },
    crypto: {
      value: altCrypto.value,
      label: getFearGreedLabel(altCrypto.value),
      previousClose: altCrypto.previousClose,
      change: altCrypto.value - altCrypto.previousClose,
      source: 'Alternative.me',
    },
    timestamp: Date.now(),
  }

  serverCache.set(CACHE_KEY, { data: result, expiresAt: Date.now() + getMsUntilNextMarketClose() })
  return NextResponse.json(result)
}
