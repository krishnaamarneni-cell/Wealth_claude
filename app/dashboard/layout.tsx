import React from "react"
import { redirect } from 'next/navigation'
import { cookies } from 'next/headers'
import { createServerSideClient } from '@/lib/supabase'
import { SidebarProvider, SidebarInset } from "@/components/ui/sidebar"
import { DashboardSidebar } from "@/components/dashboard/dashboard-sidebar"
import { DashboardHeader } from "@/components/dashboard/dashboard-header"
import { PortfolioProvider } from "@/lib/portfolio-context"

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  // ─── Protect dashboard - require authentication ────────────────────────
  const cookieStore = await cookies()
  const supabase = createServerSideClient(cookieStore)

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    redirect('/auth?message=login_required')
  }

  // ─── Render dashboard only if authenticated ────────────────────────────
  return (
    <PortfolioProvider>
      <SidebarProvider>
        <DashboardSidebar />
        <SidebarInset>
          <DashboardHeader />
          {/* ✅ FIXED: Removed overflow-auto, added min-h-0 */}
          <main className="flex-1 p-4 lg:p-6 min-h-0">{children}</main>
        </SidebarInset>
      </SidebarProvider>
    </PortfolioProvider>
  )
}
