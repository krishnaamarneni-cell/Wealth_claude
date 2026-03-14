"use client";

import React, { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  ArrowRight,
  ArrowLeft,
  Target,
  DollarSign,
  PiggyBank,
  TrendingUp,
  Shield,
  Building2,
  Briefcase,
  Clock,
  CheckCircle2,
  Zap,
  Users,
} from "lucide-react";

// Animation variants
const slideVariants = {
  enter: (direction: number) => ({
    x: direction > 0 ? 300 : -300,
    opacity: 0,
  }),
  center: {
    x: 0,
    opacity: 1,
  },
  exit: (direction: number) => ({
    x: direction < 0 ? 300 : -300,
    opacity: 0,
  }),
};

// Types
interface Question {
  id: string;
  category: string;
  categoryIcon: React.ElementType;
  question: string;
  subtitle?: string;
  type: "single" | "multiple" | "range" | "input";
  options?: { value: string; label: string; score: number }[];
  min?: number;
  max?: number;
  step?: number;
  placeholder?: string;
}

// Questions data
const questions: Question[] = [
  {
    id: "income_streams",
    category: "Income",
    categoryIcon: DollarSign,
    question: "How many income streams do you have?",
    subtitle: "Include salary, side hustles, investments, rental income, etc.",
    type: "single",
    options: [
      { value: "1", label: "1 (Just my job)", score: 2 },
      { value: "2", label: "2 sources", score: 5 },
      { value: "3", label: "3 sources", score: 8 },
      { value: "4+", label: "4 or more", score: 10 },
    ],
  },
  {
    id: "debt_ratio",
    category: "Debt",
    categoryIcon: PiggyBank,
    question: "What's your debt-to-income ratio?",
    subtitle: "Monthly debt payments ÷ Monthly income",
    type: "single",
    options: [
      { value: "0-10", label: "0-10% (Minimal)", score: 10 },
      { value: "10-20", label: "10-20% (Healthy)", score: 8 },
      { value: "20-35", label: "20-35% (Moderate)", score: 5 },
      { value: "35-50", label: "35-50% (High)", score: 3 },
      { value: "50+", label: "50%+ (Critical)", score: 1 },
    ],
  },
  {
    id: "emergency_fund",
    category: "Savings",
    categoryIcon: Shield,
    question: "How many months of expenses in emergency savings?",
    subtitle: "Cash readily available if you lost your income today",
    type: "single",
    options: [
      { value: "0", label: "Less than 1 month", score: 1 },
      { value: "1-3", label: "1-3 months", score: 4 },
      { value: "3-6", label: "3-6 months", score: 7 },
      { value: "6-12", label: "6-12 months", score: 9 },
      { value: "12+", label: "12+ months", score: 10 },
    ],
  },
  {
    id: "investments",
    category: "Investing",
    categoryIcon: TrendingUp,
    question: "What investment accounts do you have?",
    subtitle: "Select all that apply",
    type: "multiple",
    options: [
      { value: "401k", label: "401(k) or 403(b)", score: 2 },
      { value: "ira", label: "IRA (Traditional or Roth)", score: 2 },
      { value: "brokerage", label: "Taxable brokerage account", score: 2 },
      { value: "hsa", label: "HSA (as investment)", score: 2 },
      { value: "real_estate", label: "Real estate investments", score: 2 },
      { value: "none", label: "None of the above", score: 0 },
    ],
  },
  {
    id: "tax_strategy",
    category: "Tax",
    categoryIcon: Building2,
    question: "Do you have a tax optimization strategy?",
    subtitle: "Beyond just filing your taxes",
    type: "single",
    options: [
      { value: "none", label: "No, I just file with TurboTax", score: 2 },
      { value: "basic", label: "Some deductions, nothing fancy", score: 4 },
      { value: "moderate", label: "I work with a CPA", score: 7 },
      { value: "advanced", label: "Full strategy (harvesting, entities, etc.)", score: 10 },
    ],
  },
  {
    id: "asset_protection",
    category: "Protection",
    categoryIcon: Shield,
    question: "How protected are your assets?",
    subtitle: "Select all that apply",
    type: "multiple",
    options: [
      { value: "life_insurance", label: "Life insurance", score: 2 },
      { value: "disability", label: "Disability insurance", score: 2 },
      { value: "umbrella", label: "Umbrella policy", score: 2 },
      { value: "llc", label: "LLC or trust structure", score: 2 },
      { value: "estate", label: "Estate plan / Will", score: 2 },
      { value: "none", label: "None of the above", score: 0 },
    ],
  },
  {
    id: "retirement_savings",
    category: "Retirement",
    categoryIcon: Clock,
    question: "What percentage of income do you save for retirement?",
    subtitle: "Including employer match",
    type: "single",
    options: [
      { value: "0-5", label: "0-5%", score: 2 },
      { value: "5-10", label: "5-10%", score: 4 },
      { value: "10-15", label: "10-15%", score: 6 },
      { value: "15-25", label: "15-25%", score: 8 },
      { value: "25+", label: "25%+ (Maxing accounts)", score: 10 },
    ],
  },
  {
    id: "net_worth_growth",
    category: "Growth",
    categoryIcon: TrendingUp,
    question: "How has your net worth changed in the past year?",
    type: "single",
    options: [
      { value: "decreased", label: "Decreased", score: 2 },
      { value: "same", label: "About the same", score: 4 },
      { value: "slight", label: "Grew slightly (1-10%)", score: 6 },
      { value: "moderate", label: "Grew moderately (10-25%)", score: 8 },
      { value: "strong", label: "Grew significantly (25%+)", score: 10 },
    ],
  },
];

