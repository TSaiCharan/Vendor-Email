import { createMiddlewareClient } from '@supabase/auth-helpers-nextjs'
import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

export async function middleware(request: NextRequest) {
  const res = NextResponse.next()
  const supabase = createMiddlewareClient({ req: request, res })

  const {
    data: { session },
  } = await supabase.auth.getSession()

  // Redirect to login if accessing protected routes
  if (
    !session &&
    (request.nextUrl.pathname.startsWith('/profile') ||
      request.nextUrl.pathname.startsWith('/dashboard'))
  ) {
    return NextResponse.redirect(new URL('/auth/login', request.url))
  }

  // Redirect to profile if already logged in and accessing auth pages
  if (
    session &&
    (request.nextUrl.pathname.startsWith('/auth/login') ||
      request.nextUrl.pathname.startsWith('/auth/signup'))
  ) {
    return NextResponse.redirect(new URL('/profile', request.url))
  }

  return res
}

export const config = {
  matcher: ['/profile/:path*', '/dashboard/:path*', '/auth/:path*'],
}
