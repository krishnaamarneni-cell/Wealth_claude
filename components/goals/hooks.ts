"use client"

import { useCallback, useRef, useEffect, useState } from "react"

// ==================== DEBOUNCED AUTO-SAVE HOOK ====================

export function useAutoSave<T>(
  endpoint: string,
  method: "PUT" | "POST" = "PUT",
  delay: number = 500
) {
  const timerRef = useRef<NodeJS.Timeout | null>(null)
  const [isSaving, setIsSaving] = useState(false)
  const [lastSaved, setLastSaved] = useState<Date | null>(null)
  const [error, setError] = useState<string | null>(null)

  const save = useCallback(
    (data: T) => {
      if (timerRef.current) clearTimeout(timerRef.current)

      timerRef.current = setTimeout(async () => {
        setIsSaving(true)
        setError(null)
        try {
          const res = await fetch(endpoint, {
            method,
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(data),
          })
          if (!res.ok) {
            const err = await res.json().catch(() => ({}))
            throw new Error(err.error || `Failed to save (${res.status})`)
          }
          setLastSaved(new Date())
        } catch (e: any) {
          console.error(`[auto-save] ${endpoint}:`, e)
          setError(e.message || "Failed to save")
        } finally {
          setIsSaving(false)
        }
      }, delay)
    },
    [endpoint, method, delay]
  )

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (timerRef.current) clearTimeout(timerRef.current)
    }
  }, [])

  return { save, isSaving, lastSaved, error }
}

// ==================== API FETCH HELPERS ====================

export async function fetchJSON<T>(endpoint: string): Promise<T | null> {
  try {
    const res = await fetch(endpoint)
    if (!res.ok) return null
    return await res.json()
  } catch (e) {
    console.error(`[fetch] ${endpoint}:`, e)
    return null
  }
}

export async function postJSON<T>(
  endpoint: string,
  data: Record<string, any>
): Promise<T | null> {
  try {
    const res = await fetch(endpoint, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    })
    if (!res.ok) return null
    return await res.json()
  } catch (e) {
    console.error(`[post] ${endpoint}:`, e)
    return null
  }
}

export async function deleteJSON(
  endpoint: string,
  id: string
): Promise<boolean> {
  try {
    const res = await fetch(`${endpoint}?id=${id}`, { method: "DELETE" })
    return res.ok
  } catch (e) {
    console.error(`[delete] ${endpoint}:`, e)
    return false
  }
}

// ==================== DEBT TYPE MAPPER ====================
// DB uses snake_case: credit_card, auto_loan, etc.
// Frontend uses display format: "Credit Card", "Auto Loan", etc.

const TYPE_TO_DB: Record<string, string> = {
  "Credit Card": "credit_card",
  "Auto Loan": "auto_loan",
  Mortgage: "mortgage",
  "Student Loan": "student_loan",
  "Personal Loan": "personal_loan",
  Other: "other",
}

const DB_TO_TYPE: Record<string, string> = {
  credit_card: "Credit Card",
  auto_loan: "Auto Loan",
  mortgage: "Mortgage",
  student_loan: "Student Loan",
  personal_loan: "Personal Loan",
  other: "Other",
}

export function debtTypeToDb(displayType: string): string {
  return TYPE_TO_DB[displayType] || "other"
}

export function dbToDebtType(dbType: string): string {
  return DB_TO_TYPE[dbType] || "Other"
}
