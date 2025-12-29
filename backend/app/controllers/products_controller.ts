import type { HttpContext } from '@adonisjs/core/http'
import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

export default class ProductsController {
  /**
   * Get all products
   */
  async index({ response }: HttpContext) {
    try {
      const products = await prisma.product.findMany({
        orderBy: [
          { group: 'asc' },
          { productNumber: 'asc' }
        ]
      })
      
      return response.ok(products)
    } catch (error: any) {
      return response.internalServerError({ 
        error: 'Failed to fetch products',
        message: error.message 
      })
    }
  }

  /**
   * Get a single product by productNumber
   */
  async show({ params, response }: HttpContext) {
    try {
      if (!params.productNumber || typeof params.productNumber !== 'string') {
        return response.badRequest({ error: 'Invalid product number' })
      }

      const product = await prisma.product.findUnique({
        where: { productNumber: String(params.productNumber).trim() }
      })
      
      if (!product) {
        return response.notFound({ error: 'Product not found' })
      }
      
      return response.ok(product)
    } catch (error: any) {
      return response.internalServerError({ 
        error: 'Failed to fetch product',
        message: error.message 
      })
    }
  }

  /**
   * Create or update multiple products (upsert)
   * Used when parsing PDF - replaces all existing products
   */
  async sync({ request, response }: HttpContext) {
    try {
      const { products, pdfMetadata } = request.only(['products', 'pdfMetadata'])
      
      console.log('ProductsController.sync called with', products?.length || 0, 'products')
      
      if (!Array.isArray(products)) {
        console.error('Products is not an array:', typeof products)
        return response.badRequest({ error: 'Products must be an array' })
      }

      if (products.length === 0) {
        console.warn('No products to sync')
        return response.badRequest({ error: 'No products provided' })
      }

      // Validate products data
      const validationErrors: string[] = []
      products.forEach((p: any, index: number) => {
        if (!p.productNumber || typeof p.productNumber !== 'string') {
          validationErrors.push(`Product at index ${index}: productNumber is required and must be a string`)
        }
        if (!p.productName || typeof p.productName !== 'string') {
          validationErrors.push(`Product at index ${index}: productName is required and must be a string`)
        }
        if (!p.unit || typeof p.unit !== 'string') {
          validationErrors.push(`Product at index ${index}: unit is required and must be a string`)
        }
        if (!p.w38 || typeof p.w38 !== 'string') {
          validationErrors.push(`Product at index ${index}: w38 is required and must be a string`)
        }
        if (!p.w39 || typeof p.w39 !== 'string') {
          validationErrors.push(`Product at index ${index}: w39 is required and must be a string`)
        }
        if (!p.w40 || typeof p.w40 !== 'string') {
          validationErrors.push(`Product at index ${index}: w40 is required and must be a string`)
        }
        if (!p.w41 || typeof p.w41 !== 'string') {
          validationErrors.push(`Product at index ${index}: w41 is required and must be a string`)
        }
      })

      if (validationErrors.length > 0) {
        console.error('Validation errors:', validationErrors)
        return response.badRequest({ 
          error: 'Validation failed',
          details: validationErrors 
        })
      }

      // Start transaction to replace all products
      const result = await prisma.$transaction(async (tx) => {
        console.log('Starting transaction: deleting existing products...')
        // Delete all existing products
        await tx.product.deleteMany({})
        console.log('Existing products deleted')
        
        console.log('Creating new products...')
        // Create new products with validated data
        const createdProducts = await tx.product.createMany({
          data: products.map((p: any) => ({
            productNumber: String(p.productNumber).trim(),
            productName: String(p.productName).trim(),
            unit: String(p.unit).trim(),
            w38: String(p.w38).trim(),
            w39: String(p.w39).trim(),
            w40: String(p.w40).trim(),
            w41: String(p.w41).trim(),
            conversion: p.conversion ? String(p.conversion).trim() : null,
            group: p.group ? String(p.group).trim() : null,
          })),
          skipDuplicates: true
        })
        console.log('Products created:', createdProducts.count)

        // Save PDF metadata if provided
        if (pdfMetadata) {
          console.log('Saving PDF metadata...')
          // Delete old metadata and create new
          await tx.pdfMetadata.deleteMany({})
          await tx.pdfMetadata.create({
            data: {
              pageCount: pdfMetadata.pageCount || 0,
              title: pdfMetadata.title || null,
              fileName: pdfMetadata.fileName || null,
              metadata: pdfMetadata.metadata || null,
            }
          })
          console.log('PDF metadata saved')
        }

        return createdProducts
      })

      console.log('Transaction completed successfully')
      return response.ok({ 
        message: 'Products synced successfully',
        count: result.count 
      })
    } catch (error: any) {
      console.error('Error in ProductsController.sync:', error)
      console.error('Error details:', {
        message: error.message,
        code: error.code,
        meta: error.meta,
        stack: error.stack,
      })
      return response.internalServerError({ 
        error: 'Failed to sync products',
        message: error.message,
        code: error.code,
      })
    }
  }

