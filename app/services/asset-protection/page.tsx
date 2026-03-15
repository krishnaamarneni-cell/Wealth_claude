"use client";

import React, { useState } from "react";
import { motion } from "framer-motion";
import {
  Shield,
  DollarSign,
  CheckCircle,
  XCircle,
  ArrowRight,
  ChevronDown,
  ChevronUp,
  Briefcase,
  Building2,
  Calendar,
  Users,
  HelpCircle,
  Zap,
  Target,
  Clock,
  Lock,
  Umbrella,
  FileText,
  Home,
  Car,
  Landmark,
  Scale,
  AlertTriangle,
  Heart,
  HeartCrack,
  Gavel,
  ShieldCheck,
  ShieldAlert,
  ShieldX,
  Wallet,
  PiggyBank,
  TrendingUp,
  Eye,
  EyeOff,
  Layers,
  CircleDollarSign
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
    q: "I don't have that much money. Do I really need asset protection?",
    a: "If you have a home, car, retirement accounts, or any savings — YES. One lawsuit, one accident, one divorce can wipe out decades of work. Protection isn't just for millionaires."
  },
  {
    q: "What's the difference between a Trust and an LLC?",
    a: "LLCs protect business assets and create liability shields. Trusts protect personal assets and handle estate planning. Often you need BOTH working together for complete protection."
  },
  {
    q: "Can I protect assets from divorce?",
    a: "Yes, with proper planning BEFORE marriage or BEFORE acquiring assets. Prenups, trusts, and proper titling can protect what you bring into a marriage and what you inherit."
  },
  {
    q: "Is this legal? It sounds like hiding assets.",
    a: "100% legal when done properly and BEFORE any claims arise. Asset protection is about legal structures, not hiding. Courts recognize legitimate planning done in advance."
  },
  {
    q: "When should I set up asset protection?",
    a: "NOW — before you need it. Asset protection must be established BEFORE any lawsuit, divorce, or creditor claim. Once a threat exists, it's often too late."
  },
  {
    q: "How much does asset protection cost?",
    a: "Basic structures start at a few thousand dollars. Compare that to losing $500K+ in a lawsuit or divorce. It's insurance you set up once and benefit from forever."
  }
];

