"use client"

import { useMemo } from "react"
import { Card, CardContent } from "@/components/ui/card"
import { CheckCircle2, Snowflake, Flame, BarChart3 } from "lucide-react"
import type { Debt, PayoffStrategy as StrategyType, PayoffResult } from "@/components/goals/types"
import {
  formatPrecise,
  formatMonthsShort,
  calculatePayoffPlan,
} from "@/components/goals/types"

interface PayoffStrategyProps {
  debts: Debt[]
  strategy: StrategyType
  setStrategy: (s: StrategyType) => void
  extraPayment: number
  setExtraPayment: (n: number) => void
  onCalculate: () => void
  allResults: Record<string, PayoffResult>
}

const STRATEGIES = [
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
]

export function PayoffStrategy({
  debts,
  strategy,
  setStrategy,
  extraPayment,
  setExtraPayment,
  onCalculate,
  allResults,
}: PayoffStrategyProps) {
  return (
    <Card className="border-border bg-card">
      <CardContent className="pt-6 space-y-6">
        <p className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
          Payoff Strategy
        </p>

        {/* Strategy Cards */}
        <div className="grid grid-cols-3 gap-3">
          {STRATEGIES.map((s) => (
            <button
              key={s.key}
              onClick={() => setStrategy(s.key)}
              className={`p-4 rounded-lg border-2 text-left transition-all ${
                strategy === s.key
                  ? "border-green-500 bg-green-500/5"
                  : "border-border hover:border-border/80 bg-card"
              }`}
            >
              <div className="flex items-center gap-2 mb-1">
                {s.icon}
                <span
                  className={`text-sm font-bold ${
                    strategy === s.key ? "text-green-500" : "text-foreground"
                  }`}
                >
                  {s.name}
                </span>
                {strategy === s.key && (
                  <CheckCircle2 className="h-4 w-4 text-green-500 ml-auto" />
                )}
              </div>
              <p className="text-xs text-muted-foreground">{s.desc}</p>
            </button>
          ))}
        </div>

        {/* Extra/mo Slider */}
        <div>
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm text-muted-foreground">Extra/mo:</span>
            <div className="flex items-center gap-1 rounded border border-border bg-secondary/50 px-2 py-1">
              <span className="text-sm text-muted-foreground">$</span>
              <input
                type="number"
                value={extraPayment}
                onChange={(e) => setExtraPayment(Number(e.target.value))}
                className="w-20 bg-transparent text-sm text-foreground outline-none text-right font-bold"
              />
            </div>
          </div>
          <input
            type="range"
            min="0"
            max="2000"
            step="25"
            value={extraPayment}
            onChange={(e) => setExtraPayment(Number(e.target.value))}
            className="w-full h-2 rounded-lg appearance-none cursor-pointer"
            style={{
              background: `linear-gradient(to right, #22c55e 0%, #22c55e ${
                (extraPayment / 2000) * 100
              }%, #374151 ${(extraPayment / 2000) * 100}%, #374151 100%)`,
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
                {[
                  "Strategy",
                  "Extra/Mo",
                  "Payoff Time",
                  "Total Interest",
                  "Total Cost",
                  "vs Snowball",
                ].map((h) => (
                  <th
                    key={h}
                    className="text-left px-4 py-3 text-[11px] font-semibold uppercase tracking-wider text-muted-foreground"
                  >
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {(["snowball", "avalanche", "custom"] as const).map((s) => {
                const r = allResults[s]
                if (!r) return null
                const sv =
                  allResults.snowball.totalInterestPaid - r.totalInterestPaid

                return (
                  <tr
                    key={s}
                    className={`border-b border-border/50 ${
                      strategy === s
                        ? "bg-green-500/5"
                        : "hover:bg-secondary/20"
                    }`}
                  >
                    <td className="px-4 py-3">
                      <span
                        className={`text-sm font-semibold ${
                          strategy === s ? "text-green-500" : "text-foreground"
                        }`}
                      >
                        {s.charAt(0).toUpperCase() + s.slice(1)}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-sm text-foreground">
                      {formatPrecise(extraPayment)}
                    </td>
                    <td className="px-4 py-3 text-sm text-foreground">
                      {formatMonthsShort(r.totalMonths)}
                    </td>
                    <td className="px-4 py-3 text-sm font-medium text-orange-500">
                      {formatPrecise(r.totalInterestPaid)}
                    </td>
                    <td className="px-4 py-3 text-sm text-foreground">
                      {formatPrecise(r.totalCost)}
                    </td>
                    <td className="px-4 py-3">
                      {s === "snowball" ? (
                        <span className="text-sm text-muted-foreground">
                          &mdash;
                        </span>
                      ) : sv > 0 ? (
                        <span className="text-sm font-medium text-green-500">
                          save {formatPrecise(sv)}
                        </span>
                      ) : sv < 0 ? (
                        <span className="text-sm text-red-500">
                          +{formatPrecise(Math.abs(sv))}
                        </span>
                      ) : (
                        <span className="text-sm text-muted-foreground">
                          &mdash;
                        </span>
                      )}
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>

        {/* Calculate Button */}
        <button
          onClick={onCalculate}
          disabled={debts.length === 0}
          className="w-full rounded-lg bg-green-500 py-3.5 text-sm font-bold text-black hover:bg-green-400 disabled:opacity-50 transition-colors"
        >
          Calculate Payoff Plan
        </button>
      </CardContent>
    </Card>
  )
}
