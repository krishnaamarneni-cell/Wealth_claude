'use client'

import { useState, useMemo, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { getSupabaseClient } from '@/lib/supabase-client'
import jsPDF from 'jspdf'
import autoTable from 'jspdf-autotable'
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  LineChart, Line, PieChart, Pie, Cell
} from 'recharts'
import {
  Trash2, Upload, FileText, Plus, ChevronDown, ChevronUp,
  Snowflake, Flame, TrendingDown, DollarSign, AlertTriangle, Download
} from 'lucide-react'

// ── TYPES ────────────────────────────────────────────────────────────────────
export interface Debt {
  id: string
  name: string
  type: string
  balance: number
  apr: number
  monthlyPayment: number
  minimumPayment: number
}

const LOAN_TYPES = [
  { label: 'Credit Card', value: 'credit_card' },
  { label: 'Mortgage', value: 'mortgage' },
  { label: 'Car / Auto Loan', value: 'auto_loan' },
  { label: 'Personal Loan', value: 'personal_loan' },
  { label: 'Student Loan', value: 'student_loan' },
  { label: 'Other', value: 'other' },
]

const DEBT_COLORS: Record<string, string> = {
  credit_card: '#ef4444',
  mortgage: '#eab308',
  auto_loan: '#f97316',
  personal_loan: '#8b5cf6',
  student_loan: '#3b82f6',
  other: '#6b7280',
}

// ── REGEX PDF EXTRACTION LOGIC (Ported from working Credit Card tool) ─────────
function extractFromText(text: string, fileName: string): Partial<Debt> | null {
  const balancePatterns = [
    /new\s+balance[:\s]+\$?([\d,]+\.?\d*)/i,
    /current\s+balance[:\s]+\$?([\d,]+\.?\d*)/i,
    /statement\s+balance[:\s]+\$?([\d,]+\.?\d*)/i,
    /total\s+balance[:\s]+\$?([\d,]+\.?\d*)/i,
    /ending\s+balance[:\s]+\$?([\d,]+\.?\d*)/i,
    /closing\s+balance[:\s]+\$?([\d,]+\.?\d*)/i,
    /balance\s+due[:\s]+\$?([\d,]+\.?\d*)/i,
    /outstanding\s+balance[:\s]+\$?([\d,]+\.?\d*)/i,
  ]
  const aprPatterns = [
    /purchases?\s+([\d.]+)%/i,
    /purchase\s+apr[:\s]+([\d.]+)%/i,
    /purchase\s+rate[:\s]+([\d.]+)%/i,
    /annual\s+percentage\s+rate.*?purchases.*?([\d.]+)%/is,
    /variable\s+apr[:\s]+([\d.]+)%/i,
    /([\d.]+)%\s*\(v\)/i,
    /([\d.]+)%\s*variable/i,
    /interest\s+rate[:\s]+([\d.]+)%/i,
    /apr[:\s]+([\d.]+)%/i,
  ]
  const minPatterns = [
    /minimum\s+payment\s+due[:\s]+\$?([\d,]+\.?\d*)/i,
    /minimum\s+payment[:\s]+\$?([\d,]+\.?\d*)/i,
    /min(?:imum)?\s+due[:\s]+\$?([\d,]+\.?\d*)/i,
    /required\s+payment[:\s]+\$?([\d,]+\.?\d*)/i,
    /amount\s+due[:\s]+\$?([\d,]+\.?\d*)/i,
    /payment\s+due[:\s]+\$?([\d,]+\.?\d*)/i,
  ]

  const tryP = (patterns: RegExp[], src: string) => {
    for (const p of patterns) { const m = src.match(p); if (m) return m[1].replace(/,/g, "").trim() }
    return null
  }
  const balance = parseFloat(tryP(balancePatterns, text) || "0")
  const apr = parseFloat(tryP(aprPatterns, text) || "0")
  const minPayment = parseFloat(tryP(minPatterns, text) || "0") || Math.max(25, balance * 0.02)

  if (balance <= 0) return null

  const nameBase = fileName.replace(/\.[^.]+$/, "").replace(/[-_\d]/g, " ").replace(/\s+/g, " ").trim()
  const name = nameBase.length > 2 ? nameBase : "Imported Statement"

  return { name, balance, apr, minimumPayment: minPayment, monthlyPayment: minPayment }
}

// ── UTILS ─────────────────────────────────────────────────────────────────────
function formatCurrency(v: number) {
  return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 }).format(v)
}

