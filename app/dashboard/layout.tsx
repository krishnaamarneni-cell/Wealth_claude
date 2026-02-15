import React from "react"
import { SidebarProvider, SidebarInset } from "@/components/ui/sidebar"
import { DashboardSidebar } from "@/components/dashboard/dashboard-sidebar"
import { DashboardHeader } from "@/components/dashboard/dashboard-header"
import { PortfolioProvider } from "@/lib/portfolio-context"

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
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
