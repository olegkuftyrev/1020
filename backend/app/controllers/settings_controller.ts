import type { HttpContext } from '@adonisjs/core/http'
import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

export default class SettingsController {
  /**
   * Get a setting value by key
   */
  async get({ params, response }: HttpContext) {
    try {
      const { key } = params
      
      if (!key || typeof key !== 'string') {
        return response.badRequest({ error: 'Invalid setting key' })
      }

      const setting = await prisma.settings.findUnique({
        where: { key: String(key).trim() }
      })
      
      if (!setting) {
        // Return default value for periodMultiplier if not set
        if (key === 'periodMultiplier') {
          return response.ok({ key, value: '12' })
        }
        return response.notFound({ error: 'Setting not found' })
      }
      
      return response.ok(setting)
    } catch (error: any) {
      return response.internalServerError({ 
        error: 'Failed to fetch setting',
        message: error.message 
      })
    }
  }

  /**
   * Set or update a setting value
   */
  async set({ params, request, response }: HttpContext) {
    try {
      const { key } = params
      const { value } = request.only(['value'])
      
      if (!key || typeof key !== 'string') {
        return response.badRequest({ error: 'Invalid setting key' })
      }

      if (value === null || value === undefined || value === '') {
        return response.badRequest({ error: 'Value is required' })
      }

      // Validate periodMultiplier is a valid number
      if (key === 'periodMultiplier') {
        const numValue = parseFloat(String(value))
        if (isNaN(numValue) || numValue < 0) {
          return response.badRequest({ error: 'Period multiplier must be a valid positive number' })
        }
      }
      
      const setting = await prisma.settings.upsert({
        where: { key: String(key).trim() },
        update: { value: String(value).trim() },
        create: { 
          key: String(key).trim(),
          value: String(value).trim()
        }
      })
      
      return response.ok(setting)
    } catch (error: any) {
      if (error.code === 'P2002') {
        return response.badRequest({ error: 'Setting key already exists' })
      }
      return response.internalServerError({ 
        error: 'Failed to update setting',
        message: error.message 
      })
    }
  }
}

