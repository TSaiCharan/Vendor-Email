'use client'

import { supabase } from '@/lib/supabase'
import type { Job } from '@/lib/types'
import { randomUUID } from 'crypto'

const BUCKET_NAME = 'jobs'

// Get today's date in YYYY-MM-DD format
export function getTodayDateString(): string {
  const today = new Date()
  return today.toISOString().split('T')[0]
}

// Get the file path for a specific date
export function getJobsFilePath(date: string): string {
  return `${date}.json`
}

// Get today's jobs file path
export function getTodayJobsFilePath(): string {
  return getJobsFilePath(getTodayDateString())
}

/**
 * Read jobs from a specific date file in Supabase bucket
 */
export async function readJobsFromBucket(filePath: string): Promise<Job[]> {
  try {
    const { data, error } = await supabase.storage
      .from(BUCKET_NAME)
      .download(filePath)

    if (error) {
      if (error.message.includes('not found')) {
        console.log('[jobs-bucket] File not found:', filePath)
        return []
      }
      console.error('[jobs-bucket] Error reading jobs file:', error)
      return []
    }

    if (!data) return []

    const text = await data.text()
    return JSON.parse(text) as Job[]
  } catch (error) {
    console.error('[jobs-bucket] Error in readJobsFromBucket:', error)
    return []
  }
}

/**
 * Write jobs to a specific date file in Supabase bucket
 */
export async function writeJobsToBucket(filePath: string, jobs: Job[]): Promise<void> {
  try {
    const fileContent = JSON.stringify(jobs, null, 2)
    const blob = new Blob([fileContent], { type: 'application/json' })

    const { error } = await supabase.storage
      .from(BUCKET_NAME)
      .upload(filePath, blob, {
        upsert: true,
        contentType: 'application/json',
      })

    if (error) {
      console.error('[jobs-bucket] Error writing jobs file:', error)
      throw error
    }

    console.log('[jobs-bucket] Jobs written successfully to:', filePath)
  } catch (error) {
    console.error('[jobs-bucket] Error in writeJobsToBucket:', error)
    throw error
  }
}

/**
 * Get all jobs for today
 */
export async function getTodayJobs(): Promise<Job[]> {
  return readJobsFromBucket(getTodayJobsFilePath())
}

/**
 * Create a new job
 */
export async function createJob(jobData: Omit<Job, 'id' | 'created_at' | 'updated_at'>): Promise<Job> {
  const jobs = await getTodayJobs()

  const newJob: Job = {
    ...jobData,
    id: randomUUID(),
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  }

  jobs.push(newJob)
  await writeJobsToBucket(getTodayJobsFilePath(), jobs)

  return newJob
}

/**
 * Update a job by ID
 */
export async function updateJob(jobId: string, updates: Partial<Job>): Promise<Job | null> {
  const jobs = await getTodayJobs()
  const jobIndex = jobs.findIndex((job) => job.id === jobId)

  if (jobIndex === -1) {
    return null
  }

  jobs[jobIndex] = {
    ...jobs[jobIndex],
    ...updates,
    updated_at: new Date().toISOString(),
  }

  await writeJobsToBucket(getTodayJobsFilePath(), jobs)
  return jobs[jobIndex]
}

/**
 * Get a job by ID
 */
export async function getJobById(jobId: string): Promise<Job | null> {
  const jobs = await getTodayJobs()
  return jobs.find((job) => job.id === jobId) || null
}

/**
 * Get jobs by status
 */
export async function getJobsByStatus(status: 'queued' | 'processing' | 'success' | 'failure'): Promise<Job[]> {
  const jobs = await getTodayJobs()
  return jobs.filter((job) => job.status === status)
}

/**
 * Get jobs by date
 */
export async function getJobsByDate(date: string): Promise<Job[]> {
  return readJobsFromBucket(getJobsFilePath(date))
}

/**
 * Delete a job by ID
 */
export async function deleteJob(jobId: string): Promise<boolean> {
  try {
    const jobs = await getTodayJobs()
    const filteredJobs = jobs.filter((job) => job.id !== jobId)

    if (filteredJobs.length === jobs.length) {
      console.warn('[jobs-bucket] Job not found:', jobId)
      return false
    }

    await writeJobsToBucket(getTodayJobsFilePath(), filteredJobs)
    return true
  } catch (error) {
    console.error('[jobs-bucket] Error deleting job:', error)
    return false
  }
}
