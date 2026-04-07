import React from "react"
import { redirect } from 'next/navigation'
import { cookies } from 'next/headers'
import { createServerSideClient } from '@/lib/supabase'
import { AdminSidebar } from "@/components/admin/admin-sidebar"

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode
}) {
  try {
    const cookieStore = await cookies()
    const supabase = createServerSideClient(cookieStore)

    const {
      data: { user },
      error,
    } = await supabase.auth.getUser()

    if (!user || error) {
      redirect('/admin-login')
    }

    const adminEmail = process.env.ADMIN_EMAIL || process.env.NEXT_PUBLIC_ADMIN_EMAIL
    if (!adminEmail || user.email?.toLowerCase() !== adminEmail.toLowerCase()) {
      redirect('/admin-login')
    }

  } catch (err) {
    console.error('[admin] Auth error:', err)
    redirect('/admin-login')
  }

  return (
    <div className="flex h-screen">
      <AdminSidebar />
      <main className="flex-1 overflow-y-auto">
        {children}
      </main>
    </div>
  )
}
