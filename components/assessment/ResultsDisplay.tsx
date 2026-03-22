'use client';

import React, { useState } from 'react';
import {
  Trophy,
  TrendingUp,
  TrendingDown,
  Minus,
  Target,
  Zap,
  Brain,
  ArrowRight,
  ChevronDown,
  ChevronUp,
  Info,
  Download,
  Share2
} from 'lucide-react';
import { AssessmentResult, FactorScore, factors, getPersonalityDescription } from '@/lib/assessment';

interface ResultsDisplayProps {
  result: AssessmentResult;
  onContinueToTimeline: () => void;
  onDownloadPDF?: () => void;
}

export default function ResultsDisplay({
  result,
  onContinueToTimeline,
  onDownloadPDF
}: ResultsDisplayProps) {
  const [expandedFactor, setExpandedFactor] = useState<string | null>(null);
  const [comparisonView, setComparisonView] = useState<'general' | 'age' | 'income'>('general');

  const personalityDescription = getPersonalityDescription(result.personalityType);

  // Get score color
  const getScoreColor = (score: number) => {
    if (score >= 80) return 'text-emerald-600';
    if (score >= 65) return 'text-green-600';
    if (score >= 45) return 'text-yellow-600';
    if (score >= 25) return 'text-orange-600';
    return 'text-red-600';
  };

  const getScoreBg = (score: number) => {
    if (score >= 80) return 'bg-emerald-100 dark:bg-emerald-900/30';
    if (score >= 65) return 'bg-green-100 dark:bg-green-900/30';
    if (score >= 45) return 'bg-yellow-100 dark:bg-yellow-900/30';
    if (score >= 25) return 'bg-orange-100 dark:bg-orange-900/30';
    return 'bg-red-100 dark:bg-red-900/30';
  };

  const getStatusLabel = (status: string) => {
    const labels: Record<string, string> = {
      excellent: 'Excellent',
      good: 'Good',
      average: 'Average',
      needs_work: 'Needs Work',
      critical: 'Critical'
    };
    return labels[status] || status;
  };

  // Sort factors by score
  const sortedFactors = [...result.factorScores].sort((a, b) => b.score - a.score);
  const topStrengths = sortedFactors.slice(0, 3);
  const areasToImprove = sortedFactors.slice(-3).reverse();

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 dark:from-slate-900 dark:to-slate-800">
      {/* Hero Section */}
      <div className="relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-r from-emerald-500/10 to-blue-500/10" />
        <div className="max-w-5xl mx-auto px-6 py-12 relative">
          <div className="text-center mb-8">
            <div className="inline-flex items-center gap-2 px-4 py-2 bg-emerald-100 dark:bg-emerald-900/30 rounded-full text-emerald-700 dark:text-emerald-300 text-sm font-medium mb-6">
              <Trophy className="w-4 h-4" />
              Assessment Complete
            </div>
            <h1 className="text-4xl md:text-5xl font-bold text-slate-900 dark:text-white mb-4">
              Your Financial Health Score
            </h1>
          </div>

          {/* Overall Score */}
          <div className="flex justify-center mb-8">
            <div className="relative">
              <svg className="w-48 h-48 transform -rotate-90">
                <circle
                  cx="96"
                  cy="96"
                  r="88"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="12"
                  className="text-slate-200 dark:text-slate-700"
                />
                <circle
                  cx="96"
                  cy="96"
                  r="88"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="12"
                  strokeLinecap="round"
                  strokeDasharray={553}
                  strokeDashoffset={553 - (553 * result.overallScore) / 100}
                  className="text-emerald-500 transition-all duration-1000"
                />
              </svg>
              <div className="absolute inset-0 flex flex-col items-center justify-center">
                <span className="text-5xl font-bold text-slate-900 dark:text-white">
                  {result.overallScore}
                </span>
                <span className="text-slate-500 text-sm">out of 100</span>
              </div>
            </div>
          </div>

          {/* Percentile Badges */}
          <div className="flex flex-wrap justify-center gap-4 mb-8">
            <PercentileBadge
              label="Overall Rank"
              percentile={result.rankings.overallPercentile}
              icon={<Trophy className="w-4 h-4" />}
            />
            <PercentileBadge
              label="vs Age Group"
              percentile={result.rankings.vsAgeGroup}
              icon={<Target className="w-4 h-4" />}
            />
            <PercentileBadge
              label="vs Income Group"
              percentile={result.rankings.vsIncomeGroup}
              icon={<TrendingUp className="w-4 h-4" />}
            />
          </div>
        </div>
      </div>

      {/* Personality Type */}
      <div className="max-w-5xl mx-auto px-6 py-8">
        <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-lg p-8 mb-8">
          <div className="flex items-start gap-4">
            <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-purple-500 to-indigo-600 flex items-center justify-center">
              <Brain className="w-8 h-8 text-white" />
            </div>
            <div className="flex-1">
              <h2 className="text-sm font-medium text-slate-500 dark:text-slate-400 mb-1">
                Your Money Personality
              </h2>
              <h3 className="text-2xl font-bold text-slate-900 dark:text-white mb-3 capitalize">
                {result.personalityType.replace(/_/g, ' ')}
              </h3>
              <p className="text-slate-600 dark:text-slate-400">
                {personalityDescription}
              </p>
            </div>
          </div>

          {/* Personality Traits */}
          <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mt-8">
            <TraitMeter
              label="Saver ↔ Spender"
              value={result.personalityTraits.spenderVsSaver}
              leftLabel="Spender"
              rightLabel="Saver"
            />
            <TraitMeter
              label="Risk Level"
              value={result.personalityTraits.riskTolerance - 50}
              leftLabel="Conservative"
              rightLabel="Aggressive"
            />
            <TraitMeter
              label="Time Focus"
              value={result.personalityTraits.presentVsFuture}
              leftLabel="Present"
              rightLabel="Future"
            />
            <TraitMeter
              label="Decision Style"
              value={result.personalityTraits.emotionalVsRational}
              leftLabel="Emotional"
              rightLabel="Rational"
            />
            <TraitMeter
              label="Action Style"
              value={result.personalityTraits.impulsiveVsDeliberate}
              leftLabel="Impulsive"
              rightLabel="Deliberate"
            />
          </div>
        </div>

        {/* Factor Breakdown */}
        <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-lg p-8 mb-8">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-xl font-bold text-slate-900 dark:text-white">
              10 Factor Analysis
            </h2>
            
            {/* Comparison Toggle */}
            <div className="flex bg-slate-100 dark:bg-slate-700 rounded-lg p-1">
              {(['general', 'age', 'income'] as const).map((view) => (
                <button
                  key={view}
                  onClick={() => setComparisonView(view)}
                  className={`px-3 py-1.5 rounded-md text-sm font-medium transition-colors ${
                    comparisonView === view
                      ? 'bg-white dark:bg-slate-600 text-slate-900 dark:text-white shadow-sm'
                      : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                  }`}
                >
                  {view === 'general' ? 'vs Market' : view === 'age' ? 'vs Age' : 'vs Income'}
                </button>
              ))}
            </div>
          </div>

          {/* Radar Chart Placeholder */}
          <div className="mb-8">
            <RadarChart factorScores={result.factorScores} />
          </div>

          {/* Factor List */}
          <div className="space-y-3">
            {result.factorScores.map((factor) => {
              const factorInfo = factors[factor.factorId];
              const comparison = comparisonView === 'general' 
                ? factor.benchmarkComparison.vsGeneral
                : comparisonView === 'age'
                ? factor.benchmarkComparison.vsAgeGroup
                : factor.benchmarkComparison.vsIncomeGroup;

              return (
                <FactorRow
                  key={factor.factorId}
                  factor={factor}
                  factorInfo={factorInfo}
                  comparison={comparison}
                  isExpanded={expandedFactor === factor.factorId}
                  onToggle={() => setExpandedFactor(
                    expandedFactor === factor.factorId ? null : factor.factorId
                  )}
                />
              );
            })}
          </div>
        </div>

        {/* Strengths & Areas to Improve */}
        <div className="grid md:grid-cols-2 gap-6 mb-8">
          {/* Strengths */}
          <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-lg p-6">
            <div className="flex items-center gap-2 mb-4">
              <div className="w-8 h-8 rounded-lg bg-emerald-100 dark:bg-emerald-900/30 flex items-center justify-center">
                <TrendingUp className="w-4 h-4 text-emerald-600" />
              </div>
              <h3 className="font-semibold text-slate-900 dark:text-white">Your Strengths</h3>
            </div>
            <div className="space-y-3">
              {topStrengths.map((factor) => (
                <div key={factor.factorId} className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="text-lg">{factors[factor.factorId].icon}</span>
                    <span className="text-slate-700 dark:text-slate-300">
                      {factors[factor.factorId].name}
                    </span>
                  </div>
                  <span className={`font-semibold ${getScoreColor(factor.score)}`}>
                    {factor.score}
                  </span>
                </div>
              ))}
            </div>
          </div>

          {/* Areas to Improve */}
          <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-lg p-6">
            <div className="flex items-center gap-2 mb-4">
              <div className="w-8 h-8 rounded-lg bg-amber-100 dark:bg-amber-900/30 flex items-center justify-center">
                <Target className="w-4 h-4 text-amber-600" />
              </div>
              <h3 className="font-semibold text-slate-900 dark:text-white">Priority Areas</h3>
            </div>
            <div className="space-y-3">
              {areasToImprove.map((factor) => (
                <div key={factor.factorId} className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="text-lg">{factors[factor.factorId].icon}</span>
                    <span className="text-slate-700 dark:text-slate-300">
                      {factors[factor.factorId].name}
                    </span>
                  </div>
                  <span className={`font-semibold ${getScoreColor(factor.score)}`}>
                    {factor.score}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Your Numbers vs Market */}
        <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-lg p-8 mb-8">
          <h2 className="text-xl font-bold text-slate-900 dark:text-white mb-6">
            Your Numbers vs Market Average
          </h2>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-slate-200 dark:border-slate-700">
                  <th className="text-left py-3 px-4 text-sm font-medium text-slate-500">Metric</th>
                  <th className="text-right py-3 px-4 text-sm font-medium text-slate-500">You</th>
                  <th className="text-right py-3 px-4 text-sm font-medium text-slate-500">Market Avg</th>
                  <th className="text-right py-3 px-4 text-sm font-medium text-slate-500">Your Rank</th>
                </tr>
              </thead>
              <tbody>
                <MetricRow
                  label="Monthly Income"
                  value={`$${result.financialMetrics.monthlyIncome.toLocaleString()}`}
                  marketAvg="$4,200"
                  rank={result.rankings.vsIncomeGroup > 50 ? `Top ${100 - result.rankings.vsIncomeGroup}%` : `Bottom ${result.rankings.vsIncomeGroup}%`}
                  isGood={result.financialMetrics.monthlyIncome > 4200}
                />
                <MetricRow
                  label="Savings Rate"
                  value={`${result.financialMetrics.savingsRate}%`}
                  marketAvg="8%"
                  rank={result.financialMetrics.savingsRate > 8 ? 'Above Avg' : 'Below Avg'}
                  isGood={result.financialMetrics.savingsRate > 8}
                />
                <MetricRow
                  label="Debt-to-Income"
                  value={`${result.financialMetrics.debtToIncomeRatio}%`}
                  marketAvg="36%"
                  rank={result.financialMetrics.debtToIncomeRatio < 36 ? 'Better' : 'Worse'}
                  isGood={result.financialMetrics.debtToIncomeRatio < 36}
                />
                <MetricRow
                  label="Emergency Fund"
                  value={`${result.financialMetrics.emergencyFundMonths.toFixed(1)} mo`}
                  marketAvg="2.1 mo"
                  rank={result.financialMetrics.emergencyFundMonths > 2.1 ? 'Above Avg' : 'Below Avg'}
                  isGood={result.financialMetrics.emergencyFundMonths > 2.1}
                />
              </tbody>
            </table>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex flex-col sm:flex-row gap-4 justify-center mb-12">
          <button
            onClick={onContinueToTimeline}
            className="inline-flex items-center justify-center gap-2 px-8 py-4 bg-emerald-600 hover:bg-emerald-700 text-white font-semibold text-lg rounded-xl shadow-lg shadow-emerald-500/25 transition-all hover:scale-105"
          >
            Create Your Action Plan
            <ArrowRight className="w-5 h-5" />
          </button>
          
          {onDownloadPDF && (
            <button
              onClick={onDownloadPDF}
              className="inline-flex items-center justify-center gap-2 px-6 py-4 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 font-semibold rounded-xl hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors"
            >
              <Download className="w-5 h-5" />
              Download PDF Report
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

// Sub-components

function PercentileBadge({
  label,
  percentile,
  icon
}: {
  label: string;
  percentile: number;
  icon: React.ReactNode;
}) {
  const isTop = percentile > 50;
  return (
    <div className="flex items-center gap-2 px-4 py-2 bg-white dark:bg-slate-800 rounded-full shadow-sm">
      <span className={isTop ? 'text-emerald-600' : 'text-amber-600'}>{icon}</span>
      <span className="text-sm font-medium text-slate-700 dark:text-slate-300">{label}:</span>
      <span className={`font-bold ${isTop ? 'text-emerald-600' : 'text-amber-600'}`}>
        {isTop ? `Top ${100 - percentile}%` : `${percentile}th`}
      </span>
    </div>
  );
}

function TraitMeter({
  label,
  value,
  leftLabel,
  rightLabel
}: {
  label: string;
  value: number; // -100 to +100
  leftLabel: string;
  rightLabel: string;
}) {
  const position = ((value + 100) / 200) * 100;
  
  return (
    <div className="text-center">
      <div className="text-xs font-medium text-slate-500 mb-2">{label}</div>
      <div className="relative h-2 bg-slate-200 dark:bg-slate-700 rounded-full mb-1">
        <div 
          className="absolute top-1/2 -translate-y-1/2 w-3 h-3 bg-emerald-500 rounded-full shadow"
          style={{ left: `calc(${position}% - 6px)` }}
        />
      </div>
      <div className="flex justify-between text-xs text-slate-400">
        <span>{leftLabel}</span>
        <span>{rightLabel}</span>
      </div>
    </div>
  );
}

function RadarChart({ factorScores }: { factorScores: FactorScore[] }) {
  // Simple radar chart using SVG
  const centerX = 150;
  const centerY = 150;
  const radius = 120;
  const levels = 5;

  const points = factorScores.map((factor, i) => {
    const angle = (Math.PI * 2 * i) / factorScores.length - Math.PI / 2;
    const value = factor.score / 100;
    return {
      x: centerX + radius * value * Math.cos(angle),
      y: centerY + radius * value * Math.sin(angle),
      label: factors[factor.factorId].icon,
      name: factors[factor.factorId].name
    };
  });

  const pathData = points.map((p, i) => `${i === 0 ? 'M' : 'L'} ${p.x} ${p.y}`).join(' ') + ' Z';

  return (
    <div className="flex justify-center">
      <svg viewBox="0 0 300 300" className="w-full max-w-md">
        {/* Grid circles */}
        {[...Array(levels)].map((_, i) => (
          <circle
            key={i}
            cx={centerX}
            cy={centerY}
            r={radius * ((i + 1) / levels)}
            fill="none"
            stroke="currentColor"
            strokeWidth="1"
            className="text-slate-200 dark:text-slate-700"
          />
        ))}

        {/* Grid lines */}
        {factorScores.map((_, i) => {
          const angle = (Math.PI * 2 * i) / factorScores.length - Math.PI / 2;
          return (
            <line
              key={i}
              x1={centerX}
              y1={centerY}
              x2={centerX + radius * Math.cos(angle)}
              y2={centerY + radius * Math.sin(angle)}
              stroke="currentColor"
              strokeWidth="1"
              className="text-slate-200 dark:text-slate-700"
            />
          );
        })}

        {/* Data area */}
        <path
          d={pathData}
          fill="currentColor"
          fillOpacity="0.2"
          stroke="currentColor"
          strokeWidth="2"
          className="text-emerald-500"
        />

        {/* Data points */}
        {points.map((point, i) => (
          <circle
            key={i}
            cx={point.x}
            cy={point.y}
            r="4"
            fill="currentColor"
            className="text-emerald-500"
          />
        ))}

        {/* Labels */}
        {factorScores.map((factor, i) => {
          const angle = (Math.PI * 2 * i) / factorScores.length - Math.PI / 2;
          const labelRadius = radius + 25;
          const x = centerX + labelRadius * Math.cos(angle);
          const y = centerY + labelRadius * Math.sin(angle);
          
          return (
            <text
              key={i}
              x={x}
              y={y}
              textAnchor="middle"
              dominantBaseline="middle"
              className="text-sm fill-current text-slate-600 dark:text-slate-400"
            >
              {factors[factor.factorId].icon}
            </text>
          );
        })}
      </svg>
    </div>
  );
}

function FactorRow({
  factor,
  factorInfo,
  comparison,
  isExpanded,
  onToggle
}: {
  factor: FactorScore;
  factorInfo: typeof factors[keyof typeof factors];
  comparison: number;
  isExpanded: boolean;
  onToggle: () => void;
}) {
  const ComparisonIcon = comparison > 0 ? TrendingUp : comparison < 0 ? TrendingDown : Minus;
  const comparisonColor = comparison > 0 ? 'text-emerald-600' : comparison < 0 ? 'text-red-500' : 'text-slate-400';

  return (
    <div className="border border-slate-200 dark:border-slate-700 rounded-xl overflow-hidden">
      <button
        onClick={onToggle}
        className="w-full p-4 flex items-center gap-4 hover:bg-slate-50 dark:hover:bg-slate-700/50 transition-colors"
      >
        <span className="text-2xl">{factorInfo.icon}</span>
        
        <div className="flex-1 text-left">
          <div className="font-medium text-slate-900 dark:text-white">
            {factorInfo.name}
          </div>
          <div className="text-sm text-slate-500">{factor.status}</div>
        </div>

        {/* Score bar */}
        <div className="w-32 hidden sm:block">
          <div className="h-2 bg-slate-200 dark:bg-slate-700 rounded-full overflow-hidden">
            <div 
              className="h-full bg-emerald-500 rounded-full"
              style={{ width: `${factor.score}%` }}
            />
          </div>
        </div>

        <div className="text-right">
          <div className="font-bold text-lg text-slate-900 dark:text-white">
            {factor.score}
          </div>
          <div className={`flex items-center gap-1 text-sm ${comparisonColor}`}>
            <ComparisonIcon className="w-3 h-3" />
            {comparison > 0 ? '+' : ''}{comparison}
          </div>
        </div>

        {isExpanded ? (
          <ChevronUp className="w-5 h-5 text-slate-400" />
        ) : (
          <ChevronDown className="w-5 h-5 text-slate-400" />
        )}
      </button>

      {isExpanded && (
        <div className="px-4 pb-4 pt-0 border-t border-slate-200 dark:border-slate-700">
          <p className="text-sm text-slate-600 dark:text-slate-400 mb-4">
            {factorInfo.description}
          </p>
          
          <div className="flex items-center gap-2 mb-3">
            <span className="text-xs font-medium text-slate-500">Difficulty to improve:</span>
            <span className={`text-xs px-2 py-0.5 rounded-full ${
              factorInfo.difficultyToImprove === 'easy' 
                ? 'bg-green-100 text-green-700'
                : factorInfo.difficultyToImprove === 'medium'
                ? 'bg-yellow-100 text-yellow-700'
                : 'bg-red-100 text-red-700'
            }`}>
              {factorInfo.difficultyToImprove}
            </span>
          </div>

          <div>
            <div className="text-xs font-medium text-slate-500 mb-2">Quick tips:</div>
            <ul className="space-y-1">
              {factorInfo.improvementTips.slice(0, 3).map((tip, i) => (
                <li key={i} className="flex items-start gap-2 text-sm text-slate-600 dark:text-slate-400">
                  <Zap className="w-4 h-4 text-amber-500 mt-0.5 flex-shrink-0" />
                  {tip}
                </li>
              ))}
            </ul>
          </div>
        </div>
      )}
    </div>
  );
}

function MetricRow({
  label,
  value,
  marketAvg,
  rank,
  isGood
}: {
  label: string;
  value: string;
  marketAvg: string;
  rank: string;
  isGood: boolean;
}) {
  return (
    <tr className="border-b border-slate-100 dark:border-slate-700/50 last:border-0">
      <td className="py-3 px-4 text-slate-700 dark:text-slate-300">{label}</td>
      <td className="py-3 px-4 text-right font-semibold text-slate-900 dark:text-white">{value}</td>
      <td className="py-3 px-4 text-right text-slate-500">{marketAvg}</td>
      <td className={`py-3 px-4 text-right font-medium ${isGood ? 'text-emerald-600' : 'text-amber-600'}`}>
        {rank}
      </td>
    </tr>
  );
}
