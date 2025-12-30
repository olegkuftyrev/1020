import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import useSWR from 'swr'
import { PlExcelParserService } from '@/utils/plExcelParser'
import { savePlReport, plPeriodsFetcher, plReportFetcher } from '@/utils/plApi'
import { Dropzone } from '@/components/ui/dropzone'
import { ArrowUp, ArrowDown } from 'lucide-react'

interface PeriodData {
  period: number
  fileName: string | null
  updatedAt: string
  keyMetrics?: any
}

interface PeriodInfo {
  id: string
  name: string
  quarter: string
  start: string
  end: string
}

const PERIOD_INFO: PeriodInfo[] = [
  { id: 'P01', name: 'P01', quarter: 'Q1', start: '12/30', end: '1/25' },
  { id: 'P02', name: 'P02', quarter: 'Q1', start: '1/26', end: '2/22' },
  { id: 'P03', name: 'P03', quarter: 'Q1', start: '2/23', end: '3/22' },
  { id: 'P04', name: 'P04', quarter: 'Q2', start: '3/23', end: '4/19' },
  { id: 'P05', name: 'P05', quarter: 'Q2', start: '4/20', end: '5/17' },
  { id: 'P06', name: 'P06', quarter: 'Q2', start: '5/18', end: '6/14' },
  { id: 'P07', name: 'P07', quarter: 'Q3', start: '6/15', end: '7/12' },
  { id: 'P08', name: 'P08', quarter: 'Q3', start: '7/13', end: '8/9' },
  { id: 'P09', name: 'P09', quarter: 'Q3', start: '8/10', end: '9/6' },
  { id: 'P10', name: 'P10', quarter: 'Q4', start: '9/7', end: '10/4' },
  { id: 'P11', name: 'P11', quarter: 'Q4', start: '10/5', end: '11/1' },
  { id: 'P12', name: 'P12', quarter: 'Q4', start: '11/2', end: '11/29' },
  { id: 'P13', name: 'P13', quarter: 'Q4', start: '11/30', end: '12/27' },
]

// Component to calculate and display quarter averages
function QuarterHeader({ 
  year, 
  periodNumbers 
}: { 
  year: number
  periodNumbers: number[]
}) {
  const [reports, setReports] = useState<any[]>([])

  // Load all reports for periods in this quarter
  periodNumbers.forEach(period => {
    // eslint-disable-next-line react-hooks/rules-of-hooks
    const { data } = useSWR(
      `/pl/${year}/${period}`,
      plReportFetcher,
      { revalidateOnFocus: false }
    )
    if (data && !reports.find(r => r.period === period)) {
      setReports(prev => [...prev, { ...data, period }])
    }
  })

  // Calculate averages
  const calculateAverages = () => {
    const validReports = reports.filter(r => r !== undefined && r !== null && r.summaryData)
    if (validReports.length === 0) return null

    let totalSSS = 0
    let totalCOGS = 0
    let totalLabor = 0
    let totalCP = 0
    let count = 0

    validReports.forEach(report => {
      if (!report || !report.summaryData) return
      
      const summaryData = report.summaryData

      // SSS
      if (summaryData.netSales !== undefined && summaryData.netSalesPriorYear !== undefined) {
        const netSales = summaryData.netSales || 0
        const priorYear = summaryData.netSalesPriorYear || 0
        const difference = netSales - priorYear
        const sss = priorYear !== 0 ? ((difference / priorYear) * 100) : 0
        totalSSS += sss
      }

      // COGS
      if (summaryData.netSales && summaryData.costOfGoodsSold !== undefined) {
        const currentPercent = (summaryData.costOfGoodsSold / summaryData.netSales) * 100
        totalCOGS += currentPercent
      }

      // Labor
      if (summaryData.netSales && summaryData.totalLabor !== undefined) {
        const currentPercent = (summaryData.totalLabor / summaryData.netSales) * 100
        totalLabor += currentPercent
      }

      // CP
      if (summaryData.netSales && summaryData.controllableProfit !== undefined) {
        const currentPercent = (summaryData.controllableProfit / summaryData.netSales) * 100
        totalCP += currentPercent
      }

      count++
    })

    if (count === 0) return null

    return {
      sss: totalSSS / count,
      cogs: totalCOGS / count,
      labor: totalLabor / count,
      cp: totalCP / count
    }
  }

  const averages = calculateAverages()

  if (!averages) return null

  return (
    <div className="flex items-center gap-4 text-xs text-muted-foreground">
      <span>SSS: <span className="font-semibold text-foreground">{averages.sss.toFixed(1)}%</span></span>
      <span>COGS: <span className="font-semibold text-foreground">{averages.cogs.toFixed(1)}%</span></span>
      <span>Labor: <span className="font-semibold text-foreground">{averages.labor.toFixed(1)}%</span></span>
      <span>CP: <span className="font-semibold text-foreground">{averages.cp.toFixed(1)}%</span></span>
    </div>
  )
}

