"use client"

import React, { useState, useEffect, useRef } from "react"
import { useParams, useRouter } from "next/navigation"
import {
  ArrowLeft,
  Mail,
  Phone,
  Calendar,
  Target,
  Brain,
  TrendingUp,
  TrendingDown,
  FileText,
  Send,
  Loader2,
  CheckCircle2,
  AlertCircle,
  Sparkles,
  Download,
  RefreshCw,
  BarChart3,
  MessageSquare,
  Copy,
  Link2,
  Plus,
  Trash2,
  Clock,
  User,
  Bot,
  History,
  X
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Badge } from "@/components/ui/badge"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/components/ui/tabs"

// Types
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
}

interface AssessmentResult {
  overall_score: number
  personality_type: string
  factor_scores: Array<{ factorId: string; score: number; status: string }>
  strengths: string[]
  weaknesses: string[]
}

interface FinancialPlan {
  id: string
  plan_type: string
  version: number
  is_active: boolean
  executive_summary: string
  goals: Array<{ goal: string; target: string; timeline: string; type: string }>
  action_items: Array<{ action: string; category: string }>
  ai_recommendations: string
  ai_warnings: string
  pdf_shared_at: string | null
  created_at: string
}

interface ChatMessage {
  id: string
  role: "user" | "assistant"
  content: string
  created_at: string
}

interface Note {
  id: string
  note: string
  created_at: string
  updated_at: string
}

interface ContactLogEntry {
  id: string
  action_type: string
  description: string | null
  created_at: string
}

// Constants
const industryBenchmarks: Record<string, { average: number; top25: number }> = {
  savings_discipline: { average: 52, top25: 78 },
  debt_management: { average: 48, top25: 72 },
  financial_planning: { average: 45, top25: 75 },
  spending_control: { average: 50, top25: 74 },
  investment_readiness: { average: 42, top25: 70 },
  risk_tolerance: { average: 55, top25: 68 },
  financial_literacy: { average: 47, top25: 76 },
  emergency_preparedness: { average: 40, top25: 72 },
  future_orientation: { average: 53, top25: 80 },
  money_wellness: { average: 48, top25: 75 }
}

