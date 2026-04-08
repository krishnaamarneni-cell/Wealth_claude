/**
 * Pre-built carousel content packs for WealthClaude Instagram carousels.
 * Each template type (V3-V10) has 5-7 ready-to-use content packs
 * sourced from real WealthClaude product features and investing topics.
 */

import type { CarouselContentPackInsert } from '@/src/types/database'

// ============================================
// V3 — Bold Editorial (Libre Baskerville + Work Sans)
// Alternating light/dark slides, editorial numbers, green accent bar
// ============================================
export const v3Packs: CarouselContentPackInsert[] = [
  {
    template_type: 'v3',
    title: '5 Mistakes Investors Keep Making',
    category: 'educational',
    description: 'Common investing mistakes and how WealthClaude fixes them',
    is_featured: true,
    slides: [
      { tag: 'MISTAKE #01', heading: 'Not Benchmarking\nYour Returns', body: 'Without measuring against the S&P 500 or your target index, you have zero idea if your strategy is working.', fix: 'Track performance vs. benchmarks.' },
      { tag: 'MISTAKE #02', heading: 'Ignoring Dividend\nIncome', body: 'Dividends compound silently across markets. Not tracking them means missing a critical piece of total return.', fix: 'Monitor dividends across 6 regions.' },
      { tag: 'MISTAKE #03', heading: 'Hidden\nConcentration Risk', body: '40%+ in one sector without knowing it. Real diversification requires real allocation data.', fix: 'See your true allocation instantly.' },
      { tag: 'MISTAKE #04', heading: 'Too Many Tools,\nToo Little Clarity', body: 'Broker. Spreadsheet. News app. Calculator. When your tools are fragmented, your decisions are too.', fix: 'One platform. Every insight.' },
      { tag: 'MISTAKE #05', heading: 'Investing Without\na Target', body: 'No retirement number. No milestones. No timeline. Just hope — and that\'s not a strategy.', fix: 'Set goals. Track progress.' },
    ],
  },
  {
    template_type: 'v3',
    title: '5 Signs You Need a Portfolio Tracker',
    category: 'awareness',
    description: 'Warning signs that your investing approach needs better tools',
    slides: [
      { tag: 'SIGN #01', heading: 'You Check\nMultiple Apps Daily', body: 'One for stocks, one for crypto, another for dividends. If your portfolio lives in 3+ places, you\'re flying blind.', fix: 'Track everything in one dashboard.' },
      { tag: 'SIGN #02', heading: 'You Don\'t Know\nYour Real Returns', body: 'Seeing green doesn\'t mean you\'re beating the market. Without benchmarks, "good" is just a feeling.', fix: 'Compare against S&P 500 and more.' },
      { tag: 'SIGN #03', heading: 'Dividends Surprise\nYou', body: 'If you don\'t know when your next dividend payment is or how much it\'ll be, you\'re leaving money untracked.', fix: 'Dividend calendar with forecasting.' },
      { tag: 'SIGN #04', heading: 'You Avoid\nLooking at Losses', body: 'No trade analysis means no learning. Every loss has a lesson — if you can see the data.', fix: 'Trade analyzer shows every decision.' },
      { tag: 'SIGN #05', heading: 'Your Spreadsheet\nis a Mess', body: 'Manual tracking breaks. Formulas fail. Data gets stale. You need something built for this.', fix: 'Auto-updating, always accurate.' },
    ],
  },
  {
    template_type: 'v3',
    title: '5 Rules of Smart Diversification',
    category: 'educational',
    description: 'How to properly diversify your investment portfolio',
    slides: [
      { tag: 'RULE #01', heading: 'Spread Across\nGeographies', body: 'Your home market isn\'t the whole world. 51 global stock markets exist — are you in more than one?', fix: 'Track 51 markets on a 3D globe.' },
      { tag: 'RULE #02', heading: 'Balance\nYour Sectors', body: 'Tech-heavy? Finance-heavy? Sector concentration is invisible risk. You need real allocation data.', fix: 'See sector breakdown instantly.' },
      { tag: 'RULE #03', heading: 'Mix Asset\nClasses', body: 'Stocks, bonds, crypto, gold, commodities — each moves differently. True diversification spans all of them.', fix: 'Multi-asset support built in.' },
      { tag: 'RULE #04', heading: 'Rebalance\nRegularly', body: 'Winners grow. Losers shrink. Without rebalancing, your carefully planned allocation drifts into chaos.', fix: 'Portfolio analytics show drift.' },
      { tag: 'RULE #05', heading: 'Know Your\nCorrelations', body: 'Assets that move together aren\'t diversified. Understanding correlation is the key to real protection.', fix: 'Performance analytics reveal all.' },
    ],
  },
  {
    template_type: 'v3',
    title: '5 Dividend Investing Secrets',
    category: 'educational',
    description: 'What experienced dividend investors know that beginners don\'t',
    slides: [
      { tag: 'SECRET #01', heading: 'Yield on Cost\nMatters More', body: 'A stock you bought at $50 paying $3/year is 6% yield on cost — even if current yield is only 3%.', fix: 'Track yield on cost automatically.' },
      { tag: 'SECRET #02', heading: 'Global Dividends\nBeat Local', body: 'UK, Australia, Singapore, Europe — some of the best dividend payers are outside the US.', fix: 'Track dividends across 6 regions.' },
      { tag: 'SECRET #03', heading: 'Reinvestment\nis Everything', body: 'Compound growth from reinvested dividends accounts for 80%+ of long-term equity returns.', fix: 'See compounding in real time.' },
      { tag: 'SECRET #04', heading: 'Calendar\nYour Payments', body: 'Strategic timing means monthly income. Know exactly when each payment arrives.', fix: 'Dividend calendar with alerts.' },
      { tag: 'SECRET #05', heading: 'Growth Beats\nHigh Yield', body: 'A 2% yield growing 10%/year beats a static 5% yield within 10 years. Growth is the real play.', fix: 'Dividend growth analytics.' },
    ],
  },
  {
    template_type: 'v3',
    title: '5 Things Pros Track That You Don\'t',
    category: 'product',
    description: 'Professional-grade analytics available free on WealthClaude',
    is_featured: true,
    slides: [
      { tag: 'INSIGHT #01', heading: 'Market Breadth\nAnalysis', body: 'How many stocks are actually going up vs down? The headline index doesn\'t tell the real story.', fix: 'Market breadth dashboard built in.' },
      { tag: 'INSIGHT #02', heading: 'Fear & Greed\nIndex', body: 'When everyone is greedy, be cautious. When everyone is fearful, look for opportunity. Sentiment drives markets.', fix: 'Sentiment tracking on dashboard.' },
      { tag: 'INSIGHT #03', heading: 'Money Flow\nData', body: 'Where is institutional money moving? Capital flows reveal what\'s coming before price does.', fix: 'Money flow dashboard included.' },
      { tag: 'INSIGHT #04', heading: 'Sector\nRotation', body: 'Capital rotates between sectors in cycles. Knowing which sectors are gaining flow is alpha.', fix: '11 sector performance tracking.' },
      { tag: 'INSIGHT #05', heading: 'Macro\nIndicators', body: 'Inflation, GDP, unemployment by country — the big picture drives every portfolio\'s returns.', fix: 'Macro map across 160+ countries.' },
    ],
  },
]

