import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import useSWR from 'swr'
import { PlExcelParserService } from '@/utils/plExcelParser'
import { savePlReport, plPeriodsFetcher } from '@/utils/plApi'
import { Dropzone } from '@/components/ui/dropzone'
import { Button } from '@/components/ui/button'

interface PeriodData {
  period: number
  fileName: string | null
  updatedAt: string
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
        {periodData?.fileName && (
          <p className="text-xs text-muted-foreground mt-1">
            File: {periodData.fileName}
          </p>
        )}
        {periodData?.updatedAt && (
          <p className="text-xs text-muted-foreground">
            Uploaded: {new Date(periodData.updatedAt).toLocaleDateString()}
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
      ) : (
        <Button
          onClick={(e) => {
            e.stopPropagation()
            navigate(`/pl/${year}/${period}`)
          }}
          variant="outline"
          size="sm"
          className="w-full iron-border hover:iron-glow"
        >
          View Details
        </Button>
      )}
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

  // Group periods by quarters using PERIOD_INFO
  const quarters = ['Q1', 'Q2', 'Q3', 'Q4'].map(quarterName => {
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
    
    return {
      name: quarterName,
      periods: quarterPeriods
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

          return (
            <div key={quarter.name} className="flex flex-col gap-4">
              <div className="flex items-center gap-3">
                <h3 className="text-lg font-semibold text-foreground">{quarter.name}</h3>
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
      <div className="rounded-xl border border-primary/20 bg-card/40 backdrop-blur-sm p-6 md:p-8 shadow-lg">
        <div className="mb-4">
          <h1 className="text-2xl md:text-3xl font-bold text-foreground mb-2 iron-text-glow">
            P&L Reports
          </h1>
          <div className="h-1 w-24 bg-primary/60 rounded-full iron-glow"></div>
        </div>
        <p className="text-muted-foreground">
          Upload XLSX files for each period to view P&L data. Click on a period to view detailed information.
        </p>
      </div>

      {/* Show 2026 first, then 2025 */}
      <YearSection year={2026} />
      <YearSection year={2025} />
    </div>
  )
}

