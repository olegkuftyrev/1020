import type { HttpContext } from '@adonisjs/core/http'
import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

export default class GemController {
  /**
   * Get the latest gem data
   */
  async index({ response }: HttpContext) {
    try {
      const gem = await prisma.gem.findFirst({
        orderBy: { updatedAt: 'desc' }
      })
      
      if (!gem) {
        return response.ok(null)
      }
      
      return response.ok(gem)
    } catch (error: any) {
      return response.internalServerError({ 
        error: 'Failed to fetch gem data',
        message: error.message 
      })
    }
  }

  /**
   * Create or update gem data
   */
  async store({ request, response }: HttpContext) {
    try {
      const body = request.all()
      console.log('GemController.store: Received request body type:', typeof body, 'keys:', Object.keys(body || {}))
      
      // Try to get rawJson directly from body first
      let rawJson = body.rawJson
      let count = body.count
      let tasteOfFood = body.tasteOfFood
      let accuracyOfOrder = body.accuracyOfOrder
      
      // If not found, try request.only
      if (!rawJson && !count) {
        const extracted = request.only(['count', 'tasteOfFood', 'accuracyOfOrder', 'rawJson'])
        rawJson = extracted.rawJson
        count = extracted.count
        tasteOfFood = extracted.tasteOfFood
        accuracyOfOrder = extracted.accuracyOfOrder
      }
      
      console.log('GemController.store: Extracted values:', { 
        hasCount: !!count, 
        hasTasteOfFood: !!tasteOfFood, 
        hasAccuracyOfOrder: !!accuracyOfOrder, 
        hasRawJson: !!rawJson,
        rawJsonType: typeof rawJson,
        rawJsonIsArray: Array.isArray(rawJson)
      })
      
      // If rawJson is provided, save it directly to rawJson field
      // Check if rawJson exists and is not null/undefined
      if (rawJson !== undefined && rawJson !== null) {
        const rawJsonSize = Array.isArray(rawJson) ? rawJson.length : (typeof rawJson === 'object' ? Object.keys(rawJson).length : 'unknown')
        console.log('GemController.store: Saving rawJson, size:', rawJsonSize, 'type:', typeof rawJson)
        
        // Validate that rawJson is a valid JSON-serializable value
        try {
          JSON.stringify(rawJson)
        } catch (e) {
          console.error('GemController.store: rawJson is not JSON-serializable:', e)
          return response.badRequest({ 
            error: 'rawJson must be a valid JSON-serializable value',
            message: e instanceof Error ? e.message : 'Invalid JSON'
          })
        }
        
        const latestGem = await prisma.gem.findFirst({
          orderBy: { updatedAt: 'desc' }
        })
        
        console.log('GemController.store: Latest gem:', latestGem ? latestGem.id : 'none')

        let gem
        if (latestGem) {
          console.log('GemController.store: Updating existing gem')
          gem = await prisma.gem.update({
            where: { id: latestGem.id },
            data: {
              rawJson: rawJson,
              count: '',
              tasteOfFood: '',
              accuracyOfOrder: ''
            }
          })
        } else {
          console.log('GemController.store: Creating new gem')
          gem = await prisma.gem.create({
            data: {
              rawJson: rawJson,
              count: '',
              tasteOfFood: '',
              accuracyOfOrder: ''
            }
          })
        }
        
        console.log('GemController.store: Gem saved successfully:', gem.id)
        return response.ok(gem)
      }
      
      // Otherwise, use the old method with individual fields
      if (!count || !tasteOfFood || !accuracyOfOrder) {
        return response.badRequest({ error: 'count, tasteOfFood, and accuracyOfOrder are required, or provide rawJson' })
      }

      // Get the latest gem or create a new one
      const latestGem = await prisma.gem.findFirst({
        orderBy: { updatedAt: 'desc' }
      })

      let gem
      if (latestGem) {
        // Update existing gem
        gem = await prisma.gem.update({
          where: { id: latestGem.id },
          data: {
            count: String(count).trim(),
            tasteOfFood: String(tasteOfFood).trim(),
            accuracyOfOrder: String(accuracyOfOrder).trim()
          }
        })
      } else {
        // Create new gem
        gem = await prisma.gem.create({
          data: {
            count: String(count).trim(),
            tasteOfFood: String(tasteOfFood).trim(),
            accuracyOfOrder: String(accuracyOfOrder).trim()
          }
        })
      }
      
      return response.ok(gem)
    } catch (error: any) {
      console.error('GemController.store: Error details:', {
        message: error.message,
        stack: error.stack,
        name: error.name
      })
      return response.internalServerError({ 
        error: 'Failed to save gem data',
        message: error.message,
        stack: process.env.NODE_ENV === 'development' ? error.stack : undefined
      })
    }
  }
}

