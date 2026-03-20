"use client"

import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react'
import { useRouter, usePathname } from 'next/navigation'

// =============================================
// ONBOARDING STEPS CONFIGURATION
// =============================================
export interface OnboardingStep {
  id: string
  title: string
  description: string
  path: string
  tab?: string  // Optional tab to highlight
  isComplete: boolean
}

const DEFAULT_STEPS: OnboardingStep[] = [
  {
    id: 'profile',
    title: 'Complete Your Profile',
    description: 'Add your name, username, and preferences',
    path: '/profile',
    isComplete: false,
  },
  {
    id: 'transactions',
    title: 'Import Transactions',
    description: 'Upload your transaction history from your broker',
    path: '/transactions',
    isComplete: false,
  },
  {
    id: 'holdings',
    title: 'View Your Holdings',
    description: 'See your portfolio holdings and dividends',
    path: '/holdings',
    tab: 'holdings',
    isComplete: false,
  },
  {
    id: 'dividends',
    title: 'Track Dividends',
    description: 'Monitor your dividend income',
    path: '/holdings',
    tab: 'dividends',
    isComplete: false,
  },
  {
    id: 'overview',
    title: 'Market Overview',
    description: 'Track money flow across major asset classes',
    path: '/overview',
    tab: 'market',
    isComplete: false,
  },
  {
    id: 'goals',
    title: 'Set Your Goals',
    description: 'Define your financial goals and track progress',
    path: '/goals',
    isComplete: false,
  },
  {
    id: 'compare',
    title: 'Compare Stocks',
    description: 'Compare up to 10 stocks on a chart',
    path: '/compare',
    tab: 'compare',
    isComplete: false,
  },
  {
    id: 'projection',
    title: 'View Projections',
    description: 'See future projections for your investments',
    path: '/compare',
    tab: 'projection',
    isComplete: false,
  },
]

const ONBOARDING_STORAGE_KEY = 'wealthclaude_onboarding'

// =============================================
// CONTEXT TYPE
// =============================================
interface OnboardingContextType {
  // State
  isOnboarding: boolean
  currentStepIndex: number
  steps: OnboardingStep[]
  currentStep: OnboardingStep | null
  progress: number
  
  // Actions
  startOnboarding: () => void
  completeStep: (stepId: string) => void
  goToNextStep: () => void
  goToPreviousStep: () => void
  skipStep: () => void
  skipAll: () => void
  resetOnboarding: () => void
  
  // Helpers
  isStepActive: (stepId: string) => boolean
  getStepByPath: (path: string) => OnboardingStep | undefined
}

const OnboardingContext = createContext<OnboardingContextType | undefined>(undefined)

// =============================================
// PROVIDER
// =============================================
interface OnboardingProviderProps {
  children: ReactNode
}

export function OnboardingProvider({ children }: OnboardingProviderProps) {
  const router = useRouter()
  const pathname = usePathname()
  
  const [isOnboarding, setIsOnboarding] = useState(false)
  const [currentStepIndex, setCurrentStepIndex] = useState(0)
  const [steps, setSteps] = useState<OnboardingStep[]>(DEFAULT_STEPS)

  // Load saved state on mount
  useEffect(() => {
    const saved = localStorage.getItem(ONBOARDING_STORAGE_KEY)
    if (saved) {
      try {
        const data = JSON.parse(saved)
        setIsOnboarding(data.isOnboarding ?? false)
        setCurrentStepIndex(data.currentStepIndex ?? 0)
        if (data.steps) {
          setSteps(data.steps)
        }
      } catch (e) {
        console.error('Failed to load onboarding state:', e)
      }
    }
  }, [])

  // Save state when it changes
  useEffect(() => {
    if (typeof window !== 'undefined') {
      localStorage.setItem(ONBOARDING_STORAGE_KEY, JSON.stringify({
        isOnboarding,
        currentStepIndex,
        steps,
      }))
    }
  }, [isOnboarding, currentStepIndex, steps])

  // Calculate progress
  const completedCount = steps.filter(s => s.isComplete).length
  const progress = Math.round((completedCount / steps.length) * 100)

  // Current step
  const currentStep = isOnboarding ? steps[currentStepIndex] : null

  // Start onboarding
  const startOnboarding = () => {
    setIsOnboarding(true)
    setCurrentStepIndex(0)
    setSteps(DEFAULT_STEPS)
    router.push(DEFAULT_STEPS[0].path)
  }

  // Complete a step
  const completeStep = (stepId: string) => {
    setSteps(prev => prev.map(step => 
      step.id === stepId ? { ...step, isComplete: true } : step
    ))
  }

  // Go to next step
  const goToNextStep = () => {
    // Mark current step as complete
    if (currentStep) {
      completeStep(currentStep.id)
    }

    if (currentStepIndex < steps.length - 1) {
      const nextIndex = currentStepIndex + 1
      setCurrentStepIndex(nextIndex)
      router.push(steps[nextIndex].path)
    } else {
      // Finished onboarding
      setIsOnboarding(false)
      router.push('/overview') // Go to main dashboard
    }
  }

  // Go to previous step
  const goToPreviousStep = () => {
    if (currentStepIndex > 0) {
      const prevIndex = currentStepIndex - 1
      setCurrentStepIndex(prevIndex)
      router.push(steps[prevIndex].path)
    }
  }

  // Skip current step (don't mark as complete)
  const skipStep = () => {
    if (currentStepIndex < steps.length - 1) {
      const nextIndex = currentStepIndex + 1
      setCurrentStepIndex(nextIndex)
      router.push(steps[nextIndex].path)
    } else {
      // Finished onboarding
      setIsOnboarding(false)
      router.push('/overview')
    }
  }

  // Skip all remaining steps
  const skipAll = () => {
    setIsOnboarding(false)
    router.push('/overview')
  }

  // Reset onboarding
  const resetOnboarding = () => {
    setIsOnboarding(false)
    setCurrentStepIndex(0)
    setSteps(DEFAULT_STEPS)
    localStorage.removeItem(ONBOARDING_STORAGE_KEY)
  }

  // Check if a step is active
  const isStepActive = (stepId: string) => {
    return currentStep?.id === stepId
  }

  // Get step by path
  const getStepByPath = (path: string) => {
    return steps.find(s => s.path === path)
  }

  return (
    <OnboardingContext.Provider value={{
      isOnboarding,
      currentStepIndex,
      steps,
      currentStep,
      progress,
      startOnboarding,
      completeStep,
      goToNextStep,
      goToPreviousStep,
      skipStep,
      skipAll,
      resetOnboarding,
      isStepActive,
      getStepByPath,
    }}>
      {children}
    </OnboardingContext.Provider>
  )
}

// =============================================
// HOOK
// =============================================
export function useOnboarding() {
  const context = useContext(OnboardingContext)
  if (!context) {
    throw new Error('useOnboarding must be used within an OnboardingProvider')
  }
  return context
}
