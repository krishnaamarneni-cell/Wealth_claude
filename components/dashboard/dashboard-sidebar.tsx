"use client"

import { useState } from "react"
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
  Lock,
} from "lucide-react"
import Link from "next/link"
import { usePathname } from "next/navigation"
import { useTier } from "@/lib/tier-context"
import { UpgradeModal } from "@/components/upgrade-modal"

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

interface NavItem {
  title: string
  url: string
  icon: React.ComponentType<{ className?: string }>
  requiresPro?: boolean
}

const mainNav: NavItem[] = [
  { title: "Overview", url: "/dashboard", icon: Home },
  { title: "Holdings", url: "/dashboard/holdings", icon: Briefcase },
  { title: "Performance", url: "/dashboard/performance", icon: TrendingUp, requiresPro: true },
  { title: "Portfolio", url: "/dashboard/portfolio", icon: PieChart, requiresPro: true },
  { title: "Transactions", url: "/dashboard/transactions", icon: Receipt },
]

const analysisNav: NavItem[] = [
  { title: "Trade Analysis", url: "/dashboard/trades", icon: BarChart3, requiresPro: true },
  { title: "Goal Tracker", url: "/dashboard/goals", icon: Target, requiresPro: true },
]

const marketDataNav: NavItem[] = [
  { title: "Heat Maps", url: "/dashboard/heatmaps", icon: Flame },
  { title: "Compare Stocks", url: "/dashboard/compare", icon: GitCompare },
]


export function DashboardSidebar() {
  const pathname = usePathname()

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
                <NavMenuItem key={item.title} item={item} pathname={pathname} />
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
                    <NavMenuItem key={item.title} item={item} pathname={pathname} />
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
              {marketDataNav.map((item) => (
                <NavMenuItem key={item.title} item={item} pathname={pathname} />
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>

      </SidebarContent>
    </Sidebar>
  )
}

// ─── Nav Menu Item with Lock Support ─────────────────────────────────────────
function NavMenuItem({ item, pathname }: { item: NavItem; pathname: string }) {
  const { tier } = useTier()
  const [showUpgradeModal, setShowUpgradeModal] = useState(false)

  const isActive = pathname === item.url
  const hasAccess = !item.requiresPro || tier === 'pro' || tier === 'premium'

  // User has access - render normal link
  if (hasAccess) {
    return (
      <SidebarMenuItem>
        <SidebarMenuButton asChild isActive={isActive}>
          <Link href={item.url}>
            <item.icon className="h-4 w-4" />
            <span>{item.title}</span>
          </Link>
        </SidebarMenuButton>
      </SidebarMenuItem>
    )
  }

  // User doesn't have access - show locked state with click handler
  return (
    <>
      <SidebarMenuItem>
        <SidebarMenuButton
          isActive={isActive}
          onClick={() => setShowUpgradeModal(true)}
          className="cursor-pointer opacity-40 hover:opacity-60"
        >
          <item.icon className="h-4 w-4" />
          <span className="flex-1">{item.title}</span>
          <Lock className="h-3.5 w-3.5 text-muted-foreground" />
        </SidebarMenuButton>
      </SidebarMenuItem>

      <UpgradeModal
        open={showUpgradeModal}
        onClose={() => setShowUpgradeModal(false)}
        highlightTier="pro"
      />
    </>
  )
}
