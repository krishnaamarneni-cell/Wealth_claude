// =============================================================================
// Assessment CTA Widget - Landing Page Component
// Use on homepage to drive users to take the assessment
// =============================================================================

'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { 
  ArrowRight, 
  Clock, 
  Target, 
  TrendingUp, 
  Shield,
  CheckCircle,
  Sparkles,
  ChevronRight
} from 'lucide-react';

// =============================================================================
// Main CTA Section - Hero Style
// =============================================================================

export function AssessmentHero() {
  return (
    <section className="relative overflow-hidden bg-gradient-to-br from-emerald-600 via-emerald-700 to-teal-800 py-20 lg:py-28">
      {/* Background Pattern */}
      <div className="absolute inset-0 opacity-10">
        <svg className="w-full h-full" xmlns="http://www.w3.org/2000/svg">
          <defs>
            <pattern id="grid" width="40" height="40" patternUnits="userSpaceOnUse">
              <path d="M 40 0 L 0 0 0 40" fill="none" stroke="white" strokeWidth="1"/>
            </pattern>
          </defs>
          <rect width="100%" height="100%" fill="url(#grid)" />
        </svg>
      </div>

      {/* Floating Elements */}
      <div className="absolute top-20 left-10 w-20 h-20 bg-white/10 rounded-full blur-xl" />
      <div className="absolute bottom-20 right-10 w-32 h-32 bg-emerald-400/20 rounded-full blur-2xl" />

      <div className="relative max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid lg:grid-cols-2 gap-12 items-center">
          {/* Left Content */}
          <div className="text-white">
            <div className="inline-flex items-center gap-2 bg-white/10 backdrop-blur-sm rounded-full px-4 py-2 mb-6">
              <Sparkles className="w-4 h-4 text-emerald-300" />
              <span className="text-sm font-medium">Free Financial Assessment</span>
            </div>

            <h1 className="text-4xl lg:text-5xl font-bold leading-tight mb-6">
              Discover Your{' '}
              <span className="text-emerald-300">Financial Health</span>{' '}
              Score
            </h1>

            <p className="text-lg text-emerald-100 mb-8 leading-relaxed">
              Take our comprehensive 10-minute assessment and get a personalized 
              action plan to achieve your financial goals. No signup required to start.
            </p>

            {/* Benefits */}
            <div className="space-y-3 mb-8">
              {[
                'Personalized score across 10 key factors',
                'Compare yourself to others your age',
                'Get a custom action plan in PDF format'
              ].map((benefit, i) => (
                <div key={i} className="flex items-center gap-3">
                  <CheckCircle className="w-5 h-5 text-emerald-300 flex-shrink-0" />
                  <span className="text-emerald-50">{benefit}</span>
                </div>
              ))}
            </div>

            {/* CTA Buttons */}
            <div className="flex flex-col sm:flex-row gap-4">
              <Link
                href="/assessment"
                className="inline-flex items-center justify-center gap-2 bg-white text-emerald-700 px-8 py-4 rounded-xl font-semibold text-lg hover:bg-emerald-50 transition-colors shadow-lg shadow-emerald-900/20"
              >
                Start Free Assessment
                <ArrowRight className="w-5 h-5" />
              </Link>
              <Link
                href="#how-it-works"
                className="inline-flex items-center justify-center gap-2 bg-white/10 backdrop-blur-sm text-white px-6 py-4 rounded-xl font-medium hover:bg-white/20 transition-colors"
              >
                See How It Works
              </Link>
            </div>

            {/* Trust Badge */}
            <p className="mt-6 text-sm text-emerald-200 flex items-center gap-2">
              <Shield className="w-4 h-4" />
              Your data is encrypted and never sold
            </p>
          </div>

          {/* Right - Preview Card */}
          <div className="relative">
            <div className="bg-white rounded-2xl shadow-2xl p-6 transform lg:rotate-2 hover:rotate-0 transition-transform duration-300">
              {/* Score Preview */}
              <div className="text-center mb-6">
                <div className="inline-flex items-center justify-center w-32 h-32 rounded-full bg-gradient-to-br from-emerald-100 to-emerald-50 mb-4">
                  <span className="text-5xl font-bold text-emerald-600">72</span>
                </div>
                <h3 className="text-xl font-semibold text-gray-900">Your Score</h3>
                <p className="text-gray-500">Top 38% of users</p>
              </div>

              {/* Mini Factor Bars */}
              <div className="space-y-3">
                {[
                  { name: 'Savings', score: 78, color: 'bg-emerald-500' },
                  { name: 'Debt', score: 55, color: 'bg-amber-500' },
                  { name: 'Planning', score: 82, color: 'bg-emerald-500' },
                  { name: 'Investing', score: 68, color: 'bg-emerald-400' },
                ].map((factor) => (
                  <div key={factor.name} className="flex items-center gap-3">
                    <span className="w-20 text-sm text-gray-600">{factor.name}</span>
                    <div className="flex-1 h-2 bg-gray-100 rounded-full overflow-hidden">
                      <div 
                        className={`h-full rounded-full ${factor.color}`}
                        style={{ width: `${factor.score}%` }}
                      />
                    </div>
                    <span className="w-8 text-sm font-medium text-gray-700">{factor.score}</span>
                  </div>
                ))}
              </div>

              {/* Sample Badge */}
              <div className="mt-4 text-center">
                <span className="text-xs text-gray-400 bg-gray-100 px-3 py-1 rounded-full">
                  Sample Result
                </span>
              </div>
            </div>

            {/* Decorative Elements */}
            <div className="absolute -bottom-4 -left-4 w-24 h-24 bg-emerald-400/30 rounded-xl blur-xl" />
            <div className="absolute -top-4 -right-4 w-16 h-16 bg-teal-400/30 rounded-full blur-lg" />
          </div>
        </div>
      </div>
    </section>
  );
}

