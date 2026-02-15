import { NextRequest, NextResponse } from 'next/server'

interface Split {
  date: string
  fromFactor: number
  toFactor: number
  ratio: number
  splitType: string
  description: string
}

function determineSplitType(fromFactor: number, toFactor: number): string {
  if (fromFactor === 1 && toFactor === 8) return 'REVERSE_1_8'
  if (fromFactor === 1 && toFactor === 20) return 'REVERSE_1_20'
  if (fromFactor === 10 && toFactor === 1) return 'FORWARD_10_1'
  if (fromFactor === 20 && toFactor === 1) return 'FORWARD_20_1'
  if (fromFactor === 4 && toFactor === 1) return 'FORWARD_4_1'
  if (fromFactor === 7 && toFactor === 1) return 'FORWARD_7_1'
  if (fromFactor === 2 && toFactor === 1) return 'FORWARD_2_1'
  if (fromFactor === 3 && toFactor === 1) return 'FORWARD_3_1'
  if (fromFactor === 5 && toFactor === 1) return 'FORWARD_5_1'
  
  if (fromFactor < toFactor) return 'REVERSE_UNKNOWN'
  return 'FORWARD_UNKNOWN'
}

const SPLIT_DATABASE: Record<string, Array<{ date: string; fromFactor: number; toFactor: number; ratio: number }>> = {
  'KULR': [{ date: '2025-06-23', fromFactor: 1, toFactor: 8, ratio: 8 }],
  'TSLZ': [{ date: '2025-10-29', fromFactor: 1, toFactor: 20, ratio: 20 }],
  'NVDA': [{ date: '2024-06-10', fromFactor: 10, toFactor: 1, ratio: 10 }],
  'AAPL': [
    { date: '2020-08-31', fromFactor: 4, toFactor: 1, ratio: 4 },
    { date: '2014-06-09', fromFactor: 7, toFactor: 1, ratio: 7 }
  ],
  'TSLA': [
    { date: '2022-08-25', fromFactor: 3, toFactor: 1, ratio: 3 },
    { date: '2020-08-31', fromFactor: 5, toFactor: 1, ratio: 5 }
  ],
  'GOOGL': [{ date: '2022-07-18', fromFactor: 20, toFactor: 1, ratio: 20 }],
  'GOOG': [{ date: '2022-07-18', fromFactor: 20, toFactor: 1, ratio: 20 }],
  'AMZN': [{ date: '2022-06-06', fromFactor: 20, toFactor: 1, ratio: 20 }],
}

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams
  const symbol = searchParams.get('symbol')?.toUpperCase()

  if (!symbol) {
    return NextResponse.json({ error: 'Symbol required' }, { status: 400 })
  }

  console.log(`\n🔍 SPLIT API: Checking ${symbol}`)

  const rawSplits = SPLIT_DATABASE[symbol] || []
  
  const splits: Split[] = rawSplits.map(split => {
    const splitType = determineSplitType(split.fromFactor, split.toFactor)
    const description = `${split.fromFactor}-for-${split.toFactor} ${splitType.startsWith('REVERSE') ? 'Reverse' : 'Forward'} Split`
    
    return {
      ...split,
      splitType,
      description
    }
  })
  
  if (splits.length > 0) {
    console.log(`✅ Found ${splits.length} split(s) for ${symbol}:`)
    splits.forEach(s => console.log(`   ${s.date}: ${s.description}`))
  } else {
    console.log(`ℹ️ No splits for ${symbol}`)
  }
  
  return NextResponse.json(splits)
}
