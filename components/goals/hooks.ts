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
// DB CHECK constraint accepts Title Case values directly:
// 'Credit Card', 'Car Loan', 'Housing Loan', 'Personal Loan',
// 'Auto Loan', 'Mortgage', 'Student Loan', 'Other'
// Pass type as-is — no conversion needed.

export function debtTypeToDb(displayType: string): string {
  return displayType || "Other"
}

export function dbToDebtType(dbType: string): string {
  return dbType || "Other"
}
