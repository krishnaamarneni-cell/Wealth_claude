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
// Chapter 2: Banking & Saving Smartly
// ===========================================

const chapter2: Chapter = {
  id: 2,
  title: "Banking & Saving Smartly",
  subtitle: "Optimize your banking setup",
  phase: "Foundation",
  phase_number: 1,
  estimated_time: "12 min",
  sections: [
    {
      id: 1,
      title: "The Banking System Nobody Explains",
      content: [
        {
          type: "story",
          title: "Maya's Banking Wake-Up",
          content:
            "Maya checks her bank statement and notices something strange: she's paid $144 in fees this year. Overdraft fees, maintenance fees, ATM fees. 'I'm literally paying the bank to hold my money,' she realizes. Alex had mentioned this. 'Banks make billions from people who don't understand how the system works. Time to flip the script.'",
        },
        {
          type: "myth_reality",
          myth: "All banks are basically the same. Just pick one with a branch near you.",
          reality:
            "Banks vary wildly in fees, interest rates, and features. The difference between a bad bank and a good one can cost you thousands over your lifetime.",
          wealthy:
            "The wealthy use multiple accounts strategically — high-yield savings for cash reserves, checking with no fees for daily spending, and often credit unions or online banks for better rates.",
        },
        {
          type: "callout",
          variant: "key",
          title: "The three-account system",
          content:
            "Most wealthy people use at least three accounts: (1) Checking for bills and daily spending, (2) High-yield savings for emergency fund, (3) Investment accounts for wealth building. This separation creates automatic money management.",
        },
      ],
    },
    {
      id: 2,
      title: "High-Yield Savings Accounts",
      content: [
        {
          type: "text",
          content:
            "Traditional banks pay around 0.01% interest on savings. That means $10,000 earns you... $1 per year. Meanwhile, online high-yield savings accounts pay 4-5% — that same $10,000 earns $400-500 per year.",
        },
        {
          type: "comparison",
          left: {
            title: "Traditional Bank Savings",
            subtitle: "Big banks with branches",
            items: [
              "0.01% - 0.05% APY",
              "$10,000 earns ~$1-5/year",
              "Physical branches available",
              "Often requires minimum balance",
              "May charge monthly fees",
            ],
            highlight: "negative",
          },
          right: {
            title: "High-Yield Savings",
            subtitle: "Online banks",
            items: [
              "4% - 5% APY (100x more)",
              "$10,000 earns ~$400-500/year",
              "Online/app only",
              "Usually no minimums",
              "Typically no fees",
            ],
            highlight: "positive",
          },
        },
        {
          type: "callout",
          variant: "tip",
          title: "Top high-yield options",
          content:
            "Look for FDIC-insured online banks offering 4%+ APY. Popular options include Marcus by Goldman Sachs, Ally Bank, and Discover Savings. Rates change, so compare before opening.",
        },
        {
          type: "callout",
          variant: "wealthy",
          content:
            "The wealthy never leave large cash balances in traditional savings accounts. Every dollar not invested should at minimum be earning high-yield interest. It's free money.",
        },
      ],
      mini_quiz: {
        id: "ch2_s2_quiz",
        questions: [
          {
            id: "ch2_s2_q1",
            type: "multiple_choice",
            question: "How much more interest does a high-yield savings account typically pay compared to a traditional bank?",
            options: ["2x more", "10x more", "100x more", "About the same"],
            correct_answer: 2,
            explanation:
              "High-yield accounts often pay 100x more — 4-5% vs 0.01-0.05% at traditional banks.",
          },
        ],
      },
    },
    {
      id: 3,
      title: "Automating Your Money",
      content: [
        {
          type: "story",
          title: "Maya Sets Up Her System",
          content:
            "Maya spends a Sunday afternoon setting up automatic transfers. Every payday, money flows automatically: 20% to savings, fixed amounts to each bill, and whatever's left stays in checking for spending. 'I don't have to think about it anymore,' she tells Alex. 'The system does it for me.'",
        },
        {
          type: "text",
          content:
            "Automation is the secret weapon of wealth building. When saving and investing happen automatically, you remove willpower from the equation. You can't spend what you never see.",
        },
        {
          type: "list",
          title: "The automation stack:",
          ordered: true,
          items: [
            "Direct deposit splits paycheck (most employers allow this)",
            "Auto-transfer to high-yield savings on payday",
            "Auto-transfer to investment accounts on payday",
            "Auto-pay for all fixed bills (rent, utilities, subscriptions)",
            "What's left in checking = spending money",
          ],
        },
        {
          type: "callout",
          variant: "action",
          title: "Set this up today",
          content:
            "Log into your bank and set up at least one automatic transfer to savings. Even $50/month is a start. The habit matters more than the amount.",
        },
      ],
    },
    {
      id: 4,
      title: "Avoiding Bank Fees",
      content: [
        {
          type: "text",
          content:
            "Americans pay over $12 billion in overdraft fees alone each year. Add maintenance fees, ATM fees, and wire fees, and banks extract massive profits from customers who don't know the rules.",
        },
        {
          type: "myth_reality",
          myth: "Bank fees are unavoidable — it's just the cost of having an account.",
          reality:
            "Almost every bank fee is avoidable. Many banks offer fee-free accounts, and most fees can be waived if you know to ask.",
          wealthy:
            "The wealthy often pay zero bank fees. They use banks that don't charge them, maintain minimum balances where required, and negotiate fee waivers when charges slip through.",
        },
        {
          type: "list",
          title: "How to eliminate bank fees:",
          items: [
            "Switch to a no-fee checking account (Schwab, Fidelity, many credit unions)",
            "Set up low-balance alerts to avoid overdrafts",
            "Use in-network ATMs or get ATM fee reimbursement",
            "Call and ask for fee waivers — banks often say yes",
            "Link accounts for overdraft protection from savings",
          ],
        },
        {
          type: "callout",
          variant: "warning",
          title: "The overdraft trap",
          content:
            "A $5 coffee that triggers a $35 overdraft fee is now a $40 coffee. One overdraft often leads to a cascade. Set up alerts and keep a buffer in checking.",
        },
      ],
    },
    {
      id: 5,
      title: "Your Banking Action Plan",
      content: [
        {
          type: "text",
          content:
            "Maya's new banking setup saves her over $500/year in fees and earns her $300+ in interest — an $800 swing from just optimizing where her money sits.",
        },
        {
          type: "callout",
          variant: "action",
          title: "This week's actions",
          content:
            "1. Review your last 3 months of bank statements for fees\n2. Research high-yield savings accounts (aim for 4%+ APY)\n3. Set up automatic transfers to savings\n4. Enable low-balance alerts on your checking account",
        },
        {
          type: "callout",
          variant: "key",
          title: "Chapter takeaways",
          content:
            "• Use the three-account system: checking, high-yield savings, investments\n• High-yield savings pays 100x more than traditional banks\n• Automate everything — remove willpower from saving\n• Bank fees are optional — eliminate them completely",
        },
      ],
    },
  ],
  final_quiz: [
    {
      id: "ch2_final_1",
      type: "multiple_choice",
      question: "What is a typical APY for a high-yield savings account?",
      options: ["0.01%", "0.5%", "4-5%", "10-15%"],
      correct_answer: 2,
      explanation:
        "High-yield savings accounts typically offer 4-5% APY, about 100x more than traditional bank savings rates.",
    },
    {
      id: "ch2_final_2",
      type: "multiple_choice",
      question: "What is the main benefit of automating your savings?",
      options: [
        "It earns more interest",
        "It removes willpower from the equation",
        "Banks give you a bonus",
        "It's required by law",
      ],
      correct_answer: 1,
      explanation:
        "Automation removes willpower from saving — you can't spend what you never see in your checking account.",
    },
    {
      id: "ch2_final_3",
      type: "true_false",
      question: "Most bank fees are unavoidable costs of having an account.",
      options: ["True", "False"],
      correct_answer: 1,
      explanation:
        "False! Almost every bank fee is avoidable by choosing the right bank, maintaining balances, or simply asking for waivers.",
    },
    {
      id: "ch2_final_4",
      type: "multiple_choice",
      question: "What is the 'three-account system'?",
      options: [
        "Checking, savings, credit card",
        "Checking, high-yield savings, investments",
        "Personal, business, joint accounts",
        "Savings at three different banks",
      ],
      correct_answer: 1,
      explanation:
        "The three-account system separates money into checking (spending), high-yield savings (emergency fund), and investment accounts (wealth building).",
    },
    {
      id: "ch2_final_5",
      type: "multiple_choice",
      question: "When should automatic transfers to savings happen?",
      options: [
        "At the end of the month",
        "When you have extra money",
        "On payday, before spending",
        "Once a year",
      ],
      correct_answer: 2,
      explanation:
        "Pay yourself first — automatic transfers should happen on payday, before you have a chance to spend the money.",
    },
  ],
};

// ===========================================
// Chapter 3: Conquering Debt
// ===========================================

const chapter3: Chapter = {
  id: 3,
  title: "Conquering Debt",
  subtitle: "Break free from debt cycles",
  phase: "Foundation",
  phase_number: 1,
  estimated_time: "15 min",
  sections: [
    {
      id: 1,
      title: "Understanding the Debt Machine",
      content: [
        {
          type: "story",
          title: "Maya Faces Her Debt",
          content:
            "Maya finally tallies up everything she owes: $8,000 on credit cards, $12,000 on her car loan, $3,000 in old medical bills. $23,000 total. Looking at the minimum payments, she realizes at this rate she'll be paying for 15+ years. 'This is designed to keep me trapped,' she thinks.",
        },
        {
          type: "text",
          content:
            "Debt isn't just money you owe — it's future income you've already spent. Every dollar going to debt payments is a dollar that can't be invested, can't build wealth, can't buy freedom.",
        },
        {
          type: "myth_reality",
          myth: "Some debt is good. You need debt to build credit and get ahead.",
          reality:
            "There's 'useful' debt (low-interest, for appreciating assets) and 'destructive' debt (high-interest, for depreciating assets or consumption). Most consumer debt is destructive.",
          wealthy:
            "The wealthy use debt strategically — low-interest loans for investments that return more than the interest cost. They never carry high-interest consumer debt.",
        },
        {
          type: "callout",
          variant: "key",
          title: "The debt spectrum",
          content:
            "Destructive (avoid): Credit cards, payday loans, car loans on new cars. Neutral (minimize): Student loans, reasonable car loans. Potentially useful (strategic): Low-rate mortgages, business loans, investment margin.",
        },
      ],
    },
    {
      id: 2,
      title: "The True Cost of Debt",
      content: [
        {
          type: "text",
          content:
            "Credit card companies don't want you to understand compound interest — but in reverse. When you carry a balance, interest compounds against you, making purchases cost 2-3x their original price.",
        },
        {
          type: "formula",
          title: "The real cost of that purchase",
          formula: "True Cost = Purchase × (1 + Interest Rate)^Years",
          example:
            "A $1,000 TV on a 22% APR card, paying minimums: ~$1,800 over 7 years. You paid almost double.",
        },
        {
          type: "comparison",
          left: {
            title: "$5,000 Credit Card Debt",
            subtitle: "At 22% APR, minimum payments",
            items: [
              "Monthly payment: ~$100",
              "Time to pay off: 9+ years",
              "Total interest paid: ~$6,500",
              "Total paid: ~$11,500",
              "That's 2.3x the original debt",
            ],
            highlight: "negative",
          },
          right: {
            title: "$5,000 Invested Instead",
            subtitle: "At 10% average return",
            items: [
              "After 9 years: ~$11,800",
              "You gained $6,800",
              "Money working FOR you",
              "Compound interest in your favor",
              "Freedom, not bondage",
            ],
            highlight: "positive",
          },
        },
        {
          type: "callout",
          variant: "warning",
          title: "The minimum payment trap",
          content:
            "Minimum payments are designed to maximize interest paid. Credit card companies want you to pay the minimum forever. That's how they make billions.",
        },
      ],
      mini_quiz: {
        id: "ch3_s2_quiz",
        questions: [
          {
            id: "ch3_s2_q1",
            type: "multiple_choice",
            question: "If you pay only minimums on credit card debt, how much might you end up paying total?",
            options: [
              "About the same as the original debt",
              "1.5x the original debt",
              "2-3x the original debt",
              "Exactly the minimum payment amount",
            ],
            correct_answer: 2,
            explanation:
              "Minimum payments stretch debt for years, causing you to pay 2-3x the original amount in total.",
          },
        ],
      },
    },
    {
      id: 3,
      title: "Debt Payoff Strategies",
      content: [
        {
          type: "text",
          content:
            "There are two proven strategies for paying off debt: the Avalanche (mathematically optimal) and the Snowball (psychologically powerful). Both work — pick the one you'll actually stick with.",
        },
        {
          type: "comparison",
          left: {
            title: "Debt Avalanche",
            subtitle: "Highest interest first",
            items: [
              "List debts by interest rate (highest first)",
              "Pay minimums on all debts",
              "Put extra money toward highest-rate debt",
              "When paid off, move to next highest",
              "Saves the most money mathematically",
            ],
            highlight: "positive",
          },
          right: {
            title: "Debt Snowball",
            subtitle: "Smallest balance first",
            items: [
              "List debts by balance (smallest first)",
              "Pay minimums on all debts",
              "Put extra money toward smallest debt",
              "When paid off, move to next smallest",
              "Quick wins build momentum",
            ],
            highlight: "positive",
          },
        },
        {
          type: "callout",
          variant: "wealthy",
          content:
            "The wealthy focus on the Avalanche method because they're optimizing for total dollars saved. But if you've struggled with debt before, the Snowball's psychological wins might keep you on track.",
        },
        {
          type: "callout",
          variant: "tip",
          title: "The hybrid approach",
          content:
            "Start with one quick Snowball win to build confidence, then switch to Avalanche for maximum savings. Best of both worlds.",
        },
      ],
    },
    {
      id: 4,
      title: "Accelerating Debt Payoff",
      content: [
        {
          type: "story",
          title: "Maya Gets Aggressive",
          content:
            "Maya decides to throw everything at her debt. She cancels two streaming services ($30), stops eating out for a month ($200), and sells old electronics ($150). That's $380 extra toward debt this month alone. 'If I can do this for a year, I'll be free.'",
        },
        {
          type: "list",
          title: "Ways to find extra money for debt:",
          items: [
            "Cancel subscriptions you don't use",
            "Sell items you no longer need",
            "Pick up a side gig temporarily",
            "Redirect windfalls (tax refunds, bonuses) to debt",
            "Negotiate lower rates on current debts",
            "Consider balance transfer cards (0% intro APR)",
          ],
        },
        {
          type: "callout",
          variant: "action",
          title: "The debt sprint",
          content:
            "For 3-6 months, go into 'sprint mode' — cut everything non-essential and throw it all at debt. This isn't forever. It's a focused push to break free faster.",
        },
        {
          type: "formula",
          title: "The payoff accelerator",
          formula: "Time Saved = Extra Payment ÷ (Interest Rate × Balance)",
          example:
            "An extra $200/month on a $5,000 card at 22% APR cuts payoff time from 9 years to under 2 years.",
        },
      ],
    },
    {
      id: 5,
      title: "Staying Debt-Free",
      content: [
        {
          type: "text",
          content:
            "Paying off debt is only half the battle. The real victory is never going back. This requires changing the behaviors and systems that led to debt in the first place.",
        },
        {
          type: "myth_reality",
          myth: "Once debt is paid off, you've solved the problem.",
          reality:
            "Without changing underlying habits, 70% of people who pay off credit card debt accumulate new debt within two years.",
          wealthy:
            "The wealthy create systems that make debt nearly impossible: automatic savings, spending from what's left, and using credit cards only for rewards (paid in full monthly).",
        },
        {
          type: "list",
          title: "The debt-proof system:",
          items: [
            "Build a 1-month expense buffer in checking",
            "Automate savings before you can spend",
            "Use cash or debit for discretionary spending",
            "If using credit cards, pay statement balance in full",
            "Delete saved card info from shopping sites",
            "Wait 48 hours before any purchase over $100",
          ],
        },
        {
          type: "callout",
          variant: "key",
          title: "Chapter takeaways",
          content:
            "• Debt is future income already spent — it steals your freedom\n• Minimum payments are designed to keep you trapped\n• Use Avalanche (math) or Snowball (psychology) to pay off debt\n• Sprint aggressively for 3-6 months to break free faster\n• Build systems to stay debt-free permanently",
        },
      ],
    },
  ],
  final_quiz: [
    {
      id: "ch3_final_1",
      type: "multiple_choice",
      question: "What is the Debt Avalanche method?",
      options: [
        "Paying off smallest debts first",
        "Paying off highest interest rate debts first",
        "Paying all debts equally",
        "Only paying minimum payments",
      ],
      correct_answer: 1,
      explanation:
        "The Debt Avalanche method targets the highest interest rate debts first, saving the most money mathematically.",
    },
    {
      id: "ch3_final_2",
      type: "multiple_choice",
      question: "Why are minimum payments dangerous?",
      options: [
        "They're too high",
        "They're designed to maximize interest paid over time",
        "Banks don't accept them",
        "They hurt your credit score",
      ],
      correct_answer: 1,
      explanation:
        "Minimum payments are designed to stretch debt for years, maximizing the interest you pay to the credit card company.",
    },
    {
      id: "ch3_final_3",
      type: "true_false",
      question: "Once debt is paid off, most people stay debt-free permanently.",
      options: ["True", "False"],
      correct_answer: 1,
      explanation:
        "False! About 70% of people who pay off credit card debt accumulate new debt within two years without changing underlying systems and habits.",
    },
    {
      id: "ch3_final_4",
      type: "multiple_choice",
      question: "What is 'useful' debt?",
      options: [
        "Any debt with a low minimum payment",
        "Credit card debt with rewards",
        "Low-interest debt for appreciating assets or investments",
        "Debt that's been consolidated",
      ],
      correct_answer: 2,
      explanation:
        "Useful debt is low-interest borrowing for things that appreciate in value or generate returns greater than the interest cost.",
    },
    {
      id: "ch3_final_5",
      type: "multiple_choice",
      question: "What is the 'debt sprint' concept?",
      options: [
        "Running away from creditors",
        "A 3-6 month aggressive push to pay off debt faster",
        "Only paying the fastest-accumulating debt",
        "A government debt relief program",
      ],
      correct_answer: 1,
      explanation:
        "A debt sprint is a focused 3-6 month period where you cut non-essentials and throw everything extra at debt to break free faster.",
    },
  ],
};

