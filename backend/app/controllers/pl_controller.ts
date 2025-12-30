import type { HttpContext } from '@adonisjs/core/http'
import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

/**
 * Calculate all key metrics from P&L data
 */
function calculateKeyMetrics(summaryData: any, lineItems: any[]): any {
  const metrics: any = {}

  // Net Sales with SSS
  const netSales = summaryData.netSales || 0
  const netSalesPriorYear = summaryData.netSalesPriorYear || 0
  const netSalesDiff = netSales - netSalesPriorYear
  const sss = netSalesPriorYear !== 0 ? ((netSalesDiff / netSalesPriorYear) * 100) : 0
  metrics.netSales = {
    value: netSales,
    priorYear: netSalesPriorYear,
    difference: netSalesDiff,
    sss: sss,
    isPositive: netSalesDiff > 0
  }

  // Total Transactions with SST
  const txItem = lineItems?.find((item: any) => {
    const accountName = (item.ledgerAccount || '').toLowerCase().trim()
    return accountName === 'total transactions'
  })
  const totalTransactions = summaryData.totalTransactions || 0
  const totalTransactionsPriorYear = txItem?.priorYear || 0
  const txDiff = totalTransactions - totalTransactionsPriorYear
  const sst = totalTransactionsPriorYear !== 0 ? ((txDiff / totalTransactionsPriorYear) * 100) : 0
  metrics.totalTransactions = {
    value: totalTransactions,
    priorYear: totalTransactionsPriorYear,
    difference: txDiff,
    sst: sst,
    isPositive: txDiff > 0
  }

  // Check Average
  const checkItem = lineItems?.find((item: any) => {
    const accountName = (item.ledgerAccount || '').toLowerCase().trim()
    return accountName === 'check avg - net' || accountName.includes('check average')
  })
  const checkAverage = summaryData.checkAverage || 0
  const checkAveragePriorYear = checkItem?.priorYear || 0
  const checkDiff = checkAverage - checkAveragePriorYear
  const checkChangePercent = checkAveragePriorYear !== 0 ? ((checkDiff / checkAveragePriorYear) * 100) : 0
  metrics.checkAverage = {
    value: checkAverage,
    priorYear: checkAveragePriorYear,
    difference: checkDiff,
    changePercent: checkChangePercent,
    isPositive: checkDiff > 0
  }

  // OLO%
  const pandaItem = lineItems?.find((item: any) => {
    const accountName = (item.ledgerAccount || '').toLowerCase().trim()
    return accountName === 'panda digital %'
  })
  const thirdPartyItem = lineItems?.find((item: any) => {
    const accountName = (item.ledgerAccount || '').toLowerCase().trim()
    return accountName === '3rd party digital %'
  })
  if (pandaItem && thirdPartyItem) {
    const pandaCurrent = (pandaItem.actuals || 0) * 100
    const pandaPrior = (pandaItem.priorYear || 0) * 100
    const thirdPartyCurrent = (thirdPartyItem.actuals || 0) * 100
    const thirdPartyPrior = (thirdPartyItem.priorYear || 0) * 100
    const currentOLO = pandaCurrent + thirdPartyCurrent
    const priorYearOLO = pandaPrior + thirdPartyPrior
    const oloDiff = currentOLO - priorYearOLO
    metrics.olo = {
      value: currentOLO,
      priorYear: priorYearOLO,
      difference: oloDiff,
      isPositive: oloDiff > 0
    }
  }

  // COGS %
  const costOfGoodsSold = summaryData.costOfGoodsSold || 0
  const costOfGoodsSoldPriorYear = summaryData.costOfGoodsSoldPriorYear || 0
  const cogsPercent = netSales !== 0 ? ((costOfGoodsSold / netSales) * 100) : 0
  const cogsPercentPriorYear = netSalesPriorYear !== 0 ? ((costOfGoodsSoldPriorYear / netSalesPriorYear) * 100) : 0
  const cogsPercentDiff = cogsPercent - cogsPercentPriorYear
  metrics.cogs = {
    value: cogsPercent,
    priorYear: cogsPercentPriorYear,
    difference: cogsPercentDiff,
    isPositive: cogsPercentDiff < 0 // Lower is better
  }

  // Total Labor %
  const totalLabor = summaryData.totalLabor || 0
  const totalLaborPriorYear = summaryData.totalLaborPriorYear || 0
  const laborPercent = netSales !== 0 ? ((totalLabor / netSales) * 100) : 0
  const laborPercentPriorYear = netSalesPriorYear !== 0 ? ((totalLaborPriorYear / netSalesPriorYear) * 100) : 0
  const laborPercentDiff = laborPercent - laborPercentPriorYear
  metrics.totalLabor = {
    value: laborPercent,
    priorYear: laborPercentPriorYear,
    difference: laborPercentDiff,
    isPositive: laborPercentDiff < 0 // Lower is better
  }

  // Controllable Profit %
  const controllableProfit = summaryData.controllableProfit || 0
  const controllableProfitPriorYear = summaryData.controllableProfitPriorYear || 0
  const cpPercent = netSales !== 0 ? ((controllableProfit / netSales) * 100) : 0
  const cpPercentPriorYear = netSalesPriorYear !== 0 ? ((controllableProfitPriorYear / netSalesPriorYear) * 100) : 0
  const cpPercentDiff = cpPercent - cpPercentPriorYear
  metrics.controllableProfit = {
    value: cpPercent,
    priorYear: cpPercentPriorYear,
    difference: cpPercentDiff,
    isPositive: cpPercentDiff > 0 // Higher is better
  }

  // Restaurant Contribution %
  const fixedCosts = summaryData.fixedCosts || 0
  const fixedCostsPriorYear = summaryData.fixedCostsPriorYear || 0
  const restaurantContribution = controllableProfit - fixedCosts
  const restaurantContributionPriorYear = controllableProfitPriorYear - fixedCostsPriorYear
  const rcPercent = netSales !== 0 ? ((restaurantContribution / netSales) * 100) : 0
  const rcPercentPriorYear = netSalesPriorYear !== 0 ? ((restaurantContributionPriorYear / netSalesPriorYear) * 100) : 0
  const rcPercentDiff = rcPercent - rcPercentPriorYear
  metrics.restaurantContribution = {
    value: rcPercent,
    priorYear: rcPercentPriorYear,
    difference: rcPercentDiff,
    isPositive: rcPercentDiff > 0 // Higher is better
  }

  // Rent $
  const rentMin = lineItems?.find((item: any) => {
    const accountName = (item.ledgerAccount || '').toLowerCase().trim()
    return accountName === 'rent - min'
  })
  const rentOther = lineItems?.find((item: any) => {
    const accountName = (item.ledgerAccount || '').toLowerCase().trim()
    return accountName === 'rent - other'
  })
  if (rentMin && rentOther) {
    const totalRent = (rentMin.actuals || 0) + (rentOther.actuals || 0)
    const totalRentPriorYear = (rentMin.priorYear || 0) + (rentOther.priorYear || 0)
    const rentDiff = totalRent - totalRentPriorYear
    metrics.rent = {
      value: totalRent,
      priorYear: totalRentPriorYear,
      difference: rentDiff,
      isPositive: rentDiff < 0 // Lower is better
    }
  }

  // Flow Thru %
  const cpDiff = controllableProfit - controllableProfitPriorYear
  const nsDiff = netSales - netSalesPriorYear
  const flowThru = nsDiff !== 0 ? ((cpDiff / nsDiff) * 100) : null
  metrics.flowThru = {
    value: flowThru,
    isPositive: flowThru !== null && flowThru > 0
  }

  // Top Controllable
  const controllablesExactNames = [
    'Third Party Delivery Fee', 'Credit Card Fees', 'Broadband', 'Electricity', 'Gas', 'Telephone',
    'Waste Disposal', 'Water', 'Computer Software Expense', 'Office and Computer Supplies',
    'Education and Training Other', 'Recruitment', 'Professional Services', 'Travel Expenses',
    'Bank Fees', 'Dues and Subscriptions', 'Moving and Relocation Expenses', 'Other Expenses',
    'Postage and Courier Service', 'Repairs', 'Maintenance', 'Restaurant Expenses', 'Restaurant Supplies',
    'Total Controllables', 'Profit Before Adv', 'Advertising', 'Corporate Advertising', 'Media',
    'Local Store Marketing', 'Grand Opening', 'Lease Marketing', 'Controllable Profit',
  ]
  
  const controllablesItems = lineItems?.filter((item: any) => {
    const accountName = (item.ledgerAccount || '').trim()
    return controllablesExactNames.some(exactName => 
      accountName.toLowerCase() === exactName.toLowerCase()
    )
  }) || []
  
  const excludedNames = [
    'corporate advertising', 'media', 'local store marketing', 'advertising',
    'credit card fees', 'third party delivery fee', 'restaurant expenses',
    'total controllables', 'profit before adv', 'controllable profit'
  ]
  
  const topExpensive = controllablesItems
    .filter((item: any) => {
      const name = (item.ledgerAccount || '').toLowerCase().trim()
      return !excludedNames.includes(name) && 
             typeof item.actuals === 'number' && 
             item.actuals > 0
    })
    .sort((a: any, b: any) => (b.actuals || 0) - (a.actuals || 0))[0]
  
  if (topExpensive) {
    const topActuals = topExpensive.actuals || 0
    const topPriorYear = topExpensive.priorYear || 0
    const topDiff = topActuals - topPriorYear
    metrics.topControllable = {
      name: topExpensive.ledgerAccount,
      value: topActuals,
      priorYear: topPriorYear,
      difference: topDiff,
      isPositive: topDiff < 0 // Lower is better
    }
  }

  return metrics
}

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

      // Calculate key metrics
      const keyMetrics = calculateKeyMetrics(plReportData.summaryData, plReportData.lineItems)
      
      // Add keyMetrics to summaryData
      const summaryDataWithMetrics = {
        ...plReportData.summaryData,
        keyMetrics: keyMetrics
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
          summaryData: summaryDataWithMetrics,
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
          summaryData: summaryDataWithMetrics,
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
  async getPeriods({ request, params, response }: HttpContext) {
    console.log('PlController.getPeriods called')
    console.log('Request method:', request.method())
    console.log('Request URL:', request.url())
    console.log('Params:', params)
    try {
      const year = parseInt(params.year)

      if (isNaN(year)) {
        return response.badRequest({ error: 'Invalid year' })
      }

      const reports = await prisma.plReport.findMany({
        where: { year },
        select: { 
          period: true, 
          fileName: true, 
          updatedAt: true,
          summaryData: true
        },
        orderBy: { period: 'asc' },
      })

      // Extract keyMetrics from summaryData for each period
      const periods = reports.map(report => ({
        period: report.period,
        fileName: report.fileName,
        updatedAt: report.updatedAt,
        keyMetrics: (report.summaryData as any)?.keyMetrics || null
      }))

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
  async destroy({ request, params, response }: HttpContext) {
    console.log('PlController.destroy called')
    console.log('Request method:', request.method())
    console.log('Request URL:', request.url())
    console.log('Params:', params)
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

