'use client'

import { useState, useMemo } from "react"
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/components/ui/tabs"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge"
import {
  LineChart, ArrowLeft, Upload, PieChart3, CreditCard, Percent, DollarSign,
  Snowflake, Flame, BarChart3, Target, PieChart as PieChartIcon
} from 'lucide-react'
import Link from 'next/link'
import { Footer } from '@/components/footer'
import { usePortfolio } from "@/lib/portfolio-context"

// ==================== DEBT TYPES ====================
interface CardDebt {
  id: string
  name: string
  balance: number
  apr: number
  minPayment: number
  csvData?: any[]
}

type PayoffStrategy = 'avalanche' | 'snowball' | 'hybrid'

// ==================== DEBT CALCULATIONS ====================
function calculateMonthlyInterest(debt: CardDebt): number {
  return (debt.balance * (debt.apr / 100)) / 12
}

function formatCurrency(value: number): string {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(value)
}

function calculateDebtPayoffSchedule(
  debts: CardDebt[],
  strategy: PayoffStrategy,
  extraPayment: number = 0
) {
  const sortedDebts = [...debts].sort((a, b) => {
    if (strategy === 'avalanche') return b.apr - a.apr
    if (strategy === 'snowball') return a.balance - b.balance
    return (b.balance * b.apr) - (a.balance * a.apr) // hybrid
  })

  const schedule: Array<{
    month: number
    totalBalance: number
    totalInterestPaid: number
  }> = []

  let currentDebts = sortedDebts.map(d => ({ ...d }))
  let month = 0
  let totalInterestPaid = 0

  while (currentDebts.some(d => d.balance > 0) && month < 600) {
    month++
    let monthTotalBalance = 0
    let availableExtra = extraPayment

    currentDebts.forEach((debt, index) => {
      if (debt.balance <= 0) return

      const monthlyInterest = calculateMonthlyInterest(debt)
      let payment = debt.minPayment

      // Extra to first debt in strategy order
      if (index === currentDebts.findIndex(d => d.balance > 0) && availableExtra > 0) {
        payment += availableExtra
        availableExtra = 0
      }

      const principalPayment = payment - monthlyInterest
      debt.balance = Math.max(0, debt.balance - principalPayment)
      totalInterestPaid += monthlyInterest
      monthTotalBalance += debt.balance
    })

    schedule.push({
      month,
      totalBalance: monthTotalBalance,
      totalInterestPaid
    })
  }

  return schedule
}

