'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useTier } from '@/lib/tier-context'
import { useState } from 'react'
import { Lock } from 'lucide-react'
import { UpgradeModal } from '@/components/upgrade-modal'
import { getRequiredTier, Tier } from '@/lib/tier-config'
import { cn } from '@/lib/utils'

interface SidebarNavItemProps {
  href: string
  icon: React.ReactNode
  label: string
  className?: string
}

/**
 * Sidebar navigation item that shows lock icon for pages the user can't access.
 * Clicking a locked item opens the upgrade modal instead of navigating.
 */
export function SidebarNavItem({ href, icon, label, className }: SidebarNavItemProps) {
  const pathname = usePathname()
  const { canAccess, tier } = useTier()
  const [showUpgradeModal, setShowUpgradeModal] = useState(false)

  const isActive = pathname === href
  const hasAccess = canAccess(href)
  const requiredTier = getRequiredTier(href)

  // If user has access, render normal link
  if (hasAccess) {
    return (
      <Link
        href={href}
        className={cn(
          "flex items-center gap-3 rounded-lg px-3 py-2 text-sm transition-colors",
          isActive
            ? "bg-primary/10 text-primary"
            : "text-muted-foreground hover:bg-muted hover:text-foreground",
          className
        )}
      >
        {icon}
        <span>{label}</span>
      </Link>
    )
  }

  // User doesn't have access - show locked state
  return (
    <>
      <button
        onClick={() => setShowUpgradeModal(true)}
        className={cn(
          "flex items-center gap-3 rounded-lg px-3 py-2 text-sm transition-colors w-full text-left",
          "text-muted-foreground/60 hover:bg-muted hover:text-muted-foreground",
          className
        )}
      >
        {icon}
        <span className="flex-1">{label}</span>
        <Lock className="w-3.5 h-3.5 text-muted-foreground/40" />
      </button>

      <UpgradeModal
        open={showUpgradeModal}
        onClose={() => setShowUpgradeModal(false)}
        highlightTier={requiredTier}
      />
    </>
  )
}

/**
 * Example usage in your sidebar:
 * 
 * import { SidebarNavItem } from '@/components/sidebar-nav-item'
 * 
 * <SidebarNavItem 
 *   href="/dashboard/performance" 
 *   icon={<TrendingUp className="w-4 h-4" />}
 *   label="Performance"
 * />
 */
