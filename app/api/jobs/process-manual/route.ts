import { processNextJob } from '@/lib/job-processor'
import { getJobsByStatus } from '@/lib/jobs-bucket-storage-server'

// Process jobs with user's API keys
export const maxDuration = 60

export async function POST(req: Request) {
  try {
    const { openai_api_key, gmail_user, gmail_app_password, max_jobs = 1 } = await req.json()

    // Require at least one credential
    if (!openai_api_key && !gmail_user) {
      return Response.json(
        { success: false, error: 'Missing credentials' },
        { status: 400 }
      )
    }

    console.log('[manual-process] Processing up to', max_jobs, 'jobs')

    const results = []

    // Process up to max_jobs
    for (let i = 0; i < max_jobs; i++) {
      const result = await processNextJob(openai_api_key, gmail_user, gmail_app_password)
      results.push(result)

      if (result.noJobs) {
        console.log('[manual-process] No more jobs to process')
        break
      }

      if (result.processing) {
        console.log('[manual-process] Job already processing')
        break
      }
    }

    return Response.json({
      success: true,
      processed: results.length,
      results,
    })
  } catch (error) {
    console.error('[manual-process] Error:', error)
    return Response.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    )
  }
}

export async function GET(req: Request) {
  try {
    // GET endpoint for manual triggering (no credentials passed)
    const result = await processNextJob()

    return Response.json({
      success: true,
      result,
    })
  } catch (error) {
    console.error('[manual-process] Error:', error)
    return Response.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    )
  }
}
