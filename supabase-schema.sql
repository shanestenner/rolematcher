-- Supabase SQL Schema for Phase 1 Role Matcher
-- Run this in your Supabase SQL Editor (Database > SQL Editor)

-- Create the role_assignments table
CREATE TABLE IF NOT EXISTS role_assignments (
  id TEXT PRIMARY KEY DEFAULT 'main',
  trios JSONB DEFAULT '[]'::jsonb,
  additional_roles JSONB DEFAULT '[]'::jsonb,
  stakeholders JSONB DEFAULT '[]'::jsonb,
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  updated_by UUID REFERENCES auth.users(id),
  updated_by_email TEXT
);

-- Enable Row Level Security
ALTER TABLE role_assignments ENABLE ROW LEVEL SECURITY;

-- Create policy: authenticated users can read
CREATE POLICY "Authenticated users can read role_assignments"
  ON role_assignments
  FOR SELECT
  TO authenticated
  USING (true);

-- Create policy: authenticated users can insert
CREATE POLICY "Authenticated users can insert role_assignments"
  ON role_assignments
  FOR INSERT
  TO authenticated
  WITH CHECK (true);

-- Create policy: authenticated users can update
CREATE POLICY "Authenticated users can update role_assignments"
  ON role_assignments
  FOR UPDATE
  TO authenticated
  USING (true)
  WITH CHECK (true);

-- Enable realtime for this table
ALTER PUBLICATION supabase_realtime ADD TABLE role_assignments;

-- Grant permissions
GRANT ALL ON role_assignments TO authenticated;
