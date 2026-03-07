"use client"

import { useState } from "react"
import { Card, CardContent } from "@/components/ui/card"
import { X } from "lucide-react"
import {
  type Debt,
  type DebtType,
  DEBT_TYPE_OPTIONS,
  DEBT_COLORS,
  formatPrecise,
  getAPRColor,
  calculateMonthlyInterest,
} from "@/components/goals/types"

interface ManualEntryProps {
  debts: Debt[]
  onAddDebt: (debt: Debt) => void
  onDeleteDebt: (id: string) => void
}

export function ManualEntry({ debts, onAddDebt, onDeleteDebt }: ManualEntryProps) {
  const [name, setName] = useState("")
  const [type, setType] = useState<DebtType>("Credit Card")
  const [balance, setBalance] = useState("")
  const [apr, setAPR] = useState("")
  const [minPayment, setMinPayment] = useState("")

  const handleAdd = () => {
    const bal = parseFloat(balance)
    const aprVal = parseFloat(apr)
    const minPay = parseFloat(minPayment)

    if (!name || isNaN(bal) || bal <= 0 || isNaN(aprVal) || aprVal < 0 || isNaN(minPay) || minPay <= 0) {
      alert("Fill all fields: Name, Balance, APR, Min Payment")
      return
    }

    onAddDebt({
      id: Date.now().toString(),
      name,
      type,
      balance: bal,
      apr: aprVal,
      monthlyPayment: minPay,
      minimumPayment: minPay,
    })

    setName("")
    setType("Credit Card")
    setBalance("")
    setAPR("")
    setMinPayment("")
  }

  return (
    <div className="space-y-6">
      {/* Add Card Form */}
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
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Chase Freedom"
                className="mt-1 w-full rounded border border-border bg-secondary/50 px-3 py-2.5 text-sm text-foreground placeholder:text-muted-foreground"
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
                  value={balance}
                  onChange={(e) => setBalance(e.target.value)}
                  placeholder="2500"
                  className="w-full bg-transparent text-sm text-foreground outline-none placeholder:text-muted-foreground"
                />
              </div>
            </div>
            <div>
              <label className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
                APR (%)
              </label>
              <input
                type="number"
                value={apr}
                onChange={(e) => setAPR(e.target.value)}
                placeholder="19.99"
                step="0.01"
                className="mt-1 w-full rounded border border-border bg-secondary/50 px-3 py-2.5 text-sm text-foreground placeholder:text-muted-foreground"
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
                  value={minPayment}
                  onChange={(e) => setMinPayment(e.target.value)}
                  placeholder="75"
                  className="w-full bg-transparent text-sm text-foreground outline-none placeholder:text-muted-foreground"
                />
              </div>
            </div>
            <div>
              <label className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
                Type
              </label>
              <select
                value={type}
                onChange={(e) => setType(e.target.value as DebtType)}
                className="mt-1 w-full rounded border border-border bg-secondary/50 px-3 py-2.5 text-sm text-foreground"
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
            onClick={handleAdd}
            disabled={debts.length >= 20}
            className="w-full rounded-lg bg-green-500 py-3 text-sm font-semibold text-black hover:bg-green-400 disabled:opacity-50 transition-colors"
          >
            + Add Card
          </button>
        </CardContent>
      </Card>

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
                  <tr
                    key={debt.id}
                    className="border-b border-border/50 hover:bg-secondary/20"
                  >
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2">
                        <div
                          className="w-2.5 h-2.5 rounded-full flex-shrink-0"
                          style={{
                            backgroundColor: DEBT_COLORS[i % DEBT_COLORS.length],
                          }}
                        />
                        <span className="text-sm font-medium text-foreground">
                          {debt.name}
                        </span>
                      </div>
                    </td>
                    <td className="px-4 py-3 text-right">
                      <span className="text-sm font-medium text-red-500">
                        {formatPrecise(debt.balance)}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-right">
                      <span
                        className="text-sm font-bold"
                        style={{ color: getAPRColor(debt.apr) }}
                      >
                        {debt.apr}
                      </span>
                      <span className="text-xs text-muted-foreground ml-0.5">
                        %
                      </span>
                    </td>
                    <td className="px-4 py-3 text-right">
                      <span className="text-sm text-foreground">
                        {formatPrecise(debt.monthlyPayment)}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-right">
                      <span className="text-sm font-medium text-orange-500">
                        {formatPrecise(calculateMonthlyInterest(debt))}
                      </span>
                    </td>
                    <td className="px-2 py-3">
                      <button
                        onClick={() => {
                          onDeleteDebt(debt.id)
                          // Call API to delete from Supabase
                          fetch(`/api/user-debts?id=${debt.id}`, { method: 'DELETE' })
                            .then(res => {
                              if (!res.ok) console.error('[DebtTracker] Delete failed')
                              else console.log('[DebtTracker] Successfully deleted debt from Supabase')
                            })
                            .catch(e => console.error('[DebtTracker] Delete error:', e))
                        }}
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
    </div>
  )
}
