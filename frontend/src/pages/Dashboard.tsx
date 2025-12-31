import { useMemo, useState, useEffect, useRef } from 'react'
import useSWR from 'swr'
import { Link } from 'react-router-dom'
import { getCategorySummary, type CategorySummary } from '@/utils/productsApi'
import { plPeriodsFetcher, plReportFetcher } from '@/utils/plApi'
import { Skeleton } from '@/components/ui/skeleton'
import { Button } from '@/components/ui/button'
import { ArrowUp, ArrowDown, TrendingUp } from 'lucide-react'
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

function CategoryCard({ category }: { category: CategorySummary }) {
  return (
    <div className="rounded-lg border border-primary/20 bg-card/60 p-4 hover:border-primary/40 transition-all">
      <div className="flex items-center justify-between mb-3">
        <h4 className="font-semibold text-foreground">{category.group}</h4>
        <span className="text-sm text-muted-foreground">{category.productCount} products</span>
      </div>
      <div className="grid grid-cols-2 gap-3 text-sm">
        <div>
          <div className="text-muted-foreground text-xs mb-1">Avg Usage</div>
          <div className="font-medium text-foreground">{category.averageUsage.toFixed(2)}</div>
        </div>
        <div>
          <div className="text-muted-foreground text-xs mb-1">Avg CS/1k</div>
          <div className="font-medium text-foreground">
            {category.averageCsPer1k > 0 ? category.averageCsPer1k.toFixed(2) : '-'}
          </div>
        </div>
        <div className="col-span-2">
          <div className="flex items-center justify-between text-xs mb-1">
            <span className="text-muted-foreground">Conversion Rate</span>
            <span className="font-medium text-foreground">{category.conversionRate.toFixed(1)}%</span>
          </div>
          <div className="w-full bg-primary/10 rounded-full h-2">
            <div
              className="bg-primary h-2 rounded-full transition-all"
              style={{ width: `${Math.min(category.conversionRate, 100)}%` }}
            />
          </div>
        </div>
      </div>
    </div>
  )
}

function RadialChartCard({ 
  title, 
  description, 
  dataKey1,
  dataKey2,
  dataValue1,
  dataValue2,
  label1,
  label2,
  color1,
  color2,
  totalLabel,
  totalSurveys,
  trend,
  trendLabel
}: { 
  title: string
  description: string
  dataKey1: string
  dataKey2: string
  dataValue1: number
  dataValue2: number
  label1: string
  label2: string
  color1: string
  color2: string
  totalLabel: string
  totalSurveys?: number
  trend?: string
  trendLabel?: string
}) {
  const chartData = [
    { [dataKey1]: dataValue1, [dataKey2]: dataValue2 },
  ]

  const chartConfig = {
    [dataKey1]: {
      label: label1,
      color: color1,
    },
    [dataKey2]: {
      label: label2,
      color: color2,
    },
  } satisfies ChartConfig

  return (
    <Card className="flex flex-col">
      <CardHeader className="items-center pb-0">
        <CardTitle className="mb-4">{title}</CardTitle>
        {description && <CardDescription>{description}</CardDescription>}
      </CardHeader>
      <CardContent className="flex flex-1 items-center pb-2">
        <ChartContainer
          config={chartConfig}
          className="mx-auto aspect-square w-full max-w-[250px]"
        >
          <RadialBarChart
            data={chartData}
            startAngle={180}
            endAngle={0}
            innerRadius={80}
            outerRadius={130}
          >
            <ChartTooltip
              cursor={false}
              content={<ChartTooltipContent hideLabel />}
            />
            <PolarRadiusAxis tick={false} tickLine={false} axisLine={false}>
              <Label
                content={({ viewBox }) => {
                  if (viewBox && "cx" in viewBox && "cy" in viewBox) {
                    const total = dataValue1 + dataValue2
                    const percentage = total > 0 ? Math.round((dataValue1 / total) * 100) : 0
                    return (
                      <text x={viewBox.cx} y={viewBox.cy} textAnchor="middle">
                        <tspan
                          x={viewBox.cx}
                          y={viewBox.cy}
                          className="fill-foreground text-2xl font-bold"
                        >
                          {percentage}{totalLabel}
                        </tspan>
                      </text>
                    )
                  }
                }}
              />
            </PolarRadiusAxis>
            <RadialBar
              dataKey={dataKey1}
              stackId="a"
              cornerRadius={5}
              fill={`var(--color-${dataKey1})`}
              className="stroke-transparent stroke-2"
            />
            <RadialBar
              dataKey={dataKey2}
              fill={`var(--color-${dataKey2})`}
              stackId="a"
              cornerRadius={5}
              className="stroke-transparent stroke-2"
            />
          </RadialBarChart>
        </ChartContainer>
      </CardContent>
      {totalSurveys && (
        <CardFooter className="flex-col gap-2 text-sm pt-0 pb-4">
          <div className="text-muted-foreground text-center leading-none">
            {dataValue1} out of {totalSurveys} surveys
          </div>
        </CardFooter>
      )}
      {trend && (
        <CardFooter className="flex-col gap-2 text-sm">
          <div className="flex items-center gap-2 leading-none font-medium">
            {trend} <TrendingUp className="h-4 w-4" />
          </div>
          {trendLabel && (
            <div className="text-muted-foreground leading-none">
              {trendLabel}
            </div>
          )}
        </CardFooter>
      )}
    </Card>
  )
}

