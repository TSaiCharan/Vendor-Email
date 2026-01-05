// Use this version when running locally with Node.js

import { readFileSync, writeFileSync, existsSync, mkdirSync } from "fs"
import { join } from "path"
import type { Job } from "@/lib/types"
import { randomUUID } from "crypto"

const DATA_DIR = join(process.cwd(), "data")

// Ensure data directory exists
if (!existsSync(DATA_DIR)) {
  mkdirSync(DATA_DIR, { recursive: true })
}

// Get today's date in YYYY-MM-DD format
export function getTodayDateString(): string {
  const today = new Date()
  return today.toISOString().split("T")[0]
}

// Get the file path for a specific date
export function getJobsFilePath(date: string): string {
  return join(DATA_DIR, `${date}.json`)
}

// Get today's jobs file path
export function getTodayJobsFilePath(): string {
  return getJobsFilePath(getTodayDateString())
}

// Read jobs from a specific date file
export function readJobsFromFile(filePath: string): Job[] {
  if (!existsSync(filePath)) {
    return []
  }

  try {
    const fileContent = readFileSync(filePath, "utf-8")
    return JSON.parse(fileContent) as Job[]
  } catch (error) {
    console.error("Error reading jobs file:", error)
    return []
  }
}

// Write jobs to a specific date file
export function writeJobsToFile(filePath: string, jobs: Job[]): void {
  try {
    writeFileSync(filePath, JSON.stringify(jobs, null, 2), "utf-8")
  } catch (error) {
    console.error("Error writing jobs file:", error)
    throw error
  }
}

// Get all jobs for today
export function getTodayJobs(): Job[] {
  return readJobsFromFile(getTodayJobsFilePath())
}

// Create a new job
export function createJob(jobData: Omit<Job, "id" | "created_at" | "updated_at">): Job {
  const jobs = getTodayJobs()

  const newJob: Job = {
    ...jobData,
    id: randomUUID(),
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  }

  jobs.push(newJob)
  writeJobsToFile(getTodayJobsFilePath(), jobs)

  return newJob
}

// Update a job by ID
export function updateJob(jobId: string, updates: Partial<Job>): Job | null {
  const jobs = getTodayJobs()
  const jobIndex = jobs.findIndex((job) => job.id === jobId)

  if (jobIndex === -1) {
    return null
  }

  jobs[jobIndex] = {
    ...jobs[jobIndex],
    ...updates,
    updated_at: new Date().toISOString(),
  }

  writeJobsToFile(getTodayJobsFilePath(), jobs)
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
