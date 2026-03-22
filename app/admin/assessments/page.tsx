"use client"

import React, { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import {
  ClipboardList,
  Users,
  Eye,
  CheckCircle2,
  ChevronRight,
  Loader2,
  Search,
  Filter,
  Plus
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
  is_viewed: boolean
  is_contacted: boolean
  created_at: string
  overall_score?: number
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

export default function AdminAssessmentsPage() {
  const router = useRouter()
  const [activeTab, setActiveTab] = useState<"take" | "results">("results")
  const [assessments, setAssessments] = useState<Assessment[]>([])
  const [loading, setLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState("")
  const [statusFilter, setStatusFilter] = useState("all")

  useEffect(() => {
    loadAssessments()
  }, [])

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

  const filteredAssessments = assessments.filter(a => {
    const matchesSearch = searchQuery === "" ||
      a.full_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      a.email.toLowerCase().includes(searchQuery.toLowerCase())

    const matchesStatus = statusFilter === "all" || a.status === statusFilter

    return matchesSearch && matchesStatus
  })

  const completedCount = assessments.filter(a =>
    ["goals_complete", "plan_generated", "plan_shared"].includes(a.status)
  ).length

  const needsReviewCount = assessments.filter(a =>
    a.status === "goals_complete" && !a.is_viewed
  ).length

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
                  <p className="text-2xl font-bold text-foreground">{completedCount}</p>
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
                  <p className="text-2xl font-bold text-foreground">{needsReviewCount}</p>
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
                    <th className="text-left px-4 py-3 text-sm font-medium text-muted-foreground">Score</th>
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
                      onClick={() => router.push(`/admin/assessments/${assessment.id}`)}
                    >
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-full bg-primary/20 flex items-center justify-center">
                            <span className="text-sm font-medium text-primary">
                              {assessment.full_name.charAt(0).toUpperCase()}
                            </span>
                          </div>
                          <div>
                            <p className="font-medium text-foreground flex items-center gap-2">
                              {assessment.full_name}
                              {!assessment.is_viewed && (
                                <span className="w-2 h-2 rounded-full bg-primary" title="Not viewed" />
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
                        {assessment.overall_score ? (
                          <span className={`font-semibold ${assessment.overall_score >= 70 ? "text-green-500" :
                              assessment.overall_score >= 50 ? "text-yellow-500" :
                                "text-red-500"
                            }`}>
                            {assessment.overall_score}
                          </span>
                        ) : (
                          <span className="text-muted-foreground">—</span>
                        )}
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
    </div>
  )
}
