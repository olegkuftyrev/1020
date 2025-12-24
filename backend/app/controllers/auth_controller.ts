import type { HttpContext } from '@adonisjs/core/http'
import env from '#start/env'

export default class AuthController {
  async login({ request, response }: HttpContext) {
    const { password } = request.only(['password'])
    
    if (!password) {
      return response.badRequest({ error: 'Password is required' })
    }

    // Compare provided password with stored password (simple direct comparison)
    const storedPassword = env.AUTH_PASSWORD
    
    if (password === storedPassword) {
      // For simplicity, we'll just return success
      // In production, you might want to use JWT or sessions
      return response.ok({ 
        authenticated: true,
        message: 'Authentication successful' 
      })
    }

    return response.unauthorized({ error: 'Invalid password' })
  }

  async verify({ response }: HttpContext) {
    // Endpoint to verify if user is authenticated
    // You can enhance this with session/JWT checking
    return response.ok({ authenticated: true })
  }
}
