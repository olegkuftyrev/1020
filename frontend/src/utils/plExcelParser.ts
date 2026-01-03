import * as XLSX from 'xlsx'

export interface PlLineItemData {
  category: string
  subcategory: string
  ledgerAccount: string
  actuals: number
  actualsPercentage: number
  plan: number
  planPercentage: number
  vfp: number
  priorYear: number
  priorYearPercentage: number
  actualYtd: number
  actualYtdPercentage: number
  planYtd: number
  planYtdPercentage: number
  vfpYtd: number
  priorYearYtd: number
  priorYearYtdPercentage: number
  sortOrder: number
}

export interface PlReportData {
  storeName: string
  company: string
  period: string
  translationCurrency: string
  lineItems: PlLineItemData[]
  summaryData: {
    // Financial metrics with all columns
    netSales: number
    netSalesPlan: number
    netSalesVfp: number
    netSalesPriorYear: number
    netSalesActualYtd: number
    netSalesPlanYtd: number
    netSalesVfpYtd: number
    netSalesPriorYearYtd: number
    
    grossSales: number
    grossSalesPlan: number
    grossSalesVfp: number
    grossSalesPriorYear: number
    grossSalesActualYtd: number
    grossSalesPlanYtd: number
    grossSalesVfpYtd: number
    grossSalesPriorYearYtd: number
    
    costOfGoodsSold: number
    costOfGoodsSoldPlan: number
    costOfGoodsSoldVfp: number
    costOfGoodsSoldPriorYear: number
    costOfGoodsSoldActualYtd: number
    costOfGoodsSoldPlanYtd: number
    costOfGoodsSoldVfpYtd: number
    costOfGoodsSoldPriorYearYtd: number
    
    totalLabor: number
    totalLaborPlan: number
    totalLaborVfp: number
    totalLaborPriorYear: number
    totalLaborActualYtd: number
    totalLaborPlanYtd: number
    totalLaborVfpYtd: number
    totalLaborPriorYearYtd: number
    
    controllables: number
    controllablesPlan: number
    controllablesVfp: number
    controllablesPriorYear: number
    controllablesActualYtd: number
    controllablesPlanYtd: number
    controllablesVfpYtd: number
    controllablesPriorYearYtd: number
    
    controllableProfit: number
    controllableProfitPlan: number
    controllableProfitVfp: number
    controllableProfitPriorYear: number
    controllableProfitActualYtd: number
    controllableProfitPlanYtd: number
    controllableProfitVfpYtd: number
    controllableProfitPriorYearYtd: number
    
    advertising: number
    advertisingPlan: number
    advertisingVfp: number
    advertisingPriorYear: number
    advertisingActualYtd: number
    advertisingPlanYtd: number
    advertisingVfpYtd: number
    advertisingPriorYearYtd: number
    
    fixedCosts: number
    fixedCostsPlan: number
    fixedCostsVfp: number
    fixedCostsPriorYear: number
    fixedCostsActualYtd: number
    fixedCostsPlanYtd: number
    fixedCostsVfpYtd: number
    fixedCostsPriorYearYtd: number
    
    restaurantContribution: number
    restaurantContributionPlan: number
    restaurantContributionVfp: number
    restaurantContributionPriorYear: number
    restaurantContributionActualYtd: number
    restaurantContributionPlanYtd: number
    restaurantContributionVfpYtd: number
    restaurantContributionPriorYearYtd: number
    
    cashflow: number
    cashflowPlan: number
    cashflowVfp: number
    cashflowPriorYear: number
    cashflowActualYtd: number
    cashflowPlanYtd: number
    cashflowVfpYtd: number
    cashflowPriorYearYtd: number
    
    // Performance metrics (keeping as single values for now)
    totalTransactions: number
    checkAverage: number
    directLaborHours: number
    averageHourlyWage: number
    directHoursProductivity: number
    totalHoursProductivity: number
    managementHeadcount: number
    assistantManagerHeadcount: number
    chefHeadcount: number
    breakfastPercentage: number
    lunchPercentage: number
    afternoonPercentage: number
    eveningPercentage: number
    dinnerPercentage: number
    dineInPercentage: number
    takeOutPercentage: number
    driveThruPercentage: number
    thirdPartyDigitalPercentage: number
    pandaDigitalPercentage: number
    inStoreCateringPercentage: number
    cateringSales: number
    pandaDigitalSales: number
    thirdPartyDigitalSales: number
    rewardRedemptions: number
    fundraisingEventsSales: number
    virtualFundraisingSales: number
  }
}

