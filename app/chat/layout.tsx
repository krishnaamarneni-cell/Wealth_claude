import React from "react"
import { redirect } from "next/navigation"
import { cookies } from "next/headers"
import { createServerSideClient } from "@/lib/supabase"
import { PortfolioProvider } from "@/lib/portfolio-context"

export default async function ChatLayout({
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
      redirect("/auth?message=login_required")
    }
  } catch (err) {
    redirect("/auth?message=auth_error")
  }

  return (
    <PortfolioProvider>
      {children}
    </PortfolioProvider>
  )
}
