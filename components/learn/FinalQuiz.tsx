"use client";

import { useState, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { CheckCircle2, XCircle, RotateCcw, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { CompactQuestion } from "./QuizQuestion";
import { cn } from "@/lib/utils";
import type { QuizQuestion } from "@/types/learn";

interface FinalQuizProps {
  chapterId: number;
  chapterTitle: string;
  questions: QuizQuestion[];
  passThreshold: number;
  onComplete: (passed: boolean, score: number, answers: Record<string, number>) => void;
  className?: string;
}

type QuizState = "answering" | "submitted";

export function FinalQuiz({
  chapterId,
  chapterTitle,
  questions,
  passThreshold,
  onComplete,
  className,
}: FinalQuizProps) {
  const [answers, setAnswers] = useState<Record<string, number>>({});
  const [state, setState] = useState<QuizState>("answering");
  const [results, setResults] = useState<{
    score: number;
    passed: boolean;
    correctAnswers: Record<string, number>;
  } | null>(null);

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
    const passed = score >= passThreshold;

    setResults({
      score,
      passed,
      correctAnswers,
    });
    setState("submitted");

    // Call parent handler with all necessary data
    onComplete(passed, score, answers);
  }, [allAnswered, questions, passThreshold, answers, onComplete]);

  // Handle reset for retake
  const handleReset = useCallback(() => {
    setAnswers({});
    setResults(null);
    setState("answering");
  }, []);

  // Quiz in progress
  if (state === "answering") {
    return (
      <div className={cn("max-w-3xl mx-auto", className)}>
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-foreground mb-2">
            Chapter {chapterId}: Final Quiz
          </h1>
          <p className="text-muted-foreground">
            {chapterTitle} • {questions.length} questions • Pass: {passThreshold}%+
          </p>
        </div>

        <div className="space-y-6">
          {questions.map((question, index) => (
            <motion.div
              key={question.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.1 }}
            >
              <CompactQuestion
                question={question}
                selectedAnswer={answers[question.id]}
                onSelect={(idx) => handleSelect(question.id, idx)}
                disabled={state === "submitted"}
              />
            </motion.div>
          ))}
        </div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: questions.length * 0.1 }}
          className="mt-8 pt-8 border-t border-border flex gap-4"
        >
          <Button
            onClick={handleSubmit}
            disabled={!allAnswered}
            className="flex-1"
          >
            Submit Quiz
          </Button>
          <div className="text-sm text-muted-foreground flex items-center gap-2">
            {Object.keys(answers).length} / {questions.length} answered
          </div>
        </motion.div>
      </div>
    );
  }

  // Quiz submitted - show results
  if (results) {
    const passed = results.passed;

    return (
      <div className={cn("max-w-3xl mx-auto text-center", className)}>
        <AnimatePresence mode="wait">
          <motion.div
            key={passed ? "passed" : "failed"}
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.9 }}
          >
            {/* Results header */}
            <div className="mb-8">
              <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ type: "spring", delay: 0.2 }}
                className={cn(
                  "inline-flex items-center justify-center w-20 h-20 rounded-2xl mb-6",
                  passed ? "bg-primary/10" : "bg-destructive/10"
                )}
              >
                {passed ? (
                  <CheckCircle2 className="w-10 h-10 text-primary" />
                ) : (
                  <XCircle className="w-10 h-10 text-destructive" />
                )}
              </motion.div>

              <h2 className={cn("text-3xl font-bold mb-2", passed ? "text-foreground" : "text-foreground")}>
                {passed ? "🎉 Quiz Passed!" : "Quiz Not Passed"}
              </h2>

              <div className="space-y-2">
                <p className="text-4xl font-bold text-primary">{results.score}%</p>
                <p className="text-muted-foreground">
                  {Object.values(answers).filter((ans, idx) => ans === questions[idx]?.correct_answer).length} / {questions.length} correct
                </p>
              </div>

              {!passed && (
                <p className="text-muted-foreground mt-4">
                  You need {passThreshold}% to pass. Please try again!
                </p>
              )}
            </div>

            {/* Score details */}
            <div className="bg-card border border-border rounded-xl p-6 mb-8">
              <h3 className="font-semibold text-foreground mb-4 text-left">Review your answers</h3>
              <div className="space-y-4">
                {questions.map((question) => {
                  const userAnswer = answers[question.id];
                  const correctAnswer = results.correctAnswers[question.id];
                  const isCorrect = userAnswer === correctAnswer;

                  return (
                    <div
                      key={question.id}
                      className={cn(
                        "p-4 rounded-lg border",
                        isCorrect
                          ? "border-primary/30 bg-primary/5"
                          : "border-destructive/30 bg-destructive/5"
                      )}
                    >
                      <div className="flex items-start gap-3">
                        {isCorrect ? (
                          <CheckCircle2 className="w-5 h-5 text-primary flex-shrink-0 mt-0.5" />
                        ) : (
                          <XCircle className="w-5 h-5 text-destructive flex-shrink-0 mt-0.5" />
                        )}
                        <div className="text-left flex-1">
                          <p className="font-medium text-foreground mb-2">
                            {question.question}
                          </p>
                          <p className="text-sm text-muted-foreground mb-1">
                            Your answer: {question.options[userAnswer]}
                          </p>
                          {!isCorrect && (
                            <p className="text-sm text-primary font-medium">
                              Correct answer: {question.options[correctAnswer]}
                            </p>
                          )}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Actions */}
            <div className="flex gap-4 justify-center">
              {!passed && (
                <Button onClick={handleReset} variant="outline" className="flex items-center gap-2">
                  <RotateCcw className="w-4 h-4" />
                  Retake Quiz
                </Button>
              )}
              {passed && (
                <Button className="flex items-center gap-2">
                  <Sparkles className="w-4 h-4" />
                  Continue to next chapter
                </Button>
              )}
            </div>
          </motion.div>
        </AnimatePresence>
      </div>
    );
  }

  return null;
}
