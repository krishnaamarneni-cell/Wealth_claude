'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { 
  ArrowLeft, 
  Pause, 
  Clock, 
  CheckCircle2,
  Brain,
  BarChart3,
  TrendingUp,
  Heart
} from 'lucide-react';
import Question, { QuestionData } from './Question';

// Import question data (these would come from your assessment library)
import { 
  getTestQuestions, 
  getTestById,
  calculateAssessment,
  UserResponse,
  TestId,
  AssessmentResult
} from '@/lib/assessment';

interface TestFlowProps {
  mode: 'quick' | 'full';
  userId: string;
  onComplete: (result: AssessmentResult) => void;
  onExit: () => void;
}

interface TestState {
  currentTestIndex: number;
  currentQuestionIndex: number;
  responses: Record<string, string | number>;
  completedTests: TestId[];
  startTime: number;
  testStartTime: number;
}

const TEST_ORDER: TestId[] = [
  'financial_personality',
  'financial_health',
  'investment_profile',
  'money_mindset'
];

const TEST_ICONS: Record<TestId, React.ReactNode> = {
  financial_personality: <Brain className="w-6 h-6" />,
  financial_health: <BarChart3 className="w-6 h-6" />,
  investment_profile: <TrendingUp className="w-6 h-6" />,
  money_mindset: <Heart className="w-6 h-6" />
};

