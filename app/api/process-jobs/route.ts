import { processNextJob } from "@/lib/job-processor"

export const dynamic = "force-dynamic"

export async function POST(req: Request) {
  try {
    const body = await req.json().catch(() => ({}))
    const { openai_api_key, gmail_user, gmail_app_password } = body

    console.log('[v0] [process-jobs] Starting job processing with credentials provided:', {
      has_openai: !!openai_api_key,
      has_gmail_user: !!gmail_user,
      has_gmail_pass: !!gmail_app_password,
    })

    const result = await processNextJob(openai_api_key, gmail_user, gmail_app_password)
    
    console.log('[v0] [process-jobs] Job processing result:', result)
    
    return Response.json(result)
  } catch (error) {
    console.error("[v0] Error in process-jobs route:", error)
    return Response.json(
      {
        success: false,
        error: error instanceof Error ? error.message : "Failed to process jobs",
      },
      { status: 500 },
    )
  }
}

export async function GET(req: Request) {
  try {
    console.log('[v0] [process-jobs] GET request - starting job processing')
    const result = await processNextJob()
    
    console.log('[v0] [process-jobs] Job processing result:', result)
    
    return Response.json(result)
  } catch (error) {
    console.error("[v0] Error in process-jobs route:", error)
    return Response.json(
      {
        success: false,
        error: error instanceof Error ? error.message : "Failed to process jobs",
      },
      { status: 500 },
    )
  }
}