// ============================================
// V5 — Bold Type (Bricolage Grotesque 800)
// UPPERCASE headings, ghost numbers, Nike energy
// ============================================
export const v5Packs: CarouselContentPackInsert[] = [
  {
    template_type: 'v5',
    title: 'Track 51 Markets. One Globe.',
    category: 'product',
    description: 'WealthClaude 3D globe feature showcase',
    is_featured: true,
    slides: [
      { tag: 'THE FEATURE', heading: 'THE ENTIRE\nWORLD ON\nONE SCREEN', body: '51 global stock markets. Live data. Interactive 3D globe. Click any country for instant market intelligence.' },
      { tag: 'LIVE DATA', heading: 'GREEN FOR\nGAINS. RED\nFOR LOSSES.', body: 'See every market\'s performance at a glance. Color-coded countries update in real time as markets open and close.' },
      { tag: 'CLICK & DIVE', heading: 'TAP ANY\nCOUNTRY.\nGET DATA.', body: 'Click a country on the globe. Instantly see index performance, AI-summarized news, and top movers.' },
      { tag: 'AI NEWS', heading: 'THREE\nSENTENCES.\nFULL STORY.', body: 'AI-summarized market news from global outlets. No noise. No clickbait. Just what you need to know.' },
      { tag: 'FREE', heading: 'ZERO COST.\nZERO LIMITS.\nSTART NOW.', body: 'The 3D globe is available on the free plan. No credit card. No trial. Just pure market intelligence.' },
    ],
  },
  {
    template_type: 'v5',
    title: 'Stop Guessing. Start Tracking.',
    category: 'awareness',
    description: 'Bold call to action for portfolio tracking',
    slides: [
      { tag: 'THE PROBLEM', heading: 'YOU THINK\nYOU\'RE UP\n20%.', body: 'But without benchmarking, you don\'t actually know. The S&P 500 might be up 25%. Are you really winning?' },
      { tag: 'THE TRUTH', heading: 'FEELINGS\nAREN\'T\nRETURNS.', body: 'Your gut says "good year." The data might say otherwise. Real investors measure. Guessers lose.' },
      { tag: 'THE FIX', heading: 'BENCHMARK.\nTRACK.\nIMPROVE.', body: 'Compare every position against market indices. See exactly where you\'re outperforming — and where you\'re not.' },
      { tag: 'THE TOOL', heading: 'ONE\nDASHBOARD.\nEVERYTHING.', body: 'Portfolio. Dividends. Performance. Heatmaps. News. All in one place. No more app-switching chaos.' },
      { tag: 'THE MOVE', heading: 'FREE.\nFOREVER.\nNO CATCH.', body: 'Join investors in 160+ countries. Track your portfolio the way professionals do. Start in 60 seconds.' },
    ],
  },
  {
    template_type: 'v5',
    title: 'Market Heatmaps Explained',
    category: 'educational',
    description: 'How to read and use market heatmaps',
    slides: [
      { tag: 'THE BASICS', heading: 'WHAT IS\nA MARKET\nHEATMAP?', body: 'A visual grid where each rectangle represents a stock. Size = market cap. Color = daily performance. Instant market overview.' },
      { tag: 'SIZE', heading: 'BIGGER\nBOX.\nBIGGER\nCOMPANY.', body: 'Apple dominates the S&P 500 heatmap because it\'s the largest company by market cap. Size tells the story of market weight.' },
      { tag: 'COLOR', heading: 'DEEP GREEN\n= WINNING.\nDEEP RED\n= LOSING.', body: 'Intensity matters. Pale green is +0.5%. Deep green is +3%+. Read the intensity, read the momentum.' },
      { tag: 'PATTERNS', heading: 'SPOT\nSECTOR\nROTATION.', body: 'When tech is red and energy is green, that\'s rotation. Heatmaps make sector movements impossible to miss.' },
      { tag: 'ACCESS', heading: 'S&P 500.\nNASDAQ.\nCRYPTO.', body: 'Three live heatmaps included free. See the entire market in seconds. No charts to configure. No learning curve.' },
    ],
  },
  {
    template_type: 'v5',
    title: 'Your Broker Can\'t Do This',
    category: 'product',
    is_featured: true,
    description: 'Features WealthClaude has that brokers don\'t',
    slides: [
      { tag: 'BROKERS', heading: 'YOUR BROKER\nSHOWS YOU\nTRADES.', body: 'Buy. Sell. Holdings. That\'s about it. Brokers are built for executing trades, not analyzing your portfolio.' },
      { tag: 'WE SHOW', heading: 'WE SHOW\nYOU THE\nBIG PICTURE.', body: 'Allocation by sector, geography, asset class. Performance vs benchmarks. Dividend forecasting. The full story.' },
      { tag: 'MULTI-BROKER', heading: 'IMPORT\nFROM 50+\nBROKERS.', body: 'Fidelity. Schwab. Interactive Brokers. Robinhood. DEGIRO. Trading 212. All in one place. Finally.' },
      { tag: 'GLOBAL', heading: '70+\nEXCHANGES.\nONE VIEW.', body: 'US, UK, Europe, Canada, Singapore, Australia, Brazil, South Korea. Your global portfolio, unified.' },
      { tag: 'SWITCH', heading: 'KEEP YOUR\nBROKER.\nADD US.', body: 'We don\'t replace your broker. We make every broker better. Import, analyze, improve. That\'s the WealthClaude way.' },
    ],
  },
  {
    template_type: 'v5',
    title: 'The Free Plan is Insane',
    category: 'product',
    description: 'Everything included in WealthClaude free tier',
    slides: [
      { tag: 'FREE', heading: 'PORTFOLIO\nTRACKING.\nFREE.', body: 'Track up to 10 holdings. Real-time prices. Performance charts. This alone replaces most paid apps.' },
      { tag: 'FREE', heading: 'MARKET\nHEATMAPS.\nFREE.', body: 'S&P 500, NASDAQ 100, and Crypto heatmaps. Live. Interactive. Most platforms charge $20/mo for this.' },
      { tag: 'FREE', heading: 'DIVIDEND\nTRACKER.\nFREE.', body: 'Track dividend income across multiple markets. Calendar view. Payment history. Yield analytics. All free.' },
      { tag: 'FREE', heading: '3D GLOBE.\n51 MARKETS.\nFREE.', body: 'Interactive 3D globe with live data from every major stock market on Earth. Usually a premium feature. Not here.' },
      { tag: 'FREE', heading: 'NO CREDIT\nCARD. NO\nTRIAL. EVER.', body: 'Free forever plan. Not a 7-day trial disguised as "free." Actually free. Sign up in 30 seconds.' },
    ],
  },
]

