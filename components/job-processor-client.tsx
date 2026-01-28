"use client"

import { useEffect, useRef } from "react"
import { useRouter } from "next/navigation"
import { supabase } from "@/lib/supabase"

export function JobProcessorClient() {
  const router = useRouter()
  const intervalRef = useRef<NodeJS.Timeout | null>(null)

  useEffect(() => {
    // Process jobs every 10 seconds
    const processJobs = async () => {
      try {
        // Get current user
        const {
          data: { user },
        } = await supabase.auth.getUser()

        if (!user) {
          console.log("[v0] No user session, skipping job processing")
          return
        }

        // Fetch user's API keys from Supabase
        const { data: apiKeys, error } = await supabase
          .from("user_api_keys")
          .select("*")
          .eq("user_id", user.id)
          .single()

        if (error) {
          console.warn("[v0] Could not fetch API keys:", error.message)
        }

        const response = await fetch("/api/process-jobs", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            openai_api_key: apiKeys?.openai_api_key,
            gmail_user: apiKeys?.gmail_user,
            gmail_app_password: apiKeys?.gmail_app_password,
          }),
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
