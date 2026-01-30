// Supabase-based storage for jobs - works with Vercel's serverless environment
import { supabase } from "@/lib/supabase"
import type { Job } from "@/lib/types"

// Get today's date in YYYY-MM-DD format
export function getTodayDateString(): string {
  const today = new Date()
  return today.toISOString().split("T")[0]
}

// Get all jobs for a specific date for the current user
export async function getJobsByDate(date: string): Promise<Job[]> {
  try {
    const { data, error } = await supabase
      .from("jobs")
      .select("*")
      .gte("created_at", `${date}T00:00:00`)
      .lt("created_at", `${date}T23:59:59`)
      .order("created_at", { ascending: false })

    if (error) {
      console.error("Error fetching jobs by date:", error)
      return []
    }

    return (data || []) as Job[]
  } catch (error) {
    console.error("Error in getJobsByDate:", error)
    return []
  }
}

// Get today's jobs for the current user
export async function getTodayJobs(): Promise<Job[]> {
  return getJobsByDate(getTodayDateString())
}

// Create a new job
export async function createJob(
  jobData: Omit<Job, "id" | "created_at" | "updated_at">,
  userId: string
): Promise<Job | null> {
  try {
    const { data, error } = await supabase
      .from("jobs")
      .insert([
        {
          user_id: userId,
          ...jobData,
        },
      ])
      .select()
      .single()

    if (error) {
      console.error("Error creating job:", error)
      return null
    }

    return data as Job
  } catch (error) {
    console.error("Error in createJob:", error)
    throw error
  }
}

// Update a job by ID
export async function updateJob(
  jobId: string,
  updates: Partial<Job>,
  userId: string
): Promise<Job | null> {
  try {
    const { data, error } = await supabase
      .from("jobs")
      .update(updates)
      .eq("id", jobId)
      .eq("user_id", userId)
      .select()
      .single()

    if (error) {
      console.error("Error updating job:", error)
      return null
    }

    return data as Job
  } catch (error) {
    console.error("Error in updateJob:", error)
    return null
  }
}

// Get a job by ID
export async function getJobById(jobId: string, userId: string): Promise<Job | null> {
  try {
    const { data, error } = await supabase
      .from("jobs")
      .select("*")
      .eq("id", jobId)
      .eq("user_id", userId)
      .single()

    if (error) {
      console.error("Error fetching job:", error)
      return null
    }

    return data as Job
  } catch (error) {
    console.error("Error in getJobById:", error)
    return null
  }
}

// Get jobs by status for the current user
export async function getJobsByStatus(
  status: "queued" | "processing" | "success" | "failure",
  userId: string
): Promise<Job[]> {
  try {
    const { data, error } = await supabase
      .from("jobs")
      .select("*")
      .eq("status", status)
      .eq("user_id", userId)
      .order("created_at", { ascending: true })

    if (error) {
      console.error("Error fetching jobs by status:", error)
      return []
    }

    return (data || []) as Job[]
  } catch (error) {
    console.error("Error in getJobsByStatus:", error)
    return []
  }
}
