-- Global Pulse Cache
-- Stores pre-fetched data from GDELT, USGS, NASA EONET to avoid rate limits
-- and provide instant page loads.
--
-- A cron job (/api/cron/refresh-pulse) writes to this table every 15-30 min.
-- Public API routes read from this table instead of hitting external APIs live.

CREATE TABLE IF NOT EXISTS global_pulse_cache (
  key TEXT PRIMARY KEY,       -- 'gdelt-events', 'earthquakes', 'natural'
  data JSONB NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Public read access (the API route is public)
ALTER TABLE global_pulse_cache ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Public read access" ON global_pulse_cache;
CREATE POLICY "Public read access"
ON global_pulse_cache FOR SELECT
TO public
USING (true);

-- No direct write access for anon users — writes go through service role
-- (cron endpoint uses SUPABASE_SERVICE_ROLE_KEY which bypasses RLS)

-- Optional: cleanup function to prune stale keys (rarely needed since we upsert)
-- Run manually or via cron if the table grows unexpectedly:
--
-- DELETE FROM global_pulse_cache WHERE updated_at < NOW() - INTERVAL '2 days';
