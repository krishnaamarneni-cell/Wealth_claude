import { cookies } from 'next/headers'
import { requireAdmin } from '@/lib/admin-guard'
import { BlogPostForm } from '@/components/blog-post-form'

export const metadata = {
  title: 'Create Blog Post - Admin',
  description: 'Create and manage blog posts',
}

export default async function BlogAdminPage() {
  // This will redirect if not logged in, show 404 if not admin
  await requireAdmin()

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
