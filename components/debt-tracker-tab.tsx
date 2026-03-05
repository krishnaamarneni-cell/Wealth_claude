'use client'

import { useState, useMemo, useEffect, useRef, useCallback } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Progress } from '@/components/ui/progress'
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, BarChart, Bar, Cell, PieChart, Pie,
} from 'recharts'
import {
  CreditCard, TrendingDown, Activity, Plus, Trash2, Zap, Target,
  DollarSign, Upload, FileText, X, Snowflake, Flame, Download,
  ChevronDown, ChevronUp, Loader2, CheckCircle2, AlertTriangle,
} from 'lucide-react'
import jsPDF from 'jspdf'
import autoTable from 'jspdf-autotable'

// ── Types ─────────────────────────────────────────────────────────────────────

export type LoanType = 'Credit Card' | 'Home Loan' | 'Car Loan' | 'Personal Loan' | 'Student Loan' | 'Other'

export type Debt = {
  id: string
  name: string
  type: LoanType
  balance: number
  apr: number
  monthlyPayment: number
  minimumPayment: number
  loanTermMonths?: number | null
  notes?: string | null
  source: 'manual' | 'csv' | 'pdf'
  fileName?: string | null
  spendingInsights?: SpendingInsights | null
}

type SpendingInsights = {
  totalTransactions: number
  totalSpending: number
  categories: Record<string, { amount: number; percentage: number; count: number }>
  topCategory: string
  spendingNature: string
  strategyTip: string
  monthlyAverage: number
}

type ParsedFileData = {
  accountName: string
  balance: number
  apr: number
  monthlyPayment: number
  minimumPayment: number
  spendingInsights?: SpendingInsights | null
  fileType: 'csv' | 'pdf'
  fileName: string
  partialExtraction?: boolean
}

interface DebtTrackerTabProps {
  onDebtsChange: (debts: Debt[]) => void
}

const LOAN_TYPES: LoanType[] = ['Credit Card', 'Home Loan', 'Car Loan', 'Personal Loan', 'Student Loan', 'Other']

const DEBT_COLORS: Record<string, string> = {
  'Credit Card': '#ef4444',
  'Home Loan': '#eab308',
  'Car Loan': '#f97316',
  'Personal Loan': '#8b5cf6',
  'Student Loan': '#3b82f6',
  'Other': '#6b7280',
}

const CATEGORY_COLORS: Record<string, string> = {
  'Dining': '#ef4444', 'Groceries': '#22c55e', 'Transportation': '#f97316',
  'Entertainment': '#a855f7', 'Shopping': '#3b82f6', 'Healthcare': '#06b6d4',
  'Bills & Utilities': '#eab308', 'Travel': '#ec4899', 'Other': '#6b7280',
}

// ── Helper Functions ──────────────────────────────────────────────────────────

function formatCurrency(value: number): string {
  return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', minimumFractionDigits: 0, maximumFractionDigits: 0 }).format(value)
}

function formatMonths(months: number): string {
  if (months <= 0) return '0 mo'
  const years = Math.floor(months / 12)
  const mo = months % 12
  if (years === 0) return `${mo}mo`
  if (mo === 0) return `${years}yr`
  return `${years}yr ${mo}mo`
}

function calcMonthlyInterest(balance: number, apr: number) {
  return (balance * (apr / 100)) / 12
}

function calcAnnualInterest(balance: number, apr: number) {
  return balance * (apr / 100)
}

type PayoffStrategy = 'avalanche' | 'snowball'

function calculatePayoffSchedule(debts: Debt[], strategy: PayoffStrategy, extra: number = 0) {
  if (!debts.length) return []
  const sorted = [...debts].sort((a, b) =>
    strategy === 'avalanche' ? b.apr - a.apr : a.balance - b.balance
  )
  let current = sorted.map(d => ({ ...d }))
  const schedule: Array<{ month: number; totalBalance: number; totalInterestPaid: number }> = []
  let month = 0
  let totalInterestPaid = 0

  while (current.some(d => d.balance > 0) && month < 600) {
    month++
    let availableExtra = extra
    current.forEach((debt, idx) => {
      if (debt.balance <= 0) return
      const interest = calcMonthlyInterest(debt.balance, debt.apr)
      let payment = Math.max(debt.monthlyPayment, debt.minimumPayment)
      if (idx === current.findIndex(d => d.balance > 0) && availableExtra > 0) {
        payment += availableExtra
        availableExtra = 0
      }
      const principal = payment - interest
      totalInterestPaid += interest
      debt.balance = Math.max(0, debt.balance - principal)
    })
    schedule.push({ month, totalBalance: current.reduce((s, d) => s + d.balance, 0), totalInterestPaid })
  }
  return schedule
}

