import { NextRequest, NextResponse } from 'next/server'
import { createServerSideClient } from '@/lib/supabase'
import { cookies } from 'next/headers'
import { requireAdmin } from '@/lib/admin-auth'
import { downloadAndUpload } from '@/lib/upload-image'

async function fetchFromPixabay(query: string, apiKey: string): Promise<string> {
  const res = await fetch(
    `https://pixabay.com/api/?key=${apiKey}&q=${encodeURIComponent(query)}&image_type=photo&orientation=horizontal&category=business&per_page=5&safesearch=true`
  )
  if (!res.ok) throw new Error(`Pixabay ${res.status}`)
  const data = await res.json()
  const url = data.hits?.[0]?.webformatURL ?? ''
  if (!url) throw new Error('Pixabay no results')
  return url
}

async function fetchFromUnsplash(query: string, apiKey: string): Promise<string> {
  const res = await fetch(
    `https://api.unsplash.com/photos/random?query=${encodeURIComponent(query)}&orientation=landscape`,
    { headers: { Authorization: `Client-ID ${apiKey}` } }
  )
  if (!res.ok) throw new Error(`Unsplash ${res.status}`)
  const data = await res.json()
  const url = data.urls?.regular ?? ''
  if (!url) throw new Error('Unsplash no results')
  return url
}

export async function GET(request: NextRequest) {
  // Auth check
  const urlSecret = request.nextUrl.searchParams.get('secret')
  const cronSecret = process.env.CRON_SECRET
  if (urlSecret && cronSecret && urlSecret === cronSecret) {
    // authorized via secret
  } else {
    const auth = await requireAdmin()
    if ('error' in auth) return auth.error
  }

  const pixabayKey = process.env.PIXABAY_API_KEY
  const unsplashKey = process.env.UNSPLASH_ACCESS_KEY

  if (!pixabayKey && !unsplashKey) {
    return NextResponse.json({ error: 'No image API keys set' }, { status: 500 })
  }

  const cookieStore = await cookies()
  const supabase = createServerSideClient(cookieStore)

  // Fetch all posts with empty image_url
  const { data: posts, error } = await supabase
    .from('blog_posts')
    .select('id, title, slug')
    .or('image_url.is.null,image_url.eq.')

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  if (!posts || posts.length === 0) {
    return NextResponse.json({ message: 'No posts need images', updated: 0 })
  }

  const results = {
    updated: 0,
    failed: 0,
    posts: [] as { title: string; status: string; source?: string }[],
  }

  for (const post of posts) {
    await new Promise(r => setTimeout(r, 300))

    // Build clean search query from title
    const words = post.title.replace(/[+\-%$]/g, '').split(' ')
    const skipWords = ['why', 'how', 'what', 'when', 'is', 'are', 'the', 'on', 'in', 'of', 'vs', 'to']
    const meaningful = words.filter(w => w.length > 3 && !skipWords.includes(w.toLowerCase()))
    const query = meaningful.slice(0, 3).join(' ') || 'stock market trading'

    let image_url = ''
    let source = ''

    // Try Pixabay first
    if (pixabayKey) {
      try {
        image_url = await fetchFromPixabay(query, pixabayKey)
        source = 'pixabay'
      } catch (e: any) {
        console.warn(`[backfill] Pixabay failed for "${query}": ${e.message}`)
      }
    }

    // Fallback to Unsplash
    if (!image_url && unsplashKey) {
      try {
        image_url = await fetchFromUnsplash(query, unsplashKey)
        source = 'unsplash'
      } catch (e: any) {
        console.warn(`[backfill] Unsplash failed for "${query}": ${e.message}`)
      }
    }

    if (!image_url) {
      results.failed++
      results.posts.push({ title: post.title, status: '❌ Both sources failed' })
      continue
    }

    // Download to Supabase Storage for permanent hosting
    const storedUrl = await downloadAndUpload(supabase, image_url, post.slug || post.id)

    const { error: updateError } = await supabase
      .from('blog_posts')
      .update({ image_url: storedUrl })
      .eq('id', post.id)

    if (updateError) {
      results.failed++
      results.posts.push({ title: post.title, status: `❌ DB error: ${updateError.message}` })
    } else {
      results.updated++
      results.posts.push({ title: post.title, status: `✅ ${image_url}`, source })
    }
  }

  return NextResponse.json(results)
}
