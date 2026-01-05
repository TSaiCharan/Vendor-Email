import { processNextJob } from "@/lib/job-processor"

export const dynamic = "force-dynamic"

export async function POST(req: Request) {
  try {
    const result = await processNextJob()
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
    const result = await processNextJob()
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
