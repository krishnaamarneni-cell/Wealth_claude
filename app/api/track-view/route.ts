import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

// Use service role to allow unauthenticated view tracking
function getSupabase() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  )
}

export async function POST(request: NextRequest) {
  try {
    const { slug } = await request.json()
    if (!slug) return NextResponse.json({ error: 'slug required' }, { status: 400 })

    const supabase = getSupabase()

    // Find the post
    const { data: post } = await supabase
      .from('blog_posts')
      .select('id, view_count')
      .eq('slug', slug)
      .eq('published', true)
      .maybeSingle()

    if (!post) {
      // Try prefix match for timestamp-suffixed slugs
      const { data: fallback } = await supabase
        .from('blog_posts')
        .select('id, view_count')
        .ilike('slug', `${slug}%`)
        .eq('published', true)
        .limit(1)
        .maybeSingle()

      if (!fallback) return NextResponse.json({ error: 'Post not found' }, { status: 404 })

      await supabase
        .from('blog_posts')
        .update({
          view_count: (fallback.view_count ?? 0) + 1,
          last_viewed_at: new Date().toISOString(),
        })
        .eq('id', fallback.id)

      return NextResponse.json({ success: true, view_count: (fallback.view_count ?? 0) + 1 })
    }

    const { error } = await supabase
      .from('blog_posts')
      .update({
        view_count: (post.view_count ?? 0) + 1,
        last_viewed_at: new Date().toISOString(),
      })
      .eq('id', post.id)

    if (error) {
      console.error('[track-view] Update error:', error)
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json({ success: true, view_count: (post.view_count ?? 0) + 1 })
  } catch (err: any) {
    console.error('[track-view] Error:', err)
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}
