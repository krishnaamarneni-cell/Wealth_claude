"use client"

import React, { useState, useEffect, useCallback } from "react"
import {
  Search,
  Download,
  Eye,
  RefreshCw,
  Users,
  FileText,
  TrendingUp,
  Clock,
  ArrowUpRight,
  MoreHorizontal,
  PlayCircle,
  ClipboardCheck,
  ChevronRight,
  Sparkles,
  Target,
  Brain,
  Shield
} from "lucide-react"
import { createClient } from "@/lib/supabase"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/components/ui/tabs"

// Types
interface Assessment {
  id: string
  user_id: string
  overall_score: number
  personality_type: string
  factor_scores: FactorScore[]
  rankings: Rankings
  created_at: string
  user_profiles?: { full_name: string | null; email: string | null }
  financial_plans?: FinancialPlan[]
}

interface FactorScore { factorId: string; score: number; status: string }
interface Rankings { overallPercentile: number; vsAgeGroup: number; vsIncomeGroup: number }
interface FinancialPlan { id: string; goal_path: string; chosen_path: string; created_at: string }
interface DashboardStats { totalAssessments: number; assessmentsThisWeek: number; averageScore: number; scoreChange: number }

// Main Component
export default function AssessmentsPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-emerald-400">Financial Assessments</h1>
        <p className="text-muted-foreground">Take a new assessment or view past results</p>
      </div>

      <Tabs defaultValue="take" className="w-full">
        <TabsList className="bg-card border border-border">
          <TabsTrigger value="take" className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground">
            <PlayCircle className="h-4 w-4 mr-2" />
            Take Assessment
          </TabsTrigger>
          <TabsTrigger value="results" className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground">
            <ClipboardCheck className="h-4 w-4 mr-2" />
            View Results
          </TabsTrigger>
        </TabsList>

        <TabsContent value="take" className="mt-6">
          <TakeAssessmentTab />
        </TabsContent>

        <TabsContent value="results" className="mt-6">
          <ViewResultsTab />
        </TabsContent>
      </Tabs>
    </div>
  )
}

// Take Assessment Tab
function TakeAssessmentTab() {
  const router = useRouter()

  const features = [
    { icon: Brain, title: "Financial Personality", description: "Discover your money mindset and behavioral patterns" },
    { icon: Target, title: "Goal Planning", description: "Get a personalized roadmap to achieve your financial goals" },
    { icon: Shield, title: "Risk Assessment", description: "Understand your risk tolerance and investment readiness" },
    { icon: Sparkles, title: "AI-Powered Insights", description: "Receive tailored recommendations based on your responses" }
  ]

  const tests = [
    { name: "Financial Personality", questions: 15, time: "4 min", required: true },
    { name: "Financial Health Check", questions: 15, time: "5 min", required: true },
    { name: "Investment Profile", questions: 12, time: "3 min", required: false },
    { name: "Money Mindset", questions: 10, time: "2 min", required: false },
  ]

  return (
    <div className="space-y-6">
      {/* Hero Card - Matching dashboard card style */}
      <div className="bg-card border border-border rounded-xl p-6">
        <div className="flex flex-col lg:flex-row gap-6 items-center">
          <div className="flex-1">
            <div className="inline-flex items-center gap-2 bg-primary/10 text-primary px-3 py-1 rounded-full text-sm mb-4">
              <Sparkles className="h-4 w-4" />
              AI-Powered Analysis
            </div>
            <h2 className="text-2xl font-bold text-foreground mb-2">Discover Your Financial DNA</h2>
            <p className="text-muted-foreground mb-6">
              Take our comprehensive 52-question assessment to understand your financial personality,
              identify areas for improvement, and get a personalized action plan.
            </p>
            <div className="flex flex-wrap gap-3">
              <Button
                onClick={() => router.push("/assessment")}
                className="bg-primary hover:bg-primary/90"
              >
                <PlayCircle className="h-4 w-4 mr-2" />
                Start Full Assessment
                <ChevronRight className="h-4 w-4 ml-2" />
              </Button>
              <Button
                variant="outline"
                onClick={() => router.push("/assessment?mode=quick")}
              >
                Quick Mode (30 questions)
              </Button>
            </div>
          </div>

          {/* Score Circle */}
          <div className="relative">
            <div className="w-40 h-40 rounded-full bg-card border-4 border-primary/30 flex items-center justify-center">
              <div className="text-center">
                <div className="text-4xl font-bold text-primary">?</div>
                <div className="text-muted-foreground text-sm mt-1">Your Score</div>
              </div>
            </div>
            <div className="absolute -top-2 -right-2 bg-primary text-primary-foreground text-xs px-2 py-1 rounded-full">
              ~14 min
            </div>
          </div>
        </div>
      </div>

      {/* Features Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {features.map((feature, i) => (
          <div key={i} className="bg-card border border-border rounded-xl p-5">
            <div className="p-2 bg-primary/10 rounded-lg w-fit mb-3">
              <feature.icon className="h-5 w-5 text-primary" />
            </div>
            <h3 className="font-semibold text-foreground mb-1">{feature.title}</h3>
            <p className="text-sm text-muted-foreground">{feature.description}</p>
          </div>
        ))}
      </div>

      {/* Test Breakdown */}
      <div className="bg-card border border-border rounded-xl p-6">
        <h3 className="text-lg font-semibold text-foreground mb-4">Assessment Breakdown</h3>
        <div className="space-y-3">
          {tests.map((test, i) => (
            <div key={i} className="flex items-center justify-between p-4 bg-muted/50 rounded-lg border border-border">
              <div className="flex items-center gap-4">
                <div className="w-8 h-8 rounded-full bg-primary/20 flex items-center justify-center text-primary font-semibold">{i + 1}</div>
                <div>
                  <div className="font-medium text-foreground">{test.name}</div>
                  <div className="text-sm text-muted-foreground">{test.questions} questions • {test.time}</div>
                </div>
              </div>
              <div>
                {test.required ? (
                  <span className="text-xs bg-primary/20 text-primary px-2 py-1 rounded">Required</span>
                ) : (
                  <span className="text-xs bg-muted text-muted-foreground px-2 py-1 rounded">Optional</span>
                )}
              </div>
            </div>
          ))}
        </div>
        <div className="mt-4 pt-4 border-t border-border flex justify-between text-sm text-muted-foreground">
          <span>Total: 52 questions</span>
          <span>Estimated time: ~14 minutes</span>
        </div>
      </div>
    </div>
  )
}

