"use client";
import { useState, useMemo, useRef, useCallback } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  ReferenceLine,
  PieChart,
  Pie,
  Cell,
} from "recharts";
import { usePortfolio } from "@/lib/portfolio-context";
import {
  Target,
  TrendingUp,
  Calendar,
  DollarSign,
  Pencil,
  X,
  CreditCard,
  AlertTriangle,
  TrendingDown,
  PieChart as PieChartIcon,
  Activity,
  CheckCircle2,
  Plus,
  Shield,
  Zap,
  Snowflake,
  Flame,
  BarChart3,
  Upload,
  Download,
  FileText,
  Trash2,
} from "lucide-react";

type Asset = { id: string; name: string; value: number; expectedReturn: number };
type DebtType = "Credit Card" | "Auto Loan" | "Mortgage" | "Student Loan" | "Personal Loan" | "Other";
type Debt = {
  id: string;
  name: string;
  type: DebtType;
  balance: number;
  apr: number;
  monthlyPayment: number;
  minimumPayment: number;
  loanTerm?: number;
};
type PayoffStrategy = "avalanche" | "snowball" | "custom";
type PayoffResult = {
  totalMonths: number;
  totalInterestPaid: number;
  totalCost: number;
  monthlyBudget: number;
  monthlySchedule: Array<{
    month: number;
    debts: Array<{ id: string; name: string; balance: number; payment: number; interest: number }>;
    totalBalance: number;
    totalInterestPaid: number;
  }>;
  debtFreeDate: string;
};

function formatCurrency(v: number): string {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(v);
}
function formatPrecise(v: number): string {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(v);
}
function formatCompact(v: number): string {
  if (v >= 1000000) return `$${(v / 1000000).toFixed(1)}M`;
  if (v >= 1000) return `$${(v / 1000).toFixed(1)}K`;
  return formatCurrency(v);
}
function formatDateShort(d: Date): string {
  return (
    ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"][d.getMonth()] +
    " " +
    d.getFullYear()
  );
}
function formatMonths(m: number): string {
  const y = Math.floor(m / 12),
    mo = m % 12;
  if (y === 0) return `${mo}mo`;
  if (mo === 0) return `${y}yr`;
  return `${y}yr ${mo}mo`;
}
function getAPRColor(apr: number): string {
  if (apr >= 20) return "#ef4444";
  if (apr >= 15) return "#f97316";
  if (apr >= 8) return "#eab308";
  return "#22c55e";
}

function generateProjectionData(startValue: number, monthly: number, returnRate: number, goal: number) {
  const monthlyRate = returnRate / 100 / 12;
  const data: Array<{ date: string; actual: number | null; invested: number | null; projected: number | null }> = [];
  let balanceWithGrowth = startValue;
  const today = new Date();
  data.push({
    date: `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, "0")}`,
    actual: startValue,
    invested: startValue,
    projected: null,
  });
  for (let i = 1; i <= 36; i++) {
    const investedOnly = startValue + monthly * i;
    if (returnRate > 0) {
      balanceWithGrowth = balanceWithGrowth * (1 + monthlyRate) + monthly;
    } else {
      balanceWithGrowth = balanceWithGrowth + monthly;
    }
    const futureDate = new Date(today);
    futureDate.setMonth(futureDate.getMonth() + i);
    data.push({
      date: `${futureDate.getFullYear()}-${String(futureDate.getMonth() + 1).padStart(2, "0")}`,
      actual: null,
      invested: Math.round(investedOnly),
      projected: Math.round(balanceWithGrowth),
    });
    if (balanceWithGrowth >= goal) break;
  }
  return data;
}

function generateMilestones(goal: number): number[] {
  if (goal <= 100000) return [10000, 25000, 50000, 75000, 100000];
  if (goal <= 250000) return [25000, 50000, 100000, 150000, 200000, 250000];
  if (goal <= 500000) return [50000, 100000, 250000, 350000, 500000];
  return [100000, 250000, 500000, 750000, 1000000];
}

function calculateMonthlyInterest(debt: Debt): number {
  return (debt.balance * (debt.apr / 100)) / 12;
}
function calculateAnnualInterest(debt: Debt): number {
  return debt.balance * (debt.apr / 100);
}

function calculatePayoffPlan(debts: Debt[], strategy: PayoffStrategy, extraPayment: number): PayoffResult {
  if (debts.length === 0)
    return {
      totalMonths: 0,
      totalInterestPaid: 0,
      totalCost: 0,
      monthlyBudget: 0,
      monthlySchedule: [],
      debtFreeDate: formatDateShort(new Date()),
    };
  const sortedDebts = [...debts].sort((a, b) => {
    if (strategy === "avalanche") return b.apr - a.apr;
    if (strategy === "snowball") return a.balance - b.balance;
    const scoreA = a.balance > 0 ? (a.apr / a.balance) * 10000 : 0;
    const scoreB = b.balance > 0 ? (b.apr / b.balance) * 10000 : 0;
    return scoreB - scoreA;
  });
  const schedule: PayoffResult["monthlySchedule"] = [];
  const currentDebts = sortedDebts.map((d) => ({ ...d }));
  let month = 0;
  let totalInterestPaid = 0;
  const totalMinPayments = debts.reduce((s, d) => s + d.monthlyPayment, 0);
  while (currentDebts.some((d) => d.balance > 0) && month < 600) {
    month++;
    const monthData: (typeof schedule)[0] = { month, debts: [], totalBalance: 0, totalInterestPaid: 0 };
    let availableExtra =
      extraPayment + currentDebts.filter((d) => d.balance <= 0).reduce((sum, d) => sum + d.monthlyPayment, 0);
    currentDebts.forEach((debt, index) => {
      if (debt.balance <= 0) {
        monthData.debts.push({ id: debt.id, name: debt.name, balance: 0, payment: 0, interest: 0 });
        return;
      }
      const monthlyInterest = (debt.balance * (debt.apr / 100)) / 12;
      let payment = debt.monthlyPayment;
      if (index === currentDebts.findIndex((d) => d.balance > 0) && availableExtra > 0) {
        payment += availableExtra;
        availableExtra = 0;
      }
      payment = Math.min(payment, debt.balance + monthlyInterest);
      const principalPayment = payment - monthlyInterest;
      const newBalance = Math.max(0, debt.balance - principalPayment);
      totalInterestPaid += monthlyInterest;
      monthData.debts.push({ id: debt.id, name: debt.name, balance: newBalance, payment, interest: monthlyInterest });
      debt.balance = newBalance;
      monthData.totalBalance += newBalance;
    });
    monthData.totalInterestPaid = totalInterestPaid;
    schedule.push(monthData);
    if (currentDebts.every((d) => d.balance <= 0)) break;
  }
  const totalDebt = debts.reduce((s, d) => s + d.balance, 0);
  const debtFreeDate = new Date();
  debtFreeDate.setMonth(debtFreeDate.getMonth() + month);
  return {
    totalMonths: month,
    totalInterestPaid,
    totalCost: totalDebt + totalInterestPaid,
    monthlyBudget: totalMinPayments + extraPayment,
    monthlySchedule: schedule,
    debtFreeDate: formatDateShort(debtFreeDate),
  };
}

