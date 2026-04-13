import { NextRequest, NextResponse } from 'next/server'
import { requireAdmin } from '@/lib/admin-auth'

export async function GET() {
  const auth = await requireAdmin()
  if ('error' in auth) return auth.error

  const { data, error } = await auth.supabase
    .from('news_image_posts')
    .select('*')
    .order('created_at', { ascending: false })

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ data })
}

export async function POST(request: NextRequest) {
  const auth = await requireAdmin()
  if ('error' in auth) return auth.error

  const body = await request.json()
  const { template_type, headline } = body

  if (!template_type || !headline) {
    return NextResponse.json({ error: 'template_type and headline are required' }, { status: 400 })
  }

  const { data, error } = await auth.supabase
    .from('news_image_posts')
    .insert({
      template_type,
      headline,
      source: body.source || null,
      source_url: body.source_url || null,
      category: body.category || 'MARKETS',
      date: body.date || null,
      key_points: body.key_points || [],
      quote: body.quote || {},
      market_impact: body.market_impact || [],
      big_stat: body.big_stat || {},
      timeline_events: body.timeline_events || [],
      context_points: body.context_points || [],
      status: body.status || 'draft',
    } as any)
    .select()
    .single()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ data })
}
