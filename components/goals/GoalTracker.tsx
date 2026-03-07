"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Progress } from "@/components/ui/progress"
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, ReferenceLine,
} from "recharts"
import {
  Target, TrendingUp, Calendar, DollarSign, Pencil, X,
  Plus, CheckCircle2,
} from "lucide-react"
import type { Asset } from "@/components/goals/types"
import { formatCurrency, formatDateShort } from "@/components/goals/types"

interface GoalTrackerProps {
  assets: Asset[]
  setAssets: React.Dispatch<React.SetStateAction<Asset[]>>
  currentSavings: number
  setCurrentSavings: (n: number) => void
  targetValue: number
  setTargetValue: (n: number) => void
  expectedReturn: number
  setExpectedReturn: (n: number) => void
  baseContributionAmount: number
  setBaseContributionAmount: (n: number) => void
  contributionType: "monthly" | "yearly"
  setContributionType: (t: "monthly" | "yearly") => void
  includePortfolio: boolean
  setIncludePortfolio: (b: boolean) => void
  portfolioValue: number
  totalAssetsValue: number
  totalCurrentValue: number
  monthlyContribution: number
}

function generateProjectionData(startValue: number, monthly: number, returnRate: number, goal: number) {
  const monthlyRate = returnRate / 100 / 12
  const data: Array<{ date: string; actual: number | null; invested: number | null; projected: number | null }> = []
  let balanceWithGrowth = startValue
  const today = new Date()
  data.push({ date: `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, "0")}`, actual: startValue, invested: startValue, projected: null })
  for (let i = 1; i <= 36; i++) {
    const investedOnly = startValue + monthly * i
    balanceWithGrowth = returnRate > 0 ? balanceWithGrowth * (1 + monthlyRate) + monthly : balanceWithGrowth + monthly
    const futureDate = new Date(today)
    futureDate.setMonth(futureDate.getMonth() + i)
    data.push({ date: `${futureDate.getFullYear()}-${String(futureDate.getMonth() + 1).padStart(2, "0")}`, actual: null, invested: Math.round(investedOnly), projected: Math.round(balanceWithGrowth) })
    if (balanceWithGrowth >= goal) break
  }
  return data
}

function generateMilestones(goal: number): number[] {
  if (goal <= 100000) return [10000, 25000, 50000, 75000, 100000]
  if (goal <= 250000) return [25000, 50000, 100000, 150000, 200000, 250000]
  if (goal <= 500000) return [50000, 100000, 250000, 350000, 500000]
  return [100000, 250000, 500000, 750000, 1000000]
}