// Function to extract gem data from CSV rows
function extractGemData(rawRows: Array<Record<string, string>>): { count: string; tasteOfFood: string; accuracyOfOrder: string } | null {
  // Convert rows to format with "_N" keys for columns (same as normalizeMatrix does)
  const allKeys = new Set<string>()
  rawRows.forEach(row => {
    Object.keys(row).forEach(key => allKeys.add(key))
  })
  
  const sortedKeys = Array.from(allKeys).sort()
  const rowObjects = rawRows.map(row => {
    const obj: Record<string, string> = {}
    sortedKeys.forEach((key, idx) => {
      obj[`_${idx + 2}`] = (row[key] || '').toString().trim() || '-'
    })
    return obj
  })
  
  // Filter each row to keep only the keys we want
  const filteredRows = rowObjects.map(row => {
    const filtered: Record<string, string> = {}
    if (row._2 !== undefined) filtered._2 = row._2
    if (row._8 !== undefined) filtered._8 = row._8
    if (row._13 !== undefined) filtered._13 = row._13
    return filtered
  }).filter(row => Object.keys(row).length > 0)
  
  // Remove the first object (skip index 0)
  const filteredRowsWithoutFirst = filteredRows.slice(1)
  
  // Remove second and third objects (indices 1 and 2 from the filtered array)
  const finalRows = [
    filteredRowsWithoutFirst[0], // Keep first (labels)
    ...filteredRowsWithoutFirst.slice(3) // Skip indices 1 and 2, keep the rest
  ]
  
  // If we have at least 2 rows, extract values
  if (finalRows.length >= 2) {
    const values = finalRows[1]
    
    const count = values._2 || ''
    const tasteOfFood = values._8 || ''
    const accuracyOfOrder = values._13 || ''
    
    if (count && tasteOfFood && accuracyOfOrder) {
      return { count, tasteOfFood, accuracyOfOrder }
    }
  }
  
  return null
}

// Function to format gem data for display
function formatGemData(gemData: GemData | { count: string; tasteOfFood: string; accuracyOfOrder: string }): string {
  const lines: string[] = []
  
  lines.push(`<span style="color: #ef4444; font-weight: bold;">Count: ${gemData.count}</span>`)
  lines.push(`<span style="color: #ef4444; font-weight: bold;">Taste of Food ${gemData.tasteOfFood}</span>`)
  lines.push(`<span style="color: #ef4444; font-weight: bold;">Accuracy of Order ${gemData.accuracyOfOrder}</span>`)
  
  return lines.join('<br/>')
}

