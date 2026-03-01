'use client'

import { Suspense, useEffect, useState } from 'react'
import Link from 'next/link'
import { useRouter, useSearchParams } from 'next/navigation'
import { createClient } from '@/lib/supabase'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Loader2, Check, LineChart } from 'lucide-react'

const COMPANY_NAME = 'WealthClaude'

// Metadata for reset password page
export const metadata = {
  title: 'Reset Password — WealthClaude',
  description: 'Reset your WealthClaude account password.',
}

function ResetPasswordContent() {
  const supabase = createClient()
  const router = useRouter()
  const searchParams = useSearchParams()
  const [newPassword, setNewPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState(false)
  const [validToken, setValidToken] = useState(true)

  // Check if user has a valid session with recovery token
  useEffect(() => {
    const checkToken = async () => {
      try {
        const { data: { session } } = await supabase.auth.getSession()
        
        // If no session and no recovery token in URL, redirect back
        if (!session) {
          const type = searchParams.get('type')
          if (type !== 'recovery') {
            setValidToken(false)
          }
        }
      } catch (err) {
        console.error('[v0] Error checking session:', err)
        setValidToken(false)
      }
    }

    checkToken()
  }, [supabase, searchParams])

  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)

    // Validate passwords match
    if (newPassword !== confirmPassword) {
      setError('Passwords do not match')
      return
    }

    // Validate password length
    if (newPassword.length < 6) {
      setError('Password must be at least 6 characters')
      return
    }

    setLoading(true)

    try {
      const { error: updateError } = await supabase.auth.updateUser({
        password: newPassword,
      })

      if (updateError) throw updateError

      setSuccess(true)
      setNewPassword('')
      setConfirmPassword('')

      // Redirect to login after 2 seconds
      setTimeout(() => {
        router.push('/auth?tab=login')
      }, 2000)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to update password')
    } finally {
      setLoading(false)
    }
  }

  if (!validToken) {
    return (
      <Card className="max-w-md w-full">
        <CardHeader className="text-center">
          <CardTitle>Invalid or Expired Link</CardTitle>
          <CardDescription className="mt-2">
            This password reset link is invalid or has expired.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-sm text-muted-foreground">
            Please request a new password reset link from the sign in page.
          </p>
          <Link href="/auth">
            <Button className="w-full">Back to Sign In</Button>
          </Link>
        </CardContent>
      </Card>
    )
  }

  if (success) {
    return (
      <Card className="max-w-md w-full">
        <CardHeader className="text-center">
          <div className="mb-4 flex justify-center">
            <div className="p-3 rounded-full bg-green-500/10">
              <Check className="h-6 w-6 text-green-500" />
            </div>
          </div>
          <CardTitle>Password Updated</CardTitle>
          <CardDescription className="mt-2">
            Your password has been successfully updated.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-sm text-muted-foreground">
            Redirecting you to sign in in a moment...
          </p>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card className="max-w-md w-full">
      <CardHeader className="text-center">
        <Link href="/" className="inline-block hover:opacity-80 transition-opacity">
          <div className="mb-2 flex items-center justify-center gap-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary">
              <LineChart className="h-5 w-5 text-primary-foreground" />
            </div>
            <div>
              <h1 className="text-2xl font-bold">{COMPANY_NAME}</h1>
            </div>
          </div>
        </Link>
        <p className="text-sm text-muted-foreground">Reset your password</p>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleResetPassword} className="space-y-4">
          <div>
            <Input
              type="password"
              placeholder="New Password"
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              required
              minLength={6}
              disabled={loading}
            />
          </div>
          <div>
            <Input
              type="password"
              placeholder="Confirm Password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              required
              minLength={6}
              disabled={loading}
            />
          </div>

          {error && (
            <div className="p-3 rounded-md bg-red-500/10 border border-red-500/20">
              <p className="text-sm text-red-600">{error}</p>
            </div>
          )}

          <Button className="w-full" disabled={loading}>
            {loading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Updating Password...
              </>
            ) : (
              'Update Password'
            )}
          </Button>
        </form>
      </CardContent>
    </Card>
  )
}

export default function ResetPasswordPage() {
  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <Suspense fallback={<div>Loading...</div>}>
        <ResetPasswordContent />
      </Suspense>
    </div>
  )
}