function generateDebtPDF(debts: Debt[], strategy: PayoffStrategy, extra: number) {
  const doc = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' })
  const strategyLabel = strategy === 'avalanche' ? 'Avalanche (Highest APR First)' : 'Snowball (Smallest Balance First)'
  const now = new Date()
  const dateStr = now.toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })
  const W = doc.internal.pageSize.getWidth()
  const primaryColor: [number, number, number] = [15, 118, 110]
  const darkColor: [number, number, number] = [17, 24, 39]
  const grayColor: [number, number, number] = [107, 114, 128]

  const schedule = calculatePayoffSchedule(debts, strategy, extra)
  const totalDebt = debts.reduce((s, d) => s + d.balance, 0)
  const totalMonthly = debts.reduce((s, d) => s + d.monthlyPayment, 0)
  const totalAnnualInterest = debts.reduce((s, d) => s + calcAnnualInterest(d.balance, d.apr), 0)
  const weightedAPR = totalDebt > 0 ? debts.reduce((s, d) => s + d.balance * d.apr, 0) / totalDebt : 0
  const totalInterestPaid = schedule[schedule.length - 1]?.totalInterestPaid || 0
  const payoffMonths = schedule.length

  // ── COVER PAGE ────────────────────────────────────────────────────────────
  doc.setFillColor(...darkColor)
  doc.rect(0, 0, W, 60, 'F')
  doc.setFillColor(...primaryColor)
  doc.rect(0, 60, W, 4, 'F')

  doc.setTextColor(255, 255, 255)
  doc.setFontSize(22)
  doc.setFont('helvetica', 'bold')
  doc.text('PERSONAL DEBT MANAGEMENT REPORT', W / 2, 25, { align: 'center' })
  doc.setFontSize(13)
  doc.setFont('helvetica', 'normal')
  doc.text(`Strategy: ${strategyLabel}`, W / 2, 37, { align: 'center' })
  doc.setFontSize(10)
  doc.text(`Report Date: ${dateStr}`, W / 2, 47, { align: 'center' })
  doc.text('Confidential — For Personal Use Only', W / 2, 55, { align: 'center' })

  // ── EXECUTIVE SUMMARY ─────────────────────────────────────────────────────
  let y = 78
  doc.setTextColor(...darkColor)
  doc.setFontSize(13)
  doc.setFont('helvetica', 'bold')
  doc.text('EXECUTIVE SUMMARY', 15, y)
  doc.setFillColor(...primaryColor)
  doc.rect(15, y + 2, 50, 0.5, 'F')
  y += 12

  const summaryRows = [
    ['Total Outstanding Debt', formatCurrency(totalDebt)],
    ['Number of Debts', `${debts.length}`],
    ['Monthly Payment Obligation', formatCurrency(totalMonthly)],
    ['Annual Interest Cost', formatCurrency(totalAnnualInterest)],
    ['Weighted Average APR', `${weightedAPR.toFixed(2)}%`],
    ['Total Interest to Be Paid', formatCurrency(totalInterestPaid)],
    ['Projected Debt-Free Timeline', formatMonths(payoffMonths)],
    ['Selected Payoff Strategy', strategyLabel],
  ]
  if (extra > 0) summaryRows.push(['Extra Monthly Payment', formatCurrency(extra)])

  autoTable(doc, {
    startY: y,
    body: summaryRows,
    theme: 'grid',
    styles: { fontSize: 10, cellPadding: 4 },
    columnStyles: { 0: { fontStyle: 'bold', cellWidth: 100, textColor: [...grayColor] }, 1: { fontStyle: 'bold', textColor: [...darkColor] } },
    headStyles: { fillColor: [...primaryColor] },
  })

  // ── DEBT PORTFOLIO ────────────────────────────────────────────────────────
  y = (doc as any).lastAutoTable.finalY + 14
  if (y > 230) { doc.addPage(); y = 20 }
  doc.setFontSize(13)
  doc.setFont('helvetica', 'bold')
  doc.setTextColor(...darkColor)
  doc.text('DEBT PORTFOLIO ANALYSIS', 15, y)
  doc.setFillColor(...primaryColor)
  doc.rect(15, y + 2, 65, 0.5, 'F')
  y += 10

  const sortedDebts = [...debts].sort((a, b) =>
    strategy === 'avalanche' ? b.apr - a.apr : a.balance - b.balance
  )

  autoTable(doc, {
    startY: y,
    head: [['#', 'Debt Name', 'Type', 'Balance', 'APR', 'Monthly Pmt', 'Min Pmt', 'Annual Interest']],
    body: sortedDebts.map((d, i) => [
      `${i + 1}`,
      d.name,
      d.type,
      formatCurrency(d.balance),
      `${d.apr}%`,
      formatCurrency(d.monthlyPayment),
      formatCurrency(d.minimumPayment),
      formatCurrency(calcAnnualInterest(d.balance, d.apr)),
    ]),
    foot: [['', 'TOTAL', '', formatCurrency(totalDebt), `${weightedAPR.toFixed(1)}% avg`, formatCurrency(totalMonthly), '', formatCurrency(totalAnnualInterest)]],
    theme: 'striped',
    headStyles: { fillColor: [...primaryColor], fontStyle: 'bold', fontSize: 9 },
    footStyles: { fillColor: [...darkColor], textColor: [255, 255, 255], fontStyle: 'bold', fontSize: 9 },
    styles: { fontSize: 9, cellPadding: 3 },
  })

  // ── STRATEGY COMPARISON ───────────────────────────────────────────────────
  const avalSchedule = calculatePayoffSchedule(debts, 'avalanche', extra)
  const snowSchedule = calculatePayoffSchedule(debts, 'snowball', extra)

  y = (doc as any).lastAutoTable.finalY + 14
  if (y > 230) { doc.addPage(); y = 20 }
  doc.setFontSize(13)
  doc.setFont('helvetica', 'bold')
  doc.setTextColor(...darkColor)
  doc.text('STRATEGY COMPARISON', 15, y)
  doc.setFillColor(...primaryColor)
  doc.rect(15, y + 2, 55, 0.5, 'F')
  y += 10

  autoTable(doc, {
    startY: y,
    head: [['Strategy', 'Payoff Time', 'Total Interest Paid', 'Total Cost', 'vs Snowball']],
    body: [
      ['❄️ Snowball', formatMonths(snowSchedule.length), formatCurrency(snowSchedule[snowSchedule.length - 1]?.totalInterestPaid || 0), formatCurrency(totalDebt + (snowSchedule[snowSchedule.length - 1]?.totalInterestPaid || 0)), '—'],
      ['🔥 Avalanche', formatMonths(avalSchedule.length), formatCurrency(avalSchedule[avalSchedule.length - 1]?.totalInterestPaid || 0), formatCurrency(totalDebt + (avalSchedule[avalSchedule.length - 1]?.totalInterestPaid || 0)), `Save ${formatCurrency(Math.abs((snowSchedule[snowSchedule.length - 1]?.totalInterestPaid || 0) - (avalSchedule[avalSchedule.length - 1]?.totalInterestPaid || 0)))}`],
    ],
    theme: 'grid',
    headStyles: { fillColor: [...primaryColor], fontStyle: 'bold', fontSize: 10 },
    styles: { fontSize: 10, cellPadding: 4 },
    rowPageBreak: 'avoid',
  })

  // ── PAYOFF ORDER ──────────────────────────────────────────────────────────
  y = (doc as any).lastAutoTable.finalY + 14
  if (y > 230) { doc.addPage(); y = 20 }
  doc.setFontSize(13)
  doc.setFont('helvetica', 'bold')
  doc.setTextColor(...darkColor)
  doc.text(`RECOMMENDED PAYOFF ORDER — ${strategy.toUpperCase()}`, 15, y)
  doc.setFillColor(...primaryColor)
  doc.rect(15, y + 2, 90, 0.5, 'F')
  y += 10

  autoTable(doc, {
    startY: y,
    head: [['Priority', 'Debt Name', 'Type', 'Balance', 'APR', 'Annual Interest Cost']],
    body: sortedDebts.map((d, i) => [
      `#${i + 1}`,
      d.name,
      d.type,
      formatCurrency(d.balance),
      `${d.apr}%`,
      formatCurrency(calcAnnualInterest(d.balance, d.apr)),
    ]),
    theme: 'striped',
    headStyles: { fillColor: [...darkColor], fontStyle: 'bold', fontSize: 10 },
    styles: { fontSize: 10, cellPadding: 4 },
  })

  // ── EXTRA PAYMENT IMPACT ──────────────────────────────────────────────────
  if (extra > 0) {
    const baseSchedule = calculatePayoffSchedule(debts, strategy, 0)
    const acceleratedSchedule = calculatePayoffSchedule(debts, strategy, extra)
    const monthsSaved = baseSchedule.length - acceleratedSchedule.length
    const interestSaved = (baseSchedule[baseSchedule.length - 1]?.totalInterestPaid || 0) - (acceleratedSchedule[acceleratedSchedule.length - 1]?.totalInterestPaid || 0)

    y = (doc as any).lastAutoTable.finalY + 14
    if (y > 230) { doc.addPage(); y = 20 }
    doc.setFontSize(13)
    doc.setFont('helvetica', 'bold')
    doc.setTextColor(...darkColor)
    doc.text('EXTRA PAYMENT IMPACT ANALYSIS', 15, y)
    doc.setFillColor(...primaryColor)
    doc.rect(15, y + 2, 80, 0.5, 'F')
    y += 10

    autoTable(doc, {
      startY: y,
      body: [
        ['Extra Monthly Payment', formatCurrency(extra)],
        ['Without Extra — Payoff Time', formatMonths(baseSchedule.length)],
        ['With Extra — Payoff Time', formatMonths(acceleratedSchedule.length)],
        ['Time Saved', formatMonths(Math.max(0, monthsSaved))],
        ['Interest Saved', formatCurrency(Math.max(0, interestSaved))],
      ],
      theme: 'grid',
      styles: { fontSize: 10, cellPadding: 4 },
      columnStyles: { 0: { fontStyle: 'bold', cellWidth: 100, textColor: [...grayColor] }, 1: { fontStyle: 'bold', textColor: [15, 118, 110] } },
    })
  }

  // ── DISCLAIMER ────────────────────────────────────────────────────────────
  doc.addPage()
  y = 20
  doc.setFontSize(11)
  doc.setFont('helvetica', 'bold')
  doc.setTextColor(...darkColor)
  doc.text('DISCLAIMER', 15, y)
  y += 8
  doc.setFontSize(9)
  doc.setFont('helvetica', 'normal')
  doc.setTextColor(...grayColor)
  const disclaimer = 'This report is generated for personal financial planning purposes only and does not constitute professional financial, legal, or tax advice. The projections and calculations are estimates based on the data you provided and assume fixed interest rates and consistent payments. Actual results may vary based on changes in interest rates, payment amounts, or other factors. Please consult a qualified financial advisor for personalized guidance.'
  const lines = doc.splitTextToSize(disclaimer, W - 30)
  doc.text(lines, 15, y)

  doc.save(`debt-payoff-report-${strategy}-${now.toISOString().split('T')[0]}.pdf`)
}