export class PlExcelParserService {
  static async parseExcelFile(file: File, periodOverride?: string): Promise<PlReportData> {
    return new Promise((resolve, reject) => {
      const reader = new FileReader()
      reader.onload = (e) => {
        try {
          const arrayBuffer = e.target?.result as ArrayBuffer
          if (!arrayBuffer) {
            throw new Error('Failed to read file')
          }
          const workbook = XLSX.read(arrayBuffer, { type: 'array' })
          if (!workbook.SheetNames || workbook.SheetNames.length === 0) {
            throw new Error('Excel file has no sheets')
          }
          const sheetName = workbook.SheetNames[0]
          const sheet = workbook.Sheets[sheetName]
          
          // Fix !ref if broken
          const fixedRef = this.getActualRangeFromSheet(sheet)
          if (!fixedRef) {
            throw new Error('Unable to determine data range.')
          }
          sheet['!ref'] = fixedRef

          const headerRowIndex = this.findHeaderRow(sheet, 'Ledger Account')
          if (headerRowIndex === null) {
            throw new Error('Header row with "Ledger Account" not found.')
          }

          // First, get all data to extract metadata
          const allData = XLSX.utils.sheet_to_json(sheet, { 
            header: 1,
            blankrows: false,
            defval: ''
          }) as any[][]
          
          // Extract metadata from the full data (headerRowIndex is 0-based, but extractMetadata expects 1-based)
          const metadata = this.extractMetadata(allData, headerRowIndex + 1)
          
          // Then get data starting from header row
          const jsonData = XLSX.utils.sheet_to_json(sheet, { 
            range: headerRowIndex,
            header: 1,
            blankrows: false,
            defval: ''
          }) as any[][]
          
          const finalPeriod = periodOverride || metadata.period || this.extractPeriodFromFileName(file.name)
          
          resolve(this.parsePlData(jsonData, finalPeriod, metadata, headerRowIndex + 1))
        } catch (error) {
          reject(error)
        }
      }
      reader.onerror = (error) => {
        reject(error)
      }
      reader.readAsArrayBuffer(file)
    })
  }

  static parseExcelBuffer(buffer: ArrayBuffer, fileName?: string, periodOverride?: string): PlReportData {
    const workbook = XLSX.read(buffer, { type: 'array' })
    if (!workbook.SheetNames || workbook.SheetNames.length === 0) {
      throw new Error('Excel file has no sheets')
    }
    const sheetName = workbook.SheetNames[0]
    const sheet = workbook.Sheets[sheetName]
    
    // Fix !ref if broken
    const fixedRef = this.getActualRangeFromSheet(sheet)
    if (!fixedRef) {
      throw new Error('Unable to determine data range.')
    }
    sheet['!ref'] = fixedRef

    const headerRowIndex = this.findHeaderRow(sheet, 'Ledger Account')
    if (headerRowIndex === null) {
      throw new Error('Header row with "Ledger Account" not found.')
    }

    // First, get all data to extract metadata
    const allData = XLSX.utils.sheet_to_json(sheet, { 
      header: 1,
      blankrows: false,
      defval: ''
    }) as any[][]
    
    // Extract metadata from the full data (headerRowIndex is 0-based, but extractMetadata expects 1-based)
    const metadata = this.extractMetadata(allData, headerRowIndex + 1)
    
    // Then get data starting from header row
    const jsonData = XLSX.utils.sheet_to_json(sheet, { 
      range: headerRowIndex,
      header: 1,
      blankrows: false,
      defval: ''
    }) as any[][]
    
    const finalPeriod = periodOverride || metadata.period || (fileName ? this.extractPeriodFromFileName(fileName) : undefined)
    
    return this.parsePlData(jsonData, finalPeriod, metadata, headerRowIndex + 1)
  }

  // --- UTIL: Normalize text ---
  private static normalizeCellValue(value: any): string {
    if (typeof value !== 'string') return ''
    return value
      .replace(/<[^>]*>/g, '') // Remove HTML tags like <t>
      .replace(/&[^;\s]+;/g, '') // Remove HTML entities like &amp;
      .replace(/\s+/g, ' ') // Collapse whitespace
      .trim()
      .toLowerCase()
  }

