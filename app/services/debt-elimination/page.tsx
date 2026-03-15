"use client";

import React, { useState } from "react";
import { motion } from "framer-motion";
import {
  PiggyBank,
  DollarSign,
  TrendingUp,
  TrendingDown,
  CheckCircle,
  XCircle,
  ArrowRight,
  ChevronDown,
  ChevronUp,
  Briefcase,
  Calculator,
  CreditCard,
  Home,
  GraduationCap,
  Car,
  Smartphone,
  Calendar,
  Shield,
  Users,
  HelpCircle,
  Zap,
  Target,
  Clock,
  Percent,
  AlertTriangle,
  Flame,
  Snowflake,
  Link2,
  Unlock,
  Ban,
  ArrowUpRight,
  BarChart3
} from "lucide-react";
import Link from "next/link";
import { Header } from "@/components/header";
import BookCallModal from "@/components/book-call-modal";

// Animation variants
const fadeInUp = {
  hidden: { opacity: 0, y: 30 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.6 } }
};

const staggerContainer = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: { staggerChildren: 0.1 }
  }
};

const scaleIn = {
  hidden: { opacity: 0, scale: 0.9 },
  visible: { opacity: 1, scale: 1, transition: { duration: 0.5 } }
};

// FAQ Data
const faqs = [
  {
    q: "Should I pay off debt or invest first?",
    a: "It depends on interest rates. Generally, pay off high-interest debt (>7%) first. For low-interest debt (<4%), investing may yield better returns. We help you find the optimal balance for YOUR situation."
  },
  {
    q: "What's the difference between avalanche and snowball methods?",
    a: "Avalanche targets highest interest first (saves the most money). Snowball targets smallest balance first (quick wins for motivation). Both work — we help you pick based on your psychology and numbers."
  },
  {
    q: "Should I consolidate my debt?",
    a: "Sometimes. Consolidation can lower rates and simplify payments, but it's not always the answer. We analyze if it makes sense for your specific debts and credit situation."
  },
  {
    q: "How long will it take to be debt-free?",
    a: "Depends on your debt, income, and commitment. Most clients see a clear path to debt freedom in 2-5 years with a proper strategy. We create a realistic timeline you can actually follow."
  },
  {
    q: "What about my credit score?",
    a: "Paying off debt strategically actually IMPROVES your credit score over time. We show you how to eliminate debt while building (not destroying) your credit."
  },
  {
    q: "I feel overwhelmed. Where do I even start?",
    a: "That's exactly why we exist. We take the chaos, organize it, and give you ONE clear next step at a time. No more anxiety — just a plan."
  }
];