// ── Main Component ────────────────────────────────────────────────────────────

export function DebtTrackerTab({ onDebtsChange }: DebtTrackerTabProps) {
  // ── State ─────────────────────────────────────────────────────────────────
  const [debts, setDebtsState] = useState<Debt[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [payoffStrategy, setPayoffStrategy] = useState<PayoffStrategy>('avalanche')
  const [extraPayment, setExtraPayment] = useState(0)
  const [expandedDebt, setExpandedDebt] = useState<string | null>(null)

  // Add Debt Mode
  const [addMode, setAddMode] = useState<'manual' | 'upload' | null>(null)
  const [isSaving, setIsSaving] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)

  // Manual form
  const [manualForm, setManualForm] = useState({
    name: '', type: 'Credit Card' as LoanType,
    balance: '', apr: '', monthlyPayment: '', minimumPayment: '', loanTermMonths: '', notes: '',
  })

  // Upload flow
  const [uploadLoanType, setUploadLoanType] = useState<LoanType>('Credit Card')
  const [uploadFile, setUploadFile] = useState<File | null>(null)
  const [isParsing, setIsParsing] = useState(false)
  const [parsedData, setParsedData] = useState<ParsedFileData | null>(null)
  const [confirmForm, setConfirmForm] = useState({
    name: '', balance: '', apr: '', monthlyPayment: '', minimumPayment: '',
  })

  // ── Sync debts to parent ──────────────────────────────────────────────────
  const setDebts = useCallback((newDebts: Debt[] | ((prev: Debt[]) => Debt[])) => {
    setDebtsState(prev => {
      const next = typeof newDebts === 'function' ? newDebts(prev) : newDebts
      onDebtsChange(next)
      return next
    })
  }, [onDebtsChange])

  // ── Load debts from Supabase ──────────────────────────────────────────────
  useEffect(() => {
    async function loadDebts() {
      try {
        const res = await fetch('/api/user-debts')
        if (res.ok) {
          const data = await res.json()
          if (Array.isArray(data)) {
            setDebtsState(data)
            onDebtsChange(data)
          }
        }
      } catch (e) {
        console.error('[DebtTrackerTab] Load error:', e)
      } finally {
        setIsLoading(false)
      }
    }
    loadDebts()
  }, [])

  // ── Handlers ──────────────────────────────────────────────────────────────

  async function handleAddManual() {
    if (!manualForm.name || !manualForm.balance || !manualForm.apr || !manualForm.monthlyPayment) {
      alert('Please fill in Name, Balance, APR, and Monthly Payment.')
      return
    }
    setIsSaving(true)
    const payload = {
      name: manualForm.name,
      type: manualForm.type,
      balance: parseFloat(manualForm.balance),
      apr: parseFloat(manualForm.apr),
      monthlyPayment: parseFloat(manualForm.monthlyPayment),
      minimumPayment: parseFloat(manualForm.minimumPayment) || 0,
      loanTermMonths: manualForm.loanTermMonths ? parseInt(manualForm.loanTermMonths) : null,
      notes: manualForm.notes || null,
      source: 'manual',
    }
    try {
      const res = await fetch('/api/user-debts', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload) })
      const json = await res.json()
      if (json.success && json.debt) {
        setDebts(prev => [json.debt, ...prev])
        setManualForm({ name: '', type: 'Credit Card', balance: '', apr: '', monthlyPayment: '', minimumPayment: '', loanTermMonths: '', notes: '' })
        setAddMode(null)
      } else {
        alert('Failed to save debt. Please try again.')
      }
    } catch {
      alert('Network error. Please try again.')
    } finally {
      setIsSaving(false)
    }
  }

  async function handleFileSelect(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return
    setUploadFile(file)
    setIsParsing(true)
    setParsedData(null)

    const formData = new FormData()
    formData.append('file', file)
    formData.append('loanType', uploadLoanType)

    try {
      const res = await fetch('/api/debt-parse', { method: 'POST', body: formData })
      const data = await res.json()
      if (!res.ok || data.error) {
        alert(data.error || 'Could not parse file.')
        setUploadFile(null)
        if (fileInputRef.current) fileInputRef.current.value = ''
        return
      }
      setParsedData({ ...data, fileName: file.name })
      setConfirmForm({
        name: data.accountName || file.name.replace(/\.(pdf|csv)$/i, ''),
        balance: data.balance?.toString() || '',
        apr: data.apr?.toString() || '',
        monthlyPayment: data.monthlyPayment?.toString() || '',
        minimumPayment: data.minimumPayment?.toString() || '',
      })
    } catch {
      alert('Network error while parsing file.')
    } finally {
      setIsParsing(false)
    }
  }

  async function handleSaveUploaded() {
    if (!parsedData || !confirmForm.name || !confirmForm.balance) {
      alert('Please confirm Name and Balance at minimum.')
      return
    }
    setIsSaving(true)
    const payload = {
      name: confirmForm.name,
      type: uploadLoanType,
      balance: parseFloat(confirmForm.balance) || 0,
      apr: parseFloat(confirmForm.apr) || 0,
      monthlyPayment: parseFloat(confirmForm.monthlyPayment) || 0,
      minimumPayment: parseFloat(confirmForm.minimumPayment) || 0,
      source: parsedData.fileType,
      fileName: parsedData.fileName,
      spendingInsights: parsedData.spendingInsights || null,
    }
    try {
      const res = await fetch('/api/user-debts', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload) })
      const json = await res.json()
      if (json.success && json.debt) {
        setDebts(prev => [json.debt, ...prev])
        setParsedData(null)
        setUploadFile(null)
        setAddMode(null)
        if (fileInputRef.current) fileInputRef.current.value = ''
      } else {
        alert('Failed to save. Please try again.')
      }
    } catch {
      alert('Network error.')
    } finally {
      setIsSaving(false)
    }
  }

  async function handleDeleteDebt(id: string) {
    if (!confirm('Delete this debt?')) return
    try {
      const res = await fetch(`/api/user-debts?id=${id}`, { method: 'DELETE' })
      if (res.ok) setDebts(prev => prev.filter(d => d.id !== id))
      else alert('Failed to delete.')
    } catch {
      alert('Network error.')
    }
  }
  // ── Calculations ──────────────────────────────────────────────────────────

  const totalDebt = useMemo(() => debts.reduce((s, d) => s + d.balance, 0), [debts])
  const totalMonthly = useMemo(() => debts.reduce((s, d) => s + d.monthlyPayment, 0), [debts])
  const totalMonthlyInterest = useMemo(() => debts.reduce((s, d) => s + calcMonthlyInterest(d.balance, d.apr), 0), [debts])
  const totalAnnualInterest = useMemo(() => debts.reduce((s, d) => s + calcAnnualInterest(d.balance, d.apr), 0), [debts])
  const weightedAPR = useMemo(() => totalDebt > 0 ? debts.reduce((s, d) => s + d.balance * d.apr, 0) / totalDebt : 0, [debts, totalDebt])

  const avalanche0 = useMemo(() => calculatePayoffSchedule(debts, 'avalanche', 0), [debts])
  const snowball0 = useMemo(() => calculatePayoffSchedule(debts, 'snowball', 0), [debts])
  const avalancheExtra = useMemo(() => calculatePayoffSchedule(debts, 'avalanche', extraPayment), [debts, extraPayment])
  const snowballExtra = useMemo(() => calculatePayoffSchedule(debts, 'snowball', extraPayment), [debts, extraPayment])

  const currentAval = extraPayment > 0 ? avalancheExtra : avalanche0
  const currentSnow = extraPayment > 0 ? snowballExtra : snowball0
  const currentSchedule = payoffStrategy === 'avalanche' ? currentAval : currentSnow

  const debtByType = useMemo(() => {
    const map: Record<string, number> = {}
    debts.forEach(d => { map[d.type] = (map[d.type] || 0) + d.balance })
    return Object.entries(map).map(([name, value]) => ({ name, value, fill: DEBT_COLORS[name] || '#6b7280' }))
  }, [debts])

  const payoffTimelineData = useMemo(() => {
    if (!currentSchedule.length) return []
    const step = Math.max(1, Math.floor(currentSchedule.length / 24))
    return currentSchedule.filter((_, i) => i % step === 0 || i === currentSchedule.length - 1).map(s => ({
      month: `Mo ${s.month}`, balance: Math.round(s.totalBalance),
    }))
  }, [currentSchedule])

  const sortedPayoffOrder = useMemo(() =>
    [...debts].sort((a, b) => payoffStrategy === 'avalanche' ? b.apr - a.apr : a.balance - b.balance),
    [debts, payoffStrategy]
  )

  // ── Render ────────────────────────────────────────────────────────────────

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-24">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
        <span className="ml-3 text-muted-foreground">Loading your debts...</span>
      </div>
    )
  }

  return (
    <div className="space-y-6">

      {/* ── Summary Cards ───────────────────────────────────────────── */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {[
          { label: 'Total Debt', value: formatCurrency(totalDebt), sub: `${debts.length} debt${debts.length !== 1 ? 's' : ''}`, color: 'text-red-500', icon: <CreditCard className="h-4 w-4" /> },
          { label: 'Monthly Payment', value: formatCurrency(totalMonthly), sub: 'Min payments', color: 'text-foreground', icon: <DollarSign className="h-4 w-4" /> },
          { label: 'Annual Interest', value: formatCurrency(totalAnnualInterest), sub: `${formatCurrency(totalMonthlyInterest)}/month`, color: 'text-orange-500', icon: <TrendingDown className="h-4 w-4" /> },
          { label: 'Avg APR', value: `${weightedAPR.toFixed(2)}%`, sub: 'Weighted average', color: 'text-foreground', icon: <Activity className="h-4 w-4" /> },
        ].map(({ label, value, sub, color, icon }) => (
          <Card key={label} className="border-border bg-card">
            <CardContent className="pt-6">
              <div className="flex items-center gap-2 text-sm text-muted-foreground mb-2">{icon}{label}</div>
              <p className={`text-2xl font-bold ${color}`}>{value}</p>
              <p className="text-xs text-muted-foreground mt-1">{sub}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* ── Add Debt Section ─────────────────────────────────────────── */}
      <Card className="border-border bg-card">
        <CardHeader>
          <div className="flex items-center justify-between flex-wrap gap-3">
            <div>
              <CardTitle className="text-base">Your Debts</CardTitle>
              <p className="text-xs text-muted-foreground mt-1">Add debts manually or upload a PDF/CSV statement</p>
            </div>
            {addMode === null && (
              <div className="flex gap-2">
                <button onClick={() => setAddMode('manual')} className="flex items-center gap-1.5 rounded bg-primary px-3 py-1.5 text-sm text-primary-foreground hover:bg-primary/90">
                  <Plus className="h-4 w-4" /> Manual Entry
                </button>
                <button onClick={() => setAddMode('upload')} className="flex items-center gap-1.5 rounded border border-primary px-3 py-1.5 text-sm text-primary hover:bg-primary/10">
                  <Upload className="h-4 w-4" /> Upload File
                </button>
              </div>
            )}
          </div>
        </CardHeader>
        <CardContent className="space-y-4">

          {/* Manual Form */}
          {addMode === 'manual' && (
            <div className="rounded-lg border border-border bg-secondary/50 p-4 space-y-4">
              <h4 className="text-sm font-semibold text-foreground">New Debt Entry</h4>
              <div className="grid gap-3 sm:grid-cols-2">
                <div>
                  <label className="text-xs text-muted-foreground mb-1 block">Name</label>
                  <input type="text" placeholder="e.g. Chase Sapphire" value={manualForm.name} onChange={e => setManualForm(p => ({ ...p, name: e.target.value }))} className="w-full rounded border border-border bg-background px-3 py-2 text-sm" />
                </div>
                <div>
                  <label className="text-xs text-muted-foreground mb-1 block">Type</label>
                  <select value={manualForm.type} onChange={e => setManualForm(p => ({ ...p, type: e.target.value as LoanType }))} className="w-full rounded border border-border bg-background px-3 py-2 text-sm">
                    {LOAN_TYPES.map(t => <option key={t}>{t}</option>)}
                  </select>
                </div>
                <div>
                  <label className="text-xs text-muted-foreground mb-1 block">Balance ($)</label>
                  <input type="number" placeholder="4000" value={manualForm.balance} onChange={e => setManualForm(p => ({ ...p, balance: e.target.value }))} className="w-full rounded border border-border bg-background px-3 py-2 text-sm" />
                </div>
                <div>
                  <label className="text-xs text-muted-foreground mb-1 block">APR (%)</label>
                  <input type="number" placeholder="19.99" value={manualForm.apr} onChange={e => setManualForm(p => ({ ...p, apr: e.target.value }))} className="w-full rounded border border-border bg-background px-3 py-2 text-sm" />
                </div>
                <div>
                  <label className="text-xs text-muted-foreground mb-1 block">Monthly Payment ($)</label>
                  <input type="number" placeholder="200" value={manualForm.monthlyPayment} onChange={e => setManualForm(p => ({ ...p, monthlyPayment: e.target.value }))} className="w-full rounded border border-border bg-background px-3 py-2 text-sm" />
                </div>
                <div>
                  <label className="text-xs text-muted-foreground mb-1 block">Minimum Payment ($)</label>
                  <input type="number" placeholder="40" value={manualForm.minimumPayment} onChange={e => setManualForm(p => ({ ...p, minimumPayment: e.target.value }))} className="w-full rounded border border-border bg-background px-3 py-2 text-sm" />
                </div>
                <div>
                  <label className="text-xs text-muted-foreground mb-1 block">Loan Term (months, optional)</label>
                  <input type="number" placeholder="60" value={manualForm.loanTermMonths} onChange={e => setManualForm(p => ({ ...p, loanTermMonths: e.target.value }))} className="w-full rounded border border-border bg-background px-3 py-2 text-sm" />
                </div>
                <div>
                  <label className="text-xs text-muted-foreground mb-1 block">Notes (optional)</label>
                  <input type="text" placeholder="Any notes..." value={manualForm.notes} onChange={e => setManualForm(p => ({ ...p, notes: e.target.value }))} className="w-full rounded border border-border bg-background px-3 py-2 text-sm" />
                </div>
              </div>
              <div className="flex gap-2">
                <button onClick={handleAddManual} disabled={isSaving} className="rounded bg-primary px-4 py-1.5 text-sm text-primary-foreground hover:bg-primary/90 disabled:opacity-50 flex items-center gap-1">
                  {isSaving ? <Loader2 className="h-3 w-3 animate-spin" /> : null} Save Debt
                </button>
                <button onClick={() => setAddMode(null)} className="rounded bg-secondary px-4 py-1.5 text-sm hover:bg-secondary/80">Cancel</button>
              </div>
            </div>
          )}

          {/* Upload Flow */}
          {addMode === 'upload' && (
            <div className="rounded-lg border border-border bg-secondary/50 p-4 space-y-4">
              <h4 className="text-sm font-semibold text-foreground">Upload Statement</h4>
              <div className="grid gap-3 sm:grid-cols-2">
                <div>
                  <label className="text-xs text-muted-foreground mb-1 block">Loan Type</label>
                  <select value={uploadLoanType} onChange={e => setUploadLoanType(e.target.value as LoanType)} className="w-full rounded border border-border bg-background px-3 py-2 text-sm">
                    {LOAN_TYPES.map(t => <option key={t}>{t}</option>)}
                  </select>
                </div>
                <div>
                  <label className="text-xs text-muted-foreground mb-1 block">Upload PDF or CSV</label>
                  <input ref={fileInputRef} type="file" accept=".pdf,.csv" onChange={handleFileSelect} className="w-full rounded border border-border bg-background px-3 py-2 text-sm file:mr-3 file:rounded file:border-0 file:bg-primary file:px-2 file:py-1 file:text-xs file:text-primary-foreground" />
                </div>
              </div>

              {isParsing && (
                <div className="flex items-center gap-2 text-sm text-primary">
                  <Loader2 className="h-4 w-4 animate-spin" /> Extracting data from file...
                </div>
              )}

              {parsedData && !isParsing && (
                <div className="space-y-3 rounded-lg border border-primary/30 bg-primary/5 p-4">
                  <div className="flex items-center gap-2">
                    <CheckCircle2 className="h-4 w-4 text-green-500" />
                    <span className="text-sm font-medium text-foreground">
                      {parsedData.fileType === 'csv' ? `CSV parsed — ${parsedData.spendingInsights?.totalTransactions || 0} transactions found` : 'PDF parsed — please verify the extracted values'}
                    </span>
                  </div>
                  {parsedData.partialExtraction && (
                    <p className="text-xs text-orange-500 flex items-center gap-1">
                      <AlertTriangle className="h-3 w-3" /> Partial extraction — please review and correct values below.
                    </p>
                  )}
                  <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                    {[
                      { label: 'Debt Name', key: 'name', placeholder: 'Account name' },
                      { label: 'Balance ($)', key: 'balance', placeholder: '0' },
                      { label: 'APR (%)', key: 'apr', placeholder: '0' },
                      { label: 'Monthly Payment ($)', key: 'monthlyPayment', placeholder: '0' },
                      { label: 'Minimum Payment ($)', key: 'minimumPayment', placeholder: '0' },
                    ].map(({ label, key, placeholder }) => (
                      <div key={key}>
                        <label className="text-xs text-muted-foreground mb-1 block">{label}</label>
                        <input
                          type={key === 'name' ? 'text' : 'number'}
                          placeholder={placeholder}
                          value={confirmForm[key as keyof typeof confirmForm]}
                          onChange={e => setConfirmForm(p => ({ ...p, [key]: e.target.value }))}
                          className="w-full rounded border border-border bg-background px-3 py-2 text-sm"
                        />
                      </div>
                    ))}
                  </div>
                  <div className="flex gap-2">
                    <button onClick={handleSaveUploaded} disabled={isSaving} className="rounded bg-primary px-4 py-1.5 text-sm text-primary-foreground hover:bg-primary/90 disabled:opacity-50 flex items-center gap-1">
                      {isSaving ? <Loader2 className="h-3 w-3 animate-spin" /> : null} Confirm & Save
                    </button>
                    <button onClick={() => { setParsedData(null); setUploadFile(null); if (fileInputRef.current) fileInputRef.current.value = '' }} className="rounded bg-secondary px-4 py-1.5 text-sm hover:bg-secondary/80">Clear</button>
                  </div>
                </div>
              )}

              <button onClick={() => { setAddMode(null); setParsedData(null); setUploadFile(null) }} className="text-xs text-muted-foreground hover:text-foreground">← Back</button>
            </div>
          )}

          {/* Debt List */}
          {debts.length === 0 && addMode === null ? (
            <div className="text-center py-10 text-muted-foreground">
              <CreditCard className="h-12 w-12 mx-auto mb-3 opacity-30" />
              <p className="text-sm">No debts tracked yet. Add your first debt above.</p>
            </div>
          ) : (
            <div className="space-y-3">
              {debts.map(debt => {
                const mInterest = calcMonthlyInterest(debt.balance, debt.apr)
                const aInterest = calcAnnualInterest(debt.balance, debt.apr)
                const isExpanded = expandedDebt === debt.id
                const hasInsights = !!debt.spendingInsights

                return (
                  <div key={debt.id} className="rounded-lg border border-border bg-secondary/30">
                    <div className="p-4">
                      <div className="flex items-start justify-between gap-3">
                        <div className="flex-1">
                          <div className="flex items-center gap-2 flex-wrap mb-2">
                            <span className="font-semibold text-foreground">{debt.name}</span>
                            <span className="text-xs px-2 py-0.5 rounded-full bg-secondary text-muted-foreground">{debt.type}</span>
                            <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${debt.apr > 15 ? 'bg-red-500/20 text-red-500' : debt.apr > 8 ? 'bg-orange-500/20 text-orange-500' : 'bg-green-500/20 text-green-500'}`}>{debt.apr}% APR</span>
                            {debt.source !== 'manual' && <span className="text-xs px-2 py-0.5 rounded-full bg-blue-500/20 text-blue-400 flex items-center gap-1"><FileText className="h-3 w-3" />{debt.source.toUpperCase()}</span>}
                          </div>
                          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 text-sm">
                            <div><p className="text-xs text-muted-foreground">Balance</p><p className="font-semibold">{formatCurrency(debt.balance)}</p></div>
                            <div><p className="text-xs text-muted-foreground">Monthly</p><p className="font-semibold">{formatCurrency(debt.monthlyPayment)}</p></div>
                            <div><p className="text-xs text-muted-foreground">Interest/mo</p><p className="font-semibold text-orange-500">{formatCurrency(mInterest)}</p></div>
                            <div><p className="text-xs text-muted-foreground">Interest/yr</p><p className="font-semibold text-red-500">{formatCurrency(aInterest)}</p></div>
                          </div>
                        </div>
                        <div className="flex items-center gap-1 shrink-0">
                          {hasInsights && (
                            <button onClick={() => setExpandedDebt(isExpanded ? null : debt.id)} className="p-1.5 rounded hover:bg-secondary text-muted-foreground">
                              {isExpanded ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
                            </button>
                          )}
                          <button onClick={() => handleDeleteDebt(debt.id)} className="p-1.5 rounded hover:bg-red-500/10 text-red-500">
                            <Trash2 className="h-4 w-4" />
                          </button>
                        </div>
                      </div>
                    </div>

                    {/* Spending Insights (CSV uploads) */}
                    {isExpanded && hasInsights && debt.spendingInsights && (
                      <div className="border-t border-border p-4 space-y-3">
                        <h5 className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">SPENDING NATURE</h5>
                        <div className="space-y-2">
                          <div className="flex items-center gap-3 p-2 rounded-lg bg-secondary/50">
                            <div className="w-3 h-3 rounded-full shrink-0" style={{ backgroundColor: CATEGORY_COLORS[debt.spendingInsights.topCategory] || '#6b7280' }} />
                            <div>
                              <p className="text-sm font-medium text-foreground">{debt.name}</p>
                              <p className="text-xs text-muted-foreground flex items-center gap-1">
                                <Activity className="h-3 w-3" /> {debt.spendingInsights.spendingNature}
                              </p>
                            </div>
                          </div>
                          {Object.entries(debt.spendingInsights.categories).sort((a, b) => b[1].amount - a[1].amount).slice(0, 4).map(([cat, data]) => (
                            <div key={cat} className="flex items-center gap-3">
                              <div className="w-2 h-2 rounded-full shrink-0" style={{ backgroundColor: CATEGORY_COLORS[cat] || '#6b7280' }} />
                              <div className="flex-1">
                                <div className="flex justify-between text-xs mb-0.5">
                                  <span className="text-muted-foreground">{cat}</span>
                                  <span className="font-medium">{data.percentage.toFixed(1)}% ({formatCurrency(data.amount)})</span>
                                </div>
                                <Progress value={data.percentage} className="h-1.5" />
                              </div>
                            </div>
                          ))}
                        </div>
                        <div className="rounded-lg border border-border bg-secondary/50 p-3 space-y-1">
                          <p className="text-xs font-semibold text-muted-foreground uppercase">Primary Pattern</p>
                          <p className="text-xs text-foreground">{debt.spendingInsights.spendingNature} — {debt.spendingInsights.totalTransactions} transactions, {formatCurrency(debt.spendingInsights.monthlyAverage)}/mo avg</p>
                        </div>
                        <div className="rounded-lg border border-primary/30 bg-primary/5 p-3">
                          <p className="text-xs font-semibold text-primary uppercase mb-1">Strategy Tip</p>
                          <p className="text-xs text-foreground">{debt.spendingInsights.strategyTip}</p>
                        </div>
                      </div>
                    )}
                  </div>
                )
              })}
            </div>
          )}
        </CardContent>
      </Card>

      {/* ── Strategy Section (only if debts exist) ─────────────────── */}
      {debts.length > 0 && (
        <>
          <Card className="border-border bg-card">
            <CardHeader>
              <div className="flex items-center justify-between flex-wrap gap-3">
                <div>
                  <CardTitle className="text-base">Payoff Strategy</CardTitle>
                  <p className="text-xs text-muted-foreground mt-1">Choose your strategy and see the real impact of extra payments</p>
                </div>
                <button onClick={() => generateDebtPDF(debts, payoffStrategy, extraPayment)} className="flex items-center gap-1.5 rounded border border-border bg-secondary px-3 py-1.5 text-sm hover:bg-secondary/80">
                  <Download className="h-4 w-4" /> Export PDF
                </button>
              </div>
            </CardHeader>
            <CardContent className="space-y-6">

              {/* Strategy Cards */}
              <div className="grid gap-4 sm:grid-cols-2">
                {([
                  { key: 'snowball' as PayoffStrategy, icon: <Snowflake className="h-5 w-5 text-blue-400" />, label: '❄️ Snowball', desc: 'Smallest balance first. Quick psychological wins.', schedule: currentSnow },
                  { key: 'avalanche' as PayoffStrategy, icon: <Flame className="h-5 w-5 text-orange-500" />, label: '🔥 Avalanche', desc: 'Highest APR first. Saves the most interest.', schedule: currentAval },
                ] as const).map(({ key, icon, label, desc, schedule }) => (
                  <button key={key} onClick={() => setPayoffStrategy(key)} className={`text-left rounded-lg border-2 p-4 transition-all ${payoffStrategy === key ? 'border-primary bg-primary/5' : 'border-border bg-secondary/30 hover:border-primary/50'}`}>
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center gap-2 font-semibold text-sm">{icon}{label}</div>
                      {payoffStrategy === key && <CheckCircle2 className="h-4 w-4 text-primary" />}
                    </div>
                    <p className="text-xs text-muted-foreground mb-3">{desc}</p>
                    <div className="grid grid-cols-2 gap-2 text-xs">
                      <div><p className="text-muted-foreground">Payoff Time</p><p className="font-bold text-foreground">{formatMonths(schedule.length)}</p></div>
                      <div><p className="text-muted-foreground">Total Interest</p><p className="font-bold text-red-500">{formatCurrency(schedule[schedule.length - 1]?.totalInterestPaid || 0)}</p></div>
                    </div>
                  </button>
                ))}
              </div>

              {/* Extra Payment Slider */}
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <label className="text-sm font-medium text-foreground">Extra Monthly Payment</label>
                  <div className="flex items-center gap-1">
                    <span className="text-sm text-muted-foreground">$</span>
                    <span className="text-lg font-bold text-primary w-16 text-right">{extraPayment}</span>
                  </div>
                </div>
                <input
                  type="range" min={0} max={2000} step={25}
                  value={extraPayment}
                  onChange={e => setExtraPayment(Number(e.target.value))}
                  className="w-full accent-primary"
                />
                <div className="flex justify-between text-xs text-muted-foreground"><span>$0</span><span>$500</span><span>$1,000</span><span>$1,500</span><span>$2,000</span></div>
              </div>

              {/* Comparison Table */}
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-border">
                      {['Strategy', 'Extra/mo', 'Payoff Time', 'Total Interest', 'Total Cost', 'vs Snowball'].map(h => (
                        <th key={h} className="py-2 px-3 text-left text-xs font-semibold text-muted-foreground">{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {[
                      { key: 'snowball' as const, label: '❄️ Snowball', schedule: currentSnow },
                      { key: 'avalanche' as const, label: '🔥 Avalanche', schedule: currentAval },
                    ].map(({ key, label, schedule }) => {
                      const totalInterest = schedule[schedule.length - 1]?.totalInterestPaid || 0
                      const totalCost = totalDebt + totalInterest
                      const snowInterest = currentSnow[currentSnow.length - 1]?.totalInterestPaid || 0
                      const savings = snowInterest - totalInterest

                      return (
                        <tr key={key} className={`border-b border-border/50 ${payoffStrategy === key ? 'bg-primary/5' : ''}`}>
                          <td className="py-2.5 px-3 font-medium">{label}{payoffStrategy === key && <span className="ml-1 text-xs text-primary">●</span>}</td>
                          <td className="py-2.5 px-3">{formatCurrency(extraPayment)}</td>
                          <td className="py-2.5 px-3 font-semibold text-green-500">{formatMonths(schedule.length)}</td>
                          <td className="py-2.5 px-3 font-semibold text-red-500">{formatCurrency(totalInterest)}</td>
                          <td className="py-2.5 px-3">{formatCurrency(totalCost)}</td>
                          <td className="py-2.5 px-3">{key === 'snowball' ? <span className="text-muted-foreground">—</span> : <span className="text-green-500 font-semibold">save {formatCurrency(Math.max(0, savings))}</span>}</td>
                        </tr>
                      )
                    })}
                  </tbody>
                </table>
              </div>

              {/* Payoff Priority Order */}
              <div>
                <h4 className="text-sm font-semibold text-foreground mb-3">
                  {payoffStrategy === 'avalanche' ? '🔥 Avalanche' : '❄️ Snowball'} — Payoff Order
                </h4>
                <div className="space-y-2">
                  {sortedPayoffOrder.map((debt, i) => (
                    <div key={debt.id} className="flex items-center gap-3 p-3 rounded-lg bg-secondary/30">
                      <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary text-primary-foreground font-bold text-sm shrink-0">{i + 1}</div>
                      <div className="flex-1 grid grid-cols-3 gap-3 text-sm min-w-0">
                        <div><p className="font-medium text-foreground truncate">{debt.name}</p><p className="text-xs text-muted-foreground">{debt.type}</p></div>
                        <div><p className="text-foreground">{formatCurrency(debt.balance)}</p><p className="text-xs text-muted-foreground">Balance</p></div>
                        <div><p className={`font-medium ${debt.apr > 15 ? 'text-red-500' : debt.apr > 8 ? 'text-orange-500' : 'text-green-500'}`}>{debt.apr}% APR</p><p className="text-xs text-muted-foreground">{formatCurrency(calcAnnualInterest(debt.balance, debt.apr))}/yr</p></div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </CardContent>
          </Card>

          {/* ── Charts ──────────────────────────────────────────────────── */}
          <div className="grid gap-6 lg:grid-cols-2">
            {/* Pie Chart */}
            <Card className="border-border bg-card">
              <CardHeader><CardTitle className="text-base">Debt by Type</CardTitle></CardHeader>
              <CardContent>
                <div className="h-[260px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie data={debtByType} cx="50%" cy="50%" outerRadius={90} dataKey="value" label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`} labelLine={false}>
                        {debtByType.map((entry, i) => <Cell key={i} fill={entry.fill} />)}
                      </Pie>
                      <Tooltip contentStyle={{ backgroundColor: 'hsl(var(--card))', border: '1px solid hsl(var(--border))', borderRadius: '8px' }} formatter={(v: number) => [formatCurrency(v), 'Amount']} />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>

            {/* Bar Chart */}
            <Card className="border-border bg-card">
              <CardHeader><CardTitle className="text-base">Annual Interest by Debt</CardTitle></CardHeader>
              <CardContent>
                <div className="h-[260px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={debts.map(d => ({ name: d.name, interest: Math.round(calcAnnualInterest(d.balance, d.apr)) }))} margin={{ top: 5, right: 10, left: 10, bottom: 40 }}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#374151" opacity={0.5} />
                      <XAxis dataKey="name" fontSize={10} angle={-35} textAnchor="end" height={70} stroke="#9ca3af" />
                      <YAxis tickFormatter={v => `$${(v / 1000).toFixed(0)}k`} fontSize={11} stroke="#9ca3af" />
                      <Tooltip contentStyle={{ backgroundColor: 'hsl(var(--card))', border: '1px solid hsl(var(--border))', borderRadius: '8px' }} formatter={(v: number) => [formatCurrency(v), 'Annual Interest']} />
                      <Bar dataKey="interest" fill="#f97316" radius={[6, 6, 0, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Payoff Timeline */}
          <Card className="border-border bg-card">
            <CardHeader>
              <CardTitle className="text-base">Debt Payoff Timeline — {payoffStrategy === 'avalanche' ? '🔥 Avalanche' : '❄️ Snowball'}</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="h-[280px]">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={payoffTimelineData} margin={{ top: 5, right: 20, left: 10, bottom: 5 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#374151" opacity={0.5} />
                    <XAxis dataKey="month" fontSize={11} stroke="#9ca3af" />
                    <YAxis tickFormatter={v => `$${(v / 1000).toFixed(0)}k`} fontSize={11} stroke="#9ca3af" />
                    <Tooltip contentStyle={{ backgroundColor: 'hsl(var(--card))', border: '1px solid hsl(var(--border))', borderRadius: '8px' }} formatter={(v: number) => [formatCurrency(v), 'Remaining Balance']} />
                    <Line type="monotone" dataKey="balance" stroke="#22c55e" strokeWidth={2} dot={false} />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>
        </>
      )}
    </div>
  )
}