  // --- UTIL: Fix broken !ref by scanning cell addresses ---
  private static getActualRangeFromSheet(sheet: any): string | null {
    const cellAddresses = Object.keys(sheet).filter((key) =>
      /^[A-Z]+\d+$/.test(key)
    )

    let minRow = Infinity,
      maxRow = -1,
      minCol = Infinity,
      maxCol = -1

    cellAddresses.forEach((address) => {
      const { r, c } = XLSX.utils.decode_cell(address)
      minRow = Math.min(minRow, r)
      maxRow = Math.max(maxRow, r)
      minCol = Math.min(minCol, c)
      maxCol = Math.max(maxCol, c)
    })

    if (cellAddresses.length === 0) return null

    const start = XLSX.utils.encode_cell({ r: minRow, c: minCol })
    const end = XLSX.utils.encode_cell({ r: maxRow, c: maxCol })

    return `${start}:${end}`
  }

  // --- HEADER ROW DETECTOR: based on keyword like "Ledger Account" ---
  private static findHeaderRow(sheet: any, keyword: string = 'Ledger Account'): number | null {
    if (!sheet['!ref']) return null
    
    const range = XLSX.utils.decode_range(sheet['!ref'])

    for (let R = range.s.r; R <= range.e.r; ++R) {
      for (let C = range.s.c; C <= range.e.c; ++C) {
        const cellAddress = XLSX.utils.encode_cell({ r: R, c: C })
        const cell = sheet[cellAddress]

        if (cell && typeof cell.v === 'string') {
          const cleaned = this.normalizeCellValue(cell.v)
          if (cleaned.includes(keyword.toLowerCase())) {
            return R // Return 0-based index
          }
        }
      }
    }

    return null
  }

  private static extractMetadata(
    allData: any[][],
    headerRowIndex: number
  ): { storeName: string; company: string; period: string; translationCurrency: string } {
    let storeName = ''
    let company = ''
    let period = ''
    let translationCurrency = 'USD'
    
    // Scan rows before header row for metadata
    for (let i = 0; i < headerRowIndex - 1 && i < allData.length; i++) {
      const row = allData[i]
      if (!row || row.length === 0) continue
      
      const rowText = row.map(cell => this.normalizeCellValue(cell)).join(' ').toLowerCase()
      
      // Look for store name
      if (rowText.includes('store') && !storeName) {
        const storeMatch = row.find(cell => {
          const val = this.normalizeCellValue(cell)
          return val && val.length > 0 && !val.toLowerCase().includes('store')
        })
        if (storeMatch) storeName = this.normalizeCellValue(storeMatch)
      }
      
      // Look for company
      if (rowText.includes('company') && !company) {
        const companyMatch = row.find(cell => {
          const val = this.normalizeCellValue(cell)
          return val && val.length > 0 && !val.toLowerCase().includes('company')
        })
        if (companyMatch) company = this.normalizeCellValue(companyMatch)
      }
      
      // Look for period (P01, P12, etc.)
      if (rowText.includes('period') || /p\d{1,2}/i.test(rowText)) {
        const periodMatch = row.find(cell => {
          const val = this.normalizeCellValue(cell)
          return /p\d{1,2}/i.test(val)
        })
        if (periodMatch) period = this.normalizeCellValue(periodMatch).toUpperCase()
      }
      
      // Look for currency
      if (rowText.includes('currency') || rowText.includes('translation')) {
        const currencyMatch = row.find(cell => {
          const val = this.normalizeCellValue(cell)
          return ['USD', 'EUR', 'GBP', 'CAD'].includes(val.toUpperCase())
        })
        if (currencyMatch) translationCurrency = this.normalizeCellValue(currencyMatch).toUpperCase()
      }
    }
    
    return { storeName, company, period, translationCurrency }
  }

