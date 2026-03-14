"use client";

import React, { useState } from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import { Header } from "@/components/header";
import {
  Building2,
  FileText,
  PiggyBank,
  TrendingUp,
  Shield,
  Briefcase,
  Users,
  ArrowRight,
  Check,
  X,
  ChevronDown,
  Star,
  Zap,
  Target,
  Clock,
  DollarSign,
} from "lucide-react";

// Animation variants
const fadeInUp = {
  hidden: { opacity: 0, y: 30 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.6, ease: "easeOut" } },
};

const staggerContainer = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: { staggerChildren: 0.1, delayChildren: 0.2 },
  },
};

const scaleIn = {
  hidden: { opacity: 0, scale: 0.9 },
  visible: { opacity: 1, scale: 1, transition: { duration: 0.5 } },
};

// Services data
const services = [
  {
    icon: Building2,
    title: "LLC Formation",
    description: "Protect your assets and optimize taxes with proper business structure",
    features: ["State filing", "Operating agreement", "EIN registration", "Banking setup guidance"],
    href: "/llc",
  },
  {
    icon: FileText,
    title: "Tax Strategy",
    description: "Stop overpaying. Implement strategies the wealthy use every day",
    features: ["Tax-loss harvesting", "Entity optimization", "Quarterly planning", "Audit protection"],
    href: "/tax-strategy",
  },
  {
    icon: PiggyBank,
    title: "Debt Elimination",
    description: "Strategic payoff plan to free up cash for wealth building",
    features: ["Debt analysis", "Payoff strategy", "Rate negotiation tips", "Progress tracking"],
    href: "/debt-elimination",
  },
  {
    icon: TrendingUp,
    title: "Investment Planning",
    description: "Build a diversified portfolio aligned with your FIRE goals",
    features: ["Risk assessment", "Asset allocation", "401k optimization", "Roth strategies"],
    href: "/investment-planning",
  },
  {
    icon: Shield,
    title: "Asset Protection",
    description: "Shield your wealth from lawsuits, creditors, and life surprises",
    features: ["Trust setup", "Insurance review", "Umbrella policies", "Estate planning basics"],
    href: "/asset-protection",
  },
  {
    icon: Briefcase,
    title: "Income Diversification",
    description: "Build multiple streams so you're never dependent on one paycheck",
    features: ["Income analysis", "Side business ideas", "Passive income setup", "Dividend strategy"],
    href: "/income-diversification",
  },
];

// Reviews data
const reviews = [
  {
    name: "Marcus T.",
    role: "Software Engineer",
    score: "47 → 78",
    text: "I was stuck in the 'figure it out myself' zone for 8 years. One consultation showed me I was leaving $12k/year on the table in taxes alone.",
    avatar: "MT",
  },
  {
    name: "Priya S.",
    role: "Marketing Director",
    score: "32 → 61",
    text: "The FIRE Score opened my eyes. I had no idea how behind I was. Now I have a clear roadmap and I'm actually making progress.",
    avatar: "PS",
  },
  {
    name: "James L.",
    role: "Small Business Owner",
    score: "55 → 84",
    text: "LLC setup + tax strategy = $18k saved in year one. The service paid for itself 30x over. Why did I wait so long?",
    avatar: "JL",
  },
];

