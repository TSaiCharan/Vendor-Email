-- Create jobs table in Supabase
-- Run this SQL in your Supabase SQL Editor to create the jobs table

CREATE TABLE IF NOT EXISTS jobs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  recruiter_email TEXT NOT NULL,
  job_description TEXT NOT NULL,
  ai_prompt TEXT NOT NULL,
  resume_path TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'queued' CHECK (status IN ('queued', 'processing', 'success', 'failure')),
  email_subject TEXT,
  email_body TEXT,
  error_message TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for better query performance
CREATE INDEX IF NOT EXISTS idx_jobs_user_id ON jobs(user_id);
CREATE INDEX IF NOT EXISTS idx_jobs_status ON jobs(status);
CREATE INDEX IF NOT EXISTS idx_jobs_user_status ON jobs(user_id, status);
CREATE INDEX IF NOT EXISTS idx_jobs_created_at ON jobs(created_at DESC);

-- Enable Row Level Security
ALTER TABLE jobs ENABLE ROW LEVEL SECURITY;

-- Create RLS policy: Users can only see their own jobs
CREATE POLICY "Users can only see their own jobs" ON jobs
  FOR SELECT
  USING (auth.uid() = user_id);

-- Create RLS policy: Users can only insert their own jobs
CREATE POLICY "Users can only insert their own jobs" ON jobs
  FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- Create RLS policy: Users can only update their own jobs
CREATE POLICY "Users can only update their own jobs" ON jobs
  FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- Create RLS policy: Users can only delete their own jobs
CREATE POLICY "Users can only delete their own jobs" ON jobs
  FOR DELETE
  USING (auth.uid() = user_id);
