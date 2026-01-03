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
      // Log request details for debugging
      console.log('GemController.store: Request method:', request.method())
      console.log('GemController.store: Content-Type:', request.header('content-type'))
      console.log('GemController.store: Request body exists:', !!request.body())
      
      // Try multiple methods to get the request body
      let body: any = null
      let rawJson: any = undefined
      let count: string | undefined = undefined
      let tasteOfFood: string | undefined = undefined
      let accuracyOfOrder: string | undefined = undefined
      
      // Method 1: Try request.body() first (most reliable for JSON)
      try {
        body = request.body()
        console.log('GemController.store: request.body() result:', typeof body, 'keys:', body ? Object.keys(body) : [])
      } catch (e) {
        console.log('GemController.store: request.body() failed:', e)
      }
      
      // Method 2: Try request.all() as fallback
      if (!body || Object.keys(body || {}).length === 0) {
        try {
          body = request.all()
          console.log('GemController.store: request.all() result:', typeof body, 'keys:', body ? Object.keys(body) : [])
        } catch (e) {
          console.log('GemController.store: request.all() failed:', e)
        }
      }
      
      // Method 3: Try request.only() as last resort
      if (!body || Object.keys(body || {}).length === 0) {
        try {
          body = request.only(['count', 'tasteOfFood', 'accuracyOfOrder', 'rawJson'])
          console.log('GemController.store: request.only() result:', typeof body, 'keys:', body ? Object.keys(body) : [])
        } catch (e) {
          console.log('GemController.store: request.only() failed:', e)
        }
      }
      
      // Extract values from body
      if (body) {
        rawJson = body.rawJson
        count = body.count
        tasteOfFood = body.tasteOfFood
        accuracyOfOrder = body.accuracyOfOrder
      }
      
      // If we still don't have a body, this is a critical error
      if (!body || (Object.keys(body || {}).length === 0 && !rawJson && !count)) {
        console.error('GemController.store: CRITICAL - Request body is empty or could not be parsed!')
        console.error('GemController.store: Request headers:', {
          'content-type': request.header('content-type'),
          'content-length': request.header('content-length'),
        })
        return response.badRequest({ 
          error: 'Request body is empty or could not be parsed',
          message: 'The request body was not received or could not be parsed. Please check that Content-Type is application/json and the body is valid JSON.'
        })
      }
      
      console.log('GemController.store: Extracted values:', { 
        hasCount: !!count, 
        hasTasteOfFood: !!tasteOfFood, 
        hasAccuracyOfOrder: !!accuracyOfOrder, 
        hasRawJson: !!rawJson,
        rawJsonType: typeof rawJson,
        rawJsonIsArray: Array.isArray(rawJson),
        rawJsonLength: Array.isArray(rawJson) ? rawJson.length : 'N/A'
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
          console.log('GemController.store: Updating existing gem with ID:', latestGem.id)
          gem = await prisma.gem.update({
            where: { id: latestGem.id },
            data: {
              rawJson: rawJson,
              count: '',
              tasteOfFood: '',
              accuracyOfOrder: ''
            }
          })
          console.log('GemController.store: Update completed, new updatedAt:', gem.updatedAt)
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
          console.log('GemController.store: Create completed, new ID:', gem.id)
        }
        
        // Verify the data was actually saved by re-fetching it
        const verified = await prisma.gem.findUnique({
          where: { id: gem.id }
        })
        
        if (!verified) {
          console.error('GemController.store: CRITICAL - Data was not saved! Gem ID:', gem.id)
          return response.internalServerError({ 
            error: 'Data was not saved to database',
            message: 'The save operation appeared to succeed but data was not found in database'
          })
        }
        
        console.log('GemController.store: Verification successful - Gem ID:', verified.id, 'has rawJson:', !!verified.rawJson)
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
        console.log('GemController.store: Updating existing gem with individual fields, ID:', latestGem.id)
        gem = await prisma.gem.update({
          where: { id: latestGem.id },
          data: {
            count: String(count).trim(),
            tasteOfFood: String(tasteOfFood).trim(),
            accuracyOfOrder: String(accuracyOfOrder).trim()
          }
        })
        console.log('GemController.store: Update completed, new updatedAt:', gem.updatedAt)
      } else {
        console.log('GemController.store: Creating new gem with individual fields')
        gem = await prisma.gem.create({
          data: {
            count: String(count).trim(),
            tasteOfFood: String(tasteOfFood).trim(),
            accuracyOfOrder: String(accuracyOfOrder).trim()
          }
        })
        console.log('GemController.store: Create completed, new ID:', gem.id)
      }
      
      // Verify the data was actually saved
      const verified = await prisma.gem.findUnique({
        where: { id: gem.id }
      })
      
      if (!verified) {
        console.error('GemController.store: CRITICAL - Data was not saved! Gem ID:', gem.id)
        return response.internalServerError({ 
          error: 'Data was not saved to database',
          message: 'The save operation appeared to succeed but data was not found in database'
        })
      }
      
      console.log('GemController.store: Verification successful - Gem ID:', verified.id)
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

