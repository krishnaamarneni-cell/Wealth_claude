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

  return { debts, loading, error }
}
