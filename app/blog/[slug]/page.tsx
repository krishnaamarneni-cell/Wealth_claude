import { cookies } from 'next/headers'
import { createServerSideClient } from '@/lib/supabase'
import { notFound } from 'next/navigation'
import { Header } from '@/components/header'
import { Footer } from '@/components/footer'
import { Badge } from '@/components/ui/badge'
import { Clock, ArrowLeft } from 'lucide-react'
import Link from 'next/link'
import { estimateReadTime } from '@/lib/blog-utils'
import type { Metadata } from 'next'

interface Props {
  params: { slug: string }
}

async function getPost(slug: string) {
  const cookieStore = await cookies()
  const supabase = createServerSideClient(cookieStore)

  const { data, error } = await supabase
    .from('blog_posts')
    .select('*')
    .eq('slug', slug)
    .eq('published', true)
    .single()

  if (error || !data) return null
  return data
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

  const readTime = estimateReadTime(post.content)

  return (
    <div className="min-h-screen bg-background">
      <Header />
      <div className="pt-16">
        {/* Hero image */}
        {post.image_url && (
          <div className="w-full h-64 md:h-96 overflow-hidden">
            <img
              src={post.image_url}
              alt={post.title}
              className="w-full h-full object-cover"
            />
          </div>
        )}

        <div className="container mx-auto px-4 py-10 max-w-3xl">
          {/* Back link */}
          <Link
            href="/news"
            className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors mb-8"
          >
            <ArrowLeft className="h-4 w-4" />
            Back to News
          </Link>

          {/* Tags */}
          <div className="flex gap-2 flex-wrap mb-4">
            {(post.tags ?? []).map((tag: string) => (
              <Badge key={tag} variant="secondary" className="text-xs">
                {tag}
              </Badge>
            ))}
          </div>

          {/* Title */}
          <h1 className="text-3xl md:text-4xl font-bold leading-tight mb-4">
            {post.title}
          </h1>

          {/* Meta */}
          <div className="flex items-center gap-4 text-sm text-muted-foreground mb-8 pb-8 border-b border-border">
            <span className="flex items-center gap-1.5">
              <Clock className="h-4 w-4" />
              {readTime}
            </span>
            {post.published_at && (
              <span>
                {new Date(post.published_at).toLocaleDateString('en-US', {
                  year: 'numeric',
                  month: 'long',
                  day: 'numeric',
                })}
              </span>
            )}
          </div>

          {/* Content — rendered as HTML from AI/editor */}
          <article
            className="prose prose-invert max-w-none
              prose-headings:font-bold prose-headings:text-foreground
              prose-p:text-muted-foreground prose-p:leading-relaxed
              prose-strong:text-foreground
              prose-li:text-muted-foreground
              prose-a:text-primary prose-a:no-underline hover:prose-a:underline"
            dangerouslySetInnerHTML={{ __html: post.content }}
          />
        </div>
      </div>
      <Footer />
    </div>
  )
}
