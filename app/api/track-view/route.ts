import { NextRequest, NextResponse } from 'next/server'
import { createServerSideClient } from '@/lib/supabase'
import { cookies } from 'next/headers'
import { createHash } from 'crypto'

// Hash IP for privacy
function hashIP(ip: string): string {
  return createHash('sha256').update(ip + 'your-salt-key').digest('hex').slice(0, 16)
}

export async function POST(request: NextRequest) {
  try {
    const { slug } = await request.json()
    
    if (!slug) {
      return NextResponse.json({ error: 'Missing slug' }, { status: 400 })
    }

    // Get IP from headers
    const forwarded = request.headers.get('x-forwarded-for')
    const ip = forwarded?.split(',')[0]?.trim() || 'unknown'
    const ipHash = hashIP(ip)

    const cookieStore = await cookies()
    const supabase = createServerSideClient(cookieStore)

    // Get post ID
    const { data: post } = await supabase
      .from('blog_posts')
      .select('id')
      .eq('slug', slug)
      .eq('published', true)
      .single()

    if (!post) {
      return NextResponse.json({ error: 'Post not found' }, { status: 404 })
    }

    // Check if this IP viewed this post in last 24 hours
    const { data: existingView } = await supabase
      .from('post_views')
      .select('id')
      .eq('post_id', post.id)
      .eq('ip_hash', ipHash)
      .gte('viewed_at', new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString())
      .single()

    if (existingView) {
      // Already counted within 24hrs
      return NextResponse.json({ success: true, counted: false })
    }

    // Upsert view record (handles race conditions)
    await supabase
      .from('post_views')
      .upsert(
        { post_id: post.id, ip_hash: ipHash, viewed_at: new Date().toISOString() },
        { onConflict: 'post_id,ip_hash' }
      )

    // Increment view count
    await supabase.rpc('increment_view_count', { post_id: post.id })

    return NextResponse.json({ success: true, counted: true })

  } catch (err: any) {
    console.error('[track-view] Error:', err)
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}
