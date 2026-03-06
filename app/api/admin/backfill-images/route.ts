import { NextRequest, NextResponse } from 'next/server'
import { createServerSideClient } from '@/lib/supabase'
import { cookies } from 'next/headers'

export async function GET(request: NextRequest) {
  // Auth check
  const cookieStore = await cookies()
  const supabase = createServerSideClient(cookieStore)
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const unsplashKey = process.env.UNSPLASH_ACCESS_KEY
  if (!unsplashKey) return NextResponse.json({ error: 'UNSPLASH_ACCESS_KEY not set' }, { status: 500 })

  // Fetch all posts with empty image_url
  const { data: posts, error } = await supabase
    .from('blog_posts')
    .select('id, title')
    .or('image_url.is.null,image_url.eq.')

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  if (!posts || posts.length === 0) return NextResponse.json({ message: 'No posts need images', updated: 0 })

  const results = { updated: 0, failed: 0, posts: [] as { title: string; status: string }[] }

  for (const post of posts) {
    // Small delay to respect Unsplash rate limit
    await new Promise(r => setTimeout(r, 300))

    try {
      // Use first 4 words of title as search query
      const query = post.title.split(' ').slice(0, 4).join(' ')

      const imgRes = await fetch(
        `https://api.unsplash.com/photos/random?query=${encodeURIComponent(query)}&orientation=landscape`,
        { headers: { Authorization: `Client-ID ${unsplashKey}` } }
      )

      if (!imgRes.ok) throw new Error(`Unsplash ${imgRes.status}`)

      const img = await imgRes.json()
      const image_url = img.urls?.regular ?? ''

      if (!image_url) throw new Error('No image URL returned')

      const { error: updateError } = await supabase
        .from('blog_posts')
        .update({ image_url })
        .eq('id', post.id)

      if (updateError) throw new Error(updateError.message)

      results.updated++
      results.posts.push({ title: post.title, status: `✅ ${image_url}` })

    } catch (err: any) {
      results.failed++
      results.posts.push({ title: post.title, status: `❌ ${err.message}` })
    }
  }

  return NextResponse.json(results)
}
