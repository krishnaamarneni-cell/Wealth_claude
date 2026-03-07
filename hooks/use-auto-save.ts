ix DebtTracker.tsx — Remove debtTypeToDb() calls
In handleAddDebt and handleApplyCards, remove debtTypeToDb(debt.type) and send raw debt.type:

ts
// OLD (broken):
type: debtTypeToDb(debt.type),

// NEW (correct):
type: debt.type,
2. Add isDeleting state to prevent auto-save during delete
In DebtTracker.tsx, add this state and modify your auto-save:

ts
const [isDeleting, setIsDeleting] = useState(false)

const handleDeleteDebt = useCallback(async (id: string) => {
  setIsDeleting(true)
  setDebts((prev) => prev.filter((d) => d.id !== id))
  
  await deleteJSON("/api/user-debts", id)
  setIsDeleting(false)
}, [])
3. Modify useAutoSave to skip during deletes
Update your useAutoSave hook to accept a skip flag:

ts
export function useAutoSave<T>(
  endpoint: string,
  method: "PUT" | "POST" = "PUT",
  delay: number = 500
) {
  // ... existing code ...
  
  const save = useCallback((data: T, skip?: boolean) => {
    if (skip || timerRef.current) clearTimeout(timerRef.current)
    
    if (skip) return // Skip auto-save during deletes
    
    // ... rest of existing save logic ...
  }, [])
  
  return { save, isSaving, lastSaved, error }
}
4. In DebtTracker, use the skip flag
ts
const { save: autoSave } = useAutoSave('/api/user-debts')

// Use in your component:
useEffect(() => {
  if (debts.length > 0 && !isDeleting) {
    autoSave({ debts }, false) // Don't skip
  }
}, [debts, autoSave, isDeleting])