// ===========================================
// Chapter 4: Your Financial Safety Net
// ===========================================

const chapter4: Chapter = {
  id: 4,
  title: "Your Financial Safety Net",
  subtitle: "Build your financial fortress",
  phase: "Protection",
  phase_number: 2,
  estimated_time: "12 min",
  sections: [
    {
      id: 1,
      title: "Why Emergencies Derail Wealth",
      content: [
        {
          type: "story",
          title: "Maya's Close Call",
          content:
            "Three months into her debt payoff sprint, Maya's car breaks down. The repair: $1,200. Before, this would have gone on a credit card, adding more debt. But Maya has been building her emergency fund. She pays cash, doesn't miss a beat on her debt payments, and realizes: 'This is what financial security feels like.'",
        },
        {
          type: "text",
          content:
            "An emergency fund isn't just nice to have — it's the foundation that makes all other financial progress possible. Without it, every unexpected expense becomes a debt spiral.",
        },
        {
          type: "myth_reality",
          myth: "I can't afford to save for emergencies while paying off debt.",
          reality:
            "You can't afford NOT to. Without an emergency fund, every surprise expense goes on credit cards, undoing your debt progress. A small buffer prevents this cycle.",
          wealthy:
            "The wealthy always maintain significant cash reserves — typically 6-12 months of expenses. They never put themselves in a position where an emergency forces them into bad financial decisions.",
        },
      ],
    },
    {
      id: 2,
      title: "Building Your Emergency Fund",
      content: [
        {
          type: "text",
          content:
            "Your emergency fund should be built in stages. Start with a starter fund, then build to full coverage once high-interest debt is paid off.",
        },
        {
          type: "list",
          title: "Emergency fund stages:",
          ordered: true,
          items: [
            "Starter fund: $1,000-2,000 (covers most common emergencies)",
            "Basic fund: 1 month of expenses (job loss buffer)",
            "Standard fund: 3 months of expenses (most situations)",
            "Full fund: 6 months of expenses (recommended target)",
            "Extended fund: 12+ months (if self-employed or variable income)",
          ],
        },
        {
          type: "callout",
          variant: "tip",
          title: "Where to keep it",
          content:
            "Keep your emergency fund in a high-yield savings account — accessible within 1-2 days but not so easy that you're tempted to dip into it. Never invest emergency funds in the stock market.",
        },
        {
          type: "formula",
          title: "Calculate your number",
          formula: "Monthly Expenses × Months of Coverage = Target Fund",
          example:
            "If your monthly expenses are $3,500 and you want 3 months coverage: $3,500 × 3 = $10,500 target.",
        },
      ],
      mini_quiz: {
        id: "ch4_s2_quiz",
        questions: [
          {
            id: "ch4_s2_q1",
            type: "multiple_choice",
            question: "What is the recommended full emergency fund target?",
            options: [
              "$1,000",
              "1 month of expenses",
              "6 months of expenses",
              "1 year of income",
            ],
            correct_answer: 2,
            explanation:
              "The recommended full emergency fund is 6 months of expenses, providing a solid buffer for most situations including job loss.",
          },
        ],
      },
    },
    {
      id: 3,
      title: "What Counts as an Emergency",
      content: [
        {
          type: "text",
          content:
            "The biggest threat to your emergency fund is... you. It's tempting to raid it for things that feel urgent but aren't true emergencies. Clear rules protect your safety net.",
        },
        {
          type: "comparison",
          left: {
            title: "Real Emergencies",
            subtitle: "Use your fund for these",
            items: [
              "Job loss or income reduction",
              "Medical emergencies",
              "Essential car repairs",
              "Critical home repairs (heating, plumbing)",
              "Emergency travel for family crisis",
            ],
            highlight: "positive",
          },
          right: {
            title: "Not Emergencies",
            subtitle: "Don't touch the fund",
            items: [
              "Sales or 'good deals'",
              "Vacations (even 'needed' ones)",
              "Holiday gifts",
              "New phone (unless truly broken)",
              "Predictable expenses you forgot to budget",
            ],
            highlight: "negative",
          },
        },
        {
          type: "callout",
          variant: "wealthy",
          content:
            "The wealthy treat their emergency fund as untouchable — like it doesn't exist. They'd rather find another way than break the seal on their safety net. This discipline is why they stay wealthy.",
        },
      ],
    },
    {
      id: 4,
      title: "Insurance: Protecting Against Catastrophe",
      content: [
        {
          type: "text",
          content:
            "Emergency funds handle small surprises. Insurance handles catastrophes — the events that could wipe out years of financial progress in a single blow.",
        },
        {
          type: "list",
          title: "Essential insurance coverage:",
          items: [
            "Health insurance: One major illness without it can mean bankruptcy",
            "Auto insurance: Required by law, but ensure adequate liability coverage",
            "Renters/homeowners insurance: Protects your possessions and liability",
            "Disability insurance: Protects your ability to earn (often overlooked)",
            "Term life insurance: If others depend on your income",
          ],
        },
        {
          type: "callout",
          variant: "warning",
          title: "The disability blind spot",
          content:
            "You're more likely to become disabled than to die before retirement. Yet most people have life insurance but no disability insurance. Your ability to earn is your biggest asset — protect it.",
        },
        {
          type: "callout",
          variant: "tip",
          title: "Save on premiums",
          content:
            "Raise deductibles to lower premiums — but only if you have an emergency fund to cover those deductibles. This is how the wealthy save on insurance.",
        },
      ],
    },
    {
      id: 5,
      title: "Your Protection Action Plan",
      content: [
        {
          type: "story",
          title: "Maya's Safety Net",
          content:
            "Six months later, Maya has a $5,000 emergency fund (starter + basic), her debt is down to $12,000, and she's reviewed all her insurance policies. When her company announces layoffs, she's nervous but not panicked. 'I have options,' she realizes. 'I have time.' That's the power of a safety net.",
        },
        {
          type: "callout",
          variant: "action",
          title: "This week's actions",
          content:
            "1. Calculate your monthly expenses\n2. Set a target emergency fund amount (start with $1,000 if paying off debt)\n3. Set up automatic transfers to build your fund\n4. Review your insurance coverage — identify any gaps",
        },
        {
          type: "callout",
          variant: "key",
          title: "Chapter takeaways",
          content:
            "• Emergency funds prevent debt spirals from unexpected expenses\n• Start with $1,000, build to 6 months of expenses\n• Keep the fund in high-yield savings, not invested\n• Be strict about what qualifies as an emergency\n• Insurance protects against catastrophic losses",
        },
      ],
    },
  ],
  final_quiz: [
    {
      id: "ch4_final_1",
      type: "multiple_choice",
      question: "What is the recommended starting emergency fund while paying off debt?",
      options: [
        "$100",
        "$1,000-2,000",
        "6 months of expenses",
        "One year's salary",
      ],
      correct_answer: 1,
      explanation:
        "While paying off debt, start with a $1,000-2,000 starter emergency fund to prevent small emergencies from becoming new debt.",
    },
    {
      id: "ch4_final_2",
      type: "multiple_choice",
      question: "Where should you keep your emergency fund?",
      options: [
        "In stocks for growth",
        "In a high-yield savings account",
        "In your checking account",
        "In cash at home",
      ],
      correct_answer: 1,
      explanation:
        "A high-yield savings account keeps your emergency fund accessible (1-2 days) while earning interest, but not so accessible that you're tempted to spend it.",
    },
    {
      id: "ch4_final_3",
      type: "true_false",
      question: "A great sale on something you want is a valid reason to use your emergency fund.",
      options: ["True", "False"],
      correct_answer: 1,
      explanation:
        "False! Sales are not emergencies. Emergency funds should only be used for true emergencies like job loss, medical issues, or essential repairs.",
    },
    {
      id: "ch4_final_4",
      type: "multiple_choice",
      question: "Which type of insurance is often overlooked but very important?",
      options: [
        "Pet insurance",
        "Disability insurance",
        "Extended warranty",
        "Travel insurance",
      ],
      correct_answer: 1,
      explanation:
        "Disability insurance is often overlooked, but you're more likely to become disabled than to die before retirement. It protects your most valuable asset: your ability to earn.",
    },
    {
      id: "ch4_final_5",
      type: "multiple_choice",
      question: "How can you save money on insurance premiums responsibly?",
      options: [
        "Cancel all insurance",
        "Raise deductibles (if you have an emergency fund)",
        "Only pay every other month",
        "Never file claims",
      ],
      correct_answer: 1,
      explanation:
        "Raising deductibles lowers premiums — but only do this if you have an emergency fund that can cover those higher deductibles when needed.",
    },
  ],
};

// ===========================================
// Chapter 5: The Eighth Wonder of the World
// ===========================================

