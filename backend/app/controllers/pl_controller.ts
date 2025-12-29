import type { HttpContext } from '@adonisjs/core/http'
import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

export default class PlController {
  /**
   * Get P&L report for a specific year and period
   */
  async show({ params, response }: HttpContext) {
    try {
      const year = parseInt(params.year)
      const period = parseInt(params.period)

      if (isNaN(year) || isNaN(period)) {
        return response.badRequest({ error: 'Invalid year or period' })
      }

      const plReport = await prisma.plReport.findUnique({
        where: {
          year_period: {
            year,
            period,
          },
        },
      })

      if (!plReport) {
        return response.notFound({ error: 'P&L report not found' })
      }

      return response.ok(plReport)
    } catch (error: any) {
      return response.internalServerError({
        error: 'Failed to fetch P&L report',
        message: error.message,
      })
    }
  }

  /**
   * Get all P&L reports for a specific year
   */
  async index({ params, response }: HttpContext) {
    try {
      const year = parseInt(params.year)

      if (isNaN(year)) {
        return response.badRequest({ error: 'Invalid year' })
      }

      const plReports = await prisma.plReport.findMany({
        where: { year },
        orderBy: { period: 'asc' },
      })

      return response.ok(plReports)
    } catch (error: any) {
      return response.internalServerError({
        error: 'Failed to fetch P&L reports',
        message: error.message,
      })
    }
  }

  /**
   * Create or update P&L report
   */
  async sync({ request, response }: HttpContext) {
    try {
      console.log('P&L sync endpoint called')
      
      // Get request body
      const body = request.body()
      console.log('Request body received, keys:', Object.keys(body || {}))
      
      const year = body?.year
      const period = body?.period
      const plReportData = body?.plReportData
      const fileName = body?.fileName

      console.log('Extracted values:', { 
        year, 
        period, 
        hasPlReportData: !!plReportData,
        fileName 
      })

      if (!year || !period || !plReportData) {
        console.error('Missing required fields:', { year, period, hasPlReportData: !!plReportData })
        return response.badRequest({
          error: 'Year, period, and plReportData are required',
          received: { hasYear: !!year, hasPeriod: !!period, hasPlReportData: !!plReportData }
        })
      }

      const yearNum = parseInt(year)
      const periodNum = parseInt(period)

      if (isNaN(yearNum) || isNaN(periodNum)) {
        return response.badRequest({ error: 'Invalid year or period' })
      }

      // Validate plReportData structure
      console.log('Validating plReportData structure:', {
        hasStoreName: !!plReportData.storeName,
        hasCompany: !!plReportData.company,
        hasLineItems: !!plReportData.lineItems,
        lineItemsIsArray: Array.isArray(plReportData.lineItems),
        lineItemsLength: Array.isArray(plReportData.lineItems) ? plReportData.lineItems.length : 0,
        hasSummaryData: !!plReportData.summaryData,
        summaryDataType: typeof plReportData.summaryData,
        summaryDataKeys: plReportData.summaryData ? Object.keys(plReportData.summaryData).length : 0,
      })

      if (
        !plReportData.storeName ||
        !plReportData.company ||
        !plReportData.lineItems ||
        !plReportData.summaryData
      ) {
        console.error('Invalid plReportData structure - missing required fields')
        return response.badRequest({
          error: 'Invalid plReportData structure',
          details: {
            hasStoreName: !!plReportData.storeName,
            hasCompany: !!plReportData.company,
            hasLineItems: !!plReportData.lineItems,
            hasSummaryData: !!plReportData.summaryData,
          }
        })
      }

      // Upsert the P&L report
      console.log('Upserting P&L report to database...')
      const plReport = await prisma.plReport.upsert({
        where: {
          year_period: {
            year: yearNum,
            period: periodNum,
          },
        },
        update: {
          storeName: plReportData.storeName,
          company: plReportData.company,
          periodString: plReportData.period || 'Unknown',
          translationCurrency: plReportData.translationCurrency || 'USD',
          fileName: fileName || null,
          lineItems: plReportData.lineItems,
          summaryData: plReportData.summaryData,
        },
        create: {
          year: yearNum,
          period: periodNum,
          storeName: plReportData.storeName,
          company: plReportData.company,
          periodString: plReportData.period || 'Unknown',
          translationCurrency: plReportData.translationCurrency || 'USD',
          fileName: fileName || null,
          lineItems: plReportData.lineItems,
          summaryData: plReportData.summaryData,
        },
      })

      console.log('P&L report upserted successfully:', {
        id: plReport.id,
        year: plReport.year,
        period: plReport.period,
        lineItemsCount: Array.isArray(plReport.lineItems) ? plReport.lineItems.length : 0,
        hasSummaryData: !!plReport.summaryData,
      })

      return response.ok({
        message: 'P&L report saved successfully',
        data: plReport,
      })
    } catch (error: any) {
      console.error('Error in PlController.sync:', error)
      console.error('Error details:', {
        message: error.message,
        code: error.code,
        meta: error.meta,
        stack: error.stack,
      })
      return response.internalServerError({
        error: 'Failed to sync P&L report',
        message: error.message,
        code: error.code,
      })
    }
  }

  /**
   * Get list of years that have P&L data
   */
  async getYears({ response }: HttpContext) {
    try {
      const years = await prisma.plReport.findMany({
        select: { year: true },
        distinct: ['year'],
        orderBy: { year: 'desc' },
      })

      const yearList = years.map((y) => y.year)
      return response.ok({ years: yearList })
    } catch (error: any) {
      return response.internalServerError({
        error: 'Failed to fetch years',
        message: error.message,
      })
    }
  }

  /**
   * Get periods for a specific year
   */
  async getPeriods({ params, response }: HttpContext) {
    try {
      const year = parseInt(params.year)

      if (isNaN(year)) {
        return response.badRequest({ error: 'Invalid year' })
      }

      const periods = await prisma.plReport.findMany({
        where: { year },
        select: { period: true, fileName: true, updatedAt: true },
        orderBy: { period: 'asc' },
      })
      return response.ok({ periods })
    } catch (error: any) {
      return response.internalServerError({
        error: 'Failed to fetch periods',
        message: error.message,
      })
    }
  }

  /**
   * Delete P&L report for a specific year and period
   */
  async destroy({ params, response }: HttpContext) {
    console.log('PlController.destroy called with params:', params)
    try {
      const year = parseInt(params.year)
      const period = parseInt(params.period)
      
      console.log('Parsed year and period:', { year, period })

      if (isNaN(year) || isNaN(period)) {
        return response.badRequest({ error: 'Invalid year or period' })
      }

      const plReport = await prisma.plReport.findUnique({
        where: {
          year_period: {
            year,
            period,
          },
        },
      })

      if (!plReport) {
        return response.notFound({ error: 'P&L report not found' })
      }

      await prisma.plReport.delete({
        where: {
          year_period: {
            year,
            period,
          },
        },
      })

      console.log('P&L report deleted successfully:', { year, period })

      return response.ok({
        message: 'P&L report deleted successfully',
      })
    } catch (error: any) {
      console.error('Error in PlController.destroy:', error)
      return response.internalServerError({
        error: 'Failed to delete P&L report',
        message: error.message,
      })
    }
  }
}

