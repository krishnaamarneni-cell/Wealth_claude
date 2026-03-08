# WealthClaude Project Architecture Documentation

## 1. PAGE ROUTES

### Public Pages (No Authentication Required)
- **`/`** - Landing page (home)
- **`/news`** - Market news and blog feed
- **`/blog/[slug]`** - Individual blog post (dynamic)
- **`/about`** - About page
- **`/contact`** - Contact form
- **`/careers`** - Careers listing page
- **`/careers/[id]`** - Individual career listing
- **`/ai-portfolio-tracker`** - AI portfolio tracker landing page
- **`/portfolio-tracker`** - Public portfolio tracker info page
- **`/dividend-tracker`** - Public dividend tracker info page
- **`/free-stock-portfolio-tracker`** - Landing for free tracker tool
- **`/market-heatmaps`** - Public market heatmap viewer
- **`/globe`** - Global markets visualization
- **`/credit-card-debt-calculator`** - Public credit card debt calculator
- **`/terms-of-service`** - Terms of service
- **`/privacy-policy`** - Privacy policy
- **`/cookie-policy`** - Cookie policy

### Authentication Pages
- **`/auth`** - Login/signup page
- **`/auth/reset-password`** - Password reset page
- **`/profile/setup`** - Profile setup after signup

### Dashboard Pages (Protected - Authenticated Users Only)
- **`/dashboard`** - Main dashboard with tabs
  - *My Portfolio Tab*: Shows portfolio summary, quick stats (today P&L, unrealized gains, holdings count, cost basis), portfolio chart, AI portfolio summary, top gainers/losers, vs market comparison, portfolio news
  - *Market Overview Tab*: Shows market ticker, money flow dashboard, AI market insight, global markets, market breadth, sector overview, fear & greed, economic calendar, market movers, market news feed
- **`/dashboard/holdings`** - Holdings and dividends viewer
- **`/dashboard/portfolio`** - Portfolio analysis, rebalancing, and allocation visualization
- **`/dashboard/performance`** - Performance metrics and historical analysis
- **`/dashboard/trades`** - Trade history and analytics
- **`/dashboard/transactions`** - Transaction management (add/edit/delete)
- **`/dashboard/goals`** - Financial goals tracker (includes debt tracker subtab)
- **`/dashboard/settings`** - User settings and preferences
- **`/dashboard/profile`** - User profile management
- **`/dashboard/compare`** - Stock comparison tool
- **`/dashboard/heatmaps`** - Portfolio heatmaps
- **`/dashboard/data-inspector`** - Data debugging/inspection tool

### Tools Pages (Public)
- **`/tools`** - Tools landing page
- **`/tools/portfolio-rebalancing`** - Rebalancing calculator
- **`/tools/portfolio-weight`** - Portfolio weighting tool
- **`/tools/dividend-calculator`** - Dividend calculator
- **`/tools/dca-calculator`** - Dollar-cost averaging calculator
- **`/tools/stock-profit-calculator`** - Stock profit calculator
- **`/tools/debt-vs-invest`** - Debt vs investment comparison
- **`/tools/credit-card-debt-calculator`** - Credit card debt calculator
- **`/tools/fat-fire-calculator`** - FIRE (Financial Independence) calculator
- **`/tools/barista-fire-calculator`** - Barista FIRE calculator
- **`/tools/coast-fire-calculator`** - Coast FIRE calculator
- **`/tools/lean-fire-calculator`** - Lean FIRE calculator
- **`/tools/early-retirement-calculator`** - Early retirement calculator
- **`/tools/money-weighted-return`** - Money-weighted return calculator
- **`/tools/time-weighted-return`** - Time-weighted return calculator

### Admin Pages
- **`/admin/blog`** - Blog management admin
- **`/upload`** - File upload page

---

## 2. SUPABASE TABLES & COLUMNS

### Core Tables

#### `users`
- `id` (uuid, PK)
- `email` (text)
- `created_at` (timestamp)
- `user_metadata` (jsonb) - stores user profile data
- Managed by Supabase Auth

#### `user_settings`
- `user_id` (uuid, FK to auth.users)
- `theme` (text) - 'light' | 'dark'
- `currency` (text) - 'USD', 'EUR', etc.
- `timezone` (text)
- `notifications_enabled` (boolean)
- `updated_at` (timestamp)

