import type { Chapter, ChapterSection, SectionContent } from "@/types/learn";

// ===========================================
// Chapter 1: Your Money Blueprint
// ===========================================

const chapter1: Chapter = {
  id: 1,
  title: "Your Money Blueprint",
  subtitle: "The foundation of wealth building",
  phase: "Foundation",
  phase_number: 1,
  estimated_time: "15 min",
  sections: [
    {
      id: 1,
      title: "The Game Nobody Taught You",
      content: [
        {
          type: "story",
          title: "Maya's Wake-Up Call",
          content:
            "Maya is 28 years old. She has $47 in her savings account, $23,000 in debt, and her car just got repossessed. She earns $55,000 a year — not a small salary — but has nothing to show for it. Standing in the rain, watching the tow truck drive away with her car, she realizes something has to change.",
        },
        {
          type: "text",
          content:
            "Maya isn't bad with money. She was never taught how money actually works. Like most people, she learned about history, science, and math in school — but nobody explained how to build wealth, avoid debt traps, or make money work for her instead of the other way around.",
        },
        {
          type: "myth_reality",
          myth: "Getting rich requires a high income. You need to make $200K+ to build real wealth.",
          reality:
            "Wealth is built by the gap between what you earn and what you spend — not by your income alone. Many high earners are broke, while modest earners become millionaires.",
          wealthy:
            "The wealthy focus on their savings rate, not their income. They live below their means and invest the difference consistently, regardless of how much they make.",
        },
        {
          type: "callout",
          variant: "key",
          title: "The wealth equation",
          content:
            "Wealth = (Income - Expenses) × Time × Returns. You control three of these variables. Most people only focus on income and ignore the others.",
        },
      ],
      mini_quiz: {
        id: "ch1_s1_quiz",
        questions: [
          {
            id: "ch1_s1_q1",
            type: "multiple_choice",
            question: "What determines wealth building more than income?",
            options: [
              "Your job title",
              "The gap between income and expenses",
              "Your credit score",
              "Where you live",
            ],
            correct_answer: 1,
            explanation:
              "The gap between what you earn and what you spend — your savings rate — is the primary driver of wealth building.",
          },
        ],
      },
    },
    {
      id: 2,
      title: "The Cashflow Quadrant",
      content: [
        {
          type: "story",
          title: "Meeting Alex",
          content:
            "At her lowest point, Maya runs into Alex — a 42-year-old who retired at 38. He doesn't look rich. No fancy car, no designer clothes. But he hasn't had a boss in four years. \"How?\" Maya asks. Alex smiles and draws a simple diagram on a napkin.",
        },
        {
          type: "text",
          content:
            "Alex explains the Cashflow Quadrant — a framework that shows there are four fundamentally different ways to earn money. Most people only know about one or two of them.",
        },
        {
          type: "comparison",
          left: {
            title: "Left Side (Time = Money)",
            subtitle: "Trade hours for dollars",
            items: [
              "E: Employee — Work for someone else",
              "S: Self-Employed — Work for yourself",
              "Income stops when you stop working",
              "Limited by hours in a day",
              "Highest tax rates",
            ],
            highlight: "negative",
          },
          right: {
            title: "Right Side (Money = Money)",
            subtitle: "Systems work for you",
            items: [
              "B: Business Owner — Systems work for you",
              "I: Investor — Money works for you",
              "Income continues without your time",
              "Unlimited scalability",
              "Lowest tax rates",
            ],
            highlight: "positive",
          },
        },
        {
          type: "callout",
          variant: "wealthy",
          title: "The wealthy mindset",
          content:
            "Rich people aren't smarter or luckier. They've learned to move from the left side of the quadrant (trading time for money) to the right side (building systems and investments that generate money without their constant involvement).",
        },
        {
          type: "text",
          content:
            "This doesn't mean you need to quit your job tomorrow. Maya certainly didn't. But understanding this framework changes how you think about every financial decision you make.",
        },
      ],
    },
    {
      id: 3,
      title: "Assets vs Liabilities",
      content: [
        {
          type: "story",
          title: "The Napkin Lesson Continues",
          content:
            "\"Here's the most important thing nobody taught you,\" Alex says, drawing two columns on the napkin. \"There are only two types of things you can buy: assets and liabilities. The rich buy assets. Everyone else buys liabilities thinking they're assets.\"",
        },
        {
          type: "myth_reality",
          myth: "My house is my biggest asset. Real estate is always a good investment.",
          reality:
            "Your primary residence costs you money every month — mortgage, taxes, insurance, maintenance. By the wealth-building definition, it's actually a liability unless it generates income.",
          wealthy:
            "The wealthy separate 'where they live' from 'wealth building.' They might own their home, but they don't count it as an asset. Their investments are separate.",
        },
        {
          type: "text",
          content:
            "This is the definition that changes everything:",
        },
        {
          type: "callout",
          variant: "key",
          title: "The simple test",
          content:
            "Assets put money IN your pocket. Liabilities take money OUT of your pocket. That's it. Apply this test to everything you own.",
        },
        {
          type: "list",
          title: "Examples of real assets:",
          items: [
            "Stocks and index funds (dividends + growth)",
            "Rental properties (rent income > expenses)",
            "Bonds (interest payments)",
            "A business that runs without you",
            "Intellectual property (royalties)",
          ],
        },
        {
          type: "list",
          title: "Things people think are assets (but aren't):",
          items: [
            "A car (loses value, costs insurance, gas, maintenance)",
            "Your primary home (mortgage, taxes, repairs)",
            "Expensive clothes or watches (lose value immediately)",
            "The latest phone (worth half in a year)",
          ],
        },
      ],
    },
    {
      id: 4,
      title: "Pay Yourself First",
      content: [
        {
          type: "story",
          title: "Maya's Aha Moment",
          content:
            "Maya looks at Alex's napkin drawing. \"But I can barely pay my bills. How am I supposed to save?\" Alex nods. \"That's what everyone says. They pay everyone else first — the landlord, the phone company, the credit card. Then they save whatever is 'left over.' There's never anything left over.\"",
        },
        {
          type: "text",
          content:
            "Pay Yourself First is the oldest wealth-building rule, and the one most people ignore. It means treating your savings like a bill — the first bill you pay, not the last.",
        },
        {
          type: "comparison",
          left: {
            title: "How most people do it",
            subtitle: "Save what's left",
            items: [
              "Get paycheck",
              "Pay rent",
              "Pay bills",
              "Buy groceries",
              "Go out, buy things",
              "\"I'll save what's left\"",
              "There's never anything left",
            ],
            highlight: "negative",
          },
          right: {
            title: "How the wealthy do it",
            subtitle: "Spend what's left",
            items: [
              "Get paycheck",
              "Automatically save 20%",
              "Pay rent",
              "Pay bills",
              "Buy groceries",
              "Spend what's left",
              "Savings grows every month",
            ],
            highlight: "positive",
          },
        },
        {
          type: "callout",
          variant: "tip",
          title: "Start with 10%",
          content:
            "If 20% feels impossible, start with 10%. Or 5%. Or even 1%. The amount matters less than building the habit. Automate it so it happens without thinking.",
        },
        {
          type: "formula",
          title: "The Pay Yourself First Formula",
          formula: "Savings = Income × Rate (automated on payday)",
          example:
            "$55,000 salary × 20% = $11,000/year = $917/month saved automatically",
        },
      ],
      mini_quiz: {
        id: "ch1_s4_quiz",
        questions: [
          {
            id: "ch1_s4_q1",
            type: "true_false",
            question: "You should save whatever is left after paying bills.",
            options: ["True", "False"],
            correct_answer: 1,
            explanation:
              "False! Pay Yourself First means saving BEFORE paying other expenses. Automate your savings so it happens on payday.",
          },
        ],
      },
    },
    {
      id: 5,
      title: "The Two Paths",
      content: [
        {
          type: "story",
          title: "Maya Makes a Choice",
          content:
            "Six months later, Maya has paid off one credit card and built a $1,000 emergency fund. It's not a lot, but it's more than she's ever had. She runs into her coworker Jordan, who just bought a new BMW. \"Nice car,\" Maya says. Jordan grins. \"Five-year loan, but totally worth it.\" Maya does the math in her head and stays quiet.",
        },
        {
          type: "text",
          content:
            "Maya and Jordan earn similar salaries. In 10 years, their financial lives will look completely different. Not because Maya got lucky or Jordan made a mistake — but because of small daily choices compounding over time.",
        },
        {
          type: "comparison",
          left: {
            title: "Jordan's Path",
            subtitle: "Looks rich now",
            items: [
              "Income: $65,000/year",
              "New BMW: $600/month payment",
              "Latest iPhone every year",
              "Designer clothes",
              "Nice apartment to impress others",
              "Saves: $200/month",
              "Net worth in 10 years: ~$50,000",
            ],
            highlight: "negative",
          },
          right: {
            title: "Maya's Path",
            subtitle: "Actually builds wealth",
            items: [
              "Income: $55,000/year (less than Jordan!)",
              "Used car: paid $8,000 cash",
              "Phone is 3 years old",
              "Clothes from Target",
              "Modest apartment",
              "Invests: $1,200/month",
              "Net worth in 10 years: ~$250,000",
            ],
            highlight: "positive",
          },
        },
        {
          type: "callout",
          variant: "warning",
          title: "The trap",
          content:
            "Jordan looks richer. Maya IS richer. In 10 years, Jordan is still working because he has to. Maya is working because she wants to. That's the difference between looking wealthy and being wealthy.",
        },
        {
          type: "text",
          content:
            "Every financial decision you make either moves you toward freedom or away from it. The BMW didn't just cost Jordan $40,000 — it cost him years of his life.",
        },
      ],
    },
    {
      id: 6,
      title: "Your First Steps",
      content: [
        {
          type: "text",
          content:
            "You've learned the foundational concepts. Now it's time to apply them. Here's what to do this week:",
        },
        {
          type: "callout",
          variant: "action",
          title: "Action item #1: Know your numbers",
          content:
            "Write down: 1) Your monthly income after taxes, 2) Your total monthly expenses, 3) The difference. This is your current savings rate. No judgment — just awareness.",
        },
        {
          type: "callout",
          variant: "action",
          title: "Action item #2: List your assets and liabilities",
          content:
            "Make two columns. Assets = things that put money in your pocket. Liabilities = things that take money out. Be honest. Your car is probably a liability.",
        },
        {
          type: "callout",
          variant: "action",
          title: "Action item #3: Automate one small savings",
          content:
            "Set up an automatic transfer of even $50/month to a savings account. The amount doesn't matter yet. Building the habit matters.",
        },
        {
          type: "callout",
          variant: "key",
          title: "Key takeaways from this chapter",
          content:
            "• Wealth = (Income - Expenses) × Time × Returns\n• Move from trading time for money to building assets\n• Assets put money in your pocket, liabilities take it out\n• Pay yourself first — automate your savings\n• Looking rich and being rich are opposite paths",
        },
        {
          type: "text",
          content:
            "In the next chapter, you'll learn how to set up a banking system that makes building wealth automatic. Maya is just getting started — and so are you.",
        },
      ],
    },
  ],
  final_quiz: [
    {
      id: "ch1_final_1",
      type: "multiple_choice",
      question:
        "According to the Cashflow Quadrant, which position offers the most potential for passive income?",
      options: [
        "Employee (E)",
        "Self-Employed (S)",
        "Business Owner (B)",
        "Investor (I)",
      ],
      correct_answer: 3,
      explanation:
        "The Investor (I) quadrant offers the most potential for passive income, as your money works for you without requiring your direct time and effort.",
    },
    {
      id: "ch1_final_2",
      type: "multiple_choice",
      question: "What is the difference between an asset and a liability?",
      options: [
        "Assets are expensive, liabilities are cheap",
        "Assets put money in your pocket, liabilities take money out",
        "Assets are things you own, liabilities are things you owe",
        "There is no difference",
      ],
      correct_answer: 1,
      explanation:
        "In terms of building wealth, assets put money in your pocket (generate income or appreciate), while liabilities take money out (cost you money over time).",
    },
    {
      id: "ch1_final_3",
      type: "true_false",
      question:
        "Your primary residence is always considered an asset for wealth building.",
      options: ["True", "False"],
      correct_answer: 1,
      explanation:
        "False! While your home has value, it costs you money through mortgage payments, taxes, maintenance, and insurance. Unless it generates income, it functions more like a liability in terms of cash flow.",
    },
    {
      id: "ch1_final_4",
      type: "multiple_choice",
      question: "What does 'Pay Yourself First' mean?",
      options: [
        "Spend money on yourself before paying bills",
        "Save/invest a portion before paying any expenses",
        "Pay off your debt before saving",
        "Buy what you want first",
      ],
      correct_answer: 1,
      explanation:
        "Pay Yourself First means automatically saving or investing a portion of your income as soon as you get paid, before paying for expenses or discretionary spending.",
    },
    {
      id: "ch1_final_5",
      type: "multiple_choice",
      question:
        "In the Maya vs Jordan comparison, why will Maya likely be wealthier in 10 years despite earning less?",
      options: [
        "She got lucky with investments",
        "Her savings rate is much higher",
        "She inherited money",
        "Jordan made bad investment choices",
      ],
      correct_answer: 1,
      explanation:
        "Maya's higher savings rate — investing $1,200/month vs Jordan's $200/month — will compound over time. Savings rate matters more than income.",
    },
  ],
};

