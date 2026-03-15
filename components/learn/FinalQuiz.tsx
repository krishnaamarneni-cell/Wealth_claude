"use client";

import { useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import {
  ChevronLeft,
  ChevronRight,
  CheckCircle2,
  XCircle,
  RotateCcw,
  Trophy,
  Target,
  Clock,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { QuizQuestion } from "./QuizQuestion";
import { cn } from "@/lib/utils";
import type { QuizQuestion as QuizQuestionType } from "@/types/learn";

interface FinalQuizProps {
  chapterId: number;
  chapterTitle: string;
  questions: QuizQuestionType[];
  passThreshold?: number;
  onComplete: (passed: boolean, score: number, answers: Record<string, number>) => void;
  onRetry?: () => void;
  className?: string;
}

type QuizPhase = "intro" | "questions" | "results";

export function FinalQuiz({
  chapterId,
  chapterTitle,
  questions = [],
  passThreshold = 80,
  onComplete,
  onRetry,
  className,
}: FinalQuizProps) {
  const router = useRouter();
  const [phase, setPhase] = useState<QuizPhase>("intro");
  const [currentIndex, setCurrentIndex] = useState(0);
  const [answers, setAnswers] = useState<Record<string, number>>({});
  const [results, setResults] = useState<{
    score: number;
    passed: boolean;
    correctAnswers: Record<string, number>;
    explanations: Record<string, string>;
  } | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isNavigating, setIsNavigating] = useState(false);

  // Safely get current question (may be undefined if no questions)
  const currentQuestion = questions?.[currentIndex];
  const isLastQuestion = questions.length > 0 && currentIndex === questions.length - 1;
  const isFirstQuestion = currentIndex === 0;
  const currentAnswer = currentQuestion ? answers[currentQuestion.id] : undefined;
  const allAnswered = questions.length > 0 && questions.every((q) => answers[q.id] !== undefined);
  const answeredCount = Object.keys(answers).length;

  // Handle answer selection
  const handleSelect = useCallback((questionId: string, answerIndex: number) => {
    setAnswers((prev) => ({ ...prev, [questionId]: answerIndex }));
  }, []);

  // Navigate to next question
  const handleNext = useCallback(() => {
    if (questions.length > 0 && currentIndex < questions.length - 1) {
      setCurrentIndex((prev) => prev + 1);
    }
  }, [currentIndex, questions.length]);

  // Navigate to previous question
  const handlePrevious = useCallback(() => {
    if (currentIndex > 0) {
      setCurrentIndex((prev) => prev - 1);
    }
  }, [currentIndex]);

  // Submit quiz
  const handleSubmit = useCallback(async () => {
    if (!allAnswered || isSubmitting || questions.length === 0) return;

    setIsSubmitting(true);

    try {
      const correctAnswers: Record<string, number> = {};
      const explanations: Record<string, string> = {};
      let correctCount = 0;

      questions.forEach((q) => {
        correctAnswers[q.id] = q.correct_answer;
        explanations[q.id] = q.explanation;
        if (answers[q.id] === q.correct_answer) {
          correctCount++;
        }
      });

      const score = Math.round((correctCount / questions.length) * 100);
      const passed = score >= passThreshold;

      setResults({ score, passed, correctAnswers, explanations });
      setPhase("results");
      
      onComplete(passed, score, answers);
    } catch (error) {
      console.error("Error submitting quiz:", error);
    } finally {
      setIsSubmitting(false);
    }
  }, [allAnswered, isSubmitting, questions, answers, passThreshold, onComplete]);

  // Handle retry
  const handleRetry = useCallback(() => {
    setAnswers({});
    setResults(null);
    setCurrentIndex(0);
    setPhase("intro");
    if (onRetry) {
      onRetry();
    }
  }, [onRetry]);

  // Start quiz
  const handleStart = useCallback(() => {
    setPhase("questions");
  }, []);

  // Navigate with delay
  const handleNavigate = useCallback(async () => {
    if (isNavigating) return;
    
    setIsNavigating(true);
    await new Promise(resolve => setTimeout(resolve, 300));
    
    if (results?.passed) {
      if (chapterId >= 14) {
        router.push("/learn/certificate");
      } else {
        router.push(`/learn/${chapterId + 1}`);
      }
    } else {
      router.push(`/learn/${chapterId}`);
    }
  }, [isNavigating, results, chapterId, router]);

  // If no questions, show error (after all hooks)
  if (!questions || questions.length === 0) {
    return (
      <div className={cn("max-w-2xl mx-auto text-center py-12", className)}>
        <h2 className="text-xl font-bold text-foreground mb-4">No questions available</h2>
        <p className="text-muted-foreground">This quiz doesn't have any questions yet.</p>
      </div>
    );
  }

  return (
    <div className={cn("max-w-2xl mx-auto", className)}>
      <AnimatePresence mode="wait">
        {/* Intro Phase */}
        {phase === "intro" && (
          <motion.div
            key="intro"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="text-center py-12"
          >
            <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-primary/10 mb-6">
              <Target className="w-8 h-8 text-primary" />
            </div>

            <h2 className="text-2xl font-bold text-foreground mb-2">
              Chapter {chapterId} Final Quiz
            </h2>
            <p className="text-muted-foreground mb-8">
              {chapterTitle}
            </p>

            <div className="flex items-center justify-center gap-8 mb-8 text-sm text-muted-foreground">
              <div className="flex items-center gap-2">
                <span className="font-semibold text-foreground">
                  {questions.length}
                </span>
                questions
              </div>
              <div className="flex items-center gap-2">
                <span className="font-semibold text-foreground">
                  {passThreshold}%
                </span>
                to pass
              </div>
              <div className="flex items-center gap-2">
                <Clock className="w-4 h-4" />
                ~5 min
              </div>
            </div>

            <div className="bg-muted/30 rounded-xl p-4 mb-8 text-left max-w-md mx-auto">
              <h4 className="font-medium text-foreground mb-2">Before you begin:</h4>
              <ul className="text-sm text-muted-foreground space-y-1">
                <li>• Answer all questions to submit</li>
                <li>• You can navigate between questions</li>
                <li>• Score {passThreshold}% or higher to pass</li>
                <li>• Passing unlocks the next chapter</li>
              </ul>
            </div>

            <Button onClick={handleStart} size="lg" className="gap-2">
              Start quiz
              <ChevronRight className="w-4 h-4" />
            </Button>
          </motion.div>
        )}

        {/* Questions Phase */}
        {phase === "questions" && currentQuestion && (
          <motion.div
            key="questions"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          >
            {/* Progress bar */}
            <div className="mb-8">
              <div className="flex items-center justify-between text-sm text-muted-foreground mb-2">
                <span>Progress</span>
                <span>{answeredCount} of {questions.length} answered</span>
              </div>
              <div className="h-2 bg-muted rounded-full overflow-hidden">
                <motion.div
                  className="h-full bg-primary rounded-full"
                  initial={{ width: 0 }}
                  animate={{
                    width: `${(answeredCount / questions.length) * 100}%`,
                  }}
                  transition={{ duration: 0.3 }}
                />
              </div>
            </div>

            {/* Question */}
            <AnimatePresence mode="wait">
              <motion.div
                key={currentQuestion.id}
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                transition={{ duration: 0.2 }}
              >
                <QuizQuestion
                  id={currentQuestion.id}
                  type={currentQuestion.type}
                  question={currentQuestion.question}
                  options={currentQuestion.options}
                  selectedAnswer={currentAnswer}
                  showResult={false}
                  onSelect={handleSelect}
                  questionNumber={currentIndex + 1}
                  totalQuestions={questions.length}
                />
              </motion.div>
            </AnimatePresence>

            {/* Navigation */}
            <div className="flex items-center justify-between mt-8 pt-6 border-t border-border">
              <Button
                variant="outline"
                onClick={handlePrevious}
                disabled={isFirstQuestion}
                className="gap-2"
              >
                <ChevronLeft className="w-4 h-4" />
                Previous
              </Button>

              {/* Question dots */}
              <div className="hidden sm:flex items-center gap-1.5">
                {questions.map((q, index) => {
                  const isAnswered = answers[q.id] !== undefined;
                  const isCurrent = index === currentIndex;

                  return (
                    <button
                      key={q.id}
                      onClick={() => setCurrentIndex(index)}
                      className={cn(
                        "w-2.5 h-2.5 rounded-full transition-all",
                        isCurrent && "ring-2 ring-primary ring-offset-2 ring-offset-background",
                        isAnswered ? "bg-primary" : "bg-muted"
                      )}
                    />
                  );
                })}
              </div>

              {isLastQuestion ? (
                <Button
                  onClick={handleSubmit}
                  disabled={!allAnswered || isSubmitting}
                  className="gap-2"
                >
                  {isSubmitting ? (
                    <>
                      <motion.span
                        animate={{ rotate: 360 }}
                        transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                        className="w-4 h-4 border-2 border-primary-foreground/30 border-t-primary-foreground rounded-full"
                      />
                      Submitting...
                    </>
                  ) : (
                    <>
                      Submit quiz
                      <CheckCircle2 className="w-4 h-4" />
                    </>
                  )}
                </Button>
              ) : (
                <Button onClick={handleNext} className="gap-2">
                  Next
                  <ChevronRight className="w-4 h-4" />
                </Button>
              )}
            </div>
          </motion.div>
        )}

        {/* Results Phase */}
        {phase === "results" && results && (
          <motion.div
            key="results"
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0 }}
            className="text-center py-8"
          >
            {/* Score display */}
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ type: "spring", damping: 15, delay: 0.2 }}
              className={cn(
                "inline-flex items-center justify-center w-24 h-24 rounded-full mb-6",
                results.passed ? "bg-primary/10" : "bg-red-500/10"
              )}
            >
              {results.passed ? (
                <Trophy className="w-12 h-12 text-primary" />
              ) : (
                <XCircle className="w-12 h-12 text-red-500" />
              )}
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 }}
            >
              <h2 className="text-3xl font-bold text-foreground mb-2">
                {results.score}%
              </h2>
              <p
                className={cn(
                  "text-lg font-medium mb-6",
                  results.passed ? "text-primary" : "text-red-500"
                )}
              >
                {results.passed
                  ? "Congratulations! You passed!"
                  : `You need ${passThreshold}% to pass`}
              </p>

              {results.passed ? (
                <p className="text-muted-foreground mb-8 max-w-md mx-auto">
                  You've mastered the concepts in this chapter. The next chapter
                  is now unlocked!
                </p>
              ) : (
                <p className="text-muted-foreground mb-8 max-w-md mx-auto">
                  Review the chapter content and try again. You've got this!
                </p>
              )}
            </motion.div>

            {/* Results breakdown */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.4 }}
              className="bg-card border border-border rounded-xl p-6 mb-8 text-left max-w-lg mx-auto"
            >
              <h4 className="font-medium text-foreground mb-4">
                Question Review
              </h4>
              <div className="space-y-3">
                {questions.map((q, index) => {
                  const userAnswer = answers[q.id];
                  const isCorrect = userAnswer === results.correctAnswers[q.id];

                  return (
                    <div
                      key={q.id}
                      className="flex items-start gap-3 text-sm"
                    >
                      {isCorrect ? (
                        <CheckCircle2 className="w-5 h-5 text-primary flex-shrink-0 mt-0.5" />
                      ) : (
                        <XCircle className="w-5 h-5 text-red-500 flex-shrink-0 mt-0.5" />
                      )}
                      <div className="flex-1 min-w-0">
                        <span className="text-muted-foreground mr-2">
                          Q{index + 1}:
                        </span>
                        <span className={cn(
                          isCorrect ? "text-foreground" : "text-red-500"
                        )}>
                          {q.question}
                        </span>
                        {!isCorrect && (
                          <p className="text-xs text-muted-foreground mt-1">
                            Correct: {q.options[results.correctAnswers[q.id]]}
                          </p>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </motion.div>

            {/* Actions */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.5 }}
              className="flex items-center justify-center gap-4"
            >
              {!results.passed && (
                <Button
                  variant="outline"
                  onClick={handleRetry}
                  className="gap-2"
                >
                  <RotateCcw className="w-4 h-4" />
                  Try again
                </Button>
              )}
              <Button
                onClick={handleNavigate}
                disabled={isNavigating}
                className="gap-2"
              >
                {isNavigating ? (
                  <>
                    <motion.span
                      animate={{ rotate: 360 }}
                      transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                      className="w-4 h-4 border-2 border-primary-foreground/30 border-t-primary-foreground rounded-full"
                    />
                    Loading...
                  </>
                ) : results.passed ? (
                  chapterId >= 14 ? (
                    "Get your certificate"
                  ) : (
                    "Continue to next chapter"
                  )
                ) : (
                  "Review chapter"
                )}
              </Button>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
