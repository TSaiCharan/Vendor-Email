// For local development, this will use localStorage as a fallback
// The downloaded code should work with actual file system when run locally

import type { Job } from "@/lib/types"

// Get today's date in YYYY-MM-DD format
export function getTodayDateString(): string {
  const today = new Date()
  return today.toISOString().split("T")[0]
}

// Browser-compatible storage using localStorage
function getStorageKey(date: string): string {
  return `jobs_${date}`
}

// Read jobs from storage
export function readJobsFromStorage(date: string): Job[] {
  if (typeof window === "undefined") {
    // Server-side: return empty array for now
    // In production with actual fs, this would read from file
    return []
  }

  try {
    const key = getStorageKey(date)
    const data = localStorage.getItem(key)
    return data ? JSON.parse(data) : []
  } catch (error) {
    console.error("[v0] Error reading jobs:", error)
    return []
  }
}

// Write jobs to storage
export function writeJobsToStorage(date: string, jobs: Job[]): void {
  if (typeof window === "undefined") {
    // Server-side: skip for now
    // In production with actual fs, this would write to file
    return
  }

  try {
    const key = getStorageKey(date)
    localStorage.setItem(key, JSON.stringify(jobs))
  } catch (error) {
    console.error("[v0] Error writing jobs:", error)
    throw error
  }
}

// Get all jobs for today
export function getTodayJobs(): Job[] {
  return readJobsFromStorage(getTodayDateString())
}

// Create a new job
export function createJob(jobData: Omit<Job, "id" | "created_at" | "updated_at">): Job {
  const today = getTodayDateString()
  const jobs = readJobsFromStorage(today)

  const newJob: Job = {
    ...jobData,
    id: crypto.randomUUID(),
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  }

  jobs.push(newJob)
  writeJobsToStorage(today, jobs)

  return newJob
}

// Update a job by ID
export function updateJob(jobId: string, updates: Partial<Job>): Job | null {
  const today = getTodayDateString()
  const jobs = readJobsFromStorage(today)
  const jobIndex = jobs.findIndex((job) => job.id === jobId)

  if (jobIndex === -1) {
    return null
  }

  jobs[jobIndex] = {
    ...jobs[jobIndex],
    ...updates,
    updated_at: new Date().toISOString(),
  }

  writeJobsToStorage(today, jobs)
  return jobs[jobIndex]
}

// Get a job by ID
export function getJobById(jobId: string): Job | null {
  const jobs = getTodayJobs()
  return jobs.find((job) => job.id === jobId) || null
}

// Get jobs by status
export function getJobsByStatus(status: Job["status"]): Job[] {
  const jobs = getTodayJobs()
  return jobs.filter((job) => job.status === status)
}
