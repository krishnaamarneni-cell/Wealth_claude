import { createClient } from '@supabase/supabase-js'
import { notFound } from 'next/navigation'
import { Header } from '@/components/header'
import { Footer } from '@/components/footer'
import { Badge } from '@/components/ui/badge'
import { Clock, ArrowLeft, Calendar } from 'lucide-react'
import Link from 'next/link'
import type { Metadata } from 'next'

interface Props {
  params: { slug: string }
}

function estimateReadTime(content: string): string {
  const words = content?.replace(/<[^>]*>/g, '').split(/\s+/).length ?? 0
  const mins = Math.max(1, Math.ceil(words / 200))
  return `${mins} min read`
}

// Use public anon client — no cookies needed, works for unauthenticated visitors
function getPublicSupabase() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL!
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  return createClient(url, key)
}

async function getPost(slug: string) {
  const supabase = getPublicSupabase()

  // Exact match
  const { data } = await supabase
    .from('blog_posts')
    .select('*')
    .eq('slug', slug)
    .eq('published', true)
    .maybeSingle()

  if (data) return data

  // Fallback: slug prefix match (handles timestamp suffix)
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
  const post = await getPost(params.slug)
  if (!post) return { title: 'Post Not Found' }
  return {
    title: `${post.title} — TrackFolio`,
    description: post.excerpt ?? '',
    openGraph: {
      title: post.title,
      description: post.excerpt ?? '',
      images: post.image_url ? [post.image_url] : [],
    },
  }
}

export default async function BlogPostPage({ params }: Props) {
  const post = await getPost(params.slug)
  if (!post) notFound()

  const readTime = estimateReadTime(post.content ?? '')

  return (
    <div className="min-h-screen bg-background">
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

          <article
            className="
              prose prose-invert max-w-none
              prose-headings:font-bold prose-headings:text-foreground
              prose-h2:text-3xl prose-h2:mt-10 prose-h2:mb-4
              prose-h3:text-2xl prose-h3:mt-8 prose-h3:mb-3
              prose-p:text-lg prose-p:text-muted-foreground prose-p:leading-relaxed prose-p:mb-5
              prose-strong:text-foreground prose-strong:font-semibold
              prose-li:text-lg prose-li:text-muted-foreground prose-li:leading-relaxed
              prose-ul:my-4 prose-ol:my-4
              prose-a:text-primary prose-a:no-underline hover:prose-a:underline
              [&_.key-takeaways]:bg-primary/10 [&_.key-takeaways]:border [&_.key-takeaways]:border-primary/30 [&_.key-takeaways]:rounded-2xl [&_.key-takeaways]:p-6 [&_.key-takeaways]:my-8
              [&_.key-takeaways_h3]:text-primary [&_.key-takeaways_h3]:text-xl [&_.key-takeaways_h3]:font-bold [&_.key-takeaways_h3]:mb-3
              [&_.key-takeaways_li]:text-base [&_.key-takeaways_li]:text-foreground
              [&_.faq]:my-8
              [&_.faq_h2]:text-2xl [&_.faq_h2]:font-bold [&_.faq_h2]:mb-6
              [&_.faq_h3]:text-xl [&_.faq_h3]:font-semibold [&_.faq_h3]:text-foreground [&_.faq_h3]:mt-6 [&_.faq_h3]:mb-2
              [&_.faq_p]:text-lg [&_.faq_p]:text-muted-foreground
            "
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
      </div>
      <Footer />
    </div>
  )
}
