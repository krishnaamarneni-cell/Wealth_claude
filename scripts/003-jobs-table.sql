-- Jobs/Careers table
CREATE TABLE IF NOT EXISTS jobs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  location TEXT DEFAULT 'Remote',
  contract TEXT DEFAULT 'Unpaid Internship',
  description TEXT,
  responsibilities TEXT[] DEFAULT '{}',
  skills TEXT[] DEFAULT '{}',
  status TEXT DEFAULT 'active' CHECK (status IN ('active', 'closed', 'draft')),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_jobs_status ON jobs(status);
CREATE INDEX IF NOT EXISTS idx_jobs_created_at ON jobs(created_at DESC);

ALTER TABLE jobs ENABLE ROW LEVEL SECURITY;

-- Public can read active jobs
CREATE POLICY "Allow public select active jobs" ON jobs FOR SELECT USING (status = 'active');
-- Authenticated (admin) can do everything
CREATE POLICY "Allow authenticated all on jobs" ON jobs FOR ALL TO authenticated USING (true);
CREATE POLICY "Allow service role on jobs" ON jobs FOR ALL TO service_role USING (true);
