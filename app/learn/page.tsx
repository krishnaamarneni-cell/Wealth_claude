"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import {
  Flame,
  Clock,
  BookOpen,
  Trophy,
  CheckCircle2,
  ArrowRight,
  Play,
  Target,
  TrendingUp,
  PiggyBank,
  Shield,
  Calculator,
  Wallet,
  GraduationCap,
  Lock,
  Sparkles,
  Users,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { useCourse } from "@/lib/learn/CourseContext";
import { EmailCaptureModal } from "@/components/learn/EmailCaptureModal";
import type { CourseUser } from "@/types/learn";

// ===========================================
// Course Data
// ===========================================

const COURSE_OUTCOMES = [
  { icon: Target, text: "Calculate your personal FIRE number" },
  { icon: PiggyBank, text: "Build a high-yield savings system" },
  { icon: TrendingUp, text: "Master index fund investing" },
  { icon: Shield, text: "Create a bulletproof emergency fund" },
  { icon: Calculator, text: "Optimize taxes legally" },
  { icon: Wallet, text: "Build multiple income streams" },
];

const COURSE_PHASES = [
  { phase: 1, name: "Foundation", chapters: "1-3", color: "text-emerald-400", bg: "bg-emerald-400/10", border: "border-emerald-400/20" },
  { phase: 2, name: "Protection", chapters: "4", color: "text-blue-400", bg: "bg-blue-400/10", border: "border-blue-400/20" },
  { phase: 3, name: "Investing", chapters: "5-7", color: "text-purple-400", bg: "bg-purple-400/10", border: "border-purple-400/20" },
  { phase: 4, name: "Optimization", chapters: "8-10", color: "text-amber-400", bg: "bg-amber-400/10", border: "border-amber-400/20" },
  { phase: 5, name: "FIRE Path", chapters: "11-14", color: "text-red-400", bg: "bg-red-400/10", border: "border-red-400/20" },
];

const COURSE_STATS = [
  { value: "14", label: "Chapters" },
  { value: "70", label: "Lessons" },
  { value: "~3h", label: "Duration" },
  { value: "Free", label: "Price" },
];

// ===========================================
// Welcome Back Banner
// ===========================================

interface WelcomeBackBannerProps {
  userName: string;
  currentChapter: number;
  totalChapters: number;
  completedChapters: number;
}

function WelcomeBackBanner({
  userName,
  currentChapter,
  totalChapters,
  completedChapters
}: WelcomeBackBannerProps) {
  const progress = Math.round((completedChapters / totalChapters) * 100);

  return (
    <motion.div
      initial={{ opacity: 0, y: -20 }}
      animate={{ opacity: 1, y: 0 }}
      className="mb-8"
    >
      <div className="relative overflow-hidden rounded-2xl border border-primary/30 bg-primary/5 p-6">
        {/* Decorative elements */}
        <div className="absolute top-0 right-0 w-32 h-32 bg-primary/10 rounded-full blur-3xl" />
        <div className="absolute bottom-0 left-0 w-24 h-24 bg-primary/5 rounded-full blur-2xl" />

        <div className="relative flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div className="flex-1">
            <div className="flex items-center gap-2 mb-2">
              <Sparkles className="w-5 h-5 text-primary" />
              <span className="text-sm font-medium text-primary">Welcome back!</span>
            </div>
            <h2 className="text-xl font-bold text-foreground mb-1">
              Hey {userName}! Ready to continue?
            </h2>
            <p className="text-sm text-muted-foreground">
              You're on Chapter {currentChapter} • {completedChapters} of {totalChapters} completed
            </p>

            {/* Progress bar */}
            <div className="mt-3 w-full max-w-xs">
              <div className="h-2 bg-muted rounded-full overflow-hidden">
                <motion.div
                  initial={{ width: 0 }}
                  animate={{ width: `${progress}%` }}
                  transition={{ duration: 0.5, ease: "easeOut" }}
                  className="h-full bg-primary rounded-full"
                />
              </div>
              <p className="text-xs text-muted-foreground mt-1">{progress}% complete</p>
            </div>
          </div>

          <Link href={`/learn/${currentChapter}`}>
            <Button size="lg" className="gap-2 shadow-lg shadow-primary/20">
              Continue Learning
              <ArrowRight className="w-4 h-4" />
            </Button>
          </Link>
        </div>
      </div>
    </motion.div>
  );
}