export default function TestFlow({
  mode,
  userId,
  onComplete,
  onExit
}: TestFlowProps) {
  const testsToTake = mode === 'quick' 
    ? TEST_ORDER.slice(0, 2) 
    : TEST_ORDER;

  const [state, setState] = useState<TestState>({
    currentTestIndex: 0,
    currentQuestionIndex: 0,
    responses: {},
    completedTests: [],
    startTime: Date.now(),
    testStartTime: Date.now()
  });

  const [showTransition, setShowTransition] = useState(false);
  const [showPauseMenu, setShowPauseMenu] = useState(false);
  const [elapsedTime, setElapsedTime] = useState(0);

  // Timer
  useEffect(() => {
    const interval = setInterval(() => {
      setElapsedTime(Math.floor((Date.now() - state.startTime) / 1000));
    }, 1000);
    return () => clearInterval(interval);
  }, [state.startTime]);

  // Get current test and questions
  const currentTestId = testsToTake[state.currentTestIndex];
  const currentTest = getTestById(currentTestId);
  const currentQuestions = getTestQuestions(currentTestId);
  const currentQuestion = currentQuestions[state.currentQuestionIndex];

  // Calculate progress
  const totalQuestions = testsToTake.reduce(
    (sum, testId) => sum + getTestQuestions(testId).length, 
    0
  );
  const completedQuestions = testsToTake
    .slice(0, state.currentTestIndex)
    .reduce((sum, testId) => sum + getTestQuestions(testId).length, 0) 
    + state.currentQuestionIndex;

  // Format time
  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  // Handle answer
  const handleAnswer = useCallback((answer: string | number) => {
    setState(prev => ({
      ...prev,
      responses: {
        ...prev.responses,
        [currentQuestion.id]: answer
      }
    }));
  }, [currentQuestion?.id]);

  // Handle next
  const handleNext = useCallback(() => {
    const isLastQuestionInTest = state.currentQuestionIndex === currentQuestions.length - 1;
    const isLastTest = state.currentTestIndex === testsToTake.length - 1;

    if (isLastQuestionInTest && isLastTest) {
      // Assessment complete - calculate results
      const userResponses: UserResponse[] = Object.entries(state.responses).map(
        ([questionId, answer]) => ({
          questionId,
          answer,
          timestamp: new Date()
        })
      );

      const result = calculateAssessment({
        userId,
        responses: userResponses,
        testsCompleted: [...state.completedTests, currentTestId],
        userAge: 30, // TODO: Get from user profile
        userIncomeRange: 'd' // TODO: Get from responses
      });

      onComplete(result);
    } else if (isLastQuestionInTest) {
      // Show test transition screen
      setShowTransition(true);
      setState(prev => ({
        ...prev,
        completedTests: [...prev.completedTests, currentTestId]
      }));
    } else {
      // Next question
      setState(prev => ({
        ...prev,
        currentQuestionIndex: prev.currentQuestionIndex + 1
      }));
    }
  }, [state, currentQuestions, currentTestId, testsToTake, userId, onComplete]);

  // Handle starting next test
  const handleStartNextTest = useCallback(() => {
    setShowTransition(false);
    setState(prev => ({
      ...prev,
      currentTestIndex: prev.currentTestIndex + 1,
      currentQuestionIndex: 0,
      testStartTime: Date.now()
    }));
  }, []);

  // Handle going back
  const handleBack = useCallback(() => {
    if (state.currentQuestionIndex > 0) {
      setState(prev => ({
        ...prev,
        currentQuestionIndex: prev.currentQuestionIndex - 1
      }));
    }
  }, [state.currentQuestionIndex]);

  // Test transition screen
  if (showTransition) {
    const nextTestId = testsToTake[state.currentTestIndex + 1];
    const nextTest = getTestById(nextTestId);

    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 dark:from-slate-900 dark:to-slate-800 flex items-center justify-center p-6">
        <div className="max-w-lg w-full text-center">
          {/* Completed checkmark */}
          <div className="mb-8">
            <div className="inline-flex items-center justify-center w-20 h-20 rounded-full bg-emerald-100 dark:bg-emerald-900/30">
              <CheckCircle2 className="w-10 h-10 text-emerald-600" />
            </div>
          </div>

          <h2 className="text-3xl font-bold text-slate-900 dark:text-white mb-4">
            {currentTest.name} Complete! ✓
          </h2>
          
          <p className="text-slate-600 dark:text-slate-400 mb-8">
            Great job! You've completed {state.currentTestIndex + 1} of {testsToTake.length} tests.
          </p>

          {/* Progress dots */}
          <div className="flex justify-center gap-2 mb-8">
            {testsToTake.map((testId, i) => (
              <div
                key={testId}
                className={`w-3 h-3 rounded-full ${
                  i <= state.currentTestIndex 
                    ? 'bg-emerald-500' 
                    : 'bg-slate-300 dark:bg-slate-600'
                }`}
              />
            ))}
          </div>

          {/* Next test preview */}
          <div className="bg-white dark:bg-slate-800 rounded-2xl p-6 shadow-lg mb-8">
            <div className="flex items-center gap-4 mb-4">
              <div className="w-14 h-14 rounded-xl bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center text-blue-600">
                {TEST_ICONS[nextTestId]}
              </div>
              <div className="text-left">
                <h3 className="font-semibold text-slate-900 dark:text-white">
                  Next: {nextTest.name}
                </h3>
                <p className="text-sm text-slate-500">
                  {nextTest.questionCount} questions • ~{nextTest.estimatedMinutes} min
                </p>
              </div>
            </div>
            <p className="text-sm text-slate-600 dark:text-slate-400 text-left">
              {nextTest.shortDescription}
            </p>
          </div>

          <button
            onClick={handleStartNextTest}
            className="inline-flex items-center gap-2 px-8 py-4 bg-emerald-600 hover:bg-emerald-700 text-white font-semibold text-lg rounded-xl shadow-lg shadow-emerald-500/25 transition-all hover:scale-105"
          >
            Continue to Next Test
          </button>
        </div>
      </div>
    );
  }

  // Pause menu
  if (showPauseMenu) {
    return (
      <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-6">
        <div className="bg-white dark:bg-slate-800 rounded-2xl p-8 max-w-md w-full shadow-2xl">
          <h2 className="text-2xl font-bold text-slate-900 dark:text-white mb-2">
            Assessment Paused
          </h2>
          <p className="text-slate-600 dark:text-slate-400 mb-6">
            Your progress is saved. You can continue or exit.
          </p>

          <div className="space-y-3">
            <button
              onClick={() => setShowPauseMenu(false)}
              className="w-full py-3 px-4 bg-emerald-600 hover:bg-emerald-700 text-white font-semibold rounded-xl transition-colors"
            >
              Continue Assessment
            </button>
            <button
              onClick={onExit}
              className="w-full py-3 px-4 bg-slate-100 dark:bg-slate-700 hover:bg-slate-200 dark:hover:bg-slate-600 text-slate-700 dark:text-slate-300 font-semibold rounded-xl transition-colors"
            >
              Save & Exit
            </button>
          </div>

          <p className="mt-4 text-sm text-slate-500 text-center">
            Time elapsed: {formatTime(elapsedTime)}
          </p>
        </div>
      </div>
    );
  }

  // Main question view
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 dark:from-slate-900 dark:to-slate-800">
      {/* Top navigation bar */}
      <div className="sticky top-0 bg-white/80 dark:bg-slate-800/80 backdrop-blur-sm border-b border-slate-200 dark:border-slate-700 z-20">
        <div className="max-w-3xl mx-auto px-6 py-3 flex items-center justify-between">
          <button
            onClick={handleBack}
            disabled={state.currentQuestionIndex === 0 && state.currentTestIndex === 0}
            className="p-2 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-700 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
          >
            <ArrowLeft className="w-5 h-5 text-slate-600 dark:text-slate-400" />
          </button>

          <div className="flex items-center gap-4">
            {/* Current test indicator */}
            <div className="flex items-center gap-2 px-3 py-1.5 bg-slate-100 dark:bg-slate-700 rounded-lg">
              <span className="text-emerald-600">{TEST_ICONS[currentTestId]}</span>
              <span className="text-sm font-medium text-slate-700 dark:text-slate-300">
                {currentTest.name}
              </span>
            </div>

            {/* Timer */}
            <div className="flex items-center gap-1.5 text-slate-500">
              <Clock className="w-4 h-4" />
              <span className="text-sm font-mono">{formatTime(elapsedTime)}</span>
            </div>
          </div>

          <button
            onClick={() => setShowPauseMenu(true)}
            className="p-2 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors"
          >
            <Pause className="w-5 h-5 text-slate-600 dark:text-slate-400" />
          </button>
        </div>

        {/* Overall progress bar */}
        <div className="h-1 bg-slate-200 dark:bg-slate-700">
          <div 
            className="h-full bg-emerald-500 transition-all duration-300"
            style={{ width: `${(completedQuestions / totalQuestions) * 100}%` }}
          />
        </div>
      </div>

      {/* Question component */}
      <Question
        question={currentQuestion as QuestionData}
        currentAnswer={state.responses[currentQuestion.id]}
        onAnswer={handleAnswer}
        onNext={handleNext}
        questionNumber={state.currentQuestionIndex + 1}
        totalQuestions={currentQuestions.length}
      />
    </div>
  );
}
