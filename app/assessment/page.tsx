// =============================================================================
// Assessment Page - User-facing assessment experience
// Path: src/app/assessment/page.tsx
// =============================================================================

'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import {
  AssessmentHub,
  TestFlow,
  ResultsDisplay,
  TimelineSelector
} from '@/components/assessment';
import { 
  tests, 
  getQuestionsForTest,
  TestId,
  GoalPath,
  AssessmentResult,
  FinancialPlan
} from '@/lib/assessment';

// =============================================================================
// Types
// =============================================================================

type AssessmentStep = 
  | 'hub'           // Choose quick/full mode
  | 'test'          // Taking the test
  | 'results'       // View scores
  | 'timeline'      // Select goal & path
  | 'complete';     // Done - show PDF download

interface SessionData {
  id: string;
  userId: string;
  assessmentMode: 'quick' | 'full';
  currentTestId: TestId;
  currentQuestionIndex: number;
  testsCompleted: TestId[];
  responses: ResponseData[];
  startTime: number;
}

interface ResponseData {
  questionId: string;
  answer: string | number;
  timeSpentSeconds: number;
}

// =============================================================================
// Assessment Page Component
// =============================================================================

export default function AssessmentPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  
  // State
  const [step, setStep] = useState<AssessmentStep>('hub');
  const [session, setSession] = useState<SessionData | null>(null);
  const [result, setResult] = useState<AssessmentResult | null>(null);
  const [plan, setPlan] = useState<FinancialPlan | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Get user ID (from auth or demo mode)
  const userId = searchParams.get('userId') || 'demo-user';
  const isDemo = userId === 'demo-user';

  // ==========================================================================
  // Initialize - Check for existing session
  // ==========================================================================

  useEffect(() => {
    const initSession = async () => {
      if (isDemo) {
        setLoading(false);
        return;
      }

      try {
        const response = await fetch(`/api/assessment/session?userId=${userId}`);
        const data = await response.json();

        if (data.success && data.session) {
          const sess = data.session;
          
          // Check session status
          if (sess.status === 'completed' && sess.assessment_results?.[0]) {
            // Already completed - show results
            setResult(sess.assessment_results[0]);
            setStep('results');
          } else if (sess.status === 'in_progress') {
            // Resume session
            setSession({
              id: sess.id,
              userId: sess.user_id,
              assessmentMode: sess.assessment_mode,
              currentTestId: sess.current_test_id,
              currentQuestionIndex: sess.current_question_index,
              testsCompleted: sess.tests_completed || [],
              responses: [],
              startTime: Date.now()
            });
            setStep('test');
          }
        }
      } catch (err) {
        console.error('Session init error:', err);
      } finally {
        setLoading(false);
      }
    };

    initSession();
  }, [userId, isDemo]);

  // ==========================================================================
  // Start Assessment
  // ==========================================================================

  const handleStartAssessment = useCallback(async (mode: 'quick' | 'full') => {
    setLoading(true);
    setError(null);

    try {
      // Create session via API (or local for demo)
      if (isDemo) {
        setSession({
          id: `demo-${Date.now()}`,
          userId: 'demo-user',
          assessmentMode: mode,
          currentTestId: 'financial_personality',
          currentQuestionIndex: 0,
          testsCompleted: [],
          responses: [],
          startTime: Date.now()
        });
        setStep('test');
        setLoading(false);
        return;
      }

      const response = await fetch('/api/assessment/session', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId,
          assessmentMode: mode
        })
      });

      const data = await response.json();

      if (!data.success) {
        throw new Error(data.error || 'Failed to start session');
      }

      setSession({
        id: data.session.id,
        userId,
        assessmentMode: mode,
        currentTestId: 'financial_personality',
        currentQuestionIndex: 0,
        testsCompleted: [],
        responses: [],
        startTime: Date.now()
      });
      setStep('test');

    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, [userId, isDemo]);

  // ==========================================================================
  // Handle Test Completion
  // ==========================================================================

  const handleTestComplete = useCallback(async (responses: ResponseData[]) => {
    if (!session) return;

    setLoading(true);
    setError(null);

    try {
      // For demo mode, use mock scoring
      if (isDemo) {
        const mockResult: AssessmentResult = {
          id: `result-${Date.now()}`,
          sessionId: session.id,
          userId: session.userId,
          overallScore: 67,
          personalityType: 'balanced_planner',
          personalityTraits: {
            primary: 'balanced_planner',
            secondary: 'cautious_saver',
            scores: { balanced_planner: 0.7, cautious_saver: 0.5 }
          },
          factorScores: [
            { factorId: 'savings_discipline', score: 72, status: 'good', benchmarkComparison: { vsGeneral: 8 } },
            { factorId: 'debt_management', score: 55, status: 'average', benchmarkComparison: { vsGeneral: -3 } },
            { factorId: 'financial_planning', score: 68, status: 'good', benchmarkComparison: { vsGeneral: 12 } },
            { factorId: 'spending_control', score: 61, status: 'average', benchmarkComparison: { vsGeneral: 5 } },
            { factorId: 'investment_readiness', score: 78, status: 'good', benchmarkComparison: { vsGeneral: 18 } },
            { factorId: 'risk_tolerance', score: 65, status: 'good', benchmarkComparison: { vsGeneral: 5 } },
            { factorId: 'financial_literacy', score: 82, status: 'excellent', benchmarkComparison: { vsGeneral: 22 } },
            { factorId: 'emergency_preparedness', score: 48, status: 'below_average', benchmarkComparison: { vsGeneral: -5 } },
            { factorId: 'future_orientation', score: 71, status: 'good', benchmarkComparison: { vsGeneral: 11 } },
            { factorId: 'money_wellness', score: 58, status: 'average', benchmarkComparison: { vsGeneral: 2 } },
          ],
          financialMetrics: {
            monthlyIncome: 5500,
            monthlyExpenses: 4200,
            savingsRate: 14,
            debtToIncomeRatio: 32,
            emergencyFundMonths: 2.3,
            totalDebt: 18000
          },
          rankings: {
            overallPercentile: 62,
            vsAgeGroup: 58,
            vsIncomeGroup: 65
          },
          recommendedGoalPath: 'debt_freedom',
          priorityFactors: ['emergency_preparedness', 'debt_management', 'money_wellness'],
          easyWins: ['financial_planning', 'financial_literacy'],
          hardChanges: ['debt_management', 'money_wellness'],
          completedAt: new Date()
        };
        
        setResult(mockResult);
        setStep('results');
        setLoading(false);
        return;
      }

      // Submit to API
      const response = await fetch('/api/assessment/submit', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId: session.userId,
          sessionId: session.id,
          responses: responses.map(r => ({
            questionId: r.questionId,
            answer: r.answer,
            timeSpentSeconds: r.timeSpentSeconds
          })),
          testsCompleted: session.testsCompleted,
          totalTimeSeconds: Math.floor((Date.now() - session.startTime) / 1000),
          assessmentMode: session.assessmentMode,
          userAge: 30, // Would come from user profile
          userIncomeRange: 'c' // Would come from user profile
        })
      });

      const data = await response.json();

      if (!data.success) {
        throw new Error(data.error || 'Failed to submit assessment');
      }

      // Fetch full result
      const resultResponse = await fetch(`/api/assessment/submit?id=${data.assessmentId}`);
      const resultData = await resultResponse.json();

      if (resultData.success) {
        setResult(resultData.assessment);
      }
      
      setStep('results');

    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, [session, isDemo]);

  // ==========================================================================
  // Handle Continue to Timeline
  // ==========================================================================

  const handleContinueToTimeline = useCallback(() => {
    setStep('timeline');
  }, []);

  // ==========================================================================
  // Handle Path Selection
  // ==========================================================================

  const handlePathSelected = useCallback(async (
    goalPath: GoalPath,
    targetMonths: number,
    chosenPath: 'safe_steady' | 'aggressive'
  ) => {
    if (!result) return;

    setLoading(true);
    setError(null);

    try {
      if (isDemo) {
        // Mock plan for demo
        setPlan({
          id: `plan-${Date.now()}`,
          assessmentId: result.id,
          userId: result.userId,
          goalPath,
          goalDescription: getGoalDescription(goalPath),
          targetDate: new Date(Date.now() + targetMonths * 30 * 24 * 60 * 60 * 1000),
          timelineValidation: {
            requestedMonths: targetMonths,
            realisticMonths: Math.ceil(targetMonths * 1.2),
            feasibilityScore: 72,
            isAchievable: true,
            adjustments: []
          },
          safePath: {
            timelineMonths: Math.ceil(targetMonths * 1.5),
            monthlyPayment: 650,
            totalCost: 18200,
            interestSaved: 0,
            lifestyleImpact: 'minimal',
            riskLevel: 'low'
          },
          aggressivePath: {
            timelineMonths: targetMonths,
            monthlyPayment: 1200,
            totalCost: 18000,
            interestSaved: 1800,
            lifestyleImpact: 'significant',
            riskLevel: 'high'
          },
          chosenPath,
          checkpoints: [],
          contingencyPlans: [],
          createdAt: new Date()
        } as any);
        setStep('complete');
        setLoading(false);
        return;
      }

      // Create plan via API
      const planResponse = await fetch('/api/assessment/plan', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          assessmentId: result.id,
          userId: result.userId,
          goalPath,
          targetMonths
        })
      });

      const planData = await planResponse.json();

      if (!planData.success) {
        throw new Error(planData.error || 'Failed to create plan');
      }

      // Select path
      const selectResponse = await fetch('/api/assessment/plan', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          planId: planData.plan.id,
          chosenPath
        })
      });

      const selectData = await selectResponse.json();

      if (selectData.success) {
        setPlan(selectData.plan);
      }

      setStep('complete');

    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, [result, isDemo]);

  // ==========================================================================
  // Handle PDF Download
  // ==========================================================================

  const handleDownloadPdf = useCallback(async () => {
    if (!result) return;

    try {
      const response = await fetch(`/api/assessment/pdf?id=${result.id}`);
      
      if (!response.ok) {
        throw new Error('PDF generation failed');
      }

      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `WealthClaude_Report_${result.id.slice(0, 8)}.pdf`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      window.URL.revokeObjectURL(url);
    } catch (err) {
      console.error('Download error:', err);
      alert('Failed to download PDF. Please try again.');
    }
  }, [result]);

  // ==========================================================================
  // Render
  // ==========================================================================

  if (loading && step === 'hub') {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-emerald-500 border-t-transparent rounded-full animate-spin mx-auto mb-4" />
          <p className="text-gray-600">Loading...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Error Banner */}
      {error && (
        <div className="bg-red-50 border-b border-red-200 px-4 py-3">
          <div className="max-w-4xl mx-auto flex items-center justify-between">
            <p className="text-red-700">{error}</p>
            <button 
              onClick={() => setError(null)}
              className="text-red-500 hover:text-red-700"
            >
              ✕
            </button>
          </div>
        </div>
      )}

      {/* Demo Mode Banner */}
      {isDemo && (
        <div className="bg-amber-50 border-b border-amber-200 px-4 py-2">
          <div className="max-w-4xl mx-auto text-center">
            <p className="text-amber-800 text-sm">
              👋 <strong>Demo Mode</strong> — Results are simulated. 
              <a href="/auth/signup" className="underline ml-1">Sign up</a> to save your real assessment.
            </p>
          </div>
        </div>
      )}

      {/* Step Content */}
      {step === 'hub' && (
        <AssessmentHub
          onStartAssessment={handleStartAssessment}
          isLoading={loading}
        />
      )}

      {step === 'test' && session && (
        <TestFlow
          mode={session.assessmentMode}
          initialTestId={session.currentTestId}
          initialQuestionIndex={session.currentQuestionIndex}
          onComplete={handleTestComplete}
          onPause={(responses) => {
            // Save progress
            if (!isDemo && session) {
              fetch('/api/assessment/session', {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                  sessionId: session.id,
                  status: 'paused',
                  currentTestId: session.currentTestId,
                  currentQuestionIndex: session.currentQuestionIndex
                })
              });
            }
          }}
        />
      )}

      {step === 'results' && result && (
        <ResultsDisplay
          result={result}
          onContinue={handleContinueToTimeline}
          onDownloadPdf={handleDownloadPdf}
        />
      )}

      {step === 'timeline' && result && (
        <TimelineSelector
          result={result}
          onPathSelected={handlePathSelected}
          onBack={() => setStep('results')}
        />
      )}

      {step === 'complete' && result && plan && (
        <CompletionScreen
          result={result}
          plan={plan}
          onDownloadPdf={handleDownloadPdf}
          onViewDashboard={() => router.push('/dashboard')}
        />
      )}
    </div>
  );
}