// Function to extract values from JSON string and save to gem
async function extractAndSaveGemValues(jsonString: string, saveGemDataFn: (data: { count: string; tasteOfFood: string; accuracyOfOrder: string }) => Promise<any>, mutateGemDataFn: () => void): Promise<string> {
  // Extract values from JSON
  let count = ''
  let tasteOfFood = ''
  let accuracyOfOrder = ''
  
  // Find "113" or any number in "_2" field (count value)
  const countMatch = jsonString.match(/"_2"\s*:\s*"([^"]+)"/)
  if (countMatch) {
    count = countMatch[1]
  }
  
  // Find "60.7%" or similar in "_8" field (tasteOfFood value)
  const tasteMatch = jsonString.match(/"_8"\s*:\s*"([^"]+)"/)
  if (tasteMatch) {
    tasteOfFood = tasteMatch[1]
  }
  
  // Find "72.1%" or similar in "_13" field (accuracyOfOrder value)
  const accuracyMatch = jsonString.match(/"_13"\s*:\s*"([^"]+)"/)
  if (accuracyMatch) {
    accuracyOfOrder = accuracyMatch[1]
  }
  
  // Save to database if all values found
  if (count && tasteOfFood && accuracyOfOrder) {
    try {
      await saveGemDataFn({ count, tasteOfFood, accuracyOfOrder })
      mutateGemDataFn()
    } catch (error) {
      console.error('Failed to save gem data:', error)
    }
  }
  
  // Return highlighted values for display
  const values: string[] = []
  if (count) {
    values.push(`<span style="color: #ef4444; font-weight: bold;">${count}</span>`)
  }
  if (tasteOfFood) {
    values.push(`<span style="color: #ef4444; font-weight: bold;">${tasteOfFood}</span>`)
  }
  if (accuracyOfOrder) {
    values.push(`<span style="color: #ef4444; font-weight: bold;">${accuracyOfOrder}</span>`)
  }
  
  return values.join('<br/>')
}

// Function to highlight and show only specific values in JSON string
function highlightJSONValues(jsonString: string): string {
  // Extract only the values we want to show
  const values: string[] = []
  
  // Find "113" (count value) or any value in "_2" field
  const countMatch = jsonString.match(/"_2"\s*:\s*"([^"]+)"/)
  if (countMatch) {
    values.push(`<span style="color: #ef4444; font-weight: bold;">${countMatch[1]}</span>`)
  }
  
  // Find "60.7%" or similar in "_8" field (tasteOfFood value)
  const tasteMatch = jsonString.match(/"_8"\s*:\s*"([^"]+)"/)
  if (tasteMatch) {
    values.push(`<span style="color: #ef4444; font-weight: bold;">${tasteMatch[1]}</span>`)
  }
  
  // Find "72.1%" or similar in "_13" field (accuracyOfOrder value)
  const accuracyMatch = jsonString.match(/"_13"\s*:\s*"([^"]+)"/)
  if (accuracyMatch) {
    values.push(`<span style="color: #ef4444; font-weight: bold;">${accuracyMatch[1]}</span>`)
  }
  
  // Return only the values, one per line
  return values.join('<br/>')
}

