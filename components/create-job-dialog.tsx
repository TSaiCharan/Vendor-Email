"use client"

import type React from "react"

import { useEffect, useState } from "react"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Plus } from "lucide-react"
import { useRouter } from "next/navigation"
import { supabase } from "@/lib/supabase"
import { UserResume } from "@/lib/database.types"

// --- Changed: make prompt generic and remove hard-coded personal signature ---
// Provide a minimal generic prompt that hosts can override via props.
// Include a placeholder {SIGNATURE} which host can replace with their own signature.
const GENERIC_AI_PROMPT = `
You are a professional job application assistant. Based on the job description and resume provided, generate a concise email.

Please provide:
1. A concise, professional subject line
2. A personalized email body that:
   - Expresses genuine interest in the position
   - Highlights relevant skills and experience from the resume that match the job description
   - Demonstrates knowledge of the role
   - Includes a clear call to action
   - Maintains a professional yet personable tone
3. Body should
Format your response as JSON with two fields: "subject" and "body".

Subject should be
Application for [role name] (Location).

Signature at end of email should be.
Best regards,
Sai Charan Teratipally
tcharan.tech@gmail.com
+1 (940) 277-2434

Please format the email body with proper line breaks:
- One line break after the greeting
- Double line breaks between paragraphs
- One line break before the signature
- Use \\n for line breaks
- Make sure to format the body same like below example response but alter according to jd

Example format:
Hello ,\\n\\n[Paragraph 1]\\n\\n[Paragraph 2]\\n\\nBest regards,\\n[Your Name]

Example response:

Hello,

I hope you’re doing well.

Thank you for sharing the details of the Senior Java Microservices Engineer (Cloud-Native | Reactive Systems) position in Sunnyvale, CA. I’m very interested in this opportunity and believe my experience aligns closely with the role requirements.

I have over 10 years of experience in designing and developing scalable, cloud-native, and microservices-based enterprise applications using Java (8–17), Spring Boot, and distributed systems architecture. My technical background also includes hands-on expertise with Kubernetes, Docker, GCP, Azure, and messaging frameworks such as Kafka.

Some highlights from my experience include:

- Designing reactive, fault-tolerant microservices using Spring Boot, WebFlux, and Camel.

- Deploying and scaling microservices on Kubernetes and cloud platforms (Azure & GCP).

- Working with Oracle, Cassandra, and Cosmos DB for distributed data processing.

- Implementing CI/CD pipelines using Jenkins and Git, ensuring high code quality through JUnit, Mockito, and TDD practices.

- Strong focus on performance tuning, multithreading, and high availability in distributed systems.


Please find my updated resume attached for your review. I would love the opportunity to discuss how my experience aligns with your client’s needs.

Looking forward to hearing from you.

{Signature}

`

const DEFAULT_RESUME_PATH = "C:/Users/sai60/Desktop/origintek/Resume/Versions/v6/SaiCharan_resume.pdf"

