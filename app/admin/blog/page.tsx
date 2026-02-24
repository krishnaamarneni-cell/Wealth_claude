import { cookies } from 'next/headers'
import { createServerSideClient } from '@/lib/supabase'
import { redirect, notFound } from 'next/navigation'
import { BlogAdmin } from '@/components/blog-admin'

export const metadata = {
  title: 'Blog Admin - TrackFolio',
  description: 'Create and manage blog posts',
}

export default async function BlogAdminPage() {
  const cookieStore = await cookies()
  const supabase = await createServerSideClient(cookieStore)

  // Check authentication
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) {
    redirect('/auth/login?message=admin_required')
  }

  // Check if user is admin (flexible: email OR custom role)
  const adminEmail = process.env.NEXT_PUBLIC_ADMIN_EMAIL || process.env.ADMIN_EMAIL
  const isAdmin = adminEmail
    ? user.email === adminEmail
    : user.user_metadata?.role === 'admin' // Future-proof

  if (!isAdmin) {
    notFound() // 404 instead of error page
  }

  return (
    <div className="min-h-screen bg-background pt-20 px-6">
      <div className="max-w-4xl mx-auto">
        <div className="mb-8 flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Blog Administration</h1>
            <p className="text-muted-foreground mt-2">Manage your TrackFolio blog posts</p>
          </div>
        </div>
        <BlogAdmin />
      </div>
    </div>
  )
}