// ===========================================
// Course Card
// ===========================================

interface CourseCardProps {
  onStartCourse: () => void;
  isEnrolled: boolean;
  currentChapter?: number;
}

function CourseCard({ onStartCourse, isEnrolled, currentChapter }: CourseCardProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.1 }}
      className="rounded-2xl border border-border bg-card overflow-hidden"
    >
      {/* Course Header */}
      <div className="relative p-6 sm:p-8 bg-gradient-to-br from-primary/10 via-primary/5 to-transparent">
        <div className="absolute top-4 right-4">
          <span className="px-3 py-1 text-xs font-bold bg-primary/20 text-primary rounded-full">
            FREE
          </span>
        </div>

        <div className="flex items-center gap-3 mb-4">
          <div className="w-12 h-12 sm:w-14 sm:h-14 rounded-2xl bg-primary/20 flex items-center justify-center">
            <Flame className="w-6 h-6 sm:w-7 sm:h-7 text-primary" />
          </div>
          <div>
            <h2 className="text-xl sm:text-2xl font-bold text-foreground">FIRE Course</h2>
            <p className="text-sm text-muted-foreground">Financial Independence, Retire Early</p>
          </div>
        </div>

        <p className="text-foreground/80 leading-relaxed max-w-2xl text-sm sm:text-base">
          A complete roadmap to financial freedom. Follow Maya's journey from $47 in savings
          to building a path to early retirement. Learn everything from budgeting basics
          to advanced tax strategies.
        </p>

        {/* Stats */}
        <div className="flex flex-wrap gap-4 sm:gap-6 mt-6">
          {COURSE_STATS.map((stat) => (
            <div key={stat.label} className="text-center">
              <div className="text-xl sm:text-2xl font-bold text-primary">{stat.value}</div>
              <div className="text-xs text-muted-foreground">{stat.label}</div>
            </div>
          ))}
        </div>
      </div>

      {/* Course Content */}
      <div className="p-6 sm:p-8 space-y-8">
        {/* What You'll Learn */}
        <div>
          <h3 className="text-lg font-semibold text-foreground mb-4 flex items-center gap-2">
            <GraduationCap className="w-5 h-5 text-primary" />
            What You'll Learn
          </h3>
          <div className="grid sm:grid-cols-2 gap-3">
            {COURSE_OUTCOMES.map((outcome, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.2 + i * 0.05 }}
                className="flex items-center gap-3 p-3 rounded-xl bg-muted/50"
              >
                <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
                  <outcome.icon className="w-4 h-4 text-primary" />
                </div>
                <span className="text-sm text-foreground">{outcome.text}</span>
              </motion.div>
            ))}
          </div>
        </div>

        {/* Course Structure */}
        <div>
          <h3 className="text-lg font-semibold text-foreground mb-4 flex items-center gap-2">
            <BookOpen className="w-5 h-5 text-primary" />
            Course Structure
          </h3>
          <div className="flex flex-wrap gap-2">
            {COURSE_PHASES.map((phase) => (
              <div
                key={phase.phase}
                className={`flex items-center gap-2 px-3 py-1.5 rounded-full ${phase.bg} border ${phase.border}`}
              >
                <span className={`text-xs sm:text-sm font-semibold ${phase.color}`}>
                  Phase {phase.phase}
                </span>
                <span className="text-xs sm:text-sm text-muted-foreground">
                  {phase.name}
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* Meet Maya Section */}
        <div className="p-4 rounded-xl bg-muted/30 border border-border">
          <div className="flex items-start gap-4">
            <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
              <span className="text-xl">👩‍💼</span>
            </div>
            <div>
              <h4 className="font-semibold text-foreground mb-1">Meet Maya</h4>
              <p className="text-sm text-muted-foreground">
                Follow Maya's journey from $47 in savings to financial independence.
                Her story makes every concept real and actionable.
              </p>
            </div>
          </div>
        </div>

        {/* CTA Button */}
        <div className="pt-4">
          {isEnrolled ? (
            <Link href={`/learn/${currentChapter || 1}`} className="block">
              <Button size="lg" className="w-full sm:w-auto gap-2 shadow-lg shadow-primary/20">
                <Play className="w-4 h-4" />
                Continue to Chapter {currentChapter || 1}
              </Button>
            </Link>
          ) : (
            <Button
              size="lg"
              onClick={onStartCourse}
              className="w-full sm:w-auto gap-2 shadow-lg shadow-primary/20"
            >
              <Play className="w-4 h-4" />
              Start Course — It's Free
            </Button>
          )}

          <p className="text-xs text-muted-foreground mt-3 flex flex-wrap items-center gap-x-3 gap-y-1">
            <span className="flex items-center gap-1">
              <CheckCircle2 className="w-3 h-3 text-primary" /> No credit card
            </span>
            <span className="flex items-center gap-1">
              <CheckCircle2 className="w-3 h-3 text-primary" /> Lifetime access
            </span>
            <span className="flex items-center gap-1">
              <Trophy className="w-3 h-3 text-primary" /> Certificate on completion
            </span>
          </p>
        </div>
      </div>
    </motion.div>
  );
}