const chapter5: Chapter = {
  id: 5,
  title: "The Eighth Wonder of the World",
  subtitle: "The power of compound interest",
  phase: "Investing",
  phase_number: 3,
  estimated_time: "12 min",
  sections: [
    {
      id: 1,
      title: "The Force That Builds Fortunes",
      content: [
        {
          type: "story",
          title: "Alex's Million-Dollar Secret",
          content:
            "Maya asks Alex how he retired at 38 with over a million dollars. 'I didn't earn a million,' he says. 'I started with much less. Compound interest did the heavy lifting.' He pulls out his phone and shows her a chart. 'I invested $500 a month starting at 25. By 38, I'd put in about $78,000. The account was worth over $150,000. The extra $70,000? That's compound interest — my money making money, which then made more money.'",
        },
        {
          type: "text",
          content:
            "Einstein allegedly called compound interest 'the eighth wonder of the world.' Whether he said it or not, the math is undeniable: money grows exponentially, not linearly. Understanding this changes everything.",
        },
        {
          type: "callout",
          variant: "key",
          title: "The compound interest formula",
          content:
            "Your money doesn't just grow — it multiplies. $1,000 at 10% becomes $1,100 after year one. But year two, you earn 10% on $1,100, giving you $1,210. Each year, your growth gets bigger because you're earning returns on your returns.",
        },
      ],
    },
    {
      id: 2,
      title: "Time: Your Greatest Asset",
      content: [
        {
          type: "text",
          content:
            "The most powerful variable in compound interest isn't the amount you invest or even the return rate — it's time. Starting early beats investing more later, almost every time.",
        },
        {
          type: "comparison",
          left: {
            title: "Early Emily",
            subtitle: "Starts at 25, stops at 35",
            items: [
              "Invests $500/month for 10 years",
              "Total invested: $60,000",
              "Stops investing at 35",
              "Lets it grow until 65",
              "Final value: ~$1,200,000",
            ],
            highlight: "positive",
          },
          right: {
            title: "Late Larry",
            subtitle: "Starts at 35, invests until 65",
            items: [
              "Invests $500/month for 30 years",
              "Total invested: $180,000",
              "3x more money invested",
              "Invests for 3x longer",
              "Final value: ~$1,000,000",
            ],
            highlight: "neutral",
          },
        },
        {
          type: "callout",
          variant: "wealthy",
          content:
            "Emily invested $60,000 and ended with MORE than Larry who invested $180,000. The only difference? Emily started 10 years earlier. Time is more valuable than money when it comes to investing.",
        },
        {
          type: "formula",
          title: "The Rule of 72",
          formula: "Years to Double = 72 ÷ Annual Return %",
          example:
            "At 10% annual returns, your money doubles every 7.2 years. $10,000 becomes $20,000, then $40,000, then $80,000, then $160,000...",
        },
      ],
      mini_quiz: {
        id: "ch5_s2_quiz",
        questions: [
          {
            id: "ch5_s2_q1",
            type: "multiple_choice",
            question: "In the Emily vs Larry example, who ends up with more money?",
            options: [
              "Larry, because he invested more",
              "Emily, because she started earlier",
              "They end up with the same",
              "It depends on the market",
            ],
            correct_answer: 1,
            explanation:
              "Emily ends up with more (~$1.2M vs ~$1M) despite investing only $60,000 compared to Larry's $180,000. Starting early is that powerful.",
          },
        ],
      },
    },
    {
      id: 3,
      title: "The Destructive Side",
      content: [
        {
          type: "text",
          content:
            "Compound interest is a double-edged sword. When you invest, it works FOR you. When you carry debt, it works AGAINST you — with brutal efficiency.",
        },
        {
          type: "myth_reality",
          myth: "A little credit card debt isn't a big deal. I'll pay it off eventually.",
          reality:
            "Credit card interest compounds just like investment returns — but against you. A small balance can quietly explode into a massive debt over time.",
          wealthy:
            "The wealthy understand that paying high-interest debt is the same as earning a guaranteed return at that rate. Paying off a 22% APR credit card is like earning 22% on your money, risk-free.",
        },
        {
          type: "callout",
          variant: "warning",
          title: "The compound interest war",
          content:
            "You're either earning compound interest or paying it. There's no neutral position. Every day with high-interest debt is a day compound interest is fighting against you.",
        },
      ],
    },
    {
      id: 4,
      title: "Making Compound Interest Work for You",
      content: [
        {
          type: "list",
          title: "The compound interest checklist:",
          items: [
            "Start investing as early as possible — even small amounts",
            "Never interrupt compounding — stay invested through ups and downs",
            "Reinvest all dividends and gains automatically",
            "Eliminate high-interest debt — stop compounding working against you",
            "Increase contributions whenever you can — the snowball grows faster",
          ],
        },
        {
          type: "callout",
          variant: "tip",
          title: "The $5 latte, reconsidered",
          content:
            "That $5 daily latte isn't just $5. Invested at 10% for 30 years, that $5/day ($150/month) becomes over $300,000. Not saying skip the latte — just understand the true cost of any recurring expense.",
        },
        {
          type: "callout",
          variant: "action",
          title: "Start today",
          content:
            "The best time to start investing was 20 years ago. The second best time is today. Even $50/month starts your compound interest clock ticking.",
        },
      ],
    },
    {
      id: 5,
      title: "Your Compound Interest Calculator",
      content: [
        {
          type: "formula",
          title: "Future Value Formula",
          formula: "FV = PMT × (((1 + r)^n - 1) ÷ r)",
          example:
            "$500/month at 10% for 30 years: FV = $500 × (((1.00833)^360 - 1) ÷ 0.00833) = ~$1,130,000",
        },
        {
          type: "callout",
          variant: "key",
          title: "Chapter takeaways",
          content:
            "• Compound interest makes your money grow exponentially, not linearly\n• Time is more powerful than amount — starting early beats investing more later\n• The Rule of 72: divide 72 by your return to find years to double\n• Compound interest works against you with debt — same math, opposite direction\n• Start now — every day of delay costs you more than you realize",
        },
      ],
    },
  ],
  final_quiz: [
    {
      id: "ch5_final_1",
      type: "multiple_choice",
      question: "What is the Rule of 72?",
      options: [
        "You need $72 to start investing",
        "Divide 72 by your return rate to find years to double",
        "You should invest 72% of your income",
        "Retire at age 72",
      ],
      correct_answer: 1,
      explanation:
        "The Rule of 72 is a quick way to estimate how long it takes money to double. Divide 72 by your annual return percentage.",
    },
    {
      id: "ch5_final_2",
      type: "multiple_choice",
      question: "Why did Emily end up with more money than Larry?",
      options: [
        "She invested more money",
        "She got better returns",
        "She started 10 years earlier",
        "She had a higher-paying job",
      ],
      correct_answer: 2,
      explanation:
        "Emily started investing 10 years earlier than Larry. The extra time for compound interest to work outweighed Larry's larger total investment.",
    },
    {
      id: "ch5_final_3",
      type: "true_false",
      question: "Compound interest only applies to investments, not to debt.",
      options: ["True", "False"],
      correct_answer: 1,
      explanation:
        "False! Compound interest works on debt too, but against you. High-interest debt compounds, making your balance grow over time.",
    },
    {
      id: "ch5_final_4",
      type: "multiple_choice",
      question: "At a 10% annual return, approximately how many years does it take for money to double?",
      options: ["3-4 years", "7-8 years", "12-15 years", "20+ years"],
      correct_answer: 1,
      explanation:
        "Using the Rule of 72: 72 ÷ 10 = 7.2 years to double at a 10% return.",
    },
    {
      id: "ch5_final_5",
      type: "multiple_choice",
      question: "Why should dividends be reinvested?",
      options: [
        "It's required by law",
        "To avoid paying taxes",
        "To keep compound interest working uninterrupted",
        "Dividends can't be withdrawn anyway",
      ],
      correct_answer: 2,
      explanation:
        "Reinvesting dividends keeps compound interest working at full power. The dividends buy more shares, which generate more dividends, accelerating growth.",
    },
  ],
};

// ===========================================
// Chapter 6: Stock Market Demystified
// ===========================================

const chapter6: Chapter = {
  id: 6,
  title: "Stock Market Demystified",
  subtitle: "How markets actually work",
  phase: "Investing",
  phase_number: 3,
  estimated_time: "15 min",
  sections: [
    {
      id: 1,
      title: "What Stocks Actually Are",
      content: [
        {
          type: "story",
          title: "Maya's First Stock Question",
          content:
            "Maya tells Alex she's nervous about the stock market. 'It feels like gambling.' Alex shakes his head. 'When you buy a stock, you're not making a bet. You're buying a tiny piece of a real business — a piece of their profits, their assets, their future growth. It's ownership, not gambling.'",
        },
        {
          type: "text",
          content:
            "A stock is a share of ownership in a company. When you buy Apple stock, you literally own a tiny fraction of Apple Inc. — their buildings, products, cash, everything. As the company grows and profits, so does your share.",
        },
        {
          type: "myth_reality",
          myth: "The stock market is like a casino — you might win big or lose everything.",
          reality:
            "Short-term trading can resemble gambling. But long-term investing is ownership of real businesses. Over any 20-year period in history, the S&P 500 has never lost money.",
          wealthy:
            "The wealthy think like owners, not gamblers. They buy businesses they believe will grow over decades, not stocks they hope will jump tomorrow.",
        },
      ],
    },
    {
      id: 2,
      title: "How the Market Works",
      content: [
        {
          type: "text",
          content:
            "Stock prices move based on supply and demand. If more people want to buy than sell, prices rise. If more want to sell, prices fall. Over the long term, prices follow business performance.",
        },
        {
          type: "list",
          title: "What moves stock prices:",
          items: [
            "Company earnings and growth (fundamental)",
            "Economic conditions (interest rates, inflation)",
            "Industry trends and competition",
            "Investor sentiment and psychology (short-term noise)",
            "News and events (often temporary effects)",
          ],
        },
        {
          type: "callout",
          variant: "key",
          title: "The signal vs the noise",
          content:
            "Day-to-day price movements are mostly noise — random fluctuations driven by emotions and news. Year-to-year movements start to reflect real business performance. Decade-to-decade movements almost purely reflect business fundamentals.",
        },
        {
          type: "callout",
          variant: "wealthy",
          content:
            "The wealthy ignore daily market movements. They know that over any 20+ year period, the market has always trended up. They buy consistently and let time work.",
        },
      ],
      mini_quiz: {
        id: "ch6_s2_quiz",
        questions: [
          {
            id: "ch6_s2_q1",
            type: "true_false",
            question: "Day-to-day stock price movements primarily reflect company fundamentals.",
            options: ["True", "False"],
            correct_answer: 1,
            explanation:
              "False! Daily movements are mostly noise — emotions, news, and trading activity. Company fundamentals drive long-term returns.",
          },
        ],
      },
    },
    {
      id: 3,
      title: "Index Funds: The Simple Path",
      content: [
        {
          type: "text",
          content:
            "Trying to pick winning stocks is hard — even professionals fail more often than not. Index funds solve this by letting you own the entire market at once.",
        },
        {
          type: "comparison",
          left: {
            title: "Stock Picking",
            subtitle: "Choose individual companies",
            items: [
              "Need to research each company",
              "Risk of picking losers",
              "Most professionals underperform",
              "Requires time and expertise",
              "Higher fees in managed funds",
            ],
            highlight: "negative",
          },
          right: {
            title: "Index Funds",
            subtitle: "Own the whole market",
            items: [
              "No research needed",
              "Own 500+ companies at once",
              "Match market performance",
              "Set it and forget it",
              "Very low fees (0.03-0.10%)",
            ],
            highlight: "positive",
          },
        },
        {
          type: "callout",
          variant: "wealthy",
          content:
            "Warren Buffett, one of the greatest investors ever, recommends index funds for most people. 'A low-cost index fund is the most sensible equity investment for the great majority of investors.'",
        },
        {
          type: "callout",
          variant: "tip",
          title: "The S&P 500 index",
          content:
            "The S&P 500 tracks the 500 largest US companies. An S&P 500 index fund gives you Apple, Microsoft, Amazon, Google, and 496 others — instant diversification in one purchase.",
        },
      ],
    },
    {
      id: 4,
      title: "Market Crashes and Your Psychology",
      content: [
        {
          type: "story",
          title: "The Crash of 2020",
          content:
            "Maya asks about market crashes. Alex pulls up a chart from March 2020. 'The market dropped 34% in one month. Everyone panicked.' He zooms out. 'But by August, it had fully recovered. People who sold in March locked in their losses. People who held — or better, kept buying — came out ahead.'",
        },
        {
          type: "text",
          content:
            "Market crashes are inevitable. How you respond to them determines your long-term returns. History shows that staying invested through crashes leads to far better outcomes than trying to time the market.",
        },
        {
          type: "callout",
          variant: "warning",
          title: "The biggest investing mistake",
          content:
            "Selling during a crash and missing the recovery is the #1 wealth destroyer. The best days in the market often follow the worst days. Miss them, and your returns suffer dramatically.",
        },
        {
          type: "myth_reality",
          myth: "Smart investors get out before crashes and get back in at the bottom.",
          reality:
            "Nobody consistently times the market. Studies show that missing just the 10 best market days over 20 years cuts your returns in half. The best strategy is to stay invested.",
          wealthy:
            "The wealthy see crashes as sales. When stocks drop 30%, they're buying at a 30% discount. Fear is their opportunity.",
        },
      ],
    },
    {
      id: 5,
      title: "Your Stock Market Strategy",
      content: [
        {
          type: "list",
          title: "The simple investing formula:",
          ordered: true,
          items: [
            "Choose a low-cost total market or S&P 500 index fund",
            "Set up automatic monthly investments (dollar-cost averaging)",
            "Ignore daily and monthly market movements",
            "Never sell during crashes — ideally, buy more",
            "Stay invested for decades, not days",
          ],
        },
        {
          type: "callout",
          variant: "action",
          title: "Action item",
          content:
            "Research low-cost index funds like VTI (Vanguard Total Market), VOO (Vanguard S&P 500), or FXAIX (Fidelity 500). All have expense ratios under 0.10%.",
        },
        {
          type: "callout",
          variant: "key",
          title: "Chapter takeaways",
          content:
            "• Stocks are ownership in real businesses, not casino chips\n• Short-term prices are noise; long-term returns reflect business growth\n• Index funds beat most stock pickers with less effort and lower fees\n• Never sell during crashes — stay invested and keep buying\n• Time in the market beats timing the market",
        },
      ],
    },
  ],
  final_quiz: [
    {
      id: "ch6_final_1",
      type: "multiple_choice",
      question: "What does owning a stock actually mean?",
      options: [
        "You're making a bet on price movements",
        "You own a small piece of a real business",
        "You're lending money to a company",
        "You're buying company debt",
      ],
      correct_answer: 1,
      explanation:
        "When you buy stock, you're buying ownership in a real business. You own a share of their assets, profits, and future growth.",
    },
    {
      id: "ch6_final_2",
      type: "multiple_choice",
      question: "Why do most professional investors recommend index funds?",
      options: [
        "They pay the highest dividends",
        "They're guaranteed to never lose money",
        "Most stock pickers fail to beat the market, so just own the market",
        "They're required for retirement accounts",
      ],
      correct_answer: 2,
      explanation:
        "Studies show most professional stock pickers underperform index funds after fees. Since beating the market is so hard, simply owning the market is the smarter choice for most people.",
    },
    {
      id: "ch6_final_3",
      type: "true_false",
      question: "The best strategy during a market crash is to sell and wait for recovery.",
      options: ["True", "False"],
      correct_answer: 1,
      explanation:
        "False! Selling during crashes locks in losses. Staying invested — or buying more — leads to better long-term returns. Nobody can consistently time when to get back in.",
    },
    {
      id: "ch6_final_4",
      type: "multiple_choice",
      question: "What does the S&P 500 index represent?",
      options: [
        "The 500 oldest American companies",
        "The 500 largest US companies",
        "500 stocks picked by analysts",
        "The 500 fastest-growing stocks",
      ],
      correct_answer: 1,
      explanation:
        "The S&P 500 is an index of the 500 largest publicly traded US companies, weighted by market capitalization.",
    },
    {
      id: "ch6_final_5",
      type: "multiple_choice",
      question: "What drives stock prices over the long term?",
      options: [
        "News headlines",
        "Investor emotions",
        "Company earnings and growth",
        "Day trader activity",
      ],
      correct_answer: 2,
      explanation:
        "While short-term prices are driven by news and emotions, long-term stock prices follow company fundamentals: earnings, growth, and profitability.",
    },
  ],
};

