"use client"

import React, { useEffect, useState } from "react"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Plus, Trash2, ChevronDown } from "lucide-react"
import { useRouter } from "next/navigation"

type CustomVar = { id: string; name: string; value: string; expanded?: boolean }

const DEFAULT_PROMPT_KEY = "GENERIC_AI_PROMPT"
const DEFAULT_RESUME_KEY = "DEFAULT_RESUME_PATH"
const LOCAL_VARS_KEY = "LOCAL_VARS"
const PROMPT_KEY_NAME_KEY = "VAR_NAME_PROMPT"
const RESUME_KEY_NAME_KEY = "VAR_NAME_RESUME"

function uid() {
  return Math.random().toString(36).slice(2, 9)
}

export default function VariablesPanel() {
  const [open, setOpen] = useState(false)
  const [isSaving, setIsSaving] = useState(false)
  const [promptKeyName, setPromptKeyName] = useState<string>(DEFAULT_PROMPT_KEY)
  const [resumeKeyName, setResumeKeyName] = useState<string>(DEFAULT_RESUME_KEY)
  const [prompt, setPrompt] = useState<string>("")
  const [resumePath, setResumePath] = useState<string>("")
  const [customVars, setCustomVars] = useState<CustomVar[]>([])
  const [error, setError] = useState<string | null>(null)
  const [accountOpen, setAccountOpen] = useState(false)
  const router = useRouter()

  // load session values when dialog opens
  useEffect(() => {
    if (!open) return
    try {
      const storedPromptKeyName = sessionStorage.getItem(PROMPT_KEY_NAME_KEY) ?? DEFAULT_PROMPT_KEY
      const storedResumeKeyName = sessionStorage.getItem(RESUME_KEY_NAME_KEY) ?? DEFAULT_RESUME_KEY
      setPromptKeyName(storedPromptKeyName)
      setResumeKeyName(storedResumeKeyName)

      const p = sessionStorage.getItem(storedPromptKeyName) ?? sessionStorage.getItem(DEFAULT_PROMPT_KEY) ?? ""
      const r = sessionStorage.getItem(storedResumeKeyName) ?? sessionStorage.getItem(DEFAULT_RESUME_KEY) ?? ""

      const localJson = sessionStorage.getItem(LOCAL_VARS_KEY) ?? "{}"
      let parsed: Record<string, string> = {}
      try {
        parsed = JSON.parse(localJson)
      } catch {
        parsed = {}
      }
      const list: CustomVar[] = Object.entries(parsed).map(([k, v]) => ({ id: uid(), name: k, value: String(v ?? ""), expanded: false }))
      setPrompt(p)
      setResumePath(r)
      setCustomVars(list)
      setError(null)
    } catch (e) {
      setError("Failed to load session variables")
      setPrompt("")
      setResumePath("")
      setCustomVars([])
    }
  }, [open])

  function addCustomVar() {
    setCustomVars((s) => [...s, { id: uid(), name: "", value: "", expanded: true }])
  }

  function updateCustomVar(id: string, patch: Partial<CustomVar>) {
    setCustomVars((s) => s.map((c) => (c.id === id ? { ...c, ...patch } : c)))
  }

  function removeCustomVar(id: string) {
    setCustomVars((s) => s.filter((c) => c.id !== id))
  }

  async function handleSubmit(e?: React.FormEvent) {
    e?.preventDefault()
    setIsSaving(true)
    setError(null)
    try {
      const chosenPromptKey = (promptKeyName && promptKeyName.trim()) || DEFAULT_PROMPT_KEY
      const chosenResumeKey = (resumeKeyName && resumeKeyName.trim()) || DEFAULT_RESUME_KEY
      // persist chosen key names
      sessionStorage.setItem(PROMPT_KEY_NAME_KEY, chosenPromptKey)
      sessionStorage.setItem(RESUME_KEY_NAME_KEY, chosenResumeKey)

      // save values under both default and chosen keys
      sessionStorage.setItem(DEFAULT_PROMPT_KEY, prompt)
      sessionStorage.setItem(chosenPromptKey, prompt)
      sessionStorage.setItem(DEFAULT_RESUME_KEY, resumePath)
      sessionStorage.setItem(chosenResumeKey, resumePath)

      // collect and persist custom vars
      const custom: Record<string, string> = {}
      for (const c of customVars) {
        if (c.name && c.name.trim()) custom[c.name.trim()] = c.value ?? ""
      }
      sessionStorage.setItem(LOCAL_VARS_KEY, JSON.stringify(custom))

      // signal update
      try {
        sessionStorage.setItem("__vars_updated_at", Date.now().toString())
      } catch {}

      // Reload component state from session so saved vars render immediately
      const storedPromptKeyName = sessionStorage.getItem(PROMPT_KEY_NAME_KEY) ?? DEFAULT_PROMPT_KEY
      const storedResumeKeyName = sessionStorage.getItem(RESUME_KEY_NAME_KEY) ?? DEFAULT_RESUME_KEY
      setPromptKeyName(storedPromptKeyName)
      setResumeKeyName(storedResumeKeyName)

      const p = sessionStorage.getItem(storedPromptKeyName) ?? sessionStorage.getItem(DEFAULT_PROMPT_KEY) ?? ""
      const r = sessionStorage.getItem(storedResumeKeyName) ?? sessionStorage.getItem(DEFAULT_RESUME_KEY) ?? ""
      setPrompt(p)
      setResumePath(r)

      const savedLocalJson = sessionStorage.getItem(LOCAL_VARS_KEY) ?? "{}"
      let savedParsed: Record<string, string> = {}
      try {
        savedParsed = JSON.parse(savedLocalJson)
      } catch {
        savedParsed = {}
      }
      const list: CustomVar[] = Object.entries(savedParsed).map(([k, v]) => ({ id: uid(), name: k, value: String(v ?? ""), expanded: false }))
      setCustomVars(list)

      // close dialog after successful save
      setOpen(false)
    } catch (err) {
      setError("Failed to save variables")
    } finally {
      setIsSaving(false)
    }
  }

  function handleCancel() {
    setOpen(false)
  }

  function logout() {
    try {
      sessionStorage.clear()
    } catch {}
    // force a reload so LoginGate re-checks session and shows login/register
    if (typeof window !== "undefined") {
      window.location.reload()
    }
  }

  const user = typeof window !== "undefined" ? sessionStorage.getItem("userName") ?? sessionStorage.getItem("userEmail") : null

  // Build unified list: two builtins first, then custom vars
  const unifiedVars = [
    { id: "builtin-prompt", keyName: promptKeyName, value: prompt, type: "builtin-prompt" } as const,
    { id: "builtin-resume", keyName: resumeKeyName, value: resumePath, type: "builtin-resume" } as const,
    ...customVars.map((c) => ({ id: c.id, keyName: c.name, value: c.value, type: "custom", expanded: c.expanded })),
  ]

  return (
    <div className="flex items-center gap-2">
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogTrigger asChild>
          <Button className="gap-2">
            <Plus className="h-4 w-4" />
            Variables
          </Button>
        </DialogTrigger>

        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Session Variables</DialogTitle>
          </DialogHeader>

          <form onSubmit={(e) => handleSubmit(e)} className="space-y-4 p-4">
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <h4 className="text-sm font-medium">Editable variables</h4>
                <p className="text-xs text-muted-foreground">Rename keys or edit values; new variables appear here</p>
              </div>

              <div className="space-y-3">
                {unifiedVars.map((v) => {
                  const isBuiltinPrompt = v.type === "builtin-prompt"
                  const isBuiltinResume = v.type === "builtin-resume"
                  const isCustom = v.type === "custom"
                  const expanded = isCustom ? customVars.find((c) => c.id === v.id)?.expanded ?? false : false

                  return (
                    <div key={v.id} className="border rounded p-3">
                      <div className="flex gap-3 items-start">
                        <div className="flex-1">
                          <Label className="text-xs">{isBuiltInLabel(isBuiltinPrompt, isBuiltinResume)}</Label>
                          {isBuiltinPrompt || isBuiltinResume ? (
                            <Input
                              value={isBuiltinPrompt ? promptKeyName : resumeKeyName}
                              onChange={(ev) =>
                                isBuiltinPrompt ? setPromptKeyName(ev.target.value) : setResumeKeyName(ev.target.value)
                              }
                              className="mt-1"
                            />
                          ) : (
                            <Input
                              value={v.keyName ?? ""}
                              onChange={(ev) => updateCustomVar(v.id, { name: ev.target.value })}
                              className="mt-1"
                            />
                          )}
                        </div>

                        <div className="flex flex-col items-end gap-2">
                          <button
                            type="button"
                            className="text-xs text-muted-foreground px-2 py-1 rounded hover:bg-muted/10"
                            onClick={() => {
                              if (isCustom) updateCustomVar(v.id, { expanded: !expanded })
                            }}
                          >
                            {isCustom && (expanded ? "Collapse" : "Expand")}
                          </button>

                          {isCustom && (
                            <button
                              type="button"
                              className="text-xs text-destructive px-2 py-1 rounded hover:bg-destructive/10"
                              onClick={() => removeCustomVar(v.id)}
                            >
                              <Trash2 className="h-4 w-4" />
                            </button>
                          )}
                        </div>
                      </div>

                      <div className="mt-2">
                        <Label className="text-xs">Value</Label>
                        {isBuiltinPrompt ? (
                          <Textarea
                            value={prompt}
                            onChange={(ev) => setPrompt(ev.target.value)}
                            rows={6}
                            className="mt-1 font-mono text-sm"
                            style={{ resize: "vertical", maxWidth: "100%" }}
                          />
                        ) : isBuiltinResume ? (
                          <Input value={resumePath} onChange={(ev) => setResumePath(ev.target.value)} className="mt-1" />
                        ) : (
                          <Textarea
                            value={v.value ?? ""}
                            onChange={(ev) => updateCustomVar(v.id, { value: ev.target.value })}
                            rows={expanded ? 6 : 2}
                            className="mt-1 font-mono text-sm"
                            style={{ resize: "vertical", maxWidth: "100%" }}
                          />
                        )}
                      </div>
                    </div>
                  )
                })}
              </div>
            </div>

            <div className="flex items-center justify-between">
              <Button variant="ghost" onClick={addCustomVar} type="button">
                <Plus className="h-4 w-4" /> Add variable
              </Button>
              <div className="flex-1" />
              <Button type="button" variant="outline" onClick={handleCancel} disabled={isSaving}>
                Cancel
              </Button>
              <div className="w-4" /> {/* extra space between Cancel and Save */}
              <Button type="submit" disabled={isSaving}>
                {isSaving ? "Saving..." : "Save Variables"}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>

      {/* account area */}
      <div className="relative">
        <button
          type="button"
          onClick={() => setAccountOpen((v) => !v)}
          className="flex items-center gap-2 px-3 py-1 border rounded hover:bg-muted/5"
        >
          <span className="text-sm">{user ?? "Account"}</span>
          <ChevronDown className="h-4 w-4" />
        </button>

        {accountOpen && (
          <div className="absolute right-0 mt-2 w-44 rounded-md border bg-card p-2 shadow z-50">
            <button
              className="w-full text-left px-2 py-1 hover:bg-muted/20 rounded text-sm"
              onClick={() => {
                setAccountOpen(false)
                setOpen(true)
              }}
            >
              Variables
            </button>
            <button
              className="w-full text-left px-2 py-1 hover:bg-muted/20 rounded text-sm"
              onClick={logout}
            >
              Logout
            </button>
          </div>
        )}
      </div>
    </div>
  )
}

// helper for labels
function isBuiltInLabel(isPrompt: boolean, isResume: boolean) {
  if (isPrompt) return "GENERIC_AI_PROMPT (key name)"
  if (isResume) return "DEFAULT_RESUME_PATH (key name)"
  return "Variable name"
}
