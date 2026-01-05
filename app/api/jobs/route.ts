import { NextResponse } from "next/server"
import fs from "fs"
import path from "path"

export async function GET(req: Request) {
  try {
    const url = new URL(req.url)
    const dateParam = url.searchParams.get("date")

    // determine date to read: use provided or default to today
    const dateToRead = dateParam || new Date().toISOString().split("T")[0]

    // build filepath: <project-root>/data/YYYY-MM-DD.json
    const dataDir = path.join(process.cwd(), "data")
    const filePath = path.join(dataDir, `${dateToRead}.json`)

    // If file doesn't exist, return empty jobs array (success)
    if (!fs.existsSync(filePath)) {
      return NextResponse.json({ success: true, jobs: [] })
    }

    const content = await fs.promises.readFile(filePath, "utf8")
    // Content may be a JSON array (records) — parse safely
    let jobs = []
    try {
      jobs = JSON.parse(content)
    } catch (e) {
      // if parsing fails, return error payload
      return NextResponse.json({ success: false, error: "Failed to parse data file" }, { status: 500 })
    }

    // Ensure jobs is an array
    if (!Array.isArray(jobs)) jobs = []

    return NextResponse.json({ success: true, jobs })
  } catch (err) {
    return NextResponse.json({ success: false, error: String(err) }, { status: 500 })
  }
}
