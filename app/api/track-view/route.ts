import { NextRequest, NextResponse } from 'next/server'
import { createServerSideClient } from '@/lib/supabase'
import { cookies } from 'next/headers'

export async function POST(request: NextRequest) {
  const { slug } = await request.json()

  const cookieStore = await cookies()
  const supabase = createServerSideClient(cookieStore)

  const { data } = await supabase
    .from('blog_posts')
    .select('id')
    .eq('slug', slug)
    .eq('published', true)
    .single()

  if (!data) {
    return NextResponse.json({ error: 'Post not found' }, { status: 404 })
  }

  const { error } = await supabase
    .from('blog_posts')
    .update({
      view_count: supabase.rpc('increment', { col: 'view_count' }),
      last_viewed_at: new Date().toISOString()
    })
    .eq('id', data.id)

  if (error) {
    console.error('[track-view] Error:', error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return NextResponse.json({ success: true })
}
