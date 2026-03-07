import { createServerClient } from '@supabase/ssr'
import { notFound } from 'next/navigation'
import { Header } from '@/components/header'
import { Footer } from '@/components/footer'
import { Badge } from '@/components/ui/badge'
import { Clock, ArrowLeft, Calendar } from 'lucide-react'
import Link from 'next/link'
import type { Metadata } from 'next'
import { cookies } from 'next/headers'


interface Props {
  params: Promise<{ slug: string }>
}


function estimateReadTime(content: string): string {
  const words = content?.replace(/<[^>]*>/g, '').split(/\s+/).length ?? 0
  const mins = Math.max(1, Math.ceil(words / 200))
  return `${mins} min read`
}


// Server Supabase client — has write permissions
function getSupabase() {
  const cookieStore = cookies()
  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll: () => cookieStore.getAll(),
        setAll: (cookiesToSet) => {
          try {
            cookiesToSet.forEach(({ name, value, options }) =>
              cookieStore.set(name, value, options)
            )
          } catch {
            // Ignore session refresh errors
          }
        }
      }
    }
  )
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

  const post = data ?? await (async () => {
    // Prefix match — handles timestamp suffixes added by auto-blog
    const { data: fallback } = await supabase
      .from('blog_posts')
      .select('*')
      .ilike('slug', `${slug}%`)
      .eq('published', true)
      .limit(1)
      .maybeSingle()
    return fallback ?? null
  })()

  // Increment view count every time post is opened
  if (post?.id) {
    await supabase
      .from('blog_posts')
      .update({
        view_count: (post.view_count ?? 0) + 1,
        last_viewed_at: new Date().toISOString(),
      })
      .eq('id', post.id)
  }

  return post
}



export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params
  const post = await getPost(slug)
  if (!post) return { title: 'Post Not Found' }
  return {
    title: `${post.title} — WealthClaude`,
    description: post.excerpt ?? '',
    openGraph: {
      title: post.title,
      description: post.excerpt ?? '',
      images: post.image_url ? [post.image_url] : [],
    },
  }
}


export default async function BlogPostPage({ params }: Props) {
  const { slug } = await params
  const post = await getPost(slug)
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
      </div>
      <Footer />
    </div>
  )
}