const problemLabels: Record<string, string> = {
  debt: "Debt Management",
  investments: "Investment Growth",
  retirement: "Retirement Planning",
  budgeting: "Budget & Cash Flow",
  complete_checkup: "Complete Checkup"
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

const statusLabels: Record<string, { label: string; color: string }> = {
  goals_complete: { label: "Completed", color: "bg-primary/20 text-primary" },
  plan_generated: { label: "Plan Ready", color: "bg-purple-500/20 text-purple-600" },
  plan_shared: { label: "Plan Shared", color: "bg-green-500/20 text-green-600" }
}

const quickPrompts = [
  { label: "Call Prep", prompt: "What questions should I ask in our first call based on their assessment?" },
  { label: "Risk Analysis", prompt: "What are the top 3 financial risks for this client and how should they address them?" },
  { label: "Email Draft", prompt: "Draft a follow-up email summarizing their assessment results in client-friendly language." },
  { label: "90-Day Focus", prompt: "What should be their #1 priority for the next 90 days and why?" }
]

export default function AssessmentDetailPage() {
  const params = useParams()
  const router = useRouter()
  const sessionId = params.id as string
  const chatEndRef = useRef<HTMLDivElement>(null)

  // Data state
  const [assessment, setAssessment] = useState<Assessment | null>(null)
  const [result, setResult] = useState<AssessmentResult | null>(null)
  const [plan, setPlan] = useState<FinancialPlan | null>(null)
  const [allPlans, setAllPlans] = useState<FinancialPlan[]>([])
  const [chatHistory, setChatHistory] = useState<ChatMessage[]>([])
  const [notes, setNotes] = useState<Note[]>([])
  const [contactLog, setContactLog] = useState<ContactLogEntry[]>([])
  
  // UI state
  const [loading, setLoading] = useState(true)
  const [activeTab, setActiveTab] = useState("results")
  const [showBenchmarks, setShowBenchmarks] = useState(true)
  
  // Action states
  const [generatingPlan, setGeneratingPlan] = useState(false)
  const [selectedPlanType, setSelectedPlanType] = useState("moderate")
  const [generatingPdf, setGeneratingPdf] = useState(false)
  const [sendingEmail, setSendingEmail] = useState(false)
  
  // Chat state
  const [chatMessage, setChatMessage] = useState("")
  const [sendingChat, setSendingChat] = useState(false)
  const [chatIncludeHistory, setChatIncludeHistory] = useState(false)
  const [showHistoryPrompt, setShowHistoryPrompt] = useState(true)
  
  // Notes state
  const [newNote, setNewNote] = useState("")
  const [savingNote, setSavingNote] = useState(false)
  
  // Invite state
  const [inviteEmail, setInviteEmail] = useState("")
  const [inviteFirstName, setInviteFirstName] = useState("")
  const [inviteLastName, setInviteLastName] = useState("")
  const [sendingInvite, setSendingInvite] = useState(false)
  
  // Messages
  const [error, setError] = useState("")
  const [success, setSuccess] = useState("")

  // Load all data
  useEffect(() => {
    if (sessionId) {
      loadAllData()
    }
  }, [sessionId])

  // Auto-scroll chat
  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: "smooth" })
  }, [chatHistory])

  const loadAllData = async () => {
    setLoading(true)
    try {
      // Load assessment session
      const sessionRes = await fetch(`/api/admin/assessments?sessionId=${sessionId}`)
      if (sessionRes.ok) {
        const data = await sessionRes.json()
        setAssessment(Array.isArray(data) ? data[0] : data)
      }

      // Load results
      const resultRes = await fetch(`/api/admin/assessments/results?sessionId=${sessionId}`)
      if (resultRes.ok) {
        setResult(await resultRes.json())
      }

      // Load active plan
      const planRes = await fetch(`/api/assessment/plan?sessionId=${sessionId}`)
      if (planRes.ok) {
        const planData = await planRes.json()
        if (!planData.error) {
          setPlan(planData)
        }
      }

      // Load all plan versions
      const allPlansRes = await fetch(`/api/assessment/plan?sessionId=${sessionId}&all=true`)
      if (allPlansRes.ok) {
        const plansData = await allPlansRes.json()
        if (Array.isArray(plansData)) {
          setAllPlans(plansData)
        }
      }

      // Load notes
      const notesRes = await fetch(`/api/assessment/notes?sessionId=${sessionId}`)
      if (notesRes.ok) {
        setNotes(await notesRes.json())
      }

      // Load contact log
      const logRes = await fetch(`/api/assessment/contact-log?sessionId=${sessionId}`)
      if (logRes.ok) {
        setContactLog(await logRes.json())
      }
    } catch (err) {
      console.error("Error loading data:", err)
      setError("Failed to load assessment data")
    } finally {
      setLoading(false)
    }
  }

  const loadChatHistory = async () => {
    try {
      const res = await fetch(`/api/assessment/chat?sessionId=${sessionId}`)
      if (res.ok) {
        const data = await res.json()
        setChatHistory(data)
        setChatIncludeHistory(true)
        setShowHistoryPrompt(false)
      }
    } catch (err) {
      console.error("Error loading chat:", err)
    }
  }

  const startFreshChat = () => {
    setChatHistory([])
    setChatIncludeHistory(false)
    setShowHistoryPrompt(false)
  }

  const sendChatMessage = async (message: string = chatMessage) => {
    if (!message.trim()) return
    
    setSendingChat(true)
    setError("")
    
    // Add user message to UI immediately
    const userMsg: ChatMessage = {
      id: `temp-${Date.now()}`,
      role: "user",
      content: message,
      created_at: new Date().toISOString()
    }
    setChatHistory(prev => [...prev, userMsg])
    setChatMessage("")

    try {
      const res = await fetch("/api/assessment/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          sessionId,
          message,
          includeHistory: chatIncludeHistory
        })
      })

      const data = await res.json()

      if (!res.ok) {
        throw new Error(data.error || "Failed to send message")
      }

      // Add assistant response
      const assistantMsg: ChatMessage = {
        id: `temp-${Date.now()}-assistant`,
        role: "assistant",
        content: data.message,
        created_at: new Date().toISOString()
      }
      setChatHistory(prev => [...prev, assistantMsg])
    } catch (err) {
      setError(err instanceof Error ? err.message : "Chat error")
      // Remove the user message if failed
      setChatHistory(prev => prev.filter(m => m.id !== userMsg.id))
    } finally {
      setSendingChat(false)
    }
  }

  const generatePlan = async () => {
    setGeneratingPlan(true)
    setError("")
    setSuccess("")

    try {
      const res = await fetch("/api/assessment/plan", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          sessionId,
          planType: selectedPlanType
        })
      })

      const data = await res.json()
      if (!res.ok) throw new Error(data.error)

      setSuccess(`Plan v${data.version} generated!`)
      
      // Reload plans
      const planRes = await fetch(`/api/assessment/plan?sessionId=${sessionId}`)
      if (planRes.ok) {
        const planData = await planRes.json()
        if (!planData.error) setPlan(planData)
      }
      
      const allPlansRes = await fetch(`/api/assessment/plan?sessionId=${sessionId}&all=true`)
      if (allPlansRes.ok) {
        const plansData = await allPlansRes.json()
        if (Array.isArray(plansData)) setAllPlans(plansData)
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to generate plan")
    } finally {
      setGeneratingPlan(false)
    }
  }

  const downloadPdf = async () => {
    if (!plan) return
    setGeneratingPdf(true)
    setError("")

    try {
      const res = await fetch("/api/assessment/pdf", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          sessionId,
          planId: plan.id
        })
      })

      if (!res.ok) throw new Error("Failed to generate PDF")

      const blob = await res.blob()
      const url = window.URL.createObjectURL(blob)
      const a = document.createElement("a")
      a.href = url
      a.download = `${assessment?.full_name.replace(/\s+/g, "_")}_Financial_Plan.pdf`
      document.body.appendChild(a)
      a.click()
      window.URL.revokeObjectURL(url)
      document.body.removeChild(a)
      setSuccess("PDF downloaded!")
    } catch (err) {
      setError(err instanceof Error ? err.message : "PDF error")
    } finally {
      setGeneratingPdf(false)
    }
  }

  const sendToClient = async () => {
    if (!plan) return
    setSendingEmail(true)
    setError("")

    try {
      const res = await fetch("/api/assessment/share", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          sessionId,
          planId: plan.id
        })
      })

      if (!res.ok) throw new Error("Failed to send email")

      setSuccess(`Plan sent to ${assessment?.email}!`)
      
      // Reload plan to get updated pdf_shared_at
      const planRes = await fetch(`/api/assessment/plan?sessionId=${sessionId}`)
      if (planRes.ok) {
        const planData = await planRes.json()
        if (!planData.error) setPlan(planData)
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Email error")
    } finally {
      setSendingEmail(false)
    }
  }

  const addNote = async () => {
    if (!newNote.trim()) return
    setSavingNote(true)

    try {
      const res = await fetch("/api/assessment/notes", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          sessionId,
          note: newNote
        })
      })

      if (!res.ok) throw new Error("Failed to save note")

      const data = await res.json()
      setNotes(prev => [data, ...prev])
      setNewNote("")
      setSuccess("Note saved!")
    } catch (err) {
      setError(err instanceof Error ? err.message : "Note error")
    } finally {
      setSavingNote(false)
    }
  }

  const deleteNote = async (noteId: string) => {
    try {
      const res = await fetch(`/api/assessment/notes?noteId=${noteId}`, {
        method: "DELETE"
      })

      if (!res.ok) throw new Error("Failed to delete note")

      setNotes(prev => prev.filter(n => n.id !== noteId))
    } catch (err) {
      setError(err instanceof Error ? err.message : "Delete error")
    }
  }

  const sendInvite = async () => {
    if (!inviteEmail || !inviteFirstName) {
      setError("Email and first name required")
      return
    }
    
    setSendingInvite(true)
    setError("")

    try {
      const res = await fetch("/api/assessment/invite", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: inviteEmail,
          firstName: inviteFirstName,
          lastName: inviteLastName
        })
      })

      const data = await res.json()
      if (!res.ok) throw new Error(data.error)

      setSuccess(`Invite sent to ${inviteEmail}!`)
      setInviteEmail("")
      setInviteFirstName("")
      setInviteLastName("")
    } catch (err) {
      setError(err instanceof Error ? err.message : "Invite error")
    } finally {
      setSendingInvite(false)
    }
  }

  const copyLink = () => {
    const url = `${window.location.origin}/assessment/start`
    navigator.clipboard.writeText(url)
    setSuccess("Link copied!")
  }

  const getBenchmarkComparison = (factorId: string, score: number) => {
    const benchmark = industryBenchmarks[factorId]
    if (!benchmark) return null
    return {
      vsAverage: score - benchmark.average,
      average: benchmark.average,
      top25: benchmark.top25
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    )
  }

  if (!assessment) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <p className="text-muted-foreground">Assessment not found</p>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <div className="border-b border-border bg-card px-6 py-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Button variant="ghost" size="icon" onClick={() => router.push("/admin/assessments")}>
              <ArrowLeft className="h-5 w-5" />
            </Button>
            <div>
              <div className="flex items-center gap-3">
                <h1 className="text-xl font-semibold text-foreground">{assessment.full_name}</h1>
                <Badge className={statusLabels[assessment.status]?.color || "bg-muted"}>
                  {statusLabels[assessment.status]?.label || assessment.status}
                </Badge>
              </div>
              <p className="text-sm text-muted-foreground">{assessment.email}</p>
            </div>
          </div>
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <Target className="h-4 w-4" />
            {problemLabels[assessment.problem_type]}
            <span className="mx-2">•</span>
            <Calendar className="h-4 w-4" />
            {new Date(assessment.created_at).toLocaleDateString()}
          </div>
        </div>
      </div>

      {/* Messages */}
      {(error || success) && (
        <div className="px-6 pt-4">
          {error && (
            <div className="bg-red-500/10 border border-red-500/20 rounded-lg p-3 flex items-center gap-2 text-red-500 mb-2">
              <AlertCircle className="h-4 w-4" />
              <span className="text-sm">{error}</span>
              <button onClick={() => setError("")} className="ml-auto">
                <X className="h-4 w-4" />
              </button>
            </div>
          )}
          {success && (
            <div className="bg-green-500/10 border border-green-500/20 rounded-lg p-3 flex items-center gap-2 text-green-500 mb-2">
              <CheckCircle2 className="h-4 w-4" />
              <span className="text-sm">{success}</span>
              <button onClick={() => setSuccess("")} className="ml-auto">
                <X className="h-4 w-4" />
              </button>
            </div>
          )}
        </div>
      )}

      {/* Tabs */}
      <div className="p-6">
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="mb-6">
            <TabsTrigger value="results" className="gap-2">
              <BarChart3 className="h-4 w-4" />
              Results
            </TabsTrigger>
            <TabsTrigger value="plan" className="gap-2">
              <FileText className="h-4 w-4" />
              Plan
              {allPlans.length > 0 && (
                <Badge variant="secondary" className="ml-1 text-xs">
                  v{plan?.version || allPlans[0]?.version}
                </Badge>
              )}
            </TabsTrigger>
            <TabsTrigger value="chat" className="gap-2">
              <MessageSquare className="h-4 w-4" />
              Chat with AI
            </TabsTrigger>
            <TabsTrigger value="actions" className="gap-2">
              <Send className="h-4 w-4" />
              Actions
            </TabsTrigger>
          </TabsList>

          {/* Results Tab */}
          <TabsContent value="results" className="space-y-6">
            {result ? (
              <>
                {/* Score Cards */}
                <div className="grid grid-cols-3 gap-4">
                  <div className="bg-card border border-border rounded-xl p-6 text-center">
                    <p className="text-5xl font-bold text-foreground">{result.overall_score}</p>
                    <p className="text-muted-foreground mt-2">Overall Score</p>
                  </div>
                  <div className="bg-card border border-border rounded-xl p-6 text-center">
                    <div className="flex items-center justify-center gap-2 mb-2">
                      <Brain className="h-6 w-6 text-primary" />
                    </div>
                    <p className="text-xl font-semibold text-foreground">
                      {personalityLabels[result.personality_type] || result.personality_type}
                    </p>
                    <p className="text-muted-foreground mt-1">Personality Type</p>
                  </div>
                  <div className="bg-card border border-border rounded-xl p-6">
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <p className="text-sm font-medium text-foreground flex items-center gap-2 mb-2">
                          <TrendingUp className="h-4 w-4 text-green-500" />
                          Strengths
                        </p>
                        <ul className="space-y-1">
                          {result.strengths.slice(0, 3).map((s, i) => (
                            <li key={i} className="text-sm text-muted-foreground">
                              • {s.replace(/_/g, " ")}
                            </li>
                          ))}
                        </ul>
                      </div>
                      <div>
                        <p className="text-sm font-medium text-foreground flex items-center gap-2 mb-2">
                          <TrendingDown className="h-4 w-4 text-red-500" />
                          Improve
                        </p>
                        <ul className="space-y-1">
                          {result.weaknesses.slice(0, 3).map((w, i) => (
                            <li key={i} className="text-sm text-muted-foreground">
                              • {w.replace(/_/g, " ")}
                            </li>
                          ))}
                        </ul>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Detailed Scores */}
                <div className="bg-card border border-border rounded-xl p-6">
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="font-semibold text-foreground flex items-center gap-2">
                      <BarChart3 className="h-5 w-5 text-primary" />
                      Detailed Scores vs Industry
                    </h3>
                    <Button variant="ghost" size="sm" onClick={() => setShowBenchmarks(!showBenchmarks)}>
                      {showBenchmarks ? "Hide" : "Show"} Benchmarks
                    </Button>
                  </div>
                  
                  <div className="grid grid-cols-2 gap-x-8 gap-y-4">
                    {result.factor_scores.map((factor) => {
                      const benchmark = getBenchmarkComparison(factor.factorId, factor.score)
                      return (
                        <div key={factor.factorId} className="space-y-2">
                          <div className="flex items-center justify-between">
                            <span className="text-sm text-muted-foreground capitalize">
                              {factor.factorId.replace(/_/g, " ")}
                            </span>
                            <div className="flex items-center gap-2">
                              <span className={`font-semibold ${
                                factor.score >= 70 ? "text-green-500" :
                                factor.score >= 50 ? "text-yellow-500" :
                                "text-red-500"
                              }`}>
                                {factor.score}
                              </span>
                              {showBenchmarks && benchmark && (
                                <span className={`text-xs px-2 py-0.5 rounded ${
                                  benchmark.vsAverage >= 10 ? "bg-green-500/20 text-green-500" :
                                  benchmark.vsAverage >= 0 ? "bg-blue-500/20 text-blue-500" :
                                  "bg-red-500/20 text-red-500"
                                }`}>
                                  {benchmark.vsAverage >= 0 ? "+" : ""}{benchmark.vsAverage} vs avg
                                </span>
                              )}
                            </div>
                          </div>
                          
                          {showBenchmarks && benchmark && (
                            <div className="relative h-2 bg-muted rounded-full">
                              <div
                                className={`h-full rounded-full ${
                                  factor.score >= 70 ? "bg-green-500" :
                                  factor.score >= 50 ? "bg-yellow-500" :
                                  "bg-red-500"
                                }`}
                                style={{ width: `${factor.score}%` }}
                              />
                              <div
                                className="absolute top-0 w-0.5 h-4 -translate-y-1 bg-muted-foreground/50"
                                style={{ left: `${benchmark.average}%` }}
                                title={`Industry Avg: ${benchmark.average}`}
                              />
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
                    <div className="flex items-center gap-6 mt-4 pt-4 border-t border-border text-xs text-muted-foreground">
                      <div className="flex items-center gap-2">
                        <div className="w-3 h-0.5 bg-muted-foreground/50" />
                        <span>Industry Average</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <div className="w-3 h-0.5 bg-primary" />
                        <span>Top 25%</span>
                      </div>
                    </div>
                  )}
                </div>
              </>
            ) : (
              <div className="bg-card border border-border rounded-xl p-12 text-center">
                <p className="text-muted-foreground">No assessment results available</p>
              </div>
            )}
          </TabsContent>

          {/* Plan Tab */}
          <TabsContent value="plan" className="space-y-6">
            {plan ? (
              <>
                {/* Plan Header */}
                <div className="bg-card border border-border rounded-xl p-6">
                  <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center gap-3">
                      <h3 className="font-semibold text-foreground">Financial Plan</h3>
                      <Badge>{plan.plan_type}</Badge>
                      <Badge variant="outline">v{plan.version}</Badge>
                    </div>
                    <div className="flex items-center gap-2">
                      <Button variant="outline" onClick={downloadPdf} disabled={generatingPdf}>
                        {generatingPdf ? <Loader2 className="h-4 w-4 animate-spin" /> : <Download className="h-4 w-4" />}
                        <span className="ml-2">Download PDF</span>
                      </Button>
                      <Button onClick={sendToClient} disabled={sendingEmail}>
                        {sendingEmail ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
                        <span className="ml-2">Send to Client</span>
                      </Button>
                    </div>
                  </div>

                  {plan.pdf_shared_at && (
                    <p className="text-sm text-green-500 flex items-center gap-2 mb-4">
                      <CheckCircle2 className="h-4 w-4" />
                      Plan shared on {new Date(plan.pdf_shared_at).toLocaleDateString()}
                    </p>
                  )}

                  <div className="prose prose-sm max-w-none">
                    <h4 className="text-foreground">Executive Summary</h4>
                    <p className="text-muted-foreground">{plan.executive_summary}</p>
                  </div>
                </div>

                {/* Action Items */}
                <div className="grid grid-cols-2 gap-6">
                  <div className="bg-card border border-border rounded-xl p-6">
                    <h4 className="font-semibold text-foreground mb-4">Immediate Actions (30 Days)</h4>
                    <ul className="space-y-3">
                      {plan.action_items.map((item, i) => (
                        <li key={i} className="flex items-start gap-3">
                          <span className="flex-shrink-0 w-6 h-6 rounded-full bg-primary text-primary-foreground text-xs flex items-center justify-center">
                            {i + 1}
                          </span>
                          <span className="text-sm text-muted-foreground">{item.action}</span>
                        </li>
                      ))}
                    </ul>
                  </div>

                  <div className="bg-card border border-border rounded-xl p-6">
                    <h4 className="font-semibold text-foreground mb-4">Goals</h4>
                    <div className="space-y-4">
                      {plan.goals.slice(0, 5).map((goal, i) => (
                        <div key={i} className="bg-muted rounded-lg p-3">
                          <p className="font-medium text-foreground text-sm">{goal.goal}</p>
                          <p className="text-xs text-muted-foreground mt-1">
                            Target: {goal.target} • {goal.timeline}
                          </p>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>

                {/* Warnings */}
                {plan.ai_warnings && (
                  <div className="bg-yellow-500/10 border border-yellow-500/20 rounded-xl p-6">
                    <h4 className="font-semibold text-yellow-600 mb-3 flex items-center gap-2">
                      <AlertCircle className="h-5 w-5" />
                      Important Considerations
                    </h4>
                    <ul className="space-y-2">
                      {JSON.parse(plan.ai_warnings).map((warning: string, i: number) => (
                        <li key={i} className="text-sm text-yellow-600/80">• {warning}</li>
                      ))}
                    </ul>
                  </div>
                )}

                {/* Plan Versions */}
                {allPlans.length > 1 && (
                  <div className="bg-card border border-border rounded-xl p-6">
                    <h4 className="font-semibold text-foreground mb-4">Plan History</h4>
                    <div className="space-y-2">
                      {allPlans.map((p) => (
                        <div
                          key={p.id}
                          className={`flex items-center justify-between p-3 rounded-lg ${
                            p.is_active ? "bg-primary/10 border border-primary/20" : "bg-muted"
                          }`}
                        >
                          <div className="flex items-center gap-3">
                            <Badge variant={p.is_active ? "default" : "outline"}>v{p.version}</Badge>
                            <span className="text-sm">{p.plan_type}</span>
                            <span className="text-xs text-muted-foreground">
                              {new Date(p.created_at).toLocaleDateString()}
                            </span>
                          </div>
                          {p.is_active ? (
                            <Badge variant="secondary">Active</Badge>
                          ) : (
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={async () => {
                                await fetch("/api/assessment/plan", {
                                  method: "PATCH",
                                  headers: { "Content-Type": "application/json" },
                                  body: JSON.stringify({ planId: p.id, sessionId })
                                })
                                loadAllData()
                              }}
                            >
                              Restore
                            </Button>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Regenerate */}
                <div className="flex items-center gap-4">
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
                  <Button variant="outline" onClick={generatePlan} disabled={generatingPlan}>
                    {generatingPlan ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <RefreshCw className="h-4 w-4 mr-2" />}
                    Regenerate Plan
                  </Button>
                </div>
              </>
            ) : (
              /* No Plan - Generate One */
              <div className="bg-card border border-border rounded-xl p-12 text-center">
                <Sparkles className="h-12 w-12 text-primary mx-auto mb-4" />
                <h3 className="text-xl font-semibold text-foreground mb-2">Generate Financial Plan</h3>
                <p className="text-muted-foreground mb-6">
                  Create a personalized plan based on assessment results
                </p>
                <div className="flex items-center justify-center gap-4">
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
                  <Button onClick={generatePlan} disabled={generatingPlan} size="lg">
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
                <p className="text-sm text-muted-foreground mt-4">
                  Or use the Chat tab for a custom plan
                </p>
              </div>
            )}
          </TabsContent>

          {/* Chat Tab */}
          <TabsContent value="chat" className="space-y-4">
            <div className="bg-card border border-border rounded-xl overflow-hidden flex flex-col" style={{ height: "calc(100vh - 280px)" }}>
              {/* Chat History Prompt */}
              {showHistoryPrompt && (
                <div className="p-4 bg-muted/50 border-b border-border">
                  <p className="text-sm text-muted-foreground mb-3">
                    How would you like to start?
                  </p>
                  <div className="flex gap-2">
                    <Button variant="outline" size="sm" onClick={loadChatHistory}>
                      <History className="h-4 w-4 mr-2" />
                      Load Previous Chat
                    </Button>
                    <Button variant="outline" size="sm" onClick={startFreshChat}>
                      <MessageSquare className="h-4 w-4 mr-2" />
                      Start Fresh
                    </Button>
                  </div>
                </div>
              )}

              {/* Chat Messages */}
              <div className="flex-1 overflow-y-auto p-4 space-y-4">
                {chatHistory.length === 0 && !showHistoryPrompt && (
                  <div className="text-center text-muted-foreground py-8">
                    <Bot className="h-12 w-12 mx-auto mb-3 opacity-50" />
                    <p>AI has access to {assessment.full_name}&apos;s full assessment data.</p>
                    <p className="text-sm mt-1">Ask questions or generate custom plans.</p>
                  </div>
                )}
                
                {chatHistory.map((msg) => (
                  <div
                    key={msg.id}
                    className={`flex gap-3 ${msg.role === "user" ? "justify-end" : "justify-start"}`}
                  >
                    {msg.role === "assistant" && (
                      <div className="w-8 h-8 rounded-full bg-primary/20 flex items-center justify-center flex-shrink-0">
                        <Bot className="h-4 w-4 text-primary" />
                      </div>
                    )}
                    <div
                      className={`max-w-[70%] rounded-xl p-4 ${
                        msg.role === "user"
                          ? "bg-primary text-primary-foreground"
                          : "bg-muted"
                      }`}
                    >
                      <p className="text-sm whitespace-pre-wrap">{msg.content}</p>
                    </div>
                    {msg.role === "user" && (
                      <div className="w-8 h-8 rounded-full bg-muted flex items-center justify-center flex-shrink-0">
                        <User className="h-4 w-4" />
                      </div>
                    )}
                  </div>
                ))}
                
                {sendingChat && (
                  <div className="flex gap-3">
                    <div className="w-8 h-8 rounded-full bg-primary/20 flex items-center justify-center">
                      <Bot className="h-4 w-4 text-primary" />
                    </div>
                    <div className="bg-muted rounded-xl p-4">
                      <Loader2 className="h-4 w-4 animate-spin" />
                    </div>
                  </div>
                )}
                
                <div ref={chatEndRef} />
              </div>

              {/* Quick Prompts */}
              {!showHistoryPrompt && chatHistory.length < 2 && (
                <div className="px-4 py-2 border-t border-border bg-muted/30">
                  <p className="text-xs text-muted-foreground mb-2">Quick prompts:</p>
                  <div className="flex flex-wrap gap-2">
                    {quickPrompts.map((qp, i) => (
                      <Button
                        key={i}
                        variant="outline"
                        size="sm"
                        onClick={() => sendChatMessage(qp.prompt)}
                        disabled={sendingChat}
                      >
                        {qp.label}
                      </Button>
                    ))}
                  </div>
                </div>
              )}

              {/* Chat Input */}
              {!showHistoryPrompt && (
                <div className="p-4 border-t border-border">
                  <div className="flex gap-2">
                    <Input
                      placeholder="Ask about this client..."
                      value={chatMessage}
                      onChange={(e) => setChatMessage(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === "Enter" && !e.shiftKey) {
                          e.preventDefault()
                          sendChatMessage()
                        }
                      }}
                      disabled={sendingChat}
                    />
                    <Button onClick={() => sendChatMessage()} disabled={sendingChat || !chatMessage.trim()}>
                      {sendingChat ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
                    </Button>
                  </div>
                </div>
              )}
            </div>
          </TabsContent>

          {/* Actions Tab */}
          <TabsContent value="actions" className="space-y-6">
            {/* Share Assessment Link */}
            <div className="bg-card border border-border rounded-xl p-6">
              <h3 className="font-semibold text-foreground mb-4 flex items-center gap-2">
                <Link2 className="h-5 w-5 text-primary" />
                Share Assessment Link
              </h3>
              
              {/* Direct Link */}
              <div className="mb-6">
                <p className="text-sm text-muted-foreground mb-2">Direct link (copy & share)</p>
                <div className="flex gap-2">
                  <Input
                    value={`${typeof window !== "undefined" ? window.location.origin : ""}/assessment/start`}
                    readOnly
                    className="bg-muted"
                  />
                  <Button variant="outline" onClick={copyLink}>
                    <Copy className="h-4 w-4 mr-2" />
                    Copy
                  </Button>
                </div>
              </div>

              {/* Personalized Invite */}
              <div className="border-t border-border pt-6">
                <p className="text-sm text-muted-foreground mb-3">Or send a personalized invite</p>
                <div className="grid grid-cols-3 gap-4 mb-4">
                  <div>
                    <label className="text-sm font-medium text-foreground">First Name *</label>
                    <Input
                      placeholder="John"
                      value={inviteFirstName}
                      onChange={(e) => setInviteFirstName(e.target.value)}
                    />
                  </div>
                  <div>
                    <label className="text-sm font-medium text-foreground">Last Name</label>
                    <Input
                      placeholder="Doe"
                      value={inviteLastName}
                      onChange={(e) => setInviteLastName(e.target.value)}
                    />
                  </div>
                  <div>
                    <label className="text-sm font-medium text-foreground">Email *</label>
                    <Input
                      type="email"
                      placeholder="john@example.com"
                      value={inviteEmail}
                      onChange={(e) => setInviteEmail(e.target.value)}
                    />
                  </div>
                </div>
                <Button onClick={sendInvite} disabled={sendingInvite}>
                  {sendingInvite ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <Mail className="h-4 w-4 mr-2" />}
                  Send Invite Email
                </Button>
              </div>
            </div>

            {/* Client Notes */}
            <div className="bg-card border border-border rounded-xl p-6">
              <h3 className="font-semibold text-foreground mb-4 flex items-center gap-2">
                <FileText className="h-5 w-5 text-primary" />
                Client Notes
              </h3>
              
              <div className="mb-4">
                <Textarea
                  placeholder="Add a note about this client..."
                  value={newNote}
                  onChange={(e) => setNewNote(e.target.value)}
                  rows={3}
                />
                <Button onClick={addNote} disabled={savingNote || !newNote.trim()} className="mt-2">
                  {savingNote ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <Plus className="h-4 w-4 mr-2" />}
                  Add Note
                </Button>
              </div>

              {notes.length > 0 && (
                <div className="space-y-3 border-t border-border pt-4">
                  {notes.map((note) => (
                    <div key={note.id} className="bg-muted rounded-lg p-3 flex justify-between">
                      <div>
                        <p className="text-sm text-foreground">{note.note}</p>
                        <p className="text-xs text-muted-foreground mt-1">
                          {new Date(note.created_at).toLocaleString()}
                        </p>
                      </div>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => deleteNote(note.id)}
                        className="h-8 w-8 text-muted-foreground hover:text-red-500"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Contact Log */}
            <div className="bg-card border border-border rounded-xl p-6">
              <h3 className="font-semibold text-foreground mb-4 flex items-center gap-2">
                <Clock className="h-5 w-5 text-primary" />
                Activity Log
              </h3>
              
              {contactLog.length > 0 ? (
                <div className="space-y-3">
                  {contactLog.map((log) => (
                    <div key={log.id} className="flex items-start gap-3">
                      <div className="w-2 h-2 rounded-full bg-primary mt-2" />
                      <div>
                        <p className="text-sm text-foreground">
                          {log.action_type.replace(/_/g, " ")}
                          {log.description && `: ${log.description}`}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          {new Date(log.created_at).toLocaleString()}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-sm text-muted-foreground">No activity recorded yet</p>
              )}
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  )
}
