"use client";

import { useState, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { CheckCircle2, XCircle, RotateCcw, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { CompactQuestion } from "./QuizQuestion";
import { cn } from "@/lib/utils";
import type { QuizQuestion, MiniQuiz as MiniQuizType } from "@/types/learn";

interface MiniQuizProps {
  quiz: MiniQuizType;
  onComplete?: (passed: boolean, score: number) => void;
  className?: string;
}

type QuizState = "answering" | "submitted";

export function MiniQuiz({ quiz, onComplete, className }: MiniQuizProps) {
  const [answers, setAnswers] = useState<Record<string, number>>({});
  const [state, setState] = useState<QuizState>("answering");
  const [results, setResults] = useState<{
    score: number;
    passed: boolean;
    correctAnswers: Record<string, number>;
  } | null>(null);

  const questions = quiz.questions;
  const allAnswered = questions.every((q) => answers[q.id] !== undefined);

  // Handle answer selection
  const handleSelect = useCallback((questionId: string, answerIndex: number) => {
    if (state === "submitted") return;
    setAnswers((prev) => ({ ...prev, [questionId]: answerIndex }));
  }, [state]);

  // Handle quiz submission
  const handleSubmit = useCallback(() => {
    if (!allAnswered) return;

    // Calculate results
    const correctAnswers: Record<string, number> = {};
    let correctCount = 0;

    questions.forEach((q) => {
      correctAnswers[q.id] = q.correct_answer;
      if (answers[q.id] === q.correct_answer) {
        correctCount++;
      }
    });

    const score = Math.round((correctCount / questions.length) * 100);
    const passed = score >= 80;

    setResults({ score, passed, correctAnswers });
    setState("submitted");

    // Callback
    if (onComplete) {
      onComplete(passed, score);
    }
  }, [allAnswered, answers, questions, onComplete]);

  // Handle retry
  const handleRetry = useCallback(() => {
    setAnswers({});
    setResults(null);
    setState("answering");
  }, []);

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className={cn(
        "rounded-xl border border-border bg-card overflow-hidden",
        className
      )}
    >
      {/* Header */}
      <div className="px-5 py-4 bg-muted/30 border-b border-border">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Sparkles className="w-4 h-4 text-primary" />
            <h4 className="font-semibold text-foreground">Quick check</h4>
          </div>
          <span className="text-sm text-muted-foreground">
            {questions.length} questions
          </span>
        </div>
        {state === "answering" && (
          <p className="text-sm text-muted-foreground mt-1">
            Test your understanding of the key concepts
          </p>
        )}
      </div>

      {/* Questions */}
      <div className="px-5 py-2">
        {questions.map((question) => (
          <CompactQuestion
            key={question.id}
            id={question.id}
            question={question.question}
            options={question.options}
            selectedAnswer={answers[question.id]}
            correctAnswer={results?.correctAnswers[question.id]}
            explanation={state === "submitted" ? question.explanation : undefined}
            showResult={state === "submitted"}
            onSelect={handleSelect}
          />
        ))}
      </div>

      {/* Footer */}
      <div className="px-5 py-4 border-t border-border bg-muted/20">
        <AnimatePresence mode="wait">
          {state === "answering" ? (
            <motion.div
              key="submit"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="flex items-center justify-between"
            >
              <span className="text-sm text-muted-foreground">
                {Object.keys(answers).length} of {questions.length} answered
              </span>
              <Button
                onClick={handleSubmit}
                disabled={!allAnswered}
                size="sm"
              >
                Check answers
              </Button>
            </motion.div>
          ) : (
            <motion.div
              key="results"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="flex items-center justify-between"
            >
              <div className="flex items-center gap-3">
                {results?.passed ? (
                  <div className="flex items-center gap-2 text-primary">
                    <CheckCircle2 className="w-5 h-5" />
                    <span className="font-medium">
                      Great job! {results.score}% correct
                    </span>
                  </div>
                ) : (
                  <div className="flex items-center gap-2 text-amber-500">
                    <XCircle className="w-5 h-5" />
                    <span className="font-medium">
                      {results?.score}% — Review and try again
                    </span>
                  </div>
                )}
              </div>
              {!results?.passed && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleRetry}
                  className="gap-2"
                >
                  <RotateCcw className="w-4 h-4" />
                  Retry
                </Button>
              )}
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </motion.div>
  );
}

// ===========================================
// Inline Mini Quiz Trigger
// Shows a "Test yourself" prompt that expands to quiz
// ===========================================

interface MiniQuizTriggerProps {
  quiz: MiniQuizType;
  onComplete?: (passed: boolean, score: number) => void;
  className?: string;
}

export function MiniQuizTrigger({
  quiz,
  onComplete,
  className,
}: MiniQuizTriggerProps) {
  const [isExpanded, setIsExpanded] = useState(false);
  const [isCompleted, setIsCompleted] = useState(false);

  const handleComplete = (passed: boolean, score: number) => {
    setIsCompleted(true);
    if (onComplete) {
      onComplete(passed, score);
    }
  };

  if (isCompleted) {
    return (
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        className={cn(
          "flex items-center gap-3 p-4 rounded-xl bg-primary/5 border border-primary/20",
          className
        )}
      >
        <CheckCircle2 className="w-5 h-5 text-primary" />
        <span className="text-sm font-medium text-primary">
          Quick check completed!
        </span>
      </motion.div>
    );
  }

  if (!isExpanded) {
    return (
      <motion.button
        onClick={() => setIsExpanded(true)}
        whileHover={{ scale: 1.01 }}
        whileTap={{ scale: 0.99 }}
        className={cn(
          "w-full flex items-center justify-between p-4 rounded-xl border border-dashed border-primary/30 bg-primary/5 hover:bg-primary/10 transition-colors",
          className
        )}
      >
        <div className="flex items-center gap-3">
          <Sparkles className="w-5 h-5 text-primary" />
          <div className="text-left">
            <span className="font-medium text-foreground">
              Test your understanding
            </span>
            <p className="text-sm text-muted-foreground">
              {quiz.questions.length} quick questions
            </p>
          </div>
        </div>
        <span className="text-sm font-medium text-primary">Start →</span>
      </motion.button>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, height: 0 }}
      animate={{ opacity: 1, height: "auto" }}
      className={className}
    >
      <MiniQuiz quiz={quiz} onComplete={handleComplete} />
    </motion.div>
  );
}
