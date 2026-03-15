"use client";

import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useCourse } from "@/lib/learn/CourseContext";
import { getChapterById } from "@/lib/learn/chapters";

export default function QuizPage() {
  const params = useParams();
  const router = useRouter();
  const chapterId = Number(params.chapterId);
  const { state } = useCourse();

  const chapter = getChapterById(chapterId);
  const isUnlocked = state.chapters_unlocked.includes(chapterId);

  // Redirect if not unlocked
  if (!isUnlocked) {
    router.push("/learn");
    return null;
  }

  if (!chapter) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen px-6">
        <h1 className="text-2xl font-bold text-foreground mb-4">
          Quiz not found
        </h1>
        <Link href="/learn">
          <Button>Back to course</Button>
        </Link>
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

      {/* Quiz Content - Placeholder for Phase 4 */}
      <div className="max-w-3xl mx-auto px-6 py-12">
        <h1 className="text-2xl font-bold text-foreground mb-2">
          Chapter {chapterId} Final Quiz
        </h1>
        <p className="text-muted-foreground mb-8">
          {chapter.title}
        </p>

        <div className="p-8 rounded-xl border border-border bg-card text-center">
          <p className="text-lg text-muted-foreground mb-4">
            Quiz component will be built in Phase 4
          </p>
          <p className="text-sm text-muted-foreground">
            {chapter.final_quiz.length} questions • 80% to pass
          </p>
        </div>

        {/* Temporary: Skip quiz button */}
        <div className="mt-8 text-center">
          <Button
            variant="outline"
            onClick={() => router.push("/learn")}
          >
            Return to course overview
          </Button>
        </div>
      </div>
    </div>
  );
}
