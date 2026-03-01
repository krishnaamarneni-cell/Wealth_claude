'use client'

import { useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Mail, Github, Loader2, Check, LineChart } from 'lucide-react'

const COMPANY_NAME = 'WealthClaude'

export default function AuthPage() {
  const supabase = createClient()
  const router = useRouter()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [isDuplicateEmail, setIsDuplicateEmail] = useState(false)
  const [confirmationSent, setConfirmationSent] = useState(false)
  const [confirmationEmail, setConfirmationEmail] = useState('')
  const [showForgotPassword, setShowForgotPassword] = useState(false)
  const [forgotPasswordEmail, setForgotPasswordEmail] = useState('')
  const [forgotPasswordLoading, setForgotPasswordLoading] = useState(false)
  const [resetLinkSent, setResetLinkSent] = useState(false)
  const [activeTab, setActiveTab] = useState('login')

  // Email signup
  const handleEmailSignup = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError(null)
    setIsDuplicateEmail(false)

    try {
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          emailRedirectTo: `${window.location.origin}/auth/callback`,
        },
      })
      if (error) throw error

      // Check if identities array is empty — this means email already exists
      if (data.user?.identities?.length === 0) {
        setIsDuplicateEmail(true)
        setError('An account with this email already exists. Please sign in instead.')
        return
      }

      setConfirmationEmail(email)
      setConfirmationSent(true)
      setEmail('')
      setPassword('')
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Signup failed'
      setError(errorMessage)
    } finally {
      setLoading(false)
    }
  }

  // Email login
  const handleEmailLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError(null)

    try {
      const { error } = await supabase.auth.signInWithPassword({
        email,
        password,
      })
      if (error) throw error
      router.push('/dashboard')
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Login failed')
    } finally {
      setLoading(false)
    }
  }

  // Google OAuth
  const handleGoogleAuth = async () => {
    try {
      const { error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo: `${window.location.origin}/auth/callback`,
        },
      })
      if (error) throw error
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Google login failed')
    }
  }

  // GitHub OAuth
  const handleGithubAuth = async () => {
    try {
      const { error } = await supabase.auth.signInWithOAuth({
        provider: 'github',
        options: {
          redirectTo: `${window.location.origin}/auth/callback`,
        },
      })
      if (error) throw error
    } catch (err) {
      setError(err instanceof Error ? err.message : 'GitHub login failed')
    }
  }

  // Password reset
  const handlePasswordReset = async (e: React.FormEvent) => {
    e.preventDefault()
    setForgotPasswordLoading(true)
    setError(null)

    try {
      const { error } = await supabase.auth.resetPasswordForEmail(forgotPasswordEmail, {
        redirectTo: `${window.location.origin}/auth/reset-password`,
      })
      if (error) throw error

      setResetLinkSent(true)
      setForgotPasswordEmail('')
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to send reset email')
    } finally {
      setForgotPasswordLoading(false)
    }
  }

  if (confirmationSent) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-4">
        <Card className="max-w-md w-full">
          <CardHeader className="text-center">
            <div className="mb-4 flex justify-center">
              <div className="p-3 rounded-full bg-green-500/10">
                <Check className="h-6 w-6 text-green-500" />
              </div>
            </div>
            <CardTitle>Check Your Inbox</CardTitle>
            <CardDescription className="mt-2">
              We've sent a confirmation link to <span className="font-semibold text-foreground">{confirmationEmail}</span>
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="text-sm text-muted-foreground">
              Click the link in the email to verify your account and get started with {COMPANY_NAME}.
            </p>
            <Button
              variant="outline"
              className="w-full"
              onClick={() => setConfirmationSent(false)}
            >
              Back to Sign Up
            </Button>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
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
          <p className="text-sm text-muted-foreground">Track your portfolio, maximize returns</p>
        </CardHeader>
        <CardContent>
          <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
            <TabsList className="grid w-full grid-cols-2 mb-6">
              <TabsTrigger value="signup">Sign Up</TabsTrigger>
              <TabsTrigger value="login">Sign In</TabsTrigger>
            </TabsList>

            {/* Sign Up Tab */}
            <TabsContent value="signup" className="space-y-4">
              <form onSubmit={handleEmailSignup} className="space-y-4">
                <div>
                  <Input
                    type="email"
                    placeholder="Email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                    disabled={loading}
                  />
                </div>
                <div>
                  <Input
                    type="password"
                    placeholder="Password (min 6 chars)"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                    minLength={6}
                    disabled={loading}
                  />
                </div>
                {error && (
                  <div className="text-sm text-red-500">
                    {isDuplicateEmail ? (
                      <p>
                        {error}{' '}
                        <button
                          type="button"
                          onClick={() => {
                            setActiveTab('login')
                            setError(null)
                            setIsDuplicateEmail(false)
                            setEmail('')
                            setPassword('')
                          }}
                          className="text-primary hover:underline font-semibold"
                        >
                          Sign In
                        </button>
                      </p>
                    ) : (
                      <p>{error}</p>
                    )}
                  </div>
                )}
                <Button className="w-full" disabled={loading}>
                  {loading ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Creating account...
                    </>
                  ) : (
                    'Create Account'
                  )}
                </Button>
              </form>

              <div className="relative">
                <div className="absolute inset-0 flex items-center">
                  <div className="w-full border-t border-border" />
                </div>
                <div className="relative flex justify-center text-xs uppercase">
                  <span className="bg-card px-2 text-muted-foreground">Or continue with</span>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2">
                <Button
                  variant="outline"
                  onClick={handleGoogleAuth}
                  disabled={loading}
                  className="w-full"
                >
                  <Mail className="mr-2 h-4 w-4" />
                  Google
                </Button>
                <Button
                  variant="outline"
                  onClick={handleGithubAuth}
                  disabled={loading}
                  className="w-full"
                >
                  <Github className="mr-2 h-4 w-4" />
                  GitHub
                </Button>
              </div>
            </TabsContent>

            {/* Sign In Tab */}
            <TabsContent value="login" className="space-y-4">
              {showForgotPassword ? (
                // Forgot Password Form
                <div className="space-y-4">
                  <div>
                    <h3 className="font-semibold mb-2">Reset Password</h3>
                    <p className="text-sm text-muted-foreground mb-4">Enter your email to receive a password reset link</p>
                  </div>
                  <form onSubmit={handlePasswordReset} className="space-y-4">
                    <div>
                      <Input
                        type="email"
                        placeholder="Email"
                        value={forgotPasswordEmail}
                        onChange={(e) => setForgotPasswordEmail(e.target.value)}
                        required
                        disabled={forgotPasswordLoading}
                      />
                    </div>
                    {error && <p className="text-sm text-red-500">{error}</p>}
                    {resetLinkSent && (
                      <div className="p-3 rounded-md bg-green-500/10 border border-green-500/20">
                        <p className="text-sm text-green-600">Check your email for a reset link</p>
                      </div>
                    )}
                    <div className="flex gap-2">
                      <Button
                        className="flex-1"
                        disabled={forgotPasswordLoading || resetLinkSent}
                      >
                        {forgotPasswordLoading ? (
                          <>
                            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                            Sending...
                          </>
                        ) : (
                          'Send Reset Link'
                        )}
                      </Button>
                      <Button
                        variant="outline"
                        className="flex-1"
                        type="button"
                        onClick={() => {
                          setShowForgotPassword(false)
                          setResetLinkSent(false)
                          setError(null)
                        }}
                      >
                        Back
                      </Button>
                    </div>
                  </form>
                </div>
              ) : (
                // Sign In Form
                <>
                  <form onSubmit={handleEmailLogin} className="space-y-4">
                    <div>
                      <Input
                        type="email"
                        placeholder="Email"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        required
                        disabled={loading}
                      />
                    </div>
                    <div>
                      <Input
                        type="password"
                        placeholder="Password"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        required
                        disabled={loading}
                      />
                      <div className="mt-2 text-right">
                        <button
                          type="button"
                          onClick={() => setShowForgotPassword(true)}
                          className="text-xs text-primary hover:underline"
                        >
                          Forgot Password?
                        </button>
                      </div>
                    </div>
                    {error && <p className="text-sm text-red-500">{error}</p>}
                    <Button className="w-full" disabled={loading}>
                      {loading ? (
                        <>
                          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                          Signing in...
                        </>
                      ) : (
                        'Sign In'
                      )}
                    </Button>
                  </form>

                  <div className="relative">
                    <div className="absolute inset-0 flex items-center">
                      <div className="w-full border-t border-border" />
                    </div>
                    <div className="relative flex justify-center text-xs uppercase">
                      <span className="bg-card px-2 text-muted-foreground">Or continue with</span>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-2">
                    <Button
                      variant="outline"
                      onClick={handleGoogleAuth}
                      disabled={loading}
                      className="w-full"
                    >
                      <Mail className="mr-2 h-4 w-4" />
                      Google
                    </Button>
                    <Button
                      variant="outline"
                      onClick={handleGithubAuth}
                      disabled={loading}
                      className="w-full"
                    >
                      <Github className="mr-2 h-4 w-4" />
                      GitHub
                    </Button>
                  </div>
                </>
              )}
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  )
}
