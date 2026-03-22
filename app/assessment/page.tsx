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
import { Progress } from "@/components/ui/progress"

// =============================================================================
// Types
// =============================================================================

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

// =============================================================================
// All 52 Questions Data
// =============================================================================

const tests: Test[] = [
  {
    id: "test1",
    name: "Financial Personality",
    questions: [
      {
        id: "fp1",
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
        id: "fp2",
        text: "How often do you check your bank account or financial apps?",
        type: "single",
        options: [
          { value: "daily", label: "Daily or multiple times a day", score: 5 },
          { value: "weekly", label: "A few times a week", score: 4 },
          { value: "biweekly", label: "Once a week or so", score: 3 },
          { value: "rarely", label: "Only when I need to", score: 2 },
          { value: "avoid", label: "I avoid looking - it stresses me out", score: 1 }
        ]
      },
      {
        id: "fp3",
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
        id: "fp4",
        text: "When making a major purchase, how do you typically decide?",
        type: "single",
        options: [
          { value: "research", label: "Extensive research, price comparison, wait for sales", score: 5 },
          { value: "some_research", label: "Some research, but don't overthink it", score: 4 },
          { value: "impulse", label: "If I want it and can afford it, I buy it", score: 2 },
          { value: "emotional", label: "I often buy on impulse and regret later", score: 1 }
        ]
      },
      {
        id: "fp5",
        text: "How comfortable are you discussing money with friends or family?",
        type: "scale",
        min: 1,
        max: 5,
        labels: { min: "Very uncomfortable", max: "Very comfortable" }
      },
      {
        id: "fp6",
        text: "When you see something you want but don't need, what do you typically do?",
        type: "single",
        options: [
          { value: "never_buy", label: "Walk away - I only buy what I need", score: 5 },
          { value: "wait", label: "Wait a few days to see if I still want it", score: 4 },
          { value: "consider", label: "Consider if it fits my budget", score: 3 },
          { value: "buy", label: "Buy it if I can afford it", score: 2 },
          { value: "buy_anyway", label: "Buy it even if I shouldn't", score: 1 }
        ]
      },
      {
        id: "fp7",
        text: "How do you feel when you think about your financial future?",
        type: "single",
        options: [
          { value: "confident", label: "Confident and excited", score: 5 },
          { value: "optimistic", label: "Cautiously optimistic", score: 4 },
          { value: "neutral", label: "Neutral - I don't think about it much", score: 3 },
          { value: "worried", label: "Somewhat worried", score: 2 },
          { value: "anxious", label: "Anxious or stressed", score: 1 }
        ]
      },
      {
        id: "fp8",
        text: "How often do you set financial goals?",
        type: "single",
        options: [
          { value: "always", label: "I always have clear financial goals", score: 5 },
          { value: "sometimes", label: "I set goals occasionally", score: 4 },
          { value: "rarely", label: "Rarely - I go with the flow", score: 2 },
          { value: "never", label: "I've never set financial goals", score: 1 }
        ]
      },
      {
        id: "fp9",
        text: "Rate your financial discipline:",
        type: "scale",
        min: 1,
        max: 5,
        labels: { min: "Not disciplined", max: "Very disciplined" }
      },
      {
        id: "fp10",
        text: "When friends suggest expensive activities, what do you typically do?",
        type: "single",
        options: [
          { value: "decline", label: "Suggest a cheaper alternative", score: 5 },
          { value: "consider", label: "Go if it fits my budget", score: 4 },
          { value: "sometimes", label: "Sometimes say yes even if I shouldn't", score: 2 },
          { value: "always", label: "Always say yes - FOMO is real", score: 1 }
        ]
      },
      {
        id: "fp11",
        text: "How do you handle bills and recurring payments?",
        type: "single",
        options: [
          { value: "auto", label: "Everything is automated and organized", score: 5 },
          { value: "manual", label: "I pay manually but always on time", score: 4 },
          { value: "sometimes_late", label: "Sometimes I forget and pay late", score: 2 },
          { value: "often_late", label: "I often miss payments", score: 1 }
        ]
      },
      {
        id: "fp12",
        text: "What's your relationship with credit cards?",
        type: "single",
        options: [
          { value: "full", label: "Pay in full every month", score: 5 },
          { value: "mostly", label: "Usually pay in full", score: 4 },
          { value: "minimum", label: "Pay minimum or a bit more", score: 2 },
          { value: "maxed", label: "Cards are often maxed out", score: 1 }
        ]
      },
      {
        id: "fp13",
        text: "How do you approach sales and discounts?",
        type: "single",
        options: [
          { value: "planned", label: "Only buy if I already planned to", score: 5 },
          { value: "research", label: "Research to see if it's a real deal", score: 4 },
          { value: "tempted", label: "Often buy things I didn't plan to", score: 2 },
          { value: "cant_resist", label: "Can't resist a good sale", score: 1 }
        ]
      },
      {
        id: "fp14",
        text: "How often do you compare prices before buying?",
        type: "scale",
        min: 1,
        max: 5,
        labels: { min: "Never", max: "Always" }
      },
      {
        id: "fp15",
        text: "How would you describe your spending habits overall?",
        type: "single",
        options: [
          { value: "frugal", label: "Very frugal - I save wherever possible", score: 5 },
          { value: "balanced", label: "Balanced - I spend mindfully", score: 4 },
          { value: "moderate", label: "Moderate - could be better", score: 3 },
          { value: "spender", label: "I tend to spend freely", score: 2 },
          { value: "overspender", label: "I often overspend", score: 1 }
        ]
      }
    ]
  },
  {
    id: "test2",
    name: "Financial Health",
    questions: [
      {
        id: "fh1",
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
        id: "fh2",
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
        id: "fh3",
        text: "How would you describe your current debt situation?",
        type: "single",
        options: [
          { value: "none", label: "No debt at all", score: 5 },
          { value: "mortgage", label: "Only mortgage or student loans", score: 4 },
          { value: "manageable", label: "Some credit card debt, but manageable", score: 3 },
          { value: "concerning", label: "Significant debt that concerns me", score: 2 },
          { value: "overwhelming", label: "Overwhelming debt", score: 1 }
        ]
      },
      {
        id: "fh4",
        text: "Do you have any investments outside of retirement accounts?",
        type: "single",
        options: [
          { value: "diverse", label: "Yes, diversified portfolio", score: 5 },
          { value: "some", label: "Yes, some stocks or funds", score: 4 },
          { value: "starting", label: "Just getting started", score: 3 },
          { value: "none_want", label: "No, but I want to start", score: 2 },
          { value: "none", label: "No investments", score: 1 }
        ]
      },
      {
        id: "fh5",
        text: "Rate your confidence in managing your finances:",
        type: "scale",
        min: 1,
        max: 5,
        labels: { min: "Not confident", max: "Very confident" }
      },
      {
        id: "fh6",
        text: "Do you have adequate insurance coverage (health, life, etc.)?",
        type: "single",
        options: [
          { value: "comprehensive", label: "Yes, comprehensive coverage", score: 5 },
          { value: "basic", label: "Basic coverage", score: 3 },
          { value: "minimal", label: "Minimal coverage", score: 2 },
          { value: "none", label: "No insurance", score: 1 }
        ]
      },
      {
        id: "fh7",
        text: "How is your retirement savings progress?",
        type: "single",
        options: [
          { value: "ahead", label: "On track or ahead", score: 5 },
          { value: "contributing", label: "Contributing regularly", score: 4 },
          { value: "some", label: "Some savings, not consistent", score: 3 },
          { value: "behind", label: "Behind where I should be", score: 2 },
          { value: "none", label: "No retirement savings", score: 1 }
        ]
      },
      {
        id: "fh8",
        text: "How often do you review your financial situation?",
        type: "single",
        options: [
          { value: "weekly", label: "Weekly", score: 5 },
          { value: "monthly", label: "Monthly", score: 4 },
          { value: "quarterly", label: "Quarterly", score: 3 },
          { value: "yearly", label: "Yearly", score: 2 },
          { value: "never", label: "Rarely or never", score: 1 }
        ]
      },
      {
        id: "fh9",
        text: "What's your credit score range?",
        type: "single",
        options: [
          { value: "excellent", label: "Excellent (750+)", score: 5 },
          { value: "good", label: "Good (700-749)", score: 4 },
          { value: "fair", label: "Fair (650-699)", score: 3 },
          { value: "poor", label: "Poor (below 650)", score: 2 },
          { value: "unknown", label: "I don't know", score: 1 }
        ]
      },
      {
        id: "fh10",
        text: "Rate your overall financial health:",
        type: "scale",
        min: 1,
        max: 5,
        labels: { min: "Poor", max: "Excellent" }
      },
      {
        id: "fh11",
        text: "Do you have a will or estate plan?",
        type: "single",
        options: [
          { value: "complete", label: "Yes, complete and updated", score: 5 },
          { value: "basic", label: "Basic will only", score: 3 },
          { value: "planning", label: "Planning to create one", score: 2 },
          { value: "none", label: "No estate planning", score: 1 }
        ]
      },
      {
        id: "fh12",
        text: "How do you handle unexpected expenses?",
        type: "single",
        options: [
          { value: "emergency", label: "Use emergency fund", score: 5 },
          { value: "savings", label: "Dip into other savings", score: 4 },
          { value: "credit", label: "Use credit card", score: 2 },
          { value: "borrow", label: "Borrow from family/friends", score: 1 },
          { value: "struggle", label: "Really struggle", score: 1 }
        ]
      },
      {
        id: "fh13",
        text: "Do you have income from multiple sources?",
        type: "single",
        options: [
          { value: "multiple", label: "Yes, diversified income", score: 5 },
          { value: "side", label: "Main job + side income", score: 4 },
          { value: "single", label: "Single income source", score: 3 },
          { value: "unstable", label: "Unstable income", score: 1 }
        ]
      },
      {
        id: "fh14",
        text: "How prepared are you for a major financial emergency?",
        type: "scale",
        min: 1,
        max: 5,
        labels: { min: "Not prepared", max: "Very prepared" }
      },
      {
        id: "fh15",
        text: "Do you track your net worth?",
        type: "single",
        options: [
          { value: "monthly", label: "Yes, monthly", score: 5 },
          { value: "quarterly", label: "Yes, quarterly", score: 4 },
          { value: "yearly", label: "Yes, yearly", score: 3 },
          { value: "no", label: "No, I don't track it", score: 1 }
        ]
      }
    ]
  },
  {
    id: "test3",
    name: "Investment Profile",
    questions: [
      {
        id: "ip1",
        text: "How would you react if your investments dropped 20% in a month?",
        type: "single",
        options: [
          { value: "buy_more", label: "Buy more - great opportunity", score: 5 },
          { value: "hold", label: "Hold steady - stay the course", score: 4 },
          { value: "worried", label: "Feel worried but wait", score: 3 },
          { value: "sell_some", label: "Sell some to reduce risk", score: 2 },
          { value: "sell_all", label: "Sell everything", score: 1 }
        ]
      },
      {
        id: "ip2",
        text: "What's your investment time horizon?",
        type: "single",
        options: [
          { value: "long", label: "20+ years", score: 5 },
          { value: "medium_long", label: "10-20 years", score: 4 },
          { value: "medium", label: "5-10 years", score: 3 },
          { value: "short", label: "1-5 years", score: 2 },
          { value: "very_short", label: "Less than 1 year", score: 1 }
        ]
      },
      {
        id: "ip3",
        text: "How knowledgeable are you about investing?",
        type: "scale",
        min: 1,
        max: 5,
        labels: { min: "Beginner", max: "Expert" }
      },
      {
        id: "ip4",
        text: "Which best describes your investment strategy?",
        type: "single",
        options: [
          { value: "aggressive", label: "Aggressive growth - high risk, high reward", score: 5 },
          { value: "growth", label: "Growth focused - some risk acceptable", score: 4 },
          { value: "balanced", label: "Balanced - mix of growth and stability", score: 3 },
          { value: "conservative", label: "Conservative - preserve capital", score: 2 },
          { value: "very_conservative", label: "Very conservative - minimal risk", score: 1 }
        ]
      },
      {
        id: "ip5",
        text: "Do you understand asset allocation and diversification?",
        type: "single",
        options: [
          { value: "expert", label: "Yes, I actively manage my allocation", score: 5 },
          { value: "understand", label: "Yes, I understand the concepts", score: 4 },
          { value: "basic", label: "Basic understanding", score: 3 },
          { value: "limited", label: "Limited understanding", score: 2 },
          { value: "no", label: "No, not really", score: 1 }
        ]
      },
      {
        id: "ip6",
        text: "Have you invested during a market downturn before?",
        type: "single",
        options: [
          { value: "yes_bought", label: "Yes, I bought more", score: 5 },
          { value: "yes_held", label: "Yes, I held steady", score: 4 },
          { value: "yes_sold", label: "Yes, I sold some", score: 2 },
          { value: "no_experience", label: "No experience yet", score: 3 }
        ]
      },
      {
        id: "ip7",
        text: "How comfortable are you with investment volatility?",
        type: "scale",
        min: 1,
        max: 5,
        labels: { min: "Very uncomfortable", max: "Very comfortable" }
      },
      {
        id: "ip8",
        text: "What types of investments do you hold?",
        type: "single",
        options: [
          { value: "diverse", label: "Stocks, bonds, real estate, alternatives", score: 5 },
          { value: "stocks_bonds", label: "Stocks and bonds", score: 4 },
          { value: "stocks_only", label: "Mostly stocks/ETFs", score: 3 },
          { value: "savings", label: "Mostly savings accounts", score: 2 },
          { value: "none", label: "No investments", score: 1 }
        ]
      },
      {
        id: "ip9",
        text: "Do you reinvest dividends and returns?",
        type: "single",
        options: [
          { value: "always", label: "Always reinvest", score: 5 },
          { value: "mostly", label: "Mostly reinvest", score: 4 },
          { value: "sometimes", label: "Sometimes", score: 3 },
          { value: "no", label: "No, I take the cash", score: 2 }
        ]
      },
      {
        id: "ip10",
        text: "How often do you review your investment portfolio?",
        type: "single",
        options: [
          { value: "weekly", label: "Weekly or more", score: 4 },
          { value: "monthly", label: "Monthly", score: 5 },
          { value: "quarterly", label: "Quarterly", score: 4 },
          { value: "yearly", label: "Yearly", score: 3 },
          { value: "never", label: "Rarely or never", score: 1 }
        ]
      },
      {
        id: "ip11",
        text: "Do you have a written investment plan?",
        type: "single",
        options: [
          { value: "detailed", label: "Yes, detailed plan", score: 5 },
          { value: "basic", label: "Yes, basic plan", score: 4 },
          { value: "mental", label: "Mental plan only", score: 3 },
          { value: "no", label: "No plan", score: 1 }
        ]
      },
      {
        id: "ip12",
        text: "Rate your overall investment readiness:",
        type: "scale",
        min: 1,
        max: 5,
        labels: { min: "Not ready", max: "Very ready" }
      }
    ]
  },
  {
    id: "test4",
    name: "Money Mindset",
    questions: [
      {
        id: "mm1",
        text: "How do you feel about money in general?",
        type: "single",
        options: [
          { value: "positive", label: "Money is a tool for freedom", score: 5 },
          { value: "neutral", label: "Money is necessary", score: 3 },
          { value: "complicated", label: "I have mixed feelings", score: 2 },
          { value: "negative", label: "Money causes stress", score: 1 }
        ]
      },
      {
        id: "mm2",
        text: "Do you believe you can build significant wealth?",
        type: "single",
        options: [
          { value: "definitely", label: "Definitely - I'm on my way", score: 5 },
          { value: "probably", label: "Probably with the right strategy", score: 4 },
          { value: "maybe", label: "Maybe, but it's hard", score: 3 },
          { value: "unlikely", label: "Unlikely for someone like me", score: 2 },
          { value: "no", label: "No, wealth isn't for me", score: 1 }
        ]
      },
      {
        id: "mm3",
        text: "How did your family talk about money growing up?",
        type: "single",
        options: [
          { value: "open", label: "Openly and positively", score: 5 },
          { value: "practical", label: "Practically when needed", score: 4 },
          { value: "avoided", label: "Topic was avoided", score: 2 },
          { value: "negative", label: "With stress or negativity", score: 1 }
        ]
      },
      {
        id: "mm4",
        text: "Do you feel you deserve financial success?",
        type: "scale",
        min: 1,
        max: 5,
        labels: { min: "Not really", max: "Absolutely" }
      },
      {
        id: "mm5",
        text: "How do you handle financial setbacks?",
        type: "single",
        options: [
          { value: "learn", label: "Learn and move forward", score: 5 },
          { value: "adapt", label: "Adapt and try again", score: 4 },
          { value: "struggle", label: "Struggle but recover", score: 3 },
          { value: "defeated", label: "Feel defeated", score: 1 }
        ]
      },
      {
        id: "mm6",
        text: "Do you compare your finances to others?",
        type: "single",
        options: [
          { value: "never", label: "Never - I focus on my own journey", score: 5 },
          { value: "rarely", label: "Rarely", score: 4 },
          { value: "sometimes", label: "Sometimes", score: 3 },
          { value: "often", label: "Often, and it affects me", score: 1 }
        ]
      },
      {
        id: "mm7",
        text: "How important is financial independence to you?",
        type: "scale",
        min: 1,
        max: 5,
        labels: { min: "Not important", max: "Top priority" }
      },
      {
        id: "mm8",
        text: "Do you believe your income can grow significantly?",
        type: "single",
        options: [
          { value: "definitely", label: "Yes, I'm actively working on it", score: 5 },
          { value: "probably", label: "Yes, with effort", score: 4 },
          { value: "maybe", label: "Maybe, depends on circumstances", score: 3 },
          { value: "limited", label: "Limited by my situation", score: 2 },
          { value: "no", label: "No, it's mostly fixed", score: 1 }
        ]
      },
      {
        id: "mm9",
        text: "How do you feel about asking for a raise or negotiating salary?",
        type: "single",
        options: [
          { value: "confident", label: "Confident - I know my worth", score: 5 },
          { value: "comfortable", label: "Comfortable doing it", score: 4 },
          { value: "nervous", label: "Nervous but I do it", score: 3 },
          { value: "avoid", label: "I tend to avoid it", score: 2 },
          { value: "never", label: "I've never done it", score: 1 }
        ]
      },
      {
        id: "mm10",
        text: "Rate your overall money mindset:",
        type: "scale",
        min: 1,
        max: 5,
        labels: { min: "Scarcity mindset", max: "Abundance mindset" }
      }
    ]
  }
]

