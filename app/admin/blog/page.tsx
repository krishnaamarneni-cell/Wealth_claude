import { cookies } from 'next/headers'
import { createServerSideClient } from '@/lib/supabase'
import { redirect, notFound } from 'next/navigation'
import { BlogPostForm } from '@/components/blog-post-form'

export const metadata = {
  title: 'Create Blog Post - Admin',
  description: 'Create and manage blog posts',
}

export default async function BlogAdminPage() {
  const cookieStore = await cookies()
  const supabase = await createServerSideClient(cookieStore)

  // Check authentication
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    redirect('/auth')
  }

  // Check if user is admin
  const adminEmail = process.env.NEXT_PUBLIC_ADMIN_EMAIL || process.env.ADMIN_EMAIL
  if (!adminEmail || user.email !== adminEmail) {
    notFound()
  }

  return (
    <div className="min-h-screen bg-slate-950">
      <div className="max-w-4xl mx-auto px-4 py-8 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-white mb-2">Create Blog Post</h1>
          <p className="text-slate-400">Write, edit, and publish new blog posts</p>
        </div>

        {/* Form */}
        <div className="bg-slate-900 border border-slate-800 rounded-lg p-6">
          <BlogPostForm
            onSave={data => {
              console.log('Blog post saved:', data)
            }}
          />
        </div>
      </div>
    </div>
  )
}
