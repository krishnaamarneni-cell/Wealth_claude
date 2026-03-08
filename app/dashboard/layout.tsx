import React from "react"
import { redirect } from 'next/navigation'
import { cookies } from 'next/headers'
import { createServerSideClient } from '@/lib/supabase'
import { SidebarProvider, SidebarInset } from "@/components/ui/sidebar"
import { DashboardSidebar } from "@/components/dashboard/dashboard-sidebar"
import { DashboardHeader } from "@/components/dashboard/dashboard-header"
import { PortfolioProvider } from "@/lib/portfolio-context"
import { AIChatButton } from "@/components/ai-chat/chat-button"

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  // ─── Protect dashboard - require authentication ────────────────────────
  try {
    const cookieStore = await cookies()
    const supabase = createServerSideClient(cookieStore)

    const {
      data: { user },
      error,
    } = await supabase.auth.getUser()

    console.log('[v0-dashboard] Auth check:', { hasUser: !!user, error: error?.message })

    if (!user || error) {
      console.log('[v0-dashboard] No user, redirecting to /auth')
      redirect('/auth?message=login_required')
    }
  } catch (err) {
    console.error('[v0-dashboard] Auth check error:', err)
    redirect('/auth?message=auth_error')
  }

  // ─── Render dashboard only if authenticated ────────────────────────────
  return (
    <PortfolioProvider>
      <SidebarProvider>
        <DashboardSidebar />
        <SidebarInset className="flex flex-col h-screen">
          <DashboardHeader />
          <main className="flex-1 overflow-y-auto h-full">{children}</main>
        </SidebarInset>
      </SidebarProvider>
      <AIChatButton />
    </PortfolioProvider>
  )
}
