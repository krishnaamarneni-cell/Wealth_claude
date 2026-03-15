"use client";

import { useState, useEffect } from "react";
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
  Menu,
  X,
  Award,
  Shield,
  TrendingUp,
  Settings,
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
  3: "text-purple-400",
  4: "text-amber-400",
  5: "text-red-400",
};

const phaseBgColors: Record<number, string> = {
  1: "bg-emerald-400/10",
  2: "bg-blue-400/10",
  3: "bg-purple-400/10",
  4: "bg-amber-400/10",
  5: "bg-red-400/10",
};

const phaseIcons: Record<number, React.ReactNode> = {
  1: <BookOpen className="w-4 h-4" />,
  2: <Shield className="w-4 h-4" />,
  3: <TrendingUp className="w-4 h-4" />,
  4: <Settings className="w-4 h-4" />,
  5: <Flame className="w-4 h-4" />,
};

// ===========================================
// Mobile Menu Button (for header)
// ===========================================

interface MobileMenuButtonProps {
  onClick: () => void;
  isOpen: boolean;
  className?: string;
}

export function MobileMenuButton({ onClick, isOpen, className }: MobileMenuButtonProps) {
  return (
    <button
      onClick={onClick}
      className={cn(
        "lg:hidden p-2 rounded-lg hover:bg-muted transition-colors",
        className
      )}
      aria-label={isOpen ? "Close menu" : "Open menu"}
      aria-expanded={isOpen}
    >
      {isOpen ? (
        <X className="w-5 h-5" />
      ) : (
        <Menu className="w-5 h-5" />
      )}
    </button>
  );
}

// ===========================================
// Mobile Drawer
// ===========================================

interface MobileDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  children: React.ReactNode;
}

export function MobileDrawer({ isOpen, onClose, children }: MobileDrawerProps) {
  // Close on escape key
  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    
    if (isOpen) {
      document.addEventListener("keydown", handleEscape);
      document.body.style.overflow = "hidden";
    }
    
    return () => {
      document.removeEventListener("keydown", handleEscape);
      document.body.style.overflow = "";
    };
  }, [isOpen, onClose]);

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            onClick={onClose}
            className="fixed inset-0 bg-black/60 backdrop-blur-sm z-40 lg:hidden"
            aria-hidden="true"
          />
          
          {/* Drawer */}
          <motion.div
            initial={{ x: "-100%" }}
            animate={{ x: 0 }}
            exit={{ x: "-100%" }}
            transition={{ type: "spring", damping: 25, stiffness: 300 }}
            className="fixed inset-y-0 left-0 w-[85%] max-w-sm bg-background border-r border-border z-50 lg:hidden overflow-hidden"
            role="dialog"
            aria-modal="true"
            aria-label="Navigation menu"
          >
            {/* Close button */}
            <button
              onClick={onClose}
              className="absolute top-4 right-4 p-2 rounded-lg hover:bg-muted transition-colors"
              aria-label="Close menu"
            >
              <X className="w-5 h-5" />
            </button>
            
            {children}
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}

// ===========================================
// Sidebar Content (shared between desktop & mobile)
// ===========================================

interface SidebarContentProps {
  onNavigate?: () => void;
  showCollapse?: boolean;
  isCollapsed?: boolean;
  onCollapse?: () => void;
}