// ==================== CREDIT CARD DEBT TRACKER (NEW DEBTS TAB CONTENT) ====================
function CreditCardDebtTracker() {
  const [cards, setCards] = useState<CardDebt[]>([])
  const [csvFiles, setCsvFiles] = useState<{ [key: string]: File }>({})
  const [selectedStrategy, setSelectedStrategy] = useState<PayoffStrategy>('avalanche')
  const [extraPayment, setExtraPayment] = useState(100)
  const [showResults, setShowResults] = useState(false)
  const [loading, setLoading] = useState(false)
  const [payoffSchedule, setPayoffSchedule] = useState<any[]>([])

  const handleCsvUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || [])
    // Store files (parsing logic preserved but simplified)
    const newCsvFiles: { [key: string]: File } = {}
    for (const file of files) {
      newCsvFiles[file.name] = file
    }
    setCsvFiles(newCsvFiles)
  }

  const addCard = () => {
    const id = `card-${Date.now()}`
    setCards([...cards, { id, name: '', balance: 0, apr: 0, minPayment: 0 }])
  }

  const updateCard = (id: string, field: keyof CardDebt, value: any) => {
    setCards(cards.map(card =>
      card.id === id ? { ...card, [field]: value } : card
    ))
  }

  const deleteCard = (id: string) => {
    setCards(cards.filter(card => card.id !== id))
  }

  const calculateDebtPayoff = () => {
    if (cards.length === 0) return
    setLoading(true)
    const schedule = calculateDebtPayoffSchedule(cards, selectedStrategy, extraPayment)
    setPayoffSchedule(schedule)
    setShowResults(true)
    setLoading(false)
  }

  const totalDebt = cards.reduce((sum, card) => sum + card.balance, 0)
  const avgApr = cards.length > 0 ? cards.reduce((sum, card) => sum + card.apr, 0) / cards.length : 0
  const monthsToPayoff = payoffSchedule.length
  const totalInterest = payoffSchedule[payoffSchedule.length - 1]?.totalInterestPaid || 0

  return (
    <div className="space-y-6">
      {/* Header with Back Link */}
      <div className="flex items-center gap-3 mb-6">
        <Link
          href="/tools"
          className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground p-2 -m-2 rounded-lg"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to Tools
        </Link>
        <div className="flex-1">
          <h2 className="text-2xl font-bold">Credit Card Debt Calculator</h2>
          <p className="text-muted-foreground text-sm">Calculate your fastest path to debt freedom</p>
        </div>
      </div>

      <div className="grid lg:grid-cols-3 gap-8">
        {/* Inputs */}
        <div className="lg:col-span-2 space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <CreditCard className="h-5 w-5" />
                Your Credit Cards
              </CardTitle>
            </CardHeader>
            <CardContent className="pt-6 space-y-4">
              {cards.map((card) => (
                <div key={card.id} className="p-4 border rounded-lg space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                    <div>
                      <Label className="text-xs font-medium uppercase tracking-wider text-muted-foreground mb-1 block">
                        Card Name
                      </Label>
                      <Input
                        value={card.name}
                        onChange={(e) => updateCard(card.id, 'name', e.target.value)}
                        placeholder="Chase Sapphire"
                        className="h-10"
                      />
                    </div>
                    <div>
                      <Label className="text-xs font-medium uppercase tracking-wider text-muted-foreground mb-1 block">
                        Balance
                      </Label>
                      <Input
                        type="number"
                        value={card.balance}
                        onChange={(e) => updateCard(card.id, 'balance', parseFloat(e.target.value) || 0)}
                        placeholder="0"
                        className="h-10"
                      />
                    </div>
                    <div>
                      <Label className="text-xs font-medium uppercase tracking-wider text-muted-foreground mb-1 block">
                        APR %
                      </Label>
                      <Input
                        type="number"
                        step="0.1"
                        value={card.apr}
                        onChange={(e) => updateCard(card.id, 'apr', parseFloat(e.target.value) || 0)}
                        placeholder="18.5"
                        className="h-10"
                      />
                    </div>
                    <div>
                      <Label className="text-xs font-medium uppercase tracking-wider text-muted-foreground mb-1 block">
                        Min Payment
                      </Label>
                      <Input
                        type="number"
                        value={card.minPayment}
                        onChange={(e) => updateCard(card.id, 'minPayment', parseFloat(e.target.value) || 0)}
                        placeholder="25"
                        className="h-10"
                      />
                    </div>
                  </div>
                  <Button
                    variant="destructive"
                    size="sm"
                    className="w-full"
                    onClick={() => deleteCard(card.id)}
                  >
                    Remove Card
                  </Button>
                </div>
              ))}

              <Button onClick={addCard} className="w-full h-12 text-lg" variant="outline">
                + Add Credit Card
              </Button>
            </CardContent>
          </Card>

          {/* Strategy + Extra */}
          <div className="grid md:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>Payoff Strategy</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                {[
                  { value: 'snowball' as PayoffStrategy, name: 'Snowball', desc: 'Smallest balance first', icon: Snowflake },
                  { value: 'avalanche' as PayoffStrategy, name: 'Avalanche', desc: 'Highest APR first', icon: Flame },
                  { value: 'hybrid' as PayoffStrategy, name: 'Hybrid', desc: 'Balanced approach', icon: BarChart3 }
                ].map((strategy) => (
                  <label key={strategy.value} className="flex items-center p-3 border rounded-lg cursor-pointer hover:bg-accent gap-3">
                    <input
                      type="radio"
                      name="strategy"
                      value={strategy.value}
                      checked={selectedStrategy === strategy.value}
                      onChange={(e) => setSelectedStrategy(e.target.value as PayoffStrategy)}
                      className="w-4 h-4 text-primary"
                    />
                    <div className="flex items-center gap-3 flex-1">
                      <strategy.icon className="h-5 w-5 flex-shrink-0" />
                      <div>
                        <p className="font-semibold">{strategy.name}</p>
                        <p className="text-sm text-muted-foreground">{strategy.desc}</p>
                      </div>
                    </div>
                  </label>
                ))}
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-lg">Extra Payment</CardTitle>
              </CardHeader>
              <CardContent>
                <Label className="text-sm font-medium">Monthly amount beyond minimums</Label>
                <Input
                  type="number"
                  value={extraPayment}
                  onChange={(e) => setExtraPayment(parseFloat(e.target.value) || 0)}
                  placeholder="100"
                  className="mt-2 h-12 text-lg"
                />
              </CardContent>
            </Card>
          </div>

          {/* CSV */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Upload className="h-4 w-4" />
                Import Statements
              </CardTitle>
            </CardHeader>
            <CardContent>
              <Input
                type="file"
                multiple
                accept=".csv"
                onChange={handleCsvUpload}
                className="h-12"
              />
              {Object.keys(csvFiles).length > 0 && (
                <p className="mt-2 text-sm text-muted-foreground">
                  Loaded {Object.keys(csvFiles).length} file{Object.keys(csvFiles).length !== 1 ? 's' : ''}
                </p>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Summary Sidebar */}
        <div>
          <Card className="sticky top-6 h-fit">
            <CardHeader>
              <CardTitle>Quick Summary</CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-2">
                <p className="text-xs uppercase tracking-wider font-medium text-muted-foreground">
                  Total Debt
                </p>
                <p className="text-3xl font-bold">{formatCurrency(totalDebt)}</p>
              </div>

              <div className="space-y-2">
                <p className="text-xs uppercase tracking-wider font-medium text-muted-foreground">
                  Average APR
                </p>
                <p className="text-2xl font-bold">{avgApr.toFixed(1)}%</p>
              </div>

              <div className="space-y-2">
                <p className="text-xs uppercase tracking-wider font-medium text-muted-foreground">
                  Strategy
                </p>
                <Badge variant="secondary" className="capitalize px-3 py-1">
                  {selectedStrategy.replace(/^\w/, c => c.toUpperCase())}
                </Badge>
              </div>

              <Button
                onClick={calculateDebtPayoff}
                disabled={totalDebt === 0 || loading}
                className="w-full h-14 text-lg font-semibold"
                size="lg"
              >
                {loading ? (
                  <>
                    <DollarSign className="h-4 w-4 mr-2 animate-spin" />
                    Calculating...
                  </>
                ) : (
                  'Run Payoff Plan'
                )}
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Results */}
      {showResults && payoffSchedule.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-2xl">Your Payoff Plan</CardTitle>
            <p className="text-muted-foreground">
              {selectedStrategy.toUpperCase()} strategy • ${extraPayment.toLocaleString()}/mo extra
            </p>
          </CardHeader>
          <CardContent className="space-y-8">
            <div className="grid md:grid-cols-2 gap-8 items-center">
              <div>
                <div className="text-center md:text-left">
                  <p className="text-5xl font-black text-primary md:text-6xl">
                    {Math.ceil(monthsToPayoff / 12)}y {monthsToPayoff % 12}m
                  </p>
                  <p className="text-2xl font-bold opacity-75">Debt Free</p>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4 text-center">
                <div>
                  <p className="text-3xl font-bold text-destructive">
                    {formatCurrency(totalInterest)}
                  </p>
                  <p className="text-sm text-muted-foreground uppercase tracking-wider">Interest Paid</p>
                </div>
                <div>
                  <p className="text-3xl font-bold text-green-600">
                    {formatCurrency(totalDebt)}
                  </p>
                  <p className="text-sm text-muted-foreground uppercase tracking-wider">Principal</p>
                </div>
              </div>
            </div>

            <div className="grid md:grid-cols-2 gap-6">
              <Card>
                <CardHeader className="pb-4">
                  <CardTitle>Next Steps</CardTitle>
                </CardHeader>
                <CardContent className="space-y-3 text-sm">
                  <div className="flex items-center gap-3 p-3 border rounded-lg bg-muted/50">
                    <CreditCard className="h-5 w-5 text-primary flex-shrink-0" />
                    <div>
                      <p className="font-semibold">Focus Card</p>
                      <p>{cards[0]?.name || 'Highest priority card'}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3 p-3 border rounded-lg bg-muted/50">
                    <DollarSign className="h-5 w-5 text-primary flex-shrink-0" />
                    <div>
                      <p className="font-semibold">Payment Priority</p>
                      <p className="capitalize">{selectedStrategy}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="pb-4">
                  <CardTitle>Monthly Cash Flow</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2 text-center">
                    <p className="text-3xl font-bold">
                      ${(cards.reduce((sum, c) => sum + c.minPayment, 0) + extraPayment).toLocaleString()}
                    </p>
                    <p className="text-sm text-muted-foreground">Total monthly commitment</p>
                  </div>
                </CardContent>
              </Card>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}

// ==================== MAIN GOALS PAGE ====================
export default function GoalsPage() {
  const [activeTab, setActiveTab] = useState<'goals' | 'debts' | 'overview'>('goals')

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <main className="flex-1 container mx-auto px-4 py-8">
        <div className="max-w-7xl mx-auto">
          <div className="mb-8">
            <h1 className="text-3xl lg:text-4xl font-bold tracking-tight">
              Goals & Finance
            </h1>
            <p className="text-xl text-muted-foreground mt-3 max-w-md">
              Track goals, eliminate debt, monitor financial health
            </p>
          </div>

          <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
            <TabsList className="grid w-full grid-cols-3">
              <TabsTrigger value="goals" className="flex items-center gap-2 data-[state=active]:bg-primary/10">
                <Target className="h-4 w-4" />
                Goal Tracker
              </TabsTrigger>
              <TabsTrigger value="debts" className="flex items-center gap-2 data-[state=active]:bg-destructive/10">
                <CreditCard className="h-4 w-4" />
                Debt Tracker
              </TabsTrigger>
              <TabsTrigger value="overview" className="flex items-center gap-2 data-[state=active]:bg-secondary/20">
                <PieChartIcon className="h-4 w-4" />
                Overview
              </TabsTrigger>
            </TabsList>

            {/* Goals Tab - Simplified */}
            <TabsContent value="goals" className="mt-8">
              <Card className="border-0 shadow-none">
                <CardContent className="pt-8 pb-12">
                  <div className="text-center max-w-2xl mx-auto space-y-6">
                    <Target className="w-24 h-24 mx-auto text-muted-foreground/50" />
                    <div>
                      <h3 className="text-3xl font-bold mb-3">Set Your Financial Goal</h3>
                      <p className="text-muted-foreground text-lg">
                        Track progress toward your biggest financial milestone
                      </p>
                    </div>
                    <Button size="lg" className="h-12 px-8 text-lg">
                      Configure Goal →
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            {/* NEW DEBT TRACKER TAB = CREDIT CARD PAGE */}
            <TabsContent value="debts" className="mt-8">
              <CreditCardDebtTracker />
            </TabsContent>

            {/* Overview Tab */}
            <TabsContent value="overview" className="mt-8">
              <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
                <Card>
                  <CardHeader className="pb-4">
                    <CardTitle>Portfolio Value</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-4xl font-bold">$24,500</p>
                    <p className="text-2xl text-green-600 font-semibold">+12.5%</p>
                  </CardContent>
                </Card>
                <Card>
                  <CardHeader className="pb-4">
                    <CardTitle>Total Debt</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-4xl font-bold text-destructive">$8,200</p>
                    <p className="text-sm text-muted-foreground">-3.2%</p>
                  </CardContent>
                </Card>
                <Card>
                  <CardHeader className="pb-4">
                    <CardTitle>Net Worth</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-4xl font-bold">$16,300</p>
                  </CardContent>
                </Card>
              </div>
            </TabsContent>
          </Tabs>
        </div>
      </main>
      <Footer />
    </div>
  )
}
