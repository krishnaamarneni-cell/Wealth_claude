"use client"

import React, { useState } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import { 
  ChevronLeft, 
  ChevronRight, 
  Clock, 
  CheckCircle2,
  Circle,
  Loader2,
  Sparkles
} from "lucide-react"
import { Button } from "@/components/ui/button"

// Types
interface Question {
  id: string
  text: string
  type: "single" | "scale"
  options?: { value: string; label: string; score: number }[]
  min?: number
  max?: number
  labels?: { min: string; max: string }
}

interface Test {
  id: string
  name: string
  questions: Question[]
}

// Sample Questions (abbreviated for demo - full 52 questions in real implementation)
const tests: Test[] = [
  {
    id: "test1",
    name: "Financial Personality",
    questions: [
      {
        id: "q1",
        text: "When you receive unexpected money (bonus, gift, tax refund), what's your first instinct?",
        type: "single",
        options: [
          { value: "save_all", label: "Save all of it", score: 5 },
          { value: "save_most", label: "Save most, spend a little", score: 4 },
          { value: "split", label: "Split 50/50 between saving and spending", score: 3 },
          { value: "spend_most", label: "Spend most, save a little", score: 2 },
          { value: "spend_all", label: "Treat myself - I deserve it!", score: 1 }
        ]
      },
      {
        id: "q2",
        text: "How often do you check your bank account or financial apps?",
        type: "single",
        options: [
          { value: "daily", label: "Daily or multiple times a day", score: 5 },
          { value: "weekly", label: "A few times a week", score: 4 },
          { value: "monthly", label: "Once a week or so", score: 3 },
          { value: "rarely", label: "Only when I need to", score: 2 },
          { value: "avoid", label: "I avoid looking - it stresses me out", score: 1 }
        ]
      },
      {
        id: "q3",
        text: "How would you describe your approach to budgeting?",
        type: "single",
        options: [
          { value: "detailed", label: "I track every expense in detail", score: 5 },
          { value: "general", label: "I have a general budget I try to follow", score: 4 },
          { value: "mental", label: "I keep a rough mental note", score: 3 },
          { value: "none", label: "I don't really budget", score: 1 }
        ]
      },
      {
        id: "q4",
        text: "How comfortable are you discussing money with friends or family?",
        type: "scale",
        min: 1,
        max: 5,
        labels: { min: "Very uncomfortable", max: "Very comfortable" }
      },
      {
        id: "q5",
        text: "When making a major purchase, how do you typically decide?",
        type: "single",
        options: [
          { value: "research", label: "Extensive research, price comparison, wait for sales", score: 5 },
          { value: "some_research", label: "Some research, but don't overthink it", score: 4 },
          { value: "impulse", label: "If I want it and can afford it, I buy it", score: 2 },
          { value: "emotional", label: "I often buy on impulse and regret later", score: 1 }
        ]
      }
    ]
  },
  {
    id: "test2",
    name: "Financial Health",
    questions: [
      {
        id: "q6",
        text: "How many months of expenses do you have saved in an emergency fund?",
        type: "single",
        options: [
          { value: "none", label: "No emergency fund", score: 1 },
          { value: "less_1", label: "Less than 1 month", score: 2 },
          { value: "1_3", label: "1-3 months", score: 3 },
          { value: "3_6", label: "3-6 months", score: 4 },
          { value: "more_6", label: "More than 6 months", score: 5 }
        ]
      },
      {
        id: "q7",
        text: "What percentage of your income do you typically save each month?",
        type: "single",
        options: [
          { value: "none", label: "0% - I spend everything", score: 1 },
          { value: "low", label: "1-10%", score: 2 },
          { value: "moderate", label: "11-20%", score: 3 },
          { value: "good", label: "21-30%", score: 4 },
          { value: "excellent", label: "More than 30%", score: 5 }
        ]
      },
      {
        id: "q8",
        text: "How would you describe your current debt situation?",
        type: "single",
        options: [
          { value: "none", label: "No debt at all", score: 5 },
          { value: "low", label: "Only mortgage or student loans", score: 4 },
          { value: "moderate", label: "Some credit card debt, but manageable", score: 3 },
          { value: "high", label: "Significant debt that concerns me", score: 2 },
          { value: "overwhelming", label: "Overwhelming debt", score: 1 }
        ]
      },
      {
        id: "q9",
        text: "Rate your confidence in managing your finances:",
        type: "scale",
        min: 1,
        max: 5,
        labels: { min: "Not confident", max: "Very confident" }
      },
      {
        id: "q10",
        text: "Do you have any investments outside of retirement accounts?",
        type: "single",
        options: [
          { value: "diverse", label: "Yes, diversified portfolio", score: 5 },
          { value: "some", label: "Yes, some stocks or funds", score: 4 },
          { value: "starting", label: "Just getting started", score: 3 },
          { value: "none", label: "No investments yet", score: 2 }
        ]
      }
    ]
  }
]

