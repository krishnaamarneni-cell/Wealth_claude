import React from "react"
import { redirect } from 'next/navigation'
import { cookies } from 'next/headers'
import { createServerSideClient } from '@/lib/supabase'
import { SidebarProvider, SidebarInset } from "@/components/ui/sidebar"
import { DashboardSidebar } from "@/components/dashboard/dashboard-sidebar"
import { DashboardHeader } from "@/components/dashboard/dashboard-header"
import { PortfolioProvider } from "@/lib/portfolio-context"
import { AIChatButton } from "@/components/ai-chat/chat-button"
import { OnboardingProvider } from "@/lib/onboarding-context"
import { OnboardingBar } from "@/components/onboarding-bar"
import { OnboardingWelcome } from "@/components/onboarding-welcome"
import { DemoDataWrapper } from "@/components/demo-data-wrapper"

export default async function DashboardLayout({
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
      redirect('/auth?message=login_required')
    }
  } catch (err) {
    console.error('[dashboard] Auth error:', err)
    redirect('/auth?message=auth_error')
  }

  return (
    <PortfolioProvider>
      <OnboardingProvider>
        <SidebarProvider>
          <DashboardSidebar />
          <SidebarInset className="flex flex-col h-screen">
            <DashboardHeader />
            <main className="flex-1 overflow-y-auto h-full p-6">
              <DemoDataWrapper>
                {children}
              </DemoDataWrapper>
            </main>
          </SidebarInset>
        </SidebarProvider>
        <AIChatButton />
        <OnboardingWelcome />
        <OnboardingBar />
      </OnboardingProvider>
    </PortfolioProvider>
  )
}