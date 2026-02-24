import { NextResponse } from 'next/server'
import { createServerSideClient } from '@/lib/supabase'
import { cookies } from 'next/headers'
import { estimateReadTime } from '@/lib/blog-utils'

export async function GET() {
  try {
    const cookieStore = await cookies()
    const supabase = createServerSideClient(cookieStore)

    const { data, error } = await supabase
      .from('blog_posts')
      .select('slug, title, excerpt, image_url, tags, content')
      .eq('published', true)
      .order('published_at', { ascending: false })
      .limit(3)

    if (error) throw error

    const posts = (data ?? []).map((p) => ({
      slug: p.slug,
      tag: p.tags?.[0] ?? 'Finance',
      title: p.title,
      excerpt: p.excerpt ?? '',
      readTime: estimateReadTime(p.content),
      image_url: p.image_url ?? null,
    }))

    return NextResponse.json(posts)
  } catch (err) {
    console.error('[/api/blog-posts]', err)
    return NextResponse.json([], { status: 200 }) // Return empty, not 500
  }
}