// =============================================================================
// Compact CTA Card - For Sidebar or Section
// =============================================================================

export function AssessmentCard() {
  return (
    <div className="bg-gradient-to-br from-emerald-600 to-teal-700 rounded-2xl p-6 text-white">
      <div className="flex items-center gap-2 mb-4">
        <Target className="w-6 h-6 text-emerald-300" />
        <span className="font-semibold">Financial Assessment</span>
      </div>

      <h3 className="text-xl font-bold mb-2">
        Know Your Financial Health Score
      </h3>
      
      <p className="text-emerald-100 text-sm mb-4">
        10 minutes to understand where you stand and how to improve.
      </p>

      <div className="flex items-center gap-4 mb-4 text-sm text-emerald-200">
        <div className="flex items-center gap-1">
          <Clock className="w-4 h-4" />
          <span>10 min</span>
        </div>
        <div className="flex items-center gap-1">
          <CheckCircle className="w-4 h-4" />
          <span>Free</span>
        </div>
      </div>

      <Link
        href="/assessment"
        className="flex items-center justify-center gap-2 w-full bg-white text-emerald-700 py-3 rounded-xl font-semibold hover:bg-emerald-50 transition-colors"
      >
        Take Assessment
        <ArrowRight className="w-4 h-4" />
      </Link>
    </div>
  );
}

// =============================================================================
// Inline CTA Banner - For Mid-Page
// =============================================================================

export function AssessmentBanner() {
  return (
    <div className="bg-emerald-50 border border-emerald-100 rounded-xl p-6 flex flex-col md:flex-row items-center justify-between gap-4">
      <div className="flex items-center gap-4">
        <div className="w-12 h-12 bg-emerald-100 rounded-xl flex items-center justify-center">
          <TrendingUp className="w-6 h-6 text-emerald-600" />
        </div>
        <div>
          <h3 className="font-semibold text-gray-900">
            Ready to improve your finances?
          </h3>
          <p className="text-sm text-gray-600">
            Get your personalized financial health score in 10 minutes.
          </p>
        </div>
      </div>

      <Link
        href="/assessment"
        className="flex items-center gap-2 bg-emerald-600 text-white px-6 py-3 rounded-xl font-semibold hover:bg-emerald-700 transition-colors whitespace-nowrap"
      >
        Start Free Assessment
        <ChevronRight className="w-4 h-4" />
      </Link>
    </div>
  );
}

// =============================================================================
// Floating CTA Button - Fixed Position
// =============================================================================

