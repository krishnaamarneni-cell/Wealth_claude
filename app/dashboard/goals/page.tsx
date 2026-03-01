"use client"

import { useState, useMemo } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Progress } from "@/components/ui/progress"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Goal Tracker — WealthClaude | Investment Goals',
  description: 'Set and track your investment goals. Monitor progress toward financial milestones with AI-powered projections.',
}

import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, ReferenceLine, BarChart, Bar, Cell, PieChart, Pie } from "recharts"
import { usePortfolio } from "@/lib/portfolio-context"
import { Target, TrendingUp, Calendar, DollarSign, Pencil, X, CreditCard, AlertTriangle, TrendingDown, PieChart as PieChartIcon, Activity, CheckCircle2, Plus, Trash2, Shield, Zap } from "lucide-react"

// ==================== TYPES ====================

type Asset = {
  id: string
  name: string
  value: number
  expectedReturn: number
}

type Debt = {
  id: string
  name: string
  type: 'Credit Card' | 'Auto Loan' | 'Mortgage' | 'Student Loan' | 'Personal Loan' | 'Other'
  balance: number
  apr: number
  monthlyPayment: number
  minimumPayment: number
  loanTerm?: number // in months
}

type PayoffStrategy = 'avalanche' | 'snowball' | 'custom'

// ==================== HELPER FUNCTIONS ====================

function formatCurrency(value: number): string {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(value)
}

function formatDateShort(date: Date): string {
  const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']
  return `${months[date.getMonth()]} ${date.getFullYear()}`
}

