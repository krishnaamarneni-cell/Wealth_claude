import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { ArrowRight, Clock } from 'lucide-react'
import { cookies } from 'next/headers'
import { createServerSideClient } from '@/lib/supabase'
import { estimateReadTime } from '@/lib/blog-utils'
import type { BlogPost } from '@/types/blog'

// Fallback posts shown if Supabase has no published posts yet
const FALLBACK_POSTS = [
  {
    slug: 'how-to-track-dividend-stocks',
    tags: ['Dividends'],
    title: 'How to Track Dividend Stocks for Free in 2026',
    excerpt:
      'Learn how to monitor your dividend income, yield on cost, and payout schedules — all without paying for expensive software.',
    readTime: '5 min read',
    image_url: null as string | null,
  },
  {
    slug: 'sp500-heatmap-explained',
    tags: ['Market Analysis'],
    title: 'How to Read a Stock Market Heatmap',
    excerpt:
      'Green, red, big tiles, small tiles — here\'s exactly what every element of a market heatmap is telling you about where money is flowing.',
    readTime: '4 min read',
    image_url: null as string | null,
  },
  {
    slug: 'nasdaq-vs-sp500',
    tags: ['Investing'],
    title: 'NASDAQ 100 vs S&P 500 — What\'s the Difference?',
    excerpt:
      'Both are major US indices but they track very different things. Here\'s how to decide which one matters more for your portfolio.',
    readTime: '6 min read',
    image_url: null as string | null,
  },
]

async function getPublishedPosts() {
  try {
    const cookieStore = await cookies()
    const supabase = createServerSideClient(cookieStore)

    const { data, error } = await supabase
      .from('blog_posts')
      .select('id, slug, title, excerpt, image_url, tags, content, published_at, created_at')
      .eq('published', true)
      .order('published_at', { ascending: false })
      .limit(3)

    if (error) {
      console.error('[blog-section] Supabase error:', error.message)
      return null
    }

    return data as BlogPost[]
  } catch (err) {
    console.error('[blog-section] Unexpected error:', err)
    return null
  }
}

export async function BlogSection() {
  const dbPosts = await getPublishedPosts()

  const postsToShow =
    dbPosts && dbPosts.length > 0
      ? dbPosts.map((p) => ({
        slug: p.slug,
        tags: p.tags ?? [],
        title: p.title,
        excerpt: p.excerpt ?? '',
        readTime: estimateReadTime(p.content),
        image_url: p.image_url,
      }))
      : FALLBACK_POSTS

  return (
    <section className="py-20 px-4 bg-secondary/20">
      <div className="container mx-auto">
        <div className="flex items-end justify-between mb-12 flex-wrap gap-4">
          <div>
            <h2 className="text-3xl md:text-4xl font-bold text-foreground mb-2">
              Learn While You Track
            </h2>
            <p className="text-muted-foreground max-w-xl">
              Practical investing guides written for real investors — not finance professors.
            </p>
          </div>
          <Button asChild variant="outline">
            <Link href="/news">
              View all articles
              <ArrowRight className="ml-2 h-4 w-4" />
            </Link>
          </Button>
        </div>

        <div className="grid md:grid-cols-3 gap-6">
          {postsToShow.map((post) => (
            <Link
              key={post.slug}
              href={`/blog/${post.slug}`}
              className="group bg-card rounded-2xl border border-border overflow-hidden hover:border-primary/50 transition-all duration-300 flex flex-col"
            >
              {/* Image */}
              {post.image_url && (
                <div className="h-40 overflow-hidden">
                  <img
                    src={post.image_url}
                    alt={post.title}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                  />
                </div>
              )}

              <div className="p-6 flex flex-col flex-1">
                <div className="mb-3">
                  <span className="text-xs font-medium text-primary px-3 py-1 bg-primary/10 rounded-full">
                    {post.tags[0] ?? 'Finance'}
                  </span>
                </div>
                <h3 className="text-base font-semibold text-foreground mb-2 group-hover:text-primary transition-colors leading-snug">
                  {post.title}
                </h3>
                <p className="text-sm text-muted-foreground flex-1 leading-relaxed mb-4 line-clamp-3">
                  {post.excerpt}
                </p>
                <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                  <Clock className="h-3 w-3" />
                  {post.readTime}
                </div>
              </div>
            </Link>
          ))}
        </div>
      </div>
    </section>
  )
}
