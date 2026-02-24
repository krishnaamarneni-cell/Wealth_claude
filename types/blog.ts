export interface BlogPost {
  id: string
  slug: string
  title: string
  content: string
  excerpt: string | null
  image_url: string | null
  tags: string[]
  published: boolean
  published_at: string | null
  author_id: string | null
  created_at: string
  updated_at: string
}

export interface BlogPostFormData {
  title: string
  slug: string
  excerpt: string
  content: string
  tags: string[]
  image_url: string
  published: boolean
}