import { getTodayJobs } from '@/lib/jobs-bucket-storage'

export async function GET(_req: Request) {
  try {
    const jobs = await getTodayJobs()
    return Response.json({ success: true, jobs })
  } catch (error) {
    console.error('[v0] Error fetching today jobs:', error)
    return Response.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to fetch jobs',
        jobs: [],
      },
      { status: 500 },
    )
  }
}