#### `transactions`
- `id` (uuid, PK)
- `user_id` (uuid, FK)
- `date` (date)
- `type` (text) - 'BUY' | 'SELL' | 'DIVIDEND' | 'DEPOSIT' | 'WITHDRAWAL' | 'INTEREST'
- `symbol` (text)
- `shares` (numeric)
- `price` (numeric)
- `total` (numeric)
- `fees` (numeric)
- `broker` (text) - broker name/account
- `notes` (text)
- `created_at` (timestamp)
- `updated_at` (timestamp)
- RLS: users can only see their own transactions

#### `blog_posts`
- `id` (uuid, PK)
- `slug` (text, unique)
- `title` (text)
- `excerpt` (text)
- `content` (text) - HTML content
- `tags` (text[]) - array of tags
- `image_url` (text)
- `ai_model` (text) - which AI generated it
- `post_type` (text) - 'premarket', 'market-analysis', 'aftermarket', 'geopolitical', 'education'
- `view_count` (int, default 0)
- `last_viewed_at` (timestamp)
- `published` (boolean)
- `published_at` (timestamp)
- `author_id` (uuid, FK, nullable)
- `created_at` (timestamp)
- `updated_at` (timestamp)

#### `watchlist`
- `id` (uuid, PK)
- `user_id` (uuid, FK)
- `symbol` (text)
- `name` (text)
- `added_at` (timestamp)
- RLS: users can only see their own watchlist

#### `user_goals`
- `id` (uuid, PK)
- `user_id` (uuid, FK)
- `name` (text)
- `type` (text) - 'retirement', 'education', 'home', 'other'
- `target_amount` (numeric)
- `current_amount` (numeric)
- `target_date` (date)
- `priority` (int)
- `created_at` (timestamp)
- `updated_at` (timestamp)
- RLS: users can only see their own goals

#### `user_debts`
- `id` (uuid, PK)
- `user_id` (uuid, FK)
- `name` (text)
- `type` (text) - 'Credit Card', 'Mortgage', 'Auto Loan', 'Student Loan', 'Personal Loan', 'Other'
- `balance` (numeric)
- `apr` (numeric) - annual interest rate
- `min_payment` (numeric) - minimum monthly payment
- `view_count` (int, default 0) - for tracking
- `post_type` (text) - for self-learning blog system
- `created_at` (timestamp)
- `updated_at` (timestamp)
- RLS: users can only see their own debts

#### `user_assets`
- `id` (uuid, PK)
- `user_id` (uuid, FK)
- `name` (text)
- `type` (text) - 'real estate', 'vehicle', 'crypto', 'other'
- `value` (numeric)
- `purchase_date` (date)
- `notes` (text)
- `created_at` (timestamp)
- RLS: users can only see their own assets

#### `user_financial_settings`
- `user_id` (uuid, PK, FK)
- `risk_tolerance` (text) - 'conservative', 'moderate', 'aggressive'
- `investment_experience` (text)
- `investment_goals` (text[])
- `time_horizon` (text) - 'short', 'medium', 'long'
- `annual_income` (numeric)
- `net_worth` (numeric)
- `monthly_savings` (numeric)
- `tax_bracket` (numeric)
- `country` (text)
- `updated_at` (timestamp)

---

## 3. API ROUTES

### Stock Data Routes
- **`/api/stock/detail`** - Get detailed info for a stock (price, change, etc.)
  - Query: `symbol`
  - Returns: `{ price, change, changePercent, company, sector, industry, marketCap, logo, ... }`
  - Source: Finnhub API
  
- **`/api/stock/full`** - Get full stock data including 1Y history
  - Query: `symbol`
  - Returns: Historical prices + all details
  
- **`/api/stock/history`** - Get historical price data
  - Query: `symbol`, `period` (1D, 1W, 1M, 3M, 6M, YTD, 1Y, 5Y, MAX)
  - Returns: Array of `{ date, close, change }` for charting
  
- **`/api/stock/search`** - Search for stocks by symbol/name
  - Query: `q` (search query)
  - Returns: Array of matching stocks
  
- **`/api/stock/compare`** - Compare multiple stocks side-by-side
  - Query: `symbols` (comma-separated)
  - Returns: Array of stock data for comparison
  