export function GoalTracker(props: GoalTrackerProps) {
  const {
    assets, setAssets, currentSavings, setCurrentSavings,
    targetValue, setTargetValue, expectedReturn, setExpectedReturn,
    baseContributionAmount, setBaseContributionAmount,
    contributionType, setContributionType,
    includePortfolio, setIncludePortfolio,
    portfolioValue, totalAssetsValue, totalCurrentValue, monthlyContribution,
  } = props

  // ==================== AUTO-SAVE TO SUPABASE ====================
  useEffect(() => {
    const timer = setTimeout(async () => {
      try {
        const response = await fetch('/api/user-goals', {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            targetValue,
            currentSavings,
            contributionAmount: baseContributionAmount,
            contributionType,
            expectedReturn,
            includePortfolio,
          }),
        })
        if (!response.ok) console.error('[GoalTracker] Save failed:', response.status)
      } catch (e) {
        console.error('[GoalTracker] Save error:', e)
      }
    }, 1000) // Debounce saves by 1 second
    return () => clearTimeout(timer)
  }, [targetValue, currentSavings, baseContributionAmount, contributionType, expectedReturn, includePortfolio])

  // ==================== AUTO-SAVE ASSETS TO SUPABASE ====================
  useEffect(() => {
    const timer = setTimeout(async () => {
      try {
        const response = await fetch('/api/user-assets', {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ assets }),
        })
        if (!response.ok) console.error('[GoalTracker] Assets save failed:', response.status)
      } catch (e) {
        console.error('[GoalTracker] Assets save error:', e)
      }
    }, 1000) // Debounce saves by 1 second
    return () => clearTimeout(timer)
  }, [assets])

  const [isEditingGoal, setIsEditingGoal] = useState(false)
  const [isEditingContribution, setIsEditingContribution] = useState(false)
  const [isEditingReturn, setIsEditingReturn] = useState(false)
  const [isEditingSavings, setIsEditingSavings] = useState(false)
  const [tempGoalValue, setTempGoalValue] = useState(targetValue.toString())
  const [tempContributionValue, setTempContributionValue] = useState(baseContributionAmount.toString())
  const [tempReturnValue, setTempReturnValue] = useState(expectedReturn.toString())
  const [tempSavingsValue, setTempSavingsValue] = useState(currentSavings.toString())
  const [showAddAsset, setShowAddAsset] = useState(false)
  const [newAssetName, setNewAssetName] = useState("")
  const [newAssetValue, setNewAssetValue] = useState("")
  const [newAssetReturn, setNewAssetReturn] = useState("8")

  const progressPercent = targetValue > 0 ? (totalCurrentValue / targetValue) * 100 : 0
  const remainingAmount = Math.max(0, targetValue - totalCurrentValue)
  const weightedAssetReturn = assets.length > 0 ? assets.reduce((s, a) => s + a.value * a.expectedReturn, 0) / totalAssetsValue : 0

  let monthsToGoal = 0
  if (monthlyContribution > 0) {
    if (expectedReturn > 0) {
      const monthlyRate = expectedReturn / 100 / 12
      let months = 0, projectedValue = totalCurrentValue
      while (projectedValue < targetValue && months < 600) { projectedValue = projectedValue * (1 + monthlyRate) + monthlyContribution; months++ }
      monthsToGoal = months
    } else { monthsToGoal = Math.ceil(remainingAmount / monthlyContribution) }
  }
  const completionDate = new Date()
  completionDate.setMonth(completionDate.getMonth() + monthsToGoal)
  const projectedCompletion = formatDateShort(completionDate)

  const blendedReturn = totalCurrentValue > 0 ? (portfolioValue * expectedReturn + currentSavings * 0 + totalAssetsValue * weightedAssetReturn) / totalCurrentValue : expectedReturn
  const projectionData = generateProjectionData(totalCurrentValue, monthlyContribution, blendedReturn, targetValue)
  const displayContributionAmount = contributionType === "monthly" ? baseContributionAmount : baseContributionAmount * 12

  const handleSaveGoal = () => { const v = parseFloat(tempGoalValue); if (!isNaN(v)) setTargetValue(v); setIsEditingGoal(false) }
  const handleSaveSavings = () => { const v = Number(tempSavingsValue); if (v >= 0) setCurrentSavings(v); setIsEditingSavings(false) }
  const handleSaveContribution = () => { const v = parseFloat(tempContributionValue); if (!isNaN(v)) setBaseContributionAmount(v); setIsEditingContribution(false) }
  const handleSaveReturn = () => { const v = parseFloat(tempReturnValue); if (!isNaN(v)) setExpectedReturn(v); setIsEditingReturn(false) }

  const handleAddAsset = () => {
    if (assets.length >= 10) return
    const value = Number(newAssetValue), returnRate = Number(newAssetReturn)
    if (!newAssetName || value <= 0 || returnRate < 0 || returnRate > 100) { alert("Please enter valid asset details"); return }
    setAssets([...assets, { id: Date.now().toString(), name: newAssetName, value, expectedReturn: returnRate }])
    setNewAssetName(""); setNewAssetValue(""); setNewAssetReturn("8"); setShowAddAsset(false)
  }

  return (
    <div className="space-y-6">
      {/* Main Goal Card */}
      <Card className="border-border bg-card">
        <CardHeader>
          <div className="flex items-center justify-between gap-4">
            <CardTitle className="flex items-center gap-2 text-base"><Target className="h-5 w-5 text-primary" />Primary Goal:</CardTitle>
            <div className="flex items-center gap-3">
              <div className="flex items-center gap-2 rounded-lg border border-border bg-secondary/50 px-3 py-1.5">
                <span className="text-xs text-muted-foreground">Include Portfolio</span>
                <button onClick={() => setIncludePortfolio(!includePortfolio)} className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${includePortfolio ? "bg-primary" : "bg-gray-600"}`}>
                  <span className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${includePortfolio ? "translate-x-6" : "translate-x-1"}`} />
                </button>
                <span className={`text-xs font-medium ${includePortfolio ? "text-primary" : "text-muted-foreground"}`}>{includePortfolio ? "ON" : "OFF"}</span>
              </div>
              {isEditingGoal ? (
                <div className="flex gap-2">
                  <input type="number" value={tempGoalValue} onChange={(e) => setTempGoalValue(e.target.value)} onKeyDown={(e) => { if (e.key === "Enter") handleSaveGoal() }} className="w-32 rounded border border-border bg-secondary px-2 py-1 text-sm" autoFocus />
                  <button onClick={handleSaveGoal} className="rounded bg-primary px-2 py-1 text-xs text-primary-foreground hover:bg-primary/90">Save</button>
                </div>
              ) : (
                <button onClick={() => { setTempGoalValue(targetValue.toString()); setIsEditingGoal(true) }} className="flex items-center gap-2 rounded px-2 py-1 hover:bg-secondary">
                  <span className="font-semibold text-foreground">{formatCurrency(targetValue)}</span>
                  <Pencil className="h-4 w-4 text-muted-foreground" />
                </button>
              )}
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-6">
          <div>
            <div className="mb-2 flex items-center justify-between text-sm">
              <span className="text-muted-foreground">Progress</span>
              <span className="font-medium text-foreground">{progressPercent.toFixed(1)}%</span>
            </div>
            <Progress value={progressPercent} className="h-4" />
            <div className="mt-3 flex flex-col gap-1 text-sm">
              <div className="flex items-center justify-between">
                <span className="text-foreground font-medium">{formatCurrency(totalCurrentValue)}</span>
                <span className="text-muted-foreground">{formatCurrency(targetValue)}</span>
              </div>
              <div className="text-xs text-muted-foreground">
                {includePortfolio ? (<>Portfolio: {formatCurrency(portfolioValue)} + Savings: {formatCurrency(currentSavings)}{totalAssetsValue > 0 && <> + Assets: {formatCurrency(totalAssetsValue)}</>}</>) : (<>Savings: {formatCurrency(currentSavings)}{totalAssetsValue > 0 && <> + Assets: {formatCurrency(totalAssetsValue)}</>} (Portfolio excluded)</>)}
              </div>
            </div>
          </div>

          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-6">
            <div className={`rounded-lg border border-border p-4 ${includePortfolio ? "bg-secondary/50" : "bg-secondary/20 opacity-50"}`}>
              <div className="flex items-center justify-between gap-2">
                <div className="flex items-center gap-2 text-sm text-muted-foreground"><TrendingUp className="h-4 w-4" />Portfolio Value</div>
                {includePortfolio && <span className="rounded-full bg-primary px-2 py-0.5 text-xs text-primary-foreground">Included</span>}
              </div>
              <p className={`mt-1 text-xl font-bold ${includePortfolio ? "text-foreground" : "text-muted-foreground"}`}>{formatCurrency(portfolioValue)}</p>
              <p className="mt-1 text-xs text-muted-foreground">{includePortfolio ? "From portfolio engine" : "Not included"}</p>
            </div>
            <div className="rounded-lg border border-border bg-secondary/50 p-4">
              <div className="flex items-center gap-2 text-sm text-muted-foreground"><DollarSign className="h-4 w-4" />Current Savings</div>
              {isEditingSavings ? (
                <div className="mt-2 flex gap-2"><input type="number" value={tempSavingsValue} onChange={(e) => setTempSavingsValue(e.target.value)} onKeyDown={(e) => { if (e.key === "Enter") handleSaveSavings() }} className="w-24 rounded border border-border bg-secondary px-1 py-0.5 text-sm" autoFocus /><button onClick={handleSaveSavings} className="rounded bg-primary px-1.5 py-0.5 text-xs text-primary-foreground">Save</button></div>
              ) : (
                <button onClick={() => { setTempSavingsValue(currentSavings.toString()); setIsEditingSavings(true) }} className="mt-2 flex items-center gap-1">
                  <p className="text-xl font-bold text-foreground">{formatCurrency(currentSavings)}</p><Pencil className="h-3 w-3 text-muted-foreground" />
                </button>
              )}
              <p className="mt-1 text-xs text-muted-foreground">Manual savings/assets</p>
            </div>
            <div className="rounded-lg border border-border bg-secondary/50 p-4">
              <div className="flex items-center gap-2 text-sm text-muted-foreground"><DollarSign className="h-4 w-4" />Remaining</div>
              <p className="mt-1 text-xl font-bold text-foreground">{formatCurrency(remainingAmount)}</p>
            </div>
            <div className="rounded-lg border border-border bg-secondary/50 p-4">
              <div className="flex items-center justify-between gap-2">
                <div className="flex items-center gap-2 text-sm text-muted-foreground"><TrendingUp className="h-4 w-4" /><span className="text-xs">{contributionType === "monthly" ? "Monthly" : "Yearly"}</span></div>
                <div className="flex gap-1 rounded-md bg-secondary p-1">
                  <button onClick={() => setContributionType("monthly")} className={`px-1.5 py-0.5 text-xs rounded transition-colors ${contributionType === "monthly" ? "bg-primary text-primary-foreground" : "text-muted-foreground"}`}>Mo.</button>
                  <button onClick={() => setContributionType("yearly")} className={`px-1.5 py-0.5 text-xs rounded transition-colors ${contributionType === "yearly" ? "bg-primary text-primary-foreground" : "text-muted-foreground"}`}>Yr.</button>
                </div>
              </div>
              {isEditingContribution ? (
                <div className="mt-2 flex gap-2"><input type="number" value={tempContributionValue} onChange={(e) => setTempContributionValue(e.target.value)} onKeyDown={(e) => { if (e.key === "Enter") handleSaveContribution() }} className="w-20 rounded border border-border bg-secondary px-1 py-0.5 text-sm" autoFocus /><button onClick={handleSaveContribution} className="rounded bg-primary px-1.5 py-0.5 text-xs text-primary-foreground">Save</button></div>
              ) : (
                <button onClick={() => { setTempContributionValue(baseContributionAmount.toString()); setIsEditingContribution(true) }} className="mt-2 flex items-center gap-1">
                  <p className="text-xl font-bold text-foreground">{formatCurrency(displayContributionAmount)}</p><Pencil className="h-3 w-3 text-muted-foreground" />
                </button>
              )}
            </div>
            <div className="rounded-lg border border-border bg-secondary/50 p-4">
              <div className="flex items-center gap-2 text-sm text-muted-foreground"><TrendingUp className="h-4 w-4" />Expected Return</div>
              {isEditingReturn ? (
                <div className="mt-2 flex gap-2"><input type="number" value={tempReturnValue} onChange={(e) => setTempReturnValue(e.target.value)} onKeyDown={(e) => { if (e.key === "Enter") handleSaveReturn() }} min="0" max="100" className="w-16 rounded border border-border bg-secondary px-1 py-0.5 text-sm" autoFocus /><button onClick={handleSaveReturn} className="rounded bg-primary px-1.5 py-0.5 text-xs text-primary-foreground">Save</button></div>
              ) : (
                <button onClick={() => { setTempReturnValue(expectedReturn.toString()); setIsEditingReturn(true) }} className="mt-2 flex items-center gap-1">
                  <p className="text-xl font-bold text-foreground">{expectedReturn}% annually</p><Pencil className="h-3 w-3 text-muted-foreground" />
                </button>
              )}
            </div>
            <div className="rounded-lg border border-border bg-secondary/50 p-4">
              <div className="flex items-center gap-2 text-sm text-muted-foreground"><Calendar className="h-4 w-4" />Est. Completion</div>
              <p className="mt-1 text-xl font-bold text-primary">{projectedCompletion}</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Other Assets */}
      <Card className="border-border bg-card">
        <CardHeader>
          <div className="flex items-center justify-between">
            <div><CardTitle className="text-base">Other Assets</CardTitle><p className="text-xs text-muted-foreground mt-1">Add external assets (Max 10)</p></div>
            <button onClick={() => setShowAddAsset(!showAddAsset)} disabled={assets.length >= 10} className="rounded bg-primary px-3 py-1.5 text-sm text-primary-foreground hover:bg-primary/90 disabled:opacity-50"><Plus className="h-4 w-4 inline mr-1" /> Add Asset</button>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          {showAddAsset && (
            <div className="rounded-lg border border-border bg-secondary/50 p-4 space-y-3">
              <div className="grid gap-3 sm:grid-cols-3">
                <input type="text" placeholder="Asset name" value={newAssetName} onChange={(e) => setNewAssetName(e.target.value)} className="rounded border border-border bg-secondary px-3 py-2 text-sm" />
                <input type="number" placeholder="Value ($)" value={newAssetValue} onChange={(e) => setNewAssetValue(e.target.value)} className="rounded border border-border bg-secondary px-3 py-2 text-sm" />
                <input type="number" placeholder="Return (%)" value={newAssetReturn} onChange={(e) => setNewAssetReturn(e.target.value)} min="0" max="100" className="rounded border border-border bg-secondary px-3 py-2 text-sm" />
              </div>
              <div className="flex gap-2">
                <button onClick={handleAddAsset} className="rounded bg-primary px-4 py-1.5 text-sm text-primary-foreground hover:bg-primary/90">Save Asset</button>
                <button onClick={() => { setShowAddAsset(false); setNewAssetName(""); setNewAssetValue(""); setNewAssetReturn("8") }} className="rounded bg-secondary px-4 py-1.5 text-sm text-foreground hover:bg-secondary/80">Cancel</button>
              </div>
            </div>
          )}
          {assets.length === 0 ? (
            <div className="text-center py-6 text-muted-foreground text-sm">No assets added yet.</div>
          ) : (
            <div className="space-y-2">
              {assets.map((asset) => (
                <div key={asset.id} className="flex items-center justify-between rounded-lg border border-border bg-secondary/30 p-3">
                  <div className="flex-1 grid grid-cols-3 gap-3 items-center">
                    <p className="font-medium text-foreground">{asset.name}</p>
                    <p className="text-right font-bold text-foreground">{formatCurrency(asset.value)}</p>
                    <p className="text-right text-sm text-muted-foreground">{asset.expectedReturn}% return</p>
                  </div>
                  <button onClick={() => setAssets(assets.filter((a) => a.id !== asset.id))} className="ml-3 rounded p-1.5 text-red-500 hover:bg-red-500/10"><X className="h-4 w-4" /></button>
                </div>
              ))}
              {totalAssetsValue > 0 && (
                <div className="rounded-lg border border-primary/30 bg-primary/5 p-3 mt-4">
                  <div className="flex items-center justify-between"><span className="text-sm text-muted-foreground">Total Assets Value:</span><span className="font-bold text-primary">{formatCurrency(totalAssetsValue)}</span></div>
                </div>
              )}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Portfolio Projection Chart */}
      <Card className="border-border bg-card">
        <CardHeader><div className="flex items-center justify-between"><CardTitle className="text-base">Portfolio Projection</CardTitle><p className="text-xs text-muted-foreground">The gap between lines shows compound growth</p></div></CardHeader>
        <CardContent>
          <div className="relative w-full h-[350px] min-w-0 overflow-hidden">
            <ResponsiveContainer width="100%" height={350}>
              <LineChart data={projectionData} margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#374151" opacity={0.5} />
                <XAxis dataKey="date" stroke="#9ca3af" fontSize={12} tick={{ fill: "#d1d5db" }} axisLine={{ stroke: "#4b5563", strokeWidth: 2 }} tickLine={{ stroke: "#4b5563" }} />
                <YAxis tickFormatter={(v) => `$${(v / 1000).toFixed(0)}k`} stroke="#9ca3af" fontSize={12} tick={{ fill: "#d1d5db" }} axisLine={{ stroke: "#4b5563", strokeWidth: 2 }} tickLine={{ stroke: "#4b5563" }} />
                <Tooltip contentStyle={{ backgroundColor: "hsl(var(--card))", border: "1px solid hsl(var(--border))", borderRadius: "8px" }} formatter={(value: number | null) => value ? [formatCurrency(value), ""] : ["", ""]} labelFormatter={(label) => `Date: ${label}`} />
                <ReferenceLine y={targetValue} stroke="#22c55e" strokeDasharray="5 5" label={{ value: "Goal", fill: "#22c55e", fontSize: 12 }} />
                <Line type="monotone" dataKey="actual" name="Current Value" stroke="#22c55e" strokeWidth={2} dot={false} connectNulls={false} />
                <Line type="monotone" dataKey="invested" name="Invested (no returns)" stroke="#6b7280" strokeWidth={2} strokeDasharray="3 3" dot={false} connectNulls={false} />
                <Line type="monotone" dataKey="projected" name={`With ${expectedReturn}% returns`} stroke="#22c55e" strokeWidth={2} dot={false} connectNulls={false} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </CardContent>
      </Card>

      {/* Investment Breakdown */}
      {(() => {
        const totalInvested = monthlyContribution * monthsToGoal
        const compoundGrowth = Math.max(0, targetValue - totalCurrentValue - totalInvested)
        const investedPct = targetValue > 0 ? (totalInvested / targetValue) * 100 : 0
        const growthPct = targetValue > 0 ? (compoundGrowth / targetValue) * 100 : 0
        return (
          <Card className="border-border bg-card">
            <CardHeader><CardTitle className="text-base">Investment Breakdown</CardTitle></CardHeader>
            <CardContent>
              <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
                <div className="rounded-lg border border-border bg-secondary/50 p-4">
                  <div className="flex items-center gap-2 text-sm text-muted-foreground"><DollarSign className="h-4 w-4" />Total Invested</div>
                  <p className="mt-1 text-xl font-bold text-foreground">{formatCurrency(totalInvested)}</p>
                  <p className="mt-1 text-xs text-muted-foreground">{investedPct.toFixed(1)}% of goal</p>
                </div>
                <div className="rounded-lg border border-border bg-secondary/50 p-4">
                  <div className="flex items-center gap-2 text-sm text-muted-foreground"><TrendingUp className="h-4 w-4" />Compound Growth</div>
                  <p className="mt-1 text-xl font-bold text-primary">{formatCurrency(compoundGrowth)}</p>
                  <p className="mt-1 text-xs text-muted-foreground">{growthPct.toFixed(1)}% of goal</p>
                </div>
                {totalAssetsValue > 0 && (
                  <div className="rounded-lg border border-border bg-secondary/50 p-4">
                    <div className="flex items-center gap-2 text-sm text-muted-foreground"><DollarSign className="h-4 w-4" />Other Assets</div>
                    <p className="mt-1 text-xl font-bold text-foreground">{formatCurrency(totalAssetsValue)}</p>
                    <p className="mt-1 text-xs text-muted-foreground">{assets.length} asset{assets.length !== 1 ? "s" : ""}</p>
                  </div>
                )}
                <div className="rounded-lg border border-border bg-secondary/50 p-4">
                  <div className="flex items-center gap-2 text-sm text-muted-foreground"><Target className="h-4 w-4" />Target Value</div>
                  <p className="mt-1 text-xl font-bold text-foreground">{formatCurrency(targetValue)}</p>
                  <p className="mt-1 text-xs text-muted-foreground">100% goal</p>
                </div>
              </div>
            </CardContent>
          </Card>
        )
      })()}

      {/* Milestones */}
      <Card className="border-border bg-card">
        <CardHeader><CardTitle className="text-base">Milestones</CardTitle></CardHeader>
        <CardContent>
          <div className="space-y-4">
            {generateMilestones(targetValue).map((milestone) => {
              const achieved = totalCurrentValue >= milestone
              const progress = Math.min((totalCurrentValue / milestone) * 100, 100)
              return (
                <div key={milestone} className="flex items-center gap-4">
                  <div className={`flex h-10 w-10 items-center justify-center rounded-full ${achieved ? "bg-primary text-primary-foreground" : "bg-secondary text-muted-foreground"}`}>
                    {achieved ? <CheckCircle2 className="h-5 w-5" /> : <Target className="h-5 w-5" />}
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center justify-between">
                      <span className={`font-medium ${achieved ? "text-primary" : "text-foreground"}`}>{formatCurrency(milestone)}</span>
                      <span className="text-sm text-muted-foreground">{achieved ? "Achieved!" : `${progress.toFixed(1)}%`}</span>
                    </div>
                    <Progress value={progress} className="mt-1 h-2" />
                  </div>
                </div>
              )
            })}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
