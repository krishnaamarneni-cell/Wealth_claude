"use client"

import React, { useState, useEffect } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import { 
  ArrowRight,
  Target,
  Clock,
  Loader2,
  AlertCircle,
  CreditCard,
  TrendingUp,
  Scale,
  Zap,
  Timer,
  Leaf
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { Label } from "@/components/ui/label"

const priorityOptions = [
  {
    id: "pay_debt_first",
    icon: CreditCard,
    title: "Pay off debt first",
    description: "Focus on eliminating debt before building investments"
  },
  {
    id: "build_investments_first",
    icon: TrendingUp,
    title: "Build investments first",
    description: "Prioritize growing wealth while managing debt payments"
  },
  {
    id: "balanced_approach",
    icon: Scale,
    title: "Balanced approach",
    description: "Split focus between debt payoff and investment growth"
  }
]

const timelineOptions = [
  {
    id: "aggressive",
    icon: Zap,
    title: "Aggressive",
    subtitle: "1-2 years",
    description: "Maximum effort, fastest results"
  },
  {
    id: "moderate",
    icon: Timer,
    title: "Moderate",
    subtitle: "3-5 years",
    description: "Steady progress with flexibility"
  },
  {
    id: "slow_steady",
    icon: Leaf,
    title: "Slow & Steady",
    subtitle: "5+ years",
    description: "Gradual changes, sustainable habits"
  }
]

export default function AssessmentGoalsPage() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const sessionId = searchParams.get("session")

  const [loading, setLoading] = useState(true)
  const [error, setError] = useState("")
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [sessionData, setSessionData] = useState<{ full_name: string } | null>(null)

  const [selectedPriority, setSelectedPriority] = useState("")
  const [selectedTimeline, setSelectedTimeline] = useState("")
  const [additionalNotes, setAdditionalNotes] = useState("")

  // Load session
  useEffect(() => {
    if (!sessionId) {
      router.push("/assessment/start")
      return
    }

    const loadSession = async () => {
      try {
        const response = await fetch(`/api/assessment/session?id=${sessionId}`)
        if (!response.ok) throw new Error("Session not found")
        const data = await response.json()
        
        if (data.status === "intake_complete" || data.status === "tests_in_progress") {
          // Tests not complete, redirect back
          router.push(`/assessment/test?session=${sessionId}`)
          return
        }
        
        setSessionData(data)
        
        // Load existing selections if any
        if (data.primary_goal) setSelectedPriority(data.primary_goal)
        if (data.timeline) setSelectedTimeline(data.timeline)
        if (data.additional_notes) setAdditionalNotes(data.additional_notes)
      } catch (err) {
        console.error("Error loading session:", err)
        setError("Could not load your session")
      } finally {
        setLoading(false)
      }
    }

    loadSession()
  }, [sessionId, router])

  const handleSubmit = async () => {
    if (!selectedPriority || !selectedTimeline) {
      setError("Please select both your priority and timeline")
      return
    }

    setIsSubmitting(true)
    setError("")

    try {
      // Update session with goals
      const response = await fetch("/api/assessment/session", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          sessionId,
          primaryGoal: selectedPriority,
          timeline: selectedTimeline,
          additionalNotes: additionalNotes.trim() || null,
          status: "goals_complete"
        })
      })

      if (!response.ok) throw new Error("Failed to save goals")

      // Calculate results and send notification
      await fetch("/api/assessment/complete", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ sessionId })
      })

      // Redirect to thank you page
      router.push(`/assessment/thank-you?session=${sessionId}`)
    } catch (err) {
      console.error("Error saving goals:", err)
      setError("Something went wrong. Please try again.")
    } finally {
      setIsSubmitting(false)
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4 text-primary" />
          <p className="text-muted-foreground">Loading...</p>
        </div>
      </div>
    )
  }

  if (error && !sessionData) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center max-w-md mx-auto px-6">
          <AlertCircle className="h-12 w-12 mx-auto mb-4 text-destructive" />
          <h1 className="text-xl font-semibold text-foreground mb-2">Something went wrong</h1>
          <p className="text-muted-foreground mb-6">{error}</p>
          <Button onClick={() => router.push("/assessment/start")}>
            Start Again
          </Button>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <div className="border-b border-border">
        <div className="max-w-4xl mx-auto px-6 py-6">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-primary flex items-center justify-center">
              <span className="text-primary-foreground font-bold text-lg">W</span>
            </div>
            <span className="text-xl font-bold text-foreground">WealthClaude</span>
          </div>
        </div>
      </div>

      {/* Progress */}
      <div className="border-b border-border">
        <div className="max-w-4xl mx-auto px-6 py-4">
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-full bg-primary/20 text-primary flex items-center justify-center">
                ✓
              </div>
              <span className="text-muted-foreground">Your Info</span>
            </div>
            <div className="flex-1 h-px bg-primary/30" />
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-full bg-primary/20 text-primary flex items-center justify-center">
                ✓
              </div>
              <span className="text-muted-foreground">Assessment</span>
            </div>
            <div className="flex-1 h-px bg-primary/30" />
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-full bg-primary text-primary-foreground flex items-center justify-center text-sm font-medium">
                3
              </div>
              <span className="text-foreground font-medium">Your Goals</span>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-4xl mx-auto px-6 py-12">
        <div className="text-center mb-10">
          <h1 className="text-3xl font-bold text-foreground mb-2">
            Almost done, {sessionData?.full_name?.split(" ")[0]}!
          </h1>
          <p className="text-muted-foreground">
            Help us understand your priorities so we can create the best plan for you
          </p>
        </div>

        {/* Priority Selection */}
        <div className="mb-10">
          <div className="flex items-center gap-2 mb-4">
            <Target className="h-5 w-5 text-primary" />
            <h2 className="text-lg font-semibold text-foreground">What's your priority?</h2>
          </div>
          
          <div className="grid gap-4 md:grid-cols-3">
            {priorityOptions.map((option) => (
              <button
                key={option.id}
                onClick={() => setSelectedPriority(option.id)}
                className={`p-5 rounded-xl border text-left transition-all ${
                  selectedPriority === option.id
                    ? "border-primary bg-primary/5"
                    : "border-border bg-card hover:border-primary/50"
                }`}
              >
                <div className={`w-10 h-10 rounded-lg flex items-center justify-center mb-3 ${
                  selectedPriority === option.id
                    ? "bg-primary text-primary-foreground"
                    : "bg-muted text-muted-foreground"
                }`}>
                  <option.icon className="h-5 w-5" />
                </div>
                <h3 className="font-semibold text-foreground mb-1">{option.title}</h3>
                <p className="text-sm text-muted-foreground">{option.description}</p>
              </button>
            ))}
          </div>
        </div>

        {/* Timeline Selection */}
        <div className="mb-10">
          <div className="flex items-center gap-2 mb-4">
            <Clock className="h-5 w-5 text-primary" />
            <h2 className="text-lg font-semibold text-foreground">How quickly do you want to achieve your goals?</h2>
          </div>
          
          <div className="grid gap-4 md:grid-cols-3">
            {timelineOptions.map((option) => (
              <button
                key={option.id}
                onClick={() => setSelectedTimeline(option.id)}
                className={`p-5 rounded-xl border text-left transition-all ${
                  selectedTimeline === option.id
                    ? "border-primary bg-primary/5"
                    : "border-border bg-card hover:border-primary/50"
                }`}
              >
                <div className={`w-10 h-10 rounded-lg flex items-center justify-center mb-3 ${
                  selectedTimeline === option.id
                    ? "bg-primary text-primary-foreground"
                    : "bg-muted text-muted-foreground"
                }`}>
                  <option.icon className="h-5 w-5" />
                </div>
                <h3 className="font-semibold text-foreground mb-0.5">{option.title}</h3>
                <p className="text-sm text-primary font-medium mb-1">{option.subtitle}</p>
                <p className="text-sm text-muted-foreground">{option.description}</p>
              </button>
            ))}
          </div>
        </div>

        {/* Additional Notes */}
        <div className="mb-10">
          <Label htmlFor="notes" className="text-foreground font-medium">
            Anything else you'd like us to know? <span className="text-muted-foreground font-normal">(optional)</span>
          </Label>
          <Textarea
            id="notes"
            placeholder="E.g., I'm planning to buy a house next year, I have a baby on the way, I'm considering a career change..."
            value={additionalNotes}
            onChange={(e) => setAdditionalNotes(e.target.value)}
            className="mt-2 min-h-[100px]"
          />
        </div>

        {/* Error */}
        {error && (
          <p className="text-destructive text-sm mb-4 text-center">{error}</p>
        )}

        {/* Submit */}
        <div className="flex justify-center">
          <Button
            size="lg"
            onClick={handleSubmit}
            disabled={!selectedPriority || !selectedTimeline || isSubmitting}
            className="min-w-[200px]"
          >
            {isSubmitting ? (
              <>
                <Loader2 className="h-5 w-5 mr-2 animate-spin" />
                Submitting...
              </>
            ) : (
              <>
                Complete Assessment
                <ArrowRight className="h-5 w-5 ml-2" />
              </>
            )}
          </Button>
        </div>
      </div>
    </div>
  )
}