export default function DebtEliminationPage() {
  const [openFaq, setOpenFaq] = useState<number | null>(null);
  const [isBookCallOpen, setIsBookCallOpen] = useState(false);

  return (
    <div className="min-h-screen bg-[#0a0f18] text-white overflow-x-hidden">
      <Header />

      <main>
        {/* HERO SECTION */}
        <section className="relative pt-32 pb-20 px-4 overflow-hidden">
          {/* Background Effects */}
          <div className="absolute inset-0 bg-gradient-to-b from-red-500/5 via-transparent to-transparent" />
          <div className="absolute top-20 left-1/4 w-96 h-96 bg-red-500/10 rounded-full blur-3xl" />
          <div className="absolute bottom-0 right-1/4 w-80 h-80 bg-primary/5 rounded-full blur-3xl" />

          <div className="max-w-6xl mx-auto relative">
            <motion.div
              initial="hidden"
              animate="visible"
              variants={staggerContainer}
              className="text-center mb-16"
            >
              <motion.h1
                variants={fadeInUp}
                className="text-4xl md:text-6xl font-bold mb-6 leading-tight"
              >
                Debt Isn't a Life Sentence.
                <br />
                <span className="text-primary">It's a Math Problem.</span>
              </motion.h1>

              <motion.p
                variants={fadeInUp}
                className="text-xl text-white/60 max-w-3xl mx-auto mb-8"
              >
                The average American carries <span className="text-red-400 font-semibold">$104,215 in debt</span>.
                Most will pay it off... eventually. You don't have to be "most."
              </motion.p>

              <motion.div variants={fadeInUp} className="flex flex-col sm:flex-row gap-4 justify-center">
                <Link
                  href="/fire-score"
                  className="inline-flex items-center justify-center gap-2 bg-primary hover:bg-primary/90 text-white font-bold px-8 py-4 rounded-xl transition-colors"
                >
                  <Zap className="w-5 h-5" />
                  Take FIRE Score Test
                </Link>
                <button
                  onClick={() => setIsBookCallOpen(true)}
                  className="inline-flex items-center justify-center gap-2 bg-white/10 hover:bg-white/20 border border-white/20 text-white font-bold px-8 py-4 rounded-xl transition-colors"
                >
                  <Briefcase className="w-5 h-5" />
                  Book Free Strategy Call
                </button>
              </motion.div>
            </motion.div>

            {/* TWO PATHS COMPARISON */}
            <motion.div
              initial="hidden"
              animate="visible"
              variants={staggerContainer}
              className="grid md:grid-cols-2 gap-8 max-w-5xl mx-auto"
            >
              {/* DEBT TRAPPED */}
              <motion.div
                variants={scaleIn}
                className="relative bg-gradient-to-b from-red-500/10 to-transparent border border-red-500/20 rounded-2xl p-6 overflow-hidden"
              >
                <div className="absolute top-0 right-0 w-32 h-32 bg-red-500/10 rounded-full blur-2xl" />

                <div className="relative">
                  <div className="flex items-center gap-3 mb-6">
                    <div className="w-12 h-12 bg-red-500/20 rounded-xl flex items-center justify-center">
                      <Link2 className="w-6 h-6 text-red-400" />
                    </div>
                    <div>
                      <h3 className="font-bold text-lg">Debt Trapped</h3>
                      <p className="text-red-400 text-sm">"I'll pay minimums"</p>
                    </div>
                  </div>

                  <div className="space-y-4 mb-6">
                    <div className="bg-white/5 rounded-lg p-4">
                      <p className="text-white/40 text-xs mb-1">TOTAL DEBT</p>
                      <p className="text-2xl font-bold">$45,000</p>
                      <p className="text-white/40 text-xs">Credit cards + car + student loans</p>
                    </div>

                    <div className="bg-red-500/10 border border-red-500/20 rounded-lg p-4">
                      <p className="text-red-400 text-xs mb-1">MONTHLY PAYMENT</p>
                      <p className="text-xl font-bold">$850</p>
                      <p className="text-white/40 text-xs">Minimum payments only</p>
                    </div>

                    <div className="bg-white/5 rounded-lg p-4">
                      <p className="text-white/40 text-xs mb-1">TIME TO PAYOFF</p>
                      <p className="text-xl font-bold">18 years</p>
                    </div>

                    <div className="bg-red-500/20 border border-red-500/30 rounded-lg p-4">
                      <p className="text-white/40 text-xs mb-1">TOTAL INTEREST PAID</p>
                      <p className="text-2xl font-bold text-red-400">$38,420</p>
                    </div>
                  </div>

                  <div className="space-y-2 border-t border-white/10 pt-4">
                    <div className="flex items-center gap-2 text-sm text-red-400">
                      <XCircle className="w-4 h-4" />
                      <span>No strategy</span>
                    </div>
                    <div className="flex items-center gap-2 text-sm text-red-400">
                      <XCircle className="w-4 h-4" />
                      <span>Paying interest on interest</span>
                    </div>
                    <div className="flex items-center gap-2 text-sm text-red-400">
                      <XCircle className="w-4 h-4" />
                      <span>Can't invest or save</span>
                    </div>
                    <div className="flex items-center gap-2 text-sm text-red-400">
                      <XCircle className="w-4 h-4" />
                      <span>Constant stress</span>
                    </div>
                  </div>

                  <div className="mt-6 text-center">
                    <span className="text-3xl">😰</span>
                    <p className="text-white/40 text-sm mt-2">78% of Americans</p>
                  </div>
                </div>
              </motion.div>

              {/* DEBT FREE PATH */}
              <motion.div
                variants={scaleIn}
                className="relative bg-gradient-to-b from-primary/20 to-transparent border-2 border-primary/40 rounded-2xl p-6 overflow-hidden"
              >
                <div className="absolute top-0 right-0 w-32 h-32 bg-primary/20 rounded-full blur-2xl" />

                <div className="relative">
                  <div className="flex items-center gap-3 mb-6">
                    <div className="w-12 h-12 bg-primary/20 rounded-xl flex items-center justify-center">
                      <Unlock className="w-6 h-6 text-primary" />
                    </div>
                    <div>
                      <h3 className="font-bold text-lg">Debt Free Path</h3>
                      <p className="text-primary text-sm">"I have a payoff plan"</p>
                    </div>
                  </div>

                  <div className="space-y-4 mb-6">
                    <div className="bg-white/5 rounded-lg p-4">
                      <p className="text-white/40 text-xs mb-1">TOTAL DEBT</p>
                      <p className="text-2xl font-bold">$45,000</p>
                      <p className="text-white/40 text-xs">Same starting point</p>
                    </div>

                    <div className="bg-primary/10 border border-primary/20 rounded-lg p-4">
                      <p className="text-primary text-xs mb-1">MONTHLY PAYMENT</p>
                      <p className="text-xl font-bold text-primary">$1,200</p>
                      <p className="text-white/40 text-xs">Strategic extra payments</p>
                    </div>

                    <div className="bg-white/5 rounded-lg p-4">
                      <p className="text-white/40 text-xs mb-1">TIME TO PAYOFF</p>
                      <p className="text-xl font-bold text-primary">3.5 years</p>
                    </div>

                    <div className="bg-primary/20 border border-primary/30 rounded-lg p-4">
                      <p className="text-white/40 text-xs mb-1">TOTAL INTEREST PAID</p>
                      <p className="text-2xl font-bold text-primary">$8,640</p>
                    </div>
                  </div>

                  <div className="space-y-2 border-t border-white/10 pt-4">
                    <div className="flex items-center gap-2 text-sm text-primary">
                      <CheckCircle className="w-4 h-4" />
                      <span>Clear payoff strategy</span>
                    </div>
                    <div className="flex items-center gap-2 text-sm text-primary">
                      <CheckCircle className="w-4 h-4" />
                      <span>Highest interest first</span>
                    </div>
                    <div className="flex items-center gap-2 text-sm text-primary">
                      <CheckCircle className="w-4 h-4" />
                      <span>Then invest the freed cash</span>
                    </div>
                    <div className="flex items-center gap-2 text-sm text-primary">
                      <CheckCircle className="w-4 h-4" />
                      <span>Peace of mind</span>
                    </div>
                  </div>

                  <div className="mt-6 text-center">
                    <span className="text-3xl">🚀</span>
                    <p className="text-primary text-sm mt-2 font-medium">The Debt-Free Few</p>
                  </div>
                </div>
              </motion.div>
            </motion.div>

            {/* Savings Callout */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.5 }}
              className="mt-12 text-center"
            >
              <div className="inline-block bg-gradient-to-r from-primary/20 to-emerald-500/20 border border-primary/30 rounded-2xl p-6">
                <p className="text-white/60 text-sm mb-2">INTEREST SAVED</p>
                <p className="text-4xl font-bold text-primary mb-2">$29,780</p>
                <p className="text-white/50 text-sm">Same debt. Different strategy. <span className="text-primary">14.5 years of freedom gained.</span></p>
              </div>
            </motion.div>
          </div>
        </section>

        {/* DEBT TYPES BREAKDOWN */}
        <section className="py-20 px-4 bg-gradient-to-b from-transparent via-white/[0.02] to-transparent">
          <div className="max-w-6xl mx-auto">
            <motion.div
              initial="hidden"
              whileInView="visible"
              viewport={{ once: true }}
              variants={staggerContainer}
              className="text-center mb-16"
            >
              <motion.h2 variants={fadeInUp} className="text-3xl md:text-4xl font-bold mb-4">
                The <span className="text-red-400">Debt</span> Holding You Back
              </motion.h2>
              <motion.p variants={fadeInUp} className="text-white/60 max-w-2xl mx-auto">
                Not all debt is created equal. Know your enemy.
              </motion.p>
            </motion.div>

            <motion.div
              initial="hidden"
              whileInView="visible"
              viewport={{ once: true }}
              variants={staggerContainer}
              className="grid md:grid-cols-2 lg:grid-cols-4 gap-6"
            >
              {[
                {
                  icon: CreditCard,
                  title: "Credit Cards",
                  rate: "20-29% APR",
                  avg: "$6,501 avg",
                  danger: "HIGH",
                  color: "red"
                },
                {
                  icon: GraduationCap,
                  title: "Student Loans",
                  rate: "5-8% APR",
                  avg: "$37,338 avg",
                  danger: "MEDIUM",
                  color: "yellow"
                },
                {
                  icon: Car,
                  title: "Auto Loans",
                  rate: "6-12% APR",
                  avg: "$23,792 avg",
                  danger: "MEDIUM",
                  color: "yellow"
                },
                {
                  icon: Home,
                  title: "Mortgage",
                  rate: "6-7% APR",
                  avg: "$244,498 avg",
                  danger: "LOW",
                  color: "green"
                }
              ].map((item, index) => (
                <motion.div
                  key={index}
                  variants={fadeInUp}
                  className="bg-white/5 border border-white/10 rounded-2xl p-6 hover:border-white/20 transition-colors"
                >
                  <div className={`w-12 h-12 rounded-xl flex items-center justify-center mb-4 ${item.color === 'red' ? 'bg-red-500/20' :
                      item.color === 'yellow' ? 'bg-yellow-500/20' : 'bg-green-500/20'
                    }`}>
                    <item.icon className={`w-6 h-6 ${item.color === 'red' ? 'text-red-400' :
                        item.color === 'yellow' ? 'text-yellow-400' : 'text-green-400'
                      }`} />
                  </div>
                  <h3 className="font-bold text-lg mb-2">{item.title}</h3>
                  <div className="space-y-2">
                    <div className="flex justify-between text-sm">
                      <span className="text-white/40">Interest</span>
                      <span className={`font-medium ${item.color === 'red' ? 'text-red-400' :
                          item.color === 'yellow' ? 'text-yellow-400' : 'text-green-400'
                        }`}>{item.rate}</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-white/40">Average</span>
                      <span className="text-white/80">{item.avg}</span>
                    </div>
                    <div className={`inline-block px-2 py-1 rounded text-xs font-bold mt-2 ${item.color === 'red' ? 'bg-red-500/20 text-red-400' :
                        item.color === 'yellow' ? 'bg-yellow-500/20 text-yellow-400' : 'bg-green-500/20 text-green-400'
                      }`}>
                      {item.danger} PRIORITY
                    </div>
                  </div>
                </motion.div>
              ))}
            </motion.div>

            <motion.p
              initial="hidden"
              whileInView="visible"
              viewport={{ once: true }}
              variants={fadeInUp}
              className="text-center text-white/40 mt-8 text-sm"
            >
              💡 Rule of thumb: Attack high-interest debt first. Low-interest debt can sometimes be leveraged.
            </motion.p>
          </div>
        </section>

        {/* THE MYTHS SECTION */}
        <section className="py-20 px-4 bg-gradient-to-b from-transparent via-red-500/5 to-transparent">
          <div className="max-w-6xl mx-auto">
            <motion.div
              initial="hidden"
              whileInView="visible"
              viewport={{ once: true }}
              variants={staggerContainer}
              className="text-center mb-16"
            >
              <motion.h2 variants={fadeInUp} className="text-3xl md:text-4xl font-bold mb-4">
                Debt Myths Keeping You <span className="text-red-400">Stuck</span>
              </motion.h2>
              <motion.p variants={fadeInUp} className="text-white/60 max-w-2xl mx-auto">
                Stop believing the lies that keep you in chains
              </motion.p>
            </motion.div>

            <motion.div
              initial="hidden"
              whileInView="visible"
              viewport={{ once: true }}
              variants={staggerContainer}
              className="grid md:grid-cols-2 lg:grid-cols-3 gap-6"
            >
              {[
                {
                  myth: "Some debt is too big to pay off",
                  reality: "Every debt can be eliminated with the right strategy and timeline"
                },
                {
                  myth: "I should pay off all debt before investing",
                  reality: "Low-interest debt? You might be better off investing simultaneously"
                },
                {
                  myth: "Minimum payments are fine",
                  reality: "Minimums are designed to maximize bank profits, not help you"
                },
                {
                  myth: "Debt consolidation is always good",
                  reality: "Sometimes yes, sometimes it extends your debt. We analyze first"
                },
                {
                  myth: "I need to earn more to pay off debt",
                  reality: "Strategy beats income. We've helped people at every level"
                },
                {
                  myth: "Bankruptcy is my only option",
                  reality: "Bankruptcy is rarely necessary. Usually there's a better path"
                }
              ].map((item, index) => (
                <motion.div
                  key={index}
                  variants={fadeInUp}
                  className="relative group"
                >
                  <div className="absolute inset-0 bg-gradient-to-r from-red-500/20 to-primary/20 rounded-2xl blur-xl opacity-0 group-hover:opacity-100 transition-opacity" />
                  <div className="relative bg-white/5 border border-white/10 rounded-2xl p-6 h-full hover:border-white/20 transition-colors">
                    <div className="flex items-start gap-3 mb-4">
                      <div className="w-8 h-8 bg-red-500/20 rounded-lg flex items-center justify-center flex-shrink-0">
                        <XCircle className="w-4 h-4 text-red-400" />
                      </div>
                      <div>
                        <p className="text-red-400 text-xs font-medium uppercase tracking-wide mb-1">Myth</p>
                        <p className="text-white/80 font-medium">"{item.myth}"</p>
                      </div>
                    </div>
                    <div className="flex items-start gap-3">
                      <div className="w-8 h-8 bg-primary/20 rounded-lg flex items-center justify-center flex-shrink-0">
                        <CheckCircle className="w-4 h-4 text-primary" />
                      </div>
                      <div>
                        <p className="text-primary text-xs font-medium uppercase tracking-wide mb-1">Reality</p>
                        <p className="text-white/60">{item.reality}</p>
                      </div>
                    </div>
                  </div>
                </motion.div>
              ))}
            </motion.div>
          </div>
        </section>

        {/* PAYOFF METHODS SECTION */}
        <section className="py-20 px-4">
          <div className="max-w-5xl mx-auto">
            <motion.div
              initial="hidden"
              whileInView="visible"
              viewport={{ once: true }}
              variants={staggerContainer}
              className="text-center mb-16"
            >
              <motion.h2 variants={fadeInUp} className="text-3xl md:text-4xl font-bold mb-4">
                Two Proven Methods. <span className="text-primary">Pick Your Weapon.</span>
              </motion.h2>
              <motion.p variants={fadeInUp} className="text-white/60 max-w-2xl mx-auto">
                Both work. We help you pick the right one for YOUR brain.
              </motion.p>
            </motion.div>

            <motion.div
              initial="hidden"
              whileInView="visible"
              viewport={{ once: true }}
              variants={staggerContainer}
              className="grid md:grid-cols-2 gap-8"
            >
              {/* AVALANCHE METHOD */}
              <motion.div
                variants={scaleIn}
                className="bg-gradient-to-b from-blue-500/10 to-transparent border border-blue-500/20 rounded-2xl p-8"
              >
                <div className="flex items-center gap-4 mb-6">
                  <div className="w-16 h-16 bg-blue-500/20 rounded-2xl flex items-center justify-center">
                    <Flame className="w-8 h-8 text-blue-400" />
                  </div>
                  <div>
                    <h3 className="text-2xl font-bold">Avalanche Method</h3>
                    <p className="text-blue-400">Highest interest first</p>
                  </div>
                </div>

                <div className="space-y-4 mb-6">
                  <p className="text-white/70">
                    Attack the debt with the <span className="text-blue-400 font-semibold">highest interest rate</span> first, regardless of balance. Mathematically optimal.
                  </p>

                  <div className="bg-white/5 rounded-xl p-4">
                    <p className="text-white/40 text-xs mb-2">EXAMPLE PAYOFF ORDER:</p>
                    <div className="space-y-2">
                      <div className="flex justify-between text-sm">
                        <span>1. Credit Card</span>
                        <span className="text-blue-400">24% APR</span>
                      </div>
                      <div className="flex justify-between text-sm text-white/60">
                        <span>2. Personal Loan</span>
                        <span>12% APR</span>
                      </div>
                      <div className="flex justify-between text-sm text-white/60">
                        <span>3. Car Loan</span>
                        <span>7% APR</span>
                      </div>
                      <div className="flex justify-between text-sm text-white/60">
                        <span>4. Student Loan</span>
                        <span>5% APR</span>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="space-y-3">
                  <div className="flex items-center gap-2 text-sm text-blue-400">
                    <CheckCircle className="w-4 h-4" />
                    <span>Saves the most money</span>
                  </div>
                  <div className="flex items-center gap-2 text-sm text-blue-400">
                    <CheckCircle className="w-4 h-4" />
                    <span>Mathematically optimal</span>
                  </div>
                  <div className="flex items-center gap-2 text-sm text-white/40">
                    <AlertTriangle className="w-4 h-4" />
                    <span>Slower early wins (can be demotivating)</span>
                  </div>
                </div>

                <div className="mt-6 pt-4 border-t border-white/10">
                  <p className="text-white/40 text-sm">Best for: <span className="text-white/80">Disciplined, numbers-driven people</span></p>
                </div>
              </motion.div>

              {/* SNOWBALL METHOD */}
              <motion.div
                variants={scaleIn}
                className="bg-gradient-to-b from-cyan-500/10 to-transparent border border-cyan-500/20 rounded-2xl p-8"
              >
                <div className="flex items-center gap-4 mb-6">
                  <div className="w-16 h-16 bg-cyan-500/20 rounded-2xl flex items-center justify-center">
                    <Snowflake className="w-8 h-8 text-cyan-400" />
                  </div>
                  <div>
                    <h3 className="text-2xl font-bold">Snowball Method</h3>
                    <p className="text-cyan-400">Smallest balance first</p>
                  </div>
                </div>

                <div className="space-y-4 mb-6">
                  <p className="text-white/70">
                    Attack the debt with the <span className="text-cyan-400 font-semibold">smallest balance</span> first, regardless of interest. Psychologically powerful.
                  </p>

                  <div className="bg-white/5 rounded-xl p-4">
                    <p className="text-white/40 text-xs mb-2">EXAMPLE PAYOFF ORDER:</p>
                    <div className="space-y-2">
                      <div className="flex justify-between text-sm">
                        <span>1. Medical Bill</span>
                        <span className="text-cyan-400">$500</span>
                      </div>
                      <div className="flex justify-between text-sm text-white/60">
                        <span>2. Credit Card</span>
                        <span>$2,500</span>
                      </div>
                      <div className="flex justify-between text-sm text-white/60">
                        <span>3. Car Loan</span>
                        <span>$8,000</span>
                      </div>
                      <div className="flex justify-between text-sm text-white/60">
                        <span>4. Student Loan</span>
                        <span>$25,000</span>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="space-y-3">
                  <div className="flex items-center gap-2 text-sm text-cyan-400">
                    <CheckCircle className="w-4 h-4" />
                    <span>Quick wins build momentum</span>
                  </div>
                  <div className="flex items-center gap-2 text-sm text-cyan-400">
                    <CheckCircle className="w-4 h-4" />
                    <span>Psychologically rewarding</span>
                  </div>
                  <div className="flex items-center gap-2 text-sm text-white/40">
                    <AlertTriangle className="w-4 h-4" />
                    <span>May pay more interest overall</span>
                  </div>
                </div>

                <div className="mt-6 pt-4 border-t border-white/10">
                  <p className="text-white/40 text-sm">Best for: <span className="text-white/80">People who need motivation wins</span></p>
                </div>
              </motion.div>
            </motion.div>

            <motion.div
              initial="hidden"
              whileInView="visible"
              viewport={{ once: true }}
              variants={fadeInUp}
              className="mt-8 text-center"
            >
              <p className="text-white/60 bg-white/5 border border-white/10 rounded-xl p-4 inline-block">
                💡 <span className="text-white/80">Pro tip:</span> We sometimes recommend a <span className="text-primary font-semibold">hybrid approach</span> — quick snowball wins first, then switch to avalanche for maximum savings.
              </p>
            </motion.div>
          </div>
        </section>

        {/* REAL SCENARIOS SECTION */}
        <section className="py-20 px-4 bg-gradient-to-b from-transparent via-white/[0.02] to-transparent">
          <div className="max-w-6xl mx-auto">
            <motion.div
              initial="hidden"
              whileInView="visible"
              viewport={{ once: true }}
              variants={staggerContainer}
              className="text-center mb-16"
            >
              <motion.h2 variants={fadeInUp} className="text-3xl md:text-4xl font-bold mb-4">
                From Drowning to <span className="text-primary">Debt-Free</span>
              </motion.h2>
              <motion.p variants={fadeInUp} className="text-white/60 max-w-2xl mx-auto">
                Real transformations. Real timelines.
              </motion.p>
            </motion.div>

            <motion.div
              initial="hidden"
              whileInView="visible"
              viewport={{ once: true }}
              variants={staggerContainer}
              className="grid md:grid-cols-3 gap-8"
            >
              {/* Scenario 1 */}
              <motion.div variants={fadeInUp} className="group">
                <div className="bg-white/5 border border-white/10 rounded-2xl overflow-hidden hover:border-primary/30 transition-colors">
                  <div className="h-2 bg-gradient-to-r from-red-500 to-primary" />
                  <div className="p-6">
                    <div className="flex items-center gap-3 mb-4">
                      <div className="w-12 h-12 bg-blue-500/20 rounded-full flex items-center justify-center">
                        <span className="text-2xl">👨‍🎓</span>
                      </div>
                      <div>
                        <h3 className="font-bold">The Recent Grad</h3>
                        <p className="text-white/40 text-sm">Jake, 26</p>
                      </div>
                    </div>

                    <div className="bg-red-500/10 border border-red-500/20 rounded-lg p-4 mb-4">
                      <p className="text-red-400 text-xs mb-1">STARTING DEBT</p>
                      <p className="text-2xl font-bold text-red-400">$67,000</p>
                      <p className="text-white/40 text-xs">Student loans + credit cards</p>
                    </div>

                    <div className="space-y-3 mb-4">
                      <div className="flex justify-between items-center text-sm">
                        <span className="text-white/60">Strategy</span>
                        <span className="text-primary">Hybrid method</span>
                      </div>
                      <div className="flex justify-between items-center text-sm">
                        <span className="text-white/60">Extra/month</span>
                        <span className="text-white/80">+$400</span>
                      </div>
                      <div className="flex justify-between items-center text-sm">
                        <span className="text-white/60">Time to freedom</span>
                        <span className="text-primary font-bold">4.5 years</span>
                      </div>
                    </div>

                    <div className="bg-primary/10 border border-primary/20 rounded-lg p-4">
                      <p className="text-primary text-xs mb-1">INTEREST SAVED</p>
                      <p className="text-xl font-bold text-primary">$24,380</p>
                    </div>
                  </div>
                </div>
              </motion.div>

              {/* Scenario 2 */}
              <motion.div variants={fadeInUp} className="group">
                <div className="bg-white/5 border border-white/10 rounded-2xl overflow-hidden hover:border-primary/30 transition-colors">
                  <div className="h-2 bg-gradient-to-r from-red-500 to-primary" />
                  <div className="p-6">
                    <div className="flex items-center gap-3 mb-4">
                      <div className="w-12 h-12 bg-purple-500/20 rounded-full flex items-center justify-center">
                        <span className="text-2xl">👩‍👧</span>
                      </div>
                      <div>
                        <h3 className="font-bold">The Single Mom</h3>
                        <p className="text-white/40 text-sm">Sarah, 38</p>
                      </div>
                    </div>

                    <div className="bg-red-500/10 border border-red-500/20 rounded-lg p-4 mb-4">
                      <p className="text-red-400 text-xs mb-1">STARTING DEBT</p>
                      <p className="text-2xl font-bold text-red-400">$32,000</p>
                      <p className="text-white/40 text-xs">Credit cards + medical bills</p>
                    </div>

                    <div className="space-y-3 mb-4">
                      <div className="flex justify-between items-center text-sm">
                        <span className="text-white/60">Strategy</span>
                        <span className="text-primary">Snowball method</span>
                      </div>
                      <div className="flex justify-between items-center text-sm">
                        <span className="text-white/60">Extra/month</span>
                        <span className="text-white/80">+$250</span>
                      </div>
                      <div className="flex justify-between items-center text-sm">
                        <span className="text-white/60">Time to freedom</span>
                        <span className="text-primary font-bold">3 years</span>
                      </div>
                    </div>

                    <div className="bg-primary/10 border border-primary/20 rounded-lg p-4">
                      <p className="text-primary text-xs mb-1">INTEREST SAVED</p>
                      <p className="text-xl font-bold text-primary">$11,200</p>
                    </div>
                  </div>
                </div>
              </motion.div>

              {/* Scenario 3 */}
              <motion.div variants={fadeInUp} className="group">
                <div className="bg-white/5 border border-white/10 rounded-2xl overflow-hidden hover:border-primary/30 transition-colors">
                  <div className="h-2 bg-gradient-to-r from-red-500 to-primary" />
                  <div className="p-6">
                    <div className="flex items-center gap-3 mb-4">
                      <div className="w-12 h-12 bg-orange-500/20 rounded-full flex items-center justify-center">
                        <span className="text-2xl">👨‍👩‍👦</span>
                      </div>
                      <div>
                        <h3 className="font-bold">The Overwhelmed Family</h3>
                        <p className="text-white/40 text-sm">The Martins</p>
                      </div>
                    </div>

                    <div className="bg-red-500/10 border border-red-500/20 rounded-lg p-4 mb-4">
                      <p className="text-red-400 text-xs mb-1">STARTING DEBT</p>
                      <p className="text-2xl font-bold text-red-400">$89,000</p>
                      <p className="text-white/40 text-xs">Everything. Everywhere.</p>
                    </div>

                    <div className="space-y-3 mb-4">
                      <div className="flex justify-between items-center text-sm">
                        <span className="text-white/60">Strategy</span>
                        <span className="text-primary">Avalanche + consolidation</span>
                      </div>
                      <div className="flex justify-between items-center text-sm">
                        <span className="text-white/60">Extra/month</span>
                        <span className="text-white/80">+$800</span>
                      </div>
                      <div className="flex justify-between items-center text-sm">
                        <span className="text-white/60">Time to freedom</span>
                        <span className="text-primary font-bold">5 years</span>
                      </div>
                    </div>

                    <div className="bg-primary/10 border border-primary/20 rounded-lg p-4">
                      <p className="text-primary text-xs mb-1">INTEREST SAVED</p>
                      <p className="text-xl font-bold text-primary">$41,600</p>
                    </div>
                  </div>
                </div>
              </motion.div>
            </motion.div>
          </div>
        </section>

        {/* WHAT WE DO SECTION */}
        <section className="py-20 px-4">
          <div className="max-w-5xl mx-auto">
            <motion.div
              initial="hidden"
              whileInView="visible"
              viewport={{ once: true }}
              variants={staggerContainer}
              className="text-center mb-16"
            >
              <motion.h2 variants={fadeInUp} className="text-3xl md:text-4xl font-bold mb-4">
                Your Debt <span className="text-primary">Destruction</span> Team
              </motion.h2>
              <motion.p variants={fadeInUp} className="text-white/60 max-w-2xl mx-auto">
                We don't just make a spreadsheet. We make a battle plan.
              </motion.p>
            </motion.div>

            <motion.div
              initial="hidden"
              whileInView="visible"
              viewport={{ once: true }}
              variants={staggerContainer}
              className="grid md:grid-cols-2 lg:grid-cols-3 gap-6"
            >
              {[
                { icon: Calculator, title: "Complete Debt Audit", desc: "We map every debt, rate, and payment to see the full picture" },
                { icon: Target, title: "Custom Payoff Strategy", desc: "Avalanche, snowball, or hybrid — tailored to your psychology" },
                { icon: BarChart3, title: "Monthly Budget Analysis", desc: "Find hidden money you didn't know you had" },
                { icon: Percent, title: "Rate Negotiation Tips", desc: "Scripts and strategies to lower your interest rates" },
                { icon: Calendar, title: "Timeline & Milestones", desc: "Clear checkpoints so you see progress happening" },
                { icon: TrendingUp, title: "Post-Debt Investment Plan", desc: "What to do with all that freed-up cash flow" }
              ].map((item, index) => (
                <motion.div
                  key={index}
                  variants={fadeInUp}
                  className="bg-white/5 border border-white/10 rounded-xl p-6 text-center hover:border-primary/30 transition-colors"
                >
                  <div className="w-14 h-14 bg-primary/20 rounded-xl flex items-center justify-center mx-auto mb-4">
                    <item.icon className="w-7 h-7 text-primary" />
                  </div>
                  <h3 className="font-bold text-lg mb-2">{item.title}</h3>
                  <p className="text-white/60 text-sm">{item.desc}</p>
                </motion.div>
              ))}
            </motion.div>
          </div>
        </section>

        {/* CTA SECTION */}
        <section className="py-20 px-4">
          <div className="max-w-4xl mx-auto">
            <motion.div
              initial="hidden"
              whileInView="visible"
              viewport={{ once: true }}
              variants={scaleIn}
              className="relative overflow-hidden"
            >
              <div className="absolute inset-0 bg-gradient-to-r from-primary/20 via-emerald-500/20 to-primary/20 rounded-3xl" />
              <div className="absolute top-0 right-0 w-64 h-64 bg-primary/30 rounded-full blur-3xl" />
              <div className="absolute bottom-0 left-0 w-48 h-48 bg-emerald-500/20 rounded-full blur-3xl" />

              <div className="relative bg-[#0a0f18]/80 border border-primary/30 rounded-3xl p-8 md:p-12 backdrop-blur-sm">
                <div className="text-center">
                  <div className="text-5xl mb-4">⛓️‍💥</div>
                  <h2 className="text-3xl md:text-4xl font-bold mb-4">
                    Break Free. For Good.
                  </h2>
                  <p className="text-white/60 max-w-xl mx-auto mb-8">
                    Every month you wait, interest compounds against you. Let's flip the script.
                  </p>

                  <div className="flex flex-col sm:flex-row gap-4 justify-center">
                    <Link
                      href="/fire-score"
                      className="inline-flex items-center justify-center gap-2 bg-primary hover:bg-primary/90 text-white font-bold px-8 py-4 rounded-xl transition-colors"
                    >
                      <Zap className="w-5 h-5" />
                      Take FIRE Score Test
                    </Link>
                    <button
                      onClick={() => setIsBookCallOpen(true)}
                      className="inline-flex items-center justify-center gap-2 bg-white/10 hover:bg-white/20 border border-white/20 text-white font-bold px-8 py-4 rounded-xl transition-colors"
                    >
                      <Briefcase className="w-5 h-5" />
                      Book Debt Strategy Call
                    </button>
                  </div>

                  <p className="text-white/40 text-sm mt-6">
                    Free consultation. No judgment. Just a plan.
                  </p>
                </div>
              </div>
            </motion.div>
          </div>
        </section>

        {/* FAQ SECTION */}
        <section className="py-20 px-4">
          <div className="max-w-3xl mx-auto">
            <motion.div
              initial="hidden"
              whileInView="visible"
              viewport={{ once: true }}
              variants={staggerContainer}
              className="text-center mb-12"
            >
              <motion.h2 variants={fadeInUp} className="text-3xl md:text-4xl font-bold mb-4">
                Common <span className="text-primary">Questions</span>
              </motion.h2>
            </motion.div>

            <motion.div
              initial="hidden"
              whileInView="visible"
              viewport={{ once: true }}
              variants={staggerContainer}
              className="space-y-4"
            >
              {faqs.map((faq, index) => (
                <motion.div
                  key={index}
                  variants={fadeInUp}
                  className="bg-white/5 border border-white/10 rounded-xl overflow-hidden"
                >
                  <button
                    onClick={() => setOpenFaq(openFaq === index ? null : index)}
                    className="w-full flex items-center justify-between p-5 text-left hover:bg-white/5 transition-colors"
                  >
                    <div className="flex items-center gap-3">
                      <HelpCircle className="w-5 h-5 text-primary flex-shrink-0" />
                      <span className="font-medium">{faq.q}</span>
                    </div>
                    {openFaq === index ? (
                      <ChevronUp className="w-5 h-5 text-white/40" />
                    ) : (
                      <ChevronDown className="w-5 h-5 text-white/40" />
                    )}
                  </button>
                  {openFaq === index && (
                    <div className="px-5 pb-5 pt-0">
                      <div className="pl-8 border-l-2 border-primary/30">
                        <p className="text-white/70 leading-relaxed">{faq.a}</p>
                      </div>
                    </div>
                  )}
                </motion.div>
              ))}
            </motion.div>
          </div>
        </section>

        {/* FINAL CTA */}
        <section className="py-16 px-4 border-t border-white/10">
          <div className="max-w-4xl mx-auto text-center">
            <p className="text-white/40 mb-4">Ready to become debt-free?</p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link
                href="/fire-score"
                className="inline-flex items-center justify-center gap-2 text-primary hover:text-white transition-colors"
              >
                Take FIRE Score Test
                <ArrowRight className="w-4 h-4" />
              </Link>
              <span className="text-white/20 hidden sm:inline">|</span>
              <button
                onClick={() => setIsBookCallOpen(true)}
                className="inline-flex items-center justify-center gap-2 text-white/60 hover:text-white transition-colors"
              >
                Book Strategy Call
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        </section>
      </main>

      {/* Book Call Modal */}
      <BookCallModal
        isOpen={isBookCallOpen}
        onClose={() => setIsBookCallOpen(false)}
      />
    </div>
  );
}
