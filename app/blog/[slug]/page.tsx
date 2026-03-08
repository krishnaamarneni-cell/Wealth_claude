import { createServerClient } from '@supabase/ssr'
import { notFound } from 'next/navigation'
import { Header } from '@/components/header'
import { Footer } from '@/components/footer'
import { Badge } from '@/components/ui/badge'
import { Clock, ArrowLeft, Calendar } from 'lucide-react'
import Link from 'next/link'
import type { Metadata } from 'next'
import { ViewTracker } from '@/components/blog/ViewTracker'


interface Props {
  params: Promise<{ slug: string }>
}


function estimateReadTime(content: string): string {
  const words = content?.replace(/<[^>]*>/g, '').split(/\s+/).length ?? 0
  const mins = Math.max(1, Math.ceil(words / 200))
  return `${mins} min read`
}


// Public Supabase client — no cookies, works for any visitor
function getSupabase() {
  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll: () => [],
        setAll: () => { },
      },
    }
  )
}


async function getRecentPosts(excludeSlug: string) {
  const supabase = getSupabase()
  const { data } = await supabase
    .from('blog_posts')
    .select('slug, title, excerpt, image_url, published_at, tags')
    .eq('published', true)
    .neq('slug', excludeSlug)
    .order('published_at', { ascending: false })
    .limit(4)
  return data ?? []
}

async function getPost(slug: string) {
  const supabase = getSupabase()


  // Exact match
  const { data } = await supabase
    .from('blog_posts')
    .select('*')
    .eq('slug', slug)
    .eq('published', true)
    .maybeSingle()


  if (data) return data


  // Prefix match — handles timestamp suffixes added by auto-blog
  const { data: fallback } = await supabase
    .from('blog_posts')
    .select('*')
    .ilike('slug', `${slug}%`)
    .eq('published', true)
    .limit(1)
    .maybeSingle()


  return fallback ?? null
}


export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params
  const post = await getPost(slug)
  if (!post) return { title: 'Post Not Found' }
  const url = `https://www.wealthclaude.com/blog/${post.slug}`
  return {
    title: `${post.title} — WealthClaude`,
    description: post.excerpt ?? '',
    alternates: { canonical: url },
    openGraph: {
      title: post.title,
      description: post.excerpt ?? '',
      url,
      siteName: 'WealthClaude',
      type: 'article',
      publishedTime: post.published_at,
      images: post.image_url
        ? [{ url: post.image_url, width: 1200, height: 630, alt: post.title }]
        : [{ url: '/favicon-512.jpg', width: 512, height: 512, alt: 'WealthClaude' }],
    },
    twitter: {
      card: 'summary_large_image',
      title: `${post.title} — WealthClaude`,
      description: post.excerpt ?? '',
      images: post.image_url ? [post.image_url] : ['/favicon-512.jpg'],
    },
  }
}


export default async function BlogPostPage({ params }: Props) {
  const { slug } = await params
  const post = await getPost(slug)
  if (!post) notFound()

  const readTime = estimateReadTime(post.content ?? '')
  const recentPosts = await getRecentPosts(post.slug)


  return (
    <div className="min-h-screen bg-background">
      <ViewTracker slug={post.slug} />
      <Header />
      <div className="pt-16">
        {post.image_url && (
          <div className="w-full h-72 md:h-[480px] overflow-hidden">
            <img
              src={post.image_url}
              alt={post.title}
              className="w-full h-full object-cover"
            />
          </div>
        )}


        <div className="container mx-auto px-4 py-12 max-w-3xl">
          <Link href="/news"
            className="inline-flex items-center gap-2 text-base text-muted-foreground hover:text-foreground transition-colors mb-10">
            <ArrowLeft className="h-5 w-5" />
            Back to News
          </Link>


          <div className="flex gap-2 flex-wrap mb-6">
            {(post.tags ?? []).map((tag: string) => (
              <Badge key={tag} variant="secondary" className="text-sm px-3 py-1">
                {tag}
              </Badge>
            ))}
          </div>


          <h1 className="text-4xl md:text-5xl font-bold leading-tight mb-6">
            {post.title}
          </h1>


          {post.excerpt && (
            <p className="text-xl text-muted-foreground leading-relaxed mb-6">
              {post.excerpt}
            </p>
          )}


          <div className="flex items-center gap-6 text-base text-muted-foreground mb-10 pb-10 border-b border-border">
            <span className="flex items-center gap-2">
              <Clock className="h-5 w-5" />
              {readTime}
            </span>
            {post.published_at && (
              <span className="flex items-center gap-2">
                <Calendar className="h-5 w-5" />
                {new Date(post.published_at).toLocaleDateString('en-US', {
                  year: 'numeric', month: 'long', day: 'numeric',
                })}
              </span>
            )}
          </div>


          {/* blog-content styles are in styles/globals.css */}
          <article
            className="blog-content"
            dangerouslySetInnerHTML={{ __html: post.content }}
          />


          <div className="mt-16 pt-8 border-t border-border">
            <Link href="/news"
              className="inline-flex items-center gap-2 text-base text-muted-foreground hover:text-foreground transition-colors">
              <ArrowLeft className="h-5 w-5" />
              Back to all articles
            </Link>
          </div>
        </div>

        {/* Recent Posts */}
        {recentPosts.length > 0 && (
          <div className="border-t border-border mt-8">
            <div className="container mx-auto px-4 py-12 max-w-5xl">
              <h2 className="text-2xl font-bold mb-8">Recent Articles</h2>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                {recentPosts.map((recent: any) => (
                  <Link
                    key={recent.slug}
                    href={`/blog/${recent.slug}`}
                    className="group flex flex-col rounded-xl overflow-hidden border border-border hover:border-primary/50 transition-colors bg-card"
                  >
                    {recent.image_url ? (
                      <div className="h-36 overflow-hidden">
                        <img
                          src={recent.image_url}
                          alt={recent.title}
                          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                        />
                      </div>
                    ) : (
                      <div className="h-36 bg-muted flex items-center justify-center">
                        <span className="text-muted-foreground text-sm">No image</span>
                      </div>
                    )}
                    <div className="p-4 flex flex-col gap-2 flex-1">
                      {recent.tags?.[0] && (
                        <Badge variant="secondary" className="w-fit text-xs">
                          {recent.tags[0]}
                        </Badge>
                      )}
                      <h3 className="text-sm font-semibold leading-snug group-hover:text-primary transition-colors line-clamp-2">
                        {recent.title}
                      </h3>
                      {recent.published_at && (
                        <p className="text-xs text-muted-foreground mt-auto">
                          {new Date(recent.published_at).toLocaleDateString('en-US', {
                            month: 'short', day: 'numeric', year: 'numeric',
                          })}
                        </p>
                      )}
                    </div>
                  </Link>
                ))}
              </div>
            </div>
          </div>
        )}
      </div>
      <Footer />
    </div>
  )
}