// =============================================================================
// Completion Screen Component
// =============================================================================

interface CompletionScreenProps {
  result: AssessmentResult;
  plan: any;
  onDownloadPdf: () => void;
  onViewDashboard: () => void;
}

function CompletionScreen({ result, plan, onDownloadPdf, onViewDashboard }: CompletionScreenProps) {
  const pathName = plan.chosenPath === 'safe_steady' ? 'Safe & Steady 🛡️' : 'Fast & Aggressive ⚡';
  
  return (
    <div className="min-h-screen bg-gradient-to-b from-emerald-50 to-white py-12">
      <div className="max-w-2xl mx-auto px-4 text-center">
        {/* Success Animation */}
        <div className="w-24 h-24 bg-emerald-100 rounded-full flex items-center justify-center mx-auto mb-6">
          <svg className="w-12 h-12 text-emerald-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
          </svg>
        </div>

        <h1 className="text-3xl font-bold text-gray-900 mb-2">
          You're All Set! 🎉
        </h1>
        <p className="text-lg text-gray-600 mb-8">
          Your {pathName} plan is ready to go.
        </p>

        {/* Summary Card */}
        <div className="bg-white rounded-2xl shadow-lg p-6 mb-8 text-left">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Your Plan Summary</h2>
          
          <div className="grid grid-cols-2 gap-4 mb-6">
            <div className="bg-gray-50 rounded-lg p-4">
              <div className="text-2xl font-bold text-emerald-600">{result.overallScore}</div>
              <div className="text-sm text-gray-500">Health Score</div>
            </div>
            <div className="bg-gray-50 rounded-lg p-4">
              <div className="text-2xl font-bold text-gray-900">
                ${plan.chosenPath === 'safe_steady' 
                  ? plan.safe_path?.monthlyPayment || plan.safePath?.monthlyPayment
                  : plan.aggressive_path?.monthlyPayment || plan.aggressivePath?.monthlyPayment
                }
              </div>
              <div className="text-sm text-gray-500">Monthly Target</div>
            </div>
          </div>

          <div className="border-t border-gray-100 pt-4">
            <h3 className="font-medium text-gray-900 mb-2">Next Steps:</h3>
            <ul className="space-y-2 text-sm text-gray-600">
              <li className="flex items-center gap-2">
                <span className="w-5 h-5 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center text-xs">1</span>
                Download your detailed PDF report
              </li>
              <li className="flex items-center gap-2">
                <span className="w-5 h-5 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center text-xs">2</span>
                Set up automatic payment transfers
              </li>
              <li className="flex items-center gap-2">
                <span className="w-5 h-5 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center text-xs">3</span>
                Check back monthly to log your progress
              </li>
            </ul>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex flex-col sm:flex-row gap-3 justify-center">
          <button
            onClick={onDownloadPdf}
            className="flex items-center justify-center gap-2 px-6 py-3 bg-emerald-600 text-white rounded-xl font-semibold hover:bg-emerald-700 transition-colors"
          >
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
            Download PDF Report
          </button>
          <button
            onClick={onViewDashboard}
            className="flex items-center justify-center gap-2 px-6 py-3 bg-white text-gray-700 border border-gray-200 rounded-xl font-semibold hover:bg-gray-50 transition-colors"
          >
            Go to Dashboard
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
            </svg>
          </button>
        </div>
      </div>
    </div>
  );
}

// =============================================================================
// Helpers
// =============================================================================

function getGoalDescription(goalPath: GoalPath): string {
  const descriptions: Record<GoalPath, string> = {
    debt_freedom: 'Become debt-free',
    emergency_fund: 'Build emergency savings',
    investment_start: 'Start investing',
    retirement_boost: 'Boost retirement savings',
    major_purchase: 'Save for a major purchase',
    general_wellness: 'Improve overall financial health'
  };
  return descriptions[goalPath] || 'Improve financial health';
}
