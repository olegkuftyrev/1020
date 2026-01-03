import type { HttpContext } from '@adonisjs/core/http'
import type { NextFn } from '@adonisjs/core/types/http'
import AuthController from '#controllers/auth_controller'

/**
 * Authentication middleware to protect API routes
 * Checks for valid auth_session cookie before allowing access
 * Skips authentication for auth routes (/api/auth/*)
 */
export default class AuthMiddleware {
  async handle(ctx: HttpContext, next: NextFn) {
    // Get the request path
    const path = ctx.request.url()
    
    // Skip authentication for auth routes
    if (path.startsWith('/api/auth/')) {
      await next()
      return
    }
    
    // Check for session cookie
    const sessionToken = ctx.request.cookie('auth_session')
    
    if (!sessionToken) {
      return ctx.response.unauthorized({ error: 'Authentication required' })
    }
    
    // Verify session token using AuthController's validation method
    if (!AuthController.isValidSession(sessionToken)) {
      // Invalid session
      ctx.response.clearCookie('auth_session')
      return ctx.response.unauthorized({ error: 'Invalid or expired session' })
    }
    
    // Session is valid, proceed to next middleware/route
    await next()
  }
}
