export type JobStatus = "queued" | "processing" | "success" | "failure"

export interface Job {
  id: string
  recruiter_email: string
  job_description: string
  ai_prompt: string
  resume_path: string
  status: JobStatus
  email_subject: string | null
  email_body: string | null
  error_message: string | null
  created_at: string
  updated_at: string
}