// ============================================
// V6 — Data Viz (Outfit font)
// SVG charts, stat callouts, progress meters
// ============================================
export const v6Packs: CarouselContentPackInsert[] = [
  {
    template_type: 'v6',
    title: 'Portfolio Allocation Breakdown',
    category: 'educational',
    description: 'How to read your portfolio allocation data',
    is_featured: true,
    slides: [
      { tag: 'SECTOR SPLIT', heading: 'Where Is Your\nMoney Actually?', body: 'Most investors are overweight in tech without realizing it. Your allocation breakdown reveals the truth.', stats: [{ label: 'Technology', value: '42', suffix: '%' }, { label: 'Healthcare', value: '18', suffix: '%' }, { label: 'Finance', value: '15', suffix: '%' }], chart_data: [{ label: 'Tech', value: 42, color: '#4ADE80' }, { label: 'Health', value: 18, color: '#7AEEA6' }, { label: 'Finance', value: 15, color: '#1E7A45' }, { label: 'Other', value: 25, color: '#333' }] },
      { tag: 'GEO SPREAD', heading: 'Geographic\nDiversification', body: 'Are you 90% US? That\'s not diversified. WealthClaude tracks your holdings across 70+ exchanges worldwide.', stats: [{ label: 'US Markets', value: '73', suffix: '%' }, { label: 'Europe', value: '15', suffix: '%' }, { label: 'Asia Pacific', value: '12', suffix: '%' }] },
      { tag: 'ASSET MIX', heading: 'Stocks vs Bonds\nvs Everything', body: 'A balanced portfolio spans multiple asset classes. See your exact mix of stocks, ETFs, crypto, bonds, and commodities.', stats: [{ label: 'Stocks', value: '65', suffix: '%' }, { label: 'ETFs', value: '20', suffix: '%' }, { label: 'Crypto', value: '10', suffix: '%' }, { label: 'Bonds', value: '5', suffix: '%' }] },
      { tag: 'RISK LEVEL', heading: 'Your Concentration\nRisk Score', body: 'Top 3 holdings making up 50%+ of your portfolio? That\'s concentrated risk. We flag it before it hurts.', stats: [{ label: 'Top 3 Weight', value: '48', suffix: '%' }, { label: 'Risk Level', value: 'Medium' }] },
      { tag: 'ACTION', heading: 'See Your\nReal Allocation', body: 'Import from 50+ brokers. Get instant breakdown by sector, geography, and asset class. Free to start.', stats: [{ label: 'Brokers', value: '50+' }, { label: 'Exchanges', value: '70+' }, { label: 'Cost', value: '$0' }] },
    ],
  },
  {
    template_type: 'v6',
    title: 'WealthClaude Platform Stats',
    category: 'social-proof',
    description: 'Platform statistics and growth metrics',
    is_featured: true,
    slides: [
      { tag: 'GLOBAL REACH', heading: 'Investors Across\n160+ Countries', body: 'From New York to Tokyo, investors worldwide trust WealthClaude to track their portfolios.', stats: [{ label: 'Countries', value: '160+' }, { label: 'Markets Tracked', value: '51' }, { label: 'Exchanges', value: '70+' }] },
      { tag: 'COVERAGE', heading: '20,000+ ETFs\nTracked', body: 'The most comprehensive ETF coverage of any free portfolio tracker. If it trades, we track it.', stats: [{ label: 'ETFs', value: '20K+' }, { label: 'Stocks', value: 'All' }, { label: 'Crypto', value: 'Yes' }] },
      { tag: 'FEATURES', heading: 'Professional Tools\nZero Cost', body: 'Heatmaps, 3D globe, dividend tracking, AI news — features that cost $50+/mo elsewhere. Free here.', stats: [{ label: 'Free Features', value: '15+' }, { label: 'Pro Price', value: '$9/mo' }, { label: 'Free Plan', value: 'Forever' }] },
      { tag: 'DIVIDENDS', heading: 'Global Dividend\nTracking', body: 'Track dividend income across US, UK, Europe, Canada, Singapore, and Australia. All from one dashboard.', stats: [{ label: 'Regions', value: '6' }, { label: 'Currencies', value: 'Multi' }] },
      { tag: 'JOIN', heading: 'Start Tracking\nIn 60 Seconds', body: 'No credit card. No bank linking. Import your holdings and see the full picture immediately.', stats: [{ label: 'Setup Time', value: '60s' }, { label: 'Bank Linking', value: 'None' }, { label: 'Cost', value: 'Free' }] },
    ],
  },
  {
    template_type: 'v6',
    title: 'Dividend Income Analysis',
    category: 'educational',
    description: 'Breaking down dividend income by region and yield',
    slides: [
      { tag: 'OVERVIEW', heading: 'Your Dividend\nDashboard', body: 'Track every payment, forecast future income, and optimize your yield — all from one screen.', stats: [{ label: 'Annual Income', value: '$4,200' }, { label: 'Avg Yield', value: '3.8%' }, { label: 'Yield on Cost', value: '5.2%' }], chart_data: [{ label: 'Q1', value: 1050 }, { label: 'Q2', value: 1100 }, { label: 'Q3', value: 980 }, { label: 'Q4', value: 1070 }] },
      { tag: 'BY REGION', heading: 'Regional\nBreakdown', body: 'US pays quarterly, UK pays semi-annually, Australia pays twice a year. Know your income calendar by region.', stats: [{ label: 'US', value: '58%' }, { label: 'UK', value: '22%' }, { label: 'Australia', value: '12%' }, { label: 'Europe', value: '8%' }] },
      { tag: 'CALENDAR', heading: 'Monthly\nPayment Map', body: 'Strategic portfolio construction means income every month. See exactly which stocks pay when.', stats: [{ label: 'Payments/Year', value: '47' }, { label: 'Months Covered', value: '12/12' }] },
      { tag: 'GROWTH', heading: 'Dividend\nGrowth Rate', body: 'The best dividend stocks increase payouts yearly. Track which of your holdings are growing their dividends.', stats: [{ label: '5Y Growth', value: '8.2%' }, { label: 'Growers', value: '15' }, { label: 'Cutters', value: '0' }] },
      { tag: 'START', heading: 'Track Your\nDividends Free', body: 'Import from any broker. See your full dividend picture across 6 regions. No credit card needed.', stats: [{ label: 'Regions', value: '6' }, { label: 'Cost', value: '$0' }] },
    ],
  },
  {
    template_type: 'v6',
    title: 'S&P 500 vs NASDAQ vs Crypto',
    category: 'educational',
    description: 'Comparing returns across major market indices',
    slides: [
      { tag: '1 YEAR', heading: '1-Year Returns\nComparison', body: 'How do the major indices stack up over the last 12 months? The data might surprise you.', stats: [{ label: 'S&P 500', value: '+24.7', suffix: '%' }, { label: 'NASDAQ 100', value: '+31.2', suffix: '%' }, { label: 'Bitcoin', value: '+89', suffix: '%' }], chart_data: [{ label: 'S&P 500', value: 24.7, color: '#4ADE80' }, { label: 'NASDAQ', value: 31.2, color: '#7AEEA6' }, { label: 'BTC', value: 89, color: '#FBBF24' }] },
      { tag: '5 YEAR', heading: '5-Year\nPerformance', body: 'Short-term noise vs long-term trends. Five years reveals the real story of each asset class.', stats: [{ label: 'S&P 500', value: '+82', suffix: '%' }, { label: 'NASDAQ 100', value: '+142', suffix: '%' }, { label: 'Bitcoin', value: '+410', suffix: '%' }] },
      { tag: 'VOLATILITY', heading: 'Risk vs\nReward', body: 'Higher returns come with higher volatility. Bitcoin\'s max drawdown was -77%. Can you stomach that?', stats: [{ label: 'S&P 500 Max DD', value: '-24%' }, { label: 'NASDAQ Max DD', value: '-33%' }, { label: 'BTC Max DD', value: '-77%' }] },
      { tag: 'HEATMAPS', heading: 'See It\nVisually', body: 'WealthClaude\'s heatmaps show S&P 500, NASDAQ 100, and Crypto markets in real time. Size = cap, color = performance.', stats: [{ label: 'Heatmaps', value: '3' }, { label: 'Update', value: 'Live' }, { label: 'Cost', value: 'Free' }] },
      { tag: 'TRACK', heading: 'Compare Against\nYour Portfolio', body: 'Are you beating the S&P 500? The NASDAQ? Set your benchmark and find out instantly.', stats: [{ label: 'Benchmarks', value: 'All Major' }, { label: 'Timeframes', value: '1D-5Y' }] },
    ],
  },
]

