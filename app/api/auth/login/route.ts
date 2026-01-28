// import { NextResponse, type NextRequest } from 'next/server'
// import jwt from 'jsonwebtoken'
// import { supabaseAdmin } from '@/lib/supabase'

// /**
//  * Mock user database - Replace this with your actual user database/backend
//  * For now, we'll use a simple in-memory store or file-based storage
//  */
// const MOCK_USERS = [
//   {
//     id: 'user_1',
//     email: 'test@example.com',
//     password: 'password123', // In production, this should be hashed
//   },
// ]

// const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key-change-in-production'

// export async function POST(req: NextRequest) {
//   try {
//     const { email, password } = await req.json()

//     if (!email || !password) {
//       return NextResponse.json(
//         { error: 'Email and password are required' },
//         { status: 400 }
//       )
//     }

//     // Mock authentication - Replace with your actual user validation
//     // Option 1: Use Supabase (if you still have it configured)
//     // const { data, error } = await supabase.auth.signInWithPassword({
//     //   email,
//     //   password,
//     // })

//     // Option 2: Use your own database
//     // For now, we'll do basic validation
//     const user = MOCK_USERS.find(u => u.email === email && u.password === password)

//     if (!user) {
//       return NextResponse.json(
//         { error: 'Invalid email or password' },
//         { status: 401 }
//       )
//     }

//     // Generate JWT token
//     const token = jwt.sign(
//       { id: user.id, email: user.email },
//       JWT_SECRET,
//       { expiresIn: '7d' }
//     )

//     return NextResponse.json({
//       success: true,
//       token,
//       id: user.id,
//       email: user.email,
//     })
//   } catch (error) {
//     console.error('Login error:', error)
//     return NextResponse.json(
//       { error: 'Internal server error' },
//       { status: 500 }
//     )
//   }
// }


import { NextResponse } from 'next/server'
import { createServerClient } from '@supabase/auth-helpers-nextjs'

export const runtime = 'nodejs' // ensures Node runtime for secrets

export async function POST(req: Request) {
  try {
    const { email, password } = await req.json()

    if (!email || !password) {
      return NextResponse.json(
        { error: 'Email and password are required' },
        { status: 400 }
      )
    }

    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    )

    // Sign in user
    const { data, error } = await supabase.auth.admin.signInWithPassword({
      email,
      password,
    })

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 401 })
    }

    return NextResponse.json({
      success: true,
      user: data.user,
      session: data.session,
    })
  } catch (err) {
    console.error('Login error:', err)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
