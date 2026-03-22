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
  Filter
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
        setFinancialPlan(planData)
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

      if (!response.ok) {
        const data = await response.json()
        throw new Error(data.error || "Failed to generate plan")
      }

      const data = await response.json()

      // Reload plan
      const planResponse = await fetch(`/api/assessment/plan?sessionId=${selectedAssessment.id}`)
      if (planResponse.ok) {
        setFinancialPlan(await planResponse.json())
      }

      setActionSuccess("Plan generated successfully!")

      // Update assessment status in list
      setAssessments(prev =>
        prev.map(a => a.id === selectedAssessment.id ? { ...a, status: "plan_generated" } : a)
      )
    } catch (err) {
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

      if (!response.ok) throw new Error("Failed to generate PDF")

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
      setActionError("Failed to generate PDF")
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

      if (!response.ok) throw new Error("Failed to send email")

      setActionSuccess(`Plan sent to ${selectedAssessment.email}!`)

      // Update status
      setAssessments(prev =>
        prev.map(a => a.id === selectedAssessment.id ? { ...a, status: "plan_shared", is_contacted: true } : a)
      )
    } catch (err) {
      setActionError("Failed to send email")
    } finally {
      setSendingEmail(false)
    }
  }

  // Filter assessments
  const filteredAssessments = assessments.filter(a => {
    const matchesSearch =
      a.full_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      a.email.toLowerCase().includes(searchQuery.toLowerCase())
    const matchesStatus = statusFilter === "all" || a.status === statusFilter
    return matchesSearch && matchesStatus
  })

  // Stats
  const stats = {
    total: assessments.length,
    completed: assessments.filter(a => ["goals_complete", "plan_generated", "plan_shared"].includes(a.status)).length,
    needsAttention: assessments.filter(a => a.status === "goals_complete" && !a.is_viewed).length,
    shared: assessments.filter(a => a.status === "plan_shared").length
  }

  return (
    <div className="p-6">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Financial Assessments</h1>
          <p className="text-muted-foreground">Manage client assessments and generate personalized plans</p>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-2 mb-6">
        <button
          onClick={() => setActiveTab("take")}
          className={`px-4 py-2 rounded-lg font-medium transition-colors ${activeTab === "take"
              ? "bg-card border border-primary text-foreground"
              : "bg-card border border-border text-muted-foreground hover:text-foreground"
            }`}
        >
          <ClipboardList className="h-4 w-4 inline mr-2" />
          Take Assessment
        </button>
        <button
          onClick={() => setActiveTab("results")}
          className={`px-4 py-2 rounded-lg font-medium transition-colors ${activeTab === "results"
              ? "bg-card border border-primary text-foreground"
              : "bg-card border border-border text-muted-foreground hover:text-foreground"
            }`}
        >
          <Users className="h-4 w-4 inline mr-2" />
          View Results
          {stats.needsAttention > 0 && (
            <span className="ml-2 px-2 py-0.5 text-xs rounded-full bg-primary text-primary-foreground">
              {stats.needsAttention}
            </span>
          )}
        </button>
      </div>

      {activeTab === "take" ? (
        /* Take Assessment Tab */
        <div className="space-y-6">
          {/* Share Link Card */}
          <div className="bg-card border border-border rounded-xl p-6">
            <h2 className="text-lg font-semibold text-foreground mb-2">Share Assessment Link</h2>
            <p className="text-muted-foreground mb-4">Send this link to clients to start their assessment:</p>
            <div className="flex gap-2">
              <Input
                value={`${typeof window !== "undefined" ? window.location.origin : ""}/assessment/start`}
                readOnly
                className="flex-1"
              />
              <Button
                variant="outline"
                onClick={() => {
                  navigator.clipboard.writeText(`${window.location.origin}/assessment/start`)
                  setActionSuccess("Link copied!")
                  setTimeout(() => setActionSuccess(""), 2000)
                }}
              >
                Copy Link
              </Button>
            </div>
          </div>

          {/* Assessment Overview */}
          <div className="grid md:grid-cols-2 gap-6">
            <div className="bg-card border border-border rounded-xl p-6">
              <h3 className="font-semibold text-foreground mb-4">Assessment Structure</h3>
              <div className="space-y-3">
                {[
                  { step: "1", title: "User Intake", desc: "Name, email, and primary goal" },
                  { step: "2", title: "Dynamic Tests", desc: "3-9 tests based on their goal" },
                  { step: "3", title: "Goal Selection", desc: "Priority and timeline preferences" },
                  { step: "4", title: "Thank You", desc: "They wait for your follow-up" }
                ].map(item => (
                  <div key={item.step} className="flex gap-3">
                    <div className="w-8 h-8 rounded-full bg-primary/20 text-primary flex items-center justify-center text-sm font-medium flex-shrink-0">
                      {item.step}
                    </div>
                    <div>
                      <p className="font-medium text-foreground">{item.title}</p>
                      <p className="text-sm text-muted-foreground">{item.desc}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="bg-card border border-border rounded-xl p-6">
              <h3 className="font-semibold text-foreground mb-4">Your Workflow</h3>
              <div className="space-y-3">
                {[
                  { icon: Mail, title: "Get Notified", desc: "Email alert when assessment completes" },
                  { icon: Eye, title: "Review Results", desc: "See scores, personality, weaknesses" },
                  { icon: Sparkles, title: "Generate Plan", desc: "AI creates personalized plan" },
                  { icon: Send, title: "Share with Client", desc: "Send PDF via email" }
                ].map((item, i) => (
                  <div key={i} className="flex gap-3">
                    <div className="w-8 h-8 rounded-lg bg-muted flex items-center justify-center flex-shrink-0">
                      <item.icon className="h-4 w-4 text-muted-foreground" />
                    </div>
                    <div>
                      <p className="font-medium text-foreground">{item.title}</p>
                      <p className="text-sm text-muted-foreground">{item.desc}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      ) : (
        /* View Results Tab */
        <div className="space-y-6">
          {/* Stats */}
          <div className="grid grid-cols-4 gap-4">
            {[
              { label: "Total Assessments", value: stats.total, icon: ClipboardList },
              { label: "Completed", value: stats.completed, icon: CheckCircle2 },
              { label: "Needs Review", value: stats.needsAttention, icon: AlertCircle },
              { label: "Plans Shared", value: stats.shared, icon: Send }
            ].map((stat, i) => (
              <div key={i} className="bg-card border border-border rounded-xl p-4">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-lg bg-muted flex items-center justify-center">
                    <stat.icon className="h-5 w-5 text-muted-foreground" />
                  </div>
                  <div>
                    <p className="text-2xl font-bold text-foreground">{stat.value}</p>
                    <p className="text-sm text-muted-foreground">{stat.label}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Filters */}
          <div className="flex gap-4">
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
                <SelectItem value="all">All Statuses</SelectItem>
                <SelectItem value="goals_complete">Completed</SelectItem>
                <SelectItem value="plan_generated">Plan Ready</SelectItem>
                <SelectItem value="plan_shared">Plan Shared</SelectItem>
                <SelectItem value="tests_in_progress">In Progress</SelectItem>
              </SelectContent>
            </Select>
            <Button variant="outline" onClick={loadAssessments}>
              <RefreshCw className="h-4 w-4" />
            </Button>
          </div>

          {/* Assessment List */}
          <div className="bg-card border border-border rounded-xl overflow-hidden">
            {loading ? (
              <div className="p-8 text-center">
                <Loader2 className="h-8 w-8 animate-spin mx-auto mb-2 text-primary" />
                <p className="text-muted-foreground">Loading assessments...</p>
              </div>
            ) : filteredAssessments.length === 0 ? (
              <div className="p-8 text-center">
                <ClipboardList className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
                <p className="text-foreground font-medium">No assessments yet</p>
                <p className="text-muted-foreground">Share the assessment link with clients to get started</p>
              </div>
            ) : (
              <table className="w-full">
                <thead>
                  <tr className="border-b border-border">
                    <th className="px-4 py-3 text-left text-sm font-medium text-muted-foreground">Client</th>
                    <th className="px-4 py-3 text-left text-sm font-medium text-muted-foreground">Goal</th>
                    <th className="px-4 py-3 text-left text-sm font-medium text-muted-foreground">Status</th>
                    <th className="px-4 py-3 text-left text-sm font-medium text-muted-foreground">Score</th>
                    <th className="px-4 py-3 text-left text-sm font-medium text-muted-foreground">Date</th>
                    <th className="px-4 py-3 text-right text-sm font-medium text-muted-foreground">Action</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredAssessments.map((assessment) => (
                    <tr
                      key={assessment.id}
                      className={`border-b border-border hover:bg-muted/50 cursor-pointer ${!assessment.is_viewed && assessment.status === "goals_complete" ? "bg-primary/5" : ""
                        }`}
                      onClick={() => openAssessmentDetail(assessment)}
                    >
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 rounded-full bg-primary/20 flex items-center justify-center">
                            <span className="text-sm font-medium text-primary">
                              {assessment.full_name.charAt(0)}
                            </span>
                          </div>
                          <div>
                            <p className="font-medium text-foreground">{assessment.full_name}</p>
                            <p className="text-sm text-muted-foreground">{assessment.email}</p>
                          </div>
                          {!assessment.is_viewed && assessment.status === "goals_complete" && (
                            <Badge className="bg-primary text-primary-foreground">New</Badge>
                          )}
                        </div>
                      </td>
                      <td className="px-4 py-3 text-foreground">
                        {problemLabels[assessment.problem_type] || assessment.problem_type}
                      </td>
                      <td className="px-4 py-3">
                        <Badge className={statusLabels[assessment.status]?.color || "bg-muted"}>
                          {statusLabels[assessment.status]?.label || assessment.status}
                        </Badge>
                      </td>
                      <td className="px-4 py-3">
                        {assessment.overall_score ? (
                          <span className="font-medium text-foreground">{assessment.overall_score}/100</span>
                        ) : (
                          <span className="text-muted-foreground">-</span>
                        )}
                      </td>
                      <td className="px-4 py-3 text-muted-foreground">
                        {new Date(assessment.created_at).toLocaleDateString()}
                      </td>
                      <td className="px-4 py-3 text-right">
                        <Button variant="ghost" size="sm">
                          <ChevronRight className="h-4 w-4" />
                        </Button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </div>
      )}

      {/* Detail Slide-over Panel */}
      {selectedAssessment && (
        <div className="fixed inset-0 z-50 flex">
          {/* Backdrop */}
          <div
            className="absolute inset-0 bg-black/50"
            onClick={() => setSelectedAssessment(null)}
          />

          {/* Panel */}
          <div className="absolute right-0 top-0 bottom-0 w-full max-w-2xl bg-background border-l border-border overflow-y-auto">
            {/* Header */}
            <div className="sticky top-0 bg-background border-b border-border p-4 flex items-center justify-between">
              <div>
                <h2 className="text-lg font-semibold text-foreground">{selectedAssessment.full_name}</h2>
                <p className="text-sm text-muted-foreground">{selectedAssessment.email}</p>
              </div>
              <Button variant="ghost" size="sm" onClick={() => setSelectedAssessment(null)}>
                <X className="h-5 w-5" />
              </Button>
            </div>

            {loadingDetails ? (
              <div className="p-8 text-center">
                <Loader2 className="h-8 w-8 animate-spin mx-auto mb-2 text-primary" />
                <p className="text-muted-foreground">Loading details...</p>
              </div>
            ) : (
              <div className="p-6 space-y-6">
                {/* Success/Error Messages */}
                {actionSuccess && (
                  <div className="bg-green-500/10 border border-green-500/30 text-green-600 px-4 py-3 rounded-lg flex items-center gap-2">
                    <CheckCircle2 className="h-5 w-5" />
                    {actionSuccess}
                  </div>
                )}
                {actionError && (
                  <div className="bg-destructive/10 border border-destructive/30 text-destructive px-4 py-3 rounded-lg flex items-center gap-2">
                    <AlertCircle className="h-5 w-5" />
                    {actionError}
                  </div>
                )}

                {/* Client Info */}
                <div className="bg-card border border-border rounded-xl p-4">
                  <h3 className="font-semibold text-foreground mb-3">Client Information</h3>
                  <div className="grid grid-cols-2 gap-4 text-sm">
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

                    {/* Factor Scores */}
                    <div className="mt-4 pt-4 border-t border-border">
                      <p className="text-sm font-medium text-foreground mb-2">Detailed Scores</p>
                      <div className="grid grid-cols-2 gap-2">
                        {assessmentResult.factor_scores.map((factor) => (
                          <div key={factor.factorId} className="flex items-center justify-between text-sm">
                            <span className="text-muted-foreground capitalize">
                              {factor.factorId.replace(/_/g, " ")}
                            </span>
                            <span className={`font-medium ${factor.score >= 70 ? "text-green-500" :
                                factor.score >= 50 ? "text-yellow-500" :
                                  "text-red-500"
                              }`}>
                              {factor.score}
                            </span>
                          </div>
                        ))}
                      </div>
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
