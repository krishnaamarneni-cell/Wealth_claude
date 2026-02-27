import { MetadataRoute } from 'next'
import { createServerSideClient } from '@/lib/supabase'
import { cookies } from 'next/headers'

const BASE_URL = process.env.NEXT_PUBLIC_SITE_URL || 'https://www.wealthclaude.com'

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  // ─── Static pages ──────────────────────────────────────────────────────────
  const staticPages: MetadataRoute.Sitemap = [
    {
      url: BASE_URL,
      lastModified: new Date(),
      changeFrequency: 'weekly',
      priority: 1.0,
    },
    {
      url: `${BASE_URL}/news`,
      lastModified: new Date(),
      changeFrequency: 'hourly',
      priority: 0.9,
    },
    {
      url: `${BASE_URL}/auth`,
      lastModified: new Date(),
      changeFrequency: 'monthly',
      priority: 0.3,
    },
  ]

  // ─── Dynamic blog posts ────────────────────────────────────────────────────
  let blogPages: MetadataRoute.Sitemap = []

  try {
    const cookieStore = await cookies()
    const supabase = createServerSideClient(cookieStore)

    const { data: posts } = await supabase
      .from('blog_posts')
      .select('slug, updated_at, published_at')
      .eq('published', true)
      .order('published_at', { ascending: false })

    if (posts && posts.length > 0) {
      blogPages = posts.map((post) => ({
        url: `${BASE_URL}/blog/${post.slug}`,
        lastModified: new Date(post.updated_at ?? post.published_at ?? new Date()),
        changeFrequency: 'weekly' as const,
        priority: 0.8,
      }))
    }
  } catch (err) {
    console.error('[sitemap] Failed to fetch blog posts:', err)
  }

  return [...staticPages, ...blogPages]
}
