"use client"

import { useState, useMemo } from "react"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { usePortfolio } from "@/lib/portfolio-context"
import { Target, CreditCard, PieChart as PieChartIcon } from "lucide-react"
import { GoalTracker } from "@/components/goals/GoalTracker"
import { DebtTracker } from "@/components/goals/DebtTracker"
import { FinancialOverview } from "@/components/goals/FinancialOverview"
import type { Asset, Debt } from "@/components/goals/types"

export default function GoalsPage() {
  const portfolioContext = usePortfolio()
  const [activeTab, setActiveTab] = useState("goals")

  // ==================== SHARED STATE ====================

  // Goal Tracker state
  const [assets, setAssets] = useState<Asset[]>([])
  const [currentSavings, setCurrentSavings] = useState(0)
  const [targetValue, setTargetValue] = useState(100000)
  const [expectedReturn, setExpectedReturn] = useState(8)
  const [baseContributionAmount, setBaseContributionAmount] = useState(500)
  const [contributionType, setContributionType] = useState<"monthly" | "yearly">("monthly")
  const [includePortfolio, setIncludePortfolio] = useState(true)

  // Debt Tracker state
  const [debts, setDebts] = useState<Debt[]>([])

  // Financial Overview state
  const [includePortfolioInOverview, setIncludePortfolioInOverview] = useState(true)
  const [includeDividendsInOverview, setIncludeDividendsInOverview] = useState(true)
  const [monthlyIncome, setMonthlyIncome] = useState(5000)
  const [monthlyExpenses, setMonthlyExpenses] = useState(2000)

  // ==================== PORTFOLIO VALUES ====================

  const portfolioValue = portfolioContext?.portfolioValue || 0
  const portfolioAnnualReturn = portfolioContext?.performance?.returns?.["1Y"] || 8
  const portfolioAnnualDividends = portfolioContext?.income?.totalDividends || 0

  // ==================== SHARED CALCULATIONS ====================

  const totalAssetsValue = assets.reduce((sum, a) => sum + a.value, 0)
  const monthlyContribution =
    contributionType === "monthly"
      ? baseContributionAmount
      : baseContributionAmount / 12

  const totalCurrentValue = includePortfolio
    ? portfolioValue + currentSavings + totalAssetsValue
    : currentSavings + totalAssetsValue

  // Debt totals (used by both Debt Tracker and Financial Overview)
  const totalDebt = debts.reduce((sum, d) => sum + d.balance, 0)
  const totalMonthlyDebtPayment = debts.reduce((sum, d) => sum + d.monthlyPayment, 0)
  const totalAnnualInterest = debts.reduce(
    (sum, d) => sum + d.balance * (d.apr / 100),
    0
  )

  return (
    <div className="p-4 lg:p-6 space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-foreground">Goals & Finance</h1>
        <p className="text-muted-foreground">
          Track your financial goals, debts, and overall financial health
        </p>
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

        <TabsContent value="goals">
          <GoalTracker
            assets={assets}
            setAssets={setAssets}
            currentSavings={currentSavings}
            setCurrentSavings={setCurrentSavings}
            targetValue={targetValue}
            setTargetValue={setTargetValue}
            expectedReturn={expectedReturn}
            setExpectedReturn={setExpectedReturn}
            baseContributionAmount={baseContributionAmount}
            setBaseContributionAmount={setBaseContributionAmount}
            contributionType={contributionType}
            setContributionType={setContributionType}
            includePortfolio={includePortfolio}
            setIncludePortfolio={setIncludePortfolio}
            portfolioValue={portfolioValue}
            totalAssetsValue={totalAssetsValue}
            totalCurrentValue={totalCurrentValue}
            monthlyContribution={monthlyContribution}
          />
        </TabsContent>

        <TabsContent value="debts">
          <DebtTracker
            debts={debts}
            setDebts={setDebts}
          />
        </TabsContent>

        <TabsContent value="overview">
          <FinancialOverview
            debts={debts}
            totalDebt={totalDebt}
            totalMonthlyDebtPayment={totalMonthlyDebtPayment}
            totalAnnualInterest={totalAnnualInterest}
            currentSavings={currentSavings}
            totalAssetsValue={totalAssetsValue}
            monthlyContribution={monthlyContribution}
            expectedReturn={expectedReturn}
            portfolioValue={portfolioValue}
            portfolioAnnualReturn={portfolioAnnualReturn}
            portfolioAnnualDividends={portfolioAnnualDividends}
            includePortfolioInOverview={includePortfolioInOverview}
            setIncludePortfolioInOverview={setIncludePortfolioInOverview}
            includeDividendsInOverview={includeDividendsInOverview}
            setIncludeDividendsInOverview={setIncludeDividendsInOverview}
            monthlyIncome={monthlyIncome}
            setMonthlyIncome={setMonthlyIncome}
            monthlyExpenses={monthlyExpenses}
            setMonthlyExpenses={setMonthlyExpenses}
          />
        </TabsContent>
      </Tabs>
    </div>
  )
}