// ============================================
// V7 — Before/After (DM Sans)
// Stacked BEFORE (red) → arrow → AFTER (green) cards
// ============================================
export const v7Packs: CarouselContentPackInsert[] = [
  {
    template_type: 'v7',
    title: 'Before & After WealthClaude',
    category: 'product',
    description: 'Life before and after using WealthClaude',
    is_featured: true,
    slides: [
      { tag: 'TRACKING', heading: 'Portfolio Tracking', before: { title: 'Before', items: ['Spreadsheet with manual updates', 'Different app for each broker', 'No idea of true allocation', 'Hours of manual data entry'] }, after: { title: 'After', items: ['Auto-updating dashboard', 'All brokers in one view', 'Instant allocation breakdown', 'Import in 60 seconds'] } },
      { tag: 'DIVIDENDS', heading: 'Dividend Monitoring', before: { title: 'Before', items: ['Checking each stock manually', 'Missing payment dates', 'No income forecasting', 'Can\'t track yield on cost'] }, after: { title: 'After', items: ['Global dividend calendar', 'Payment alerts', 'Income forecasting', 'Yield on cost tracking'] } },
      { tag: 'ANALYSIS', heading: 'Market Analysis', before: { title: 'Before', items: ['Reading 10+ news sites daily', 'Information overload', 'Missing global events', 'No market sentiment data'] }, after: { title: 'After', items: ['AI 3-sentence briefings', 'Curated intelligence', '51 markets on one globe', 'Fear & Greed index'] } },
      { tag: 'DECISIONS', heading: 'Investment Decisions', before: { title: 'Before', items: ['Gut feelings', 'No benchmark comparison', 'Can\'t see trade impact', 'No goal tracking'] }, after: { title: 'After', items: ['Data-driven insights', 'Performance vs benchmarks', 'Trade analyzer', 'Financial goal tracking'] } },
      { tag: 'COST', heading: 'Cost of Tools', before: { title: 'Before', items: ['$30/mo portfolio tracker', '$20/mo heatmap tool', '$15/mo news service', '$65+/mo total'] }, after: { title: 'After', items: ['Portfolio tracker — FREE', 'Heatmaps — FREE', 'AI news — FREE', '$0/mo for core features'] } },
    ],
  },
  {
    template_type: 'v7',
    title: 'Beginner vs Pro Investor Habits',
    category: 'educational',
    description: 'How professional investors approach portfolio management differently',
    slides: [
      { tag: 'RESEARCH', heading: 'How They Research', before: { title: 'Beginner', items: ['Follows TikTok tips', 'Buys what\'s trending', 'No fundamental analysis', 'FOMO-driven decisions'] }, after: { title: 'Pro', items: ['Uses AI-summarized news', 'Analyzes market breadth', 'Checks macro indicators', 'Data-driven entry points'] } },
      { tag: 'TRACKING', heading: 'How They Track', before: { title: 'Beginner', items: ['Checks broker app daily', 'Focuses on price only', 'Ignores dividends', 'No performance history'] }, after: { title: 'Pro', items: ['Dedicated portfolio tracker', 'Total return analysis', 'Dividend income tracking', 'Historical benchmarking'] } },
      { tag: 'RISK', heading: 'How They Manage Risk', before: { title: 'Beginner', items: ['All-in on one sector', 'No geographic spread', 'Ignores concentration', 'No stop-loss plan'] }, after: { title: 'Pro', items: ['Sector-balanced portfolio', 'Global diversification', 'Allocation monitoring', 'Risk-managed positions'] } },
      { tag: 'GOALS', heading: 'How They Plan', before: { title: 'Beginner', items: ['Vague "make money" goal', 'No target numbers', 'No timeline', 'No milestones'] }, after: { title: 'Pro', items: ['Specific financial targets', 'Retirement number set', 'Timeline with checkpoints', 'Progress tracking'] } },
      { tag: 'TOOLS', heading: 'The Tools They Use', before: { title: 'Beginner', items: ['Broker app only', 'Free stock screener', 'Reddit for "research"', 'No analytics'] }, after: { title: 'Pro', items: ['Portfolio analytics platform', 'Market heatmaps', 'AI intelligence dashboard', 'Trade analysis tools'] } },
    ],
  },
  {
    template_type: 'v7',
    title: 'Spreadsheet vs WealthClaude',
    category: 'product',
    description: 'Why spreadsheets fail for portfolio tracking',
    slides: [
      { tag: 'UPDATES', heading: 'Keeping Data Fresh', before: { title: 'Spreadsheet', items: ['Manual price updates', 'Copy-paste from broker', 'Data goes stale daily', 'Formula errors accumulate'] }, after: { title: 'WealthClaude', items: ['Real-time price data', 'Auto-sync holdings', 'Always current', 'Zero manual entry'] } },
      { tag: 'VISUALS', heading: 'Seeing Your Data', before: { title: 'Spreadsheet', items: ['Basic bar charts', 'No heatmaps possible', 'No geographic view', 'Ugly and confusing'] }, after: { title: 'WealthClaude', items: ['Interactive heatmaps', '3D globe visualization', 'Allocation donut charts', 'Beautiful dashboard'] } },
      { tag: 'DIVIDENDS', heading: 'Tracking Income', before: { title: 'Spreadsheet', items: ['Manually log each payment', 'No automatic detection', 'Can\'t forecast', 'Misses foreign dividends'] }, after: { title: 'WealthClaude', items: ['Auto-detected payments', 'Global coverage 6 regions', 'Income forecasting', 'Calendar with alerts'] } },
      { tag: 'ANALYSIS', heading: 'Understanding Performance', before: { title: 'Spreadsheet', items: ['Simple % gain/loss', 'No benchmark comparison', 'No trade analysis', 'No time-weighted returns'] }, after: { title: 'WealthClaude', items: ['Full performance analytics', 'Benchmark comparison', 'Trade-by-trade analysis', 'Professional metrics'] } },
      { tag: 'SCALE', heading: 'As Portfolio Grows', before: { title: 'Spreadsheet', items: ['Gets slower with more data', 'Formulas break', 'Can\'t handle 50+ positions', 'Migration nightmare'] }, after: { title: 'WealthClaude', items: ['Handles any portfolio size', 'Always fast', 'Unlimited positions (Pro)', 'Easy broker import'] } },
    ],
  },
]

