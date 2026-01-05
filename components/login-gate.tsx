"use client"

import React, { useEffect, useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"

type Props = { children: React.ReactNode }

export default function LoginGate({ children }: Props) {
  const [loggedIn, setLoggedIn] = useState<boolean>(() => {
    try {
      return typeof window !== "undefined" && sessionStorage.getItem("loggedIn") === "1"
    } catch {
      return false
    }
  })
  const [mode, setMode] = useState<"login" | "register">("login")
  const [email, setEmail] = useState<string>("")
  const [name, setName] = useState<string>("")
  const [password, setPassword] = useState<string>("")
  const [confirm, setConfirm] = useState<string>("")
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    try {
      const storedEmail = sessionStorage.getItem("userEmail") ?? ""
      const storedName = sessionStorage.getItem("userName") ?? ""
      setEmail(storedEmail)
      setName(storedName)
    } catch {
      /* ignore */
    }
  }, [])

  function doLogin() {
    if (!email || !password) {
      setError("Email and password required")
      return
    }
    try {
      sessionStorage.setItem("loggedIn", "1")
      sessionStorage.setItem("userEmail", email)
      if (name) sessionStorage.setItem("userName", name)
    } catch {}
    setError(null)
    setLoggedIn(true)
  }

  function doRegister() {
    if (!email || !name || !password) {
      setError("Name, email and password required")
      return
    }
    if (password !== confirm) {
      setError("Passwords do not match")
      return
    }
    try {
      sessionStorage.setItem("loggedIn", "1")
      sessionStorage.setItem("userEmail", email)
      sessionStorage.setItem("userName", name)
      sessionStorage.setItem("userPassword", password)
    } catch {}
    setError(null)
    setLoggedIn(true)
  }

  function doLogout() {
    try {
      sessionStorage.clear()
    } catch {}
    setLoggedIn(false)
    setEmail("")
    setName("")
    setPassword("")
    setConfirm("")
  }

  if (!loggedIn || !sessionStorage.getItem("loggedIn")) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background p-4">
        <div className="w-full max-w-md rounded-md border bg-card p-6 shadow">
          <h3 className="mb-4 text-lg font-medium">{mode === "login" ? "Sign in" : "Register"}</h3>
          <div className="flex gap-2 mb-4">
            <Button variant={mode === "login" ? "default" : "ghost"} onClick={() => setMode("login")}>
              Login
            </Button>
            <Button variant={mode === "register" ? "default" : "ghost"} onClick={() => setMode("register")}>
              Register
            </Button>
          </div>

          <div className="space-y-3">
            {mode === "register" && (
              <div>
                <Label htmlFor="reg-name">Full name</Label>
                <Input id="reg-name" value={name} onChange={(e) => setName(e.target.value)} className="mt-1" />
              </div>
            )}

            <div>
              <Label htmlFor="auth-email">Email</Label>
              <Input id="auth-email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} className="mt-1" />
            </div>

            <div>
              <Label htmlFor="auth-password">Password</Label>
              <Input id="auth-password" type="password" value={password} onChange={(e) => setPassword(e.target.value)} className="mt-1" />
            </div>

            {mode === "register" && (
              <div>
                <Label htmlFor="auth-confirm">Confirm Password</Label>
                <Input id="auth-confirm" type="password" value={confirm} onChange={(e) => setConfirm(e.target.value)} className="mt-1" />
              </div>
            )}

            {error && <div className="text-sm text-destructive mt-2">{error}</div>}

            <div className="flex justify-end gap-2 pt-4">
              {mode === "login" ? (
                <Button onClick={doLogin} disabled={!email || !password}>
                  Login
                </Button>
              ) : (
                <Button
                  onClick={doRegister}
                  disabled={!email || !name || !password || password !== confirm}
                >
                  Register
                </Button>
              )}
            </div>
          </div>
        </div>
      </div>
    )
  }

  // logged in view: show small logout bar and render children
  const userDisplay = typeof window !== "undefined" ? (sessionStorage.getItem("userName") ?? sessionStorage.getItem("userEmail")) : "user"

  return (
    <div>
      <div className="flex items-center justify-end gap-3 bg-muted/10 p-2">
        <div className="text-sm text-muted-foreground">Signed in as {userDisplay}</div>
        <Button variant="ghost" onClick={doLogout}>Logout</Button>
      </div>
      {children}
    </div>
  )
}
