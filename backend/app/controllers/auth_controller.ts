import type { HttpContext } from '@adonisjs/core/http'
import env from '#start/env'
import { createHash, randomBytes } from 'node:crypto'

export default class AuthController {
  // In-memory session store (in production, use Redis or database)
  private static sessions = new Set<string>()

  /**
   * Verify if a session token is valid
   * Used by auth middleware to check authentication
   */
  static isValidSession(sessionToken: string): boolean {
    if (!sessionToken) {
      return false
    }
    const sessionHash = createHash('sha256').update(sessionToken).digest('hex')
    return AuthController.sessions.has(sessionHash)
  }

  async login({ request, response }: HttpContext) {
    const { password } = request.only(['password'])
    
    if (!password) {
      return response.badRequest({ error: 'Password is required' })
    }

    // Compare provided password with stored password (simple direct comparison)
    const storedPassword = env.AUTH_PASSWORD
    
    if (password === storedPassword) {
      // Generate a secure session token
      const sessionToken = randomBytes(32).toString('hex')
      const sessionHash = createHash('sha256').update(sessionToken).digest('hex')
      
      // Store session
      AuthController.sessions.add(sessionHash)
      
      // Set secure HTTP-only cookie
      response.cookie('auth_session', sessionToken, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'lax',
        maxAge: 60 * 60 * 24 * 7, // 7 days
        path: '/',
      })
      
      return response.ok({ 
        authenticated: true,
        message: 'Authentication successful' 
      })
    }

    return response.unauthorized({ error: 'Invalid password' })
  }

  async verify({ request, response }: HttpContext) {
    // Check for session cookie
    const sessionToken = request.cookie('auth_session')
    
    if (!sessionToken) {
      return response.ok({ authenticated: false })
    }
    
    // Verify session token
    const sessionHash = createHash('sha256').update(sessionToken).digest('hex')
    
    if (AuthController.sessions.has(sessionHash)) {
      return response.ok({ authenticated: true })
    }
    
    // Invalid session
    response.clearCookie('auth_session')
    return response.ok({ authenticated: false })
  }

  async logout({ request, response }: HttpContext) {
    const sessionToken = request.cookie('auth_session')
    
    if (sessionToken) {
      const sessionHash = createHash('sha256').update(sessionToken).digest('hex')
      AuthController.sessions.delete(sessionHash)
    }
    
    response.clearCookie('auth_session')
    return response.ok({ authenticated: false, message: 'Logged out successfully' })
  }
}
