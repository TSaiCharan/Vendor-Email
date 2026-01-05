"use client"

import React, { useState } from "react"
import { useRouter, usePathname, useSearchParams } from "next/navigation"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"

/*
  Simple date picker that updates the URL ?date=YYYY-MM-DD.
  initialDate should be server-provided (YYYY-MM-DD). The page (server) will re-render and
  JobsTable will receive the updated selectedDate via searchParams.
*/
export default function DateSelector({ initialDate }: { initialDate?: string }) {
  const router = useRouter()
  const pathname = usePathname() || "/"
  const searchParams = useSearchParams()
  const paramDate = searchParams?.get("date") ?? initialDate
  const [value, setValue] = useState<string>(paramDate ?? new Date().toISOString().split("T")[0])

  function onChange(e: React.ChangeEvent<HTMLInputElement>) {
    const next = e.target.value
    setValue(next)
    // Update the URL with the chosen date; keep other query params if any
    const params = new URLSearchParams(Array.from(searchParams ?? new URLSearchParams()))
    if (next) params.set("date", next)
    else params.delete("date")
    const url = `${pathname}?${params.toString()}`
    // navigation will trigger server render for the new date
    router.push(url)
  }

  return (
    <div className="flex items-center gap-2">
      <Label className="text-xs">Date</Label>
      <Input type="date" value={value} onChange={onChange} className="w-auto" />
    </div>
  )
}
