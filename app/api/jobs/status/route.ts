import { getJobById } from '@/lib/jobs-bucket-storage-server'
import type { Job } from '@/lib/types'

export async function GET(req: Request) {
  try {
    const url = new URL(req.url)
    const jobId = url.searchParams.get('id')

    if (!jobId) {
      return Response.json(
        { success: false, error: 'Job ID is required' },
        { status: 400 }
      )
    }

    const job = await getJobById(jobId)

    if (!job) {
      return Response.json(
        { success: false, error: 'Job not found' },
        { status: 404 }
      )
    }

    return Response.json({ success: true, job })
  } catch (error) {
    console.error('[v0] Error getting job status:', error)
    return Response.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to get job status',
      },
      { status: 500 }
    )
  }
}
