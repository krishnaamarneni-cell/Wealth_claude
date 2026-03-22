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
import { Badge } from "@/components/ui/badge"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Progress } from "@/components/ui/progress"

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
        .select(\`
          *,
          user_profiles (full_name, email),
          financial_plans (id, goal_path, chosen_path, created_at)
        \`)
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
      const response = await fetch(\`/api/assessment/pdf?id=\${assessmentId}\`)
      if (!response.ok) throw new Error("PDF generation failed")
      
      const blob = await response.blob()
      const url = window.URL.createObjectURL(blob)
      const a = document.createElement("a")
      a.href = url
      a.download = \`WealthClaude_Report_\${assessmentId.slice(0, 8)}.pdf\`
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

  const getScoreBadgeVariant = (score: number) => {
    if (score >= 70) return "default"
    if (score >= 50) return "secondary"
    return "destructive"
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
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Assessment Dashboard</h1>
          <p className="text-muted-foreground">View and manage user financial assessments</p>
        </div>
        <Button onClick={fetchAssessments} variant="outline" size="sm">
          <RefreshCw className={\`h-4 w-4 mr-2 \${loading ? "animate-spin" : ""}\`} />
          Refresh
        </Button>
      </div>

      {stats && (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">Total Assessments</CardTitle>
              <FileText className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.totalAssessments}</div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">This Week</CardTitle>
              <Clock className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.assessmentsThisWeek}</div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">Average Score</CardTitle>
              <TrendingUp className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="flex items-center gap-2">
                <span className="text-2xl font-bold">{stats.averageScore}</span>
                <span className="text-xs text-emerald-500 flex items-center">
                  <ArrowUpRight className="h-3 w-3" />
                  {stats.scoreChange}%
                </span>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">Users</CardTitle>
              <Users className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.totalAssessments}</div>
            </CardContent>
          </Card>
        </div>
      )}

      <Card>
        <CardContent className="pt-6">
          <div className="flex flex-col md:flex-row gap-4">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search by name or email..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-9"
              />
            </div>

            <Select value={dateFilter} onValueChange={setDateFilter}>
              <SelectTrigger className="w-[150px]">
                <SelectValue placeholder="Date Range" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Time</SelectItem>
                <SelectItem value="week">This Week</SelectItem>
                <SelectItem value="month">This Month</SelectItem>
              </SelectContent>
            </Select>

            <Select value={scoreFilter} onValueChange={setScoreFilter}>
              <SelectTrigger className="w-[150px]">
                <SelectValue placeholder="Score Filter" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Scores</SelectItem>
                <SelectItem value="high">High (70+)</SelectItem>
                <SelectItem value="medium">Medium (50-69)</SelectItem>
                <SelectItem value="low">Low (&lt;50)</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardContent className="p-0">
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
                <TableRow>
                  <TableCell colSpan={6} className="text-center py-12">
                    <RefreshCw className="h-6 w-6 animate-spin mx-auto mb-2 text-muted-foreground" />
                    <p className="text-muted-foreground">Loading assessments...</p>
                  </TableCell>
                </TableRow>
              ) : assessments.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={6} className="text-center py-12 text-muted-foreground">
                    No assessments found
                  </TableCell>
                </TableRow>
              ) : (
                assessments.map((assessment) => (
                  <TableRow key={assessment.id}>
                    <TableCell>
                      <div>
                        <div className="font-medium">{assessment.user_profiles?.full_name || "Unknown User"}</div>
                        <div className="text-sm text-muted-foreground">{assessment.user_profiles?.email || assessment.user_id.slice(0, 8)}</div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge variant={getScoreBadgeVariant(assessment.overall_score)}>{assessment.overall_score}</Badge>
                    </TableCell>
                    <TableCell className="text-sm">{formatPersonalityType(assessment.personality_type)}</TableCell>
                    <TableCell className="text-sm">Top {100 - (assessment.rankings?.overallPercentile || 50)}%</TableCell>
                    <TableCell className="text-sm text-muted-foreground">{formatDate(assessment.created_at)}</TableCell>
                    <TableCell className="text-right">
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="icon"><MoreHorizontal className="h-4 w-4" /></Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem onClick={() => setSelectedAssessment(assessment)}>
                            <Eye className="h-4 w-4 mr-2" />View Details
                          </DropdownMenuItem>
                          <DropdownMenuItem onClick={() => handleDownloadPdf(assessment.id)} disabled={downloadingId === assessment.id}>
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
        </CardContent>
      </Card>

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
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Assessment Details</DialogTitle>
          <DialogDescription>
            {assessment.user_profiles?.full_name || "Unknown User"} • {new Date(assessment.created_at).toLocaleDateString()}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6">
          <div className="grid grid-cols-3 gap-4">
            <Card className="bg-primary/10">
              <CardContent className="pt-6 text-center">
                <div className="text-4xl font-bold text-primary">{assessment.overall_score}</div>
                <div className="text-sm text-muted-foreground mt-1">Overall Score</div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="pt-6 text-center">
                <div className="text-2xl font-bold">{assessment.rankings?.overallPercentile || 50}th</div>
                <div className="text-sm text-muted-foreground mt-1">Percentile</div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="pt-6 text-center">
                <div className="text-lg font-bold">{assessment.personality_type?.replace(/_/g, " ").replace(/\b\w/g, (c) => c.toUpperCase())}</div>
                <div className="text-sm text-muted-foreground mt-1">Personality</div>
              </CardContent>
            </Card>
          </div>

          <div>
            <h3 className="text-lg font-semibold mb-4">Factor Breakdown</h3>
            <div className="space-y-3">
              {(assessment.factor_scores || []).map((factor) => (
                <div key={factor.factorId} className="flex items-center gap-4">
                  <div className="w-40 text-sm font-medium">{factorNames[factor.factorId] || factor.factorId}</div>
                  <div className="flex-1"><Progress value={factor.score} className="h-2" /></div>
                  <div className="w-12 text-right text-sm font-semibold">{factor.score}</div>
                </div>
              ))}
            </div>
          </div>

          <div>
            <h3 className="text-lg font-semibold mb-4">Rankings</h3>
            <div className="grid grid-cols-3 gap-4">
              <Card><CardContent className="pt-4 text-center"><div className="text-xl font-bold">{assessment.rankings?.overallPercentile || 50}th</div><div className="text-xs text-muted-foreground">vs Everyone</div></CardContent></Card>
              <Card><CardContent className="pt-4 text-center"><div className="text-xl font-bold">{assessment.rankings?.vsAgeGroup || 50}th</div><div className="text-xs text-muted-foreground">vs Age Group</div></CardContent></Card>
              <Card><CardContent className="pt-4 text-center"><div className="text-xl font-bold">{assessment.rankings?.vsIncomeGroup || 50}th</div><div className="text-xs text-muted-foreground">vs Income Group</div></CardContent></Card>
            </div>
          </div>

          {assessment.financial_plans && assessment.financial_plans.length > 0 && (
            <div>
              <h3 className="text-lg font-semibold mb-4">Financial Plan</h3>
              <Card>
                <CardContent className="pt-4">
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div><span className="text-muted-foreground">Goal Path:</span><span className="ml-2 font-medium">{assessment.financial_plans[0].goal_path?.replace(/_/g, " ").replace(/\b\w/g, (c) => c.toUpperCase())}</span></div>
                    <div><span className="text-muted-foreground">Chosen Path:</span><span className="ml-2 font-medium">{assessment.financial_plans[0].chosen_path === "safe_steady" ? "🛡️ Safe & Steady" : "⚡ Fast & Aggressive"}</span></div>
                  </div>
                </CardContent>
              </Card>
            </div>
          )}
        </div>

        <div className="flex justify-end gap-3 mt-6">
          <Button variant="outline" onClick={onClose}>Close</Button>
          <Button onClick={onDownload} disabled={downloading}>
            {downloading ? <RefreshCw className="h-4 w-4 mr-2 animate-spin" /> : <Download className="h-4 w-4 mr-2" />}
            Download PDF
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  )
}
