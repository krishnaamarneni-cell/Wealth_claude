'use client';

import React, { useState, useMemo } from 'react';
import {
  Calendar,
  Target,
  AlertTriangle,
  CheckCircle2,
  Clock,
  DollarSign,
  TrendingUp,
  Shield,
  Zap,
  ArrowRight,
  ChevronDown,
  Info,
  AlertCircle
} from 'lucide-react';
import { 
  AssessmentResult, 
  FinancialPlan, 
  TimelineValidation,
  PlanPath,
  validateTimeline,
  generateSafePath,
  generateAggressivePath,
  GoalPath
} from '@/lib/assessment';

interface TimelineSelectorProps {
  assessment: AssessmentResult;
  goalPath: GoalPath;
  onPlanSelected: (plan: FinancialPlan, chosenPath: 'safe_steady' | 'fast_aggressive') => void;
}

const GOAL_DESCRIPTIONS: Record<GoalPath, { title: string; description: string }> = {
  debt_freedom: {
    title: 'Debt Freedom',
    description: 'Pay off all your debt and become financially free'
  },
  fire: {
    title: 'FIRE (Financial Independence)',
    description: 'Build enough wealth to retire early and live on investments'
  },
  investment_starter: {
    title: 'Start Investing',
    description: 'Build your first investment portfolio'
  },
  tax_optimization: {
    title: 'Tax Optimization',
    description: 'Reduce your tax burden legally and efficiently'
  },
  home_purchase: {
    title: 'Buy a Home',
    description: 'Save for a down payment on your dream home'
  },
  general_wellness: {
    title: 'Financial Wellness',
    description: 'Improve your overall financial health'
  }
};

const TIMELINE_PRESETS = [
  { months: 6, label: '6 months' },
  { months: 12, label: '1 year' },
  { months: 24, label: '2 years' },
  { months: 36, label: '3 years' },
  { months: 60, label: '5 years' }
];

