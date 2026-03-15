import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

// ─── Types ────────────────────────────────────────────────────────────────────
interface NewsCard {
  id: string
  title: string
  summary: string
  sentiment: 'bullish' | 'bearish' | 'watch'
  confidence: 'high' | 'medium' | 'low'
  category: string
  source_count: number
  sources: { name: string; url: string }[]
  primary_url: string
  is_featured: boolean
  is_live: boolean
  event_date: string | null
  article_slug: string | null
  created_at: string
}

interface NewsBatch {
  id: string
  created_at: string
  bullish_count: number
  bearish_count: number
  watch_count: number
  total_cards: number
  overall_mood_pct: number
  category_sentiment: Record<string, number>
}

// ─── Supabase client (public read) ────────────────────────────────────────────
function getSupabase() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  )
}

// ─── Main handler ─────────────────────────────────────────────────────────────
export async function GET(request: NextRequest) {
  try {
    const supabase = getSupabase()
    const { searchParams } = new URL(request.url)

    // Optional filters
    const category = searchParams.get('category')
    const sentiment = searchParams.get('sentiment')
    const limit = parseInt(searchParams.get('limit') || '20', 10)

    // Get latest batch
    const { data: batches, error: batchError } = await supabase
      .from('news_batches')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(1)

    if (batchError || !batches || batches.length === 0) {
      return NextResponse.json({
        success: true,
        batch: null,
        cards: { featured: null, bullish: [], bearish: [], watch: [] },
        stats: { bullish_count: 0, bearish_count: 0, watch_count: 0, total: 0 }
      })
    }

    const batch: NewsBatch = batches[0]

    // Build cards query
    let query = supabase
      .from('news_cards')
      .select('*')
      .eq('batch_id', batch.id)
      .order('source_count', { ascending: false })
      .order('created_at', { ascending: false })

    if (category) {
      query = query.eq('category', category)
    }

    if (sentiment) {
      query = query.eq('sentiment', sentiment)
    }

    query = query.limit(limit)

    const { data: cards, error: cardsError } = await query

    if (cardsError) {
      console.error('[news-cards] Error fetching cards:', cardsError.message)
      return NextResponse.json({ error: 'Failed to fetch cards' }, { status: 500 })
    }

    // Group cards by sentiment
    const cardList: NewsCard[] = cards ?? []

    const featured = cardList.find(c => c.is_featured) || null
    const bullish = cardList.filter(c => c.sentiment === 'bullish' && !c.is_featured)
    const bearish = cardList.filter(c => c.sentiment === 'bearish')
    const watch = cardList.filter(c => c.sentiment === 'watch')

    // Format response
    const formatCard = (card: NewsCard) => ({
      id: card.id,
      title: card.title,
      summary: card.summary,
      sentiment: card.sentiment,
      confidence: card.confidence,
      category: card.category,
      source_count: card.source_count,
      sources: card.sources,
      primary_url: card.primary_url,
      is_featured: card.is_featured,
      is_live: card.is_live,
      event_date: card.event_date,
      article_slug: card.article_slug,
      created_at: card.created_at,
      // Computed fields
      consensus_pct: Math.round(70 + (card.source_count * 5)), // Rough estimate based on source count
      time_ago: getTimeAgo(card.created_at),
    })

    return NextResponse.json({
      success: true,
      batch: {
        id: batch.id,
        created_at: batch.created_at,
        overall_mood_pct: batch.overall_mood_pct,
        category_sentiment: batch.category_sentiment,
        updated_ago: getTimeAgo(batch.created_at),
      },
      cards: {
        featured: featured ? formatCard(featured) : null,
        bullish: bullish.map(formatCard),
        bearish: bearish.map(formatCard),
        watch: watch.map(formatCard),
      },
      stats: {
        bullish_count: batch.bullish_count,
        bearish_count: batch.bearish_count,
        watch_count: batch.watch_count,
        total: batch.total_cards,
      }
    })

  } catch (err: any) {
    console.error('[news-cards] Error:', err)
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}

// ─── Helper: Time ago ─────────────────────────────────────────────────────────
function getTimeAgo(dateStr: string): string {
  try {
    const date = new Date(dateStr)
    const now = new Date()
    const mins = Math.floor((now.getTime() - date.getTime()) / 60000)

    if (mins < 1) return 'Just now'
    if (mins < 60) return `${mins}m ago`

    const hours = Math.floor(mins / 60)
    if (hours < 24) return `${hours}h ago`

    const days = Math.floor(hours / 24)
    if (days === 1) return 'Yesterday'

    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
  } catch {
    return 'Recently'
  }
}