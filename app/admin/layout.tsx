import React from "react"
import { redirect } from 'next/navigation'
import { cookies } from 'next/headers'
import { createServerSideClient } from '@/lib/supabase'
import { SidebarProvider, SidebarInset } from "@/components/ui/sidebar"
import { DashboardSidebar } from "@/components/dashboard/dashboard-sidebar"
import { DashboardHeader } from "@/components/dashboard/dashboard-header"
import { TierProvider } from "@/lib/tier-context"

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode
}) {
  // Check auth + admin status
  try {
    const cookieStore = await cookies()
    const supabase = createServerSideClient(cookieStore)

    const {
      data: { user },
      error,
    } = await supabase.auth.getUser()

    // Step 1: Check if logged in
    if (!user || error) {
      redirect('/auth?message=login_required')
    }

    // Step 2: Check if admin (THIS WAS MISSING!)
    const adminEmail = process.env.NEXT_PUBLIC_ADMIN_EMAIL
    if (!adminEmail || user.email !== adminEmail) {
      redirect('/dashboard?message=unauthorized')
    }

  } catch (err) {
    console.error('[admin] Auth error:', err)
    redirect('/auth?message=auth_error')
  }

  return (
    <TierProvider>
      <SidebarProvider>
        <DashboardSidebar />
        <SidebarInset className="flex flex-col h-screen">
          <DashboardHeader />
          <main className="flex-1 overflow-y-auto h-full">
            {children}
          </main>
        </SidebarInset>
      </SidebarProvider>
    </TierProvider>
  )
}