// ===========================================
// Coming Soon Card
// ===========================================

function ComingSoonCard() {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.3 }}
      className="rounded-2xl border border-dashed border-border bg-card/50 p-6 sm:p-8 text-center"
    >
      <div className="w-12 h-12 sm:w-14 sm:h-14 rounded-2xl bg-muted flex items-center justify-center mx-auto mb-4">
        <Lock className="w-6 h-6 sm:w-7 sm:h-7 text-muted-foreground" />
      </div>
      <h3 className="text-lg font-semibold text-foreground mb-2">More Courses Coming Soon</h3>
      <p className="text-sm text-muted-foreground max-w-md mx-auto">
        We're working on more courses covering crypto investing, real estate,
        and advanced portfolio strategies. Stay tuned!
      </p>
    </motion.div>
  );
}

// ===========================================
// Main Page Component
// ===========================================

export default function LearnPage() {
  const router = useRouter();
  const { state, setUser } = useCourse();
  const [showEmailModal, setShowEmailModal] = useState(false);

  const user = state.user;
  const completedChapters = state.chapters_completed || [];

  // Find current chapter (first incomplete or next after last completed)
  const getCurrentChapter = () => {
    if (completedChapters.length === 0) return 1;
    if (completedChapters.length >= 14) return 14;

    // Find first incomplete chapter
    for (let i = 1; i <= 14; i++) {
      if (!completedChapters.includes(i)) return i;
    }
    return 1;
  };

  const currentChapter = getCurrentChapter();
  const isEnrolled = !!user;

  // Handle start course click
  const handleStartCourse = () => {
    if (user) {
      // Already enrolled, go to current chapter
      router.push(`/learn/${currentChapter}`);
    } else {
      // New user, show email modal
      setShowEmailModal(true);
    }
  };

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

      // Redirect to chapter 1
      router.push("/learn/1");
    } catch (error) {
      throw error;
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <div className="max-w-4xl mx-auto px-4 py-8 sm:py-12">
        {/* Page Header */}
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-8"
        >
          <div className="flex items-center gap-2 text-sm text-muted-foreground mb-2">
            <GraduationCap className="w-4 h-4" />
            <span>WealthClaude Learn</span>
          </div>
          <h1 className="text-3xl sm:text-4xl font-bold text-foreground mb-2">
            Master Your Finances
          </h1>
          <p className="text-lg text-muted-foreground">
            Free courses to help you build wealth and achieve financial independence.
          </p>
        </motion.div>

        {/* Welcome Back Banner (for returning users with progress) */}
        {user && completedChapters.length > 0 && (
          <WelcomeBackBanner
            userName={user.name.split(" ")[0]}
            currentChapter={currentChapter}
            totalChapters={14}
            completedChapters={completedChapters.length}
          />
        )}

        {/* Course Cards */}
        <div className="space-y-6">
          <CourseCard
            onStartCourse={handleStartCourse}
            isEnrolled={isEnrolled}
            currentChapter={currentChapter}
          />

          <ComingSoonCard />
        </div>

        {/* Bottom CTA for new users */}
        {!user && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.5 }}
            className="mt-12 text-center"
          >
            <div className="flex items-center justify-center gap-2 text-muted-foreground mb-4">
              <Users className="w-4 h-4" />
              <p>
                Join <span className="text-primary font-semibold">1,000+</span> learners
                on their path to financial freedom
              </p>
            </div>
            <Button
              size="lg"
              onClick={handleStartCourse}
              className="gap-2 shadow-lg shadow-primary/20"
            >
              Get Started Free
              <ArrowRight className="w-4 h-4" />
            </Button>
          </motion.div>
        )}
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
