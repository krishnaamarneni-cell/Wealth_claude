export interface BlogPost {
  id: string
  slug: string
  title: string
  content: string
  excerpt: string
  tags: string[]
  featured_image?: string
  status: 'draft' | 'published'
  author_id: string
  created_at: string
  updated_at: string
  published_at?: string
}

export interface BlogPostFormData {
  title: string
  slug: string
  excerpt: string
  content: string
  tags: string[]
  featured_image?: string
  status: 'draft' | 'published'
}