// ============================================
// V8 — Myth Busting (Inter font)
// MYTH stamp (red X) + FACT stamp (green checkmark)
// ============================================
export const v8Packs: CarouselContentPackInsert[] = [
  {
    template_type: 'v8',
    title: 'Portfolio Tracking Myths Busted',
    category: 'educational',
    description: 'Common misconceptions about portfolio tracking',
    is_featured: true,
    slides: [
      { tag: 'MYTH #1', myth: 'My broker app is enough for tracking', fact: 'Brokers show holdings, not insights. They don\'t benchmark, analyze allocation, or track dividends across regions.', evidence: 'Brokers are optimized for trading execution, not portfolio analysis. WealthClaude fills the gap.', verdict: 'Your broker + WealthClaude = complete picture' },
      { tag: 'MYTH #2', myth: 'Portfolio trackers need access to my bank', fact: 'WealthClaude never asks for bank credentials. You import via file upload or manual entry. Your data stays yours.', evidence: 'No bank linking, no API connections to financial accounts. Enterprise-grade encryption for all data.', verdict: 'Zero bank access required. Full security.' },
      { tag: 'MYTH #3', myth: 'Good portfolio tools cost $50+/month', fact: 'WealthClaude\'s free plan includes heatmaps, 3D globe, dividend tracking, and portfolio analytics. Pro is only $9/mo.', evidence: 'Competing tools like Portfolio Visualizer, Stock Rover charge $30-50/mo for similar features.', verdict: 'Professional tools at $0. Pro at $9.' },
      { tag: 'MYTH #4', myth: 'You only need tracking if you\'re a day trader', fact: 'Long-term investors benefit most from tracking. Allocation drift, dividend compounding, and goal progress all need monitoring.', evidence: 'Buy-and-hold investors who don\'t track often have 40%+ concentration in one sector without knowing.', verdict: 'Long-term investors need tracking most.' },
      { tag: 'MYTH #5', myth: 'Tracking doesn\'t improve returns', fact: 'Investors who benchmark and analyze trades consistently outperform those who don\'t. Data drives better decisions.', evidence: 'Without benchmarking, you can\'t know if your strategy is working. What gets measured gets improved.', verdict: 'Data-driven investors win long-term.' },
    ],
  },
  {
    template_type: 'v8',
    title: 'Investing Myths Beginners Believe',
    category: 'educational',
    description: 'Common investing myths that hurt new investors',
    slides: [
      { tag: 'MYTH #1', myth: 'You need $10,000+ to start investing', fact: 'You can start with as little as $1 through fractional shares. Many brokers have zero minimum accounts.', evidence: 'Robinhood, Fidelity, Schwab, and others offer fractional shares with no minimum investment.', verdict: 'Start with whatever you have.' },
      { tag: 'MYTH #2', myth: 'Diversification means owning 50+ stocks', fact: 'A well-chosen portfolio of 15-25 stocks across sectors and geographies provides excellent diversification.', evidence: 'Studies show diminishing diversification benefits beyond 20-25 uncorrelated holdings.', verdict: 'Quality over quantity. Track allocation.' },
      { tag: 'MYTH #3', myth: 'You should check your portfolio daily', fact: 'Daily checking leads to emotional decisions. Weekly or monthly review with proper tools is optimal.', evidence: 'Behavioral finance shows frequent checking increases anxiety and impulsive trading.', verdict: 'Review weekly with good analytics.' },
      { tag: 'MYTH #4', myth: 'High dividend yield = good investment', fact: 'Extremely high yields often signal trouble. Dividend growth rate matters more than current yield.', evidence: 'A 2% yield growing 10%/year surpasses a static 5% yield within a decade through compounding.', verdict: 'Track growth rate, not just yield.' },
      { tag: 'MYTH #5', myth: 'International investing is too risky', fact: 'Home-country bias is the real risk. Global diversification actually reduces portfolio volatility.', evidence: '51 global markets offer uncorrelated returns. WealthClaude tracks all of them on one 3D globe.', verdict: 'Go global. Reduce real risk.' },
    ],
  },
  {
    template_type: 'v8',
    title: 'Dividend Investing Myths',
    category: 'educational',
    description: 'Myths that hold back dividend investors',
    slides: [
      { tag: 'MYTH #1', myth: 'Dividend stocks are only for retirees', fact: 'Young investors benefit most from dividend reinvestment. Starting at 25 vs 45 can mean 3-5x more wealth.', evidence: 'Compounding dividend reinvestment over 30+ years is one of the most powerful wealth-building strategies.', verdict: 'Start dividend investing young.' },
      { tag: 'MYTH #2', myth: 'US stocks have the best dividends', fact: 'UK, Australian, and Singaporean markets often have higher average yields than US equities.', evidence: 'Average UK dividend yield is ~4% vs US ~1.5%. WealthClaude tracks dividends across 6 regions.', verdict: 'Go global for better yields.' },
      { tag: 'MYTH #3', myth: 'Dividends don\'t matter in a growth portfolio', fact: 'Reinvested dividends account for approximately 80% of the S&P 500\'s total return since 1960.', evidence: '$10,000 invested in 1960: ~$800K price only vs ~$5M with dividends reinvested.', verdict: 'Dividends are the silent compounding engine.' },
      { tag: 'MYTH #4', myth: 'You can track dividends in a spreadsheet', fact: 'With stocks across multiple regions, currencies, and payment schedules, spreadsheets break fast.', evidence: 'UK semi-annual, US quarterly, Canadian monthly — each has different tax implications and timing.', verdict: 'Use a dedicated dividend tracker.' },
      { tag: 'MYTH #5', myth: 'Dividend cuts are always bad', fact: 'Some dividend cuts are strategic — freeing capital for growth that increases total shareholder return.', evidence: 'Companies that strategically reduce dividends to fund growth often outperform over 5+ years.', verdict: 'Analyze the reason, not just the cut.' },
    ],
  },
]

