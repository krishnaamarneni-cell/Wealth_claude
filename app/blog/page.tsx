import { createServerClient } from '@supabase/ssr'
import { Header } from '@/components/header'
import { Footer } from '@/components/footer'
import { Badge } from '@/components/ui/badge'
import { Clock, Calendar, ArrowRight, BookOpen } from 'lucide-react'
import Link from 'next/link'
import type { Metadata } from 'next'
import { BlogImage } from '@/components/blog/BlogImage'

export const revalidate = 300 // refresh every 5 min

export const metadata: Metadata = {
  title: 'Blog — WealthClaude',
  description: 'Market insights, investment analysis, and wealth building strategies from the WealthClaude team.',
}

function estimateReadTime(content: string): string {
  const words = content?.replace(/<[^>]*>/g, '').split(/\s+/).length ?? 0
  const mins = Math.max(1, Math.ceil(words / 200))
  return `${mins} min read`
}

function getSupabase() {
  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    { cookies: { getAll: () => [], setAll: () => {} } }
  )
}

export default async function BlogIndexPage() {
  const supabase = getSupabase()

  const { data: posts } = await supabase
    .from('blog_posts')
    .select('id, slug, title, excerpt, cover_image, category, published_at, content, author_name')
    .eq('status', 'published')
    .order('published_at', { ascending: false })
    .limit(30)

  const all = posts || []
  const featured = all[0]
  const rest = all.slice(1)

  return (
    <div className="min-h-screen bg-background">
      <Header />
      <div className="h-20" />

      <div className="max-w-6xl mx-auto px-4 py-10">
        {/* Page title */}
        <div className="mb-10 text-center">
          <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-primary/10 border border-primary/20 mb-4">
            <BookOpen className="h-7 w-7 text-primary" />
          </div>
          <h1 className="text-4xl md:text-5xl font-bold tracking-tight mb-3">
            The WealthClaude Blog
          </h1>
          <p className="text-muted-foreground text-lg max-w-2xl mx-auto">
            Market insights, investment strategies, and wealth building guides — straight from our team.
          </p>
        </div>

        {all.length === 0 ? (
          <div className="py-20 text-center rounded-xl border bg-card">
            <BookOpen className="h-10 w-10 text-muted-foreground mx-auto mb-3" />
            <h2 className="text-xl font-semibold mb-2">No posts yet</h2>
            <p className="text-sm text-muted-foreground">Check back soon for fresh insights.</p>
          </div>
        ) : (
          <>
            {/* Featured post */}
            {featured && (
              <Link
                href={`/blog/${featured.slug}`}
                className="block group mb-12 rounded-2xl border bg-card overflow-hidden hover:border-primary/40 transition-colors"
              >
                <div className="grid grid-cols-1 md:grid-cols-2 gap-0">
                  <div className="relative aspect-[16/9] md:aspect-auto bg-secondary overflow-hidden">
                    {featured.cover_image ? (
                      <BlogImage
                        src={featured.cover_image}
                        alt={featured.title}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                      />
                    ) : (
                      <div className="w-full h-full bg-gradient-to-br from-primary/10 to-primary/5 flex items-center justify-center">
                        <BookOpen className="h-12 w-12 text-primary/30" />
                      </div>
                    )}
                  </div>
                  <div className="p-6 md:p-8 flex flex-col justify-center">
                    {featured.category && (
                      <Badge variant="outline" className="w-fit mb-3">{featured.category}</Badge>
                    )}
                    <h2 className="text-2xl md:text-3xl font-bold mb-3 group-hover:text-primary transition-colors">
                      {featured.title}
                    </h2>
                    {featured.excerpt && (
                      <p className="text-muted-foreground mb-4 line-clamp-3">
                        {featured.excerpt}
                      </p>
                    )}
                    <div className="flex items-center gap-4 text-xs text-muted-foreground">
                      {featured.published_at && (
                        <span className="flex items-center gap-1.5">
                          <Calendar className="h-3.5 w-3.5" />
                          {new Date(featured.published_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                        </span>
                      )}
                      <span className="flex items-center gap-1.5">
                        <Clock className="h-3.5 w-3.5" />
                        {estimateReadTime(featured.content || '')}
                      </span>
                    </div>
                    <div className="mt-6 inline-flex items-center gap-1.5 text-primary text-sm font-medium">
                      Read article
                      <ArrowRight className="h-4 w-4 group-hover:translate-x-1 transition-transform" />
                    </div>
                  </div>
                </div>
              </Link>
            )}

            {/* Grid of other posts */}
            {rest.length > 0 && (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {rest.map(post => (
                  <Link
                    key={post.id}
                    href={`/blog/${post.slug}`}
                    className="group rounded-xl border bg-card overflow-hidden hover:border-primary/40 transition-all flex flex-col"
                  >
                    <div className="relative aspect-[16/9] bg-secondary overflow-hidden">
                      {post.cover_image ? (
                        <BlogImage
                          src={post.cover_image}
                          alt={post.title}
                          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                        />
                      ) : (
                        <div className="w-full h-full bg-gradient-to-br from-primary/10 to-primary/5 flex items-center justify-center">
                          <BookOpen className="h-8 w-8 text-primary/30" />
                        </div>
                      )}
                    </div>
                    <div className="p-5 flex-1 flex flex-col">
                      {post.category && (
                        <Badge variant="outline" className="w-fit text-xs mb-2">{post.category}</Badge>
                      )}
                      <h3 className="text-lg font-semibold leading-tight mb-2 line-clamp-2 group-hover:text-primary transition-colors">
                        {post.title}
                      </h3>
                      {post.excerpt && (
                        <p className="text-sm text-muted-foreground line-clamp-2 mb-4">
                          {post.excerpt}
                        </p>
                      )}
                      <div className="mt-auto flex items-center gap-3 text-xs text-muted-foreground">
                        {post.published_at && (
                          <span className="flex items-center gap-1">
                            <Calendar className="h-3 w-3" />
                            {new Date(post.published_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                          </span>
                        )}
                        <span className="flex items-center gap-1">
                          <Clock className="h-3 w-3" />
                          {estimateReadTime(post.content || '')}
                        </span>
                      </div>
                    </div>
                  </Link>
                ))}
              </div>
            )}
          </>
        )}
      </div>

      <Footer />
    </div>
  )
}
