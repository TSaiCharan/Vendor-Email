'use client'

import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'
import { useRouter } from 'next/navigation'
import { CreateJobDialog } from '@/components/create-job-dialog'
import { JobsTable } from '@/components/jobs-table'
import { UserDropdown } from '@/components/user-dropdown'

export default function Dashboard() {
  const [user, setUser] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [refreshTrigger, setRefreshTrigger] = useState(0)
  const router = useRouter()

  useEffect(() => {
    const fetchUser = async () => {
      const { data } = await supabase.auth.getSession()
      if (!data.session) {
        router.replace('/login')
        return
      }
      setUser(data.session.user)
      setLoading(false)
    }
    fetchUser()
  }, [router])

  const handleJobCreated = () => {
    setRefreshTrigger(prev => prev + 1)
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gradient-to-br from-blue-600 to-blue-800">
        <div className="text-white text-xl">Loading...</div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-600 to-blue-800 py-12 px-4">
      <div className="max-w-6xl mx-auto">
        <div className="bg-white rounded-2xl shadow-2xl overflow-hidden">
          {/* Header */}
          <div className="bg-gradient-to-r from-blue-600 to-blue-800 px-8 py-6 flex justify-between items-center">
            <div>
              <h1 className="text-3xl font-bold text-white">Job Applications Dashboard</h1>
              <p className="text-blue-100 mt-1">{user?.email}</p>
            </div>
            <UserDropdown email={user?.email} />
          </div>

          {/* Content */}
          <div className="p-8">
            <div className="mb-8 flex justify-between items-center">
              <h2 className="text-2xl font-bold text-gray-800">Create New Application</h2>
              <CreateJobDialog onJobCreated={handleJobCreated} />
            </div>

            {/* Job list */}
            <div className="border-t pt-8">
              <h3 className="text-xl font-bold text-gray-800 mb-4">Your Jobs</h3>
              <JobsTable key={refreshTrigger} />
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