export function AssessmentFloatingButton() {
  const [isVisible, setIsVisible] = useState(true);

  if (!isVisible) return null;

  return (
    <div className="fixed bottom-6 right-6 z-50">
      <div className="relative">
        {/* Close Button */}
        <button
          onClick={() => setIsVisible(false)}
          className="absolute -top-2 -right-2 w-6 h-6 bg-gray-800 text-white rounded-full text-xs flex items-center justify-center hover:bg-gray-700"
        >
          ✕
        </button>

        <Link
          href="/assessment"
          className="flex items-center gap-3 bg-emerald-600 text-white pl-4 pr-6 py-3 rounded-full shadow-lg hover:bg-emerald-700 transition-all hover:scale-105"
        >
          <div className="w-8 h-8 bg-white/20 rounded-full flex items-center justify-center">
            <Target className="w-4 h-4" />
          </div>
          <div className="text-left">
            <div className="text-sm font-semibold">Take Assessment</div>
            <div className="text-xs text-emerald-200">Free • 10 min</div>
          </div>
        </Link>
      </div>
    </div>
  );
}

// =============================================================================
// How It Works Section
// =============================================================================

export function HowItWorksSection() {
  const steps = [
    {
      number: '01',
      title: 'Answer Questions',
      description: 'Complete our 52-question assessment covering savings, debt, planning, and more.',
      icon: '📝',
      time: '10 min'
    },
    {
      number: '02',
      title: 'Get Your Score',
      description: 'Receive scores across 10 financial factors with market comparisons.',
      icon: '📊',
      time: 'Instant'
    },
    {
      number: '03',
      title: 'Choose Your Path',
      description: 'Pick between Safe & Steady or Fast & Aggressive based on your goals.',
      icon: '🎯',
      time: '2 min'
    },
    {
      number: '04',
      title: 'Download Your Plan',
      description: 'Get a detailed 10-page PDF report with monthly milestones.',
      icon: '📄',
      time: 'Instant'
    }
  ];

  return (
    <section id="how-it-works" className="py-20 bg-white">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-16">
          <h2 className="text-3xl lg:text-4xl font-bold text-gray-900 mb-4">
            How It Works
          </h2>
          <p className="text-lg text-gray-600 max-w-2xl mx-auto">
            Four simple steps to understand your finances and get a personalized action plan.
          </p>
        </div>

        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
          {steps.map((step, index) => (
            <div key={step.number} className="relative">
              {/* Connector Line */}
              {index < steps.length - 1 && (
                <div className="hidden lg:block absolute top-12 left-full w-full h-0.5 bg-emerald-100 -translate-x-1/2" />
              )}

              <div className="bg-gray-50 rounded-2xl p-6 hover:bg-emerald-50 transition-colors h-full">
                {/* Step Number */}
                <div className="flex items-center justify-between mb-4">
                  <span className="text-4xl">{step.icon}</span>
                  <span className="text-xs font-medium text-emerald-600 bg-emerald-100 px-2 py-1 rounded-full">
                    {step.time}
                  </span>
                </div>

                <div className="text-sm font-bold text-emerald-600 mb-2">
                  Step {step.number}
                </div>

                <h3 className="text-lg font-semibold text-gray-900 mb-2">
                  {step.title}
                </h3>

                <p className="text-sm text-gray-600">
                  {step.description}
                </p>
              </div>
            </div>
          ))}
        </div>

        {/* CTA */}
        <div className="text-center mt-12">
          <Link
            href="/assessment"
            className="inline-flex items-center gap-2 bg-emerald-600 text-white px-8 py-4 rounded-xl font-semibold text-lg hover:bg-emerald-700 transition-colors"
          >
            Start Your Assessment
            <ArrowRight className="w-5 h-5" />
          </Link>
        </div>
      </div>
    </section>
  );
}

// =============================================================================
// Testimonial/Stats Section
// =============================================================================

export function AssessmentStats() {
  const stats = [
    { value: '10,000+', label: 'Assessments Completed' },
    { value: '67', label: 'Average Score' },
    { value: '4.8/5', label: 'User Rating' },
    { value: '10 min', label: 'Average Time' }
  ];

  return (
    <section className="py-16 bg-gray-900">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-8">
          {stats.map((stat) => (
            <div key={stat.label} className="text-center">
              <div className="text-3xl lg:text-4xl font-bold text-emerald-400 mb-2">
                {stat.value}
              </div>
              <div className="text-sm text-gray-400">
                {stat.label}
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

// =============================================================================
// Export All Components
// =============================================================================

export default {
  AssessmentHero,
  AssessmentCard,
  AssessmentBanner,
  AssessmentFloatingButton,
  HowItWorksSection,
  AssessmentStats
};