function formatMonths(months: number) {
  if (months <= 0) return '0 mo'
  const y = Math.floor(months / 12)
  const m = months % 12
  return y > 0 ? `${y}y ${m}m` : `${m} mo`
}

function calcSchedule(debts: Debt[], strategy: 'avalanche' | 'snowball', extra: number) {
  if (!debts.length) return []
  const sorted = [...debts].sort((a, b) => strategy === 'avalanche' ? b.apr - a.apr : a.balance - b.balance)
  let working = sorted.map(d => ({ ...d, bal: d.balance }))
  let month = 0, totalInterest = 0
  const schedule: { month: number; totalBalance: number; totalInterestPaid: number }[] = []
  while (working.some(d => d.bal > 0.01) && month < 600) {
    month++
    let extraLeft = extra
    working = working.map((d, i) => {
      if (d.bal <= 0) return d
      const interest = (d.bal * (d.apr / 100)) / 12
      totalInterest += interest
      const isPriority = i === working.findIndex(x => x.bal > 0)
      let payment = d.minimumPayment + (isPriority ? extraLeft : 0)
      extraLeft = Math.max(0, extraLeft - (d.bal - payment)) // simplified extra carryover
      const newBal = Math.max(0, d.bal - (payment - interest))
      return { ...d, bal: newBal }
    })
    schedule.push({ month, totalBalance: working.reduce((s, d) => s + d.bal, 0), totalInterestPaid: totalInterest })
  }
  return schedule
}

