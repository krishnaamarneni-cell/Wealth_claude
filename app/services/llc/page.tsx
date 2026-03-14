"use client";

import React, { useState } from "react";
import { motion } from "framer-motion";
import { BookCallModal } from "@/components/book-call-modal";
import {
  Building2,
  Shield,
  TrendingUp,
  DollarSign,
  CheckCircle,
  XCircle,
  AlertTriangle,
  ArrowRight,
  ChevronDown,
  ChevronUp,
  Briefcase,
  Home,
  Smartphone,
  Wifi,
  Laptop,
  GraduationCap,
  Plane,
  Heart,
  Users,
  FileText,
  CreditCard,
  HelpCircle,
  Zap,
  Lock,
  Eye,
  EyeOff
} from "lucide-react";
import Link from "next/link";
import { Header } from "@/components/header";

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
    q: "Do I need a business to start an LLC?",
    a: "No! You can start an LLC with a side hustle, freelancing, rental property, or even investment activities. Many W2 employees create LLCs for their part-time work or future business plans."
  },
  {
    q: "How much does it cost to form an LLC?",
    a: "State filing fees range from $50-$500 depending on your state. Some states like Kentucky are $40, while California is $70. We handle all the paperwork for you."
  },
  {
    q: "Can I keep my W2 job and have an LLC?",
    a: "Absolutely! This is the \"best of both worlds\" approach. Keep your salary, benefits, and 401K match while building your LLC on the side. Just check your employment contract for any non-compete clauses."
  },
  {
    q: "What can I write off with an LLC?",
    a: "Home office space, phone, internet, computer, software, business education, travel, meals with clients, health insurance (potentially), and much more. The key is these must be legitimate business expenses."
  },
  {
    q: "Is this legal?",
    a: "100% legal. LLCs are a standard business structure recognized in all 50 states. Tax deductions for business expenses are written into the tax code. We're not finding loopholes — we're using the rules as designed."
  },
  {
    q: "What if I don't make much money yet?",
    a: "That's actually the perfect time to start. Forming an LLC now means you're protected from day one, and you can start tracking expenses immediately. Plus, startup costs and losses can offset future income."
  }
];