export function SidebarContent({ 
  onNavigate, 
  showCollapse = true,
  isCollapsed = false,
  onCollapse 
}: SidebarContentProps) {
  const pathname = usePathname();
  const { state } = useCourse();
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
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b border-border">
        {!isCollapsed && (
          <div>
            <Link 
              href="/learn" 
              onClick={onNavigate}
              className="font-semibold text-foreground hover:text-primary transition-colors"
            >
              FIRE Course
            </Link>
            <p className="text-xs text-muted-foreground">
              {chapters_completed.length} of 14 completed
            </p>
          </div>
        )}
        {showCollapse && onCollapse && (
          <button
            onClick={onCollapse}
            className="p-1.5 rounded-md hover:bg-muted transition-colors"
            aria-label={isCollapsed ? "Expand sidebar" : "Collapse sidebar"}
          >
            {isCollapsed ? (
              <ChevronRight className="w-4 h-4 text-muted-foreground" />
            ) : (
              <ChevronLeft className="w-4 h-4 text-muted-foreground" />
            )}
          </button>
        )}
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
      <nav className="flex-1 overflow-y-auto py-2" aria-label="Course chapters">
        {Object.entries(phases).map(([phaseNum, phase]) => (
          <div key={phaseNum} className="mb-2">
            {/* Phase Header */}
            {!isCollapsed && (
              <div
                className={cn(
                  "flex items-center gap-2 px-4 py-2 text-xs font-medium uppercase tracking-wider",
                  phaseColors[Number(phaseNum)]
                )}
              >
                <span className={cn("p-1 rounded", phaseBgColors[Number(phaseNum)])}>
                  {phaseIcons[Number(phaseNum)]}
                </span>
                <span>Phase {phaseNum}: {phase.name}</span>
              </div>
            )}

            {/* Chapter Links */}
            <ul className="space-y-0.5 px-2" role="list">
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
                        onClick={onNavigate}
                        className={cn(
                          "flex items-center gap-3 px-3 py-2.5 rounded-lg transition-all",
                          "focus:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 focus-visible:ring-offset-background",
                          isCurrent
                            ? "bg-primary/10 text-primary"
                            : "text-foreground hover:bg-muted",
                          isCollapsed && "justify-center"
                        )}
                        aria-current={isCurrent ? "page" : undefined}
                      >
                        {/* Status Icon */}
                        <span className="flex-shrink-0" aria-hidden="true">
                          {isCompleted ? (
                            <CheckCircle2 className="w-5 h-5 text-primary" />
                          ) : (
                            <div className="relative w-5 h-5">
                              <svg className="w-5 h-5 -rotate-90" aria-hidden="true">
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
                        
                        {/* Screen reader text */}
                        <span className="sr-only">
                          {isCompleted ? "(Completed)" : percentage > 0 ? `(${percentage}% complete)` : ""}
                        </span>
                      </Link>
                    ) : (
                      <div
                        className={cn(
                          "flex items-center gap-3 px-3 py-2.5 rounded-lg text-muted-foreground/50 cursor-not-allowed",
                          isCollapsed && "justify-center"
                        )}
                        aria-disabled="true"
                      >
                        <Lock className="w-5 h-5 flex-shrink-0" aria-hidden="true" />
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
                        <span className="sr-only">Chapter locked</span>
                      </div>
                    )}
                  </li>
                );
              })}
            </ul>
          </div>
        ))}
      </nav>

      {/* Footer - Certificate Link */}
      {!isCollapsed && (
        <div className="p-4 border-t border-border space-y-3">
          {chapters_completed.length === 14 && (
            <Link
              href="/learn/certificate"
              onClick={onNavigate}
              className="flex items-center gap-2 px-3 py-2 rounded-lg bg-primary/10 text-primary hover:bg-primary/20 transition-colors"
            >
              <Award className="w-4 h-4" />
              <span className="text-sm font-medium">View Certificate</span>
            </Link>
          )}
          <div className="text-xs text-muted-foreground text-center">
            <span className="text-primary font-medium">
              {chapters_completed.length === 14
                ? "🎉 Course completed!"
                : `${14 - chapters_completed.length} chapters remaining`}
            </span>
          </div>
        </div>
      )}
    </div>
  );
}

// ===========================================
// Main Sidebar Component
// ===========================================

interface CourseSidebarProps {
  className?: string;
}

export function CourseSidebar({ className }: CourseSidebarProps) {
  const [isCollapsed, setIsCollapsed] = useState(false);

  return (
    <aside
      className={cn(
        "hidden lg:flex flex-col border-r border-border bg-card/50 transition-all duration-300",
        isCollapsed ? "w-16" : "w-72",
        className
      )}
    >
      <SidebarContent
        showCollapse={true}
        isCollapsed={isCollapsed}
        onCollapse={() => setIsCollapsed(!isCollapsed)}
      />
    </aside>
  );
}

// ===========================================
// Mobile Navigation Hook
// ===========================================

export function useMobileNav() {
  const [isOpen, setIsOpen] = useState(false);
  
  const open = () => setIsOpen(true);
  const close = () => setIsOpen(false);
  const toggle = () => setIsOpen(!isOpen);
  
  return { isOpen, open, close, toggle };
}
