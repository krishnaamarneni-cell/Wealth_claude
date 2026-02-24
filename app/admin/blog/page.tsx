import { cookies } from 'next/headers'
import { createServerSideClient } from '@/lib/supabase'
import { redirect, notFound } from 'next/navigation'

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
    <div className="min-h-screen bg-slate-950 pt-20">
      <div className="max-w-4xl mx-auto px-4 py-8 sm:px-6 lg:px-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-white mb-2">Blog Admin</h1>
          <p className="text-slate-400">Welcome to the blog management panel</p>
          <p className="text-slate-500 text-sm mt-4">Logged in as: {user.email}</p>
        </div>

        <div className="bg-slate-900 border border-slate-800 rounded-lg p-6">
          <p className="text-slate-300">Admin access verified. Blog form coming soon.</p>
        </div>
      </div>
    </div>
  )
}