// ============================================
// V9 — Story Journey (Lora + Nunito Sans)
// Vertical timeline, chapter dots, first-person narrative
// ============================================
export const v9Packs: CarouselContentPackInsert[] = [
  {
    template_type: 'v9',
    title: 'How I Went From Spreadsheets to Smart Tracking',
    category: 'social-proof',
    description: 'First-person story about switching from manual tracking to WealthClaude',
    is_featured: true,
    slides: [
      { tag: 'THE BEGINNING', chapter: 1, heading: 'The Spreadsheet\nPhase', body: 'I tracked everything in Google Sheets. 47 stocks. 3 brokers. 4 currencies. It took 2 hours every Sunday to update. I thought this was "normal."', date: 'Month 1' },
      { tag: 'THE PROBLEM', chapter: 2, heading: 'When It All\nFell Apart', body: 'A formula error hid a 15% loss in my tech holdings for 3 months. I was celebrating "gains" while my real performance was underwater vs the S&P 500.', date: 'Month 4' },
      { tag: 'THE SEARCH', chapter: 3, heading: 'Looking For\nSomething Better', body: 'Tried 5 different portfolio trackers. Too expensive. Too complicated. Required bank linking. One wanted $50/month just for heatmaps.', date: 'Month 5' },
      { tag: 'THE SWITCH', chapter: 4, heading: 'Found\nWealthClaude', body: 'Free portfolio tracking. No bank linking. Market heatmaps included. Imported all 47 holdings in 3 minutes from CSV files.', date: 'Month 6', card_data: [{ label: 'Setup Time', value: '3 min' }, { label: 'Holdings', value: '47' }, { label: 'Cost', value: '$0' }] },
      { tag: 'THE RESULT', chapter: 5, heading: 'Now I Actually\nKnow My Portfolio', body: 'Discovered I was 44% concentrated in tech. Rebalanced into 5 sectors. My risk-adjusted returns improved 30%. Sunday tracking time: 0 hours.', date: 'Month 12', card_data: [{ label: 'Sectors', value: '5' }, { label: 'Time Saved', value: '96 hrs/yr' }] },
    ],
  },
  {
    template_type: 'v9',
    title: 'My Dividend Journey: $0 to $500/month',
    category: 'social-proof',
    description: 'Building a dividend income stream from scratch',
    slides: [
      { tag: 'CHAPTER 1', chapter: 1, heading: 'Starting\nFrom Zero', body: 'First dividend: $0.32 from a single share of a REIT. It felt meaningless. But every journey starts somewhere.', date: 'Year 1' },
      { tag: 'CHAPTER 2', chapter: 2, heading: 'Building\nThe Machine', body: 'Added dividend stocks every month. Reinvested every payment. The snowball was small but growing. Monthly income hit $25.', date: 'Year 2', card_data: [{ label: 'Monthly Income', value: '$25' }, { label: 'Holdings', value: '12' }] },
      { tag: 'CHAPTER 3', chapter: 3, heading: 'Going\nGlobal', body: 'Discovered UK and Australian dividend stocks with 4-6% yields. WealthClaude tracked them all in one dashboard across 3 currencies.', date: 'Year 3', card_data: [{ label: 'Monthly Income', value: '$120' }, { label: 'Regions', value: '3' }] },
      { tag: 'CHAPTER 4', chapter: 4, heading: 'The Compounding\nKick', body: 'Dividend reinvestment started paying dividends of their own. The math finally clicked — exponential growth is real when you track it.', date: 'Year 4', card_data: [{ label: 'Monthly Income', value: '$280' }, { label: 'Yield on Cost', value: '5.8%' }] },
      { tag: 'CHAPTER 5', chapter: 5, heading: '$500 Per Month\nPassive Income', body: 'Five years of consistent building. Now averaging $500/month in dividends across 28 positions in 4 countries. Every payment tracked.', date: 'Year 5', card_data: [{ label: 'Monthly Income', value: '$500' }, { label: 'Positions', value: '28' }, { label: 'Countries', value: '4' }] },
    ],
  },
  {
    template_type: 'v9',
    title: 'From Financial Chaos to FIRE',
    category: 'social-proof',
    description: 'Journey from disorganized finances to financial independence path',
    slides: [
      { tag: 'CHAPTER 1', chapter: 1, heading: 'The Wake-Up\nCall', body: 'Age 28. Three retirement accounts I\'d never consolidated. Stock picks scattered across 2 brokers. No idea what my actual net worth was.', date: 'Age 28' },
      { tag: 'CHAPTER 2', chapter: 2, heading: 'Getting\nOrganized', body: 'Imported everything into WealthClaude. For the first time, I saw my complete financial picture. It was worse than I thought — and that was the best thing.', date: 'Age 28', card_data: [{ label: 'Accounts', value: '5' }, { label: 'Total Holdings', value: '34' }] },
      { tag: 'CHAPTER 3', chapter: 3, heading: 'Setting\nThe Target', body: 'Used the financial goals feature to set my FIRE number: $1.2M at a 4% withdrawal rate = $48K/year. The gap felt massive but measurable.', date: 'Age 29', card_data: [{ label: 'FIRE Number', value: '$1.2M' }, { label: 'Timeline', value: '15 years' }] },
      { tag: 'CHAPTER 4', chapter: 4, heading: 'Optimizing\nEverything', body: 'Trade analyzer showed I was churning small-cap stocks at a loss. Shifted to index funds + dividend growers. Allocation rebalanced quarterly.', date: 'Age 30' },
      { tag: 'CHAPTER 5', chapter: 5, heading: 'On Track\nFor 43', body: 'Two years in. Portfolio is up 34%. Dividends covering $200/month of expenses. Progress bar says 18% to FIRE. The dashboard made it real.', date: 'Age 30', card_data: [{ label: 'Progress', value: '18%' }, { label: 'Monthly Dividends', value: '$200' }] },
    ],
  },
]

