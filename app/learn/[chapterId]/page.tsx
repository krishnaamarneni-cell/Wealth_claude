"use client";

import { useState, useEffect, useCallback } from "react";
import { useParams, useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { ArrowLeft, Menu, X } from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { useCourse } from "@/lib/learn/CourseContext";
import { ChapterContent } from "@/components/learn/ChapterContent";
import {
  SectionPagination,
  ChapterNavHeader,
} from "@/components/learn/SectionPagination";
import { CourseSidebar } from "@/components/learn/CourseSidebar";
import { cn } from "@/lib/utils";
import { getChapterById } from "@/lib/learn/chapters";
import type { Chapter } from "@/types/learn";

export default function ChapterPage() {
  const params = useParams();
  const router = useRouter();
  const chapterId = Number(params.chapterId);

  const {
    state,
    isStateReady, // NEW: Wait for state to be ready before checking unlock
    markSectionComplete,
    setCurrentPosition,
  } = useCourse();

  const [chapter, setChapter] = useState<Chapter | null>(null);
  const [currentSection, setCurrentSection] = useState(1);
  const [isLoading, setIsLoading] = useState(true);
  const [isMobileSidebarOpen, setIsMobileSidebarOpen] = useState(false);

  // Load chapter data
  useEffect(() => {
    const loadChapter = async () => {
      setIsLoading(true);
      try {
        const chapterData = getChapterById(chapterId);
        if (chapterData) {
          setChapter(chapterData);

          // Find the first incomplete section or start at 1
          const chapterProgress = state.progress_by_chapter[chapterId];
          if (chapterProgress?.sections_completed.length) {
            const lastCompleted = Math.max(...chapterProgress.sections_completed);
            const nextSection = Math.min(lastCompleted + 1, chapterData.sections.length);
            setCurrentSection(nextSection);
          } else {
            setCurrentSection(1);
          }
        }
      } catch (error) {
        console.error("Error loading chapter:", error);
      } finally {
        setIsLoading(false);
      }
    };

    loadChapter();
  }, [chapterId, state.progress_by_chapter]);

  // Update current position in context
  useEffect(() => {
    if (chapter) {
      setCurrentPosition(chapterId, currentSection);
    }
  }, [chapterId, currentSection, chapter, setCurrentPosition]);

  // Check if chapter is unlocked - FIXED: Also check localStorage directly
  const isUnlocked = (() => {
    // First check state
    if (state.chapters_unlocked.includes(chapterId)) {
      return true;
    }
    
    // Chapter 1 is always unlocked
    if (chapterId === 1) {
      return true;
    }
    
    // Also check localStorage directly (in case state hasn't synced yet)
    if (typeof window !== "undefined") {
      try {
        const storedProgress = localStorage.getItem("wealthclaude_course_progress");
        if (storedProgress) {
          const progress = JSON.parse(storedProgress);
          if (progress.chapters_unlocked?.includes(chapterId)) {
            return true;
          }
        }
      } catch (e) {
        // Ignore errors
      }
    }
    
    return false;
  })();

  // FIXED: Only redirect if state is ready AND chapter is locked
  useEffect(() => {
    // Don't redirect until state is fully loaded
    if (!isStateReady) {
      return;
    }
    
    // Don't redirect while still loading chapter data
    if (isLoading) {
      return;
    }
    
    // Only redirect if chapter is actually locked
    if (!isUnlocked) {
      console.log(`Chapter ${chapterId} is locked, redirecting to /learn`);
      router.push("/learn");
    }
  }, [isStateReady, isLoading, isUnlocked, chapterId, router]);

  // Navigation handlers
  const handlePrevious = useCallback(() => {
    if (currentSection > 1) {
      setCurrentSection((prev) => prev - 1);
      window.scrollTo({ top: 0, behavior: "smooth" });
    }
  }, [currentSection]);

  const handleNext = useCallback(() => {
    if (chapter && currentSection < chapter.sections.length) {
      // Mark current section as complete
      markSectionComplete(chapterId, currentSection);
      setCurrentSection((prev) => prev + 1);
      window.scrollTo({ top: 0, behavior: "smooth" });
    }
  }, [chapter, currentSection, chapterId, markSectionComplete]);

  const handleComplete = useCallback(() => {
    // Mark last section as complete
    markSectionComplete(chapterId, currentSection);
    // Navigate to final quiz
    router.push(`/learn/${chapterId}/quiz`);
  }, [chapterId, currentSection, markSectionComplete, router]);

  // Loading state - show while state is loading OR chapter is loading
  if (!isStateReady || isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <motion.div
          animate={{ rotate: 360 }}
          transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
          className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full"
        />
      </div>
    );
  }

  // Chapter not found
  if (!chapter) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen px-6">
        <h1 className="text-2xl font-bold text-foreground mb-4">
          Chapter not found
        </h1>
        <p className="text-muted-foreground mb-6">
          This chapter doesn't exist or hasn't been created yet.
        </p>
        <Link href="/learn">
          <Button>Back to course</Button>
        </Link>
      </div>
    );
  }

  const currentSectionData = chapter.sections[currentSection - 1];
  const totalSections = chapter.sections.length;
  const isLastSection = currentSection === totalSections;
  const completedSections = state.progress_by_chapter[chapterId]?.sections_completed || [];

  return (
    <div className="min-h-screen">
      {/* Mobile header */}
      <header className="md:hidden sticky top-0 z-40 bg-background/95 backdrop-blur border-b border-border px-4 py-3">
        <div className="flex items-center justify-between">
          <Link
            href="/learn"
            className="flex items-center gap-2 text-muted-foreground hover:text-foreground transition-colors"
          >
            <ArrowLeft className="w-5 h-5" />
            <span className="text-sm">Course</span>
          </Link>

          <span className="text-sm font-medium text-foreground">
            Chapter {chapterId}
          </span>

          <button
            onClick={() => setIsMobileSidebarOpen(!isMobileSidebarOpen)}
            className="p-2 hover:bg-muted rounded-lg transition-colors"
          >
            {isMobileSidebarOpen ? (
              <X className="w-5 h-5" />
            ) : (
              <Menu className="w-5 h-5" />
            )}
          </button>
        </div>

        {/* Progress bar */}
        <div className="mt-3 h-1 bg-muted rounded-full overflow-hidden">
          <motion.div
            className="h-full bg-primary rounded-full"
            animate={{ width: `${(currentSection / totalSections) * 100}%` }}
            transition={{ duration: 0.3 }}
          />
        </div>
      </header>

      {/* Mobile sidebar overlay */}
      <AnimatePresence>
        {isMobileSidebarOpen && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="md:hidden fixed inset-0 bg-black/50 z-40"
              onClick={() => setIsMobileSidebarOpen(false)}
            />
            <motion.div
              initial={{ x: "100%" }}
              animate={{ x: 0 }}
              exit={{ x: "100%" }}
              transition={{ type: "spring", damping: 25, stiffness: 200 }}
              className="md:hidden fixed right-0 top-0 bottom-0 w-72 z-50 bg-background border-l border-border"
            >
              <CourseSidebar />
            </motion.div>
          </>
        )}
      </AnimatePresence>

      {/* Main content */}
      <div className="max-w-4xl mx-auto">
        {/* Desktop header */}
        <div className="hidden md:block px-6 pt-8">
          <ChapterNavHeader
            chapterNumber={chapterId}
            chapterTitle={chapter.title}
            currentSection={currentSection}
            totalSections={totalSections}
            onBack={() => router.push("/learn")}
          />
        </div>

        {/* Section content */}
        <AnimatePresence mode="wait">
          <motion.div
            key={currentSection}
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            transition={{ duration: 0.3 }}
          >
            <ChapterContent
              section={currentSectionData}
              onMiniQuizComplete={(passed, score) => {
                console.log("Mini quiz completed:", { passed, score });
              }}
            />
          </motion.div>
        </AnimatePresence>

        {/* Pagination */}
        <div className="px-6 pb-12 md:px-8 lg:px-12">
          <SectionPagination
            currentSection={currentSection}
            totalSections={totalSections}
            onPrevious={handlePrevious}
            onNext={handleNext}
            onComplete={handleComplete}
            isLastSection={isLastSection}
            isSectionComplete={completedSections.includes(currentSection)}
          />
        </div>
      </div>
    </div>
  );
}
