import { NextRequest, NextResponse } from 'next/server'
import { getUserFromRequest } from '@/lib/auth-helpers'
import { uploadResume } from '@/lib/resume-storage'

export async function POST(req: NextRequest) {
  try {
    const user = await getUserFromRequest(req)
    
    if (!user) {
      return NextResponse.json(
        { error: 'Unauthorized - must be logged in' },
        { status: 401 }
      )
    }

    // Parse FormData
    const formData = await req.formData()
    const file = formData.get('file') as File

    if (!file) {
      return NextResponse.json(
        { error: 'No file provided' },
        { status: 400 }
      )
    }

    // Upload resume using user email
    const publicUrl = await uploadResume(user.email, file)

    if (!publicUrl) {
      return NextResponse.json(
        { error: 'Failed to upload resume' },
        { status: 500 }
      )
    }

    return NextResponse.json({
      success: true,
      url: publicUrl,
      filename: file.name,
      userEmail: user.email,
    })
  } catch (error) {
    console.error('[resume-upload] Error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
