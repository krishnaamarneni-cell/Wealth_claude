"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { ArrowLeft, Award, Lock } from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { useCourse } from "@/lib/learn";
import { Certificate, generateCertificateId } from "@/components/learn/Certificate";

export default function CertificatePage() {
  const router = useRouter();
  const { user, progress, chapters } = useCourse();
  const [certificateId, setCertificateId] = useState<string | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);

  // Check if course is complete
  const completedChapters = progress.filter((p) => p.completed).length;
  const totalChapters = chapters.length;
  const isComplete = completedChapters === totalChapters && totalChapters > 0;

  // Get completion date (most recent completed chapter)
  const completionDate = progress.length > 0
    ? new Date(
        Math.max(
          ...progress
            .filter((p) => p.completed && p.completed_at)
            .map((p) => new Date(p.completed_at!).getTime())
        )
      )
    : new Date();

  // Generate or load certificate
  useEffect(() => {
    if (isComplete && user) {
      // In a real app, this would fetch/create from API
      // For now, generate a deterministic ID based on user
      const storedId = localStorage.getItem(`certificate_${user.id}`);
      if (storedId) {
        setCertificateId(storedId);
      }
    }
  }, [isComplete, user]);

  const handleGenerateCertificate = async () => {
    if (!user) return;
    
    setIsGenerating(true);
    
    try {
      // Generate new certificate ID
      const newId = generateCertificateId();
      
      // In a real app, save to database via API
      // For now, store in localStorage
      localStorage.setItem(`certificate_${user.id}`, newId);
      
      // Simulate API delay
      await new Promise((resolve) => setTimeout(resolve, 1000));
      
      setCertificateId(newId);
    } catch (error) {
      console.error("Error generating certificate:", error);
    } finally {
      setIsGenerating(false);
    }
  };

  // Not logged in
  if (!user) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-4">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center max-w-md"
        >
          <div className="w-16 h-16 rounded-2xl bg-muted flex items-center justify-center mx-auto mb-6">
            <Lock className="w-8 h-8 text-muted-foreground" />
          </div>
          <h1 className="text-2xl font-bold mb-3">Sign In Required</h1>
          <p className="text-muted-foreground mb-6">
            Please sign in to view your certificate. Your progress is saved to your account.
          </p>
          <Link href="/learn">
            <Button>
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back to Course
            </Button>
          </Link>
        </motion.div>
      </div>
    );
  }

  // Course not complete
  if (!isComplete) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-4">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center max-w-md"
        >
          <div className="w-16 h-16 rounded-2xl bg-amber-500/10 flex items-center justify-center mx-auto mb-6">
            <Award className="w-8 h-8 text-amber-500" />
          </div>
          <h1 className="text-2xl font-bold mb-3">Complete the Course First</h1>
          <p className="text-muted-foreground mb-4">
            You've completed {completedChapters} of {totalChapters} chapters. 
            Finish all chapters to earn your certificate!
          </p>
          
          {/* Progress bar */}
          <div className="w-full h-3 bg-muted rounded-full overflow-hidden mb-6">
            <motion.div
              initial={{ width: 0 }}
              animate={{ width: `${(completedChapters / totalChapters) * 100}%` }}
              transition={{ duration: 0.5, ease: "easeOut" }}
              className="h-full bg-primary rounded-full"
            />
          </div>
          
          <Link href="/learn">
            <Button>
              <ArrowLeft className="w-4 h-4 mr-2" />
              Continue Learning
            </Button>
          </Link>
        </motion.div>
      </div>
    );
  }

  // Course complete - show certificate or generate button
  return (
    <div className="min-h-screen bg-background py-12 px-4">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center mb-8"
        >
          <Link
            href="/learn"
            className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground mb-6"
          >
            <ArrowLeft className="w-4 h-4" />
            Back to Course
          </Link>
          
          <h1 className="text-3xl font-bold mb-3">
            🎉 Congratulations, {user.name}!
          </h1>
          <p className="text-muted-foreground">
            You've completed the FIRE: Financial Independence Course
          </p>
        </motion.div>

        {/* Certificate or Generate Button */}
        {certificateId ? (
          <Certificate
            name={user.name}
            completionDate={completionDate}
            certificateId={certificateId}
          />
        ) : (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-center py-12"
          >
            <div className="w-20 h-20 rounded-2xl bg-primary/10 flex items-center justify-center mx-auto mb-6">
              <Award className="w-10 h-10 text-primary" />
            </div>
            <h2 className="text-xl font-semibold mb-3">
              Generate Your Certificate
            </h2>
            <p className="text-muted-foreground mb-6 max-w-md mx-auto">
              Create your personalized certificate of completion. You can download it as PDF or PNG, and share it on social media.
            </p>
            <Button
              size="lg"
              onClick={handleGenerateCertificate}
              disabled={isGenerating}
              className="gap-2"
            >
              <Award className="w-5 h-5" />
              {isGenerating ? "Generating..." : "Generate Certificate"}
            </Button>
          </motion.div>
        )}

        {/* Course Stats */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="mt-12 grid grid-cols-2 sm:grid-cols-4 gap-4"
        >
          {[
            { label: "Chapters", value: "14" },
            { label: "Sections", value: "70" },
            { label: "Quizzes Passed", value: "14" },
            { label: "Time Invested", value: "~3 hrs" },
          ].map((stat, i) => (
            <div
              key={stat.label}
              className="p-4 rounded-xl bg-muted/50 text-center"
            >
              <div className="text-2xl font-bold text-primary mb-1">
                {stat.value}
              </div>
              <div className="text-sm text-muted-foreground">{stat.label}</div>
            </div>
          ))}
        </motion.div>

        {/* What's Next */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
          className="mt-12 p-6 rounded-xl border border-border bg-card"
        >
          <h3 className="font-semibold mb-4">What's Next?</h3>
          <ul className="space-y-3 text-sm text-muted-foreground">
            <li className="flex items-start gap-3">
              <span className="text-primary">1.</span>
              <span>
                <strong className="text-foreground">Calculate your FIRE number</strong> using the 
                formulas from Chapter 12
              </span>
            </li>
            <li className="flex items-start gap-3">
              <span className="text-primary">2.</span>
              <span>
                <strong className="text-foreground">Set up automated investing</strong> with a 
                three-fund portfolio from Chapter 13
              </span>
            </li>
            <li className="flex items-start gap-3">
              <span className="text-primary">3.</span>
              <span>
                <strong className="text-foreground">Track your progress</strong> with WealthClaude's 
                portfolio tracker
              </span>
            </li>
            <li className="flex items-start gap-3">
              <span className="text-primary">4.</span>
              <span>
                <strong className="text-foreground">Share your achievement</strong> and inspire 
                others on their FIRE journey
              </span>
            </li>
          </ul>
        </motion.div>
      </div>
    </div>
  );
}
