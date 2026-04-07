'use client'

import { useState } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import {
  LayoutDashboard,
  Share2,
  BookOpen,
  ClipboardCheck,
  Briefcase,
  ChevronLeft,
  ChevronRight,
  LineChart,
} from 'lucide-react'

interface NavItem {
  title: string
  url: string
  icon: React.ComponentType<{ className?: string }>
}

const adminNav: NavItem[] = [
  { title: 'Overview', url: '/admin', icon: LayoutDashboard },
  { title: 'Social Media', url: '/admin/social-media', icon: Share2 },
  { title: 'Blog', url: '/admin/blog', icon: BookOpen },
  { title: 'Assessments', url: '/admin/assessments', icon: ClipboardCheck },
  { title: 'Careers', url: '/admin/careers', icon: Briefcase },
]

export function AdminSidebar() {
  const pathname = usePathname()
  const [collapsed, setCollapsed] = useState(false)

  return (
    <aside
      className={`h-screen sticky top-0 border-r bg-card flex flex-col transition-all duration-200 ${
        collapsed ? 'w-16' : 'w-60'
      }`}
    >
      {/* Header */}
      <div className="p-4 border-b flex items-center gap-2">
        <Link href="/" className="flex items-center gap-2 min-w-0">
          <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-primary">
            <LineChart className="h-5 w-5 text-primary-foreground" />
          </div>
          {!collapsed && (
            <span className="text-lg font-semibold truncate">Admin</span>
          )}
        </Link>
      </div>

      {/* Nav */}
      <nav className="flex-1 p-3 space-y-1">
        {adminNav.map((item) => {
          const isActive =
            item.url === '/admin'
              ? pathname === '/admin'
              : pathname.startsWith(item.url)

          return (
            <Link
              key={item.url}
              href={item.url}
              className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors ${
                isActive
                  ? 'bg-primary text-primary-foreground'
                  : 'text-muted-foreground hover:text-foreground hover:bg-secondary'
              }`}
              title={collapsed ? item.title : undefined}
            >
              <item.icon className="h-4 w-4 shrink-0" />
              {!collapsed && <span>{item.title}</span>}
            </Link>
          )
        })}
      </nav>

      {/* Collapse toggle */}
      <div className="p-3 border-t">
        <button
          onClick={() => setCollapsed(!collapsed)}
          className="flex items-center gap-3 px-3 py-2 rounded-lg text-sm text-muted-foreground hover:text-foreground hover:bg-secondary transition-colors w-full"
        >
          {collapsed ? (
            <ChevronRight className="h-4 w-4 shrink-0" />
          ) : (
            <>
              <ChevronLeft className="h-4 w-4 shrink-0" />
              <span>Collapse</span>
            </>
          )}
        </button>
      </div>
    </aside>
  )
}
