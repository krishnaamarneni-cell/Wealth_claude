import React from "react"
import Link from "next/link"

// ============================================
// PUBLIC LAYOUT - No authentication required
// ============================================
// This layout is for clients taking assessments
// They should NOT need to log in

export default function AssessmentLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <div className="min-h-screen bg-background">
      {/* Simple header for branding */}
      <header className="border-b border-border bg-card">
        <div className="max-w-4xl mx-auto px-6 py-4">
          <Link href="/" className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-primary flex items-center justify-center">
              <span className="text-primary-foreground font-bold text-sm">W</span>
            </div>
            <span className="font-semibold text-foreground">WealthClaude</span>
          </Link>
        </div>
      </header>

      {/* Main content */}
      <main className="flex-1">
        {children}
      </main>

      {/* Simple footer */}
      <footer className="border-t border-border bg-card mt-auto">
        <div className="max-w-4xl mx-auto px-6 py-4 text-center">
          <p className="text-sm text-muted-foreground">
            © {new Date().getFullYear()} WealthClaude. Your responses are confidential.
          </p>
        </div>
      </footer>
    </div>
  )
}
