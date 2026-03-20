"use client"

import { useEffect, useState } from 'react'
import { useOnboarding } from '@/lib/onboarding-context'
import { Badge } from '@/components/ui/badge'
import { Sparkles } from 'lucide-react'

interface OnboardingSpotlightProps {
  stepId: string
  children: React.ReactNode
  position?: 'top' | 'bottom' | 'left' | 'right'
}

export function OnboardingSpotlight({ 
  stepId, 
  children, 
  position = 'bottom' 
}: OnboardingSpotlightProps) {
  const { isOnboarding, currentStep } = useOnboarding()
  const [showPulse, setShowPulse] = useState(false)

  const isActive = isOnboarding && currentStep?.id === stepId

  useEffect(() => {
    if (isActive) {
      // Delay pulse animation for smoother UX
      const timer = setTimeout(() => setShowPulse(true), 300)
      return () => clearTimeout(timer)
    }
    setShowPulse(false)
  }, [isActive])

  if (!isActive) {
    return <>{children}</>
  }

  const positionClasses = {
    top: 'bottom-full mb-2',
    bottom: 'top-full mt-2',
    left: 'right-full mr-2',
    right: 'left-full ml-2',
  }

  return (
    <div className="relative inline-block">
      {/* Spotlight ring */}
      <div className={`
        absolute -inset-2 rounded-lg 
        ${showPulse ? 'animate-pulse' : ''} 
        bg-primary/20 ring-2 ring-primary ring-offset-2 ring-offset-background
        pointer-events-none
      `} />
      
      {/* Arrow and tooltip */}
      <div className={`
        absolute ${positionClasses[position]} left-1/2 -translate-x-1/2
        z-50 pointer-events-none
      `}>
        <Badge className="bg-primary text-primary-foreground whitespace-nowrap flex items-center gap-1 shadow-lg">
          <Sparkles className="h-3 w-3" />
          Click here!
        </Badge>
      </div>

      {/* Content */}
      <div className="relative z-10">
        {children}
      </div>
    </div>
  )
}

// =============================================
// TAB HIGHLIGHTER - For highlighting specific tabs
// =============================================
interface OnboardingTabProps {
  stepId: string
  isSelected: boolean
  onClick: () => void
  children: React.ReactNode
  className?: string
}

export function OnboardingTab({ 
  stepId, 
  isSelected, 
  onClick, 
  children,
  className = ''
}: OnboardingTabProps) {
  const { isOnboarding, currentStep, completeStep } = useOnboarding()
  const isHighlighted = isOnboarding && currentStep?.id === stepId

  const handleClick = () => {
    if (isHighlighted) {
      completeStep(stepId)
    }
    onClick()
  }

  return (
    <button
      onClick={handleClick}
      className={`
        relative px-4 py-2 rounded-lg transition-all
        ${isSelected 
          ? 'bg-primary text-primary-foreground' 
          : 'bg-muted text-muted-foreground hover:text-foreground'
        }
        ${isHighlighted ? 'ring-2 ring-primary ring-offset-2 animate-pulse' : ''}
        ${className}
      `}
    >
      {children}
      
      {/* Spotlight indicator */}
      {isHighlighted && !isSelected && (
        <span className="absolute -top-1 -right-1 flex h-3 w-3">
          <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-primary opacity-75" />
          <span className="relative inline-flex rounded-full h-3 w-3 bg-primary" />
        </span>
      )}
    </button>
  )
}

// =============================================
// STEP INDICATOR - For showing which step user is on
// =============================================
export function OnboardingStepIndicator() {
  const { isOnboarding, currentStep, currentStepIndex, steps } = useOnboarding()

  if (!isOnboarding || !currentStep) return null

  return (
    <div className="fixed top-4 left-1/2 -translate-x-1/2 z-50">
      <Badge variant="secondary" className="shadow-lg px-4 py-2">
        <Sparkles className="h-4 w-4 mr-2 text-primary" />
        <span className="font-medium">{currentStep.title}</span>
        <span className="text-muted-foreground ml-2">
          ({currentStepIndex + 1}/{steps.length})
        </span>
      </Badge>
    </div>
  )
}