  /**
   * Update conversion value for a product
   */
  async updateConversion({ params, request, response }: HttpContext) {
    try {
      const { conversion } = request.only(['conversion'])
      
      // Validate productNumber
      if (!params.productNumber || typeof params.productNumber !== 'string') {
        return response.badRequest({ error: 'Invalid product number' })
      }

      // Validate conversion if provided (should be a valid number string or empty)
      if (conversion !== null && conversion !== undefined && conversion !== '') {
        const conversionNum = parseFloat(String(conversion))
        if (isNaN(conversionNum) || conversionNum < 0) {
          return response.badRequest({ error: 'Conversion must be a valid positive number' })
        }
      }
      
      const product = await prisma.product.update({
        where: { productNumber: String(params.productNumber).trim() },
        data: { conversion: conversion ? String(conversion).trim() : null }
      })
      
      return response.ok(product)
    } catch (error: any) {
      if (error.code === 'P2025') {
        return response.notFound({ error: 'Product not found' })
      }
      if (error.code === 'P2002') {
        return response.badRequest({ error: 'Product number already exists' })
      }
      return response.internalServerError({ 
        error: 'Failed to update conversion',
        message: error.message 
      })
    }
  }

  /**
   * Get PDF metadata
   */
  async getPdfMetadata({ response }: HttpContext) {
    try {
      const metadata = await prisma.pdfMetadata.findFirst({
        orderBy: { createdAt: 'desc' }
      })
      
      return response.ok(metadata || null)
    } catch (error: any) {
      return response.internalServerError({ 
        error: 'Failed to fetch PDF metadata',
        message: error.message 
      })
    }
  }

  /**
   * Get statistics about products
   */
  async getStatistics({ response }: HttpContext) {
    try {
      const [totalProducts, productsByGroup, productsWithConversion, lastUpdate] = await Promise.all([
        // Total count
        prisma.product.count(),
        
        // Count by group
        prisma.product.groupBy({
          by: ['group'],
          _count: {
            id: true
          }
        }),
        
        // Products with conversion
        prisma.product.count({
          where: {
            conversion: {
              not: null
            }
          }
        }),
        
        // Last update time
        prisma.pdfMetadata.findFirst({
          orderBy: { updatedAt: 'desc' },
          select: { updatedAt: true }
        })
      ])

      // Format group statistics
      const groupStats = productsByGroup.map(item => ({
        group: item.group || 'Others',
        count: item._count.id
      }))

      return response.ok({
        totalProducts,
        productsByGroup: groupStats,
        productsWithConversion,
        productsWithoutConversion: totalProducts - productsWithConversion,
        lastUpdate: lastUpdate?.updatedAt || null
      })
    } catch (error: any) {
      return response.internalServerError({ 
        error: 'Failed to fetch statistics',
        message: error.message 
      })
    }
  }

  /**
   * Get category summary with calculations
   */
  async getCategorySummary({ response }: HttpContext) {
    try {
      const products = await prisma.product.findMany({
        select: {
          group: true,
          w38: true,
          w39: true,
          w40: true,
          w41: true,
          conversion: true
        }
      })

      // Group by category and calculate averages
      const categoryMap = new Map<string, {
        count: number
        totalAvg: number
        totalCsPer1k: number
        productsWithConversion: number
      }>()

      products.forEach(product => {
        const group = product.group || 'Others'
        const w38 = parseFloat(product.w38) || 0
        const w39 = parseFloat(product.w39) || 0
        const w40 = parseFloat(product.w40) || 0
        const w41 = parseFloat(product.w41) || 0
        const avg = (w38 + w39 + w40 + w41) / 4
        const conversion = parseFloat(product.conversion || '0') || 0
        const csPer1k = conversion > 0 ? avg / conversion : 0

        if (!categoryMap.has(group)) {
          categoryMap.set(group, {
            count: 0,
            totalAvg: 0,
            totalCsPer1k: 0,
            productsWithConversion: 0
          })
        }

        const stats = categoryMap.get(group)!
        stats.count++
        stats.totalAvg += avg
        if (conversion > 0) {
          stats.totalCsPer1k += csPer1k
          stats.productsWithConversion++
        }
      })

      // Format results
      const summary = Array.from(categoryMap.entries()).map(([group, stats]) => ({
        group,
        productCount: stats.count,
        averageUsage: stats.count > 0 ? stats.totalAvg / stats.count : 0,
        averageCsPer1k: stats.productsWithConversion > 0 
          ? stats.totalCsPer1k / stats.productsWithConversion 
          : 0,
        productsWithConversion: stats.productsWithConversion,
        conversionRate: stats.count > 0 
          ? (stats.productsWithConversion / stats.count) * 100 
          : 0
      }))

      // Sort by product count descending
      summary.sort((a, b) => b.productCount - a.productCount)

      return response.ok(summary)
    } catch (error: any) {
      return response.internalServerError({ 
        error: 'Failed to fetch category summary',
        message: error.message 
      })
    }
  }
}