const progressMessages = [
  "Great start! Let's keep going...",
  "You're doing great!",
  "Halfway there!",
  "Almost done...",
  "Last few questions!",
  "One more to go!",
  "Final question!",
  "Let's see your score!",
];

export default function FireScoreTest() {
  const [currentStep, setCurrentStep] = useState(0);
  const [direction, setDirection] = useState(0);
  const [answers, setAnswers] = useState<Record<string, string | string[]>>({});
  const [email, setEmail] = useState("");
  const [name, setName] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const totalSteps = questions.length + 1; // +1 for email capture
  const progress = ((currentStep + 1) / totalSteps) * 100;
  const currentQuestion = questions[currentStep];

  const handleSingleSelect = (value: string) => {
    setAnswers((prev) => ({ ...prev, [currentQuestion.id]: value }));
  };

  const handleMultiSelect = (value: string) => {
    const current = (answers[currentQuestion.id] as string[]) || [];

    // If selecting "none", clear others
    if (value === "none") {
      setAnswers((prev) => ({ ...prev, [currentQuestion.id]: ["none"] }));
      return;
    }

    // If selecting something else, remove "none" if present
    const filtered = current.filter((v) => v !== "none");

    if (filtered.includes(value)) {
      setAnswers((prev) => ({
        ...prev,
        [currentQuestion.id]: filtered.filter((v) => v !== value),
      }));
    } else {
      setAnswers((prev) => ({
        ...prev,
        [currentQuestion.id]: [...filtered, value],
      }));
    }
  };

  const canProceed = () => {
    if (currentStep === questions.length) {
      return email.trim() !== "" && name.trim() !== "";
    }
    const answer = answers[currentQuestion.id];
    if (currentQuestion.type === "multiple") {
      return Array.isArray(answer) && answer.length > 0;
    }
    return answer !== undefined && answer !== "";
  };

  const handleNext = () => {
    if (!canProceed()) return;
    setDirection(1);
    if (currentStep < totalSteps - 1) {
      setCurrentStep((prev) => prev + 1);
    }
  };

  const handleBack = () => {
    if (currentStep > 0) {
      setDirection(-1);
      setCurrentStep((prev) => prev - 1);
    }
  };

  const handleSubmit = async () => {
    if (!canProceed()) return;
    setIsSubmitting(true);

    // Calculate score
    let totalScore = 0;
    let maxPossible = 0;

    questions.forEach((q) => {
      const answer = answers[q.id];
      if (q.type === "multiple" && Array.isArray(answer)) {
        answer.forEach((a) => {
          const opt = q.options?.find((o) => o.value === a);
          if (opt) totalScore += opt.score;
        });
        maxPossible += 10; // Max for multiple is 10
      } else if (q.type === "single" && typeof answer === "string") {
        const opt = q.options?.find((o) => o.value === answer);
        if (opt) totalScore += opt.score;
        maxPossible += 10;
      }
    });

    const finalScore = Math.round((totalScore / maxPossible) * 100);

    // Store in localStorage for results page
    const resultData = {
      name,
      email,
      score: finalScore,
      answers,
      timestamp: new Date().toISOString(),
    };
    localStorage.setItem("fireScoreResult", JSON.stringify(resultData));

    // TODO: Save to Supabase
    // await saveToSupabase(resultData);

    // TODO: Send email via Resend
    // await sendEmail(resultData);

    // Redirect to results
    window.location.href = "/fire-score/results";
  };

  return (
    <div className="min-h-screen bg-[#0a0f18] text-white flex flex-col">
      {/* Progress Bar */}
      <div className="fixed top-0 left-0 right-0 z-50 bg-[#0a0f18]/90 backdrop-blur-sm border-b border-white/5">
        <div className="max-w-2xl mx-auto px-4 py-4">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm text-white/60">
              Question {Math.min(currentStep + 1, questions.length)} of {questions.length}
            </span>
            <span className="text-sm text-primary font-medium">
              {Math.round(progress)}% complete
            </span>
          </div>
          <div className="h-2 bg-white/10 rounded-full overflow-hidden">
            <div
              className="h-full bg-gradient-to-r from-primary to-emerald-400 rounded-full transition-all duration-300"
              style={{ width: `${progress}%` }}
            />
          </div>
          {currentStep < questions.length && (
            <p className="text-xs text-white/40 mt-2 text-center">
              {progressMessages[Math.min(currentStep, progressMessages.length - 1)]}
            </p>
          )}
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 flex items-center justify-center px-4 pt-28 pb-24">
        <div className="w-full max-w-2xl">
          <AnimatePresence mode="wait" custom={direction}>
            {currentStep < questions.length ? (
              // Question Steps
              <motion.div
                key={currentStep}
                custom={direction}
                variants={slideVariants}
                initial="enter"
                animate="center"
                exit="exit"
                transition={{ duration: 0.3, ease: "easeInOut" }}
                className="w-full"
              >
                {/* Category Badge */}
                <div className="flex items-center gap-2 mb-6">
                  <div className="w-10 h-10 rounded-xl bg-primary/20 flex items-center justify-center">
                    <currentQuestion.categoryIcon className="w-5 h-5 text-primary" />
                  </div>
                  <span className="text-primary font-medium">{currentQuestion.category}</span>
                </div>

                {/* Question */}
                <h2 className="text-2xl md:text-3xl font-bold mb-2">
                  {currentQuestion.question}
                </h2>
                {currentQuestion.subtitle && (
                  <p className="text-white/50 mb-8">{currentQuestion.subtitle}</p>
                )}

                {/* Options */}
                <div className="space-y-3">
                  {currentQuestion.options?.map((option) => {
                    const isSelected =
                      currentQuestion.type === "multiple"
                        ? (answers[currentQuestion.id] as string[])?.includes(option.value)
                        : answers[currentQuestion.id] === option.value;

                    return (
                      <button
                        key={option.value}
                        onClick={() =>
                          currentQuestion.type === "multiple"
                            ? handleMultiSelect(option.value)
                            : handleSingleSelect(option.value)
                        }
                        className={`w-full p-4 rounded-xl border text-left transition-all ${isSelected
                            ? "bg-primary/20 border-primary text-white"
                            : "bg-white/5 border-white/10 hover:border-white/30 text-white/80"
                          }`}
                      >
                        <div className="flex items-center gap-3">
                          <div
                            className={`w-6 h-6 rounded-full border-2 flex items-center justify-center flex-shrink-0 ${isSelected
                                ? "border-primary bg-primary"
                                : "border-white/30"
                              }`}
                          >
                            {isSelected && (
                              <CheckCircle2 className="w-4 h-4 text-black" />
                            )}
                          </div>
                          <span className="font-medium">{option.label}</span>
                        </div>
                      </button>
                    );
                  })}
                </div>

                {currentQuestion.type === "multiple" && (
                  <p className="text-white/40 text-sm mt-4 text-center">
                    Select all that apply
                  </p>
                )}
              </motion.div>
            ) : (
              // Email Capture Step
              <motion.div
                key="email"
                custom={direction}
                variants={slideVariants}
                initial="enter"
                animate="center"
                exit="exit"
                transition={{ duration: 0.3, ease: "easeInOut" }}
                className="w-full"
              >
                <div className="text-center mb-8">
                  <div className="w-16 h-16 rounded-2xl bg-primary/20 flex items-center justify-center mx-auto mb-6">
                    <Target className="w-8 h-8 text-primary" />
                  </div>
                  <h2 className="text-2xl md:text-3xl font-bold mb-2">
                    Your FIRE Score is Ready! 🔥
                  </h2>
                  <p className="text-white/60">
                    Enter your details to see your personalized results and get a free PDF report.
                  </p>
                </div>

                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-white/70 mb-2">
                      Your Name
                    </label>
                    <input
                      type="text"
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      placeholder="John Smith"
                      className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl focus:outline-none focus:border-primary text-white placeholder-white/30"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-white/70 mb-2">
                      Email Address
                    </label>
                    <input
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="john@example.com"
                      className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl focus:outline-none focus:border-primary text-white placeholder-white/30"
                    />
                  </div>
                </div>

                <div className="mt-6 p-4 bg-primary/10 border border-primary/20 rounded-xl">
                  <div className="flex items-start gap-3">
                    <Zap className="w-5 h-5 text-primary flex-shrink-0 mt-0.5" />
                    <div>
                      <p className="text-sm font-medium text-white">
                        What you'll get instantly:
                      </p>
                      <ul className="text-sm text-white/60 mt-1 space-y-1">
                        <li>• Your personalized FIRE Score (0-100)</li>
                        <li>• How you compare to the top 1%</li>
                        <li>• Your biggest weak areas</li>
                        <li>• Downloadable PDF report</li>
                        <li>• Personalized tips via email</li>
                      </ul>
                    </div>
                  </div>
                </div>

                <p className="text-white/30 text-xs text-center mt-4">
                  We respect your privacy. No spam, ever.
                </p>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>

      {/* Navigation */}
      <div className="fixed bottom-0 left-0 right-0 bg-[#0a0f18]/90 backdrop-blur-sm border-t border-white/5">
        <div className="max-w-2xl mx-auto px-4 py-4 flex items-center justify-between">
          <button
            onClick={handleBack}
            disabled={currentStep === 0}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl transition-all ${currentStep === 0
                ? "text-white/20 cursor-not-allowed"
                : "text-white/60 hover:text-white hover:bg-white/5"
              }`}
          >
            <ArrowLeft className="w-5 h-5" />
            Back
          </button>

          {currentStep < questions.length ? (
            <button
              onClick={handleNext}
              disabled={!canProceed()}
              className={`flex items-center gap-2 px-6 py-3 rounded-xl font-semibold transition-all ${canProceed()
                  ? "bg-primary text-black hover:bg-primary/90"
                  : "bg-white/10 text-white/30 cursor-not-allowed"
                }`}
            >
              Continue
              <ArrowRight className="w-5 h-5" />
            </button>
          ) : (
            <button
              onClick={handleSubmit}
              disabled={!canProceed() || isSubmitting}
              className={`flex items-center gap-2 px-6 py-3 rounded-xl font-semibold transition-all ${canProceed() && !isSubmitting
                  ? "bg-primary text-black hover:bg-primary/90"
                  : "bg-white/10 text-white/30 cursor-not-allowed"
                }`}
            >
              {isSubmitting ? (
                <>
                  <div className="w-5 h-5 border-2 border-black/30 border-t-black rounded-full animate-spin" />
                  Calculating...
                </>
              ) : (
                <>
                  <Zap className="w-5 h-5" />
                  See My FIRE Score
                </>
              )}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
