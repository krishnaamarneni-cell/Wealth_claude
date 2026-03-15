"use client";

import { motion } from "framer-motion";
import Link from "next/link";
import {
  ArrowRight,
  BookOpen,
  Shield,
  TrendingUp,
  Settings,
  Flame,
  Clock,
  CheckCircle2,
  Lock,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { useCourse } from "@/lib/learn/CourseContext";
import { cn } from "@/lib/utils";

// ===========================================
// Chapter & Phase Data
// ===========================================

const phases = [
  {
    id: 1,
    name: "Foundation",
    description: "Master the basics of money management",
    icon: BookOpen,
    color: "emerald",
    chapters: [
      { id: 1, title: "Your money blueprint", time: "15 min" },
      { id: 2, title: "Banking & saving smartly", time: "12 min" },
      { id: 3, title: "Conquering debt", time: "18 min" },
    ],
  },
  {
    id: 2,
    name: "Protection",
    description: "Build your financial safety net",
    icon: Shield,
    color: "blue",
    chapters: [{ id: 4, title: "Your financial safety net", time: "14 min" }],
  },
  {
    id: 3,
    name: "Investing",
    description: "Make your money work for you",
    icon: TrendingUp,
    color: "amber",
    chapters: [
      { id: 5, title: "The eighth wonder", time: "16 min" },
      { id: 6, title: "Stock market demystified", time: "20 min" },
      { id: 7, title: "Investment vehicles", time: "18 min" },
    ],
  },
  {
    id: 4,
    name: "Optimization",
    description: "Keep more of what you earn",
    icon: Settings,
    color: "orange",
    chapters: [
      { id: 8, title: "Tax fundamentals", time: "15 min" },
      { id: 9, title: "Tax strategies", time: "17 min" },
      { id: 10, title: "Building income streams", time: "19 min" },
    ],
  },
  {
    id: 5,
    name: "FIRE Path",
    description: "Your roadmap to financial freedom",
    icon: Flame,
    color: "red",
    chapters: [
      { id: 11, title: "Understanding FIRE", time: "14 min" },
      { id: 12, title: "Your FIRE number", time: "16 min" },
      { id: 13, title: "FIRE investment strategy", time: "18 min" },
      { id: 14, title: "Executing your plan", time: "20 min" },
    ],
  },
];

const phaseColorClasses: Record<string, { bg: string; text: string; border: string }> = {
  emerald: {
    bg: "bg-emerald-500/10",
    text: "text-emerald-400",
    border: "border-emerald-500/20",
  },
  blue: {
    bg: "bg-blue-500/10",
    text: "text-blue-400",
    border: "border-blue-500/20",
  },
  amber: {
    bg: "bg-amber-500/10",
    text: "text-amber-400",
    border: "border-amber-500/20",
  },
  orange: {
    bg: "bg-orange-500/10",
    text: "text-orange-400",
    border: "border-orange-500/20",
  },
  red: {
    bg: "bg-red-500/10",
    text: "text-red-400",
    border: "border-red-500/20",
  },
};

// ===========================================
// Component
// ===========================================

export default function LearnPage() {
  const { state, isLoading } = useCourse();
  const { chapters_unlocked, chapters_completed, progress_by_chapter, user } = state;

  // Find the next chapter to continue
  const getNextChapter = () => {
    for (let i = 1; i <= 14; i++) {
      if (chapters_unlocked.includes(i) && !chapters_completed.includes(i)) {
        return i;
      }
    }
    return chapters_completed.length === 14 ? null : 1;
  };

  const nextChapter = getNextChapter();
  const totalProgress = Math.round((chapters_completed.length / 14) * 100);

  return (
    <div className="min-h-screen">
      {/* Hero Section */}
      <section className="relative overflow-hidden border-b border-border">
        {/* Background gradient */}
        <div className="absolute inset-0 bg-gradient-to-br from-primary/5 via-transparent to-transparent" />

        <div className="relative max-w-4xl mx-auto px-6 py-16 md:py-24">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
          >
            {/* Badge */}
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-primary/10 text-primary text-sm mb-6">
              <Flame className="w-4 h-4" />
              <span>Free course • 14 chapters</span>
            </div>

            {/* Title */}
            <h1 className="text-4xl md:text-5xl font-bold text-foreground mb-4">
              The Wealth Blueprint
            </h1>
            <p className="text-xl text-muted-foreground mb-8 max-w-2xl">
              A story-driven journey from financial basics to FIRE.
              Learn what the wealthy actually do — not what most people think.
            </p>

            {/* CTA */}
            <div className="flex flex-wrap items-center gap-4">
              {nextChapter ? (
                <Link href={`/learn/${nextChapter}`}>
                  <Button size="lg" className="gap-2">
                    {chapters_completed.length > 0 ? "Continue learning" : "Start chapter 1"}
                    <ArrowRight className="w-4 h-4" />
                  </Button>
                </Link>
              ) : (
                <Link href="/learn/certificate">
                  <Button size="lg" className="gap-2">
                    Get your certificate
                    <ArrowRight className="w-4 h-4" />
                  </Button>
                </Link>
              )}

              <div className="text-sm text-muted-foreground">
                <Clock className="w-4 h-4 inline mr-1" />
                ~3 hours total
              </div>
            </div>

            {/* Progress (if user has started) */}
            {user && chapters_completed.length > 0 && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="mt-8 p-4 rounded-xl bg-card border border-border"
              >
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm font-medium text-foreground">
                    Welcome back, {user.name}!
                  </span>
                  <span className="text-sm text-muted-foreground">
                    {totalProgress}% complete
                  </span>
                </div>
                <div className="h-2 bg-muted rounded-full overflow-hidden">
                  <motion.div
                    className="h-full bg-primary rounded-full"
                    initial={{ width: 0 }}
                    animate={{ width: `${totalProgress}%` }}
                    transition={{ duration: 0.8, ease: "easeOut" }}
                  />
                </div>
              </motion.div>
            )}
          </motion.div>
        </div>
      </section>

      {/* Course Content */}
      <section className="max-w-4xl mx-auto px-6 py-12">
        <h2 className="text-2xl font-semibold text-foreground mb-8">
          Course curriculum
        </h2>

        <div className="space-y-8">
          {phases.map((phase, phaseIndex) => {
            const colorClasses = phaseColorClasses[phase.color];
            const PhaseIcon = phase.icon;

            return (
              <motion.div
                key={phase.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: phaseIndex * 0.1 }}
              >
                {/* Phase Header */}
                <div className="flex items-center gap-3 mb-4">
                  <div
                    className={cn(
                      "flex items-center justify-center w-10 h-10 rounded-xl",
                      colorClasses.bg
                    )}
                  >
                    <PhaseIcon className={cn("w-5 h-5", colorClasses.text)} />
                  </div>
                  <div>
                    <h3 className={cn("font-semibold", colorClasses.text)}>
                      Phase {phase.id}: {phase.name}
                    </h3>
                    <p className="text-sm text-muted-foreground">
                      {phase.description}
                    </p>
                  </div>
                </div>

                {/* Chapters */}
                <div className="ml-5 border-l-2 border-border pl-8 space-y-2">
                  {phase.chapters.map((chapter) => {
                    const isUnlocked = chapters_unlocked.includes(chapter.id);
                    const isCompleted = chapters_completed.includes(chapter.id);
                    const progress = progress_by_chapter[chapter.id];
                    const percentage = progress?.percentage || 0;

                    return (
                      <div key={chapter.id}>
                        {isUnlocked ? (
                          <Link
                            href={`/learn/${chapter.id}`}
                            className={cn(
                              "flex items-center justify-between p-4 rounded-xl border transition-all",
                              isCompleted
                                ? "bg-primary/5 border-primary/20"
                                : "bg-card border-border hover:border-primary/30 hover:bg-card/80"
                            )}
                          >
                            <div className="flex items-center gap-3">
                              {isCompleted ? (
                                <CheckCircle2 className="w-5 h-5 text-primary flex-shrink-0" />
                              ) : (
                                <div className="relative w-5 h-5 flex-shrink-0">
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
                              <div>
                                <span className="text-sm text-muted-foreground mr-2">
                                  {chapter.id}.
                                </span>
                                <span className="font-medium text-foreground">
                                  {chapter.title}
                                </span>
                              </div>
                            </div>
                            <div className="flex items-center gap-3">
                              {!isCompleted && percentage > 0 && (
                                <span className="text-xs text-muted-foreground">
                                  {percentage}%
                                </span>
                              )}
                              <span className="text-xs text-muted-foreground">
                                {chapter.time}
                              </span>
                              <ArrowRight className="w-4 h-4 text-muted-foreground" />
                            </div>
                          </Link>
                        ) : (
                          <div className="flex items-center justify-between p-4 rounded-xl border border-border bg-muted/30 opacity-60 cursor-not-allowed">
                            <div className="flex items-center gap-3">
                              <Lock className="w-5 h-5 text-muted-foreground flex-shrink-0" />
                              <div>
                                <span className="text-sm text-muted-foreground mr-2">
                                  {chapter.id}.
                                </span>
                                <span className="font-medium text-muted-foreground">
                                  {chapter.title}
                                </span>
                              </div>
                            </div>
                            <span className="text-xs text-muted-foreground">
                              Locked
                            </span>
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              </motion.div>
            );
          })}
        </div>
      </section>

      {/* Story Preview */}
      <section className="border-t border-border bg-card/30">
        <div className="max-w-4xl mx-auto px-6 py-12">
          <div className="flex items-start gap-6">
            <div className="flex-shrink-0 w-16 h-16 rounded-2xl bg-primary/10 flex items-center justify-center">
              <span className="text-2xl">👩‍💼</span>
            </div>
            <div>
              <h3 className="text-lg font-semibold text-foreground mb-2">
                Meet Maya
              </h3>
              <p className="text-muted-foreground">
                Maya is 28, has $47 in savings, and just had her car repossessed. 
                Throughout this course, you'll follow her transformation from broke 
                and stressed to financially independent. Her story will help you 
                understand not just the "what" but the "why" behind every concept.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Footer CTA */}
      <section className="border-t border-border">
        <div className="max-w-4xl mx-auto px-6 py-12 text-center">
          <h2 className="text-2xl font-semibold text-foreground mb-4">
            Ready to begin your journey?
          </h2>
          <p className="text-muted-foreground mb-6">
            Join thousands of others learning the wealth blueprint.
          </p>
          {nextChapter ? (
            <Link href={`/learn/${nextChapter}`}>
              <Button size="lg" className="gap-2">
                {chapters_completed.length > 0 ? "Continue learning" : "Start chapter 1"}
                <ArrowRight className="w-4 h-4" />
              </Button>
            </Link>
          ) : (
            <Link href="/learn/certificate">
              <Button size="lg" className="gap-2">
                Get your certificate
                <ArrowRight className="w-4 h-4" />
              </Button>
            </Link>
          )}
        </div>
      </section>
    </div>
  );
}