// ===========================================
// Chapter 7: Investment Vehicles & Accounts
// ===========================================

const chapter7: Chapter = {
  id: 7,
  title: "Investment Vehicles & Accounts",
  subtitle: "Where to put your money",
  phase: "Investing",
  phase_number: 3,
  estimated_time: "15 min",
  sections: [
    {
      id: 1,
      title: "The Investment Account Zoo",
      content: [
        {
          type: "story",
          title: "Maya's Account Confusion",
          content:
            "Maya starts researching investing and immediately gets overwhelmed. 401(k), IRA, Roth IRA, HSA, brokerage accounts... 'Why are there so many types?' she asks Alex. 'Because each has different tax advantages,' he explains. 'Choose the right ones, and you could save tens of thousands in taxes over your lifetime.'",
        },
        {
          type: "text",
          content:
            "Investment accounts aren't all the same. The type of account affects when you pay taxes, what you can invest in, and when you can access your money. Understanding these differences is crucial.",
        },
        {
          type: "callout",
          variant: "key",
          title: "The two tax questions",
          content:
            "Every investment account answers two questions differently: (1) Do you pay tax on money going IN? (2) Do you pay tax on money coming OUT? Understanding this framework makes everything clearer.",
        },
      ],
    },
    {
      id: 2,
      title: "Tax-Advantaged Retirement Accounts",
      content: [
        {
          type: "comparison",
          left: {
            title: "Traditional 401(k) / IRA",
            subtitle: "Tax-deferred",
            items: [
              "Contribute pre-tax dollars",
              "Investments grow tax-free",
              "Pay taxes when you withdraw",
              "Good if you expect lower tax rate in retirement",
              "Required withdrawals start at 73",
            ],
            highlight: "neutral",
          },
          right: {
            title: "Roth 401(k) / Roth IRA",
            subtitle: "Tax-free growth",
            items: [
              "Contribute after-tax dollars",
              "Investments grow tax-free",
              "Withdrawals are tax-free",
              "Good if you expect same/higher tax rate",
              "No required withdrawals (Roth IRA)",
            ],
            highlight: "positive",
          },
        },
        {
          type: "callout",
          variant: "wealthy",
          content:
            "Many wealthy people favor Roth accounts because tax-free growth over decades is incredibly powerful. If you think tax rates will rise, or if you're early in your career, Roth often makes more sense.",
        },
        {
          type: "callout",
          variant: "tip",
          title: "The free money first",
          content:
            "If your employer offers a 401(k) match, ALWAYS contribute enough to get the full match. A 50% match is an instant 50% return on your money — you won't find that anywhere else.",
        },
      ],
      mini_quiz: {
        id: "ch7_s2_quiz",
        questions: [
          {
            id: "ch7_s2_q1",
            type: "multiple_choice",
            question: "What makes a Roth account different from Traditional?",
            options: [
              "Roth has higher contribution limits",
              "Roth contributions are taxed now, but withdrawals are tax-free",
              "Roth is only for self-employed people",
              "Traditional grows faster",
            ],
            correct_answer: 1,
            explanation:
              "Roth contributions are made with after-tax money, but all growth and withdrawals are tax-free. Traditional is the opposite: tax-deferred going in, taxed coming out.",
          },
        ],
      },
    },
    {
      id: 3,
      title: "The HSA: The Ultimate Account",
      content: [
        {
          type: "text",
          content:
            "If you have a high-deductible health plan, the HSA (Health Savings Account) is arguably the best investment account that exists. It has triple tax advantages.",
        },
        {
          type: "list",
          title: "HSA triple tax advantage:",
          ordered: true,
          items: [
            "Contributions are tax-deductible (like Traditional)",
            "Growth is tax-free (like all retirement accounts)",
            "Withdrawals for medical expenses are tax-free (unique to HSA)",
          ],
        },
        {
          type: "callout",
          variant: "wealthy",
          content:
            "The wealthy use their HSA as a stealth retirement account. They pay current medical expenses out of pocket, let their HSA grow for decades, then withdraw tax-free for medical expenses in retirement (when healthcare costs are highest).",
        },
        {
          type: "callout",
          variant: "tip",
          title: "HSA investment hack",
          content:
            "Most people don't realize you can INVEST your HSA balance in stocks and index funds, not just hold cash. If you won't need the money for years, invest it for long-term growth.",
        },
      ],
    },
    {
      id: 4,
      title: "Brokerage Accounts (Taxable)",
      content: [
        {
          type: "text",
          content:
            "Once you've maxed out tax-advantaged accounts, or if you need more flexibility, taxable brokerage accounts are next. No special tax benefits, but also no restrictions.",
        },
        {
          type: "comparison",
          left: {
            title: "Tax-Advantaged Accounts",
            subtitle: "401k, IRA, Roth, HSA",
            items: [
              "Tax benefits on growth",
              "Contribution limits per year",
              "Early withdrawal penalties",
              "Best for long-term retirement",
              "Some employer matching available",
            ],
            highlight: "positive",
          },
          right: {
            title: "Taxable Brokerage",
            subtitle: "Regular investment accounts",
            items: [
              "No special tax benefits",
              "No contribution limits",
              "Withdraw anytime without penalty",
              "Flexible for any goal",
              "Pay capital gains tax on profits",
            ],
            highlight: "neutral",
          },
        },
        {
          type: "callout",
          variant: "key",
          title: "The early retirement bridge",
          content:
            "For FIRE, taxable accounts are crucial. They bridge the gap between early retirement and age 59½ when retirement accounts become fully accessible penalty-free.",
        },
      ],
    },
    {
      id: 5,
      title: "The Investment Account Hierarchy",
      content: [
        {
          type: "list",
          title: "Where to invest, in order:",
          ordered: true,
          items: [
            "401(k) up to employer match (free money)",
            "HSA if eligible (triple tax advantage)",
            "Roth IRA if income allows (tax-free growth)",
            "401(k) up to max contribution",
            "Taxable brokerage (flexibility, no limits)",
          ],
        },
        {
          type: "callout",
          variant: "action",
          title: "Your action items",
          content:
            "1. Check if you're getting your full 401(k) employer match\n2. Research if you're eligible for HSA or Roth IRA\n3. Open a Roth IRA if you haven't (Fidelity, Schwab, Vanguard)\n4. Consider a taxable brokerage for additional investing",
        },
        {
          type: "callout",
          variant: "key",
          title: "Chapter takeaways",
          content:
            "• Different accounts have different tax treatments\n• Always get the full employer 401(k) match — it's free money\n• Roth accounts = pay tax now, never pay again\n• HSA has triple tax advantage — the best account if you qualify\n• Taxable accounts provide flexibility for early retirement goals",
        },
      ],
    },
  ],
  final_quiz: [
    {
      id: "ch7_final_1",
      type: "multiple_choice",
      question: "What should you always do first before other investing?",
      options: [
        "Max out a Roth IRA",
        "Invest in a taxable brokerage",
        "Get your full 401(k) employer match",
        "Buy individual stocks",
      ],
      correct_answer: 2,
      explanation:
        "Always capture your full employer 401(k) match first. It's free money — an instant 50-100% return that you can't get anywhere else.",
    },
    {
      id: "ch7_final_2",
      type: "multiple_choice",
      question: "What is unique about HSA accounts?",
      options: [
        "They can only hold cash",
        "They have no contribution limits",
        "They have triple tax advantages",
        "They're only available to wealthy individuals",
      ],
      correct_answer: 2,
      explanation:
        "HSAs have triple tax advantages: contributions are tax-deductible, growth is tax-free, AND withdrawals for medical expenses are tax-free.",
    },
    {
      id: "ch7_final_3",
      type: "true_false",
      question: "Roth IRA withdrawals in retirement are subject to income tax.",
      options: ["True", "False"],
      correct_answer: 1,
      explanation:
        "False! Roth IRA withdrawals in retirement are completely tax-free. You paid taxes on the money when you contributed it.",
    },
    {
      id: "ch7_final_4",
      type: "multiple_choice",
      question: "Why are taxable brokerage accounts important for early retirement?",
      options: [
        "They have the best tax benefits",
        "Employers match contributions",
        "They can be accessed before 59½ without penalty",
        "They have higher returns",
      ],
      correct_answer: 2,
      explanation:
        "Taxable accounts can be accessed anytime without early withdrawal penalties, making them crucial for bridging the gap between early retirement and age 59½.",
    },
    {
      id: "ch7_final_5",
      type: "multiple_choice",
      question: "What's the difference between Traditional and Roth accounts?",
      options: [
        "Only Roth accounts can hold stocks",
        "Traditional is tax-deferred; Roth is tax-free on withdrawal",
        "Roth has higher contribution limits",
        "Traditional is only for employees",
      ],
      correct_answer: 1,
      explanation:
        "Traditional accounts defer taxes (deduct now, pay later), while Roth accounts are the opposite (pay now, withdrawals are tax-free).",
    },
  ],
};

// ===========================================
// Chapter 8: Tax Fundamentals
// ===========================================

