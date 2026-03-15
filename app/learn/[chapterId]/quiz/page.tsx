"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { motion } from "framer-motion";
import { ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useCourse } from "@/lib/learn/CourseContext";
import { getChapterById } from "@/lib/learn/chapters";
import { FinalQuiz } from "@/components/learn/FinalQuiz";
import type { Chapter } from "@/types/learn";

export default function QuizPage() {
  const params = useParams();
  const router = useRouter();
  const chapterId = Number(params.chapterId);
  const { state, isStateReady, markQuizPassed, unlockChapter } = useCourse();

  const [chapter, setChapter] = useState<Chapter | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Check unlock status with localStorage fallback
  const isUnlocked = (() => {
    if (state.chapters_unlocked.includes(chapterId)) return true;
    if (chapterId === 1) return true;
    
    if (typeof window !== "undefined") {
      try {
        const storedProgress = localStorage.getItem("wealthclaude_course_progress");
        if (storedProgress) {
          const progress = JSON.parse(storedProgress);
          if (progress.chapters_unlocked?.includes(chapterId)) return true;
        }
      } catch (e) {}
    }
    return false;
  })();

  const isCompleted = state.chapters_completed.includes(chapterId);

  // Load chapter data
  useEffect(() => {
    const loadChapter = async () => {
      setIsLoading(true);
      try {
        const chapterData = getChapterById(chapterId);
        setChapter(chapterData || null);
      } catch (error) {
        console.error("Error loading chapter:", error);
      } finally {
        setIsLoading(false);
      }
    };

    loadChapter();
  }, [chapterId]);

  // Redirect if not unlocked (wait for state to be ready)
  useEffect(() => {
    if (!isStateReady) return;
    if (!isLoading && !isUnlocked) {
      router.push("/learn");
    }
  }, [isStateReady, isLoading, isUnlocked, router]);

  // FIXED: Handle quiz completion with answers
  const handleQuizComplete = async (
    passed: boolean, 
    score: number, 
    answers: Record<string, number>
  ) => {
    // Update local state
    markQuizPassed(chapterId, "final", score);

    if (passed) {
      // Unlock next chapter
      const nextChapter = chapterId + 1;
      if (nextChapter <= 14) {
        unlockChapter(nextChapter);
      }
    }

    // ALWAYS save to server (whether passed or failed) for tracking
    if (state.user) {
      try {
        const response = await fetch("/api/learn/quiz", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            user_id: state.user.id,
            chapter_id: chapterId,
            quiz_type: "final",
            answers: answers, // FIXED: Now passing actual answers
          }),
        });

        const data = await response.json();
        
        if (!data.success) {
          console.error("Quiz API error:", data.error);
        } else {
          console.log("Quiz saved:", { score: data.score, passed: data.passed });
        }
      } catch (error) {
        console.error("Error saving quiz result:", error);
      }
    }
  };

  // Loading state
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

  // Chapter not found or no quiz
  if (!chapter || chapter.final_quiz.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen px-6">
        <h1 className="text-2xl font-bold text-foreground mb-4">
          Quiz not available
        </h1>
        <p className="text-muted-foreground mb-6">
          This quiz is not available yet or doesn't exist.
        </p>
        <Link href="/learn">
          <Button>Back to course</Button>
        </Link>
      </div>
    );
  }

  // Already completed
  if (isCompleted) {
    return (
      <div className="min-h-screen">
        {/* Header */}
        <header className="sticky top-0 z-40 bg-background/95 backdrop-blur border-b border-border px-6 py-4">
          <div className="max-w-3xl mx-auto flex items-center gap-4">
            <Link
              href={`/learn/${chapterId}`}
              className="flex items-center gap-2 text-muted-foreground hover:text-foreground transition-colors"
            >
              <ArrowLeft className="w-5 h-5" />
              <span className="text-sm">Back to chapter</span>
            </Link>
          </div>
        </header>

        <div className="max-w-3xl mx-auto px-6 py-12 text-center">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-primary/10 mb-6">
            <motion.span
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              className="text-3xl"
            >
              ✓
            </motion.span>
          </div>

          <h1 className="text-2xl font-bold text-foreground mb-2">
            Already completed!
          </h1>
          <p className="text-muted-foreground mb-8">
            You've already passed this quiz. Great job!
          </p>

          <div className="flex items-center justify-center gap-4">
            <Link href={`/learn/${chapterId}`}>
              <Button variant="outline">Review chapter</Button>
            </Link>
            {chapterId < 14 && (
              <Link href={`/learn/${chapterId + 1}`}>
                <Button>Continue to chapter {chapterId + 1}</Button>
              </Link>
            )}
            {chapterId === 14 && (
              <Link href="/learn/certificate">
                <Button>Get your certificate</Button>
              </Link>
            )}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen">
      {/* Header */}
      <header className="sticky top-0 z-40 bg-background/95 backdrop-blur border-b border-border px-6 py-4">
        <div className="max-w-3xl mx-auto flex items-center gap-4">
          <Link
            href={`/learn/${chapterId}`}
            className="flex items-center gap-2 text-muted-foreground hover:text-foreground transition-colors"
          >
            <ArrowLeft className="w-5 h-5" />
            <span className="text-sm">Back to chapter</span>
          </Link>
        </div>
      </header>

      {/* Quiz */}
      <div className="px-6 py-12">
        <FinalQuiz
          chapterId={chapterId}
          chapterTitle={chapter.title}
          questions={chapter.final_quiz}
          passThreshold={80}
          onComplete={handleQuizComplete}
        />
      </div>
    </div>
  );
}
