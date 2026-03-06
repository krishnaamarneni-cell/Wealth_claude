"use client"

import { useState, useMemo, useRef } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Progress } from "@/components/ui/progress"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, ReferenceLine } from "recharts"
import { usePortfolio } from "@/lib/portfolio-context"
import {
  Target, TrendingUp, Calendar, DollarSign, Pencil, X, CreditCard,
  AlertTriangle, TrendingDown, PieChart as PieChartIcon, Activity,
  CheckCircle2, Plus, Shield, Zap, Snowflake, Flame, BarChart3,
  Upload, Download, FileText, Trash2
} from "lucide-react"

// ==================== TYPES ====================

type Asset = {
  id: string
  name: string
  value: number
  expectedReturn: number
}

type DebtType = 'Credit Card' | 'Auto Loan' | 'Mortgage' | 'Student Loan' | 'Personal Loan' | 'Other'

type Debt = {
  id: string
  name: string
  type: DebtType
  balance: number
  apr: number
  monthlyPayment: number
  minimumPayment: number
  loanTerm?: number
  attachedFiles?: { name: string; type: string; data?: string }[]
}

type PayoffStrategy = 'avalanche' | 'snowball' | 'hybrid'

type PayoffResult = {
  totalMonths: number
  totalInterestPaid: number
  monthlySchedule: Array<{
    month: number
    debts: Array<{ id: string; name: string; balance: number; payment: number; interest: number }>
    totalBalance: number
    totalInterestPaid: number
  }>
  debtFreeDate: string
}

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

function calculatePayoffPlan(debts: Debt[], strategy: PayoffStrategy, extraPayment: number): PayoffResult {
  // Sort debts based on strategy
  const sortedDebts = [...debts].sort((a, b) => {
    if (strategy === 'avalanche') return b.apr - a.apr
    if (strategy === 'snowball') return a.balance - b.balance
    // Hybrid: prioritize high APR cards with smaller balances
    // Score = APR * (1 / balance) — higher score = higher priority
    if (strategy === 'hybrid') {
      const scoreA = a.balance > 0 ? (a.apr / a.balance) * 10000 : 0
      const scoreB = b.balance > 0 ? (b.apr / b.balance) * 10000 : 0
      return scoreB - scoreA
    }
    return 0
  })

  const schedule: PayoffResult['monthlySchedule'] = []
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

    let availableExtra = extraPayment

    // First pass: freed-up payments from paid-off debts go to extra
    currentDebts.forEach((debt) => {
      if (debt.balance <= 0) {
        availableExtra += debt.monthlyPayment
      }
    })

    // Reset freed payments (we'll handle in the loop)
    availableExtra = extraPayment
    const paidOffPayments = currentDebts
      .filter(d => d.balance <= 0)
      .reduce((sum, d) => sum + d.monthlyPayment, 0)
    availableExtra += paidOffPayments

    currentDebts.forEach((debt, index) => {
      if (debt.balance <= 0) {
        monthData.debts.push({ id: debt.id, name: debt.name, balance: 0, payment: 0, interest: 0 })
        return
      }

      const monthlyInterest = (debt.balance * (debt.apr / 100)) / 12
      let payment = debt.monthlyPayment

      // Add extra payment to the first non-zero balance debt
      if (index === currentDebts.findIndex(d => d.balance > 0) && availableExtra > 0) {
        payment += availableExtra
        availableExtra = 0
      }

      // Don't pay more than the remaining balance + interest
      payment = Math.min(payment, debt.balance + monthlyInterest)

      const principalPayment = payment - monthlyInterest
      const newBalance = Math.max(0, debt.balance - principalPayment)

      totalInterestPaid += monthlyInterest
      monthData.debts.push({
        id: debt.id,
        name: debt.name,
        balance: newBalance,
        payment,
        interest: monthlyInterest
      })

      debt.balance = newBalance
      monthData.totalBalance += newBalance
    })

    monthData.totalInterestPaid = totalInterestPaid
    schedule.push(monthData)

    if (currentDebts.every(d => d.balance <= 0)) break
  }

  const debtFreeDate = new Date()
  debtFreeDate.setMonth(debtFreeDate.getMonth() + month)

  return {
    totalMonths: month,
    totalInterestPaid,
    monthlySchedule: schedule,
    debtFreeDate: formatDateShort(debtFreeDate)
  }
}

// ==================== PDF GENERATION ====================

function generatePayoffReportHTML(debts: Debt[], result: PayoffResult, strategy: string, extraPayment: number): string {
  const totalDebt = debts.reduce((sum, d) => sum + d.balance, 0)
  const totalMonthlyPayment = debts.reduce((sum, d) => sum + d.monthlyPayment, 0)

  const debtRows = debts.map(d => `
    <tr>
      <td style="padding:8px;border-bottom:1px solid #333;">${d.name}</td>
      <td style="padding:8px;border-bottom:1px solid #333;">${d.type}</td>
      <td style="padding:8px;border-bottom:1px solid #333;text-align:right;">$${d.balance.toLocaleString()}</td>
      <td style="padding:8px;border-bottom:1px solid #333;text-align:right;">${d.apr}%</td>
      <td style="padding:8px;border-bottom:1px solid #333;text-align:right;">$${d.monthlyPayment.toLocaleString()}</td>
    </tr>
  `).join('')

  return `
    <html>
    <head><title>Debt Payoff Report</title></head>
    <body style="font-family:system-ui,sans-serif;max-width:800px;margin:0 auto;padding:40px;color:#e5e7eb;background:#111;">
      <h1 style="color:#fff;margin-bottom:4px;">Debt Payoff Report</h1>
      <p style="color:#9ca3af;margin-top:0;">Generated on ${new Date().toLocaleDateString()}</p>
      <hr style="border-color:#333;margin:24px 0;">

      <h2 style="color:#fff;">Summary</h2>
      <table style="width:100%;border-collapse:collapse;margin-bottom:24px;">
        <tr>
          <td style="padding:8px;color:#9ca3af;">Total Debt</td>
          <td style="padding:8px;font-weight:bold;color:#ef4444;">$${totalDebt.toLocaleString()}</td>
          <td style="padding:8px;color:#9ca3af;">Strategy</td>
          <td style="padding:8px;font-weight:bold;color:#fff;">${strategy.charAt(0).toUpperCase() + strategy.slice(1)}</td>
        </tr>
        <tr>
          <td style="padding:8px;color:#9ca3af;">Monthly Payments</td>
          <td style="padding:8px;font-weight:bold;color:#fff;">$${totalMonthlyPayment.toLocaleString()}</td>
          <td style="padding:8px;color:#9ca3af;">Extra Payment</td>
          <td style="padding:8px;font-weight:bold;color:#fff;">$${extraPayment.toLocaleString()}</td>
        </tr>
        <tr>
          <td style="padding:8px;color:#9ca3af;">Debt-Free Date</td>
          <td style="padding:8px;font-weight:bold;color:#22c55e;">${result.debtFreeDate}</td>
          <td style="padding:8px;color:#9ca3af;">Total Interest Paid</td>
          <td style="padding:8px;font-weight:bold;color:#f97316;">$${Math.round(result.totalInterestPaid).toLocaleString()}</td>
        </tr>
        <tr>
          <td style="padding:8px;color:#9ca3af;">Payoff Timeline</td>
          <td style="padding:8px;font-weight:bold;color:#fff;">${result.totalMonths} months (${(result.totalMonths / 12).toFixed(1)} years)</td>
          <td style="padding:8px;color:#9ca3af;">Total Cost</td>
          <td style="padding:8px;font-weight:bold;color:#fff;">$${Math.round(totalDebt + result.totalInterestPaid).toLocaleString()}</td>
        </tr>
      </table>

      <h2 style="color:#fff;">Debt Details</h2>
      <table style="width:100%;border-collapse:collapse;margin-bottom:24px;">
        <thead>
          <tr style="background:#1f2937;">
            <th style="padding:8px;text-align:left;color:#9ca3af;">Name</th>
            <th style="padding:8px;text-align:left;color:#9ca3af;">Type</th>
            <th style="padding:8px;text-align:right;color:#9ca3af;">Balance</th>
            <th style="padding:8px;text-align:right;color:#9ca3af;">APR</th>
            <th style="padding:8px;text-align:right;color:#9ca3af;">Monthly</th>
          </tr>
        </thead>
        <tbody>${debtRows}</tbody>
      </table>

      <h2 style="color:#fff;">Payoff Plan</h2>
      <p style="color:#9ca3af;">Using the <strong>${strategy}</strong> method, focus extra payments on debts in this order:</p>
      <ol style="color:#e5e7eb;">
        ${(strategy === 'avalanche'
      ? [...debts].sort((a, b) => b.apr - a.apr)
      : strategy === 'snowball'
        ? [...debts].sort((a, b) => a.balance - b.balance)
        : [...debts].sort((a, b) => {
          const scoreA = a.balance > 0 ? (a.apr / a.balance) * 10000 : 0
          const scoreB = b.balance > 0 ? (b.apr / b.balance) * 10000 : 0
          return scoreB - scoreA
        })
    ).map(d => `<li style="margin-bottom:8px;"><strong>${d.name}</strong> — $${d.balance.toLocaleString()} at ${d.apr}% APR</li>`).join('')}
      </ol>

      <hr style="border-color:#333;margin:24px 0;">
      <p style="color:#6b7280;font-size:12px;">This report is for informational purposes only and does not constitute financial advice.</p>
    </body>
    </html>
  `
}