// ============================================
// V10 — This vs That (Plus Jakarta Sans)
// Split-screen comparison cards, VS divider, scorecard
// ============================================
export const v10Packs: CarouselContentPackInsert[] = [
  {
    template_type: 'v10',
    title: 'WealthClaude Free vs Competitors Paid',
    category: 'product',
    description: 'Feature comparison against paid portfolio trackers',
    is_featured: true,
    slides: [
      { category: 'Portfolio Tracking', left_items: ['Up to 10 holdings', 'Real-time prices', 'Performance charts', 'Multi-asset support', 'CSV import from 50+ brokers'], right_items: ['Limited to 3 holdings', 'Delayed 15 minutes', 'Basic charts only', 'Stocks only', 'Manual entry only'], left_summary: 'WealthClaude FREE', right_summary: 'Competitors FREE' },
      { category: 'Market Data', left_items: ['3 live heatmaps', '3D interactive globe', '51 markets tracked', 'AI news summaries', 'Fear & Greed index'], right_items: ['No heatmaps', 'No globe', 'US only', 'Basic news feed', 'No sentiment data'], left_summary: 'WealthClaude FREE', right_summary: 'Competitors $30/mo' },
      { category: 'Dividend Tools', left_items: ['Global dividend tracker', '6 region coverage', 'Payment calendar', 'Yield on cost', 'Income forecasting'], right_items: ['US dividends only', 'No regional breakdown', 'No calendar', 'Current yield only', 'No forecasting'], left_summary: 'WealthClaude FREE', right_summary: 'Competitors $20/mo' },
      { category: 'Analytics', left_items: ['Allocation breakdown', 'Sector analysis', 'Geographic spread', 'Performance benchmarking', 'Trade analyzer'], right_items: ['Basic pie chart', 'No sector detail', 'No geo data', 'No benchmarks', 'No trade history'], left_summary: 'WealthClaude FREE', right_summary: 'Competitors $40/mo' },
      { category: 'Final Score', left_items: ['All features above', 'No credit card', 'No bank linking', 'Free forever', 'Pro at $9/mo'], right_items: ['Limited free tiers', 'Credit card required', 'Bank linking mandatory', '$30-60/month', 'Annual contracts'], left_summary: '$0/month', right_summary: '$30-60/month' },
    ],
  },
  {
    template_type: 'v10',
    title: 'ETFs vs Individual Stocks',
    category: 'educational',
    description: 'Comparing ETF investing to stock picking',
    slides: [
      { category: 'Diversification', left_items: ['Instant diversification', 'Hundreds of holdings', 'Sector-balanced options', 'Low concentration risk', 'Global options available'], right_items: ['Must build manually', 'Need 20+ picks', 'Easy to over-concentrate', 'Higher single-stock risk', 'Research-intensive'], left_summary: 'ETFs', right_summary: 'Individual Stocks' },
      { category: 'Control & Flexibility', left_items: ['Pre-set allocation', 'Limited customization', 'Can\'t exclude companies', 'Rebalances automatically', 'One-click investing'], right_items: ['Full control', 'Pick exactly what you want', 'Exclude any company', 'Manual rebalancing needed', 'More decisions to make'], left_summary: 'ETFs', right_summary: 'Individual Stocks' },
      { category: 'Costs', left_items: ['Expense ratios 0.03-0.5%', 'No research cost', 'Tax-efficient structures', 'Low trading costs', 'No analysis tools needed'], right_items: ['No expense ratio', 'Research time = cost', 'Complex tax situations', 'Higher trading volume', 'Need analytics tools'], left_summary: 'ETFs', right_summary: 'Individual Stocks' },
      { category: 'Tracking Complexity', left_items: ['Simple to track', 'Few positions needed', 'Easy allocation view', 'Dividends consolidated', 'Minimal maintenance'], right_items: ['Complex with many holdings', 'Need portfolio tracker', 'Allocation harder to see', 'Multiple dividend schedules', 'Regular monitoring needed'], left_summary: 'ETFs', right_summary: 'Individual Stocks' },
      { category: 'Verdict', left_items: ['Best for passive investors', 'Great for beginners', 'Set and forget possible', 'Lower time commitment', 'Solid long-term choice'], right_items: ['Best for active investors', 'Great for experienced', 'Higher potential alpha', 'More engaging', 'Track with WealthClaude'], left_summary: 'Both are valid strategies', right_summary: 'Track either on WealthClaude' },
    ],
  },
  {
    template_type: 'v10',
    title: 'Growth vs Dividend Investing',
    category: 'educational',
    description: 'Comparing growth and dividend investment strategies',
    slides: [
      { category: 'Income', left_items: ['No regular income', 'Returns only on sale', 'Must sell shares for cash', 'All growth is unrealized', 'Income = $0 until you sell'], right_items: ['Regular cash payments', 'Quarterly/monthly income', 'Never sell a share', 'Passive income stream', 'Increasing payments yearly'], left_summary: 'Growth Stocks', right_summary: 'Dividend Stocks' },
      { category: 'Compounding', left_items: ['Price appreciation', 'Reinvest gains manually', 'Exponential potential', 'Higher ceiling', 'More volatile path'], right_items: ['Dividend reinvestment', 'Automatic compounding', 'Steady snowball effect', 'Lower ceiling per stock', 'Smoother ride'], left_summary: 'Growth Stocks', right_summary: 'Dividend Stocks' },
      { category: 'Risk Profile', left_items: ['Higher volatility', 'Drawdowns of 30-50%', 'No income during dips', 'Momentum-dependent', 'Can go to zero'], right_items: ['Lower volatility', 'Drawdowns of 15-30%', 'Income continues in dips', 'Established companies', 'Dividends cushion falls'], left_summary: 'Growth Stocks', right_summary: 'Dividend Stocks' },
      { category: 'Tracking Needs', left_items: ['Price alerts essential', 'Growth rate monitoring', 'Earnings tracking', 'Momentum analysis', 'WealthClaude heatmaps'], right_items: ['Yield tracking essential', 'Dividend calendar needed', 'Payment monitoring', 'Yield on cost tracking', 'WealthClaude dividend tracker'], left_summary: 'Growth Stocks', right_summary: 'Dividend Stocks' },
      { category: 'Best For', left_items: ['Ages 20-40', 'High risk tolerance', 'No income needs', 'Long time horizon', 'Hands-on investors'], right_items: ['Ages 35+', 'Moderate risk tolerance', 'Want passive income', 'Any time horizon', 'Hands-off investors'], left_summary: 'Track growth with WealthClaude', right_summary: 'Track dividends with WealthClaude' },
    ],
  },
]

// ============================================
// ALL PACKS COMBINED
// ============================================
export const allCarouselPacks: CarouselContentPackInsert[] = [
  ...v3Packs,
  ...v5Packs,
  ...v6Packs,
  ...v7Packs,
  ...v8Packs,
  ...v9Packs,
  ...v10Packs,
]