// ===========================================
// All Chapters (Placeholder structure for 2-14)
// ===========================================

const chapters: Chapter[] = [
  chapter1,
  // Chapters 2-14 will be added with similar structure
  // For now, create placeholder chapters
  ...Array.from({ length: 13 }, (_, i) => ({
    id: i + 2,
    title: getChapterTitle(i + 2),
    subtitle: getChapterSubtitle(i + 2),
    phase: getChapterPhase(i + 2),
    phase_number: getChapterPhaseNumber(i + 2),
    estimated_time: "15 min",
    sections: [
      {
        id: 1,
        title: "Coming Soon",
        content: [
          {
            type: "text" as const,
            content: `This chapter is being written. Check back soon for the full content about ${getChapterTitle(i + 2).toLowerCase()}.`,
          },
        ],
      },
    ],
    final_quiz: [],
  })),
];

// Helper functions for placeholder chapters
function getChapterTitle(id: number): string {
  const titles: Record<number, string> = {
    2: "Banking & Saving Smartly",
    3: "Conquering Debt",
    4: "Your Financial Safety Net",
    5: "The Eighth Wonder of the World",
    6: "Stock Market Demystified",
    7: "Investment Vehicles & Accounts",
    8: "Tax Fundamentals",
    9: "Tax Strategies of the Wealthy",
    10: "Building Income Streams",
    11: "Understanding FIRE",
    12: "Calculate Your FIRE Number",
    13: "Your FIRE Investment Strategy",
    14: "Executing Your FIRE Plan",
  };
  return titles[id] || `Chapter ${id}`;
}

