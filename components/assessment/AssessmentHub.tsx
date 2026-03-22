'use client';

import React, { useState } from 'react';
import { 
  Brain, 
  BarChart3, 
  TrendingUp, 
  Heart,
  Clock,
  CheckCircle2,
  ArrowRight,
  Sparkles,
  Target,
  Shield
} from 'lucide-react';

// Types
interface TestInfo {
  id: string;
  name: string;
  description: string;
  icon: React.ReactNode;
  duration: string;
  questions: number;
  isRequired: boolean;
  isCompleted: boolean;
}

interface AssessmentHubProps {
  onStartAssessment: (mode: 'quick' | 'full') => void;
  completedTests?: string[];
}

export default function AssessmentHub({ 
  onStartAssessment, 
  completedTests = [] 
}: AssessmentHubProps) {
  const [selectedMode, setSelectedMode] = useState<'quick' | 'full'>('full');

  const tests: TestInfo[] = [
    {
      id: 'financial_personality',
      name: 'Financial Personality',
      description: 'Discover your money personality type',
      icon: <Brain className="w-6 h-6" />,
      duration: '4 min',
      questions: 15,
      isRequired: true,
      isCompleted: completedTests.includes('financial_personality')
    },
    {
      id: 'financial_health',
      name: 'Financial Health Check',
      description: 'Analyze your current financial situation',
      icon: <BarChart3 className="w-6 h-6" />,
      duration: '5 min',
      questions: 15,
      isRequired: true,
      isCompleted: completedTests.includes('financial_health')
    },
    {
      id: 'investment_profile',
      name: 'Investment Profile',
      description: 'Assess your investment knowledge & risk',
      icon: <TrendingUp className="w-6 h-6" />,
      duration: '3 min',
      questions: 12,
      isRequired: false,
      isCompleted: completedTests.includes('investment_profile')
    },
    {
      id: 'money_mindset',
      name: 'Money Mindset',
      description: 'Explore your emotional relationship with money',
      icon: <Heart className="w-6 h-6" />,
      duration: '2 min',
      questions: 10,
      isRequired: false,
      isCompleted: completedTests.includes('money_mindset')
    }
  ];

  const requiredTests = tests.filter(t => t.isRequired);
  const optionalTests = tests.filter(t => !t.isRequired);

  const quickModeTime = requiredTests.reduce((sum, t) => sum + parseInt(t.duration), 0);
  const fullModeTime = tests.reduce((sum, t) => sum + parseInt(t.duration), 0);

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 dark:from-slate-900 dark:to-slate-800">
      {/* Hero Section */}
      <div className="relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-r from-emerald-500/10 to-blue-500/10" />
        <div className="max-w-6xl mx-auto px-6 py-16 relative">
          <div className="text-center mb-12">
            <div className="inline-flex items-center gap-2 px-4 py-2 bg-emerald-100 dark:bg-emerald-900/30 rounded-full text-emerald-700 dark:text-emerald-300 text-sm font-medium mb-6">
              <Sparkles className="w-4 h-4" />
              Complete Financial Assessment
            </div>
            <h1 className="text-4xl md:text-5xl font-bold text-slate-900 dark:text-white mb-4">
              Your Financial Health
              <span className="text-emerald-600"> Checkup</span>
            </h1>
            <p className="text-xl text-slate-600 dark:text-slate-300 max-w-2xl mx-auto">
              Like a doctor's visit for your money. Get your financial diagnosis, 
              personalized benchmarks, and a clear action plan.
            </p>
          </div>

          {/* What You'll Get */}
          <div className="grid md:grid-cols-3 gap-6 mb-12">
            <FeatureCard 
              icon={<Target className="w-8 h-8 text-emerald-600" />}
              title="10 Factor Analysis"
              description="Deep dive into savings, debt, investments, and more"
            />
            <FeatureCard 
              icon={<BarChart3 className="w-8 h-8 text-blue-600" />}
              title="Market Comparison"
              description="See how you rank vs your age group & income bracket"
            />
            <FeatureCard 
              icon={<Shield className="w-8 h-8 text-purple-600" />}
              title="Two-Path Plan"
              description="Choose Safe & Steady or Fast & Aggressive path"
            />
          </div>
        </div>
      </div>

      {/* Assessment Mode Selection */}
      <div className="max-w-6xl mx-auto px-6 py-12">
        <h2 className="text-2xl font-bold text-slate-900 dark:text-white mb-6 text-center">
          Choose Your Assessment Mode
        </h2>

        <div className="grid md:grid-cols-2 gap-6 mb-12">
          {/* Quick Mode */}
          <ModeCard
            title="Quick Assessment"
            duration={`${quickModeTime} minutes`}
            questions={requiredTests.reduce((sum, t) => sum + t.questions, 0)}
            description="Essential tests only. Get your core financial profile."
            features={[
              'Financial Personality analysis',
              'Financial Health Check',
              'Basic factor scores',
              'Quick recommendations'
            ]}
            isSelected={selectedMode === 'quick'}
            onSelect={() => setSelectedMode('quick')}
            badge="Fastest"
            badgeColor="blue"
          />

          {/* Full Mode */}
          <ModeCard
            title="Full Assessment"
            duration={`${fullModeTime} minutes`}
            questions={tests.reduce((sum, t) => sum + t.questions, 0)}
            description="Complete analysis with all 4 tests. Most accurate results."
            features={[
              'All 4 comprehensive tests',
              'Complete 10-factor analysis',
              'Detailed market comparison',
              'PDF report with action plan'
            ]}
            isSelected={selectedMode === 'full'}
            onSelect={() => setSelectedMode('full')}
            badge="Recommended"
            badgeColor="emerald"
            highlighted
          />
        </div>

        {/* Tests Overview */}
        <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-lg p-8 mb-8">
          <h3 className="text-lg font-semibold text-slate-900 dark:text-white mb-6">
            Tests Included
          </h3>

          {/* Required Tests */}
          <div className="mb-6">
            <div className="flex items-center gap-2 mb-4">
              <div className="w-2 h-2 bg-emerald-500 rounded-full" />
              <span className="text-sm font-medium text-slate-600 dark:text-slate-400">
                Required Tests
              </span>
            </div>
            <div className="grid md:grid-cols-2 gap-4">
              {requiredTests.map(test => (
                <TestCard key={test.id} test={test} />
              ))}
            </div>
          </div>

          {/* Optional Tests */}
          <div className={selectedMode === 'quick' ? 'opacity-50' : ''}>
            <div className="flex items-center gap-2 mb-4">
              <div className="w-2 h-2 bg-blue-500 rounded-full" />
              <span className="text-sm font-medium text-slate-600 dark:text-slate-400">
                Additional Tests {selectedMode === 'quick' && '(Full Mode Only)'}
              </span>
            </div>
            <div className="grid md:grid-cols-2 gap-4">
              {optionalTests.map(test => (
                <TestCard key={test.id} test={test} disabled={selectedMode === 'quick'} />
              ))}
            </div>
          </div>
        </div>

        {/* Start Button */}
        <div className="text-center">
          <button
            onClick={() => onStartAssessment(selectedMode)}
            className="inline-flex items-center gap-3 px-8 py-4 bg-emerald-600 hover:bg-emerald-700 text-white font-semibold text-lg rounded-xl shadow-lg shadow-emerald-500/25 transition-all hover:scale-105"
          >
            Start {selectedMode === 'full' ? 'Full' : 'Quick'} Assessment
            <ArrowRight className="w-5 h-5" />
          </button>
          <p className="mt-4 text-sm text-slate-500 dark:text-slate-400">
            Takes about {selectedMode === 'full' ? fullModeTime : quickModeTime} minutes • 
            Your data is private & secure
          </p>
        </div>
      </div>
    </div>
  );
}

