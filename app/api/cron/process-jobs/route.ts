import { processNextJob } from '@/lib/job-processor'

export const maxDuration = 60 // Max 60 seconds for processing

export async function GET(req: Request) {
  try {
    const authHeader = req.headers.get('authorization')
    const cronSecret = process.env.CRON_SECRET

    // Simple auth check for cron job
    if (cronSecret && authHeader !== `Bearer ${cronSecret}`) {
      return Response.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      )
    }

    console.log('[cron-process-jobs] Starting job processing routine')

    // Process up to 5 jobs in one cron run
    const results = []
    for (let i = 0; i < 5; i++) {
      const result = await processNextJob()
      results.push(result)

      // If no jobs left, break early
      if (result.noJobs) {
        console.log('[cron-process-jobs] No more jobs to process')
        break
      }

      // If already processing, wait a bit and try again
      if (result.processing) {
        console.log('[cron-process-jobs] Job already processing, waiting...')
        await new Promise(resolve => setTimeout(resolve, 2000))
        continue
      }

      // If job succeeded, log it
      if (result.success) {
        console.log('[cron-process-jobs] Job processed successfully:', result.jobId)
      }

      // If job failed, log error but continue with next
      if (result.error) {
        console.log('[cron-process-jobs] Job failed:', result.error)
      }
    }

    return Response.json({
      success: true,
      message: 'Cron job processing completed',
      results
    })
  } catch (error) {
    console.error('[cron-process-jobs] Error:', error)
    return Response.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to process jobs',
      },
      { status: 500 }
    )
  }
}