const chapter8: Chapter = {
  id: 8,
  title: "Tax Fundamentals",
  subtitle: "Understanding the tax system",
  phase: "Optimization",
  phase_number: 4,
  estimated_time: "12 min",
  sections: [
    {
      id: 1,
      title: "Taxes: Your Biggest Lifetime Expense",
      content: [
        {
          type: "story",
          title: "Maya's Tax Awakening",
          content:
            "Maya gets her paycheck and notices the deductions: federal tax, state tax, Social Security, Medicare. Nearly 30% of her salary disappears before she even sees it. 'I'll pay over $1 million in taxes over my career,' she calculates. Alex nods. 'And most people never learn how the system actually works. That's expensive ignorance.'",
        },
        {
          type: "text",
          content:
            "Taxes are likely your largest lifetime expense — bigger than your house, your cars, everything. Yet most people spend more time planning vacations than understanding taxes. Learning the basics can save you thousands every year.",
        },
        {
          type: "myth_reality",
          myth: "If I earn $80,000, I pay taxes on all $80,000.",
          reality:
            "You only pay taxes on taxable income — what's left after deductions. And different portions are taxed at different rates (tax brackets). Understanding this changes how you think about earning more.",
          wealthy:
            "The wealthy legally minimize their taxable income through deductions, credits, and smart account choices. They see taxes as a system to navigate, not a fixed cost.",
        },
      ],
    },
    {
      id: 2,
      title: "How Tax Brackets Actually Work",
      content: [
        {
          type: "text",
          content:
            "One of the biggest tax misunderstandings: many people think earning more can 'push you into a higher tax bracket' and leave you with less money. That's not how it works.",
        },
        {
          type: "callout",
          variant: "key",
          title: "Marginal vs effective tax rate",
          content:
            "Tax brackets are MARGINAL — only the income WITHIN each bracket is taxed at that rate. If you're in the 22% bracket, only your income above the 12% threshold is taxed at 22%. Your earlier dollars are still taxed at lower rates.",
        },
        {
          type: "formula",
          title: "Example: $80,000 income (2024 single filer)",
          formula: "Tax = ($11,600 × 10%) + ($35,550 × 12%) + ($32,850 × 22%)",
          example:
            "$1,160 + $4,266 + $7,227 = $12,653 total tax. That's an effective rate of 15.8%, not 22%.",
        },
        {
          type: "callout",
          variant: "tip",
          title: "Never fear earning more",
          content:
            "A raise will NEVER leave you worse off. If you move into a higher bracket, only the additional dollars are taxed at the higher rate. You always keep most of each new dollar.",
        },
      ],
      mini_quiz: {
        id: "ch8_s2_quiz",
        questions: [
          {
            id: "ch8_s2_q1",
            type: "true_false",
            question: "If you're in the 22% tax bracket, all your income is taxed at 22%.",
            options: ["True", "False"],
            correct_answer: 1,
            explanation:
              "False! Only the income WITHIN that bracket is taxed at 22%. Your income in lower brackets is still taxed at those lower rates.",
          },
        ],
      },
    },
    {
      id: 3,
      title: "Deductions and Credits",
      content: [
        {
          type: "text",
          content:
            "Deductions and credits both reduce your taxes, but they work differently. Understanding the difference helps you maximize both.",
        },
        {
          type: "comparison",
          left: {
            title: "Deductions",
            subtitle: "Reduce taxable income",
            items: [
              "Lower the amount of income that's taxed",
              "Worth your marginal tax rate",
              "$1,000 deduction in 22% bracket = $220 saved",
              "Examples: 401k, HSA, mortgage interest",
              "Standard vs itemized deduction",
            ],
            highlight: "neutral",
          },
          right: {
            title: "Credits",
            subtitle: "Reduce taxes directly",
            items: [
              "Reduce your actual tax bill dollar-for-dollar",
              "More valuable than deductions",
              "$1,000 credit = $1,000 saved",
              "Examples: Child tax credit, education credits",
              "Some are refundable (paid even if no tax owed)",
            ],
            highlight: "positive",
          },
        },
        {
          type: "callout",
          variant: "wealthy",
          content:
            "The wealthy maximize both. They use deductions to lower taxable income and then claim every credit they're eligible for. They track everything and miss nothing.",
        },
      ],
    },
    {
      id: 4,
      title: "Types of Income and Their Taxes",
      content: [
        {
          type: "text",
          content:
            "Not all income is taxed the same. Understanding the different types of income — and their tax rates — explains why the wealthy structure their finances the way they do.",
        },
        {
          type: "list",
          title: "Income types from highest to lowest tax rates:",
          items: [
            "Ordinary income (wages, salary): Taxed at your full marginal rate (up to 37%)",
            "Short-term capital gains (investments held <1 year): Same as ordinary income",
            "Long-term capital gains (investments held >1 year): 0%, 15%, or 20%",
            "Qualified dividends: Same as long-term capital gains",
            "Municipal bond interest: Often completely tax-free",
          ],
        },
        {
          type: "callout",
          variant: "wealthy",
          content:
            "The wealthy earn most of their income from long-term capital gains and qualified dividends — taxed at 15-20% — while employees earning the same amount pay up to 37% on their salaries. This is why billionaires often pay lower tax rates than their secretaries.",
        },
        {
          type: "callout",
          variant: "key",
          title: "The holding period matters",
          content:
            "Simply holding an investment for over one year can cut your tax rate from 37% to 15%. This is one of the easiest tax optimizations available.",
        },
      ],
    },
    {
      id: 5,
      title: "Tax Action Items",
      content: [
        {
          type: "callout",
          variant: "action",
          title: "Your tax homework",
          content:
            "1. Look at your most recent paycheck — calculate your effective tax rate\n2. Review which tax-advantaged accounts you're using (401k, IRA, HSA)\n3. Check if you should itemize or use standard deduction\n4. Research tax credits you might be missing",
        },
        {
          type: "callout",
          variant: "key",
          title: "Chapter takeaways",
          content:
            "• Tax brackets are marginal — only income within each bracket is taxed at that rate\n• Your effective rate is lower than your marginal bracket\n• Credits are more valuable than deductions (dollar vs percentage)\n• Different income types have vastly different tax rates\n• Holding investments >1 year can cut your tax rate significantly",
        },
      ],
    },
  ],
  final_quiz: [
    {
      id: "ch8_final_1",
      type: "multiple_choice",
      question: "If you're in the 22% tax bracket, what is your effective tax rate?",
      options: [
        "Exactly 22%",
        "Higher than 22%",
        "Lower than 22%",
        "It depends on your state",
      ],
      correct_answer: 2,
      explanation:
        "Your effective rate is lower than your marginal bracket because income in lower brackets is taxed at those lower rates first.",
    },
    {
      id: "ch8_final_2",
      type: "multiple_choice",
      question: "What's the difference between a deduction and a credit?",
      options: [
        "They're the same thing",
        "Deductions reduce taxable income; credits reduce taxes directly",
        "Credits are only for businesses",
        "Deductions are better than credits",
      ],
      correct_answer: 1,
      explanation:
        "Deductions reduce your taxable income (saving you a percentage), while credits reduce your tax bill dollar-for-dollar.",
    },
    {
      id: "ch8_final_3",
      type: "true_false",
      question: "Long-term capital gains are taxed at lower rates than regular income.",
      options: ["True", "False"],
      correct_answer: 0,
      explanation:
        "True! Long-term capital gains (investments held over one year) are taxed at 0%, 15%, or 20% — much lower than ordinary income rates up to 37%.",
    },
    {
      id: "ch8_final_4",
      type: "multiple_choice",
      question: "Why do some billionaires pay lower tax rates than their employees?",
      options: [
        "They cheat on taxes",
        "Most of their income is from long-term capital gains, taxed at lower rates",
        "They don't pay any taxes",
        "Billionaires have different tax brackets",
      ],
      correct_answer: 1,
      explanation:
        "Most wealthy individuals' income comes from investments (capital gains and dividends) taxed at 15-20%, while employees pay up to 37% on wages.",
    },
    {
      id: "ch8_final_5",
      type: "multiple_choice",
      question: "What happens if a raise pushes you into a higher tax bracket?",
      options: [
        "All your income is now taxed at the higher rate",
        "You might take home less money",
        "Only the additional income is taxed at the higher rate",
        "You should decline the raise",
      ],
      correct_answer: 2,
      explanation:
        "Only the income above the bracket threshold is taxed at the higher rate. A raise always increases your take-home pay — never decline one for tax reasons!",
    },
  ],
};

// ===========================================
// Chapter 9: Tax Strategies of the Wealthy
// ===========================================

const chapter9: Chapter = {
  id: 9,
  title: "Tax Strategies of the Wealthy",
  subtitle: "Keep more of what you earn",
  phase: "Optimization",
  phase_number: 4,
  estimated_time: "14 min",
  sections: [
    {
      id: 1,
      title: "The Legal Tax Optimization Playbook",
      content: [
        {
          type: "story",
          title: "Alex's Tax Strategy",
          content:
            "Maya assumes Alex paid very little in taxes because he's wealthy. 'Actually, I paid a lot,' he says. 'But my effective rate was about 12%, even when I was in the 32% bracket.' Maya is confused. 'How?' Alex smiles. 'Legally. I just understand the rules of the game.'",
        },
        {
          type: "text",
          content:
            "Tax avoidance (legal) is different from tax evasion (illegal). The wealthy use every legal strategy available to minimize taxes. These strategies are available to everyone — most people just don't know about them.",
        },
        {
          type: "myth_reality",
          myth: "Tax optimization strategies are only for the rich and require expensive accountants.",
          reality:
            "Most powerful tax strategies are accessible to anyone: maxing retirement accounts, using HSAs, tax-loss harvesting, holding investments long-term. You don't need to be rich to use them.",
          wealthy:
            "The wealthy simply use these strategies more systematically. They build tax optimization into every financial decision, treating it as a core part of wealth building.",
        },
      ],
    },
    {
      id: 2,
      title: "Maximize Tax-Advantaged Accounts",
      content: [
        {
          type: "text",
          content:
            "The single biggest tax optimization most people can do is max out their tax-advantaged accounts. The numbers add up fast.",
        },
        {
          type: "formula",
          title: "Annual tax-advantaged space (2024)",
          formula: "401(k): $23,000 + IRA: $7,000 + HSA: $4,150 = $34,150",
          example:
            "At a 22% marginal rate, maxing these could save $7,500+ in taxes per year. Over 20 years, that's $150,000 in tax savings alone.",
        },
        {
          type: "callout",
          variant: "wealthy",
          content:
            "The wealthy max out EVERY tax-advantaged account they can. For them, leaving contribution room unused is like leaving free money on the table.",
        },
        {
          type: "callout",
          variant: "tip",
          title: "The mega backdoor Roth",
          content:
            "Some 401(k) plans allow after-tax contributions up to $69,000 total, which can be converted to Roth. This 'mega backdoor Roth' lets high earners get even more into Roth accounts.",
        },
      ],
    },
    {
      id: 3,
      title: "Tax-Loss Harvesting",
      content: [
        {
          type: "text",
          content:
            "When investments lose value, you can sell them to realize a loss that offsets gains elsewhere. This is tax-loss harvesting — turning investment losses into tax savings.",
        },
        {
          type: "list",
          title: "How tax-loss harvesting works:",
          ordered: true,
          items: [
            "Identify investments that have lost value since purchase",
            "Sell to 'realize' the loss",
            "Use losses to offset capital gains (unlimited)",
            "If losses exceed gains, deduct up to $3,000 from ordinary income",
            "Carry forward excess losses to future years",
            "Reinvest in a similar (not identical) investment to maintain exposure",
          ],
        },
        {
          type: "callout",
          variant: "warning",
          title: "Watch the wash sale rule",
          content:
            "You can't claim a loss if you buy a 'substantially identical' investment within 30 days before or after. Buy something similar but not identical — like a different index fund tracking the same market.",
        },
        {
          type: "callout",
          variant: "wealthy",
          content:
            "The wealthy harvest losses throughout the year, not just in December. They systematically capture every tax benefit available while maintaining their investment strategy.",
        },
      ],
      mini_quiz: {
        id: "ch9_s3_quiz",
        questions: [
          {
            id: "ch9_s3_q1",
            type: "multiple_choice",
            question: "What is tax-loss harvesting?",
            options: [
              "Avoiding all investments that might lose money",
              "Selling losing investments to offset gains and reduce taxes",
              "Only investing in tax-free bonds",
              "Hiding investment losses from the IRS",
            ],
            correct_answer: 1,
            explanation:
              "Tax-loss harvesting means selling investments at a loss to realize that loss for tax purposes, offsetting gains elsewhere.",
          },
        ],
      },
    },
    {
      id: 4,
      title: "Asset Location Strategy",
      content: [
        {
          type: "text",
          content:
            "Where you hold different investments matters for taxes. Placing the right assets in the right accounts can significantly improve after-tax returns.",
        },
        {
          type: "comparison",
          left: {
            title: "Tax-Advantaged Accounts",
            subtitle: "401(k), IRA, Roth",
            items: [
              "Hold: Bonds and REITs",
              "Hold: High-dividend stocks",
              "Hold: Actively traded investments",
              "Why: No annual tax on dividends/interest",
              "Why: No tax on frequent trading",
            ],
            highlight: "positive",
          },
          right: {
            title: "Taxable Brokerage",
            subtitle: "Regular investment accounts",
            items: [
              "Hold: Index funds with low turnover",
              "Hold: Growth stocks (no dividends)",
              "Hold: Tax-managed funds",
              "Why: Qualify for long-term capital gains",
              "Why: Control when gains are realized",
            ],
            highlight: "positive",
          },
        },
        {
          type: "callout",
          variant: "key",
          title: "The asset location rule",
          content:
            "Put tax-inefficient investments (bonds, REITs, high-dividend stocks) in tax-advantaged accounts. Put tax-efficient investments (index funds, growth stocks) in taxable accounts.",
        },
      ],
    },
    {
      id: 5,
      title: "Advanced Strategies and Action Items",
      content: [
        {
          type: "list",
          title: "More strategies to research:",
          items: [
            "Qualified Opportunity Zones: Defer and reduce capital gains taxes",
            "Charitable giving: Donate appreciated stock instead of cash",
            "Roth conversions: Convert in low-income years for tax-free growth",
            "Income timing: Defer bonuses to lower-income years",
            "Business deductions: Self-employment offers many write-offs",
          ],
        },
        {
          type: "callout",
          variant: "action",
          title: "Your tax optimization checklist",
          content:
            "1. Max out tax-advantaged contributions\n2. Hold investments for over one year when possible\n3. Consider tax-loss harvesting in down markets\n4. Review asset location across your accounts\n5. Track deductible expenses throughout the year",
        },
        {
          type: "callout",
          variant: "key",
          title: "Chapter takeaways",
          content:
            "• Tax optimization is legal and available to everyone\n• Maxing tax-advantaged accounts is the #1 strategy\n• Tax-loss harvesting turns losses into tax savings\n• Asset location: right investments in right accounts\n• Build tax thinking into every financial decision",
        },
      ],
    },
  ],
  final_quiz: [
    {
      id: "ch9_final_1",
      type: "multiple_choice",
      question: "What's the combined annual tax-advantaged contribution limit (401k + IRA + HSA)?",
      options: ["About $10,000", "About $20,000", "About $34,000", "About $50,000"],
      correct_answer: 2,
      explanation:
        "In 2024, you can contribute $23,000 to 401(k), $7,000 to IRA, and $4,150 to HSA, totaling about $34,150 in tax-advantaged space.",
    },
    {
      id: "ch9_final_2",
      type: "multiple_choice",
      question: "What is the 'wash sale rule'?",
      options: [
        "You must wash your hands before trading",
        "You can't claim a loss if you buy a similar investment within 30 days",
        "You must wait 30 days between any trades",
        "Losses can only be claimed once per year",
      ],
      correct_answer: 1,
      explanation:
        "The wash sale rule prevents claiming a loss if you buy a substantially identical investment within 30 days before or after the sale.",
    },
    {
      id: "ch9_final_3",
      type: "true_false",
      question: "You should hold bonds and REITs in taxable accounts for the best tax efficiency.",
      options: ["True", "False"],
      correct_answer: 1,
      explanation:
        "False! Bonds and REITs are tax-inefficient (high ordinary income). They should be held in tax-advantaged accounts where that income isn't taxed annually.",
    },
    {
      id: "ch9_final_4",
      type: "multiple_choice",
      question: "How much can you deduct from ordinary income using capital losses?",
      options: ["Unlimited", "$1,500 per year", "$3,000 per year", "None — losses only offset gains"],
      correct_answer: 2,
      explanation:
        "You can use unlimited losses to offset gains, plus deduct up to $3,000 from ordinary income. Excess losses carry forward to future years.",
    },
    {
      id: "ch9_final_5",
      type: "multiple_choice",
      question: "Why donate appreciated stock instead of cash to charity?",
      options: [
        "Charities prefer stock",
        "You avoid paying capital gains tax on the appreciation",
        "Cash donations aren't tax-deductible",
        "Stock donations don't count as deductions",
      ],
      correct_answer: 1,
      explanation:
        "When you donate appreciated stock, you get a deduction for the full value AND avoid paying capital gains tax on the appreciation. Double benefit.",
    },
  ],
};

// ===========================================
// Chapter 10: Building Income Streams
// ===========================================