// Sub-components

function FeatureCard({ 
  icon, 
  title, 
  description 
}: { 
  icon: React.ReactNode; 
  title: string; 
  description: string;
}) {
  return (
    <div className="bg-white dark:bg-slate-800 rounded-xl p-6 shadow-sm border border-slate-200 dark:border-slate-700">
      <div className="mb-4">{icon}</div>
      <h3 className="font-semibold text-slate-900 dark:text-white mb-2">{title}</h3>
      <p className="text-sm text-slate-600 dark:text-slate-400">{description}</p>
    </div>
  );
}

function ModeCard({
  title,
  duration,
  questions,
  description,
  features,
  isSelected,
  onSelect,
  badge,
  badgeColor,
  highlighted
}: {
  title: string;
  duration: string;
  questions: number;
  description: string;
  features: string[];
  isSelected: boolean;
  onSelect: () => void;
  badge: string;
  badgeColor: 'blue' | 'emerald';
  highlighted?: boolean;
}) {
  const borderColor = isSelected 
    ? 'border-emerald-500 ring-2 ring-emerald-500/20' 
    : 'border-slate-200 dark:border-slate-700';
  
  const badgeBg = badgeColor === 'emerald' 
    ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-300'
    : 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300';

  return (
    <div 
      onClick={onSelect}
      className={`relative bg-white dark:bg-slate-800 rounded-2xl p-6 border-2 cursor-pointer transition-all ${borderColor} ${highlighted ? 'shadow-lg' : 'shadow-sm'}`}
    >
      {/* Badge */}
      <div className={`absolute -top-3 left-6 px-3 py-1 rounded-full text-xs font-semibold ${badgeBg}`}>
        {badge}
      </div>

      {/* Selection indicator */}
      <div className="absolute top-6 right-6">
        <div className={`w-6 h-6 rounded-full border-2 flex items-center justify-center ${isSelected ? 'border-emerald-500 bg-emerald-500' : 'border-slate-300 dark:border-slate-600'}`}>
          {isSelected && <CheckCircle2 className="w-4 h-4 text-white" />}
        </div>
      </div>

      <h3 className="text-xl font-bold text-slate-900 dark:text-white mt-4 mb-2">
        {title}
      </h3>
      
      <div className="flex items-center gap-4 mb-4 text-sm text-slate-600 dark:text-slate-400">
        <span className="flex items-center gap-1">
          <Clock className="w-4 h-4" />
          {duration}
        </span>
        <span>{questions} questions</span>
      </div>

      <p className="text-slate-600 dark:text-slate-400 mb-4">
        {description}
      </p>

      <ul className="space-y-2">
        {features.map((feature, i) => (
          <li key={i} className="flex items-center gap-2 text-sm text-slate-700 dark:text-slate-300">
            <CheckCircle2 className="w-4 h-4 text-emerald-500 flex-shrink-0" />
            {feature}
          </li>
        ))}
      </ul>
    </div>
  );
}

function TestCard({ 
  test, 
  disabled 
}: { 
  test: TestInfo; 
  disabled?: boolean;
}) {
  return (
    <div className={`flex items-center gap-4 p-4 rounded-xl bg-slate-50 dark:bg-slate-700/50 ${disabled ? 'opacity-50' : ''}`}>
      <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${test.isRequired ? 'bg-emerald-100 dark:bg-emerald-900/30 text-emerald-600' : 'bg-blue-100 dark:bg-blue-900/30 text-blue-600'}`}>
        {test.icon}
      </div>
      <div className="flex-1">
        <div className="flex items-center gap-2">
          <h4 className="font-medium text-slate-900 dark:text-white">{test.name}</h4>
          {test.isCompleted && <CheckCircle2 className="w-4 h-4 text-emerald-500" />}
        </div>
        <p className="text-sm text-slate-500 dark:text-slate-400">
          {test.questions} questions • {test.duration}
        </p>
      </div>
    </div>
  );
}
