export type Database = {
  public: {
    Tables: {
      blog_posts: {
        Row: {
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
        Insert: {
          id?: string
          slug: string
          title: string
          content?: string
          excerpt?: string | null
          image_url?: string | null
          tags?: string[]
          published?: boolean
          published_at?: string | null
          author_id?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: Partial<Database['public']['Tables']['blog_posts']['Insert']>
      }
    }
  }
}