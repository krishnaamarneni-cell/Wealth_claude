"use client"
// FORCE REBUILD: DebtTracker field stripping - strips id, minimumPayment, never sends them

import { useState, useMemo, useCallback, useEffect } from "react"
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { ManualEntry } from "./debt/ManualEntry"
import { PaymentPlan } from "./debt/PaymentPlan"
import { calculatePayoffPlan } from "./utils/debtCalculations"
import type { Debt, StrategyType } from "./types"

interface DebtTrackerProps {
  debts: Debt[]
  setDebts: (debts: Debt[]) => void
}

export function DebtTracker({ debts, setDebts }: DebtTrackerProps) {
  const [entryMode, setEntryMode] = useState<"manual" | "upload">("manual")
  const [strategy, setStrategy] = useState<StrategyType>("avalanche")
  const [extraPayment, setExtraPayment] = useState(200)
  const [showResults, setShowResults] = useState(false)
  const [isDeleting, setIsDeleting] = useState(false)
  const [deleteShield, setDeleteShield] = useState(false)

  useEffect(() => {
    if (debts.length === 0 || isDeleting) return
    const debounce = setTimeout(() => {
      const data = debts.map(d => ({ type: d.type, name: d.name, balance: d.balance, apr: d.apr, monthlyPayment: d.monthlyPayment }))
      const payload = { debts: data }
      console.log('[DebtTracker] v17 Sending payload:', JSON.stringify(payload, null, 2))
      fetch('/api/user-debts', { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload) })
        .then(r => r.json().then(j => console.log('[DebtTracker] Response:', j)))
        .catch(e => console.error('Save error:', e))
    }, 1000)
    return () => clearTimeout(debounce)
  }, [debts, isDeleting])

  const allResults = useMemo(
    () => ({
      avalanche: calculatePayoffPlan(debts, "avalanche", extraPayment),
      snowball: calculatePayoffPlan(debts, "snowball", extraPayment),
    }),
    [debts, extraPayment]
  )

  const currentResult = allResults[strategy]

  const handleAddDebt = useCallback(
    (debt: Debt) => {
      setDebts([...debts, debt])
      setShowResults(false)
    },
    [debts, setDebts]
  )

  const handleDeleteDebt = useCallback(
    (id: string) => {
      setIsDeleting(true)
      setDebts(debts.filter(d => d.id !== id))
      
      fetch(`/api/user-debts?id=${id}`, { method: 'DELETE' })
        .catch(e => console.error('[DebtTracker] Delete error:', e))
        .finally(() => {
          setIsDeleting(false)
          setShowResults(false)
        })
    },
    [debts, setDebts]
  )

  return (
    <div className="space-y-6">
      <Card className="p-6">
        <h2 className="text-2xl font-bold mb-6">Debt Tracker</h2>
        
        <Tabs value={entryMode} onValueChange={(v) => setEntryMode(v as "manual" | "upload")} className="mb-6">
          <TabsList>
            <TabsTrigger value="manual">Manual Entry</TabsTrigger>
            <TabsTrigger value="upload">Upload CSV</TabsTrigger>
          </TabsList>
          
          <TabsContent value="manual">
            <ManualEntry debts={debts} onAddDebt={handleAddDebt} onDeleteDebt={handleDeleteDebt} />
          </TabsContent>
        </Tabs>

        {debts.length > 0 && (
          <div className="mt-6 space-y-4">
            <div className="space-y-3">
              <label className="block text-sm font-medium">Extra Monthly Payment: ${extraPayment}</label>
              <input
                type="range"
                min="0"
                max="1000"
                step="50"
                value={extraPayment}
                onChange={(e) => setExtraPayment(Number(e.target.value))}
                className="w-full"
              />
            </div>

            <div className="space-y-3">
              <label className="block text-sm font-medium">Payoff Strategy:</label>
              <div className="flex gap-4">
                <Button
                  variant={strategy === "avalanche" ? "default" : "outline"}
                  onClick={() => setStrategy("avalanche")}
                >
                  Avalanche
                </Button>
                <Button
                  variant={strategy === "snowball" ? "default" : "outline"}
                  onClick={() => setStrategy("snowball")}
                >
                  Snowball
                </Button>
              </div>
            </div>

            <Button onClick={() => setShowResults(!showResults)} className="w-full">
              {showResults ? "Hide Results" : "Calculate Results"}
            </Button>

            {showResults && currentResult && (
              <PaymentPlan result={currentResult} strategy={strategy} />
            )}
          </div>
        )}
      </Card>
    </div>
  )
}
