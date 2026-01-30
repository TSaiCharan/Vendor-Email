import { supabase } from '@/lib/supabase'
import type { Job } from '@/lib/types'
import type { JobRecord } from '@/lib/database.types'
import { randomUUID } from 'crypto'

/**
 * Get today's jobs for a specific user from Supabase
 */
export async function getTodayJobs(userId: string): Promise<Job[]> {
  try {
    const today = new Date().toISOString().split('T')[0]
    const startOfDay = new Date(`${today}T00:00:00Z`).toISOString()
    const endOfDay = new Date(`${today}T23:59:59Z`).toISOString()

    const { data, error } = await supabase
      .from('jobs')
      .select('*')
      .eq('user_id', userId)
      .gte('created_at', startOfDay)
      .lt('created_at', endOfDay)
      .order('created_at', { ascending: false })

    if (error) {
      console.error('[jobs-storage] Error fetching today jobs:', error)
      return []
    }

    return (data || []) as Job[]
  } catch (error) {
    console.error('[jobs-storage] Error in getTodayJobs:', error)
    return []
  }
}

/**
 * Get all queued jobs across all users (for job processor)
 */
export async function getQueuedJobs(): Promise<Array<Job & { userId: string }>> {
  try {
    const { data, error } = await supabase
      .from('jobs')
      .select('*')
      .eq('status', 'queued')
      .order('created_at', { ascending: true })

    if (error) {
      console.error('[jobs-storage] Error fetching queued jobs:', error)
      return []
    }

    return (data || []).map(job => ({
      ...job,
      userId: job.user_id
    })) as Array<Job & { userId: string }>
  } catch (error) {
    console.error('[jobs-storage] Error in getQueuedJobs:', error)
    return []
  }
}

/**
 * Get all processing jobs across all users
 */
export async function getProcessingJobs(): Promise<Array<Job & { userId: string }>> {
  try {
    const { data, error } = await supabase
      .from('jobs')
      .select('*')
      .eq('status', 'processing')
      .order('created_at', { ascending: true })

    if (error) {
      console.error('[jobs-storage] Error fetching processing jobs:', error)
      return []
    }

    return (data || []).map(job => ({
      ...job,
      userId: job.user_id
    })) as Array<Job & { userId: string }>
  } catch (error) {
    console.error('[jobs-storage] Error in getProcessingJobs:', error)
    return []
  }
}

/**
 * Create a new job for a user
 */
export async function createJob(
  userId: string,
  jobData: Omit<Job, 'id' | 'created_at' | 'updated_at'>
): Promise<Job | null> {
  try {
    const now = new Date().toISOString()
    const newJob: JobRecord = {
      id: randomUUID(),
      user_id: userId,
      recruiter_email: jobData.recruiter_email,
      job_description: jobData.job_description,
      ai_prompt: jobData.ai_prompt,
      resume_path: jobData.resume_path,
      status: jobData.status,
      email_subject: jobData.email_subject,
      email_body: jobData.email_body,
      error_message: jobData.error_message,
      created_at: now,
      updated_at: now,
    }

    const { data, error } = await supabase
      .from('jobs')
      .insert([newJob])
      .select()
      .single()

    if (error) {
      console.error('[jobs-storage] Error creating job:', error)
      return null
    }

    return data as Job
  } catch (error) {
    console.error('[jobs-storage] Error in createJob:', error)
    return null
  }
}

/**
 * Update a job by ID for a specific user
 */
export async function updateJob(
  userId: string,
  jobId: string,
  updates: Partial<Job>
): Promise<Job | null> {
  try {
    const { data, error } = await supabase
      .from('jobs')
      .update({
        ...updates,
        updated_at: new Date().toISOString(),
      })
      .eq('id', jobId)
      .eq('user_id', userId)
      .select()
      .single()

    if (error) {
      console.error('[jobs-storage] Error updating job:', error)
      return null
    }

    return data as Job
  } catch (error) {
    console.error('[jobs-storage] Error in updateJob:', error)
    return null
  }
}

/**
 * Get a specific job by ID for a user
 */
export async function getJobById(userId: string, jobId: string): Promise<Job | null> {
  try {
    const { data, error } = await supabase
      .from('jobs')
      .select('*')
      .eq('id', jobId)
      .eq('user_id', userId)
      .single()

    if (error) {
      console.error('[jobs-storage] Error fetching job:', error)
      return null
    }

    return data as Job
  } catch (error) {
    console.error('[jobs-storage] Error in getJobById:', error)
    return null
  }
}
