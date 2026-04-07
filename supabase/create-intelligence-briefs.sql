-- ============================================================================
-- Intelligence Briefs Table
-- Run this in Supabase SQL Editor (supabase-pink-elephant)
-- ============================================================================

CREATE TABLE intelligence_briefs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at TIMESTAMPTZ DEFAULT now(),

  -- Tab 1: Priority Index — Top 10 topics ranked by noise vs signal
  priority_index JSONB NOT NULL DEFAULT '[]',

  -- Tab 2: War Room — Conflicts, escalation, headlines
  war_room JSONB NOT NULL DEFAULT '{}',

  -- Tab 3: Markets — Commodities, buy/watch/avoid, safe haven
  markets JSONB NOT NULL DEFAULT '{}',

  -- Tab 4: Tech + AI — AGI timeline, AI race, regulation
  tech_ai JSONB NOT NULL DEFAULT '{}',

  -- Tab 5: Food + Climate — Cascade events, tipping points
  food_climate JSONB NOT NULL DEFAULT '{}',

  -- Tab 6: Threat Index — 7-dimension composite, scenarios
  threat_index JSONB NOT NULL DEFAULT '{}',

  -- Tab 7: Signals — Early warnings ranked by surprise
  signals JSONB NOT NULL DEFAULT '{}',

  -- Metadata
  source_count INT DEFAULT 0,
  status TEXT DEFAULT 'generating' CHECK (status IN ('generating', 'complete', 'failed'))
);

CREATE INDEX idx_intelligence_briefs_created ON intelligence_briefs(created_at DESC);
CREATE INDEX idx_intelligence_briefs_status ON intelligence_briefs(status);

-- RLS: Anyone can read completed briefs
ALTER TABLE intelligence_briefs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can read completed briefs"
  ON intelligence_briefs FOR SELECT
  USING (status = 'complete');

-- Admin full access
CREATE POLICY "Admin full access to intelligence_briefs"
  ON intelligence_briefs FOR ALL
  USING (
    (SELECT email FROM auth.users WHERE id = auth.uid()) = 'krishna.amarneni@gmail.com'
  )
  WITH CHECK (
    (SELECT email FROM auth.users WHERE id = auth.uid()) = 'krishna.amarneni@gmail.com'
  );
