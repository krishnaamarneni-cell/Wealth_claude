// ============================================================================
// TEST 4: MONEY MINDSET
// 10 Questions | ~2 minutes | OPTIONAL
// Covers: Money Wellness (deeper), Future Orientation (deeper)
// ============================================================================

import { Question, TestId } from './types';

const TEST_ID: TestId = 'money_mindset';

export const moneyMindsetQuestions: Question[] = [
  // ----------------------------------------------------------------------------
  // MONEY ANXIETY & EMOTIONS (Questions 1-4)
  // ----------------------------------------------------------------------------
  {
    id: 'mm_01',
    testId: TEST_ID,
    text: '"Thinking about money makes me anxious."',
    type: 'agree_scale',
    category: 'Money Emotions',
    factors: ['money_wellness'],
    weight: 3,
    required: true,
    options: [
      { id: 'a', text: 'Strongly Disagree', value: 100 },
      { id: 'b', text: 'Disagree', value: 75 },
      { id: 'c', text: 'Neutral', value: 50 },
      { id: 'd', text: 'Agree', value: 25 },
      { id: 'e', text: 'Strongly Agree', value: 0 }
    ]
  },
  {
    id: 'mm_02',
    testId: TEST_ID,
    text: 'How often do you worry about money?',
    type: 'multiple_choice',
    category: 'Money Emotions',
    factors: ['money_wellness'],
    weight: 2,
    required: true,
    options: [
      { id: 'a', text: 'Rarely or never', value: 100 },
      { id: 'b', text: 'Occasionally, but I manage it', value: 75 },
      { id: 'c', text: 'Sometimes, especially before big expenses', value: 55 },
      { id: 'd', text: 'Often, it\'s frequently on my mind', value: 30 },
      { id: 'e', text: 'Constantly, it causes me significant stress', value: 0 }
    ]
  },
  {
    id: 'mm_03',
    testId: TEST_ID,
    text: 'When an unexpected expense comes up (car repair, medical bill), you typically:',
    type: 'multiple_choice',
    category: 'Money Emotions',
    factors: ['money_wellness', 'emergency_preparedness'],
    weight: 2,
    required: true,
    options: [
      { id: 'a', text: 'Handle it calmly - I have funds set aside', value: 100 },
      { id: 'b', text: 'Feel slightly stressed but manage it', value: 70 },
      { id: 'c', text: 'Get worried about how to pay for it', value: 40 },
      { id: 'd', text: 'Panic and stress significantly', value: 15 },
      { id: 'e', text: 'Go into crisis mode - it could ruin me', value: 0 }
    ]
  },
  {
    id: 'mm_04',
    testId: TEST_ID,
    text: '"I avoid checking my bills or financial statements."',
    type: 'agree_scale',
    category: 'Money Emotions',
    factors: ['money_wellness', 'financial_planning'],
    weight: 2,
    required: true,
    options: [
      { id: 'a', text: 'Strongly Disagree', value: 100 },
      { id: 'b', text: 'Disagree', value: 75 },
      { id: 'c', text: 'Neutral', value: 50 },
      { id: 'd', text: 'Agree', value: 25 },
      { id: 'e', text: 'Strongly Agree', value: 0 }
    ]
  },

  // ----------------------------------------------------------------------------
  // MONEY BELIEFS & SCARCITY/ABUNDANCE (Questions 5-7)
  // ----------------------------------------------------------------------------
  {
    id: 'mm_05',
    testId: TEST_ID,
    text: 'Growing up, money was discussed in your family as:',
    type: 'multiple_choice',
    category: 'Money Beliefs',
    factors: ['money_wellness'],
    weight: 1,
    required: true,
    options: [
      { id: 'a', text: 'A positive tool - we learned to manage it well', value: 90 },
      { id: 'b', text: 'Normal topic - discussed openly and practically', value: 80 },
      { id: 'c', text: 'Neutral - not discussed much', value: 50 },
      { id: 'd', text: 'Stressful - often caused arguments or worry', value: 25 },
      { id: 'e', text: 'Taboo - never discussed, felt shameful', value: 15 }
    ]
  },
  {
    id: 'mm_06',
    testId: TEST_ID,
    text: '"There will never be enough money, no matter how much I earn."',
    type: 'agree_scale',
    category: 'Money Beliefs',
    factors: ['money_wellness', 'future_orientation'],
    weight: 2,
    required: true,
    options: [
      { id: 'a', text: 'Strongly Disagree', value: 100 },
      { id: 'b', text: 'Disagree', value: 75 },
      { id: 'c', text: 'Neutral', value: 50 },
      { id: 'd', text: 'Agree', value: 25 },
      { id: 'e', text: 'Strongly Agree', value: 0 }
    ]
  },
  {
    id: 'mm_07',
    testId: TEST_ID,
    text: 'Which statement resonates with you most?',
    type: 'multiple_choice',
    category: 'Money Beliefs',
    factors: ['money_wellness', 'spending_control'],
    weight: 2,
    required: true,
    options: [
      { id: 'a', text: 'I have more than enough - abundance is my reality', value: 100 },
      { id: 'b', text: 'I have what I need and can create more', value: 80 },
      { id: 'c', text: 'I\'m doing okay, but always a bit worried', value: 50 },
      { id: 'd', text: 'I never have enough - I\'m always behind', value: 20 },
      { id: 'e', text: 'Money slips through my fingers - I can\'t hold onto it', value: 5 }
    ]
  },

  // ----------------------------------------------------------------------------
  // CONFIDENCE & SELF-EFFICACY (Questions 8-10)
  // ----------------------------------------------------------------------------
  {
    id: 'mm_08',
    testId: TEST_ID,
    text: 'How confident are you in your ability to manage money well?',
    type: 'slider',
    category: 'Confidence',
    factors: ['money_wellness', 'financial_literacy'],
    weight: 2,
    required: true,
    sliderConfig: {
      min: 0,
      max: 100,
      step: 10,
      labels: [
        { value: 0, label: 'Not confident at all' },
        { value: 50, label: 'Somewhat confident' },
        { value: 100, label: 'Very confident' }
      ]
    }
  },
  {
    id: 'mm_09',
    testId: TEST_ID,
    text: '"I believe I can achieve my financial goals."',
    type: 'agree_scale',
    category: 'Confidence',
    factors: ['money_wellness', 'future_orientation'],
    weight: 2,
    required: true,
    options: [
      { id: 'a', text: 'Strongly Agree', value: 100 },
      { id: 'b', text: 'Agree', value: 75 },
      { id: 'c', text: 'Neutral', value: 50 },
      { id: 'd', text: 'Disagree', value: 25 },
      { id: 'e', text: 'Strongly Disagree', value: 0 }
    ]
  },
  {
    id: 'mm_10',
    testId: TEST_ID,
    text: 'When it comes to improving my finances, I feel:',
    type: 'multiple_choice',
    category: 'Confidence',
    factors: ['money_wellness', 'financial_planning'],
    weight: 2,
    required: true,
    options: [
      { id: 'a', text: 'Empowered - I know what to do and I\'m doing it', value: 100 },
      { id: 'b', text: 'Motivated - I have a plan and I\'m working on it', value: 80 },
      { id: 'c', text: 'Hopeful - I want to improve and I\'m learning', value: 60 },
      { id: 'd', text: 'Overwhelmed - I don\'t know where to start', value: 30 },
      { id: 'e', text: 'Hopeless - Nothing I do seems to help', value: 5 }
    ]
  }
];

export default moneyMindsetQuestions;