const chapter10: Chapter = {
  id: 10,
  title: "Building Income Streams",
  subtitle: "Create multiple income sources",
  phase: "Optimization",
  phase_number: 4,
  estimated_time: "14 min",
  sections: [
    {
      id: 1,
      title: "The Multiple Income Mindset",
      content: [
        {
          type: "story",
          title: "Alex's Income Sources",
          content:
            "Maya asks how Alex affords retirement. 'I have six income streams,' he says. 'Investment dividends, rental income from one property, some consulting work, a small online business, royalties from a book I wrote, and my investment portfolio growth.' Maya realizes: Alex doesn't need his old salary because money flows in from multiple directions.",
        },
        {
          type: "text",
          content:
            "Relying on a single income source — your job — is risky. If that stream stops, you're in trouble. Building multiple income streams creates security and accelerates wealth building.",
        },
        {
          type: "myth_reality",
          myth: "I can only have multiple income streams if I'm already wealthy or work 80 hours a week.",
          reality:
            "Many income streams can be built slowly alongside a regular job, and some become passive over time. It's about building systems that generate income without constant work.",
          wealthy:
            "The average millionaire has seven income streams. They don't work seven jobs — they've built systems, investments, and businesses that generate income without their constant involvement.",
        },
      ],
    },
    {
      id: 2,
      title: "Types of Income Streams",
      content: [
        {
          type: "list",
          title: "Income stream categories:",
          items: [
            "Active income: Trading time for money (job, freelancing, consulting)",
            "Portfolio income: Returns from investments (dividends, capital gains, interest)",
            "Rental income: Real estate or property rentals",
            "Royalty income: Books, courses, music, patents — create once, earn repeatedly",
            "Business income: Businesses you own but don't actively run",
            "Digital assets: Online businesses, apps, affiliate income",
          ],
        },
        {
          type: "comparison",
          left: {
            title: "Active Income",
            subtitle: "Requires your time",
            items: [
              "Highest earning potential initially",
              "Stops when you stop working",
              "Limited by hours in a day",
              "Taxed at highest rates",
              "Essential for building other streams",
            ],
            highlight: "neutral",
          },
          right: {
            title: "Passive Income",
            subtitle: "Requires your capital or creation",
            items: [
              "Lower initial returns usually",
              "Continues without your time",
              "Can scale infinitely",
              "Often taxed at lower rates",
              "The goal for financial independence",
            ],
            highlight: "positive",
          },
        },
        {
          type: "callout",
          variant: "key",
          title: "The progression",
          content:
            "Most people start with active income, use it to build savings, invest those savings for portfolio income, and eventually build other passive streams. Active income funds the transition to passive income.",
        },
      ],
      mini_quiz: {
        id: "ch10_s2_quiz",
        questions: [
          {
            id: "ch10_s2_q1",
            type: "multiple_choice",
            question: "How many income streams does the average millionaire have?",
            options: ["1-2", "3-4", "7", "10+"],
            correct_answer: 2,
            explanation:
              "Studies show the average millionaire has seven income streams. This diversification provides security and accelerates wealth building.",
          },
        ],
      },
    },
    {
      id: 3,
      title: "Starting Your First Side Income",
      content: [
        {
          type: "story",
          title: "Maya's Side Project",
          content:
            "Maya starts small. She helps a friend's small business with their finances on weekends — her 'side consulting.' It's only $500/month, but she realizes: this money goes straight to investments. If she can build this to $1,000/month, she's adding $12,000/year to her wealth-building. That compounds to $500,000+ over 25 years.",
        },
        {
          type: "list",
          title: "Side income ideas to consider:",
          items: [
            "Freelancing your job skills (writing, design, coding, marketing)",
            "Consulting in your area of expertise",
            "Teaching or tutoring (online or in-person)",
            "Creating content (YouTube, blog, podcast)",
            "Selling products (handmade, dropshipping, digital)",
            "Renting assets you own (room, car, equipment)",
          ],
        },
        {
          type: "callout",
          variant: "tip",
          title: "Start with what you know",
          content:
            "Your fastest path to side income is monetizing skills you already have. What do people ask you for help with? What do colleagues compliment you on? Start there.",
        },
        {
          type: "callout",
          variant: "action",
          title: "The $500/month target",
          content:
            "Aim to build a side income of $500/month first. It's achievable, and invested consistently, it can grow to hundreds of thousands over time. Plus, it proves to yourself you can do it.",
        },
      ],
    },
    {
      id: 4,
      title: "Building Investment Income",
      content: [
        {
          type: "text",
          content:
            "For most people, portfolio income will become their largest passive income stream. As your investments grow, they generate dividends, interest, and gains that can eventually replace your salary.",
        },
        {
          type: "formula",
          title: "Investment income math",
          formula: "Annual Income = Portfolio Value × Yield Rate",
          example:
            "A $1,000,000 portfolio at 4% yield = $40,000/year in passive income. At 3% = $30,000. Build the portfolio, live off the income.",
        },
        {
          type: "list",
          title: "Ways to generate investment income:",
          items: [
            "Dividend stocks and funds: Regular quarterly payments",
            "Bond funds: Interest payments (usually monthly)",
            "REITs: High dividends from real estate (required to distribute 90%+ of income)",
            "Selling covered calls: Income from options strategies",
            "Portfolio withdrawals: Systematic sales from growth investments",
          ],
        },
        {
          type: "callout",
          variant: "wealthy",
          content:
            "The wealthy often live entirely off investment income — never touching principal. Their money generates enough income to fund their lifestyle while the principal continues to grow.",
        },
      ],
    },
    {
      id: 5,
      title: "Your Income Diversification Plan",
      content: [
        {
          type: "list",
          title: "Building your income streams:",
          ordered: true,
          items: [
            "Secure your primary income: Perform well at your job — it funds everything else",
            "Maximize investment income: Contribute to investment accounts consistently",
            "Start one side project: Choose something that fits your skills and schedule",
            "Scale what works: Once something generates income, see if it can grow",
            "Consider real estate: Even one rental property adds a stream",
            "Create digital assets: Content, courses, tools that generate passive income",
          ],
        },
        {
          type: "callout",
          variant: "key",
          title: "Chapter takeaways",
          content:
            "• Multiple income streams provide security and accelerate wealth\n• The average millionaire has seven income sources\n• Active income funds the transition to passive income\n• Start with skills you already have\n• Investment income can eventually replace your salary",
        },
      ],
    },
  ],
  final_quiz: [
    {
      id: "ch10_final_1",
      type: "multiple_choice",
      question: "What's the main difference between active and passive income?",
      options: [
        "Active income is higher",
        "Passive income requires no effort ever",
        "Active income requires ongoing time; passive doesn't",
        "Only passive income is taxable",
      ],
      correct_answer: 2,
      explanation:
        "Active income requires your ongoing time and effort. Passive income continues flowing without your constant involvement (though it usually requires upfront effort to create).",
    },
    {
      id: "ch10_final_2",
      type: "multiple_choice",
      question: "What is portfolio income?",
      options: [
        "Income from your job",
        "Income from investments (dividends, interest, capital gains)",
        "Income from selling your portfolio",
        "Income only from stocks",
      ],
      correct_answer: 1,
      explanation:
        "Portfolio income comes from your investments: dividends from stocks, interest from bonds, capital gains from selling appreciated assets.",
    },
    {
      id: "ch10_final_3",
      type: "true_false",
      question: "You need to be wealthy before you can have multiple income streams.",
      options: ["True", "False"],
      correct_answer: 1,
      explanation:
        "False! Many income streams can be built alongside a regular job — freelancing, side projects, small investments. Multiple streams help you BECOME wealthy.",
    },
    {
      id: "ch10_final_4",
      type: "multiple_choice",
      question: "What's a reasonable annual income from a $1,000,000 investment portfolio?",
      options: ["$10,000 (1%)", "$30,000-40,000 (3-4%)", "$100,000 (10%)", "$200,000 (20%)"],
      correct_answer: 1,
      explanation:
        "A sustainable withdrawal/yield rate is typically 3-4%, meaning $30,000-40,000 annually from a $1M portfolio without depleting principal.",
    },
    {
      id: "ch10_final_5",
      type: "multiple_choice",
      question: "What's the best way to start a side income stream?",
      options: [
        "Learn an entirely new skill",
        "Wait until you have extra time",
        "Monetize skills you already have",
        "Invest in a franchise",
      ],
      correct_answer: 2,
      explanation:
        "The fastest path to side income is monetizing skills you already have. What do people ask you for help with? What are you already good at?",
    },
  ],
};

// ===========================================
// Chapter 11: Understanding FIRE
// ===========================================

const chapter11: Chapter = {
  id: 11,
  title: "Understanding FIRE",
  subtitle: "What FIRE really means",
  phase: "FIRE Path",
  phase_number: 5,
  estimated_time: "12 min",
  sections: [
    {
      id: 1,
      title: "What Is FIRE?",
      content: [
        {
          type: "story",
          title: "Maya Discovers FIRE",
          content:
            "Two years into her journey, Maya stumbles across a blog post about 'FIRE.' Financial Independence, Retire Early. People retiring in their 30s and 40s. 'This can't be real,' she thinks. But the math checks out. She realizes: everything she's been doing — the saving, investing, income building — it all leads here.",
        },
        {
          type: "text",
          content:
            "FIRE isn't about never working again. It's about reaching a point where work becomes optional — where your investments generate enough income to cover your expenses forever. It's buying your freedom.",
        },
        {
          type: "callout",
          variant: "key",
          title: "The FIRE definition",
          content:
            "Financial Independence = When your investment income covers your expenses. You could stop working forever and your money would sustain you indefinitely. Retire Early = Optional. Many FIRE achievers keep working — but on their terms.",
        },
      ],
    },
    {
      id: 2,
      title: "The Different Types of FIRE",
      content: [
        {
          type: "text",
          content:
            "FIRE isn't one-size-fits-all. Different people pursue different versions based on their income, spending preferences, and lifestyle goals.",
        },
        {
          type: "list",
          title: "FIRE variations:",
          items: [
            "LeanFIRE: Minimal spending ($20-40k/year). Requires smaller portfolio. Frugal lifestyle in retirement.",
            "Traditional FIRE: Moderate spending ($40-80k/year). The 'standard' path most people follow.",
            "FatFIRE: High spending ($100k+/year). Requires larger portfolio. Maintains affluent lifestyle.",
            "BaristaFIRE: Reaches partial FIRE, then works part-time to cover gap. Lower portfolio needed.",
            "CoastFIRE: Saves enough early that compound growth will fund future retirement. Can reduce saving rate now.",
          ],
        },
        {
          type: "comparison",
          left: {
            title: "LeanFIRE",
            subtitle: "$40k/year spending",
            items: [
              "Portfolio needed: ~$1,000,000",
              "Frugal lifestyle required",
              "Achievable in 10-15 years",
              "Geographic arbitrage helpful",
              "Less margin for error",
            ],
            highlight: "neutral",
          },
          right: {
            title: "FatFIRE",
            subtitle: "$150k/year spending",
            items: [
              "Portfolio needed: ~$3,750,000",
              "Maintains current lifestyle",
              "Takes longer to achieve",
              "More flexibility and cushion",
              "Higher income usually required",
            ],
            highlight: "neutral",
          },
        },
        {
          type: "callout",
          variant: "tip",
          title: "There's no wrong answer",
          content:
            "Choose the FIRE version that matches YOUR values. LeanFIRE gets you free fastest. FatFIRE maintains luxury. Most people land somewhere in between.",
        },
      ],
      mini_quiz: {
        id: "ch11_s2_quiz",
        questions: [
          {
            id: "ch11_s2_q1",
            type: "multiple_choice",
            question: "What does 'Financial Independence' mean?",
            options: [
              "Having no debt",
              "Your investments cover your expenses indefinitely",
              "Making a high salary",
              "Owning your home outright",
            ],
            correct_answer: 1,
            explanation:
              "Financial Independence means your investment income covers your living expenses — work becomes optional.",
          },
        ],
      },
    },
    {
      id: 3,
      title: "The 4% Rule Explained",
      content: [
        {
          type: "text",
          content:
            "The most famous concept in FIRE is the '4% rule' — the idea that you can safely withdraw 4% of your portfolio per year and not run out of money over a 30-year retirement.",
        },
        {
          type: "formula",
          title: "The 4% Rule",
          formula: "Annual Spending ÷ 0.04 = Required Portfolio (OR Portfolio × 0.04 = Safe Annual Withdrawal)",
          example:
            "$50,000/year spending ÷ 0.04 = $1,250,000 needed. Once you have $1.25M invested, you can safely withdraw $50k/year.",
        },
        {
          type: "callout",
          variant: "key",
          title: "The Rule of 25",
          content:
            "Flip the 4% rule: multiply your annual spending by 25 to get your FIRE number. $40k × 25 = $1M. $60k × 25 = $1.5M. $100k × 25 = $2.5M.",
        },
        {
          type: "myth_reality",
          myth: "The 4% rule means you'll definitely run out of money in 30 years.",
          reality:
            "The 4% rule is actually conservative. In most historical scenarios, the portfolio GREW over time. The 4% rate survived even the Great Depression and 2008. Many FIRE achievers end up wealthier than when they started.",
          wealthy:
            "The wealthy often use 3-3.5% to be even more conservative, building in extra cushion. They'd rather have too much than risk running out.",
        },
      ],
    },
    {
      id: 4,
      title: "Why FIRE Is Achievable",
      content: [
        {
          type: "text",
          content:
            "FIRE sounds impossible until you run the math. The key insight: high savings rates matter more than high income. Someone saving 50% of their income reaches FI in about 17 years — regardless of how much they earn.",
        },
        {
          type: "list",
          title: "Years to FIRE by savings rate:",
          items: [
            "10% savings rate: ~51 years to FIRE",
            "20% savings rate: ~37 years to FIRE",
            "30% savings rate: ~28 years to FIRE",
            "50% savings rate: ~17 years to FIRE",
            "70% savings rate: ~8.5 years to FIRE",
          ],
        },
        {
          type: "callout",
          variant: "wealthy",
          content:
            "The path to FIRE is simple (not easy): maximize savings rate, invest in index funds, wait. The hard part is living below your means when everyone around you doesn't. The reward is freedom decades before others.",
        },
      ],
    },
    {
      id: 5,
      title: "Is FIRE Right for You?",
      content: [
        {
          type: "text",
          content:
            "FIRE isn't for everyone — and that's okay. But even if you don't want to retire early, pursuing financial independence gives you options, security, and the ability to say 'no' to things you don't want.",
        },
        {
          type: "callout",
          variant: "action",
          title: "This week's reflection",
          content:
            "1. What would you do if work was optional?\n2. Which FIRE variant resonates with you?\n3. What's your current savings rate?\n4. What could you change to increase it?",
        },
        {
          type: "callout",
          variant: "key",
          title: "Chapter takeaways",
          content:
            "• FIRE = Financial Independence, Retire Early (work becomes optional)\n• Different types: LeanFIRE, Traditional, FatFIRE, BaristaFIRE, CoastFIRE\n• The 4% rule: withdraw 4% annually, portfolio lasts indefinitely\n• Rule of 25: multiply annual spending by 25 = FIRE number\n• Savings rate determines years to FIRE — not income level",
        },
      ],
    },
  ],
  final_quiz: [
    {
      id: "ch11_final_1",
      type: "multiple_choice",
      question: "What does the 'FI' in FIRE stand for?",
      options: ["Fast Income", "Financial Independence", "Future Investment", "Free Interest"],
      correct_answer: 1,
      explanation:
        "FI stands for Financial Independence — when your investment income covers your expenses and work becomes optional.",
    },
    {
      id: "ch11_final_2",
      type: "multiple_choice",
      question: "Using the 4% rule, how much do you need invested to safely withdraw $60,000/year?",
      options: ["$600,000", "$1,000,000", "$1,500,000", "$2,400,000"],
      correct_answer: 2,
      explanation:
        "Using the 4% rule: $60,000 ÷ 0.04 = $1,500,000. Or multiply by 25: $60,000 × 25 = $1,500,000.",
    },
    {
      id: "ch11_final_3",
      type: "true_false",
      question: "A higher income is more important than a high savings rate for reaching FIRE.",
      options: ["True", "False"],
      correct_answer: 1,
      explanation:
        "False! Savings rate is the key determinant. Someone earning $50k saving 50% reaches FIRE faster than someone earning $200k saving 10%.",
    },
    {
      id: "ch11_final_4",
      type: "multiple_choice",
      question: "What is 'LeanFIRE'?",
      options: [
        "Retiring without any savings",
        "FIRE with minimal spending and a frugal lifestyle",
        "Only investing in lean startup companies",
        "Working until traditional retirement age",
      ],
      correct_answer: 1,
      explanation:
        "LeanFIRE means achieving FIRE with lower annual spending (typically $20-40k), requiring a smaller portfolio but a more frugal lifestyle.",
    },
    {
      id: "ch11_final_5",
      type: "multiple_choice",
      question: "Approximately how many years to reach FIRE with a 50% savings rate?",
      options: ["5-7 years", "10-12 years", "15-17 years", "25-30 years"],
      correct_answer: 2,
      explanation:
        "At a 50% savings rate, you can reach FIRE in approximately 17 years, regardless of your income level.",
    },
  ],
};