// Component to display and save gem values
function GemValuesDisplay({ 
  jsonString, 
  rawJson,
  saveGemData, 
  mutateGemData 
}: { 
  jsonString: string
  rawJson?: any
  saveGemData: (data: { count?: string; tasteOfFood?: string; accuracyOfOrder?: string; rawJson?: any }) => Promise<any>
  mutateGemData: () => void
}) {
  const [displayHtml, setDisplayHtml] = useState<string>('')
  
  useEffect(() => {
    // If rawJson is provided, save it directly
    if (rawJson) {
      console.log('GemValuesDisplay: Saving raw JSON to database...', rawJson)
      saveGemData({ rawJson })
        .then((saved) => {
          console.log('GemValuesDisplay: Raw JSON saved successfully!', saved)
          mutateGemData()
        })
        .catch(error => {
          console.error('GemValuesDisplay: Failed to save raw JSON:', error)
        })
    }
    
    // Parse JSON string to extract values for display
    try {
      const data = rawJson || JSON.parse(jsonString)
      console.log('GemValuesDisplay: Data for display:', data)
      
      if (Array.isArray(data) && data.length > 0) {
        // Find the row with actual values (skip headers)
        let count = ''
        let tasteOfFood = ''
        let accuracyOfOrder = ''
        
        // Find the row with actual data values (usually the last row)
        // Based on CSV structure (row 6, 0-indexed):
        // Column 3 (index 3, key _4): "66" = Count
        // Column 9 (index 9, key _10): "60.70%" = Taste of Food  
        // Column 14 (index 14, key _15): "72.10%" = Accuracy of Order
        for (const row of data) {
          // Check if this row has numeric/percentage values (data row, not header)
          const countValue = row._4 ? String(row._4).trim() : '' // Column 3 (0-indexed)
          const tasteValue = row._10 ? String(row._10).trim() : '' // Column 9 (0-indexed)
          const accuracyValue = row._15 ? String(row._15).trim() : '' // Column 14 (0-indexed)
          
          // Check if _4 looks like a count (number)
          if (/^\d+$/.test(countValue)) {
            count = countValue
          }
          // Check if _10 looks like a percentage (Taste of Food)
          if (/%/.test(tasteValue)) {
            tasteOfFood = tasteValue
          }
          // Check if _15 looks like a percentage (Accuracy of Order)
          if (/%/.test(accuracyValue)) {
            accuracyOfOrder = accuracyValue
          }
          
          // If we found all three values, use this row
          if (count && tasteOfFood && accuracyOfOrder) {
            break
          }
        }
        
        // Set display HTML
        const values: string[] = []
        if (count) {
          values.push(`<span style="color: #ef4444; font-weight: bold;">${count}</span>`)
        }
        if (tasteOfFood) {
          values.push(`<span style="color: #ef4444; font-weight: bold;">${tasteOfFood}</span>`)
        }
        if (accuracyOfOrder) {
          values.push(`<span style="color: #ef4444; font-weight: bold;">${accuracyOfOrder}</span>`)
        }
        
        setDisplayHtml(values.join('<br/>'))
      }
    } catch (error) {
      console.error('GemValuesDisplay: Failed to parse JSON:', error)
    }
  }, [jsonString, rawJson, saveGemData, mutateGemData])
  
  return (
    <div 
      className="text-sm text-foreground break-words"
      dangerouslySetInnerHTML={{ __html: displayHtml }}
    />
  )
}

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

  const { data: categorySummary, isLoading: categoryLoading, error: categoryError } = useSWR<CategorySummary[]>(
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
        periods.push({
          year: 2025,
          period: p.period,
          periodString: `P${p.period.toString().padStart(2, '0')}`,
          updatedAt: p.updatedAt,
        })
      })
    }
    
    if (periods2026.data) {
      periods2026.data.forEach((p: any) => {
        periods.push({
          year: 2026,
          period: p.period,
          periodString: `P${p.period.toString().padStart(2, '0')}`,
          updatedAt: p.updatedAt,
        })
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

  const topCategories = useMemo(() => {
    if (!categorySummary) return []
    return categorySummary.slice(0, 6)
  }, [categorySummary])

  const isLoading = periodsLoading || latestReportLoading || categoryLoading

  // Extract survey metrics from CSV data
  const surveyMetrics = useMemo(() => {
    if (!csvData || !csvData.data || csvData.data.length === 0) {
      return null
    }

    const firstColumn = csvData.headers[0]
    const currentPeriodColumn = csvData.headers.find(header => {
      const lower = header.toLowerCase()
      return !lower.includes('prior') && !lower.includes('last year')
    }) || csvData.headers[1]

    if (!currentPeriodColumn || !firstColumn) {
      return null
    }

    let totalCount = 0
    let tasteOfFoodPercent = 0
    let accuracyOfOrderPercent = 0

    // Find all metrics in one pass
    csvData.data.forEach(row => {
      const metricName = (row[firstColumn] || '').toLowerCase().trim()
      const value = (row[currentPeriodColumn] || '').toString().trim()
      
      // Find total count - look for "total count" in metric name and numeric value
      if (metricName.includes('total') && metricName.includes('count')) {
        const count = parseInt(value, 10)
        if (!isNaN(count) && count > 0) {
          totalCount = count
        }
      }
      
      // Also check if value is "63" and metric name includes "total"
      if (value === '63' && metricName.includes('total')) {
        totalCount = 63
      }
      
      // Find Taste of Food percentage
      if ((metricName.includes('taste') || metricName.includes('food')) && !metricName.includes('overall')) {
        const percentMatch = value.match(/(\d+\.?\d*)%?/)
        if (percentMatch) {
          const percent = parseFloat(percentMatch[1])
          if (!isNaN(percent) && percent > 0) {
            tasteOfFoodPercent = percent
          }
        }
      }
      
      // Find Accuracy of Order percentage
      if (metricName.includes('accuracy') || (metricName.includes('order') && !metricName.includes('taste'))) {
        const percentMatch = value.match(/(\d+\.?\d*)%?/)
        if (percentMatch) {
          const percent = parseFloat(percentMatch[1])
          if (!isNaN(percent) && percent > 0) {
            accuracyOfOrderPercent = percent
          }
        }
      }
    })

    // If we don't have total count, try to find it as just "63" in any row
    if (totalCount === 0) {
      csvData.data.forEach(row => {
        const value = (row[currentPeriodColumn] || '').toString().trim()
        if (value === '63') {
          totalCount = 63
        }
      })
    }

    if (totalCount === 0 || (tasteOfFoodPercent === 0 && accuracyOfOrderPercent === 0)) {
      return null
    }

    const tasteOfFoodCount = tasteOfFoodPercent > 0 ? Math.round((tasteOfFoodPercent / 100) * totalCount) : 0
    const accuracyOfOrderCount = accuracyOfOrderPercent > 0 ? Math.round((accuracyOfOrderPercent / 100) * totalCount) : 0

    return {
      totalCount,
      tasteOfFood: {
        percent: tasteOfFoodPercent,
        count: tasteOfFoodCount
      },
      accuracyOfOrder: {
        percent: accuracyOfOrderPercent,
        count: accuracyOfOrderCount
      }
    }
  }, [csvData])

  // Extract simple metrics from CSV data
  const simpleMetrics = useMemo(() => {
    if (!csvData || !csvData.data || csvData.data.length === 0) {
      return null
    }

    const firstColumn = csvData.headers[0]
    const currentPeriodColumn = csvData.headers.find(header => {
      const lower = header.toLowerCase()
      return !lower.includes('prior') && !lower.includes('last year')
    }) || csvData.headers[1]

    if (!currentPeriodColumn || !firstColumn) {
      return null
    }

    let tasteOfFoodPercent: string | null = null
    let accuracyOfOrderPercent: string | null = null

    // Look through all rows to extract values
    for (const row of csvData.data) {
      const metricName = (row[firstColumn] || '').toLowerCase().trim()
      const value = (row[currentPeriodColumn] || '').toString().trim()

      // Extract Taste of Food percentage
      if (!tasteOfFoodPercent && (metricName.includes('taste') || metricName.includes('food')) && !metricName.includes('overall')) {
        const percentMatch = value.match(/(\d+\.?\d*)%?/)
        if (percentMatch) {
          tasteOfFoodPercent = percentMatch[1]
        }
      }

      // Extract Accuracy of Order percentage
      if (!accuracyOfOrderPercent && (metricName.includes('accuracy') || (metricName.includes('order') && !metricName.includes('taste')))) {
        const percentMatch = value.match(/(\d+\.?\d*)%?/)
        if (percentMatch) {
          accuracyOfOrderPercent = percentMatch[1]
        }
      }
    }

    if (!tasteOfFoodPercent && !accuracyOfOrderPercent) {
      return null
    }

    return {
      tasteOfFoodPercent,
      accuracyOfOrderPercent
    }
  }, [csvData])

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

  // Convert CSV data to JSON format (fallback to raw data if normalization fails)
  const csvJsonData = useMemo(() => {
    return normalizedCsvData || (csvData?.data || null)
  }, [normalizedCsvData, csvData])

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