- **`/api/stock-info`** - Get current stock info with returns
  - Query: `symbol`
  - Returns: Current price, change, returns by period (1D, 1W, 1M, etc.)
  
- **`/api/stock-splits`** - Get stock split history
  - Query: `symbol`
  - Returns: List of stock splits

### Market Data Routes
- **`/api/market-overview`** - Overall market status (S&P, NASDAQ, Dow, etc.)
  - Returns: Major indices data and market breadth
  
- **`/api/market-movers`** - Top gainers/losers
  - Query: `market` (SP500, NASDAQ, DOW, crypto)
  - Returns: Top 10 gainers and 10 losers
  
- **`/api/market-data`** - General market data
  - Returns: Volatility index, market breadth, sentiment
  
- **`/api/heatmap`** - Generate sector/market heatmap data
  - Returns: Sectors with color-coded performance
  
- **`/api/fear-greed`** - CNN Fear & Greed Index
  - Returns: Current fear/greed score (0-100)
  
- **`/api/economic-calendar`** - US economic events
  - Returns: Upcoming economic indicators and releases

### Portfolio Routes
- **`/api/user-assets`** - User asset management
  - Methods: GET (list), POST (create), PUT (update), DELETE (delete)
  - Protected: Yes (authenticated users only)
  - Stores: Real estate, vehicles, crypto, etc.
  
- **`/api/user-debts`** - User debt management
  - Methods: GET, POST, PUT, DELETE
  - Protected: Yes
  - Auto-saves all debts on each PUT request
  - Stores: Credit cards, loans, mortgages, etc.
  
- **`/api/user-goals`** - Financial goals management
  - Methods: GET, POST, PUT, DELETE
  - Protected: Yes
  - Stores: Retirement, education, home, etc.
  
- **`/api/transactions`** - Transaction management
  - Methods: GET (list all), POST (add), PUT (update), DELETE (delete one)
  - Protected: Yes
  - GET returns paginated transactions
  
- **`/api/user-financial-settings`** - User financial profile
  - Methods: GET, POST, PUT
  - Protected: Yes
  - Stores: Risk tolerance, income, net worth, tax bracket, country

### Income Routes
- **`/api/dividends`** - Get dividends for user's holdings
  - Returns: Total dividends, dividends by symbol, by month
  
- **`/api/dividends/upcoming`** - Upcoming dividend payments
  - Returns: Scheduled dividend dates and amounts
  
- **`/api/dividends/forecast`** - Forecast future dividend income
  - Returns: Projected dividends for next 12 months

### Blog Routes
- **`/api/auto-blog`** - Auto-generate and publish blog posts
  - Methods: GET, POST
  - Protected: Yes (cron secret)
  - Query: `job=blog`, `type` (premarket, market-analysis, education, geopolitical, aftermarket)
  - Uses: Groq/Perplexity AI + Pixabay for images
  - Returns: `{ postType, topic, title, published, drafts, failed, posts }`
  
- **`/api/blog-posts`** - CRUD operations for blog posts
  - Methods: GET, POST, PUT, DELETE
  - Protected: Partially (public GET, authenticated write)
  
- **`/api/blog-analytics`** - Analytics for self-learning blog system
  - Returns: view_count by post_type, performance ranking, recommendations for extra posts
  
- **`/api/ai-generate-blog`** - AI blog generation (legacy)
  - Returns: Generated blog post content
  
- **`/api/track-view`** - Track blog post views
  - Methods: POST
  - Protected: No (public)
  - Body: `{ slug }`
  - Increments view_count on the blog_posts table
  
- **`/api/init-blog`** - Initialize blog (seed data)
  - Methods: POST
  - Protected: Yes
  
- **`/api/admin/backfill-images`** - Backfill missing images
  - Methods: POST
  - Protected: Yes (admin only)

### News Routes
- **`/api/news/market`** - Market news and headlines
  - Returns: Latest market news
  
- **`/api/news/portfolio`** - News for user's portfolio holdings
  - Protected: Yes
  - Returns: News for symbols user owns

### Cron/Scheduled Routes
- **`/api/cron/run`** - Main cron job dispatcher
  - Query: `job` (blog, blog-schedule, blog-geopolitical, blog-education, ships), `type` (optional override)
  - Protected: Yes (cron secret)
  - Routes to appropriate handler
  
- **`/api/cron/seed-ships`** - Seed ship data (for shipping/business tracking)
  - Protected: Yes
  