export default function TimelineSelector({
  assessment,
  goalPath,
  onPlanSelected
}: TimelineSelectorProps) {
  const [selectedMonths, setSelectedMonths] = useState<number | null>(null);
  const [customMonths, setCustomMonths] = useState<string>('');
  const [showPathComparison, setShowPathComparison] = useState(false);
  const [selectedPath, setSelectedPath] = useState<'safe_steady' | 'fast_aggressive' | null>(null);

  const goalInfo = GOAL_DESCRIPTIONS[goalPath];

  // Calculate timeline validation and paths when months selected
  const { validation, safePath, aggressivePath } = useMemo(() => {
    const months = selectedMonths || (customMonths ? parseInt(customMonths) : null);
    if (!months) return { validation: null, safePath: null, aggressivePath: null };

    const val = validateTimeline({
      goalPath,
      targetMonths: months,
      metrics: assessment.financialMetrics,
      factorScores: assessment.factorScores
    });

    const safe = generateSafePath(goalPath, assessment.financialMetrics);
    const aggressive = generateAggressivePath(goalPath, months, assessment.financialMetrics);

    return { validation: val, safePath: safe, aggressivePath: aggressive };
  }, [selectedMonths, customMonths, goalPath, assessment]);

  const handleTimelineSelect = (months: number) => {
    setSelectedMonths(months);
    setCustomMonths('');
    setShowPathComparison(true);
  };

  const handleCustomMonthsChange = (value: string) => {
    const num = parseInt(value);
    if (value === '' || (!isNaN(num) && num > 0 && num <= 120)) {
      setCustomMonths(value);
      setSelectedMonths(null);
      if (num > 0) {
        setShowPathComparison(true);
      }
    }
  };

  const handleContinue = () => {
    if (!selectedPath || !safePath || !aggressivePath || !validation) return;

    const targetDate = new Date();
    targetDate.setMonth(targetDate.getMonth() + (selectedMonths || parseInt(customMonths)));

    const plan: FinancialPlan = {
      id: `plan_${Date.now()}`,
      assessmentId: assessment.id,
      userId: assessment.userId,
      goalPath,
      createdAt: new Date(),
      goalDescription: goalInfo.title,
      targetDate,
      timelineValidation: validation,
      safePath,
      aggressivePath,
      chosenPath: selectedPath,
      checkpoints: [],
      contingencyPlans: []
    };

    onPlanSelected(plan, selectedPath);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 dark:from-slate-900 dark:to-slate-800">
      <div className="max-w-5xl mx-auto px-6 py-12">
        {/* Header */}
        <div className="text-center mb-12">
          <div className="inline-flex items-center gap-2 px-4 py-2 bg-blue-100 dark:bg-blue-900/30 rounded-full text-blue-700 dark:text-blue-300 text-sm font-medium mb-6">
            <Target className="w-4 h-4" />
            Goal: {goalInfo.title}
          </div>
          <h1 className="text-3xl md:text-4xl font-bold text-slate-900 dark:text-white mb-4">
            Set Your Timeline
          </h1>
          <p className="text-lg text-slate-600 dark:text-slate-400 max-w-2xl mx-auto">
            When would you like to achieve {goalInfo.title.toLowerCase()}? 
            We'll show you what it takes to get there.
          </p>
        </div>

        {/* System Recommendation */}
        {safePath && (
          <div className="bg-emerald-50 dark:bg-emerald-900/20 border border-emerald-200 dark:border-emerald-800 rounded-xl p-6 mb-8">
            <div className="flex items-start gap-4">
              <div className="w-10 h-10 rounded-full bg-emerald-100 dark:bg-emerald-900/50 flex items-center justify-center">
                <CheckCircle2 className="w-5 h-5 text-emerald-600" />
              </div>
              <div>
                <h3 className="font-semibold text-emerald-800 dark:text-emerald-300 mb-1">
                  Our Recommendation
                </h3>
                <p className="text-emerald-700 dark:text-emerald-400">
                  Based on your financial profile, a realistic timeline is{' '}
                  <strong>{safePath.timelineMonths} months</strong> ({(safePath.timelineMonths / 12).toFixed(1)} years).
                  This allows for a comfortable pace with room for life's surprises.
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Timeline Selection */}
        <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-lg p-8 mb-8">
          <h2 className="text-xl font-bold text-slate-900 dark:text-white mb-6">
            Choose Your Target Timeline
          </h2>

          {/* Preset Options */}
          <div className="grid grid-cols-2 md:grid-cols-5 gap-3 mb-6">
            {TIMELINE_PRESETS.map((preset) => (
              <button
                key={preset.months}
                onClick={() => handleTimelineSelect(preset.months)}
                className={`p-4 rounded-xl border-2 text-center transition-all ${
                  selectedMonths === preset.months
                    ? 'border-emerald-500 bg-emerald-50 dark:bg-emerald-900/20'
                    : 'border-slate-200 dark:border-slate-700 hover:border-slate-300 dark:hover:border-slate-600'
                }`}
              >
                <Calendar className={`w-5 h-5 mx-auto mb-2 ${
                  selectedMonths === preset.months ? 'text-emerald-600' : 'text-slate-400'
                }`} />
                <span className={`font-medium ${
                  selectedMonths === preset.months 
                    ? 'text-emerald-700 dark:text-emerald-300' 
                    : 'text-slate-700 dark:text-slate-300'
                }`}>
                  {preset.label}
                </span>
              </button>
            ))}
          </div>

          {/* Custom Input */}
          <div className="flex items-center gap-4">
            <div className="flex-1">
              <label className="block text-sm font-medium text-slate-600 dark:text-slate-400 mb-2">
                Or enter custom timeline (months)
              </label>
              <input
                type="number"
                value={customMonths}
                onChange={(e) => handleCustomMonthsChange(e.target.value)}
                placeholder="e.g., 18"
                min="1"
                max="120"
                className="w-full px-4 py-3 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
              />
            </div>
          </div>
        </div>

        {/* Feasibility Analysis */}
        {validation && showPathComparison && (
          <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-lg p-8 mb-8">
            <h2 className="text-xl font-bold text-slate-900 dark:text-white mb-6">
              Feasibility Analysis
            </h2>

            {/* Feasibility Score */}
            <div className="flex items-center gap-6 mb-6">
              <div className="relative w-24 h-24">
                <svg className="w-24 h-24 transform -rotate-90">
                  <circle
                    cx="48"
                    cy="48"
                    r="40"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="8"
                    className="text-slate-200 dark:text-slate-700"
                  />
                  <circle
                    cx="48"
                    cy="48"
                    r="40"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="8"
                    strokeLinecap="round"
                    strokeDasharray={251}
                    strokeDashoffset={251 - (251 * validation.feasibilityScore) / 100}
                    className={
                      validation.feasibilityScore >= 70 
                        ? 'text-emerald-500' 
                        : validation.feasibilityScore >= 40 
                        ? 'text-yellow-500' 
                        : 'text-red-500'
                    }
                  />
                </svg>
                <div className="absolute inset-0 flex items-center justify-center">
                  <span className="text-2xl font-bold text-slate-900 dark:text-white">
                    {validation.feasibilityScore}%
                  </span>
                </div>
              </div>

              <div className="flex-1">
                <div className="flex items-center gap-2 mb-2">
                  {validation.isAchievable ? (
                    <CheckCircle2 className="w-5 h-5 text-emerald-500" />
                  ) : (
                    <AlertTriangle className="w-5 h-5 text-amber-500" />
                  )}
                  <span className={`font-semibold ${
                    validation.isAchievable ? 'text-emerald-600' : 'text-amber-600'
                  }`}>
                    {validation.isAchievable ? 'Achievable Timeline' : 'Challenging Timeline'}
                  </span>
                </div>
                <p className="text-slate-600 dark:text-slate-400">
                  {validation.isAchievable
                    ? `This timeline is realistic. You'll need to commit $${validation.requiredMonthlySacrifice.toLocaleString()}/month.`
                    : `This is aggressive. Realistic estimate is ${validation.realisticMonths} months.`
                  }
                </p>
              </div>
            </div>

            {/* Risk Level */}
            <div className="grid md:grid-cols-3 gap-4 mb-6">
              <div className="p-4 bg-slate-50 dark:bg-slate-700/50 rounded-xl">
                <div className="text-sm text-slate-500 mb-1">Monthly Commitment</div>
                <div className="text-xl font-bold text-slate-900 dark:text-white">
                  ${validation.requiredMonthlySacrifice.toLocaleString()}
                </div>
              </div>
              <div className="p-4 bg-slate-50 dark:bg-slate-700/50 rounded-xl">
                <div className="text-sm text-slate-500 mb-1">Realistic Timeline</div>
                <div className="text-xl font-bold text-slate-900 dark:text-white">
                  {validation.realisticMonths} months
                </div>
              </div>
              <div className="p-4 bg-slate-50 dark:bg-slate-700/50 rounded-xl">
                <div className="text-sm text-slate-500 mb-1">Risk Level</div>
                <div className={`text-xl font-bold capitalize ${
                  validation.riskLevel === 'low' ? 'text-emerald-600' :
                  validation.riskLevel === 'medium' ? 'text-yellow-600' :
                  validation.riskLevel === 'high' ? 'text-orange-600' :
                  'text-red-600'
                }`}>
                  {validation.riskLevel.replace('_', ' ')}
                </div>
              </div>
            </div>

            {/* Warnings */}
            {validation.warnings.length > 0 && (
              <div className="bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded-xl p-4">
                <div className="flex items-center gap-2 mb-2">
                  <AlertCircle className="w-5 h-5 text-amber-600" />
                  <span className="font-medium text-amber-800 dark:text-amber-300">Warnings</span>
                </div>
                <ul className="space-y-1">
                  {validation.warnings.map((warning, i) => (
                    <li key={i} className="text-sm text-amber-700 dark:text-amber-400">
                      • {warning}
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        )}

        {/* Path Comparison */}
        {safePath && aggressivePath && showPathComparison && (
          <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-lg p-8 mb-8">
            <h2 className="text-xl font-bold text-slate-900 dark:text-white mb-6">
              Choose Your Path
            </h2>

            <div className="grid md:grid-cols-2 gap-6">
              {/* Safe Path */}
              <PathCard
                path={safePath}
                isSelected={selectedPath === 'safe_steady'}
                onSelect={() => setSelectedPath('safe_steady')}
                icon={<Shield className="w-6 h-6" />}
                color="blue"
              />

              {/* Aggressive Path */}
              <PathCard
                path={aggressivePath}
                isSelected={selectedPath === 'fast_aggressive'}
                onSelect={() => setSelectedPath('fast_aggressive')}
                icon={<Zap className="w-6 h-6" />}
                color="orange"
              />
            </div>

            {/* Side by Side Comparison */}
            <div className="mt-8 overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-slate-200 dark:border-slate-700">
                    <th className="text-left py-3 px-4 font-medium text-slate-500">Metric</th>
                    <th className="text-center py-3 px-4 font-medium text-blue-600">Safe & Steady</th>
                    <th className="text-center py-3 px-4 font-medium text-orange-600">Fast & Aggressive</th>
                  </tr>
                </thead>
                <tbody>
                  <ComparisonRow
                    label="Timeline"
                    safe={`${safePath.timelineMonths} months`}
                    aggressive={`${aggressivePath.timelineMonths} months`}
                    winner={aggressivePath.timelineMonths < safePath.timelineMonths ? 'aggressive' : 'safe'}
                  />
                  <ComparisonRow
                    label="Monthly Payment"
                    safe={`$${safePath.monthlyPayment.toLocaleString()}`}
                    aggressive={`$${aggressivePath.monthlyPayment.toLocaleString()}`}
                    winner={safePath.monthlyPayment < aggressivePath.monthlyPayment ? 'safe' : 'aggressive'}
                  />
                  <ComparisonRow
                    label="Total Cost"
                    safe={`$${safePath.totalCost.toLocaleString()}`}
                    aggressive={`$${aggressivePath.totalCost.toLocaleString()}`}
                    winner={aggressivePath.totalCost < safePath.totalCost ? 'aggressive' : 'safe'}
                  />
                  <ComparisonRow
                    label="Interest Saved"
                    safe={`$${safePath.interestSaved.toLocaleString()}`}
                    aggressive={`$${aggressivePath.interestSaved.toLocaleString()}`}
                    winner={aggressivePath.interestSaved > safePath.interestSaved ? 'aggressive' : 'safe'}
                  />
                  <ComparisonRow
                    label="Lifestyle Impact"
                    safe={safePath.lifestyleImpact}
                    aggressive={aggressivePath.lifestyleImpact}
                    winner={safePath.lifestyleImpact === 'minimal' ? 'safe' : 'neutral'}
                  />
                  <ComparisonRow
                    label="Risk Level"
                    safe={safePath.riskLevel}
                    aggressive={aggressivePath.riskLevel}
                    winner="safe"
                  />
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Continue Button */}
        {selectedPath && (
          <div className="text-center">
            <button
              onClick={handleContinue}
              className="inline-flex items-center gap-3 px-8 py-4 bg-emerald-600 hover:bg-emerald-700 text-white font-semibold text-lg rounded-xl shadow-lg shadow-emerald-500/25 transition-all hover:scale-105"
            >
              Continue with {selectedPath === 'safe_steady' ? 'Safe & Steady' : 'Fast & Aggressive'} Path
              <ArrowRight className="w-5 h-5" />
            </button>
            <p className="mt-4 text-sm text-slate-500 dark:text-slate-400">
              You can always change your path later based on your progress
            </p>
          </div>
        )}
      </div>
    </div>
  );
}

// Sub-components

function PathCard({
  path,
  isSelected,
  onSelect,
  icon,
  color
}: {
  path: PlanPath;
  isSelected: boolean;
  onSelect: () => void;
  icon: React.ReactNode;
  color: 'blue' | 'orange';
}) {
  const colorClasses = {
    blue: {
      bg: 'bg-blue-50 dark:bg-blue-900/20',
      border: 'border-blue-500',
      icon: 'bg-blue-100 dark:bg-blue-900/50 text-blue-600',
      text: 'text-blue-700 dark:text-blue-300'
    },
    orange: {
      bg: 'bg-orange-50 dark:bg-orange-900/20',
      border: 'border-orange-500',
      icon: 'bg-orange-100 dark:bg-orange-900/50 text-orange-600',
      text: 'text-orange-700 dark:text-orange-300'
    }
  };

  const c = colorClasses[color];

  return (
    <button
      onClick={onSelect}
      className={`p-6 rounded-2xl border-2 text-left transition-all ${
        isSelected 
          ? `${c.border} ${c.bg}` 
          : 'border-slate-200 dark:border-slate-700 hover:border-slate-300 dark:hover:border-slate-600'
      }`}
    >
      <div className="flex items-center gap-3 mb-4">
        <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${c.icon}`}>
          {icon}
        </div>
        <div>
          <h3 className={`font-bold text-lg ${isSelected ? c.text : 'text-slate-900 dark:text-white'}`}>
            {path.name}
          </h3>
          <p className="text-sm text-slate-500">
            {path.timelineMonths} months • ${path.monthlyPayment.toLocaleString()}/mo
          </p>
        </div>
        
        {/* Selection indicator */}
        <div className={`ml-auto w-6 h-6 rounded-full border-2 flex items-center justify-center ${
          isSelected 
            ? `${c.border} bg-current` 
            : 'border-slate-300 dark:border-slate-600'
        }`}>
          {isSelected && <CheckCircle2 className="w-4 h-4 text-white" />}
        </div>
      </div>

      {/* Pros */}
      <div className="mb-4">
        <div className="text-xs font-medium text-emerald-600 mb-2">BENEFITS</div>
        <ul className="space-y-1">
          {path.pros.slice(0, 3).map((pro, i) => (
            <li key={i} className="flex items-center gap-2 text-sm text-slate-600 dark:text-slate-400">
              <CheckCircle2 className="w-3 h-3 text-emerald-500 flex-shrink-0" />
              {pro}
            </li>
          ))}
        </ul>
      </div>

      {/* Cons */}
      <div>
        <div className="text-xs font-medium text-amber-600 mb-2">TRADE-OFFS</div>
        <ul className="space-y-1">
          {path.cons.slice(0, 2).map((con, i) => (
            <li key={i} className="flex items-center gap-2 text-sm text-slate-500">
              <AlertTriangle className="w-3 h-3 text-amber-500 flex-shrink-0" />
              {con}
            </li>
          ))}
        </ul>
      </div>
    </button>
  );
}

function ComparisonRow({
  label,
  safe,
  aggressive,
  winner
}: {
  label: string;
  safe: string;
  aggressive: string;
  winner: 'safe' | 'aggressive' | 'neutral';
}) {
  return (
    <tr className="border-b border-slate-100 dark:border-slate-700/50">
      <td className="py-3 px-4 text-slate-600 dark:text-slate-400">{label}</td>
      <td className={`py-3 px-4 text-center font-medium ${
        winner === 'safe' ? 'text-emerald-600' : 'text-slate-700 dark:text-slate-300'
      }`}>
        {safe}
        {winner === 'safe' && ' ✓'}
      </td>
      <td className={`py-3 px-4 text-center font-medium ${
        winner === 'aggressive' ? 'text-emerald-600' : 'text-slate-700 dark:text-slate-300'
      }`}>
        {aggressive}
        {winner === 'aggressive' && ' ✓'}
      </td>
    </tr>
  );
}
