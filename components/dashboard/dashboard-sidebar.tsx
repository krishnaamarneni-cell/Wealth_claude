"use client"

import { useEffect, useState } from "react"
import {
  BarChart3,
  Briefcase,
  ChevronDown,
  Flame,
  Home,
  LineChart,
  PieChart,
  Receipt,
  Target,
  TrendingUp,
  GitCompare,
  Database,
  BookOpen,
  Zap,
} from "lucide-react"
import Link from "next/link"
import { usePathname } from "next/navigation"
import { createClient } from "@/lib/supabase"

import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarSeparator,
} from "@/components/ui/sidebar"
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible"

const mainNav = [
  { title: "Overview", url: "/dashboard", icon: Home },
  { title: "Holdings", url: "/dashboard/holdings", icon: Briefcase },
  { title: "Performance", url: "/dashboard/performance", icon: TrendingUp },
  { title: "Portfolio", url: "/dashboard/portfolio", icon: PieChart },
  { title: "Transactions", url: "/dashboard/transactions", icon: Receipt },
]

const analysisNav = [
  { title: "Trade Analysis", url: "/dashboard/trades", icon: BarChart3 },
  { title: "Goal Tracker", url: "/dashboard/goals", icon: Target },
]

const developmentNav = [
  { title: "Blog", url: "/admin/blog", icon: BookOpen },
  { title: "AI Usage", url: "/admin/ai-usage", icon: Zap },
  { title: "Data Inspector", url: "/dashboard/data-inspector", icon: Database },
]

export function DashboardSidebar() {
  const pathname = usePathname()
  const [isAdmin, setIsAdmin] = useState(false)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    checkAdmin()
  }, [])

  async function checkAdmin() {
    try {
      const supabase = createClient()
      const {
        data: { user },
      } = await supabase.auth.getUser()

      if (!user) {
        setLoading(false)
        return
      }

      const adminEmail = process.env.NEXT_PUBLIC_ADMIN_EMAIL
      if (adminEmail && user.email === adminEmail) {
        setIsAdmin(true)
      }
    } catch (error) {
      console.error("[v0] Error checking admin status:", error)
    } finally {
      setLoading(false)
    }
  }

  return (
    <Sidebar className="border-r border-border">
      <SidebarHeader className="p-4">
        <Link href="/" className="flex items-center gap-2">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary">
            <LineChart className="h-5 w-5 text-primary-foreground" />
          </div>
          <span className="text-lg font-semibold text-foreground">WealthClaude</span>
        </Link>
      </SidebarHeader>
      <SidebarSeparator />
      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupLabel>Portfolio</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {mainNav.map((item) => (
                <SidebarMenuItem key={item.title}>
                  <SidebarMenuButton asChild isActive={pathname === item.url}>
                    <Link href={item.url}>
                      <item.icon className="h-4 w-4" />
                      <span>{item.title}</span>
                    </Link>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>

        <SidebarGroup>
          <Collapsible defaultOpen className="group/collapsible">
            <SidebarGroupLabel asChild>
              <CollapsibleTrigger className="flex w-full items-center justify-between">
                Analysis
                <ChevronDown className="h-4 w-4 transition-transform group-data-[state=open]/collapsible:rotate-180" />
              </CollapsibleTrigger>
            </SidebarGroupLabel>
            <CollapsibleContent>
              <SidebarGroupContent>
                <SidebarMenu>
                  {analysisNav.map((item) => (
                    <SidebarMenuItem key={item.title}>
                      <SidebarMenuButton asChild isActive={pathname === item.url}>
                        <Link href={item.url}>
                          <item.icon className="h-4 w-4" />
                          <span>{item.title}</span>
                        </Link>
                      </SidebarMenuButton>
                    </SidebarMenuItem>
                  ))}
                </SidebarMenu>
              </SidebarGroupContent>
            </CollapsibleContent>
          </Collapsible>
        </SidebarGroup>

        <SidebarGroup>
          <SidebarGroupLabel>Market Data</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              <SidebarMenuItem>
                <SidebarMenuButton asChild isActive={pathname === "/dashboard/heatmaps"}>
                  <Link href="/dashboard/heatmaps">
                    <Flame className="h-4 w-4" />
                    <span>Heat Maps</span>
                  </Link>
                </SidebarMenuButton>
              </SidebarMenuItem>
              <SidebarMenuItem>
                <SidebarMenuButton asChild isActive={pathname === "/dashboard/compare"}>
                  <Link href="/dashboard/compare">
                    <GitCompare className="h-4 w-4" />
                    <span>Compare Stocks</span>
                  </Link>
                </SidebarMenuButton>
              </SidebarMenuItem>
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>

        {/* Admin-only Development Section */}
        {isAdmin && (
          <SidebarGroup>
            <SidebarGroupLabel>Development</SidebarGroupLabel>
            <SidebarGroupContent>
              <SidebarMenu>
                {developmentNav.map((item) => (
                  <SidebarMenuItem key={item.title}>
                    <SidebarMenuButton asChild isActive={pathname === item.url}>
                      <Link href={item.url}>
                        <item.icon className="h-4 w-4" />
                        <span>{item.title}</span>
                      </Link>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                ))}
              </SidebarMenu>
            </SidebarGroupContent>
          </SidebarGroup>
        )}
      </SidebarContent>
    </Sidebar>
  )
}