function getChapterSubtitle(id: number): string {
  const subtitles: Record<number, string> = {
    2: "Optimize your banking setup",
    3: "Break free from debt cycles",
    4: "Build your financial fortress",
    5: "The power of compound interest",
    6: "How markets actually work",
    7: "Where to put your money",
    8: "Understanding the tax system",
    9: "Keep more of what you earn",
    10: "Create multiple income sources",
    11: "What FIRE really means",
    12: "Your freedom number",
    13: "Portfolio for early retirement",
    14: "Make your plan a reality",
  };
  return subtitles[id] || "";
}

function getChapterPhase(id: number): string {
  if (id <= 3) return "Foundation";
  if (id === 4) return "Protection";
  if (id <= 7) return "Investing";
  if (id <= 10) return "Optimization";
  return "FIRE Path";
}

function getChapterPhaseNumber(id: number): number {
  if (id <= 3) return 1;
  if (id === 4) return 2;
  if (id <= 7) return 3;
  if (id <= 10) return 4;
  return 5;
}

// ===========================================
// Export Functions
// ===========================================

export function getChapterById(id: number): Chapter | undefined {
  return chapters.find((chapter) => chapter.id === id);
}

export function getAllChapters(): Chapter[] {
  return chapters;
}

export function getChapterSections(chapterId: number): ChapterSection[] {
  const chapter = getChapterById(chapterId);
  return chapter?.sections || [];
}

export function getTotalChapters(): number {
  return chapters.length;
}

export { chapters };