export default function AssetProtectionPage() {
  const [openFaq, setOpenFaq] = useState<number | null>(null);
  const [isBookCallOpen, setIsBookCallOpen] = useState(false);

  return (
    <div className="min-h-screen bg-[#0a0f18] text-white overflow-x-hidden">
      <Header />

      <main>
        {/* HERO SECTION */}
        <section className="relative pt-32 pb-20 px-4 overflow-hidden">
          {/* Background Effects */}
          <div className="absolute inset-0 bg-gradient-to-b from-blue-500/5 via-transparent to-transparent" />
          <div className="absolute top-20 left-1/4 w-96 h-96 bg-blue-500/10 rounded-full blur-3xl" />
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
                You Worked Hard to Build It.
                <br />
                <span className="text-primary">Don't Let One Event Take It.</span>
              </motion.h1>

              <motion.p
                variants={fadeInUp}
                className="text-xl text-white/60 max-w-3xl mx-auto mb-8"
              >
                <span className="text-red-400 font-semibold">1 in 3 Americans</span> will be sued in their lifetime.
                Divorce rate? <span className="text-red-400 font-semibold">50%</span>.
                Are your assets protected?
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
              {/* UNPROTECTED */}
              <motion.div
                variants={scaleIn}
                className="relative bg-gradient-to-b from-red-500/10 to-transparent border border-red-500/20 rounded-2xl p-6 overflow-hidden"
              >
                <div className="absolute top-0 right-0 w-32 h-32 bg-red-500/10 rounded-full blur-2xl" />

                <div className="relative">
                  <div className="flex items-center gap-3 mb-6">
                    <div className="w-12 h-12 bg-red-500/20 rounded-xl flex items-center justify-center">
                      <ShieldX className="w-6 h-6 text-red-400" />
                    </div>
                    <div>
                      <h3 className="font-bold text-lg">Unprotected</h3>
                      <p className="text-red-400 text-sm">"It won't happen to me"</p>
                    </div>
                  </div>

                  <div className="space-y-4 mb-6">
                    <div className="bg-white/5 rounded-lg p-4">
                      <p className="text-white/40 text-xs mb-1">NET WORTH</p>
                      <p className="text-2xl font-bold">$750,000</p>
                      <p className="text-white/40 text-xs">Home + 401k + savings</p>
                    </div>

                    <div className="bg-red-500/10 border border-red-500/20 rounded-lg p-4">
                      <p className="text-red-400 text-xs mb-1">PROTECTION LEVEL</p>
                      <p className="text-white/80 text-sm">Everything in personal name. No structures. No plan.</p>
                    </div>

                    <div className="bg-white/5 rounded-lg p-4">
                      <p className="text-white/40 text-xs mb-1">AFTER LAWSUIT</p>
                      <p className="text-xl font-bold text-red-400">$150,000</p>
                      <p className="text-white/40 text-xs">Lost home, garnished wages, drained savings</p>
                    </div>

                    <div className="bg-red-500/20 border border-red-500/30 rounded-lg p-4">
                      <p className="text-white/40 text-xs mb-1">AFTER DIVORCE</p>
                      <p className="text-2xl font-bold text-red-400">$375,000</p>
                      <p className="text-white/40 text-xs">50% gone. Plus attorney fees.</p>
                    </div>
                  </div>

                  <div className="space-y-2 border-t border-white/10 pt-4">
                    <div className="flex items-center gap-2 text-sm text-red-400">
                      <XCircle className="w-4 h-4" />
                      <span>No liability protection</span>
                    </div>
                    <div className="flex items-center gap-2 text-sm text-red-400">
                      <XCircle className="w-4 h-4" />
                      <span>No trust structure</span>
                    </div>
                    <div className="flex items-center gap-2 text-sm text-red-400">
                      <XCircle className="w-4 h-4" />
                      <span>Everything exposed</span>
                    </div>
                    <div className="flex items-center gap-2 text-sm text-red-400">
                      <XCircle className="w-4 h-4" />
                      <span>Hoping for the best</span>
                    </div>
                  </div>

                  <div className="mt-6 text-center">
                    <span className="text-3xl">😰</span>
                    <p className="text-white/40 text-sm mt-2">90% of Americans</p>
                  </div>
                </div>
              </motion.div>

              {/* PROTECTED */}
              <motion.div
                variants={scaleIn}
                className="relative bg-gradient-to-b from-primary/20 to-transparent border-2 border-primary/40 rounded-2xl p-6 overflow-hidden"
              >
                <div className="absolute top-0 right-0 w-32 h-32 bg-primary/20 rounded-full blur-2xl" />

                <div className="relative">
                  <div className="flex items-center gap-3 mb-6">
                    <div className="w-12 h-12 bg-primary/20 rounded-xl flex items-center justify-center">
                      <ShieldCheck className="w-6 h-6 text-primary" />
                    </div>
                    <div>
                      <h3 className="font-bold text-lg">Protected</h3>
                      <p className="text-primary text-sm">"I planned ahead"</p>
                    </div>
                  </div>

                  <div className="space-y-4 mb-6">
                    <div className="bg-white/5 rounded-lg p-4">
                      <p className="text-white/40 text-xs mb-1">NET WORTH</p>
                      <p className="text-2xl font-bold">$750,000</p>
                      <p className="text-white/40 text-xs">Same starting point</p>
                    </div>

                    <div className="bg-primary/10 border border-primary/20 rounded-lg p-4">
                      <p className="text-primary text-xs mb-1">PROTECTION LEVEL</p>
                      <p className="text-white/80 text-sm">LLC + Trust + Umbrella insurance + Proper titling</p>
                    </div>

                    <div className="bg-white/5 rounded-lg p-4">
                      <p className="text-white/40 text-xs mb-1">AFTER LAWSUIT</p>
                      <p className="text-xl font-bold text-primary">$720,000</p>
                      <p className="text-white/40 text-xs">Insurance covered it. Assets untouched.</p>
                    </div>

                    <div className="bg-primary/20 border border-primary/30 rounded-lg p-4">
                      <p className="text-white/40 text-xs mb-1">AFTER DIVORCE</p>
                      <p className="text-2xl font-bold text-primary">$600,000+</p>
                      <p className="text-white/40 text-xs">Trust assets protected. Prenup honored.</p>
                    </div>
                  </div>

                  <div className="space-y-2 border-t border-white/10 pt-4">
                    <div className="flex items-center gap-2 text-sm text-primary">
                      <CheckCircle className="w-4 h-4" />
                      <span>LLC shields business assets</span>
                    </div>
                    <div className="flex items-center gap-2 text-sm text-primary">
                      <CheckCircle className="w-4 h-4" />
                      <span>Trust protects personal assets</span>
                    </div>
                    <div className="flex items-center gap-2 text-sm text-primary">
                      <CheckCircle className="w-4 h-4" />
                      <span>Umbrella adds extra coverage</span>
                    </div>
                    <div className="flex items-center gap-2 text-sm text-primary">
                      <CheckCircle className="w-4 h-4" />
                      <span>Peace of mind</span>
                    </div>
                  </div>

                  <div className="mt-6 text-center">
                    <span className="text-3xl">🛡️</span>
                    <p className="text-primary text-sm mt-2 font-medium">The Prepared Few</p>
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
                <p className="text-white/60 text-sm mb-2">ASSETS PRESERVED</p>
                <p className="text-4xl font-bold text-primary mb-2">$225,000 - $570,000</p>
                <p className="text-white/50 text-sm">Same wealth. <span className="text-primary">Different outcome.</span> Protection is the difference.</p>
              </div>
            </motion.div>
          </div>
        </section>

        {/* THREAT LANDSCAPE */}
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
                What's <span className="text-red-400">Coming For</span> Your Assets?
              </motion.h2>
              <motion.p variants={fadeInUp} className="text-white/60 max-w-2xl mx-auto">
                These aren't hypotheticals. They happen every day.
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
                  icon: Gavel,
                  title: "Lawsuits",
                  stat: "40M+ lawsuits filed/year",
                  desc: "Car accidents, slip & falls, professional liability, contract disputes",
                  color: "red"
                },
                {
                  icon: HeartCrack,
                  title: "Divorce",
                  stat: "50% of marriages end",
                  desc: "Without protection, everything is split — including what you brought in",
                  color: "pink"
                },
                {
                  icon: Building2,
                  title: "Business Liability",
                  stat: "36% of businesses sued/year",
                  desc: "Customer injuries, employee claims, vendor disputes",
                  color: "orange"
                },
                {
                  icon: AlertTriangle,
                  title: "Creditors",
                  stat: "$930B in collections",
                  desc: "Medical debt, business failure, personal guarantees gone wrong",
                  color: "yellow"
                },
                {
                  icon: Scale,
                  title: "Judgments",
                  stat: "Average: $60,000+",
                  desc: "Personal injury judgments can reach millions. Wages garnished for years.",
                  color: "purple"
                },
                {
                  icon: FileText,
                  title: "Estate Issues",
                  stat: "68% die without a will",
                  desc: "Probate, family disputes, assets frozen for months or years",
                  color: "blue"
                }
              ].map((item, index) => (
                <motion.div
                  key={index}
                  variants={fadeInUp}
                  className="bg-white/5 border border-white/10 rounded-2xl p-6 hover:border-white/20 transition-colors"
                >
                  <div className={`w-12 h-12 rounded-xl flex items-center justify-center mb-4 ${item.color === 'red' ? 'bg-red-500/20' :
                      item.color === 'pink' ? 'bg-pink-500/20' :
                        item.color === 'orange' ? 'bg-orange-500/20' :
                          item.color === 'yellow' ? 'bg-yellow-500/20' :
                            item.color === 'purple' ? 'bg-purple-500/20' : 'bg-blue-500/20'
                    }`}>
                    <item.icon className={`w-6 h-6 ${item.color === 'red' ? 'text-red-400' :
                        item.color === 'pink' ? 'text-pink-400' :
                          item.color === 'orange' ? 'text-orange-400' :
                            item.color === 'yellow' ? 'text-yellow-400' :
                              item.color === 'purple' ? 'text-purple-400' : 'text-blue-400'
                      }`} />
                  </div>
                  <h3 className="font-bold text-lg mb-1">{item.title}</h3>
                  <p className={`text-sm font-semibold mb-2 ${item.color === 'red' ? 'text-red-400' :
                      item.color === 'pink' ? 'text-pink-400' :
                        item.color === 'orange' ? 'text-orange-400' :
                          item.color === 'yellow' ? 'text-yellow-400' :
                            item.color === 'purple' ? 'text-purple-400' : 'text-blue-400'
                    }`}>{item.stat}</p>
                  <p className="text-white/60 text-sm">{item.desc}</p>
                </motion.div>
              ))}
            </motion.div>
          </div>
        </section>

        {/* PROTECTION STRUCTURE DIAGRAM */}
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
                The <span className="text-primary">Protection Fortress</span>
              </motion.h2>
              <motion.p variants={fadeInUp} className="text-white/60 max-w-2xl mx-auto">
                Multiple layers. Multiple shields. One goal: keep what's yours.
              </motion.p>
            </motion.div>

            <motion.div
              initial="hidden"
              whileInView="visible"
              viewport={{ once: true }}
              variants={scaleIn}
              className="relative"
            >
              {/* Fortress Visualization */}
              <div className="bg-white/5 border border-white/10 rounded-3xl p-8 md:p-12">

                {/* Center - YOU */}
                <div className="text-center mb-8">
                  <div className="inline-block bg-primary/20 border-2 border-primary rounded-full p-6 mb-4">
                    <span className="text-4xl">👤</span>
                  </div>
                  <p className="text-primary font-bold text-xl">YOUR ASSETS</p>
                  <p className="text-white/40 text-sm">Home • Savings • Investments • Business</p>
                </div>

                {/* Protection Layers */}
                <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-4">
                  {/* Layer 1: LLC */}
                  <div className="bg-gradient-to-b from-blue-500/20 to-transparent border border-blue-500/30 rounded-2xl p-5">
                    <div className="w-10 h-10 bg-blue-500/20 rounded-lg flex items-center justify-center mb-3">
                      <Building2 className="w-5 h-5 text-blue-400" />
                    </div>
                    <h4 className="font-bold text-blue-400 mb-2">LLC Shield</h4>
                    <ul className="text-sm text-white/60 space-y-1">
                      <li>• Separates business from personal</li>
                      <li>• Limits liability to LLC assets</li>
                      <li>• Protects personal wealth</li>
                    </ul>
                  </div>

                  {/* Layer 2: Trust */}
                  <div className="bg-gradient-to-b from-purple-500/20 to-transparent border border-purple-500/30 rounded-2xl p-5">
                    <div className="w-10 h-10 bg-purple-500/20 rounded-lg flex items-center justify-center mb-3">
                      <Landmark className="w-5 h-5 text-purple-400" />
                    </div>
                    <h4 className="font-bold text-purple-400 mb-2">Trust Protection</h4>
                    <ul className="text-sm text-white/60 space-y-1">
                      <li>• Assets owned by trust, not you</li>
                      <li>• Divorce protection</li>
                      <li>• Avoids probate</li>
                    </ul>
                  </div>

                  {/* Layer 3: Insurance */}
                  <div className="bg-gradient-to-b from-cyan-500/20 to-transparent border border-cyan-500/30 rounded-2xl p-5">
                    <div className="w-10 h-10 bg-cyan-500/20 rounded-lg flex items-center justify-center mb-3">
                      <Umbrella className="w-5 h-5 text-cyan-400" />
                    </div>
                    <h4 className="font-bold text-cyan-400 mb-2">Umbrella Insurance</h4>
                    <ul className="text-sm text-white/60 space-y-1">
                      <li>• $1-5M extra coverage</li>
                      <li>• Covers lawsuits</li>
                      <li>• ~$300/year for $1M</li>
                    </ul>
                  </div>

                  {/* Layer 4: Titling */}
                  <div className="bg-gradient-to-b from-emerald-500/20 to-transparent border border-emerald-500/30 rounded-2xl p-5">
                    <div className="w-10 h-10 bg-emerald-500/20 rounded-lg flex items-center justify-center mb-3">
                      <FileText className="w-5 h-5 text-emerald-400" />
                    </div>
                    <h4 className="font-bold text-emerald-400 mb-2">Proper Titling</h4>
                    <ul className="text-sm text-white/60 space-y-1">
                      <li>• Tenancy by entirety</li>
                      <li>• Homestead exemptions</li>
                      <li>• Beneficiary designations</li>
                    </ul>
                  </div>
                </div>

                {/* Bottom note */}
                <div className="mt-8 text-center">
                  <p className="text-white/60 bg-primary/10 border border-primary/20 rounded-xl p-4 inline-block">
                    💡 <span className="text-primary font-semibold">Key insight:</span> No single layer is enough. The wealthy use ALL of these working together.
                  </p>
                </div>
              </div>
            </motion.div>
          </div>
        </section>

        {/* DIVORCE PROTECTION SECTION */}
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
                <span className="text-primary">Divorce Protection</span> — The Uncomfortable Truth
              </motion.h2>
              <motion.p variants={fadeInUp} className="text-white/60 max-w-2xl mx-auto">
                Nobody plans to get divorced. Smart people plan anyway.
              </motion.p>
            </motion.div>

            <motion.div
              initial="hidden"
              whileInView="visible"
              viewport={{ once: true }}
              variants={staggerContainer}
              className="grid md:grid-cols-2 gap-8"
            >
              {/* Without Protection */}
              <motion.div
                variants={scaleIn}
                className="bg-gradient-to-b from-red-500/10 to-transparent border border-red-500/20 rounded-2xl p-6"
              >
                <div className="flex items-center gap-3 mb-6">
                  <div className="w-12 h-12 bg-red-500/20 rounded-xl flex items-center justify-center">
                    <HeartCrack className="w-6 h-6 text-red-400" />
                  </div>
                  <div>
                    <h3 className="font-bold text-lg">Without Protection</h3>
                    <p className="text-red-400 text-sm">The default outcome</p>
                  </div>
                </div>

                <div className="space-y-4">
                  <div className="bg-white/5 rounded-lg p-4">
                    <p className="text-white/40 text-xs mb-1">YOUR PRE-MARRIAGE ASSETS</p>
                    <p className="text-lg font-bold">$200,000</p>
                    <p className="text-red-400 text-sm">Commingled → now marital property</p>
                  </div>

                  <div className="bg-white/5 rounded-lg p-4">
                    <p className="text-white/40 text-xs mb-1">INHERITANCE DURING MARRIAGE</p>
                    <p className="text-lg font-bold">$150,000</p>
                    <p className="text-red-400 text-sm">Put in joint account → split 50/50</p>
                  </div>

                  <div className="bg-white/5 rounded-lg p-4">
                    <p className="text-white/40 text-xs mb-1">BUSINESS YOU BUILT</p>
                    <p className="text-lg font-bold">$500,000</p>
                    <p className="text-red-400 text-sm">No prenup → spouse gets half</p>
                  </div>

                  <div className="bg-red-500/20 border border-red-500/30 rounded-lg p-4">
                    <p className="text-white/40 text-xs mb-1">TOTAL LOST</p>
                    <p className="text-2xl font-bold text-red-400">$425,000</p>
                  </div>
                </div>
              </motion.div>

              {/* With Protection */}
              <motion.div
                variants={scaleIn}
                className="bg-gradient-to-b from-primary/20 to-transparent border border-primary/30 rounded-2xl p-6"
              >
                <div className="flex items-center gap-3 mb-6">
                  <div className="w-12 h-12 bg-primary/20 rounded-xl flex items-center justify-center">
                    <Heart className="w-6 h-6 text-primary" />
                  </div>
                  <div>
                    <h3 className="font-bold text-lg">With Protection</h3>
                    <p className="text-primary text-sm">Planned ahead</p>
                  </div>
                </div>

                <div className="space-y-4">
                  <div className="bg-white/5 rounded-lg p-4">
                    <p className="text-white/40 text-xs mb-1">YOUR PRE-MARRIAGE ASSETS</p>
                    <p className="text-lg font-bold">$200,000</p>
                    <p className="text-primary text-sm">In trust → separate property ✓</p>
                  </div>

                  <div className="bg-white/5 rounded-lg p-4">
                    <p className="text-white/40 text-xs mb-1">INHERITANCE DURING MARRIAGE</p>
                    <p className="text-lg font-bold">$150,000</p>
                    <p className="text-primary text-sm">Kept separate → yours alone ✓</p>
                  </div>

                  <div className="bg-white/5 rounded-lg p-4">
                    <p className="text-white/40 text-xs mb-1">BUSINESS YOU BUILT</p>
                    <p className="text-lg font-bold">$500,000</p>
                    <p className="text-primary text-sm">Prenup + LLC → protected ✓</p>
                  </div>

                  <div className="bg-primary/20 border border-primary/30 rounded-lg p-4">
                    <p className="text-white/40 text-xs mb-1">TOTAL PROTECTED</p>
                    <p className="text-2xl font-bold text-primary">$850,000</p>
                  </div>
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
                💡 <span className="text-white/80">Important:</span> These structures must be in place <span className="text-primary font-semibold">BEFORE</span> marriage or <span className="text-primary font-semibold">BEFORE</span> receiving assets. Timing is everything.
              </p>
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
                Asset Protection Myths <span className="text-red-400">Exposed</span>
              </motion.h2>
              <motion.p variants={fadeInUp} className="text-white/60 max-w-2xl mx-auto">
                Bad advice can cost you everything
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
                  myth: "Insurance is enough protection",
                  reality: "Insurance has limits. Judgments can exceed coverage. You need multiple layers."
                },
                {
                  myth: "I can set this up after I'm sued",
                  reality: "Fraudulent transfer laws exist. Protection MUST be established BEFORE any claim."
                },
                {
                  myth: "Putting assets in spouse's name protects them",
                  reality: "Now THEY can lose them in divorce or their own lawsuit. Bad strategy."
                },
                {
                  myth: "Retirement accounts are untouchable",
                  reality: "Protected from creditors in most states, but NOT from divorce or IRS."
                },
                {
                  myth: "I don't have enough to worry about",
                  reality: "If you have a home, car, or $50K+ in assets, you have enough to lose."
                },
                {
                  myth: "LLCs are only for businesses",
                  reality: "LLCs can hold rental properties, investments, and other assets for protection."
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
                Real Scenarios. <span className="text-primary">Real Protection.</span>
              </motion.h2>
              <motion.p variants={fadeInUp} className="text-white/60 max-w-2xl mx-auto">
                These stories play out every day. Which one are you?
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
                        <span className="text-2xl">👨‍⚕️</span>
                      </div>
                      <div>
                        <h3 className="font-bold">The Doctor</h3>
                        <p className="text-white/40 text-sm">High income, high risk</p>
                      </div>
                    </div>

                    <p className="text-white/70 mb-6 text-sm leading-relaxed">
                      Medical malpractice suits can exceed insurance. Personal assets were at risk.
                    </p>

                    <div className="space-y-3">
                      <div className="flex justify-between items-center bg-white/5 rounded-lg p-3">
                        <span className="text-white/60 text-sm">Asset Protection Trust</span>
                        <span className="text-primary">✓</span>
                      </div>
                      <div className="flex justify-between items-center bg-white/5 rounded-lg p-3">
                        <span className="text-white/60 text-sm">$2M Umbrella Policy</span>
                        <span className="text-primary">✓</span>
                      </div>
                      <div className="flex justify-between items-center bg-white/5 rounded-lg p-3">
                        <span className="text-white/60 text-sm">Home in spouse's trust</span>
                        <span className="text-primary">✓</span>
                      </div>
                    </div>

                    <div className="mt-6 pt-4 border-t border-white/10 text-center">
                      <p className="text-white/40 text-sm">Assets Protected</p>
                      <p className="text-primary font-bold text-2xl">$2.1M</p>
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
                        <span className="text-2xl">👩‍💼</span>
                      </div>
                      <div>
                        <h3 className="font-bold">The Business Owner</h3>
                        <p className="text-white/40 text-sm">Lisa, e-commerce entrepreneur</p>
                      </div>
                    </div>

                    <p className="text-white/70 mb-6 text-sm leading-relaxed">
                      Product liability suit threatened everything. Structure saved her personal assets.
                    </p>

                    <div className="space-y-3">
                      <div className="flex justify-between items-center bg-white/5 rounded-lg p-3">
                        <span className="text-white/60 text-sm">Business in LLC</span>
                        <span className="text-primary">✓</span>
                      </div>
                      <div className="flex justify-between items-center bg-white/5 rounded-lg p-3">
                        <span className="text-white/60 text-sm">Personal assets in trust</span>
                        <span className="text-primary">✓</span>
                      </div>
                      <div className="flex justify-between items-center bg-white/5 rounded-lg p-3">
                        <span className="text-white/60 text-sm">No personal guarantees</span>
                        <span className="text-primary">✓</span>
                      </div>
                    </div>

                    <div className="mt-6 pt-4 border-t border-white/10 text-center">
                      <p className="text-white/40 text-sm">Assets Protected</p>
                      <p className="text-primary font-bold text-2xl">$890K</p>
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
                        <span className="text-2xl">💑</span>
                      </div>
                      <div>
                        <h3 className="font-bold">The Second Marriage</h3>
                        <p className="text-white/40 text-sm">Mark, 48, bringing assets in</p>
                      </div>
                    </div>

                    <p className="text-white/70 mb-6 text-sm leading-relaxed">
                      Bringing $400K from first marriage. Wanted to protect it AND be fair to new spouse.
                    </p>

                    <div className="space-y-3">
                      <div className="flex justify-between items-center bg-white/5 rounded-lg p-3">
                        <span className="text-white/60 text-sm">Prenuptial agreement</span>
                        <span className="text-primary">✓</span>
                      </div>
                      <div className="flex justify-between items-center bg-white/5 rounded-lg p-3">
                        <span className="text-white/60 text-sm">Separate property trust</span>
                        <span className="text-primary">✓</span>
                      </div>
                      <div className="flex justify-between items-center bg-white/5 rounded-lg p-3">
                        <span className="text-white/60 text-sm">Clear asset documentation</span>
                        <span className="text-primary">✓</span>
                      </div>
                    </div>

                    <div className="mt-6 pt-4 border-t border-white/10 text-center">
                      <p className="text-white/40 text-sm">Assets Protected</p>
                      <p className="text-primary font-bold text-2xl">$400K+</p>
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
                Your Asset <span className="text-primary">Protection</span> Team
              </motion.h2>
              <motion.p variants={fadeInUp} className="text-white/60 max-w-2xl mx-auto">
                We build fortresses, not houses of cards.
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
                { icon: Eye, title: "Risk Assessment", desc: "Identify your vulnerabilities and exposure points" },
                { icon: Layers, title: "Structure Design", desc: "LLC, trust, and entity strategy customized for you" },
                { icon: Umbrella, title: "Insurance Review", desc: "Ensure adequate coverage and umbrella policies" },
                { icon: FileText, title: "Prenup/Postnup Guidance", desc: "Protect assets in marriage without awkwardness" },
                { icon: Landmark, title: "Trust Setup", desc: "Revocable and irrevocable trusts for different needs" },
                { icon: Shield, title: "Ongoing Protection", desc: "Annual reviews as laws and your life change" }
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
                  <div className="text-5xl mb-4">🛡️</div>
                  <h2 className="text-3xl md:text-4xl font-bold mb-4">
                    Build Your Fortress. Today.
                  </h2>
                  <p className="text-white/60 max-w-xl mx-auto mb-8">
                    Protection must be in place BEFORE you need it. Don't wait for the lawsuit, the divorce, or the creditor.
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
                      Book Protection Strategy Call
                    </button>
                  </div>

                  <p className="text-white/40 text-sm mt-6">
                    Free consultation. Confidential. No judgment.
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
            <p className="text-white/40 mb-4">Ready to protect what you've built?</p>
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
