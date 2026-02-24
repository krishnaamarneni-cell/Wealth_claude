'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase'
import { BlogPost } from '@/types/blog'
import { titleToSlug } from '@/lib/blog-utils'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Loader2, Trash2, Edit2, Plus, Zap, ArrowLeft, X, Eye, EyeOff } from 'lucide-react'
import { BlogPostForm } from './blog-post-form'

export function BlogAdmin() {
  const router = useRouter()
  const supabase = createClient()

  const [posts, setPosts] = useState<BlogPost[]>([])
  const [loading, setLoading] = useState(true)
  const [selectedPost, setSelectedPost] = useState<BlogPost | null>(null)
  const [isFormOpen, setIsFormOpen] = useState(false)
  const [isGenerating, setIsGenerating] = useState(false)
  const [aiTopic, setAiTopic] = useState('')
  const [aiError, setAiError] = useState('')

  useEffect(() => {
    loadPosts()

    // ── Realtime subscription with proper cleanup ──────────────────────────
    const channel = supabase
      .channel('blog_posts_admin')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'blog_posts' },
        (payload) => {
          if (payload.eventType === 'INSERT') {
            setPosts((prev) => [payload.new as BlogPost, ...prev])
          } else if (payload.eventType === 'UPDATE') {
            setPosts((prev) =>
              prev.map((p) => (p.id === payload.new.id ? (payload.new as BlogPost) : p))
            )
          } else if (payload.eventType === 'DELETE') {
            setPosts((prev) => prev.filter((p) => p.id !== payload.old.id))
          }
        }
      )
      .subscribe()

    // Cleanup on unmount — this was missing before
    return () => {
      supabase.removeChannel(channel)
    }
  }, [])

  async function loadPosts() {
    try {
      setLoading(true)
      const { data, error } = await supabase
        .from('blog_posts')
        .select('*')
        .order('created_at', { ascending: false })

      if (error) throw error
      setPosts(data ?? [])
    } catch (err) {
      console.error('[blog-admin] Load error:', err)
    } finally {
      setLoading(false)
    }
  }

  async function deletePost(id: string, title: string) {
    if (!confirm(`Delete "${title}"? This cannot be undone.`)) return
    const { error } = await supabase.from('blog_posts').delete().eq('id', id)
    if (error) {
      console.error('[blog-admin] Delete error:', error)
      alert('Delete failed: ' + error.message)
    }
    // Realtime will remove it from state automatically
  }

  async function togglePublish(post: BlogPost) {
    const newPublished = !post.published
    const { error } = await supabase
      .from('blog_posts')
      .update({
        published: newPublished,
        published_at: newPublished ? new Date().toISOString() : null,
      })
      .eq('id', post.id)

    if (error) {
      console.error('[blog-admin] Toggle publish error:', error)
      alert('Failed to update: ' + error.message)
    }
    // Realtime updates state
  }

  async function generateWithAI() {
    if (!aiTopic.trim()) return
    setAiError('')

    try {
      setIsGenerating(true)
      const res = await fetch('/api/ai-generate-blog', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ topic: aiTopic }),
      })

      if (!res.ok) {
        const { error } = await res.json()
        throw new Error(error ?? 'Generation failed')
      }

      const data = await res.json()

      // ── Insert post without author_id dependency ──────────────────────────
      // RLS allows insert based on auth.email(), not author_id match
      const { data: savedPost, error: insertError } = await supabase
        .from('blog_posts')
        .insert([
          {
            slug: titleToSlug(data.title),
            title: data.title,
            excerpt: data.excerpt ?? '',
            content: data.content ?? '',
            tags: data.tags ?? [],
            image_url: data.image_url || null,
            published: false,
          },
        ])
        .select()
        .single()

      if (insertError) throw insertError

      setSelectedPost(savedPost)
      setIsFormOpen(true)
      setAiTopic('')
    } catch (err: any) {
      console.error('[blog-admin] AI error:', err)
      setAiError(err.message ?? 'Unknown error')
    } finally {
      setIsGenerating(false)
    }
  }

  function openNewPost() {
    setSelectedPost(null)
    setIsFormOpen(true)
  }

  function closeForm() {
    setIsFormOpen(false)
    setSelectedPost(null)
  }

  return (
    <>
      {!isFormOpen && (
        <div className="space-y-6">
          {/* Header */}
          <div className="flex items-center gap-3">
            <Button variant="outline" size="sm" onClick={() => router.back()}>
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back
            </Button>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
            {/* Posts List */}
            <div className="lg:col-span-3 space-y-4">
              <div className="flex items-center justify-between">
                <h2 className="text-lg font-semibold">
                  All Posts{' '}
                  <span className="text-muted-foreground font-normal text-sm">
                    ({posts.length})
                  </span>
                </h2>
                <Button size="sm" onClick={openNewPost}>
                  <Plus className="h-4 w-4 mr-2" />
                  New Post
                </Button>
              </div>

              {loading ? (
                <div className="flex justify-center py-16">
                  <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
                </div>
              ) : posts.length === 0 ? (
                <Card>
                  <CardContent className="py-16 text-center text-muted-foreground">
                    No posts yet. Use AI Write or create one manually.
                  </CardContent>
                </Card>
              ) : (
                posts.map((post) => (
                  <Card key={post.id} className="hover:shadow-md transition-shadow">
                    <CardContent className="pt-5">
                      <div className="flex gap-4">
                        {/* Thumbnail */}
                        {post.image_url && (
                          <img
                            src={post.image_url}
                            alt={post.title}
                            className="w-20 h-20 rounded-lg object-cover flex-shrink-0"
                          />
                        )}

                        <div className="flex-1 min-w-0">
                          <div className="flex items-start justify-between gap-2">
                            <h3 className="font-semibold text-sm leading-snug line-clamp-2">
                              {post.title}
                            </h3>
                            {/* Action buttons */}
                            <div className="flex gap-1.5 flex-shrink-0">
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => togglePublish(post)}
                                title={post.published ? 'Unpublish' : 'Publish'}
                                className="h-8 w-8 p-0"
                              >
                                {post.published ? (
                                  <Eye className="h-3.5 w-3.5 text-green-500" />
                                ) : (
                                  <EyeOff className="h-3.5 w-3.5 text-muted-foreground" />
                                )}
                              </Button>
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => {
                                  setSelectedPost(post)
                                  setIsFormOpen(true)
                                }}
                                className="h-8 w-8 p-0"
                              >
                                <Edit2 className="h-3.5 w-3.5" />
                              </Button>
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => deletePost(post.id, post.title)}
                                className="h-8 w-8 p-0 hover:text-red-500"
                              >
                                <Trash2 className="h-3.5 w-3.5" />
                              </Button>
                            </div>
                          </div>

                          {post.excerpt && (
                            <p className="text-xs text-muted-foreground line-clamp-2 mt-1">
                              {post.excerpt}
                            </p>
                          )}

                          <div className="flex items-center gap-2 mt-2 flex-wrap">
                            <Badge
                              variant={post.published ? 'default' : 'secondary'}
                              className={`text-xs ${post.published ? 'bg-green-600 text-white' : ''}`}
                            >
                              {post.published ? 'Published' : 'Draft'}
                            </Badge>
                            {(post.tags ?? []).slice(0, 3).map((tag) => (
                              <Badge key={tag} variant="outline" className="text-xs">
                                {tag}
                              </Badge>
                            ))}
                            <span className="text-xs text-muted-foreground ml-auto">
                              {new Date(post.created_at).toLocaleDateString()}
                            </span>
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))
              )}
            </div>

            {/* AI Write Sidebar */}
            <div className="lg:col-span-1">
              <Card className="sticky top-24">
                <CardHeader className="pb-3">
                  <CardTitle className="text-sm flex items-center gap-2">
                    <Zap className="h-4 w-4 text-yellow-500" />
                    AI Write
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div>
                    <label className="text-xs font-medium block mb-1.5">Topic</label>
                    <input
                      type="text"
                      placeholder="e.g. NVDA earnings 2026"
                      value={aiTopic}
                      onChange={(e) => setAiTopic(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter' && !isGenerating) generateWithAI()
                      }}
                      className="w-full px-3 py-2 border border-input rounded-md text-sm bg-background focus:outline-none focus:ring-2 focus:ring-primary"
                    />
                  </div>

                  {aiError && (
                    <p className="text-xs text-red-500 bg-red-500/10 rounded p-2">{aiError}</p>
                  )}

                  <Button
                    onClick={generateWithAI}
                    disabled={!aiTopic.trim() || isGenerating}
                    className="w-full"
                    size="sm"
                  >
                    {isGenerating ? (
                      <>
                        <Loader2 className="h-3 w-3 mr-2 animate-spin" />
                        Generating...
                      </>
                    ) : (
                      <>
                        <Zap className="h-3 w-3 mr-2" />
                        Generate Post
                      </>
                    )}
                  </Button>
                  <p className="text-xs text-muted-foreground leading-relaxed">
                    Powered by Perplexity AI. Generates title, content, excerpt, tags, and a
                    relevant image. Opens in editor for review before publishing.
                  </p>
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      )}

      {/* Full-screen form modal */}
      {isFormOpen && (
        <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4">
          <Card className="w-full max-w-3xl max-h-[92vh] overflow-y-auto">
            <CardHeader className="flex flex-row items-center justify-between sticky top-0 bg-background border-b z-10">
              <CardTitle className="text-base">
                {selectedPost ? 'Edit Post' : 'New Post'}
              </CardTitle>
              <Button variant="ghost" size="sm" onClick={closeForm} className="h-8 w-8 p-0">
                <X className="h-4 w-4" />
              </Button>
            </CardHeader>
            <CardContent className="pt-6">
              <BlogPostForm
                post={selectedPost}
                onClose={closeForm}
                onSave={() => {
                  closeForm()
                  loadPosts()
                }}
              />
            </CardContent>
          </Card>
        </div>
      )}
    </>
  )
}