// View Results Tab
function ViewResultsTab() {
  const [assessments, setAssessments] = useState<Assessment[]>([])
  const [stats, setStats] = useState<DashboardStats | null>(null)
  const [loading, setLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState("")
  const [dateFilter, setDateFilter] = useState<string>("all")
  const [scoreFilter, setScoreFilter] = useState<string>("all")
  const [selectedAssessment, setSelectedAssessment] = useState<Assessment | null>(null)
  const [downloadingId, setDownloadingId] = useState<string | null>(null)

  const fetchAssessments = useCallback(async () => {
    setLoading(true)
    try {
      const supabase = createClient()
      let query = supabase
        .from("assessment_results")
        .select("*, user_profiles (full_name, email), financial_plans (id, goal_path, chosen_path, created_at)")
        .order("created_at", { ascending: false })

      if (dateFilter === "week") {
        const weekAgo = new Date()
        weekAgo.setDate(weekAgo.getDate() - 7)
        query = query.gte("created_at", weekAgo.toISOString())
      } else if (dateFilter === "month") {
        const monthAgo = new Date()
        monthAgo.setMonth(monthAgo.getMonth() - 1)
        query = query.gte("created_at", monthAgo.toISOString())
      }

      if (scoreFilter === "high") query = query.gte("overall_score", 70)
      else if (scoreFilter === "medium") query = query.gte("overall_score", 50).lt("overall_score", 70)
      else if (scoreFilter === "low") query = query.lt("overall_score", 50)

      const { data, error } = await query.limit(100)
      if (error) { console.error("Error:", error); return }

      let filtered = data || []
      if (searchQuery) {
        const lowerQuery = searchQuery.toLowerCase()
        filtered = filtered.filter(a =>
          a.user_profiles?.full_name?.toLowerCase().includes(lowerQuery) ||
          a.user_profiles?.email?.toLowerCase().includes(lowerQuery)
        )
      }
      setAssessments(filtered)

      const weekAgo = new Date()
      weekAgo.setDate(weekAgo.getDate() - 7)
      const thisWeek = (data || []).filter(a => new Date(a.created_at) >= weekAgo)
      const avgScore = data && data.length > 0 ? Math.round(data.reduce((sum, a) => sum + a.overall_score, 0) / data.length) : 0
      setStats({ totalAssessments: data?.length || 0, assessmentsThisWeek: thisWeek.length, averageScore: avgScore, scoreChange: 3.2 })
    } catch (error) { console.error("Failed:", error) }
    finally { setLoading(false) }
  }, [searchQuery, dateFilter, scoreFilter])

  useEffect(() => { fetchAssessments() }, [fetchAssessments])

  const handleDownloadPdf = async (id: string) => {
    setDownloadingId(id)
    try {
      const res = await fetch("/api/assessment/pdf?id=" + id)
      if (!res.ok) throw new Error("Failed")
      const blob = await res.blob()
      const url = window.URL.createObjectURL(blob)
      const a = document.createElement("a")
      a.href = url
      a.download = "WealthClaude_Report_" + id.slice(0, 8) + ".pdf"
      document.body.appendChild(a)
      a.click()
      document.body.removeChild(a)
      window.URL.revokeObjectURL(url)
    } catch (e) { console.error(e) }
    finally { setDownloadingId(null) }
  }

  const getScoreBadge = (score: number) => {
    if (score >= 70) return "bg-emerald-500/20 text-emerald-500"
    if (score >= 50) return "bg-amber-500/20 text-amber-500"
    return "bg-red-500/20 text-red-500"
  }

  const formatDate = (d: string) => new Date(d).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })
  const formatType = (t: string) => t?.replace(/_/g, " ").replace(/\b\w/g, c => c.toUpperCase()) || "Unknown"

  return (
    <div className="space-y-6">
      {/* Stats */}
      {stats && (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          {[
            { label: "Total Assessments", value: stats.totalAssessments, icon: FileText, color: "text-emerald-500 bg-emerald-500/10" },
            { label: "This Week", value: stats.assessmentsThisWeek, icon: Clock, color: "text-blue-500 bg-blue-500/10" },
            { label: "Average Score", value: stats.averageScore, icon: TrendingUp, color: "text-purple-500 bg-purple-500/10", change: stats.scoreChange },
            { label: "Users", value: stats.totalAssessments, icon: Users, color: "text-amber-500 bg-amber-500/10" }
          ].map((stat, i) => (
            <div key={i} className="bg-card border border-border rounded-xl p-5">
              <div className="flex items-center justify-between mb-3">
                <div className={"p-2 rounded-lg " + stat.color}><stat.icon className="h-5 w-5" /></div>
                {stat.change ? (
                  <span className="text-xs text-emerald-500 flex items-center"><ArrowUpRight className="h-3 w-3 mr-1" />{stat.change}%</span>
                ) : (
                  <ArrowUpRight className="h-4 w-4 text-muted-foreground" />
                )}
              </div>
              <div className="text-3xl font-bold text-foreground">{stat.value}</div>
              <div className="text-sm text-muted-foreground mt-1">{stat.label}</div>
            </div>
          ))}
        </div>
      )}

      {/* Filters */}
      <div className="bg-card border border-border rounded-xl p-4">
        <div className="flex flex-col md:flex-row gap-4">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input placeholder="Search by name or email..." value={searchQuery} onChange={e => setSearchQuery(e.target.value)} className="pl-9" />
          </div>
          <Select value={dateFilter} onValueChange={setDateFilter}>
            <SelectTrigger className="w-[150px]"><SelectValue placeholder="Date Range" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Time</SelectItem>
              <SelectItem value="week">This Week</SelectItem>
              <SelectItem value="month">This Month</SelectItem>
            </SelectContent>
          </Select>
          <Select value={scoreFilter} onValueChange={setScoreFilter}>
            <SelectTrigger className="w-[150px]"><SelectValue placeholder="Score Filter" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Scores</SelectItem>
              <SelectItem value="high">High (70+)</SelectItem>
              <SelectItem value="medium">Medium (50-69)</SelectItem>
              <SelectItem value="low">Low (&lt;50)</SelectItem>
            </SelectContent>
          </Select>
          <Button onClick={fetchAssessments} variant="outline" size="sm">
            <RefreshCw className={loading ? "h-4 w-4 mr-2 animate-spin" : "h-4 w-4 mr-2"} />Refresh
          </Button>
        </div>
      </div>

      {/* Table */}
      <div className="bg-card border border-border rounded-xl overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>User</TableHead>
              <TableHead>Score</TableHead>
              <TableHead>Personality</TableHead>
              <TableHead>Percentile</TableHead>
              <TableHead>Date</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {loading ? (
              <TableRow><TableCell colSpan={6} className="text-center py-12"><RefreshCw className="h-6 w-6 animate-spin mx-auto mb-2" /><p className="text-muted-foreground">Loading...</p></TableCell></TableRow>
            ) : assessments.length === 0 ? (
              <TableRow><TableCell colSpan={6} className="text-center py-12 text-muted-foreground">No assessments found</TableCell></TableRow>
            ) : assessments.map(a => (
              <TableRow key={a.id}>
                <TableCell>
                  <div className="font-medium">{a.user_profiles?.full_name || "Unknown"}</div>
                  <div className="text-sm text-muted-foreground">{a.user_profiles?.email || a.user_id.slice(0, 8)}</div>
                </TableCell>
                <TableCell><span className={"px-2.5 py-1 rounded-full text-sm font-semibold " + getScoreBadge(a.overall_score)}>{a.overall_score}</span></TableCell>
                <TableCell className="text-sm">{formatType(a.personality_type)}</TableCell>
                <TableCell className="text-sm">Top {100 - (a.rankings?.overallPercentile || 50)}%</TableCell>
                <TableCell className="text-sm text-muted-foreground">{formatDate(a.created_at)}</TableCell>
                <TableCell className="text-right">
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild><Button variant="ghost" size="icon"><MoreHorizontal className="h-4 w-4" /></Button></DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuItem onClick={() => setSelectedAssessment(a)}><Eye className="h-4 w-4 mr-2" />View Details</DropdownMenuItem>
                      <DropdownMenuItem onClick={() => handleDownloadPdf(a.id)} disabled={downloadingId === a.id}>
                        {downloadingId === a.id ? <RefreshCw className="h-4 w-4 mr-2 animate-spin" /> : <Download className="h-4 w-4 mr-2" />}Download PDF
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>

      <DetailModal assessment={selectedAssessment} open={!!selectedAssessment} onClose={() => setSelectedAssessment(null)} onDownload={() => selectedAssessment && handleDownloadPdf(selectedAssessment.id)} downloading={downloadingId === selectedAssessment?.id} />
    </div>
  )
}

// Detail Modal
function DetailModal({ assessment, open, onClose, onDownload, downloading }: { assessment: Assessment | null; open: boolean; onClose: () => void; onDownload: () => void; downloading: boolean }) {
  if (!assessment) return null
  const names: Record<string, string> = { savings_discipline: "Savings", debt_management: "Debt", financial_planning: "Planning", spending_control: "Spending", investment_readiness: "Investing", risk_tolerance: "Risk", financial_literacy: "Literacy", emergency_preparedness: "Emergency", future_orientation: "Future", money_wellness: "Wellness" }

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-primary">Assessment Details</DialogTitle>
          <DialogDescription>{assessment.user_profiles?.full_name || "Unknown"} • {new Date(assessment.created_at).toLocaleDateString()}</DialogDescription>
        </DialogHeader>

        <div className="space-y-6">
          <div className="grid grid-cols-3 gap-4">
            <div className="bg-primary/10 border border-primary/20 rounded-xl p-4 text-center">
              <div className="text-4xl font-bold text-primary">{assessment.overall_score}</div>
              <div className="text-sm text-muted-foreground mt-1">Score</div>
            </div>
            <div className="bg-card border border-border rounded-xl p-4 text-center">
              <div className="text-2xl font-bold">{assessment.rankings?.overallPercentile || 50}th</div>
              <div className="text-sm text-muted-foreground mt-1">Percentile</div>
            </div>
            <div className="bg-card border border-border rounded-xl p-4 text-center">
              <div className="text-lg font-bold">{assessment.personality_type?.replace(/_/g, " ").replace(/\b\w/g, c => c.toUpperCase())}</div>
              <div className="text-sm text-muted-foreground mt-1">Type</div>
            </div>
          </div>

          <div>
            <h3 className="font-semibold mb-4">Factor Breakdown</h3>
            <div className="space-y-3">
              {(assessment.factor_scores || []).map(f => (
                <div key={f.factorId} className="flex items-center gap-4">
                  <div className="w-24 text-sm">{names[f.factorId] || f.factorId}</div>
                  <div className="flex-1 bg-muted rounded-full h-2 overflow-hidden"><div className="h-full bg-primary rounded-full" style={{ width: f.score + "%" }} /></div>
                  <div className="w-10 text-right text-sm font-semibold">{f.score}</div>
                </div>
              ))}
            </div>
          </div>
        </div>

        <div className="flex justify-end gap-3 mt-6">
          <Button variant="outline" onClick={onClose}>Close</Button>
          <Button onClick={onDownload} disabled={downloading}>
            {downloading ? <RefreshCw className="h-4 w-4 mr-2 animate-spin" /> : <Download className="h-4 w-4 mr-2" />}Download PDF
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  )
}
