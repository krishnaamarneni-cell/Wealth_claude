import { useState, useEffect } from 'react'
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs'

export interface Debt {
  id: string
  user_id?: string
  name: string
  type: 'Credit Card' | 'Car Loan' | 'Housing Loan' | 'Personal Loan'
  balance: number
  apr: number
  min_payment: number
  created_at?: string
}

export interface CsvFile {
  id: string
  user_id?: string
  debt_id: string
  filename: string
  storage_path: string
  parsed_data: any[]
  created_at?: string
}

export function useDebtData() {
  const supabase = createClientComponentClient()
  const [debts, setDebts] = useState<Debt[]>([])
  const [csvFiles, setCsvFiles] = useState<CsvFile[]>([])
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [userId, setUserId] = useState<string | null>(null)

  useEffect(() => {
    const init = async () => {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) { setLoading(false); return }
      setUserId(user.id)
      await loadData(user.id)
    }
    init()
  }, [])

  const loadData = async (uid: string) => {
    setLoading(true)
    try {
      const [{ data: debtsData }, { data: filesData }] = await Promise.all([
        supabase.from('user_debts').select('*').eq('user_id', uid).order('created_at', { ascending: true }),
        supabase.from('user_csv_files').select('*').eq('user_id', uid).order('created_at', { ascending: true }),
      ])
      if (debtsData) setDebts(debtsData)
      if (filesData) setCsvFiles(filesData)
    } finally {
      setLoading(false)
    }
  }

  const addDebt = async (debt: Omit<Debt, 'id' | 'user_id' | 'created_at'>) => {
    if (!userId) return null
    setSaving(true)
    try {
      const { data, error } = await supabase
        .from('user_debts')
        .insert({ ...debt, user_id: userId })
        .select()
        .single()
      if (error) throw error
      setDebts(prev => [...prev, data])
      return data
    } finally {
      setSaving(false)
    }
  }

  const deleteDebt = async (id: string) => {
    if (!userId) return
    // Delete associated files from storage
    const relatedFiles = csvFiles.filter(f => f.debt_id === id)
    for (const file of relatedFiles) {
      await supabase.storage.from('financial_files').remove([file.storage_path])
    }
    await supabase.from('user_csv_files').delete().eq('debt_id', id)
    await supabase.from('user_debts').delete().eq('id', id).eq('user_id', userId)
    setDebts(prev => prev.filter(d => d.id !== id))
    setCsvFiles(prev => prev.filter(f => f.debt_id !== id))
  }

  const uploadCsvFile = async (file: File, debtId: string) => {
    if (!userId) return null
    setSaving(true)
    try {
      // Parse file
      const text = await file.text()
      const parsedData = parseCSV(text)

      // Upload to Supabase Storage
      const storagePath = `${userId}/${debtId}/${Date.now()}_${file.name}`
      const { error: uploadError } = await supabase.storage
        .from('financial_files')
        .upload(storagePath, file)
      if (uploadError) throw uploadError

      // Save file record
      const { data, error } = await supabase
        .from('user_csv_files')
        .insert({
          user_id: userId,
          debt_id: debtId,
          filename: file.name,
          storage_path: storagePath,
          parsed_data: parsedData,
        })
        .select()
        .single()
      if (error) throw error
      setCsvFiles(prev => [...prev, data])
      return data
    } finally {
      setSaving(false)
    }
  }

  const deleteCsvFile = async (fileId: string, storagePath: string) => {
    if (!userId) return
    await supabase.storage.from('financial_files').remove([storagePath])
    await supabase.from('user_csv_files').delete().eq('id', fileId)
    setCsvFiles(prev => prev.filter(f => f.id !== fileId))
  }

  return { debts, csvFiles, loading, saving, addDebt, deleteDebt, uploadCsvFile, deleteCsvFile }
}

// CSV Parser - supports Chase, Amex, Citi formats
function parseCSV(text: string): any[] {
  const lines = text.split('\n').filter(l => l.trim())
  if (lines.length < 2) return []

  const headers = lines[0].toLowerCase().split(',').map(h => h.trim().replace(/"/g, ''))

  // Detect format by headers
  const dateIdx = headers.findIndex(h => h.includes('date') || h.includes('trans'))
  const descIdx = headers.findIndex(h => h.includes('desc') || h.includes('merchant') || h.includes('payee'))
  const amountIdx = headers.findIndex(h => h.includes('amount') || h.includes('debit') || h.includes('charge'))
  const categoryIdx = headers.findIndex(h => h.includes('categ') || h.includes('type'))

  return lines.slice(1).map(line => {
    const cols = line.split(',').map(c => c.trim().replace(/"/g, ''))
    const rawAmount = parseFloat(cols[amountIdx]?.replace(/[$,]/g, '') || '0')
    return {
      date: cols[dateIdx] || '',
      description: cols[descIdx] || cols[1] || '',
      amount: Math.abs(rawAmount),
      category: cols[categoryIdx] || 'Uncategorized',
      isCharge: rawAmount > 0,
    }
  }).filter(r => r.amount > 0 && r.date)
}
