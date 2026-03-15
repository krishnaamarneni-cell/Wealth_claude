"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import {
  ChevronLeft,
  ChevronRight,
  Lock,
  CheckCircle2,
  Circle,
  BookOpen,
  Trophy,
  Flame,
} from "lucide-react";
import { useCourse } from "@/lib/learn/CourseContext";
import { cn } from "@/lib/utils";

// ===========================================
// Chapter Data
// ===========================================

const chapters = [
  // Phase 1: Foundation
  { id: 1, title: "Your money blueprint", phase: 1, phaseName: "Foundation" },
  { id: 2, title: "Banking & saving smartly", phase: 1, phaseName: "Foundation" },
  { id: 3, title: "Conquering debt", phase: 1, phaseName: "Foundation" },
  // Phase 2: Protection
  { id: 4, title: "Your financial safety net", phase: 2, phaseName: "Protection" },
  // Phase 3: Investing
  { id: 5, title: "The eighth wonder", phase: 3, phaseName: "Investing" },
  { id: 6, title: "Stock market demystified", phase: 3, phaseName: "Investing" },
  { id: 7, title: "Investment vehicles", phase: 3, phaseName: "Investing" },
  // Phase 4: Optimization
  { id: 8, title: "Tax fundamentals", phase: 4, phaseName: "Optimization" },
  { id: 9, title: "Tax strategies", phase: 4, phaseName: "Optimization" },
  { id: 10, title: "Building income streams", phase: 4, phaseName: "Optimization" },
  // Phase 5: FIRE
  { id: 11, title: "Understanding FIRE", phase: 5, phaseName: "FIRE Path" },
  { id: 12, title: "Your FIRE number", phase: 5, phaseName: "FIRE Path" },
  { id: 13, title: "FIRE investment strategy", phase: 5, phaseName: "FIRE Path" },
  { id: 14, title: "Executing your plan", phase: 5, phaseName: "FIRE Path" },
];

const phaseColors: Record<number, string> = {
  1: "text-emerald-400",
  2: "text-blue-400",
  3: "text-amber-400",
  4: "text-orange-400",
  5: "text-red-400",
};

const phaseIcons: Record<number, React.ReactNode> = {
  1: <BookOpen className="w-4 h-4" />,
  2: <Circle className="w-4 h-4" />,
  3: <Flame className="w-4 h-4" />,
  4: <Circle className="w-4 h-4" />,
  5: <Trophy className="w-4 h-4" />,
};

// ===========================================
// Component
// ===========================================

interface CourseSidebarProps {
  className?: string;
}

