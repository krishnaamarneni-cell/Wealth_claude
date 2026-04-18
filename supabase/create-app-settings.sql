-- App Settings table
-- Stores global feature flags and admin-controlled settings
-- Public read, admin write (enforced via API route, not RLS)

CREATE TABLE IF NOT EXISTS app_settings (
  key TEXT PRIMARY KEY,
  value JSONB NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Insert default settings
-- plans_enabled: false means Free/Pro/Premium gating is OFF (everyone gets full access)
-- Flip to true when ready to launch paid tiers
INSERT INTO app_settings (key, value)
VALUES ('plans_enabled', 'false'::jsonb)
ON CONFLICT (key) DO NOTHING;

-- Enable RLS (read-only for everyone, writes blocked at DB level)
ALTER TABLE app_settings ENABLE ROW LEVEL SECURITY;

-- Anyone can read (even unauthenticated)
DROP POLICY IF EXISTS "Public read access" ON app_settings;
CREATE POLICY "Public read access"
ON app_settings FOR SELECT
TO public
USING (true);

-- No direct insert/update/delete from clients
-- All writes go through /api/admin/settings which uses service role key
