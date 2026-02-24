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
    <div className="min-h-screen bg-background pt-20">
      <BlogAdmin />
    </div>
  )
}