function PeriodCard({ 
  year, 
  period, 
  periodData,
  periodInfo,
  onUpload
}: { 
  year: number
  period: number
  periodData?: PeriodData
  periodInfo?: PeriodInfo
  onUpload: (file: File) => void
}) {
  const navigate = useNavigate()
  const [isUploading, setIsUploading] = useState(false)

  // Load full report to calculate key metrics on frontend
  const { data: plReport } = useSWR(
    periodData ? `/pl/${year}/${period}` : null,
    plReportFetcher,
    {
      revalidateOnFocus: false,
    }
  )

  const handleFileSelect = async (file: File) => {
    setIsUploading(true)
    try {
      await onUpload(file)
    } finally {
      setIsUploading(false)
    }
  }

  const handleClick = () => {
    if (periodData) {
      navigate(`/pl/${year}/${period}`)
    }
  }

  // Calculate key metrics from plReport (same logic as PLPeriodDetail)
  const calculateKeyMetrics = () => {
    if (!plReport) return null

    const summaryData = plReport.summaryData || {}
    const lineItems = Array.isArray(plReport.lineItems) ? plReport.lineItems : []
    
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

    // Restaurant Contribution
    if (summaryData.netSales && summaryData.restaurantContribution !== undefined) {
      const currentPercent = (summaryData.restaurantContribution / summaryData.netSales) * 100
      const priorYearPercent = summaryData.netSalesPriorYear && summaryData.restaurantContributionPriorYear
        ? (summaryData.restaurantContributionPriorYear / summaryData.netSalesPriorYear) * 100
        : 0
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
  }

  const keyMetrics = calculateKeyMetrics()

  return (
    <div 
      className={`rounded-lg border p-4 transition-all border-primary/20 bg-card/40 hover:border-primary/50 hover:bg-card/60 ${periodData ? 'cursor-pointer' : ''}`}
      onClick={handleClick}
    >
      <div className="mb-2">
        <h4 className="font-semibold text-foreground">
          {periodInfo?.name || `Period ${period}`}
        </h4>
        {periodInfo && (
          <p className="text-xs text-muted-foreground mt-1">
            {periodInfo.start} - {periodInfo.end}
          </p>
        )}
      </div>

      {!periodData ? (
        <Dropzone
          onFileSelect={handleFileSelect}
          accept=".xlsx,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
          disabled={isUploading}
          className="h-24"
        />
      ) : keyMetrics && Object.keys(keyMetrics).length > 0 ? (
        <div className="space-y-1.5">
          {/* Net Sales */}
          {keyMetrics.netSales && (
            <div className="flex items-center justify-between text-xs">
              <span className="text-muted-foreground">Net Sales</span>
              <div className="flex items-center gap-1">
                <span className="font-semibold text-foreground">
                  ${((keyMetrics.netSales.value || 0) / 1000).toFixed(0)}k
                </span>
                {keyMetrics.netSales.sss !== undefined && (
                  <>
                    {keyMetrics.netSales.isPositive ? (
                      <ArrowUp className="h-3 w-3 text-green-500" />
                    ) : (
                      <ArrowDown className="h-3 w-3 text-red-500" />
                    )}
                    <span className={`font-semibold ${keyMetrics.netSales.isPositive ? 'text-green-500' : 'text-red-500'}`}>
                      {keyMetrics.netSales.isPositive ? '+' : ''}{keyMetrics.netSales.sss.toFixed(1)}%
                    </span>
                  </>
                )}
              </div>
            </div>
          )}

          {/* Total Transactions */}
          {keyMetrics.totalTransactions && (
            <div className="flex items-center justify-between text-xs">
              <span className="text-muted-foreground">Transactions</span>
              <div className="flex items-center gap-1">
                <span className="font-semibold text-foreground">
                  {((keyMetrics.totalTransactions.value || 0) / 1000).toFixed(0)}k
                </span>
                {keyMetrics.totalTransactions.sst !== undefined && keyMetrics.totalTransactions.priorYear > 0 && (
                  <>
                    {keyMetrics.totalTransactions.isPositive ? (
                      <ArrowUp className="h-3 w-3 text-green-500" />
                    ) : (
                      <ArrowDown className="h-3 w-3 text-red-500" />
                    )}
                    <span className={`font-semibold ${keyMetrics.totalTransactions.isPositive ? 'text-green-500' : 'text-red-500'}`}>
                      {keyMetrics.totalTransactions.isPositive ? '+' : ''}{keyMetrics.totalTransactions.sst.toFixed(1)}%
                    </span>
                  </>
                )}
              </div>
            </div>
          )}

          {/* Check Average */}
          {keyMetrics.checkAverage && (
            <div className="flex items-center justify-between text-xs">
              <span className="text-muted-foreground">Check Avg</span>
              <div className="flex items-center gap-1">
                <span className="font-semibold text-foreground">
                  ${(keyMetrics.checkAverage.value || 0).toFixed(2)}
                </span>
                {keyMetrics.checkAverage.changePercent !== undefined && keyMetrics.checkAverage.priorYear > 0 && (
                  <>
                    {keyMetrics.checkAverage.isPositive ? (
                      <ArrowUp className="h-3 w-3 text-green-500" />
                    ) : (
                      <ArrowDown className="h-3 w-3 text-red-500" />
                    )}
                    <span className={`font-semibold ${keyMetrics.checkAverage.isPositive ? 'text-green-500' : 'text-red-500'}`}>
                      {keyMetrics.checkAverage.isPositive ? '+' : ''}{keyMetrics.checkAverage.changePercent.toFixed(1)}%
                    </span>
                  </>
                )}
              </div>
            </div>
          )}

          {/* OLO% */}
          {keyMetrics.olo && (
            <div className="flex items-center justify-between text-xs">
              <span className="text-muted-foreground">OLO%</span>
              <div className="flex items-center gap-1">
                <span className="font-semibold text-foreground">
                  {(keyMetrics.olo.value || 0).toFixed(1)}%
                </span>
                {keyMetrics.olo.isPositive ? (
                  <ArrowUp className="h-3 w-3 text-green-500" />
                ) : (
                  <ArrowDown className="h-3 w-3 text-red-500" />
                )}
                <span className={`font-semibold ${keyMetrics.olo.isPositive ? 'text-green-500' : 'text-red-500'}`}>
                  {keyMetrics.olo.isPositive ? '+' : ''}{(keyMetrics.olo.difference || 0).toFixed(1)}pp
                </span>
              </div>
            </div>
          )}

          {/* COGS */}
          {keyMetrics.cogs && (
            <div className="flex items-center justify-between text-xs">
              <span className="text-muted-foreground">COGS</span>
              <div className="flex items-center gap-1">
                <span className="font-semibold text-foreground">
                  {(keyMetrics.cogs.value || 0).toFixed(1)}%
                </span>
                {keyMetrics.cogs.isPositive ? (
                  <ArrowDown className="h-3 w-3 text-green-500" />
                ) : (
                  <ArrowUp className="h-3 w-3 text-red-500" />
                )}
                <span className={`font-semibold ${keyMetrics.cogs.isPositive ? 'text-green-500' : 'text-red-500'}`}>
                  {keyMetrics.cogs.isPositive ? '' : '+'}{(keyMetrics.cogs.difference || 0).toFixed(1)}pp
                </span>
              </div>
            </div>
          )}

          {/* Total Labor */}
          {keyMetrics.totalLabor && (
            <div className="flex items-center justify-between text-xs">
              <span className="text-muted-foreground">Labor</span>
              <div className="flex items-center gap-1">
                <span className="font-semibold text-foreground">
                  {(keyMetrics.totalLabor.value || 0).toFixed(1)}%
                </span>
                {keyMetrics.totalLabor.isPositive ? (
                  <ArrowDown className="h-3 w-3 text-green-500" />
                ) : (
                  <ArrowUp className="h-3 w-3 text-red-500" />
                )}
                <span className={`font-semibold ${keyMetrics.totalLabor.isPositive ? 'text-green-500' : 'text-red-500'}`}>
                  {keyMetrics.totalLabor.isPositive ? '' : '+'}{(keyMetrics.totalLabor.difference || 0).toFixed(1)}pp
                </span>
              </div>
            </div>
          )}

          {/* Controllable Profit */}
          {keyMetrics.controllableProfit && (
            <div className="flex items-center justify-between text-xs">
              <span className="text-muted-foreground">CP</span>
              <div className="flex items-center gap-1">
                <span className="font-semibold text-foreground">
                  {(keyMetrics.controllableProfit.value || 0).toFixed(1)}%
                </span>
                {keyMetrics.controllableProfit.isPositive ? (
                  <ArrowUp className="h-3 w-3 text-green-500" />
                ) : (
                  <ArrowDown className="h-3 w-3 text-red-500" />
                )}
                <span className={`font-semibold ${keyMetrics.controllableProfit.isPositive ? 'text-green-500' : 'text-red-500'}`}>
                  {keyMetrics.controllableProfit.isPositive ? '+' : ''}{(keyMetrics.controllableProfit.difference || 0).toFixed(1)}pp
                </span>
              </div>
            </div>
          )}

          {/* Restaurant Contribution */}
          {keyMetrics.restaurantContribution && (
            <div className="flex items-center justify-between text-xs">
              <span className="text-muted-foreground">RC</span>
              <div className="flex items-center gap-1">
                <span className="font-semibold text-foreground">
                  {(keyMetrics.restaurantContribution.value || 0).toFixed(1)}%
                </span>
                {keyMetrics.restaurantContribution.isPositive ? (
                  <ArrowUp className="h-3 w-3 text-green-500" />
                ) : (
                  <ArrowDown className="h-3 w-3 text-red-500" />
                )}
                <span className={`font-semibold ${keyMetrics.restaurantContribution.isPositive ? 'text-green-500' : 'text-red-500'}`}>
                  {keyMetrics.restaurantContribution.isPositive ? '+' : ''}{(keyMetrics.restaurantContribution.difference || 0).toFixed(1)}pp
                </span>
              </div>
            </div>
          )}

          {/* Rent $ */}
          {keyMetrics.rent && (
            <div className="flex items-center justify-between text-xs">
              <span className="text-muted-foreground">Rent $</span>
              <div className="flex items-center gap-1">
                <span className="font-semibold text-foreground">
                  ${((keyMetrics.rent.value || 0) / 1000).toFixed(0)}k
                </span>
                {keyMetrics.rent.isPositive ? (
                  <ArrowDown className="h-3 w-3 text-green-500" />
                ) : (
                  <ArrowUp className="h-3 w-3 text-red-500" />
                )}
                <span className={`font-semibold ${keyMetrics.rent.isPositive ? 'text-green-500' : 'text-red-500'}`}>
                  {keyMetrics.rent.isPositive ? '' : '+'}${Math.abs((keyMetrics.rent.difference || 0) / 1000).toFixed(0)}k
                </span>
              </div>
            </div>
          )}

          {/* Flow Thru %} */}
          {keyMetrics.flowThru && keyMetrics.flowThru.value !== null && (
            <div className="flex items-center justify-between text-xs">
              <span className="text-muted-foreground">Flow Thru</span>
              <div className="flex items-center gap-1">
                <span className="font-semibold text-foreground">
                  {(keyMetrics.flowThru.value || 0).toFixed(1)}%
                </span>
                {keyMetrics.flowThru.isPositive ? (
                  <ArrowUp className="h-3 w-3 text-green-500" />
                ) : (
                  <ArrowDown className="h-3 w-3 text-red-500" />
                )}
              </div>
            </div>
          )}

          {/* Top Controllable */}
          {keyMetrics.topControllable && (
            <div className="flex items-center justify-between text-xs">
              <span className="text-muted-foreground truncate max-w-[60px]" title={keyMetrics.topControllable.name}>
                Top Ctrl
              </span>
              <div className="flex items-center gap-1">
                <span className="font-semibold text-foreground">
                  ${((keyMetrics.topControllable.value || 0) / 1000).toFixed(0)}k
                </span>
                {keyMetrics.topControllable.isPositive ? (
                  <ArrowDown className="h-3 w-3 text-green-500" />
                ) : (
                  <ArrowUp className="h-3 w-3 text-red-500" />
                )}
                <span className={`font-semibold ${keyMetrics.topControllable.isPositive ? 'text-green-500' : 'text-red-500'}`}>
                  {keyMetrics.topControllable.isPositive ? '' : '+'}${Math.abs((keyMetrics.topControllable.difference || 0) / 1000).toFixed(0)}k
                </span>
              </div>
            </div>
          )}
        </div>
      ) : null}
    </div>
  )
}

function YearSection({ 
  year
}: { 
  year: number
}) {
  const navigate = useNavigate()

  // Determine which periods to show
  const currentDate = new Date()
  const currentYear = currentDate.getFullYear()
  const currentMonth = currentDate.getMonth() + 1
  
  // Calculate which periods should be shown
  const getPeriodsToShow = () => {
    if (year === 2025) {
      // Show all periods for 2025
      return Array.from({ length: 13 }, (_, i) => i + 1)
    } else if (year === 2026) {
      // Show only period 1 for 2026
      return [1]
    }
    // For other years, show completed periods
    const periodsToShow: number[] = []
    for (let p = 1; p <= 13; p++) {
      const periodEndMonth = p * 4 // Approximate: each period is ~4 weeks
      if (year < currentYear || (year === currentYear && periodEndMonth <= currentMonth)) {
        periodsToShow.push(p)
      }
    }
    return periodsToShow
  }

  const periodsToShow = getPeriodsToShow()
  const { data: periodsData = [] } = useSWR(
    `/pl/${year}/periods`,
    plPeriodsFetcher,
    {
      revalidateOnFocus: false,
    }
  )

  // Debug: log periodsData to see what we're getting
  console.log(`Periods data for ${year}:`, periodsData)

  const handleFileUpload = async (period: number, file: File) => {
    try {
      console.log('Parsing Excel file for period', period)
      const plReportData = await PlExcelParserService.parseExcelFile(file)
      console.log('Parsed P&L data:', plReportData)
      
      await savePlReport(year, period, plReportData, file.name)
      console.log('P&L report saved successfully')
      
      // Navigate to detail page
      navigate(`/pl/${year}/${period}`)
    } catch (error: any) {
      console.error('Error uploading P&L file:', error)
      alert(`Failed to upload file: ${error.message || 'Unknown error'}`)
    } finally {
      // Upload completed
    }
  }

  const periodsMap = new Map(periodsData.map(p => [p.period, p]))

  // Helper function to calculate quarter averages
  const calculateQuarterAverages = (quarterPeriods: Array<{ period: number; info: PeriodInfo }>) => {
    const periodNumbers = quarterPeriods.map(p => p.period).filter(p => periodsMap.has(p))
    if (periodNumbers.length === 0) return null

    // We'll calculate averages from the loaded reports in QuarterHeader component
    return { periodNumbers }
  }

  // Group periods by quarters using PERIOD_INFO (Q4 first, then Q3, Q2, Q1)
  const quarters = ['Q4', 'Q3', 'Q2', 'Q1'].map(quarterName => {
    const quarterPeriods = PERIOD_INFO
      .filter(info => info.quarter === quarterName)
      .map(info => {
        const periodNumber = parseInt(info.id.replace('P', ''))
        return {
          period: periodNumber,
          info: info
        }
      })
      .filter(({ period }) => periodsToShow.includes(period))
      .reverse() // Reverse order of periods within each quarter
    
    return {
      name: quarterName,
      periods: quarterPeriods,
      averages: calculateQuarterAverages(quarterPeriods)
    }
  })

  return (
    <div className="rounded-xl border border-primary/20 bg-card/40 backdrop-blur-sm p-6 md:p-8 shadow-lg">
      <div className="mb-6">
        <h2 className="text-2xl font-bold text-foreground mb-2">{year}</h2>
        <div className="h-1 w-16 bg-primary/60 rounded-full"></div>
      </div>

      <div className="flex flex-col gap-8">
        {quarters.map((quarter) => {
          if (quarter.periods.length === 0) return null

          const periodNumbers = quarter.periods.map(p => p.period).filter(p => periodsMap.has(p))

          return (
            <div key={quarter.name} className="flex flex-col gap-4">
              <div className="flex items-center gap-3">
                <h3 className="text-lg font-semibold text-foreground">{quarter.name}</h3>
                {periodNumbers.length > 0 && (
                  <QuarterHeader 
                    year={year} 
                    periodNumbers={periodNumbers}
                  />
                )}
                <div className="h-px flex-1 bg-primary/20"></div>
              </div>
              <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
                {quarter.periods.map(({ period, info }) => {
                  const periodData = periodsMap.get(period)
                  return (
                    <PeriodCard
                      key={period}
                      year={year}
                      period={period}
                      periodData={periodData}
                      periodInfo={info}
                      onUpload={(file) => handleFileUpload(period, file)}
                    />
                  )
                })}
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}

export function PL() {
  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-3xl font-bold text-foreground mb-2">P&L Reports</h1>
        <p className="text-muted-foreground">
          Upload XLSX files for each period to view P&L data. Click on a period to view detailed information.
        </p>
      </div>

      <YearSection year={2026} />
      <YearSection year={2025} />
    </div>
  )
}
