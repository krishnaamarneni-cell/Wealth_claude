"use client";

import React, { useState } from "react";
import { motion } from "framer-motion";
import {
  Briefcase,
  DollarSign,
  CheckCircle,
  XCircle,
  ArrowRight,
  ChevronDown,
  ChevronUp,
  Building2,
  Calendar,
  Users,
  HelpCircle,
  Zap,
  Target,
  Clock,
  TrendingUp,
  Laptop,
  Home,
  Car,
  Landmark,
  PiggyBank,
  Coins,
  CircleDollarSign,
  Wallet,
  BarChart3,
  LineChart,
  Layers,
  Globe,
  ShoppingBag,
  Pen,
  Camera,
  Code,
  Hammer,
  BookOpen,
  Play,
  Mic,
  Package,
  CreditCard,
  Banknote,
  ArrowUpRight,
  Shield,
  AlertTriangle,
  Sparkles,
  Repeat,
  Gauge
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
    q: "I barely have time for my main job. How can I add income streams?",
    a: "Start with passive or semi-passive income: dividend investing, rental properties, or digital products you create once and sell forever. We help you find streams that match YOUR time availability."
  },
  {
    q: "How much money do I need to start?",
    a: "Depends on the stream. Dividend investing? Start with $100. Rental property? $20K-50K for down payment. Digital products? Just your time. We match strategies to your capital."
  },
  {
    q: "What's the difference between active and passive income?",
    a: "Active income trades time for money (job, freelancing). Passive income earns while you sleep (dividends, royalties, rentals). The goal is shifting from active to passive over time."
  },
  {
    q: "Should I start a side business while employed?",
    a: "Often yes — but check your employment contract first. Many W2 employees build side businesses that eventually replace their salary. We help you do it legally and strategically."
  },
  {
    q: "How many income streams should I have?",
    a: "The average millionaire has 7 income streams. Start with 2-3, master them, then add more. Quality over quantity — one great stream beats five mediocre ones."
  },
  {
    q: "What if my side income isn't working?",
    a: "Most streams take 6-18 months to gain traction. We help you set realistic expectations, track progress, and know when to pivot vs persist."
  }
];