export default function AssessmentTestPage() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const mode = searchParams.get("mode") || "full"
  
  const [currentTestIndex, setCurrentTestIndex] = useState(0)
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0)
  const [answers, setAnswers] = useState<Record<string, string | number>>({})
  const [isSubmitting, setIsSubmitting] = useState(false)

  const currentTest = tests[currentTestIndex]
  const currentQuestion = currentTest?.questions[currentQuestionIndex]
  
  const totalQuestions = tests.reduce((sum, t) => sum + t.questions.length, 0)
  const answeredQuestions = Object.keys(answers).length
  const progressPercent = (answeredQuestions / totalQuestions) * 100

  const handleAnswer = (value: string | number) => {
    setAnswers(prev => ({ ...prev, [currentQuestion.id]: value }))
  }

  const handleNext = () => {
    if (currentQuestionIndex < currentTest.questions.length - 1) {
      setCurrentQuestionIndex(prev => prev + 1)
    } else if (currentTestIndex < tests.length - 1) {
      setCurrentTestIndex(prev => prev + 1)
      setCurrentQuestionIndex(0)
    } else {
      handleSubmit()
    }
  }

  const handlePrevious = () => {
    if (currentQuestionIndex > 0) {
      setCurrentQuestionIndex(prev => prev - 1)
    } else if (currentTestIndex > 0) {
      setCurrentTestIndex(prev => prev - 1)
      setCurrentQuestionIndex(tests[currentTestIndex - 1].questions.length - 1)
    }
  }

  const handleSubmit = async () => {
    setIsSubmitting(true)
    await new Promise(resolve => setTimeout(resolve, 2000))
    router.push("/admin/assessments?submitted=true")
  }

  const isFirstQuestion = currentTestIndex === 0 && currentQuestionIndex === 0
  const isLastQuestion = currentTestIndex === tests.length - 1 && currentQuestionIndex === currentTest.questions.length - 1
  const hasCurrentAnswer = answers[currentQuestion?.id] !== undefined

  return (
    <div className="p-6">
      {/* Header */}
      <div className="mb-6">
        <div className="flex items-center justify-between mb-4">
          <Button 
            variant="ghost" 
            onClick={() => router.push("/admin/assessments")}
            className="text-zinc-400 hover:text-white hover:bg-zinc-800"
          >
            <ChevronLeft className="h-4 w-4 mr-1" />
            Exit Assessment
          </Button>
          <div className="flex items-center gap-2 text-sm text-zinc-400">
            <Clock className="h-4 w-4" />
            <span>{mode === "quick" ? "~9 min" : "~14 min"}</span>
          </div>
        </div>
        
        {/* Progress Bar */}
        <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-4">
          <div className="flex justify-between text-sm mb-2">
            <span className="text-white font-medium">{currentTest.name}</span>
            <span className="text-zinc-400">{answeredQuestions} of {totalQuestions} questions</span>
          </div>
          <div className="h-2 bg-zinc-800 rounded-full overflow-hidden">
            <div 
              className="h-full bg-emerald-500 rounded-full transition-all duration-300"
              style={{ width: progressPercent + "%" }}
            />
          </div>
        </div>
      </div>

      {/* Test Navigation Pills */}
      <div className="flex gap-2 mb-6 overflow-x-auto pb-2">
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
              className={`flex items-center gap-2 px-4 py-2 rounded-full text-sm whitespace-nowrap transition-colors ${
                isCurrent 
                  ? "bg-emerald-600 text-white" 
                  : isComplete 
                    ? "bg-emerald-500/20 text-emerald-400 border border-emerald-500/30" 
                    : "bg-zinc-800 text-zinc-400 border border-zinc-700 hover:border-zinc-600"
              }`}
            >
              {isComplete ? <CheckCircle2 className="h-4 w-4" /> : <Circle className="h-4 w-4" />}
              {test.name}
            </button>
          )
        })}
      </div>

      {/* Question Card */}
      <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-8 mb-6">
        <div className="text-sm text-zinc-500 mb-2">
          Question {currentQuestionIndex + 1} of {currentTest.questions.length}
        </div>
        
        <h2 className="text-2xl font-semibold text-white mb-8">
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
                  ? "border-emerald-500 bg-emerald-500/10 text-white"
                  : "border-zinc-700 bg-zinc-800/50 hover:border-zinc-600 text-zinc-200"
              }`}
            >
              <div className="flex items-center gap-3">
                <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center ${
                  answers[currentQuestion.id] === option.value
                    ? "border-emerald-500 bg-emerald-500"
                    : "border-zinc-600"
                }`}>
                  {answers[currentQuestion.id] === option.value && (
                    <div className="w-2 h-2 rounded-full bg-white" />
                  )}
                </div>
                <span>{option.label}</span>
              </div>
            </button>
          ))}

          {currentQuestion.type === "scale" && (
            <div className="py-4">
              <div className="flex justify-between mb-4">
                {[1, 2, 3, 4, 5].map((value) => (
                  <button
                    key={value}
                    onClick={() => handleAnswer(value)}
                    className={`w-14 h-14 rounded-xl border-2 text-lg font-semibold transition-all ${
                      answers[currentQuestion.id] === value
                        ? "border-emerald-500 bg-emerald-500 text-white"
                        : "border-zinc-700 bg-zinc-800 hover:border-zinc-600 text-zinc-200"
                    }`}
                  >
                    {value}
                  </button>
                ))}
              </div>
              <div className="flex justify-between text-sm text-zinc-500">
                <span>{currentQuestion.labels?.min}</span>
                <span>{currentQuestion.labels?.max}</span>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Navigation Buttons */}
      <div className="flex justify-between">
        <Button
          variant="outline"
          onClick={handlePrevious}
          disabled={isFirstQuestion}
          className="border-zinc-700 bg-zinc-800 hover:bg-zinc-700 text-white disabled:opacity-50"
        >
          <ChevronLeft className="h-4 w-4 mr-2" />
          Previous
        </Button>
        
        <Button
          onClick={handleNext}
          disabled={!hasCurrentAnswer || isSubmitting}
          className="bg-emerald-600 hover:bg-emerald-700 text-white disabled:opacity-50"
        >
          {isSubmitting ? (
            <>
              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              Analyzing...
            </>
          ) : isLastQuestion ? (
            <>
              <Sparkles className="h-4 w-4 mr-2" />
              Get My Results
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
  )
}
