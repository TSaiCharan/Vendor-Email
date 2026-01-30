import { supabaseAdmin } from '@/lib/supabase'

/**
 * Initialize Supabase tables and buckets
 * This runs on app startup to ensure all required tables exist
 */
export async function initializeSupabase() {
  if (!supabaseAdmin) {
    console.error('[init] Supabase admin client not available, skipping initialization')
    return
  }

  try {
    console.log('[init] Checking Supabase tables...')

    // Create jobs table
    await createJobsTable()

    // Create user_resumes table if needed
    await createUserResumesTable()

    // Create resumes storage bucket
    await createResumeBucket()

    console.log('[init] Supabase initialization completed successfully')
  } catch (error) {
    console.error('[init] Error initializing Supabase:', error)
    // Don't throw - app should continue even if init fails
  }
}

async function createJobsTable() {
  try {
    // Check if table exists by trying a simple query
    const { error } = await supabaseAdmin.from('jobs').select('id').limit(1)

    if (error && error.code === 'PGRST116') {
      // Table doesn't exist, create it
      console.log('[init] Creating jobs table...')
      const { error: createError } = await supabaseAdmin.rpc('exec', {
        sql: `
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

          CREATE INDEX IF NOT EXISTS idx_jobs_user_id ON jobs(user_id);
          CREATE INDEX IF NOT EXISTS idx_jobs_status ON jobs(status);
          CREATE INDEX IF NOT EXISTS idx_jobs_user_status ON jobs(user_id, status);
          CREATE INDEX IF NOT EXISTS idx_jobs_created_at ON jobs(created_at DESC);

          ALTER TABLE jobs ENABLE ROW LEVEL SECURITY;

          CREATE POLICY "Users can only see their own jobs" ON jobs
            FOR SELECT
            USING (auth.uid() = user_id);

          CREATE POLICY "Users can only insert their own jobs" ON jobs
            FOR INSERT
            WITH CHECK (auth.uid() = user_id);

          CREATE POLICY "Users can only update their own jobs" ON jobs
            FOR UPDATE
            USING (auth.uid() = user_id)
            WITH CHECK (auth.uid() = user_id);

          CREATE POLICY "Users can only delete their own jobs" ON jobs
            FOR DELETE
            USING (auth.uid() = user_id);
        `
      })

      if (createError) {
        console.error('[init] Error creating jobs table:', createError)
      }
    } else if (!error) {
      console.log('[init] Jobs table already exists')
    }
  } catch (error) {
    console.log('[init] Jobs table likely already exists (expected behavior)')
  }
}

async function createUserResumesTable() {
  try {
    // Check if table exists
    const { error } = await supabaseAdmin.from('user_resumes').select('id').limit(1)

    if (error && error.code === 'PGRST116') {
      // Table doesn't exist, create it
      console.log('[init] Creating user_resumes table...')
      const { error: createError } = await supabaseAdmin.rpc('exec', {
        sql: `
          CREATE TABLE IF NOT EXISTS user_resumes (
            id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
            user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
            name TEXT NOT NULL,
            file_url TEXT NOT NULL,
            created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
          );

          CREATE INDEX IF NOT EXISTS idx_user_resumes_user_id ON user_resumes(user_id);

          ALTER TABLE user_resumes ENABLE ROW LEVEL SECURITY;

          DROP POLICY IF EXISTS "Users can only see their own resumes" ON user_resumes;
          DROP POLICY IF EXISTS "Users can only insert their own resumes" ON user_resumes;
          DROP POLICY IF EXISTS "Users can only delete their own resumes" ON user_resumes;

          CREATE POLICY "Users can only see their own resumes" ON user_resumes
            FOR SELECT
            USING (auth.uid() = user_id);

          CREATE POLICY "Users can only insert their own resumes" ON user_resumes
            FOR INSERT
            WITH CHECK (auth.uid() = user_id);

          CREATE POLICY "Users can only delete their own resumes" ON user_resumes
            FOR DELETE
            USING (auth.uid() = user_id);
        `
      })

      if (createError) {
        console.error('[init] Error creating user_resumes table:', createError)
      }
    } else if (!error) {
      console.log('[init] user_resumes table already exists')
    }
  } catch (error) {
    console.log('[init] user_resumes table likely already exists (expected behavior)')
  }
}

async function createResumeBucket() {
  try {
    // Check if bucket exists
    const { data: buckets } = await supabaseAdmin.storage.listBuckets()
    const resumesBucketExists = buckets?.some(b => b.name === 'resumes')

    if (!resumesBucketExists) {
      console.log('[init] Creating resumes bucket...')
      const { error } = await supabaseAdmin.storage.createBucket('resumes', {
        public: false,
        fileSizeLimit: 52428800, // 50MB
      })

      if (error) {
        console.error('[init] Error creating resumes bucket:', error)
      } else {
        console.log('[init] Created resumes bucket')
      }
    } else {
      console.log('[init] Resumes bucket already exists')
    }
  } catch (error) {
    console.error('[init] Error checking resumes bucket:', error)
  }
}