function generatePayoffReportHTML(
  debts: Debt[],
  results: Record<string, PayoffResult>,
  strategy: string,
  extraPayment: number,
): string {
  const totalDebt = debts.reduce((sum, d) => sum + d.balance, 0);
  const result = results[strategy];
  const debtRows = debts
    .map(
      (d) =>
        `<tr><td style="padding:10px 12px;border-bottom:1px solid #1a2332;">${d.name}</td><td style="padding:10px 12px;border-bottom:1px solid #1a2332;">${d.type}</td><td style="padding:10px 12px;border-bottom:1px solid #1a2332;text-align:right;color:#ef4444;">$${d.balance.toLocaleString("en-US", { minimumFractionDigits: 2 })}</td><td style="padding:10px 12px;border-bottom:1px solid #1a2332;text-align:right;color:#f97316;">${d.apr}%</td><td style="padding:10px 12px;border-bottom:1px solid #1a2332;text-align:right;">$${d.monthlyPayment.toFixed(2)}</td><td style="padding:10px 12px;border-bottom:1px solid #1a2332;text-align:right;color:#f97316;">$${((d.balance * d.apr) / 100 / 12).toFixed(2)}</td></tr>`,
    )
    .join("");
  const strategyRows = (["snowball", "avalanche", "custom"] as const)
    .map((s) => {
      const r = results[s];
      const saving = r.totalInterestPaid - results.snowball.totalInterestPaid;
      const isActive = s === strategy;
      return `<tr style="${isActive ? "background:#0a2a1a;" : ""}"><td style="padding:10px 12px;border-bottom:1px solid #1a2332;font-weight:${isActive ? "bold" : "normal"};color:${isActive ? "#22c55e" : "#e5e7eb"};">${s.charAt(0).toUpperCase() + s.slice(1)}</td><td style="padding:10px 12px;border-bottom:1px solid #1a2332;">$${extraPayment.toFixed(2)}</td><td style="padding:10px 12px;border-bottom:1px solid #1a2332;">${formatMonths(r.totalMonths)}</td><td style="padding:10px 12px;border-bottom:1px solid #1a2332;color:#f97316;">$${r.totalInterestPaid.toFixed(2)}</td><td style="padding:10px 12px;border-bottom:1px solid #1a2332;">$${r.totalCost.toFixed(2)}</td><td style="padding:10px 12px;border-bottom:1px solid #1a2332;color:${saving < 0 ? "#22c55e" : saving > 0 ? "#ef4444" : "#9ca3af"};">${saving < 0 ? "save $" + Math.abs(saving).toFixed(2) : saving > 0 ? "+$" + saving.toFixed(2) : "\u2014"}</td></tr>`;
    })
    .join("");
  return `<!DOCTYPE html><html><head><title>WealthClaude \u2014 Debt Payoff Report</title></head><body style="font-family:'Segoe UI',system-ui,sans-serif;max-width:860px;margin:0 auto;padding:40px;color:#e5e7eb;background:#0a0f1a;"><div style="display:flex;align-items:center;gap:12px;margin-bottom:8px;"><div style="width:36px;height:36px;background:linear-gradient(135deg,#22c55e,#16a34a);border-radius:8px;display:flex;align-items:center;justify-content:center;"><span style="color:white;font-weight:bold;font-size:18px;">W</span></div><h1 style="color:#fff;margin:0;font-size:28px;">Debt Payoff Report</h1></div><p style="color:#6b7280;margin:0 0 24px 48px;font-size:13px;">Generated by WealthClaude on ${new Date().toLocaleDateString("en-US", { year: "numeric", month: "long", day: "numeric" })}</p><hr style="border:none;border-top:1px solid #1a2332;margin:0 0 28px;"><div style="display:grid;grid-template-columns:1fr 1fr 1fr 1fr;gap:16px;margin-bottom:28px;"><div style="background:#111827;border:1px solid #1a2332;border-radius:10px;padding:16px;"><p style="color:#6b7280;font-size:12px;margin:0 0 4px;text-transform:uppercase;letter-spacing:1px;">Total Debt</p><p style="color:#ef4444;font-size:24px;font-weight:bold;margin:0;">$${totalDebt.toLocaleString("en-US", { minimumFractionDigits: 2 })}</p></div><div style="background:#111827;border:1px solid #1a2332;border-radius:10px;padding:16px;"><p style="color:#6b7280;font-size:12px;margin:0 0 4px;text-transform:uppercase;letter-spacing:1px;">Payoff Date</p><p style="color:#22c55e;font-size:24px;font-weight:bold;margin:0;">${result.debtFreeDate}</p></div><div style="background:#111827;border:1px solid #1a2332;border-radius:10px;padding:16px;"><p style="color:#6b7280;font-size:12px;margin:0 0 4px;text-transform:uppercase;letter-spacing:1px;">Total Interest</p><p style="color:#f97316;font-size:24px;font-weight:bold;margin:0;">$${result.totalInterestPaid.toFixed(2)}</p></div><div style="background:#111827;border:1px solid #1a2332;border-radius:10px;padding:16px;"><p style="color:#6b7280;font-size:12px;margin:0 0 4px;text-transform:uppercase;letter-spacing:1px;">Monthly Budget</p><p style="color:#e5e7eb;font-size:24px;font-weight:bold;margin:0;">$${result.monthlyBudget.toFixed(2)}</p></div></div><h2 style="color:#fff;font-size:16px;text-transform:uppercase;letter-spacing:1px;margin-bottom:12px;">Debt Details</h2><table style="width:100%;border-collapse:collapse;margin-bottom:28px;background:#111827;border-radius:10px;overflow:hidden;"><thead><tr style="background:#0d1524;"><th style="padding:10px 12px;text-align:left;color:#6b7280;font-size:11px;text-transform:uppercase;">Name</th><th style="padding:10px 12px;text-align:left;color:#6b7280;font-size:11px;text-transform:uppercase;">Type</th><th style="padding:10px 12px;text-align:right;color:#6b7280;font-size:11px;text-transform:uppercase;">Balance</th><th style="padding:10px 12px;text-align:right;color:#6b7280;font-size:11px;text-transform:uppercase;">APR</th><th style="padding:10px 12px;text-align:right;color:#6b7280;font-size:11px;text-transform:uppercase;">Min Payment</th><th style="padding:10px 12px;text-align:right;color:#6b7280;font-size:11px;text-transform:uppercase;">Interest/Mo</th></tr></thead><tbody>${debtRows}</tbody></table><h2 style="color:#fff;font-size:16px;text-transform:uppercase;letter-spacing:1px;margin-bottom:12px;">Strategy Comparison</h2><table style="width:100%;border-collapse:collapse;margin-bottom:28px;background:#111827;border-radius:10px;overflow:hidden;"><thead><tr style="background:#0d1524;"><th style="padding:10px 12px;text-align:left;color:#6b7280;font-size:11px;text-transform:uppercase;">Strategy</th><th style="padding:10px 12px;text-align:left;color:#6b7280;font-size:11px;text-transform:uppercase;">Extra/Mo</th><th style="padding:10px 12px;text-align:left;color:#6b7280;font-size:11px;text-transform:uppercase;">Payoff Time</th><th style="padding:10px 12px;text-align:left;color:#6b7280;font-size:11px;text-transform:uppercase;">Total Interest</th><th style="padding:10px 12px;text-align:left;color:#6b7280;font-size:11px;text-transform:uppercase;">Total Cost</th><th style="padding:10px 12px;text-align:left;color:#6b7280;font-size:11px;text-transform:uppercase;">vs Snowball</th></tr></thead><tbody>${strategyRows}</tbody></table><div style="background:linear-gradient(135deg,#0a2a1a,#0d1524);border:2px solid #22c55e40;border-radius:12px;padding:24px;margin-bottom:28px;"><p style="color:#22c55e;font-size:12px;text-transform:uppercase;letter-spacing:1px;margin:0 0 8px;">\u2726 Your Action Plan</p><p style="color:#fff;font-size:20px;font-weight:bold;margin:0;">Pay $${extraPayment.toFixed(2)} extra/month using ${strategy.charAt(0).toUpperCase() + strategy.slice(1)} \u2192 debt free in ${formatMonths(result.totalMonths)}</p></div><hr style="border:none;border-top:1px solid #1a2332;margin:28px 0;"><p style="color:#4b5563;font-size:11px;text-align:center;">This report is for informational purposes only.<br/>Generated by WealthClaude \u00b7 wealthclaude.com</p></body></html>`;
}

const DEBT_COLORS = [
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
];
const DEBT_TYPE_OPTIONS: DebtType[] = [
  "Credit Card",
  "Auto Loan",
  "Mortgage",
  "Student Loan",
  "Personal Loan",
  "Other",
];

