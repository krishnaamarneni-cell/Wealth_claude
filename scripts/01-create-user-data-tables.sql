-- ============================================================================
-- PHASE 1: CREATE SUPABASE TABLES FOR USER DATA MIGRATION
-- Migrations for: transactions, watchlist, profiles
-- ============================================================================

-- ============================================================================
-- 1. TRANSACTIONS TABLE
-- ============================================================================
CREATE TABLE IF NOT EXISTS transactions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  date TEXT NOT NULL,
  symbol TEXT NOT NULL,
  type TEXT NOT NULL CHECK (type IN ('BUY', 'SELL', 'DIVIDEND', 'DEPOSIT', 'WITHDRAWAL', 'INTEREST')),
  shares NUMERIC NOT NULL,
  price NUMERIC NOT NULL,
  total NUMERIC NOT NULL,
  broker TEXT,
  file_id TEXT,
  fees NUMERIC DEFAULT 0,
  source TEXT NOT NULL DEFAULT 'manual' CHECK (source IN ('manual', 'csv', 'broker')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Create index for faster queries by user_id and date
CREATE INDEX idx_transactions_user_id ON transactions(user_id);
CREATE INDEX idx_transactions_user_date ON transactions(user_id, date);
CREATE INDEX idx_transactions_symbol ON transactions(symbol);

-- Enable RLS on transactions table
ALTER TABLE transactions ENABLE ROW LEVEL SECURITY;

-- RLS Policy: Users can only see/edit/delete their own transactions
CREATE POLICY "Users can only see their own transactions" ON transactions
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can only insert their own transactions" ON transactions
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can only update their own transactions" ON transactions
  FOR UPDATE USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can only delete their own transactions" ON transactions
  FOR DELETE USING (auth.uid() = user_id);

-- ============================================================================
-- 2. WATCHLIST TABLE
-- ============================================================================
CREATE TABLE IF NOT EXISTS watchlist (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  symbol TEXT NOT NULL,
  company_name TEXT,
  added_date TEXT NOT NULL,
  added_price NUMERIC,
  price_alert NUMERIC,
  alert_enabled BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  UNIQUE(user_id, symbol)
);

-- Create index for faster queries
CREATE INDEX idx_watchlist_user_id ON watchlist(user_id);
CREATE INDEX idx_watchlist_symbol ON watchlist(symbol);

-- Enable RLS on watchlist table
ALTER TABLE watchlist ENABLE ROW LEVEL SECURITY;

-- RLS Policy: Users can only see/edit/delete their own watchlist
CREATE POLICY "Users can only see their own watchlist" ON watchlist
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can only insert their own watchlist items" ON watchlist
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can only update their own watchlist items" ON watchlist
  FOR UPDATE USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can only delete their own watchlist items" ON watchlist
  FOR DELETE USING (auth.uid() = user_id);

-- ============================================================================
-- 3. PROFILES TABLE
-- ============================================================================
CREATE TABLE IF NOT EXISTS profiles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL UNIQUE REFERENCES auth.users(id) ON DELETE CASCADE,
  full_name TEXT,
  username TEXT UNIQUE,
  email TEXT,
  bio TEXT,
  timezone TEXT DEFAULT 'UTC',
  currency TEXT DEFAULT 'USD',
  avatar TEXT,
  member_since TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Create index for faster queries
CREATE INDEX idx_profiles_user_id ON profiles(user_id);
CREATE INDEX idx_profiles_username ON profiles(username);

-- Enable RLS on profiles table
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

-- RLS Policy: Users can only see/edit their own profile
CREATE POLICY "Users can only see their own profile" ON profiles
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can only insert their own profile" ON profiles
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can only update their own profile" ON profiles
  FOR UPDATE USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

-- Note: Users should not delete their own profile directly; use auth.users deletion instead

-- ============================================================================
-- SUMMARY
-- ============================================================================
-- Created 3 tables:
-- 1. transactions - stores all user transactions (BUY, SELL, DIVIDEND, etc.)
--    - Columns match localStorage format + source tracking (manual/csv/broker)
--    - RLS: Users can only access their own transactions
--
-- 2. watchlist - stores user's watched stocks
--    - Columns match localStorage format
--    - RLS: Users can only access their own watchlist
--
-- 3. profiles - stores user profile information
--    - Columns match localStorage format
--    - RLS: Users can only access their own profile
--
-- All tables have:
-- - user_id for linking to auth.users
-- - created_at & updated_at timestamps
-- - RLS policies enforcing user_id = auth.uid()
-- - Indexes on frequently queried columns for performance
-- ============================================================================