  private static parsePlData(
    data: any[][],
    periodFromFile?: string,
    metadata?: { storeName: string; company: string; period: string; translationCurrency: string },
    _headerRowIndex?: number // Unused, kept for compatibility
  ): PlReportData {
    // When using range: headerRowIndex, the header is already at index 0
    const headerRow = data[0] || []
    const lineItems: PlLineItemData[] = []
    
    // Find column indices
    const ledgerAccountCol = headerRow.findIndex((h: any) => 
      this.normalizeCellValue(h).toLowerCase().includes('ledger account')
    )
    const categoryCol = headerRow.findIndex((h: any) => 
      this.normalizeCellValue(h).toLowerCase().includes('category')
    )
    const subcategoryCol = headerRow.findIndex((h: any) => 
      this.normalizeCellValue(h).toLowerCase().includes('subcategory')
    )
    
    // Find data columns
    const actualsCol = headerRow.findIndex((h: any) => 
      this.normalizeCellValue(h).toLowerCase().includes('actuals') && 
      !this.normalizeCellValue(h).toLowerCase().includes('%') &&
      !this.normalizeCellValue(h).toLowerCase().includes('ytd')
    )
    const actualsPctCol = headerRow.findIndex((h: any) => 
      this.normalizeCellValue(h).toLowerCase().includes('actuals') && 
      this.normalizeCellValue(h).toLowerCase().includes('%') &&
      !this.normalizeCellValue(h).toLowerCase().includes('ytd')
    )
    const planCol = headerRow.findIndex((h: any) => 
      this.normalizeCellValue(h).toLowerCase().includes('plan') && 
      !this.normalizeCellValue(h).toLowerCase().includes('%') &&
      !this.normalizeCellValue(h).toLowerCase().includes('ytd')
    )
    const planPctCol = headerRow.findIndex((h: any) => 
      this.normalizeCellValue(h).toLowerCase().includes('plan') && 
      this.normalizeCellValue(h).toLowerCase().includes('%') &&
      !this.normalizeCellValue(h).toLowerCase().includes('ytd')
    )
    const vfpCol = headerRow.findIndex((h: any) => 
      this.normalizeCellValue(h).toLowerCase().includes('vfp') && 
      !this.normalizeCellValue(h).toLowerCase().includes('ytd')
    )
    const priorYearCol = headerRow.findIndex((h: any) => 
      this.normalizeCellValue(h).toLowerCase().includes('prior year') && 
      !this.normalizeCellValue(h).toLowerCase().includes('%') &&
      !this.normalizeCellValue(h).toLowerCase().includes('ytd')
    )
    const priorYearPctCol = headerRow.findIndex((h: any) => 
      this.normalizeCellValue(h).toLowerCase().includes('prior year') && 
      this.normalizeCellValue(h).toLowerCase().includes('%') &&
      !this.normalizeCellValue(h).toLowerCase().includes('ytd')
    )
    const actualYtdCol = headerRow.findIndex((h: any) => 
      this.normalizeCellValue(h).toLowerCase().includes('actual') && 
      this.normalizeCellValue(h).toLowerCase().includes('ytd') &&
      !this.normalizeCellValue(h).toLowerCase().includes('%')
    )
    const actualYtdPctCol = headerRow.findIndex((h: any) => 
      this.normalizeCellValue(h).toLowerCase().includes('actual') && 
      this.normalizeCellValue(h).toLowerCase().includes('ytd') &&
      this.normalizeCellValue(h).toLowerCase().includes('%')
    )
    const planYtdCol = headerRow.findIndex((h: any) => 
      this.normalizeCellValue(h).toLowerCase().includes('plan') && 
      this.normalizeCellValue(h).toLowerCase().includes('ytd') &&
      !this.normalizeCellValue(h).toLowerCase().includes('%')
    )
    const planYtdPctCol = headerRow.findIndex((h: any) => 
      this.normalizeCellValue(h).toLowerCase().includes('plan') && 
      this.normalizeCellValue(h).toLowerCase().includes('ytd') &&
      this.normalizeCellValue(h).toLowerCase().includes('%')
    )
    const vfpYtdCol = headerRow.findIndex((h: any) => 
      this.normalizeCellValue(h).toLowerCase().includes('vfp') && 
      this.normalizeCellValue(h).toLowerCase().includes('ytd')
    )
    const priorYearYtdCol = headerRow.findIndex((h: any) => 
      this.normalizeCellValue(h).toLowerCase().includes('prior year') && 
      this.normalizeCellValue(h).toLowerCase().includes('ytd') &&
      !this.normalizeCellValue(h).toLowerCase().includes('%')
    )
    const priorYearYtdPctCol = headerRow.findIndex((h: any) => 
      this.normalizeCellValue(h).toLowerCase().includes('prior year') && 
      this.normalizeCellValue(h).toLowerCase().includes('ytd') &&
      this.normalizeCellValue(h).toLowerCase().includes('%')
    )
    
    // Parse data rows (starting from row 1, since row 0 is the header)
    for (let i = 1; i < data.length; i++) {
      const row = data[i]
      if (!row || row.length === 0) continue
      
      const ledgerAccount = this.cleanString(row[ledgerAccountCol])
      if (!ledgerAccount || ledgerAccount.length === 0) continue
      
      const lineItem: PlLineItemData = {
        category: this.cleanString(row[categoryCol] || ''),
        subcategory: this.cleanString(row[subcategoryCol] || ''),
        ledgerAccount,
        actuals: this.parseNumber(row[actualsCol]),
        actualsPercentage: this.parsePercentage(row[actualsPctCol]),
        plan: this.parseNumber(row[planCol]),
        planPercentage: this.parsePercentage(row[planPctCol]),
        vfp: this.parseNumber(row[vfpCol]),
        priorYear: this.parseNumber(row[priorYearCol]),
        priorYearPercentage: this.parsePercentage(row[priorYearPctCol]),
        actualYtd: this.parseNumber(row[actualYtdCol]),
        actualYtdPercentage: this.parsePercentage(row[actualYtdPctCol]),
        planYtd: this.parseNumber(row[planYtdCol]),
        planYtdPercentage: this.parsePercentage(row[planYtdPctCol]),
        vfpYtd: this.parseNumber(row[vfpYtdCol]),
        priorYearYtd: this.parseNumber(row[priorYearYtdCol]),
        priorYearYtdPercentage: this.parsePercentage(row[priorYearYtdPctCol]),
        sortOrder: i - 1,
      }
      
      lineItems.push(lineItem)
    }
    
    const summaryData = this.extractSummaryData(lineItems)
    
    return {
      storeName: metadata?.storeName || '',
      company: metadata?.company || '',
      period: periodFromFile || metadata?.period || '',
      translationCurrency: metadata?.translationCurrency || 'USD',
      lineItems,
      summaryData,
    }
  }

