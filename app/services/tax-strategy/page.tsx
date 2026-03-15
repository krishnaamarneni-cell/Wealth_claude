"use client";

import React, { useState } from "react";
import { motion } from "framer-motion";
import {
  FileText,
  DollarSign,
  TrendingUp,
  CheckCircle,
  XCircle,
  AlertTriangle,
  ArrowRight,
  ChevronDown,
  ChevronUp,
  Briefcase,
  Calculator,
  PiggyBank,
  Building2,
  Receipt,
  Calendar,
  Shield,
  Users,
  HelpCircle,
  Zap,
  Target,
  Clock,
  Percent,
  BadgeDollarSign,
  Landmark,
  TrendingDown,
  ArrowUpRight,
  Wallet
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
    q: "Isn't tax strategy only for rich people?",
    a: "That's exactly what they want you to think. Tax strategy is HOW people become wealthy. A W2 employee earning $75K can save $3,000-8,000/year with the right strategies. The wealthy just learned these rules earlier."
  },
  {
    q: "I already use TurboTax. Isn't that enough?",
    a: "TurboTax is a filing tool, not a strategy tool. It asks what you DID, not what you SHOULD do. A CPA proactively finds deductions and structures your finances to minimize future taxes. Big difference."
  },
  {
    q: "How much does tax planning actually save?",
    a: "Most W2 employees overpay by $3,000-10,000 annually. Business owners often overpay $10,000-50,000+. Our clients typically save 3-10x what they pay us in the first year alone."
  },
  {
    q: "Is this legal? It sounds too good to be true.",
    a: "100% legal. We use strategies written into the tax code by Congress. Tax avoidance (legal) is different from tax evasion (illegal). The wealthy have used these strategies for decades."
  },
  {
    q: "When should I start tax planning?",
    a: "Yesterday. But seriously — January is ideal for the current year. Most people wait until April when it's too late to implement strategies. Tax planning is a year-round activity, not a once-a-year panic."
  },
  {
    q: "What if I get audited?",
    a: "Proper tax strategy actually REDUCES audit risk because everything is documented correctly. Plus, we provide audit protection — if you're ever audited, we represent you and handle everything."
  }
];

