-- ============================================
-- WealthClaude Instagram Content Generator
-- Carousel Templates + News Image Templates
-- ============================================

-- Carousel content packs (pre-built slide content for V3-V10)
CREATE TABLE IF NOT EXISTS carousel_content_packs (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  template_type TEXT NOT NULL CHECK (template_type IN ('v3','v5','v6','v7','v8','v9','v10')),
  title TEXT NOT NULL,
  description TEXT,
  category TEXT NOT NULL DEFAULT 'product' CHECK (category IN ('product','educational','social-proof','engagement','awareness')),
  slides JSONB NOT NULL,
  -- slides schema varies by template type:
  -- v3/v5: [{tag, heading, body, fix?}]
  -- v6: [{tag, heading, body, fix?, stats?, chart_data?}]
  -- v7: [{tag, heading, before:{}, after:{}}]
  -- v8: [{tag, myth, fact, evidence, verdict}]
  -- v9: [{tag, chapter, date, heading, body, card_data?}]
  -- v10: [{category, left_items:[], right_items:[], left_summary, right_summary}]
  is_featured BOOLEAN DEFAULT false,
  usage_count INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- News/blog image content (saved generated news images)
CREATE TABLE IF NOT EXISTS news_image_posts (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  template_type TEXT NOT NULL CHECK (template_type IN ('a','c','d','e','f')),
  headline TEXT NOT NULL,
  source TEXT,
  source_url TEXT,
  category TEXT NOT NULL DEFAULT 'MARKETS',
  date TEXT,
  key_points JSONB DEFAULT '[]',
  quote JSONB DEFAULT '{}',
  -- quote: {text: string, attribution: string}
  market_impact JSONB DEFAULT '[]',
  -- market_impact: [{icon, name, change, price?, direction: 'up'|'down'}]
  big_stat JSONB DEFAULT '{}',
  -- big_stat: {number: string, label: string, color?: string}
  timeline_events JSONB DEFAULT '[]',
  -- timeline_events: [{time, title, description, color}] (for template E)
  context_points JSONB DEFAULT '[]',
  -- context_points: string[] (for template F)
  exported_url TEXT,
  -- Cloudinary URL after export
  status TEXT DEFAULT 'draft' CHECK (status IN ('draft','exported','posted')),
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_carousel_packs_type ON carousel_content_packs(template_type);
CREATE INDEX IF NOT EXISTS idx_carousel_packs_category ON carousel_content_packs(category);
CREATE INDEX IF NOT EXISTS idx_news_posts_type ON news_image_posts(template_type);
CREATE INDEX IF NOT EXISTS idx_news_posts_status ON news_image_posts(status);

-- RLS policies (admin-only access)
ALTER TABLE carousel_content_packs ENABLE ROW LEVEL SECURITY;
ALTER TABLE news_image_posts ENABLE ROW LEVEL SECURITY;

-- Allow authenticated users full access (admin check is done at app level)
CREATE POLICY "Authenticated users can manage carousel packs"
  ON carousel_content_packs FOR ALL
  TO authenticated
  USING (true)
  WITH CHECK (true);

CREATE POLICY "Authenticated users can manage news image posts"
  ON news_image_posts FOR ALL
  TO authenticated
  USING (true)
  WITH CHECK (true);
