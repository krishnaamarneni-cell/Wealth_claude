"use client"

import React, { useState, useEffect, useCallback, Suspense } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import { 
  ChevronLeft, 
  ChevronRight, 
  Clock, 
  CheckCircle2,
  Circle,
  Loader2,
  AlertCircle
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Progress } from "@/components/ui/progress"
import { 
  allTests, 
  getTestsForProblem, 
  type Test, 
  type Question 
} from "@/lib/assessment/all-tests"

interface SessionData {
  id: string
  full_name: string
  problem_type: string
  assigned_tests: string[]
}

export default function AssessmentTestPage() {
  return (
    <Suspense fallback={<TestLoadingFallback />}>
      <AssessmentTestContent />
    </Suspense>
  )
}

function TestLoadingFallback() {
  return (
    <div className="min-h-screen bg-background flex items-center justify-center">
      <div className="text-center">
        <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4 text-primary" />
        <p className="text-muted-foreground">Loading test...</p>
      </div>
    </div>
  )
}

function AssessmentTestContent() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const sessionId = searchParams.get("session")

  // State
  const [session, setSession] = useState<SessionData | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState("")
  const [tests, setTests] = useState<Test[]>([])
  
  const [currentTestIndex, setCurrentTestIndex] = useState(0)
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0)
  const [answers, setAnswers] = useState<Record<string, string | number>>({})
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [isSaving, setIsSaving] = useState(false)

  // Load session data
  useEffect(() => {
    if (!sessionId) {
      router.push("/assessment/start")
      return
    }

    const loadSession = async () => {
      try {
        const response = await fetch(`/api/assessment/session?id=${sessionId}`)
        if (!response.ok) {
          throw new Error("Session not found")
        }
        const data = await response.json()
        setSession(data)
        
        // Get tests for this problem type
        const assignedTests = getTestsForProblem(data.problem_type)
        setTests(assignedTests)
        
        // Load any existing answers
        if (data.responses) {
          const existingAnswers: Record<string, string | number> = {}
          data.responses.forEach((r: { question_id: string; answer_value: string }) => {
            existingAnswers[r.question_id] = r.answer_value
          })
          setAnswers(existingAnswers)
        }
      } catch (err) {
        console.error("Error loading session:", err)
        setError("Could not load your session. Please start again.")
      } finally {
        setLoading(false)
      }
    }

    loadSession()
  }, [sessionId, router])

  // Current test and question
  const currentTest = tests[currentTestIndex]
  const currentQuestion = currentTest?.questions[currentQuestionIndex]
  
  // Progress calculations
  const totalQuestions = tests.reduce((sum, t) => sum + t.questions.length, 0)
  const answeredQuestions = Object.keys(answers).length
  const progressPercent = totalQuestions > 0 ? (answeredQuestions / totalQuestions) * 100 : 0

  // Save answer to database
  const saveAnswer = useCallback(async (questionId: string, value: string | number, score?: number) => {
    if (!sessionId) return
    
    setIsSaving(true)
    try {
      await fetch("/api/assessment/submit", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          sessionId,
          testId: currentTest.id,
          questionId,
          answerValue: String(value),
          answerScore: score
        })
      })
    } catch (err) {
      console.error("Error saving answer:", err)
    } finally {
      setIsSaving(false)
    }
  }, [sessionId, currentTest?.id])

  // Handle answer selection
  const handleAnswer = (value: string | number) => {
    const question = currentQuestion
    if (!question) return

    // Find score for this answer
    let score: number | undefined
    if (question.type === "single" && question.options) {
      const option = question.options.find(o => o.value === value)
      score = option?.score
    } else if (question.type === "scale") {
      score = value as number
    }

    setAnswers(prev => ({ ...prev, [question.id]: value }))
    saveAnswer(question.id, value, score)
  }

  // Navigate to next question
  const handleNext = () => {
    if (!currentTest) return

    if (currentQuestionIndex < currentTest.questions.length - 1) {
      setCurrentQuestionIndex(prev => prev + 1)
    } else if (currentTestIndex < tests.length - 1) {
      // Move to next test
      setCurrentTestIndex(prev => prev + 1)
      setCurrentQuestionIndex(0)
    } else {
      // All tests complete - go to goals page
      handleComplete()
    }
  }

  // Navigate to previous question
  const handlePrevious = () => {
    if (currentQuestionIndex > 0) {
      setCurrentQuestionIndex(prev => prev - 1)
    } else if (currentTestIndex > 0) {
      setCurrentTestIndex(prev => prev - 1)
      setCurrentQuestionIndex(tests[currentTestIndex - 1].questions.length - 1)
    }
  }

  // Complete all tests
  const handleComplete = async () => {
    setIsSubmitting(true)
    try {
      // Update session status
      await fetch("/api/assessment/session", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          sessionId,
          status: "tests_complete",
          completedTests: tests.map(t => t.id)
        })
      })
      
      // Redirect to goals page
      router.push(`/assessment/goals?session=${sessionId}`)
    } catch (err) {
      console.error("Error completing tests:", err)
      setError("Failed to save your progress. Please try again.")
    } finally {
      setIsSubmitting(false)
    }
  }

  // Navigation state
  const isFirstQuestion = currentTestIndex === 0 && currentQuestionIndex === 0
  const isLastQuestion = currentTestIndex === tests.length - 1 && 
    currentQuestionIndex === (currentTest?.questions.length || 0) - 1
  const hasCurrentAnswer = currentQuestion && answers[currentQuestion.id] !== undefined

  // Loading state
  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4 text-primary" />
          <p className="text-muted-foreground">Loading your assessment...</p>
        </div>
      </div>
    )
  }

  // Error state
  if (error) {
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

  if (!currentTest || !currentQuestion) {
    return null
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <div className="border-b border-border sticky top-0 bg-background z-10">
        <div className="max-w-4xl mx-auto px-6 py-4">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-lg bg-primary flex items-center justify-center">
                <span className="text-primary-foreground font-bold text-sm">W</span>
              </div>
              <div>
                <div className="text-sm text-muted-foreground">Welcome, {session?.full_name}</div>
              </div>
            </div>
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <Clock className="h-4 w-4" />
              <span>{isSaving ? "Saving..." : "Auto-saved"}</span>
            </div>
          </div>
          
          {/* Progress */}
          <div className="space-y-2">
            <div className="flex justify-between text-sm">
              <span className="text-foreground font-medium">{currentTest.name}</span>
              <span className="text-muted-foreground">{answeredQuestions} of {totalQuestions} questions</span>
            </div>
            <Progress value={progressPercent} className="h-2" />
          </div>
        </div>
      </div>

      {/* Test Navigation Pills */}
      <div className="border-b border-border">
        <div className="max-w-4xl mx-auto px-6 py-3">
          <div className="flex gap-2 overflow-x-auto pb-1">
            {tests.map((test, index) => {
              const testAnswered = test.questions.filter(q => answers[q.id] !== undefined).length
              const isComplete = testAnswered === test.questions.length
              const isCurrent = index === currentTestIndex
              
              return (
                <button
                  key={test.id}
                  onClick={() => {
                    setCurrentTestIndex(index)
                    setCurrentQuestionIndex(0)
                  }}
                  className={`flex items-center gap-2 px-4 py-2 rounded-full text-sm whitespace-nowrap transition-colors border ${
                    isCurrent 
                      ? "bg-primary text-primary-foreground border-primary" 
                      : isComplete 
                        ? "bg-primary/10 text-primary border-primary/30" 
                        : "bg-card text-muted-foreground border-border hover:border-primary/50"
                  }`}
                >
                  {isComplete ? <CheckCircle2 className="h-4 w-4" /> : <Circle className="h-4 w-4" />}
                  {test.name}
                </button>
              )
            })}
          </div>
        </div>
      </div>

      {/* Question Content */}
      <div className="max-w-4xl mx-auto px-6 py-8">
        <div className="rounded-xl border border-border bg-card p-6 md:p-8">
          {/* Question Number */}
          <div className="text-sm text-muted-foreground mb-2">
            Question {currentQuestionIndex + 1} of {currentTest.questions.length}
          </div>
          
          {/* Question Text */}
          <h2 className="text-xl md:text-2xl font-semibold text-foreground mb-8">
            {currentQuestion.text}
          </h2>

          {/* Answer Options */}
          <div className="space-y-3">
            {currentQuestion.type === "single" && currentQuestion.options?.map((option) => (
              <button
                key={option.value}
                onClick={() => handleAnswer(option.value)}
                className={`w-full p-4 rounded-xl border text-left transition-all ${
                  answers[currentQuestion.id] === option.value
                    ? "border-primary bg-primary/10"
                    : "border-border bg-background hover:border-primary/50"
                }`}
              >
                <div className="flex items-center gap-3">
                  <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center flex-shrink-0 ${
                    answers[currentQuestion.id] === option.value
                      ? "border-primary bg-primary"
                      : "border-muted-foreground"
                  }`}>
                    {answers[currentQuestion.id] === option.value && (
                      <div className="w-2 h-2 rounded-full bg-primary-foreground" />
                    )}
                  </div>
                  <span className="text-foreground">{option.label}</span>
                </div>
              </button>
            ))}

            {currentQuestion.type === "scale" && (
              <div className="py-4">
                <div className="flex justify-between gap-2 mb-4">
                  {[1, 2, 3, 4, 5].map((value) => (
                    <button
                      key={value}
                      onClick={() => handleAnswer(value)}
                      className={`flex-1 h-14 rounded-xl border-2 text-lg font-semibold transition-all ${
                        answers[currentQuestion.id] === value
                          ? "border-primary bg-primary text-primary-foreground"
                          : "border-border bg-card hover:border-primary/50 text-foreground"
                      }`}
                    >
                      {value}
                    </button>
                  ))}
                </div>
                <div className="flex justify-between text-sm text-muted-foreground">
                  <span>{currentQuestion.labels?.min}</span>
                  <span>{currentQuestion.labels?.max}</span>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Navigation */}
        <div className="flex justify-between mt-8">
          <Button
            variant="outline"
            onClick={handlePrevious}
            disabled={isFirstQuestion}
          >
            <ChevronLeft className="h-4 w-4 mr-2" />
            Previous
          </Button>
          
          <Button
            onClick={handleNext}
            disabled={!hasCurrentAnswer || isSubmitting}
          >
            {isSubmitting ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Saving...
              </>
            ) : isLastQuestion ? (
              <>
                Continue to Goals
                <ChevronRight className="h-4 w-4 ml-2" />
              </>
            ) : (
              <>
                Next
                <ChevronRight className="h-4 w-4 ml-2" />
              </>
            )}
          </Button>
        </div>
      </div>
    </div>
  )
}
