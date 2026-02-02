'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Loader2 } from 'lucide-react'
import { toast } from '@/hooks/use-toast'

export function ManualJobProcessor() {
  const [isProcessing, setIsProcessing] = useState(false)

  const handleProcessJobs = async () => {
    setIsProcessing(true)
    try {
      const response = await fetch('/api/jobs/process-manual', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          max_jobs: 5,
        }),
      })

      const data = await response.json()

      if (data.success) {
        toast({
          title: 'Success',
          description: `Processed ${data.processed} job(s)`,
        })
      } else {
        toast({
          title: 'Error',
          description: data.error || 'Failed to process jobs',
          variant: 'destructive',
        })
      }
    } catch (error) {
      toast({
        title: 'Error',
        description: error instanceof Error ? error.message : 'Failed to process jobs',
        variant: 'destructive',
      })
    } finally {
      setIsProcessing(false)
    }
  }

  return (
    <Button
      onClick={handleProcessJobs}
      disabled={isProcessing}
      variant="outline"
      className="gap-2"
    >
      {isProcessing && <Loader2 className="h-4 w-4 animate-spin" />}
      {isProcessing ? 'Processing...' : 'Process Queued Jobs'}
    </Button>
  )
}