// ── COMPONENT ─────────────────────────────────────────────────────────────────
export function DebtTrackerTab({ onDebtsChange }: { onDebtsChange?: (debts: Debt[]) => void }) {
  const supabase = getSupabaseClient()
  const { debts: rawDebts, loading, addDebt } = useDebtData()

  // Map Supabase → UI Debt shape
  const debts: Debt[] = useMemo(() => {
    const mapped = (rawDebts || []).map(d => ({
      id: d.id,
      name: d.name,
      type: d.type,
      balance: d.currentBalance ?? 0,
      apr: d.interestRate ?? 0,
      monthlyPayment: d.minimumPayment ?? 0,
      minimumPayment: d.minimumPayment ?? 0,
    }))
    onDebtsChange?.(mapped)
    return mapped
  }, [rawDebts, onDebtsChange])

  // UI State
  const [strategy, setStrategy] = useState<'avalanche' | 'snowball'>('avalanche')
  const [extra, setExtra] = useState(0)
  const [saving, setSaving] = useState(false)
  const [showForm, setShowForm] = useState(false)
  const [isParsing, setIsParsing] = useState(false)

  // Forms
  const [manualForm, setManualForm] = useState({ name: '', type: 'credit_card', balance: '', apr: '', minPay: '' })
  const [confirmData, setConfirmData] = useState<Partial<Debt> | null>(null)

  // ── SAVE DEBT (Direct via useDebtData) ──────────────────────────────────────
  const handleSave = async (data: any) => {
    setSaving(true)
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) { alert('Please log in'); setSaving(false); return }

      const success = await addDebt({
        userId: user.id,
        name: data.name,
        type: (data.type || 'credit_card') as any,
        principal: parseFloat(data.balance),
        currentBalance: parseFloat(data.balance),
        interestRate: parseFloat(data.apr),
        minimumPayment: parseFloat(data.minPay || data.minimumPayment) || 25,
        dueDate: '',
        status: 'active',
      })

      if (success) {
        setShowForm(false)
        setConfirmData(null)
        setManualForm({ name: '', type: 'credit_card', balance: '', apr: '', minPay: '' })
      } else {
        alert('Failed to save. Check your connection.')
      }
    } catch (e: any) { alert(e.message) }
    setSaving(false)
  }

  // ── DELETE DEBT ─────────────────────────────────────────────────────────────
  const handleDelete = async (id: string) => {
    if (!confirm('Delete this debt?')) return
    await supabase.from('debts').delete().eq('id', id)
    window.location.reload() // Fastest way to refresh hook state
  }

  // ── PDF EXTRACTION (CLIENT SIDE) ───────────────────────────────────────────
  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]; if (!file) return
    setIsParsing(true)
    try {
      if (file.name.toLowerCase().endsWith('.pdf')) {
        // Load pdf.js dynamically
        if (!(window as any).pdfjsLib) {
          await new Promise<void>((res) => {
            const s = document.createElement("script"); s.src = "https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.min.js"; s.onload = () => res(); document.head.appendChild(s)
          })
            ; (window as any).pdfjsLib.GlobalWorkerOptions.workerSrc = "https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.worker.min.js"
        }
        const lib = (window as any).pdfjsLib, buf = await file.arrayBuffer(), pdf = await lib.getDocument({ data: buf }).promise
        let text = ""
        for (let i = 1; i <= pdf.numPages; i++) { const page = await pdf.getPage(i); const content = await page.getTextContent(); text += content.items.map((it: any) => it.str).join(" ") + "\n" }
        const extracted = extractFromText(text, file.name)
        if (extracted) setConfirmData(extracted)
        else alert('No balance/APR found in PDF. Scanned PDFs are not supported.')
      } else if (file.name.toLowerCase().endsWith('.csv')) {
        const text = await file.text()
        const lines = text.split('\n').filter(l => l.trim())
        if (lines.length > 2) {
          setConfirmData({ name: file.name.replace('.csv', ''), balance: 0, apr: 0, minimumPayment: 25 })
          alert('CSV uploaded. Please confirm balance and details.')
        }
      }
    } catch (err: any) { alert('Error: ' + err.message) }
    setIsParsing(false)
    e.target.value = ''
  }
  // ── CALCULATIONS ───────────────────────────────────────────────────────────
  const totalDebt = debts.reduce((s, d) => s + d.balance, 0)
  const totalMinPayment = debts.reduce((s, d) => s + d.minimumPayment, 0)
  const avgAPR = totalDebt > 0 ? debts.reduce((s, d) => s + (d.apr * d.balance), 0) / totalDebt : 0
  const monthlyInt = debts.reduce((s, d) => s + ((d.apr / 100 / 12) * d.balance), 0)

  const avalanche = useMemo(() => calcSchedule(debts, 'avalanche', extra), [debts, extra])
  const snowball = useMemo(() => calcSchedule(debts, 'snowball', extra), [debts, extra])

  const currentSchedule = strategy === 'avalanche' ? avalanche : snowball
  const payoffMonths = currentSchedule.length
  const totalInterest = currentSchedule[currentSchedule.length - 1]?.totalInterestPaid || 0
  const payoffDate = new Date()
  payoffDate.setMonth(payoffDate.getMonth() + payoffMonths)

  // ── CHARTS DATA ────────────────────────────────────────────────────────────
  const pieData = useMemo(() => {
    const types: Record<string, number> = {}
    debts.forEach(d => { types[d.type] = (types[d.type] || 0) + d.balance })
    return Object.entries(types).map(([name, value]) => ({ name, value, color: DEBT_COLORS[name] || '#6b7280' }))
  }, [debts])

  const timelineData = useMemo(() => {
    return currentSchedule.filter((_, i) => i % Math.max(1, Math.floor(payoffMonths / 20)) === 0 || i === payoffMonths - 1)
      .map(d => ({ month: d.month, balance: d.totalBalance }))
  }, [currentSchedule, payoffMonths])

  // ── EXPORT ─────────────────────────────────────────────────────────────────
  const exportPDF = () => {
    const doc = new jsPDF()
    doc.setFontSize(20); doc.text('Debt Payoff Plan', 20, 20)
    doc.setFontSize(10); doc.text(`Generated: ${new Date().toLocaleDateString()}`, 20, 28)
    doc.text(`Strategy: ${strategy.toUpperCase()}`, 20, 33)
    doc.text(`Extra Monthly Payment: ${formatCurrency(extra)}`, 20, 38)

    autoTable(doc, {
      startY: 45,
      head: [['Debt Name', 'Balance', 'APR', 'Min Payment']],
      body: debts.map(d => [d.name, formatCurrency(d.balance), `${d.apr}%`, formatCurrency(d.minimumPayment)]),
    })

    const finalY = (doc as any).lastAutoTable.finalY + 10
    doc.text(`Total Debt: ${formatCurrency(totalDebt)}`, 20, finalY)
    doc.text(`Total Interest: ${formatCurrency(totalInterest)}`, 20, finalY + 7)
    doc.text(`Debt Free By: ${payoffDate.toLocaleDateString()}`, 20, finalY + 14)

    doc.save('Debt-Payoff-Plan.pdf')
  }

  // ── RENDER ─────────────────────────────────────────────────────────────────
  return (
    <div className="space-y-6">
      {/* Summary Row */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { label: 'Total Debt', value: formatCurrency(totalDebt), color: 'text-red-400' },
          { label: 'Avg APR', value: `${avgAPR.toFixed(1)}%`, color: 'text-orange-400' },
          { label: 'Monthly Minimums', value: formatCurrency(totalMinPayment), color: 'text-yellow-400' },
          { label: 'Debt Free By', value: totalDebt > 0 ? payoffDate.toLocaleDateString('en-US', { month: 'short', year: 'numeric' }) : '—', color: 'text-green-400' },
        ].map((s) => (
          <Card key={s.label} className="border-border bg-card">
            <CardContent className="p-4">
              <p className="text-xs text-muted-foreground uppercase tracking-wider">{s.label}</p>
              <p className={`text-2xl font-bold mt-1 ${s.color}`}>{s.value}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="grid lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-4">

          {/* Main Content Area */}
          <Card className="border-border bg-card">
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle className="text-base">Your Debts</CardTitle>
              <div className="flex gap-2">
                <button onClick={() => setShowForm(!showForm)} className="flex items-center gap-1.5 rounded-lg bg-primary px-3 py-1.5 text-xs font-bold text-black border-2 border-primary hover:bg-transparent hover:text-primary transition-all">
                  <Plus className="h-3.5 w-3.5" /> Manual Add
                </button>
                <label className="flex items-center gap-1.5 rounded-lg border-2 border-border px-3 py-1.5 text-xs font-bold cursor-pointer hover:bg-secondary transition-all">
                  <Upload className="h-3.5 w-3.5" /> Upload Statement
                  <input type="file" accept=".pdf,.csv" onChange={handleFileUpload} className="hidden" />
                </label>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">

              {/* Manual Form */}
              {showForm && (
                <div className="rounded-xl border border-border bg-secondary/50 p-4 space-y-3">
                  <p className="text-sm font-bold">Add Debt Manually</p>
                  <div className="grid grid-cols-2 gap-3">
                    <div className="col-span-2">
                      <label className="text-[10px] font-bold text-muted-foreground uppercase">Name</label>
                      <input value={manualForm.name} onChange={e => setManualForm(p => ({ ...p, name: e.target.value }))} className="w-full mt-1 bg-background border border-border rounded-lg p-2 text-sm" placeholder="e.g. Visa Platinum" />
                    </div>
                    <div>
                      <label className="text-[10px] font-bold text-muted-foreground uppercase">Balance ($)</label>
                      <input type="number" value={manualForm.balance} onChange={e => setManualForm(p => ({ ...p, balance: e.target.value }))} className="w-full mt-1 bg-background border border-border rounded-lg p-2 text-sm" placeholder="0.00" />
                    </div>
                    <div>
                      <label className="text-[10px] font-bold text-muted-foreground uppercase">APR (%)</label>
                      <input type="number" value={manualForm.apr} onChange={e => setManualForm(p => ({ ...p, apr: e.target.value }))} className="w-full mt-1 bg-background border border-border rounded-lg p-2 text-sm" placeholder="0.00" />
                    </div>
                    <div>
                      <label className="text-[10px] font-bold text-muted-foreground uppercase">Min Payment ($)</label>
                      <input type="number" value={manualForm.minPay} onChange={e => setManualForm(p => ({ ...p, minPay: e.target.value }))} className="w-full mt-1 bg-background border border-border rounded-lg p-2 text-sm" placeholder="0.00" />
                    </div>
                    <div>
                      <label className="text-[10px] font-bold text-muted-foreground uppercase">Loan Type</label>
                      <select value={manualForm.type} onChange={e => setManualForm(p => ({ ...p, type: e.target.value }))} className="w-full mt-1 bg-background border border-border rounded-lg p-2 text-sm">
                        {LOAN_TYPES.map(t => <option key={t.value} value={t.value}>{t.label}</option>)}
                      </select>
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <button onClick={() => handleSave(manualForm)} disabled={saving} className="rounded-lg bg-primary px-6 py-2 text-sm font-bold text-black disabled:opacity-50">{saving ? 'Saving...' : 'Save Debt'}</button>
                    <button onClick={() => setShowForm(false)} className="px-4 py-2 text-sm font-medium">Cancel</button>
                  </div>
                </div>
              )}

              {/* Extraction Preview */}
              {confirmData && (
                <div className="rounded-xl border-2 border-primary bg-primary/5 p-4 space-y-3">
                  <div className="flex items-center gap-2">
                    <AlertTriangle className="h-4 w-4 text-primary" />
                    <p className="text-sm font-bold">Confirm Extracted Data</p>
                  </div>
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                    <div><label className="text-[10px] font-bold text-muted-foreground uppercase">Name</label><input value={confirmData.name} onChange={e => setConfirmData(p => ({ ...p, name: e.target.value }))} className="w-full mt-1 bg-background border border-border rounded p-1.5 text-xs text-secondary-foreground" /></div>
                    <div><label className="text-[10px] font-bold text-muted-foreground uppercase">Balance</label><input type="number" value={confirmData.balance} onChange={e => setConfirmData(p => ({ ...p, balance: +e.target.value }))} className="w-full mt-1 bg-background border border-border rounded p-1.5 text-xs text-secondary-foreground" /></div>
                    <div><label className="text-[10px] font-bold text-muted-foreground uppercase">APR %</label><input type="number" value={confirmData.apr} onChange={e => setConfirmData(p => ({ ...p, apr: +e.target.value }))} className="w-full mt-1 bg-background border border-border rounded p-1.5 text-xs text-secondary-foreground" /></div>
                    <div><label className="text-[10px] font-bold text-muted-foreground uppercase">Min Pay</label><input type="number" value={confirmData.minimumPayment} onChange={e => setConfirmData(p => ({ ...p, minimumPayment: +e.target.value }))} className="w-full mt-1 bg-background border border-border rounded p-1.5 text-xs text-secondary-foreground" /></div>
                  </div>
                  <div className="flex gap-2 pt-2">
                    <button onClick={() => handleSave(confirmData)} disabled={saving} className="rounded bg-primary px-4 py-1.5 text-[10px] font-bold text-black">{saving ? 'Saving...' : 'Confirm & Save'}</button>
                    <button onClick={() => setConfirmData(null)} className="text-[10px] font-bold underline">Cancel</button>
                  </div>
                </div>
              )}

              {/* Debts Table */}
              <div className="space-y-3">
                {loading ? (
                  <p className="py-12 text-center text-sm text-muted-foreground">Loading your debt profile...</p>
                ) : debts.length === 0 ? (
                  <div className="py-12 text-center">
                    <TrendingDown className="h-8 w-8 text-muted-foreground/30 mx-auto mb-3" />
                    <p className="text-sm text-muted-foreground font-medium">No debts found. Add one manually or upload a statement.</p>
                  </div>
                ) : debts.map(debt => (
                  <div key={debt.id} className="group relative flex items-center justify-between rounded-xl border border-border bg-secondary/30 p-4 hover:border-primary/30 transition-all">
                    <div className="space-y-1">
                      <p className="font-bold">{debt.name}</p>
                      <div className="flex items-center gap-3">
                        <span className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">{debt.type.replace('_', ' ')}</span>
                        <span className="text-[10px] font-bold text-primary">{debt.apr}% APR</span>
                      </div>
                    </div>
                    <div className="text-right flex items-center gap-6">
                      <div className="space-y-0.5">
                        <p className="text-lg font-bold text-red-400">{formatCurrency(debt.balance)}</p>
                        <p className="text-[10px] font-bold text-muted-foreground uppercase">Min: {formatCurrency(debt.minimumPayment)}</p>
                      </div>
                      <button onClick={() => handleDelete(debt.id)} className="h-8 w-8 flex items-center justify-center rounded-lg bg-red-400/10 text-red-400 hover:bg-red-400 hover:text-white transition-all">
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Charts Row */}
          <div className="grid md:grid-cols-2 gap-4">
            <Card className="border-border bg-card">
              <CardHeader><CardTitle className="text-sm">Balance by Type</CardTitle></CardHeader>
              <CardContent className="h-48 overflow-hidden">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie data={pieData} innerRadius={50} outerRadius={70} dataKey="value" stroke="none">
                      {pieData.map((e, i) => <Cell key={i} fill={e.color} />)}
                    </Pie>
                    <Tooltip cursor={{ fill: 'transparent' }} contentStyle={{ background: '#111318', border: '1px solid #374151' }} />
                  </PieChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
            <Card className="border-border bg-card">
              <CardHeader><CardTitle className="text-sm">Payoff Timeline</CardTitle></CardHeader>
              <CardContent className="h-48">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={timelineData}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#374151" opacity={0.3} vertical={false} />
                    <XAxis dataKey="month" hide />
                    <YAxis hide />
                    <Tooltip contentStyle={{ background: '#111318', border: '1px solid #374151' }} />
                    <Line type="monotone" dataKey="balance" stroke="#22c55e" strokeWidth={3} dot={false} />
                  </LineChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </div>
        </div>

        {/* Sidebar Controls */}
        <div className="space-y-6">
          <Card className="border-border bg-card">
            <CardHeader><CardTitle className="text-base">Strategy Settings</CardTitle></CardHeader>
            <CardContent className="space-y-6">

              {/* Strategy Selector */}
              <div className="space-y-3">
                <label className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">Select Strategy</label>
                {(['avalanche', 'snowball'] as const).map(s => (
                  <button key={s} onClick={() => setStrategy(s)} className={`w-full flex items-center justify-between p-3 rounded-xl border-2 transition-all ${strategy === s ? 'border-primary bg-primary/5' : 'border-border hover:bg-secondary'}`}>
                    <div className="flex items-center gap-3 text-left">
                      {s === 'avalanche' ? <Flame className="h-5 w-5 text-orange-400" /> : <Snowflake className="h-5 w-5 text-blue-400" />}
                      <div>
                        <p className="text-sm font-bold capitalize">{s}</p>
                        <p className="text-[10px] text-muted-foreground">{s === 'avalanche' ? 'Highest APR first (Cheapest)' : 'Smallest balance first (Fastest win)'}</p>
                      </div>
                    </div>
                    {strategy === s && <div className="h-2 w-2 rounded-full bg-primary" />}
                  </button>
                ))}
              </div>

              {/* Slider */}
              <div className="space-y-4 pt-2">
                <div className="flex items-center justify-between">
                  <label className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">Extra Monthly</label>
                  <span className="text-lg font-bold text-primary">{formatCurrency(extra)}</span>
                </div>
                <input type="range" min={0} max={2000} step={25} value={extra} onChange={e => setExtra(+e.target.value)} className="w-full h-1.5 bg-secondary rounded-lg appearance-none cursor-pointer accent-primary" />
                <div className="flex justify-between text-[10px] font-bold text-muted-foreground"><span>$0</span><span>$1,000</span><span>$2,000+</span></div>
              </div>

              {/* Payoff Stats */}
              <div className="rounded-xl bg-secondary/30 border border-border p-4 space-y-4">
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground font-medium">Total Interest</span>
                  <span className="font-bold text-red-400">{formatCurrency(totalInterest)}</span>
                </div>
                <div className="flex justify-between text-sm border-t border-border/50 pt-4">
                  <div className="space-y-0.5">
                    <p className="text-[10px] font-bold text-muted-foreground uppercase">Debt Free In</p>
                    <p className="text-lg font-bold text-green-400">{formatMonths(payoffMonths)}</p>
                  </div>
                  <div className="text-right space-y-0.5">
                    <p className="text-[10px] font-bold text-muted-foreground uppercase">Target Date</p>
                    <p className="text-lg font-bold text-green-400">{totalDebt > 0 ? payoffDate.toLocaleDateString('en-US', { month: 'short', year: 'numeric' }) : '—'}</p>
                  </div>
                </div>
              </div>

              <button onClick={exportPDF} disabled={debts.length === 0} className="w-full flex items-center justify-center gap-2 rounded-xl border-2 border-border py-2.5 text-xs font-bold hover:bg-secondary transition-all disabled:opacity-50">
                <Download className="h-4 w-4" /> Export Strategy Report
              </button>
            </CardContent>
          </Card>

          {/* Strategy Comparison Table */}
          <Card className="border-border bg-card">
            <CardHeader><CardTitle className="text-sm">Snowball vs Avalanche</CardTitle></CardHeader>
            <CardContent>
              <div className="space-y-3">
                <div className="flex justify-between items-center text-xs">
                  <span className="text-muted-foreground">Interest Saved (Avalanche)</span>
                  <span className="font-bold text-green-400">{formatCurrency(Math.max(0, (snowball[snowball.length - 1]?.totalInterestPaid || 0) - (avalanche[avalanche.length - 1]?.totalInterestPaid || 0)))}</span>
                </div>
                <div className="flex justify-between items-center text-xs">
                  <span className="text-muted-foreground">Total Paid (Avalanche)</span>
                  <span className="font-bold">{formatCurrency(totalDebt + (avalanche[avalanche.length - 1]?.totalInterestPaid || 0))}</span>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