export default function TaxStrategyPage() {
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
                You're Paying
                <br />
                <span className="text-red-400">More Taxes Than You Should</span>
              </motion.h1>

              <motion.p
                variants={fadeInUp}
                className="text-xl text-white/60 max-w-3xl mx-auto mb-8"
              >
                The average American overpays <span className="text-primary font-semibold">$5,000+ per year</span> in taxes.
                Not because they have to — because nobody taught them the rules.
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
              {/* DIY TAX FILER */}
              <motion.div
                variants={scaleIn}
                className="relative bg-gradient-to-b from-red-500/10 to-transparent border border-red-500/20 rounded-2xl p-6 overflow-hidden"
              >
                <div className="absolute top-0 right-0 w-32 h-32 bg-red-500/10 rounded-full blur-2xl" />

                <div className="relative">
                  <div className="flex items-center gap-3 mb-6">
                    <div className="w-12 h-12 bg-red-500/20 rounded-xl flex items-center justify-center">
                      <Calculator className="w-6 h-6 text-red-400" />
                    </div>
                    <div>
                      <h3 className="font-bold text-lg">DIY Tax Filer</h3>
                      <p className="text-red-400 text-sm">"TurboTax is enough"</p>
                    </div>
                  </div>

                  <div className="space-y-4 mb-6">
                    <div className="bg-white/5 rounded-lg p-4">
                      <p className="text-white/40 text-xs mb-1">GROSS INCOME</p>
                      <p className="text-2xl font-bold">$100,000</p>
                    </div>

                    <div className="bg-red-500/10 border border-red-500/20 rounded-lg p-4">
                      <p className="text-red-400 text-xs mb-1">DEDUCTIONS CLAIMED</p>
                      <p className="text-xl font-bold">$14,600</p>
                      <p className="text-white/40 text-xs">Standard deduction only</p>
                    </div>

                    <div className="bg-white/5 rounded-lg p-4">
                      <p className="text-white/40 text-xs mb-1">TAXABLE INCOME</p>
                      <p className="text-xl font-bold">$85,400</p>
                    </div>

                    <div className="bg-red-500/20 border border-red-500/30 rounded-lg p-4">
                      <p className="text-white/40 text-xs mb-1">TAXES PAID</p>
                      <p className="text-2xl font-bold text-red-400">$14,768</p>
                    </div>
                  </div>

                  <div className="space-y-2 border-t border-white/10 pt-4">
                    <div className="flex items-center gap-2 text-sm text-red-400">
                      <XCircle className="w-4 h-4" />
                      <span>Missed deductions</span>
                    </div>
                    <div className="flex items-center gap-2 text-sm text-red-400">
                      <XCircle className="w-4 h-4" />
                      <span>No tax planning</span>
                    </div>
                    <div className="flex items-center gap-2 text-sm text-red-400">
                      <XCircle className="w-4 h-4" />
                      <span>Reactive, not proactive</span>
                    </div>
                    <div className="flex items-center gap-2 text-sm text-red-400">
                      <XCircle className="w-4 h-4" />
                      <span>No audit protection</span>
                    </div>
                  </div>

                  <div className="mt-6 text-center">
                    <span className="text-3xl">😰</span>
                    <p className="text-white/40 text-sm mt-2">90% of Americans</p>
                  </div>
                </div>
              </motion.div>

              {/* STRATEGIC TAX PLANNER */}
              <motion.div
                variants={scaleIn}
                className="relative bg-gradient-to-b from-primary/20 to-transparent border-2 border-primary/40 rounded-2xl p-6 overflow-hidden"
              >
                <div className="absolute top-0 right-0 w-32 h-32 bg-primary/20 rounded-full blur-2xl" />

                <div className="relative">
                  <div className="flex items-center gap-3 mb-6">
                    <div className="w-12 h-12 bg-primary/20 rounded-xl flex items-center justify-center">
                      <Target className="w-6 h-6 text-primary" />
                    </div>
                    <div>
                      <h3 className="font-bold text-lg">Strategic Tax Planner</h3>
                      <p className="text-primary text-sm">"I have a tax strategy"</p>
                    </div>
                  </div>

                  <div className="space-y-4 mb-6">
                    <div className="bg-white/5 rounded-lg p-4">
                      <p className="text-white/40 text-xs mb-1">GROSS INCOME</p>
                      <p className="text-2xl font-bold">$100,000</p>
                    </div>

                    <div className="bg-primary/10 border border-primary/20 rounded-lg p-4">
                      <p className="text-primary text-xs mb-1">DEDUCTIONS CLAIMED</p>
                      <p className="text-xl font-bold text-primary">$32,500</p>
                      <p className="text-white/40 text-xs">Itemized + strategic deductions</p>
                    </div>

                    <div className="bg-white/5 rounded-lg p-4">
                      <p className="text-white/40 text-xs mb-1">TAXABLE INCOME</p>
                      <p className="text-xl font-bold">$67,500</p>
                    </div>

                    <div className="bg-primary/20 border border-primary/30 rounded-lg p-4">
                      <p className="text-white/40 text-xs mb-1">TAXES PAID</p>
                      <p className="text-2xl font-bold text-primary">$10,238</p>
                    </div>
                  </div>

                  <div className="space-y-2 border-t border-white/10 pt-4">
                    <div className="flex items-center gap-2 text-sm text-primary">
                      <CheckCircle className="w-4 h-4" />
                      <span>All deductions maximized</span>
                    </div>
                    <div className="flex items-center gap-2 text-sm text-primary">
                      <CheckCircle className="w-4 h-4" />
                      <span>Year-round planning</span>
                    </div>
                    <div className="flex items-center gap-2 text-sm text-primary">
                      <CheckCircle className="w-4 h-4" />
                      <span>Proactive strategies</span>
                    </div>
                    <div className="flex items-center gap-2 text-sm text-primary">
                      <CheckCircle className="w-4 h-4" />
                      <span>Audit protection included</span>
                    </div>
                  </div>

                  <div className="mt-6 text-center">
                    <span className="text-3xl">🤑</span>
                    <p className="text-primary text-sm mt-2 font-medium">Top 10% of Earners</p>
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
                <p className="text-white/60 text-sm mb-2">ANNUAL TAX SAVINGS</p>
                <p className="text-4xl font-bold text-primary mb-2">$4,530</p>
                <p className="text-white/50 text-sm">Same income. Different strategy. <span className="text-primary">$45,300 saved over 10 years.</span></p>
              </div>
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
                Tax Myths That Keep You <span className="text-red-400">Broke</span>
              </motion.h2>
              <motion.p variants={fadeInUp} className="text-white/60 max-w-2xl mx-auto">
                The wealthy know these are lies. Now you will too.
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
                  myth: "Tax planning is only for the wealthy",
                  reality: "Tax planning is HOW people become wealthy. Start now."
                },
                {
                  myth: "TurboTax finds all my deductions",
                  reality: "TurboTax only asks what you DID, not what you SHOULD do"
                },
                {
                  myth: "I don't make enough to itemize",
                  reality: "With the right strategy, you might. Plus there are above-the-line deductions"
                },
                {
                  myth: "My W2 job means I can't save on taxes",
                  reality: "401k, HSA, side business, home office — W2 employees have options"
                },
                {
                  myth: "I'll deal with taxes in April",
                  reality: "By April it's too late. Tax planning happens year-round"
                },
                {
                  myth: "CPAs are too expensive",
                  reality: "A good CPA saves you 3-10x their fee. They pay for themselves"
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

        {/* HIDDEN COST SECTION */}
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
                The <span className="text-red-400">Silent Wealth Killer</span>
              </motion.h2>
              <motion.p variants={fadeInUp} className="text-white/60 max-w-2xl mx-auto">
                Every year you don't optimize, money walks out the door
              </motion.p>
            </motion.div>

            <motion.div
              initial="hidden"
              whileInView="visible"
              viewport={{ once: true }}
              variants={scaleIn}
              className="relative"
            >
              <div className="bg-gradient-to-b from-red-500/10 to-transparent border border-red-500/20 rounded-3xl p-8 md:p-12">
                <div className="text-center mb-8">
                  <p className="text-white/40 text-sm uppercase tracking-widest mb-2">Money You're Losing Every Year</p>
                  <div className="text-5xl">🔥💸</div>
                </div>

                <div className="grid md:grid-cols-2 gap-6 mb-8">
                  {[
                    { icon: Receipt, amount: "$2,000 - $5,000", label: "Missed deductions" },
                    { icon: Building2, amount: "$1,500 - $3,000", label: "No retirement optimization" },
                    { icon: BadgeDollarSign, amount: "$500 - $2,000", label: "Wrong tax bracket strategies" },
                    { icon: TrendingDown, amount: "$1,000 - $3,000", label: "No tax-loss harvesting" }
                  ].map((item, index) => (
                    <div key={index} className="flex items-center gap-4 bg-white/5 rounded-xl p-4">
                      <div className="w-12 h-12 bg-red-500/20 rounded-xl flex items-center justify-center flex-shrink-0">
                        <item.icon className="w-6 h-6 text-red-400" />
                      </div>
                      <div>
                        <p className="text-red-400 font-bold text-xl">{item.amount}</p>
                        <p className="text-white/60 text-sm">{item.label}</p>
                      </div>
                    </div>
                  ))}
                </div>

                <div className="border-t border-red-500/20 pt-8">
                  <div className="text-center">
                    <p className="text-white/40 text-sm uppercase tracking-widest mb-2">Over Your Career (30 Years)</p>
                    <p className="text-4xl md:text-5xl font-bold text-red-400">$150,000 - $400,000</p>
                    <p className="text-white/60 mt-2">Gone. Forever. To taxes you didn't have to pay.</p>
                  </div>
                </div>

                <div className="mt-8 text-center">
                  <p className="text-white/60 italic text-lg">
                    "It's not what you make. It's what you <span className="text-primary">keep</span>."
                  </p>
                </div>
              </div>
            </motion.div>
          </div>
        </section>

        {/* TAX STRATEGIES SECTION */}
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
                Strategies the <span className="text-primary">Wealthy</span> Use Daily
              </motion.h2>
              <motion.p variants={fadeInUp} className="text-white/60 max-w-2xl mx-auto">
                These aren't secrets. They're just not taught in schools.
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
                  icon: PiggyBank,
                  title: "401(k) Maximization",
                  desc: "Contribute up to $23,000/year (2024) and reduce your taxable income dollar-for-dollar",
                  savings: "Save $5,000-8,000/year"
                },
                {
                  icon: Wallet,
                  title: "HSA Triple Tax Advantage",
                  desc: "Tax-free contributions, growth, AND withdrawals. The only account with all three benefits",
                  savings: "Save $1,000-2,500/year"
                },
                {
                  icon: TrendingDown,
                  title: "Tax-Loss Harvesting",
                  desc: "Sell losing investments to offset gains. Turn losses into tax savings",
                  savings: "Save $500-3,000/year"
                },
                {
                  icon: Building2,
                  title: "Entity Optimization",
                  desc: "Structure income through LLC/S-Corp to reduce self-employment taxes",
                  savings: "Save $2,000-15,000/year"
                },
                {
                  icon: Receipt,
                  title: "Strategic Deductions",
                  desc: "Bunch deductions, time income, maximize above-the-line deductions",
                  savings: "Save $1,500-4,000/year"
                },
                {
                  icon: Landmark,
                  title: "Roth Conversions",
                  desc: "Convert traditional to Roth in low-income years. Tax-free growth forever",
                  savings: "Save $50,000+ long-term"
                }
              ].map((item, index) => (
                <motion.div
                  key={index}
                  variants={fadeInUp}
                  className="bg-white/5 border border-white/10 rounded-2xl p-6 hover:border-primary/30 transition-colors"
                >
                  <div className="w-12 h-12 bg-primary/20 rounded-xl flex items-center justify-center mb-4">
                    <item.icon className="w-6 h-6 text-primary" />
                  </div>
                  <h3 className="font-bold text-lg mb-2">{item.title}</h3>
                  <p className="text-white/60 text-sm mb-4">{item.desc}</p>
                  <div className="inline-block bg-primary/10 border border-primary/20 rounded-lg px-3 py-1">
                    <p className="text-primary text-sm font-medium">{item.savings}</p>
                  </div>
                </motion.div>
              ))}
            </motion.div>
          </div>
        </section>

        {/* REAL SCENARIOS SECTION */}
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
                Real People. <span className="text-primary">Real Savings.</span>
              </motion.h2>
              <motion.p variants={fadeInUp} className="text-white/60 max-w-2xl mx-auto">
                These scenarios play out every single day
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
                        <span className="text-2xl">👨‍💼</span>
                      </div>
                      <div>
                        <h3 className="font-bold">The W2 Employee</h3>
                        <p className="text-white/40 text-sm">David, $95K salary</p>
                      </div>
                    </div>

                    <p className="text-white/70 mb-6 text-sm leading-relaxed">
                      David thought he couldn't do much as a W2 employee. He was leaving thousands on the table.
                    </p>

                    <div className="space-y-3">
                      <div className="flex justify-between items-center bg-white/5 rounded-lg p-3">
                        <span className="text-white/60 text-sm">Maxed 401(k)</span>
                        <span className="text-primary font-bold">-$5,520 taxes</span>
                      </div>
                      <div className="flex justify-between items-center bg-white/5 rounded-lg p-3">
                        <span className="text-white/60 text-sm">Added HSA</span>
                        <span className="text-primary font-bold">-$1,200 taxes</span>
                      </div>
                      <div className="flex justify-between items-center bg-white/5 rounded-lg p-3">
                        <span className="text-white/60 text-sm">Started side LLC</span>
                        <span className="text-primary font-bold">-$2,400 taxes</span>
                      </div>
                    </div>

                    <div className="mt-6 pt-4 border-t border-white/10 text-center">
                      <p className="text-white/40 text-sm">Annual Savings</p>
                      <p className="text-primary font-bold text-2xl">$9,120/year</p>
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
                        <span className="text-2xl">👩‍💻</span>
                      </div>
                      <div>
                        <h3 className="font-bold">The Freelancer</h3>
                        <p className="text-white/40 text-sm">Maria, $120K revenue</p>
                      </div>
                    </div>

                    <p className="text-white/70 mb-6 text-sm leading-relaxed">
                      Maria was paying self-employment tax on everything. A simple restructure changed everything.
                    </p>

                    <div className="space-y-3">
                      <div className="flex justify-between items-center bg-white/5 rounded-lg p-3">
                        <span className="text-white/60 text-sm">S-Corp election</span>
                        <span className="text-primary font-bold">-$8,400 taxes</span>
                      </div>
                      <div className="flex justify-between items-center bg-white/5 rounded-lg p-3">
                        <span className="text-white/60 text-sm">Home office + expenses</span>
                        <span className="text-primary font-bold">-$4,200 taxes</span>
                      </div>
                      <div className="flex justify-between items-center bg-white/5 rounded-lg p-3">
                        <span className="text-white/60 text-sm">Solo 401(k)</span>
                        <span className="text-primary font-bold">-$6,600 taxes</span>
                      </div>
                    </div>

                    <div className="mt-6 pt-4 border-t border-white/10 text-center">
                      <p className="text-white/40 text-sm">Annual Savings</p>
                      <p className="text-primary font-bold text-2xl">$19,200/year</p>
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
                        <span className="text-2xl">👨‍👩‍👧</span>
                      </div>
                      <div>
                        <h3 className="font-bold">The Dual-Income Family</h3>
                        <p className="text-white/40 text-sm">The Johnsons, $180K combined</p>
                      </div>
                    </div>

                    <p className="text-white/70 mb-6 text-sm leading-relaxed">
                      Two W2 incomes, two 401(k)s, but no coordination. A unified strategy doubled their savings.
                    </p>

                    <div className="space-y-3">
                      <div className="flex justify-between items-center bg-white/5 rounded-lg p-3">
                        <span className="text-white/60 text-sm">Both maxed 401(k)s</span>
                        <span className="text-primary font-bold">-$11,040 taxes</span>
                      </div>
                      <div className="flex justify-between items-center bg-white/5 rounded-lg p-3">
                        <span className="text-white/60 text-sm">Dependent care FSA</span>
                        <span className="text-primary font-bold">-$1,250 taxes</span>
                      </div>
                      <div className="flex justify-between items-center bg-white/5 rounded-lg p-3">
                        <span className="text-white/60 text-sm">Tax-loss harvesting</span>
                        <span className="text-primary font-bold">-$2,100 taxes</span>
                      </div>
                    </div>

                    <div className="mt-6 pt-4 border-t border-white/10 text-center">
                      <p className="text-white/40 text-sm">Annual Savings</p>
                      <p className="text-primary font-bold text-2xl">$14,390/year</p>
                    </div>
                  </div>
                </div>
              </motion.div>
            </motion.div>
          </div>
        </section>

        {/* WHAT WE DO SECTION */}
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
                Your Tax Strategy <span className="text-primary">Team</span>
              </motion.h2>
              <motion.p variants={fadeInUp} className="text-white/60 max-w-2xl mx-auto">
                Stop guessing. Start optimizing.
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
                { icon: Calculator, title: "Tax Analysis", desc: "Deep dive into your current tax situation and missed opportunities" },
                { icon: Target, title: "Strategy Blueprint", desc: "Customized plan to minimize taxes legally and ethically" },
                { icon: Calendar, title: "Quarterly Planning", desc: "Year-round optimization, not just April panic" },
                { icon: Receipt, title: "Deduction Maximization", desc: "Find every deduction you're entitled to" },
                { icon: Shield, title: "Audit Protection", desc: "If the IRS comes knocking, we handle it" },
                { icon: TrendingUp, title: "Ongoing Optimization", desc: "As laws change, your strategy evolves" }
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
                  <div className="text-5xl mb-4">💰</div>
                  <h2 className="text-3xl md:text-4xl font-bold mb-4">
                    Stop Overpaying the IRS
                  </h2>
                  <p className="text-white/60 max-w-xl mx-auto mb-8">
                    Every year you wait is money you'll never get back. Let's fix that.
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
                      Book Tax Strategy Call
                    </button>
                  </div>

                  <p className="text-white/40 text-sm mt-6">
                    Free consultation. No obligation. Just clarity.
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
            <p className="text-white/40 mb-4">Ready to keep more of what you earn?</p>
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
