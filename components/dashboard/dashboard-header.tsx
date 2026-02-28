"use client"

import { Bell, Search, User } from "lucide-react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { SidebarTrigger } from "@/components/ui/sidebar"
import { ThemeToggle } from "@/components/theme-toggle"
import { createClient } from "@/lib/supabase"
import { clearTransactionCache } from "@/lib/transaction-storage"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"

export function DashboardHeader() {
  const router = useRouter()
  const supabase = createClient()

  const handleLogout = async () => {
    try {
      // Clear transaction in-memory cache
      clearTransactionCache()

      // Clear all user-specific data
      localStorage.removeItem('portfolioContextCache')
      localStorage.removeItem('CURRENT_USER_ID_KEY')
      localStorage.removeItem('uploadedFiles')
      localStorage.removeItem('rebalanceScenarios')
      localStorage.removeItem('lastRebalanceDate')
      localStorage.removeItem('userProfile')
      localStorage.removeItem('WATCHLIST_CACHE_KEY')
      sessionStorage.clear()

      // Sign out from Supabase
      await supabase.auth.signOut()

      // Redirect to home page
      router.push('/')
    } catch (error) {
      console.error('[v0] Logout error:', error)
      // Redirect anyway even if signOut fails
      router.push('/')
    }
  }

  return (
    <header className="flex h-14 items-center justify-between border-b border-border px-4 lg:px-6">
      <div className="flex items-center gap-4">
        <SidebarTrigger className="md:hidden" />
        <div className="relative hidden md:block">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Search stocks, ETFs..."
            className="w-64 bg-secondary pl-9"
          />
        </div>
      </div>

      <div className="flex items-center gap-2">
        <ThemeToggle />
        <Button variant="ghost" size="icon" className="relative">
          <Bell className="h-5 w-5" />
          <span className="absolute right-1 top-1 h-2 w-2 rounded-full bg-primary" />
        </Button>

        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="icon" className="rounded-full">
              <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary">
                <User className="h-4 w-4 text-primary-foreground" />
              </div>
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-56">
            <DropdownMenuLabel>My Account</DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DropdownMenuItem
              className="cursor-pointer"
              onClick={() => router.push("/dashboard/profile")}
            >
              Profile
            </DropdownMenuItem>
            <DropdownMenuItem
              className="cursor-pointer"
              onClick={() => router.push("/dashboard/settings")}
            >
              Settings
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem
              className="cursor-pointer text-red-500 focus:text-red-600"
              onClick={handleLogout}
            >
              Log out
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </header>
  )
}
