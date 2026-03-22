"use client"

import React, { useState, useEffect } from "react"
import { useSearchParams } from "next/navigation"
import {
  ClipboardList,
  Users,
  Eye,
  Mail,
  Phone,
  Calendar,
  Target,
  Clock,
  Brain,
  TrendingUp,
  TrendingDown,
  FileText,
  Send,
  Loader2,
  CheckCircle2,
  AlertCircle,
  ChevronRight,
  X,
  Sparkles,
  Download,
  RefreshCw,
  Search,
  Filter,
  BarChart3,
  Info
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"

interface Assessment {
  id: string
  full_name: string
  email: string
  phone: string | null
  problem_type: string
  status: string
  primary_goal: string | null
  timeline: string | null
  additional_notes: string | null
  is_viewed: boolean
  is_contacted: boolean
  created_at: string
  completed_at: string | null
  overall_score?: number
  personality_type?: string
}

interface AssessmentResult {
  overall_score: number
  personality_type: string
  factor_scores: Array<{ factorId: string; score: number; status: string }>
  test_scores: Record<string, number>
  strengths: string[]
  weaknesses: string[]
}

interface FinancialPlan {
  id: string
  plan_type: string
  executive_summary: string
  goals: Array<{ goal: string; target: string; timeline: string; type: string }>
  action_items: Array<{ action: string; category: string }>
  ai_recommendations: string
  ai_warnings: string
  pdf_url: string | null
  pdf_shared_at: string | null
}

// Industry benchmark data (based on financial wellness surveys)
const industryBenchmarks: Record<string, { average: number; top25: number; description: string }> = {
  savings_discipline: { average: 52, top25: 78, description: "Regular savings habits and automation" },
  debt_management: { average: 48, top25: 72, description: "Debt-to-income ratio and payoff strategy" },
  financial_planning: { average: 45, top25: 75, description: "Goal setting and financial roadmap" },
  spending_control: { average: 50, top25: 74, description: "Budget adherence and impulse control" },
  investment_readiness: { average: 42, top25: 70, description: "Investment knowledge and portfolio diversity" },
  risk_tolerance: { average: 55, top25: 68, description: "Comfort with market volatility" },
  financial_literacy: { average: 47, top25: 76, description: "Understanding of financial concepts" },
  emergency_preparedness: { average: 40, top25: 72, description: "Emergency fund coverage (3-6 months)" },
  future_orientation: { average: 53, top25: 80, description: "Retirement and long-term planning" },
  money_wellness: { average: 48, top25: 75, description: "Financial stress and confidence levels" }
}

const problemLabels: Record<string, string> = {
  debt: "Debt Management",
  investments: "Investment Growth",
  retirement: "Retirement Planning",
  budgeting: "Budget & Cash Flow",
  complete_checkup: "Complete Checkup"
}

const statusLabels: Record<string, { label: string; color: string }> = {
  intake_complete: { label: "Started", color: "bg-muted text-muted-foreground" },
  tests_in_progress: { label: "In Progress", color: "bg-yellow-500/20 text-yellow-600" },
  tests_complete: { label: "Tests Done", color: "bg-blue-500/20 text-blue-600" },
  goals_complete: { label: "Completed", color: "bg-primary/20 text-primary" },
  plan_generated: { label: "Plan Ready", color: "bg-purple-500/20 text-purple-600" },
  plan_shared: { label: "Plan Shared", color: "bg-green-500/20 text-green-600" }
}

const personalityLabels: Record<string, string> = {
  cautious_saver: "Cautious Saver",
  balanced_planner: "Balanced Planner",
  growth_investor: "Growth Investor",
  spontaneous_spender: "Spontaneous Spender",
  risk_taker: "Risk Taker",
  money_avoider: "Money Avoider",
  security_seeker: "Security Seeker"
}

export default function AdminAssessmentsPage() {
  const searchParams = useSearchParams()
  const viewId = searchParams.get("view")

  const [activeTab, setActiveTab] = useState<"take" | "results">(viewId ? "results" : "take")
  const [assessments, setAssessments] = useState<Assessment[]>([])
  const [loading, setLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState("")
  const [statusFilter, setStatusFilter] = useState("all")

  // Detail view state
  const [selectedAssessment, setSelectedAssessment] = useState<Assessment | null>(null)
  const [assessmentResult, setAssessmentResult] = useState<AssessmentResult | null>(null)
  const [financialPlan, setFinancialPlan] = useState<FinancialPlan | null>(null)
  const [loadingDetails, setLoadingDetails] = useState(false)
  const [showBenchmarks, setShowBenchmarks] = useState(true)

  // Action states
  const [generatingPlan, setGeneratingPlan] = useState(false)
  const [selectedPlanType, setSelectedPlanType] = useState<string>("moderate")
  const [generatingPdf, setGeneratingPdf] = useState(false)
  const [sendingEmail, setSendingEmail] = useState(false)
  const [actionError, setActionError] = useState("")
  const [actionSuccess, setActionSuccess] = useState("")

  // Load assessments
  useEffect(() => {
    loadAssessments()
  }, [])

  // Auto-open if view param present
  useEffect(() => {
    if (viewId && assessments.length > 0) {
      const assessment = assessments.find(a => a.id === viewId)
      if (assessment) {
        openAssessmentDetail(assessment)
      }
    }
  }, [viewId, assessments])

  const loadAssessments = async () => {
    try {
      const response = await fetch("/api/admin/assessments")
      if (response.ok) {
        const data = await response.json()
        setAssessments(data)
      }
    } catch (err) {
      console.error("Error loading assessments:", err)
    } finally {
      setLoading(false)
    }
  }

  const openAssessmentDetail = async (assessment: Assessment) => {
    setSelectedAssessment(assessment)
    setLoadingDetails(true)
    setAssessmentResult(null)
    setFinancialPlan(null)
    setActionError("")
    setActionSuccess("")

    try {
      // Mark as viewed
      if (!assessment.is_viewed) {
        await fetch("/api/assessment/session", {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ sessionId: assessment.id, isViewed: true })
        })
        setAssessments(prev =>
          prev.map(a => a.id === assessment.id ? { ...a, is_viewed: true } : a)
        )
      }

      // Load results
      const resultResponse = await fetch(`/api/admin/assessments/results?sessionId=${assessment.id}`)
      if (resultResponse.ok) {
        const resultData = await resultResponse.json()
        setAssessmentResult(resultData)
      }

      // Load existing plan if any
      const planResponse = await fetch(`/api/assessment/plan?sessionId=${assessment.id}`)
      if (planResponse.ok) {
        const planData = await planResponse.json()
        if (planData && !planData.error) {
          setFinancialPlan(planData)
        }
      }
    } catch (err) {
      console.error("Error loading details:", err)
    } finally {
      setLoadingDetails(false)
    }
  }

  const generatePlan = async () => {
    if (!selectedAssessment) return

    setGeneratingPlan(true)
    setActionError("")
    setActionSuccess("")

    try {
      const response = await fetch("/api/assessment/plan", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          sessionId: selectedAssessment.id,
          planType: selectedPlanType
        })
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || "Failed to generate plan")
      }

      // Reload plan
      const planResponse = await fetch(`/api/assessment/plan?sessionId=${selectedAssessment.id}`)
      if (planResponse.ok) {
        const planData = await planResponse.json()
        if (planData && !planData.error) {
          setFinancialPlan(planData)
        }
      }

      setActionSuccess("Plan generated successfully!")

      // Update assessment status in list
      setAssessments(prev =>
        prev.map(a => a.id === selectedAssessment.id ? { ...a, status: "plan_generated" } : a)
      )
    } catch (err) {
      console.error("Plan generation error:", err)
      setActionError(err instanceof Error ? err.message : "Failed to generate plan")
    } finally {
      setGeneratingPlan(false)
    }
  }

  const generatePdf = async () => {
    if (!selectedAssessment || !financialPlan) return

    setGeneratingPdf(true)
    setActionError("")

    try {
      const response = await fetch("/api/assessment/pdf", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          sessionId: selectedAssessment.id,
          planId: financialPlan.id
        })
      })

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}))
        throw new Error(errorData.error || "Failed to generate PDF")
      }

      const blob = await response.blob()
      const url = window.URL.createObjectURL(blob)
      const a = document.createElement("a")
      a.href = url
      a.download = `${selectedAssessment.full_name.replace(/\s+/g, "_")}_Financial_Plan.pdf`
      document.body.appendChild(a)
      a.click()
      window.URL.revokeObjectURL(url)
      document.body.removeChild(a)

      setActionSuccess("PDF downloaded!")
    } catch (err) {
      console.error("PDF error:", err)
      setActionError(err instanceof Error ? err.message : "Failed to generate PDF")
    } finally {
      setGeneratingPdf(false)
    }
  }

  const sendPlanEmail = async () => {
    if (!selectedAssessment || !financialPlan) return

    setSendingEmail(true)
    setActionError("")

    try {
      const response = await fetch("/api/assessment/share", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          sessionId: selectedAssessment.id,
          planId: financialPlan.id
        })
      })

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}))
        throw new Error(errorData.error || "Failed to send email")
      }

      setActionSuccess(`Plan sent to ${selectedAssessment.email}!`)

      // Update status
      setAssessments(prev =>
        prev.map(a => a.id === selectedAssessment.id ? { ...a, status: "plan_shared", is_contacted: true } : a)
      )

      // Reload plan to get updated pdf_shared_at
      const planResponse = await fetch(`/api/assessment/plan?sessionId=${selectedAssessment.id}`)
      if (planResponse.ok) {
        const planData = await planResponse.json()
        if (planData && !planData.error) {
          setFinancialPlan(planData)
        }
      }
    } catch (err) {
      console.error("Email error:", err)
      setActionError(err instanceof Error ? err.message : "Failed to send email")
    } finally {
      setSendingEmail(false)
    }
  }

  // Helper to get comparison with benchmark
  const getBenchmarkComparison = (factorId: string, score: number) => {
    const benchmark = industryBenchmarks[factorId]
    if (!benchmark) return null

    const vsAverage = score - benchmark.average
    const vsTop25 = score - benchmark.top25

    return {
      ...benchmark,
      vsAverage,
      vsTop25,
      percentile: vsAverage >= 0
        ? (vsTop25 >= 0 ? "Top 25%" : "Above Average")
        : "Below Average"
    }
  }

  const filteredAssessments = assessments.filter(a => {
    const matchesSearch = searchQuery === "" ||
      a.full_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      a.email.toLowerCase().includes(searchQuery.toLowerCase())

    const matchesStatus = statusFilter === "all" || a.status === statusFilter

    return matchesSearch && matchesStatus
  })

  const completedAssessments = assessments.filter(a =>
    ["goals_complete", "plan_generated", "plan_shared"].includes(a.status)
  )

  const needsReview = assessments.filter(a =>
    a.status === "goals_complete" && !a.is_viewed
  )

  return (
    <div className="min-h-full bg-background">
      {/* Header */}
      <div className="border-b border-border bg-card px-6 py-4">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-semibold text-foreground">Financial Assessments</h1>
            <p className="text-muted-foreground">Manage client assessments and generate personalized plans</p>
          </div>
        </div>

        {/* Tabs */}
        <div className="flex gap-2 mt-4">
          <Button
            variant={activeTab === "take" ? "default" : "ghost"}
            onClick={() => setActiveTab("take")}
            size="sm"
          >
            <ClipboardList className="h-4 w-4 mr-2" />
            Take Assessment
          </Button>
          <Button
            variant={activeTab === "results" ? "default" : "ghost"}
            onClick={() => setActiveTab("results")}
            size="sm"
          >
            <Users className="h-4 w-4 mr-2" />
            View Results
          </Button>
        </div>
      </div>

      {activeTab === "take" ? (
        // Take Assessment Tab
        <div className="p-6">
          <div className="max-w-2xl mx-auto text-center py-12">
            <ClipboardList className="h-16 w-16 text-primary mx-auto mb-4" />
            <h2 className="text-xl font-semibold mb-2">Start a New Assessment</h2>
            <p className="text-muted-foreground mb-6">
              Begin the financial assessment process for a new client or yourself.
            </p>
            <Button asChild size="lg">
              <a href="/assessment/start" target="_blank">
                Start Assessment
                <ChevronRight className="h-4 w-4 ml-2" />
              </a>
            </Button>
          </div>
        </div>
      ) : (
        // View Results Tab
        <div className="p-6">
          {/* Stats */}
          <div className="grid grid-cols-3 gap-4 mb-6">
            <div className="bg-card border border-border rounded-xl p-4">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-primary/10 rounded-lg">
                  <ClipboardList className="h-5 w-5 text-primary" />
                </div>
                <div>
                  <p className="text-2xl font-bold text-foreground">{assessments.length}</p>
                  <p className="text-sm text-muted-foreground">Total Assessments</p>
                </div>
              </div>
            </div>
            <div className="bg-card border border-border rounded-xl p-4">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-green-500/10 rounded-lg">
                  <CheckCircle2 className="h-5 w-5 text-green-500" />
                </div>
                <div>
                  <p className="text-2xl font-bold text-foreground">{completedAssessments.length}</p>
                  <p className="text-sm text-muted-foreground">Completed</p>
                </div>
              </div>
            </div>
            <div className="bg-card border border-border rounded-xl p-4">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-yellow-500/10 rounded-lg">
                  <Eye className="h-5 w-5 text-yellow-500" />
                </div>
                <div>
                  <p className="text-2xl font-bold text-foreground">{needsReview.length}</p>
                  <p className="text-sm text-muted-foreground">Needs Review</p>
                </div>
              </div>
            </div>
          </div>

          {/* Filters */}
          <div className="flex gap-4 mb-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search by name or email..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10"
              />
            </div>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-48">
                <Filter className="h-4 w-4 mr-2" />
                <SelectValue placeholder="Filter by status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Status</SelectItem>
                <SelectItem value="goals_complete">Completed</SelectItem>
                <SelectItem value="plan_generated">Plan Ready</SelectItem>
                <SelectItem value="plan_shared">Plan Shared</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Assessments List */}
          {loading ? (
            <div className="text-center py-12">
              <Loader2 className="h-8 w-8 animate-spin mx-auto text-muted-foreground" />
            </div>
          ) : filteredAssessments.length === 0 ? (
            <div className="text-center py-12 text-muted-foreground">
              No assessments found
            </div>
          ) : (
            <div className="bg-card border border-border rounded-xl overflow-hidden">
              <table className="w-full">
                <thead className="bg-muted/50">
                  <tr>
                    <th className="text-left px-4 py-3 text-sm font-medium text-muted-foreground">Client</th>
                    <th className="text-left px-4 py-3 text-sm font-medium text-muted-foreground">Goal</th>
                    <th className="text-left px-4 py-3 text-sm font-medium text-muted-foreground">Status</th>
                    <th className="text-left px-4 py-3 text-sm font-medium text-muted-foreground">Date</th>
                    <th className="px-4 py-3"></th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {filteredAssessments.map((assessment) => (
                    <tr
                      key={assessment.id}
                      className="hover:bg-muted/30 cursor-pointer"
                      onClick={() => openAssessmentDetail(assessment)}
                    >
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 rounded-full bg-primary/20 flex items-center justify-center">
                            <span className="text-sm font-medium text-primary">
                              {assessment.full_name.charAt(0).toUpperCase()}
                            </span>
                          </div>
                          <div>
                            <p className="font-medium text-foreground flex items-center gap-2">
                              {assessment.full_name}
                              {!assessment.is_viewed && (
                                <span className="w-2 h-2 rounded-full bg-primary" />
                              )}
                            </p>
                            <p className="text-sm text-muted-foreground">{assessment.email}</p>
                          </div>
                        </div>
                      </td>
                      <td className="px-4 py-3 text-foreground">
                        {problemLabels[assessment.problem_type]}
                      </td>
                      <td className="px-4 py-3">
                        <Badge className={statusLabels[assessment.status]?.color || "bg-muted"}>
                          {statusLabels[assessment.status]?.label || assessment.status}
                        </Badge>
                      </td>
                      <td className="px-4 py-3 text-muted-foreground">
                        {new Date(assessment.created_at).toLocaleDateString()}
                      </td>
                      <td className="px-4 py-3">
                        <ChevronRight className="h-4 w-4 text-muted-foreground" />
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* Detail Slide-Over */}
      {selectedAssessment && (
        <div className="fixed inset-0 z-50 flex justify-end">
          {/* Backdrop */}
          <div
            className="absolute inset-0 bg-black/50"
            onClick={() => setSelectedAssessment(null)}
          />

          {/* Panel */}
          <div className="relative w-full max-w-lg bg-background border-l border-border overflow-y-auto">
            {/* Panel Header */}
            <div className="sticky top-0 bg-background border-b border-border px-6 py-4 flex items-center justify-between">
              <div>
                <h2 className="text-lg font-semibold text-foreground">{selectedAssessment.full_name}</h2>
                <p className="text-sm text-muted-foreground">{selectedAssessment.email}</p>
              </div>
              <Button variant="ghost" size="icon" onClick={() => setSelectedAssessment(null)}>
                <X className="h-5 w-5" />
              </Button>
            </div>

            {/* Panel Content */}
            {loadingDetails ? (
              <div className="p-6 text-center">
                <Loader2 className="h-8 w-8 animate-spin mx-auto text-muted-foreground" />
              </div>
            ) : (
              <div className="p-6 space-y-6">
                {/* Action Messages */}
                {actionError && (
                  <div className="bg-red-500/10 border border-red-500/20 rounded-lg p-3 flex items-center gap-2 text-red-500">
                    <AlertCircle className="h-4 w-4 flex-shrink-0" />
                    <span className="text-sm">{actionError}</span>
                  </div>
                )}
                {actionSuccess && (
                  <div className="bg-green-500/10 border border-green-500/20 rounded-lg p-3 flex items-center gap-2 text-green-500">
                    <CheckCircle2 className="h-4 w-4 flex-shrink-0" />
                    <span className="text-sm">{actionSuccess}</span>
                  </div>
                )}

                {/* Client Info */}
                <div className="bg-card border border-border rounded-xl p-4">
                  <h3 className="font-semibold text-foreground mb-3">Client Information</h3>
                  <div className="grid grid-cols-2 gap-3 text-sm">
                    <div className="flex items-center gap-2">
                      <Mail className="h-4 w-4 text-muted-foreground" />
                      <span className="text-foreground">{selectedAssessment.email}</span>
                    </div>
                    {selectedAssessment.phone && (
                      <div className="flex items-center gap-2">
                        <Phone className="h-4 w-4 text-muted-foreground" />
                        <span className="text-foreground">{selectedAssessment.phone}</span>
                      </div>
                    )}
                    <div className="flex items-center gap-2">
                      <Target className="h-4 w-4 text-muted-foreground" />
                      <span className="text-foreground">{problemLabels[selectedAssessment.problem_type]}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Calendar className="h-4 w-4 text-muted-foreground" />
                      <span className="text-foreground">
                        {new Date(selectedAssessment.created_at).toLocaleDateString()}
                      </span>
                    </div>
                  </div>
                  {selectedAssessment.additional_notes && (
                    <div className="mt-4 pt-4 border-t border-border">
                      <p className="text-sm text-muted-foreground mb-1">Additional Notes:</p>
                      <p className="text-foreground">{selectedAssessment.additional_notes}</p>
                    </div>
                  )}
                </div>

                {/* Results */}
                {assessmentResult && (
                  <div className="bg-card border border-border rounded-xl p-4">
                    <h3 className="font-semibold text-foreground mb-4">Assessment Results</h3>

                    <div className="grid grid-cols-2 gap-4 mb-4">
                      <div className="bg-muted rounded-lg p-4 text-center">
                        <p className="text-3xl font-bold text-foreground">{assessmentResult.overall_score}</p>
                        <p className="text-sm text-muted-foreground">Overall Score</p>
                      </div>
                      <div className="bg-muted rounded-lg p-4 text-center">
                        <div className="flex items-center justify-center gap-2">
                          <Brain className="h-5 w-5 text-primary" />
                          <span className="font-medium text-foreground">
                            {personalityLabels[assessmentResult.personality_type] || assessmentResult.personality_type}
                          </span>
                        </div>
                        <p className="text-sm text-muted-foreground mt-1">Personality Type</p>
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <p className="text-sm font-medium text-foreground mb-2 flex items-center gap-2">
                          <TrendingUp className="h-4 w-4 text-green-500" />
                          Strengths
                        </p>
                        <ul className="space-y-1">
                          {assessmentResult.strengths.map((s, i) => (
                            <li key={i} className="text-sm text-muted-foreground">
                              • {s.replace(/_/g, " ")}
                            </li>
                          ))}
                        </ul>
                      </div>
                      <div>
                        <p className="text-sm font-medium text-foreground mb-2 flex items-center gap-2">
                          <TrendingDown className="h-4 w-4 text-red-500" />
                          Needs Improvement
                        </p>
                        <ul className="space-y-1">
                          {assessmentResult.weaknesses.map((w, i) => (
                            <li key={i} className="text-sm text-muted-foreground">
                              • {w.replace(/_/g, " ")}
                            </li>
                          ))}
                        </ul>
                      </div>
                    </div>

                    {/* Detailed Scores with Industry Comparison */}
                    <div className="mt-4 pt-4 border-t border-border">
                      <div className="flex items-center justify-between mb-3">
                        <p className="text-sm font-medium text-foreground flex items-center gap-2">
                          <BarChart3 className="h-4 w-4 text-primary" />
                          Detailed Scores vs Industry
                        </p>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => setShowBenchmarks(!showBenchmarks)}
                          className="text-xs"
                        >
                          {showBenchmarks ? "Hide" : "Show"} Benchmarks
                        </Button>
                      </div>

                      <div className="space-y-3">
                        {assessmentResult.factor_scores.map((factor) => {
                          const benchmark = getBenchmarkComparison(factor.factorId, factor.score)
                          return (
                            <div key={factor.factorId} className="space-y-1">
                              <div className="flex items-center justify-between text-sm">
                                <span className="text-muted-foreground capitalize">
                                  {factor.factorId.replace(/_/g, " ")}
                                </span>
                                <div className="flex items-center gap-2">
                                  <span className={`font-medium ${factor.score >= 70 ? "text-green-500" :
                                      factor.score >= 50 ? "text-yellow-500" :
                                        "text-red-500"
                                    }`}>
                                    {factor.score}
                                  </span>
                                  {showBenchmarks && benchmark && (
                                    <span className={`text-xs px-1.5 py-0.5 rounded ${benchmark.vsAverage >= 10 ? "bg-green-500/20 text-green-500" :
                                        benchmark.vsAverage >= 0 ? "bg-blue-500/20 text-blue-500" :
                                          "bg-red-500/20 text-red-500"
                                      }`}>
                                      {benchmark.vsAverage >= 0 ? "+" : ""}{benchmark.vsAverage} vs avg
                                    </span>
                                  )}
                                </div>
                              </div>

                              {/* Progress bar with benchmark markers */}
                              {showBenchmarks && benchmark && (
                                <div className="relative h-2 bg-muted rounded-full overflow-visible">
                                  {/* Client score bar */}
                                  <div
                                    className={`h-full rounded-full ${factor.score >= 70 ? "bg-green-500" :
                                        factor.score >= 50 ? "bg-yellow-500" :
                                          "bg-red-500"
                                      }`}
                                    style={{ width: `${factor.score}%` }}
                                  />
                                  {/* Industry average marker */}
                                  <div
                                    className="absolute top-0 w-0.5 h-4 -translate-y-1 bg-muted-foreground"
                                    style={{ left: `${benchmark.average}%` }}
                                    title={`Industry Avg: ${benchmark.average}`}
                                  />
                                  {/* Top 25% marker */}
                                  <div
                                    className="absolute top-0 w-0.5 h-4 -translate-y-1 bg-primary"
                                    style={{ left: `${benchmark.top25}%` }}
                                    title={`Top 25%: ${benchmark.top25}`}
                                  />
                                </div>
                              )}
                            </div>
                          )
                        })}
                      </div>

                      {showBenchmarks && (
                        <div className="flex items-center gap-4 mt-3 text-xs text-muted-foreground">
                          <div className="flex items-center gap-1">
                            <div className="w-2 h-2 rounded-full bg-muted-foreground" />
                            <span>Industry Avg</span>
                          </div>
                          <div className="flex items-center gap-1">
                            <div className="w-2 h-2 rounded-full bg-primary" />
                            <span>Top 25%</span>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                )}

                {/* Generate Plan Section */}
                {assessmentResult && !financialPlan && (
                  <div className="bg-card border border-border rounded-xl p-4">
                    <h3 className="font-semibold text-foreground mb-3 flex items-center gap-2">
                      <Sparkles className="h-5 w-5 text-primary" />
                      Generate AI Plan
                    </h3>
                    <p className="text-sm text-muted-foreground mb-4">
                      Create a personalized financial plan using AI based on their assessment results.
                    </p>
                    <div className="flex gap-2">
                      <Select value={selectedPlanType} onValueChange={setSelectedPlanType}>
                        <SelectTrigger className="w-40">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="aggressive">Aggressive</SelectItem>
                          <SelectItem value="moderate">Moderate</SelectItem>
                          <SelectItem value="conservative">Conservative</SelectItem>
                        </SelectContent>
                      </Select>
                      <Button onClick={generatePlan} disabled={generatingPlan} className="flex-1">
                        {generatingPlan ? (
                          <>
                            <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                            Generating...
                          </>
                        ) : (
                          <>
                            <Sparkles className="h-4 w-4 mr-2" />
                            Generate Plan
                          </>
                        )}
                      </Button>
                    </div>
                  </div>
                )}

                {/* Existing Plan */}
                {financialPlan && (
                  <div className="bg-card border border-border rounded-xl p-4">
                    <div className="flex items-center justify-between mb-4">
                      <h3 className="font-semibold text-foreground flex items-center gap-2">
                        <FileText className="h-5 w-5 text-primary" />
                        Financial Plan
                      </h3>
                      <Badge>{financialPlan.plan_type} plan</Badge>
                    </div>

                    <div className="space-y-4">
                      <div>
                        <p className="text-sm font-medium text-foreground mb-1">Executive Summary</p>
                        <p className="text-sm text-muted-foreground line-clamp-4">
                          {financialPlan.executive_summary}
                        </p>
                      </div>

                      <div className="flex gap-2">
                        <Button variant="outline" onClick={generatePdf} disabled={generatingPdf} className="flex-1">
                          {generatingPdf ? (
                            <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                          ) : (
                            <Download className="h-4 w-4 mr-2" />
                          )}
                          Download PDF
                        </Button>
                        <Button onClick={sendPlanEmail} disabled={sendingEmail} className="flex-1">
                          {sendingEmail ? (
                            <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                          ) : (
                            <Send className="h-4 w-4 mr-2" />
                          )}
                          Send to Client
                        </Button>
                      </div>

                      {financialPlan.pdf_shared_at && (
                        <p className="text-sm text-green-500 flex items-center gap-2">
                          <CheckCircle2 className="h-4 w-4" />
                          Plan shared on {new Date(financialPlan.pdf_shared_at).toLocaleDateString()}
                        </p>
                      )}

                      <div className="pt-4 border-t border-border">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => setFinancialPlan(null)}
                          className="text-muted-foreground"
                        >
                          <RefreshCw className="h-4 w-4 mr-2" />
                          Regenerate Plan
                        </Button>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  )
}
