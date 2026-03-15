"use client";

import { useState, useEffect } from "react";
import { CourseProvider, useCourse } from "@/lib/learn/CourseContext";
import { CourseSidebar } from "@/components/learn/CourseSidebar";
import { EmailCaptureModal } from "@/components/learn/EmailCaptureModal";
import type { CourseUser } from "@/types/learn";

// ===========================================
// Inner Layout (needs context)
// ===========================================

function LearnLayoutInner({ children }: { children: React.ReactNode }) {
  const { state, setUser, isLoading } = useCourse();
  const [showEmailModal, setShowEmailModal] = useState(false);
  const [hasCheckedUser, setHasCheckedUser] = useState(false);

  // Check for existing user on mount
  useEffect(() => {
    if (!isLoading && !hasCheckedUser) {
      setHasCheckedUser(true);

      // Show modal if no user after a short delay
      if (!state.user) {
        const timer = setTimeout(() => {
          setShowEmailModal(true);
        }, 1500);

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
      {/* Sidebar - Hidden on mobile, shown on md+ */}
      <div className="hidden md:block">
        <CourseSidebar className="sticky top-0 h-screen" />
      </div>

      {/* Main Content */}
      <main className="flex-1 min-w-0">
        {children}
      </main>

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