- **`/api/cron/ships-all`** - Update ship data
  - Protected: Yes

### User Routes
- **`/api/profile`** - Get/update user profile
  - Methods: GET, POST
  - Protected: Yes

### Data Routes
- **`/api/debt-parse`** - Parse debt data (AI extraction)
  - Methods: POST
  - Protected: Yes
  - Body: `{ text }` (user-provided debt info)
  - Returns: Parsed debt data
  
- **`/api/rebalance`** - Portfolio rebalancing calculations
  - Methods: POST
  - Protected: Yes
  - Body: Target allocations + current holdings
  - Returns: Rebalancing actions
  
- **`/api/ships`** - Shipping/vessel tracking
  - Returns: Ship data

### Other Routes
- **`/api/watchlist`** - Watchlist management
  - Methods: GET, POST, DELETE
  - Protected: Yes
  
- **`/api/uploaded-files`** - Manage uploaded files
  - Methods: GET, POST, DELETE
  - Protected: Yes
  
- **`/api/subscribe`** - Newsletter subscription
  - Methods: POST
  - Protected: No (public)

---

## 4. REACT CONTEXT & STATE MANAGEMENT

### Primary Context: `PortfolioContext` (`lib/portfolio-context.tsx`)
**Purpose:** Central store for all portfolio data, calculations, and performance metrics

**Data Structure:**
```typescript
{
  // Holdings & Values
  transactions: Transaction[]
  holdings: Holding[]
  portfolioValue: number
  totalCost: number
  totalGain: number
  totalGainPercent: number
  cashBalance: number

  // Performance
  performance: {
    todayReturn: { value, percent }
    returns: { '1D', '1W', '1M', '3M', '6M', 'YTD', '1Y', 'All' }
    sharpeRatio: number
    maxDrawdown: number
    volatility: number
    beta: number
  }

  // Allocation
  allocation: {
    bySector: Record<string, number>
    byIndustry: Record<string, number>
    byAssetType: Record<string, number>
    byBroker: Record<string, number>
    byCountry: Record<string, number>
    topHoldings: Array<{ symbol, allocation }>
  }

  // Income
  income: {
    totalDividends: number
    dividendYield: number
    dividendsBySymbol: Record<string, number>
    dividendsByMonth: Record<string, number>
    upcomingDividends: Array<{ symbol, date, amount }>
    totalInterest: number
  }

  // Trades
  trades: {
    totalTrades: number
    winRate: number
    avgHoldTime: number
    tradingFrequency: string
    bestTrade: { symbol, gain, percent }
    worstTrade: { symbol, loss, percent }
    realizedGains: number
    unrealizedGains: number
  }

  // Risk
  risk: {
    concentration: number
    diversificationScore: number
    downsideRisk: number
    valueAtRisk: number
  }

  // Tax
  tax: {
    shortTermGains: number
    longTermGains: number
    taxLossHarvestingOpportunities: Array<{ symbol, potentialSavings }>
    estimatedTaxLiability: number
    washSaleWarnings: Array<{ symbol, date }>
  }

  // Alerts
  alerts: {
    rebalanceNeeded: boolean
    rebalanceSuggestions: Array<{ action, symbol, shares }>
    priceAlerts: Array<{ symbol, targetPrice, currentPrice }>
    portfolioDrift: number
    unusualActivity: string[]
  }

  // Benchmarks
  benchmarks: {
    vsSP500, vsNASDAQ, vsDowJones, vsRussell2000, vsTotalMarket, vsInternational
    allBenchmarks: { spy, qqq, dia, iwm, vti, voo, vxus }
    vsSectorAvg: Record<string, { your, avg, diff }>
    riskProfile: string
  }

  // Behavior
  behavior: {
    buyingPattern: string
    averagePositionSize: number
    holdingPeriod: { avg, longest, shortest }
    tradingStyle: string
  }

  // Status
  isLoading: boolean
  isRefreshing: boolean
  isFetchingBatch: boolean
  lastUpdate: Date | null
  refresh: () => Promise<void>
  smartRefresh: () => Promise<void>
}
```

**Data Sources:**
- Transactions: Loaded from Supabase `transactions` table
- Holdings: Calculated from transactions + Finnhub stock prices
- Performance: Calculated from historical prices + benchmarks
- Benchmarks: Fetched from `/api/stock-info` (Finnhub)
- Dividends: Calculated from dividend transactions
- Cached: 3-hour localStorage cache per user

