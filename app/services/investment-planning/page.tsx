"use client";

import React, { useState } from "react";
import { motion } from "framer-motion";
import {
  TrendingUp,
  DollarSign,
  CheckCircle,
  XCircle,
  ArrowRight,
  ChevronDown,
  ChevronUp,
  Briefcase,
  Calculator,
  PiggyBank,
  Building2,
  Calendar,
  Shield,
  Users,
  HelpCircle,
  Zap,
  Target,
  Clock,
  Percent,
  BarChart3,
  LineChart,
  PieChart,
  Landmark,
  Coins,
  Gem,
  CircleDollarSign,
  Wallet,
  Scale,
  ArrowUpRight,
  TrendingDown,
  AlertTriangle,
  Flame,
  Snowflake,
  RefreshCcw
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
    q: "I don't have much money to invest. Should I even start?",
    a: "YES. Time in the market beats timing the market. Even $100/month invested at age 25 can grow to $300,000+ by retirement. Starting small is infinitely better than not starting at all."
  },
  {
    q: "Should I pay off debt or invest?",
    a: "It depends on interest rates. High-interest debt (>7%) should be paid first. Low-interest debt (<4%) can coexist with investing. We help you find the optimal balance for YOUR numbers."
  },
  {
    q: "What's the difference between a 401(k), IRA, and Roth?",
    a: "401(k) is employer-sponsored, tax-deferred. Traditional IRA is similar but individual. Roth accounts are taxed NOW but grow tax-free forever. We help you choose based on your current vs future tax bracket."
  },
  {
    q: "How do I know if I'm taking too much risk?",
    a: "Risk tolerance is personal. Can you sleep at night if your portfolio drops 30%? We assess your timeline, goals, and psychology to build a portfolio you can actually stick with through market swings."
  },
  {
    q: "Should I invest in individual stocks or index funds?",
    a: "For most people, low-cost index funds beat stock picking over time. Even pros struggle to beat the market consistently. We believe in evidence-based investing, not gambling."
  },
  {
    q: "When should I start thinking about retirement?",
    a: "Now. Literally right now. Every year you delay costs you exponentially. A 25-year-old investing $500/month will have 3x more than a 35-year-old investing the same amount. Time is your biggest asset."
  }
];

