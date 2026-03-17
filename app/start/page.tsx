"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Checkbox } from "@/components/ui/checkbox"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { 
  Rocket, 
  BookOpen, 
  BarChart3, 
  Download, 
  Bell, 
  Lock, 
  CheckCircle2, 
  ArrowRight,
  Loader2,
  Sparkles,
  TrendingUp,
  Target,
  Flame
} from "lucide-react"
import Link from "next/link"

const STORAGE_KEY = 'wealthclaude_lead_email'

export default function StartPage() {
  const [email, setEmail] = useState("")
  const [name, setName] = useState("")
  const [interestedInBook2, setInterestedInBook2] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [hasAccess, setHasAccess] = useState(false)
  const [isCheckingAccess, setIsCheckingAccess] = useState(true)

  // Check if user already has access
  useEffect(() => {
    const storedEmail = localStorage.getItem(STORAGE_KEY)
    if (storedEmail) {
      setEmail(storedEmail)
      setHasAccess(true)
    }
    setIsCheckingAccess(false)
  }, [])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)
    setIsSubmitting(true)

    try {
      const res = await fetch('/api/leads', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email,
          name,
          interestedInBook2,
          source: 'start_page',
        }),
      })

      const data = await res.json()

      if (!res.ok) {
        throw new Error(data.error || 'Failed to sign up')
      }

      // Store email in localStorage
      localStorage.setItem(STORAGE_KEY, email)
      setHasAccess(true)

    } catch (err: any) {
      setError(err.message)
    } finally {
      setIsSubmitting(false)
    }
  }

  if (isCheckingAccess) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    )
  }

  // ==================== GATED CONTENT (After Email) ====================
  if (hasAccess) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-background to-muted/30">
        <div className="container mx-auto px-4 py-12 max-w-4xl">
          {/* Welcome Header */}
          <div className="text-center mb-12">
            <div className="inline-flex items-center gap-2 bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300 px-4 py-2 rounded-full text-sm font-medium mb-4">
              <CheckCircle2 className="h-4 w-4" />
              You have full access!
            </div>
            <h1 className="text-4xl font-bold mb-4">Welcome to Your FIRE Journey</h1>
            <p className="text-xl text-muted-foreground">
              Here's everything you need to start building wealth
            </p>
          </div>

          {/* Free Content Cards */}
          <div className="grid md:grid-cols-2 gap-6 mb-12">
            {/* FIRE Course */}
            <Card className="relative overflow-hidden group hover:shadow-lg transition-shadow">
              <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-br from-primary/10 to-transparent rounded-bl-full" />
              <CardHeader>
                <div className="flex items-center justify-between">
                  <Badge variant="secondary" className="bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-300">
                    Free
                  </Badge>
                  <BookOpen className="h-8 w-8 text-primary" />
                </div>
                <CardTitle className="text-xl">FIRE Course</CardTitle>
                <CardDescription>
                  10-chapter course on Financial Independence. Learn the car analogy framework for building wealth.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <Link href="/learn">
                  <Button className="w-full group-hover:bg-primary/90">
                    Start Learning
                    <ArrowRight className="ml-2 h-4 w-4" />
                  </Button>
                </Link>
              </CardContent>
            </Card>

            {/* FIRE Score Quiz */}
            <Card className="relative overflow-hidden group hover:shadow-lg transition-shadow">
              <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-br from-orange-500/10 to-transparent rounded-bl-full" />
              <CardHeader>
                <div className="flex items-center justify-between">
                  <Badge variant="secondary" className="bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-300">
                    Free
                  </Badge>
                  <Target className="h-8 w-8 text-orange-500" />
                </div>
                <CardTitle className="text-xl">FIRE Score Quiz</CardTitle>
                <CardDescription>
                  Discover your Financial Independence score and get personalized recommendations.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <Link href="/fire-score">
                  <Button variant="outline" className="w-full">
                    Take the Quiz
                    <ArrowRight className="ml-2 h-4 w-4" />
                  </Button>
                </Link>
              </CardContent>
            </Card>

            {/* Book Download */}
            <Card className="relative overflow-hidden group hover:shadow-lg transition-shadow">
              <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-br from-blue-500/10 to-transparent rounded-bl-full" />
              <CardHeader>
                <div className="flex items-center justify-between">
                  <Badge variant="secondary" className="bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-300">
                    Free
                  </Badge>
                  <Download className="h-8 w-8 text-blue-500" />
                </div>
                <CardTitle className="text-xl">Drive to Freedom (Book 1)</CardTitle>
                <CardDescription>
                  A Farmer's Son's Guide to Building Wealth. Download the complete PDF ebook.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <a href="/drive-to-freedom.pdf" download>
                  <Button variant="outline" className="w-full">
                    <Download className="mr-2 h-4 w-4" />
                    Download PDF
                  </Button>
                </a>
              </CardContent>
            </Card>

            {/* Book 2 Waitlist */}
            <Card className="relative overflow-hidden group hover:shadow-lg transition-shadow border-dashed">
              <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-br from-purple-500/10 to-transparent rounded-bl-full" />
              <CardHeader>
                <div className="flex items-center justify-between">
                  <Badge variant="secondary" className="bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-300">
                    Coming Soon
                  </Badge>
                  <Bell className="h-8 w-8 text-purple-500" />
                </div>
                <CardTitle className="text-xl">Drive to Freedom (Book 2)</CardTitle>
                <CardDescription>
                  The comprehensive guide with 35 chapters. You'll be notified when it launches!
                </CardDescription>
              </CardHeader>
              <CardContent>
                <Button variant="secondary" className="w-full" disabled>
                  <CheckCircle2 className="mr-2 h-4 w-4" />
                  You're on the waitlist
                </Button>
              </CardContent>
            </Card>
          </div>

          {/* Premium Section */}
          <div className="border-t pt-12">
            <div className="text-center mb-8">
              <Badge variant="outline" className="mb-4">
                <Sparkles className="mr-1 h-3 w-3" />
                Premium
              </Badge>
              <h2 className="text-2xl font-bold mb-2">Want to See How I'm Actually Doing It?</h2>
              <p className="text-muted-foreground">
                Get access to my real portfolio - every holding, allocation, and return
              </p>
            </div>

            <Card className="relative overflow-hidden border-2 border-primary/20 bg-gradient-to-br from-primary/5 to-transparent">
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle className="text-xl flex items-center gap-2">
                      <Lock className="h-5 w-5 text-primary" />
                      Krishna's Live Portfolio
                    </CardTitle>
                    <CardDescription>
                      See exactly what I'm invested in and how it's performing
                    </CardDescription>
                  </div>
                  <div className="text-right">
                    <p className="text-3xl font-bold text-primary">$29</p>
                    <p className="text-sm text-muted-foreground">one-time</p>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <div className="grid md:grid-cols-2 gap-4 mb-6">
                  <div className="flex items-center gap-2 text-sm">
                    <CheckCircle2 className="h-4 w-4 text-green-500" />
                    All current holdings
                  </div>
                  <div className="flex items-center gap-2 text-sm">
                    <CheckCircle2 className="h-4 w-4 text-green-500" />
                    Dollar amounts & shares
                  </div>
                  <div className="flex items-center gap-2 text-sm">
                    <CheckCircle2 className="h-4 w-4 text-green-500" />
                    Portfolio allocation
                  </div>
                  <div className="flex items-center gap-2 text-sm">
                    <CheckCircle2 className="h-4 w-4 text-green-500" />
                    Performance & returns
                  </div>
                  <div className="flex items-center gap-2 text-sm">
                    <CheckCircle2 className="h-4 w-4 text-green-500" />
                    Cost basis data
                  </div>
                  <div className="flex items-center gap-2 text-sm">
                    <CheckCircle2 className="h-4 w-4 text-green-500" />
                    Lifetime access
                  </div>
                </div>
                <Link href="/u/krishna-amarneni/portfolio">
                  <Button className="w-full" size="lg">
                    <TrendingUp className="mr-2 h-4 w-4" />
                    View Portfolio
                    <ArrowRight className="ml-2 h-4 w-4" />
                  </Button>
                </Link>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    )
  }

  // ==================== EMAIL GATE (Before Access) ====================
  return (
    <div className="min-h-screen bg-gradient-to-b from-background to-muted/30 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        {/* Logo/Header */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-primary/10 mb-4">
            <Flame className="h-8 w-8 text-primary" />
          </div>
          <h1 className="text-3xl font-bold mb-2">Start Your FIRE Journey</h1>
          <p className="text-muted-foreground">
            Get free access to courses, tools, and resources to build wealth
          </p>
        </div>

        {/* Sign Up Form */}
        <Card>
          <CardHeader>
            <CardTitle>Get Free Access</CardTitle>
            <CardDescription>
              Enter your details to unlock all free content
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="name">Name (optional)</Label>
                <Input
                  id="name"
                  type="text"
                  placeholder="John Doe"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="email">Email <span className="text-red-500">*</span></Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="you@example.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                />
              </div>

              <div className="flex items-center space-x-2">
                <Checkbox 
                  id="book2" 
                  checked={interestedInBook2}
                  onCheckedChange={(checked) => setInterestedInBook2(checked as boolean)}
                />
                <Label htmlFor="book2" className="text-sm font-normal cursor-pointer">
                  Notify me when Book 2 launches
                </Label>
              </div>

              {error && (
                <p className="text-sm text-red-500">{error}</p>
              )}

              <Button type="submit" className="w-full" disabled={isSubmitting || !email}>
                {isSubmitting ? (
                  <Loader2 className="h-4 w-4 animate-spin mr-2" />
                ) : (
                  <Rocket className="h-4 w-4 mr-2" />
                )}
                Get Free Access
              </Button>
            </form>
          </CardContent>
        </Card>

        {/* What's Included */}
        <div className="mt-8 space-y-3">
          <p className="text-sm font-medium text-center text-muted-foreground">
            What you'll get:
          </p>
          <div className="grid grid-cols-2 gap-3 text-sm">
            <div className="flex items-center gap-2">
              <CheckCircle2 className="h-4 w-4 text-green-500" />
              10-chapter FIRE course
            </div>
            <div className="flex items-center gap-2">
              <CheckCircle2 className="h-4 w-4 text-green-500" />
              FIRE Score quiz
            </div>
            <div className="flex items-center gap-2">
              <CheckCircle2 className="h-4 w-4 text-green-500" />
              Book 1 PDF download
            </div>
            <div className="flex items-center gap-2">
              <CheckCircle2 className="h-4 w-4 text-green-500" />
              Book 2 waitlist access
            </div>
          </div>
        </div>

        {/* Trust Indicators */}
        <p className="text-center text-xs text-muted-foreground mt-8">
          No spam. Unsubscribe anytime. Your data is safe.
        </p>
      </div>
    </div>
  )
}
