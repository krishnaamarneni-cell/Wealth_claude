"use client";

import { motion } from "framer-motion";
import { cn } from "@/lib/utils";

interface ProgressBarProps {
  progress: number; // 0-100
  label?: string;
  showPercentage?: boolean;
  size?: "sm" | "md" | "lg";
  variant?: "default" | "success" | "warning";
  className?: string;
  animate?: boolean;
}

export function ProgressBar({
  progress,
  label,
  showPercentage = true,
  size = "md",
  variant = "default",
  className,
  animate = true,
}: ProgressBarProps) {
  const clampedProgress = Math.min(100, Math.max(0, progress));

  const sizeClasses = {
    sm: "h-1.5",
    md: "h-2",
    lg: "h-3",
  };

  const variantClasses = {
    default: "bg-primary",
    success: "bg-emerald-500",
    warning: "bg-amber-500",
  };

  return (
    <div className={cn("w-full", className)}>
      {/* Label and percentage */}
      {(label || showPercentage) && (
        <div className="flex items-center justify-between mb-1.5">
          {label && (
            <span className="text-sm text-muted-foreground">{label}</span>
          )}
          {showPercentage && (
            <span className="text-sm font-medium text-foreground">
              {Math.round(clampedProgress)}%
            </span>
          )}
        </div>
      )}

      {/* Progress bar track */}
      <div
        className={cn(
          "w-full bg-muted rounded-full overflow-hidden",
          sizeClasses[size]
        )}
      >
        {/* Progress bar fill */}
        {animate ? (
          <motion.div
            className={cn("h-full rounded-full", variantClasses[variant])}
            initial={{ width: 0 }}
            animate={{ width: `${clampedProgress}%` }}
            transition={{ duration: 0.5, ease: "easeOut" }}
          />
        ) : (
          <div
            className={cn("h-full rounded-full", variantClasses[variant])}
            style={{ width: `${clampedProgress}%` }}
          />
        )}
      </div>
    </div>
  );
}

// ===========================================
// Section Progress (dots style)
// ===========================================

interface SectionProgressProps {
  current: number;
  total: number;
  completed?: number[];
  className?: string;
}

export function SectionProgress({
  current,
  total,
  completed = [],
  className,
}: SectionProgressProps) {
  return (
    <div className={cn("flex items-center gap-1.5", className)}>
      {Array.from({ length: total }, (_, i) => {
        const sectionNum = i + 1;
        const isCompleted = completed.includes(sectionNum);
        const isCurrent = current === sectionNum;

        return (
          <div
            key={sectionNum}
            className={cn(
              "w-2 h-2 rounded-full transition-all",
              isCompleted
                ? "bg-primary"
                : isCurrent
                ? "bg-primary/50 ring-2 ring-primary/30"
                : "bg-muted"
            )}
          />
        );
      })}
    </div>
  );
}

// ===========================================
// Chapter Progress Card
// ===========================================

interface ChapterProgressCardProps {
  chapterNumber: number;
  title: string;
  progress: number;
  sectionsCompleted: number;
  totalSections: number;
  isCompleted: boolean;
  className?: string;
}

export function ChapterProgressCard({
  chapterNumber,
  title,
  progress,
  sectionsCompleted,
  totalSections,
  isCompleted,
  className,
}: ChapterProgressCardProps) {
  return (
    <div
      className={cn(
        "p-4 rounded-xl border transition-all",
        isCompleted
          ? "bg-primary/5 border-primary/20"
          : "bg-card border-border",
        className
      )}
    >
      <div className="flex items-center justify-between mb-3">
        <div>
          <span className="text-xs text-muted-foreground">
            Chapter {chapterNumber}
          </span>
          <h4 className="font-medium text-foreground">{title}</h4>
        </div>
        {isCompleted && (
          <span className="text-xs font-medium text-primary bg-primary/10 px-2 py-1 rounded-full">
            Completed
          </span>
        )}
      </div>

      <ProgressBar
        progress={progress}
        showPercentage={false}
        size="sm"
        variant={isCompleted ? "success" : "default"}
      />

      <div className="flex items-center justify-between mt-2">
        <span className="text-xs text-muted-foreground">
          {sectionsCompleted} of {totalSections} sections
        </span>
        <span className="text-xs font-medium text-foreground">
          {Math.round(progress)}%
        </span>
      </div>
    </div>
  );
}
