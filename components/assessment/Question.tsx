'use client';

import React, { useState } from 'react';
import { Check, ChevronRight, Info } from 'lucide-react';

// Types
export interface QuestionOption {
  id: string;
  text: string;
  value: number;
}

export interface SliderConfig {
  min: number;
  max: number;
  step: number;
  labels?: { value: number; label: string }[];
}

export interface RangeOption {
  id: string;
  label: string;
  minValue: number;
  maxValue: number;
  midpoint: number;
  score: number;
}

export type QuestionType = 
  | 'multiple_choice'
  | 'slider'
  | 'agree_scale'
  | 'yes_no'
  | 'range_selector'
  | 'scenario';

export interface QuestionData {
  id: string;
  text: string;
  description?: string;
  type: QuestionType;
  options?: QuestionOption[];
  sliderConfig?: SliderConfig;
  rangeOptions?: RangeOption[];
  category?: string;
}

interface QuestionProps {
  question: QuestionData;
  currentAnswer?: string | number;
  onAnswer: (answer: string | number) => void;
  onNext: () => void;
  questionNumber: number;
  totalQuestions: number;
}

export default function Question({
  question,
  currentAnswer,
  onAnswer,
  onNext,
  questionNumber,
  totalQuestions
}: QuestionProps) {
  const progress = (questionNumber / totalQuestions) * 100;

  const renderQuestionInput = () => {
    switch (question.type) {
      case 'multiple_choice':
      case 'scenario':
        return (
          <MultipleChoice
            options={question.options || []}
            selected={currentAnswer as string}
            onSelect={onAnswer}
          />
        );

      case 'agree_scale':
        return (
          <AgreeScale
            options={question.options || []}
            selected={currentAnswer as string}
            onSelect={onAnswer}
          />
        );

      case 'slider':
        return (
          <SliderInput
            config={question.sliderConfig!}
            value={currentAnswer as number}
            onChange={onAnswer}
          />
        );

      case 'range_selector':
        return (
          <RangeSelector
            options={question.rangeOptions || []}
            selected={currentAnswer as string}
            onSelect={onAnswer}
          />
        );

      case 'yes_no':
        return (
          <YesNo
            selected={currentAnswer as string}
            onSelect={onAnswer}
          />
        );

      default:
        return null;
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 dark:from-slate-900 dark:to-slate-800 flex flex-col">
      {/* Progress Bar */}
      <div className="sticky top-0 bg-white/80 dark:bg-slate-800/80 backdrop-blur-sm border-b border-slate-200 dark:border-slate-700 z-10">
        <div className="max-w-3xl mx-auto px-6 py-4">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-medium text-slate-600 dark:text-slate-400">
              Question {questionNumber} of {totalQuestions}
            </span>
            {question.category && (
              <span className="text-sm text-emerald-600 dark:text-emerald-400 font-medium">
                {question.category}
              </span>
            )}
          </div>
          <div className="h-2 bg-slate-200 dark:bg-slate-700 rounded-full overflow-hidden">
            <div 
              className="h-full bg-gradient-to-r from-emerald-500 to-emerald-400 rounded-full transition-all duration-500 ease-out"
              style={{ width: `${progress}%` }}
            />
          </div>
        </div>
      </div>

      {/* Question Content */}
      <div className="flex-1 flex items-center justify-center p-6">
        <div className="w-full max-w-3xl">
          {/* Question Text */}
          <div className="mb-8">
            <h2 className="text-2xl md:text-3xl font-bold text-slate-900 dark:text-white mb-3 leading-tight">
              {question.text}
            </h2>
            {question.description && (
              <p className="flex items-start gap-2 text-slate-600 dark:text-slate-400">
                <Info className="w-5 h-5 mt-0.5 flex-shrink-0 text-slate-400" />
                {question.description}
              </p>
            )}
          </div>

          {/* Question Input */}
          <div className="mb-8">
            {renderQuestionInput()}
          </div>

          {/* Next Button */}
          <div className="flex justify-end">
            <button
              onClick={onNext}
              disabled={currentAnswer === undefined || currentAnswer === ''}
              className={`
                inline-flex items-center gap-2 px-6 py-3 rounded-xl font-semibold text-lg transition-all
                ${currentAnswer !== undefined && currentAnswer !== ''
                  ? 'bg-emerald-600 hover:bg-emerald-700 text-white shadow-lg shadow-emerald-500/25 hover:scale-105'
                  : 'bg-slate-200 dark:bg-slate-700 text-slate-400 cursor-not-allowed'
                }
              `}
            >
              {questionNumber === totalQuestions ? 'Complete' : 'Continue'}
              <ChevronRight className="w-5 h-5" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

// Sub-components for different question types

function MultipleChoice({
  options,
  selected,
  onSelect
}: {
  options: QuestionOption[];
  selected?: string;
  onSelect: (id: string) => void;
}) {
  return (
    <div className="space-y-3">
      {options.map((option, index) => (
        <button
          key={option.id}
          onClick={() => onSelect(option.id)}
          className={`
            w-full p-4 rounded-xl border-2 text-left transition-all
            ${selected === option.id
              ? 'border-emerald-500 bg-emerald-50 dark:bg-emerald-900/20'
              : 'border-slate-200 dark:border-slate-700 hover:border-slate-300 dark:hover:border-slate-600 bg-white dark:bg-slate-800'
            }
          `}
        >
          <div className="flex items-center gap-4">
            <div className={`
              w-8 h-8 rounded-full border-2 flex items-center justify-center flex-shrink-0 font-medium text-sm
              ${selected === option.id
                ? 'border-emerald-500 bg-emerald-500 text-white'
                : 'border-slate-300 dark:border-slate-600 text-slate-500'
              }
            `}>
              {selected === option.id ? (
                <Check className="w-4 h-4" />
              ) : (
                String.fromCharCode(65 + index)
              )}
            </div>
            <span className={`text-lg ${selected === option.id ? 'text-emerald-700 dark:text-emerald-300' : 'text-slate-700 dark:text-slate-300'}`}>
              {option.text}
            </span>
          </div>
        </button>
      ))}
    </div>
  );
}

function AgreeScale({
  options,
  selected,
  onSelect
}: {
  options: QuestionOption[];
  selected?: string;
  onSelect: (id: string) => void;
}) {
  // Sort from Strongly Disagree to Strongly Agree
  const sortedOptions = [...options];
  
  return (
    <div className="space-y-2">
      {/* Desktop: horizontal scale */}
      <div className="hidden md:flex gap-2">
        {sortedOptions.map((option) => (
          <button
            key={option.id}
            onClick={() => onSelect(option.id)}
            className={`
              flex-1 py-4 px-3 rounded-xl border-2 text-center transition-all
              ${selected === option.id
                ? 'border-emerald-500 bg-emerald-50 dark:bg-emerald-900/20'
                : 'border-slate-200 dark:border-slate-700 hover:border-slate-300 dark:hover:border-slate-600 bg-white dark:bg-slate-800'
              }
            `}
          >
            <span className={`text-sm font-medium ${selected === option.id ? 'text-emerald-700 dark:text-emerald-300' : 'text-slate-600 dark:text-slate-400'}`}>
              {option.text}
            </span>
          </button>
        ))}
      </div>

      {/* Mobile: vertical list */}
      <div className="md:hidden space-y-2">
        {sortedOptions.map((option) => (
          <button
            key={option.id}
            onClick={() => onSelect(option.id)}
            className={`
              w-full py-3 px-4 rounded-xl border-2 text-left transition-all flex items-center justify-between
              ${selected === option.id
                ? 'border-emerald-500 bg-emerald-50 dark:bg-emerald-900/20'
                : 'border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800'
              }
            `}
          >
            <span className={selected === option.id ? 'text-emerald-700 dark:text-emerald-300' : 'text-slate-700 dark:text-slate-300'}>
              {option.text}
            </span>
            {selected === option.id && <Check className="w-5 h-5 text-emerald-500" />}
          </button>
        ))}
      </div>
    </div>
  );
}

function SliderInput({
  config,
  value,
  onChange
}: {
  config: SliderConfig;
  value?: number;
  onChange: (value: number) => void;
}) {
  const [localValue, setLocalValue] = useState(value ?? config.min + (config.max - config.min) / 2);

  const handleChange = (newValue: number) => {
    setLocalValue(newValue);
    onChange(newValue);
  };

  const percentage = ((localValue - config.min) / (config.max - config.min)) * 100;

  return (
    <div className="space-y-6">
      {/* Value Display */}
      <div className="text-center">
        <div className="inline-flex items-center justify-center w-20 h-20 rounded-full bg-gradient-to-br from-emerald-500 to-emerald-600 text-white text-3xl font-bold shadow-lg">
          {localValue}
        </div>
      </div>

      {/* Slider */}
      <div className="relative px-2">
        <input
          type="range"
          min={config.min}
          max={config.max}
          step={config.step}
          value={localValue}
          onChange={(e) => handleChange(Number(e.target.value))}
          className="w-full h-3 appearance-none bg-slate-200 dark:bg-slate-700 rounded-full cursor-pointer
            [&::-webkit-slider-thumb]:appearance-none
            [&::-webkit-slider-thumb]:w-6
            [&::-webkit-slider-thumb]:h-6
            [&::-webkit-slider-thumb]:bg-emerald-500
            [&::-webkit-slider-thumb]:rounded-full
            [&::-webkit-slider-thumb]:cursor-pointer
            [&::-webkit-slider-thumb]:shadow-lg
            [&::-webkit-slider-thumb]:transition-transform
            [&::-webkit-slider-thumb]:hover:scale-110
          "
          style={{
            background: `linear-gradient(to right, #10b981 ${percentage}%, #e2e8f0 ${percentage}%)`
          }}
        />
      </div>

      {/* Labels */}
      {config.labels && (
        <div className="flex justify-between px-2">
          {config.labels.map((label) => (
            <span 
              key={label.value} 
              className={`text-sm ${localValue === label.value ? 'text-emerald-600 font-medium' : 'text-slate-500'}`}
            >
              {label.label}
            </span>
          ))}
        </div>
      )}
    </div>
  );
}

function RangeSelector({
  options,
  selected,
  onSelect
}: {
  options: RangeOption[];
  selected?: string;
  onSelect: (id: string) => void;
}) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
      {options.map((option) => (
        <button
          key={option.id}
          onClick={() => onSelect(option.id)}
          className={`
            p-4 rounded-xl border-2 text-center transition-all
            ${selected === option.id
              ? 'border-emerald-500 bg-emerald-50 dark:bg-emerald-900/20'
              : 'border-slate-200 dark:border-slate-700 hover:border-slate-300 dark:hover:border-slate-600 bg-white dark:bg-slate-800'
            }
          `}
        >
          <span className={`text-lg font-medium ${selected === option.id ? 'text-emerald-700 dark:text-emerald-300' : 'text-slate-700 dark:text-slate-300'}`}>
            {option.label}
          </span>
        </button>
      ))}
    </div>
  );
}

function YesNo({
  selected,
  onSelect
}: {
  selected?: string;
  onSelect: (id: string) => void;
}) {
  return (
    <div className="flex gap-4">
      <button
        onClick={() => onSelect('yes')}
        className={`
          flex-1 py-6 rounded-xl border-2 text-center text-xl font-semibold transition-all
          ${selected === 'yes'
            ? 'border-emerald-500 bg-emerald-50 dark:bg-emerald-900/20 text-emerald-700 dark:text-emerald-300'
            : 'border-slate-200 dark:border-slate-700 hover:border-slate-300 dark:hover:border-slate-600 bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300'
          }
        `}
      >
        Yes
      </button>
      <button
        onClick={() => onSelect('no')}
        className={`
          flex-1 py-6 rounded-xl border-2 text-center text-xl font-semibold transition-all
          ${selected === 'no'
            ? 'border-emerald-500 bg-emerald-50 dark:bg-emerald-900/20 text-emerald-700 dark:text-emerald-300'
            : 'border-slate-200 dark:border-slate-700 hover:border-slate-300 dark:hover:border-slate-600 bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300'
          }
        `}
      >
        No
      </button>
    </div>
  );
}