function generateProjectionData(startValue: number, monthly: number, returnRate: number, goal: number) {
  const monthlyRate = returnRate / 100 / 12
  const data: Array<{ date: string; actual: number | null; invested: number | null; projected: number | null }> = []
  let balanceWithGrowth = startValue
  const today = new Date()

  data.push({
    date: `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}`,
    actual: startValue,
    invested: startValue,
    projected: null,
  })

  for (let i = 1; i <= 36; i++) {
    const investedOnly = startValue + monthly * i

    if (returnRate > 0) {
      balanceWithGrowth = balanceWithGrowth * (1 + monthlyRate) + monthly
    } else {
      balanceWithGrowth = balanceWithGrowth + monthly
    }

    const futureDate = new Date(today)
    futureDate.setMonth(futureDate.getMonth() + i)

    data.push({
      date: `${futureDate.getFullYear()}-${String(futureDate.getMonth() + 1).padStart(2, '0')}`,
      actual: null,
      invested: Math.round(investedOnly),
      projected: Math.round(balanceWithGrowth),
    })

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

// ==================== DEBT CALCULATIONS ====================

function calculateMonthlyInterest(debt: Debt): number {
  return (debt.balance * (debt.apr / 100)) / 12
}

function calculateAnnualInterest(debt: Debt): number {
  return debt.balance * (debt.apr / 100)
}

function calculateDebtPayoffSchedule(debts: Debt[], strategy: PayoffStrategy, extraPayment: number = 0) {
  const sortedDebts = [...debts].sort((a, b) => {
    if (strategy === 'avalanche') return b.apr - a.apr
    if (strategy === 'snowball') return a.balance - b.balance
    return 0
  })

  const schedule: Array<{
    month: number
    debts: Array<{ id: string; balance: number; payment: number; interest: number }>
    totalBalance: number
    totalInterestPaid: number
  }> = []

  let currentDebts = sortedDebts.map(d => ({ ...d }))
  let month = 0
  let totalInterestPaid = 0

  while (currentDebts.some(d => d.balance > 0) && month < 600) {
    month++
    const monthData: typeof schedule[0] = {
      month,
      debts: [],
      totalBalance: 0,
      totalInterestPaid: 0
    }

    // Calculate minimum payments for all debts
    let availableExtra = extraPayment

    currentDebts.forEach((debt, index) => {
      if (debt.balance <= 0) {
        monthData.debts.push({ id: debt.id, balance: 0, payment: 0, interest: 0 })
        return
      }

      const monthlyInterest = calculateMonthlyInterest(debt)
      let payment = debt.monthlyPayment

      // Add extra payment to first non-zero debt (based on strategy)
      if (index === currentDebts.findIndex(d => d.balance > 0) && availableExtra > 0) {
        payment += availableExtra
        availableExtra = 0
      }

      const principalPayment = payment - monthlyInterest
      const newBalance = Math.max(0, debt.balance - principalPayment)

      totalInterestPaid += monthlyInterest
      monthData.debts.push({
        id: debt.id,
        balance: newBalance,
        payment,
        interest: monthlyInterest
      })

      debt.balance = newBalance
      monthData.totalBalance += newBalance
    })

    monthData.totalInterestPaid = totalInterestPaid
    schedule.push(monthData)
  }

  return schedule
}

// ==================== MAIN COMPONENT ====================

export default function GoalsPage() {
  const portfolioContext = usePortfolio()

  // Tab state
  const [activeTab, setActiveTab] = useState('goals')

  // Goal Tracker State
  const [contributionType, setContributionType] = useState<"monthly" | "yearly">("monthly")
  const [baseContributionAmount, setBaseContributionAmount] = useState(500)
  const [targetValue, setTargetValue] = useState(100000)
  const [expectedReturn, setExpectedReturn] = useState(8)
  const [currentSavings, setCurrentSavings] = useState(0)
  const [includePortfolio, setIncludePortfolio] = useState(true)

  // Edit states
  const [isEditingGoal, setIsEditingGoal] = useState(false)
  const [isEditingContribution, setIsEditingContribution] = useState(false)
  const [isEditingReturn, setIsEditingReturn] = useState(false)
  const [isEditingSavings, setIsEditingSavings] = useState(false)
  const [tempGoalValue, setTempGoalValue] = useState(targetValue.toString())
  const [tempContributionValue, setTempContributionValue] = useState(baseContributionAmount.toString())
  const [tempReturnValue, setTempReturnValue] = useState(expectedReturn.toString())
  const [tempSavingsValue, setTempSavingsValue] = useState(currentSavings.toString())

  // Assets state
  const [assets, setAssets] = useState<Asset[]>([])
  const [showAddAsset, setShowAddAsset] = useState(false)
  const [newAssetName, setNewAssetName] = useState("")
  const [newAssetValue, setNewAssetValue] = useState("")
  const [newAssetReturn, setNewAssetReturn] = useState("8")

  // Debt Tracker State
  const [debts, setDebts] = useState<Debt[]>([])
  const [showAddDebt, setShowAddDebt] = useState(false)
  const [payoffStrategy, setPayoffStrategy] = useState<PayoffStrategy>('avalanche')
  const [extraDebtPayment, setExtraDebtPayment] = useState(0)
  const [newDebt, setNewDebt] = useState<Partial<Debt>>({
    name: '',
    type: 'Credit Card',
    balance: 0,
    apr: 0,
    monthlyPayment: 0,
    minimumPayment: 0,
    loanTerm: undefined
  })

  // Financial Overview State
  const [includePortfolioInOverview, setIncludePortfolioInOverview] = useState(true)
  const [includeDividendsInOverview, setIncludeDividendsInOverview] = useState(true)
  const [monthlyIncome, setMonthlyIncome] = useState(5000)
  const [monthlyExpenses, setMonthlyExpenses] = useState(2000)

  // Portfolio values from context
  const portfolioValue = portfolioContext?.portfolioValue || 0
  const portfolioAnnualReturn = portfolioContext?.performance?.returns?.['1Y'] || 8
  const portfolioAnnualDividends = portfolioContext?.income?.totalDividends || 0

  // Assets calculations
  const totalAssetsValue = assets.reduce((sum, asset) => sum + asset.value, 0)
  const weightedAssetReturn = assets.length > 0
    ? assets.reduce((sum, asset) => sum + (asset.value * asset.expectedReturn), 0) / totalAssetsValue
    : 0

  // Goal calculations
  const totalCurrentValue = includePortfolio
    ? portfolioValue + currentSavings + totalAssetsValue
    : currentSavings + totalAssetsValue
  const progressPercent = targetValue > 0 ? (totalCurrentValue / targetValue) * 100 : 0
  const remainingAmount = Math.max(0, targetValue - totalCurrentValue)

  let monthsToGoal = 0
  const monthlyContribution = contributionType === "monthly" ? baseContributionAmount : baseContributionAmount / 12
  if (monthlyContribution > 0) {
    if (expectedReturn > 0) {
      const monthlyRate = expectedReturn / 100 / 12
      if (monthlyRate > 0) {
        let months = 0
        let projectedValue = totalCurrentValue
        while (projectedValue < targetValue && months < 600) {
          projectedValue = projectedValue * (1 + monthlyRate) + monthlyContribution
          months++
        }
        monthsToGoal = months
      } else {
        monthsToGoal = Math.ceil(remainingAmount / monthlyContribution)
      }
    } else {
      monthsToGoal = Math.ceil(remainingAmount / monthlyContribution)
    }
  }

  const completionDate = new Date()
  completionDate.setMonth(completionDate.getMonth() + monthsToGoal)
  const projectedCompletion = formatDateShort(completionDate)

  const blendedReturn = totalCurrentValue > 0
    ? (
      (portfolioValue * expectedReturn) +
      (currentSavings * 0) +
      (totalAssetsValue * weightedAssetReturn)
    ) / totalCurrentValue
    : expectedReturn

  const projectionData = generateProjectionData(totalCurrentValue, monthlyContribution, blendedReturn, targetValue)

  // Debt calculations
  const totalDebt = debts.reduce((sum, debt) => sum + debt.balance, 0)
  const totalMonthlyDebtPayment = debts.reduce((sum, debt) => sum + debt.monthlyPayment, 0)
  const totalMonthlyInterest = debts.reduce((sum, debt) => sum + calculateMonthlyInterest(debt), 0)
  const totalAnnualInterest = debts.reduce((sum, debt) => sum + calculateAnnualInterest(debt), 0)
  const weightedAvgAPR = totalDebt > 0
    ? debts.reduce((sum, debt) => sum + (debt.balance * debt.apr), 0) / totalDebt
    : 0

  // Payoff schedules for all three strategies
  const avalancheSchedule = useMemo(() => calculateDebtPayoffSchedule(debts, 'avalanche', extraDebtPayment), [debts, extraDebtPayment])
  const snowballSchedule = useMemo(() => calculateDebtPayoffSchedule(debts, 'snowball', extraDebtPayment), [debts, extraDebtPayment])
  const currentSchedule = payoffStrategy === 'avalanche' ? avalancheSchedule : snowballSchedule

  // Financial Overview calculations
  const totalAssets = (includePortfolioInOverview ? portfolioValue : 0) + currentSavings + totalAssetsValue
  const totalLiabilities = totalDebt
  const netWorth = totalAssets - totalLiabilities

  const annualIncome = monthlyIncome * 12
  const annualExpenses = monthlyExpenses * 12
  const annualDebtPayments = totalMonthlyDebtPayment * 12
  const annualInvestmentContributions = monthlyContribution * 12

  const portfolioAnnualReturnDollars = includePortfolioInOverview ? (portfolioValue * (portfolioAnnualReturn / 100)) : 0
  const dividendIncome = (includePortfolioInOverview && includeDividendsInOverview) ? portfolioAnnualDividends : 0

  const totalAnnualIncome = annualIncome + portfolioAnnualReturnDollars + dividendIncome
  const totalAnnualExpenses = annualExpenses + totalAnnualInterest + annualInvestmentContributions

  const netAnnualCashFlow = totalAnnualIncome - totalAnnualExpenses
  const monthlyNetCashFlow = netAnnualCashFlow / 12

  // Risk Indicators
  const debtToIncomeRatio = monthlyIncome > 0 ? (totalMonthlyDebtPayment / monthlyIncome) * 100 : 0
  const debtToAssetRatio = totalAssets > 0 ? (totalDebt / totalAssets) * 100 : 0
  const emergencyFundMonths = monthlyExpenses > 0 ? currentSavings / monthlyExpenses : 0
  const leverageRatio = netWorth > 0 ? totalDebt / netWorth : 0

  // Financial Health Score (0-100)
  const calculateHealthScore = () => {
    let score = 100

    // Debt-to-income (30 points)
    if (debtToIncomeRatio > 50) score -= 30
    else if (debtToIncomeRatio > 35) score -= 20
    else if (debtToIncomeRatio > 20) score -= 10

    // Emergency fund (25 points)
    if (emergencyFundMonths < 3) score -= 25
    else if (emergencyFundMonths < 6) score -= 10

    // Net worth (20 points)
    if (netWorth < 0) score -= 20
    else if (netWorth < 10000) score -= 10

    // Leverage (15 points)
    if (leverageRatio > 2) score -= 15
    else if (leverageRatio > 1) score -= 8

    // Cash flow (10 points)
    if (monthlyNetCashFlow < 0) score -= 10
    else if (monthlyNetCashFlow < 200) score -= 5

    return Math.max(0, score)
  }

  const healthScore = calculateHealthScore()

  // ==================== HANDLERS ====================

  const handleSaveGoal = () => {
    const newValue = parseFloat(tempGoalValue)
    if (!isNaN(newValue)) setTargetValue(newValue)
    setIsEditingGoal(false)
  }

  const handleSaveSavings = () => {
    const newValue = Number(tempSavingsValue)
    if (newValue >= 0) setCurrentSavings(newValue)
    else setTempSavingsValue(currentSavings.toString())
    setIsEditingSavings(false)
  }

  const handleAddAsset = () => {
    if (assets.length >= 10) {
      alert("Maximum 10 assets allowed")
      return
    }

    const value = Number(newAssetValue)
    const returnRate = Number(newAssetReturn)

    if (!newAssetName || value <= 0 || returnRate < 0 || returnRate > 100) {
      alert("Please enter valid asset details")
      return
    }

    const asset: Asset = {
      id: Date.now().toString(),
      name: newAssetName,
      value: value,
      expectedReturn: returnRate
    }

    setAssets([...assets, asset])
    setNewAssetName("")
    setNewAssetValue("")
    setNewAssetReturn("8")
    setShowAddAsset(false)
  }

  const handleDeleteAsset = (id: string) => {
    setAssets(assets.filter(asset => asset.id !== id))
  }

  const handleSaveContribution = () => {
    const newValue = parseFloat(tempContributionValue)
    if (!isNaN(newValue)) setBaseContributionAmount(newValue)
    setIsEditingContribution(false)
  }

  const handleSaveReturn = () => {
    const newValue = parseFloat(tempReturnValue)
    if (!isNaN(newValue)) setExpectedReturn(newValue)
    setIsEditingReturn(false)
  }

  const handleAddDebt = () => {
    if (debts.length >= 20) {
      alert("Maximum 20 debts allowed")
      return
    }

    if (!newDebt.name || !newDebt.balance || !newDebt.apr || !newDebt.monthlyPayment) {
      alert("Please fill in all required fields")
      return
    }

    const debt: Debt = {
      id: Date.now().toString(),
      name: newDebt.name,
      type: newDebt.type || 'Other',
      balance: newDebt.balance,
      apr: newDebt.apr,
      monthlyPayment: newDebt.monthlyPayment,
      minimumPayment: newDebt.minimumPayment || 0,
      loanTerm: newDebt.loanTerm
    }

    setDebts([...debts, debt])
    setNewDebt({
      name: '',
      type: 'Credit Card',
      balance: 0,
      apr: 0,
      monthlyPayment: 0,
      minimumPayment: 0,
      loanTerm: undefined
    })
    setShowAddDebt(false)
  }

  const handleDeleteDebt = (id: string) => {
    setDebts(debts.filter(debt => debt.id !== id))
  }

  const displayContributionAmount = contributionType === "monthly" ? baseContributionAmount : baseContributionAmount * 12

  // Debt breakdown by type
  const debtByType = debts.reduce((acc, debt) => {
    acc[debt.type] = (acc[debt.type] || 0) + debt.balance
    return acc
  }, {} as Record<string, number>)

  const debtPieData = Object.entries(debtByType).map(([type, value]) => ({
    name: type,
    value,
    percent: (value / totalDebt) * 100
  }))

  const DEBT_COLORS = {
    'Credit Card': '#ef4444',
    'Auto Loan': '#f97316',
    'Mortgage': '#eab308',
    'Student Loan': '#3b82f6',
    'Personal Loan': '#8b5cf6',
    'Other': '#6b7280'
  }

  // ==================== RENDER ====================

  return (
    <div className="p-4 lg:p-6 space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-foreground">Goals & Finance</h1>
        <p className="text-muted-foreground">Track your financial goals, debts, and overall financial health</p>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="goals" className="flex items-center gap-2">
            <Target className="h-4 w-4" />
            Goal Tracker
          </TabsTrigger>
          <TabsTrigger value="debts" className="flex items-center gap-2">
            <CreditCard className="h-4 w-4" />
            Debt Tracker
          </TabsTrigger>
          <TabsTrigger value="overview" className="flex items-center gap-2">
            <PieChartIcon className="h-4 w-4" />
            Financial Overview
          </TabsTrigger>
        </TabsList>

        {/* ==================== TAB 1: GOAL TRACKER ==================== */}
        <TabsContent value="goals" className="space-y-6">
          {/* Main Goal Card */}
          <Card className="border-border bg-card">
            <CardHeader>
              <div className="flex items-center justify-between gap-4">
                <CardTitle className="flex items-center gap-2 text-base">
                  <Target className="h-5 w-5 text-primary" />
                  Primary Goal:
                </CardTitle>
                <div className="flex items-center gap-3">
                  <div className="flex items-center gap-2 rounded-lg border border-border bg-secondary/50 px-3 py-1.5">
                    <span className="text-xs text-muted-foreground">Include Portfolio</span>
                    <button
                      onClick={() => setIncludePortfolio(!includePortfolio)}
                      className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${includePortfolio ? 'bg-primary' : 'bg-gray-600'
                        }`}
                      aria-label="Toggle portfolio inclusion"
                    >
                      <span
                        className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${includePortfolio ? 'translate-x-6' : 'translate-x-1'
                          }`}
                      />
                    </button>
                    <span className={`text-xs font-medium ${includePortfolio ? 'text-primary' : 'text-muted-foreground'}`}>
                      {includePortfolio ? 'ON' : 'OFF'}
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    {isEditingGoal ? (
                      <div className="flex gap-2">
                        <input
                          type="number"
                          value={tempGoalValue}
                          onChange={(e) => setTempGoalValue(e.target.value)}
                          onKeyDown={(e) => {
                            if (e.key === 'Enter') handleSaveGoal()
                          }}
                          className="w-32 rounded border border-border bg-secondary px-2 py-1 text-sm"
                          autoFocus
                        />
                        <button
                          onClick={handleSaveGoal}
                          className="rounded bg-primary px-2 py-1 text-xs text-primary-foreground hover:bg-primary/90"
                        >
                          Save
                        </button>
                      </div>
                    ) : (
                      <button
                        onClick={() => {
                          setTempGoalValue(targetValue.toString())
                          setIsEditingGoal(true)
                        }}
                        className="flex items-center gap-2 rounded px-2 py-1 hover:bg-secondary"
                      >
                        <span className="font-semibold text-foreground">{formatCurrency(targetValue)}</span>
                        <Pencil className="h-4 w-4 text-muted-foreground" />
                      </button>
                    )}
                  </div>
                </div>
              </div>
            </CardHeader>
            <CardContent className="space-y-6">
              <div>
                <div className="mb-2 flex items-center justify-between text-sm">
                  <span className="text-muted-foreground">Progress</span>
                  <span className="font-medium text-foreground">
                    {progressPercent.toFixed(1)}%
                  </span>
                </div>
                <Progress value={progressPercent} className="h-4" />
                <div className="mt-3 flex flex-col gap-1 text-sm">
                  <div className="flex items-center justify-between">
                    <span className="text-foreground font-medium">{formatCurrency(totalCurrentValue)}</span>
                    <span className="text-muted-foreground">{formatCurrency(targetValue)}</span>
                  </div>
                  <div className="text-xs text-muted-foreground">
                    {includePortfolio ? (
                      <>
                        Portfolio: {formatCurrency(portfolioValue)} +
                        Savings: {formatCurrency(currentSavings)}
                        {totalAssetsValue > 0 && <> + Assets: {formatCurrency(totalAssetsValue)}</>}
                      </>
                    ) : (
                      <>
                        Savings: {formatCurrency(currentSavings)}
                        {totalAssetsValue > 0 && <> + Assets: {formatCurrency(totalAssetsValue)}</>}
                        (Portfolio excluded)
                      </>
                    )}
                  </div>
                </div>
              </div>

              <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-6">
                <div className={`rounded-lg border border-border p-4 ${includePortfolio ? 'bg-secondary/50' : 'bg-secondary/20 opacity-50'
                  }`}>
                  <div className="flex items-center justify-between gap-2">
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                      <TrendingUp className="h-4 w-4" />
                      Portfolio Value
                    </div>
                    {includePortfolio && (
                      <span className="rounded-full bg-primary px-2 py-0.5 text-xs text-primary-foreground">
                        Included
                      </span>
                    )}
                  </div>
                  <p className={`mt-1 text-xl font-bold ${includePortfolio ? 'text-foreground' : 'text-muted-foreground'}`}>
                    {formatCurrency(portfolioValue)}
                  </p>
                  <p className="mt-1 text-xs text-muted-foreground">
                    {includePortfolio ? 'From portfolio engine' : 'Not included in goal'}
                  </p>
                </div>
                <div className="rounded-lg border border-border bg-secondary/50 p-4">
                  <div className="flex items-center justify-between gap-2">
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                      <DollarSign className="h-4 w-4" />
                      Current Savings
                    </div>
                    {!includePortfolio && (
                      <span className="rounded-full bg-primary px-2 py-0.5 text-xs text-primary-foreground">
                        Primary
                      </span>
                    )}
                  </div>
                  {isEditingSavings ? (
                    <div className="mt-2 flex gap-2">
                      <input
                        type="number"
                        value={tempSavingsValue}
                        onChange={(e) => setTempSavingsValue(e.target.value)}
                        onKeyDown={(e) => {
                          if (e.key === 'Enter') handleSaveSavings()
                        }}
                        className="w-24 rounded border border-border bg-secondary px-1 py-0.5 text-sm"
                        autoFocus
                        placeholder="Manual savings"
                      />
                      <button
                        onClick={handleSaveSavings}
                        className="rounded bg-primary px-1.5 py-0.5 text-xs text-primary-foreground hover:bg-primary/90"
                      >
                        Save
                      </button>
                    </div>
                  ) : (
                    <button
                      onClick={() => {
                        setTempSavingsValue(currentSavings.toString())
                        setIsEditingSavings(true)
                      }}
                      className="mt-2 flex items-center gap-1"
                    >
                      <p className="text-xl font-bold text-foreground">
                        {formatCurrency(currentSavings)}
                      </p>
                      <Pencil className="h-3 w-3 text-muted-foreground" />
                    </button>
                  )}
                  <p className="mt-1 text-xs text-muted-foreground">
                    Manual savings/assets
                  </p>
                </div>
                <div className="rounded-lg border border-border bg-secondary/50 p-4">
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <DollarSign className="h-4 w-4" />
                    Remaining
                  </div>
                  <p className="mt-1 text-xl font-bold text-foreground">
                    {formatCurrency(remainingAmount)}
                  </p>
                </div>
                <div className="rounded-lg border border-border bg-secondary/50 p-4">
                  <div className="flex items-center justify-between gap-2">
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                      <TrendingUp className="h-4 w-4" />
                      <span className="text-xs">{contributionType === "monthly" ? "Monthly" : "Yearly"}</span>
                    </div>
                    <div className="flex gap-1 rounded-md bg-secondary p-1">
                      <button
                        onClick={() => setContributionType("monthly")}
                        className={`px-1.5 py-0.5 text-xs rounded transition-colors ${contributionType === "monthly"
                            ? "bg-primary text-primary-foreground"
                            : "text-muted-foreground hover:text-foreground"
                          }`}
                      >
                        Mo.
                      </button>
                      <button
                        onClick={() => setContributionType("yearly")}
                        className={`px-1.5 py-0.5 text-xs rounded transition-colors ${contributionType === "yearly"
                            ? "bg-primary text-primary-foreground"
                            : "text-muted-foreground hover:text-foreground"
                          }`}
                      >
                        Yr.
                      </button>
                    </div>
                  </div>
                  {isEditingContribution ? (
                    <div className="mt-2 flex gap-2">
                      <input
                        type="number"
                        value={tempContributionValue}
                        onChange={(e) => setTempContributionValue(e.target.value)}
                        onKeyDown={(e) => {
                          if (e.key === 'Enter') handleSaveContribution()
                        }}
                        className="w-20 rounded border border-border bg-secondary px-1 py-0.5 text-sm"
                        autoFocus
                      />
                      <button
                        onClick={handleSaveContribution}
                        className="rounded bg-primary px-1.5 py-0.5 text-xs text-primary-foreground hover:bg-primary/90"
                      >
                        Save
                      </button>
                    </div>
                  ) : (
                    <button
                      onClick={() => {
                        setTempContributionValue(baseContributionAmount.toString())
                        setIsEditingContribution(true)
                      }}
                      className="mt-2 flex items-center gap-1"
                    >
                      <p className="text-xl font-bold text-foreground">
                        {formatCurrency(displayContributionAmount)}
                      </p>
                      <Pencil className="h-3 w-3 text-muted-foreground" />
                    </button>
                  )}
                </div>
                <div className="rounded-lg border border-border bg-secondary/50 p-4">
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <TrendingUp className="h-4 w-4" />
                    Expected Return
                  </div>
                  {isEditingReturn ? (
                    <div className="mt-2 flex gap-2">
                      <input
                        type="number"
                        value={tempReturnValue}
                        onChange={(e) => setTempReturnValue(e.target.value)}
                        onKeyDown={(e) => {
                          if (e.key === 'Enter') handleSaveReturn()
                        }}
                        min="0"
                        max="100"
                        className="w-16 rounded border border-border bg-secondary px-1 py-0.5 text-sm"
                        autoFocus
                      />
                      <button
                        onClick={handleSaveReturn}
                        className="rounded bg-primary px-1.5 py-0.5 text-xs text-primary-foreground hover:bg-primary/90"
                      >
                        Save
                      </button>
                    </div>
                  ) : (
                    <button
                      onClick={() => {
                        setTempReturnValue(expectedReturn.toString())
                        setIsEditingReturn(true)
                      }}
                      className="mt-2 flex items-center gap-1"
                    >
                      <p className="text-xl font-bold text-foreground">
                        {expectedReturn}% annually
                      </p>
                      <Pencil className="h-3 w-3 text-muted-foreground" />
                    </button>
                  )}
                </div>
                <div className="rounded-lg border border-border bg-secondary/50 p-4">
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <Calendar className="h-4 w-4" />
                    Est. Completion
                  </div>
                  <p className="mt-1 text-xl font-bold text-primary">
                    {projectedCompletion}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Other Assets Section */}
          <Card className="border-border bg-card">
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="text-base">Other Assets</CardTitle>
                  <p className="text-xs text-muted-foreground mt-1">
                    Add external assets like savings accounts, real estate, etc. (Max 10)
                  </p>
                </div>
                <button
                  onClick={() => setShowAddAsset(!showAddAsset)}
                  disabled={assets.length >= 10}
                  className="rounded bg-primary px-3 py-1.5 text-sm text-primary-foreground hover:bg-primary/90 disabled:opacity-50"
                >
                  <Plus className="h-4 w-4 inline mr-1" /> Add Asset
                </button>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              {showAddAsset && (
                <div className="rounded-lg border border-border bg-secondary/50 p-4 space-y-3">
                  <div className="grid gap-3 sm:grid-cols-3">
                    <input
                      type="text"
                      placeholder="Asset name (e.g., High-yield savings)"
                      value={newAssetName}
                      onChange={(e) => setNewAssetName(e.target.value)}
                      className="rounded border border-border bg-secondary px-3 py-2 text-sm"
                    />
                    <input
                      type="number"
                      placeholder="Value ($)"
                      value={newAssetValue}
                      onChange={(e) => setNewAssetValue(e.target.value)}
                      className="rounded border border-border bg-secondary px-3 py-2 text-sm"
                    />
                    <input
                      type="number"
                      placeholder="Return (%)"
                      value={newAssetReturn}
                      onChange={(e) => setNewAssetReturn(e.target.value)}
                      min="0"
                      max="100"
                      className="rounded border border-border bg-secondary px-3 py-2 text-sm"
                    />
                  </div>
                  <div className="flex gap-2">
                    <button
                      onClick={handleAddAsset}
                      className="rounded bg-primary px-4 py-1.5 text-sm text-primary-foreground hover:bg-primary/90"
                    >
                      Save Asset
                    </button>
                    <button
                      onClick={() => {
                        setShowAddAsset(false)
                        setNewAssetName("")
                        setNewAssetValue("")
                        setNewAssetReturn("8")
                      }}
                      className="rounded bg-secondary px-4 py-1.5 text-sm text-foreground hover:bg-secondary/80"
                    >
                      Cancel
                    </button>
                  </div>
                </div>
              )}

              {assets.length === 0 ? (
                <div className="text-center py-6 text-muted-foreground text-sm">
                  No assets added yet. Click "Add Asset" to get started.
                </div>
              ) : (
                <div className="space-y-2">
                  {assets.map((asset) => (
                    <div key={asset.id} className="flex items-center justify-between rounded-lg border border-border bg-secondary/30 p-3">
                      <div className="flex-1 grid grid-cols-3 gap-3 items-center">
                        <div>
                          <p className="font-medium text-foreground">{asset.name}</p>
                        </div>
                        <div className="text-right">
                          <p className="font-bold text-foreground">{formatCurrency(asset.value)}</p>
                        </div>
                        <div className="text-right">
                          <p className="text-sm text-muted-foreground">{asset.expectedReturn}% return</p>
                        </div>
                      </div>
                      <button
                        onClick={() => handleDeleteAsset(asset.id)}
                        className="ml-3 rounded p-1.5 text-red-500 hover:bg-red-500/10"
                        aria-label="Delete asset"
                      >
                        <X className="h-4 w-4" />
                      </button>
                    </div>
                  ))}

                  {totalAssetsValue > 0 && (
                    <div className="rounded-lg border border-primary/30 bg-primary/5 p-3 mt-4">
                      <div className="flex items-center justify-between">
                        <span className="text-sm text-muted-foreground">Total Assets Value:</span>
                        <span className="font-bold text-primary">{formatCurrency(totalAssetsValue)}</span>
                      </div>
                      {assets.length > 1 && (
                        <div className="flex items-center justify-between mt-1">
                          <span className="text-xs text-muted-foreground">Weighted Avg Return:</span>
                          <span className="text-xs text-primary">{weightedAssetReturn.toFixed(2)}%</span>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Portfolio Projection Chart */}
          <Card className="border-border bg-card">
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="text-base">Portfolio Projection</CardTitle>
                <p className="text-xs text-muted-foreground">The gap between lines shows compound growth earnings</p>
              </div>
            </CardHeader>
            <CardContent>
              <div className="h-[350px]">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={projectionData} margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#374151" opacity={0.5} />
                    <XAxis
                      dataKey="date"
                      stroke="#9ca3af"
                      fontSize={12}
                      tick={{ fill: '#d1d5db' }}
                      axisLine={{ stroke: '#4b5563', strokeWidth: 2 }}
                      tickLine={{ stroke: '#4b5563' }}
                    />
                    <YAxis
                      tickFormatter={(v) => `$${(v / 1000).toFixed(0)}k`}
                      stroke="#9ca3af"
                      fontSize={12}
                      tick={{ fill: '#d1d5db' }}
                      axisLine={{ stroke: '#4b5563', strokeWidth: 2 }}
                      tickLine={{ stroke: '#4b5563' }}
                    />
                    <Tooltip
                      contentStyle={{
                        backgroundColor: "hsl(var(--card))",
                        border: "1px solid hsl(var(--border))",
                        borderRadius: "8px",
                      }}
                      formatter={(value: number | null) => value ? [formatCurrency(value), ""] : ["", ""]}
                      labelFormatter={(label) => `Date: ${label}`}
                    />
                    <ReferenceLine
                      y={targetValue}
                      stroke="#22c55e"
                      strokeDasharray="5 5"
                      label={{ value: "Goal", fill: "#22c55e", fontSize: 12 }}
                    />
                    <Line
                      type="monotone"
                      dataKey="actual"
                      name="Current Value"
                      stroke="#22c55e"
                      strokeWidth={2}
                      dot={false}
                      connectNulls={false}
                    />
                    <Line
                      type="monotone"
                      dataKey="invested"
                      name={`Invested Amount (no returns)`}
                      stroke="#6b7280"
                      strokeWidth={2}
                      strokeDasharray="3 3"
                      dot={false}
                      connectNulls={false}
                    />
                    <Line
                      type="monotone"
                      dataKey="projected"
                      name={`Portfolio Value (with ${expectedReturn}% returns)`}
                      stroke="#22c55e"
                      strokeWidth={2}
                      dot={false}
                      connectNulls={false}
                    />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>

          {/* Breakdown Summary */}
          {(() => {
            const totalInvested = monthlyContribution * monthsToGoal
            const compoundGrowth = Math.max(0, targetValue - totalCurrentValue - totalInvested)
            const investedPercent = targetValue > 0 ? (totalInvested / targetValue) * 100 : 0
            const growthPercent = targetValue > 0 ? (compoundGrowth / targetValue) * 100 : 0

            return (
              <Card className="border-border bg-card">
                <CardHeader>
                  <CardTitle className="text-base">Investment Breakdown</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
                    <div className="rounded-lg border border-border bg-secondary/50 p-4">
                      <div className="flex items-center gap-2 text-sm text-muted-foreground">
                        <DollarSign className="h-4 w-4" />
                        Total Invested
                      </div>
                      <p className="mt-1 text-xl font-bold text-foreground">
                        {formatCurrency(totalInvested)}
                      </p>
                      <p className="mt-1 text-xs text-muted-foreground">
                        {investedPercent.toFixed(1)}% of goal
                      </p>
                    </div>
                    <div className="rounded-lg border border-border bg-secondary/50 p-4">
                      <div className="flex items-center gap-2 text-sm text-muted-foreground">
                        <TrendingUp className="h-4 w-4" />
                        Compound Growth
                      </div>
                      <p className="mt-1 text-xl font-bold text-primary">
                        {formatCurrency(compoundGrowth)}
                      </p>
                      <p className="mt-1 text-xs text-muted-foreground">
                        {growthPercent.toFixed(1)}% of goal
                      </p>
                    </div>
                    {totalAssetsValue > 0 && (
                      <div className="rounded-lg border border-border bg-secondary/50 p-4">
                        <div className="flex items-center gap-2 text-sm text-muted-foreground">
                          <DollarSign className="h-4 w-4" />
                          Other Assets
                        </div>
                        <p className="mt-1 text-xl font-bold text-foreground">
                          {formatCurrency(totalAssetsValue)}
                        </p>
                        <p className="mt-1 text-xs text-muted-foreground">
                          {assets.length} asset{assets.length !== 1 ? 's' : ''} tracked
                        </p>
                      </div>
                    )}
                    <div className="rounded-lg border border-border bg-secondary/50 p-4">
                      <div className="flex items-center gap-2 text-sm text-muted-foreground">
                        <Target className="h-4 w-4" />
                        Target Value
                      </div>
                      <p className="mt-1 text-xl font-bold text-foreground">
                        {formatCurrency(targetValue)}
                      </p>
                      <p className="mt-1 text-xs text-muted-foreground">
                        100% goal
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )
          })()}

          {/* Goal Milestones */}
          <Card className="border-border bg-card">
            <CardHeader>
              <CardTitle className="text-base">Milestones</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {generateMilestones(targetValue).map((milestone) => {
                  const achieved = totalCurrentValue >= milestone
                  const progress = Math.min((totalCurrentValue / milestone) * 100, 100)

                  return (
                    <div key={milestone} className="flex items-center gap-4">
                      <div
                        className={`flex h-10 w-10 items-center justify-center rounded-full ${achieved ? "bg-primary text-primary-foreground" : "bg-secondary text-muted-foreground"
                          }`}
                      >
                        {achieved ? (
                          <CheckCircle2 className="h-5 w-5" />
                        ) : (
                          <Target className="h-5 w-5" />
                        )}
                      </div>
                      <div className="flex-1">
                        <div className="flex items-center justify-between">
                          <span className={`font-medium ${achieved ? "text-primary" : "text-foreground"}`}>
                            {formatCurrency(milestone)}
                          </span>
                          <span className="text-sm text-muted-foreground">
                            {achieved ? "Achieved!" : `${progress.toFixed(1)}%`}
                          </span>
                        </div>
                        <Progress value={progress} className="mt-1 h-2" />
                      </div>
                    </div>
                  )
                })}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* ==================== TAB 2: DEBT TRACKER ==================== */}
        <TabsContent value="debts" className="space-y-6">
          {/* Debt Summary Cards */}
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <Card className="border-border bg-card">
              <CardContent className="pt-6">
                <div className="flex items-center gap-2 text-sm text-muted-foreground mb-2">
                  <CreditCard className="h-4 w-4" />
                  Total Debt
                </div>
                <p className="text-2xl font-bold text-red-500">{formatCurrency(totalDebt)}</p>
                <p className="text-xs text-muted-foreground mt-1">{debts.length} debt{debts.length !== 1 ? 's' : ''}</p>
              </CardContent>
            </Card>

            <Card className="border-border bg-card">
              <CardContent className="pt-6">
                <div className="flex items-center gap-2 text-sm text-muted-foreground mb-2">
                  <DollarSign className="h-4 w-4" />
                  Monthly Payment
                </div>
                <p className="text-2xl font-bold text-foreground">{formatCurrency(totalMonthlyDebtPayment)}</p>
                <p className="text-xs text-muted-foreground mt-1">Minimum payments</p>
              </CardContent>
            </Card>

            <Card className="border-border bg-card">
              <CardContent className="pt-6">
                <div className="flex items-center gap-2 text-sm text-muted-foreground mb-2">
                  <TrendingDown className="h-4 w-4" />
                  Annual Interest
                </div>
                <p className="text-2xl font-bold text-orange-500">{formatCurrency(totalAnnualInterest)}</p>
                <p className="text-xs text-muted-foreground mt-1">{formatCurrency(totalMonthlyInterest)}/month</p>
              </CardContent>
            </Card>

            <Card className="border-border bg-card">
              <CardContent className="pt-6">
                <div className="flex items-center gap-2 text-sm text-muted-foreground mb-2">
                  <Activity className="h-4 w-4" />
                  Avg APR
                </div>
                <p className="text-2xl font-bold text-foreground">{weightedAvgAPR.toFixed(2)}%</p>
                <p className="text-xs text-muted-foreground mt-1">Weighted average</p>
              </CardContent>
            </Card>
          </div>

          {/* Add Debt Section */}
          <Card className="border-border bg-card">
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="text-base">Your Debts</CardTitle>
                  <p className="text-xs text-muted-foreground mt-1">Track all your debts in one place (Max 20)</p>
                </div>
                <button
                  onClick={() => setShowAddDebt(!showAddDebt)}
                  disabled={debts.length >= 20}
                  className="rounded bg-primary px-3 py-1.5 text-sm text-primary-foreground hover:bg-primary/90 disabled:opacity-50 flex items-center gap-2"
                >
                  <Plus className="h-4 w-4" /> Add Debt
                </button>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              {showAddDebt && (
                <div className="rounded-lg border border-border bg-secondary/50 p-4 space-y-3">
                  <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                    <input
                      type="text"
                      placeholder="Debt name (e.g., Chase Sapphire)"
                      value={newDebt.name}
                      onChange={(e) => setNewDebt({ ...newDebt, name: e.target.value })}
                      className="rounded border border-border bg-secondary px-3 py-2 text-sm"
                    />
                    <select
                      value={newDebt.type}
                      onChange={(e) => setNewDebt({ ...newDebt, type: e.target.value as Debt['type'] })}
                      className="rounded border border-border bg-secondary px-3 py-2 text-sm"
                    >
                      <option value="Credit Card">Credit Card</option>
                      <option value="Auto Loan">Auto Loan</option>
                      <option value="Mortgage">Mortgage</option>
                      <option value="Student Loan">Student Loan</option>
                      <option value="Personal Loan">Personal Loan</option>
                      <option value="Other">Other</option>
                    </select>
                    <input
                      type="number"
                      placeholder="Balance ($)"
                      value={newDebt.balance || ''}
                      onChange={(e) => setNewDebt({ ...newDebt, balance: Number(e.target.value) })}
                      className="rounded border border-border bg-secondary px-3 py-2 text-sm"
                    />
                    <input
                      type="number"
                      placeholder="APR (%)"
                      value={newDebt.apr || ''}
                      onChange={(e) => setNewDebt({ ...newDebt, apr: Number(e.target.value) })}
                      step="0.01"
                      className="rounded border border-border bg-secondary px-3 py-2 text-sm"
                    />
                    <input
                      type="number"
                      placeholder="Monthly payment ($)"
                      value={newDebt.monthlyPayment || ''}
                      onChange={(e) => setNewDebt({ ...newDebt, monthlyPayment: Number(e.target.value) })}
                      className="rounded border border-border bg-secondary px-3 py-2 text-sm"
                    />
                    <input
                      type="number"
                      placeholder="Minimum payment ($)"
                      value={newDebt.minimumPayment || ''}
                      onChange={(e) => setNewDebt({ ...newDebt, minimumPayment: Number(e.target.value) })}
                      className="rounded border border-border bg-secondary px-3 py-2 text-sm"
                    />
                    <input
                      type="number"
                      placeholder="Loan term (months, optional)"
                      value={newDebt.loanTerm || ''}
                      onChange={(e) => setNewDebt({ ...newDebt, loanTerm: e.target.value ? Number(e.target.value) : undefined })}
                      className="rounded border border-border bg-secondary px-3 py-2 text-sm"
                    />
                  </div>
                  <div className="flex gap-2">
                    <button
                      onClick={handleAddDebt}
                      className="rounded bg-primary px-4 py-1.5 text-sm text-primary-foreground hover:bg-primary/90"
                    >
                      Save Debt
                    </button>
                    <button
                      onClick={() => {
                        setShowAddDebt(false)
                        setNewDebt({
                          name: '',
                          type: 'Credit Card',
                          balance: 0,
                          apr: 0,
                          monthlyPayment: 0,
                          minimumPayment: 0,
                          loanTerm: undefined
                        })
                      }}
                      className="rounded bg-secondary px-4 py-1.5 text-sm text-foreground hover:bg-secondary/80"
                    >
                      Cancel
                    </button>
                  </div>
                </div>
              )}

              {debts.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  <CreditCard className="h-12 w-12 mx-auto mb-3 opacity-50" />
                  <p className="text-sm">No debts tracked yet. Click "Add Debt" to get started.</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {debts.sort((a, b) => b.apr - a.apr).map((debt) => {
                    const monthlyInterest = calculateMonthlyInterest(debt)
                    const annualInterest = calculateAnnualInterest(debt)

                    return (
                      <div key={debt.id} className="rounded-lg border border-border bg-secondary/30 p-4">
                        <div className="flex items-start justify-between">
                          <div className="flex-1">
                            <div className="flex items-center gap-3 mb-2">
                              <h4 className="font-semibold text-foreground">{debt.name}</h4>
                              <span className="text-xs px-2 py-0.5 rounded-full bg-secondary text-muted-foreground">
                                {debt.type}
                              </span>
                              <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${debt.apr > 15 ? 'bg-red-500/20 text-red-500' :
                                  debt.apr > 8 ? 'bg-orange-500/20 text-orange-500' :
                                    'bg-green-500/20 text-green-500'
                                }`}>
                                {debt.apr}% APR
                              </span>
                            </div>
                            <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 text-sm">
                              <div>
                                <p className="text-muted-foreground text-xs">Balance</p>
                                <p className="font-medium text-foreground">{formatCurrency(debt.balance)}</p>
                              </div>
                              <div>
                                <p className="text-muted-foreground text-xs">Monthly Payment</p>
                                <p className="font-medium text-foreground">{formatCurrency(debt.monthlyPayment)}</p>
                              </div>
                              <div>
                                <p className="text-muted-foreground text-xs">Interest/Month</p>
                                <p className="font-medium text-orange-500">{formatCurrency(monthlyInterest)}</p>
                              </div>
                              <div>
                                <p className="text-muted-foreground text-xs">Interest/Year</p>
                                <p className="font-medium text-red-500">{formatCurrency(annualInterest)}</p>
                              </div>
                            </div>
                            {debt.loanTerm && (
                              <p className="text-xs text-muted-foreground mt-2">
                                Loan Term: {debt.loanTerm} months ({(debt.loanTerm / 12).toFixed(1)} years)
                              </p>
                            )}
                          </div>
                          <button
                            onClick={() => handleDeleteDebt(debt.id)}
                            className="ml-4 p-2 rounded hover:bg-red-500/10 text-red-500"
                            aria-label="Delete debt"
                          >
                            <Trash2 className="h-4 w-4" />
                          </button>
                        </div>
                      </div>
                    )
                  })}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Debt Breakdown & Payoff Strategy */}
          {debts.length > 0 && (
            <>
              <div className="grid gap-6 lg:grid-cols-2">
                {/* Debt Breakdown Pie Chart */}
                <Card className="border-border bg-card">
                  <CardHeader>
                    <CardTitle className="text-base">Debt Breakdown by Type</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="h-[300px] flex items-center justify-center">
                      <ResponsiveContainer width="100%" height="100%">
                        <PieChart>
                          <Pie
                            data={debtPieData}
                            cx="50%"
                            cy="50%"
                            labelLine={false}
                            label={({ name, percent }) => `${name}: ${percent.toFixed(1)}%`}
                            outerRadius={100}
                            fill="#8884d8"
                            dataKey="value"
                          >
                            {debtPieData.map((entry, index) => (
                              <Cell key={`cell-${index}`} fill={DEBT_COLORS[entry.name as keyof typeof DEBT_COLORS] || '#6b7280'} />
                            ))}
                          </Pie>
                          <Tooltip
                            contentStyle={{
                              backgroundColor: "hsl(var(--card))",
                              border: "1px solid hsl(var(--border))",
                              borderRadius: "8px",
                            }}
                            formatter={(value: number) => [formatCurrency(value), 'Amount']}
                          />
                        </PieChart>
                      </ResponsiveContainer>
                    </div>
                    <div className="grid grid-cols-2 gap-2 mt-4">
                      {debtPieData.map((item) => (
                        <div key={item.name} className="flex items-center gap-2">
                          <div
                            className="w-3 h-3 rounded-full"
                            style={{ backgroundColor: DEBT_COLORS[item.name as keyof typeof DEBT_COLORS] || '#6b7280' }}
                          />
                          <span className="text-xs text-muted-foreground">{item.name}</span>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>

                {/* Interest Cost Breakdown */}
                <Card className="border-border bg-card">
                  <CardHeader>
                    <CardTitle className="text-base">Interest Cost by Debt</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="h-[300px]">
                      <ResponsiveContainer width="100%" height="100%">
                        <BarChart data={debts.sort((a, b) => calculateAnnualInterest(b) - calculateAnnualInterest(a))}>
                          <CartesianGrid strokeDasharray="3 3" stroke="#374151" opacity={0.5} />
                          <XAxis
                            dataKey="name"
                            fontSize={10}
                            angle={-45}
                            textAnchor="end"
                            height={80}
                            stroke="#9ca3af"
                          />
                          <YAxis
                            tickFormatter={(v) => `$${(v / 1000).toFixed(0)}k`}
                            fontSize={12}
                            stroke="#9ca3af"
                          />
                          <Tooltip
                            contentStyle={{
                              backgroundColor: "hsl(var(--card))",
                              border: "1px solid hsl(var(--border))",
                              borderRadius: "8px",
                            }}
                            formatter={(value: number) => [formatCurrency(value), 'Annual Interest']}
                          />
                          <Bar dataKey={(debt: Debt) => calculateAnnualInterest(debt)} fill="#f97316" radius={[8, 8, 0, 0]} />
                        </BarChart>
                      </ResponsiveContainer>
                    </div>
                  </CardContent>
                </Card>
              </div>

              {/* Payoff Strategy Comparison */}
              <Card className="border-border bg-card">
                <CardHeader>
                  <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                    <div>
                      <CardTitle className="text-base">Payoff Strategy Comparison</CardTitle>
                      <p className="text-xs text-muted-foreground mt-1">
                        Compare different debt payoff methods and see which saves you the most
                      </p>
                    </div>
                    <div className="flex flex-col sm:flex-row gap-3">
                      <div className="flex items-center gap-2">
                        <label className="text-xs text-muted-foreground whitespace-nowrap">Extra Payment:</label>
                        <input
                          type="number"
                          value={extraDebtPayment}
                          onChange={(e) => setExtraDebtPayment(Number(e.target.value))}
                          placeholder="0"
                          className="w-24 rounded border border-border bg-secondary px-2 py-1 text-sm"
                        />
                      </div>
                      <div className="flex gap-2">
                        <button
                          onClick={() => setPayoffStrategy('avalanche')}
                          className={`px-3 py-1.5 text-xs rounded transition-colors ${payoffStrategy === 'avalanche'
                              ? 'bg-primary text-primary-foreground'
                              : 'bg-secondary text-foreground hover:bg-secondary/80'
                            }`}
                        >
                          Avalanche
                        </button>
                        <button
                          onClick={() => setPayoffStrategy('snowball')}
                          className={`px-3 py-1.5 text-xs rounded transition-colors ${payoffStrategy === 'snowball'
                              ? 'bg-primary text-primary-foreground'
                              : 'bg-secondary text-foreground hover:bg-secondary/80'
                            }`}
                        >
                          Snowball
                        </button>
                      </div>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="grid gap-4 sm:grid-cols-3 mb-6">
                    {/* Avalanche Method */}
                    <div className="rounded-lg border border-border bg-secondary/50 p-4">
                      <h4 className="text-sm font-semibold text-foreground mb-2 flex items-center gap-2">
                        <Zap className="h-4 w-4 text-orange-500" />
                        Avalanche (Highest APR First)
                      </h4>
                      <div className="space-y-2">
                        <div>
                          <p className="text-xs text-muted-foreground">Payoff Time</p>
                          <p className="font-bold text-foreground">{avalancheSchedule.length} months</p>
                        </div>
                        <div>
                          <p className="text-xs text-muted-foreground">Total Interest</p>
                          <p className="font-bold text-red-500">
                            {formatCurrency(avalancheSchedule[avalancheSchedule.length - 1]?.totalInterestPaid || 0)}
                          </p>
                        </div>
                        <p className="text-xs text-muted-foreground mt-2">
                          ✅ Mathematically optimal - saves the most money
                        </p>
                      </div>
                    </div>

                    {/* Snowball Method */}
                    <div className="rounded-lg border border-border bg-secondary/50 p-4">
                      <h4 className="text-sm font-semibold text-foreground mb-2 flex items-center gap-2">
                        <Activity className="h-4 w-4 text-blue-500" />
                        Snowball (Smallest Balance First)
                      </h4>
                      <div className="space-y-2">
                        <div>
                          <p className="text-xs text-muted-foreground">Payoff Time</p>
                          <p className="font-bold text-foreground">{snowballSchedule.length} months</p>
                        </div>
                        <div>
                          <p className="text-xs text-muted-foreground">Total Interest</p>
                          <p className="font-bold text-red-500">
                            {formatCurrency(snowballSchedule[snowballSchedule.length - 1]?.totalInterestPaid || 0)}
                          </p>
                        </div>
                        <p className="text-xs text-muted-foreground mt-2">
                          ✅ Psychological wins - quick victories motivate you
                        </p>
                      </div>
                    </div>

                    {/* Comparison */}
                    <div className="rounded-lg border border-primary/30 bg-primary/5 p-4">
                      <h4 className="text-sm font-semibold text-primary mb-2 flex items-center gap-2">
                        <Target className="h-4 w-4" />
                        Recommendation
                      </h4>
                      <div className="space-y-2">
                        <div>
                          <p className="text-xs text-muted-foreground">Best Method</p>
                          <p className="font-bold text-primary">
                            {avalancheSchedule[avalancheSchedule.length - 1]?.totalInterestPaid <
                              snowballSchedule[snowballSchedule.length - 1]?.totalInterestPaid
                              ? 'Avalanche'
                              : 'Snowball'}
                          </p>
                        </div>
                        <div>
                          <p className="text-xs text-muted-foreground">Savings</p>
                          <p className="font-bold text-green-500">
                            {formatCurrency(Math.abs(
                              (avalancheSchedule[avalancheSchedule.length - 1]?.totalInterestPaid || 0) -
                              (snowballSchedule[snowballSchedule.length - 1]?.totalInterestPaid || 0)
                            ))}
                          </p>
                        </div>
                        <p className="text-xs text-muted-foreground mt-2">
                          Using avalanche saves more in interest!
                        </p>
                      </div>
                    </div>
                  </div>

                  {/* Payoff Priority Order */}
                  <div className="mt-6">
                    <h4 className="text-sm font-semibold text-foreground mb-3">
                      {payoffStrategy === 'avalanche' ? 'Avalanche' : 'Snowball'} Payoff Order:
                    </h4>
                    <div className="space-y-2">
                      {(payoffStrategy === 'avalanche'
                        ? [...debts].sort((a, b) => b.apr - a.apr)
                        : [...debts].sort((a, b) => a.balance - b.balance)
                      ).map((debt, index) => (
                        <div key={debt.id} className="flex items-center gap-3 p-3 rounded-lg bg-secondary/30">
                          <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary text-primary-foreground font-bold text-sm">
                            {index + 1}
                          </div>
                          <div className="flex-1 grid grid-cols-3 gap-4 text-sm">
                            <div>
                              <p className="font-medium text-foreground">{debt.name}</p>
                              <p className="text-xs text-muted-foreground">{debt.type}</p>
                            </div>
                            <div>
                              <p className="text-foreground">{formatCurrency(debt.balance)}</p>
                              <p className="text-xs text-muted-foreground">Balance</p>
                            </div>
                            <div>
                              <p className={`font-medium ${debt.apr > 15 ? 'text-red-500' :
                                  debt.apr > 8 ? 'text-orange-500' :
                                    'text-green-500'
                                }`}>
                                {debt.apr}% APR
                              </p>
                              <p className="text-xs text-muted-foreground">
                                {formatCurrency(calculateAnnualInterest(debt))}/year interest
                              </p>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </CardContent>
              </Card>
            </>
          )}
        </TabsContent>

        {/* ==================== TAB 3: FINANCIAL OVERVIEW ==================== */}
        <TabsContent value="overview" className="space-y-6">
          {/* Settings Toggles */}
          <Card className="border-border bg-card">
            <CardHeader>
              <CardTitle className="text-base">Data Sources</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex flex-wrap gap-4">
                <div className="flex items-center gap-2 rounded-lg border border-border bg-secondary/50 px-4 py-2">
                  <span className="text-sm text-muted-foreground">Include Portfolio</span>
                  <button
                    onClick={() => setIncludePortfolioInOverview(!includePortfolioInOverview)}
                    className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${includePortfolioInOverview ? 'bg-primary' : 'bg-gray-600'
                      }`}
                  >
                    <span
                      className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${includePortfolioInOverview ? 'translate-x-6' : 'translate-x-1'
                        }`}
                    />
                  </button>
                  <span className={`text-sm font-medium ${includePortfolioInOverview ? 'text-primary' : 'text-muted-foreground'}`}>
                    {includePortfolioInOverview ? 'ON' : 'OFF'}
                  </span>
                </div>

                <div className="flex items-center gap-2 rounded-lg border border-border bg-secondary/50 px-4 py-2">
                  <span className="text-sm text-muted-foreground">Include Dividends</span>
                  <button
                    onClick={() => setIncludeDividendsInOverview(!includeDividendsInOverview)}
                    disabled={!includePortfolioInOverview}
                    className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${includeDividendsInOverview && includePortfolioInOverview ? 'bg-primary' : 'bg-gray-600'
                      } ${!includePortfolioInOverview ? 'opacity-50 cursor-not-allowed' : ''}`}
                  >
                    <span
                      className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${includeDividendsInOverview && includePortfolioInOverview ? 'translate-x-6' : 'translate-x-1'
                        }`}
                    />
                  </button>
                  <span className={`text-sm font-medium ${includeDividendsInOverview && includePortfolioInOverview ? 'text-primary' : 'text-muted-foreground'}`}>
                    {includeDividendsInOverview && includePortfolioInOverview ? 'ON' : 'OFF'}
                  </span>
                </div>

                <div className="flex items-center gap-2">
                  <label className="text-sm text-muted-foreground">Monthly Income:</label>
                  <input
                    type="number"
                    value={monthlyIncome}
                    onChange={(e) => setMonthlyIncome(Number(e.target.value))}
                    className="w-28 rounded border border-border bg-secondary px-2 py-1 text-sm"
                  />
                </div>

                <div className="flex items-center gap-2">
                  <label className="text-sm text-muted-foreground">Monthly Expenses:</label>
                  <input
                    type="number"
                    value={monthlyExpenses}
                    onChange={(e) => setMonthlyExpenses(Number(e.target.value))}
                    className="w-28 rounded border border-border bg-secondary px-2 py-1 text-sm"
                  />
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Financial Health Score */}
          <Card className="border-border bg-card">
            <CardHeader>
              <CardTitle className="text-base flex items-center gap-2">
                <Shield className="h-5 w-5 text-primary" />
                Financial Health Score
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex flex-col items-center justify-center py-6">
                <div className="relative">
                  <svg className="transform -rotate-90" width="200" height="200">
                    <circle
                      cx="100"
                      cy="100"
                      r="90"
                      stroke="hsl(var(--border))"
                      strokeWidth="12"
                      fill="none"
                    />
                    <circle
                      cx="100"
                      cy="100"
                      r="90"
                      stroke={healthScore >= 80 ? '#22c55e' : healthScore >= 60 ? '#eab308' : '#ef4444'}
                      strokeWidth="12"
                      fill="none"
                      strokeDasharray={`${(healthScore / 100) * 565.48} 565.48`}
                      strokeLinecap="round"
                    />
                  </svg>
                  <div className="absolute inset-0 flex flex-col items-center justify-center">
                    <p className="text-5xl font-bold text-foreground">{healthScore}</p>
                    <p className="text-sm text-muted-foreground">out of 100</p>
                  </div>
                </div>
                <p className={`mt-4 text-lg font-semibold ${healthScore >= 80 ? 'text-green-500' :
                    healthScore >= 60 ? 'text-yellow-500' :
                      'text-red-500'
                  }`}>
                  {healthScore >= 80 ? 'Excellent' : healthScore >= 60 ? 'Good' : healthScore >= 40 ? 'Fair' : 'Needs Improvement'}
                </p>
              </div>

              <div className="mt-6 space-y-3">
                <div className="flex items-center justify-between p-3 rounded-lg bg-secondary/30">
                  <span className="text-sm text-foreground">Debt-to-Income Ratio</span>
                  <span className={`font-medium ${debtToIncomeRatio > 35 ? 'text-red-500' : debtToIncomeRatio > 20 ? 'text-yellow-500' : 'text-green-500'}`}>
                    {debtToIncomeRatio.toFixed(1)}%
                  </span>
                </div>
                <div className="flex items-center justify-between p-3 rounded-lg bg-secondary/30">
                  <span className="text-sm text-foreground">Emergency Fund</span>
                  <span className={`font-medium ${emergencyFundMonths < 3 ? 'text-red-500' : emergencyFundMonths < 6 ? 'text-yellow-500' : 'text-green-500'}`}>
                    {emergencyFundMonths.toFixed(1)} months
                  </span>
                </div>
                <div className="flex items-center justify-between p-3 rounded-lg bg-secondary/30">
                  <span className="text-sm text-foreground">Net Worth</span>
                  <span className={`font-medium ${netWorth < 0 ? 'text-red-500' : 'text-green-500'}`}>
                    {formatCurrency(netWorth)}
                  </span>
                </div>
                <div className="flex items-center justify-between p-3 rounded-lg bg-secondary/30">
                  <span className="text-sm text-foreground">Monthly Cash Flow</span>
                  <span className={`font-medium ${monthlyNetCashFlow < 0 ? 'text-red-500' : 'text-green-500'}`}>
                    {monthlyNetCashFlow >= 0 ? '+' : ''}{formatCurrency(monthlyNetCashFlow)}
                  </span>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Investment Returns vs Debt Costs */}
          <Card className="border-border bg-card">
            <CardHeader>
              <CardTitle className="text-base">Investment Returns vs Debt Costs</CardTitle>
              <p className="text-xs text-muted-foreground">Compare what you're earning vs what you're paying</p>
            </CardHeader>
            <CardContent>
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="rounded-lg border-2 border-green-500/30 bg-green-500/5 p-6">
                  <div className="flex items-center gap-2 mb-4">
                    <TrendingUp className="h-5 w-5 text-green-500" />
                    <h4 className="font-semibold text-foreground">Earning (Annual)</h4>
                  </div>
                  <p className="text-3xl font-bold text-green-500 mb-4">
                    {formatCurrency(portfolioAnnualReturnDollars + dividendIncome)}
                  </p>
                  <div className="space-y-2 text-sm">
                    {includePortfolioInOverview && (
                      <>
                        <div className="flex justify-between">
                          <span className="text-muted-foreground">Portfolio Returns ({portfolioAnnualReturn.toFixed(1)}%)</span>
                          <span className="font-medium text-foreground">{formatCurrency(portfolioAnnualReturnDollars)}</span>
                        </div>
                        {includeDividendsInOverview && (
                          <div className="flex justify-between">
                            <span className="text-muted-foreground">Dividends</span>
                            <span className="font-medium text-foreground">{formatCurrency(dividendIncome)}</span>
                          </div>
                        )}
                      </>
                    )}
                  </div>
                </div>

                <div className="rounded-lg border-2 border-red-500/30 bg-red-500/5 p-6">
                  <div className="flex items-center gap-2 mb-4">
                    <TrendingDown className="h-5 w-5 text-red-500" />
                    <h4 className="font-semibold text-foreground">Paying (Annual)</h4>
                  </div>
                  <p className="text-3xl font-bold text-red-500 mb-4">
                    {formatCurrency(totalAnnualInterest)}
                  </p>
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Debt Interest ({weightedAvgAPR.toFixed(1)}% avg)</span>
                      <span className="font-medium text-foreground">{formatCurrency(totalAnnualInterest)}</span>
                    </div>
                  </div>
                </div>
              </div>

              <div className="mt-6 rounded-lg border border-border bg-secondary/50 p-4">
                <div className="flex items-center justify-between">
                  <span className="font-semibold text-foreground">Net Annual Benefit:</span>
                  <span className={`text-2xl font-bold ${(portfolioAnnualReturnDollars + dividendIncome - totalAnnualInterest) >= 0
                      ? 'text-green-500'
                      : 'text-red-500'
                    }`}>
                    {(portfolioAnnualReturnDollars + dividendIncome - totalAnnualInterest) >= 0 ? '+' : ''}
                    {formatCurrency(portfolioAnnualReturnDollars + dividendIncome - totalAnnualInterest)}
                  </span>
                </div>
                {totalAnnualInterest > portfolioAnnualReturnDollars + dividendIncome && (
                  <p className="mt-3 text-sm text-orange-500 flex items-center gap-2">
                    <AlertTriangle className="h-4 w-4" />
                    Your debt costs more than you're earning from investments! Consider paying down high-interest debt first.
                  </p>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Risk Indicators */}
          <Card className="border-border bg-card">
            <CardHeader>
              <CardTitle className="text-base flex items-center gap-2">
                <AlertTriangle className="h-5 w-5 text-orange-500" />
                Risk Indicators
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-muted-foreground">Debt-to-Income</span>
                    <span className={`font-bold ${debtToIncomeRatio > 50 ? 'text-red-500' :
                        debtToIncomeRatio > 35 ? 'text-orange-500' :
                          debtToIncomeRatio > 20 ? 'text-yellow-500' :
                            'text-green-500'
                      }`}>
                      {debtToIncomeRatio.toFixed(1)}%
                    </span>
                  </div>
                  <Progress
                    value={Math.min(debtToIncomeRatio, 100)}
                    className="h-2"
                  />
                  <p className="text-xs text-muted-foreground">
                    {debtToIncomeRatio < 20 ? '✅ Excellent' :
                      debtToIncomeRatio < 35 ? '⚠️ Moderate' :
                        debtToIncomeRatio < 50 ? '❌ High Risk' :
                          '🚨 Danger'}
                  </p>
                </div>

                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-muted-foreground">Debt-to-Asset</span>
                    <span className={`font-bold ${debtToAssetRatio > 60 ? 'text-red-500' :
                        debtToAssetRatio > 30 ? 'text-yellow-500' :
                          'text-green-500'
                      }`}>
                      {debtToAssetRatio.toFixed(1)}%
                    </span>
                  </div>
                  <Progress
                    value={Math.min(debtToAssetRatio, 100)}
                    className="h-2"
                  />
                  <p className="text-xs text-muted-foreground">
                    {debtToAssetRatio < 30 ? '✅ Good' :
                      debtToAssetRatio < 60 ? '⚠️ Moderate' :
                        '❌ High'}
                  </p>
                </div>

                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-muted-foreground">Emergency Fund</span>
                    <span className={`font-bold ${emergencyFundMonths < 3 ? 'text-red-500' :
                        emergencyFundMonths < 6 ? 'text-yellow-500' :
                          'text-green-500'
                      }`}>
                      {emergencyFundMonths.toFixed(1)}mo
                    </span>
                  </div>
                  <Progress
                    value={Math.min((emergencyFundMonths / 6) * 100, 100)}
                    className="h-2"
                  />
                  <p className="text-xs text-muted-foreground">
                    {emergencyFundMonths >= 6 ? '✅ Safe' :
                      emergencyFundMonths >= 3 ? '⚠️ Moderate' :
                        '❌ Risky'}
                  </p>
                </div>

                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-muted-foreground">Leverage Ratio</span>
                    <span className={`font-bold ${leverageRatio > 2 ? 'text-red-500' :
                        leverageRatio > 1 ? 'text-yellow-500' :
                          'text-green-500'
                      }`}>
                      {leverageRatio.toFixed(2)}x
                    </span>
                  </div>
                  <Progress
                    value={Math.min((leverageRatio / 3) * 100, 100)}
                    className="h-2"
                  />
                  <p className="text-xs text-muted-foreground">
                    {leverageRatio < 1 ? '✅ Conservative' :
                      leverageRatio < 2 ? '⚠️ Moderate' :
                        '❌ Aggressive'}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Balance Sheet */}
          <Card className="border-border bg-card">
            <CardHeader>
              <CardTitle className="text-base">Balance Sheet</CardTitle>
              <p className="text-xs text-muted-foreground">Your financial position snapshot</p>
            </CardHeader>
            <CardContent>
              <div className="grid gap-6 lg:grid-cols-2">
                {/* Assets */}
                <div>
                  <h4 className="font-semibold text-green-500 mb-3 flex items-center gap-2">
                    <TrendingUp className="h-4 w-4" />
                    ASSETS
                  </h4>
                  <div className="space-y-2">
                    {includePortfolioInOverview && (
                      <div className="flex justify-between p-2 rounded bg-secondary/30">
                        <span className="text-sm text-muted-foreground">Investment Portfolio</span>
                        <span className="font-medium text-foreground">{formatCurrency(portfolioValue)}</span>
                      </div>
                    )}
                    <div className="flex justify-between p-2 rounded bg-secondary/30">
                      <span className="text-sm text-muted-foreground">Cash & Savings</span>
                      <span className="font-medium text-foreground">{formatCurrency(currentSavings)}</span>
                    </div>
                    {totalAssetsValue > 0 && (
                      <div className="flex justify-between p-2 rounded bg-secondary/30">
                        <span className="text-sm text-muted-foreground">Other Assets</span>
                        <span className="font-medium text-foreground">{formatCurrency(totalAssetsValue)}</span>
                      </div>
                    )}
                    <div className="flex justify-between p-3 rounded bg-green-500/10 border border-green-500/30 mt-3">
                      <span className="font-semibold text-foreground">Total Assets</span>
                      <span className="font-bold text-green-500">{formatCurrency(totalAssets)}</span>
                    </div>
                  </div>
                </div>

                {/* Liabilities */}
                <div>
                  <h4 className="font-semibold text-red-500 mb-3 flex items-center gap-2">
                    <TrendingDown className="h-4 w-4" />
                    LIABILITIES
                  </h4>
                  <div className="space-y-2">
                    {debts.length > 0 ? (
                      <>
                        {Object.entries(debtByType).map(([type, amount]) => (
                          <div key={type} className="flex justify-between p-2 rounded bg-secondary/30">
                            <span className="text-sm text-muted-foreground">{type}</span>
                            <span className="font-medium text-foreground">{formatCurrency(amount)}</span>
                          </div>
                        ))}
                      </>
                    ) : (
                      <div className="flex justify-between p-2 rounded bg-secondary/30">
                        <span className="text-sm text-muted-foreground">No Debts</span>
                        <span className="font-medium text-green-500">$0</span>
                      </div>
                    )}
                    <div className="flex justify-between p-3 rounded bg-red-500/10 border border-red-500/30 mt-3">
                      <span className="font-semibold text-foreground">Total Liabilities</span>
                      <span className="font-bold text-red-500">{formatCurrency(totalLiabilities)}</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Net Worth */}
              <div className="mt-6 p-6 rounded-lg bg-gradient-to-r from-primary/10 to-primary/5 border-2 border-primary/30">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-muted-foreground mb-1">NET WORTH</p>
                    <p className={`text-4xl font-bold ${netWorth >= 0 ? 'text-green-500' : 'text-red-500'}`}>
                      {formatCurrency(netWorth)}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="text-xs text-muted-foreground">Assets - Liabilities</p>
                    <p className="text-sm text-muted-foreground mt-1">
                      {formatCurrency(totalAssets)} - {formatCurrency(totalLiabilities)}
                    </p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Cash Flow Statement */}
          <Card className="border-border bg-card">
            <CardHeader>
              <CardTitle className="text-base">Cash Flow Statement</CardTitle>
              <p className="text-xs text-muted-foreground">Monthly and annual cash flow breakdown</p>
            </CardHeader>
            <CardContent>
              <div className="grid gap-6 lg:grid-cols-2">
                {/* Monthly */}
                <div>
                  <h4 className="font-semibold text-foreground mb-3">Monthly</h4>
                  <div className="space-y-3">
                    <div>
                      <p className="text-xs text-muted-foreground mb-2">INFLOWS</p>
                      <div className="space-y-1">
                        <div className="flex justify-between text-sm">
                          <span className="text-muted-foreground">Salary/Income</span>
                          <span className="text-green-500">+{formatCurrency(monthlyIncome)}</span>
                        </div>
                        {includePortfolioInOverview && includeDividendsInOverview && (
                          <div className="flex justify-between text-sm">
                            <span className="text-muted-foreground">Dividends</span>
                            <span className="text-green-500">+{formatCurrency(dividendIncome / 12)}</span>
                          </div>
                        )}
                      </div>
                    </div>

                    <div>
                      <p className="text-xs text-muted-foreground mb-2">OUTFLOWS</p>
                      <div className="space-y-1">
                        <div className="flex justify-between text-sm">
                          <span className="text-muted-foreground">Living Expenses</span>
                          <span className="text-red-500">-{formatCurrency(monthlyExpenses)}</span>
                        </div>
                        <div className="flex justify-between text-sm">
                          <span className="text-muted-foreground">Debt Payments</span>
                          <span className="text-red-500">-{formatCurrency(totalMonthlyDebtPayment)}</span>
                        </div>
                        <div className="flex justify-between text-sm">
                          <span className="text-muted-foreground">Investments</span>
                          <span className="text-red-500">-{formatCurrency(monthlyContribution)}</span>
                        </div>
                      </div>
                    </div>

                    <div className="flex justify-between p-3 rounded bg-primary/10 border border-primary/30">
                      <span className="font-semibold text-foreground">Net Cash Flow</span>
                      <span className={`font-bold ${monthlyNetCashFlow >= 0 ? 'text-green-500' : 'text-red-500'}`}>
                        {monthlyNetCashFlow >= 0 ? '+' : ''}{formatCurrency(monthlyNetCashFlow)}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Annual */}
                <div>
                  <h4 className="font-semibold text-foreground mb-3">Annual</h4>
                  <div className="space-y-3">
                    <div>
                      <p className="text-xs text-muted-foreground mb-2">INFLOWS</p>
                      <div className="space-y-1">
                        <div className="flex justify-between text-sm">
                          <span className="text-muted-foreground">Salary/Income</span>
                          <span className="text-green-500">+{formatCurrency(annualIncome)}</span>
                        </div>
                        {includePortfolioInOverview && (
                          <div className="flex justify-between text-sm">
                            <span className="text-muted-foreground">Portfolio Returns</span>
                            <span className="text-green-500">+{formatCurrency(portfolioAnnualReturnDollars)}</span>
                          </div>
                        )}
                        {includePortfolioInOverview && includeDividendsInOverview && (
                          <div className="flex justify-between text-sm">
                            <span className="text-muted-foreground">Dividends</span>
                            <span className="text-green-500">+{formatCurrency(dividendIncome)}</span>
                          </div>
                        )}
                      </div>
                    </div>

                    <div>
                      <p className="text-xs text-muted-foreground mb-2">OUTFLOWS</p>
                      <div className="space-y-1">
                        <div className="flex justify-between text-sm">
                          <span className="text-muted-foreground">Living Expenses</span>
                          <span className="text-red-500">-{formatCurrency(annualExpenses)}</span>
                        </div>
                        <div className="flex justify-between text-sm">
                          <span className="text-muted-foreground">Debt Interest</span>
                          <span className="text-red-500">-{formatCurrency(totalAnnualInterest)}</span>
                        </div>
                        <div className="flex justify-between text-sm">
                          <span className="text-muted-foreground">Investments</span>
                          <span className="text-red-500">-{formatCurrency(annualInvestmentContributions)}</span>
                        </div>
                      </div>
                    </div>

                    <div className="flex justify-between p-3 rounded bg-primary/10 border border-primary/30">
                      <span className="font-semibold text-foreground">Net Cash Flow</span>
                      <span className={`font-bold ${netAnnualCashFlow >= 0 ? 'text-green-500' : 'text-red-500'}`}>
                        {netAnnualCashFlow >= 0 ? '+' : ''}{formatCurrency(netAnnualCashFlow)}
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Opportunity Cost */}
          {totalDebt > 0 && (
            <Card className="border-border bg-card border-orange-500/30">
              <CardHeader>
                <CardTitle className="text-base flex items-center gap-2">
                  <Zap className="h-5 w-5 text-orange-500" />
                  Opportunity Cost Analysis
                </CardTitle>
                <p className="text-xs text-muted-foreground">What your debt is really costing you</p>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="p-4 rounded-lg bg-orange-500/10 border border-orange-500/30">
                    <p className="text-sm text-muted-foreground mb-2">
                      You're paying <span className="font-bold text-orange-500">{formatCurrency(totalAnnualInterest)}</span> per year in debt interest.
                    </p>
                    <p className="text-sm text-foreground">
                      💡 If you paid off your debt and invested that money instead at {expectedReturn}% return:
                    </p>
                  </div>

                  <div className="grid gap-4 sm:grid-cols-3">
                    <div className="p-4 rounded-lg bg-secondary/50">
                      <p className="text-xs text-muted-foreground mb-1">In 10 years</p>
                      <p className="text-xl font-bold text-primary">
                        {formatCurrency(totalAnnualInterest * ((Math.pow(1 + expectedReturn / 100, 10) - 1) / (expectedReturn / 100)))}
                      </p>
                    </div>
                    <div className="p-4 rounded-lg bg-secondary/50">
                      <p className="text-xs text-muted-foreground mb-1">In 20 years</p>
                      <p className="text-xl font-bold text-primary">
                        {formatCurrency(totalAnnualInterest * ((Math.pow(1 + expectedReturn / 100, 20) - 1) / (expectedReturn / 100)))}
                      </p>
                    </div>
                    <div className="p-4 rounded-lg bg-secondary/50">
                      <p className="text-xs text-muted-foreground mb-1">In 30 years</p>
                      <p className="text-xl font-bold text-primary">
                        {formatCurrency(totalAnnualInterest * ((Math.pow(1 + expectedReturn / 100, 30) - 1) / (expectedReturn / 100)))}
                      </p>
                    </div>
                  </div>

                  <div className="p-4 rounded-lg bg-red-500/10 border border-red-500/30">
                    <p className="text-sm font-semibold text-red-500">
                      🚨 Your high-interest debt is costing you{' '}
                      <span className="text-lg">
                        {formatCurrency(totalAnnualInterest * ((Math.pow(1 + expectedReturn / 100, 30) - 1) / (expectedReturn / 100)))}
                      </span>{' '}
                      in future wealth over 30 years!
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}
        </TabsContent>
      </Tabs>
    </div>
  )
}