**Used By:** All dashboard pages, portfolio components, charts

---

### Secondary Context: `PortfolioContext` (`contexts/portfolio-context.tsx`) [LEGACY]
**Purpose:** Simpler portfolio context for localStorage-only (non-Supabase)
**Data:** Transactions, holdings, basic calculations
**Status:** Legacy/secondary - main app uses `lib/portfolio-context.tsx`

---

## 5. EXTERNAL API CALLS

### Finnhub API
**Purpose:** Real-time stock prices, historical data, company info
**Endpoints Used:**
- `quote` - Current price and change
- `candle` - Historical OHLCV data
- `profile2` - Company profile
- `peers` - Similar companies

**Components Using It:**
- Portfolio dashboard (all benchmark prices)
- Stock detail modal
- Performance calculations
- Holdings value calculations

**Rate Limit:** 150ms minimum between calls (enforced in portfolio context)

### Pixabay API
**Purpose:** Get images for auto-generated blog posts
**Query:** Search for images based on post topic + topic keywords
**Features:** Random page selection + random image from results for variety
**Used By:** `/api/auto-blog`

### Unsplash API
**Purpose:** Fallback image source if Pixabay fails
**Used By:** `/api/auto-blog`

### Perplexity/Groq AI
**Purpose:** Generate blog post content using LLMs
**Models:** Groq Llama 3.3 + DeepSeek (rotating for variety)
**Prompt:** Finance-focused, US markets, data-driven writing
**Response Format:** JSON with title, excerpt, content (HTML), tags, image_query
**Used By:** `/api/auto-blog` route

### Supabase
**Purpose:** Database, auth, real-time updates
**Tables:** transactions, blog_posts, user_debts, user_assets, user_goals, watchlist, user_settings, user_financial_settings
**Auth:** Email + password via Supabase Auth
**RLS Policies:** All tables enforced — users can only access their own data

---

## 6. KEY COMPONENTS

### Dashboard Components
- **`PortfolioChart`** - Line chart showing portfolio value over time
- **`PortfolioVsMarket`** - Compares portfolio return vs S&P 500, NASDAQ, etc.
- **`AIPortfolioSummary`** - AI-generated summary of portfolio + recommendations
- **`NewsFeed`** - Market or portfolio-specific news
- **`MarketTicker`** - Scrolling ticker with top indices
- **`MoneyFlowDashboard`** - Shows money flow (smart money, retail money) by sector
- **`AIMarketInsight`** - AI daily market brief
- **`GlobalMarkets`** - International stock indices
- **`MarketBreadth`** - Market breadth gauge (up vs down stocks)
- **`SectorOverview`** - Sector performance comparison
- **`FearGreed`** - CNN Fear & Greed Index gauge
- **`EconomicCalendar`** - Upcoming US economic events
- **`MarketMovers`** - Top gainers/losers by market (SPY, NASDAQ, Dow)

### Holdings Components
- **`HoldingsTab`** - Table of current holdings with details
- **`DividendsTab`** - Dividend history and upcoming dividends
- **`StockDetailModal`** - Detailed info for a specific stock

### Portfolio Analysis Components
- **`PortfolioPage`** (dashboard/portfolio)
  - Interactive donut charts (allocation by sector, industry, country, asset type, broker)
  - Rebalancing tool with target allocation editor
  - Rebalance scenario saver
  - Allocation history chart (last 12 months)
  - What-if calculator (add $X and see new allocations)
  - Tax-aware rebalancing mode
  - Allocation change tracker (biggest increases/decreases)

### Blog Components
- **`ViewTracker`** - Client component that increments view_count on blog page load
- **Recent Posts** - Grid of recent blog posts below article

### Finance Tools Components
- Calculators for FIRE, debt payoff, dividend, portfolio weighting, rebalancing, etc.
- Each tool has its own page with interactive inputs and outputs

---

## 7. DATA FLOW SUMMARY

### For Portfolio Dashboard:
1. User authenticates via Supabase Auth
2. `PortfolioProvider` fetches transactions from Supabase `transactions` table
3. `holdings-calculator` processes transactions + fetches stock prices from Finnhub
4. Portfolio context calculates all metrics (performance, allocation, taxes, etc.)
5. Data cached in localStorage for 3 hours
6. Dashboard renders with context data
7. User can refresh to get latest prices

