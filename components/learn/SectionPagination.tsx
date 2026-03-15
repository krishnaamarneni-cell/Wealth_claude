"use client";

import { motion } from "framer-motion";
import { ChevronLeft, ChevronRight, CheckCircle2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

interface SectionPaginationProps {
  currentSection: number;
  totalSections: number;
  onPrevious: () => void;
  onNext: () => void;
  onComplete?: () => void;
  isLastSection?: boolean;
  isSectionComplete?: boolean;
  className?: string;
}

export function SectionPagination({
  currentSection,
  totalSections,
  onPrevious,
  onNext,
  onComplete,
  isLastSection = false,
  isSectionComplete = false,
  className,
}: SectionPaginationProps) {
  const isFirstSection = currentSection === 1;
  const progress = (currentSection / totalSections) * 100;

  return (
    <div className={cn("mt-12 pt-8 border-t border-border", className)}>
      {/* Progress indicator */}
      <div className="mb-6">
        <div className="flex items-center justify-between text-sm text-muted-foreground mb-2">
          <span>Section {currentSection} of {totalSections}</span>
          <span>{Math.round(progress)}% complete</span>
        </div>
        <div className="h-1.5 bg-muted rounded-full overflow-hidden">
          <motion.div
            className="h-full bg-primary rounded-full"
            initial={{ width: 0 }}
            animate={{ width: `${progress}%` }}
            transition={{ duration: 0.3 }}
          />
        </div>
      </div>

      {/* Navigation buttons */}
      <div className="flex items-center justify-between gap-4">
        {/* Previous button */}
        <Button
          variant="outline"
          onClick={onPrevious}
          disabled={isFirstSection}
          className={cn(
            "gap-2",
            isFirstSection && "opacity-50 cursor-not-allowed"
          )}
        >
          <ChevronLeft className="w-4 h-4" />
          Previous
        </Button>

        {/* Section dots */}
        <div className="hidden sm:flex items-center gap-1.5">
          {Array.from({ length: totalSections }, (_, i) => {
            const sectionNum = i + 1;
            const isActive = sectionNum === currentSection;
            const isPast = sectionNum < currentSection;

            return (
              <motion.div
                key={sectionNum}
                className={cn(
                  "w-2 h-2 rounded-full transition-all",
                  isActive
                    ? "w-6 bg-primary"
                    : isPast
                    ? "bg-primary/50"
                    : "bg-muted"
                )}
                initial={false}
                animate={{
                  width: isActive ? 24 : 8,
                }}
                transition={{ duration: 0.2 }}
              />
            );
          })}
        </div>

        {/* Next/Complete button */}
        {isLastSection ? (
          <Button onClick={onComplete} className="gap-2">
            <CheckCircle2 className="w-4 h-4" />
            Take final quiz
          </Button>
        ) : (
          <Button onClick={onNext} className="gap-2">
            Next
            <ChevronRight className="w-4 h-4" />
          </Button>
        )}
      </div>
    </div>
  );
}

// ===========================================
// Chapter Navigation Header
// ===========================================

interface ChapterNavHeaderProps {
  chapterNumber: number;
  chapterTitle: string;
  currentSection: number;
  totalSections: number;
  onBack?: () => void;
  className?: string;
}

export function ChapterNavHeader({
  chapterNumber,
  chapterTitle,
  currentSection,
  totalSections,
  onBack,
  className,
}: ChapterNavHeaderProps) {
  return (
    <div className={cn("mb-8", className)}>
      {/* Breadcrumb */}
      <div className="flex items-center gap-2 text-sm text-muted-foreground mb-4">
        {onBack && (
          <>
            <button
              onClick={onBack}
              className="hover:text-foreground transition-colors"
            >
              Course
            </button>
            <ChevronRight className="w-4 h-4" />
          </>
        )}
        <span>Chapter {chapterNumber}</span>
        <ChevronRight className="w-4 h-4" />
        <span className="text-foreground">
          Section {currentSection} of {totalSections}
        </span>
      </div>

      {/* Chapter title */}
      <h1 className="text-2xl md:text-3xl font-bold text-foreground">
        {chapterTitle}
      </h1>

      {/* Progress bar */}
      <div className="mt-4 h-1 bg-muted rounded-full overflow-hidden">
        <motion.div
          className="h-full bg-primary rounded-full"
          initial={{ width: 0 }}
          animate={{ width: `${(currentSection / totalSections) * 100}%` }}
          transition={{ duration: 0.3 }}
        />
      </div>
    </div>
  );
}

// ===========================================
// Mobile Section Selector
// ===========================================

interface MobileSectionSelectorProps {
  currentSection: number;
  totalSections: number;
  completedSections: number[];
  onSelectSection: (section: number) => void;
  isOpen: boolean;
  onToggle: () => void;
  className?: string;
}

export function MobileSectionSelector({
  currentSection,
  totalSections,
  completedSections,
  onSelectSection,
  isOpen,
  onToggle,
  className,
}: MobileSectionSelectorProps) {
  return (
    <div className={cn("md:hidden", className)}>
      {/* Toggle button */}
      <button
        onClick={onToggle}
        className="flex items-center gap-2 text-sm text-muted-foreground mb-4"
      >
        <span>
          Section {currentSection} of {totalSections}
        </span>
        <ChevronRight
          className={cn(
            "w-4 h-4 transition-transform",
            isOpen && "rotate-90"
          )}
        />
      </button>

      {/* Section list */}
      {isOpen && (
        <motion.div
          initial={{ opacity: 0, height: 0 }}
          animate={{ opacity: 1, height: "auto" }}
          exit={{ opacity: 0, height: 0 }}
          className="bg-card border border-border rounded-lg p-2 mb-4"
        >
          {Array.from({ length: totalSections }, (_, i) => {
            const sectionNum = i + 1;
            const isCurrent = sectionNum === currentSection;
            const isCompleted = completedSections.includes(sectionNum);

            return (
              <button
                key={sectionNum}
                onClick={() => {
                  onSelectSection(sectionNum);
                  onToggle();
                }}
                className={cn(
                  "w-full flex items-center gap-3 px-3 py-2 rounded-lg text-sm transition-colors",
                  isCurrent
                    ? "bg-primary/10 text-primary"
                    : "hover:bg-muted text-foreground"
                )}
              >
                {isCompleted ? (
                  <CheckCircle2 className="w-4 h-4 text-primary" />
                ) : (
                  <div
                    className={cn(
                      "w-4 h-4 rounded-full border-2",
                      isCurrent ? "border-primary" : "border-muted-foreground"
                    )}
                  />
                )}
                <span>Section {sectionNum}</span>
              </button>
            );
          })}
        </motion.div>
      )}
    </div>
  );
}
