import { CreateJobDialog } from "@/components/create-job-dialog"
import { JobProcessorClient } from "@/components/job-processor-client"
import JobsTable from "@/components/jobs-table"
import DateSelector from "@/components/date-selector"
import VariablesPanel from "@/components/variables-panel"

export const dynamic = "force-dynamic"

// Accept searchParams so the server component can pick up ?date=YYYY-MM-DD
export default async function HomePage({ searchParams }: { searchParams?: { date?: string } }) {
  const todayDate = new Date().toISOString().split("T")[0]
  const selectedDate = (searchParams && searchParams.date) || todayDate

  return (
    <div className="min-h-screen bg-background">
      <JobProcessorClient />

      <header className="border-b bg-card">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-foreground">Job Application Automation</h1>
            <p className="text-sm text-muted-foregr ound">Automate your job applications with AI</p>
          </div>
          <div className="flex items-center gap-3">
            {/* Date selector updates ?date=YYYY-MM-DD in the URL */}
            <CreateJobDialog />
            <VariablesPanel />
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8">
        <div className="mb-6">
          {/* <h2 className="text-lg font-semibold">Today's Jobs</h2> */}
          <h2 className="text-lg font-semibold">Track the status of your job applications</h2>
        </div>

        {/* Pass selectedDate so JobsTable can filter jobs for the chosen day */}
        <JobsTable selectedDate={selectedDate} />
      </main>
    </div>
  )
}
