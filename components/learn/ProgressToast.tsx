"use client";

import { useEffect, useState } from "react";
import { useCourse } from "@/lib/learn/CourseContext";
import { motion, AnimatePresence } from "framer-motion";
import { CheckCircle2, AlertCircle } from "lucide-react";

interface ProgressToastProps {
  duration?: number;
}

export function ProgressToast({ duration = 3000 }: ProgressToastProps) {
  const { completionProgress, lastNotification } = useCourse();
  const [show, setShow] = useState(false);

  useEffect(() => {
    if (lastNotification) {
      setShow(true);
      const timer = setTimeout(() => setShow(false), duration);
      return () => clearTimeout(timer);
    }
  }, [lastNotification, duration]);

  return (
    <AnimatePresence>
      {show && lastNotification && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: 20 }}
          className="fixed bottom-4 right-4 max-w-sm z-50"
        >
          <div className="bg-card border border-border rounded-lg shadow-lg p-4 flex items-center gap-3">
            {lastNotification.type === "success" ? (
              <CheckCircle2 className="w-5 h-5 text-primary flex-shrink-0" />
            ) : (
              <AlertCircle className="w-5 h-5 text-amber-500 flex-shrink-0" />
            )}
            <div className="flex-1">
              <p className="text-sm font-medium text-foreground">
                {lastNotification.message}
              </p>
              {completionProgress !== undefined && (
                <p className="text-xs text-muted-foreground mt-1">
                  Progress: {Math.round(completionProgress)}%
                </p>
              )}
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
