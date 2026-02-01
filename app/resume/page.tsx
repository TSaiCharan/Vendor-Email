'use client'

import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { UserApiKeys, UserResume } from '@/lib/database.types'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Trash2, Upload, ArrowLeft } from 'lucide-react'

export default function ResumePage() {
  const [user, setUser] = useState<any>(null)
  const [resumes, setResumes] = useState<UserResume[]>([])
  const [loading, setLoading] = useState(true)
  const [uploading, setUploading] = useState(false)
  const [resumeName, setResumeName] = useState('')
  const [selectedFile, setSelectedFile] = useState<File | null>(null)
  const [message, setMessage] = useState('')
  const [messageType, setMessageType] = useState<'success' | 'error'>('success')
  const router = useRouter()

  useEffect(() => {
    const fetchData = async () => {
      try {
        const {
          data: { user },
        } = await supabase.auth.getUser()

        if (!user) {
          router.push('/login')
          return
        }

        setUser(user)

        // Fetch user's resumes
        const { data: resumesData, error: resumesError } = await supabase
          .from('user_resumes')
          .select('*')
          .eq('user_id', user.id)
          .order('created_at', { ascending: false })

        if (!resumesError && resumesData) {
          setResumes(resumesData)
        }

        setLoading(false)
      } catch (error) {
        console.error('Error fetching data:', error)
        setLoading(false)
      }
    }

    fetchData()
  }, [router])

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setSelectedFile(e.target.files[0])
    }
  }

  const handleUpload = async (e: React.FormEvent) => {
    e.preventDefault()
    setMessage('')

    if (!selectedFile || !resumeName.trim()) {
      setMessageType('error')
      setMessage('Please select a file and enter a resume name')
      return
    }

    if (resumes.length >= 3) {
      setMessageType('error')
      setMessage('You can only upload up to 3 resumes')
      return
    }

    setUploading(true)

    try {
      const {
        data: { user },
      } = await supabase.auth.getUser()

      if (!user) {
        throw new Error('No user found')
      }

      // Upload file to Supabase storage
      const fileExt = selectedFile.name.split('.').pop()
      const fileName = `${user.id}/${Date.now()}.${fileExt}`

      const { error: uploadError } = await supabase.storage
        .from('resumes')
        .upload(fileName, selectedFile)

      if (uploadError) {
        throw uploadError
      }

      // Get public URL
      const {
        data: { publicUrl },
      } = supabase.storage.from('resumes').getPublicUrl(fileName)

      // Save resume metadata to database
      const { data: newResume, error: dbError } = await supabase
        .from('user_resumes')
        .insert([
          {
            user_id: user.id,
            name: resumeName,
            file_url: publicUrl,
          },
        ])
        .select()
        .single()

      if (dbError) {
        throw dbError
      }

      setResumes([newResume, ...resumes])
      setResumeName('')
      setSelectedFile(null)
      setMessageType('success')
      setMessage('Resume uploaded successfully!')

      // Clear message after 3 seconds
      setTimeout(() => setMessage(''), 3000)
    } catch (error) {
      console.error('Error uploading resume:', error)
      setMessageType('error')
      setMessage(error instanceof Error ? error.message : 'Failed to upload resume')
    } finally {
      setUploading(false)
    }
  }

  const handleDelete = async (resumeId: string) => {
    try {
      const { error } = await supabase
        .from('user_resumes')
        .delete()
        .eq('id', resumeId)

      if (error) {
        throw error
      }

      setResumes(resumes.filter(r => r.id !== resumeId))
      setMessageType('success')
      setMessage('Resume deleted successfully!')
      setTimeout(() => setMessage(''), 3000)
    } catch (error) {
      console.error('Error deleting resume:', error)
      setMessageType('error')
      setMessage('Failed to delete resume')
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gradient-to-br from-slate-950 to-slate-900">
        <div className="text-slate-100 text-xl">Loading...</div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 to-slate-900 py-12 px-4">
      <div className="max-w-2xl mx-auto">
        <div className="bg-slate-900 rounded-2xl shadow-2xl overflow-hidden border border-slate-800">
          {/* Header */}
          <div className="bg-gradient-to-r from-indigo-600 to-purple-700 px-8 py-6">
            <div className="flex items-center justify-between">
              <div>
                <h1 className="text-3xl font-bold text-white">Manage Resumes</h1>
                <p className="text-indigo-100 mt-1">{user?.email}</p>
              </div>
              <Link href="/home">
                <Button variant="ghost" className="text-white hover:bg-indigo-700">
                  <ArrowLeft className="mr-2 h-4 w-4" />
                  Back
                </Button>
              </Link>
            </div>
          </div>

          {/* Content */}
          <div className="p-8">
            {message && (
              <div
                className={`mb-6 p-4 rounded-lg border ${
                  messageType === 'success'
                    ? 'bg-green-900/20 border-green-800'
                    : 'bg-red-900/20 border-red-800'
                }`}
              >
                <p
                  className={`text-sm font-medium ${
                    messageType === 'success'
                      ? 'text-green-400'
                      : 'text-red-400'
                  }`}
                >
                  {message}
                </p>
              </div>
            )}

            {/* Upload Form */}
            <div className="mb-8 p-6 bg-slate-800 rounded-lg border border-slate-700">
              <h2 className="text-xl font-bold text-slate-100 mb-4">Upload New Resume</h2>
              <p className="text-sm text-slate-400 mb-4">
                You can upload up to 3 resumes. ({resumes.length}/3)
              </p>

              <form onSubmit={handleUpload} className="space-y-4">
                <div>
                  <Label htmlFor="resume-name">Resume Name *</Label>
                  <Input
                    id="resume-name"
                    type="text"
                    placeholder="e.g., Senior Java Developer, Full Stack"
                    value={resumeName}
                    onChange={(e) => setResumeName(e.target.value)}
                    disabled={uploading}
                    required
                  />
                  <p className="text-xs text-gray-500 mt-1">
                    Give your resume a descriptive name (e.g., the job title or role it's for)
                  </p>
                </div>

                <div>
                  <Label htmlFor="resume-file">Select File (PDF, DOC, DOCX) *</Label>
                  <Input
                    id="resume-file"
                    type="file"
                    accept=".pdf,.doc,.docx"
                    onChange={handleFileChange}
                    disabled={uploading}
                    required
                  />
                </div>

                <Button
                  type="submit"
                  disabled={uploading || resumes.length >= 3}
                  className="w-full gap-2"
                >
                  <Upload className="h-4 w-4" />
                  {uploading ? 'Uploading...' : 'Upload Resume'}
                </Button>
              </form>
            </div>

            {/* Resumes List */}
            <div>
              <h2 className="text-xl font-bold text-slate-100 mb-4">Your Resumes</h2>

              {resumes.length === 0 ? (
                <div className="p-6 text-center bg-slate-800 rounded-lg border border-slate-700">
                  <p className="text-slate-400">No resumes uploaded yet. Upload your first resume above!</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {resumes.map((resume) => (
                    <div
                      key={resume.id}
                      className="flex items-center justify-between p-4 bg-slate-800 rounded-lg border border-slate-700 hover:bg-slate-700 transition"
                    >
                      <div>
                        <p className="font-semibold text-slate-100">{resume.name}</p>
                        <p className="text-xs text-slate-400">
                          Uploaded {new Date(resume.created_at).toLocaleDateString()}
                        </p>
                      </div>
                      <button
                        onClick={() => handleDelete(resume.id)}
                        className="p-2 text-red-400 hover:bg-red-900/30 rounded-lg transition"
                        title="Delete resume"
                      >
                        <Trash2 className="h-5 w-5" />
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
