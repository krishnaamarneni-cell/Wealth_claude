'use client'

import { useState, useEffect } from 'react'
import { getSupabaseClient } from '@/lib/supabase-client'

export interface Debt {
  id: string
  userId: string
  name: string
  principal: number
  currentBalance: number
  interestRate: number
  minimumPayment: number
  dueDate: string
  type: 'credit_card' | 'personal_loan' | 'student_loan' | 'mortgage' | 'auto_loan' | 'other'
  status: 'active' | 'paid_off' | 'closed'
  createdAt: string
  updatedAt: string
}

export function useDebtData() {
  const supabase = getSupabaseClient()
  const [debts, setDebts] = useState<Debt[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const fetchDebts = async () => {
      try {
        setLoading(true)
        const { data, error } = await supabase
          .from('debts')
          .select('*')
          .order('createdAt', { ascending: false })

        if (error) {
          setError(error.message)
        } else {
          setDebts(data || [])
        }
      } catch (err) {
        setError(err instanceof Error ? err.message : 'An error occurred')
      } finally {
        setLoading(false)
      }
    }

    fetchDebts()
  }, [])

  const addDebt = async (newDebt: Omit<Debt, 'id' | 'createdAt' | 'updatedAt'>): Promise<boolean> => {
    try {
      const { error } = await supabase
        .from('debts')
        .insert([newDebt])

      if (error) {
        setError(error.message)
        return false
      }

      // Refetch debts after adding
      const { data } = await supabase
        .from('debts')
        .select('*')
        .order('createdAt', { ascending: false })

      if (data) {
        setDebts(data)
      }

      return true
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'An error occurred'
      setError(errorMessage)
      return false
    }
  }

  return { debts, loading, error, addDebt }
}
