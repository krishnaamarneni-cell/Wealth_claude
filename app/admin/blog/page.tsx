import { cookies } from 'next/headers'
import { createServerSideClient } from '@/lib/supabase'
import { redirect, notFound } from 'next/navigation'
import { BlogAdmin } from '@/components/blog-admin'
import { AutoBlogStatus } from '@/components/auto-blog-status'

export const metadata = {
  title: 'Blog Admin — WealthClaude',
  description: 'Create and manage blog posts',
}

export default async function BlogAdminPage() {
  const cookieStore = await cookies()
  const supabase = createServerSideClient(cookieStore)

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    redirect('/auth?message=admin_required')
  }

  const adminEmail = process.env.ADMIN_EMAIL || process.env.NEXT_PUBLIC_ADMIN_EMAIL
  const isAdmin = adminEmail ? user.email === adminEmail : false

  if (!isAdmin) {
    notFound()
  }

  return (
    <div className="min-h-screen bg-background pt-20 px-6">
      <div className="max-w-5xl mx-auto">
        <div className="mb-8">
          <h1 className="text-3xl font-bold tracking-tight">Blog Administration</h1>
          <p className="text-muted-foreground mt-1">
            Manage your WealthClaude blog posts · Logged in as{' '}
            <span className="text-foreground font-medium">{user.email}</span>
          </p>
        </div>

        {/* Auto Blog Engine Status */}
        <div className="mb-8">
          <AutoBlogStatus />
        </div>

        <BlogAdmin />
      </div>
    </div>
  )
}
