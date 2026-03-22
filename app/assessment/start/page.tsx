"use client"

import React, { useState } from "react"
import { useRouter } from "next/navigation"
import {
  ArrowRight,
  User,
  Mail,
  Phone,
  CreditCard,
  TrendingUp,
  Umbrella,
  Wallet,
  ClipboardCheck,
  Loader2,
  CheckCircle2
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"

// Problem categories with icons and descriptions
const problemCategories = [
  {
    id: "debt",
    icon: CreditCard,
    title: "I have debt I want to pay off",
    description: "Credit cards, loans, or other debts weighing you down",
    tests: ["Financial Health", "Debt Management", "Money Mindset"],
    time: "~8 min"
  },
  {
    id: "investments",
    icon: TrendingUp,
    title: "I want to grow my investments",
    description: "Start investing or optimize your portfolio",
    tests: ["Financial Personality", "Investment Profile", "Money Mindset"],
    time: "~7 min"
  },
  {
    id: "retirement",
    icon: Umbrella,
    title: "I want to plan for retirement",
    description: "Ensure you're on track for a comfortable retirement",
    tests: ["Retirement Readiness", "Investment Profile", "Financial Health"],
    time: "~8 min"
  },
  {
    id: "budgeting",
    icon: Wallet,
    title: "I don't know where my money goes",
    description: "Get control of your spending and cash flow",
    tests: ["Budget & Cash Flow", "Financial Personality", "Financial Health"],
    time: "~8 min"
  },
  {
    id: "complete_checkup",
    icon: ClipboardCheck,
    title: "I need a complete financial checkup",
    description: "Comprehensive analysis of your entire financial picture",
    tests: ["All 9 assessments included"],
    time: "~25 min"
  }
]

export default function AssessmentStartPage() {
  const router = useRouter()
  const [step, setStep] = useState<"info" | "problem">("info")
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState("")

  // Form state
  const [formData, setFormData] = useState({
    fullName: "",
    email: "",
    phone: "",
    problemType: ""
  })

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target
    setFormData(prev => ({ ...prev, [name]: value }))
    setError("")
  }

  const handleProblemSelect = (problemId: string) => {
    setFormData(prev => ({ ...prev, problemType: problemId }))
  }

  const validateEmail = (email: string) => {
    return /^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}$/.test(email)
  }

  const handleContinueToProblems = () => {
    if (!formData.fullName.trim()) {
      setError("Please enter your name")
      return
    }
    if (!formData.email.trim()) {
      setError("Please enter your email")
      return
    }
    if (!validateEmail(formData.email)) {
      setError("Please enter a valid email address")
      return
    }
    setStep("problem")
  }

  const handleStartAssessment = async () => {
    if (!formData.problemType) {
      setError("Please select what you'd like help with")
      return
    }

    setIsSubmitting(true)
    setError("")

    try {
      // Create session in database
      const response = await fetch("/api/assessment/session", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          fullName: formData.fullName.trim(),
          email: formData.email.trim().toLowerCase(),
          phone: formData.phone.trim() || null,
          problemType: formData.problemType
        })
      })

      if (!response.ok) {
        const data = await response.json()
        throw new Error(data.error || "Failed to create session")
      }

      const { sessionId } = await response.json()

      // Redirect to test page with session ID
      router.push(`/assessment/test?session=${sessionId}`)
    } catch (err) {
      console.error("Error creating session:", err)
      setError(err instanceof Error ? err.message : "Something went wrong. Please try again.")
    } finally {
      setIsSubmitting(false)
    }
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

      {/* Progress Indicator */}
      <div className="border-b border-border">
        <div className="max-w-4xl mx-auto px-6 py-4">
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2">
              <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium ${step === "info" ? "bg-primary text-primary-foreground" : "bg-primary/20 text-primary"
                }`}>
                {step === "problem" ? <CheckCircle2 className="h-5 w-5" /> : "1"}
              </div>
              <span className={step === "info" ? "text-foreground font-medium" : "text-muted-foreground"}>
                Your Info
              </span>
            </div>
            <div className="flex-1 h-px bg-border" />
            <div className="flex items-center gap-2">
              <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium ${step === "problem" ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground"
                }`}>
                2
              </div>
              <span className={step === "problem" ? "text-foreground font-medium" : "text-muted-foreground"}>
                Your Goal
              </span>
            </div>
            <div className="flex-1 h-px bg-border" />
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-full bg-muted text-muted-foreground flex items-center justify-center text-sm font-medium">
                3
              </div>
              <span className="text-muted-foreground">Assessment</span>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-4xl mx-auto px-6 py-12">
        {step === "info" ? (
          /* Step 1: User Information */
          <div className="max-w-md mx-auto">
            <div className="text-center mb-8">
              <h1 className="text-3xl font-bold text-foreground mb-2">
                Let's get started
              </h1>
              <p className="text-muted-foreground">
                Tell us a bit about yourself so we can personalize your assessment
              </p>
            </div>

            <div className="space-y-6">
              <div className="space-y-2">
                <Label htmlFor="fullName" className="text-foreground">
                  Full Name <span className="text-destructive">*</span>
                </Label>
                <div className="relative">
                  <User className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
                  <Input
                    id="fullName"
                    name="fullName"
                    type="text"
                    placeholder="John Doe"
                    value={formData.fullName}
                    onChange={handleInputChange}
                    className="pl-10"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="email" className="text-foreground">
                  Email Address <span className="text-destructive">*</span>
                </Label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
                  <Input
                    id="email"
                    name="email"
                    type="email"
                    placeholder="john@example.com"
                    value={formData.email}
                    onChange={handleInputChange}
                    className="pl-10"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="phone" className="text-foreground">
                  Phone Number <span className="text-muted-foreground">(optional)</span>
                </Label>
                <div className="relative">
                  <Phone className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
                  <Input
                    id="phone"
                    name="phone"
                    type="tel"
                    placeholder="+1 (555) 123-4567"
                    value={formData.phone}
                    onChange={handleInputChange}
                    className="pl-10"
                  />
                </div>
              </div>

              {error && (
                <p className="text-destructive text-sm">{error}</p>
              )}

              <Button
                onClick={handleContinueToProblems}
                className="w-full"
                size="lg"
              >
                Continue
                <ArrowRight className="ml-2 h-5 w-5" />
              </Button>

              <p className="text-center text-sm text-muted-foreground">
                Your information is kept confidential and will only be used to provide you with personalized financial guidance.
              </p>
            </div>
          </div>
        ) : (
          /* Step 2: Problem Selection */
          <div>
            <div className="text-center mb-8">
              <h1 className="text-3xl font-bold text-foreground mb-2">
                What would you like help with?
              </h1>
              <p className="text-muted-foreground">
                Select your primary financial goal and we'll customize your assessment
              </p>
            </div>

            <div className="grid gap-4">
              {problemCategories.map((category) => {
                const isSelected = formData.problemType === category.id
                return (
                  <button
                    key={category.id}
                    onClick={() => handleProblemSelect(category.id)}
                    className={`w-full p-6 rounded-xl border text-left transition-all ${isSelected
                        ? "border-primary bg-primary/5"
                        : "border-border bg-card hover:border-primary/50"
                      }`}
                  >
                    <div className="flex items-start gap-4">
                      <div className={`p-3 rounded-lg ${isSelected ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground"
                        }`}>
                        <category.icon className="h-6 w-6" />
                      </div>
                      <div className="flex-1">
                        <div className="flex items-center justify-between mb-1">
                          <h3 className="font-semibold text-foreground">{category.title}</h3>
                          <span className="text-sm text-muted-foreground">{category.time}</span>
                        </div>
                        <p className="text-muted-foreground text-sm mb-2">{category.description}</p>
                        <div className="flex flex-wrap gap-2">
                          {category.tests.map((test, i) => (
                            <span
                              key={i}
                              className="text-xs px-2 py-1 rounded-full bg-muted text-muted-foreground"
                            >
                              {test}
                            </span>
                          ))}
                        </div>
                      </div>
                      <div className={`w-6 h-6 rounded-full border-2 flex items-center justify-center ${isSelected ? "border-primary bg-primary" : "border-muted-foreground"
                        }`}>
                        {isSelected && <CheckCircle2 className="h-4 w-4 text-primary-foreground" />}
                      </div>
                    </div>
                  </button>
                )
              })}
            </div>

            {error && (
              <p className="text-destructive text-sm mt-4 text-center">{error}</p>
            )}

            <div className="flex gap-4 mt-8">
              <Button
                variant="outline"
                onClick={() => setStep("info")}
                className="flex-1"
                size="lg"
              >
                Back
              </Button>
              <Button
                onClick={handleStartAssessment}
                disabled={!formData.problemType || isSubmitting}
                className="flex-1"
                size="lg"
              >
                {isSubmitting ? (
                  <>
                    <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                    Starting...
                  </>
                ) : (
                  <>
                    Start Assessment
                    <ArrowRight className="ml-2 h-5 w-5" />
                  </>
                )}
              </Button>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
