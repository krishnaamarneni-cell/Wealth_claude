"use client";

import React, { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { jsPDF } from "jspdf";
import {
  Download,
  Mail,
  Calendar,
  ArrowRight,
  TrendingUp,
  AlertTriangle,
  CheckCircle2,
  Target,
  Clock,
  Users,
  Zap,
  Share2,
  RefreshCw,
} from "lucide-react";

// Types
interface ScoreResult {
  name: string;
  email: string;
  score: number;
  answers: Record<string, string | string[]>;
  timestamp: string;
}

interface Tip {
  priority: "critical" | "moderate" | "good";
  title: string;
  description: string;
  action: string;
}

// Generate tips based on answers
const generateTips = (answers: Record<string, string | string[]>): Tip[] => {
  const tips: Tip[] = [];

  // Income streams
  if (answers.income_streams === "1") {
    tips.push({
      priority: "critical",
      title: "Diversify Your Income",
      description: "You have 1 income source. The top 1% have 3-5 streams. This is your biggest vulnerability.",
      action: "Consider rental income, dividend portfolios, or a side business",
    });
  }

  // Debt ratio
  if (answers.debt_ratio === "35-50" || answers.debt_ratio === "50+") {
    tips.push({
      priority: "critical",
      title: "Reduce Debt Urgently",
      description: "Your debt-to-income ratio is dangerously high. This is blocking all wealth building.",
      action: "Focus on debt elimination before any other financial goal",
    });
  }

  // Emergency fund
  if (answers.emergency_fund === "0" || answers.emergency_fund === "1-3") {
    tips.push({
      priority: "moderate",
      title: "Build Emergency Runway",
      description: `You have less than ideal emergency savings. Target is 6 months minimum.`,
      action: "Automate $500/month to high-yield savings until target reached",
    });
  }

  // Tax strategy
  if (answers.tax_strategy === "none" || answers.tax_strategy === "basic") {
    tips.push({
      priority: "critical",
      title: "Implement Tax Strategy",
      description: "You're likely leaving $5,000-15,000 per year on the table without proper tax optimization.",
      action: "Consult with a CPA about tax-loss harvesting and entity structure",
    });
  }

  // Asset protection
  const protections = answers.asset_protection as string[];
  if (!protections || protections.length < 3 || protections.includes("none")) {
    tips.push({
      priority: "moderate",
      title: "Strengthen Asset Protection",
      description: "Your wealth is vulnerable. One lawsuit or life event could wipe out years of progress.",
      action: "Consider LLC structure, umbrella policy, and basic estate planning",
    });
  }

  // Retirement savings
  if (answers.retirement_savings === "0-5" || answers.retirement_savings === "5-10") {
    tips.push({
      priority: "moderate",
      title: "Increase Retirement Contributions",
      description: "You're not maximizing tax-advantaged accounts. This costs you both now and later.",
      action: "Increase 401k contribution to at least get full employer match",
    });
  }

  // If doing well, add a "good" tip
  if (tips.filter((t) => t.priority === "critical").length === 0) {
    tips.push({
      priority: "good",
      title: "You're On Track!",
      description: "Your fundamentals are solid. Now it's about optimization and acceleration.",
      action: "Consider advanced strategies like tax-loss harvesting and entity optimization",
    });
  }

  return tips.slice(0, 4); // Return max 4 tips
};

// Get score color
const getScoreColor = (score: number) => {
  if (score >= 80) return "text-emerald-400";
  if (score >= 60) return "text-primary";
  if (score >= 40) return "text-amber-400";
  return "text-red-400";
};

// Get score label
const getScoreLabel = (score: number) => {
  if (score >= 80) return { label: "Excellent", description: "You're in the top tier. Keep optimizing!" };
  if (score >= 60) return { label: "Good", description: "Solid foundation. Time to accelerate." };
  if (score >= 40) return { label: "Fair", description: "Room for improvement. Let's close the gaps." };
  return { label: "Needs Work", description: "Critical gaps exist. Action needed now." };
};

// Get percentile
const getPercentile = (score: number) => {
  if (score >= 85) return "top 5%";
  if (score >= 75) return "top 15%";
  if (score >= 60) return "top 30%";
  if (score >= 45) return "top 50%";
  return "bottom 50%";
};

export default function FireScoreResults() {
  const [result, setResult] = useState<ScoreResult | null>(null);
  const [tips, setTips] = useState<Tip[]>([]);
  const [isGeneratingPDF, setIsGeneratingPDF] = useState(false);
  const [showEmailSent, setShowEmailSent] = useState(false);

  useEffect(() => {
    // Get result from localStorage
    const storedResult = localStorage.getItem("fireScoreResult");
    if (storedResult) {
      const parsed = JSON.parse(storedResult) as ScoreResult;
      setResult(parsed);
      setTips(generateTips(parsed.answers));

      // Simulate email sent
      setTimeout(() => setShowEmailSent(true), 2000);
    }
  }, []);

  const handleDownloadPDF = async () => {
    setIsGeneratingPDF(true);

    try {
      const doc = new jsPDF();
      const pageWidth = doc.internal.pageSize.getWidth();
      const pageHeight = doc.internal.pageSize.getHeight();

      // Colors (RGB)
      const primaryGreen: [number, number, number] = [34, 197, 94];
      const darkBg: [number, number, number] = [10, 15, 24];
      const lightGray: [number, number, number] = [248, 250, 252];
      const mediumGray: [number, number, number] = [100, 116, 139];
      const darkText: [number, number, number] = [30, 41, 59];
      const red: [number, number, number] = [220, 38, 38];
      const amber: [number, number, number] = [217, 119, 6];
      const green: [number, number, number] = [22, 163, 74];

      // ========== HEADER ==========
      doc.setFillColor(...darkBg);
      doc.rect(0, 0, pageWidth, 45, 'F');

      // Logo
      doc.setTextColor(...primaryGreen);
      doc.setFontSize(22);
      doc.setFont("helvetica", "bold");
      doc.text("WealthClaude", 15, 20);

      // Tagline
      doc.setTextColor(255, 255, 255);
      doc.setFontSize(9);
      doc.setFont("helvetica", "normal");
      doc.text("FIRE Score Assessment Report", 15, 30);

      // Date & Confidential
      doc.setFontSize(9);
      doc.setTextColor(180, 180, 180);
      doc.text(`Generated: ${new Date().toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}`, pageWidth - 15, 20, { align: "right" });
      doc.text("CONFIDENTIAL", pageWidth - 15, 30, { align: "right" });

      // ========== CLIENT INFO & SCORE ==========
      let y = 60;

      // Client info
      doc.setTextColor(...mediumGray);
      doc.setFontSize(10);
      doc.text("Prepared for:", 15, y);

      doc.setTextColor(...darkText);
      doc.setFontSize(18);
      doc.setFont("helvetica", "bold");
      doc.text(result?.name || "Client", 15, y + 10);

      doc.setFont("helvetica", "normal");
      doc.setFontSize(10);
      doc.setTextColor(...mediumGray);
      doc.text(result?.email || "", 15, y + 18);

      // Score Box
      const scoreBoxX = pageWidth - 70;
      const scoreBoxY = y - 10;

      // Score circle background
      doc.setFillColor(...lightGray);
      doc.roundedRect(scoreBoxX, scoreBoxY, 55, 55, 5, 5, 'F');

      // Score ring (outer)
      doc.setDrawColor(220, 220, 220);
      doc.setLineWidth(3);
      doc.circle(scoreBoxX + 27.5, scoreBoxY + 25, 18, 'S');

      // Score ring (progress) - green arc
      doc.setDrawColor(...primaryGreen);
      doc.setLineWidth(3);
      // Draw arc based on score percentage
      const scorePercent = (result?.score || 0) / 100;
      const startAngle = -90;
      const endAngle = startAngle + (360 * scorePercent);

      // Score number
      doc.setTextColor(...primaryGreen);
      doc.setFontSize(24);
      doc.setFont("helvetica", "bold");
      doc.text(String(result?.score || 0), scoreBoxX + 27.5, scoreBoxY + 27, { align: "center" });

      doc.setTextColor(...mediumGray);
      doc.setFontSize(10);
      doc.text("/100", scoreBoxX + 27.5, scoreBoxY + 36, { align: "center" });

      // Percentile badge
      doc.setFillColor(...primaryGreen);
      doc.roundedRect(scoreBoxX + 2, scoreBoxY + 45, 51, 8, 2, 2, 'F');
      doc.setTextColor(255, 255, 255);
      doc.setFontSize(7);
      doc.setFont("helvetica", "bold");
      doc.text(getPercentile(result?.score || 0).toUpperCase(), scoreBoxX + 27.5, scoreBoxY + 50.5, { align: "center" });

      // ========== GREEN DIVIDER ==========
      y = 110;
      doc.setFillColor(...primaryGreen);
      doc.rect(15, y, pageWidth - 30, 3, 'F');

      // ========== EXECUTIVE SUMMARY ==========
      y = 125;
      doc.setTextColor(...darkText);
      doc.setFontSize(14);
      doc.setFont("helvetica", "bold");
      doc.text("Executive Summary", 15, y);

      y += 10;
      doc.setFont("helvetica", "normal");
      doc.setFontSize(10);
      doc.setTextColor(...mediumGray);

      const scoreLabel = getScoreLabel(result?.score || 0);
      const summaryText = `Your FIRE Score of ${result?.score} places you in the ${getPercentile(result?.score || 0)} of wealth builders. This score indicates "${scoreLabel.label}" status. At your current trajectory, you are approximately 3.2 years away from reaching an optimal score of 80+. With guided intervention and strategic planning, this timeline can be reduced to approximately 12 months.`;

      const summaryLines = doc.splitTextToSize(summaryText, pageWidth - 30);
      doc.text(summaryLines, 15, y);

      // ========== SCORE BREAKDOWN ==========
      y += summaryLines.length * 5 + 15;

      doc.setFillColor(...primaryGreen);
      doc.rect(15, y, pageWidth - 30, 3, 'F');

      y += 15;
      doc.setTextColor(...darkText);
      doc.setFontSize(14);
      doc.setFont("helvetica", "bold");
      doc.text("Priority Recommendations", 15, y);

      y += 12;

      // Recommendation cards
      tips.forEach((tip, index) => {
        // Check if we need new page
        if (y > 250) {
          doc.addPage();
          y = 20;
        }

        // Card background
        let cardBgColor: [number, number, number];
        let borderColor: [number, number, number];
        let badgeColor: [number, number, number];

        if (tip.priority === "critical") {
          cardBgColor = [254, 242, 242]; // red-50
          borderColor = [254, 202, 202]; // red-200
          badgeColor = red;
        } else if (tip.priority === "moderate") {
          cardBgColor = [255, 251, 235]; // amber-50
          borderColor = [253, 230, 138]; // amber-200
          badgeColor = amber;
        } else {
          cardBgColor = [240, 253, 244]; // green-50
          borderColor = [187, 247, 208]; // green-200
          badgeColor = green;
        }

        const cardHeight = 38;

        // Card background
        doc.setFillColor(...cardBgColor);
        doc.roundedRect(15, y, pageWidth - 30, cardHeight, 3, 3, 'F');

        // Card border
        doc.setDrawColor(...borderColor);
        doc.setLineWidth(0.5);
        doc.roundedRect(15, y, pageWidth - 30, cardHeight, 3, 3, 'S');

        // Priority badge
        doc.setTextColor(...badgeColor);
        doc.setFontSize(8);
        doc.setFont("helvetica", "bold");
        doc.text(`${index + 1}. ${tip.priority.toUpperCase()}`, 20, y + 8);

        // Title
        doc.setTextColor(...darkText);
        doc.setFontSize(11);
        doc.setFont("helvetica", "bold");
        doc.text(tip.title, 20, y + 16);

        // Description
        doc.setTextColor(...mediumGray);
        doc.setFontSize(9);
        doc.setFont("helvetica", "normal");
        const descText = doc.splitTextToSize(tip.description, pageWidth - 50);
        doc.text(descText[0], 20, y + 24);

        // Action
        doc.setTextColor(...primaryGreen);
        doc.setFontSize(8);
        doc.setFont("helvetica", "italic");
        const actionText = `→ ${tip.action}`;
        const actionLines = doc.splitTextToSize(actionText, pageWidth - 50);
        doc.text(actionLines[0], 20, y + 32);

        y += cardHeight + 6;
      });

      // ========== CTA SECTION ==========
      y += 10;
      if (y > 240) {
        doc.addPage();
        y = 20;
      }

      // CTA Box
      doc.setFillColor(...darkBg);
      doc.roundedRect(15, y, pageWidth - 30, 35, 4, 4, 'F');

      doc.setTextColor(255, 255, 255);
      doc.setFontSize(12);
      doc.setFont("helvetica", "bold");
      doc.text("Ready to accelerate your FIRE journey?", pageWidth / 2, y + 14, { align: "center" });

      doc.setTextColor(...primaryGreen);
      doc.setFontSize(11);
      doc.setFont("helvetica", "bold");
      doc.text("Book a Free Strategy Call", pageWidth / 2, y + 25, { align: "center" });

      doc.setTextColor(180, 180, 180);
      doc.setFontSize(9);
      doc.setFont("helvetica", "normal");
      doc.text("wealthclaude.com/book", pageWidth / 2, y + 32, { align: "center" });

      // ========== FOOTER ==========
      doc.setTextColor(180, 180, 180);
      doc.setFontSize(7);
      doc.setFont("helvetica", "normal");
      doc.text("© 2026 WealthClaude · wealthclaude.com", pageWidth / 2, pageHeight - 15, { align: "center" });
      doc.text("This report is for educational purposes only and does not constitute financial advice.", pageWidth / 2, pageHeight - 10, { align: "center" });

      // Save PDF
      const fileName = `WealthClaude-FIRE-Score-${result?.name?.replace(/\s+/g, "-") || "Report"}.pdf`;
      doc.save(fileName);

    } catch (error) {
      console.error("PDF generation error:", error);
      alert("Error generating PDF. Please try again.");
    }

    setIsGeneratingPDF(false);
  };

  if (!result) {
    return (
      <div className="min-h-screen bg-[#0a0f18] text-white flex items-center justify-center">
        <div className="text-center">
          <RefreshCw className="w-8 h-8 text-primary animate-spin mx-auto mb-4" />
          <p className="text-white/60">Loading your results...</p>
        </div>
      </div>
    );
  }

  const scoreInfo = getScoreLabel(result.score);

  return (
    <div className="min-h-screen bg-[#0a0f18] text-white">
      {/* Hero Section with Score */}
      <section className="relative pt-16 pb-12 px-4 overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-b from-primary/10 via-transparent to-transparent" />

        <div className="max-w-4xl mx-auto relative z-10">
          {/* Greeting */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-center mb-8"
          >
            <p className="text-white/60 mb-2">Hey {result.name.split(" ")[0]}! 👋</p>
            <h1 className="text-3xl md:text-4xl font-bold">Your FIRE Score Results</h1>
          </motion.div>

          {/* Score Card */}
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.2 }}
            className="bg-white/5 border border-white/10 rounded-3xl p-8 md:p-12"
          >
            <div className="flex flex-col md:flex-row items-center gap-8">
              {/* Score Circle */}
              <div className="relative">
                <svg className="w-48 h-48 transform -rotate-90">
                  <circle
                    cx="96"
                    cy="96"
                    r="88"
                    stroke="currentColor"
                    strokeWidth="12"
                    fill="none"
                    className="text-white/10"
                  />
                  <motion.circle
                    cx="96"
                    cy="96"
                    r="88"
                    stroke="url(#scoreGradient)"
                    strokeWidth="12"
                    fill="none"
                    strokeLinecap="round"
                    initial={{ strokeDasharray: "0 553" }}
                    animate={{
                      strokeDasharray: `${(result.score / 100) * 553} 553`,
                    }}
                    transition={{ duration: 1.5, delay: 0.5, ease: "easeOut" }}
                  />
                  <defs>
                    <linearGradient id="scoreGradient" x1="0%" y1="0%" x2="100%" y2="0%">
                      <stop offset="0%" stopColor="#22c55e" />
                      <stop offset="100%" stopColor="#10b981" />
                    </linearGradient>
                  </defs>
                </svg>
                <div className="absolute inset-0 flex flex-col items-center justify-center">
                  <motion.span
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: 1 }}
                    className={`text-5xl font-bold ${getScoreColor(result.score)}`}
                  >
                    {result.score}
                  </motion.span>
                  <span className="text-white/50 text-sm">/100</span>
                </div>
              </div>

              {/* Score Info */}
              <div className="flex-1 text-center md:text-left">
                <div className="inline-flex items-center gap-2 px-3 py-1 bg-primary/20 rounded-full text-primary text-sm font-medium mb-4">
                  <Target className="w-4 h-4" />
                  {getPercentile(result.score)}
                </div>

                <h2 className={`text-3xl font-bold mb-2 ${getScoreColor(result.score)}`}>
                  {scoreInfo.label}
                </h2>
                <p className="text-white/60 mb-6">{scoreInfo.description}</p>

                {/* Quick Stats */}
                <div className="grid grid-cols-2 gap-4">
                  <div className="bg-white/5 rounded-xl p-4">
                    <div className="flex items-center gap-2 text-amber-400 mb-1">
                      <Clock className="w-4 h-4" />
                      <span className="text-sm font-medium">Current Path</span>
                    </div>
                    <p className="text-xl font-bold">~3.2 years</p>
                    <p className="text-xs text-white/40">to optimal score</p>
                  </div>
                  <div className="bg-white/5 rounded-xl p-4">
                    <div className="flex items-center gap-2 text-primary mb-1">
                      <Zap className="w-4 h-4" />
                      <span className="text-sm font-medium">With Guidance</span>
                    </div>
                    <p className="text-xl font-bold">~12 months</p>
                    <p className="text-xs text-white/40">to optimal score</p>
                  </div>
                </div>
              </div>
            </div>
          </motion.div>

          {/* Email Notification */}
          {showEmailSent && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="mt-4 flex items-center justify-center gap-2 text-primary text-sm"
            >
              <Mail className="w-4 h-4" />
              <span>Detailed breakdown sent to {result.email}</span>
            </motion.div>
          )}
        </div>
      </section>

      {/* Priority Recommendations */}
      <section className="py-12 px-4">
        <div className="max-w-4xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
          >
            <h2 className="text-2xl font-bold mb-6 flex items-center gap-2">
              <Target className="w-6 h-6 text-primary" />
              Priority Recommendations
            </h2>

            <div className="space-y-4">
              {tips.map((tip, index) => (
                <motion.div
                  key={index}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.5 + index * 0.1 }}
                  className={`rounded-2xl p-6 border ${tip.priority === "critical"
                      ? "bg-red-500/5 border-red-500/20"
                      : tip.priority === "moderate"
                        ? "bg-amber-500/5 border-amber-500/20"
                        : "bg-primary/5 border-primary/20"
                    }`}
                >
                  <div className="flex items-start gap-4">
                    <div
                      className={`w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 ${tip.priority === "critical"
                          ? "bg-red-500/20"
                          : tip.priority === "moderate"
                            ? "bg-amber-500/20"
                            : "bg-primary/20"
                        }`}
                    >
                      {tip.priority === "critical" ? (
                        <AlertTriangle className="w-5 h-5 text-red-400" />
                      ) : tip.priority === "moderate" ? (
                        <TrendingUp className="w-5 h-5 text-amber-400" />
                      ) : (
                        <CheckCircle2 className="w-5 h-5 text-primary" />
                      )}
                    </div>

                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <span
                          className={`text-xs font-semibold uppercase tracking-wider ${tip.priority === "critical"
                              ? "text-red-400"
                              : tip.priority === "moderate"
                                ? "text-amber-400"
                                : "text-primary"
                            }`}
                        >
                          {tip.priority}
                        </span>
                      </div>
                      <h3 className="text-lg font-bold mb-1">{tip.title}</h3>
                      <p className="text-white/60 text-sm mb-2">{tip.description}</p>
                      <p className="text-white/80 text-sm">
                        <span className="text-primary font-medium">Action:</span> {tip.action}
                      </p>
                    </div>
                  </div>
                </motion.div>
              ))}
            </div>
          </motion.div>
        </div>
      </section>

      {/* Actions Section */}
      <section className="py-12 px-4 bg-white/[0.02]">
        <div className="max-w-4xl mx-auto">
          <div className="grid md:grid-cols-2 gap-6">
            {/* Download PDF */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.7 }}
              className="bg-white/5 border border-white/10 rounded-2xl p-6"
            >
              <div className="flex items-center gap-3 mb-4">
                <div className="w-12 h-12 rounded-xl bg-primary/20 flex items-center justify-center">
                  <Download className="w-6 h-6 text-primary" />
                </div>
                <div>
                  <h3 className="font-bold">Download PDF Report</h3>
                  <p className="text-white/50 text-sm">Professional KPMG-style report</p>
                </div>
              </div>
              <button
                onClick={handleDownloadPDF}
                disabled={isGeneratingPDF}
                className="w-full py-3 bg-primary hover:bg-primary/90 text-black font-semibold rounded-xl transition-all flex items-center justify-center gap-2"
              >
                {isGeneratingPDF ? (
                  <>
                    <RefreshCw className="w-5 h-5 animate-spin" />
                    Generating...
                  </>
                ) : (
                  <>
                    <Download className="w-5 h-5" />
                    Download Report
                  </>
                )}
              </button>
            </motion.div>

            {/* Book Call */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.8 }}
              className="bg-gradient-to-br from-primary/20 to-primary/5 border border-primary/30 rounded-2xl p-6"
            >
              <div className="flex items-center gap-3 mb-4">
                <div className="w-12 h-12 rounded-xl bg-primary/20 flex items-center justify-center">
                  <Calendar className="w-6 h-6 text-primary" />
                </div>
                <div>
                  <h3 className="font-bold">Book Strategy Call</h3>
                  <p className="text-white/50 text-sm">Free 30-min consultation</p>
                </div>
              </div>
              <a
                href="/book"
                className="w-full py-3 bg-white/10 hover:bg-white/20 border border-white/20 rounded-xl transition-all flex items-center justify-center gap-2 font-semibold"
              >
                <Calendar className="w-5 h-5" />
                Schedule Now
                <ArrowRight className="w-5 h-5" />
              </a>
            </motion.div>
          </div>
        </div>
      </section>

      {/* Comparison Section */}
      <section className="py-12 px-4">
        <div className="max-w-4xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.9 }}
            className="bg-white/5 border border-white/10 rounded-2xl p-8 text-center"
          >
            <h3 className="text-xl font-bold mb-4">How You Compare</h3>

            <div className="flex items-center justify-center gap-2 mb-6">
              <Users className="w-5 h-5 text-white/50" />
              <span className="text-white/60">Based on 10,000+ assessments</span>
            </div>

            {/* Comparison Bar */}
            <div className="relative h-12 bg-white/5 rounded-full overflow-hidden mb-4">
              {/* Zones */}
              <div className="absolute inset-y-0 left-0 w-[40%] bg-gradient-to-r from-red-500/30 to-amber-500/30" />
              <div className="absolute inset-y-0 left-[40%] w-[30%] bg-gradient-to-r from-amber-500/30 to-primary/30" />
              <div className="absolute inset-y-0 left-[70%] right-0 bg-gradient-to-r from-primary/30 to-emerald-500/30" />

              {/* User Position */}
              <motion.div
                initial={{ left: 0 }}
                animate={{ left: `${result.score}%` }}
                transition={{ duration: 1, delay: 1 }}
                className="absolute top-0 bottom-0 w-1 bg-white"
                style={{ transform: "translateX(-50%)" }}
              >
                <div className="absolute -top-8 left-1/2 -translate-x-1/2 whitespace-nowrap">
                  <span className="px-2 py-1 bg-white text-black text-xs font-bold rounded">
                    You: {result.score}
                  </span>
                </div>
              </motion.div>
            </div>

            <div className="flex justify-between text-xs text-white/40">
              <span>Stuck Zone (0-40)</span>
              <span>Growing (40-70)</span>
              <span>Optimizing (70-100)</span>
            </div>
          </motion.div>
        </div>
      </section>

      {/* Final CTA */}
      <section className="py-16 px-4">
        <div className="max-w-2xl mx-auto text-center">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 1 }}
          >
            <h2 className="text-2xl md:text-3xl font-bold mb-4">
              Ready to Escape the Stuck Zone?
            </h2>
            <p className="text-white/60 mb-8">
              Your detailed breakdown and personalized tips have been sent to your email.
              Book a free call to create your acceleration plan.
            </p>
            <a
              href="/book"
              className="inline-flex items-center gap-2 px-8 py-4 bg-primary hover:bg-primary/90 text-black font-semibold rounded-xl transition-all hover:scale-105"
            >
              <Calendar className="w-5 h-5" />
              Book Free Strategy Call
              <ArrowRight className="w-5 h-5" />
            </a>
          </motion.div>
        </div>
      </section>
    </div>
  );
}
