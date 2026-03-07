import { NextRequest, NextResponse } from 'next/server'
import { createServerSideClient } from '@/lib/supabase'
import { cookies } from 'next/headers'

export async function POST(request: NextRequest) {
  const { slug } = await request.json()
  if (!slug) {
    return NextResponse.json({ error: 'No slug provided' }, { status: 400 })
  }

  const cookieStore = await cookies()
  const supabase = createServerSideClient(cookieStore)

  const { error } = await supabase
    .from('blog_posts')
    .update({
      view_count: supabase.rpc('increment', { col: 'view_count' }),
      last_viewed_at: new Date().toISOString()
    })
    .eq('slug', slug)
    .eq('published', true)

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return NextResponse.json({ success: true })
}