export default function InvestmentPlanningPage() {
  const [openFaq, setOpenFaq] = useState<number | null>(null);
  const [isBookCallOpen, setIsBookCallOpen] = useState(false);

  return (
    <div className="min-h-screen bg-[#0a0f18] text-white overflow-x-hidden">
      <Header />

      <main>
        {/* HERO SECTION */}
        <section className="relative pt-32 pb-20 px-4 overflow-hidden">
          {/* Background Effects */}
          <div className="absolute inset-0 bg-gradient-to-b from-emerald-500/5 via-transparent to-transparent" />
          <div className="absolute top-20 left-1/4 w-96 h-96 bg-emerald-500/10 rounded-full blur-3xl" />
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
                Your Money Should Work
                <br />
                <span className="text-primary">Harder Than You Do</span>
              </motion.h1>

              <motion.p
                variants={fadeInUp}
                className="text-xl text-white/60 max-w-3xl mx-auto mb-8"
              >
                The difference between retiring at 65 and retiring at 50?
                <br />
                <span className="text-primary font-semibold">A strategy.</span> Not luck. Not a higher salary. A strategy.
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
              {/* AVERAGE INVESTOR */}
              <motion.div
                variants={scaleIn}
                className="relative bg-gradient-to-b from-red-500/10 to-transparent border border-red-500/20 rounded-2xl p-6 overflow-hidden"
              >
                <div className="absolute top-0 right-0 w-32 h-32 bg-red-500/10 rounded-full blur-2xl" />

                <div className="relative">
                  <div className="flex items-center gap-3 mb-6">
                    <div className="w-12 h-12 bg-red-500/20 rounded-xl flex items-center justify-center">
                      <TrendingDown className="w-6 h-6 text-red-400" />
                    </div>
                    <div>
                      <h3 className="font-bold text-lg">Average Investor</h3>
                      <p className="text-red-400 text-sm">"I'll figure it out"</p>
                    </div>
                  </div>

                  <div className="space-y-4 mb-6">
                    <div className="bg-white/5 rounded-lg p-4">
                      <p className="text-white/40 text-xs mb-1">MONTHLY INVESTMENT</p>
                      <p className="text-2xl font-bold">$500/month</p>
                      <p className="text-white/40 text-xs">Starting at age 30</p>
                    </div>

                    <div className="bg-red-500/10 border border-red-500/20 rounded-lg p-4">
                      <p className="text-red-400 text-xs mb-1">APPROACH</p>
                      <p className="text-white/80 text-sm">Random stocks, checking account savings, no tax strategy</p>
                    </div>

                    <div className="bg-white/5 rounded-lg p-4">
                      <p className="text-white/40 text-xs mb-1">AVERAGE RETURN</p>
                      <p className="text-xl font-bold">4% annually</p>
                      <p className="text-white/40 text-xs">After fees, taxes, and panic selling</p>
                    </div>

                    <div className="bg-red-500/20 border border-red-500/30 rounded-lg p-4">
                      <p className="text-white/40 text-xs mb-1">AT AGE 65</p>
                      <p className="text-2xl font-bold text-red-400">$456,000</p>
                    </div>
                  </div>

                  <div className="space-y-2 border-t border-white/10 pt-4">
                    <div className="flex items-center gap-2 text-sm text-red-400">
                      <XCircle className="w-4 h-4" />
                      <span>No asset allocation strategy</span>
                    </div>
                    <div className="flex items-center gap-2 text-sm text-red-400">
                      <XCircle className="w-4 h-4" />
                      <span>High fees eating returns</span>
                    </div>
                    <div className="flex items-center gap-2 text-sm text-red-400">
                      <XCircle className="w-4 h-4" />
                      <span>Emotional buying/selling</span>
                    </div>
                    <div className="flex items-center gap-2 text-sm text-red-400">
                      <XCircle className="w-4 h-4" />
                      <span>Leaves tax savings on table</span>
                    </div>
                  </div>

                  <div className="mt-6 text-center">
                    <span className="text-3xl">😰</span>
                    <p className="text-white/40 text-sm mt-2">Most Americans</p>
                  </div>
                </div>
              </motion.div>

              {/* STRATEGIC INVESTOR */}
              <motion.div
                variants={scaleIn}
                className="relative bg-gradient-to-b from-primary/20 to-transparent border-2 border-primary/40 rounded-2xl p-6 overflow-hidden"
              >
                <div className="absolute top-0 right-0 w-32 h-32 bg-primary/20 rounded-full blur-2xl" />

                <div className="relative">
                  <div className="flex items-center gap-3 mb-6">
                    <div className="w-12 h-12 bg-primary/20 rounded-xl flex items-center justify-center">
                      <TrendingUp className="w-6 h-6 text-primary" />
                    </div>
                    <div>
                      <h3 className="font-bold text-lg">Strategic Investor</h3>
                      <p className="text-primary text-sm">"I have a plan"</p>
                    </div>
                  </div>

                  <div className="space-y-4 mb-6">
                    <div className="bg-white/5 rounded-lg p-4">
                      <p className="text-white/40 text-xs mb-1">MONTHLY INVESTMENT</p>
                      <p className="text-2xl font-bold">$500/month</p>
                      <p className="text-white/40 text-xs">Starting at age 30</p>
                    </div>

                    <div className="bg-primary/10 border border-primary/20 rounded-lg p-4">
                      <p className="text-primary text-xs mb-1">APPROACH</p>
                      <p className="text-white/80 text-sm">Diversified index funds, tax-advantaged accounts, rebalancing</p>
                    </div>

                    <div className="bg-white/5 rounded-lg p-4">
                      <p className="text-white/40 text-xs mb-1">AVERAGE RETURN</p>
                      <p className="text-xl font-bold text-primary">8% annually</p>
                      <p className="text-white/40 text-xs">Low fees, tax-optimized, disciplined</p>
                    </div>

                    <div className="bg-primary/20 border border-primary/30 rounded-lg p-4">
                      <p className="text-white/40 text-xs mb-1">AT AGE 65</p>
                      <p className="text-2xl font-bold text-primary">$1,050,000</p>
                    </div>
                  </div>

                  <div className="space-y-2 border-t border-white/10 pt-4">
                    <div className="flex items-center gap-2 text-sm text-primary">
                      <CheckCircle className="w-4 h-4" />
                      <span>Proper asset allocation</span>
                    </div>
                    <div className="flex items-center gap-2 text-sm text-primary">
                      <CheckCircle className="w-4 h-4" />
                      <span>Low-cost index funds</span>
                    </div>
                    <div className="flex items-center gap-2 text-sm text-primary">
                      <CheckCircle className="w-4 h-4" />
                      <span>Tax-loss harvesting</span>
                    </div>
                    <div className="flex items-center gap-2 text-sm text-primary">
                      <CheckCircle className="w-4 h-4" />
                      <span>Systematic rebalancing</span>
                    </div>
                  </div>

                  <div className="mt-6 text-center">
                    <span className="text-3xl">🚀</span>
                    <p className="text-primary text-sm mt-2 font-medium">The Wealth Builders</p>
                  </div>
                </div>
              </motion.div>
            </motion.div>

            {/* Difference Callout */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.5 }}
              className="mt-12 text-center"
            >
              <div className="inline-block bg-gradient-to-r from-primary/20 to-emerald-500/20 border border-primary/30 rounded-2xl p-6">
                <p className="text-white/60 text-sm mb-2">THE DIFFERENCE</p>
                <p className="text-4xl font-bold text-primary mb-2">$594,000</p>
                <p className="text-white/50 text-sm">Same contribution. Same timeline. <span className="text-primary">Different strategy = 2.3x more wealth.</span></p>
              </div>
            </motion.div>
          </div>
        </section>

        {/* COMPOUND GROWTH VISUALIZATION */}
        <section className="py-20 px-4 bg-gradient-to-b from-transparent via-white/[0.02] to-transparent">
          <div className="max-w-5xl mx-auto">
            <motion.div
              initial="hidden"
              whileInView="visible"
              viewport={{ once: true }}
              variants={staggerContainer}
              className="text-center mb-16"
            >
              <motion.h2 variants={fadeInUp} className="text-3xl md:text-4xl font-bold mb-4">
                The <span className="text-primary">Magic</span> of Compound Growth
              </motion.h2>
              <motion.p variants={fadeInUp} className="text-white/60 max-w-2xl mx-auto">
                Einstein called it the 8th wonder of the world. Here's why.
              </motion.p>
            </motion.div>

            <motion.div
              initial="hidden"
              whileInView="visible"
              viewport={{ once: true }}
              variants={scaleIn}
              className="bg-white/5 border border-white/10 rounded-3xl p-8"
            >
              {/* Timeline Visualization */}
              <div className="grid md:grid-cols-4 gap-4 mb-8">
                {[
                  { age: "Age 25", amount: "$0", years: "Start" },
                  { age: "Age 35", amount: "$93,000", years: "10 years" },
                  { age: "Age 45", amount: "$295,000", years: "20 years" },
                  { age: "Age 55", amount: "$680,000", years: "30 years" }
                ].map((item, index) => (
                  <div key={index} className="text-center">
                    <div className={`h-${index === 0 ? '8' : index === 1 ? '16' : index === 2 ? '24' : '32'} bg-gradient-to-t from-primary to-emerald-400 rounded-lg mb-3 mx-auto w-full max-w-[60px]`}
                      style={{ height: `${(index + 1) * 40}px` }}
                    />
                    <p className="text-primary font-bold text-lg">{item.amount}</p>
                    <p className="text-white/60 text-sm">{item.age}</p>
                    <p className="text-white/40 text-xs">{item.years}</p>
                  </div>
                ))}
              </div>

              <div className="border-t border-white/10 pt-6">
                <div className="grid md:grid-cols-3 gap-6 text-center">
                  <div>
                    <p className="text-white/40 text-sm">Total Contributed</p>
                    <p className="text-xl font-bold">$180,000</p>
                    <p className="text-white/40 text-xs">$500/month for 30 years</p>
                  </div>
                  <div>
                    <p className="text-white/40 text-sm">Investment Growth</p>
                    <p className="text-xl font-bold text-primary">$500,000</p>
                    <p className="text-white/40 text-xs">Money your money made</p>
                  </div>
                  <div>
                    <p className="text-white/40 text-sm">Total Value</p>
                    <p className="text-xl font-bold text-primary">$680,000</p>
                    <p className="text-white/40 text-xs">At 8% average return</p>
                  </div>
                </div>
              </div>

              <div className="mt-6 text-center">
                <p className="text-white/60 bg-primary/10 border border-primary/20 rounded-xl p-4 inline-block">
                  💡 <span className="text-primary font-semibold">$500,000</span> of that came from compound growth — money you never had to earn.
                </p>
              </div>
            </motion.div>
          </div>
        </section>

        {/* INVESTMENT VEHICLES */}
        <section className="py-20 px-4">
          <div className="max-w-6xl mx-auto">
            <motion.div
              initial="hidden"
              whileInView="visible"
              viewport={{ once: true }}
              variants={staggerContainer}
              className="text-center mb-16"
            >
              <motion.h2 variants={fadeInUp} className="text-3xl md:text-4xl font-bold mb-4">
                Your Investment <span className="text-primary">Toolkit</span>
              </motion.h2>
              <motion.p variants={fadeInUp} className="text-white/60 max-w-2xl mx-auto">
                Know your options. Use them strategically.
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
                  icon: Building2,
                  title: "401(k)",
                  desc: "Employer-sponsored. Often with company match. Tax-deferred growth.",
                  limit: "$23,000/year (2024)",
                  benefit: "Free money via match",
                  color: "blue"
                },
                {
                  icon: Landmark,
                  title: "Traditional IRA",
                  desc: "Individual account. Tax-deductible contributions. Taxed at withdrawal.",
                  limit: "$7,000/year (2024)",
                  benefit: "Lower taxes now",
                  color: "purple"
                },
                {
                  icon: Gem,
                  title: "Roth IRA",
                  desc: "Post-tax contributions. Tax-FREE growth forever. Best for young investors.",
                  limit: "$7,000/year (2024)",
                  benefit: "Tax-free retirement",
                  color: "emerald"
                },
                {
                  icon: Wallet,
                  title: "HSA",
                  desc: "Triple tax advantage. Contributions, growth, AND withdrawals all tax-free.",
                  limit: "$4,150/year (2024)",
                  benefit: "Ultimate tax shelter",
                  color: "cyan"
                },
                {
                  icon: BarChart3,
                  title: "Brokerage Account",
                  desc: "No limits, no restrictions. Flexible but taxable. Good after maxing tax-advantaged.",
                  limit: "No limit",
                  benefit: "Total flexibility",
                  color: "orange"
                },
                {
                  icon: PieChart,
                  title: "Index Funds",
                  desc: "Low-cost diversification. Own the entire market. Warren Buffett's recommendation.",
                  limit: "No limit",
                  benefit: "Simple & effective",
                  color: "pink"
                }
              ].map((item, index) => (
                <motion.div
                  key={index}
                  variants={fadeInUp}
                  className="bg-white/5 border border-white/10 rounded-2xl p-6 hover:border-primary/30 transition-colors"
                >
                  <div className={`w-12 h-12 rounded-xl flex items-center justify-center mb-4 ${item.color === 'blue' ? 'bg-blue-500/20' :
                      item.color === 'purple' ? 'bg-purple-500/20' :
                        item.color === 'emerald' ? 'bg-emerald-500/20' :
                          item.color === 'cyan' ? 'bg-cyan-500/20' :
                            item.color === 'orange' ? 'bg-orange-500/20' : 'bg-pink-500/20'
                    }`}>
                    <item.icon className={`w-6 h-6 ${item.color === 'blue' ? 'text-blue-400' :
                        item.color === 'purple' ? 'text-purple-400' :
                          item.color === 'emerald' ? 'text-emerald-400' :
                            item.color === 'cyan' ? 'text-cyan-400' :
                              item.color === 'orange' ? 'text-orange-400' : 'text-pink-400'
                      }`} />
                  </div>
                  <h3 className="font-bold text-lg mb-2">{item.title}</h3>
                  <p className="text-white/60 text-sm mb-4">{item.desc}</p>
                  <div className="space-y-2">
                    <div className="flex justify-between text-sm">
                      <span className="text-white/40">Limit</span>
                      <span className="text-white/80">{item.limit}</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-white/40">Key Benefit</span>
                      <span className="text-primary">{item.benefit}</span>
                    </div>
                  </div>
                </motion.div>
              ))}
            </motion.div>
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
                Investment Myths Keeping You <span className="text-red-400">Poor</span>
              </motion.h2>
              <motion.p variants={fadeInUp} className="text-white/60 max-w-2xl mx-auto">
                Wall Street profits from your confusion. Let's clear it up.
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
                  myth: "I need a lot of money to start investing",
                  reality: "You can start with $10. Apps like Fidelity have no minimums. Start NOW."
                },
                {
                  myth: "I need to pick winning stocks",
                  reality: "Index funds beat 90% of professional stock pickers over time. Keep it simple."
                },
                {
                  myth: "I should wait for the market to dip",
                  reality: "Time in the market beats timing the market. Invest consistently, ignore the noise."
                },
                {
                  myth: "Crypto is the path to wealth",
                  reality: "Crypto is speculation, not investing. Build your foundation first, then play."
                },
                {
                  myth: "My financial advisor has my best interest",
                  reality: "Many get paid commissions. Look for fee-only fiduciary advisors. Big difference."
                },
                {
                  myth: "I'm too young/old to start",
                  reality: "The best time was 10 years ago. The second best time is today. Start now."
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

        {/* INVESTMENT STRATEGY FRAMEWORK */}
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
                The <span className="text-primary">Priority Order</span> of Investing
              </motion.h2>
              <motion.p variants={fadeInUp} className="text-white/60 max-w-2xl mx-auto">
                Follow this order. It's not complicated. It's just disciplined.
              </motion.p>
            </motion.div>

            <motion.div
              initial="hidden"
              whileInView="visible"
              viewport={{ once: true }}
              variants={staggerContainer}
              className="space-y-4"
            >
              {[
                {
                  step: 1,
                  title: "Emergency Fund",
                  desc: "3-6 months of expenses in a high-yield savings account",
                  why: "Foundation of financial security",
                  color: "blue"
                },
                {
                  step: 2,
                  title: "401(k) Match",
                  desc: "Contribute enough to get your full employer match",
                  why: "100% return on your money — FREE money",
                  color: "purple"
                },
                {
                  step: 3,
                  title: "High-Interest Debt",
                  desc: "Pay off credit cards and any debt >7% APR",
                  why: "Guaranteed 20%+ 'return' by eliminating interest",
                  color: "red"
                },
                {
                  step: 4,
                  title: "HSA (if eligible)",
                  desc: "Max out your Health Savings Account",
                  why: "Triple tax advantage — best deal in the tax code",
                  color: "cyan"
                },
                {
                  step: 5,
                  title: "Roth IRA",
                  desc: "Max out $7,000/year if income-eligible",
                  why: "Tax-free growth forever",
                  color: "emerald"
                },
                {
                  step: 6,
                  title: "Max 401(k)",
                  desc: "Contribute up to $23,000/year",
                  why: "Tax-deferred growth + potential backdoor Roth",
                  color: "orange"
                },
                {
                  step: 7,
                  title: "Taxable Brokerage",
                  desc: "Invest excess after maxing all tax-advantaged accounts",
                  why: "No limits, full flexibility",
                  color: "pink"
                }
              ].map((item, index) => (
                <motion.div
                  key={index}
                  variants={fadeInUp}
                  className="flex gap-4 items-start"
                >
                  <div className={`w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0 font-bold text-lg ${item.color === 'blue' ? 'bg-blue-500/20 text-blue-400' :
                      item.color === 'purple' ? 'bg-purple-500/20 text-purple-400' :
                        item.color === 'red' ? 'bg-red-500/20 text-red-400' :
                          item.color === 'cyan' ? 'bg-cyan-500/20 text-cyan-400' :
                            item.color === 'emerald' ? 'bg-emerald-500/20 text-emerald-400' :
                              item.color === 'orange' ? 'bg-orange-500/20 text-orange-400' : 'bg-pink-500/20 text-pink-400'
                    }`}>
                    {item.step}
                  </div>
                  <div className="flex-1 bg-white/5 border border-white/10 rounded-xl p-4 hover:border-white/20 transition-colors">
                    <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-2">
                      <div>
                        <h3 className="font-bold text-lg">{item.title}</h3>
                        <p className="text-white/60 text-sm">{item.desc}</p>
                      </div>
                      <div className="bg-primary/10 border border-primary/20 rounded-lg px-3 py-1 text-sm text-primary whitespace-nowrap">
                        {item.why}
                      </div>
                    </div>
                  </div>
                </motion.div>
              ))}
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
                Real People. <span className="text-primary">Real Portfolios.</span>
              </motion.h2>
              <motion.p variants={fadeInUp} className="text-white/60 max-w-2xl mx-auto">
                Different starting points. Same destination: financial freedom.
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
                  <div className="h-2 bg-gradient-to-r from-blue-500 to-cyan-500" />
                  <div className="p-6">
                    <div className="flex items-center gap-3 mb-4">
                      <div className="w-12 h-12 bg-blue-500/20 rounded-full flex items-center justify-center">
                        <span className="text-2xl">👩‍💻</span>
                      </div>
                      <div>
                        <h3 className="font-bold">The New Grad</h3>
                        <p className="text-white/40 text-sm">Emma, 24, $55K salary</p>
                      </div>
                    </div>

                    <p className="text-white/70 mb-6 text-sm leading-relaxed">
                      Started investing at 24 with just $200/month. Time is her biggest asset.
                    </p>

                    <div className="space-y-3">
                      <div className="flex justify-between items-center bg-white/5 rounded-lg p-3">
                        <span className="text-white/60 text-sm">401(k) w/ match</span>
                        <span className="text-primary font-bold">$200/mo</span>
                      </div>
                      <div className="flex justify-between items-center bg-white/5 rounded-lg p-3">
                        <span className="text-white/60 text-sm">Roth IRA</span>
                        <span className="text-primary font-bold">$200/mo</span>
                      </div>
                      <div className="flex justify-between items-center bg-white/5 rounded-lg p-3">
                        <span className="text-white/60 text-sm">Target date fund</span>
                        <span className="text-primary font-bold">90/10 stocks</span>
                      </div>
                    </div>

                    <div className="mt-6 pt-4 border-t border-white/10 text-center">
                      <p className="text-white/40 text-sm">Projected at 55</p>
                      <p className="text-primary font-bold text-2xl">$1.2M+</p>
                    </div>
                  </div>
                </div>
              </motion.div>

              {/* Scenario 2 */}
              <motion.div variants={fadeInUp} className="group">
                <div className="bg-white/5 border border-white/10 rounded-2xl overflow-hidden hover:border-primary/30 transition-colors">
                  <div className="h-2 bg-gradient-to-r from-purple-500 to-pink-500" />
                  <div className="p-6">
                    <div className="flex items-center gap-3 mb-4">
                      <div className="w-12 h-12 bg-purple-500/20 rounded-full flex items-center justify-center">
                        <span className="text-2xl">👨‍👩‍👧</span>
                      </div>
                      <div>
                        <h3 className="font-bold">The Late Starter</h3>
                        <p className="text-white/40 text-sm">Mike, 42, $95K salary</p>
                      </div>
                    </div>

                    <p className="text-white/70 mb-6 text-sm leading-relaxed">
                      Started at 42 — "behind" but not hopeless. Aggressive catch-up strategy.
                    </p>

                    <div className="space-y-3">
                      <div className="flex justify-between items-center bg-white/5 rounded-lg p-3">
                        <span className="text-white/60 text-sm">Maxed 401(k)</span>
                        <span className="text-primary font-bold">$1,917/mo</span>
                      </div>
                      <div className="flex justify-between items-center bg-white/5 rounded-lg p-3">
                        <span className="text-white/60 text-sm">Maxed Roth IRA</span>
                        <span className="text-primary font-bold">$583/mo</span>
                      </div>
                      <div className="flex justify-between items-center bg-white/5 rounded-lg p-3">
                        <span className="text-white/60 text-sm">Total index funds</span>
                        <span className="text-primary font-bold">80/20 stocks</span>
                      </div>
                    </div>

                    <div className="mt-6 pt-4 border-t border-white/10 text-center">
                      <p className="text-white/40 text-sm">Projected at 62</p>
                      <p className="text-primary font-bold text-2xl">$850K+</p>
                    </div>
                  </div>
                </div>
              </motion.div>

              {/* Scenario 3 */}
              <motion.div variants={fadeInUp} className="group">
                <div className="bg-white/5 border border-white/10 rounded-2xl overflow-hidden hover:border-primary/30 transition-colors">
                  <div className="h-2 bg-gradient-to-r from-orange-500 to-yellow-500" />
                  <div className="p-6">
                    <div className="flex items-center gap-3 mb-4">
                      <div className="w-12 h-12 bg-orange-500/20 rounded-full flex items-center justify-center">
                        <span className="text-2xl">🔥</span>
                      </div>
                      <div>
                        <h3 className="font-bold">The FIRE Pursuer</h3>
                        <p className="text-white/40 text-sm">Aisha, 32, $120K salary</p>
                      </div>
                    </div>

                    <p className="text-white/70 mb-6 text-sm leading-relaxed">
                      Aggressive savings rate (50%+). Targeting early retirement at 45.
                    </p>

                    <div className="space-y-3">
                      <div className="flex justify-between items-center bg-white/5 rounded-lg p-3">
                        <span className="text-white/60 text-sm">All tax-advantaged</span>
                        <span className="text-primary font-bold">Maxed</span>
                      </div>
                      <div className="flex justify-between items-center bg-white/5 rounded-lg p-3">
                        <span className="text-white/60 text-sm">Taxable brokerage</span>
                        <span className="text-primary font-bold">$2,500/mo</span>
                      </div>
                      <div className="flex justify-between items-center bg-white/5 rounded-lg p-3">
                        <span className="text-white/60 text-sm">Savings rate</span>
                        <span className="text-primary font-bold">55%</span>
                      </div>
                    </div>

                    <div className="mt-6 pt-4 border-t border-white/10 text-center">
                      <p className="text-white/40 text-sm">Projected at 45</p>
                      <p className="text-primary font-bold text-2xl">$1.5M+</p>
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
                Your Investment <span className="text-primary">Strategy</span> Team
              </motion.h2>
              <motion.p variants={fadeInUp} className="text-white/60 max-w-2xl mx-auto">
                We don't sell products. We build plans.
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
                { icon: Target, title: "Goal Assessment", desc: "Define your FIRE number, timeline, and risk tolerance" },
                { icon: PieChart, title: "Asset Allocation", desc: "Proper diversification across stocks, bonds, and alternatives" },
                { icon: Building2, title: "401(k) Optimization", desc: "Maximize employer match and choose the right funds" },
                { icon: Calculator, title: "Tax-Efficient Investing", desc: "Asset location strategy to minimize tax drag" },
                { icon: RefreshCcw, title: "Rebalancing Strategy", desc: "Keep your portfolio aligned with your risk tolerance" },
                { icon: LineChart, title: "Progress Tracking", desc: "Regular check-ins and adjustments as life changes" }
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
                  <div className="text-5xl mb-4">📈</div>
                  <h2 className="text-3xl md:text-4xl font-bold mb-4">
                    Start Building Wealth Today
                  </h2>
                  <p className="text-white/60 max-w-xl mx-auto mb-8">
                    Every day you don't invest is a day your money isn't growing. Let's fix that.
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
                      Book Investment Strategy Call
                    </button>
                  </div>

                  <p className="text-white/40 text-sm mt-6">
                    Free consultation. No products to sell. Just a plan.
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
            <p className="text-white/40 mb-4">Ready to put your money to work?</p>
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
