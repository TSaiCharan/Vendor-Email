"use client"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import type { Job } from "@/lib/types"
import { Clock, CheckCircle2, XCircle, Loader2 } from "lucide-react"
import { formatDistanceToNow } from "date-fns"

interface JobCardProps {
  job: Job
}

const statusConfig = {
  queued: {
    label: "Queued",
    icon: Clock,
    variant: "secondary" as const,
    className: "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200",
  },
  processing: {
    label: "Processing",
    icon: Loader2,
    variant: "default" as const,
    className: "bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200",
  },
  success: {
    label: "Success",
    icon: CheckCircle2,
    variant: "default" as const,
    className: "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200",
  },
  failure: {
    label: "Failed",
    icon: XCircle,
    variant: "destructive" as const,
    className: "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200",
  },
}

export function JobCard({ job }: JobCardProps) {
  const config = statusConfig[job.status]
  const StatusIcon = config.icon

  return (
    <Card className="hover:shadow-md transition-shadow">
      <CardHeader>
        <div className="flex items-start justify-between gap-4">
          <div className="flex-1 min-w-0">
            <CardTitle className="text-lg truncate">{job.recruiter_email}</CardTitle>
            <CardDescription className="text-xs">
              Created {formatDistanceToNow(new Date(job.created_at), { addSuffix: true })}
            </CardDescription>
          </div>
          <Badge className={config.className}>
            <StatusIcon className={`h-3 w-3 mr-1 ${job.status === "processing" ? "animate-spin" : ""}`} />
            {config.label}
          </Badge>
        </div>
      </CardHeader>
      <CardContent className="space-y-3">
        <div>
          <p className="text-sm font-medium text-muted-foreground mb-1">Job Description</p>
          <p className="text-sm line-clamp-3">{job.job_description}</p>
        </div>

        {job.email_subject && (
          <div>
            <p className="text-sm font-medium text-muted-foreground mb-1">Email Subject</p>
            <p className="text-sm font-medium">{job.email_subject}</p>
          </div>
        )}

        {job.error_message && (
          <div className="bg-destructive/10 p-3 rounded-md">
            <p className="text-sm font-medium text-destructive mb-1">Error</p>
            <p className="text-xs text-destructive">{job.error_message}</p>
          </div>
        )}

        <div className="pt-2 border-t">
          <p className="text-xs text-muted-foreground">Resume: {job.resume_path}</p>
        </div>
      </CardContent>
    </Card>
  )
}