  private static extractSummaryData(lineItems: PlLineItemData[]) {
    // Extract summary metrics from line items
    const netSalesItem = lineItems.find(item => 
      item.ledgerAccount.toLowerCase().includes('net sales')
    )
    const grossSalesItem = lineItems.find(item => 
      item.ledgerAccount.toLowerCase().includes('gross sales')
    )
    const cogsItem = lineItems.find(item => 
      item.ledgerAccount.toLowerCase().includes('cost of goods sold')
    )
    
    // Find Total Labor
    const totalLaborItem = lineItems.find(item => 
      item.ledgerAccount.toLowerCase().includes('total labor')
    )
    
    // Find Controllables
    const controllablesItem = lineItems.find(item => 
      item.ledgerAccount.toLowerCase().includes('total controllables')
    )
    
    // Find Controllable Profit
    const controllableProfitItem = lineItems.find(item => 
      item.ledgerAccount.toLowerCase().includes('controllable profit')
    )
    
    // Find Fixed Costs
    const fixedCostsItem = lineItems.find(item => 
      item.ledgerAccount.toLowerCase().includes('total fixed cost')
    )
    
    // Find Total Transactions
    const totalTransactionsItem = lineItems.find(item => 
      item.ledgerAccount.toLowerCase().trim() === 'total transactions'
    )
    
    // Find Check Average
    const checkAverageItem = lineItems.find(item => 
      item.ledgerAccount.toLowerCase().includes('check avg - net') || 
      item.ledgerAccount.toLowerCase().includes('check average')
    )
    
    // Find Advertising
    const advertisingItem = lineItems.find(item => 
      item.ledgerAccount.toLowerCase().includes('advertising') &&
      !item.ledgerAccount.toLowerCase().includes('corporate') &&
      !item.ledgerAccount.toLowerCase().includes('local store')
    )
    
    // Find Restaurant Contribution
    const restaurantContributionItem = lineItems.find(item => 
      item.ledgerAccount.toLowerCase().includes('restaurant contribution') ||
      item.ledgerAccount.toLowerCase().includes('rests contribution')
    )
    
    // Find Cashflow
    const cashflowItem = lineItems.find(item => 
      item.ledgerAccount.toLowerCase().includes('cash flow') ||
      item.ledgerAccount.toLowerCase().includes('cashflow')
    )
    
    return {
      netSales: netSalesItem?.actuals || 0,
      netSalesPlan: netSalesItem?.plan || 0,
      netSalesVfp: netSalesItem?.vfp || 0,
      netSalesPriorYear: netSalesItem?.priorYear || 0,
      netSalesActualYtd: netSalesItem?.actualYtd || 0,
      netSalesPlanYtd: netSalesItem?.planYtd || 0,
      netSalesVfpYtd: netSalesItem?.vfpYtd || 0,
      netSalesPriorYearYtd: netSalesItem?.priorYearYtd || 0,
      
      grossSales: grossSalesItem?.actuals || 0,
      grossSalesPlan: grossSalesItem?.plan || 0,
      grossSalesVfp: grossSalesItem?.vfp || 0,
      grossSalesPriorYear: grossSalesItem?.priorYear || 0,
      grossSalesActualYtd: grossSalesItem?.actualYtd || 0,
      grossSalesPlanYtd: grossSalesItem?.planYtd || 0,
      grossSalesVfpYtd: grossSalesItem?.vfpYtd || 0,
      grossSalesPriorYearYtd: grossSalesItem?.priorYearYtd || 0,
      
      costOfGoodsSold: cogsItem?.actuals || 0,
      costOfGoodsSoldPlan: cogsItem?.plan || 0,
      costOfGoodsSoldVfp: cogsItem?.vfp || 0,
      costOfGoodsSoldPriorYear: cogsItem?.priorYear || 0,
      costOfGoodsSoldActualYtd: cogsItem?.actualYtd || 0,
      costOfGoodsSoldPlanYtd: cogsItem?.planYtd || 0,
      costOfGoodsSoldVfpYtd: cogsItem?.vfpYtd || 0,
      costOfGoodsSoldPriorYearYtd: cogsItem?.priorYearYtd || 0,
      
      // Total Labor
      totalLabor: totalLaborItem?.actuals || 0,
      totalLaborPlan: totalLaborItem?.plan || 0,
      totalLaborVfp: totalLaborItem?.vfp || 0,
      totalLaborPriorYear: totalLaborItem?.priorYear || 0,
      totalLaborActualYtd: totalLaborItem?.actualYtd || 0,
      totalLaborPlanYtd: totalLaborItem?.planYtd || 0,
      totalLaborVfpYtd: totalLaborItem?.vfpYtd || 0,
      totalLaborPriorYearYtd: totalLaborItem?.priorYearYtd || 0,
      
      // Controllables
      controllables: controllablesItem?.actuals || 0,
      controllablesPlan: controllablesItem?.plan || 0,
      controllablesVfp: controllablesItem?.vfp || 0,
      controllablesPriorYear: controllablesItem?.priorYear || 0,
      controllablesActualYtd: controllablesItem?.actualYtd || 0,
      controllablesPlanYtd: controllablesItem?.planYtd || 0,
      controllablesVfpYtd: controllablesItem?.vfpYtd || 0,
      controllablesPriorYearYtd: controllablesItem?.priorYearYtd || 0,
      
      // Controllable Profit
      controllableProfit: controllableProfitItem?.actuals || 0,
      controllableProfitPlan: controllableProfitItem?.plan || 0,
      controllableProfitVfp: controllableProfitItem?.vfp || 0,
      controllableProfitPriorYear: controllableProfitItem?.priorYear || 0,
      controllableProfitActualYtd: controllableProfitItem?.actualYtd || 0,
      controllableProfitPlanYtd: controllableProfitItem?.planYtd || 0,
      controllableProfitVfpYtd: controllableProfitItem?.vfpYtd || 0,
      controllableProfitPriorYearYtd: controllableProfitItem?.priorYearYtd || 0,
      
      // Advertising
      advertising: advertisingItem?.actuals || 0,
      advertisingPlan: advertisingItem?.plan || 0,
      advertisingVfp: advertisingItem?.vfp || 0,
      advertisingPriorYear: advertisingItem?.priorYear || 0,
      advertisingActualYtd: advertisingItem?.actualYtd || 0,
      advertisingPlanYtd: advertisingItem?.planYtd || 0,
      advertisingVfpYtd: advertisingItem?.vfpYtd || 0,
      advertisingPriorYearYtd: advertisingItem?.priorYearYtd || 0,
      
      // Fixed Costs
      fixedCosts: fixedCostsItem?.actuals || 0,
      fixedCostsPlan: fixedCostsItem?.plan || 0,
      fixedCostsVfp: fixedCostsItem?.vfp || 0,
      fixedCostsPriorYear: fixedCostsItem?.priorYear || 0,
      fixedCostsActualYtd: fixedCostsItem?.actualYtd || 0,
      fixedCostsPlanYtd: fixedCostsItem?.planYtd || 0,
      fixedCostsVfpYtd: fixedCostsItem?.vfpYtd || 0,
      fixedCostsPriorYearYtd: fixedCostsItem?.priorYearYtd || 0,
      
      // Restaurant Contribution
      restaurantContribution: restaurantContributionItem?.actuals || 0,
      restaurantContributionPlan: restaurantContributionItem?.plan || 0,
      restaurantContributionVfp: restaurantContributionItem?.vfp || 0,
      restaurantContributionPriorYear: restaurantContributionItem?.priorYear || 0,
      restaurantContributionActualYtd: restaurantContributionItem?.actualYtd || 0,
      restaurantContributionPlanYtd: restaurantContributionItem?.planYtd || 0,
      restaurantContributionVfpYtd: restaurantContributionItem?.vfpYtd || 0,
      restaurantContributionPriorYearYtd: restaurantContributionItem?.priorYearYtd || 0,
      
      // Cashflow
      cashflow: cashflowItem?.actuals || 0,
      cashflowPlan: cashflowItem?.plan || 0,
      cashflowVfp: cashflowItem?.vfp || 0,
      cashflowPriorYear: cashflowItem?.priorYear || 0,
      cashflowActualYtd: cashflowItem?.actualYtd || 0,
      cashflowPlanYtd: cashflowItem?.planYtd || 0,
      cashflowVfpYtd: cashflowItem?.vfpYtd || 0,
      cashflowPriorYearYtd: cashflowItem?.priorYearYtd || 0,
      
      // Total Transactions
      totalTransactions: totalTransactionsItem?.actuals || 0,
      
      // Check Average
      checkAverage: checkAverageItem?.actuals || 0,
      directLaborHours: 0,
      averageHourlyWage: 0,
      directHoursProductivity: 0,
      totalHoursProductivity: 0,
      managementHeadcount: 0,
      assistantManagerHeadcount: 0,
      chefHeadcount: 0,
      breakfastPercentage: 0,
      lunchPercentage: 0,
      afternoonPercentage: 0,
      eveningPercentage: 0,
      dinnerPercentage: 0,
      dineInPercentage: 0,
      takeOutPercentage: 0,
      driveThruPercentage: 0,
      thirdPartyDigitalPercentage: 0,
      pandaDigitalPercentage: 0,
      inStoreCateringPercentage: 0,
      cateringSales: 0,
      pandaDigitalSales: 0,
      thirdPartyDigitalSales: 0,
      rewardRedemptions: 0,
      fundraisingEventsSales: 0,
      virtualFundraisingSales: 0,
    }
  }

