"use client"
// v14 FORCE COMPLETE REDEPLOYMENT - DebtTracker field stripping fix
// Must strip: id, minimumPayment ALWAYS

import { useState, useMemo, useCallback, useEffect } from "react"
import { Card, CardContent } from "@/components/ui/card"
import { Pencil, Upload, CreditCard } from "lucide-react"
import { ManualEntry } from "@/components/goals/debt/ManualEntry"
import { UploadStatement } from "@/components/goals/debt/UploadStatement"
import { DebtSummaryCards } from "@/components/goals/debt/DebtSummaryCards"
import { CreditCardDonut } from "@/components/goals/debt/CreditCardDonut"
import { AllLoansDonut } from "@/components/goals/debt/AllLoansDonut"
import { PayoffStrategy } from "@/components/goals/debt/PayoffStrategy"
import { PayoffResults } from "@/components/goals/debt/PayoffResults"
import type { Debt, PayoffStrategy as StrategyType } from "@/components/goals/types"
import { calculatePayoffPlan } from "@/components/goals/types"

interface DebtTrackerProps {
  debts: Debt[]
  setDebts: React.Dispatch<React.SetStateAction<Debt[]>>
}

export function DebtTracker({ debts, setDebts }: DebtTrackerProps) {
  const [entryMode, setEntryMode] = useState<"manual" | "upload">("manual")
  const [strategy, setStrategy] = useState<StrategyType>("avalanche")
  const [extraPayment, setExtraPayment] = useState(200)
  const [showResults, setShowResults] = useState(false)
  const [isDeleting, setIsDeleting] = useState(false)
  const [deleteShield, setDeleteShield] = useState(false)

  // ==================== AUTO-SAVE DEBTS TO SUPABASE v14 ====================
  useEffect(() => {
    if (debts.length === 0 || isDeleting) {
      return
    }
    
    const timer = setTimeout(async () => {
      try {
        // v14: STRICT field filtering - ONLY send these 5 fields, nothing else
        const debtsToSave = debts.map(debt => {
          // Create object with ONLY the fields the API expects
          return {
            type: String(debt.type),
            name: String(debt.name),
            balance: Number(debt.balance),
            apr: Number(debt.apr),
            monthlyPayment: Number(debt.monthlyPayment),
          }
        })
        
        const payload = { debts: debtsToSave }
        
        const response = await fetch('/api/user-debts', {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload),
        })
        
        if (!response.ok) {
          const text = await response.text()
          console.error('[v0] v14: Save failed:', text)
        }
      } catch (e) {
        console.error('[v0] v14: Save error:', e)
      }
    }, 1000)
    return () => clearTimeout(timer)
  }, [debts, isDeleting])

  // Calculate both strategies for comparison
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
      setDebts((prev) => [...prev, debt])
      setShowResults(false)
    },
    [setDebts]
  )

  const handleDeleteDebt = useCallback(
    (id: string) => {
      console.log('[DebtTracker] Deleting debt:', id)
      setIsDeleting(true)
      setDebts((prev) => prev.filter((d) => d.id !== id))
      
      // Call API to delete from Supabase
      fetch(`/api/user-debts?id=${id}`, { method: 'DELETE' })
        .then(res => {
          if (!res.ok) console.error('[DebtTracker] Delete API call failed')
          else console.log('[DebtTracker] Successfully deleted debt from Supabase')
        })
        .catch(e => console.error('[DebtTracker] Delete API error:', e))
        .finally(() => {
          setIsDeleting(false)
          setShowResults(false)
        })
    },
    [setDebts]
  )

  const handleApplyCards = useCallback(
    (importedDebts: Debt[]) => {
      setDebts((prev) => [...prev, ...importedDebts].slice(0, 20))
      setEntryMode("manual") // Switch to manual entry to show the table
      // Auto-calculate after applying
      setTimeout(() => setShowResults(true), 100)
    },
    [setDebts]
  )

  const handleStrategyChange = useCallback((s: StrategyType) => {
    setStrategy(s)
    setShowResults(false)
  }, [])

  const handleExtraPaymentChange = useCallback((n: number) => {
    setExtraPayment(n)
    setShowResults(false)
  }, [])

  const handleCalculate = useCallback(() => {
    if (debts.length === 0) return
    setShowResults(true)
  }, [debts])

  return (
    <div className="space-y-6">
      {/* Manual Entry / Upload Statement Toggle */}
      <div className="grid grid-cols-2 rounded-lg overflow-hidden border border-border">
        <button
          onClick={() => setEntryMode("manual")}
          className={`flex items-center justify-center gap-2 py-3 text-sm font-semibold uppercase tracking-wider transition-colors ${
            entryMode === "manual"
              ? "bg-green-500 text-black"
              : "bg-card text-muted-foreground hover:text-foreground"
          }`}
        >
          <Pencil className="h-4 w-4" /> Manual Entry
        </button>
        <button
          onClick={() => setEntryMode("upload")}
          className={`flex items-center justify-center gap-2 py-3 text-sm font-semibold uppercase tracking-wider transition-colors ${
            entryMode === "upload"
              ? "bg-green-500 text-black"
              : "bg-card text-muted-foreground hover:text-foreground"
          }`}
        >
          <Upload className="h-4 w-4" /> Upload Statement
        </button>
      </div>

      {/* Entry Mode Content */}
      {entryMode === "manual" ? (
        <ManualEntry
          debts={debts}
          onAddDebt={handleAddDebt}
          onDeleteDebt={handleDeleteDebt}
        />
      ) : (
        <UploadStatement onApplyCards={handleApplyCards} />
      )}

      {/* Summary Cards */}
      <DebtSummaryCards debts={debts} />

      {/* Donut Charts */}
      <CreditCardDonut debts={debts} />
      <AllLoansDonut debts={debts} />

      {/* Payoff Strategy */}
      <PayoffStrategy
          debts={debts}
          strategy={strategy}
          setStrategy={handleStrategyChange}
          extraPayment={extraPayment}
          setExtraPayment={handleExtraPaymentChange}
          onCalculate={handleCalculate}
          allResults={allResults}
      />

      {/* Results (only shown after Calculate is clicked) */}
      {showResults && debts.length > 0 && (
        <PayoffResults
          debts={debts}
          strategy={strategy}
          extraPayment={extraPayment}
          result={currentResult}
          allResults={allResults}
        />
      )}

    </div>
  )
}