### For Blog Posts:
1. Cron job on cron-job.org calls `/api/cron/run?job=blog&type=geopolitical` (or other type)
2. `/api/cron/run` routes to `/api/auto-blog` with post_type override
3. `/api/auto-blog` authenticates with cron secret
4. AI generates topic based on post_type (UTC hour override)
5. AI generates blog content (title, excerpt, HTML content)
6. Pixabay API fetches image based on image_query
7. Blog post inserted into Supabase `blog_posts` with post_type and image_url
8. Post published and visible on `/news` page
9. When user visits blog post, `ViewTracker` increments view_count
10. `/api/blog-analytics` reads performance by post_type to recommend additional posts

### For Stock Data:
1. Components call `/api/stock-info?symbol=AAPL`
2. API calls Finnhub, processes response, returns to frontend
3. Rate limiting enforced (150ms between calls)
4. Data displayed in charts, tables, price displays

---

## 8. AUTHENTICATION & SECURITY

### Auth Method: Supabase Auth (Email + Password)
- Login at `/auth`
- Password reset at `/auth/reset-password`
- Session stored in HTTP-only cookies
- Middleware refreshes session on every request
- Protected routes checked via middleware

### Row-Level Security (RLS):
- All user tables have RLS enforced
- Users can only read/write their own data
- Exceptions: Blog posts are public (anyone can read), admin-only actions blocked at API level

### API Security:
- Cron jobs protected with `CRON_SECRET` environment variable
- Admin actions require authentication + admin check
- All data modifications validate user ownership

---

## 9. CACHING STRATEGY

### Frontend Caching:
- Portfolio context cached in localStorage for 3 hours
- Cache cleared when user changes
- SWR (Stale-While-Revalidate) pattern on API calls

### Backend Caching:
- Finnhub stock price cached per request
- Blog posts use Supabase caching
- Database queries optimized with indices

---

## 10. KEY FILES & DIRECTORIES

```
/app
  /api              - API routes (all external integrations)
  /dashboard        - Protected user pages
  /blog            - Public blog pages
  /tools           - Public financial tools
  /auth            - Authentication pages
  layout.tsx       - Root layout + metadata + favicon
  page.tsx         - Landing page

/lib
  portfolio-context.tsx      - Main portfolio state context
  holdings-calculator.ts     - Portfolio calculation engine
  transaction-storage.ts     - localStorage/Supabase transaction access
  batch-fetcher.ts          - Batch stock price fetching
  smart-stock-cache.ts      - Smart caching for stock prices
  supabase.ts              - Supabase client initialization
  supabase-server.ts       - Server-side Supabase client

/contexts
  portfolio-context.tsx     - Legacy portfolio context (localStorage only)

/components
  portfolio-*              - Portfolio-related components
  dashboard-*             - Dashboard sections
  holdings-*              - Holdings display components
  market-*               - Market data components
  charts/                - Chart components
  ui/                    - shadcn/ui components (button, card, tabs, etc.)

/public
  /images            - Static images, icons, favicon
  favicon.ico       - Website favicon

```

---

## SUMMARY FOR AI CHATBOT

Your chatbot should have access to:
1. **Portfolio Data**: All user transactions, holdings, performance metrics
2. **Market Data**: Real-time prices, indices, economic calendar
3. **Blog System**: Post type performance, recommendations for content mix
4. **User Profile**: Financial goals, risk tolerance, net worth, income
5. **Calculations**: Rebalancing suggestions, tax impact, debt payoff plans

**Key Query Patterns:**
- "What's my portfolio allocation by sector?" → Access `allocation.bySector`
- "What stocks should I add?" → Use `allocation`, `diversificationScore`, `benchmarks`
- "Am I diversified enough?" → Check `allocation.concentration`, `diversificationScore`
- "What dividends am I getting?" → Query `income.dividendsBySymbol`, upcoming dividends
- "Show my tax implications" → Access `tax.shortTermGains`, `longTermGains`, `estimatedTaxLiability`
- "What's my performance vs the market?" → Compare portfolio returns to `benchmarks.allBenchmarks`
- "Which post types perform best?" → Query `/api/blog-analytics` for performance by `post_type`
