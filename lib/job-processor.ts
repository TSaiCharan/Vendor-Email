import { readFileSync } from "fs"
import { updateJob, getJobsByStatus } from "@/lib/json-storage-fs"
import { existsSync } from "fs"
import path from "path"

export async function processNextJob(openai_api_key?: string, gmail_user?: string, gmail_app_password?: string) {
  // Check if there's already a job processing
  const processingJobs = getJobsByStatus("processing")

  if (processingJobs.length > 0) {
    console.log("[v0] A job is already processing, skipping...")
    return { processing: true }
  }

  // Get the next queued job
  const queuedJobs = getJobsByStatus("queued")

  if (queuedJobs.length === 0) {
    console.log("[v0] No queued jobs to process")
    return { noJobs: true }
  }

  // Sort by created_at and get the oldest
  const job = queuedJobs.sort((a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime())[0]
  console.log("[v0] Processing job:", job.id)

  // Update job status to processing
  updateJob(job.id, { status: "processing" })

  try {
    // Clean and validate resume file path
    let cleanedPath = job.resume_path
    if (cleanedPath.startsWith('file://')) {
      cleanedPath = cleanedPath.replace('file:///', '')
    }
    
    // Check if file exists
    if (!existsSync(cleanedPath)) {
      throw new Error(`Resume file not found: ${cleanedPath}`)
    }
    
    // Check file extension
    const fileExt = path.extname(cleanedPath).toLowerCase()
    
    let resumeContent: string
    try {
      if (fileExt === '.pdf') {
        // Read the PDF buffer first
        const pdfBuffer = readFileSync(cleanedPath)

        // Attempt optional PDF extraction in a safe way.
        // We avoid using eval('require') or assuming pdf-parse is present because
        // that can break in Next.js app-route / ESM runtimes or when Node is older.
        let extractedText = ""
        try {
          // Try dynamic import; if it fails we'll fall back.
          const mod: any = await import('pdf-parse').catch(() => null)
          const pdfFn = mod && (mod.default ?? mod)
          if (pdfFn && typeof pdfFn === 'function') {
            const pdfData = await pdfFn(pdfBuffer as any)
            extractedText = (pdfData && pdfData.text) || ""
          } else {
            console.warn('[v0] pdf-parse is not available or not callable in this runtime; skipping extraction')
          }
        } catch (e) {
          // PDF extraction failed (runtime mismatch or missing DOM APIs)
          console.warn('[v0] PDF extraction attempt failed:', e)
        }

        if (extractedText && extractedText.trim()) {
          resumeContent = extractedText
        } else {
          // Fallback: do not crash the job. Provide a clear placeholder string the AI can use.
          resumeContent = `PDF resume at ${cleanedPath} — text extraction not available in this runtime. Please provide a text version of the resume (e.g. .txt) or upgrade Node to >=20.16.0 and install 'pdf-parse' to enable extraction.`
          console.warn('[v0] Falling back to placeholder resume content for job:', job.id)
        }
      } else {
        // For text-based files (.txt, .md, etc.)
        resumeContent = readFileSync(cleanedPath, "utf-8")
      }
    } catch (fileError) {
      throw new Error(`Failed to read resume file: ${cleanedPath}. Error: ${fileError}`)
    }

    // Generate email using AI
    const aiResponse = await fetch(`${process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000"}/api/generate-email`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        jobDescription: job.job_description,
        aiPrompt: job.ai_prompt,
        resumeContent,
        openai_api_key,
      }),
    })

    const aiResult = await aiResponse.json()

    if (!aiResult.success) {
      throw new Error(aiResult.error || "Failed to generate email")
    }

    // Send email via Gmail
    const emailResponse = await fetch(`${process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000"}/api/send-email`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        to: job.recruiter_email,
        subject: aiResult.subject,
        body: aiResult.body,
        attachmentPath: job.resume_path,
        gmail_user,
        gmail_app_password,
      }),
    })

    const emailResult = await emailResponse.json()

    if (!emailResult.success) {
      throw new Error(emailResult.error || "Failed to send email")
    }

    // Update job status to success
    updateJob(job.id, {
      status: "success",
      email_subject: aiResult.subject,
      email_body: aiResult.body,
    })

    console.log("[v0] Job completed successfully:", job.id)
    return { success: true, jobId: job.id }
  } catch (error) {
    console.error("[v0] Error processing job:", error)

    // Update job status to failure
    updateJob(job.id, {
      status: "failure",
      error_message: error instanceof Error ? error.message : "Unknown error",
    })

    return { error: error instanceof Error ? error.message : "Unknown error" }
  }
}
