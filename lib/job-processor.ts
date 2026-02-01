import { readFileSync } from "fs"
import { updateJob, getJobsByStatus } from "@/lib/jobs-bucket-storage-server"
import { existsSync } from "fs"
import path from "path"

export async function processNextJob(openai_api_key?: string, gmail_user?: string, gmail_app_password?: string) {
  // Check if there's already a job processing
  const processingJobs = await getJobsByStatus("processing")

  if (processingJobs.length > 0) {
    console.log("[v0] A job is already processing, skipping...")
    return { processing: true }
  }

  // Get the next queued job
  const queuedJobs = await getJobsByStatus("queued")

  if (queuedJobs.length === 0) {
    console.log("[v0] No queued jobs to process")
    return { noJobs: true }
  }

  // Sort by created_at and get the oldest
  const job = queuedJobs.sort((a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime())[0]
  console.log("[v0] Processing job:", job.id)

  // Update job status to processing
  await updateJob(job.id, { status: "processing" })

  try {
    // Handle resume file - it could be a URL or local path
    let resumeContent: string
    
    if (job.resume_path.startsWith('http://') || job.resume_path.startsWith('https://')) {
      // It's a URL (from Supabase storage or other cloud storage)
      console.log('[v0] Downloading resume from URL:', job.resume_path)
      try {
        const response = await fetch(job.resume_path)
        if (!response.ok) {
          throw new Error(`Failed to download resume: ${response.status}`)
        }
        
        const contentType = response.headers.get('content-type') || ''
        
        if (contentType.includes('pdf') || job.resume_path.endsWith('.pdf')) {
          // Handle PDF from URL
          const buffer = await response.arrayBuffer()
          const pdfBuffer = Buffer.from(buffer)
          
          let extractedText = ""
          try {
            const mod: any = await import('pdf-parse').catch(() => null)
            const pdfFn = mod && (mod.default ?? mod)
            if (pdfFn && typeof pdfFn === 'function') {
              const pdfData = await pdfFn(pdfBuffer as any)
              extractedText = (pdfData && pdfData.text) || ""
            }
          } catch (e) {
            console.warn('[v0] PDF extraction failed:', e)
          }

          if (extractedText && extractedText.trim()) {
            resumeContent = extractedText
          } else {
            resumeContent = `PDF resume — text extraction not available. Please provide a text version of the resume (e.g. .txt).`
            console.warn('[v0] Falling back to placeholder resume content for job:', job.id)
          }
        } else {
          // Text-based resume from URL
          resumeContent = await response.text()
        }
      } catch (urlError) {
        throw new Error(`Failed to download resume from URL: ${urlError}`)
      }
    } else {
      // Local file path (for local development only)
      console.log('[v0] Reading resume from local path:', job.resume_path)
      
      // Clean and validate resume file path
      let cleanedPath = job.resume_path
      if (cleanedPath.startsWith('file://')) {
        cleanedPath = cleanedPath.replace('file:///', '')
      }
      
      // Check if file exists
      if (!existsSync(cleanedPath)) {
        throw new Error(`Resume file not found: ${cleanedPath}. Please use uploaded resume URLs instead of local file paths for production compatibility.`)
      }
      
      // Check file extension
      const fileExt = path.extname(cleanedPath).toLowerCase()
      
      try {
        if (fileExt === '.pdf') {
          // Read the PDF buffer first
          const pdfBuffer = readFileSync(cleanedPath)

          let extractedText = ""
          try {
            const mod: any = await import('pdf-parse').catch(() => null)
            const pdfFn = mod && (mod.default ?? mod)
            if (pdfFn && typeof pdfFn === 'function') {
              const pdfData = await pdfFn(pdfBuffer as any)
              extractedText = (pdfData && pdfData.text) || ""
            } else {
              console.warn('[v0] pdf-parse is not available or not callable in this runtime; skipping extraction')
            }
          } catch (e) {
            console.warn('[v0] PDF extraction attempt failed:', e)
          }

          if (extractedText && extractedText.trim()) {
            resumeContent = extractedText
          } else {
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
    await updateJob(job.id, {
      status: "success",
      email_subject: aiResult.subject,
      email_body: aiResult.body,
    })

    console.log("[v0] Job completed successfully:", job.id)
    return { success: true, jobId: job.id }
  } catch (error) {
    console.error("[v0] Error processing job:", error)

    // Update job status to failure
    await updateJob(job.id, {
      status: "failure",
      error_message: error instanceof Error ? error.message : "Unknown error",
    })

    return { error: error instanceof Error ? error.message : "Unknown error" }
  }
}