// ===========================================
// Chapter 12: Calculate Your FIRE Number
// ===========================================

const chapter12: Chapter = {
  id: 12,
  title: "Calculate Your FIRE Number",
  subtitle: "Your freedom number",
  phase: "FIRE Path",
  phase_number: 5,
  estimated_time: "14 min",
  sections: [
    {
      id: 1,
      title: "Finding Your Number",
      content: [
        {
          type: "story",
          title: "Maya's FIRE Number",
          content:
            "Maya sits down with a spreadsheet. Her current expenses: $3,200/month, or $38,400/year. Using the Rule of 25: $38,400 × 25 = $960,000. 'Under a million,' she thinks. 'That's actually... possible.' Then she remembers: some expenses will change in retirement. Time to get precise.",
        },
        {
          type: "text",
          content:
            "Your FIRE number isn't one fixed amount — it depends on the lifestyle you want in retirement. The goal is to be realistic, not overly optimistic or pessimistic.",
        },
        {
          type: "formula",
          title: "The FIRE Number Formula",
          formula: "FIRE Number = Annual Retirement Spending × 25",
          example:
            "If you need $50,000/year in retirement: $50,000 × 25 = $1,250,000 FIRE number.",
        },
      ],
    },
    {
      id: 2,
      title: "Estimating Retirement Expenses",
      content: [
        {
          type: "text",
          content:
            "Your retirement expenses won't be identical to your current expenses. Some costs go down (commuting, work clothes, payroll taxes), while others might go up (healthcare, hobbies, travel).",
        },
        {
          type: "comparison",
          left: {
            title: "Costs That Often Decrease",
            subtitle: "In early retirement",
            items: [
              "Commuting and work transportation",
              "Work clothes and lunches",
              "Retirement savings (you're done!)",
              "Mortgage (if paid off)",
              "Payroll taxes (SS, Medicare)",
            ],
            highlight: "positive",
          },
          right: {
            title: "Costs That Often Increase",
            subtitle: "In early retirement",
            items: [
              "Healthcare (until Medicare at 65)",
              "Travel and hobbies",
              "Home maintenance (more time at home)",
              "Entertainment and leisure",
              "Potentially higher taxes in early years",
            ],
            highlight: "negative",
          },
        },
        {
          type: "callout",
          variant: "tip",
          title: "The 80% rule of thumb",
          content:
            "Many FIRE planners estimate needing 80-100% of current spending in retirement. Without a mortgage, maybe 70%. With lots of travel plans, maybe 120%. Know your priorities.",
        },
      ],
      mini_quiz: {
        id: "ch12_s2_quiz",
        questions: [
          {
            id: "ch12_s2_q1",
            type: "multiple_choice",
            question: "Which expense typically INCREASES in early retirement?",
            options: ["Commuting costs", "Work clothes", "Healthcare before 65", "Retirement savings"],
            correct_answer: 2,
            explanation:
              "Healthcare costs typically increase in early retirement since you lose employer coverage but aren't yet eligible for Medicare at 65.",
          },
        ],
      },
    },
    {
      id: 3,
      title: "Accounting for Healthcare",
      content: [
        {
          type: "text",
          content:
            "Healthcare is the biggest wildcard for early retirees. Without employer coverage and before Medicare (age 65), you'll need to budget for this significant expense.",
        },
        {
          type: "list",
          title: "Healthcare options before 65:",
          items: [
            "ACA Marketplace plans: Subsidies available based on income",
            "COBRA: Continue employer coverage for 18 months (expensive)",
            "Spouse's plan: If your partner still works",
            "Health sharing ministries: Alternative to insurance (not for everyone)",
            "Part-time work with benefits: BaristaFIRE approach",
          ],
        },
        {
          type: "callout",
          variant: "wealthy",
          content:
            "Smart FIRE planners use low-income years strategically. By keeping taxable income low in early retirement, you can qualify for substantial ACA subsidies, dramatically reducing healthcare costs.",
        },
        {
          type: "callout",
          variant: "key",
          title: "Budget $10-20k for healthcare",
          content:
            "A safe estimate for a couple before 65 is $10,000-20,000/year for healthcare (premiums + deductibles + out-of-pocket). Add this to your FIRE number calculation.",
        },
      ],
    },
    {
      id: 4,
      title: "Building In Safety Margins",
      content: [
        {
          type: "text",
          content:
            "The 4% rule has worked historically, but past performance doesn't guarantee future results. Building in safety margins makes your FIRE plan more robust.",
        },
        {
          type: "list",
          title: "Safety margin strategies:",
          items: [
            "Use 3.5% instead of 4%: Increases required portfolio by 14%",
            "Plan for inflation: Build in 2-3% annual expense growth",
            "Keep some earning capacity: Don't fully 'retire' from earning",
            "Maintain flexibility: Be willing to cut spending in bad years",
            "Consider Social Security: It's a bonus, don't count on current benefit levels",
            "Geographic flexibility: Ability to relocate to lower-cost areas",
          ],
        },
        {
          type: "callout",
          variant: "warning",
          title: "Sequence of returns risk",
          content:
            "Bad returns in early retirement hurt more than bad returns later. Having flexibility to reduce spending or earn extra in the first 5-10 years provides crucial protection.",
        },
      ],
    },
    {
      id: 5,
      title: "Your FIRE Number Worksheet",
      content: [
        {
          type: "callout",
          variant: "action",
          title: "Calculate your FIRE number",
          content:
            "1. List your current monthly expenses\n2. Adjust for retirement changes (add healthcare, subtract commuting, etc.)\n3. Calculate annual retirement spending\n4. Multiply by 25 (or 28-30 for extra safety)\n5. This is your FIRE number — your target portfolio",
        },
        {
          type: "formula",
          title: "Example calculation",
          formula: "($3,500/mo expenses + $1,000/mo healthcare) × 12 × 25 = $1,350,000",
          example:
            "Maya needs $4,500/month in retirement. $4,500 × 12 = $54,000/year. $54,000 × 25 = $1,350,000 FIRE number.",
        },
        {
          type: "callout",
          variant: "key",
          title: "Chapter takeaways",
          content:
            "• FIRE number = Annual retirement spending × 25\n• Some expenses decrease in retirement, others increase\n• Healthcare is the biggest unknown before age 65\n• Build in safety margins with lower withdrawal rates\n• Maintain flexibility and some earning capacity",
        },
      ],
    },
  ],
  final_quiz: [
    {
      id: "ch12_final_1",
      type: "multiple_choice",
      question: "If you need $45,000/year in retirement, what's your FIRE number using the Rule of 25?",
      options: ["$450,000", "$900,000", "$1,125,000", "$1,800,000"],
      correct_answer: 2,
      explanation:
        "$45,000 × 25 = $1,125,000. This is the portfolio needed to safely withdraw $45,000/year.",
    },
    {
      id: "ch12_final_2",
      type: "multiple_choice",
      question: "What is 'sequence of returns risk'?",
      options: [
        "The risk of bad returns throughout retirement",
        "The heightened risk of bad returns in early retirement years",
        "The risk of running out of investment options",
        "The risk of inflation",
      ],
      correct_answer: 1,
      explanation:
        "Sequence of returns risk means bad returns in the early years of retirement hurt your portfolio more than bad returns later, because you're withdrawing from a declining portfolio.",
    },
    {
      id: "ch12_final_3",
      type: "true_false",
      question: "Using 3.5% instead of 4% withdrawal rate increases your required portfolio.",
      options: ["True", "False"],
      correct_answer: 0,
      explanation:
        "True! A lower withdrawal rate means you need a larger portfolio. 3.5% requires about 14% more than 4%: multiply by 28.5 instead of 25.",
    },
    {
      id: "ch12_final_4",
      type: "multiple_choice",
      question: "Why might healthcare costs be higher in early retirement?",
      options: [
        "You're less healthy",
        "You lose employer coverage but aren't eligible for Medicare",
        "Insurance companies charge more",
        "You use healthcare more",
      ],
      correct_answer: 1,
      explanation:
        "Early retirees lose employer-subsidized coverage but must wait until age 65 for Medicare, creating a potentially expensive gap.",
    },
    {
      id: "ch12_final_5",
      type: "multiple_choice",
      question: "What's a reasonable annual healthcare budget for a couple before age 65?",
      options: ["$1,000-2,000", "$5,000-8,000", "$10,000-20,000", "$40,000+"],
      correct_answer: 2,
      explanation:
        "A safe estimate for a couple's healthcare costs before 65 (premiums + deductibles + out-of-pocket) is $10,000-20,000/year.",
    },
  ],
};

// ===========================================
// Chapter 13: Your FIRE Investment Strategy
// ===========================================

