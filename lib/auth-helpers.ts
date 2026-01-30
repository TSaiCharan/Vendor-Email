interface DecodedToken {
  sub: string
  email: string
  [key: string]: any
}

/**
 * Decode a JWT token without verification
 * JWT format: header.payload.signature
 * We only need the payload which is base64url encoded
 */
function decodeJWT(token: string): DecodedToken | null {
  try {
    const parts = token.split('.')
    if (parts.length !== 3) {
      return null
    }

    // Decode the payload (second part)
    // JWT uses base64url encoding (- and _ instead of + and /)
    let payload = parts[1]
    // Add padding if needed
    const padding = 4 - (payload.length % 4)
    if (padding !== 4) {
      payload += '='.repeat(padding)
    }
    // Convert base64url to base64
    payload = payload.replace(/-/g, '+').replace(/_/g, '/')

    const decoded = JSON.parse(Buffer.from(payload, 'base64').toString())
    return decoded as DecodedToken
  } catch (e) {
    return null
  }
}

/**
 * Extract the current user from the request
 * Checks Authorization header for Bearer token
 */
export async function getUserFromRequest(request: Request): Promise<{ id: string; email: string } | null> {
  try {
    // Extract from Authorization Bearer token
    const authHeader = request.headers.get('authorization')
    if (authHeader?.startsWith('Bearer ')) {
      const token = authHeader.slice(7)
      console.log('[auth-helpers] Found Bearer token in Authorization header')
      
      const decoded = decodeJWT(token)
      if (decoded?.sub && decoded?.email) {
        console.log('[auth-helpers] User from token:', decoded.sub)
        return {
          id: decoded.sub,
          email: decoded.email,
        }
      } else {
        console.log('[auth-helpers] Token decoded but missing sub or email', decoded)
      }
    }

    console.log('[auth-helpers] No authentication found in request headers')
    return null
  } catch (error) {
    console.error('[auth-helpers] Error extracting user from request:', error)
    return null
  }
}
