"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { CourseProvider, useCourse } from "@/lib/learn/CourseContext";
import {
  CourseSidebar,
  MobileDrawer,
  SidebarContent,
  useMobileNav
} from "@/components/learn/CourseSidebar";
import { EmailCaptureModal } from "@/components/learn/EmailCaptureModal";
import { Menu, ChevronLeft, Loader2 } from "lucide-react";
import type { CourseUser } from "@/types/learn";

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
  const { state, setUser, isLoading } = useCourse();
  const [showEmailModal, setShowEmailModal] = useState(false);
  const [hasCheckedUser, setHasCheckedUser] = useState(false);
  const mobileNav = useMobileNav();

  // Extract current chapter from URL
  const chapterMatch = pathname.match(/\/learn\/(\d+)/);
  const currentChapter = chapterMatch ? parseInt(chapterMatch[1]) : undefined;

  // Close mobile nav on route change
  useEffect(() => {
    mobileNav.close();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pathname]);

  // Check for existing user on mount
  useEffect(() => {
    if (!isLoading && !hasCheckedUser) {
      setHasCheckedUser(true);

      // Show modal if no user after a short delay
      if (!state.user) {
        const timer = setTimeout(() => {
          setShowEmailModal(true);
        }, 2000);

        return () => clearTimeout(timer);
      }
    }
  }, [isLoading, state.user, hasCheckedUser]);

  // Handle email submission
  const handleEmailSubmit = async (name: string, email: string) => {
    try {
      const response = await fetch("/api/learn/user", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, email }),
      });

      const data = await response.json();

      if (!data.success) {
        throw new Error(data.error || "Failed to save your information");
      }

      // Save user to context
      setUser(data.user as CourseUser);
      setShowEmailModal(false);
    } catch (error) {
      throw error;
    }
  };

  return (
    <div className="flex min-h-screen bg-background">
      {/* Desktop Sidebar - Hidden on mobile */}
      <CourseSidebar className="sticky top-0 h-screen" />

      {/* Mobile Drawer */}
      <MobileDrawer isOpen={mobileNav.isOpen} onClose={mobileNav.close}>
        <SidebarContent onNavigate={mobileNav.close} showCollapse={false} />
      </MobileDrawer>

      {/* Main Content Area */}
      <div className="flex-1 min-w-0 flex flex-col">
        {/* Mobile Header */}
        <MobileHeader
          onMenuClick={mobileNav.toggle}
          currentChapter={currentChapter}
        />

        {/* Page Content */}
        <main className="flex-1">
          {isLoading ? <LoadingSkeleton /> : children}
        </main>
      </div>

      {/* Email Capture Modal */}
      <EmailCaptureModal
        isOpen={showEmailModal}
        onClose={() => setShowEmailModal(false)}
        onSubmit={handleEmailSubmit}
      />
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