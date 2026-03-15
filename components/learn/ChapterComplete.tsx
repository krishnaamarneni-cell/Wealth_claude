"use client";

import { useEffect, useState, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Trophy, ArrowRight, RotateCcw, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import Link from "next/link";

// ===========================================
// Confetti Animation
// ===========================================

interface ConfettiPiece {
  id: number;
  x: number;
  delay: number;
  duration: number;
  color: string;
  size: number;
  rotation: number;
}

function Confetti() {
  const [pieces, setPieces] = useState<ConfettiPiece[]>([]);

  useEffect(() => {
    const colors = [
      "#5FD383", // Primary green
      "#3B82F6", // Blue
      "#F59E0B", // Amber
      "#EC4899", // Pink
      "#8B5CF6", // Purple
      "#10B981", // Emerald
    ];

    const newPieces: ConfettiPiece[] = [];
    for (let i = 0; i < 50; i++) {
      newPieces.push({
        id: i,
        x: Math.random() * 100,
        delay: Math.random() * 0.5,
        duration: 2 + Math.random() * 2,
        color: colors[Math.floor(Math.random() * colors.length)],
        size: 8 + Math.random() * 8,
        rotation: Math.random() * 360,
      });
    }
    setPieces(newPieces);
  }, []);

  return (
    <div className="fixed inset-0 pointer-events-none overflow-hidden z-50">
      {pieces.map((piece) => (
        <motion.div
          key={piece.id}
          className="absolute"
          style={{
            left: `${piece.x}%`,
            top: -20,
            width: piece.size,
            height: piece.size,
            backgroundColor: piece.color,
            borderRadius: Math.random() > 0.5 ? "50%" : "2px",
          }}
          initial={{
            y: -20,
            rotate: 0,
            opacity: 1,
          }}
          animate={{
            y: "100vh",
            rotate: piece.rotation + 720,
            opacity: [1, 1, 0],
          }}
          transition={{
            duration: piece.duration,
            delay: piece.delay,
            ease: "easeIn",
          }}
        />
      ))}
    </div>
  );
}

// ===========================================
// Chapter Complete Modal
// ===========================================

interface ChapterCompleteProps {
  isOpen: boolean;
  onClose: () => void;
  chapterId: number;
  chapterTitle: string;
  score: number;
  passed: boolean;
  nextChapterId?: number;
  isLastChapter?: boolean;
}

export function ChapterComplete({
  isOpen,
  onClose,
  chapterId,
  chapterTitle,
  score,
  passed,
  nextChapterId,
  isLastChapter = false,
}: ChapterCompleteProps) {
  const [showConfetti, setShowConfetti] = useState(false);

  useEffect(() => {
    if (isOpen && passed) {
      setShowConfetti(true);
      const timer = setTimeout(() => setShowConfetti(false), 4000);
      return () => clearTimeout(timer);
    }
  }, [isOpen, passed]);

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Confetti */}
          {showConfetti && <Confetti />}

          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/60 backdrop-blur-sm z-40"
            onClick={onClose}
          />

          {/* Modal */}
          <motion.div
            initial={{ opacity: 0, scale: 0.9, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.9, y: 20 }}
            transition={{ type: "spring", damping: 25, stiffness: 300 }}
            className="fixed left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 z-50 w-full max-w-md"
          >
            <div className="bg-card border border-border rounded-2xl shadow-2xl overflow-hidden">
              {/* Header */}
              <div
                className={cn(
                  "px-6 pt-8 pb-6 text-center",
                  passed ? "bg-primary/5" : "bg-amber-500/5"
                )}
              >
                <motion.div
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  transition={{ type: "spring", delay: 0.2 }}
                  className={cn(
                    "inline-flex items-center justify-center w-20 h-20 rounded-2xl mb-4",
                    passed ? "bg-primary/10" : "bg-amber-500/10"
                  )}
                >
                  {passed ? (
                    <Trophy className="w-10 h-10 text-primary" />
                  ) : (
                    <RotateCcw className="w-10 h-10 text-amber-500" />
                  )}
                </motion.div>

                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.3 }}
                >
                  <h2 className="text-2xl font-bold text-foreground mb-1">
                    {passed ? "Chapter Complete!" : "Almost there!"}
                  </h2>
                  <p className="text-muted-foreground">
                    Chapter {chapterId}: {chapterTitle}
                  </p>
                </motion.div>
              </div>

              {/* Score */}
              <div className="px-6 py-6">
                <motion.div
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ delay: 0.4 }}
                  className={cn(
                    "text-center p-6 rounded-xl mb-6",
                    passed ? "bg-primary/5" : "bg-amber-500/5"
                  )}
                >
                  <p className="text-sm text-muted-foreground mb-1">
                    Quiz Score
                  </p>
                  <p
                    className={cn(
                      "text-4xl font-bold",
                      passed ? "text-primary" : "text-amber-500"
                    )}
                  >
                    {score}%
                  </p>
                  {passed ? (
                    <p className="text-sm text-primary mt-2">
                      ✓ Passed with flying colors!
                    </p>
                  ) : (
                    <p className="text-sm text-amber-500 mt-2">
                      You need 80% to pass
                    </p>
                  )}
                </motion.div>

                {/* What's next */}
                {passed && (
                  <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.5 }}
                    className="flex items-center gap-3 p-4 rounded-xl bg-muted/30 mb-6"
                  >
                    <Sparkles className="w-5 h-5 text-primary flex-shrink-0" />
                    <p className="text-sm text-foreground">
                      {isLastChapter
                        ? "You've completed the entire course! Get your certificate."
                        : `Chapter ${nextChapterId} is now unlocked!`}
                    </p>
                  </motion.div>
                )}

                {/* Actions */}
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: 0.6 }}
                  className="flex flex-col gap-3"
                >
                  {passed ? (
                    <>
                      {isLastChapter ? (
                        <Link href="/learn/certificate" className="w-full">
                          <Button className="w-full gap-2">
                            Get your certificate
                            <Trophy className="w-4 h-4" />
                          </Button>
                        </Link>
                      ) : (
                        <Link href={`/learn/${nextChapterId}`} className="w-full">
                          <Button className="w-full gap-2">
                            Continue to chapter {nextChapterId}
                            <ArrowRight className="w-4 h-4" />
                          </Button>
                        </Link>
                      )}
                      <Link href="/learn" className="w-full">
                        <Button variant="outline" className="w-full">
                          Back to course overview
                        </Button>
                      </Link>
                    </>
                  ) : (
                    <>
                      <Link href={`/learn/${chapterId}/quiz`} className="w-full">
                        <Button className="w-full gap-2">
                          <RotateCcw className="w-4 h-4" />
                          Try again
                        </Button>
                      </Link>
                      <Link href={`/learn/${chapterId}`} className="w-full">
                        <Button variant="outline" className="w-full">
                          Review chapter
                        </Button>
                      </Link>
                    </>
                  )}
                </motion.div>
              </div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}

// ===========================================
// Simple Confetti Trigger (use anywhere)
// ===========================================

export function useConfetti() {
  const [isActive, setIsActive] = useState(false);

  const trigger = useCallback(() => {
    setIsActive(true);
    setTimeout(() => setIsActive(false), 4000);
  }, []);

  const ConfettiComponent = isActive ? Confetti : null;

  return { trigger, Confetti: ConfettiComponent };
}

// ===========================================
// Inline Success Message
// ===========================================

interface SuccessMessageProps {
  title: string;
  message?: string;
  className?: string;
}

export function SuccessMessage({
  title,
  message,
  className,
}: SuccessMessageProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className={cn(
        "flex items-center gap-4 p-6 rounded-xl bg-primary/5 border border-primary/20",
        className
      )}
    >
      <div className="flex items-center justify-center w-12 h-12 rounded-xl bg-primary/10">
        <Trophy className="w-6 h-6 text-primary" />
      </div>
      <div>
        <h4 className="font-semibold text-foreground">{title}</h4>
        {message && (
          <p className="text-sm text-muted-foreground mt-0.5">{message}</p>
        )}
      </div>
    </motion.div>
  );
}
