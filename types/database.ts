export type Database = {
  public: {
    Tables: {
      blog_posts: {
        Row: {
          id: string
          title: string
          slug: string
          content: string
          excerpt: string | null
          featured_image: string | null
          featured_image_alt: string | null
          secondary_image: string | null
          secondary_image_alt: string | null
          tags: string[]
          status: 'draft' | 'published'
          created_at: string
          updated_at: string
          author_id: string
        }
        Insert: Omit<Database['public']['Tables']['blog_posts']['Row'], 'id' | 'created_at' | 'updated_at'>
        Update: Partial<Database['public']['Tables']['blog_posts']['Insert']>
      }
    }
  }
}
