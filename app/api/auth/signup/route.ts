import { NextResponse, type NextRequest } from 'next/server'
import jwt from 'jsonwebtoken'

/**
 * Mock user database - Replace this with your actual user database/backend
 */
let MOCK_USERS = [
  {
    id: 'user_1',
    email: 'test@example.com',
    password: 'password123',
  },
]

const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key-change-in-production'

export async function POST(req: NextRequest) {
  try {
    const { email, password } = await req.json()

    if (!email || !password) {
      return NextResponse.json(
        { error: 'Email and password are required' },
        { status: 400 }
      )
    }

    if (password.length < 6) {
      return NextResponse.json(
        { error: 'Password must be at least 6 characters' },
        { status: 400 }
      )
    }

    // Check if user already exists
    const existingUser = MOCK_USERS.find(u => u.email === email)
    if (existingUser) {
      return NextResponse.json(
        { error: 'User already exists' },
        { status: 400 }
      )
    }

    // Create new user
    const newUser = {
      id: `user_${Date.now()}`,
      email,
      password, // In production, hash this with bcrypt
    }

    MOCK_USERS.push(newUser)

    // Generate JWT token
    const token = jwt.sign(
      { id: newUser.id, email: newUser.email },
      JWT_SECRET,
      { expiresIn: '7d' }
    )

    return NextResponse.json({
      success: true,
      token,
      id: newUser.id,
      email: newUser.email,
    })
  } catch (error) {
    console.error('Signup error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
