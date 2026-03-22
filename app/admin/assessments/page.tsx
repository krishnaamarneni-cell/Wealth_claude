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
  MoreHorizontal
} from "lucide-react"
import { createClient } from "@/lib/supabase"
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

// Types
interface Assessment {
  id: string
  user_id: string
  overall_score: number
  personality_type: string
  factor_scores: FactorScore[]
  rankings: Rankings
  created_at: string
  user_profiles?: {
    full_name: string | null
    email: string | null
  }
  financial_plans?: FinancialPlan[]
}

interface FactorScore {
  factorId: string
  score: number
  status: string
}

interface Rankings {
  overallPercentile: number
  vsAgeGroup: number
  vsIncomeGroup: number
}

interface FinancialPlan {
  id: string
  goal_path: string
  chosen_path: string
  created_at: string
}

interface DashboardStats {
  totalAssessments: number
  assessmentsThisWeek: number
  averageScore: number
  scoreChange: number
}

export default function AdminAssessmentsPage() {
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

      if (scoreFilter === "high") {
        query = query.gte("overall_score", 70)
      } else if (scoreFilter === "medium") {
        query = query.gte("overall_score", 50).lt("overall_score", 70)
      } else if (scoreFilter === "low") {
        query = query.lt("overall_score", 50)
      }

      const { data, error } = await query.limit(100)

      if (error) {
        console.error("Error fetching assessments:", error)
        return
      }

      let filtered = data || []
      if (searchQuery) {
        const lowerQuery = searchQuery.toLowerCase()
        filtered = filtered.filter(
          (a) =>
            a.user_profiles?.full_name?.toLowerCase().includes(lowerQuery) ||
            a.user_profiles?.email?.toLowerCase().includes(lowerQuery)
        )
      }

      setAssessments(filtered)

      const weekAgo = new Date()
      weekAgo.setDate(weekAgo.getDate() - 7)

      const thisWeek = (data || []).filter(
        (a) => new Date(a.created_at) >= weekAgo
      )

      const avgScore = data && data.length > 0
        ? Math.round(data.reduce((sum, a) => sum + a.overall_score, 0) / data.length)
        : 0

      setStats({
        totalAssessments: data?.length || 0,
        assessmentsThisWeek: thisWeek.length,
        averageScore: avgScore,
        scoreChange: 3.2
      })

    } catch (error) {
      console.error("Failed to fetch assessments:", error)
    } finally {
      setLoading(false)
    }
  }, [searchQuery, dateFilter, scoreFilter])

  useEffect(() => {
    fetchAssessments()
  }, [fetchAssessments])

  const handleDownloadPdf = async (assessmentId: string) => {
    setDownloadingId(assessmentId)
    try {
      const response = await fetch("/api/assessment/pdf?id=" + assessmentId)
      if (!response.ok) throw new Error("PDF generation failed")

      const blob = await response.blob()
      const url = window.URL.createObjectURL(blob)
      const a = document.createElement("a")
      a.href = url
      a.download = "WealthClaude_Report_" + assessmentId.slice(0, 8) + ".pdf"
      document.body.appendChild(a)
      a.click()
      document.body.removeChild(a)
      window.URL.revokeObjectURL(url)
    } catch (error) {
      console.error("Download failed:", error)
    } finally {
      setDownloadingId(null)
    }
  }

  const getScoreBadgeClass = (score: number) => {
    if (score >= 70) return "bg-emerald-500/20 text-emerald-400 border-emerald-500/30"
    if (score >= 50) return "bg-amber-500/20 text-amber-400 border-amber-500/30"
    return "bg-red-500/20 text-red-400 border-red-500/30"
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
    })
  }

  const formatPersonalityType = (type: string) => {
    return type?.replace(/_/g, " ").replace(/\b\w/g, (c) => c.toUpperCase()) || "Unknown"
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-emerald-400">Assessment Dashboard</h1>
          <p className="text-zinc-400">View and manage user financial assessments</p>
        </div>
        <Button
          onClick={fetchAssessments}
          variant="outline"
          size="sm"
          className="border-zinc-700 bg-zinc-800/50 hover:bg-zinc-700 text-zinc-200"
        >
          <RefreshCw className={loading ? "h-4 w-4 mr-2 animate-spin" : "h-4 w-4 mr-2"} />
          Refresh
        </Button>
      </div>

      {/* Stats Cards */}
      {stats && (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-5">
            <div className="flex items-center justify-between mb-3">
              <div className="p-2 bg-emerald-500/10 rounded-lg">
                <FileText className="h-5 w-5 text-emerald-400" />
              </div>
              <ArrowUpRight className="h-4 w-4 text-zinc-500" />
            </div>
            <div className="text-3xl font-bold text-white">{stats.totalAssessments}</div>
            <div className="text-sm text-zinc-400 mt-1">Total Assessments</div>
          </div>

          <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-5">
            <div className="flex items-center justify-between mb-3">
              <div className="p-2 bg-blue-500/10 rounded-lg">
                <Clock className="h-5 w-5 text-blue-400" />
              </div>
              <ArrowUpRight className="h-4 w-4 text-zinc-500" />
            </div>
            <div className="text-3xl font-bold text-white">{stats.assessmentsThisWeek}</div>
            <div className="text-sm text-zinc-400 mt-1">This Week</div>
          </div>

          <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-5">
            <div className="flex items-center justify-between mb-3">
              <div className="p-2 bg-purple-500/10 rounded-lg">
                <TrendingUp className="h-5 w-5 text-purple-400" />
              </div>
              <span className="text-xs text-emerald-400 flex items-center">
                <ArrowUpRight className="h-3 w-3 mr-1" />
                {stats.scoreChange}%
              </span>
            </div>
            <div className="text-3xl font-bold text-white">{stats.averageScore}</div>
            <div className="text-sm text-zinc-400 mt-1">Average Score</div>
          </div>

          <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-5">
            <div className="flex items-center justify-between mb-3">
              <div className="p-2 bg-amber-500/10 rounded-lg">
                <Users className="h-5 w-5 text-amber-400" />
              </div>
              <ArrowUpRight className="h-4 w-4 text-zinc-500" />
            </div>
            <div className="text-3xl font-bold text-white">{stats.totalAssessments}</div>
            <div className="text-sm text-zinc-400 mt-1">Users</div>
          </div>
        </div>
      )}

      {/* Filters */}
      <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-4">
        <div className="flex flex-col md:flex-row gap-4">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-zinc-500" />
            <Input
              placeholder="Search by name or email..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-9 bg-zinc-800 border-zinc-700 text-white placeholder:text-zinc-500 focus:border-emerald-500"
            />
          </div>

          <Select value={dateFilter} onValueChange={setDateFilter}>
            <SelectTrigger className="w-[150px] bg-zinc-800 border-zinc-700 text-white">
              <SelectValue placeholder="Date Range" />
            </SelectTrigger>
            <SelectContent className="bg-zinc-800 border-zinc-700">
              <SelectItem value="all">All Time</SelectItem>
              <SelectItem value="week">This Week</SelectItem>
              <SelectItem value="month">This Month</SelectItem>
            </SelectContent>
          </Select>

          <Select value={scoreFilter} onValueChange={setScoreFilter}>
            <SelectTrigger className="w-[150px] bg-zinc-800 border-zinc-700 text-white">
              <SelectValue placeholder="Score Filter" />
            </SelectTrigger>
            <SelectContent className="bg-zinc-800 border-zinc-700">
              <SelectItem value="all">All Scores</SelectItem>
              <SelectItem value="high">High (70+)</SelectItem>
              <SelectItem value="medium">Medium (50-69)</SelectItem>
              <SelectItem value="low">Low (&lt;50)</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Assessments Table */}
      <div className="bg-zinc-900 border border-zinc-800 rounded-xl overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow className="border-zinc-800 hover:bg-zinc-800/50">
              <TableHead className="text-zinc-400">User</TableHead>
              <TableHead className="text-zinc-400">Score</TableHead>
              <TableHead className="text-zinc-400">Personality</TableHead>
              <TableHead className="text-zinc-400">Percentile</TableHead>
              <TableHead className="text-zinc-400">Date</TableHead>
              <TableHead className="text-zinc-400 text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {loading ? (
              <TableRow className="border-zinc-800">
                <TableCell colSpan={6} className="text-center py-12">
                  <RefreshCw className="h-6 w-6 animate-spin mx-auto mb-2 text-zinc-500" />
                  <p className="text-zinc-500">Loading assessments...</p>
                </TableCell>
              </TableRow>
            ) : assessments.length === 0 ? (
              <TableRow className="border-zinc-800">
                <TableCell colSpan={6} className="text-center py-12 text-zinc-500">
                  No assessments found
                </TableCell>
              </TableRow>
            ) : (
              assessments.map((assessment) => (
                <TableRow key={assessment.id} className="border-zinc-800 hover:bg-zinc-800/50">
                  <TableCell>
                    <div>
                      <div className="font-medium text-white">{assessment.user_profiles?.full_name || "Unknown User"}</div>
                      <div className="text-sm text-zinc-500">{assessment.user_profiles?.email || assessment.user_id.slice(0, 8)}</div>
                    </div>
                  </TableCell>
                  <TableCell>
                    <span className={"inline-flex items-center px-2.5 py-1 rounded-full text-sm font-semibold border " + getScoreBadgeClass(assessment.overall_score)}>
                      {assessment.overall_score}
                    </span>
                  </TableCell>
                  <TableCell className="text-sm text-zinc-300">{formatPersonalityType(assessment.personality_type)}</TableCell>
                  <TableCell className="text-sm text-zinc-300">Top {100 - (assessment.rankings?.overallPercentile || 50)}%</TableCell>
                  <TableCell className="text-sm text-zinc-500">{formatDate(assessment.created_at)}</TableCell>
                  <TableCell className="text-right">
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="icon" className="hover:bg-zinc-800">
                          <MoreHorizontal className="h-4 w-4 text-zinc-400" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end" className="bg-zinc-800 border-zinc-700">
                        <DropdownMenuItem
                          onClick={() => setSelectedAssessment(assessment)}
                          className="text-zinc-200 focus:bg-zinc-700 focus:text-white"
                        >
                          <Eye className="h-4 w-4 mr-2" />View Details
                        </DropdownMenuItem>
                        <DropdownMenuItem
                          onClick={() => handleDownloadPdf(assessment.id)}
                          disabled={downloadingId === assessment.id}
                          className="text-zinc-200 focus:bg-zinc-700 focus:text-white"
                        >
                          {downloadingId === assessment.id ? <RefreshCw className="h-4 w-4 mr-2 animate-spin" /> : <Download className="h-4 w-4 mr-2" />}
                          Download PDF
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      {/* Detail Modal */}
      <AssessmentDetailModal
        assessment={selectedAssessment}
        open={!!selectedAssessment}
        onClose={() => setSelectedAssessment(null)}
        onDownload={() => selectedAssessment && handleDownloadPdf(selectedAssessment.id)}
        downloading={downloadingId === selectedAssessment?.id}
      />
    </div>
  )
}

// Detail Modal Component
interface DetailModalProps {
  assessment: Assessment | null
  open: boolean
  onClose: () => void
  onDownload: () => void
  downloading: boolean
}

function AssessmentDetailModal({ assessment, open, onClose, onDownload, downloading }: DetailModalProps) {
  if (!assessment) return null

  const factorNames: Record<string, string> = {
    savings_discipline: "Savings Discipline",
    debt_management: "Debt Management",
    financial_planning: "Financial Planning",
    spending_control: "Spending Control",
    investment_readiness: "Investment Readiness",
    risk_tolerance: "Risk Tolerance",
    financial_literacy: "Financial Literacy",
    emergency_preparedness: "Emergency Preparedness",
    future_orientation: "Future Orientation",
    money_wellness: "Money Wellness",
  }

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto bg-zinc-900 border-zinc-800 text-white">
        <DialogHeader>
          <DialogTitle className="text-emerald-400">Assessment Details</DialogTitle>
          <DialogDescription className="text-zinc-400">
            {assessment.user_profiles?.full_name || "Unknown User"} • {new Date(assessment.created_at).toLocaleDateString()}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6">
          {/* Score Overview */}
          <div className="grid grid-cols-3 gap-4">
            <div className="bg-emerald-500/10 border border-emerald-500/20 rounded-xl p-4 text-center">
              <div className="text-4xl font-bold text-emerald-400">{assessment.overall_score}</div>
              <div className="text-sm text-zinc-400 mt-1">Overall Score</div>
            </div>
            <div className="bg-zinc-800 border border-zinc-700 rounded-xl p-4 text-center">
              <div className="text-2xl font-bold text-white">{assessment.rankings?.overallPercentile || 50}th</div>
              <div className="text-sm text-zinc-400 mt-1">Percentile</div>
            </div>
            <div className="bg-zinc-800 border border-zinc-700 rounded-xl p-4 text-center">
              <div className="text-lg font-bold text-white">{assessment.personality_type?.replace(/_/g, " ").replace(/\b\w/g, (c) => c.toUpperCase())}</div>
              <div className="text-sm text-zinc-400 mt-1">Personality</div>
            </div>
          </div>

          {/* Factor Scores */}
          <div>
            <h3 className="text-lg font-semibold mb-4 text-white">Factor Breakdown</h3>
            <div className="space-y-3">
              {(assessment.factor_scores || []).map((factor) => (
                <div key={factor.factorId} className="flex items-center gap-4">
                  <div className="w-40 text-sm font-medium text-zinc-300">{factorNames[factor.factorId] || factor.factorId}</div>
                  <div className="flex-1 bg-zinc-800 rounded-full h-2 overflow-hidden">
                    <div
                      className="h-full bg-emerald-500 rounded-full transition-all"
                      style={{ width: factor.score + "%" }}
                    />
                  </div>
                  <div className="w-12 text-right text-sm font-semibold text-white">{factor.score}</div>
                </div>
              ))}
            </div>
          </div>

          {/* Rankings */}
          <div>
            <h3 className="text-lg font-semibold mb-4 text-white">Rankings</h3>
            <div className="grid grid-cols-3 gap-4">
              <div className="bg-zinc-800 border border-zinc-700 rounded-lg p-4 text-center">
                <div className="text-xl font-bold text-white">{assessment.rankings?.overallPercentile || 50}th</div>
                <div className="text-xs text-zinc-500">vs Everyone</div>
              </div>
              <div className="bg-zinc-800 border border-zinc-700 rounded-lg p-4 text-center">
                <div className="text-xl font-bold text-white">{assessment.rankings?.vsAgeGroup || 50}th</div>
                <div className="text-xs text-zinc-500">vs Age Group</div>
              </div>
              <div className="bg-zinc-800 border border-zinc-700 rounded-lg p-4 text-center">
                <div className="text-xl font-bold text-white">{assessment.rankings?.vsIncomeGroup || 50}th</div>
                <div className="text-xs text-zinc-500">vs Income Group</div>
              </div>
            </div>
          </div>

          {/* Financial Plan */}
          {assessment.financial_plans && assessment.financial_plans.length > 0 && (
            <div>
              <h3 className="text-lg font-semibold mb-4 text-white">Financial Plan</h3>
              <div className="bg-zinc-800 border border-zinc-700 rounded-lg p-4">
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <span className="text-zinc-500">Goal Path:</span>
                    <span className="ml-2 font-medium text-white">{assessment.financial_plans[0].goal_path?.replace(/_/g, " ").replace(/\b\w/g, (c) => c.toUpperCase())}</span>
                  </div>
                  <div>
                    <span className="text-zinc-500">Chosen Path:</span>
                    <span className="ml-2 font-medium text-white">{assessment.financial_plans[0].chosen_path === "safe_steady" ? "🛡️ Safe & Steady" : "⚡ Fast & Aggressive"}</span>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Footer Actions */}
        <div className="flex justify-end gap-3 mt-6">
          <Button variant="outline" onClick={onClose} className="border-zinc-700 bg-zinc-800 hover:bg-zinc-700 text-white">
            Close
          </Button>
          <Button onClick={onDownload} disabled={downloading} className="bg-emerald-600 hover:bg-emerald-700 text-white">
            {downloading ? <RefreshCw className="h-4 w-4 mr-2 animate-spin" /> : <Download className="h-4 w-4 mr-2" />}
            Download PDF
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  )
}
