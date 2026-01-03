import { useMemo, useState, useEffect, useRef } from 'react'
import useSWR from 'swr'
import { Link } from 'react-router-dom'
import { getCategorySummary, type CategorySummary } from '@/utils/productsApi'
import { plPeriodsFetcher, plReportFetcher } from '@/utils/plApi'
import { Button } from '@/components/ui/button'
import { ArrowUp, ArrowDown } from 'lucide-react'
import { parseCSVFile, type ParsedCSVData } from '@/utils/csvParser'
import Papa from 'papaparse'
import { getGemData, saveGemData, type GemData } from '@/utils/gemApi'
import {
  Label,
  PolarGrid,
  PolarRadiusAxis,
  RadialBar,
  RadialBarChart,
} from "recharts"
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
  type ChartConfig,
} from "@/components/ui/chart"

export function Dashboard() {
  const [csvData, setCsvData] = useState<ParsedCSVData | null>(null)
  const [csvRawRows, setCsvRawRows] = useState<Array<Record<string, string>> | null>(null)
  const [isParsingCsv, setIsParsingCsv] = useState(false)
  const [csvError, setCsvError] = useState<string | null>(null)
  const [csvFileName, setCsvFileName] = useState<string | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)

  // Load gem data from database
  const { data: gemData, mutate: mutateGemData } = useSWR<GemData | null>(
    '/api/gem',
    getGemData,
    {
      revalidateOnFocus: false,
      revalidateOnReconnect: true,
    }
  )

  const { data: categorySummary, isLoading: categoryLoading } = useSWR<CategorySummary[]>(
    '/products/category-summary',
    getCategorySummary,
    {
      revalidateOnFocus: false,
      revalidateOnReconnect: true,
    }
  )

  // Get all available periods using the same endpoint as P&L page
  // Use the same approach as PL.tsx - fetch periods for each year separately
  const periods2025 = useSWR(
    `/pl/2025/periods`,
    plPeriodsFetcher,
    { revalidateOnFocus: false }
  )
  
  const periods2026 = useSWR(
    `/pl/2026/periods`,
    plPeriodsFetcher,
    { revalidateOnFocus: false }
  )

  // Combine all periods from all years (same as P&L page logic)
  const allPeriods = useMemo(() => {
    const periods: Array<{ year: number; period: number; periodString: string; updatedAt: string; storeName?: string; company?: string }> = []
    
    if (periods2025.data) {
      periods2025.data.forEach((p: any) => {
        if (p.period != null && p.updatedAt) {
          periods.push({
            year: 2025,
            period: p.period,
            periodString: `P${String(p.period).padStart(2, '0')}`,
            updatedAt: p.updatedAt,
          })
        }
      })
    }
    
    if (periods2026.data) {
      periods2026.data.forEach((p: any) => {
        if (p.period != null && p.updatedAt) {
          periods.push({
            year: 2026,
            period: p.period,
            periodString: `P${String(p.period).padStart(2, '0')}`,
            updatedAt: p.updatedAt,
          })
        }
      })
    }

    // Sort by year desc, then period desc
    const sorted = periods.sort((a, b) => {
      if (a.year !== b.year) return b.year - a.year
      return b.period - a.period
    })

    return sorted
  }, [periods2025.data, periods2026.data])

  // Find the period with the latest updatedAt date
  const latestPeriodByDate = useMemo(() => {
    if (allPeriods.length === 0) return null
    
    return allPeriods.reduce((latest, current) => {
      const latestDate = new Date(latest.updatedAt).getTime()
      const currentDate = new Date(current.updatedAt).getTime()
      return currentDate > latestDate ? current : latest
    })
  }, [allPeriods])
  
  const periodsLoading = periods2025.isLoading || periods2026.isLoading

  // Fetch the full report for the latest period (same as PL.tsx PeriodCard)
  const { data: latestPeriodReport, isLoading: latestReportLoading } = useSWR(
    latestPeriodByDate ? `/pl/${latestPeriodByDate.year}/${latestPeriodByDate.period}` : null,
    plReportFetcher,
    {
      revalidateOnFocus: false,
    }
  )

  // Calculate key metrics from plReport (same logic as PL.tsx PeriodCard)
  const calculateKeyMetrics = useMemo(() => {
    if (!latestPeriodReport) return null

    const summaryData = latestPeriodReport.summaryData || {}
    const lineItems = Array.isArray(latestPeriodReport.lineItems) ? latestPeriodReport.lineItems : []
    
    const metrics: any = {}

    // Net Sales
    if (summaryData.netSales !== undefined) {
      const netSales = summaryData.netSales || 0
      const priorYear = summaryData.netSalesPriorYear || 0
      const difference = netSales - priorYear
      const sss = priorYear !== 0 ? ((difference / priorYear) * 100) : 0
      metrics.netSales = {
        value: netSales,
        priorYear: priorYear,
        sss: sss,
        isPositive: difference > 0
      }
    }

    // Total Transactions
    if (summaryData.totalTransactions !== undefined) {
      const txItem = lineItems.find((item: any) => {
        const accountName = (item.ledgerAccount || '').toLowerCase().trim()
        return accountName === 'total transactions'
      })
      const transactions = summaryData.totalTransactions || 0
      const priorYear = txItem?.priorYear || 0
      const difference = transactions - priorYear
      const sst = priorYear !== 0 ? ((difference / priorYear) * 100) : 0
      metrics.totalTransactions = {
        value: transactions,
        priorYear: priorYear,
        sst: sst,
        isPositive: difference > 0
      }
    }

    // Check Average
    if (summaryData.checkAverage !== undefined) {
      const checkItem = lineItems.find((item: any) => {
        const accountName = (item.ledgerAccount || '').toLowerCase().trim()
        return accountName === 'check avg - net' || accountName.includes('check average')
      })
      const checkAvg = summaryData.checkAverage || 0
      const priorYear = checkItem?.priorYear || 0
      const difference = checkAvg - priorYear
      const changePercent = priorYear !== 0 ? ((difference / priorYear) * 100) : 0
      metrics.checkAverage = {
        value: checkAvg,
        priorYear: priorYear,
        changePercent: changePercent,
        isPositive: difference > 0
      }
    }

    // OLO%
    const pandaItem = lineItems.find((item: any) => {
      const accountName = (item.ledgerAccount || '').toLowerCase().trim()
      return accountName === 'panda digital %'
    })
    const thirdPartyItem = lineItems.find((item: any) => {
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
      const difference = currentOLO - priorYearOLO
      metrics.olo = {
        value: currentOLO,
        priorYear: priorYearOLO,
        difference: difference,
        isPositive: difference > 0
      }
    }

    // COGS
    if (summaryData.netSales && summaryData.costOfGoodsSold !== undefined) {
      const currentPercent = (summaryData.costOfGoodsSold / summaryData.netSales) * 100
      const priorYearPercent = summaryData.netSalesPriorYear && summaryData.costOfGoodsSoldPriorYear
        ? (summaryData.costOfGoodsSoldPriorYear / summaryData.netSalesPriorYear) * 100
        : 0
      const difference = currentPercent - priorYearPercent
      metrics.cogs = {
        value: currentPercent,
        priorYear: priorYearPercent,
        difference: difference,
        isPositive: difference < 0 // Для COGS меньше = лучше
      }
    }

    // Total Labor
    if (summaryData.netSales && summaryData.totalLabor !== undefined) {
      const currentPercent = (summaryData.totalLabor / summaryData.netSales) * 100
      const priorYearPercent = summaryData.netSalesPriorYear && summaryData.totalLaborPriorYear
        ? (summaryData.totalLaborPriorYear / summaryData.netSalesPriorYear) * 100
        : 0
      const difference = currentPercent - priorYearPercent
      metrics.totalLabor = {
        value: currentPercent,
        priorYear: priorYearPercent,
        difference: difference,
        isPositive: difference < 0 // Для Labor меньше = лучше
      }
    }

    // Controllable Profit
    if (summaryData.netSales && summaryData.controllableProfit !== undefined) {
      const currentPercent = (summaryData.controllableProfit / summaryData.netSales) * 100
      const priorYearPercent = summaryData.netSalesPriorYear && summaryData.controllableProfitPriorYear
        ? (summaryData.controllableProfitPriorYear / summaryData.netSalesPriorYear) * 100
        : 0
      const difference = currentPercent - priorYearPercent
      metrics.controllableProfit = {
        value: currentPercent,
        priorYear: priorYearPercent,
        difference: difference,
        isPositive: difference > 0
      }
    }

    // Restaurant Contribution (always calculate from Controllable Profit - Fixed Costs, same as PLPeriodDetail)
    if (summaryData.netSales && summaryData.controllableProfit !== undefined && summaryData.fixedCosts !== undefined) {
      const restaurantContribution = summaryData.controllableProfit - summaryData.fixedCosts
      const currentPercent = (restaurantContribution / summaryData.netSales) * 100
      let priorYearPercent = 0
      if (summaryData.netSalesPriorYear && summaryData.controllableProfitPriorYear !== undefined && summaryData.fixedCostsPriorYear !== undefined) {
        const priorYearRC = summaryData.controllableProfitPriorYear - summaryData.fixedCostsPriorYear
        priorYearPercent = (priorYearRC / summaryData.netSalesPriorYear) * 100
      }
      const difference = currentPercent - priorYearPercent
      metrics.restaurantContribution = {
        value: currentPercent,
        priorYear: priorYearPercent,
        difference: difference,
        isPositive: difference > 0
      }
    }

    // Rent $
    const rentMinItem = lineItems.find((item: any) => {
      const accountName = (item.ledgerAccount || '').toLowerCase().trim()
      return accountName === 'rent - min'
    })
    const rentOtherItem = lineItems.find((item: any) => {
      const accountName = (item.ledgerAccount || '').toLowerCase().trim()
      return accountName === 'rent - other'
    })
    if (rentMinItem || rentOtherItem) {
      const rentMin = (rentMinItem?.actuals || 0)
      const rentOther = (rentOtherItem?.actuals || 0)
      const rentMinPrior = (rentMinItem?.priorYear || 0)
      const rentOtherPrior = (rentOtherItem?.priorYear || 0)
      const currentRent = rentMin + rentOther
      const priorYearRent = rentMinPrior + rentOtherPrior
      const difference = currentRent - priorYearRent
      metrics.rent = {
        value: currentRent,
        priorYear: priorYearRent,
        difference: difference,
        isPositive: difference < 0 // Для Rent меньше = лучше
      }
    }

    // Flow Thru %
    if (summaryData.controllableProfit !== undefined && summaryData.controllableProfitPriorYear !== undefined &&
        summaryData.netSales !== undefined && summaryData.netSalesPriorYear !== undefined) {
      const cpDiff = summaryData.controllableProfit - summaryData.controllableProfitPriorYear
      const salesDiff = summaryData.netSales - summaryData.netSalesPriorYear
      const flowThru = salesDiff !== 0 ? ((cpDiff / salesDiff) * 100) : null
      if (flowThru !== null) {
        metrics.flowThru = {
          value: flowThru,
          isPositive: flowThru > 0
        }
      }
    }

    // Top Controllable
    const excludedKeywords = [
      'corporate advertising',
      'media',
      'local store marketing',
      'advertising',
      'credit card fees',
      'third party delivery fee',
      'restaurant expenses'
    ]
    const controllablesItems = lineItems.filter((item: any) => {
      const accountName = (item.ledgerAccount || '').toLowerCase().trim()
      return !excludedKeywords.some(keyword => accountName.includes(keyword)) &&
             (item.actuals || 0) > 0
    })
    if (controllablesItems.length > 0) {
      const topItem = controllablesItems.reduce((max: any, item: any) => {
        return (item.actuals || 0) > (max.actuals || 0) ? item : max
      })
      const topValue = topItem.actuals || 0
      const topPrior = topItem.priorYear || 0
      const difference = topValue - topPrior
      metrics.topControllable = {
        name: topItem.ledgerAccount || 'Unknown',
        value: topValue,
        priorYear: topPrior,
        difference: difference,
        isPositive: difference < 0 // Для расходов меньше = лучше
      }
    }

    return metrics
  }, [latestPeriodReport])

  const isLoading = periodsLoading || latestReportLoading || categoryLoading

  // Normalize CSV data using matrix normalization function
  const normalizeMatrix = useMemo(() => {
    return (rows: Array<Record<string, string>>, opts: {
      headerRow1?: number
      headerRow2?: number
      headerRow3?: number
      dataStart?: number
    } = {}) => {
      const headerRow1 = opts.headerRow1 ?? 0 // metric group row
      const headerRow2 = opts.headerRow2 ?? 1 // period row
      const headerRow3 = opts.headerRow3 ?? 2 // field row (Score/n)
      const dataStart = opts.dataStart ?? 3

      if (!rows?.length || rows.length <= dataStart) {
        return { columns: [], records: [] }
      }

      // Convert rows to format with "_N" keys for columns
      // First, get all unique keys from all rows to determine columns
      const allKeys = new Set<string>()
      rows.forEach(row => {
        Object.keys(row).forEach(key => allKeys.add(key))
      })

      // Convert rows to objects with "_N" keys (sorted by original key order)
      const sortedKeys = Array.from(allKeys).sort()
      const rowObjects = rows.map(row => {
        const obj: Record<string, string> = {}
        sortedKeys.forEach((key, idx) => {
          obj[`_${idx + 2}`] = row[key] || '-'
        })
        return obj
      })

      // 1) Collect column keys in order: "_2", "_3", ...
      const colKeys = Object.keys(rowObjects[headerRow1])
        .filter(k => /^_\d+$/.test(k))
        .sort((a, b) => Number(a.slice(1)) - Number(b.slice(1)))

      const h1 = rowObjects[headerRow1]
      const h2 = rowObjects[headerRow2]
      const h3 = rowObjects[headerRow3]

      // 2) Build column descriptors with "paths" using header propagation
      let lastMetric: string | null = null
      let lastPeriod: string | null = null

      const columns = colKeys.map((key) => {
        const top = (h1[key] ?? '').trim()
        const mid = (h2[key] ?? '').trim()
        const low = (h3[key] ?? '').trim()

        // propagate metric
        if (top && top !== '-') lastMetric = top
        // propagate period inside each metric block
        if (mid && mid !== '-') lastPeriod = mid

        const metric = (top && top !== '-') ? top : lastMetric
        const period = (mid && mid !== '-') ? mid : lastPeriod

        // low row usually has "Score" or "n" or "-"
        const field = (low && low !== '-') ? low : null

        return {
          key, // "_8"
          header: { top, mid, low }, // raw header cells
          path: { metric, period, field } // semantic path (may include null field)
        }
      })

      // helpers
      const parseValue = (v: any) => {
        if (v == null) return null
        const s = String(v).trim()
        if (s === '' || s === '-') return null

        // "55.6%" -> 55.6
        if (s.endsWith('%')) {
          const n = Number(s.replace('%', ''))
          return Number.isFinite(n) ? n : s
        }
        // "-7.6" -> -7.6
        const n = Number(s)
        return Number.isFinite(n) ? n : s
      }

      // 3) Normalize each data row
      const records = rowObjects.slice(dataStart).map((row, idx) => {
        const record: any = {
          rowIndex: dataStart + idx,
          raw: row,
          count: null,
          metrics: {}
        }

        // optional: treat column with "Count" in headerRow1 as Count
        const countCol = columns.find(c => c.header.top === 'Count')
        if (countCol) record.count = parseValue(row[countCol.key])

        columns.forEach((col) => {
          const rawCell = row[col.key]

          // Always preserve every cell in a rawCells map
          if (!record.rawCells) record.rawCells = {}
          record.rawCells[col.key] = rawCell

          const { metric, period, field } = col.path

          // Skip columns that have no semantic path
          if (!metric || !period) return

          // If this is the Count column, we already stored it
          if (col.header.top === 'Count') return

          // Build path: metrics[metric][period][field] = value
          const safeField = field ?? '__value__'

          const valueParsed = parseValue(rawCell)
          const valueRaw = rawCell

          if (!record.metrics[metric]) record.metrics[metric] = {}
          if (!record.metrics[metric][period]) record.metrics[metric][period] = {}

          record.metrics[metric][period][safeField] = {
            value: valueParsed,
            raw: valueRaw
          }
        })

        return record
      })

      return { columns, records }
    }
  }, [])

  // Normalize CSV data to structured format using matrix normalization
  const normalizedCsvData = useMemo(() => {
    if (!csvRawRows || csvRawRows.length === 0) {
      return null
    }

    // Convert raw rows to format with "_N" keys for columns
    // First, get all unique keys from all rows to determine columns
    const allKeys = new Set<string>()
    csvRawRows.forEach(row => {
      Object.keys(row).forEach(key => allKeys.add(key))
    })

    // Convert rows to objects with "_N" keys (sorted by original key order)
    const sortedKeys = Array.from(allKeys).sort()
    const rowObjects = csvRawRows.map(row => {
      const obj: Record<string, string> = {}
      sortedKeys.forEach((key, idx) => {
        obj[`_${idx + 2}`] = (row[key] || '').toString().trim() || '-'
      })
      return obj
    })

    // Use normalizeMatrix function
    const normalizeFn = normalizeMatrix
    const normalized = normalizeFn(rowObjects, {
      headerRow1: 0,
      headerRow2: 1,
      headerRow3: 2,
      dataStart: 3
    })

    return normalized.records.length > 0 ? normalized : null
  }, [csvRawRows, normalizeMatrix])

  const handleCSVUpload = async (file: File) => {
    setIsParsingCsv(true)
    setCsvError(null)
    try {
      // Parse for processed data
      const parsed = await parseCSVFile(file)
      setCsvData(parsed)
      
      // Parse CSV without headers to get raw column indices
      // This way we can reliably extract values by column position
      const rawRows = await new Promise<Array<string[]>>((resolve, reject) => {
        Papa.parse(file, {
          header: false,
          skipEmptyLines: false,
          complete: (results) => {
            resolve(results.data as Array<string[]>)
          },
          error: (error) => {
            reject(error)
          }
        })
      })
      
      // Convert to objects with "_N" keys (starting from _1 for column 0)
      // Based on CSV structure (row 6, 0-indexed):
      // Column 3 (index 3, key _4): "66" = Count
      // Column 9 (index 9, key _10): "60.70%" = Taste of Food
      // Column 14 (index 14, key _15): "72.10%" = Accuracy of Order
      const normalizedRows = rawRows.map((row) => {
        const obj: Record<string, string> = {}
        row.forEach((value, colIdx) => {
          // Use _1, _2, _3... for columns 0, 1, 2... (colIdx + 1)
          obj[`_${colIdx + 1}`] = (value || '').toString().trim()
        })
        return obj
      })
      
      setCsvRawRows(normalizedRows)
      
      // Save entire JSON to database (with normalized keys)
      try {
        console.log('Saving full JSON to database...', normalizedRows)
        const saved = await saveGemData({ rawJson: normalizedRows })
        console.log('JSON saved successfully:', saved)
        mutateGemData() // Refresh gem data
      } catch (error) {
        console.error('Failed to save JSON data:', error)
        // Don't fail the CSV upload if gem save fails
      }
      
      setCsvFileName(file.name)
    } catch (error: any) {
      setCsvError(error.message || 'Failed to parse CSV file')
      setCsvData(null)
      setCsvRawRows(null)
    } finally {
      setIsParsingCsv(false)
    }
  }

  const handleFileButtonClick = () => {
    fileInputRef.current?.click()
  }

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      handleCSVUpload(file)
    }
    // Reset input so the same file can be selected again
    if (fileInputRef.current) {
      fileInputRef.current.value = ''
    }
  }

  return (
    <div className="flex flex-col gap-6">
      {/* Test Card - Display Key Values */}
      <div className="rounded-xl border border-primary/20 bg-card/40 backdrop-blur-sm p-6 md:p-8 shadow-lg">
        <div className="mb-6">
          <div className="flex items-center justify-between mb-2">
            <h3 className="text-xl font-bold text-foreground">Key Metrics (Test Card)</h3>
            <Button 
              onClick={handleFileButtonClick}
              disabled={isParsingCsv}
              variant="outline"
            >
              Update
            </Button>
            <input
              ref={fileInputRef}
              type="file"
              accept=".csv,text/csv"
              onChange={handleFileChange}
              className="hidden"
            />
          </div>
          <div className="h-1 w-16 bg-primary/60 rounded-full"></div>
          <p className="text-sm text-muted-foreground mt-2">
            Displaying extracted values from CSV data
          </p>
          {csvError && (
            <div className="mt-4 p-3 rounded-lg border border-red-500/30 bg-red-950/20 text-red-400 text-sm">
              Error: {csvError}
            </div>
          )}
          {csvFileName && !csvError && (
            <div className="mt-2 text-sm text-muted-foreground">
              File loaded: {csvFileName} ({csvData?.data.length || 0} rows)
            </div>
          )}
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {(() => {
            // Extract values from gemData or csvRawRows
            let count = ''
            let tasteOfFoodPercent = ''
            let accuracyOfOrderPercent = ''
            
            const dataSource = csvRawRows || (gemData?.rawJson as any)
            
            if (dataSource && Array.isArray(dataSource)) {
              // Find the row with data (look for row where _4 is a number and _10/_15 are percentages)
              // Start from the end and work backwards to find the last data row
              let dataRow = null
              for (let i = dataSource.length - 1; i >= 0; i--) {
                const row = dataSource[i]
                if (row && row._4) {
                  const countValue = String(row._4).trim()
                  const tasteValue = String(row._10 || '').trim()
                  const accuracyValue = String(row._15 || '').trim()
                  
                  // Check if _4 looks like a count (number) and _10/_15 look like percentages
                  if (/^\d+$/.test(countValue) && (/%/.test(tasteValue) || /%/.test(accuracyValue))) {
                    dataRow = row
                    break
                  }
                }
              }
              
              if (dataRow) {
                count = dataRow._4 || ''
                tasteOfFoodPercent = dataRow._10 || ''
                accuracyOfOrderPercent = dataRow._15 || ''
              }
            }
            
            // Calculate counts from percentages
            const totalCount = parseInt(count) || 0
            const tasteOfFoodCount = tasteOfFoodPercent 
              ? Math.round(totalCount * (parseFloat(tasteOfFoodPercent.replace('%', '')) / 100))
              : 0
            const accuracyOfOrderCount = accuracyOfOrderPercent
              ? Math.round(totalCount * (parseFloat(accuracyOfOrderPercent.replace('%', '')) / 100))
              : 0
            
            // Calculate how many more needed to reach 75%
            const targetPercent = 75
            const targetCount = Math.round(totalCount * (targetPercent / 100))
            const tasteOfFoodNeeded = Math.max(0, targetCount - tasteOfFoodCount)
            const accuracyOfOrderNeeded = Math.max(0, targetCount - accuracyOfOrderCount)
            
            return (
              <>
                <div className="rounded-lg border border-primary/30 bg-card/60 p-4 text-center md:col-span-2">
                  <div className="text-sm text-muted-foreground mb-2">Total Surveys</div>
                  <div className="text-3xl font-bold" style={{ color: '#ef4444' }}>
                    {count || 'N/A'}
                  </div>
                </div>
                <Card className="flex flex-col">
                  <CardHeader className="items-center pb-0">
                    <CardTitle className="text-lg">Taste of Food</CardTitle>
                  </CardHeader>
                  <CardContent className="flex-1 pb-0">
                    {totalCount > 0 && tasteOfFoodCount > 0 ? (
                      <ChartContainer
                        config={{
                          positive: {
                            label: "Positive",
                            color: "hsl(180, 100%, 50%)",
                          },
                        }}
                        className="mx-auto aspect-square max-h-[200px]"
                      >
                        <RadialBarChart
                          data={[{ positive: tasteOfFoodCount, fill: "hsl(180, 100%, 50%)" }]}
                          startAngle={0}
                          endAngle={250}
                          innerRadius={60}
                          outerRadius={90}
                        >
                          <PolarGrid
                            gridType="circle"
                            radialLines={false}
                            stroke="none"
                            className="first:fill-muted last:fill-background"
                            polarRadius={[66, 54]}
                          />
                          <RadialBar 
                            dataKey="positive" 
                            background 
                            cornerRadius={10}
                            max={totalCount}
                          />
                          <PolarRadiusAxis tick={false} tickLine={false} axisLine={false}>
                            <Label
                              content={({ viewBox }) => {
                                if (viewBox && "cx" in viewBox && "cy" in viewBox) {
                                  return (
                                    <text
                                      x={viewBox.cx}
                                      y={viewBox.cy}
                                      textAnchor="middle"
                                      dominantBaseline="middle"
                                    >
                                      <tspan
                                        x={viewBox.cx}
                                        y={viewBox.cy}
                                        className="fill-foreground text-3xl font-bold"
                                        style={{ fill: '#ef4444' }}
                                      >
                                        {tasteOfFoodCount}
                                      </tspan>
                                      <tspan
                                        x={viewBox.cx}
                                        y={(viewBox.cy || 0) + 20}
                                        className="fill-muted-foreground text-sm"
                                      >
                                        {tasteOfFoodPercent || ''}
                                      </tspan>
                                    </text>
                                  )
                                }
                              }}
                            />
                          </PolarRadiusAxis>
                        </RadialBarChart>
                      </ChartContainer>
                    ) : (
                      <div className="text-center py-8 text-muted-foreground">
                        No data available
                      </div>
                    )}
                  </CardContent>
                  {tasteOfFoodNeeded > 0 && (
                    <CardFooter className="flex-col gap-2 text-sm pt-2 pb-4">
                      <div className="text-yellow-400 font-semibold">
                        Need {tasteOfFoodNeeded} more for 75%
                      </div>
                    </CardFooter>
                  )}
                  {tasteOfFoodNeeded === 0 && tasteOfFoodCount > 0 && (
                    <CardFooter className="flex-col gap-2 text-sm pt-2 pb-4">
                      <div className="text-green-400 font-semibold">
                        ✓ Goal achieved (75%)
                      </div>
                    </CardFooter>
                  )}
                </Card>
                <Card className="flex flex-col">
                  <CardHeader className="items-center pb-0">
                    <CardTitle className="text-lg">Accuracy of Order</CardTitle>
                  </CardHeader>
                  <CardContent className="flex-1 pb-0">
                    {totalCount > 0 && accuracyOfOrderCount > 0 ? (
                      <ChartContainer
                        config={{
                          positive: {
                            label: "Positive",
                            color: "hsl(180, 100%, 50%)",
                          },
                        }}
                        className="mx-auto aspect-square max-h-[200px]"
                      >
                        <RadialBarChart
                          data={[{ positive: accuracyOfOrderCount, fill: "hsl(180, 100%, 50%)" }]}
                          startAngle={0}
                          endAngle={250}
                          innerRadius={60}
                          outerRadius={90}
                        >
                          <PolarGrid
                            gridType="circle"
                            radialLines={false}
                            stroke="none"
                            className="first:fill-muted last:fill-background"
                            polarRadius={[66, 54]}
                          />
                          <RadialBar 
                            dataKey="positive" 
                            background 
                            cornerRadius={10}
                            max={totalCount}
                          />
                          <PolarRadiusAxis tick={false} tickLine={false} axisLine={false}>
                            <Label
                              content={({ viewBox }) => {
                                if (viewBox && "cx" in viewBox && "cy" in viewBox) {
                                  return (
                                    <text
                                      x={viewBox.cx}
                                      y={viewBox.cy}
                                      textAnchor="middle"
                                      dominantBaseline="middle"
                                    >
                                      <tspan
                                        x={viewBox.cx}
                                        y={viewBox.cy}
                                        className="fill-foreground text-3xl font-bold"
                                        style={{ fill: '#ef4444' }}
                                      >
                                        {accuracyOfOrderCount}
                                      </tspan>
                                      <tspan
                                        x={viewBox.cx}
                                        y={(viewBox.cy || 0) + 20}
                                        className="fill-muted-foreground text-sm"
                                      >
                                        {accuracyOfOrderPercent || ''}
                                      </tspan>
                                    </text>
                                  )
                                }
                              }}
                            />
                          </PolarRadiusAxis>
                        </RadialBarChart>
                      </ChartContainer>
                    ) : (
                      <div className="text-center py-8 text-muted-foreground">
                        No data available
                      </div>
                    )}
                  </CardContent>
                  {accuracyOfOrderNeeded > 0 && (
                    <CardFooter className="flex-col gap-2 text-sm pt-2 pb-4">
                      <div className="text-yellow-400 font-semibold">
                        Need {accuracyOfOrderNeeded} more for 75%
                      </div>
                    </CardFooter>
                  )}
                  {accuracyOfOrderNeeded === 0 && accuracyOfOrderCount > 0 && (
                    <CardFooter className="flex-col gap-2 text-sm pt-2 pb-4">
                      <div className="text-green-400 font-semibold">
                        ✓ Goal achieved (75%)
                      </div>
                    </CardFooter>
                  )}
                </Card>
              </>
            )
          })()}
        </div>
      </div>

      {/* Latest Period Card - Show only the latest period by date */}
      {latestPeriodByDate && latestPeriodReport && (
        <div className="rounded-xl border border-primary/20 bg-card/40 backdrop-blur-sm p-6 md:p-8 shadow-lg">
          <div className="mb-6">
            <h3 className="text-xl font-bold text-foreground mb-2">Latest P&L Period</h3>
            <div className="h-1 w-16 bg-primary/60 rounded-full"></div>
          </div>
          
          <div className="rounded-lg border border-primary/20 bg-card/60 p-4 mb-6">
            <div className="flex items-center justify-between mb-2">
              <div>
                <h4 className="text-lg font-semibold text-foreground">
                  {latestPeriodByDate.periodString} ({latestPeriodByDate.year})
                </h4>
                {latestPeriodReport.storeName && (
                  <p className="text-sm text-muted-foreground mt-1">
                    {latestPeriodReport.storeName} • {latestPeriodReport.company}
                  </p>
                )}
              </div>
            </div>
            <p className="text-xs text-muted-foreground">
              Updated: {new Date(latestPeriodByDate.updatedAt).toLocaleDateString('en-US', {
                month: 'short',
                day: 'numeric',
                year: 'numeric',
                hour: '2-digit',
                minute: '2-digit'
              })}
            </p>
          </div>

          {/* Key Metrics for Latest Period - Same display as PLPeriodDetail */}
          {isLoading ? (
            <div className="text-center py-8 text-muted-foreground">
              Loading key metrics for {latestPeriodByDate.periodString} ({latestPeriodByDate.year})...
            </div>
          ) : calculateKeyMetrics ? (
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {/* Net Sales */}
              {calculateKeyMetrics.netSales && (
                <div className="rounded-lg border border-primary/20 bg-card/60 p-4">
                  <div className="text-sm font-medium text-muted-foreground mb-1">Net Sales</div>
                  <div className="flex items-center gap-2 mb-1">
                    <div className="text-2xl font-bold text-foreground">
                      ${(calculateKeyMetrics.netSales.value || 0).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                    </div>
                    {calculateKeyMetrics.netSales.sss !== undefined && (
                      <>
                        {calculateKeyMetrics.netSales.isPositive ? (
                          <ArrowUp className="h-5 w-5 text-green-500" />
                        ) : (
                          <ArrowDown className="h-5 w-5 text-red-500" />
                        )}
                        <div className={`text-sm font-semibold ${calculateKeyMetrics.netSales.isPositive ? 'text-green-500' : 'text-red-500'}`}>
                          SSS: {calculateKeyMetrics.netSales.isPositive ? '+' : ''}{calculateKeyMetrics.netSales.sss.toFixed(2)}%
                        </div>
                      </>
                    )}
                  </div>
                  {calculateKeyMetrics.netSales.priorYear !== undefined && (
                    <div className="text-xs text-muted-foreground">
                      Prior Year: ${calculateKeyMetrics.netSales.priorYear.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                    </div>
                  )}
                </div>
              )}

              {/* Total Transactions */}
              {calculateKeyMetrics.totalTransactions && (
                <div className="rounded-lg border border-primary/20 bg-card/60 p-4">
                  <div className="text-sm font-medium text-muted-foreground mb-1">Total Transactions</div>
                  <div className="flex items-center gap-2 mb-1">
                    <div className="text-2xl font-bold text-foreground">
                      {(calculateKeyMetrics.totalTransactions.value || 0).toLocaleString('en-US')}
                    </div>
                    {calculateKeyMetrics.totalTransactions.sst !== undefined && calculateKeyMetrics.totalTransactions.priorYear > 0 && (
                      <>
                        {calculateKeyMetrics.totalTransactions.isPositive ? (
                          <ArrowUp className="h-5 w-5 text-green-500" />
                        ) : (
                          <ArrowDown className="h-5 w-5 text-red-500" />
                        )}
                        <div className={`text-sm font-semibold ${calculateKeyMetrics.totalTransactions.isPositive ? 'text-green-500' : 'text-red-500'}`}>
                          SST: {calculateKeyMetrics.totalTransactions.isPositive ? '+' : ''}{calculateKeyMetrics.totalTransactions.sst.toFixed(2)}%
                        </div>
                      </>
                    )}
                  </div>
                  {calculateKeyMetrics.totalTransactions.priorYear !== undefined && calculateKeyMetrics.totalTransactions.priorYear > 0 && (
                    <div className="text-xs text-muted-foreground">
                      Prior Year: {calculateKeyMetrics.totalTransactions.priorYear.toLocaleString('en-US')}
                    </div>
                  )}
                </div>
              )}

              {/* Check Average */}
              {calculateKeyMetrics.checkAverage && (
                <div className="rounded-lg border border-primary/20 bg-card/60 p-4">
                  <div className="text-sm font-medium text-muted-foreground mb-1">Check Average</div>
                  <div className="flex items-center gap-2 mb-1">
                    <div className="text-2xl font-bold text-foreground">
                      ${(calculateKeyMetrics.checkAverage.value || 0).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                    </div>
                    {calculateKeyMetrics.checkAverage.changePercent !== undefined && calculateKeyMetrics.checkAverage.priorYear > 0 && (
                      <>
                        {calculateKeyMetrics.checkAverage.isPositive ? (
                          <ArrowUp className="h-5 w-5 text-green-500" />
                        ) : (
                          <ArrowDown className="h-5 w-5 text-red-500" />
                        )}
                        <div className={`text-sm font-semibold ${calculateKeyMetrics.checkAverage.isPositive ? 'text-green-500' : 'text-red-500'}`}>
                          {calculateKeyMetrics.checkAverage.isPositive ? '+' : ''}{calculateKeyMetrics.checkAverage.changePercent.toFixed(2)}%
                        </div>
                      </>
                    )}
                  </div>
                  {calculateKeyMetrics.checkAverage.priorYear !== undefined && calculateKeyMetrics.checkAverage.priorYear > 0 && (
                    <div className="text-xs text-muted-foreground">
                      Prior Year: ${(calculateKeyMetrics.checkAverage.priorYear || 0).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                    </div>
                  )}
                </div>
              )}

              {/* OLO% */}
              {calculateKeyMetrics.olo && (
                <div className="rounded-lg border border-primary/20 bg-card/60 p-4">
                  <div className="text-sm font-medium text-muted-foreground mb-1">OLO%</div>
                  <div className="flex items-center gap-2 mb-1">
                    <div className="text-2xl font-bold text-foreground">
                      {(calculateKeyMetrics.olo.value || 0).toFixed(2)}%
                    </div>
                    {calculateKeyMetrics.olo.isPositive ? (
                      <ArrowUp className="h-5 w-5 text-green-500" />
                    ) : (
                      <ArrowDown className="h-5 w-5 text-red-500" />
                    )}
                    <div className={`text-sm font-semibold ${calculateKeyMetrics.olo.isPositive ? 'text-green-500' : 'text-red-500'}`}>
                      {calculateKeyMetrics.olo.isPositive ? '+' : ''}{(calculateKeyMetrics.olo.difference || 0).toFixed(2)}pp
                    </div>
                  </div>
                  {calculateKeyMetrics.olo.priorYear !== undefined && (
                    <div className="text-xs text-muted-foreground">
                      Prior Year: {calculateKeyMetrics.olo.priorYear.toFixed(2)}%
                    </div>
                  )}
                </div>
              )}

              {/* COGS */}
              {calculateKeyMetrics.cogs && (
                <div className="rounded-lg border border-primary/20 bg-card/60 p-4">
                  <div className="text-sm font-medium text-muted-foreground mb-1">COGS</div>
                  <div className="flex items-center gap-2 mb-1">
                    <div className="text-2xl font-bold text-foreground">
                      {(calculateKeyMetrics.cogs.value || 0).toFixed(2)}%
                    </div>
                    {calculateKeyMetrics.cogs.isPositive ? (
                      <ArrowDown className="h-5 w-5 text-green-500" />
                    ) : (
                      <ArrowUp className="h-5 w-5 text-red-500" />
                    )}
                    <div className={`text-sm font-semibold ${calculateKeyMetrics.cogs.isPositive ? 'text-green-500' : 'text-red-500'}`}>
                      {calculateKeyMetrics.cogs.isPositive ? '' : '+'}{(calculateKeyMetrics.cogs.difference || 0).toFixed(2)}pp
                    </div>
                  </div>
                  {calculateKeyMetrics.cogs.priorYear !== undefined && (
                    <div className="text-xs text-muted-foreground">
                      Prior Year: {calculateKeyMetrics.cogs.priorYear.toFixed(2)}%
                    </div>
                  )}
                </div>
              )}

              {/* Total Labor */}
              {calculateKeyMetrics.totalLabor && (
                <div className="rounded-lg border border-primary/20 bg-card/60 p-4">
                  <div className="text-sm font-medium text-muted-foreground mb-1">Total Labor</div>
                  <div className="flex items-center gap-2 mb-1">
                    <div className="text-2xl font-bold text-foreground">
                      {(calculateKeyMetrics.totalLabor.value || 0).toFixed(2)}%
                    </div>
                    {calculateKeyMetrics.totalLabor.isPositive ? (
                      <ArrowDown className="h-5 w-5 text-green-500" />
                    ) : (
                      <ArrowUp className="h-5 w-5 text-red-500" />
                    )}
                    <div className={`text-sm font-semibold ${calculateKeyMetrics.totalLabor.isPositive ? 'text-green-500' : 'text-red-500'}`}>
                      {calculateKeyMetrics.totalLabor.isPositive ? '' : '+'}{(calculateKeyMetrics.totalLabor.difference || 0).toFixed(2)}pp
                    </div>
                  </div>
                  {calculateKeyMetrics.totalLabor.priorYear !== undefined && (
                    <div className="text-xs text-muted-foreground">
                      Prior Year: {calculateKeyMetrics.totalLabor.priorYear.toFixed(2)}%
                    </div>
                  )}
                </div>
              )}

              {/* Controllable Profit */}
              {calculateKeyMetrics.controllableProfit && (
                <div className="rounded-lg border border-primary/20 bg-card/60 p-4">
                  <div className="text-sm font-medium text-muted-foreground mb-1">Controllable Profit</div>
                  <div className="flex items-center gap-2 mb-1">
                    <div className="text-2xl font-bold text-foreground">
                      {(calculateKeyMetrics.controllableProfit.value || 0).toFixed(2)}%
                    </div>
                    {calculateKeyMetrics.controllableProfit.isPositive ? (
                      <ArrowUp className="h-5 w-5 text-green-500" />
                    ) : (
                      <ArrowDown className="h-5 w-5 text-red-500" />
                    )}
                    <div className={`text-sm font-semibold ${calculateKeyMetrics.controllableProfit.isPositive ? 'text-green-500' : 'text-red-500'}`}>
                      {calculateKeyMetrics.controllableProfit.isPositive ? '+' : ''}{(calculateKeyMetrics.controllableProfit.difference || 0).toFixed(2)}pp
                    </div>
                  </div>
                  {calculateKeyMetrics.controllableProfit.priorYear !== undefined && (
                    <div className="text-xs text-muted-foreground">
                      Prior Year: {calculateKeyMetrics.controllableProfit.priorYear.toFixed(2)}%
                    </div>
                  )}
                </div>
              )}

              {/* Restaurant Contribution */}
              {calculateKeyMetrics.restaurantContribution && (() => {
                const summaryData = latestPeriodReport?.summaryData || {}
                const hasPriorYear = summaryData.netSalesPriorYear && 
                                    summaryData.controllableProfitPriorYear !== undefined && 
                                    summaryData.fixedCostsPriorYear !== undefined
                
                return (
                  <div className="rounded-lg border border-primary/20 bg-card/60 p-4">
                    <div className="text-sm font-medium text-muted-foreground mb-1">Restaurant Contribution</div>
                    <div className="flex items-center gap-2 mb-1">
                      <div className="text-2xl font-bold text-foreground">
                        {(calculateKeyMetrics.restaurantContribution.value || 0).toFixed(2)}%
                      </div>
                      {hasPriorYear && (
                        <>
                          {calculateKeyMetrics.restaurantContribution.isPositive ? (
                            <ArrowUp className="h-5 w-5 text-green-500" />
                          ) : (
                            <ArrowDown className="h-5 w-5 text-red-500" />
                          )}
                          <div className={`text-sm font-semibold ${calculateKeyMetrics.restaurantContribution.isPositive ? 'text-green-500' : 'text-red-500'}`}>
                            {calculateKeyMetrics.restaurantContribution.isPositive ? '+' : ''}{(calculateKeyMetrics.restaurantContribution.difference || 0).toFixed(2)}pp
                          </div>
                        </>
                      )}
                    </div>
                    {hasPriorYear && (
                      <div className="text-xs text-muted-foreground">
                        Prior Year: {calculateKeyMetrics.restaurantContribution.priorYear.toFixed(2)}%
                      </div>
                    )}
                    <div className="text-xs text-muted-foreground mt-1 italic">
                      = Controllable Profit - Fixed Cost
                    </div>
                  </div>
                )
              })()}

              {/* Rent $ */}
              {calculateKeyMetrics.rent && (
                <div className="rounded-lg border border-primary/20 bg-card/60 p-4">
                  <div className="text-sm font-medium text-muted-foreground mb-1">Rent $</div>
                  <div className="flex items-center gap-2 mb-1">
                    <div className="text-2xl font-bold text-foreground">
                      ${(calculateKeyMetrics.rent.value || 0).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                    </div>
                    {calculateKeyMetrics.rent.isPositive ? (
                      <ArrowDown className="h-5 w-5 text-green-500" />
                    ) : (
                      <ArrowUp className="h-5 w-5 text-red-500" />
                    )}
                    <div className={`text-sm font-semibold ${calculateKeyMetrics.rent.isPositive ? 'text-green-500' : 'text-red-500'}`}>
                      {calculateKeyMetrics.rent.isPositive ? '' : '+'}${Math.abs(calculateKeyMetrics.rent.difference || 0).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                    </div>
                  </div>
                  {calculateKeyMetrics.rent.priorYear !== undefined && (
                    <div className="text-xs text-muted-foreground">
                      Prior Year: ${(calculateKeyMetrics.rent.priorYear || 0).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                    </div>
                  )}
                  <div className="text-xs text-muted-foreground mt-1 italic">
                    = Rent - MIN + Rent - Other
                  </div>
                </div>
              )}

              {/* Flow Thru %} */}
              {calculateKeyMetrics.flowThru && calculateKeyMetrics.flowThru.value !== null && (
                <div className="rounded-lg border border-primary/20 bg-card/60 p-4">
                  <div className="text-sm font-medium text-muted-foreground mb-1">Flow Thru %</div>
                  <div className="flex items-center gap-2 mb-1">
                    <div className="text-2xl font-bold text-foreground">
                      {(calculateKeyMetrics.flowThru.value || 0).toFixed(2)}%
                    </div>
                    {calculateKeyMetrics.flowThru.isPositive ? (
                      <ArrowUp className="h-5 w-5 text-green-500" />
                    ) : (
                      <ArrowDown className="h-5 w-5 text-red-500" />
                    )}
                  </div>
                  <div className="text-xs text-muted-foreground mt-1 italic">
                    = (CP Actual - CP Prior) / (NS Actual - NS Prior) × 100
                  </div>
                </div>
              )}

              {/* Top Controllable */}
              {calculateKeyMetrics.topControllable && (
                <div className="rounded-lg border border-primary/20 bg-card/60 p-4">
                  <div className="text-sm font-medium text-muted-foreground mb-1">Top Controllable</div>
                  <div className="text-xs font-semibold text-foreground mb-2 truncate" title={calculateKeyMetrics.topControllable.name}>
                    {calculateKeyMetrics.topControllable.name}
                  </div>
                  <div className="flex items-center gap-2 mb-1">
                    <div className="text-2xl font-bold text-foreground">
                      ${(calculateKeyMetrics.topControllable.value || 0).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                    </div>
                    {calculateKeyMetrics.topControllable.isPositive ? (
                      <ArrowDown className="h-5 w-5 text-green-500" />
                    ) : (
                      <ArrowUp className="h-5 w-5 text-red-500" />
                    )}
                    <div className={`text-sm font-semibold ${calculateKeyMetrics.topControllable.isPositive ? 'text-green-500' : 'text-red-500'}`}>
                      {calculateKeyMetrics.topControllable.isPositive ? '' : '+'}${Math.abs(calculateKeyMetrics.topControllable.difference || 0).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                    </div>
                  </div>
                  {calculateKeyMetrics.topControllable.priorYear !== undefined && calculateKeyMetrics.topControllable.priorYear > 0 && (
                    <div className="text-xs text-muted-foreground">
                      Prior Year: ${(calculateKeyMetrics.topControllable.priorYear || 0).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                    </div>
                  )}
                </div>
              )}
            </div>
          ) : null}
        </div>
      )}

      {/* Quick Actions */}
      <div className="rounded-xl border border-primary/20 bg-card/40 backdrop-blur-sm p-6 md:p-8 shadow-lg">
        <div className="mb-6">
          <h3 className="text-xl font-bold text-foreground mb-2">Quick Actions</h3>
          <div className="h-1 w-16 bg-primary/60 rounded-full"></div>
        </div>
        
        <div className="grid gap-4 md:grid-cols-2">
          <Link to="/store-data">
            <div className="rounded-lg border border-primary/20 bg-card/60 p-6 hover:border-primary/40 transition-all cursor-pointer">
              <h4 className="font-semibold text-foreground mb-2">Manage Products</h4>
              <p className="text-sm text-muted-foreground">
                View and edit product data, upload PDF files
              </p>
            </div>
          </Link>
          <Link to="/reports">
            <div className="rounded-lg border border-primary/20 bg-card/60 p-6 hover:border-primary/40 transition-all cursor-pointer">
              <h4 className="font-semibold text-foreground mb-2">View Reports</h4>
              <p className="text-sm text-muted-foreground">
                Generate reports and export data
              </p>
            </div>
          </Link>
        </div>
      </div>
    </div>
  )
}