  private static extractPeriodFromFileName(fileName: string): string | undefined {
    const match = fileName.match(/[Pp](\d{1,2})/i)
    if (match) {
      return `P${match[1].padStart(2, '0')}`
    }
    return undefined
  }

  private static cleanString(value: any): string {
    if (value === null || value === undefined) return ''
    if (typeof value === 'string') return value.trim()
    return String(value).trim()
  }

  private static parseNumber(value: any): number {
    if (value === null || value === undefined || value === '') return 0
    if (typeof value === 'number') return value
    const str = String(value).trim().replace(/,/g, '')
    const num = parseFloat(str)
    return isNaN(num) ? 0 : num
  }

  private static parsePercentage(value: any): number {
    if (value === null || value === undefined || value === '') return 0
    if (typeof value === 'number') {
      // Excel stores percentages in different formats:
      // - As decimals: 0.01 = 1%, 1.0 = 100%
      // - As whole numbers: 1 = 1%, 100 = 100%
      // We need to detect the format. If the absolute value is <= 1, it's likely a decimal format
      // where 1.0 means 100%, so we multiply by 100. If > 1, it's already in percentage format.
      const absValue = Math.abs(value)
      if (absValue <= 1 && absValue > 0) {
        // Decimal format: multiply by 100 (0.01 -> 1%, 1.0 -> 100%)
        return value * 100
      }
      // Already in percentage format (1 = 1%, 100 = 100%)
      return value
    }
    const str = String(value).trim().replace(/,/g, '').replace(/%/g, '')
    const num = parseFloat(str)
    if (isNaN(num)) return 0
    // Same logic: if <= 1 and > 0, multiply by 100
    const absNum = Math.abs(num)
    if (absNum <= 1 && absNum > 0) {
      return num * 100
    }
    return num
  }
}

