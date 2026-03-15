"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Check, X, ChevronRight } from "lucide-react";
import { cn } from "@/lib/utils";

interface QuizQuestionProps {
  id: string;
  type: "multiple_choice" | "true_false";
  question: string;
  options: string[];
  selectedAnswer?: number;
  correctAnswer?: number; // Only provided after submission
  explanation?: string; // Only provided after submission
  showResult?: boolean;
  onSelect: (questionId: string, answerIndex: number) => void;
  questionNumber?: number;
  totalQuestions?: number;
}

export function QuizQuestion({
  id,
  type,
  question,
  options,
  selectedAnswer,
  correctAnswer,
  explanation,
  showResult = false,
  onSelect,
  questionNumber,
  totalQuestions,
}: QuizQuestionProps) {
  const isAnswered = selectedAnswer !== undefined;
  const isCorrect = showResult && selectedAnswer === correctAnswer;
  const isIncorrect = showResult && selectedAnswer !== correctAnswer;

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      transition={{ duration: 0.3 }}
      className="w-full"
    >
      {/* Question header */}
      {questionNumber && totalQuestions && (
        <div className="flex items-center gap-2 text-sm text-muted-foreground mb-3">
          <span>Question {questionNumber} of {totalQuestions}</span>
          {type === "true_false" && (
            <span className="px-2 py-0.5 rounded-full bg-muted text-xs">
              True/False
            </span>
          )}
        </div>
      )}

      {/* Question text */}
      <h3 className="text-lg font-medium text-foreground mb-6">{question}</h3>

      {/* Options */}
      <div className="space-y-3">
        {options.map((option, index) => {
          const isSelected = selectedAnswer === index;
          const isThisCorrect = showResult && index === correctAnswer;
          const isThisWrong = showResult && isSelected && index !== correctAnswer;

          return (
            <button
              key={index}
              onClick={() => !showResult && onSelect(id, index)}
              disabled={showResult}
              className={cn(
                "w-full flex items-center gap-4 p-4 rounded-xl border text-left transition-all",
                // Default state
                !showResult && !isSelected && "border-border bg-card hover:border-primary/50 hover:bg-primary/5",
                // Selected (before submit)
                !showResult && isSelected && "border-primary bg-primary/10",
                // Correct answer shown
                isThisCorrect && "border-primary bg-primary/10",
                // Wrong answer shown
                isThisWrong && "border-red-500/50 bg-red-500/10",
                // Other options after submit (disabled look)
                showResult && !isThisCorrect && !isThisWrong && "border-border bg-muted/30 opacity-60",
                // Disabled cursor
                showResult && "cursor-default"
              )}
            >
              {/* Option indicator */}
              <div
                className={cn(
                  "flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium transition-all",
                  // Default
                  !showResult && !isSelected && "bg-muted text-muted-foreground",
                  // Selected (before submit)
                  !showResult && isSelected && "bg-primary text-primary-foreground",
                  // Correct
                  isThisCorrect && "bg-primary text-primary-foreground",
                  // Wrong
                  isThisWrong && "bg-red-500 text-white"
                )}
              >
                {showResult && isThisCorrect ? (
                  <Check className="w-4 h-4" />
                ) : showResult && isThisWrong ? (
                  <X className="w-4 h-4" />
                ) : (
                  <span>{String.fromCharCode(65 + index)}</span>
                )}
              </div>

              {/* Option text */}
              <span
                className={cn(
                  "flex-1 text-foreground",
                  showResult && !isThisCorrect && !isThisWrong && "text-muted-foreground"
                )}
              >
                {option}
              </span>

              {/* Selection indicator */}
              {!showResult && isSelected && (
                <motion.div
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  className="flex-shrink-0"
                >
                  <Check className="w-5 h-5 text-primary" />
                </motion.div>
              )}
            </button>
          );
        })}
      </div>

      {/* Explanation (shown after submit) */}
      <AnimatePresence>
        {showResult && explanation && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.3 }}
            className="mt-6"
          >
            <div
              className={cn(
                "p-4 rounded-xl border",
                isCorrect
                  ? "bg-primary/5 border-primary/30"
                  : "bg-amber-500/5 border-amber-500/30"
              )}
            >
              <div className="flex items-start gap-3">
                <div
                  className={cn(
                    "flex-shrink-0 w-6 h-6 rounded-full flex items-center justify-center mt-0.5",
                    isCorrect ? "bg-primary/20 text-primary" : "bg-amber-500/20 text-amber-500"
                  )}
                >
                  {isCorrect ? (
                    <Check className="w-3.5 h-3.5" />
                  ) : (
                    <span className="text-xs font-bold">!</span>
                  )}
                </div>
                <div>
                  <p
                    className={cn(
                      "text-sm font-medium mb-1",
                      isCorrect ? "text-primary" : "text-amber-500"
                    )}
                  >
                    {isCorrect ? "Correct!" : "Not quite right"}
                  </p>
                  <p className="text-sm text-foreground/80">{explanation}</p>
                </div>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}

// ===========================================
// Compact Question for Mini Quiz
// ===========================================

interface CompactQuestionProps {
  id: string;
  question: string;
  options: string[];
  selectedAnswer?: number;
  correctAnswer?: number;
  explanation?: string;
  showResult?: boolean;
  onSelect: (questionId: string, answerIndex: number) => void;
}

export function CompactQuestion({
  id,
  question,
  options,
  selectedAnswer,
  correctAnswer,
  explanation,
  showResult = false,
  onSelect,
}: CompactQuestionProps) {
  const isCorrect = showResult && selectedAnswer === correctAnswer;

  return (
    <div className="py-4 border-b border-border last:border-0">
      <p className="text-foreground font-medium mb-3">{question}</p>

      <div className="flex flex-wrap gap-2">
        {options.map((option, index) => {
          const isSelected = selectedAnswer === index;
          const isThisCorrect = showResult && index === correctAnswer;
          const isThisWrong = showResult && isSelected && index !== correctAnswer;

          return (
            <button
              key={index}
              onClick={() => !showResult && onSelect(id, index)}
              disabled={showResult}
              className={cn(
                "px-4 py-2 rounded-lg text-sm font-medium transition-all",
                // Default
                !showResult && !isSelected && "bg-muted text-foreground hover:bg-muted/80",
                // Selected
                !showResult && isSelected && "bg-primary text-primary-foreground",
                // Correct
                isThisCorrect && "bg-primary text-primary-foreground",
                // Wrong
                isThisWrong && "bg-red-500 text-white",
                // Disabled
                showResult && !isThisCorrect && !isThisWrong && "bg-muted/50 text-muted-foreground",
                showResult && "cursor-default"
              )}
            >
              {option}
            </button>
          );
        })}
      </div>

      {/* Compact explanation */}
      {showResult && explanation && (
        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className={cn(
            "mt-3 text-sm",
            isCorrect ? "text-primary" : "text-amber-500"
          )}
        >
          {isCorrect ? "✓ " : "→ "}
          {explanation}
        </motion.p>
      )}
    </div>
  );
}
