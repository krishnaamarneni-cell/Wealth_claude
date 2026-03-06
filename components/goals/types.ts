// Shared types for Goals & Finance page

export type Asset = {
  id: string
  name: string
  value: number
  expectedReturn: number
}

export type DebtType =
  | "Credit Card"
  | "Auto Loan"
  | "Mortgage"
  | "Student Loan"
  | "Personal Loan"
  | "Other"

export type Debt = {
  id: string
  name: string
  type: DebtType
  balance: number
  apr: number
  monthlyPayment: number
  minimumPayment: number
  loanTerm?: number
}

export type PayoffStrategy = "avalanche" | "snowball"

export type PayoffResult = {
  totalMonths: number
  totalInterestPaid: number
  totalCost: number
  monthlyBudget: number
  monthlySchedule: Array<{
    month: number
    debts: Array<{
      id: string
      name: string
      balance: number
      payment: number
      interest: number
    }>
    totalBalance: number
    totalInterestPaid: number
  }>
  debtFreeDate: string
}

export type ParsedCard = {
  name: string
  balance: number
  apr: number
  minPayment: number
}

export type ParsedFile = {
  name: string
  status: "success" | "error"
  cardCount: number
  errorMessage?: string
}

export const DEBT_COLORS = [
  "#22c55e",
  "#3b82f6",
  "#f97316",
  "#ef4444",
  "#8b5cf6",
  "#eab308",
  "#ec4899",
  "#06b6d4",
  "#6b7280",
  "#a3e635",
]

export const DEBT_TYPE_OPTIONS: DebtType[] = [
  "Credit Card",
  "Auto Loan",
  "Mortgage",
  "Student Loan",
  "Personal Loan",
  "Other",
]

// ==================== HELPER FUNCTIONS ====================

export function formatCurrency(value: number): string {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(value)
}

export function formatPrecise(value: number): string {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(value)
}

export function formatCompact(value: number): string {
  if (value >= 1000000) return `$${(value / 1000000).toFixed(1)}M`
  if (value >= 1000) return `$${(value / 1000).toFixed(1)}K`
  return formatCurrency(value)
}

export function formatDateShort(date: Date): string {
  const months = [
    "Jan", "Feb", "Mar", "Apr", "May", "Jun",
    "Jul", "Aug", "Sep", "Oct", "Nov", "Dec",
  ]
  return `${months[date.getMonth()]} ${date.getFullYear()}`
}

export function formatMonthsShort(months: number): string {
  const years = Math.floor(months / 12)
  const mo = months % 12
  if (years === 0) return `${mo}mo`
  if (mo === 0) return `${years}yr`
  return `${years}yr ${mo}mo`
}

export function getAPRColor(apr: number): string {
  if (apr >= 20) return "#ef4444"
  if (apr >= 15) return "#f97316"
  if (apr >= 8) return "#eab308"
  return "#22c55e"
}

export function calculateMonthlyInterest(debt: Debt): number {
  return (debt.balance * (debt.apr / 100)) / 12
}

export function calculateAnnualInterest(debt: Debt): number {
  return debt.balance * (debt.apr / 100)
}

export function calculatePayoffPlan(
  debts: Debt[],
  strategy: PayoffStrategy,
  extraPayment: number
): PayoffResult {
  if (debts.length === 0) {
    return {
      totalMonths: 0,
      totalInterestPaid: 0,
      totalCost: 0,
      monthlyBudget: 0,
      monthlySchedule: [],
      debtFreeDate: formatDateShort(new Date()),
    }
  }

  const sortedDebts = [...debts].sort((a, b) => {
    if (strategy === "avalanche") return b.apr - a.apr
    // snowball: smallest balance first
    return a.balance - b.balance
  })

  const schedule: PayoffResult["monthlySchedule"] = []
  const currentDebts = sortedDebts.map((d) => ({ ...d }))
  let month = 0
  let totalInterestPaid = 0
  const totalMinPayments = debts.reduce((s, d) => s + d.monthlyPayment, 0)

  while (currentDebts.some((d) => d.balance > 0) && month < 600) {
    month++
    const monthData: (typeof schedule)[0] = {
      month,
      debts: [],
      totalBalance: 0,
      totalInterestPaid: 0,
    }

    let availableExtra =
      extraPayment +
      currentDebts
        .filter((d) => d.balance <= 0)
        .reduce((sum, d) => sum + d.monthlyPayment, 0)

    currentDebts.forEach((debt, index) => {
      if (debt.balance <= 0) {
        monthData.debts.push({
          id: debt.id,
          name: debt.name,
          balance: 0,
          payment: 0,
          interest: 0,
        })
        return
      }

      const monthlyInterest = (debt.balance * (debt.apr / 100)) / 12
      let payment = debt.monthlyPayment

      if (
        index === currentDebts.findIndex((d) => d.balance > 0) &&
        availableExtra > 0
      ) {
        payment += availableExtra
        availableExtra = 0
      }

      payment = Math.min(payment, debt.balance + monthlyInterest)
      const principalPayment = payment - monthlyInterest
      const newBalance = Math.max(0, debt.balance - principalPayment)

      totalInterestPaid += monthlyInterest
      monthData.debts.push({
        id: debt.id,
        name: debt.name,
        balance: newBalance,
        payment,
        interest: monthlyInterest,
      })

      debt.balance = newBalance
      monthData.totalBalance += newBalance
    })

    monthData.totalInterestPaid = totalInterestPaid
    schedule.push(monthData)

    if (currentDebts.every((d) => d.balance <= 0)) break
  }

  const totalDebt = debts.reduce((s, d) => s + d.balance, 0)
  const debtFreeDate = new Date()
  debtFreeDate.setMonth(debtFreeDate.getMonth() + month)

  return {
    totalMonths: month,
    totalInterestPaid,
    totalCost: totalDebt + totalInterestPaid,
    monthlyBudget: totalMinPayments + extraPayment,
    monthlySchedule: schedule,
    debtFreeDate: formatDateShort(debtFreeDate),
  }
}