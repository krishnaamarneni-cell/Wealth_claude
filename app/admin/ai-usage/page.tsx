import { cookies } from 'next/headers'
import { createServerSideClient } from '@/lib/supabase'
import { redirect, notFound } from 'next/navigation'
import { AIUsageClient } from '@/components/ai-usage-client'
import Link from 'next/link'
import { ArrowLeft } from 'lucide-react'

export const metadata = {
  title: 'AI Usage — WealthClaude',
  description: 'Monitor AI chat performance and costs',
  robots: 'noindex, nofollow',
}

export default async function AdminAIUsagePage() {
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
      <div className="max-w-6xl mx-auto">
        <div className="mb-8">
          <Link
            href="/dashboard"
            className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors mb-4"
          >
            <ArrowLeft className="h-4 w-4" />
            Back to Dashboard
          </Link>
          <h1 className="text-3xl font-bold tracking-tight">AI Usage Dashboard</h1>
          <p className="text-muted-foreground mt-1">
            Monitor AI chat performance and costs · Logged in as{' '}
            <span className="text-foreground font-medium">{user.email}</span>
          </p>
        </div>

        <AIUsageClient />
      </div>
    </div>
  )
}