export default function GoalsPage() {
  const portfolioContext = usePortfolio();
  const [activeTab, setActiveTab] = useState("goals");
  const [contributionType, setContributionType] = useState<"monthly" | "yearly">("monthly");
  const [baseContributionAmount, setBaseContributionAmount] = useState(500);
  const [targetValue, setTargetValue] = useState(100000);
  const [expectedReturn, setExpectedReturn] = useState(8);
  const [currentSavings, setCurrentSavings] = useState(0);
  const [includePortfolio, setIncludePortfolio] = useState(true);
  const [isEditingGoal, setIsEditingGoal] = useState(false);
  const [isEditingContribution, setIsEditingContribution] = useState(false);
  const [isEditingReturn, setIsEditingReturn] = useState(false);
  const [isEditingSavings, setIsEditingSavings] = useState(false);
  const [tempGoalValue, setTempGoalValue] = useState(targetValue.toString());
  const [tempContributionValue, setTempContributionValue] = useState(baseContributionAmount.toString());
  const [tempReturnValue, setTempReturnValue] = useState(expectedReturn.toString());
  const [tempSavingsValue, setTempSavingsValue] = useState(currentSavings.toString());
  const [assets, setAssets] = useState<Asset[]>([]);
  const [showAddAsset, setShowAddAsset] = useState(false);
  const [newAssetName, setNewAssetName] = useState("");
  const [newAssetValue, setNewAssetValue] = useState("");
  const [newAssetReturn, setNewAssetReturn] = useState("8");
  const [debts, setDebts] = useState<Debt[]>([]);
  const [payoffStrategy, setPayoffStrategy] = useState<PayoffStrategy>("avalanche");
  const [extraDebtPayment, setExtraDebtPayment] = useState(200);
  const [showResults, setShowResults] = useState(false);
  const [debtEntryMode, setDebtEntryMode] = useState<"manual" | "upload">("manual");
  const [uploadedFiles, setUploadedFiles] = useState<{ name: string; type: string }[]>([]);
  const [newDebtName, setNewDebtName] = useState("");
  const [newDebtType, setNewDebtType] = useState<DebtType>("Credit Card");
  const [newDebtBalance, setNewDebtBalance] = useState("");
  const [newDebtAPR, setNewDebtAPR] = useState("");
  const [newDebtMinPayment, setNewDebtMinPayment] = useState("");
  const csvInputRef = useRef<HTMLInputElement>(null);
  const pdfInputRef = useRef<HTMLInputElement>(null);
  const [includePortfolioInOverview, setIncludePortfolioInOverview] = useState(true);
  const [includeDividendsInOverview, setIncludeDividendsInOverview] = useState(true);
  const [monthlyIncome, setMonthlyIncome] = useState(5000);
  const [monthlyExpenses, setMonthlyExpenses] = useState(2000);
  const portfolioValue = portfolioContext?.portfolioValue || 0;
  const portfolioAnnualReturn = portfolioContext?.performance?.returns?.["1Y"] || 8;
  const portfolioAnnualDividends = portfolioContext?.income?.totalDividends || 0;
  const totalAssetsValue = assets.reduce((sum, a) => sum + a.value, 0);
  const weightedAssetReturn =
    assets.length > 0 ? assets.reduce((sum, a) => sum + a.value * a.expectedReturn, 0) / totalAssetsValue : 0;
  const totalCurrentValue = includePortfolio
    ? portfolioValue + currentSavings + totalAssetsValue
    : currentSavings + totalAssetsValue;
  const progressPercent = targetValue > 0 ? (totalCurrentValue / targetValue) * 100 : 0;
  const remainingAmount = Math.max(0, targetValue - totalCurrentValue);
  const monthlyContribution = contributionType === "monthly" ? baseContributionAmount : baseContributionAmount / 12;
  let monthsToGoal = 0;
  if (monthlyContribution > 0) {
    if (expectedReturn > 0) {
      const monthlyRate = expectedReturn / 100 / 12;
      let months = 0;
      let projectedValue = totalCurrentValue;
      while (projectedValue < targetValue && months < 600) {
        projectedValue = projectedValue * (1 + monthlyRate) + monthlyContribution;
        months++;
      }
      monthsToGoal = months;
    } else {
      monthsToGoal = Math.ceil(remainingAmount / monthlyContribution);
    }
  }
  const completionDate = new Date();
  completionDate.setMonth(completionDate.getMonth() + monthsToGoal);
  const projectedCompletion = formatDateShort(completionDate);
  const blendedReturn =
    totalCurrentValue > 0
      ? (portfolioValue * expectedReturn + currentSavings * 0 + totalAssetsValue * weightedAssetReturn) /
      totalCurrentValue
      : expectedReturn;
  const projectionData = generateProjectionData(totalCurrentValue, monthlyContribution, blendedReturn, targetValue);
  const totalDebt = debts.reduce((sum, d) => sum + d.balance, 0);
  const totalMonthlyDebtPayment = debts.reduce((sum, d) => sum + d.monthlyPayment, 0);
  const totalMonthlyInterest = debts.reduce((sum, d) => sum + calculateMonthlyInterest(d), 0);
  const totalAnnualInterest = debts.reduce((sum, d) => sum + calculateAnnualInterest(d), 0);
  const weightedAvgAPR = totalDebt > 0 ? debts.reduce((sum, d) => sum + d.balance * d.apr, 0) / totalDebt : 0;
  const allResults = useMemo(
    () => ({
      avalanche: calculatePayoffPlan(debts, "avalanche", extraDebtPayment),
      snowball: calculatePayoffPlan(debts, "snowball", extraDebtPayment),
      custom: calculatePayoffPlan(debts, "custom", extraDebtPayment),
    }),
    [debts, extraDebtPayment],
  );
  const currentResult = allResults[payoffStrategy];
  const savingsVsSnowball = allResults.snowball.totalInterestPaid - currentResult.totalInterestPaid;
  const debtPieData = debts.map((d, i) => ({
    name: d.name,
    value: d.balance,
    percent: totalDebt > 0 ? (d.balance / totalDebt) * 100 : 0,
    color: DEBT_COLORS[i % DEBT_COLORS.length],
  }));
  const debtByType = debts.reduce(
    (acc, d) => {
      acc[d.type] = (acc[d.type] || 0) + d.balance;
      return acc;
    },
    {} as Record<string, number>,
  );
  const balanceGradientSegments = useMemo(() => {
    if (!showResults || currentResult.totalMonths === 0) return [];
    const totalMo = currentResult.totalMonths;
    const segCount = Math.min(totalMo, 20);
    const step = Math.max(1, Math.floor(totalMo / segCount));
    const segs: { month: number; balance: number; ratio: number }[] = [];
    for (let i = 0; i < totalMo; i += step) {
      const e = currentResult.monthlySchedule[i];
      if (e)
        segs.push({ month: e.month, balance: e.totalBalance, ratio: totalDebt > 0 ? e.totalBalance / totalDebt : 0 });
    }
    if (segs.length > 0 && segs[segs.length - 1].month !== totalMo) segs.push({ month: totalMo, balance: 0, ratio: 0 });
    return segs;
  }, [showResults, currentResult, totalDebt]);
  const totalAssets = (includePortfolioInOverview ? portfolioValue : 0) + currentSavings + totalAssetsValue;
  const totalLiabilities = totalDebt;
  const netWorth = totalAssets - totalLiabilities;
  const annualIncome = monthlyIncome * 12;
  const annualExpenses = monthlyExpenses * 12;
  const annualInvestmentContributions = monthlyContribution * 12;
  const portfolioAnnualReturnDollars = includePortfolioInOverview ? portfolioValue * (portfolioAnnualReturn / 100) : 0;
  const dividendIncome = includePortfolioInOverview && includeDividendsInOverview ? portfolioAnnualDividends : 0;
  const netAnnualCashFlow =
    annualIncome +
    portfolioAnnualReturnDollars +
    dividendIncome -
    (annualExpenses + totalAnnualInterest + annualInvestmentContributions);
  const monthlyNetCashFlow = netAnnualCashFlow / 12;
  const debtToIncomeRatio = monthlyIncome > 0 ? (totalMonthlyDebtPayment / monthlyIncome) * 100 : 0;
  const debtToAssetRatio = totalAssets > 0 ? (totalDebt / totalAssets) * 100 : 0;
  const emergencyFundMonths = monthlyExpenses > 0 ? currentSavings / monthlyExpenses : 0;
  const leverageRatio = netWorth > 0 ? totalDebt / netWorth : 0;
  const healthScore = (() => {
    let s = 100;
    if (debtToIncomeRatio > 50) s -= 30;
    else if (debtToIncomeRatio > 35) s -= 20;
    else if (debtToIncomeRatio > 20) s -= 10;
    if (emergencyFundMonths < 3) s -= 25;
    else if (emergencyFundMonths < 6) s -= 10;
    if (netWorth < 0) s -= 20;
    else if (netWorth < 10000) s -= 10;
    if (leverageRatio > 2) s -= 15;
    else if (leverageRatio > 1) s -= 8;
    if (monthlyNetCashFlow < 0) s -= 10;
    else if (monthlyNetCashFlow < 200) s -= 5;
    return Math.max(0, s);
  })();

  const handleSaveGoal = () => {
    const v = parseFloat(tempGoalValue);
    if (!isNaN(v)) setTargetValue(v);
    setIsEditingGoal(false);
  };
  const handleSaveSavings = () => {
    const v = Number(tempSavingsValue);
    if (v >= 0) setCurrentSavings(v);
    else setTempSavingsValue(currentSavings.toString());
    setIsEditingSavings(false);
  };
  const handleSaveContribution = () => {
    const v = parseFloat(tempContributionValue);
    if (!isNaN(v)) setBaseContributionAmount(v);
    setIsEditingContribution(false);
  };
  const handleSaveReturn = () => {
    const v = parseFloat(tempReturnValue);
    if (!isNaN(v)) setExpectedReturn(v);
    setIsEditingReturn(false);
  };
  const handleAddAsset = () => {
    if (assets.length >= 10) return;
    const value = Number(newAssetValue),
      returnRate = Number(newAssetReturn);
    if (!newAssetName || value <= 0 || returnRate < 0 || returnRate > 100) {
      alert("Please enter valid asset details");
      return;
    }
    setAssets([...assets, { id: Date.now().toString(), name: newAssetName, value, expectedReturn: returnRate }]);
    setNewAssetName("");
    setNewAssetValue("");
    setNewAssetReturn("8");
    setShowAddAsset(false);
  };
  const handleDeleteAsset = (id: string) => setAssets(assets.filter((a) => a.id !== id));
  const handleAddDebt = () => {
    if (debts.length >= 20) return;
    const balance = parseFloat(newDebtBalance),
      apr = parseFloat(newDebtAPR),
      minPay = parseFloat(newDebtMinPayment);
    if (!newDebtName || isNaN(balance) || balance <= 0 || isNaN(apr) || apr < 0 || isNaN(minPay) || minPay <= 0) {
      alert("Fill all fields: Name, Balance, APR, Min Payment");
      return;
    }
    setDebts([
      ...debts,
      {
        id: Date.now().toString(),
        name: newDebtName,
        type: newDebtType,
        balance,
        apr,
        monthlyPayment: minPay,
        minimumPayment: minPay,
      },
    ]);
    setNewDebtName("");
    setNewDebtType("Credit Card");
    setNewDebtBalance("");
    setNewDebtAPR("");
    setNewDebtMinPayment("");
    setShowResults(false);
  };
  const handleDeleteDebt = (id: string) => {
    setDebts(debts.filter((d) => d.id !== id));
    setShowResults(false);
  };
  const handleCalculatePayoff = useCallback(() => {
    if (debts.length === 0) return;
    setShowResults(true);
  }, [debts]);
  const handleCsvUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    for (const file of files) {
      try {
        const text = await file.text();
        const rows = text.split("\n");
        const header = rows[0]?.toLowerCase() || "";
        const dataRows = rows.slice(1).filter((r) => r.trim());
        if (header.includes("balance") || header.includes("apr") || header.includes("amount")) {
          const cols = rows[0].split(",").map((c) => c.trim().toLowerCase());
          const nameIdx = cols.findIndex((c) => c.includes("name") || c.includes("card"));
          const balanceIdx = cols.findIndex((c) => c.includes("balance") || c.includes("amount"));
          const aprIdx = cols.findIndex((c) => c.includes("apr") || c.includes("rate"));
          const paymentIdx = cols.findIndex((c) => c.includes("payment") || c.includes("min"));
          if (balanceIdx >= 0) {
            const importedDebts: Debt[] = [];
            dataRows.forEach((row) => {
              const values = row.split(",").map((v) => v.trim());
              const bal = parseFloat(values[balanceIdx]?.replace(/[$,]/g, "") || "0");
              if (bal > 0)
                importedDebts.push({
                  id: Date.now().toString() + Math.random(),
                  name: nameIdx >= 0 ? values[nameIdx] || "Imported" : "Imported",
                  type: "Credit Card",
                  balance: bal,
                  apr: aprIdx >= 0 ? parseFloat(values[aprIdx]?.replace(/%/g, "") || "0") : 0,
                  monthlyPayment: paymentIdx >= 0 ? parseFloat(values[paymentIdx]?.replace(/[$,]/g, "") || "0") : 0,
                  minimumPayment: paymentIdx >= 0 ? parseFloat(values[paymentIdx]?.replace(/[$,]/g, "") || "0") : 0,
                });
            });
            if (importedDebts.length > 0) {
              setDebts((prev) => [...prev, ...importedDebts].slice(0, 20));
              setUploadedFiles((prev) => [...prev, { name: file.name, type: "csv" }]);
              setTimeout(() => setShowResults(true), 100);
            }
          }
        }
      } catch {
        alert(`Error reading ${file.name}`);
      }
    }
    if (csvInputRef.current) csvInputRef.current.value = "";
  };
  const handlePdfUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    Array.from(e.target.files || []).forEach((f) =>
      setUploadedFiles((prev) => [...prev, { name: f.name, type: "pdf" }]),
    );
    if (pdfInputRef.current) pdfInputRef.current.value = "";
  };
  const handleRemoveFile = (index: number) => setUploadedFiles((prev) => prev.filter((_, i) => i !== index));
  const handleDownloadReport = () => {
    if (debts.length === 0) return;
    const html = generatePayoffReportHTML(debts, allResults, payoffStrategy, extraDebtPayment);
    const blob = new Blob([html], { type: "text/html" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `WealthClaude-Debt-Report-${new Date().toISOString().split("T")[0]}.html`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };
  const displayContributionAmount =
    contributionType === "monthly" ? baseContributionAmount : baseContributionAmount * 12;

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
                      className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${includePortfolio ? "bg-primary" : "bg-gray-600"}`}
                      aria-label="Toggle portfolio inclusion"
                    >
                      <span
                        className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${includePortfolio ? "translate-x-6" : "translate-x-1"}`}
                      />
                    </button>
                    <span
                      className={`text-xs font-medium ${includePortfolio ? "text-primary" : "text-muted-foreground"}`}
                    >
                      {includePortfolio ? "ON" : "OFF"}
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
                            if (e.key === "Enter") handleSaveGoal();
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
                          setTempGoalValue(targetValue.toString());
                          setIsEditingGoal(true);
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
                        {totalAssetsValue > 0 && <> + Assets: {formatCurrency(totalAssetsValue)}</>} (Portfolio
                        excluded)
                      </>
                    )}
                  </div>
                </div>
              </div>
              <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-6">
                <div
                  className={`rounded-lg border border-border p-4 ${includePortfolio ? "bg-secondary/50" : "bg-secondary/20 opacity-50"}`}
                >
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
                  <p
                    className={`mt-1 text-xl font-bold ${includePortfolio ? "text-foreground" : "text-muted-foreground"}`}
                  >
                    {formatCurrency(portfolioValue)}
                  </p>
                  <p className="mt-1 text-xs text-muted-foreground">
                    {includePortfolio ? "From portfolio engine" : "Not included in goal"}
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
                          if (e.key === "Enter") handleSaveSavings();
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
                        setTempSavingsValue(currentSavings.toString());
                        setIsEditingSavings(true);
                      }}
                      className="mt-2 flex items-center gap-1"
                    >
                      <p className="text-xl font-bold text-foreground">{formatCurrency(currentSavings)}</p>
                      <Pencil className="h-3 w-3 text-muted-foreground" />
                    </button>
                  )}
                  <p className="mt-1 text-xs text-muted-foreground">Manual savings/assets</p>
                </div>
                <div className="rounded-lg border border-border bg-secondary/50 p-4">
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <DollarSign className="h-4 w-4" />
                    Remaining
                  </div>
                  <p className="mt-1 text-xl font-bold text-foreground">{formatCurrency(remainingAmount)}</p>
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
                        className={`px-1.5 py-0.5 text-xs rounded transition-colors ${contributionType === "monthly" ? "bg-primary text-primary-foreground" : "text-muted-foreground hover:text-foreground"}`}
                      >
                        Mo.
                      </button>
                      <button
                        onClick={() => setContributionType("yearly")}
                        className={`px-1.5 py-0.5 text-xs rounded transition-colors ${contributionType === "yearly" ? "bg-primary text-primary-foreground" : "text-muted-foreground hover:text-foreground"}`}
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
                          if (e.key === "Enter") handleSaveContribution();
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
                        setTempContributionValue(baseContributionAmount.toString());
                        setIsEditingContribution(true);
                      }}
                      className="mt-2 flex items-center gap-1"
                    >
                      <p className="text-xl font-bold text-foreground">{formatCurrency(displayContributionAmount)}</p>
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
                          if (e.key === "Enter") handleSaveReturn();
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
                        setTempReturnValue(expectedReturn.toString());
                        setIsEditingReturn(true);
                      }}
                      className="mt-2 flex items-center gap-1"
                    >
                      <p className="text-xl font-bold text-foreground">{expectedReturn}% annually</p>
                      <Pencil className="h-3 w-3 text-muted-foreground" />
                    </button>
                  )}
                </div>
                <div className="rounded-lg border border-border bg-secondary/50 p-4">
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <Calendar className="h-4 w-4" />
                    Est. Completion
                  </div>
                  <p className="mt-1 text-xl font-bold text-primary">{projectedCompletion}</p>
                </div>
              </div>
            </CardContent>
          </Card>
          {/* Other Assets */}
          <Card className="border-border bg-card">
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="text-base">Other Assets</CardTitle>
                  <p className="text-xs text-muted-foreground mt-1">Add external assets (Max 10)</p>
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
                      placeholder="Asset name"
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
                        setShowAddAsset(false);
                        setNewAssetName("");
                        setNewAssetValue("");
                        setNewAssetReturn("8");
                      }}
                      className="rounded bg-secondary px-4 py-1.5 text-sm text-foreground hover:bg-secondary/80"
                    >
                      Cancel
                    </button>
                  </div>
                </div>
              )}
              {assets.length === 0 ? (
                <div className="text-center py-6 text-muted-foreground text-sm">No assets added yet.</div>
              ) : (
                <div className="space-y-2">
                  {assets.map((asset) => (
                    <div
                      key={asset.id}
                      className="flex items-center justify-between rounded-lg border border-border bg-secondary/30 p-3"
                    >
                      <div className="flex-1 grid grid-cols-3 gap-3 items-center">
                        <p className="font-medium text-foreground">{asset.name}</p>
                        <p className="text-right font-bold text-foreground">{formatCurrency(asset.value)}</p>
                        <p className="text-right text-sm text-muted-foreground">{asset.expectedReturn}% return</p>
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
          {/* Projection Chart */}
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
                      tick={{ fill: "#d1d5db" }}
                      axisLine={{ stroke: "#4b5563", strokeWidth: 2 }}
                      tickLine={{ stroke: "#4b5563" }}
                    />
                    <YAxis
                      tickFormatter={(v) => `$${(v / 1000).toFixed(0)}k`}
                      stroke="#9ca3af"
                      fontSize={12}
                      tick={{ fill: "#d1d5db" }}
                      axisLine={{ stroke: "#4b5563", strokeWidth: 2 }}
                      tickLine={{ stroke: "#4b5563" }}
                    />
                    <Tooltip
                      contentStyle={{
                        backgroundColor: "hsl(var(--card))",
                        border: "1px solid hsl(var(--border))",
                        borderRadius: "8px",
                      }}
                      formatter={(value: number | null) => (value ? [formatCurrency(value), ""] : ["", ""])}
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
                      name="Invested Amount (no returns)"
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
            const totalInvested = monthlyContribution * monthsToGoal;
            const compoundGrowth = Math.max(0, targetValue - totalCurrentValue - totalInvested);
            const investedPercent = targetValue > 0 ? (totalInvested / targetValue) * 100 : 0;
            const growthPercent = targetValue > 0 ? (compoundGrowth / targetValue) * 100 : 0;
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
                      <p className="mt-1 text-xl font-bold text-foreground">{formatCurrency(totalInvested)}</p>
                      <p className="mt-1 text-xs text-muted-foreground">{investedPercent.toFixed(1)}% of goal</p>
                    </div>
                    <div className="rounded-lg border border-border bg-secondary/50 p-4">
                      <div className="flex items-center gap-2 text-sm text-muted-foreground">
                        <TrendingUp className="h-4 w-4" />
                        Compound Growth
                      </div>
                      <p className="mt-1 text-xl font-bold text-primary">{formatCurrency(compoundGrowth)}</p>
                      <p className="mt-1 text-xs text-muted-foreground">{growthPercent.toFixed(1)}% of goal</p>
                    </div>
                    {totalAssetsValue > 0 && (
                      <div className="rounded-lg border border-border bg-secondary/50 p-4">
                        <div className="flex items-center gap-2 text-sm text-muted-foreground">
                          <DollarSign className="h-4 w-4" />
                          Other Assets
                        </div>
                        <p className="mt-1 text-xl font-bold text-foreground">{formatCurrency(totalAssetsValue)}</p>
                        <p className="mt-1 text-xs text-muted-foreground">
                          {assets.length} asset{assets.length !== 1 ? "s" : ""} tracked
                        </p>
                      </div>
                    )}
                    <div className="rounded-lg border border-border bg-secondary/50 p-4">
                      <div className="flex items-center gap-2 text-sm text-muted-foreground">
                        <Target className="h-4 w-4" />
                        Target Value
                      </div>
                      <p className="mt-1 text-xl font-bold text-foreground">{formatCurrency(targetValue)}</p>
                      <p className="mt-1 text-xs text-muted-foreground">100% goal</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            );
          })()}
          {/* Milestones */}
          <Card className="border-border bg-card">
            <CardHeader>
              <CardTitle className="text-base">Milestones</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {generateMilestones(targetValue).map((milestone) => {
                  const achieved = totalCurrentValue >= milestone;
                  const progress = Math.min((totalCurrentValue / milestone) * 100, 100);
                  return (
                    <div key={milestone} className="flex items-center gap-4">
                      <div
                        className={`flex h-10 w-10 items-center justify-center rounded-full ${achieved ? "bg-primary text-primary-foreground" : "bg-secondary text-muted-foreground"}`}
                      >
                        {achieved ? <CheckCircle2 className="h-5 w-5" /> : <Target className="h-5 w-5" />}
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
                  );
                })}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
        {/* ==================== TAB 2: DEBT TRACKER ==================== */}
        <TabsContent value="debts" className="space-y-6">
          {/* Manual Entry / Upload Toggle */}
          <div className="grid grid-cols-2 rounded-lg overflow-hidden border border-border">
            <button
              onClick={() => setDebtEntryMode("manual")}
              className={`flex items-center justify-center gap-2 py-3 text-sm font-semibold uppercase tracking-wider transition-colors ${debtEntryMode === "manual" ? "bg-green-500 text-black" : "bg-card text-muted-foreground hover:text-foreground"}`}
            >
              <Pencil className="h-4 w-4" /> Manual Entry
            </button>
            <button
              onClick={() => setDebtEntryMode("upload")}
              className={`flex items-center justify-center gap-2 py-3 text-sm font-semibold uppercase tracking-wider transition-colors ${debtEntryMode === "upload" ? "bg-green-500 text-black" : "bg-card text-muted-foreground hover:text-foreground"}`}
            >
              <Upload className="h-4 w-4" /> Upload Statement
            </button>
          </div>
          {/* Manual Entry Form */}
          {debtEntryMode === "manual" && (
            <Card className="border-border bg-card">
              <CardContent className="pt-6">
                <p className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground mb-4">
                  Add a Card
                </p>
                <div className="grid grid-cols-2 lg:grid-cols-5 gap-3 mb-3">
                  <div>
                    <label className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
                      Card Name
                    </label>
                    <input
                      type="text"
                      value={newDebtName}
                      onChange={(e) => setNewDebtName(e.target.value)}
                      placeholder="Chase Freedom"
                      className="mt-1 w-full rounded border border-border bg-secondary/50 px-3 py-2.5 text-sm"
                    />
                  </div>
                  <div>
                    <label className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
                      Balance ($)
                    </label>
                    <div className="mt-1 flex items-center rounded border border-border bg-secondary/50 px-3 py-2.5">
                      <span className="text-muted-foreground text-sm mr-1">$</span>
                      <input
                        type="number"
                        value={newDebtBalance}
                        onChange={(e) => setNewDebtBalance(e.target.value)}
                        placeholder="2500"
                        className="w-full bg-transparent text-sm outline-none"
                      />
                    </div>
                  </div>
                  <div>
                    <label className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
                      APR (%)
                    </label>
                    <input
                      type="number"
                      value={newDebtAPR}
                      onChange={(e) => setNewDebtAPR(e.target.value)}
                      placeholder="19.99"
                      step="0.01"
                      className="mt-1 w-full rounded border border-border bg-secondary/50 px-3 py-2.5 text-sm"
                    />
                  </div>
                  <div>
                    <label className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
                      Min Payment ($)
                    </label>
                    <div className="mt-1 flex items-center rounded border border-border bg-secondary/50 px-3 py-2.5">
                      <span className="text-muted-foreground text-sm mr-1">$</span>
                      <input
                        type="number"
                        value={newDebtMinPayment}
                        onChange={(e) => setNewDebtMinPayment(e.target.value)}
                        placeholder="75"
                        className="w-full bg-transparent text-sm outline-none"
                      />
                    </div>
                  </div>
                  <div>
                    <label className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
                      Type
                    </label>
                    <select
                      value={newDebtType}
                      onChange={(e) => setNewDebtType(e.target.value as DebtType)}
                      className="mt-1 w-full rounded border border-border bg-secondary/50 px-3 py-2.5 text-sm"
                    >
                      {DEBT_TYPE_OPTIONS.map((t) => (
                        <option key={t} value={t}>
                          {t}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>
                <button
                  onClick={handleAddDebt}
                  disabled={debts.length >= 20}
                  className="w-full rounded-lg bg-green-500 py-3 text-sm font-semibold text-black hover:bg-green-400 disabled:opacity-50 transition-colors"
                >
                  + Add Card
                </button>
              </CardContent>
            </Card>
          )}
          {/* Upload Mode */}
          {debtEntryMode === "upload" && (
            <Card className="border-border bg-card">
              <CardContent className="pt-6 space-y-4">
                <div className="grid sm:grid-cols-2 gap-4">
                  <div>
                    <label className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
                      Upload CSV (auto-imports debts)
                    </label>
                    <input
                      ref={csvInputRef}
                      type="file"
                      multiple
                      accept=".csv"
                      onChange={handleCsvUpload}
                      className="mt-2 w-full rounded border border-border bg-secondary/50 px-3 py-2 text-xs file:mr-2 file:rounded file:border-0 file:bg-green-500 file:px-3 file:py-1 file:text-xs file:font-semibold file:text-black"
                    />
                  </div>
                  <div>
                    <label className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
                      Upload PDF (stored as reference)
                    </label>
                    <input
                      ref={pdfInputRef}
                      type="file"
                      multiple
                      accept=".pdf"
                      onChange={handlePdfUpload}
                      className="mt-2 w-full rounded border border-border bg-secondary/50 px-3 py-2 text-xs file:mr-2 file:rounded file:border-0 file:bg-green-500 file:px-3 file:py-1 file:text-xs file:font-semibold file:text-black"
                    />
                  </div>
                </div>
                {uploadedFiles.length > 0 && (
                  <div className="space-y-2">
                    <p className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
                      Uploaded Files
                    </p>
                    {uploadedFiles.map((f, i) => (
                      <div
                        key={i}
                        className="flex items-center justify-between p-2.5 rounded-lg bg-secondary/30 border border-border"
                      >
                        <div className="flex items-center gap-2">
                          <FileText className="h-4 w-4 text-muted-foreground" />
                          <span className="text-sm text-foreground">{f.name}</span>
                          <span className="text-[10px] font-semibold uppercase px-2 py-0.5 rounded bg-secondary text-muted-foreground">
                            {f.type}
                          </span>
                        </div>
                        <button
                          onClick={() => handleRemoveFile(i)}
                          className="text-muted-foreground hover:text-red-500"
                        >
                          <X className="h-3.5 w-3.5" />
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          )}
          {/* Debt Table */}
          {debts.length > 0 && (
            <Card className="border-border bg-card overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-border">
                      <th className="text-left px-4 py-3 text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
                        Card
                      </th>
                      <th className="text-right px-4 py-3 text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
                        Balance
                      </th>
                      <th className="text-right px-4 py-3 text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
                        APR
                      </th>
                      <th className="text-right px-4 py-3 text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
                        Min Payment
                      </th>
                      <th className="text-right px-4 py-3 text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
                        Interest/Mo
                      </th>
                      <th className="w-10"></th>
                    </tr>
                  </thead>
                  <tbody>
                    {debts.map((debt, i) => (
                      <tr key={debt.id} className="border-b border-border/50 hover:bg-secondary/20">
                        <td className="px-4 py-3">
                          <div className="flex items-center gap-2">
                            <div
                              className="w-2.5 h-2.5 rounded-full"
                              style={{ backgroundColor: DEBT_COLORS[i % DEBT_COLORS.length] }}
                            />
                            <span className="text-sm font-medium text-foreground">{debt.name}</span>
                          </div>
                        </td>
                        <td className="px-4 py-3 text-right">
                          <span className="text-sm font-medium text-red-500">{formatPrecise(debt.balance)}</span>
                        </td>
                        <td className="px-4 py-3 text-right">
                          <span className="text-sm font-bold" style={{ color: getAPRColor(debt.apr) }}>
                            {debt.apr}
                          </span>
                          <span className="text-xs text-muted-foreground ml-0.5">%</span>
                        </td>
                        <td className="px-4 py-3 text-right">
                          <span className="text-sm text-foreground">{formatPrecise(debt.monthlyPayment)}</span>
                        </td>
                        <td className="px-4 py-3 text-right">
                          <span className="text-sm font-medium text-orange-500">
                            {formatPrecise(calculateMonthlyInterest(debt))}
                          </span>
                        </td>
                        <td className="px-2 py-3">
                          <button
                            onClick={() => handleDeleteDebt(debt.id)}
                            className="text-muted-foreground hover:text-red-500 transition-colors"
                          >
                            <X className="h-4 w-4" />
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </Card>
          )}
          {/* Summary Cards */}
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <Card className="border-border bg-card">
              <CardContent className="pt-6">
                <p className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground mb-1">
                  Total Debt
                </p>
                <p className="text-2xl font-bold text-red-500">{formatCompact(totalDebt)}</p>
                <p className="text-xs text-muted-foreground mt-1">
                  You&apos;re {formatCompact(totalDebt)} away from financial freedom
                </p>
              </CardContent>
            </Card>
            <Card className="border-border bg-card">
              <CardContent className="pt-6">
                <p className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground mb-1">Avg APR</p>
                <p className="text-2xl font-bold" style={{ color: getAPRColor(weightedAvgAPR) }}>
                  {weightedAvgAPR.toFixed(2)}%
                </p>
                <p className="text-xs text-muted-foreground mt-1">Weighted average</p>
              </CardContent>
            </Card>
            <Card className="border-border bg-card">
              <CardContent className="pt-6">
                <p className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground mb-1">
                  Monthly Interest
                </p>
                <p className="text-2xl font-bold text-orange-500">{formatPrecise(totalMonthlyInterest)}</p>
                <p className="text-xs text-muted-foreground mt-1">per month</p>
              </CardContent>
            </Card>
            <Card className="border-border bg-card">
              <CardContent className="pt-6">
                <p className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground mb-1">
                  Yearly Interest
                </p>
                <p className="text-2xl font-bold text-red-500">{formatCompact(totalAnnualInterest)}</p>
                <p className="text-xs text-muted-foreground mt-1">annual cost</p>
              </CardContent>
            </Card>
          </div>
          {/* Balance Distribution + Spending Nature */}
          {debts.length > 0 && (
            <div className="grid gap-6 lg:grid-cols-2">
              <Card className="border-border bg-card">
                <CardContent className="pt-6">
                  <p className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground mb-4">
                    Balance Distribution
                  </p>
                  <div className="flex items-center gap-6">
                    <div className="relative w-[180px] h-[180px]">
                      <ResponsiveContainer width="100%" height="100%">
                        <PieChart>
                          <Pie
                            data={debtPieData}
                            cx="50%"
                            cy="50%"
                            innerRadius={55}
                            outerRadius={80}
                            dataKey="value"
                            stroke="none"
                          >
                            {debtPieData.map((entry, i) => (
                              <Cell key={i} fill={entry.color} />
                            ))}
                          </Pie>
                        </PieChart>
                      </ResponsiveContainer>
                      <div className="absolute inset-0 flex flex-col items-center justify-center">
                        <p className="text-xs text-muted-foreground">Total Debt</p>
                        <p className="text-lg font-bold text-foreground">{formatCompact(totalDebt)}</p>
                        <p className="text-[10px] text-muted-foreground">
                          {debts.length} card{debts.length !== 1 ? "s" : ""}
                        </p>
                      </div>
                    </div>
                    <div className="flex-1 space-y-2">
                      {debts.map((d, i) => (
                        <div key={d.id} className="flex items-center gap-2">
                          <div
                            className="w-2.5 h-2.5 rounded-full"
                            style={{ backgroundColor: DEBT_COLORS[i % DEBT_COLORS.length] }}
                          />
                          <span className="text-sm text-foreground flex-1">{d.name}</span>
                          <span className="text-xs font-medium text-muted-foreground">
                            {totalDebt > 0 ? ((d.balance / totalDebt) * 100).toFixed(1) : 0}%
                          </span>
                          <span className="text-sm text-foreground">{formatCompact(d.balance)}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                </CardContent>
              </Card>
              <Card className="border-border bg-card">
                <CardContent className="pt-6">
                  <p className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground mb-4">
                    Spending Nature
                  </p>
                  <div className="space-y-3">
                    {debts.map((d, i) => (
                      <div key={d.id} className="flex items-center gap-3">
                        <div
                          className="w-2.5 h-2.5 rounded-full"
                          style={{ backgroundColor: DEBT_COLORS[i % DEBT_COLORS.length] }}
                        />
                        <span className="text-sm text-foreground flex-1">{d.name}</span>
                        <span className="text-xs px-2 py-0.5 rounded bg-secondary text-muted-foreground">{d.type}</span>
                      </div>
                    ))}
                  </div>
                  <div className="mt-6 space-y-3">
                    <div className="p-3 rounded-lg bg-secondary/30">
                      <p className="text-xs font-semibold text-foreground mb-1">📋 Primary Pattern</p>
                      <p className="text-xs text-muted-foreground">
                        Pull your last 3 statements and categorize each charge. You likely have one dominant category
                        that can be targeted.
                      </p>
                    </div>
                    <div className="p-3 rounded-lg bg-secondary/30">
                      <p className="text-xs font-semibold text-red-500 mb-1">STRATEGY TIP</p>
                      <p className="text-xs text-muted-foreground">
                        {weightedAvgAPR > 20
                          ? "High APRs detected — Avalanche will save significantly on interest."
                          : debts.length > 3
                            ? "Multiple debts — Snowball method helps build momentum with quick wins."
                            : "Avalanche is the safest default when spending patterns are unclear."}
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          )}
          {/* Payoff Strategy */}
          {debts.length > 0 && (
            <Card className="border-border bg-card">
              <CardContent className="pt-6 space-y-6">
                <p className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
                  Payoff Strategy
                </p>
                <div className="grid grid-cols-3 gap-3">
                  {[
                    {
                      key: "snowball" as const,
                      name: "Snowball",
                      icon: <Snowflake className="h-4 w-4" />,
                      desc: "Smallest balance first. Quick psychological wins.",
                    },
                    {
                      key: "avalanche" as const,
                      name: "Avalanche",
                      icon: <Flame className="h-4 w-4" />,
                      desc: "Highest APR first. Saves the most interest.",
                    },
                    {
                      key: "custom" as const,
                      name: "Custom",
                      icon: <BarChart3 className="h-4 w-4" />,
                      desc: "Set your own extra monthly payment.",
                    },
                  ].map((s) => (
                    <button
                      key={s.key}
                      onClick={() => {
                        setPayoffStrategy(s.key);
                        setShowResults(false);
                      }}
                      className={`p-4 rounded-lg border-2 text-left transition-all ${payoffStrategy === s.key ? "border-green-500 bg-green-500/5" : "border-border hover:border-border/80 bg-card"}`}
                    >
                      <div className="flex items-center gap-2 mb-1">
                        {s.icon}
                        <span
                          className={`text-sm font-bold ${payoffStrategy === s.key ? "text-green-500" : "text-foreground"}`}
                        >
                          {s.name}
                        </span>
                        {payoffStrategy === s.key && <CheckCircle2 className="h-4 w-4 text-green-500 ml-auto" />}
                      </div>
                      <p className="text-xs text-muted-foreground">{s.desc}</p>
                    </button>
                  ))}
                </div>
                {/* Slider */}
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm text-muted-foreground">Extra/mo:</span>
                    <div className="flex items-center gap-1 rounded border border-border bg-secondary/50 px-2 py-1">
                      <span className="text-sm text-muted-foreground">$</span>
                      <input
                        type="number"
                        value={extraDebtPayment}
                        onChange={(e) => {
                          setExtraDebtPayment(Number(e.target.value));
                          setShowResults(false);
                        }}
                        className="w-20 bg-transparent text-sm text-foreground outline-none text-right font-bold"
                      />
                    </div>
                  </div>
                  <input
                    type="range"
                    min="0"
                    max="2000"
                    step="25"
                    value={extraDebtPayment}
                    onChange={(e) => {
                      setExtraDebtPayment(Number(e.target.value));
                      setShowResults(false);
                    }}
                    className="w-full h-2 rounded-lg appearance-none cursor-pointer"
                    style={{
                      background: `linear-gradient(to right, #22c55e 0%, #22c55e ${(extraDebtPayment / 2000) * 100}%, #374151 ${(extraDebtPayment / 2000) * 100}%, #374151 100%)`,
                    }}
                  />
                  <div className="flex justify-between text-[10px] text-muted-foreground mt-1">
                    <span>$0</span>
                    <span>$500</span>
                    <span>$1,000</span>
                    <span>$1,500</span>
                    <span>$2,000</span>
                  </div>
                </div>
                {/* Strategy Comparison Table */}
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead>
                      <tr className="border-b border-border">
                        {["Strategy", "Extra/Mo", "Payoff Time", "Total Interest", "Total Cost", "vs Snowball"].map(
                          (h) => (
                            <th
                              key={h}
                              className="text-left px-4 py-3 text-[11px] font-semibold uppercase tracking-wider text-muted-foreground"
                            >
                              {h}
                            </th>
                          ),
                        )}
                      </tr>
                    </thead>
                    <tbody>
                      {(["snowball", "avalanche", "custom"] as const).map((s) => {
                        const r = allResults[s];
                        const sv = allResults.snowball.totalInterestPaid - r.totalInterestPaid;
                        return (
                          <tr
                            key={s}
                            className={`border-b border-border/50 ${payoffStrategy === s ? "bg-green-500/5" : "hover:bg-secondary/20"}`}
                          >
                            <td className="px-4 py-3">
                              <span
                                className={`text-sm font-semibold ${payoffStrategy === s ? "text-green-500" : "text-foreground"}`}
                              >
                                {s.charAt(0).toUpperCase() + s.slice(1)}
                              </span>
                            </td>
                            <td className="px-4 py-3 text-sm text-foreground">{formatPrecise(extraDebtPayment)}</td>
                            <td className="px-4 py-3 text-sm text-foreground">{formatMonths(r.totalMonths)}</td>
                            <td className="px-4 py-3 text-sm font-medium text-orange-500">
                              {formatPrecise(r.totalInterestPaid)}
                            </td>
                            <td className="px-4 py-3 text-sm text-foreground">{formatPrecise(r.totalCost)}</td>
                            <td className="px-4 py-3">
                              {s === "snowball" ? (
                                <span className="text-sm text-muted-foreground">&mdash;</span>
                              ) : sv > 0 ? (
                                <span className="text-sm font-medium text-green-500">save {formatPrecise(sv)}</span>
                              ) : sv < 0 ? (
                                <span className="text-sm text-red-500">+{formatPrecise(Math.abs(sv))}</span>
                              ) : (
                                <span className="text-sm text-muted-foreground">&mdash;</span>
                              )}
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
                <button
                  onClick={handleCalculatePayoff}
                  disabled={debts.length === 0}
                  className="w-full rounded-lg bg-green-500 py-3.5 text-sm font-bold text-black hover:bg-green-400 disabled:opacity-50 transition-colors"
                >
                  Calculate Payoff Plan
                </button>
              </CardContent>
            </Card>
          )}
          {/* Results */}
          {showResults && debts.length > 0 && (
            <>
              <Card className="border-2 border-green-500/30 bg-gradient-to-r from-green-500/5 to-card">
                <CardContent className="pt-6 pb-6">
                  <p className="text-[11px] font-semibold uppercase tracking-wider text-green-500 mb-2">
                    ✦ Your Action Plan
                  </p>
                  <p className="text-xl lg:text-2xl font-bold text-foreground">
                    Pay {formatPrecise(extraDebtPayment)} extra/month using{" "}
                    <span className="text-green-500">
                      {payoffStrategy.charAt(0).toUpperCase() + payoffStrategy.slice(1)}
                    </span>{" "}
                    → debt free in <span className="text-green-500">{formatMonths(currentResult.totalMonths)}</span>
                    {savingsVsSnowball > 0 && (
                      <>
                        , saving <span className="text-green-500">{formatPrecise(savingsVsSnowball)}</span> vs snowball
                      </>
                    )}
                  </p>
                  <p className="text-xs text-muted-foreground mt-2">
                    {payoffStrategy === "avalanche"
                      ? "Avalanche is the safest default when spending patterns are unclear."
                      : payoffStrategy === "snowball"
                        ? "Snowball builds momentum with quick wins."
                        : "Custom strategy balances interest savings with motivation."}
                  </p>
                </CardContent>
              </Card>
              <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
                <Card className="border-border bg-card">
                  <CardContent className="pt-6">
                    <p className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground mb-1">
                      Payoff Date
                    </p>
                    <p className="text-2xl font-bold text-green-500">{currentResult.debtFreeDate}</p>
                  </CardContent>
                </Card>
                <Card className="border-border bg-card">
                  <CardContent className="pt-6">
                    <p className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground mb-1">
                      Total Interest
                    </p>
                    <p className="text-2xl font-bold text-orange-500">
                      {formatPrecise(currentResult.totalInterestPaid)}
                    </p>
                  </CardContent>
                </Card>
                <Card className="border-border bg-card">
                  <CardContent className="pt-6">
                    <p className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground mb-1">
                      Total Cost
                    </p>
                    <p className="text-2xl font-bold text-foreground">{formatPrecise(currentResult.totalCost)}</p>
                  </CardContent>
                </Card>
                <Card className="border-border bg-card">
                  <CardContent className="pt-6">
                    <p className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground mb-1">
                      Monthly Budget
                    </p>
                    <p className="text-2xl font-bold text-foreground">{formatPrecise(currentResult.monthlyBudget)}</p>
                  </CardContent>
                </Card>
              </div>
              {/* Balance Over Time Gradient Bar */}
              {balanceGradientSegments.length > 0 && (
                <Card className="border-border bg-card">
                  <CardContent className="pt-6">
                    <p className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground mb-4">
                      Balance Over Time
                    </p>
                    <div className="flex h-10 rounded-lg overflow-hidden">
                      {balanceGradientSegments.map((seg, i) => {
                        const ratio = seg.ratio;
                        const r = Math.round(239 * ratio + 34 * (1 - ratio));
                        const g = Math.round(68 * ratio + 197 * (1 - ratio));
                        const b = Math.round(68 * ratio + 94 * (1 - ratio));
                        return (
                          <div
                            key={i}
                            className="flex-1 transition-all"
                            style={{ backgroundColor: `rgb(${r},${g},${b})` }}
                            title={`Month ${seg.month}: ${formatCurrency(seg.balance)}`}
                          />
                        );
                      })}
                    </div>
                    <div className="flex justify-between mt-2 text-xs text-muted-foreground">
                      <span>Today — {formatCompact(totalDebt)}</span>
                      <span>Debt Free 🎉</span>
                    </div>
                  </CardContent>
                </Card>
              )}
              {/* Download PDF */}
              <button
                onClick={handleDownloadReport}
                className="w-full rounded-lg border-2 border-border bg-card py-4 flex items-center justify-center gap-3 hover:bg-secondary/50 transition-colors"
              >
                <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-green-500 to-green-600 flex items-center justify-center">
                  <Download className="h-4 w-4 text-black" />
                </div>
                <div className="text-left">
                  <p className="text-sm font-bold text-foreground">Download Payoff Plan PDF</p>
                  <p className="text-xs text-muted-foreground">— WealthClaude branded</p>
                </div>
              </button>
            </>
          )}
          {/* Empty State */}
          {debts.length === 0 && (
            <Card className="border-border bg-card">
              <CardContent className="py-12 text-center">
                <CreditCard className="h-12 w-12 mx-auto mb-3 text-muted-foreground opacity-50" />
                <p className="text-sm text-muted-foreground">
                  No debts tracked yet. Add your first debt above to get started.
                </p>
              </CardContent>
            </Card>
          )}
        </TabsContent>
        {/* ==================== TAB 3: FINANCIAL OVERVIEW ==================== */}
        <TabsContent value="overview" className="space-y-6">
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
                    className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${includePortfolioInOverview ? "bg-primary" : "bg-gray-600"}`}
                  >
                    <span
                      className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${includePortfolioInOverview ? "translate-x-6" : "translate-x-1"}`}
                    />
                  </button>
                  <span
                    className={`text-sm font-medium ${includePortfolioInOverview ? "text-primary" : "text-muted-foreground"}`}
                  >
                    {includePortfolioInOverview ? "ON" : "OFF"}
                  </span>
                </div>
                <div className="flex items-center gap-2 rounded-lg border border-border bg-secondary/50 px-4 py-2">
                  <span className="text-sm text-muted-foreground">Include Dividends</span>
                  <button
                    onClick={() => setIncludeDividendsInOverview(!includeDividendsInOverview)}
                    disabled={!includePortfolioInOverview}
                    className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${includeDividendsInOverview && includePortfolioInOverview ? "bg-primary" : "bg-gray-600"} ${!includePortfolioInOverview ? "opacity-50 cursor-not-allowed" : ""}`}
                  >
                    <span
                      className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${includeDividendsInOverview && includePortfolioInOverview ? "translate-x-6" : "translate-x-1"}`}
                    />
                  </button>
                  <span
                    className={`text-sm font-medium ${includeDividendsInOverview && includePortfolioInOverview ? "text-primary" : "text-muted-foreground"}`}
                  >
                    {includeDividendsInOverview && includePortfolioInOverview ? "ON" : "OFF"}
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
          {/* Health Score */}
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
                    <circle
                      cx="100"
                      cy="100"
                      r="90"
                      stroke={healthScore >= 80 ? "#22c55e" : healthScore >= 60 ? "#eab308" : "#ef4444"}
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
                <p
                  className={`mt-4 text-lg font-semibold ${healthScore >= 80 ? "text-green-500" : healthScore >= 60 ? "text-yellow-500" : "text-red-500"}`}
                >
                  {healthScore >= 80
                    ? "Excellent"
                    : healthScore >= 60
                      ? "Good"
                      : healthScore >= 40
                        ? "Fair"
                        : "Needs Improvement"}
                </p>
              </div>
              <div className="mt-6 space-y-3">
                <div className="flex items-center justify-between p-3 rounded-lg bg-secondary/30">
                  <span className="text-sm text-foreground">Debt-to-Income Ratio</span>
                  <span
                    className={`font-medium ${debtToIncomeRatio > 35 ? "text-red-500" : debtToIncomeRatio > 20 ? "text-yellow-500" : "text-green-500"}`}
                  >
                    {debtToIncomeRatio.toFixed(1)}%
                  </span>
                </div>
                <div className="flex items-center justify-between p-3 rounded-lg bg-secondary/30">
                  <span className="text-sm text-foreground">Emergency Fund</span>
                  <span
                    className={`font-medium ${emergencyFundMonths < 3 ? "text-red-500" : emergencyFundMonths < 6 ? "text-yellow-500" : "text-green-500"}`}
                  >
                    {emergencyFundMonths.toFixed(1)} months
                  </span>
                </div>
                <div className="flex items-center justify-between p-3 rounded-lg bg-secondary/30">
                  <span className="text-sm text-foreground">Net Worth</span>
                  <span className={`font-medium ${netWorth < 0 ? "text-red-500" : "text-green-500"}`}>
                    {formatCurrency(netWorth)}
                  </span>
                </div>
                <div className="flex items-center justify-between p-3 rounded-lg bg-secondary/30">
                  <span className="text-sm text-foreground">Monthly Cash Flow</span>
                  <span className={`font-medium ${monthlyNetCashFlow < 0 ? "text-red-500" : "text-green-500"}`}>
                    {monthlyNetCashFlow >= 0 ? "+" : ""}
                    {formatCurrency(monthlyNetCashFlow)}
                  </span>
                </div>
              </div>
            </CardContent>
          </Card>
          {/* Returns vs Debt */}
          <Card className="border-border bg-card">
            <CardHeader>
              <CardTitle className="text-base">Investment Returns vs Debt Costs</CardTitle>
              <p className="text-xs text-muted-foreground">
                Compare what you&apos;re earning vs what you&apos;re paying
              </p>
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
                          <span className="text-muted-foreground">
                            Portfolio Returns ({portfolioAnnualReturn.toFixed(1)}%)
                          </span>
                          <span className="font-medium text-foreground">
                            {formatCurrency(portfolioAnnualReturnDollars)}
                          </span>
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
                  <span
                    className={`text-2xl font-bold ${portfolioAnnualReturnDollars + dividendIncome - totalAnnualInterest >= 0 ? "text-green-500" : "text-red-500"}`}
                  >
                    {portfolioAnnualReturnDollars + dividendIncome - totalAnnualInterest >= 0 ? "+" : ""}
                    {formatCurrency(portfolioAnnualReturnDollars + dividendIncome - totalAnnualInterest)}
                  </span>
                </div>
                {totalAnnualInterest > portfolioAnnualReturnDollars + dividendIncome && (
                  <p className="mt-3 text-sm text-orange-500 flex items-center gap-2">
                    <AlertTriangle className="h-4 w-4" />
                    Your debt costs more than you&apos;re earning from investments! Consider paying down high-interest
                    debt first.
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
                    <span
                      className={`font-bold ${debtToIncomeRatio > 50 ? "text-red-500" : debtToIncomeRatio > 35 ? "text-orange-500" : debtToIncomeRatio > 20 ? "text-yellow-500" : "text-green-500"}`}
                    >
                      {debtToIncomeRatio.toFixed(1)}%
                    </span>
                  </div>
                  <Progress value={Math.min(debtToIncomeRatio, 100)} className="h-2" />
                  <p className="text-xs text-muted-foreground">
                    {debtToIncomeRatio < 20
                      ? "✅ Excellent"
                      : debtToIncomeRatio < 35
                        ? "⚠️ Moderate"
                        : debtToIncomeRatio < 50
                          ? "❌ High Risk"
                          : "🚨 Danger"}
                  </p>
                </div>
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-muted-foreground">Debt-to-Asset</span>
                    <span
                      className={`font-bold ${debtToAssetRatio > 60 ? "text-red-500" : debtToAssetRatio > 30 ? "text-yellow-500" : "text-green-500"}`}
                    >
                      {debtToAssetRatio.toFixed(1)}%
                    </span>
                  </div>
                  <Progress value={Math.min(debtToAssetRatio, 100)} className="h-2" />
                  <p className="text-xs text-muted-foreground">
                    {debtToAssetRatio < 30 ? "✅ Good" : debtToAssetRatio < 60 ? "⚠️ Moderate" : "❌ High"}
                  </p>
                </div>
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-muted-foreground">Emergency Fund</span>
                    <span
                      className={`font-bold ${emergencyFundMonths < 3 ? "text-red-500" : emergencyFundMonths < 6 ? "text-yellow-500" : "text-green-500"}`}
                    >
                      {emergencyFundMonths.toFixed(1)}mo
                    </span>
                  </div>
                  <Progress value={Math.min((emergencyFundMonths / 6) * 100, 100)} className="h-2" />
                  <p className="text-xs text-muted-foreground">
                    {emergencyFundMonths >= 6 ? "✅ Safe" : emergencyFundMonths >= 3 ? "⚠️ Moderate" : "❌ Risky"}
                  </p>
                </div>
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-muted-foreground">Leverage Ratio</span>
                    <span
                      className={`font-bold ${leverageRatio > 2 ? "text-red-500" : leverageRatio > 1 ? "text-yellow-500" : "text-green-500"}`}
                    >
                      {leverageRatio.toFixed(2)}x
                    </span>
                  </div>
                  <Progress value={Math.min((leverageRatio / 3) * 100, 100)} className="h-2" />
                  <p className="text-xs text-muted-foreground">
                    {leverageRatio < 1 ? "✅ Conservative" : leverageRatio < 2 ? "⚠️ Moderate" : "❌ Aggressive"}
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
                <div>
                  <h4 className="font-semibold text-red-500 mb-3 flex items-center gap-2">
                    <TrendingDown className="h-4 w-4" />
                    LIABILITIES
                  </h4>
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
                    <p className={`text-4xl font-bold ${netWorth >= 0 ? "text-green-500" : "text-red-500"}`}>
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
          {/* Cash Flow */}
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
                      <span className={`font-bold ${monthlyNetCashFlow >= 0 ? "text-green-500" : "text-red-500"}`}>
                        {monthlyNetCashFlow >= 0 ? "+" : ""}
                        {formatCurrency(monthlyNetCashFlow)}
                      </span>
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
                      <span className={`font-bold ${netAnnualCashFlow >= 0 ? "text-green-500" : "text-red-500"}`}>
                        {netAnnualCashFlow >= 0 ? "+" : ""}
                        {formatCurrency(netAnnualCashFlow)}
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
                      You&apos;re paying{" "}
                      <span className="font-bold text-orange-500">{formatCurrency(totalAnnualInterest)}</span> per year
                      in debt interest.
                    </p>
                    <p className="text-sm text-foreground">
                      💡 If you paid off your debt and invested that money instead at {expectedReturn}% return:
                    </p>
                  </div>
                  <div className="grid gap-4 sm:grid-cols-3">
                    <div className="p-4 rounded-lg bg-secondary/50">
                      <p className="text-xs text-muted-foreground mb-1">In 10 years</p>
                      <p className="text-xl font-bold text-primary">
                        {formatCurrency(
                          totalAnnualInterest * ((Math.pow(1 + expectedReturn / 100, 10) - 1) / (expectedReturn / 100)),
                        )}
                      </p>
                    </div>
                    <div className="p-4 rounded-lg bg-secondary/50">
                      <p className="text-xs text-muted-foreground mb-1">In 20 years</p>
                      <p className="text-xl font-bold text-primary">
                        {formatCurrency(
                          totalAnnualInterest * ((Math.pow(1 + expectedReturn / 100, 20) - 1) / (expectedReturn / 100)),
                        )}
                      </p>
                    </div>
                    <div className="p-4 rounded-lg bg-secondary/50">
                      <p className="text-xs text-muted-foreground mb-1">In 30 years</p>
                      <p className="text-xl font-bold text-primary">
                        {formatCurrency(
                          totalAnnualInterest * ((Math.pow(1 + expectedReturn / 100, 30) - 1) / (expectedReturn / 100)),
                        )}
                      </p>
                    </div>
                  </div>
                  <div className="p-4 rounded-lg bg-red-500/10 border border-red-500/30">
                    <p className="text-sm font-semibold text-red-500">
                      🚨 Your high-interest debt is costing you{" "}
                      <span className="text-lg">
                        {formatCurrency(
                          totalAnnualInterest * ((Math.pow(1 + expectedReturn / 100, 30) - 1) / (expectedReturn / 100)),
                        )}
                      </span>{" "}
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
  );
}
