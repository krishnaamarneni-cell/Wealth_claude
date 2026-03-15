"use client";

import { useEffect, useState } from "react";
import { useCourse } from "@/lib/learn/CourseContext";
import { motion, AnimatePresence } from "framer-motion";
import { CheckCircle2, AlertCircle } from "lucide-react";

interface ProgressToastProps {
  duration?: number;
}

export function ProgressToast({ duration = 3000 }: ProgressToastProps) {
  const { state } = useCourse();
  const [show, setShow] = useState(false);
  const [lastCompletedChapter, setLastCompletedChapter] = useState<number | null>(null);

  // Calculate overall progress
  const overallProgress = state.chapters_completed.length > 0 
    ? Math.round((state.chapters_completed.length / 14) * 100)
    : 0;

  useEffect(() => {
    // Show toast when a chapter is completed
    if (state.chapters_completed.length > (lastCompletedChapter ? 1 : 0)) {
      setShow(true);
      const lastChapter = state.chapters_completed[state.chapters_completed.length - 1];
      setLastCompletedChapter(lastChapter);
      const timer = setTimeout(() => setShow(false), duration);
      return () => clearTimeout(timer);
    }
  }, [state.chapters_completed, duration, lastCompletedChapter]);

  return (
    <AnimatePresence>
      {show && lastCompletedChapter && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: 20 }}
          className="fixed bottom-4 right-4 max-w-sm z-50"
        >
          <div className="bg-card border border-border rounded-lg shadow-lg p-4 flex items-center gap-3">
            <CheckCircle2 className="w-5 h-5 text-primary flex-shrink-0" />
            <div className="flex-1">
              <p className="text-sm font-medium text-foreground">
                Chapter {lastCompletedChapter} Completed!
              </p>
              {overallProgress > 0 && (
                <p className="text-xs text-muted-foreground mt-1">
                  Overall Progress: {overallProgress}%
                </p>
              )}
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