const chapter13: Chapter = {
  id: 13,
  title: "Your FIRE Investment Strategy",
  subtitle: "Portfolio for early retirement",
  phase: "FIRE Path",
  phase_number: 5,
  estimated_time: "14 min",
  sections: [
    {
      id: 1,
      title: "The FIRE Portfolio Philosophy",
      content: [
        {
          type: "story",
          title: "Alex's Portfolio",
          content:
            "Maya asks Alex what he's invested in. 'About 80% total US stock market index fund, 10% international stocks, 10% bonds,' he says. 'That's it?' Maya asks, expecting complex strategies. 'That's it. Simple, low-cost, diversified. I've beaten most professionals for 15 years.'",
        },
        {
          type: "text",
          content:
            "The FIRE community has largely converged on a simple truth: low-cost index funds beat most active strategies over the long term. Simplicity wins.",
        },
        {
          type: "myth_reality",
          myth: "You need complex investment strategies to retire early.",
          reality:
            "Most successful FIRE achievers use simple index fund portfolios. The 'secret' isn't clever investing — it's high savings rates and consistency.",
          wealthy:
            "The wealthy understand that time in the market beats timing the market. They invest consistently in low-cost index funds and let compound growth do the work.",
        },
      ],
    },
    {
      id: 2,
      title: "The Three-Fund Portfolio",
      content: [
        {
          type: "text",
          content:
            "The 'three-fund portfolio' is legendary in the FIRE community. It's simple, cheap, diversified, and has performed excellently over decades.",
        },
        {
          type: "list",
          title: "The three-fund portfolio:",
          ordered: true,
          items: [
            "US Total Stock Market (60-80%): VTI, VTSAX, or FSKAX",
            "International Stocks (10-20%): VXUS, VTIAX, or FTIHX",
            "US Bonds (10-20%): BND, VBTLX, or FXNAX",
          ],
        },
        {
          type: "callout",
          variant: "key",
          title: "Why this works",
          content:
            "With these three funds, you own virtually every publicly traded company in the world, plus government and corporate bonds for stability. Total diversification in three simple holdings.",
        },
        {
          type: "callout",
          variant: "tip",
          title: "Target date funds alternative",
          content:
            "If even three funds feels complex, target date funds (like Vanguard Target Retirement 2045) combine everything into one fund that automatically adjusts as you age.",
        },
      ],
      mini_quiz: {
        id: "ch13_s2_quiz",
        questions: [
          {
            id: "ch13_s2_q1",
            type: "multiple_choice",
            question: "What are the three components of a typical three-fund portfolio?",
            options: [
              "Growth stocks, value stocks, bonds",
              "US stocks, international stocks, bonds",
              "Large cap, small cap, mid cap",
              "Tech, healthcare, finance",
            ],
            correct_answer: 1,
            explanation:
              "The classic three-fund portfolio consists of US total stock market, international stocks, and bonds — simple and comprehensive diversification.",
          },
        ],
      },
    },
    {
      id: 3,
      title: "Asset Allocation by Phase",
      content: [
        {
          type: "text",
          content:
            "Your allocation should shift as you move through different phases of your FIRE journey. Higher risk when you're far from FIRE, more conservative as you approach and enter retirement.",
        },
        {
          type: "comparison",
          left: {
            title: "Accumulation Phase",
            subtitle: "10+ years from FIRE",
            items: [
              "90-100% stocks",
              "Maximum growth potential",
              "Can ride out volatility",
              "Time to recover from crashes",
              "Focus on building wealth",
            ],
            highlight: "positive",
          },
          right: {
            title: "Early Retirement Phase",
            subtitle: "Living off portfolio",
            items: [
              "70-80% stocks, 20-30% bonds",
              "Still need growth (40+ year horizon)",
              "Some stability for withdrawals",
              "Can reduce stocks if nervous",
              "Bonds act as buffer in crashes",
            ],
            highlight: "neutral",
          },
        },
        {
          type: "callout",
          variant: "wealthy",
          content:
            "Many FIRE achievers stay aggressive (80%+ stocks) even in retirement because they're planning for a 40-50 year retirement. Bonds don't grow enough to sustain that long a time horizon.",
        },
      ],
    },
    {
      id: 4,
      title: "The Bucket Strategy",
      content: [
        {
          type: "text",
          content:
            "The bucket strategy helps manage sequence of returns risk by separating your portfolio into time-based 'buckets.'",
        },
        {
          type: "list",
          title: "Three-bucket approach:",
          items: [
            "Bucket 1 (1-2 years): Cash in high-yield savings. Cover near-term expenses without selling stocks.",
            "Bucket 2 (3-5 years): Bonds or stable investments. Refills bucket 1 as needed.",
            "Bucket 3 (6+ years): Stocks for long-term growth. Refills bucket 2 periodically.",
          ],
        },
        {
          type: "callout",
          variant: "key",
          title: "The bucket advantage",
          content:
            "When stocks crash, you don't need to sell. Live off buckets 1 and 2 while waiting for bucket 3 to recover. This prevents locking in losses.",
        },
        {
          type: "callout",
          variant: "tip",
          title: "Refilling buckets",
          content:
            "In good years, sell some stocks to refill bonds and cash buckets. Keep 2-3 years of expenses in buckets 1-2 at all times.",
        },
      ],
    },
    {
      id: 5,
      title: "Your Investment Action Plan",
      content: [
        {
          type: "callout",
          variant: "action",
          title: "Set up your FIRE portfolio",
          content:
            "1. Choose your target allocation (e.g., 80/10/10)\n2. Select your funds (three-fund or target date)\n3. Set up automatic monthly investments\n4. Rebalance once per year\n5. Ignore daily market movements",
        },
        {
          type: "callout",
          variant: "key",
          title: "Chapter takeaways",
          content:
            "• Simple index fund portfolios beat most complex strategies\n• The three-fund portfolio covers global diversification\n• Stay aggressive during accumulation; moderate in retirement\n• The bucket strategy protects against sequence of returns risk\n• Automate, rebalance annually, and ignore the noise",
        },
      ],
    },
  ],
  final_quiz: [
    {
      id: "ch13_final_1",
      type: "multiple_choice",
      question: "What percentage of stocks do most FIRE portfolios hold during the accumulation phase?",
      options: ["40-50%", "60-70%", "80-100%", "100% (never any bonds)"],
      correct_answer: 2,
      explanation:
        "During accumulation (10+ years from FIRE), most portfolios are 80-100% stocks to maximize growth while you have time to recover from volatility.",
    },
    {
      id: "ch13_final_2",
      type: "multiple_choice",
      question: "What is the purpose of 'Bucket 1' in the bucket strategy?",
      options: [
        "Long-term growth",
        "1-2 years of cash for near-term expenses",
        "Maximum risk exposure",
        "International diversification",
      ],
      correct_answer: 1,
      explanation:
        "Bucket 1 holds 1-2 years of expenses in cash or high-yield savings, so you don't need to sell stocks to cover expenses during market downturns.",
    },
    {
      id: "ch13_final_3",
      type: "true_false",
      question: "Complex investment strategies are necessary to achieve FIRE.",
      options: ["True", "False"],
      correct_answer: 1,
      explanation:
        "False! Most successful FIRE achievers use simple, low-cost index fund portfolios. The 'secret' is high savings rates and consistency, not clever investing.",
    },
    {
      id: "ch13_final_4",
      type: "multiple_choice",
      question: "How often should you rebalance a FIRE portfolio?",
      options: ["Daily", "Monthly", "Quarterly", "Annually"],
      correct_answer: 3,
      explanation:
        "Annual rebalancing is sufficient for most FIRE portfolios. More frequent rebalancing can trigger taxes and doesn't improve returns.",
    },
    {
      id: "ch13_final_5",
      type: "multiple_choice",
      question: "Why do some FIRE retirees keep 80%+ in stocks even during retirement?",
      options: [
        "They don't understand risk",
        "Bonds aren't available to retirees",
        "They need growth for a 40-50 year retirement",
        "Stocks are guaranteed to never lose value",
      ],
      correct_answer: 2,
      explanation:
        "Early retirees face potentially 40-50 year retirements. Bonds don't grow enough to sustain that long, so stocks are needed for continued growth.",
    },
  ],
};

// ===========================================
// Chapter 14: Executing Your FIRE Plan
// ===========================================

const chapter14: Chapter = {
  id: 14,
  title: "Executing Your FIRE Plan",
  subtitle: "Make your plan a reality",
  phase: "FIRE Path",
  phase_number: 5,
  estimated_time: "15 min",
  sections: [
    {
      id: 1,
      title: "From Knowledge to Action",
      content: [
        {
          type: "story",
          title: "Maya's Five-Year Journey",
          content:
            "Five years after that first conversation with Alex, Maya barely recognizes her financial life. Net worth: $340,000 (from -$23,000). Emergency fund: fully funded. Savings rate: 45%. Side income: $1,500/month. FIRE number: $1.1 million. Estimated FIRE date: 8 more years. 'The math actually works,' she realizes. She's halfway there.",
        },
        {
          type: "text",
          content:
            "You now have all the knowledge you need. The question is: will you execute? The difference between those who achieve FIRE and those who don't isn't knowledge — it's consistent action.",
        },
        {
          type: "callout",
          variant: "key",
          title: "The execution gap",
          content:
            "80% of success is showing up consistently. Set up the systems, automate everything possible, and focus on maintaining the habits. Let the math work.",
        },
      ],
    },
    {
      id: 2,
      title: "Your FIRE Action Timeline",
      content: [
        {
          type: "list",
          title: "Immediate actions (this week):",
          items: [
            "Calculate your current savings rate",
            "Set up automatic transfers to investment accounts",
            "Enroll in 401(k) and get full employer match",
            "Open a Roth IRA if eligible",
            "Calculate your FIRE number",
          ],
        },
        {
          type: "list",
          title: "30-day actions:",
          items: [
            "Review all subscriptions — cancel what you don't use",
            "Audit your biggest spending categories",
            "Move savings to high-yield account",
            "Set up automatic investing into index funds",
            "Track expenses for one full month",
          ],
        },
        {
          type: "list",
          title: "90-day actions:",
          items: [
            "Increase savings rate by at least 5%",
            "Start one side income project",
            "Build emergency fund to 3+ months",
            "Review insurance coverage",
            "Set up annual review calendar",
          ],
        },
        {
          type: "callout",
          variant: "action",
          title: "Start now",
          content:
            "Choose ONE action from the immediate list and do it TODAY. Right now. Not tomorrow, not next week. The best time to start was years ago. The second best time is now.",
        },
      ],
      mini_quiz: {
        id: "ch14_s2_quiz",
        questions: [
          {
            id: "ch14_s2_q1",
            type: "multiple_choice",
            question: "What's the most important factor in achieving FIRE?",
            options: [
              "High income",
              "Perfect investment timing",
              "Consistent action over time",
              "Living extremely frugally",
            ],
            correct_answer: 2,
            explanation:
              "Consistent action beats everything. Regular investing, maintained over years, is more powerful than high income or perfect timing.",
          },
        ],
      },
    },
    {
      id: 3,
      title: "Building Your Support System",
      content: [
        {
          type: "text",
          content:
            "FIRE is easier with support. Surrounding yourself with like-minded people helps maintain motivation and learn from others' experiences.",
        },
        {
          type: "list",
          title: "Building your FIRE community:",
          items: [
            "Join online communities (r/financialindependence, ChooseFI, Mr. Money Mustache forums)",
            "Find local FIRE meetups or start one",
            "Share your goals with supportive friends/family",
            "Follow FIRE bloggers and podcasts",
            "Consider finding an accountability partner",
          ],
        },
        {
          type: "callout",
          variant: "warning",
          title: "Handle skeptics gracefully",
          content:
            "Not everyone will understand your goals. Some may criticize or try to discourage you. Stay polite but firm. You don't need to convince anyone — just keep executing.",
        },
        {
          type: "callout",
          variant: "wealthy",
          content:
            "The wealthy often say their biggest advantage was surrounding themselves with others who had similar financial values. Your environment shapes your behaviors more than willpower.",
        },
      ],
    },
    {
      id: 4,
      title: "Staying the Course",
      content: [
        {
          type: "text",
          content:
            "The path to FIRE takes years. There will be setbacks, temptations, and moments of doubt. Here's how to stay on track.",
        },
        {
          type: "list",
          title: "Strategies for the long haul:",
          items: [
            "Track progress visually: Charts and graphs of net worth growth are motivating",
            "Celebrate milestones: $100k, 50% to goal, etc.",
            "Allow reasonable spending: Complete deprivation leads to burnout",
            "Revisit your 'why' regularly: Remember what you're working toward",
            "Adjust as needed: Life changes, and so can your plan",
          ],
        },
        {
          type: "callout",
          variant: "tip",
          title: "The 'one more year' trap",
          content:
            "When you reach your FIRE number, you might feel tempted to work 'just one more year' for extra cushion. This can go on forever. If you've hit your number with proper safety margins, consider that done is better than perfect.",
        },
      ],
    },
    {
      id: 5,
      title: "Your FIRE Commitment",
      content: [
        {
          type: "story",
          title: "Maya's Future",
          content:
            "Maya looks at her projections. At 41, she'll hit her FIRE number. She could keep working, doing only projects she cares about. Travel for months. Spend mornings reading instead of commuting. Be present for family. 'Is this real?' she asks Alex. 'You did everything we talked about,' he says. 'The math doesn't lie. You're going to be free.'",
        },
        {
          type: "callout",
          variant: "action",
          title: "Your commitment",
          content:
            "Write down:\n1. Your FIRE number\n2. Your target FIRE date\n3. Three actions you'll take this week\n4. Why financial independence matters to you\n\nSave this somewhere you'll see it regularly.",
        },
        {
          type: "callout",
          variant: "key",
          title: "Course summary",
          content:
            "• Build your foundation: banking, debt elimination, emergency fund\n• Protect what you build: insurance and safety nets\n• Invest consistently: index funds, maximize tax-advantaged accounts\n• Optimize: reduce taxes, build multiple income streams\n• Execute relentlessly: automate, track, stay the course\n\nYou have everything you need. Now go build your freedom.",
        },
        {
          type: "text",
          content:
            "Congratulations on completing this course! You now have the knowledge that most people never learn. The difference between achieving FIRE and dreaming about it is action. Start today.",
        },
      ],
    },
  ],
  final_quiz: [
    {
      id: "ch14_final_1",
      type: "multiple_choice",
      question: "What's the first thing you should do this week to start your FIRE journey?",
      options: [
        "Quit your job",
        "Calculate your savings rate and set up automatic investments",
        "Buy individual stocks",
        "Wait for the perfect time to start",
      ],
      correct_answer: 1,
      explanation:
        "Start immediately with basics: know your savings rate and automate investments. The perfect time is now, not later.",
    },
    {
      id: "ch14_final_2",
      type: "multiple_choice",
      question: "Why is community important for FIRE success?",
      options: [
        "Other people will give you money",
        "Like-minded people provide motivation and accountability",
        "You can't invest without a group",
        "The government requires it",
      ],
      correct_answer: 1,
      explanation:
        "Surrounding yourself with people who share your financial values provides motivation, accountability, and learning opportunities for the long FIRE journey.",
    },
    {
      id: "ch14_final_3",
      type: "true_false",
      question: "Once you reach your FIRE number, you should work 'one more year' for extra safety.",
      options: ["True", "False"],
      correct_answer: 1,
      explanation:
        "False! The 'one more year' trap can continue indefinitely. If you've built proper safety margins into your number, done is better than perfect.",
    },
    {
      id: "ch14_final_4",
      type: "multiple_choice",
      question: "What matters more than perfect investing strategies?",
      options: [
        "Timing the market perfectly",
        "Consistent action over time",
        "Having the highest income",
        "Picking the right stocks",
      ],
      correct_answer: 1,
      explanation:
        "Consistent action — regular saving and investing over years — beats perfect strategies. 80% of success is just showing up consistently.",
    },
    {
      id: "ch14_final_5",
      type: "multiple_choice",
      question: "What should you do if people criticize your FIRE goals?",
      options: [
        "Argue until they agree",
        "Give up on your goals",
        "Stay polite but firm, and keep executing",
        "Spend more to prove you're normal",
      ],
      correct_answer: 2,
      explanation:
        "Not everyone will understand FIRE. Handle skeptics gracefully — stay polite but firm. You don't need to convince anyone; just keep executing your plan.",
    },
  ],
};

// ===========================================
// All Chapters Array
// ===========================================

const chapters: Chapter[] = [
  chapter1,
  chapter2,
  chapter3,
  chapter4,
  chapter5,
  chapter6,
  chapter7,
  chapter8,
  chapter9,
  chapter10,
  chapter11,
  chapter12,
  chapter13,
  chapter14,
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
