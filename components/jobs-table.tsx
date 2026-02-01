"use client"

import React, { useEffect, useState, useRef } from "react"
import { useSearchParams } from "next/navigation"
import {
  Table,
  TableHeader,
  TableBody,
  TableRow,
  TableHead,
  TableCell,
  TableCaption,
} from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { Clock, CheckCircle2, XCircle, Loader2, Calendar } from "lucide-react"
import { formatDistanceToNow } from "date-fns"
import type { Job } from "@/lib/types"

const statusConfig: Record<
  Job["status"],
  { label: string; icon: any; className: string }
> = {
  queued: {
    label: "Queued",
    icon: Clock,
    className: "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200",
  },
  processing: {
    label: "Processing",
    icon: Loader2,
    className: "bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200",
  },
  success: {
    label: "Success",
    icon: CheckCircle2,
    className: "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200",
  },
  failure: {
    label: "Failed",
    icon: XCircle,
    className: "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200",
  },
}

export function JobsTable({ selectedDate }: { selectedDate?: string }) {
  const [jobs, setJobs] = useState<Job[] | null>(null)
  const [error, setError] = useState<string | null>(null)

  // read ?date= from URL as fallback when server didn't re-render
  const searchParams = useSearchParams()
  const urlDate = searchParams?.get("date") ?? undefined

  // initialize selectedDate state: prop -> url -> today
  const today = new Date().toISOString().split("T")[0]
  const initialDate = selectedDate ?? urlDate ?? today
  const [selectedDateState, setSelectedDateState] = useState<string>(initialDate)

  // ref for native date input so calendar can be opened by focusing it
  const dateInputRef = useRef<HTMLInputElement | null>(null)

  // helper to open native date picker where supported
  function openNativeDatePicker() {
    const el = dateInputRef.current
    if (!el) return
    // modern browsers (Chromium) expose showPicker()
    const anyEl = el as any
    if (typeof anyEl.showPicker === "function") {
      try {
        anyEl.showPicker()
        return
      } catch {
        // ignore and fallback
      }
    }
    // fallback: focus + click usually opens the calendar
    el.focus()
    try {
      el.click()
    } catch {
      /* ignore */
    }
  }

  // use selectedDateState as the date to fetch/filter
  const effectiveDate = selectedDateState

  useEffect(() => {
    let mounted = true

    async function tryFetch(url: string, signal?: AbortSignal) {
      try {
        const res = await fetch(url, { signal })
        if (!res.ok) return null
        const data = await res.json()
        if (!data?.success) return null
        return data.jobs || []
      } catch {
        return null
      }
    }

    async function load() {
      try {
        setJobs(null)
        setError(null)

        // fetch using AbortController so changing date cancels previous requests
        const controller = new AbortController()
        const signal = controller.signal
        let dataJobs = null
        if (effectiveDate) {
          dataJobs = await tryFetch(`/api/jobs?date=${encodeURIComponent(effectiveDate)}`, signal)
        }
        if (dataJobs === null) {
          dataJobs = await tryFetch("/api/jobs", signal)
        }
        if (dataJobs === null) {
          dataJobs = await tryFetch("/api/jobs/today", signal)
        }
        if (!mounted) {
          controller.abort()
          return
        }
        if (!dataJobs) {
          setJobs([])
          setError("Failed to load jobs")
          return
        }
        setJobs(dataJobs)
        return () => controller.abort()
      } catch (err) {
        if (!mounted) return
        setError(err instanceof Error ? err.message : String(err))
        setJobs([])
      }
    }

    load()

    // Auto-refresh every 5 seconds if there are queued or processing jobs
    const interval = setInterval(() => {
      if (mounted) {
        load()
      }
    }, 5000)

    return () => {
      mounted = false
      clearInterval(interval)
    }
  }, [effectiveDate])

  if (error) {
    return <div className="text-destructive text-sm">Error loading jobs: {error}</div>
  }

  if (!jobs) {
    return <div className="text-sm">Loading jobs...</div>
  }

  // filter jobs by effectiveDate if provided (defensive: some endpoints may return multiple dates)
  const filteredJobs = (() => {
    if (!effectiveDate) return jobs
    try {
      return jobs.filter((job: any) => {
        const createdDate = job.created_at ? String(job.created_at).split("T")[0] : ""
        return createdDate === effectiveDate
      })
    } catch {
      return jobs
    }
  })()

  if (filteredJobs.length === 0) {
    return (
      <div>
        <div className="flex justify-end mb-3 items-center space-x-2">
          {/* visible date text input */}
          <input
            type="date"
            ref={dateInputRef}
            value={selectedDateState}
            onChange={(e) => setSelectedDateState(e.target.value)}
            className="border rounded px-2 py-1"
            aria-label="Select date"
          />
          {/* calendar button focuses the native input to open calendar */}
          <button
            type="button"
            onClick={openNativeDatePicker}
            className="p-2 rounded hover:bg-muted/10"
            aria-label="Open calendar"
          >
            <Calendar className="h-5 w-5" />
          </button>
        </div>
        <div className="text-sm text-muted-foreground">No jobs for {effectiveDate ?? "today"}.</div>
      </div>
    )
  }

  return (
    <div>
      {/* date picker (top-right) */}
      <div className="flex justify-end mb-3 items-center space-x-2">
        <input
          type="date"
          ref={dateInputRef}
          value={selectedDateState}
          onChange={(e) => setSelectedDateState(e.target.value)}
          className="border rounded px-2 py-1"
          aria-label="Select date"
        />
        <button
          type="button"
          onClick={openNativeDatePicker}
          className="p-2 rounded hover:bg-muted/10"
          aria-label="Open calendar"
        >
          <Calendar className="h-5 w-5" />
        </button>
      </div>
      <div className="overflow-auto">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Recruiter</TableHead>
              {/* <TableHead>Created</TableHead> */}
              <TableHead>Status</TableHead>
              <TableHead>Subject</TableHead>
              <TableHead>Error</TableHead>
              <TableHead>Resume</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredJobs.map((job) => {
              const cfg = statusConfig[job.status]
              const Icon = cfg.icon

              return (
                <TableRow key={job.id}>
                  <TableCell className="max-w-xs truncate">{job.recruiter_email}</TableCell>
                  {/* <TableCell className="text-xs">{formatDistanceToNow(new Date(job.created_at), { addSuffix: true })}</TableCell> */}
                  <TableCell>
                    <Badge className={cfg.className + " inline-flex items-center"}>
                      <Icon className={`h-3 w-3 mr-1 ${job.status === "processing" ? "animate-spin" : ""}`} />
                      {cfg.label}
                    </Badge>
                  </TableCell>
                  <TableCell className="max-w-sm truncate">{job.email_subject ?? <span className="text-muted-foreground text-xs">—</span>}</TableCell>
                  <TableCell className="max-w-sm truncate">
                    {job.error_message ? <span className="text-destructive text-xs">{job.error_message}</span> : <span className="text-muted-foreground text-xs">—</span>}
                  </TableCell>
                  <TableCell className="text-xs max-w-xs truncate">{job.resume_path}</TableCell>
                </TableRow>
              )
            })}
          </TableBody>
          <TableCaption>Showing {filteredJobs.length} job(s) for {effectiveDate ?? "today"}</TableCaption>
        </Table>
      </div>
    </div>
  )
}

export default JobsTable
