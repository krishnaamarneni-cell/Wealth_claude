"use client";

import { useEffect } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { CourseProvider, useCourse } from "@/lib/learn/CourseContext";
import { 
  CourseSidebar, 
  MobileDrawer, 
  SidebarContent,
  useMobileNav 
} from "@/components/learn/CourseSidebar";
import { ProgressToast } from "@/components/learn/ProgressToast";
import { Menu, ChevronLeft, Loader2 } from "lucide-react";

// ===========================================
// Mobile Header
// ===========================================

interface MobileHeaderProps {
  onMenuClick: () => void;
  currentChapter?: number;
}

function MobileHeader({ onMenuClick, currentChapter }: MobileHeaderProps) {
  const { chapters } = useCourse();
  
  // Safe find with proper null checking
  const chapter = currentChapter && Array.isArray(chapters) && chapters.length > 0
    ? chapters.find(c => c.id === currentChapter) 
    : null;

  return (
    <header className="lg:hidden sticky top-0 z-30 flex items-center gap-3 px-4 py-3 bg-background/95 backdrop-blur-sm border-b border-border">
      <button
        onClick={onMenuClick}
        className="p-2 -ml-2 rounded-lg hover:bg-muted transition-colors"
        aria-label="Open navigation menu"
      >
        <Menu className="w-5 h-5" />
      </button>
      
      <div className="flex-1 min-w-0">
        {chapter ? (
          <div className="flex items-center gap-2">
            <Link 
              href="/learn" 
              className="text-muted-foreground hover:text-foreground transition-colors"
              aria-label="Back to course overview"
            >
              <ChevronLeft className="w-4 h-4" />
            </Link>
            <span className="text-sm font-medium truncate">
              Ch {chapter.id}: {chapter.title}
            </span>
          </div>
        ) : (
          <Link href="/learn" className="font-semibold text-primary">
            FIRE Course
          </Link>
        )}
      </div>
    </header>
  );
}

// ===========================================
// Loading Skeleton
// ===========================================

function LoadingSkeleton() {
  return (
    <div className="flex items-center justify-center min-h-[50vh]">
      <div className="flex flex-col items-center gap-3">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
        <p className="text-sm text-muted-foreground">Loading course...</p>
      </div>
    </div>
  );
}

// ===========================================
// Inner Layout (needs context)
// ===========================================

function LearnLayoutInner({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const { isLoading } = useCourse();
  const mobileNav = useMobileNav();

  // Extract current chapter from URL
  const chapterMatch = pathname.match(/\/learn\/(\d+)/);
  const currentChapter = chapterMatch ? parseInt(chapterMatch[1]) : undefined;

  // Check if we're on the landing page
  const isLandingPage = pathname === "/learn";

  // Close mobile nav on route change
  useEffect(() => {
    mobileNav.close();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pathname]);

  return (
    <div className="flex min-h-screen bg-background">
      {/* Desktop Sidebar - Hidden on mobile and on landing page */}
      {!isLandingPage && (
        <CourseSidebar className="sticky top-0 h-screen" />
      )}

      {/* Mobile Drawer - Only show when not on landing page */}
      {!isLandingPage && (
        <MobileDrawer isOpen={mobileNav.isOpen} onClose={mobileNav.close}>
          <SidebarContent onNavigate={mobileNav.close} showCollapse={false} />
        </MobileDrawer>
      )}

      {/* Main Content Area */}
      <div className="flex-1 min-w-0 flex flex-col">
        {/* Mobile Header - Only show when not on landing page */}
        {!isLandingPage && (
          <MobileHeader 
            onMenuClick={mobileNav.toggle} 
            currentChapter={currentChapter}
          />
        )}

        {/* Page Content */}
        <main className="flex-1">
          {isLoading && !isLandingPage ? <LoadingSkeleton /> : children}
        </main>
      </div>

      {/* Progress Saved Toast */}
      <ProgressToast />
    </div>
  );
}

// ===========================================
// Main Layout (provides context)
// ===========================================

export default function LearnLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <CourseProvider>
      <LearnLayoutInner>{children}</LearnLayoutInner>
    </CourseProvider>
  );
}
