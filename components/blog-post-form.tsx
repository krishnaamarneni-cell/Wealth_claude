'use client'

import { useState, useEffect, useRef } from 'react'
import { createClient } from '@/lib/supabase'
import { BlogPost, BlogPostFormData } from '@/types/blog'
import { titleToSlug, parseTags, formatTags } from '@/lib/blog-utils'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Badge } from '@/components/ui/badge'
import { Loader2, Upload, X, Image as ImageIcon } from 'lucide-react'

interface BlogPostFormProps {
  post?: BlogPost | null
  onClose?: () => void
  onSave?: () => void
}

export function BlogPostForm({ post, onClose, onSave }: BlogPostFormProps) {
  const supabase = createClient()
  const [loading, setLoading] = useState(false)
  const [uploading, setUploading] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const [formData, setFormData] = useState<BlogPostFormData>({
    title: post?.title ?? '',
    slug: post?.slug ?? '',
    excerpt: post?.excerpt ?? '',
    content: post?.content ?? '',
    tags: post?.tags ?? [],
    image_url: post?.image_url ?? '',
    published: post?.published ?? false,
  })

  const [tagInput, setTagInput] = useState(formatTags(post?.tags ?? []))

  // Auto-generate slug from title for new posts only
  useEffect(() => {
    if (!post && formData.title) {
      setFormData((prev) => ({ ...prev, slug: titleToSlug(formData.title) }))
    }
  }, [formData.title, post])

  // ─── Image Upload ──────────────────────────────────────────────────────────
  // Works for BOTH new and existing posts.
  // For new posts: uploads to blog-images/temp/{timestamp}.ext
  // For existing posts: uploads to blog-images/{post.id}.ext
  async function handleImageUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return

    try {
      setUploading(true)
      const ext = file.name.split('.').pop()
      const key = post?.id
        ? `posts/${post.id}.${ext}`
        : `posts/temp_${Date.now()}.${ext}`

      const { error: uploadError } = await supabase.storage
        .from('blog-images')
        .upload(key, file, { upsert: true })

      if (uploadError) throw uploadError

      const { data: { publicUrl } } = supabase.storage
        .from('blog-images')
        .getPublicUrl(key)

      setFormData((prev) => ({ ...prev, image_url: publicUrl }))
    } catch (err) {
      console.error('[blog-form] Image upload error:', err)
      alert('Image upload failed. Check Supabase Storage bucket permissions.')
    } finally {
      setUploading(false)
      if (fileInputRef.current) fileInputRef.current.value = ''
    }
  }

  // ─── Save / Publish ────────────────────────────────────────────────────────
  async function handleSubmit(publish: boolean) {
    if (!formData.title.trim()) {
      alert('Title is required')
      return
    }
    if (!formData.content.trim()) {
      alert('Content is required')
      return
    }

    try {
      setLoading(true)

      const tags = parseTags(tagInput)
      const now = new Date().toISOString()

      const payload = {
        title: formData.title.trim(),
        slug: formData.slug.trim() || titleToSlug(formData.title),
        excerpt: formData.excerpt.trim(),
        content: formData.content.trim(),
        tags,
        image_url: formData.image_url || null,
        published: publish,
        published_at: publish ? now : null,
      }

      if (post?.id) {
        // ── Update existing post ──
        const { error } = await supabase
          .from('blog_posts')
          .update(payload)
          .eq('id', post.id)

        if (error) throw error
      } else {
        // ── Create new post ──
        const { error } = await supabase
          .from('blog_posts')
          .insert([payload])

        if (error) throw error
      }

      onSave?.()
    } catch (err: any) {
      console.error('[blog-form] Save error:', err)
      alert('Save failed: ' + (err?.message ?? JSON.stringify(err)))
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="space-y-5">
      {/* Title */}
      <div>
        <label className="text-sm font-medium mb-1.5 block">Title *</label>
        <Input
          placeholder="Post title"
          value={formData.title}
          onChange={(e) => setFormData((p) => ({ ...p, title: e.target.value }))}
        />
      </div>

      {/* Slug */}
      <div>
        <label className="text-sm font-medium mb-1.5 block">Slug</label>
        <Input
          placeholder="url-friendly-slug"
          value={formData.slug}
          onChange={(e) => setFormData((p) => ({ ...p, slug: e.target.value }))}
        />
        <p className="text-xs text-muted-foreground mt-1">
          Auto-generated from title. Edit to customise.
        </p>
      </div>

      {/* Excerpt */}
      <div>
        <label className="text-sm font-medium mb-1.5 block">Excerpt</label>
        <Textarea
          placeholder="Brief summary shown in post cards (50-70 words)"
          value={formData.excerpt}
          onChange={(e) => setFormData((p) => ({ ...p, excerpt: e.target.value }))}
          rows={2}
        />
      </div>

      {/* Content */}
      <div>
        <label className="text-sm font-medium mb-1.5 block">Content * (HTML supported)</label>
        <Textarea
          placeholder="<h2>Introduction</h2><p>Your content here...</p>"
          value={formData.content}
          onChange={(e) => setFormData((p) => ({ ...p, content: e.target.value }))}
          rows={10}
          className="font-mono text-xs"
        />
      </div>

      {/* Tags */}
      <div>
        <label className="text-sm font-medium mb-1.5 block">Tags</label>
        <Input
          placeholder="finance, ai, stocks (comma-separated)"
          value={tagInput}
          onChange={(e) => setTagInput(e.target.value)}
        />
        <div className="flex gap-2 mt-2 flex-wrap">
          {parseTags(tagInput).map((tag) => (
            <Badge key={tag} variant="secondary" className="text-xs">
              {tag}
            </Badge>
          ))}
        </div>
      </div>

      {/* Featured Image — works for new AND existing posts */}
      <div>
        <label className="text-sm font-medium mb-1.5 block">Featured Image</label>

        {/* Preview */}
        {formData.image_url && (
          <div className="relative mb-3 rounded-lg overflow-hidden border border-border">
            <img
              src={formData.image_url}
              alt="Featured"
              className="w-full h-40 object-cover"
            />
            <button
              type="button"
              onClick={() => setFormData((p) => ({ ...p, image_url: '' }))}
              className="absolute top-2 right-2 bg-black/70 text-white p-1 rounded-full hover:bg-red-600 transition-colors"
            >
              <X className="h-3.5 w-3.5" />
            </button>
          </div>
        )}

        {/* URL input (from AI) */}
        {!formData.image_url && (
          <Input
            placeholder="Or paste image URL (auto-filled by AI)"
            value={formData.image_url}
            onChange={(e) => setFormData((p) => ({ ...p, image_url: e.target.value }))}
            className="mb-2"
          />
        )}

        {/* Upload button */}
        <label className="flex items-center justify-center gap-2 border-2 border-dashed border-border rounded-lg p-4 cursor-pointer hover:bg-muted/40 transition-colors">
          {uploading ? (
            <>
              <Loader2 className="h-4 w-4 animate-spin" />
              <span className="text-sm">Uploading...</span>
            </>
          ) : (
            <>
              <Upload className="h-4 w-4 text-muted-foreground" />
              <span className="text-sm text-muted-foreground">
                {formData.image_url ? 'Replace image' : 'Upload image'}
              </span>
            </>
          )}
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            onChange={handleImageUpload}
            disabled={uploading}
            className="hidden"
          />
        </label>
        <p className="text-xs text-muted-foreground mt-1">
          Uploads to Supabase Storage (blog-images bucket). Works for new and existing posts.
        </p>
      </div>

      {/* Action Buttons */}
      <div className="flex gap-3 pt-2 border-t border-border">
        <Button
          type="button"
          variant="outline"
          onClick={() => handleSubmit(false)}
          disabled={loading || uploading}
          className="flex-1"
        >
          {loading ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : null}
          Save Draft
        </Button>
        <Button
          type="button"
          onClick={() => handleSubmit(true)}
          disabled={loading || uploading}
          className="flex-1"
        >
          {loading ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : null}
          Publish
        </Button>
        {onClose && (
          <Button type="button" variant="ghost" onClick={onClose} disabled={loading}>
            Cancel
          </Button>
        )}
      </div>
    </div>
  )
}