export function CreateJobDialog({ onJobCreated }: { onJobCreated?: () => void }) {
  const [open, setOpen] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [recruiterEmail, setRecruiterEmail] = useState("")
  const [jobDescription, setJobDescription] = useState("")
  const [selectedResume, setSelectedResume] = useState<string>("")
  const [userResumes, setUserResumes] = useState<UserResume[]>([])
  const [resumesLoading, setResumesLoading] = useState(false)
  const [isUploadingResume, setIsUploadingResume] = useState(false)
  // initialize from sessionStorage if set (session-level variables)
  const [aiPrompt, setAiPrompt] = useState<string>(() => {
    try {
      return typeof window !== "undefined"
        ? sessionStorage.getItem("GENERIC_AI_PROMPT") ?? GENERIC_AI_PROMPT
        : GENERIC_AI_PROMPT
    } catch {
      return GENERIC_AI_PROMPT
    }
  })
  const [error, setError] = useState<string | null>(null)
  const [copiedField, setCopiedField] = useState<string | null>(null)

  // new: source selection and available keys
  const [promptSource, setPromptSource] = useState<{ type: "manual" | "session"; key?: string }>({ type: "manual" })
  const [resumeSource, setResumeSource] = useState<{ type: "manual" | "session"; key?: string }>({ type: "manual" })
  const [availableKeys, setAvailableKeys] = useState<string[]>([])

  // helper: read a variable value by key.
  // First try sessionStorage.getItem(key). If not found, try parsing LOCAL_VARS JSON and return parsed[key].
  function readSessionVar(key?: string) {
    if (!key) return ""
    try {
      const v = sessionStorage.getItem(key)
      if (v !== null) return v
      const local = sessionStorage.getItem("LOCAL_VARS")
      if (local) {
        try {
          const parsed = JSON.parse(local)
          if (parsed && typeof parsed === "object" && Object.prototype.hasOwnProperty.call(parsed, key)) {
            return String(parsed[key] ?? "")
          }
        } catch {
          // ignore parse error
        }
      }
    } catch {
      // ignore storage errors
    }
    return ""
  }

  // load available variable keys from sessionStorage when dialog opens
  useEffect(() => {
    if (!open) return
    
    // Fetch user's resumes
    const fetchResumes = async () => {
      try {
        setResumesLoading(true)
        const {
          data: { user },
        } = await supabase.auth.getUser()

        if (user) {
          const { data: resumes } = await supabase
            .from("user_resumes")
            .select("*")
            .eq("user_id", user.id)
            .order("created_at", { ascending: false })

          if (resumes) {
            setUserResumes(resumes)
            if (resumes.length > 0 && !selectedResume) {
              setSelectedResume(resumes[0].id)
            }
          }
        }
      } catch (error) {
        console.error("Error fetching resumes:", error)
      } finally {
        setResumesLoading(false)
      }
    }

    fetchResumes()

    try {
      const keys = new Set<string>()
      // built-in names / user-renamed keys
      const mappedPromptKey = sessionStorage.getItem("VAR_NAME_PROMPT") ?? "GENERIC_AI_PROMPT"
      const mappedResumeKey = sessionStorage.getItem("VAR_NAME_RESUME") ?? "DEFAULT_RESUME_PATH"
      keys.add(mappedPromptKey)
      keys.add(mappedResumeKey)

      // custom vars
      const local = sessionStorage.getItem("LOCAL_VARS")
      if (local) {
        try {
          const parsed = JSON.parse(local)
          if (parsed && typeof parsed === "object") {
            Object.keys(parsed).forEach((k) => keys.add(k))
          }
        } catch {
          // ignore parse errors
        }
      }

      // also include raw default names to be safe
      keys.add("GENERIC_AI_PROMPT")
      keys.add("DEFAULT_RESUME_PATH")

      setAvailableKeys(Array.from(keys))
    } catch {
      setAvailableKeys([])
    }
  }, [open])

  // ensure variables panel hides when dialog is closed
  useEffect(() => {
    // when Create Job dialog opens, pick up latest session values (so updated variables are used)
    if (open) {
      try {
        const sPrompt = sessionStorage.getItem("GENERIC_AI_PROMPT")
        const sResume = sessionStorage.getItem("DEFAULT_RESUME_PATH")
        if (sPrompt) setAiPrompt(sPrompt)
        if (sResume) setResumePath(sResume)
      } catch {
        // ignore
      }
    }
  }, [open])

  const router = useRouter()

  // Quick resume upload handler
  const handleQuickUploadResume = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    setIsUploadingResume(true)
    try {
      const formData = new FormData()
      formData.append('file', file)

      const response = await fetch('/api/resumes/upload', {
        method: 'POST',
        body: formData,
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Failed to upload resume')
      }

      // Refresh resumes list
      const {
        data: { user },
      } = await supabase.auth.getUser()

      if (user) {
        const { data: resumes } = await supabase
          .from('user_resumes')
          .select('*')
          .eq('user_id', user.id)
          .order('created_at', { ascending: false })

        if (resumes) {
          setUserResumes(resumes)
          if (resumes.length > 0) {
            setSelectedResume(resumes[0].id)
          }
        }
      }

      setError(null)
    } catch (error) {
      console.error('Error uploading resume:', error)
      setError(error instanceof Error ? error.message : 'Failed to upload resume')
    } finally {
      setIsUploadingResume(false)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)
    setError(null)

    if (!selectedResume) {
      setError("Please select a resume")
      setIsLoading(false)
      return
    }

    const selectedResumeData = userResumes.find(r => r.id === selectedResume)
    const resumePath = selectedResumeData?.file_url || ""

    try {
      const response = await fetch("/api/jobs/create", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          recruiter_email: recruiterEmail,
          job_description: jobDescription,
          ai_prompt: aiPrompt,
          resume_path: resumePath,
        }),
      })

      const result = await response.json()

      if (!result.success) {
        throw new Error(result.error || "Failed to create job")
      }

      console.log("[v0] Job created successfully:", result.job?.id)

      // Reset form and close dialog
      setRecruiterEmail("")
      setJobDescription("")
      setAiPrompt(GENERIC_AI_PROMPT)
      setSelectedResume("")
      setOpen(false)

      // Call the callback to refresh jobs
      if (onJobCreated) {
        onJobCreated()
      }

      // Trigger job processing immediately with user's API keys
      try {
        const {
          data: { user },
        } = await supabase.auth.getUser()

        if (user) {
          console.log("[v0] Fetching API keys for user:", user.id)
          
          const { data: apiKeys, error: keysError } = await supabase
            .from("user_api_keys")
            .select("*")
            .eq("user_id", user.id)
            .single()

          if (keysError) {
            console.warn("[v0] Warning: Could not fetch API keys:", keysError)
          }

          if (apiKeys) {
            console.log("[v0] Triggering job processing with credentials")
            
            const processingResponse = await fetch("/api/process-jobs", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({
                openai_api_key: apiKeys?.openai_api_key,
                gmail_user: apiKeys?.gmail_user,
                gmail_app_password: apiKeys?.gmail_app_password,
              }),
            })

            const processingResult = await processingResponse.json()
            console.log("[v0] Job processing response:", processingResult)
          } else {
            console.warn("[v0] Warning: No API keys found for user. Job will remain queued.")
          }
        }
      } catch (error) {
        console.error("Error triggering job processor:", error)
      }

      // Refresh the page to show the new job
      router.refresh()
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to create job")
    } finally {
      setIsLoading(false)
    }
  }

  // helper: copy variable value to clipboard and show temporary status
  async function copyToClipboard(name: string, value: string) {
    try {
      await navigator.clipboard.writeText(value ?? "")
      setCopiedField(name)
      setTimeout(() => setCopiedField(null), 1500)
    } catch {
      setCopiedField(null)
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button className="gap-2">
          <Plus className="h-4 w-4" />
          Create Job
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Create New Job Application</DialogTitle>
          <DialogDescription>
            Fill in the details to create a new job application. The system will generate and send an email
            automatically.
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="recruiter-email">Recruiter Email *</Label>
            <Input
              id="recruiter-email"
              type="email"
              placeholder="recruiter@company.com"
              value={recruiterEmail}
              onChange={(e) => setRecruiterEmail(e.target.value)}
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="job-description">Job Description *</Label>
            <Textarea
              id="job-description"
              placeholder="Paste the full job description here..."
              value={jobDescription}
              onChange={(e) => setJobDescription(e.target.value)}
              required
              rows={6}
              className="resize-none"
            />
          </div>

          {/* AI Prompt source selector */}
          <div className="space-y-2">
            <Label htmlFor="ai-prompt-source">AI Prompt source</Label>
            <div className="flex gap-2 items-center">
              <select
                id="ai-prompt-source"
                value={promptSource.type === "manual" ? "manual" : promptSource.key}
                onChange={(e) => {
                  const val = e.target.value
                  if (val === "manual") {
                    setPromptSource({ type: "manual" })
                  } else {
                    setPromptSource({ type: "session", key: val })
                    const v = readSessionVar(val)
                    setAiPrompt(v)
                  }
                }}
                className="border rounded px-2 py-1 bg-black text-white"
              >
                <option value="manual">Manual (edit below)</option>
                {availableKeys.map((k) => (
                  <option key={k} value={k}>
                    {k}
                  </option>
                ))}
              </select>
            </div>
            <Label htmlFor="ai-prompt">AI Prompt (Editable)</Label>
            <Textarea
              id="ai-prompt"
              value={aiPrompt}
              onChange={(e) => setAiPrompt(e.target.value)}
              required
              rows={8}
              className="resize-none font-mono text-sm"
            />
          </div>

          {/* Resume selector */}
          <div className="space-y-2">
            <Label htmlFor="resume-select">Select Resume *</Label>
            {resumesLoading ? (
              <div className="p-2 text-sm text-gray-600">Loading resumes...</div>
            ) : userResumes.length === 0 ? (
              <div className="space-y-3">
                <p className="text-sm text-gray-600">No resumes uploaded yet.</p>
                <label className="block">
                  <input
                    type="file"
                    accept=".pdf,.txt,.doc,.docx"
                    onChange={handleQuickUploadResume}
                    disabled={isUploadingResume}
                    className="hidden"
                  />
                  <span className="inline-flex items-center gap-2 px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed transition">
                    {isUploadingResume ? 'Uploading...' : '+ Upload Resume'}
                  </span>
                </label>
              </div>
            ) : (
              <div className="space-y-2">
                <select
                  id="resume-select"
                  value={selectedResume}
                  onChange={(e) => setSelectedResume(e.target.value)}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  required
                >
                  <option value="">Select a resume...</option>
                  {userResumes.map((resume) => (
                    <option key={resume.id} value={resume.id}>
                      {resume.name}
                    </option>
                  ))}
                </select>
                <label className="block">
                  <input
                    type="file"
                    accept=".pdf,.txt,.doc,.docx"
                    onChange={handleQuickUploadResume}
                    disabled={isUploadingResume}
                    className="hidden"
                  />
                  <span className="inline-flex items-center gap-2 px-3 py-1 text-sm bg-gray-100 text-gray-700 rounded hover:bg-gray-200 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed transition">
                    {isUploadingResume ? 'Uploading...' : '+ Upload Another'}
                  </span>
                </label>
              </div>
            )}
          </div>

          {error && <div className="text-sm text-destructive bg-destructive/10 p-3 rounded-md">{error}</div>}

          <div className="flex justify-end gap-2 pt-4">
            <Button type="button" variant="outline" onClick={() => setOpen(false)} disabled={isLoading}>
              Cancel
            </Button>
            <Button type="submit" disabled={isLoading}>
              {isLoading ? "Creating..." : "Submit Job"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
}