export function CourseSidebar({ className }: CourseSidebarProps) {
  const pathname = usePathname();
  const { state } = useCourse();
  const [isCollapsed, setIsCollapsed] = useState(false);

  const { chapters_unlocked, chapters_completed, progress_by_chapter } = state;

  // Group chapters by phase
  const phases = chapters.reduce((acc, chapter) => {
    if (!acc[chapter.phase]) {
      acc[chapter.phase] = {
        name: chapter.phaseName,
        chapters: [],
      };
    }
    acc[chapter.phase].chapters.push(chapter);
    return acc;
  }, {} as Record<number, { name: string; chapters: typeof chapters }>);

  // Get current chapter from URL
  const currentChapterId = pathname.match(/\/learn\/(\d+)/)?.[1];

  return (
    <aside
      className={cn(
        "flex flex-col border-r border-border bg-card/50 transition-all duration-300",
        isCollapsed ? "w-16" : "w-72",
        className
      )}
    >
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b border-border">
        {!isCollapsed && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          >
            <h2 className="font-semibold text-foreground">FIRE Course</h2>
            <p className="text-xs text-muted-foreground">
              {chapters_completed.length} of 14 completed
            </p>
          </motion.div>
        )}
        <button
          onClick={() => setIsCollapsed(!isCollapsed)}
          className="p-1.5 rounded-md hover:bg-muted transition-colors"
        >
          {isCollapsed ? (
            <ChevronRight className="w-4 h-4 text-muted-foreground" />
          ) : (
            <ChevronLeft className="w-4 h-4 text-muted-foreground" />
          )}
        </button>
      </div>

      {/* Overall Progress */}
      {!isCollapsed && (
        <div className="px-4 py-3 border-b border-border">
          <div className="flex items-center justify-between text-xs text-muted-foreground mb-1.5">
            <span>Overall progress</span>
            <span>{Math.round((chapters_completed.length / 14) * 100)}%</span>
          </div>
          <div className="h-2 bg-muted rounded-full overflow-hidden">
            <motion.div
              className="h-full bg-primary rounded-full"
              initial={{ width: 0 }}
              animate={{
                width: `${(chapters_completed.length / 14) * 100}%`,
              }}
              transition={{ duration: 0.5, ease: "easeOut" }}
            />
          </div>
        </div>
      )}

      {/* Chapters List */}
      <nav className="flex-1 overflow-y-auto py-2">
        <AnimatePresence mode="wait">
          {Object.entries(phases).map(([phaseNum, phase]) => (
            <div key={phaseNum} className="mb-2">
              {/* Phase Header */}
              {!isCollapsed && (
                <div
                  className={cn(
                    "px-4 py-1.5 text-xs font-medium uppercase tracking-wider",
                    phaseColors[Number(phaseNum)]
                  )}
                >
                  Phase {phaseNum}: {phase.name}
                </div>
              )}

              {/* Chapter Links */}
              <ul className="space-y-0.5 px-2">
                {phase.chapters.map((chapter) => {
                  const isUnlocked = chapters_unlocked.includes(chapter.id);
                  const isCompleted = chapters_completed.includes(chapter.id);
                  const isCurrent = currentChapterId === String(chapter.id);
                  const progress = progress_by_chapter[chapter.id];
                  const percentage = progress?.percentage || 0;

                  return (
                    <li key={chapter.id}>
                      {isUnlocked ? (
                        <Link
                          href={`/learn/${chapter.id}`}
                          className={cn(
                            "flex items-center gap-3 px-3 py-2.5 rounded-lg transition-all",
                            isCurrent
                              ? "bg-primary/10 text-primary"
                              : "text-foreground hover:bg-muted",
                            isCollapsed && "justify-center"
                          )}
                        >
                          {/* Status Icon */}
                          <span className="flex-shrink-0">
                            {isCompleted ? (
                              <CheckCircle2 className="w-5 h-5 text-primary" />
                            ) : (
                              <div className="relative w-5 h-5">
                                <svg className="w-5 h-5 -rotate-90">
                                  <circle
                                    cx="10"
                                    cy="10"
                                    r="8"
                                    fill="none"
                                    stroke="currentColor"
                                    strokeWidth="2"
                                    className="text-muted"
                                  />
                                  <circle
                                    cx="10"
                                    cy="10"
                                    r="8"
                                    fill="none"
                                    stroke="currentColor"
                                    strokeWidth="2"
                                    strokeDasharray={`${percentage * 0.5} 50`}
                                    className="text-primary"
                                  />
                                </svg>
                              </div>
                            )}
                          </span>

                          {/* Chapter Info */}
                          {!isCollapsed && (
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center gap-2">
                                <span className="text-xs text-muted-foreground">
                                  {chapter.id}.
                                </span>
                                <span className="text-sm font-medium truncate">
                                  {chapter.title}
                                </span>
                              </div>
                              {!isCompleted && percentage > 0 && (
                                <span className="text-xs text-muted-foreground">
                                  {percentage}% complete
                                </span>
                              )}
                            </div>
                          )}
                        </Link>
                      ) : (
                        <div
                          className={cn(
                            "flex items-center gap-3 px-3 py-2.5 rounded-lg text-muted-foreground/50 cursor-not-allowed",
                            isCollapsed && "justify-center"
                          )}
                        >
                          <Lock className="w-5 h-5 flex-shrink-0" />
                          {!isCollapsed && (
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center gap-2">
                                <span className="text-xs">{chapter.id}.</span>
                                <span className="text-sm truncate">
                                  {chapter.title}
                                </span>
                              </div>
                              <span className="text-xs">Locked</span>
                            </div>
                          )}
                        </div>
                      )}
                    </li>
                  );
                })}
              </ul>
            </div>
          ))}
        </AnimatePresence>
      </nav>

      {/* Footer */}
      {!isCollapsed && (
        <div className="p-4 border-t border-border">
          <div className="text-xs text-muted-foreground text-center">
            <span className="text-primary font-medium">
              {chapters_completed.length === 14
                ? "🎉 Course completed!"
                : `${14 - chapters_completed.length} chapters remaining`}
            </span>
          </div>
        </div>
      )}
    </aside>
  );
}