// =============================================================================
// Main Component
// =============================================================================

export default function AssessmentTestPage() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const mode = searchParams.get("mode") || "full"

  const [currentTestIndex, setCurrentTestIndex] = useState(0)
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0)
  const [answers, setAnswers] = useState<Record<string, string | number>>({})
  const [isSubmitting, setIsSubmitting] = useState(false)

  // Get active tests based on mode
  const activeTests = mode === "quick" ? tests.slice(0, 2) : tests
  const currentTest = activeTests[currentTestIndex]
  const currentQuestion = currentTest?.questions[currentQuestionIndex]

  const totalQuestions = activeTests.reduce((sum, t) => sum + t.questions.length, 0)
  const answeredQuestions = Object.keys(answers).length
  const progressPercent = (answeredQuestions / totalQuestions) * 100

  const handleAnswer = (value: string | number) => {
    setAnswers(prev => ({ ...prev, [currentQuestion.id]: value }))
  }

  const handleNext = () => {
    if (currentQuestionIndex < currentTest.questions.length - 1) {
      setCurrentQuestionIndex(prev => prev + 1)
    } else if (currentTestIndex < activeTests.length - 1) {
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
      setCurrentQuestionIndex(activeTests[currentTestIndex - 1].questions.length - 1)
    }
  }

  const handleSubmit = async () => {
    setIsSubmitting(true)
    // Simulate API call - in real implementation, call /api/assessment/submit
    await new Promise(resolve => setTimeout(resolve, 2000))
    router.push("/admin/assessments?submitted=true")
  }

  const isFirstQuestion = currentTestIndex === 0 && currentQuestionIndex === 0
  const isLastQuestion = currentTestIndex === activeTests.length - 1 && currentQuestionIndex === currentTest.questions.length - 1
  const hasCurrentAnswer = answers[currentQuestion?.id] !== undefined

  return (
    <div className="p-6">
      <div className="max-w-4xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <Button
            variant="ghost"
            onClick={() => router.push("/admin/assessments")}
          >
            <ChevronLeft className="h-4 w-4 mr-1" />
            Exit Assessment
          </Button>
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <Clock className="h-4 w-4" />
            <span>{mode === "quick" ? "~9 min" : "~14 min"}</span>
          </div>
        </div>

        {/* Progress Card */}
        <div className="rounded-xl border border-border bg-card p-4">
          <div className="flex justify-between text-sm mb-2">
            <span className="font-medium text-foreground">{currentTest.name}</span>
            <span className="text-muted-foreground">{answeredQuestions} of {totalQuestions} questions</span>
          </div>
          <Progress value={progressPercent} className="h-2" />
        </div>

        {/* Test Navigation Pills */}
        <div className="flex gap-2 overflow-x-auto pb-2">
          {activeTests.map((test, index) => {
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
                className={`flex items-center gap-2 px-4 py-2 rounded-full text-sm whitespace-nowrap transition-colors border ${isCurrent
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

        {/* Question Card */}
        <div className="rounded-xl border border-border bg-card p-6">
          <div className="text-sm text-muted-foreground mb-2">
            Question {currentQuestionIndex + 1} of {currentTest.questions.length}
          </div>

          <h2 className="text-xl font-semibold text-foreground mb-6">
            {currentQuestion.text}
          </h2>

          {/* Answer Options */}
          <div className="space-y-3">
            {currentQuestion.type === "single" && currentQuestion.options?.map((option) => (
              <button
                key={option.value}
                onClick={() => handleAnswer(option.value)}
                className={`w-full p-4 rounded-xl border text-left transition-all ${answers[currentQuestion.id] === option.value
                    ? "border-primary bg-primary/10"
                    : "border-border bg-background hover:border-primary/50"
                  }`}
              >
                <div className="flex items-center gap-3">
                  <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center ${answers[currentQuestion.id] === option.value
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
                      className={`flex-1 h-14 rounded-xl border-2 text-lg font-semibold transition-all ${answers[currentQuestion.id] === value
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

        {/* Navigation Buttons */}
        <div className="flex justify-between">
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
    </div>
  )
}
