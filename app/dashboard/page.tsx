import { cookies } from 'next/headers'
import { createServerSideClient } from '@/lib/supabase'
import { Card } from '@/components/ui/card'

export default async function DashboardPage() {
  const cookieStore = await cookies()
  const supabase = await createServerSideClient(cookieStore)

  const { data: { user } } = await supabase.auth.getUser()

  return (
    <main className="min-h-screen bg-background">
      <div className="p-8">
        <div className="max-w-4xl">
          {/* User Authentication Status */}
          <Card className="p-6 mb-8 border-border">
            {user ? (
              <div>
                <p className="text-sm text-muted-foreground mb-1">Account</p>
                <p className="text-2xl font-bold">
                  Welcome <span className="text-primary">{user.email}</span>
                </p>
              </div>
            ) : (
              <div>
                <p className="text-lg text-muted-foreground">
                  Not logged in
                </p>
              </div>
            )}
          </Card>

          {/* Rest of dashboard content can go here */}
          <div className="text-muted-foreground">
            <p>Dashboard content goes here...</p>
          </div>
        </div>
      </div>
    </main>
  )
}
