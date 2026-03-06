"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Progress } from "@/components/ui/progress"
import { Shield, TrendingUp, TrendingDown, AlertTriangle, Zap } from "lucide-react"
import type { Debt } from "@/components/goals/types"
import { formatCurrency } from "@/components/goals/types"

interface FinancialOverviewProps {
  debts: Debt[]
  totalDebt: number
  totalMonthlyDebtPayment: number
  totalAnnualInterest: number
  currentSavings: number
  totalAssetsValue: number
  monthlyContribution: number
  expectedReturn: number
  portfolioValue: number
  portfolioAnnualReturn: number
  portfolioAnnualDividends: number
  includePortfolioInOverview: boolean
  setIncludePortfolioInOverview: (b: boolean) => void
  includeDividendsInOverview: boolean
  setIncludeDividendsInOverview: (b: boolean) => void
  monthlyIncome: number
  setMonthlyIncome: (n: number) => void
  monthlyExpenses: number
  setMonthlyExpenses: (n: number) => void
}

export function FinancialOverview(props: FinancialOverviewProps) {
  const {
    debts, totalDebt, totalMonthlyDebtPayment, totalAnnualInterest,
    currentSavings, totalAssetsValue, monthlyContribution, expectedReturn,
    portfolioValue, portfolioAnnualReturn, portfolioAnnualDividends,
    includePortfolioInOverview, setIncludePortfolioInOverview,
    includeDividendsInOverview, setIncludeDividendsInOverview,
    monthlyIncome, setMonthlyIncome, monthlyExpenses, setMonthlyExpenses,
  } = props

  const totalAssets = (includePortfolioInOverview ? portfolioValue : 0) + currentSavings + totalAssetsValue
  const totalLiabilities = totalDebt
  const netWorth = totalAssets - totalLiabilities
  const annualIncome = monthlyIncome * 12
  const annualExpenses = monthlyExpenses * 12
  const annualInvestmentContributions = monthlyContribution * 12
  const portfolioAnnualReturnDollars = includePortfolioInOverview ? portfolioValue * (portfolioAnnualReturn / 100) : 0
  const dividendIncome = includePortfolioInOverview && includeDividendsInOverview ? portfolioAnnualDividends : 0
  const netAnnualCashFlow = annualIncome + portfolioAnnualReturnDollars + dividendIncome - (annualExpenses + totalAnnualInterest + annualInvestmentContributions)
  const monthlyNetCashFlow = netAnnualCashFlow / 12
  const debtToIncomeRatio = monthlyIncome > 0 ? (totalMonthlyDebtPayment / monthlyIncome) * 100 : 0
  const debtToAssetRatio = totalAssets > 0 ? (totalDebt / totalAssets) * 100 : 0
  const emergencyFundMonths = monthlyExpenses > 0 ? currentSavings / monthlyExpenses : 0
  const leverageRatio = netWorth > 0 ? totalDebt / netWorth : 0

  const healthScore = (() => {
    let s = 100
    if (debtToIncomeRatio > 50) s -= 30; else if (debtToIncomeRatio > 35) s -= 20; else if (debtToIncomeRatio > 20) s -= 10
    if (emergencyFundMonths < 3) s -= 25; else if (emergencyFundMonths < 6) s -= 10
    if (netWorth < 0) s -= 20; else if (netWorth < 10000) s -= 10
    if (leverageRatio > 2) s -= 15; else if (leverageRatio > 1) s -= 8
    if (monthlyNetCashFlow < 0) s -= 10; else if (monthlyNetCashFlow < 200) s -= 5
    return Math.max(0, s)
  })()

  const debtByType = debts.reduce((acc, d) => { acc[d.type] = (acc[d.type] || 0) + d.balance; return acc }, {} as Record<string, number>)
  const weightedAvgAPR = totalDebt > 0 ? debts.reduce((s, d) => s + d.balance * d.apr, 0) / totalDebt : 0

  return (
    <div className="space-y-6">
      {/* Data Sources */}
      <Card className="border-border bg-card">
        <CardHeader><CardTitle className="text-base">Data Sources</CardTitle></CardHeader>
        <CardContent>
          <div className="flex flex-wrap gap-4">
            <div className="flex items-center gap-2 rounded-lg border border-border bg-secondary/50 px-4 py-2">
              <span className="text-sm text-muted-foreground">Include Portfolio</span>
              <button onClick={() => setIncludePortfolioInOverview(!includePortfolioInOverview)} className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${includePortfolioInOverview ? "bg-primary" : "bg-gray-600"}`}>
                <span className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${includePortfolioInOverview ? "translate-x-6" : "translate-x-1"}`} />
              </button>
              <span className={`text-sm font-medium ${includePortfolioInOverview ? "text-primary" : "text-muted-foreground"}`}>{includePortfolioInOverview ? "ON" : "OFF"}</span>
            </div>
            <div className="flex items-center gap-2 rounded-lg border border-border bg-secondary/50 px-4 py-2">
              <span className="text-sm text-muted-foreground">Include Dividends</span>
              <button onClick={() => setIncludeDividendsInOverview(!includeDividendsInOverview)} disabled={!includePortfolioInOverview} className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${includeDividendsInOverview && includePortfolioInOverview ? "bg-primary" : "bg-gray-600"} ${!includePortfolioInOverview ? "opacity-50 cursor-not-allowed" : ""}`}>
                <span className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${includeDividendsInOverview && includePortfolioInOverview ? "translate-x-6" : "translate-x-1"}`} />
              </button>
              <span className={`text-sm font-medium ${includeDividendsInOverview && includePortfolioInOverview ? "text-primary" : "text-muted-foreground"}`}>{includeDividendsInOverview && includePortfolioInOverview ? "ON" : "OFF"}</span>
            </div>
            <div className="flex items-center gap-2"><label className="text-sm text-muted-foreground">Monthly Income:</label><input type="number" value={monthlyIncome} onChange={(e) => setMonthlyIncome(Number(e.target.value))} className="w-28 rounded border border-border bg-secondary px-2 py-1 text-sm" /></div>
            <div className="flex items-center gap-2"><label className="text-sm text-muted-foreground">Monthly Expenses:</label><input type="number" value={monthlyExpenses} onChange={(e) => setMonthlyExpenses(Number(e.target.value))} className="w-28 rounded border border-border bg-secondary px-2 py-1 text-sm" /></div>
          </div>
        </CardContent>
      </Card>

      {/* Health Score */}
      <Card className="border-border bg-card">
        <CardHeader><CardTitle className="text-base flex items-center gap-2"><Shield className="h-5 w-5 text-primary" />Financial Health Score</CardTitle></CardHeader>
        <CardContent>
          <div className="flex flex-col items-center justify-center py-6">
            <div className="relative">
              <svg className="transform -rotate-90" width="200" height="200">
                <circle cx="100" cy="100" r="90" stroke="hsl(var(--border))" strokeWidth="12" fill="none" />
                <circle cx="100" cy="100" r="90" stroke={healthScore >= 80 ? "#22c55e" : healthScore >= 60 ? "#eab308" : "#ef4444"} strokeWidth="12" fill="none" strokeDasharray={`${(healthScore / 100) * 565.48} 565.48`} strokeLinecap="round" />
              </svg>
              <div className="absolute inset-0 flex flex-col items-center justify-center">
                <p className="text-5xl font-bold text-foreground">{healthScore}</p>
                <p className="text-sm text-muted-foreground">out of 100</p>
              </div>
            </div>
            <p className={`mt-4 text-lg font-semibold ${healthScore >= 80 ? "text-green-500" : healthScore >= 60 ? "text-yellow-500" : "text-red-500"}`}>
              {healthScore >= 80 ? "Excellent" : healthScore >= 60 ? "Good" : healthScore >= 40 ? "Fair" : "Needs Improvement"}
            </p>
          </div>
          <div className="mt-6 space-y-3">
            {[
              { label: "Debt-to-Income Ratio", value: `${debtToIncomeRatio.toFixed(1)}%`, color: debtToIncomeRatio > 35 ? "text-red-500" : debtToIncomeRatio > 20 ? "text-yellow-500" : "text-green-500" },
              { label: "Emergency Fund", value: `${emergencyFundMonths.toFixed(1)} months`, color: emergencyFundMonths < 3 ? "text-red-500" : emergencyFundMonths < 6 ? "text-yellow-500" : "text-green-500" },
              { label: "Net Worth", value: formatCurrency(netWorth), color: netWorth < 0 ? "text-red-500" : "text-green-500" },
              { label: "Monthly Cash Flow", value: `${monthlyNetCashFlow >= 0 ? "+" : ""}${formatCurrency(monthlyNetCashFlow)}`, color: monthlyNetCashFlow < 0 ? "text-red-500" : "text-green-500" },
            ].map((item) => (
              <div key={item.label} className="flex items-center justify-between p-3 rounded-lg bg-secondary/30">
                <span className="text-sm text-foreground">{item.label}</span>
                <span className={`font-medium ${item.color}`}>{item.value}</span>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Returns vs Debt */}
      <Card className="border-border bg-card">
        <CardHeader><CardTitle className="text-base">Investment Returns vs Debt Costs</CardTitle><p className="text-xs text-muted-foreground">Compare what you&apos;re earning vs what you&apos;re paying</p></CardHeader>
        <CardContent>
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="rounded-lg border-2 border-green-500/30 bg-green-500/5 p-6">
              <div className="flex items-center gap-2 mb-4"><TrendingUp className="h-5 w-5 text-green-500" /><h4 className="font-semibold text-foreground">Earning (Annual)</h4></div>
              <p className="text-3xl font-bold text-green-500 mb-4">{formatCurrency(portfolioAnnualReturnDollars + dividendIncome)}</p>
              {includePortfolioInOverview && <div className="space-y-2 text-sm"><div className="flex justify-between"><span className="text-muted-foreground">Portfolio Returns ({portfolioAnnualReturn.toFixed(1)}%)</span><span className="font-medium text-foreground">{formatCurrency(portfolioAnnualReturnDollars)}</span></div>{includeDividendsInOverview && <div className="flex justify-between"><span className="text-muted-foreground">Dividends</span><span className="font-medium text-foreground">{formatCurrency(dividendIncome)}</span></div>}</div>}
            </div>
            <div className="rounded-lg border-2 border-red-500/30 bg-red-500/5 p-6">
              <div className="flex items-center gap-2 mb-4"><TrendingDown className="h-5 w-5 text-red-500" /><h4 className="font-semibold text-foreground">Paying (Annual)</h4></div>
              <p className="text-3xl font-bold text-red-500 mb-4">{formatCurrency(totalAnnualInterest)}</p>
              <div className="text-sm"><div className="flex justify-between"><span className="text-muted-foreground">Debt Interest ({weightedAvgAPR.toFixed(1)}% avg)</span><span className="font-medium text-foreground">{formatCurrency(totalAnnualInterest)}</span></div></div>
            </div>
          </div>
          <div className="mt-6 rounded-lg border border-border bg-secondary/50 p-4">
            <div className="flex items-center justify-between">
              <span className="font-semibold text-foreground">Net Annual Benefit:</span>
              <span className={`text-2xl font-bold ${portfolioAnnualReturnDollars + dividendIncome - totalAnnualInterest >= 0 ? "text-green-500" : "text-red-500"}`}>
                {portfolioAnnualReturnDollars + dividendIncome - totalAnnualInterest >= 0 ? "+" : ""}{formatCurrency(portfolioAnnualReturnDollars + dividendIncome - totalAnnualInterest)}
              </span>
            </div>
            {totalAnnualInterest > portfolioAnnualReturnDollars + dividendIncome && (
              <p className="mt-3 text-sm text-orange-500 flex items-center gap-2"><AlertTriangle className="h-4 w-4" />Your debt costs more than you&apos;re earning from investments!</p>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Risk Indicators */}
      <Card className="border-border bg-card">
        <CardHeader><CardTitle className="text-base flex items-center gap-2"><AlertTriangle className="h-5 w-5 text-orange-500" />Risk Indicators</CardTitle></CardHeader>
        <CardContent>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {[
              { label: "Debt-to-Income", value: `${debtToIncomeRatio.toFixed(1)}%`, progress: Math.min(debtToIncomeRatio, 100), color: debtToIncomeRatio > 50 ? "text-red-500" : debtToIncomeRatio > 35 ? "text-orange-500" : debtToIncomeRatio > 20 ? "text-yellow-500" : "text-green-500", status: debtToIncomeRatio < 20 ? "✅ Excellent" : debtToIncomeRatio < 35 ? "⚠️ Moderate" : debtToIncomeRatio < 50 ? "❌ High Risk" : "🚨 Danger" },
              { label: "Debt-to-Asset", value: `${debtToAssetRatio.toFixed(1)}%`, progress: Math.min(debtToAssetRatio, 100), color: debtToAssetRatio > 60 ? "text-red-500" : debtToAssetRatio > 30 ? "text-yellow-500" : "text-green-500", status: debtToAssetRatio < 30 ? "✅ Good" : debtToAssetRatio < 60 ? "⚠️ Moderate" : "❌ High" },
              { label: "Emergency Fund", value: `${emergencyFundMonths.toFixed(1)}mo`, progress: Math.min((emergencyFundMonths / 6) * 100, 100), color: emergencyFundMonths < 3 ? "text-red-500" : emergencyFundMonths < 6 ? "text-yellow-500" : "text-green-500", status: emergencyFundMonths >= 6 ? "✅ Safe" : emergencyFundMonths >= 3 ? "⚠️ Moderate" : "❌ Risky" },
              { label: "Leverage", value: `${leverageRatio.toFixed(2)}x`, progress: Math.min((leverageRatio / 3) * 100, 100), color: leverageRatio > 2 ? "text-red-500" : leverageRatio > 1 ? "text-yellow-500" : "text-green-500", status: leverageRatio < 1 ? "✅ Conservative" : leverageRatio < 2 ? "⚠️ Moderate" : "❌ Aggressive" },
            ].map((item) => (
              <div key={item.label} className="space-y-2">
                <div className="flex items-center justify-between"><span className="text-sm text-muted-foreground">{item.label}</span><span className={`font-bold ${item.color}`}>{item.value}</span></div>
                <Progress value={item.progress} className="h-2" />
                <p className="text-xs text-muted-foreground">{item.status}</p>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Balance Sheet */}
      <Card className="border-border bg-card">
        <CardHeader><CardTitle className="text-base">Balance Sheet</CardTitle><p className="text-xs text-muted-foreground">Your financial position snapshot</p></CardHeader>
        <CardContent>
          <div className="grid gap-6 lg:grid-cols-2">
            <div>
              <h4 className="font-semibold text-green-500 mb-3 flex items-center gap-2"><TrendingUp className="h-4 w-4" />ASSETS</h4>
              <div className="space-y-2">
                {includePortfolioInOverview && <div className="flex justify-between p-2 rounded bg-secondary/30"><span className="text-sm text-muted-foreground">Investment Portfolio</span><span className="font-medium text-foreground">{formatCurrency(portfolioValue)}</span></div>}
                <div className="flex justify-between p-2 rounded bg-secondary/30"><span className="text-sm text-muted-foreground">Cash & Savings</span><span className="font-medium text-foreground">{formatCurrency(currentSavings)}</span></div>
                {totalAssetsValue > 0 && <div className="flex justify-between p-2 rounded bg-secondary/30"><span className="text-sm text-muted-foreground">Other Assets</span><span className="font-medium text-foreground">{formatCurrency(totalAssetsValue)}</span></div>}
                <div className="flex justify-between p-3 rounded bg-green-500/10 border border-green-500/30 mt-3"><span className="font-semibold text-foreground">Total Assets</span><span className="font-bold text-green-500">{formatCurrency(totalAssets)}</span></div>
              </div>
            </div>
            <div>
              <h4 className="font-semibold text-red-500 mb-3 flex items-center gap-2"><TrendingDown className="h-4 w-4" />LIABILITIES</h4>
              <div className="space-y-2">
                {debts.length > 0 ? Object.entries(debtByType).map(([type, amount]) => (
                  <div key={type} className="flex justify-between p-2 rounded bg-secondary/30"><span className="text-sm text-muted-foreground">{type}</span><span className="font-medium text-foreground">{formatCurrency(amount)}</span></div>
                )) : (
                  <div className="flex justify-between p-2 rounded bg-secondary/30"><span className="text-sm text-muted-foreground">No Debts</span><span className="font-medium text-green-500">$0</span></div>
                )}
                <div className="flex justify-between p-3 rounded bg-red-500/10 border border-red-500/30 mt-3"><span className="font-semibold text-foreground">Total Liabilities</span><span className="font-bold text-red-500">{formatCurrency(totalLiabilities)}</span></div>
              </div>
            </div>
          </div>
          <div className="mt-6 p-6 rounded-lg bg-gradient-to-r from-primary/10 to-primary/5 border-2 border-primary/30">
            <div className="flex items-center justify-between">
              <div><p className="text-sm text-muted-foreground mb-1">NET WORTH</p><p className={`text-4xl font-bold ${netWorth >= 0 ? "text-green-500" : "text-red-500"}`}>{formatCurrency(netWorth)}</p></div>
              <div className="text-right"><p className="text-xs text-muted-foreground">Assets - Liabilities</p><p className="text-sm text-muted-foreground mt-1">{formatCurrency(totalAssets)} - {formatCurrency(totalLiabilities)}</p></div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Cash Flow */}
      <Card className="border-border bg-card">
        <CardHeader><CardTitle className="text-base">Cash Flow Statement</CardTitle><p className="text-xs text-muted-foreground">Monthly and annual breakdown</p></CardHeader>
        <CardContent>
          <div className="grid gap-6 lg:grid-cols-2">
            <div>
              <h4 className="font-semibold text-foreground mb-3">Monthly</h4>
              <div className="space-y-3">
                <div><p className="text-xs text-muted-foreground mb-2">INFLOWS</p><div className="space-y-1"><div className="flex justify-between text-sm"><span className="text-muted-foreground">Salary/Income</span><span className="text-green-500">+{formatCurrency(monthlyIncome)}</span></div>{includePortfolioInOverview && includeDividendsInOverview && <div className="flex justify-between text-sm"><span className="text-muted-foreground">Dividends</span><span className="text-green-500">+{formatCurrency(dividendIncome / 12)}</span></div>}</div></div>
                <div><p className="text-xs text-muted-foreground mb-2">OUTFLOWS</p><div className="space-y-1"><div className="flex justify-between text-sm"><span className="text-muted-foreground">Living Expenses</span><span className="text-red-500">-{formatCurrency(monthlyExpenses)}</span></div><div className="flex justify-between text-sm"><span className="text-muted-foreground">Debt Payments</span><span className="text-red-500">-{formatCurrency(totalMonthlyDebtPayment)}</span></div><div className="flex justify-between text-sm"><span className="text-muted-foreground">Investments</span><span className="text-red-500">-{formatCurrency(monthlyContribution)}</span></div></div></div>
                <div className="flex justify-between p-3 rounded bg-primary/10 border border-primary/30"><span className="font-semibold text-foreground">Net Cash Flow</span><span className={`font-bold ${monthlyNetCashFlow >= 0 ? "text-green-500" : "text-red-500"}`}>{monthlyNetCashFlow >= 0 ? "+" : ""}{formatCurrency(monthlyNetCashFlow)}</span></div>
              </div>
            </div>
            <div>
              <h4 className="font-semibold text-foreground mb-3">Annual</h4>
              <div className="space-y-3">
                <div><p className="text-xs text-muted-foreground mb-2">INFLOWS</p><div className="space-y-1"><div className="flex justify-between text-sm"><span className="text-muted-foreground">Salary/Income</span><span className="text-green-500">+{formatCurrency(annualIncome)}</span></div>{includePortfolioInOverview && <div className="flex justify-between text-sm"><span className="text-muted-foreground">Portfolio Returns</span><span className="text-green-500">+{formatCurrency(portfolioAnnualReturnDollars)}</span></div>}{includePortfolioInOverview && includeDividendsInOverview && <div className="flex justify-between text-sm"><span className="text-muted-foreground">Dividends</span><span className="text-green-500">+{formatCurrency(dividendIncome)}</span></div>}</div></div>
                <div><p className="text-xs text-muted-foreground mb-2">OUTFLOWS</p><div className="space-y-1"><div className="flex justify-between text-sm"><span className="text-muted-foreground">Living Expenses</span><span className="text-red-500">-{formatCurrency(annualExpenses)}</span></div><div className="flex justify-between text-sm"><span className="text-muted-foreground">Debt Interest</span><span className="text-red-500">-{formatCurrency(totalAnnualInterest)}</span></div><div className="flex justify-between text-sm"><span className="text-muted-foreground">Investments</span><span className="text-red-500">-{formatCurrency(annualInvestmentContributions)}</span></div></div></div>
                <div className="flex justify-between p-3 rounded bg-primary/10 border border-primary/30"><span className="font-semibold text-foreground">Net Cash Flow</span><span className={`font-bold ${netAnnualCashFlow >= 0 ? "text-green-500" : "text-red-500"}`}>{netAnnualCashFlow >= 0 ? "+" : ""}{formatCurrency(netAnnualCashFlow)}</span></div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Opportunity Cost */}
      {totalDebt > 0 && (
        <Card className="border-border bg-card border-orange-500/30">
          <CardHeader><CardTitle className="text-base flex items-center gap-2"><Zap className="h-5 w-5 text-orange-500" />Opportunity Cost Analysis</CardTitle><p className="text-xs text-muted-foreground">What your debt is really costing you</p></CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="p-4 rounded-lg bg-orange-500/10 border border-orange-500/30">
                <p className="text-sm text-muted-foreground mb-2">You&apos;re paying <span className="font-bold text-orange-500">{formatCurrency(totalAnnualInterest)}</span> per year in debt interest.</p>
                <p className="text-sm text-foreground">💡 If you paid off your debt and invested at {expectedReturn}% return:</p>
              </div>
              <div className="grid gap-4 sm:grid-cols-3">
                {[10, 20, 30].map((years) => (
                  <div key={years} className="p-4 rounded-lg bg-secondary/50">
                    <p className="text-xs text-muted-foreground mb-1">In {years} years</p>
                    <p className="text-xl font-bold text-primary">{formatCurrency(totalAnnualInterest * ((Math.pow(1 + expectedReturn / 100, years) - 1) / (expectedReturn / 100)))}</p>
                  </div>
                ))}
              </div>
              <div className="p-4 rounded-lg bg-red-500/10 border border-red-500/30">
                <p className="text-sm font-semibold text-red-500">🚨 Your high-interest debt is costing you <span className="text-lg">{formatCurrency(totalAnnualInterest * ((Math.pow(1 + expectedReturn / 100, 30) - 1) / (expectedReturn / 100)))}</span> in future wealth over 30 years!</p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
