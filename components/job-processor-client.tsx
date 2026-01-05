"use client"

import { useEffect, useRef } from "react"
import { useRouter } from "next/navigation"

export function JobProcessorClient() {
  const router = useRouter()
  const intervalRef = useRef<NodeJS.Timeout | null>(null)

  useEffect(() => {
    // Process jobs every 10 seconds
    const processJobs = async () => {
      try {
        const response = await fetch("/api/process-jobs", {
          method: "POST",
        })
        const result = await response.json()

        if (result.success || result.error) {
          // Refresh the page to show updated job statuses
          router.refresh()
        }
      } catch (error) {
        console.error("[v0] Error calling process-jobs:", error)
      }
    }

    // Start processing immediately
    processJobs()

    // Then process every 10 seconds
    intervalRef.current = setInterval(processJobs, 10000)

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current)
      }
    }
  }, [router])

  return null
}
