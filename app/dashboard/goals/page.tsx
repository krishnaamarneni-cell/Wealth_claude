"use client"

import { useState, useMemo, useEffect } from "react"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { usePortfolio } from "@/lib/portfolio-context"
import { Target, CreditCard, PieChart as PieChartIcon } from "lucide-react"
import { GoalTracker } from "@/components/goals/GoalTracker"
import { DebtTracker } from "@/components/goals/DebtTracker"
import { FinancialOverview } from "@/components/goals/FinancialOverview"
import type { Asset, Debt, DebtType } from "@/components/goals/types"
import { fetchJSON, dbToDebtType } from "@/components/goals/hooks"

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
  const [isDebtDeleting, setIsDebtDeleting] = useState(false)
  const [includePortfolio, setIncludePortfolio] = useState(true)


  // Debt Tracker state
  const [debts, setDebts] = useState<Debt[]>([])

  // Financial Overview state
  const [includePortfolioInOverview, setIncludePortfolioInOverview] = useState(true)
  const [includeDividendsInOverview, setIncludeDividendsInOverview] = useState(true)
  const [monthlyIncome, setMonthlyIncome] = useState(5000)
  const [monthlyExpenses, setMonthlyExpenses] = useState(2000)

  // ==================== LOAD DATA FROM SUPABASE ON MOUNT ====================

  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    async function loadUserData() {
      try {
        const [goalsData, debtsData, assetsData, settingsData] = await Promise.all([
          fetchJSON<any>("/api/user-goals"),
          fetchJSON<any[]>("/api/user-debts"),
          fetchJSON<any[]>("/api/user-assets"),
          fetchJSON<any>("/api/user-financial-settings"),
        ])

        // Populate goals
        if (goalsData) {
          if (goalsData.targetValue != null) setTargetValue(goalsData.targetValue)
          if (goalsData.currentSavings != null) setCurrentSavings(goalsData.currentSavings)
          if (goalsData.contributionAmount != null) setBaseContributionAmount(goalsData.contributionAmount)
          if (goalsData.contributionType) setContributionType(goalsData.contributionType)
          if (goalsData.expectedReturn != null) setExpectedReturn(goalsData.expectedReturn)
          if (goalsData.includePortfolio != null) setIncludePortfolio(goalsData.includePortfolio)
        }

        // Populate debts
        if (debtsData && Array.isArray(debtsData)) {
          setDebts(
            debtsData.map((d: any) => ({
              id: d.id,
              name: d.name,
              type: dbToDebtType(d.type) as DebtType,
              balance: d.balance,
              apr: d.apr,
              monthlyPayment: d.monthlyPayment || d.minimumPayment || 0,
              minimumPayment: d.minimumPayment || 0,
            }))
          )
        }

        // Populate assets
        if (assetsData && Array.isArray(assetsData)) {
          setAssets(
            assetsData.map((a: any) => ({
              id: a.id,
              name: a.name,
              value: a.value,
              expectedReturn: a.expectedReturn || 0,
            }))
          )
        }

        // Populate financial settings
        if (settingsData) {
          if (settingsData.monthlyIncome != null) setMonthlyIncome(settingsData.monthlyIncome)
          if (settingsData.monthlyExpenses != null) setMonthlyExpenses(settingsData.monthlyExpenses)
          if (settingsData.includePortfolio != null) setIncludePortfolioInOverview(settingsData.includePortfolio)
          if (settingsData.includeDividends != null) setIncludeDividendsInOverview(settingsData.includeDividends)
        }
      } catch (e) {
        console.error("[goals] Failed to load user data:", e)
      } finally {
        setIsLoading(false)
      }
    }

    loadUserData()
  }, [])

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

  if (isLoading) {
    return (
      <div className="p-4 lg:p-6 flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-3" />
          <p className="text-sm text-muted-foreground">Loading your financial data...</p>
        </div>
      </div>
    )
  }

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
            debts={isDebtDeleting ? [] : debts}  // Empty array during delete
            setDebts={(newDebts) => {
              if (isDebtDeleting) return  // Block state updates during delete
              setDebts(newDebts)
            }}
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
