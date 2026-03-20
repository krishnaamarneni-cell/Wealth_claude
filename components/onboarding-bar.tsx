"use client"

import { useOnboarding } from '@/lib/onboarding-context'
import { Button } from '@/components/ui/button'
import { Progress } from '@/components/ui/progress'
import { 
  ChevronRight, 
  ChevronLeft, 
  SkipForward, 
  X, 
  CheckCircle2,
  Circle,
  User,
  FileText,
  Wallet,
  DollarSign,
  BarChart3,
  Target,
  GitCompare,
  TrendingUp
} from 'lucide-react'

// Icon mapping for each step
const stepIcons: Record<string, React.ReactNode> = {
  profile: <User className="h-4 w-4" />,
  transactions: <FileText className="h-4 w-4" />,
  holdings: <Wallet className="h-4 w-4" />,
  dividends: <DollarSign className="h-4 w-4" />,
  overview: <BarChart3 className="h-4 w-4" />,
  goals: <Target className="h-4 w-4" />,
  compare: <GitCompare className="h-4 w-4" />,
  projection: <TrendingUp className="h-4 w-4" />,
}

export function OnboardingBar() {
  const {
    isOnboarding,
    currentStepIndex,
    steps,
    currentStep,
    progress,
    goToNextStep,
    goToPreviousStep,
    skipStep,
    skipAll,
  } = useOnboarding()

  if (!isOnboarding || !currentStep) return null

  return (
    <div className="fixed bottom-0 left-0 right-0 z-50 bg-background border-t shadow-lg">
      {/* Progress bar at top */}
      <div className="h-1 bg-muted">
        <div 
          className="h-full bg-primary transition-all duration-300"
          style={{ width: `${((currentStepIndex + 1) / steps.length) * 100}%` }}
        />
      </div>

      <div className="container mx-auto px-4 py-4">
        <div className="flex items-center justify-between gap-4">
          {/* Step indicator dots */}
          <div className="hidden md:flex items-center gap-2">
            {steps.map((step, index) => (
              <div
                key={step.id}
                className={`flex items-center justify-center w-8 h-8 rounded-full transition-colors ${
                  index < currentStepIndex
                    ? 'bg-primary text-primary-foreground'
                    : index === currentStepIndex
                    ? 'bg-primary text-primary-foreground ring-2 ring-primary ring-offset-2'
                    : 'bg-muted text-muted-foreground'
                }`}
                title={step.title}
              >
                {index < currentStepIndex ? (
                  <CheckCircle2 className="h-4 w-4" />
                ) : (
                  stepIcons[step.id] || <Circle className="h-4 w-4" />
                )}
              </div>
            ))}
          </div>

          {/* Current step info */}
          <div className="flex-1 text-center md:text-left">
            <div className="flex items-center justify-center md:justify-start gap-2 mb-1">
              <span className="text-xs text-muted-foreground">
                Step {currentStepIndex + 1} of {steps.length}
              </span>
              <span className="text-xs text-muted-foreground">•</span>
              <span className="text-xs text-primary font-medium">
                {progress}% complete
              </span>
            </div>
            <h3 className="font-semibold text-sm md:text-base">{currentStep.title}</h3>
            <p className="text-xs text-muted-foreground hidden sm:block">
              {currentStep.description}
            </p>
          </div>

          {/* Action buttons */}
          <div className="flex items-center gap-2">
            {/* Previous button */}
            {currentStepIndex > 0 && (
              <Button
                variant="ghost"
                size="sm"
                onClick={goToPreviousStep}
                className="hidden sm:flex"
              >
                <ChevronLeft className="h-4 w-4 mr-1" />
                Back
              </Button>
            )}

            {/* Skip button */}
            <Button
              variant="ghost"
              size="sm"
              onClick={skipStep}
            >
              <SkipForward className="h-4 w-4 mr-1" />
              Skip
            </Button>

            {/* Next/Complete button */}
            <Button
              size="sm"
              onClick={goToNextStep}
            >
              {currentStepIndex === steps.length - 1 ? (
                <>
                  <CheckCircle2 className="h-4 w-4 mr-1" />
                  Finish
                </>
              ) : (
                <>
                  Next
                  <ChevronRight className="h-4 w-4 ml-1" />
                </>
              )}
            </Button>

            {/* Skip all button */}
            <Button
              variant="ghost"
              size="icon"
              onClick={skipAll}
              className="text-muted-foreground hover:text-foreground"
              title="Skip onboarding"
            >
              <X className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </div>
    </div>
  )
}