export default function ServicesPage() {
  const [expandedService, setExpandedService] = useState<number | null>(null);

  return (
    <>
      <Header />
      <div className="min-h-screen bg-[#0a0f18] text-white overflow-hidden">
      {/* Hero Section */}
      <section className="relative pt-20 pb-16 px-4">
        <div className="absolute inset-0 bg-gradient-to-b from-primary/5 via-transparent to-transparent" />
        <div className="max-w-6xl mx-auto text-center relative z-10">
          <motion.div
            initial="hidden"
            animate="visible"
            variants={fadeInUp}
            className="mb-6"
          >
            <span className="inline-block px-4 py-2 rounded-full bg-primary/10 border border-primary/20 text-primary text-sm font-medium mb-6">
              The Wealth Gap Is Real — Let's Close It
            </span>
          </motion.div>

          <motion.h1
            initial="hidden"
            animate="visible"
            variants={fadeInUp}
            className="text-4xl md:text-6xl font-bold mb-6 leading-tight"
          >
            Stop Guessing.{" "}
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-primary to-emerald-400">
              Start Building.
            </span>
          </motion.h1>

          <motion.p
            initial="hidden"
            animate="visible"
            variants={fadeInUp}
            className="text-xl text-white/60 max-w-3xl mx-auto mb-8"
          >
            The wealthy don't have secrets. They just have the right team.
            <br />
            <span className="text-white/80">It's time you did too.</span>
          </motion.p>

          <motion.div
            initial="hidden"
            animate="visible"
            variants={fadeInUp}
            className="flex flex-col sm:flex-row gap-4 justify-center"
          >
            <a
              href="/fire-score"
              className="inline-flex items-center justify-center gap-2 px-8 py-4 bg-primary hover:bg-primary/90 text-black font-semibold rounded-xl transition-all hover:scale-105 hover:shadow-lg hover:shadow-primary/25"
            >
              <Target className="w-5 h-5" />
              Take Free FIRE Score Test
            </a>
            <a
              href="#services"
              className="inline-flex items-center justify-center gap-2 px-8 py-4 bg-white/5 hover:bg-white/10 border border-white/10 rounded-xl transition-all"
            >
              View Services
              <ChevronDown className="w-5 h-5" />
            </a>
          </motion.div>
        </div>
      </section>

        {/* Wealth Gap Comparison Section */}
        <section className="py-16 px-4 relative">
          <div className="absolute inset-0 bg-gradient-to-b from-transparent via-red-500/5 to-transparent" />
          <div className="max-w-6xl mx-auto relative z-10">
            <motion.div
              initial="hidden"
              whileInView="visible"
              viewport={{ once: true }}
              variants={fadeInUp}
              className="text-center mb-12"
            >
              <h2 className="text-3xl md:text-4xl font-bold mb-4">
                Why 90% Stay Stuck Forever
              </h2>
              <p className="text-white/60 text-lg">
                The difference isn't income — it's strategy
              </p>
            </motion.div>

          {/* Comparison Grid */}
          <motion.div
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
            variants={staggerContainer}
            className="grid md:grid-cols-2 gap-8 mb-12"
          >
            {/* Retail Column */}
            <motion.div variants={scaleIn} className="space-y-4">
                <div className="flex items-center gap-3 mb-6">
                  <div className="w-12 h-12 rounded-full bg-red-500/20 flex items-center justify-center">
                    <X className="w-6 h-6 text-red-500" />
                  </div>
                  <div>
                    <h3 className="text-xl font-bold text-red-400">RETAIL</h3>
                    <p className="text-white/50 text-sm">The Stuck Zone</p>
                  </div>
                </div>

                <div className="space-y-3">
                  {[
                    { label: "Who They Hire", value: "TurboTax, \"I'll figure it out myself\"" },
                    { label: "How They Spend", value: "$500 watch, $1,200 phone upgrade, $300 sneakers" },
                    { label: "What They Ignore", value: "Tax optimization, Asset protection, Estate planning" },
                    { label: "The Mindset", value: "\"I can't afford an advisor\"" },
                  ].map((item, i) => (
                    <div key={i} className="bg-red-500/5 border border-red-500/20 rounded-xl p-4">
                      <p className="text-red-400 text-xs font-semibold uppercase tracking-wider mb-1">
                        {item.label}
                      </p>
                      <p className="text-white/80">{item.value}</p>
                    </div>
                  ))}
                  <div className="bg-red-500/10 border border-red-500/30 rounded-xl p-6 text-center">
                    <p className="text-3xl font-bold text-red-400 mb-2">Stuck for 10+ years</p>
                    <p className="text-white/50">Same job, same debt, same stress</p>
                  </div>
                </div>
              </motion.div>

            {/* Wealthy Column */}
            <motion.div variants={scaleIn} className="space-y-4">
                <div className="flex items-center gap-3 mb-6">
                  <div className="w-12 h-12 rounded-full bg-primary/20 flex items-center justify-center">
                    <Check className="w-6 h-6 text-primary" />
                  </div>
                  <div>
                    <h3 className="text-xl font-bold text-primary">WEALTHY</h3>
                    <p className="text-white/50 text-sm">The Growth Zone</p>
                  </div>
                </div>

                <div className="space-y-3">
                  {[
                    { label: "Who They Hire", value: "CPA + CFA + Attorney + Advisor" },
                    { label: "How They Spend", value: "$500 tax course, $1,200 CPA, $300 wealth advisor" },
                    { label: "What They Prioritize", value: "Tax optimization, Asset protection, Estate planning" },
                    { label: "The Mindset", value: "\"I can't afford NOT to have one\"" },
                  ].map((item, i) => (
                    <div key={i} className="bg-primary/5 border border-primary/20 rounded-xl p-4">
                      <p className="text-primary text-xs font-semibold uppercase tracking-wider mb-1">
                        {item.label}
                      </p>
                      <p className="text-white/80">{item.value}</p>
                    </div>
                  ))}
                  <div className="bg-primary/10 border border-primary/30 rounded-xl p-6 text-center">
                    <p className="text-3xl font-bold text-primary mb-2">FIRE in 5-7 years</p>
                    <p className="text-white/50">Multiple income streams, tax-optimized, protected</p>
                  </div>
                </div>
              </motion.div>
            </motion.div>

            {/* The Math Box */}
            <motion.div
              initial="hidden"
              whileInView="visible"
              viewport={{ once: true }}
              variants={fadeInUp}
              className="bg-white/5 border border-white/10 rounded-2xl p-8"
            >
              <h3 className="text-center text-xl font-bold mb-6">
                THE MATH THEY DON'T TEACH YOU
              </h3>
              <div className="grid md:grid-cols-2 gap-8">
                <div className="text-center">
                  <p className="text-white/60 mb-2">Retail: Pays $8K+ extra taxes/year</p>
                  <p className="text-2xl font-bold text-red-400">10 years = $80,000 lost</p>
                </div>
                <div className="text-center">
                  <p className="text-white/60 mb-2">Wealthy: Pays $2K for CPA, saves $8K</p>
                  <p className="text-2xl font-bold text-primary">10 years = $60,000 gained</p>
                </div>
              </div>
              <p className="text-center text-white/40 mt-6 text-sm">
                The difference: <span className="text-white font-semibold">$140,000</span> over a decade
              </p>
            </motion.div>
          </div>
        </section>

        {/* Wealth Pyramid Section */}
        <section className="py-16 px-4 relative">
          <div className="max-w-4xl mx-auto">
            <motion.div
              initial="hidden"
              whileInView="visible"
              viewport={{ once: true }}
              variants={fadeInUp}
              className="text-center mb-12"
            >
              <h2 className="text-3xl md:text-4xl font-bold mb-4">
                The Wealth Pyramid
              </h2>
              <p className="text-white/60 text-lg">Where are you?</p>
            </motion.div>

            {/* Pyramid Visualization */}
            <motion.div
              initial="hidden"
              whileInView="visible"
              viewport={{ once: true }}
              variants={scaleIn}
              className="relative mb-12"
            >
              {/* Pyramid Levels */}
              <div className="flex flex-col items-center space-y-2">
                {/* Top 1% */}
                <div className="w-[15%] h-16 bg-gradient-to-r from-primary to-emerald-400 rounded-t-lg flex items-center justify-center relative group">
                  <span className="text-xs font-bold text-black">TOP 1%</span>
                  <div className="absolute -right-48 top-1/2 -translate-y-1/2 hidden md:block text-right">
                    <p className="text-xs text-white/60">CPA + CFA + Attorney</p>
                    <p className="text-xs text-white/60">Trust + Estate plan</p>
                  </div>
                </div>

                {/* Optimizing 5% */}
                <div className="w-[30%] h-14 bg-emerald-500/80 flex items-center justify-center">
                  <span className="text-xs font-semibold">OPTIMIZING (5%)</span>
                </div>

                {/* Growing 14% */}
                <div className="w-[45%] h-14 bg-amber-500/80 flex items-center justify-center">
                  <span className="text-xs font-semibold text-black">GROWING (14%)</span>
                </div>

                {/* THE STUCK ZONE */}
                <div className="w-[65%] h-24 bg-gradient-to-b from-red-500 to-red-600 flex flex-col items-center justify-center relative border-2 border-red-400">
                  <span className="text-lg font-bold">THE STUCK ZONE</span>
                  <span className="text-sm">60% of people</span>
                  <span className="text-xs text-white/80">HERE FOR 10-20 YEARS</span>

                  {/* Escape Arrow */}
                  <div className="absolute -right-32 top-0 hidden md:flex items-center gap-2">
                    <ArrowRight className="w-8 h-8 text-primary animate-pulse" />
                    <div>
                      <p className="text-primary font-bold text-sm">ESCAPE</p>
                      <p className="text-primary/70 text-xs">with help</p>
                    </div>
                  </div>
                </div>

                {/* Starting 20% */}
                <div className="w-[80%] h-14 bg-gray-600/80 rounded-b-lg flex items-center justify-center">
              <span className="text-xs font-semibold">STARTING (20%)</span>
              </div>
            </div>
            </motion.div>

            {/* Mindset Comparison */}
            <motion.div
              initial="hidden"
              whileInView="visible"
              viewport={{ once: true }}
              variants={staggerContainer}
              className="grid md:grid-cols-2 gap-6"
            >
              <motion.div
                variants={scaleIn}
                className="bg-red-500/5 border border-red-500/20 rounded-xl p-6"
              >
                <h4 className="text-lg font-bold text-red-400 mb-4 flex items-center gap-2">
                  <span className="text-2xl">😰</span> STUCK ZONE MINDSET
                </h4>
                <ul className="space-y-2 text-white/70">
                  <li>"I'll start investing next year"</li>
                  <li>"I can't afford a CPA"</li>
                  <li>"Taxes are too complicated"</li>
                  <li>"I'll figure it out later"</li>
                  <li>"Rich people got lucky"</li>
                </ul>
              <p className="text-red-400/60 text-sm mt-4 italic">→ Stays stuck for decades</p>
            </motion.div>

            <motion.div
              variants={scaleIn}
              className="bg-primary/5 border border-primary/20 rounded-xl p-6"
            >
                <h4 className="text-lg font-bold text-primary mb-4 flex items-center gap-2">
                  <span className="text-2xl">🚀</span> GROWTH ZONE MINDSET
                </h4>
                <ul className="space-y-2 text-white/70">
                  <li>"I'm starting today"</li>
                  <li>"A CPA will PAY for itself"</li>
                  <li>"I need to learn tax strategy"</li>
                  <li>"Time is money — act now"</li>
                  <li>"Rich people have systems"</li>
                </ul>
              <p className="text-primary/60 text-sm mt-4 italic">→ Escapes in 5-7 years</p>
            </motion.div>
            </motion.div>

            {/* CTA */}
            <motion.div
              initial="hidden"
              whileInView="visible"
              viewport={{ once: true }}
              variants={fadeInUp}
              className="text-center mt-10"
            >
              <p className="text-xl font-semibold mb-4">
                Which zone are you in? Find out in 2 minutes.
              </p>
              <a
                href="/fire-score"
                className="inline-flex items-center gap-2 px-8 py-4 bg-primary hover:bg-primary/90 text-black font-semibold rounded-xl transition-all hover:scale-105"
              >
                <Zap className="w-5 h-5" />
                Take the FIRE Score Test
              <ArrowRight className="w-5 h-5" />
            </a>
            </motion.div>
          </div>
        </section>

        {/* Services Grid Section */}
        <section id="services" className="py-16 px-4 bg-white/[0.02]">
          <div className="max-w-6xl mx-auto">
            <motion.div
              initial="hidden"
              whileInView="visible"
              viewport={{ once: true }}
              variants={fadeInUp}
              className="text-center mb-12"
            >
              <h2 className="text-3xl md:text-4xl font-bold mb-4">
                Your Escape Route
              </h2>
              <p className="text-white/60 text-lg max-w-2xl mx-auto">
                The wealthy spend money to understand money. Here's how we help you do the same.
              </p>
            </motion.div>

            <motion.div
              initial="hidden"
              whileInView="visible"
              viewport={{ once: true }}
              variants={staggerContainer}
              className="grid md:grid-cols-2 lg:grid-cols-3 gap-6"
            >
              {services.map((service, index) => (
                <motion.div
                  key={index}
                  variants={scaleIn}
                  className="group relative bg-white/5 border border-white/10 rounded-2xl p-6 hover:border-primary/50 transition-all duration-300 hover:bg-white/[0.08]"
                >
                <div className="mb-4">
                    <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center group-hover:bg-primary/20 transition-colors">
                      <service.icon className="w-6 h-6 text-primary" />
                    </div>
                  </div>

                  <h3 className="text-xl font-bold mb-2">{service.title}</h3>
                  <p className="text-white/60 text-sm mb-4">{service.description}</p>

                  <ul className="space-y-2">
                    {service.features.map((feature, i) => (
                      <li key={i} className="flex items-center gap-2 text-sm text-white/70">
                        <Check className="w-4 h-4 text-primary flex-shrink-0" />
                        {feature}
                      </li>
                    ))}
                  </ul>

                  <Link href={service.href}>
                    <button className="mt-6 w-full py-3 bg-white/5 hover:bg-primary hover:text-black border border-white/10 hover:border-primary rounded-xl font-medium transition-all flex items-center justify-center gap-2">
                      Learn More
                      <ArrowRight className="w-4 h-4" />
                    </button>
                  </Link>
              </motion.div>
            ))}
            </motion.div>
          </div>
        </section>

        {/* Free App Bonus Section */}
        <section className="py-16 px-4 relative overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-r from-primary/10 via-transparent to-primary/10" />
          <div className="max-w-4xl mx-auto relative z-10">
            <motion.div
              initial="hidden"
              whileInView="visible"
              viewport={{ once: true }}
              variants={fadeInUp}
              className="bg-gradient-to-br from-primary/20 to-primary/5 border border-primary/30 rounded-3xl p-8 md:p-12 text-center"
            >
              <div className="inline-flex items-center gap-2 px-4 py-2 bg-primary/20 rounded-full text-primary text-sm font-medium mb-6">
                <Star className="w-4 h-4" />
                INCLUDED FREE WITH ANY SERVICE
              </div>

              <h2 className="text-3xl md:text-4xl font-bold mb-4">
                Get Lifetime Access to WealthClaude
              </h2>

              <p className="text-white/60 text-lg mb-8 max-w-2xl mx-auto">
                Track all your assets, debts, and goals in one place. Watch your FIRE Score update in real-time. Most apps charge $50-200/month for this — you get it <span className="text-primary font-semibold">FREE</span>.
              </p>

              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
                {["Stocks", "Real Estate", "Gold/Crypto", "FIRE Score"].map((item, i) => (
                  <div key={i} className="bg-white/5 rounded-xl p-4">
                    <p className="text-white/80 font-medium">{item}</p>
                  </div>
                ))}
              </div>

              <a
                href="/fire-score"
                className="inline-flex items-center gap-2 px-8 py-4 bg-primary hover:bg-primary/90 text-black font-semibold rounded-xl transition-all hover:scale-105"
              >
                Start Your Journey
              <ArrowRight className="w-5 h-5" />
            </a>
            </motion.div>
          </div>
        </section>

        {/* Reviews Section */}
        <section className="py-16 px-4">
          <div className="max-w-6xl mx-auto">
            <motion.div
              initial="hidden"
              whileInView="visible"
              viewport={{ once: true }}
              variants={fadeInUp}
              className="text-center mb-12"
            >
              <h2 className="text-3xl md:text-4xl font-bold mb-4">
                From Stuck to Unstoppable
              </h2>
              <p className="text-white/60 text-lg">Real people. Real transformations.</p>
            </motion.div>

            <motion.div
              initial="hidden"
              whileInView="visible"
              viewport={{ once: true }}
              variants={staggerContainer}
              className="grid md:grid-cols-3 gap-6"
            >
              {reviews.map((review, index) => (
                <motion.div
                  key={index}
                  variants={scaleIn}
                  className="bg-white/5 border border-white/10 rounded-2xl p-6"
                >
                  <div className="flex items-center gap-4 mb-4">
                    <div className="w-12 h-12 rounded-full bg-primary/20 flex items-center justify-center text-primary font-bold">
                      {review.avatar}
                    </div>
                    <div>
                      <p className="font-semibold">{review.name}</p>
                      <p className="text-white/50 text-sm">{review.role}</p>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 mb-4">
                    <span className="text-sm text-white/50">FIRE Score:</span>
                    <span className="px-3 py-1 bg-primary/20 rounded-full text-primary text-sm font-semibold">
                      {review.score}
                    </span>
                  </div>

                  <p className="text-white/70 italic">"{review.text}"</p>

                  <div className="flex gap-1 mt-4">
                    {[...Array(5)].map((_, i) => (
                      <Star key={i} className="w-4 h-4 fill-primary text-primary" />
                    ))}
                  </div>
                </motion.div>
              ))}
            </motion.div>
          </div>
        </section>

        {/* Final CTA Section */}
        <section className="py-20 px-4 relative">
          <div className="absolute inset-0 bg-gradient-to-t from-primary/10 via-transparent to-transparent" />
          <div className="max-w-3xl mx-auto text-center relative z-10">
            <motion.div
              initial="hidden"
              whileInView="visible"
              viewport={{ once: true }}
              variants={scaleIn}
              className="relative mb-12"
            >
              <h2 className="text-3xl md:text-5xl font-bold mb-6">
                Ready to Escape the Stuck Zone?
              </h2>
              <p className="text-xl text-white/60 mb-8">
                Take the free 2-minute FIRE Score test. See exactly where you stand — and get your personalized roadmap out.
              </p>

              <div className="flex flex-col sm:flex-row gap-4 justify-center">
                <a
                  href="/fire-score"
                  className="inline-flex items-center justify-center gap-2 px-8 py-4 bg-primary hover:bg-primary/90 text-black font-semibold rounded-xl transition-all hover:scale-105 hover:shadow-lg hover:shadow-primary/25"
                >
                  <Target className="w-5 h-5" />
                  Take the FIRE Score Test
                  <ArrowRight className="w-5 h-5" />
                </a>
              </div>

              <p className="text-white/40 text-sm mt-6">
                No credit card required • Takes 2 minutes • Get instant results
              </p>
            </motion.div>
          </div>
        </section>

        {/* Footer Quote */}
        <div className="py-8 px-4 border-t border-white/5">
          <p className="text-center text-white/40 text-sm max-w-2xl mx-auto">
            "The wealthy don't have secrets. They just have the right team." — WealthClaude
          </p>
        </div>
      </div>
    </>
  );
}