// ==================== STRATEGY CONFIG ====================

const STRATEGIES: { key: PayoffStrategy; name: string; description: string; icon: React.ReactNode }[] = [
  {
    key: 'avalanche',
    name: 'Avalanche',
    description: 'Pay highest APR first — saves the most money',
    icon: <Flame className="h-4 w-4 text-orange-500" />,
  },
  {
    key: 'snowball',
    name: 'Snowball',
    description: 'Pay smallest balance first — quick wins for motivation',
    icon: <Snowflake className="h-4 w-4 text-blue-400" />,
  },
  {
    key: 'hybrid',
    name: 'Hybrid',
    description: 'Balance momentum and interest savings',
    icon: <BarChart3 className="h-4 w-4 text-purple-400" />,
  },
]

const DEBT_TYPE_OPTIONS: DebtType[] = ['Credit Card', 'Auto Loan', 'Mortgage', 'Student Loan', 'Personal Loan', 'Other']

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

  // ==================== DEBT TRACKER STATE ====================
  const [debts, setDebts] = useState<Debt[]>([])
  const [payoffStrategy, setPayoffStrategy] = useState<PayoffStrategy>('avalanche')
  const [extraDebtPayment, setExtraDebtPayment] = useState(100)
  const [showResults, setShowResults] = useState(false)
  const [payoffResult, setPayoffResult] = useState<PayoffResult | null>(null)
  const [calculatingPayoff, setCalculatingPayoff] = useState(false)
  const [uploadedFiles, setUploadedFiles] = useState<{ name: string; type: string; data?: string }[]>([])

  // New debt form state
  const [newDebtName, setNewDebtName] = useState('')
  const [newDebtType, setNewDebtType] = useState<DebtType>('Credit Card')
  const [newDebtBalance, setNewDebtBalance] = useState('')
  const [newDebtAPR, setNewDebtAPR] = useState('')
  const [newDebtMonthlyPayment, setNewDebtMonthlyPayment] = useState('')
  const [newDebtMinPayment, setNewDebtMinPayment] = useState('')
  const [newDebtLoanTerm, setNewDebtLoanTerm] = useState('')

  const csvInputRef = useRef<HTMLInputElement>(null)
  const pdfInputRef = useRef<HTMLInputElement>(null)

  // Financial Overview State
  const [includePortfolioInOverview, setIncludePortfolioInOverview] = useState(true)
  const [includeDividendsInOverview, setIncludeDividendsInOverview] = useState(true)
  const [monthlyIncome, setMonthlyIncome] = useState(5000)
  const [monthlyExpenses, setMonthlyExpenses] = useState(2000)

  // Portfolio values from context
  const portfolioValue = portfolioContext?.portfolioValue || 0
  const portfolioAnnualReturn = portfolioContext?.performance?.returns?.['1Y'] || 8
  const portfolioAnnualDividends = portfolioContext?.income?.totalDividends || 0

  // ==================== GOAL TRACKER CALCULATIONS ====================

  const totalAssetsValue = assets.reduce((sum, asset) => sum + asset.value, 0)
  const weightedAssetReturn = assets.length > 0
    ? assets.reduce((sum, asset) => sum + (asset.value * asset.expectedReturn), 0) / totalAssetsValue
    : 0

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

  // ==================== DEBT CALCULATIONS ====================

  const totalDebt = debts.reduce((sum, debt) => sum + debt.balance, 0)
  const totalMonthlyDebtPayment = debts.reduce((sum, debt) => sum + debt.monthlyPayment, 0)
  const totalMonthlyInterest = debts.reduce((sum, debt) => sum + calculateMonthlyInterest(debt), 0)
  const totalAnnualInterest = debts.reduce((sum, debt) => sum + calculateAnnualInterest(debt), 0)
  const weightedAvgAPR = totalDebt > 0
    ? debts.reduce((sum, debt) => sum + (debt.balance * debt.apr), 0) / totalDebt
    : 0

  // ==================== FINANCIAL OVERVIEW CALCULATIONS ====================

  const totalAssets = (includePortfolioInOverview ? portfolioValue : 0) + currentSavings + totalAssetsValue
  const totalLiabilities = totalDebt
  const netWorth = totalAssets - totalLiabilities

  const annualIncome = monthlyIncome * 12
  const annualExpenses = monthlyExpenses * 12
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
    if (debtToIncomeRatio > 50) score -= 30
    else if (debtToIncomeRatio > 35) score -= 20
    else if (debtToIncomeRatio > 20) score -= 10
    if (emergencyFundMonths < 3) score -= 25
    else if (emergencyFundMonths < 6) score -= 10
    if (netWorth < 0) score -= 20
    else if (netWorth < 10000) score -= 10
    if (leverageRatio > 2) score -= 15
    else if (leverageRatio > 1) score -= 8
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
    if (assets.length >= 10) { alert("Maximum 10 assets allowed"); return }
    const value = Number(newAssetValue)
    const returnRate = Number(newAssetReturn)
    if (!newAssetName || value <= 0 || returnRate < 0 || returnRate > 100) {
      alert("Please enter valid asset details"); return
    }
    setAssets([...assets, { id: Date.now().toString(), name: newAssetName, value, expectedReturn: returnRate }])
    setNewAssetName(""); setNewAssetValue(""); setNewAssetReturn("8"); setShowAddAsset(false)
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

  // ==================== DEBT HANDLERS ====================

  const handleAddDebt = () => {
    if (debts.length >= 20) { alert("Maximum 20 debts allowed"); return }
    const balance = parseFloat(newDebtBalance)
    const apr = parseFloat(newDebtAPR)
    const monthly = parseFloat(newDebtMonthlyPayment)
    const minPay = parseFloat(newDebtMinPayment) || 0
    const term = newDebtLoanTerm ? parseInt(newDebtLoanTerm) : undefined

    if (!newDebtName || isNaN(balance) || balance <= 0 || isNaN(apr) || apr < 0 || isNaN(monthly) || monthly <= 0) {
      alert("Please fill in all required fields (Name, Balance, APR, Monthly Payment)")
      return
    }

    const debt: Debt = {
      id: Date.now().toString(),
      name: newDebtName,
      type: newDebtType,
      balance,
      apr,
      monthlyPayment: monthly,
      minimumPayment: minPay,
      loanTerm: term,
    }

    setDebts([...debts, debt])
    setNewDebtName(''); setNewDebtType('Credit Card'); setNewDebtBalance('')
    setNewDebtAPR(''); setNewDebtMonthlyPayment(''); setNewDebtMinPayment(''); setNewDebtLoanTerm('')
    setShowResults(false)
    setPayoffResult(null)
  }

  const handleDeleteDebt = (index: number) => {
    setDebts(debts.filter((_, i) => i !== index))
    setShowResults(false)
    setPayoffResult(null)
  }

  const handleCalculatePayoff = () => {
    if (debts.length === 0) return
    setCalculatingPayoff(true)
    // Small delay for UX feedback
    setTimeout(() => {
      const result = calculatePayoffPlan(debts, payoffStrategy, extraDebtPayment)
      setPayoffResult(result)
      setShowResults(true)
      setCalculatingPayoff(false)
    }, 600)
  }

  const handleCsvUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || [])
    for (const file of files) {
      try {
        const text = await file.text()
        const rows = text.split('\n')
        const header = rows[0]?.toLowerCase() || ''
        const dataRows = rows.slice(1).filter(r => r.trim())

        // Try to auto-detect debt data from CSV
        // Look for columns like: name, balance, apr, payment
        if (header.includes('balance') || header.includes('apr') || header.includes('amount')) {
          const cols = rows[0].split(',').map(c => c.trim().toLowerCase())
          const nameIdx = cols.findIndex(c => c.includes('name') || c.includes('description') || c.includes('card'))
          const balanceIdx = cols.findIndex(c => c.includes('balance') || c.includes('amount') || c.includes('owed'))
          const aprIdx = cols.findIndex(c => c.includes('apr') || c.includes('rate') || c.includes('interest'))
          const paymentIdx = cols.findIndex(c => c.includes('payment') || c.includes('minimum') || c.includes('min'))

          if (balanceIdx >= 0) {
            const importedDebts: Debt[] = []
            dataRows.forEach(row => {
              const values = row.split(',').map(v => v.trim())
              const balance = parseFloat(values[balanceIdx]?.replace(/[$,]/g, '') || '0')
              if (balance > 0) {
                importedDebts.push({
                  id: Date.now().toString() + Math.random(),
                  name: nameIdx >= 0 ? values[nameIdx] || `Imported Debt` : `Imported Debt`,
                  type: 'Credit Card',
                  balance,
                  apr: aprIdx >= 0 ? parseFloat(values[aprIdx]?.replace(/%/g, '') || '0') : 0,
                  monthlyPayment: paymentIdx >= 0 ? parseFloat(values[paymentIdx]?.replace(/[$,]/g, '') || '0') : 0,
                  minimumPayment: 0,
                })
              }
            })

            if (importedDebts.length > 0) {
              setDebts(prev => [...prev, ...importedDebts].slice(0, 20))
              setShowResults(false)
              setPayoffResult(null)
            }
          }
        }

        // Store file reference
        setUploadedFiles(prev => [...prev, { name: file.name, type: 'csv' }])
      } catch {
        alert(`Error reading ${file.name}`)
      }
    }
    if (csvInputRef.current) csvInputRef.current.value = ''
  }

  const handlePdfUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || [])
    for (const file of files) {
      // Store as reference — PDF parsing for auto-extract would require a server-side solution
      const reader = new FileReader()
      reader.onload = () => {
        setUploadedFiles(prev => [...prev, {
          name: file.name,
          type: 'pdf',
          data: reader.result as string
        }])
      }
      reader.readAsDataURL(file)
    }
    if (pdfInputRef.current) pdfInputRef.current.value = ''
  }

  const handleRemoveFile = (index: number) => {
    setUploadedFiles(prev => prev.filter((_, i) => i !== index))
  }

  const handleDownloadReport = () => {
    if (!payoffResult || debts.length === 0) return
    const html = generatePayoffReportHTML(debts, payoffResult, payoffStrategy, extraDebtPayment)
    const blob = new Blob([html], { type: 'text/html' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `debt-payoff-report-${new Date().toISOString().split('T')[0]}.html`
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    URL.revokeObjectURL(url)
  }

  const displayContributionAmount = contributionType === "monthly" ? baseContributionAmount : baseContributionAmount * 12

  // Debt breakdown by type (for Financial Overview)
  const debtByType = debts.reduce((acc, debt) => {
    acc[debt.type] = (acc[debt.type] || 0) + debt.balance
    return acc
  }, {} as Record<string, number>)

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
                      className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${includePortfolio ? 'bg-primary' : 'bg-gray-600'}`}
                      aria-label="Toggle portfolio inclusion"
                    >
                      <span className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${includePortfolio ? 'translate-x-6' : 'translate-x-1'}`} />
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
                          onKeyDown={(e) => { if (e.key === 'Enter') handleSaveGoal() }}
                          className="w-32 rounded border border-border bg-secondary px-2 py-1 text-sm"
                          autoFocus
                        />
                        <button onClick={handleSaveGoal} className="rounded bg-primary px-2 py-1 text-xs text-primary-foreground hover:bg-primary/90">
                          Save
                        </button>
                      </div>
                    ) : (
                      <button
                        onClick={() => { setTempGoalValue(targetValue.toString()); setIsEditingGoal(true) }}
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
                  <span className="font-medium text-foreground">{progressPercent.toFixed(1)}%</span>
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
                        Portfolio: {formatCurrency(portfolioValue)} + Savings: {formatCurrency(currentSavings)}
                        {totalAssetsValue > 0 && <> + Assets: {formatCurrency(totalAssetsValue)}</>}
                      </>
                    ) : (
                      <>
                        Savings: {formatCurrency(currentSavings)}
                        {totalAssetsValue > 0 && <> + Assets: {formatCurrency(totalAssetsValue)}</>}
                        {' '}(Portfolio excluded)
                      </>
                    )}
                  </div>
                </div>
              </div>

              <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-6">
                <div className={`rounded-lg border border-border p-4 ${includePortfolio ? 'bg-secondary/50' : 'bg-secondary/20 opacity-50'}`}>
                  <div className="flex items-center justify-between gap-2">
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                      <TrendingUp className="h-4 w-4" />
                      Portfolio Value
                    </div>
                    {includePortfolio && (
                      <span className="rounded-full bg-primary px-2 py-0.5 text-xs text-primary-foreground">Included</span>
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
                      <span className="rounded-full bg-primary px-2 py-0.5 text-xs text-primary-foreground">Primary</span>
                    )}
                  </div>
                  {isEditingSavings ? (
                    <div className="mt-2 flex gap-2">
                      <input
                        type="number" value={tempSavingsValue}
                        onChange={(e) => setTempSavingsValue(e.target.value)}
                        onKeyDown={(e) => { if (e.key === 'Enter') handleSaveSavings() }}
                        className="w-24 rounded border border-border bg-secondary px-1 py-0.5 text-sm"
                        autoFocus placeholder="Manual savings"
                      />
                      <button onClick={handleSaveSavings} className="rounded bg-primary px-1.5 py-0.5 text-xs text-primary-foreground hover:bg-primary/90">Save</button>
                    </div>
                  ) : (
                    <button onClick={() => { setTempSavingsValue(currentSavings.toString()); setIsEditingSavings(true) }} className="mt-2 flex items-center gap-1">
                      <p className="text-xl font-bold text-foreground">{formatCurrency(currentSavings)}</p>
                      <Pencil className="h-3 w-3 text-muted-foreground" />
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
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                      <TrendingUp className="h-4 w-4" />
                      <span className="text-xs">{contributionType === "monthly" ? "Monthly" : "Yearly"}</span>
                    </div>
                    <div className="flex gap-1 rounded-md bg-secondary p-1">
                      <button onClick={() => setContributionType("monthly")} className={`px-1.5 py-0.5 text-xs rounded transition-colors ${contributionType === "monthly" ? "bg-primary text-primary-foreground" : "text-muted-foreground hover:text-foreground"}`}>Mo.</button>
                      <button onClick={() => setContributionType("yearly")} className={`px-1.5 py-0.5 text-xs rounded transition-colors ${contributionType === "yearly" ? "bg-primary text-primary-foreground" : "text-muted-foreground hover:text-foreground"}`}>Yr.</button>
                    </div>
                  </div>
                  {isEditingContribution ? (
                    <div className="mt-2 flex gap-2">
                      <input type="number" value={tempContributionValue} onChange={(e) => setTempContributionValue(e.target.value)} onKeyDown={(e) => { if (e.key === 'Enter') handleSaveContribution() }} className="w-20 rounded border border-border bg-secondary px-1 py-0.5 text-sm" autoFocus />
                      <button onClick={handleSaveContribution} className="rounded bg-primary px-1.5 py-0.5 text-xs text-primary-foreground hover:bg-primary/90">Save</button>
                    </div>
                  ) : (
                    <button onClick={() => { setTempContributionValue(baseContributionAmount.toString()); setIsEditingContribution(true) }} className="mt-2 flex items-center gap-1">
                      <p className="text-xl font-bold text-foreground">{formatCurrency(displayContributionAmount)}</p>
                      <Pencil className="h-3 w-3 text-muted-foreground" />
                    </button>
                  )}
                </div>
                <div className="rounded-lg border border-border bg-secondary/50 p-4">
                  <div className="flex items-center gap-2 text-sm text-muted-foreground"><TrendingUp className="h-4 w-4" />Expected Return</div>
                  {isEditingReturn ? (
                    <div className="mt-2 flex gap-2">
                      <input type="number" value={tempReturnValue} onChange={(e) => setTempReturnValue(e.target.value)} onKeyDown={(e) => { if (e.key === 'Enter') handleSaveReturn() }} min="0" max="100" className="w-16 rounded border border-border bg-secondary px-1 py-0.5 text-sm" autoFocus />
                      <button onClick={handleSaveReturn} className="rounded bg-primary px-1.5 py-0.5 text-xs text-primary-foreground hover:bg-primary/90">Save</button>
                    </div>
                  ) : (
                    <button onClick={() => { setTempReturnValue(expectedReturn.toString()); setIsEditingReturn(true) }} className="mt-2 flex items-center gap-1">
                      <p className="text-xl font-bold text-foreground">{expectedReturn}% annually</p>
                      <Pencil className="h-3 w-3 text-muted-foreground" />
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

          {/* Other Assets Section */}
          <Card className="border-border bg-card">
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="text-base">Other Assets</CardTitle>
                  <p className="text-xs text-muted-foreground mt-1">Add external assets like savings accounts, real estate, etc. (Max 10)</p>
                </div>
                <button onClick={() => setShowAddAsset(!showAddAsset)} disabled={assets.length >= 10} className="rounded bg-primary px-3 py-1.5 text-sm text-primary-foreground hover:bg-primary/90 disabled:opacity-50">
                  <Plus className="h-4 w-4 inline mr-1" /> Add Asset
                </button>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              {showAddAsset && (
                <div className="rounded-lg border border-border bg-secondary/50 p-4 space-y-3">
                  <div className="grid gap-3 sm:grid-cols-3">
                    <input type="text" placeholder="Asset name (e.g., High-yield savings)" value={newAssetName} onChange={(e) => setNewAssetName(e.target.value)} className="rounded border border-border bg-secondary px-3 py-2 text-sm" />
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
                <div className="text-center py-6 text-muted-foreground text-sm">No assets added yet. Click &quot;Add Asset&quot; to get started.</div>
              ) : (
                <div className="space-y-2">
                  {assets.map((asset) => (
                    <div key={asset.id} className="flex items-center justify-between rounded-lg border border-border bg-secondary/30 p-3">
                      <div className="flex-1 grid grid-cols-3 gap-3 items-center">
                        <div><p className="font-medium text-foreground">{asset.name}</p></div>
                        <div className="text-right"><p className="font-bold text-foreground">{formatCurrency(asset.value)}</p></div>
                        <div className="text-right"><p className="text-sm text-muted-foreground">{asset.expectedReturn}% return</p></div>
                      </div>
                      <button onClick={() => handleDeleteAsset(asset.id)} className="ml-3 rounded p-1.5 text-red-500 hover:bg-red-500/10" aria-label="Delete asset"><X className="h-4 w-4" /></button>
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
                    <XAxis dataKey="date" stroke="#9ca3af" fontSize={12} tick={{ fill: '#d1d5db' }} axisLine={{ stroke: '#4b5563', strokeWidth: 2 }} tickLine={{ stroke: '#4b5563' }} />
                    <YAxis tickFormatter={(v) => `$${(v / 1000).toFixed(0)}k`} stroke="#9ca3af" fontSize={12} tick={{ fill: '#d1d5db' }} axisLine={{ stroke: '#4b5563', strokeWidth: 2 }} tickLine={{ stroke: '#4b5563' }} />
                    <Tooltip contentStyle={{ backgroundColor: "hsl(var(--card))", border: "1px solid hsl(var(--border))", borderRadius: "8px" }} formatter={(value: number | null) => value ? [formatCurrency(value), ""] : ["", ""]} labelFormatter={(label) => `Date: ${label}`} />
                    <ReferenceLine y={targetValue} stroke="#22c55e" strokeDasharray="5 5" label={{ value: "Goal", fill: "#22c55e", fontSize: 12 }} />
                    <Line type="monotone" dataKey="actual" name="Current Value" stroke="#22c55e" strokeWidth={2} dot={false} connectNulls={false} />
                    <Line type="monotone" dataKey="invested" name="Invested Amount (no returns)" stroke="#6b7280" strokeWidth={2} strokeDasharray="3 3" dot={false} connectNulls={false} />
                    <Line type="monotone" dataKey="projected" name={`Portfolio Value (with ${expectedReturn}% returns)`} stroke="#22c55e" strokeWidth={2} dot={false} connectNulls={false} />
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
                <CardHeader><CardTitle className="text-base">Investment Breakdown</CardTitle></CardHeader>
                <CardContent>
                  <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
                    <div className="rounded-lg border border-border bg-secondary/50 p-4">
                      <div className="flex items-center gap-2 text-sm text-muted-foreground"><DollarSign className="h-4 w-4" />Total Invested</div>
                      <p className="mt-1 text-xl font-bold text-foreground">{formatCurrency(totalInvested)}</p>
                      <p className="mt-1 text-xs text-muted-foreground">{investedPercent.toFixed(1)}% of goal</p>
                    </div>
                    <div className="rounded-lg border border-border bg-secondary/50 p-4">
                      <div className="flex items-center gap-2 text-sm text-muted-foreground"><TrendingUp className="h-4 w-4" />Compound Growth</div>
                      <p className="mt-1 text-xl font-bold text-primary">{formatCurrency(compoundGrowth)}</p>
                      <p className="mt-1 text-xs text-muted-foreground">{growthPercent.toFixed(1)}% of goal</p>
                    </div>
                    {totalAssetsValue > 0 && (
                      <div className="rounded-lg border border-border bg-secondary/50 p-4">
                        <div className="flex items-center gap-2 text-sm text-muted-foreground"><DollarSign className="h-4 w-4" />Other Assets</div>
                        <p className="mt-1 text-xl font-bold text-foreground">{formatCurrency(totalAssetsValue)}</p>
                        <p className="mt-1 text-xs text-muted-foreground">{assets.length} asset{assets.length !== 1 ? 's' : ''} tracked</p>
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

          {/* Goal Milestones */}
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
        </TabsContent>

        {/* ==================== TAB 2: DEBT TRACKER (REBUILT) ==================== */}
        <TabsContent value="debts" className="space-y-6">
          {/* Dashboard Summary Cards */}
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

          {/* Two-Column Layout: Input Left, Summary Right */}
          <div className="grid lg:grid-cols-3 gap-6">
            {/* Left Column — Debt Input (2/3 width) */}
            <div className="lg:col-span-2 space-y-6">
              {/* Add Debts Card */}
              <Card className="border-border bg-card">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <CreditCard className="h-5 w-5" />
                    Your Debts
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  {/* Existing Debts */}
                  {debts.map((debt, index) => (
                    <div key={debt.id} className="space-y-3 p-4 border border-border rounded-lg bg-secondary/20">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <h4 className="font-semibold text-foreground">{debt.name}</h4>
                          <Badge variant="secondary">{debt.type}</Badge>
                          <Badge variant={debt.apr > 15 ? "destructive" : debt.apr > 8 ? "default" : "secondary"}>
                            {debt.apr}% APR
                          </Badge>
                        </div>
                        <Button variant="destructive" size="sm" onClick={() => handleDeleteDebt(index)}>
                          <Trash2 className="h-3 w-3 mr-1" /> Remove
                        </Button>
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
                          <p className="font-medium text-orange-500">{formatCurrency(calculateMonthlyInterest(debt))}</p>
                        </div>
                        <div>
                          <p className="text-muted-foreground text-xs">Interest/Year</p>
                          <p className="font-medium text-red-500">{formatCurrency(calculateAnnualInterest(debt))}</p>
                        </div>
                      </div>
                      {debt.loanTerm && (
                        <p className="text-xs text-muted-foreground">
                          Loan Term: {debt.loanTerm} months ({(debt.loanTerm / 12).toFixed(1)} years)
                        </p>
                      )}
                    </div>
                  ))}

                  {/* New Debt Form */}
                  <div className="space-y-3 p-4 border border-dashed border-border rounded-lg">
                    <p className="text-sm font-medium text-muted-foreground">Add New Debt</p>
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <Label className="text-xs">Debt Name *</Label>
                        <Input
                          value={newDebtName}
                          onChange={(e) => setNewDebtName(e.target.value)}
                          placeholder="e.g., Chase Sapphire"
                          className="mt-1"
                        />
                      </div>
                      <div>
                        <Label className="text-xs">Debt Type</Label>
                        <Select value={newDebtType} onValueChange={(val) => setNewDebtType(val as DebtType)}>
                          <SelectTrigger className="mt-1"><SelectValue /></SelectTrigger>
                          <SelectContent>
                            {DEBT_TYPE_OPTIONS.map(type => (
                              <SelectItem key={type} value={type}>{type}</SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                      <div>
                        <Label className="text-xs">Balance ($) *</Label>
                        <Input type="number" value={newDebtBalance} onChange={(e) => setNewDebtBalance(e.target.value)} placeholder="0.00" className="mt-1" />
                      </div>
                      <div>
                        <Label className="text-xs">APR (%) *</Label>
                        <Input type="number" value={newDebtAPR} onChange={(e) => setNewDebtAPR(e.target.value)} placeholder="0.00" step="0.01" className="mt-1" />
                      </div>
                      <div>
                        <Label className="text-xs">Monthly Payment ($) *</Label>
                        <Input type="number" value={newDebtMonthlyPayment} onChange={(e) => setNewDebtMonthlyPayment(e.target.value)} placeholder="0.00" className="mt-1" />
                      </div>
                      <div>
                        <Label className="text-xs">Minimum Payment ($)</Label>
                        <Input type="number" value={newDebtMinPayment} onChange={(e) => setNewDebtMinPayment(e.target.value)} placeholder="0.00" className="mt-1" />
                      </div>
                      <div>
                        <Label className="text-xs">Loan Term (months)</Label>
                        <Input type="number" value={newDebtLoanTerm} onChange={(e) => setNewDebtLoanTerm(e.target.value)} placeholder="Optional" className="mt-1" />
                      </div>
                    </div>
                    <Button onClick={handleAddDebt} disabled={debts.length >= 20} className="w-full">
                      <Plus className="h-4 w-4 mr-2" /> Add Debt
                    </Button>
                  </div>
                </CardContent>
              </Card>

              {/* Strategy Selection */}
              <Card className="border-border bg-card">
                <CardHeader>
                  <CardTitle className="text-base">Payoff Strategy</CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  {STRATEGIES.map((strategy) => (
                    <label
                      key={strategy.key}
                      className={`flex items-center gap-3 p-4 border rounded-lg cursor-pointer transition-colors ${payoffStrategy === strategy.key
                        ? 'border-primary bg-primary/5'
                        : 'border-border hover:bg-secondary/50'
                        }`}
                    >
                      <input
                        type="radio"
                        name="strategy"
                        value={strategy.key}
                        checked={payoffStrategy === strategy.key}
                        onChange={() => { setPayoffStrategy(strategy.key); setShowResults(false); setPayoffResult(null) }}
                        className="accent-primary"
                      />
                      <div className="flex items-center gap-2 flex-1">
                        {strategy.icon}
                        <div>
                          <p className="font-medium text-foreground">{strategy.name}</p>
                          <p className="text-sm text-muted-foreground">{strategy.description}</p>
                        </div>
                      </div>
                    </label>
                  ))}
                </CardContent>
              </Card>

              {/* Extra Payment */}
              <Card className="border-border bg-card">
                <CardHeader>
                  <CardTitle className="text-base">Extra Monthly Payment</CardTitle>
                </CardHeader>
                <CardContent>
                  <Label className="text-sm text-muted-foreground">Additional amount beyond minimums</Label>
                  <Input
                    type="number"
                    value={extraDebtPayment}
                    onChange={(e) => { setExtraDebtPayment(Number(e.target.value)); setShowResults(false); setPayoffResult(null) }}
                    placeholder="$0.00"
                    className="mt-2"
                  />
                </CardContent>
              </Card>

              {/* File Upload */}
              <Card className="border-border bg-card">
                <CardHeader>
                  <CardTitle className="text-base">Import Data</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid sm:grid-cols-2 gap-4">
                    <div>
                      <Label className="text-sm text-muted-foreground">Upload CSV (auto-imports debts)</Label>
                      <div className="flex items-center gap-2 mt-2">
                        <Input
                          ref={csvInputRef}
                          type="file"
                          multiple
                          accept=".csv"
                          onChange={handleCsvUpload}
                          className="text-xs"
                        />
                        <Button variant="outline" size="icon" onClick={() => csvInputRef.current?.click()}>
                          <Upload className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                    <div>
                      <Label className="text-sm text-muted-foreground">Upload PDF (stored as reference)</Label>
                      <div className="flex items-center gap-2 mt-2">
                        <Input
                          ref={pdfInputRef}
                          type="file"
                          multiple
                          accept=".pdf"
                          onChange={handlePdfUpload}
                          className="text-xs"
                        />
                        <Button variant="outline" size="icon" onClick={() => pdfInputRef.current?.click()}>
                          <Upload className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  </div>

                  {/* Uploaded Files List */}
                  {uploadedFiles.length > 0 && (
                    <div className="space-y-2 mt-4">
                      <p className="text-xs font-medium text-muted-foreground">Uploaded Files</p>
                      {uploadedFiles.map((file, index) => (
                        <div key={index} className="flex items-center justify-between p-2 rounded bg-secondary/30 border border-border">
                          <div className="flex items-center gap-2">
                            <FileText className="h-4 w-4 text-muted-foreground" />
                            <span className="text-sm text-foreground">{file.name}</span>
                            <Badge variant="secondary" className="text-xs">{file.type.toUpperCase()}</Badge>
                          </div>
                          <Button variant="ghost" size="sm" onClick={() => handleRemoveFile(index)}>
                            <X className="h-3 w-3" />
                          </Button>
                        </div>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>

            {/* Right Column — Summary Sidebar (1/3 width) */}
            <div>
              <Card className="border-border bg-card sticky top-4">
                <CardHeader>
                  <CardTitle className="text-base">Debt Summary</CardTitle>
                </CardHeader>
                <CardContent className="space-y-5">
                  <div>
                    <p className="text-sm text-muted-foreground">Total Debt</p>
                    <p className="text-3xl font-bold text-red-500">{formatCurrency(totalDebt)}</p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Average APR</p>
                    <p className="text-2xl font-bold text-foreground">{weightedAvgAPR.toFixed(2)}%</p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Monthly Payments</p>
                    <p className="text-2xl font-bold text-foreground">{formatCurrency(totalMonthlyDebtPayment + extraDebtPayment)}</p>
                    <p className="text-xs text-muted-foreground mt-1">
                      {formatCurrency(totalMonthlyDebtPayment)} min + {formatCurrency(extraDebtPayment)} extra
                    </p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Strategy</p>
                    <Badge className="mt-1">{payoffStrategy.charAt(0).toUpperCase() + payoffStrategy.slice(1)}</Badge>
                  </div>

                  <Button
                    onClick={handleCalculatePayoff}
                    disabled={debts.length === 0 || calculatingPayoff}
                    className="w-full"
                    size="lg"
                  >
                    {calculatingPayoff ? 'Calculating...' : 'Calculate Payoff Plan'}
                  </Button>

                  {/* Download Report */}
                  {showResults && payoffResult && (
                    <Button
                      onClick={handleDownloadReport}
                      variant="outline"
                      className="w-full"
                      size="lg"
                    >
                      <Download className="h-4 w-4 mr-2" /> Download Report
                    </Button>
                  )}
                </CardContent>
              </Card>
            </div>
          </div>

          {/* Payoff Results */}
          {showResults && payoffResult && (
            <Card className="border-border bg-card border-primary/30">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <CheckCircle2 className="h-5 w-5 text-green-500" />
                  Your Payoff Plan
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                {/* Results Summary */}
                <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
                  <div className="rounded-lg border border-green-500/30 bg-green-500/5 p-4">
                    <p className="text-xs text-muted-foreground mb-1">Debt-Free Date</p>
                    <p className="text-2xl font-bold text-green-500">{payoffResult.debtFreeDate}</p>
                  </div>
                  <div className="rounded-lg border border-border bg-secondary/50 p-4">
                    <p className="text-xs text-muted-foreground mb-1">Payoff Timeline</p>
                    <p className="text-2xl font-bold text-foreground">{payoffResult.totalMonths} months</p>
                    <p className="text-xs text-muted-foreground">{(payoffResult.totalMonths / 12).toFixed(1)} years</p>
                  </div>
                  <div className="rounded-lg border border-orange-500/30 bg-orange-500/5 p-4">
                    <p className="text-xs text-muted-foreground mb-1">Total Interest Paid</p>
                    <p className="text-2xl font-bold text-orange-500">{formatCurrency(payoffResult.totalInterestPaid)}</p>
                  </div>
                  <div className="rounded-lg border border-border bg-secondary/50 p-4">
                    <p className="text-xs text-muted-foreground mb-1">Total Cost</p>
                    <p className="text-2xl font-bold text-foreground">{formatCurrency(totalDebt + payoffResult.totalInterestPaid)}</p>
                  </div>
                </div>

                {/* Payoff Priority Order */}
                <div>
                  <h4 className="text-sm font-semibold text-foreground mb-3">
                    {payoffStrategy.charAt(0).toUpperCase() + payoffStrategy.slice(1)} Payoff Order:
                  </h4>
                  <div className="space-y-2">
                    {(payoffStrategy === 'avalanche'
                      ? [...debts].sort((a, b) => b.apr - a.apr)
                      : payoffStrategy === 'snowball'
                        ? [...debts].sort((a, b) => a.balance - b.balance)
                        : [...debts].sort((a, b) => {
                          const scoreA = a.balance > 0 ? (a.apr / a.balance) * 10000 : 0
                          const scoreB = b.balance > 0 ? (b.apr / b.balance) * 10000 : 0
                          return scoreB - scoreA
                        })
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
                            <p className={`font-medium ${debt.apr > 15 ? 'text-red-500' : debt.apr > 8 ? 'text-orange-500' : 'text-green-500'}`}>
                              {debt.apr}% APR
                            </p>
                            <p className="text-xs text-muted-foreground">{formatCurrency(calculateAnnualInterest(debt))}/year interest</p>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        {/* ==================== TAB 3: FINANCIAL OVERVIEW ==================== */}
        <TabsContent value="overview" className="space-y-6">
          {/* Settings Toggles */}
          <Card className="border-border bg-card">
            <CardHeader><CardTitle className="text-base">Data Sources</CardTitle></CardHeader>
            <CardContent>
              <div className="flex flex-wrap gap-4">
                <div className="flex items-center gap-2 rounded-lg border border-border bg-secondary/50 px-4 py-2">
                  <span className="text-sm text-muted-foreground">Include Portfolio</span>
                  <button onClick={() => setIncludePortfolioInOverview(!includePortfolioInOverview)} className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${includePortfolioInOverview ? 'bg-primary' : 'bg-gray-600'}`}>
                    <span className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${includePortfolioInOverview ? 'translate-x-6' : 'translate-x-1'}`} />
                  </button>
                  <span className={`text-sm font-medium ${includePortfolioInOverview ? 'text-primary' : 'text-muted-foreground'}`}>{includePortfolioInOverview ? 'ON' : 'OFF'}</span>
                </div>
                <div className="flex items-center gap-2 rounded-lg border border-border bg-secondary/50 px-4 py-2">
                  <span className="text-sm text-muted-foreground">Include Dividends</span>
                  <button onClick={() => setIncludeDividendsInOverview(!includeDividendsInOverview)} disabled={!includePortfolioInOverview} className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${includeDividendsInOverview && includePortfolioInOverview ? 'bg-primary' : 'bg-gray-600'} ${!includePortfolioInOverview ? 'opacity-50 cursor-not-allowed' : ''}`}>
                    <span className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${includeDividendsInOverview && includePortfolioInOverview ? 'translate-x-6' : 'translate-x-1'}`} />
                  </button>
                  <span className={`text-sm font-medium ${includeDividendsInOverview && includePortfolioInOverview ? 'text-primary' : 'text-muted-foreground'}`}>{includeDividendsInOverview && includePortfolioInOverview ? 'ON' : 'OFF'}</span>
                </div>
                <div className="flex items-center gap-2">
                  <label className="text-sm text-muted-foreground">Monthly Income:</label>
                  <input type="number" value={monthlyIncome} onChange={(e) => setMonthlyIncome(Number(e.target.value))} className="w-28 rounded border border-border bg-secondary px-2 py-1 text-sm" />
                </div>
                <div className="flex items-center gap-2">
                  <label className="text-sm text-muted-foreground">Monthly Expenses:</label>
                  <input type="number" value={monthlyExpenses} onChange={(e) => setMonthlyExpenses(Number(e.target.value))} className="w-28 rounded border border-border bg-secondary px-2 py-1 text-sm" />
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
                    <circle cx="100" cy="100" r="90" stroke="hsl(var(--border))" strokeWidth="12" fill="none" />
                    <circle cx="100" cy="100" r="90" stroke={healthScore >= 80 ? '#22c55e' : healthScore >= 60 ? '#eab308' : '#ef4444'} strokeWidth="12" fill="none" strokeDasharray={`${(healthScore / 100) * 565.48} 565.48`} strokeLinecap="round" />
                  </svg>
                  <div className="absolute inset-0 flex flex-col items-center justify-center">
                    <p className="text-5xl font-bold text-foreground">{healthScore}</p>
                    <p className="text-sm text-muted-foreground">out of 100</p>
                  </div>
                </div>
                <p className={`mt-4 text-lg font-semibold ${healthScore >= 80 ? 'text-green-500' : healthScore >= 60 ? 'text-yellow-500' : 'text-red-500'}`}>
                  {healthScore >= 80 ? 'Excellent' : healthScore >= 60 ? 'Good' : healthScore >= 40 ? 'Fair' : 'Needs Improvement'}
                </p>
              </div>

              <div className="mt-6 space-y-3">
                <div className="flex items-center justify-between p-3 rounded-lg bg-secondary/30">
                  <span className="text-sm text-foreground">Debt-to-Income Ratio</span>
                  <span className={`font-medium ${debtToIncomeRatio > 35 ? 'text-red-500' : debtToIncomeRatio > 20 ? 'text-yellow-500' : 'text-green-500'}`}>{debtToIncomeRatio.toFixed(1)}%</span>
                </div>
                <div className="flex items-center justify-between p-3 rounded-lg bg-secondary/30">
                  <span className="text-sm text-foreground">Emergency Fund</span>
                  <span className={`font-medium ${emergencyFundMonths < 3 ? 'text-red-500' : emergencyFundMonths < 6 ? 'text-yellow-500' : 'text-green-500'}`}>{emergencyFundMonths.toFixed(1)} months</span>
                </div>
                <div className="flex items-center justify-between p-3 rounded-lg bg-secondary/30">
                  <span className="text-sm text-foreground">Net Worth</span>
                  <span className={`font-medium ${netWorth < 0 ? 'text-red-500' : 'text-green-500'}`}>{formatCurrency(netWorth)}</span>
                </div>
                <div className="flex items-center justify-between p-3 rounded-lg bg-secondary/30">
                  <span className="text-sm text-foreground">Monthly Cash Flow</span>
                  <span className={`font-medium ${monthlyNetCashFlow < 0 ? 'text-red-500' : 'text-green-500'}`}>{monthlyNetCashFlow >= 0 ? '+' : ''}{formatCurrency(monthlyNetCashFlow)}</span>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Investment Returns vs Debt Costs */}
          <Card className="border-border bg-card">
            <CardHeader>
              <CardTitle className="text-base">Investment Returns vs Debt Costs</CardTitle>
              <p className="text-xs text-muted-foreground">Compare what you&apos;re earning vs what you&apos;re paying</p>
            </CardHeader>
            <CardContent>
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="rounded-lg border-2 border-green-500/30 bg-green-500/5 p-6">
                  <div className="flex items-center gap-2 mb-4">
                    <TrendingUp className="h-5 w-5 text-green-500" />
                    <h4 className="font-semibold text-foreground">Earning (Annual)</h4>
                  </div>
                  <p className="text-3xl font-bold text-green-500 mb-4">{formatCurrency(portfolioAnnualReturnDollars + dividendIncome)}</p>
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
                  <p className="text-3xl font-bold text-red-500 mb-4">{formatCurrency(totalAnnualInterest)}</p>
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
                  <span className={`text-2xl font-bold ${(portfolioAnnualReturnDollars + dividendIncome - totalAnnualInterest) >= 0 ? 'text-green-500' : 'text-red-500'}`}>
                    {(portfolioAnnualReturnDollars + dividendIncome - totalAnnualInterest) >= 0 ? '+' : ''}
                    {formatCurrency(portfolioAnnualReturnDollars + dividendIncome - totalAnnualInterest)}
                  </span>
                </div>
                {totalAnnualInterest > portfolioAnnualReturnDollars + dividendIncome && (
                  <p className="mt-3 text-sm text-orange-500 flex items-center gap-2">
                    <AlertTriangle className="h-4 w-4" />
                    Your debt costs more than you&apos;re earning from investments! Consider paying down high-interest debt first.
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
                    <span className={`font-bold ${debtToIncomeRatio > 50 ? 'text-red-500' : debtToIncomeRatio > 35 ? 'text-orange-500' : debtToIncomeRatio > 20 ? 'text-yellow-500' : 'text-green-500'}`}>{debtToIncomeRatio.toFixed(1)}%</span>
                  </div>
                  <Progress value={Math.min(debtToIncomeRatio, 100)} className="h-2" />
                  <p className="text-xs text-muted-foreground">{debtToIncomeRatio < 20 ? '✅ Excellent' : debtToIncomeRatio < 35 ? '⚠️ Moderate' : debtToIncomeRatio < 50 ? '❌ High Risk' : '🚨 Danger'}</p>
                </div>
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-muted-foreground">Debt-to-Asset</span>
                    <span className={`font-bold ${debtToAssetRatio > 60 ? 'text-red-500' : debtToAssetRatio > 30 ? 'text-yellow-500' : 'text-green-500'}`}>{debtToAssetRatio.toFixed(1)}%</span>
                  </div>
                  <Progress value={Math.min(debtToAssetRatio, 100)} className="h-2" />
                  <p className="text-xs text-muted-foreground">{debtToAssetRatio < 30 ? '✅ Good' : debtToAssetRatio < 60 ? '⚠️ Moderate' : '❌ High'}</p>
                </div>
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-muted-foreground">Emergency Fund</span>
                    <span className={`font-bold ${emergencyFundMonths < 3 ? 'text-red-500' : emergencyFundMonths < 6 ? 'text-yellow-500' : 'text-green-500'}`}>{emergencyFundMonths.toFixed(1)}mo</span>
                  </div>
                  <Progress value={Math.min((emergencyFundMonths / 6) * 100, 100)} className="h-2" />
                  <p className="text-xs text-muted-foreground">{emergencyFundMonths >= 6 ? '✅ Safe' : emergencyFundMonths >= 3 ? '⚠️ Moderate' : '❌ Risky'}</p>
                </div>
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-muted-foreground">Leverage Ratio</span>
                    <span className={`font-bold ${leverageRatio > 2 ? 'text-red-500' : leverageRatio > 1 ? 'text-yellow-500' : 'text-green-500'}`}>{leverageRatio.toFixed(2)}x</span>
                  </div>
                  <Progress value={Math.min((leverageRatio / 3) * 100, 100)} className="h-2" />
                  <p className="text-xs text-muted-foreground">{leverageRatio < 1 ? '✅ Conservative' : leverageRatio < 2 ? '⚠️ Moderate' : '❌ Aggressive'}</p>
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
                <div>
                  <h4 className="font-semibold text-green-500 mb-3 flex items-center gap-2"><TrendingUp className="h-4 w-4" />ASSETS</h4>
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
                <div>
                  <h4 className="font-semibold text-red-500 mb-3 flex items-center gap-2"><TrendingDown className="h-4 w-4" />LIABILITIES</h4>
                  <div className="space-y-2">
                    {debts.length > 0 ? (
                      Object.entries(debtByType).map(([type, amount]) => (
                        <div key={type} className="flex justify-between p-2 rounded bg-secondary/30">
                          <span className="text-sm text-muted-foreground">{type}</span>
                          <span className="font-medium text-foreground">{formatCurrency(amount)}</span>
                        </div>
                      ))
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
              <div className="mt-6 p-6 rounded-lg bg-gradient-to-r from-primary/10 to-primary/5 border-2 border-primary/30">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-muted-foreground mb-1">NET WORTH</p>
                    <p className={`text-4xl font-bold ${netWorth >= 0 ? 'text-green-500' : 'text-red-500'}`}>{formatCurrency(netWorth)}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-xs text-muted-foreground">Assets - Liabilities</p>
                    <p className="text-sm text-muted-foreground mt-1">{formatCurrency(totalAssets)} - {formatCurrency(totalLiabilities)}</p>
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
                      <span className={`font-bold ${monthlyNetCashFlow >= 0 ? 'text-green-500' : 'text-red-500'}`}>{monthlyNetCashFlow >= 0 ? '+' : ''}{formatCurrency(monthlyNetCashFlow)}</span>
                    </div>
                  </div>
                </div>
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
                      <span className={`font-bold ${netAnnualCashFlow >= 0 ? 'text-green-500' : 'text-red-500'}`}>{netAnnualCashFlow >= 0 ? '+' : ''}{formatCurrency(netAnnualCashFlow)}</span>
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
                      You&apos;re paying <span className="font-bold text-orange-500">{formatCurrency(totalAnnualInterest)}</span> per year in debt interest.
                    </p>
                    <p className="text-sm text-foreground">
                      💡 If you paid off your debt and invested that money instead at {expectedReturn}% return:
                    </p>
                  </div>
                  <div className="grid gap-4 sm:grid-cols-3">
                    <div className="p-4 rounded-lg bg-secondary/50">
                      <p className="text-xs text-muted-foreground mb-1">In 10 years</p>
                      <p className="text-xl font-bold text-primary">{formatCurrency(totalAnnualInterest * ((Math.pow(1 + expectedReturn / 100, 10) - 1) / (expectedReturn / 100)))}</p>
                    </div>
                    <div className="p-4 rounded-lg bg-secondary/50">
                      <p className="text-xs text-muted-foreground mb-1">In 20 years</p>
                      <p className="text-xl font-bold text-primary">{formatCurrency(totalAnnualInterest * ((Math.pow(1 + expectedReturn / 100, 20) - 1) / (expectedReturn / 100)))}</p>
                    </div>
                    <div className="p-4 rounded-lg bg-secondary/50">
                      <p className="text-xs text-muted-foreground mb-1">In 30 years</p>
                      <p className="text-xl font-bold text-primary">{formatCurrency(totalAnnualInterest * ((Math.pow(1 + expectedReturn / 100, 30) - 1) / (expectedReturn / 100)))}</p>
                    </div>
                  </div>
                  <div className="p-4 rounded-lg bg-red-500/10 border border-red-500/30">
                    <p className="text-sm font-semibold text-red-500">
                      🚨 Your high-interest debt is costing you{' '}
                      <span className="text-lg">{formatCurrency(totalAnnualInterest * ((Math.pow(1 + expectedReturn / 100, 30) - 1) / (expectedReturn / 100)))}</span>
                      {' '}in future wealth over 30 years!
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