export default function LLCServicePage() {
  const [openFaq, setOpenFaq] = useState<number | null>(null);
  const [isBookCallOpen, setIsBookCallOpen] = useState(false);
  const [showSimulation, setShowSimulation] = useState(false);

  return (
    <div className="min-h-screen bg-[#0a0f18] text-white overflow-x-hidden">
      <Header />

      <main>
        {/* HERO SECTION */}
        <section className="relative pt-32 pb-20 px-4 overflow-hidden">
          {/* Background Effects */}
          <div className="absolute inset-0 bg-gradient-to-b from-primary/5 via-transparent to-transparent" />
          <div className="absolute top-20 left-1/4 w-96 h-96 bg-primary/10 rounded-full blur-3xl" />
          <div className="absolute bottom-0 right-1/4 w-80 h-80 bg-emerald-500/5 rounded-full blur-3xl" />

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
                You're Playing a Game
                <br />
                <span className="text-primary">You Don't Know the Rules To</span>
              </motion.h1>

              <motion.p
                variants={fadeInUp}
                className="text-xl text-white/60 max-w-3xl mx-auto mb-8"
              >
                There are 3 types of people. Most are stuck in Column A — not knowing Column C even exists.
              </motion.p>


            </motion.div>

            {/* THREE PATHS COMPARISON */}
            <motion.div
              initial="hidden"
              animate="visible"
              variants={staggerContainer}
              className="grid md:grid-cols-3 gap-6"
            >
              {/* W2 EMPLOYEE */}
              <motion.div
                variants={scaleIn}
                className="relative bg-gradient-to-b from-red-500/10 to-transparent border border-red-500/20 rounded-2xl p-6 overflow-hidden"
              >
                <div className="absolute top-0 right-0 w-32 h-32 bg-red-500/10 rounded-full blur-2xl" />

                <div className="relative">
                  <div className="flex items-center gap-3 mb-4">
                    <div className="w-12 h-12 bg-red-500/20 rounded-xl flex items-center justify-center">
                      <Users className="w-6 h-6 text-red-400" />
                    </div>
                    <div>
                      <h3 className="font-bold text-lg">W2 Employee</h3>
                      <p className="text-red-400 text-sm">The Matrix</p>
                    </div>
                  </div>

                  <div className="space-y-3 mb-6">
                    <div className="bg-white/5 rounded-lg p-3">
                      <p className="text-white/40 text-xs mb-1">EARN</p>
                      <p className="text-xl font-bold">$100,000</p>
                    </div>

                    <div className="flex justify-center">
                      <ArrowRight className="w-5 h-5 text-white/20 rotate-90" />
                    </div>

                    <div className="bg-red-500/10 border border-red-500/20 rounded-lg p-3">
                      <p className="text-red-400 text-xs mb-1">TAXES FIRST</p>
                      <p className="text-xl font-bold text-red-400">-$28,000</p>
                    </div>

                    <div className="flex justify-center">
                      <ArrowRight className="w-5 h-5 text-white/20 rotate-90" />
                    </div>

                    <div className="bg-white/5 rounded-lg p-3">
                      <p className="text-white/40 text-xs mb-1">PAY BILLS</p>
                      <p className="text-xl font-bold">-$25,000</p>
                    </div>

                    <div className="flex justify-center">
                      <ArrowRight className="w-5 h-5 text-white/20 rotate-90" />
                    </div>

                    <div className="bg-red-500/10 border border-red-500/20 rounded-lg p-3">
                      <p className="text-white/40 text-xs mb-1">LEFT OVER</p>
                      <p className="text-2xl font-bold">$47,000</p>
                    </div>
                  </div>

                  <div className="space-y-2 border-t border-white/10 pt-4">
                    <div className="flex items-center gap-2 text-sm text-red-400">
                      <XCircle className="w-4 h-4" />
                      <span>No protection</span>
                    </div>
                    <div className="flex items-center gap-2 text-sm text-red-400">
                      <XCircle className="w-4 h-4" />
                      <span>Maximum taxes</span>
                    </div>
                    <div className="flex items-center gap-2 text-sm text-red-400">
                      <XCircle className="w-4 h-4" />
                      <span>No write-offs</span>
                    </div>
                    <div className="flex items-center gap-2 text-sm text-red-400">
                      <XCircle className="w-4 h-4" />
                      <span>Trading time for money</span>
                    </div>
                  </div>

                  <div className="mt-6 text-center">
                    <span className="text-3xl">😰</span>
                    <p className="text-white/40 text-sm mt-2">Most People</p>
                  </div>
                </div>
              </motion.div>

              {/* LLC OWNER */}
              <motion.div
                variants={scaleIn}
                className="relative bg-gradient-to-b from-yellow-500/10 to-transparent border border-yellow-500/20 rounded-2xl p-6 overflow-hidden"
              >
                <div className="absolute top-0 right-0 w-32 h-32 bg-yellow-500/10 rounded-full blur-2xl" />

                <div className="relative">
                  <div className="flex items-center gap-3 mb-4">
                    <div className="w-12 h-12 bg-yellow-500/20 rounded-xl flex items-center justify-center">
                      <Building2 className="w-6 h-6 text-yellow-400" />
                    </div>
                    <div>
                      <h3 className="font-bold text-lg">LLC Owner</h3>
                      <p className="text-yellow-400 text-sm">Business Only</p>
                    </div>
                  </div>

                  <div className="space-y-3 mb-6">
                    <div className="bg-white/5 rounded-lg p-3">
                      <p className="text-white/40 text-xs mb-1">EARN</p>
                      <p className="text-xl font-bold">$100,000</p>
                    </div>

                    <div className="flex justify-center">
                      <ArrowRight className="w-5 h-5 text-white/20 rotate-90" />
                    </div>

                    <div className="bg-yellow-500/10 border border-yellow-500/20 rounded-lg p-3">
                      <p className="text-yellow-400 text-xs mb-1">EXPENSES FIRST</p>
                      <p className="text-xl font-bold text-yellow-400">-$25,000</p>
                      <p className="text-xs text-white/40">Write-offs</p>
                    </div>

                    <div className="flex justify-center">
                      <ArrowRight className="w-5 h-5 text-white/20 rotate-90" />
                    </div>

                    <div className="bg-white/5 rounded-lg p-3">
                      <p className="text-white/40 text-xs mb-1">TAXABLE INCOME</p>
                      <p className="text-xl font-bold">$75,000</p>
                    </div>

                    <div className="flex justify-center">
                      <ArrowRight className="w-5 h-5 text-white/20 rotate-90" />
                    </div>

                    <div className="bg-yellow-500/10 border border-yellow-500/20 rounded-lg p-3">
                      <p className="text-white/40 text-xs mb-1">LEFT OVER</p>
                      <p className="text-2xl font-bold">$56,250</p>
                    </div>
                  </div>

                  <div className="space-y-2 border-t border-white/10 pt-4">
                    <div className="flex items-center gap-2 text-sm text-primary">
                      <CheckCircle className="w-4 h-4" />
                      <span>Tax advantages</span>
                    </div>
                    <div className="flex items-center gap-2 text-sm text-primary">
                      <CheckCircle className="w-4 h-4" />
                      <span>Building equity</span>
                    </div>
                    <div className="flex items-center gap-2 text-sm text-yellow-400">
                      <AlertTriangle className="w-4 h-4" />
                      <span>No job stability</span>
                    </div>
                    <div className="flex items-center gap-2 text-sm text-yellow-400">
                      <AlertTriangle className="w-4 h-4" />
                      <span>No benefits</span>
                    </div>
                  </div>

                  <div className="mt-6 text-center">
                    <span className="text-3xl">😐</span>
                    <p className="text-white/40 text-sm mt-2">Entrepreneurs</p>
                  </div>
                </div>
              </motion.div>

              {/* W2 + LLC (BEST) */}
              <motion.div
                variants={scaleIn}
                className="relative bg-gradient-to-b from-primary/20 to-transparent border-2 border-primary/40 rounded-2xl p-6 overflow-hidden"
              >
                {/* Glow effect */}
                <div className="absolute top-0 right-0 w-32 h-32 bg-primary/20 rounded-full blur-2xl" />


                <div className="relative">
                  <div className="flex items-center gap-3 mb-4">
                    <div className="w-12 h-12 bg-primary/20 rounded-xl flex items-center justify-center">
                      <Zap className="w-6 h-6 text-primary" />
                    </div>
                    <div>
                      <h3 className="font-bold text-lg">W2 + LLC Owner</h3>
                      <p className="text-primary text-sm">Best of Both</p>
                    </div>
                  </div>

                  <div className="space-y-3 mb-6">
                    <div className="bg-white/5 rounded-lg p-3">
                      <div className="flex justify-between items-center">
                        <div>
                          <p className="text-white/40 text-xs mb-1">W2 SALARY</p>
                          <p className="text-lg font-bold">$80,000</p>
                        </div>
                        <div className="text-right">
                          <p className="text-white/40 text-xs mb-1">SIDE LLC</p>
                          <p className="text-lg font-bold text-primary">+$20,000</p>
                        </div>
                      </div>
                    </div>

                    <div className="flex justify-center">
                      <ArrowRight className="w-5 h-5 text-white/20 rotate-90" />
                    </div>

                    <div className="bg-primary/10 border border-primary/20 rounded-lg p-3">
                      <p className="text-primary text-xs mb-1">LLC WRITE-OFFS</p>
                      <p className="text-xl font-bold text-primary">-$12,000</p>
                      <p className="text-xs text-white/40">Home office, phone, internet...</p>
                    </div>

                    <div className="flex justify-center">
                      <ArrowRight className="w-5 h-5 text-white/20 rotate-90" />
                    </div>

                    <div className="bg-white/5 rounded-lg p-3">
                      <p className="text-white/40 text-xs mb-1">LLC TAXABLE</p>
                      <p className="text-xl font-bold">Only $8,000</p>
                    </div>

                    <div className="flex justify-center">
                      <ArrowRight className="w-5 h-5 text-white/20 rotate-90" />
                    </div>

                    <div className="bg-primary/20 border border-primary/30 rounded-lg p-3">
                      <p className="text-white/40 text-xs mb-1">LEFT OVER</p>
                      <p className="text-2xl font-bold text-primary">$54,000+</p>
                      <p className="text-xs text-primary">+ Benefits + 401K</p>
                    </div>
                  </div>

                  <div className="space-y-2 border-t border-white/10 pt-4">
                    <div className="flex items-center gap-2 text-sm text-primary">
                      <CheckCircle className="w-4 h-4" />
                      <span>Job security + benefits</span>
                    </div>
                    <div className="flex items-center gap-2 text-sm text-primary">
                      <CheckCircle className="w-4 h-4" />
                      <span>Tax savings</span>
                    </div>
                    <div className="flex items-center gap-2 text-sm text-primary">
                      <CheckCircle className="w-4 h-4" />
                      <span>Asset protection</span>
                    </div>
                    <div className="flex items-center gap-2 text-sm text-primary">
                      <CheckCircle className="w-4 h-4" />
                      <span>Multiple income streams</span>
                    </div>
                  </div>

                  <div className="mt-6 text-center">
                    <span className="text-3xl">🤑</span>
                    <p className="text-primary text-sm mt-2 font-medium">Smart Employees</p>
                  </div>
                </div>
              </motion.div>
            </motion.div>

            {/* Key Message */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.5 }}
              className="mt-12 text-center"
            >
              <div className="inline-block bg-white/5 border border-white/10 rounded-2xl p-6 max-w-2xl">
                <p className="text-lg text-white/80 leading-relaxed">
                  <span className="text-primary font-semibold">You don't have to quit your job</span> to get LLC benefits.
                  Keep your salary, health insurance, and 401K match — while building a side LLC that protects your assets and saves you thousands in taxes.
                </p>
                <p className="text-white/50 mt-4 text-sm">
                  This is the path nobody teaches in school.
                </p>
              </div>
            </motion.div>
          </div>
        </section>

        {/* THE SIMULATION SECTION */}
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
                The Lies You've Been Told
              </motion.h2>
              <motion.p variants={fadeInUp} className="text-white/60 max-w-2xl mx-auto">
                Breaking out of the simulation starts with seeing it for what it is
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
                  myth: "LLCs are only for business owners",
                  reality: "Anyone with side income, investments, or rental property can benefit"
                },
                {
                  myth: "I need a lot of money to start",
                  reality: "An LLC costs $50-500 to form depending on state"
                },
                {
                  myth: "It's too complicated for me",
                  reality: "It's a one-time 30 minute process with proper guidance"
                },
                {
                  myth: "I'll do it when I make more money",
                  reality: "That's exactly why you're not making more money"
                },
                {
                  myth: "My job is stable, I don't need protection",
                  reality: "One lawsuit can take everything you've built"
                },
                {
                  myth: "Rich people stuff, not for me",
                  reality: "This is HOW people become rich"
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
                What NOT Having an LLC <span className="text-red-400">Costs You</span>
              </motion.h2>
              <motion.p variants={fadeInUp} className="text-white/60 max-w-2xl mx-auto">
                The most expensive thing you own is the knowledge you don't have
              </motion.p>
            </motion.div>

            <motion.div
              initial="hidden"
              whileInView="visible"
              viewport={{ once: true }}
              variants={scaleIn}
              className="relative"
            >
              {/* Money Drain Visual */}
              <div className="bg-gradient-to-b from-red-500/10 to-transparent border border-red-500/20 rounded-3xl p-8 md:p-12">
                <div className="text-center mb-8">
                  <p className="text-white/40 text-sm uppercase tracking-widest mb-2">Every Year Without an LLC</p>
                  <div className="text-5xl">💸</div>
                </div>

                <div className="grid md:grid-cols-2 gap-6 mb-8">
                  {[
                    { icon: DollarSign, amount: "$3,000 - $8,000", label: "Overpaid in taxes" },
                    { icon: Shield, amount: "$0", label: "Protection from lawsuits" },
                    { icon: Lock, amount: "100%", label: "Personal assets exposed" },
                    { icon: CreditCard, amount: "$0", label: "Business credit building" }
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
                    <p className="text-white/40 text-sm uppercase tracking-widest mb-2">Over 10 Years</p>
                    <p className="text-4xl md:text-5xl font-bold text-red-400">$30,000 - $80,000</p>
                    <p className="text-white/60 mt-2">Lost to the system</p>
                  </div>
                </div>

                <div className="mt-8 text-center">
                  <p className="text-white/60 italic text-lg">
                    "The most expensive thing you own is the knowledge you don't have."
                  </p>
                </div>
              </div>
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
                This Could Be <span className="text-primary">You</span>
              </motion.h2>
              <motion.p variants={fadeInUp} className="text-white/60 max-w-2xl mx-auto">
                Real scenarios that happen every day
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
                  <div className="h-2 bg-gradient-to-r from-purple-500 to-pink-500" />
                  <div className="p-6">
                    <div className="flex items-center gap-3 mb-4">
                      <div className="w-12 h-12 bg-purple-500/20 rounded-full flex items-center justify-center">
                        <span className="text-2xl">👩‍💻</span>
                      </div>
                      <div>
                        <h3 className="font-bold">The Side Hustler</h3>
                        <p className="text-white/40 text-sm">Sarah, Etsy Seller</p>
                      </div>
                    </div>

                    <p className="text-white/70 mb-6 text-sm leading-relaxed">
                      Sarah makes $15,000/year selling crafts on Etsy alongside her day job.
                    </p>

                    <div className="space-y-4">
                      <div className="bg-red-500/10 border border-red-500/20 rounded-lg p-3">
                        <p className="text-red-400 text-xs font-medium mb-1">❌ Without LLC</p>
                        <p className="text-white/80 text-sm">Pays full self-employment tax (15.3%) on ALL income</p>
                      </div>
                      <div className="bg-primary/10 border border-primary/20 rounded-lg p-3">
                        <p className="text-primary text-xs font-medium mb-1">✅ With LLC (S-Corp)</p>
                        <p className="text-white/80 text-sm">Saves $2,200/year in taxes</p>
                      </div>
                    </div>

                    <div className="mt-6 pt-4 border-t border-white/10">
                      <p className="text-primary font-bold text-xl">5 Years = $11,000 Saved</p>
                    </div>
                  </div>
                </div>
              </motion.div>

              {/* Scenario 2 */}
              <motion.div variants={fadeInUp} className="group">
                <div className="bg-white/5 border border-white/10 rounded-2xl overflow-hidden hover:border-primary/30 transition-colors">
                  <div className="h-2 bg-gradient-to-r from-blue-500 to-cyan-500" />
                  <div className="p-6">
                    <div className="flex items-center gap-3 mb-4">
                      <div className="w-12 h-12 bg-blue-500/20 rounded-full flex items-center justify-center">
                        <span className="text-2xl">🏠</span>
                      </div>
                      <div>
                        <h3 className="font-bold">The Investor</h3>
                        <p className="text-white/40 text-sm">Mike, Property Owner</p>
                      </div>
                    </div>

                    <p className="text-white/70 mb-6 text-sm leading-relaxed">
                      Mike bought a rental property in his personal name to build wealth.
                    </p>

                    <div className="space-y-4">
                      <div className="bg-red-500/10 border border-red-500/20 rounded-lg p-3">
                        <p className="text-red-400 text-xs font-medium mb-1">❌ Without LLC</p>
                        <p className="text-white/80 text-sm">Tenant slipped on ice, sued. Mike's personal savings, car, and home ALL at risk.</p>
                      </div>
                      <div className="bg-primary/10 border border-primary/20 rounded-lg p-3">
                        <p className="text-primary text-xs font-medium mb-1">✅ With LLC</p>
                        <p className="text-white/80 text-sm">Only the rental property is exposed. Personal assets protected.</p>
                      </div>
                    </div>

                    <div className="mt-6 pt-4 border-t border-white/10">
                      <p className="text-primary font-bold text-xl">Protected = Priceless</p>
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
                        <span className="text-2xl">💼</span>
                      </div>
                      <div>
                        <h3 className="font-bold">The W2 + Freelancer</h3>
                        <p className="text-white/40 text-sm">James, Consultant</p>
                      </div>
                    </div>

                    <p className="text-white/70 mb-6 text-sm leading-relaxed">
                      James works full-time and does consulting on the side ($20K/year).
                    </p>

                    <div className="space-y-4">
                      <div className="bg-red-500/10 border border-red-500/20 rounded-lg p-3">
                        <p className="text-red-400 text-xs font-medium mb-1">❌ Without LLC</p>
                        <p className="text-white/80 text-sm">Pays full 15.3% self-employment tax. $20K taxable income.</p>
                      </div>
                      <div className="bg-primary/10 border border-primary/20 rounded-lg p-3">
                        <p className="text-primary text-xs font-medium mb-1">✅ With LLC</p>
                        <p className="text-white/80 text-sm">Writes off home office, internet, phone, laptop. Taxable: only $12K</p>
                      </div>
                    </div>

                    <div className="mt-6 pt-4 border-t border-white/10">
                      <p className="text-primary font-bold text-xl">$8,000 Tax-Free</p>
                    </div>
                  </div>
                </div>
              </motion.div>
            </motion.div>
          </div>
        </section>

        {/* HOW IT WORKS SECTION */}
        <section className="py-20 px-4">
          <div className="max-w-4xl mx-auto">
            <motion.div
              initial="hidden"
              whileInView="visible"
              viewport={{ once: true }}
              variants={staggerContainer}
              className="text-center mb-16"
            >
              <motion.h2 variants={fadeInUp} className="text-3xl md:text-4xl font-bold mb-4">
                How It Actually <span className="text-primary">Works</span>
              </motion.h2>
              <motion.p variants={fadeInUp} className="text-white/60 max-w-2xl mx-auto">
                5 simple steps to start keeping more of your money
              </motion.p>
            </motion.div>

            <motion.div
              initial="hidden"
              whileInView="visible"
              viewport={{ once: true }}
              variants={staggerContainer}
              className="relative"
            >
              {/* Vertical line */}
              <div className="absolute left-8 md:left-1/2 top-0 bottom-0 w-0.5 bg-gradient-to-b from-primary via-primary/50 to-transparent" />

              {[
                {
                  step: 1,
                  title: "Form Your LLC",
                  desc: "One-time setup: $50-500 depending on state",
                  icon: Building2
                },
                {
                  step: 2,
                  title: "Open Business Bank Account",
                  desc: "Free at most banks. Separates personal & business",
                  icon: CreditCard
                },
                {
                  step: 3,
                  title: "Run Income Through LLC",
                  desc: "Your side income flows into the business",
                  icon: TrendingUp
                },
                {
                  step: 4,
                  title: "Deduct Legitimate Expenses",
                  desc: "Home office, phone, internet, equipment, education",
                  icon: FileText
                },
                {
                  step: 5,
                  title: "Pay Taxes on What's Left",
                  desc: "Not everything you earned — only the profit",
                  icon: DollarSign
                }
              ].map((item, index) => (
                <motion.div
                  key={index}
                  variants={fadeInUp}
                  className={`relative flex items-center gap-6 mb-8 ${index % 2 === 0 ? 'md:flex-row' : 'md:flex-row-reverse'}`}
                >
                  <div className={`flex-1 ${index % 2 === 0 ? 'md:text-right' : 'md:text-left'} hidden md:block`}>
                    <div className={`inline-block bg-white/5 border border-white/10 rounded-xl p-4 ${index % 2 === 0 ? 'mr-8' : 'ml-8'}`}>
                      <h3 className="font-bold text-lg mb-1">{item.title}</h3>
                      <p className="text-white/60 text-sm">{item.desc}</p>
                    </div>
                  </div>

                  {/* Circle */}
                  <div className="relative z-10 flex-shrink-0">
                    <div className="w-16 h-16 bg-primary/20 border-2 border-primary rounded-full flex items-center justify-center">
                      <item.icon className="w-7 h-7 text-primary" />
                    </div>
                    <div className="absolute -top-2 -right-2 w-6 h-6 bg-primary rounded-full flex items-center justify-center text-xs font-bold">
                      {item.step}
                    </div>
                  </div>

                  {/* Mobile view */}
                  <div className="flex-1 md:hidden">
                    <h3 className="font-bold text-lg mb-1">{item.title}</h3>
                    <p className="text-white/60 text-sm">{item.desc}</p>
                  </div>

                  <div className="flex-1 hidden md:block" />
                </motion.div>
              ))}
            </motion.div>
          </div>
        </section>

        {/* WRITE-OFFS SECTION */}
        <section className="py-20 px-4 bg-gradient-to-b from-transparent via-primary/5 to-transparent">
          <div className="max-w-5xl mx-auto">
            <motion.div
              initial="hidden"
              whileInView="visible"
              viewport={{ once: true }}
              variants={staggerContainer}
              className="text-center mb-16"
            >
              <motion.h2 variants={fadeInUp} className="text-3xl md:text-4xl font-bold mb-4">
                Expenses You're <span className="text-primary">Already Paying</span>
              </motion.h2>
              <motion.p variants={fadeInUp} className="text-white/60 max-w-2xl mx-auto">
                These could be tax-free with an LLC
              </motion.p>
            </motion.div>

            <motion.div
              initial="hidden"
              whileInView="visible"
              viewport={{ once: true }}
              variants={staggerContainer}
              className="grid md:grid-cols-2 gap-4"
            >
              {[
                { icon: Home, name: "Home Office", amount: "$6,000/year", desc: "Portion of rent/mortgage" },
                { icon: Smartphone, name: "Phone Bill", amount: "$1,200/year", desc: "Business usage percentage" },
                { icon: Wifi, name: "Internet", amount: "$1,000/year", desc: "Business usage percentage" },
                { icon: Laptop, name: "Computer & Equipment", amount: "$1,500", desc: "Fully deductible" },
                { icon: GraduationCap, name: "Business Education", amount: "$2,000/year", desc: "Courses, books, coaching" },
                { icon: Plane, name: "Business Travel", amount: "$3,000/year", desc: "Flights, hotels, meals" },
                { icon: FileText, name: "Software & Tools", amount: "$500/year", desc: "Subscriptions, apps" },
                { icon: Heart, name: "Health Insurance", amount: "$5,000/year", desc: "Potentially deductible" }
              ].map((item, index) => (
                <motion.div
                  key={index}
                  variants={fadeInUp}
                  className="flex items-center gap-4 bg-white/5 border border-white/10 rounded-xl p-4 hover:border-primary/30 transition-colors"
                >
                  <div className="w-12 h-12 bg-primary/20 rounded-xl flex items-center justify-center flex-shrink-0">
                    <item.icon className="w-6 h-6 text-primary" />
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center justify-between">
                      <h3 className="font-bold">{item.name}</h3>
                      <span className="text-primary font-bold">{item.amount}</span>
                    </div>
                    <p className="text-white/50 text-sm">{item.desc}</p>
                  </div>
                  <CheckCircle className="w-5 h-5 text-primary flex-shrink-0" />
                </motion.div>
              ))}
            </motion.div>

            {/* Total */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              className="mt-8 bg-gradient-to-r from-primary/20 to-emerald-500/20 border border-primary/30 rounded-2xl p-6 text-center"
            >
              <p className="text-white/60 text-sm mb-2">POTENTIAL ANNUAL DEDUCTIONS</p>
              <p className="text-4xl font-bold text-primary mb-2">$10,000+</p>
              <p className="text-white/60">
                At 25% tax bracket = <span className="text-primary font-bold">$2,500 back in your pocket</span>
              </p>
            </motion.div>
          </div>
        </section>

        {/* WAKE UP CALL SECTION */}
        <section className="py-20 px-4">
          <div className="max-w-4xl mx-auto">
            <motion.div
              initial="hidden"
              whileInView="visible"
              viewport={{ once: true }}
              variants={staggerContainer}
              className="text-center mb-12"
            >
              <motion.h2 variants={fadeInUp} className="text-3xl md:text-4xl font-bold mb-4">
                Why Doesn't Everyone <span className="text-primary">Know This?</span>
              </motion.h2>
            </motion.div>

            <motion.div
              initial="hidden"
              whileInView="visible"
              viewport={{ once: true }}
              variants={scaleIn}
              className="relative"
            >
              <div className="grid md:grid-cols-2 gap-8">
                {/* Left - The System */}
                <div className="bg-gradient-to-b from-red-500/10 to-transparent border border-red-500/20 rounded-2xl p-6">
                  <h3 className="text-xl font-bold mb-6 text-red-400">🏫 Schools Teach You To:</h3>
                  <div className="space-y-4">
                    {[
                      "Get a job",
                      "Pay taxes first",
                      "Buy things you can't afford",
                      "Stay in debt",
                      "Retire at 65 (maybe)"
                    ].map((item, index) => (
                      <div key={index} className="flex items-center gap-3">
                        <CheckCircle className="w-5 h-5 text-red-400 flex-shrink-0" />
                        <span className="text-white/70">{item}</span>
                      </div>
                    ))}
                  </div>
                  <div className="mt-6 pt-4 border-t border-red-500/20 text-center">
                    <p className="text-red-400 font-medium">The Employee Playbook</p>
                  </div>
                </div>

                {/* Right - The Other Path */}
                <div className="bg-gradient-to-b from-primary/10 to-transparent border border-primary/20 rounded-2xl p-6">
                  <h3 className="text-xl font-bold mb-6 text-primary">🎓 Wealthy People Learn To:</h3>
                  <div className="space-y-4">
                    {[
                      "Build businesses & assets",
                      "Spend (write-off) first",
                      "Pay taxes last",
                      "Use debt strategically",
                      "Retire whenever they want"
                    ].map((item, index) => (
                      <div key={index} className="flex items-center gap-3">
                        <CheckCircle className="w-5 h-5 text-primary flex-shrink-0" />
                        <span className="text-white/70">{item}</span>
                      </div>
                    ))}
                  </div>
                  <div className="mt-6 pt-4 border-t border-primary/20 text-center">
                    <p className="text-primary font-medium">The Owner Playbook</p>
                  </div>
                </div>
              </div>

              <div className="mt-8 text-center">
                <p className="text-xl text-white/80">
                  <span className="text-primary font-bold">Same money.</span> Different rules.
                </p>
                <p className="text-white/50 mt-2">Now you know there's a choice.</p>
              </div>
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
                We Handle <span className="text-primary">Everything</span>
              </motion.h2>
              <motion.p variants={fadeInUp} className="text-white/60 max-w-2xl mx-auto">
                From formation to optimization, we've got you covered
              </motion.p>
            </motion.div>

            <motion.div
              initial="hidden"
              whileInView="visible"
              viewport={{ once: true }}
              variants={staggerContainer}
              className="grid md:grid-cols-3 gap-6"
            >
              {[
                { icon: FileText, title: "State LLC Filing", desc: "We handle all the paperwork and filing" },
                { icon: FileText, title: "Operating Agreement", desc: "Legal document protecting your business" },
                { icon: Building2, title: "EIN Registration", desc: "Your business's Social Security number" },
                { icon: CreditCard, title: "Banking Setup", desc: "Guidance on opening business accounts" },
                { icon: DollarSign, title: "Tax Strategy", desc: "Consultation on maximizing deductions" },
                { icon: Shield, title: "Liability Review", desc: "Ensuring your assets are protected" }
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
                  <div className="text-5xl mb-4">🚀</div>
                  <h2 className="text-3xl md:text-4xl font-bold mb-4">
                    Stop Leaving Money on the Table
                  </h2>
                  <p className="text-white/60 max-w-xl mx-auto mb-8">
                    Take the first step. See how much an LLC could save YOU.
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
                      Book Free Strategy Call
                    </button>
                  </div>

                  <p className="text-white/40 text-sm mt-6">
                    No obligation. Just clarity on your financial path.
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
                Questions? <span className="text-primary">Answered.</span>
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
            <p className="text-white/40 mb-4">Ready to break out of the simulation?</p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link
                href="/fire-score"
                className="inline-flex items-center justify-center gap-2 text-primary hover:text-white transition-colors"
              >
                Take FIRE Score Test
                <ArrowRight className="w-4 h-4" />
              </Link>
              <span className="text-white/20 hidden sm:inline">|</span>
              <Link
                href="/book"
                className="inline-flex items-center justify-center gap-2 text-white/60 hover:text-white transition-colors"
              >
                Book Strategy Call
                <ArrowRight className="w-4 h-4" />
              </Link>
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