export default function IncomeDiversificationPage() {
  const [openFaq, setOpenFaq] = useState<number | null>(null);
  const [isBookCallOpen, setIsBookCallOpen] = useState(false);

  return (
    <div className="min-h-screen bg-[#0a0f18] text-white overflow-x-hidden">
      <Header />

      <main>
        {/* HERO SECTION */}
        <section className="relative pt-32 pb-20 px-4 overflow-hidden">
          {/* Background Effects */}
          <div className="absolute inset-0 bg-gradient-to-b from-amber-500/5 via-transparent to-transparent" />
          <div className="absolute top-20 left-1/4 w-96 h-96 bg-amber-500/10 rounded-full blur-3xl" />
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
                One Paycheck Away From Disaster?
                <br />
                <span className="text-primary">Not Anymore.</span>
              </motion.h1>

              <motion.p
                variants={fadeInUp}
                className="text-xl text-white/60 max-w-3xl mx-auto mb-8"
              >
                <span className="text-red-400 font-semibold">78% of Americans</span> live paycheck to paycheck.
                The wealthy? They have <span className="text-primary font-semibold">7+ income streams</span> on average.
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
              {/* SINGLE INCOME */}
              <motion.div
                variants={scaleIn}
                className="relative bg-gradient-to-b from-red-500/10 to-transparent border border-red-500/20 rounded-2xl p-6 overflow-hidden"
              >
                <div className="absolute top-0 right-0 w-32 h-32 bg-red-500/10 rounded-full blur-2xl" />

                <div className="relative">
                  <div className="flex items-center gap-3 mb-6">
                    <div className="w-12 h-12 bg-red-500/20 rounded-xl flex items-center justify-center">
                      <Gauge className="w-6 h-6 text-red-400" />
                    </div>
                    <div>
                      <h3 className="font-bold text-lg">Single Income</h3>
                      <p className="text-red-400 text-sm">"My job is stable"</p>
                    </div>
                  </div>

                  <div className="space-y-4 mb-6">
                    <div className="bg-white/5 rounded-lg p-4">
                      <p className="text-white/40 text-xs mb-1">INCOME SOURCES</p>
                      <p className="text-2xl font-bold">1</p>
                      <p className="text-white/40 text-xs">W2 salary only</p>
                    </div>

                    <div className="bg-red-500/10 border border-red-500/20 rounded-lg p-4">
                      <p className="text-red-400 text-xs mb-1">MONTHLY INCOME</p>
                      <p className="text-xl font-bold">$7,500</p>
                      <p className="text-white/40 text-xs">100% dependent on employer</p>
                    </div>

                    <div className="bg-white/5 rounded-lg p-4">
                      <p className="text-white/40 text-xs mb-1">IF LAID OFF</p>
                      <p className="text-xl font-bold text-red-400">$0/month</p>
                      <p className="text-white/40 text-xs">Savings depleting fast</p>
                    </div>

                    <div className="bg-red-500/20 border border-red-500/30 rounded-lg p-4">
                      <p className="text-white/40 text-xs mb-1">TIME TO FIRE</p>
                      <p className="text-2xl font-bold text-red-400">25+ years</p>
                      <p className="text-white/40 text-xs">Traditional retirement path</p>
                    </div>
                  </div>

                  <div className="space-y-2 border-t border-white/10 pt-4">
                    <div className="flex items-center gap-2 text-sm text-red-400">
                      <XCircle className="w-4 h-4" />
                      <span>Zero diversification</span>
                    </div>
                    <div className="flex items-center gap-2 text-sm text-red-400">
                      <XCircle className="w-4 h-4" />
                      <span>Vulnerable to layoffs</span>
                    </div>
                    <div className="flex items-center gap-2 text-sm text-red-400">
                      <XCircle className="w-4 h-4" />
                      <span>Trading time for money</span>
                    </div>
                    <div className="flex items-center gap-2 text-sm text-red-400">
                      <XCircle className="w-4 h-4" />
                      <span>Income capped by salary</span>
                    </div>
                  </div>

                  <div className="mt-6 text-center">
                    <span className="text-3xl">😰</span>
                    <p className="text-white/40 text-sm mt-2">Most Americans</p>
                  </div>
                </div>
              </motion.div>

              {/* DIVERSIFIED INCOME */}
              <motion.div
                variants={scaleIn}
                className="relative bg-gradient-to-b from-primary/20 to-transparent border-2 border-primary/40 rounded-2xl p-6 overflow-hidden"
              >
                <div className="absolute top-0 right-0 w-32 h-32 bg-primary/20 rounded-full blur-2xl" />

                <div className="relative">
                  <div className="flex items-center gap-3 mb-6">
                    <div className="w-12 h-12 bg-primary/20 rounded-xl flex items-center justify-center">
                      <Layers className="w-6 h-6 text-primary" />
                    </div>
                    <div>
                      <h3 className="font-bold text-lg">Diversified Income</h3>
                      <p className="text-primary text-sm">"I have multiple streams"</p>
                    </div>
                  </div>

                  <div className="space-y-4 mb-6">
                    <div className="bg-white/5 rounded-lg p-4">
                      <p className="text-white/40 text-xs mb-1">INCOME SOURCES</p>
                      <p className="text-2xl font-bold text-primary">5</p>
                      <p className="text-white/40 text-xs">Salary + side business + dividends + rental + royalties</p>
                    </div>

                    <div className="bg-primary/10 border border-primary/20 rounded-lg p-4">
                      <p className="text-primary text-xs mb-1">MONTHLY INCOME</p>
                      <p className="text-xl font-bold text-primary">$12,500</p>
                      <p className="text-white/40 text-xs">$5K passive, $7.5K active</p>
                    </div>

                    <div className="bg-white/5 rounded-lg p-4">
                      <p className="text-white/40 text-xs mb-1">IF LAID OFF</p>
                      <p className="text-xl font-bold text-primary">$5,000/month</p>
                      <p className="text-white/40 text-xs">Passive income continues</p>
                    </div>

                    <div className="bg-primary/20 border border-primary/30 rounded-lg p-4">
                      <p className="text-white/40 text-xs mb-1">TIME TO FIRE</p>
                      <p className="text-2xl font-bold text-primary">8-12 years</p>
                      <p className="text-white/40 text-xs">Accelerated path</p>
                    </div>
                  </div>

                  <div className="space-y-2 border-t border-white/10 pt-4">
                    <div className="flex items-center gap-2 text-sm text-primary">
                      <CheckCircle className="w-4 h-4" />
                      <span>Multiple income sources</span>
                    </div>
                    <div className="flex items-center gap-2 text-sm text-primary">
                      <CheckCircle className="w-4 h-4" />
                      <span>Layoff-proof income</span>
                    </div>
                    <div className="flex items-center gap-2 text-sm text-primary">
                      <CheckCircle className="w-4 h-4" />
                      <span>Money works while you sleep</span>
                    </div>
                    <div className="flex items-center gap-2 text-sm text-primary">
                      <CheckCircle className="w-4 h-4" />
                      <span>Unlimited income potential</span>
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
                <p className="text-4xl font-bold text-primary mb-2">$5,000/month passive</p>
                <p className="text-white/50 text-sm">Same starting point. <span className="text-primary">Different strategy = freedom 15 years sooner.</span></p>
              </div>
            </motion.div>
          </div>
        </section>

        {/* INCOME STREAM TYPES */}
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
                The <span className="text-primary">7 Income Streams</span> of Millionaires
              </motion.h2>
              <motion.p variants={fadeInUp} className="text-white/60 max-w-2xl mx-auto">
                The average millionaire has 7. How many do you have?
              </motion.p>
            </motion.div>

            <motion.div
              initial="hidden"
              whileInView="visible"
              viewport={{ once: true }}
              variants={staggerContainer}
              className="grid md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8"
            >
              {[
                {
                  icon: Briefcase,
                  title: "1. Earned Income",
                  desc: "Salary from your job. The starting point, not the end goal.",
                  type: "Active",
                  example: "$75,000/year W2",
                  color: "blue"
                },
                {
                  icon: TrendingUp,
                  title: "2. Profit Income",
                  desc: "Money from selling products or services at a markup.",
                  type: "Active → Passive",
                  example: "E-commerce, consulting",
                  color: "purple"
                },
                {
                  icon: Coins,
                  title: "3. Interest Income",
                  desc: "Banks pay you to hold your money. Bonds, CDs, savings.",
                  type: "Passive",
                  example: "5% on $100K = $5K/year",
                  color: "cyan"
                },
                {
                  icon: BarChart3,
                  title: "4. Dividend Income",
                  desc: "Companies share profits with shareholders quarterly.",
                  type: "Passive",
                  example: "$500K portfolio = $15K/year",
                  color: "emerald"
                },
                {
                  icon: Home,
                  title: "5. Rental Income",
                  desc: "Tenants pay you monthly for property use.",
                  type: "Semi-Passive",
                  example: "$1,500/month per property",
                  color: "orange"
                },
                {
                  icon: LineChart,
                  title: "6. Capital Gains",
                  desc: "Profit from selling assets worth more than you paid.",
                  type: "Passive",
                  example: "Stock appreciation, real estate",
                  color: "pink"
                },
                {
                  icon: Sparkles,
                  title: "7. Royalty Income",
                  desc: "Ongoing payments for something you created once.",
                  type: "Passive",
                  example: "Books, courses, music, patents",
                  color: "amber"
                }
              ].map((item, index) => (
                <motion.div
                  key={index}
                  variants={fadeInUp}
                  className={`bg-white/5 border border-white/10 rounded-2xl p-6 hover:border-primary/30 transition-colors ${index === 6 ? 'md:col-span-2 lg:col-span-1' : ''}`}
                >
                  <div className={`w-12 h-12 rounded-xl flex items-center justify-center mb-4 ${item.color === 'blue' ? 'bg-blue-500/20' :
                      item.color === 'purple' ? 'bg-purple-500/20' :
                        item.color === 'cyan' ? 'bg-cyan-500/20' :
                          item.color === 'emerald' ? 'bg-emerald-500/20' :
                            item.color === 'orange' ? 'bg-orange-500/20' :
                              item.color === 'pink' ? 'bg-pink-500/20' : 'bg-amber-500/20'
                    }`}>
                    <item.icon className={`w-6 h-6 ${item.color === 'blue' ? 'text-blue-400' :
                        item.color === 'purple' ? 'text-purple-400' :
                          item.color === 'cyan' ? 'text-cyan-400' :
                            item.color === 'emerald' ? 'text-emerald-400' :
                              item.color === 'orange' ? 'text-orange-400' :
                                item.color === 'pink' ? 'text-pink-400' : 'text-amber-400'
                      }`} />
                  </div>
                  <h3 className="font-bold text-lg mb-2">{item.title}</h3>
                  <p className="text-white/60 text-sm mb-4">{item.desc}</p>
                  <div className="space-y-2">
                    <div className="flex justify-between text-sm">
                      <span className="text-white/40">Type</span>
                      <span className={`${item.type === 'Passive' ? 'text-primary' : item.type === 'Active' ? 'text-white/60' : 'text-amber-400'}`}>{item.type}</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-white/40">Example</span>
                      <span className="text-white/80">{item.example}</span>
                    </div>
                  </div>
                </motion.div>
              ))}
            </motion.div>

            <motion.div
              initial="hidden"
              whileInView="visible"
              viewport={{ once: true }}
              variants={fadeInUp}
              className="text-center"
            >
              <p className="text-white/60 bg-primary/10 border border-primary/20 rounded-xl p-4 inline-block">
                💡 <span className="text-primary font-semibold">Goal:</span> Start with earned income (#1), then systematically add passive streams (#3-7)
              </p>
            </motion.div>
          </div>
        </section>

        {/* SIDE HUSTLE IDEAS */}
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
                Side Income <span className="text-primary">Ideas</span> by Skill
              </motion.h2>
              <motion.p variants={fadeInUp} className="text-white/60 max-w-2xl mx-auto">
                Something here for everyone — pick based on your skills and time
              </motion.p>
            </motion.div>

            <motion.div
              initial="hidden"
              whileInView="visible"
              viewport={{ once: true }}
              variants={staggerContainer}
              className="grid md:grid-cols-2 lg:grid-cols-4 gap-6"
            >
              {/* Creative */}
              <motion.div variants={fadeInUp} className="bg-white/5 border border-white/10 rounded-2xl p-6">
                <div className="w-12 h-12 bg-pink-500/20 rounded-xl flex items-center justify-center mb-4">
                  <Camera className="w-6 h-6 text-pink-400" />
                </div>
                <h3 className="font-bold text-lg mb-4 text-pink-400">Creative</h3>
                <ul className="space-y-2 text-sm text-white/70">
                  <li className="flex items-center gap-2">
                    <ArrowRight className="w-3 h-3 text-pink-400" />
                    YouTube / TikTok
                  </li>
                  <li className="flex items-center gap-2">
                    <ArrowRight className="w-3 h-3 text-pink-400" />
                    Photography
                  </li>
                  <li className="flex items-center gap-2">
                    <ArrowRight className="w-3 h-3 text-pink-400" />
                    Graphic design
                  </li>
                  <li className="flex items-center gap-2">
                    <ArrowRight className="w-3 h-3 text-pink-400" />
                    Music production
                  </li>
                  <li className="flex items-center gap-2">
                    <ArrowRight className="w-3 h-3 text-pink-400" />
                    Print-on-demand
                  </li>
                </ul>
                <div className="mt-4 pt-4 border-t border-white/10">
                  <p className="text-white/40 text-xs">Income potential</p>
                  <p className="text-pink-400 font-bold">$500 - $10K+/mo</p>
                </div>
              </motion.div>

              {/* Technical */}
              <motion.div variants={fadeInUp} className="bg-white/5 border border-white/10 rounded-2xl p-6">
                <div className="w-12 h-12 bg-blue-500/20 rounded-xl flex items-center justify-center mb-4">
                  <Code className="w-6 h-6 text-blue-400" />
                </div>
                <h3 className="font-bold text-lg mb-4 text-blue-400">Technical</h3>
                <ul className="space-y-2 text-sm text-white/70">
                  <li className="flex items-center gap-2">
                    <ArrowRight className="w-3 h-3 text-blue-400" />
                    Freelance development
                  </li>
                  <li className="flex items-center gap-2">
                    <ArrowRight className="w-3 h-3 text-blue-400" />
                    SaaS products
                  </li>
                  <li className="flex items-center gap-2">
                    <ArrowRight className="w-3 h-3 text-blue-400" />
                    No-code apps
                  </li>
                  <li className="flex items-center gap-2">
                    <ArrowRight className="w-3 h-3 text-blue-400" />
                    Technical writing
                  </li>
                  <li className="flex items-center gap-2">
                    <ArrowRight className="w-3 h-3 text-blue-400" />
                    API integrations
                  </li>
                </ul>
                <div className="mt-4 pt-4 border-t border-white/10">
                  <p className="text-white/40 text-xs">Income potential</p>
                  <p className="text-blue-400 font-bold">$2K - $20K+/mo</p>
                </div>
              </motion.div>

              {/* Knowledge */}
              <motion.div variants={fadeInUp} className="bg-white/5 border border-white/10 rounded-2xl p-6">
                <div className="w-12 h-12 bg-purple-500/20 rounded-xl flex items-center justify-center mb-4">
                  <BookOpen className="w-6 h-6 text-purple-400" />
                </div>
                <h3 className="font-bold text-lg mb-4 text-purple-400">Knowledge</h3>
                <ul className="space-y-2 text-sm text-white/70">
                  <li className="flex items-center gap-2">
                    <ArrowRight className="w-3 h-3 text-purple-400" />
                    Online courses
                  </li>
                  <li className="flex items-center gap-2">
                    <ArrowRight className="w-3 h-3 text-purple-400" />
                    Coaching/consulting
                  </li>
                  <li className="flex items-center gap-2">
                    <ArrowRight className="w-3 h-3 text-purple-400" />
                    E-books / guides
                  </li>
                  <li className="flex items-center gap-2">
                    <ArrowRight className="w-3 h-3 text-purple-400" />
                    Paid newsletter
                  </li>
                  <li className="flex items-center gap-2">
                    <ArrowRight className="w-3 h-3 text-purple-400" />
                    Tutoring
                  </li>
                </ul>
                <div className="mt-4 pt-4 border-t border-white/10">
                  <p className="text-white/40 text-xs">Income potential</p>
                  <p className="text-purple-400 font-bold">$1K - $50K+/mo</p>
                </div>
              </motion.div>

              {/* Investment */}
              <motion.div variants={fadeInUp} className="bg-white/5 border border-white/10 rounded-2xl p-6">
                <div className="w-12 h-12 bg-emerald-500/20 rounded-xl flex items-center justify-center mb-4">
                  <TrendingUp className="w-6 h-6 text-emerald-400" />
                </div>
                <h3 className="font-bold text-lg mb-4 text-emerald-400">Investment</h3>
                <ul className="space-y-2 text-sm text-white/70">
                  <li className="flex items-center gap-2">
                    <ArrowRight className="w-3 h-3 text-emerald-400" />
                    Dividend stocks
                  </li>
                  <li className="flex items-center gap-2">
                    <ArrowRight className="w-3 h-3 text-emerald-400" />
                    Rental properties
                  </li>
                  <li className="flex items-center gap-2">
                    <ArrowRight className="w-3 h-3 text-emerald-400" />
                    REITs
                  </li>
                  <li className="flex items-center gap-2">
                    <ArrowRight className="w-3 h-3 text-emerald-400" />
                    Bond ladder
                  </li>
                  <li className="flex items-center gap-2">
                    <ArrowRight className="w-3 h-3 text-emerald-400" />
                    High-yield savings
                  </li>
                </ul>
                <div className="mt-4 pt-4 border-t border-white/10">
                  <p className="text-white/40 text-xs">Income potential</p>
                  <p className="text-emerald-400 font-bold">4-10% annually</p>
                </div>
              </motion.div>
            </motion.div>
          </div>
        </section>

        {/* PASSIVE INCOME LADDER */}
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
                The <span className="text-primary">Passive Income Ladder</span>
              </motion.h2>
              <motion.p variants={fadeInUp} className="text-white/60 max-w-2xl mx-auto">
                Climb from trading time → to money working for you
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
                  level: 1,
                  title: "High-Yield Savings",
                  effort: "Zero effort",
                  income: "$500-2K/year",
                  desc: "Park emergency fund in 5% APY account",
                  color: "blue"
                },
                {
                  level: 2,
                  title: "Dividend Investing",
                  effort: "Set and forget",
                  income: "$3K-15K/year",
                  desc: "Build portfolio of dividend-paying stocks/ETFs",
                  color: "cyan"
                },
                {
                  level: 3,
                  title: "Digital Products",
                  effort: "Create once, sell forever",
                  income: "$1K-20K/month",
                  desc: "E-books, templates, courses, printables",
                  color: "purple"
                },
                {
                  level: 4,
                  title: "Rental Property",
                  effort: "Semi-passive with manager",
                  income: "$500-3K/month per unit",
                  desc: "Cash-flowing real estate with property manager",
                  color: "orange"
                },
                {
                  level: 5,
                  title: "Business Ownership",
                  effort: "Build systems, then step back",
                  income: "$5K-100K+/month",
                  desc: "Hire team, automate, become the owner not operator",
                  color: "emerald"
                }
              ].map((item, index) => (
                <motion.div
                  key={index}
                  variants={fadeInUp}
                  className="flex gap-4 items-start"
                >
                  <div className={`w-12 h-12 rounded-full flex items-center justify-center flex-shrink-0 font-bold text-lg ${item.color === 'blue' ? 'bg-blue-500/20 text-blue-400' :
                      item.color === 'cyan' ? 'bg-cyan-500/20 text-cyan-400' :
                        item.color === 'purple' ? 'bg-purple-500/20 text-purple-400' :
                          item.color === 'orange' ? 'bg-orange-500/20 text-orange-400' : 'bg-emerald-500/20 text-emerald-400'
                    }`}>
                    {item.level}
                  </div>
                  <div className="flex-1 bg-white/5 border border-white/10 rounded-xl p-4 hover:border-white/20 transition-colors">
                    <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-2 mb-2">
                      <h3 className="font-bold text-lg">{item.title}</h3>
                      <div className={`inline-block px-3 py-1 rounded-full text-xs font-medium ${item.color === 'blue' ? 'bg-blue-500/20 text-blue-400' :
                          item.color === 'cyan' ? 'bg-cyan-500/20 text-cyan-400' :
                            item.color === 'purple' ? 'bg-purple-500/20 text-purple-400' :
                              item.color === 'orange' ? 'bg-orange-500/20 text-orange-400' : 'bg-emerald-500/20 text-emerald-400'
                        }`}>
                        {item.income}
                      </div>
                    </div>
                    <p className="text-white/60 text-sm mb-2">{item.desc}</p>
                    <p className="text-white/40 text-xs">Effort: {item.effort}</p>
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
                Income Myths Keeping You <span className="text-red-400">Stuck</span>
              </motion.h2>
              <motion.p variants={fadeInUp} className="text-white/60 max-w-2xl mx-auto">
                These beliefs are costing you freedom
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
                  myth: "I don't have time for a side hustle",
                  reality: "Start with 5 hours/week. Build systems. Replace time with leverage."
                },
                {
                  myth: "I need a unique, original idea",
                  reality: "Execution beats ideas. Improve existing solutions. That's how most succeed."
                },
                {
                  myth: "Passive income is a scam",
                  reality: "It's real — but requires upfront work or capital. Nothing is truly 'free' money."
                },
                {
                  myth: "I'll start when I have more money",
                  reality: "Start with skills (free), then reinvest profits. Don't wait for capital."
                },
                {
                  myth: "My job won't allow side work",
                  reality: "Check your contract. Most allow it outside work hours in non-competing fields."
                },
                {
                  myth: "I'm not the entrepreneur type",
                  reality: "You don't need to be. Passive investing requires zero entrepreneurship."
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
                Real People. <span className="text-primary">Real Income Streams.</span>
              </motion.h2>
              <motion.p variants={fadeInUp} className="text-white/60 max-w-2xl mx-auto">
                They started exactly where you are
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
                        <span className="text-2xl">👨‍💻</span>
                      </div>
                      <div>
                        <h3 className="font-bold">The Developer</h3>
                        <p className="text-white/40 text-sm">Alex, 28, Software Engineer</p>
                      </div>
                    </div>

                    <p className="text-white/70 mb-6 text-sm leading-relaxed">
                      Built a micro-SaaS on weekends. Now earns more passively than his day job pays.
                    </p>

                    <div className="space-y-3">
                      <div className="flex justify-between items-center bg-white/5 rounded-lg p-3">
                        <span className="text-white/60 text-sm">W2 Salary</span>
                        <span className="text-white/80">$8,500/mo</span>
                      </div>
                      <div className="flex justify-between items-center bg-white/5 rounded-lg p-3">
                        <span className="text-white/60 text-sm">SaaS Revenue</span>
                        <span className="text-primary font-bold">$12,000/mo</span>
                      </div>
                      <div className="flex justify-between items-center bg-white/5 rounded-lg p-3">
                        <span className="text-white/60 text-sm">Dividends</span>
                        <span className="text-primary font-bold">$800/mo</span>
                      </div>
                    </div>

                    <div className="mt-6 pt-4 border-t border-white/10 text-center">
                      <p className="text-white/40 text-sm">Total Monthly Income</p>
                      <p className="text-primary font-bold text-2xl">$21,300</p>
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
                        <span className="text-2xl">👩‍🏫</span>
                      </div>
                      <div>
                        <h3 className="font-bold">The Teacher</h3>
                        <p className="text-white/40 text-sm">Maria, 35, High School Teacher</p>
                      </div>
                    </div>

                    <p className="text-white/70 mb-6 text-sm leading-relaxed">
                      Created curriculum resources on Teachers Pay Teachers. Now earns royalties while she sleeps.
                    </p>

                    <div className="space-y-3">
                      <div className="flex justify-between items-center bg-white/5 rounded-lg p-3">
                        <span className="text-white/60 text-sm">Teaching Salary</span>
                        <span className="text-white/80">$4,500/mo</span>
                      </div>
                      <div className="flex justify-between items-center bg-white/5 rounded-lg p-3">
                        <span className="text-white/60 text-sm">Digital Products</span>
                        <span className="text-primary font-bold">$3,200/mo</span>
                      </div>
                      <div className="flex justify-between items-center bg-white/5 rounded-lg p-3">
                        <span className="text-white/60 text-sm">Tutoring (part-time)</span>
                        <span className="text-primary font-bold">$1,500/mo</span>
                      </div>
                    </div>

                    <div className="mt-6 pt-4 border-t border-white/10 text-center">
                      <p className="text-white/40 text-sm">Total Monthly Income</p>
                      <p className="text-primary font-bold text-2xl">$9,200</p>
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
                        <h3 className="font-bold">The Corporate Couple</h3>
                        <p className="text-white/40 text-sm">The Nguyens, dual income</p>
                      </div>
                    </div>

                    <p className="text-white/70 mb-6 text-sm leading-relaxed">
                      Built a rental portfolio over 5 years. Planning to retire at 50 on rental income alone.
                    </p>

                    <div className="space-y-3">
                      <div className="flex justify-between items-center bg-white/5 rounded-lg p-3">
                        <span className="text-white/60 text-sm">Combined Salaries</span>
                        <span className="text-white/80">$18,000/mo</span>
                      </div>
                      <div className="flex justify-between items-center bg-white/5 rounded-lg p-3">
                        <span className="text-white/60 text-sm">Rental Income (4 units)</span>
                        <span className="text-primary font-bold">$6,400/mo</span>
                      </div>
                      <div className="flex justify-between items-center bg-white/5 rounded-lg p-3">
                        <span className="text-white/60 text-sm">Dividends</span>
                        <span className="text-primary font-bold">$2,100/mo</span>
                      </div>
                    </div>

                    <div className="mt-6 pt-4 border-t border-white/10 text-center">
                      <p className="text-white/40 text-sm">Total Monthly Income</p>
                      <p className="text-primary font-bold text-2xl">$26,500</p>
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
                Your Income <span className="text-primary">Diversification</span> Team
              </motion.h2>
              <motion.p variants={fadeInUp} className="text-white/60 max-w-2xl mx-auto">
                We help you build streams that match YOUR life
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
                { icon: Target, title: "Income Assessment", desc: "Analyze your skills, time, and capital to find the best fit" },
                { icon: Layers, title: "Stream Strategy", desc: "Create a roadmap to add 2-3 income streams this year" },
                { icon: Building2, title: "Business Setup", desc: "LLC formation, tax structure, legal protection" },
                { icon: TrendingUp, title: "Investment Strategy", desc: "Build dividend and rental income portfolios" },
                { icon: Repeat, title: "Automation Systems", desc: "Make income streams as passive as possible" },
                { icon: BarChart3, title: "Progress Tracking", desc: "Monthly check-ins to optimize and scale" }
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
                    Build Your Income Empire
                  </h2>
                  <p className="text-white/60 max-w-xl mx-auto mb-8">
                    One income stream is a risk. Multiple streams is freedom. Let's build yours.
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
                      Book Income Strategy Call
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
            <p className="text-white/40 mb-4">Ready to stop depending on one paycheck?</p>
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
