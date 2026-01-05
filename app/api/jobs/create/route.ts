import { createJob } from "@/lib/json-storage-fs"

export async function POST(req: Request) {
  try {
    const { recruiter_email, job_description, ai_prompt, resume_path } = await req.json()

    // Validate required fields
    if (!recruiter_email || !job_description || !ai_prompt || !resume_path) {
      return Response.json(
        {
          success: false,
          error: "Missing required fields",
        },
        { status: 400 },
      )
    }

    const newJob = createJob({
      recruiter_email,
      job_description,
      ai_prompt,
      resume_path,
      status: "queued",
      email_subject: null,
      email_body: null,
      error_message: null,
    })

    return Response.json({
      success: true,
      job: newJob,
    })
  } catch (error) {
    console.error("[v0] Error creating job:", error)
    return Response.json(
      {
        success: false,
        error: error instanceof Error ? error.message : "Failed to create job",
      },
      { status: 500 },
    )
  }
}
