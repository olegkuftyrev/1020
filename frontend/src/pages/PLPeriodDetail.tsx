import { useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import useSWR from 'swr'
import { plReportFetcher, deletePlReport } from '@/utils/plApi'
import { Button } from '@/components/ui/button'
import { Skeleton } from '@/components/ui/skeleton'
import { Checkbox } from '@/components/ui/checkbox'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuCheckboxItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { ArrowLeft, Trash2, Filter, Settings2, ArrowUp, ArrowDown } from 'lucide-react'

export function PLPeriodDetail() {
  const { year, period } = useParams<{ year: string; period: string }>()
  const navigate = useNavigate()
  const [isDeleting, setIsDeleting] = useState(false)
  const [showFilters, setShowFilters] = useState(false)
  const [showCalculations] = useState(false) // Hidden by default
  
  // Table visibility filters
  const [tableVisibility, setTableVisibility] = useState({
    salesBreakdown: true,
    cogs: true,
    labor: true,
    controllables: true,
    fixedCosts: true,
    statistics: true,
    lineItems: true,
  })

  // Column visibility filters for each table
  // By default, hide: Plan, Plan %, VFP, Plan YTD, Plan YTD %, VFP YTD, Actual YTD, Actual YTD %, Prior Year YTD, Prior Year YTD %
  const [columnVisibility, setColumnVisibility] = useState({
    salesBreakdown: {
      actuals: true,
      actualsPercentage: true,
      plan: false,
      planPercentage: false,
      vfp: false,
      priorYear: true,
      priorYearPercentage: true,
      actualYtd: false,
      actualYtdPercentage: false,
      planYtd: false,
      planYtdPercentage: false,
      vfpYtd: false,
      priorYearYtd: false,
      priorYearYtdPercentage: false,
    },
    cogs: {
      actuals: true,
      actualsPercentage: true,
      plan: false,
      planPercentage: false,
      vfp: false,
      priorYear: true,
      priorYearPercentage: true,
      actualYtd: false,
      actualYtdPercentage: false,
      planYtd: false,
      planYtdPercentage: false,
      vfpYtd: false,
      priorYearYtd: false,
      priorYearYtdPercentage: false,
    },
    labor: {
      actuals: true,
      actualsPercentage: true,
      plan: false,
      planPercentage: false,
      vfp: false,
      priorYear: true,
      priorYearPercentage: true,
      actualYtd: false,
      actualYtdPercentage: false,
      planYtd: false,
      planYtdPercentage: false,
      vfpYtd: false,
      priorYearYtd: false,
      priorYearYtdPercentage: false,
    },
    controllables: {
      actuals: true,
      actualsPercentage: true,
      plan: false,
      planPercentage: false,
      vfp: false,
      priorYear: true,
      priorYearPercentage: true,
      actualYtd: false,
      actualYtdPercentage: false,
      planYtd: false,
      planYtdPercentage: false,
      vfpYtd: false,
      priorYearYtd: false,
      priorYearYtdPercentage: false,
    },
    fixedCosts: {
      actuals: true,
      actualsPercentage: true,
      plan: false,
      planPercentage: false,
      vfp: false,
      priorYear: true,
      priorYearPercentage: true,
      actualYtd: false,
      actualYtdPercentage: false,
      planYtd: false,
      planYtdPercentage: false,
      vfpYtd: false,
      priorYearYtd: false,
      priorYearYtdPercentage: false,
    },
    statistics: {
      actuals: true,
      actualsPercentage: true,
      plan: false,
      planPercentage: false,
      vfp: false,
      priorYear: true,
      priorYearPercentage: true,
      actualYtd: false,
      actualYtdPercentage: false,
      planYtd: false,
      planYtdPercentage: false,
      vfpYtd: false,
      priorYearYtd: false,
      priorYearYtdPercentage: false,
    },
    lineItems: {
      actuals: true,
      actualsPercentage: true,
      plan: false,
      planPercentage: false,
      vfp: false,
      priorYear: true,
      priorYearPercentage: true,
      actualYtd: false,
      actualYtdPercentage: false,
      planYtd: false,
      planYtdPercentage: false,
      vfpYtd: false,
      priorYearYtd: false,
      priorYearYtdPercentage: false,
    },
  })

  // Helper function to render table headers based on visibility
  const renderTableHeaders = (tableName: keyof typeof columnVisibility) => {
    const cols = columnVisibility[tableName]
    const headers: JSX.Element[] = []

    // Ledger Account is always visible
    headers.push(
      <TableHead key="ledgerAccount" className="font-semibold whitespace-nowrap px-4 py-2">
        Ledger Account
      </TableHead>
    )

    if (cols.actuals) {
      headers.push(
        <TableHead key="actuals" className="font-semibold whitespace-nowrap px-4 py-2 text-right">
          Actuals
        </TableHead>
      )
    }

    if (cols.actualsPercentage) {
      headers.push(
        <TableHead key="actualsPercentage" className="font-semibold whitespace-nowrap px-4 py-2 text-right">
          Actuals %
        </TableHead>
      )
    }

    if (cols.plan) {
      headers.push(
        <TableHead key="plan" className="font-semibold whitespace-nowrap px-4 py-2 text-right">
          Plan
        </TableHead>
      )
    }

    if (cols.planPercentage) {
      headers.push(
        <TableHead key="planPercentage" className="font-semibold whitespace-nowrap px-4 py-2 text-right">
          Plan %
        </TableHead>
      )
    }

    if (cols.vfp) {
      headers.push(
        <TableHead key="vfp" className="font-semibold whitespace-nowrap px-4 py-2 text-right">
          VFP
        </TableHead>
      )
    }

    if (cols.priorYear) {
      headers.push(
        <TableHead key="priorYear" className="font-semibold whitespace-nowrap px-4 py-2 text-right">
          Prior Year
        </TableHead>
      )
    }

    if (cols.priorYearPercentage) {
      headers.push(
        <TableHead key="priorYearPercentage" className="font-semibold whitespace-nowrap px-4 py-2 text-right">
          Prior Year %
        </TableHead>
      )
    }

    if (cols.actualYtd) {
      headers.push(
        <TableHead key="actualYtd" className="font-semibold whitespace-nowrap px-4 py-2 text-right">
          Actual YTD
        </TableHead>
      )
    }

    if (cols.actualYtdPercentage) {
      headers.push(
        <TableHead key="actualYtdPercentage" className="font-semibold whitespace-nowrap px-4 py-2 text-right">
          Actual YTD %
        </TableHead>
      )
    }

    if (cols.planYtd) {
      headers.push(
        <TableHead key="planYtd" className="font-semibold whitespace-nowrap px-4 py-2 text-right">
          Plan YTD
        </TableHead>
      )
    }

    if (cols.planYtdPercentage) {
      headers.push(
        <TableHead key="planYtdPercentage" className="font-semibold whitespace-nowrap px-4 py-2 text-right">
          Plan YTD %
        </TableHead>
      )
    }

    if (cols.vfpYtd) {
      headers.push(
        <TableHead key="vfpYtd" className="font-semibold whitespace-nowrap px-4 py-2 text-right">
          VFP YTD
        </TableHead>
      )
    }

    if (cols.priorYearYtd) {
      headers.push(
        <TableHead key="priorYearYtd" className="font-semibold whitespace-nowrap px-4 py-2 text-right">
          Prior Year YTD
        </TableHead>
      )
    }

    if (cols.priorYearYtdPercentage) {
      headers.push(
        <TableHead key="priorYearYtdPercentage" className="font-semibold whitespace-nowrap px-4 py-2 text-right">
          Prior Year YTD %
        </TableHead>
      )
    }

    return headers
  }

  // Helper function to format percentage value
  // Fixes cases where percentages were saved as decimals (1.0 instead of 100.0)
  // Excel stores percentages in different formats:
  // - As decimals: 0.01 = 1%, 1.0 = 100%
  // - As whole numbers: 1 = 1%, 100 = 100%
  const formatPercentage = (value: number | null | undefined): string => {
    if (value === null || value === undefined || typeof value !== 'number') {
      return '0.00'
    }
    
    const absValue = Math.abs(value)
    
    // If value is exactly 1.0 or very close to it (within 0.01), it's likely 100% in decimal format
    // This handles the case where Net Sales shows 1.00% instead of 100.00%
    if (absValue >= 0.99 && absValue <= 1.01) {
      return (value * 100).toFixed(2)
    }
    
    // If value is between 0 and 1 (exclusive), it's a decimal format (0.01 = 1%)
    if (absValue > 0 && absValue < 1) {
      return (value * 100).toFixed(2)
    }
    
    // If value is >= 1 and < 10, it could be either format
    // But if it's close to 1.0, treat as 100%
    if (absValue >= 1 && absValue < 10) {
      // Check if it's very close to 1.0 (like 1.0, 1.00, etc.)
      if (Math.abs(absValue - 1.0) < 0.1) {
        return (value * 100).toFixed(2)
      }
      // Otherwise, it's already in percentage format (e.g., 5 = 5%)
      return value.toFixed(2)
    }
    
    // For values >= 10, they're already in percentage format (10 = 10%, 100 = 100%)
    return value.toFixed(2)
  }

  // Helper function to render table cells based on visibility
  const renderTableCells = (
    tableName: keyof typeof columnVisibility,
    item: any,
    actualsColorClass: string = '',
    actualsPercentageColorClass: string = ''
  ) => {
    const cols = columnVisibility[tableName]
    const cells: JSX.Element[] = []

    // Ledger Account is always visible
    cells.push(
      <TableCell key="ledgerAccount" className="px-4 py-2 font-medium">
        {item.ledgerAccount || '-'}
      </TableCell>
    )

    if (cols.actuals) {
      cells.push(
        <TableCell key="actuals" className={`px-4 py-2 text-right ${actualsColorClass}`}>
          {typeof item.actuals === 'number' ? item.actuals.toLocaleString() : (item.actuals || '0')}
        </TableCell>
      )
    }

    if (cols.actualsPercentage) {
      cells.push(
        <TableCell key="actualsPercentage" className={`px-4 py-2 text-right ${actualsPercentageColorClass}`}>
          {formatPercentage(item.actualsPercentage)}%
        </TableCell>
      )
    }

    if (cols.plan) {
      cells.push(
        <TableCell key="plan" className="px-4 py-2 text-right">
          {typeof item.plan === 'number' ? item.plan.toLocaleString() : (item.plan || '0')}
        </TableCell>
      )
    }

    if (cols.planPercentage) {
      cells.push(
        <TableCell key="planPercentage" className="px-4 py-2 text-right">
          {formatPercentage(item.planPercentage)}%
        </TableCell>
      )
    }

    if (cols.vfp) {
      cells.push(
        <TableCell key="vfp" className="px-4 py-2 text-right">
          {typeof item.vfp === 'number' ? item.vfp.toLocaleString() : (item.vfp || '0')}
        </TableCell>
      )
    }

    if (cols.priorYear) {
      cells.push(
        <TableCell key="priorYear" className="px-4 py-2 text-right">
          {typeof item.priorYear === 'number' ? item.priorYear.toLocaleString() : (item.priorYear || '0')}
        </TableCell>
      )
    }

    if (cols.priorYearPercentage) {
      cells.push(
        <TableCell key="priorYearPercentage" className="px-4 py-2 text-right">
          {formatPercentage(item.priorYearPercentage)}%
        </TableCell>
      )
    }

    if (cols.actualYtd) {
      cells.push(
        <TableCell key="actualYtd" className="px-4 py-2 text-right">
          {typeof item.actualYtd === 'number' ? item.actualYtd.toLocaleString() : (item.actualYtd || '0')}
        </TableCell>
      )
    }

    if (cols.actualYtdPercentage) {
      cells.push(
        <TableCell key="actualYtdPercentage" className="px-4 py-2 text-right">
          {formatPercentage(item.actualYtdPercentage)}%
        </TableCell>
      )
    }

    if (cols.planYtd) {
      cells.push(
        <TableCell key="planYtd" className="px-4 py-2 text-right">
          {typeof item.planYtd === 'number' ? item.planYtd.toLocaleString() : (item.planYtd || '0')}
        </TableCell>
      )
    }

    if (cols.planYtdPercentage) {
      cells.push(
        <TableCell key="planYtdPercentage" className="px-4 py-2 text-right">
          {formatPercentage(item.planYtdPercentage)}%
        </TableCell>
      )
    }

    if (cols.vfpYtd) {
      cells.push(
        <TableCell key="vfpYtd" className="px-4 py-2 text-right">
          {typeof item.vfpYtd === 'number' ? item.vfpYtd.toLocaleString() : (item.vfpYtd || '0')}
        </TableCell>
      )
    }

    if (cols.priorYearYtd) {
      cells.push(
        <TableCell key="priorYearYtd" className="px-4 py-2 text-right">
          {typeof item.priorYearYtd === 'number' ? item.priorYearYtd.toLocaleString() : (item.priorYearYtd || '0')}
        </TableCell>
      )
    }

    if (cols.priorYearYtdPercentage) {
      cells.push(
        <TableCell key="priorYearYtdPercentage" className="px-4 py-2 text-right">
          {formatPercentage(item.priorYearYtdPercentage)}%
        </TableCell>
      )
    }

    return cells
  }

  // Helper function to render column filter dropdown for a table
  const renderColumnFilter = (tableName: keyof typeof columnVisibility) => {
    const cols = columnVisibility[tableName]
    return (
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="outline" size="sm" className="iron-border">
            <Settings2 className="h-4 w-4 mr-2" />
            Columns
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="w-56">
          <DropdownMenuLabel>Toggle Columns</DropdownMenuLabel>
          <DropdownMenuSeparator />
          <DropdownMenuCheckboxItem
            checked={cols.actuals}
            onCheckedChange={(checked) =>
              setColumnVisibility({
                ...columnVisibility,
                [tableName]: { ...cols, actuals: checked === true },
              })
            }
          >
            Actuals
          </DropdownMenuCheckboxItem>
          <DropdownMenuCheckboxItem
            checked={cols.actualsPercentage}
            onCheckedChange={(checked) =>
              setColumnVisibility({
                ...columnVisibility,
                [tableName]: { ...cols, actualsPercentage: checked === true },
              })
            }
          >
            Actuals %
          </DropdownMenuCheckboxItem>
          <DropdownMenuCheckboxItem
            checked={cols.plan}
            onCheckedChange={(checked) =>
              setColumnVisibility({
                ...columnVisibility,
                [tableName]: { ...cols, plan: checked === true },
              })
            }
          >
            Plan
          </DropdownMenuCheckboxItem>
          <DropdownMenuCheckboxItem
            checked={cols.planPercentage}
            onCheckedChange={(checked) =>
              setColumnVisibility({
                ...columnVisibility,
                [tableName]: { ...cols, planPercentage: checked === true },
              })
            }
          >
            Plan %
          </DropdownMenuCheckboxItem>
          <DropdownMenuCheckboxItem
            checked={cols.vfp}
            onCheckedChange={(checked) =>
              setColumnVisibility({
                ...columnVisibility,
                [tableName]: { ...cols, vfp: checked === true },
              })
            }
          >
            VFP
          </DropdownMenuCheckboxItem>
          <DropdownMenuCheckboxItem
            checked={cols.priorYear}
            onCheckedChange={(checked) =>
              setColumnVisibility({
                ...columnVisibility,
                [tableName]: { ...cols, priorYear: checked === true },
              })
            }
          >
            Prior Year
          </DropdownMenuCheckboxItem>
          <DropdownMenuCheckboxItem
            checked={cols.priorYearPercentage}
            onCheckedChange={(checked) =>
              setColumnVisibility({
                ...columnVisibility,
                [tableName]: { ...cols, priorYearPercentage: checked === true },
              })
            }
          >
            Prior Year %
          </DropdownMenuCheckboxItem>
          <DropdownMenuSeparator />
          <DropdownMenuCheckboxItem
            checked={cols.actualYtd}
            onCheckedChange={(checked) =>
              setColumnVisibility({
                ...columnVisibility,
                [tableName]: { ...cols, actualYtd: checked === true },
              })
            }
          >
            Actual YTD
          </DropdownMenuCheckboxItem>
          <DropdownMenuCheckboxItem
            checked={cols.actualYtdPercentage}
            onCheckedChange={(checked) =>
              setColumnVisibility({
                ...columnVisibility,
                [tableName]: { ...cols, actualYtdPercentage: checked === true },
              })
            }
          >
            Actual YTD %
          </DropdownMenuCheckboxItem>
          <DropdownMenuCheckboxItem
            checked={cols.planYtd}
            onCheckedChange={(checked) =>
              setColumnVisibility({
                ...columnVisibility,
                [tableName]: { ...cols, planYtd: checked === true },
              })
            }
          >
            Plan YTD
          </DropdownMenuCheckboxItem>
          <DropdownMenuCheckboxItem
            checked={cols.planYtdPercentage}
            onCheckedChange={(checked) =>
              setColumnVisibility({
                ...columnVisibility,
                [tableName]: { ...cols, planYtdPercentage: checked === true },
              })
            }
          >
            Plan YTD %
          </DropdownMenuCheckboxItem>
          <DropdownMenuCheckboxItem
            checked={cols.vfpYtd}
            onCheckedChange={(checked) =>
              setColumnVisibility({
                ...columnVisibility,
                [tableName]: { ...cols, vfpYtd: checked === true },
              })
            }
          >
            VFP YTD
          </DropdownMenuCheckboxItem>
          <DropdownMenuCheckboxItem
            checked={cols.priorYearYtd}
            onCheckedChange={(checked) =>
              setColumnVisibility({
                ...columnVisibility,
                [tableName]: { ...cols, priorYearYtd: checked === true },
              })
            }
          >
            Prior Year YTD
          </DropdownMenuCheckboxItem>
          <DropdownMenuCheckboxItem
            checked={cols.priorYearYtdPercentage}
            onCheckedChange={(checked) =>
              setColumnVisibility({
                ...columnVisibility,
                [tableName]: { ...cols, priorYearYtdPercentage: checked === true },
              })
            }
          >
            Prior Year YTD %
          </DropdownMenuCheckboxItem>
        </DropdownMenuContent>
      </DropdownMenu>
    )
  }

  const yearNum = year ? parseInt(year) : 0
  const periodNum = period ? parseInt(period) : 0

  const { data: plReport, isLoading, error } = useSWR(
    yearNum && periodNum ? `/pl/${yearNum}/${periodNum}` : null,
    plReportFetcher,
    {
      revalidateOnFocus: false,
    }
  )

  const handleDelete = async () => {
    if (!confirm(`Are you sure you want to delete P&L data for ${year} Period ${period}?`)) {
      return
    }
    setIsDeleting(true)
    try {
      await deletePlReport(yearNum, periodNum)
      navigate('/pl')
    } catch (error: any) {
      console.error('Error deleting P&L report:', error)
      alert(`Failed to delete: ${error.message || 'Unknown error'}`)
    } finally {
      setIsDeleting(false)
    }
  }

  if (isLoading) {
    return (
      <div className="flex flex-col gap-6">
        <Skeleton className="h-12 w-64" />
        <Skeleton className="h-96 w-full" />
      </div>
    )
  }

  if (error || !plReport) {
    return (
      <div className="rounded-xl border border-red-500/50 bg-red-950/20 p-6">
        <h2 className="text-xl font-bold text-red-400 mb-2">Error</h2>
        <p className="text-red-300">
          {error?.message || 'Failed to load P&L report'}
        </p>
        <Button
          onClick={() => navigate('/pl')}
          variant="outline"
          className="mt-4 iron-border"
        >
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back to P&L
        </Button>
      </div>
    )
  }

  const plData = {
    storeName: plReport.storeName,
    company: plReport.company,
    period: plReport.periodString,
    translationCurrency: plReport.translationCurrency,
    lineItems: Array.isArray(plReport.lineItems) ? plReport.lineItems : [],
    summaryData: plReport.summaryData || {},
  }

  return (
    <div className="flex flex-col gap-6">
      {/* Header */}
      <div className="rounded-xl border border-primary/20 bg-card/40 backdrop-blur-sm p-6 md:p-8 shadow-lg">
        <div className="flex items-center justify-between mb-4">
          <div>
            <Button
              onClick={() => navigate('/pl')}
              variant="ghost"
              size="sm"
              className="mb-4"
            >
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to P&L
            </Button>
            <h1 className="text-2xl md:text-3xl font-bold text-foreground mb-2 iron-text-glow">
              P&L Report - {year} Period {period}
            </h1>
            <div className="h-1 w-24 bg-primary/60 rounded-full iron-glow"></div>
          </div>
          <div className="flex gap-2">
            <Button
              onClick={() => setShowFilters(!showFilters)}
              variant="outline"
              size="sm"
              className="iron-border"
            >
              <Filter className="h-4 w-4 mr-2" />
              Filters
            </Button>
            <Button
              onClick={handleDelete}
              variant="destructive"
              disabled={isDeleting}
              className="iron-border"
            >
              {isDeleting ? (
                'Deleting...'
              ) : (
                <>
                  <Trash2 className="h-4 w-4 mr-2" />
                  Delete Data
                </>
              )}
            </Button>
          </div>
        </div>

        {/* Filters Panel */}
        {showFilters && (
          <div className="mt-6 p-4 rounded-lg border border-primary/20 bg-card/60">
            <h3 className="text-sm font-semibold text-foreground mb-3">Show/Hide Tables</h3>
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
              <div className="flex items-center space-x-2">
                <Checkbox
                  id="sales-breakdown"
                  checked={tableVisibility.salesBreakdown}
                  onCheckedChange={(checked) =>
                    setTableVisibility({ ...tableVisibility, salesBreakdown: checked === true })
                  }
                />
                <label
                  htmlFor="sales-breakdown"
                  className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 cursor-pointer"
                >
                  Sales Breakdown
                </label>
              </div>
              <div className="flex items-center space-x-2">
                <Checkbox
                  id="cogs"
                  checked={tableVisibility.cogs}
                  onCheckedChange={(checked) =>
                    setTableVisibility({ ...tableVisibility, cogs: checked === true })
                  }
                />
                <label
                  htmlFor="cogs"
                  className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 cursor-pointer"
                >
                  COGS
                </label>
              </div>
              <div className="flex items-center space-x-2">
                <Checkbox
                  id="labor"
                  checked={tableVisibility.labor}
                  onCheckedChange={(checked) =>
                    setTableVisibility({ ...tableVisibility, labor: checked === true })
                  }
                />
                <label
                  htmlFor="labor"
                  className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 cursor-pointer"
                >
                  Labor
                </label>
              </div>
              <div className="flex items-center space-x-2">
                <Checkbox
                  id="controllables"
                  checked={tableVisibility.controllables}
                  onCheckedChange={(checked) =>
                    setTableVisibility({ ...tableVisibility, controllables: checked === true })
                  }
                />
                <label
                  htmlFor="controllables"
                  className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 cursor-pointer"
                >
                  Controllables
                </label>
              </div>
              <div className="flex items-center space-x-2">
                <Checkbox
                  id="fixed-costs"
                  checked={tableVisibility.fixedCosts}
                  onCheckedChange={(checked) =>
                    setTableVisibility({ ...tableVisibility, fixedCosts: checked === true })
                  }
                />
                <label
                  htmlFor="fixed-costs"
                  className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 cursor-pointer"
                >
                  Fixed Costs
                </label>
              </div>
              <div className="flex items-center space-x-2">
                <Checkbox
                  id="statistics"
                  checked={tableVisibility.statistics}
                  onCheckedChange={(checked) =>
                    setTableVisibility({ ...tableVisibility, statistics: checked === true })
                  }
                />
                <label
                  htmlFor="statistics"
                  className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 cursor-pointer"
                >
                  Statistics
                </label>
              </div>
              <div className="flex items-center space-x-2">
                <Checkbox
                  id="line-items"
                  checked={tableVisibility.lineItems}
                  onCheckedChange={(checked) =>
                    setTableVisibility({ ...tableVisibility, lineItems: checked === true })
                  }
                />
                <label
                  htmlFor="line-items"
                  className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 cursor-pointer"
                >
                  Line Items
                </label>
              </div>
            </div>
          </div>
        )}

        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          <div>
            <p className="text-sm text-muted-foreground">Store</p>
            <p className="font-semibold text-foreground">{plData.storeName || '-'}</p>
          </div>
          <div>
            <p className="text-sm text-muted-foreground">Company</p>
            <p className="font-semibold text-foreground">{plData.company || '-'}</p>
          </div>
          <div>
            <p className="text-sm text-muted-foreground">Period</p>
            <p className="font-semibold text-foreground">{plData.period || '-'}</p>
          </div>
          <div>
            <p className="text-sm text-muted-foreground">Currency</p>
            <p className="font-semibold text-foreground">{plData.translationCurrency || 'USD'}</p>
          </div>
        </div>
      </div>

      {/* Key Metrics Card */}
      <div className="rounded-xl border border-primary/20 bg-card/40 backdrop-blur-sm p-6 md:p-8 shadow-lg">
        <div className="mb-4">
          <h3 className="text-xl font-bold text-foreground mb-2">
            Key Metrics
          </h3>
          <div className="h-1 w-24 bg-primary/60 rounded-full"></div>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {/* Net Sales */}
          <div className="rounded-lg border border-primary/20 bg-card/60 p-4">
            <div className="text-sm font-medium text-muted-foreground mb-1">Net Sales</div>
            <div className="flex items-center gap-2 mb-1">
              <div className="text-2xl font-bold text-foreground">
                ${(plData.summaryData.netSales || 0).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
              </div>
              {plData.summaryData.netSalesPriorYear && (() => {
                const netSales = plData.summaryData.netSales || 0
                const priorYear = plData.summaryData.netSalesPriorYear || 0
                const difference = netSales - priorYear
                const sss = priorYear !== 0 ? ((difference / priorYear) * 100) : 0
                const isPositive = difference > 0
                
                return (
                  <>
                    {isPositive ? (
                      <ArrowUp className="h-5 w-5 text-green-500" />
                    ) : (
                      <ArrowDown className="h-5 w-5 text-red-500" />
                    )}
                    <div className={`text-sm font-semibold ${isPositive ? 'text-green-500' : 'text-red-500'}`}>
                      SSS: {isPositive ? '+' : ''}{sss.toFixed(2)}%
                    </div>
                  </>
                )
              })()}
            </div>
            {plData.summaryData.netSalesPriorYear && (
              <div className="text-xs text-muted-foreground">
                Prior Year: ${plData.summaryData.netSalesPriorYear.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
              </div>
            )}
          </div>

          {/* Total Transactions */}
          <div className="rounded-lg border border-primary/20 bg-card/60 p-4">
            <div className="text-sm font-medium text-muted-foreground mb-1">Total Transactions</div>
            <div className="flex items-center gap-2 mb-1">
              <div className="text-2xl font-bold text-foreground">
                {(plData.summaryData.totalTransactions || 0).toLocaleString('en-US')}
              </div>
              {(() => {
                // Find Total Transactions from lineItems
                const txItem = plData.lineItems?.find((item: any) => {
                  const accountName = (item.ledgerAccount || '').toLowerCase().trim()
                  return accountName === 'total transactions'
                })
                
                if (txItem && txItem.priorYear) {
                  const transactions = plData.summaryData.totalTransactions || 0
                  const priorYear = txItem.priorYear || 0
                  const difference = transactions - priorYear
                  const sst = priorYear !== 0 ? ((difference / priorYear) * 100) : 0
                  const isPositive = difference > 0
                  
                  return (
                    <>
                      {isPositive ? (
                        <ArrowUp className="h-5 w-5 text-green-500" />
                      ) : (
                        <ArrowDown className="h-5 w-5 text-red-500" />
                      )}
                      <div className={`text-sm font-semibold ${isPositive ? 'text-green-500' : 'text-red-500'}`}>
                        SST: {isPositive ? '+' : ''}{sst.toFixed(2)}%
                      </div>
                    </>
                  )
                }
                return null
              })()}
            </div>
            {(() => {
              const txItem = plData.lineItems?.find((item: any) => {
                const accountName = (item.ledgerAccount || '').toLowerCase().trim()
                return accountName === 'total transactions'
              })
              
              if (txItem && txItem.priorYear) {
                return (
                  <div className="text-xs text-muted-foreground">
                    Prior Year: {(txItem.priorYear || 0).toLocaleString('en-US')}
                  </div>
                )
              }
              return null
            })()}
          </div>

          {/* Check Average */}
          <div className="rounded-lg border border-primary/20 bg-card/60 p-4">
            <div className="text-sm font-medium text-muted-foreground mb-1">Check Average</div>
            <div className="flex items-center gap-2 mb-1">
              <div className="text-2xl font-bold text-foreground">
                ${(plData.summaryData.checkAverage || 0).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
              </div>
              {(() => {
                // Find Check Average from lineItems
                const checkItem = plData.lineItems?.find((item: any) => {
                  const accountName = (item.ledgerAccount || '').toLowerCase().trim()
                  return accountName === 'check avg - net' || accountName.includes('check average')
                })
                
                if (checkItem && checkItem.priorYear) {
                  const checkAvg = plData.summaryData.checkAverage || 0
                  const priorYear = checkItem.priorYear || 0
                  const difference = checkAvg - priorYear
                  const changePercent = priorYear !== 0 ? ((difference / priorYear) * 100) : 0
                  const isPositive = difference > 0
                  
                  return (
                    <>
                      {isPositive ? (
                        <ArrowUp className="h-5 w-5 text-green-500" />
                      ) : (
                        <ArrowDown className="h-5 w-5 text-red-500" />
                      )}
                      <div className={`text-sm font-semibold ${isPositive ? 'text-green-500' : 'text-red-500'}`}>
                        {isPositive ? '+' : ''}{changePercent.toFixed(2)}%
                      </div>
                    </>
                  )
                }
                return null
              })()}
            </div>
            {(() => {
              const checkItem = plData.lineItems?.find((item: any) => {
                const accountName = (item.ledgerAccount || '').toLowerCase().trim()
                return accountName === 'check avg - net' || accountName.includes('check average')
              })
              
              if (checkItem && checkItem.priorYear) {
                return (
                  <div className="text-xs text-muted-foreground">
                    Prior Year: ${(checkItem.priorYear || 0).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                  </div>
                )
              }
              return null
            })()}
          </div>

          {/* OLO% */}
          <div className="rounded-lg border border-primary/20 bg-card/60 p-4">
            <div className="text-sm font-medium text-muted-foreground mb-1">OLO%</div>
            <div className="flex items-center gap-2 mb-1">
              {(() => {
                // Find Panda Digital % and 3rd Party Digital % from lineItems
                const pandaItem = plData.lineItems?.find((item: any) => {
                  const accountName = (item.ledgerAccount || '').toLowerCase().trim()
                  return accountName === 'panda digital %'
                })
                
                const thirdPartyItem = plData.lineItems?.find((item: any) => {
                  const accountName = (item.ledgerAccount || '').toLowerCase().trim()
                  return accountName === '3rd party digital %'
                })
                
                if (pandaItem && thirdPartyItem) {
                  // For percentage items, actuals contains the percentage value (as decimal: 0.089612 = 8.96%)
                  // Need to multiply by 100 to get percentage
                  const pandaCurrent = (pandaItem.actuals || 0) * 100
                  const pandaPrior = (pandaItem.priorYear || 0) * 100
                  const thirdPartyCurrent = (thirdPartyItem.actuals || 0) * 100
                  const thirdPartyPrior = (thirdPartyItem.priorYear || 0) * 100
                  
                  const currentOLO = pandaCurrent + thirdPartyCurrent
                  const priorYearOLO = pandaPrior + thirdPartyPrior
                  const difference = currentOLO - priorYearOLO
                  const isPositive = difference > 0
                  
                  return (
                    <>
                      <div className="text-2xl font-bold text-foreground">
                        {currentOLO.toFixed(2)}%
                      </div>
                      {isPositive ? (
                        <ArrowUp className="h-5 w-5 text-green-500" />
                      ) : (
                        <ArrowDown className="h-5 w-5 text-red-500" />
                      )}
                      <div className={`text-sm font-semibold ${isPositive ? 'text-green-500' : 'text-red-500'}`}>
                        {isPositive ? '+' : ''}{difference.toFixed(2)}pp
                      </div>
                    </>
                  )
                }
                return <div className="text-2xl font-bold text-foreground">N/A</div>
              })()}
            </div>
            {(() => {
              const pandaItem = plData.lineItems?.find((item: any) => {
                const accountName = (item.ledgerAccount || '').toLowerCase().trim()
                return accountName === 'panda digital %'
              })
              
              const thirdPartyItem = plData.lineItems?.find((item: any) => {
                const accountName = (item.ledgerAccount || '').toLowerCase().trim()
                return accountName === '3rd party digital %'
              })
              
              if (pandaItem && thirdPartyItem) {
                const pandaPrior = (pandaItem.priorYear || 0) * 100
                const thirdPartyPrior = (thirdPartyItem.priorYear || 0) * 100
                const priorYearOLO = pandaPrior + thirdPartyPrior
                return (
                  <div className="text-xs text-muted-foreground">
                    Prior Year: {priorYearOLO.toFixed(2)}%
                  </div>
                )
              }
              return null
            })()}
          </div>

          {/* COGS */}
          <div className="rounded-lg border border-primary/20 bg-card/60 p-4">
            <div className="text-sm font-medium text-muted-foreground mb-1">COGS</div>
            <div className="flex items-center gap-2 mb-1">
              {plData.summaryData.netSales && plData.summaryData.costOfGoodsSold ? (
                <>
                  <div className="text-2xl font-bold text-foreground">
                    {((plData.summaryData.costOfGoodsSold / plData.summaryData.netSales) * 100).toFixed(2)}%
                  </div>
                  {plData.summaryData.netSalesPriorYear && plData.summaryData.costOfGoodsSoldPriorYear && (() => {
                    const currentPercent = (plData.summaryData.costOfGoodsSold / plData.summaryData.netSales) * 100
                    const priorYearPercent = (plData.summaryData.costOfGoodsSoldPriorYear / plData.summaryData.netSalesPriorYear) * 100
                    const difference = currentPercent - priorYearPercent
                    const isPositive = difference < 0 // Для COGS меньше = лучше (зеленый)
                    
                    return (
                      <>
                        {isPositive ? (
                          <ArrowDown className="h-5 w-5 text-green-500" />
                        ) : (
                          <ArrowUp className="h-5 w-5 text-red-500" />
                        )}
                        <div className={`text-sm font-semibold ${isPositive ? 'text-green-500' : 'text-red-500'}`}>
                          {isPositive ? '' : '+'}{difference.toFixed(2)}pp
                        </div>
                      </>
                    )
                  })()}
                </>
              ) : (
                <div className="text-2xl font-bold text-foreground">N/A</div>
              )}
            </div>
            {plData.summaryData.costOfGoodsSoldPriorYear && plData.summaryData.netSalesPriorYear && (
              <div className="text-xs text-muted-foreground">
                Prior Year: {((plData.summaryData.costOfGoodsSoldPriorYear / plData.summaryData.netSalesPriorYear) * 100).toFixed(2)}%
              </div>
            )}
          </div>

          {/* Total Labor */}
          <div className="rounded-lg border border-primary/20 bg-card/60 p-4">
            <div className="text-sm font-medium text-muted-foreground mb-1">Total Labor</div>
            <div className="flex items-center gap-2 mb-1">
              {plData.summaryData.netSales && plData.summaryData.totalLabor ? (
                <>
                  <div className="text-2xl font-bold text-foreground">
                    {((plData.summaryData.totalLabor / plData.summaryData.netSales) * 100).toFixed(2)}%
                  </div>
                  {plData.summaryData.netSalesPriorYear && plData.summaryData.totalLaborPriorYear && (() => {
                    const currentPercent = (plData.summaryData.totalLabor / plData.summaryData.netSales) * 100
                    const priorYearPercent = (plData.summaryData.totalLaborPriorYear / plData.summaryData.netSalesPriorYear) * 100
                    const difference = currentPercent - priorYearPercent
                    const isPositive = difference < 0 // Для Labor меньше = лучше (зеленый)
                    
                    return (
                      <>
                        {isPositive ? (
                          <ArrowDown className="h-5 w-5 text-green-500" />
                        ) : (
                          <ArrowUp className="h-5 w-5 text-red-500" />
                        )}
                        <div className={`text-sm font-semibold ${isPositive ? 'text-green-500' : 'text-red-500'}`}>
                          {isPositive ? '' : '+'}{difference.toFixed(2)}pp
                        </div>
                      </>
                    )
                  })()}
                </>
              ) : (
                <div className="text-2xl font-bold text-foreground">N/A</div>
              )}
            </div>
            {plData.summaryData.totalLaborPriorYear && plData.summaryData.netSalesPriorYear && (
              <div className="text-xs text-muted-foreground">
                Prior Year: {((plData.summaryData.totalLaborPriorYear / plData.summaryData.netSalesPriorYear) * 100).toFixed(2)}%
              </div>
            )}
          </div>

          {/* Controllable Profit */}
          <div className="rounded-lg border border-primary/20 bg-card/60 p-4">
            <div className="text-sm font-medium text-muted-foreground mb-1">Controllable Profit</div>
            <div className="flex items-center gap-2 mb-1">
              {plData.summaryData.netSales && plData.summaryData.controllableProfit ? (
                <>
                  <div className="text-2xl font-bold text-foreground">
                    {((plData.summaryData.controllableProfit / plData.summaryData.netSales) * 100).toFixed(2)}%
                  </div>
                  {plData.summaryData.netSalesPriorYear && plData.summaryData.controllableProfitPriorYear && (() => {
                    const currentPercent = (plData.summaryData.controllableProfit / plData.summaryData.netSales) * 100
                    const priorYearPercent = (plData.summaryData.controllableProfitPriorYear / plData.summaryData.netSalesPriorYear) * 100
                    const difference = currentPercent - priorYearPercent
                    const isPositive = difference > 0 // Для Profit больше = лучше (зеленый)
                    
                    return (
                      <>
                        {isPositive ? (
                          <ArrowUp className="h-5 w-5 text-green-500" />
                        ) : (
                          <ArrowDown className="h-5 w-5 text-red-500" />
                        )}
                        <div className={`text-sm font-semibold ${isPositive ? 'text-green-500' : 'text-red-500'}`}>
                          {isPositive ? '+' : ''}{difference.toFixed(2)}pp
                        </div>
                      </>
                    )
                  })()}
                </>
              ) : (
                <div className="text-2xl font-bold text-foreground">N/A</div>
              )}
            </div>
            {plData.summaryData.controllableProfitPriorYear && plData.summaryData.netSalesPriorYear && (
              <div className="text-xs text-muted-foreground">
                Prior Year: {((plData.summaryData.controllableProfitPriorYear / plData.summaryData.netSalesPriorYear) * 100).toFixed(2)}%
              </div>
            )}
          </div>

          {/* Restaurant Contribution */}
          <div className="rounded-lg border border-primary/20 bg-card/60 p-4">
            <div className="text-sm font-medium text-muted-foreground mb-1">Restaurant Contribution</div>
            <div className="flex items-center gap-2 mb-1">
              {plData.summaryData.netSales && plData.summaryData.controllableProfit && plData.summaryData.fixedCosts ? (
                <>
                  {(() => {
                    const restaurantContribution = plData.summaryData.controllableProfit - plData.summaryData.fixedCosts
                    const restaurantContributionPercent = (restaurantContribution / plData.summaryData.netSales) * 100
                    
                    let priorYearPercent = 0
                    let difference = 0
                    if (plData.summaryData.netSalesPriorYear && plData.summaryData.controllableProfitPriorYear && plData.summaryData.fixedCostsPriorYear) {
                      const priorYearRC = plData.summaryData.controllableProfitPriorYear - plData.summaryData.fixedCostsPriorYear
                      priorYearPercent = (priorYearRC / plData.summaryData.netSalesPriorYear) * 100
                      difference = restaurantContributionPercent - priorYearPercent
                    }
                    const isPositive = difference > 0
                    
                    return (
                      <>
                        <div className="text-2xl font-bold text-foreground">
                          {restaurantContributionPercent.toFixed(2)}%
                        </div>
                        {plData.summaryData.netSalesPriorYear && plData.summaryData.controllableProfitPriorYear && plData.summaryData.fixedCostsPriorYear && (
                          <>
                            {isPositive ? (
                              <ArrowUp className="h-5 w-5 text-green-500" />
                            ) : (
                              <ArrowDown className="h-5 w-5 text-red-500" />
                            )}
                            <div className={`text-sm font-semibold ${isPositive ? 'text-green-500' : 'text-red-500'}`}>
                              {isPositive ? '+' : ''}{difference.toFixed(2)}pp
                            </div>
                          </>
                        )}
                      </>
                    )
                  })()}
                </>
              ) : (
                <div className="text-2xl font-bold text-foreground">N/A</div>
              )}
            </div>
            {plData.summaryData.netSalesPriorYear && plData.summaryData.controllableProfitPriorYear && plData.summaryData.fixedCostsPriorYear && (
              <div className="text-xs text-muted-foreground">
                Prior Year: {(((plData.summaryData.controllableProfitPriorYear - plData.summaryData.fixedCostsPriorYear) / plData.summaryData.netSalesPriorYear) * 100).toFixed(2)}%
              </div>
            )}
            <div className="text-xs text-muted-foreground mt-1 italic">
              = Controllable Profit - Fixed Cost
            </div>
          </div>

          {/* Rent $ */}
          <div className="rounded-lg border border-primary/20 bg-card/60 p-4">
            <div className="text-sm font-medium text-muted-foreground mb-1">Rent $</div>
            <div className="flex items-center gap-2 mb-1">
              {(() => {
                // Find Rent - MIN and Rent - Other from lineItems
                const rentMin = plData.lineItems?.find((item: any) => {
                  const accountName = (item.ledgerAccount || '').toLowerCase().trim()
                  return accountName === 'rent - min'
                })
                
                const rentOther = plData.lineItems?.find((item: any) => {
                  const accountName = (item.ledgerAccount || '').toLowerCase().trim()
                  return accountName === 'rent - other'
                })
                
                if (rentMin && rentOther) {
                  const totalRent = (rentMin.actuals || 0) + (rentOther.actuals || 0)
                  const priorYearRent = (rentMin.priorYear || 0) + (rentOther.priorYear || 0)
                  const difference = totalRent - priorYearRent
                  const isPositive = difference < 0 // Для Rent меньше = лучше (зеленый)
                  
                  return (
                    <>
                      <div className="text-2xl font-bold text-foreground">
                        ${totalRent.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                      </div>
                      {isPositive ? (
                        <ArrowDown className="h-5 w-5 text-green-500" />
                      ) : (
                        <ArrowUp className="h-5 w-5 text-red-500" />
                      )}
                      <div className={`text-sm font-semibold ${isPositive ? 'text-green-500' : 'text-red-500'}`}>
                        {isPositive ? '' : '+'}${Math.abs(difference).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                      </div>
                    </>
                  )
                }
                return <div className="text-2xl font-bold text-foreground">N/A</div>
              })()}
            </div>
            {(() => {
              const rentMin = plData.lineItems?.find((item: any) => {
                const accountName = (item.ledgerAccount || '').toLowerCase().trim()
                return accountName === 'rent - min'
              })
              
              const rentOther = plData.lineItems?.find((item: any) => {
                const accountName = (item.ledgerAccount || '').toLowerCase().trim()
                return accountName === 'rent - other'
              })
              
              if (rentMin && rentOther) {
                const priorYearRent = (rentMin.priorYear || 0) + (rentOther.priorYear || 0)
                return (
                  <div className="text-xs text-muted-foreground">
                    Prior Year: ${priorYearRent.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                  </div>
                )
              }
              return null
            })()}
            <div className="text-xs text-muted-foreground mt-1 italic">
              = Rent - MIN + Rent - Other
            </div>
          </div>

          {/* Flow Thru %} */}
          <div className="rounded-lg border border-primary/20 bg-card/60 p-4">
            <div className="text-sm font-medium text-muted-foreground mb-1">Flow Thru %</div>
            <div className="flex items-center gap-2 mb-1">
              {(() => {
                const cpActual = plData.summaryData.controllableProfit || 0
                const cpPrior = plData.summaryData.controllableProfitPriorYear || 0
                const nsActual = plData.summaryData.netSales || 0
                const nsPrior = plData.summaryData.netSalesPriorYear || 0
                
                const cpDiff = cpActual - cpPrior
                const nsDiff = nsActual - nsPrior
                
                if (nsDiff !== 0) {
                  const flowThru = (cpDiff / nsDiff) * 100
                  const isPositive = flowThru > 0
                  
                  return (
                    <>
                      <div className="text-2xl font-bold text-foreground">
                        {flowThru.toFixed(2)}%
                      </div>
                      {isPositive ? (
                        <ArrowUp className="h-5 w-5 text-green-500" />
                      ) : (
                        <ArrowDown className="h-5 w-5 text-red-500" />
                      )}
                    </>
                  )
                }
                return <div className="text-2xl font-bold text-foreground">N/A</div>
              })()}
            </div>
            <div className="text-xs text-muted-foreground mt-1 italic">
              = (CP Actual - CP Prior) / (NS Actual - NS Prior) × 100
            </div>
          </div>

          {/* Top Expensive Controllable */}
          {(() => {
            // Get Controllables items (same logic as in the table)
            const controllablesExactNames = [
              'Third Party Delivery Fee',
              'Credit Card Fees',
              'Broadband',
              'Electricity',
              'Gas',
              'Telephone',
              'Waste Disposal',
              'Water',
              'Computer Software Expense',
              'Office and Computer Supplies',
              'Education and Training Other',
              'Recruitment',
              'Professional Services',
              'Travel Expenses',
              'Bank Fees',
              'Dues and Subscriptions',
              'Moving and Relocation Expenses',
              'Other Expenses',
              'Postage and Courier Service',
              'Repairs',
              'Maintenance',
              'Restaurant Expenses',
              'Restaurant Supplies',
              'Total Controllables',
              'Profit Before Adv',
              'Advertising',
              'Corporate Advertising',
              'Media',
              'Local Store Marketing',
              'Grand Opening',
              'Lease Marketing',
              'Controllable Profit',
            ]
            
            const controllablesItems = plData.lineItems?.filter((item: any) => {
              const accountName = (item.ledgerAccount || '').trim()
              return controllablesExactNames.some(exactName => 
                accountName.toLowerCase() === exactName.toLowerCase()
              )
            }) || []
            
            // Exclude specific items and totals
            const excludedNames = [
              'corporate advertising',
              'media',
              'local store marketing',
              'advertising',
              'credit card fees',
              'third party delivery fee',
              'restaurant expenses',
              'total controllables',
              'profit before adv',
              'controllable profit'
            ]
            
            // Find the most expensive controllable (excluding specified items)
            const topExpensive = controllablesItems
              .filter((item: any) => {
                const name = (item.ledgerAccount || '').toLowerCase().trim()
                return !excludedNames.includes(name) && 
                       typeof item.actuals === 'number' && 
                       item.actuals > 0
              })
              .sort((a: any, b: any) => (b.actuals || 0) - (a.actuals || 0))[0]
            
            if (!topExpensive) return null
            
            const actuals = topExpensive.actuals || 0
            const priorYear = topExpensive.priorYear || 0
            const difference = actuals - priorYear
            const isPositive = difference < 0 // Для Controllables меньше = лучше (зеленый)
            
            return (
              <div className="rounded-lg border border-primary/20 bg-card/60 p-4">
                <div className="text-sm font-medium text-muted-foreground mb-1">Top Controllable</div>
                <div className="text-xs font-semibold text-foreground mb-2 truncate" title={topExpensive.ledgerAccount}>
                  {topExpensive.ledgerAccount}
                </div>
                <div className="flex items-center gap-2 mb-1">
                  <div className="text-2xl font-bold text-foreground">
                    ${actuals.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                  </div>
                  {isPositive ? (
                    <ArrowDown className="h-5 w-5 text-green-500" />
                  ) : (
                    <ArrowUp className="h-5 w-5 text-red-500" />
                  )}
                  <div className={`text-sm font-semibold ${isPositive ? 'text-green-500' : 'text-red-500'}`}>
                    {isPositive ? '' : '+'}${Math.abs(difference).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                  </div>
                </div>
                {priorYear > 0 && (
                  <div className="text-xs text-muted-foreground">
                    Prior Year: ${priorYear.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                  </div>
                )}
              </div>
            )
          })()}
        </div>
      </div>

      {/* Calculations Card - Hidden by default */}
      {showCalculations && (
        <div className="rounded-xl border border-primary/20 bg-card/40 backdrop-blur-sm p-6 md:p-8 shadow-lg">
        <div className="mb-4">
          <h3 className="text-xl font-bold text-foreground mb-2">
            Calculations
          </h3>
          <div className="h-1 w-16 bg-primary/60 rounded-full"></div>
        </div>

        <div className="space-y-6">
          {/* SSS Calculation */}
          {(() => {
            // Find Net Sales from lineItems
            const netSalesItem = plData.lineItems?.find((item: any) => {
              const accountName = (item.ledgerAccount || '').toLowerCase().trim()
              return accountName === 'net sales'
            })

            const actualNetSales = netSalesItem?.actuals || 0
            const priorYearNetSales = netSalesItem?.priorYear || 0

            // Calculate SSS: ((Actual Net Sales - Prior Year Net Sales) / Prior Year Net Sales) x 100%
            let sss = 0
            let canCalculate = false
            
            if (priorYearNetSales !== 0 && typeof actualNetSales === 'number' && typeof priorYearNetSales === 'number') {
              sss = ((actualNetSales - priorYearNetSales) / priorYearNetSales) * 100
              canCalculate = true
            }

            const sssColorClass = sss > 0 ? 'text-green-500' : sss < 0 ? 'text-red-500' : ''

            return (
              <div className="border border-primary/20 rounded-lg p-5 bg-card/60">
                <div className="mb-4">
                  <h4 className="text-lg font-semibold text-foreground mb-1">SSS (Same Store Sales)</h4>
                  <p className="text-xs text-muted-foreground">
                    Same Store Sales Growth: ((Actual Net Sales - Prior Year Net Sales) / Prior Year Net Sales) × 100%
                  </p>
                </div>
                
                {canCalculate ? (
                  <div className="space-y-3">
                    {/* Main calculation line */}
                    <div className="flex flex-wrap items-baseline gap-2 text-base leading-relaxed">
                      <span className="font-semibold text-foreground">SSS</span>
                      <span className="text-muted-foreground">=</span>
                      <span className="text-muted-foreground">(</span>
                      <span className="text-muted-foreground">(</span>
                      <span className="font-mono font-semibold text-foreground bg-primary/10 px-2 py-1 rounded">
                        {typeof actualNetSales === 'number' ? actualNetSales.toLocaleString() : 'N/A'}
                      </span>
                      <span className="text-muted-foreground font-medium">−</span>
                      <span className="font-mono font-semibold text-foreground bg-primary/10 px-2 py-1 rounded">
                        {typeof priorYearNetSales === 'number' ? priorYearNetSales.toLocaleString() : 'N/A'}
                      </span>
                      <span className="text-muted-foreground">)</span>
                      <span className="text-muted-foreground font-medium mx-1">÷</span>
                      <span className="font-mono font-semibold text-foreground bg-primary/10 px-2 py-1 rounded">
                        {typeof priorYearNetSales === 'number' ? priorYearNetSales.toLocaleString() : 'N/A'}
                      </span>
                      <span className="text-muted-foreground">)</span>
                      <span className="text-muted-foreground font-medium mx-1">×</span>
                      <span className="text-muted-foreground">100%</span>
                      <span className="text-muted-foreground">=</span>
                      <span className={`text-2xl font-bold px-3 py-1.5 rounded-md ${sssColorClass} ${sss > 0 ? 'bg-green-500/10' : sss < 0 ? 'bg-red-500/10' : 'bg-muted/10'}`}>
                        {sss !== 0 ? `${sss > 0 ? '+' : ''}${sss.toFixed(2)}%` : '0.00%'}
                      </span>
                    </div>
                    
                    {/* Breakdown with labels */}
                    <div className="pt-3 border-t border-primary/20">
                      <div className="grid grid-cols-2 gap-3 text-sm">
                        <div>
                          <div className="text-xs text-muted-foreground mb-1">Actual Net Sales</div>
                          <div className="font-mono font-semibold text-foreground">
                            {typeof actualNetSales === 'number' ? actualNetSales.toLocaleString() : 'N/A'}
                          </div>
                        </div>
                        <div>
                          <div className="text-xs text-muted-foreground mb-1">Prior Year Net Sales</div>
                          <div className="font-mono font-semibold text-foreground">
                            {typeof priorYearNetSales === 'number' ? priorYearNetSales.toLocaleString() : 'N/A'}
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="text-sm text-muted-foreground bg-muted/20 p-3 rounded border border-muted">
                    Cannot calculate: Prior Year Net Sales is zero or missing
                  </div>
                )}
              </div>
            )
          })()}
        </div>
      </div>
      )}

      {/* Sales Breakdown Table */}
      {tableVisibility.salesBreakdown && (() => {
        const salesKeywords = [
          'food sales', 'drink sales', 'retail sales', 'gross sales',
          'employee meals', '20% emp discount', 'emp discount',
          'coupons', 'promotions', 'net sales'
        ]
        const salesItems = plData.lineItems?.filter((item: any) => {
          const accountName = (item.ledgerAccount || '').toLowerCase()
          // Exclude PSA - Net Sales
          if (accountName.includes('psa - net sales')) {
            return false
          }
          return salesKeywords.some(keyword => accountName.includes(keyword.toLowerCase()))
        }) || []

        if (salesItems.length === 0) return null

        return (
          <div className="rounded-xl border border-primary/20 bg-card/40 backdrop-blur-sm p-6 md:p-8 shadow-lg">
            <div className="mb-4 flex items-center justify-between">
              <div>
                <h3 className="text-xl font-bold text-foreground mb-2">
                  Sales Breakdown
                </h3>
                <div className="h-1 w-16 bg-primary/60 rounded-full"></div>
                <p className="text-sm text-muted-foreground mt-2">
                  {salesItems.length} items
                </p>
              </div>
              {renderColumnFilter('salesBreakdown')}
            </div>

            <div className="overflow-x-auto border border-primary/20 rounded-lg">
              <Table>
                <TableHeader>
                  <TableRow className="bg-primary/10">
                    {renderTableHeaders('salesBreakdown')}
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {salesItems.map((item: any, index: number) => {
                    const accountName = (item.ledgerAccount || '').toLowerCase()
                    const isTargetItem = ['food sales', 'drink sales', 'retail sales', 'gross sales', 'net sales'].some(
                      keyword => accountName.includes(keyword)
                    )
                    const isReverseItem = ['employee meals', 'emp discount', 'coupons', 'promotions'].some(
                      keyword => accountName.includes(keyword)
                    )
                    
                    // Determine color for Actuals and Actuals % columns
                    let actualsColorClass = ''
                    let actualsPercentageColorClass = ''
                    
                    // For Food Sales, Drink Sales, Retail Sales, Gross Sales, Net Sales: green if higher, red if lower
                    if (isTargetItem && typeof item.actuals === 'number' && typeof item.priorYear === 'number') {
                      if (item.actuals > item.priorYear) {
                        actualsColorClass = 'text-green-500 font-semibold'
                        actualsPercentageColorClass = 'text-green-500 font-semibold'
                      } else if (item.actuals < item.priorYear) {
                        actualsColorClass = 'text-red-500 font-semibold'
                        actualsPercentageColorClass = 'text-red-500 font-semibold'
                      }
                    }
                    
                    // For Employee Meals, 20% Emp Discount, Coupons/Promotions: red if higher, green if lower
                    if (isReverseItem && typeof item.actuals === 'number' && typeof item.priorYear === 'number') {
                      if (item.actuals > item.priorYear) {
                        actualsColorClass = 'text-red-500 font-semibold'
                        actualsPercentageColorClass = 'text-red-500 font-semibold'
                      } else if (item.actuals < item.priorYear) {
                        actualsColorClass = 'text-green-500 font-semibold'
                        actualsPercentageColorClass = 'text-green-500 font-semibold'
                      }
                    }
                    
                    return (
                      <TableRow key={`sales-${index}`} className="hover:bg-primary/5">
                        {renderTableCells('salesBreakdown', item, actualsColorClass, actualsPercentageColorClass)}
                      </TableRow>
                    )
                  })}
                </TableBody>
              </Table>
            </div>
          </div>
        )
      })()}

      {/* COGS Table */}
      {tableVisibility.cogs && (() => {
        // Exact matches only - case insensitive
        const cogsExactNames = [
          'Grocery',
          'Meat',
          'Produce',
          'Sea Food',
          'Drinks',
          'Paper Goods',
          'Other',
          'Cost of Goods Sold'
        ]
        
        const cogsItems = plData.lineItems?.filter((item: any) => {
          const accountName = (item.ledgerAccount || '').trim()
          
          // Check for exact match (case insensitive)
          return cogsExactNames.some(exactName => 
            accountName.toLowerCase() === exactName.toLowerCase()
          )
        }) || []

        if (cogsItems.length === 0) return null

        return (
          <div className="rounded-xl border border-primary/20 bg-card/40 backdrop-blur-sm p-6 md:p-8 shadow-lg">
            <div className="mb-4 flex items-center justify-between">
              <div>
                <h3 className="text-xl font-bold text-foreground mb-2">
                  COGS
                </h3>
                <div className="h-1 w-16 bg-primary/60 rounded-full"></div>
                <p className="text-sm text-muted-foreground mt-2">
                  {cogsItems.length} items
                </p>
              </div>
              {renderColumnFilter('cogs')}
            </div>

            <div className="overflow-x-auto border border-primary/20 rounded-lg">
              <Table>
                <TableHeader>
                  <TableRow className="bg-primary/10">
                    {renderTableHeaders('cogs')}
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {cogsItems.map((item: any, index: number) => {
                    // Determine color for Actuals column: red if higher than prior year (bad for COGS)
                    let actualsColorClass = ''
                    let actualsPercentageColorClass = ''
                    if (typeof item.actuals === 'number' && typeof item.priorYear === 'number') {
                      if (item.actuals > item.priorYear) {
                        actualsColorClass = 'text-red-500 font-semibold'
                        actualsPercentageColorClass = 'text-red-500 font-semibold'
                      } else if (item.actuals < item.priorYear) {
                        actualsColorClass = 'text-green-500 font-semibold'
                        actualsPercentageColorClass = 'text-green-500 font-semibold'
                      }
                    }
                    
                    return (
                      <TableRow key={`cogs-${index}`} className="hover:bg-primary/5">
                        {renderTableCells('cogs', item, actualsColorClass, actualsPercentageColorClass)}
                      </TableRow>
                    )
                  })}
                </TableBody>
              </Table>
            </div>
          </div>
        )
      })()}

      {/* Labor Table */}
      {tableVisibility.labor && (() => {
        // Exact matches only - case insensitive
        const laborExactNames = [
          'Front',
          'back',
          'Overtime',
          'Training Wages',
          'Emergency Store Closure Pay',
          'Direct Labor',
          'GM Salaries',
          'GM Overtime',
          'Other MGMT Salaries',
          'Other MGMT Overtime',
          'Guaranteed Hourly',
          'Bereavement Pay',
          'Guaranteed Overtime',
          'Management Labor',
          'Payroll Taxes',
          'Meal Break Premium',
          'Rest Break Premium',
          'Scheduling Premium Pay',
          'Workers Comp',
          'Benefits',
          'Bonus',
          'Vacation',
          'Taxes and Benefits',
          'Total Labor'
        ]
        
        const laborItems = plData.lineItems?.filter((item: any) => {
          const accountName = (item.ledgerAccount || '').trim()
          
          // Check for exact match (case insensitive)
          return laborExactNames.some(exactName => 
            accountName.toLowerCase() === exactName.toLowerCase()
          )
        }) || []

        if (laborItems.length === 0) return null

        return (
          <div className="rounded-xl border border-primary/20 bg-card/40 backdrop-blur-sm p-6 md:p-8 shadow-lg">
            <div className="mb-4 flex items-center justify-between">
              <div>
                <h3 className="text-xl font-bold text-foreground mb-2">
                  Labor
                </h3>
                <div className="h-1 w-16 bg-primary/60 rounded-full"></div>
                <p className="text-sm text-muted-foreground mt-2">
                  {laborItems.length} items
                </p>
              </div>
              {renderColumnFilter('labor')}
            </div>

            <div className="overflow-x-auto border border-primary/20 rounded-lg">
              <Table>
                <TableHeader>
                  <TableRow className="bg-primary/10">
                    {renderTableHeaders('labor')}
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {laborItems.map((item: any, index: number) => {
                    // Determine color for Actuals column: red if higher than prior year (bad for Labor)
                    let actualsColorClass = ''
                    let actualsPercentageColorClass = ''
                    if (typeof item.actuals === 'number' && typeof item.priorYear === 'number') {
                      if (item.actuals > item.priorYear) {
                        actualsColorClass = 'text-red-500 font-semibold'
                        actualsPercentageColorClass = 'text-red-500 font-semibold'
                      } else if (item.actuals < item.priorYear) {
                        actualsColorClass = 'text-green-500 font-semibold'
                        actualsPercentageColorClass = 'text-green-500 font-semibold'
                      }
                    }
                    
                    return (
                      <TableRow key={`labor-${index}`} className="hover:bg-primary/5">
                        {renderTableCells('labor', item, actualsColorClass, actualsPercentageColorClass)}
                      </TableRow>
                    )
                  })}
                </TableBody>
              </Table>
            </div>
          </div>
        )
      })()}

      {/* Controllables Table */}
      {tableVisibility.controllables && (() => {
        // Exact matches only - case insensitive
        const controllablesExactNames = [
          'Third Party Delivery Fee',
          'Credit Card Fees',
          'Broadband',
          'Electricity',
          'Gas',
          'Telephone',
          'Waste Disposal',
          'Water',
          'Computer Software Expense',
          'Office and Computer Supplies',
          'Education and Training Other',
          'Recruitment',
          'Professional Services',
          'Travel Expenses',
          'Bank Fees',
          'Dues and Subscriptions',
          'Moving and Relocation Expenses',
          'Other Expenses',
          'Postage and Courier Service',
          'Repairs',
          'Maintenance',
          'Restaurant Expenses',
          'Restaurant Supplies',
          'Total Controllables',
          'Profit Before Adv',
          'Advertising',
          'Corporate Advertising',
          'Media',
          'Local Store Marketing',
          'Grand Opening',
          'Lease Marketing',
          'Controllable Profit'
        ]
        
        const controllablesItems = plData.lineItems?.filter((item: any) => {
          const accountName = (item.ledgerAccount || '').trim()
          
          // Check for exact match (case insensitive)
          return controllablesExactNames.some(exactName => 
            accountName.toLowerCase() === exactName.toLowerCase()
          )
        }) || []

        if (controllablesItems.length === 0) return null

        return (
          <div className="rounded-xl border border-primary/20 bg-card/40 backdrop-blur-sm p-6 md:p-8 shadow-lg">
            <div className="mb-4 flex items-center justify-between">
              <div>
                <h3 className="text-xl font-bold text-foreground mb-2">
                  Controllables
                </h3>
                <div className="h-1 w-16 bg-primary/60 rounded-full"></div>
                <p className="text-sm text-muted-foreground mt-2">
                  {controllablesItems.length} items
                </p>
              </div>
              {renderColumnFilter('controllables')}
            </div>

            <div className="overflow-x-auto border border-primary/20 rounded-lg">
              <Table>
                <TableHeader>
                  <TableRow className="bg-primary/10">
                    {renderTableHeaders('controllables')}
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {controllablesItems.map((item: any, index: number) => {
                    // Determine color for Actuals column: red if higher than prior year (bad for Controllables)
                    let actualsColorClass = ''
                    let actualsPercentageColorClass = ''
                    if (typeof item.actuals === 'number' && typeof item.priorYear === 'number') {
                      if (item.actuals > item.priorYear) {
                        actualsColorClass = 'text-red-500 font-semibold'
                        actualsPercentageColorClass = 'text-red-500 font-semibold'
                      } else if (item.actuals < item.priorYear) {
                        actualsColorClass = 'text-green-500 font-semibold'
                        actualsPercentageColorClass = 'text-green-500 font-semibold'
                      }
                    }
                    
                    return (
                      <TableRow key={`controllables-${index}`} className="hover:bg-primary/5">
                        {renderTableCells('controllables', item, actualsColorClass, actualsPercentageColorClass)}
                      </TableRow>
                    )
                  })}
                </TableBody>
              </Table>
            </div>
          </div>
        )
      })()}

      {/* Fixed Costs Table */}
      {tableVisibility.fixedCosts && (() => {
        // Exact matches only - case insensitive
        const fixedCostsExactNames = [
          'Rent - MIN',
          'Rent - Storage',
          'Rent - Percent',
          'Rent - Other',
          'Rent - Deferred Preopening',
          'Insurance',
          'Taxes',
          'License and Fees',
          'Amortization',
          'Depreciation',
          'Total Fixed Cost'
        ]
        
        const fixedCostsItems = plData.lineItems?.filter((item: any) => {
          const accountName = (item.ledgerAccount || '').trim()
          
          // Check for exact match (case insensitive)
          return fixedCostsExactNames.some(exactName => 
            accountName.toLowerCase() === exactName.toLowerCase()
          )
        }) || []

        if (fixedCostsItems.length === 0) return null

        return (
          <div className="rounded-xl border border-primary/20 bg-card/40 backdrop-blur-sm p-6 md:p-8 shadow-lg">
            <div className="mb-4 flex items-center justify-between">
              <div>
                <h3 className="text-xl font-bold text-foreground mb-2">
                  Fixed Costs
                </h3>
                <div className="h-1 w-16 bg-primary/60 rounded-full"></div>
                <p className="text-sm text-muted-foreground mt-2">
                  {fixedCostsItems.length} items
                </p>
              </div>
              {renderColumnFilter('fixedCosts')}
            </div>

            <div className="overflow-x-auto border border-primary/20 rounded-lg">
              <Table>
                <TableHeader>
                  <TableRow className="bg-primary/10">
                    {renderTableHeaders('fixedCosts')}
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {fixedCostsItems.map((item: any, index: number) => {
                    // Determine color for Actuals column: red if higher than prior year (bad for Fixed Costs)
                    let actualsColorClass = ''
                    let actualsPercentageColorClass = ''
                    if (typeof item.actuals === 'number' && typeof item.priorYear === 'number') {
                      if (item.actuals > item.priorYear) {
                        actualsColorClass = 'text-red-500 font-semibold'
                        actualsPercentageColorClass = 'text-red-500 font-semibold'
                      } else if (item.actuals < item.priorYear) {
                        actualsColorClass = 'text-green-500 font-semibold'
                        actualsPercentageColorClass = 'text-green-500 font-semibold'
                      }
                    }
                    
                    return (
                      <TableRow key={`fixed-costs-${index}`} className="hover:bg-primary/5">
                        {renderTableCells('fixedCosts', item, actualsColorClass, actualsPercentageColorClass)}
                      </TableRow>
                    )
                  })}
                </TableBody>
              </Table>
            </div>
          </div>
        )
      })()}

      {/* Statistics Table */}
      {tableVisibility.statistics && (() => {
        // Exact matches only - case insensitive
        const statisticsExactNames = [
          'Sales Data',
          'Total Transactions',
          'Check Avg - Net',
          'Fundraising Events Sales',
          'Virtual Fundraising Sales',
          'Catering Sales',
          'Panda Digital Sales',
          '3rd Party Digital Sales',
          'Reward Redemptions',
          'Daypart & Sales Channel %',
          'Breakfast %',
          'Lunch %',
          'Afternoon %',
          'Evening %',
          'Dinner %',
          'Dine In %',
          'Take Out %',
          'Drive Thru %',
          '3rd Party Digital %',
          'Panda Digital %',
          'In Store Catering %',
          'Labor Data',
          'Direct Labor Hours Total',
          'Average Hourly Wage',
          'Direct Labor Hours',
          'Overtime Hours',
          'Training Hours',
          'Guaranteed Hours',
          'Management Hours',
          'Direct Hours Productivity',
          'Total Hours Productivity',
          'Direct Hours Transaction Productivity',
          'Total Hours Transaction Productivity',
          'Management Headcount',
          'Assistant Manager Headcount',
          'Chef Headcount',
          'PSA - Per Store Average',
          'Store Period',
          'PSA - Transactions',
          'PSA - Net Sales',
          'PSA - Total Labor',
          'PSA - Controllables',
          'PSA - Control Profit',
          'PSA - Fixed Costs',
          'PSA - Rests Contribution',
          'PSA - Cash Flow'
        ]
        
        const statisticsItems = plData.lineItems?.filter((item: any) => {
          const accountName = (item.ledgerAccount || '').trim()
          
          // Check for exact match (case insensitive)
          return statisticsExactNames.some(exactName => 
            accountName.toLowerCase() === exactName.toLowerCase()
          )
        }) || []

        if (statisticsItems.length === 0) return null

        return (
          <div className="rounded-xl border border-primary/20 bg-card/40 backdrop-blur-sm p-6 md:p-8 shadow-lg">
            <div className="mb-4 flex items-center justify-between">
              <div>
                <h3 className="text-xl font-bold text-foreground mb-2">
                  Statistics
                </h3>
                <div className="h-1 w-16 bg-primary/60 rounded-full"></div>
                <p className="text-sm text-muted-foreground mt-2">
                  {statisticsItems.length} items
                </p>
              </div>
              {renderColumnFilter('statistics')}
            </div>

            <div className="overflow-x-auto border border-primary/20 rounded-lg">
              <Table>
                <TableHeader>
                  <TableRow className="bg-primary/10">
                    {renderTableHeaders('statistics')}
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {statisticsItems.map((item: any, index: number) => (
                    <TableRow key={`statistics-${index}`} className="hover:bg-primary/5">
                      {renderTableCells('statistics', item)}
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          </div>
        )
      })()}

      {/* Main Line Items Table */}
      {tableVisibility.lineItems && (() => {
        const salesKeywords = [
          'food sales', 'drink sales', 'retail sales', 'gross sales',
          'employee meals', '20% emp discount', 'emp discount',
          'coupons', 'promotions', 'net sales'
        ]
        
        // Exact COGS names only
        const cogsExactNames = [
          'Grocery',
          'Meat',
          'Produce',
          'Sea Food',
          'Drinks',
          'Paper Goods',
          'Other',
          'Cost of Goods Sold'
        ]

        // Exact Labor names only
        const laborExactNames = [
          'Front',
          'back',
          'Overtime',
          'Training Wages',
          'Emergency Store Closure Pay',
          'Direct Labor',
          'GM Salaries',
          'GM Overtime',
          'Other MGMT Salaries',
          'Other MGMT Overtime',
          'Guaranteed Hourly',
          'Bereavement Pay',
          'Guaranteed Overtime',
          'Management Labor',
          'Payroll Taxes',
          'Meal Break Premium',
          'Rest Break Premium',
          'Scheduling Premium Pay',
          'Workers Comp',
          'Benefits',
          'Bonus',
          'Vacation',
          'Taxes and Benefits',
          'Total Labor'
        ]

        // Exact Controllables names only
        const controllablesExactNames = [
          'Third Party Delivery Fee',
          'Credit Card Fees',
          'Broadband',
          'Electricity',
          'Gas',
          'Telephone',
          'Waste Disposal',
          'Water',
          'Computer Software Expense',
          'Office and Computer Supplies',
          'Education and Training Other',
          'Recruitment',
          'Professional Services',
          'Travel Expenses',
          'Bank Fees',
          'Dues and Subscriptions',
          'Moving and Relocation Expenses',
          'Other Expenses',
          'Postage and Courier Service',
          'Repairs',
          'Maintenance',
          'Restaurant Expenses',
          'Restaurant Supplies',
          'Total Controllables',
          'Profit Before Adv',
          'Advertising',
          'Corporate Advertising',
          'Media',
          'Local Store Marketing',
          'Grand Opening',
          'Lease Marketing',
          'Controllable Profit'
        ]

        // Exact Fixed Costs names only
        const fixedCostsExactNames = [
          'Rent - MIN',
          'Rent - Storage',
          'Rent - Percent',
          'Rent - Other',
          'Rent - Deferred Preopening',
          'Insurance',
          'Taxes',
          'License and Fees',
          'Amortization',
          'Depreciation',
          'Total Fixed Cost'
        ]

        // Exact Statistics names only
        const statisticsExactNames = [
          'Sales Data',
          'Total Transactions',
          'Check Avg - Net',
          'Fundraising Events Sales',
          'Virtual Fundraising Sales',
          'Catering Sales',
          'Panda Digital Sales',
          '3rd Party Digital Sales',
          'Reward Redemptions',
          'Daypart & Sales Channel %',
          'Breakfast %',
          'Lunch %',
          'Afternoon %',
          'Evening %',
          'Dinner %',
          'Dine In %',
          'Take Out %',
          'Drive Thru %',
          '3rd Party Digital %',
          'Panda Digital %',
          'In Store Catering %',
          'Labor Data',
          'Direct Labor Hours Total',
          'Average Hourly Wage',
          'Direct Labor Hours',
          'Overtime Hours',
          'Training Hours',
          'Guaranteed Hours',
          'Management Hours',
          'Direct Hours Productivity',
          'Total Hours Productivity',
          'Direct Hours Transaction Productivity',
          'Total Hours Transaction Productivity',
          'Management Headcount',
          'Assistant Manager Headcount',
          'Chef Headcount',
          'PSA - Per Store Average',
          'Store Period',
          'PSA - Transactions',
          'PSA - Net Sales',
          'PSA - Total Labor',
          'PSA - Controllables',
          'PSA - Control Profit',
          'PSA - Fixed Costs',
          'PSA - Rests Contribution',
          'PSA - Cash Flow'
        ]

        const filteredLineItems = plData.lineItems?.filter((item: any) => {
          const accountName = (item.ledgerAccount || '').toLowerCase().trim()
          
          // Check sales
          const isSales = salesKeywords.some(keyword => accountName.includes(keyword.toLowerCase()))
          
          // Check COGS - exact match only (case insensitive)
          const isCogs = cogsExactNames.some(exactName => 
            accountName === exactName.toLowerCase()
          )
          
          // Check Labor - exact match only (case insensitive)
          const isLabor = laborExactNames.some(exactName => 
            accountName === exactName.toLowerCase()
          )
          
          // Check Controllables - exact match only (case insensitive)
          const isControllables = controllablesExactNames.some(exactName => 
            accountName === exactName.toLowerCase()
          )
          
          // Check Fixed Costs - exact match only (case insensitive)
          const isFixedCosts = fixedCostsExactNames.some(exactName => 
            accountName === exactName.toLowerCase()
          )
          
          // Check Statistics - exact match only (case insensitive)
          const isStatistics = statisticsExactNames.some(exactName => 
            accountName === exactName.toLowerCase()
          )
          
          return !isSales && !isCogs && !isLabor && !isControllables && !isFixedCosts && !isStatistics
        }) || []

        return (
          <div className="rounded-xl border border-primary/20 bg-card/40 backdrop-blur-sm p-6 md:p-8 shadow-lg">
            <div className="mb-4 flex items-center justify-between">
              <div>
                <h3 className="text-xl font-bold text-foreground mb-2">
                  Line Items
                </h3>
                <div className="h-1 w-16 bg-primary/60 rounded-full"></div>
                <p className="text-sm text-muted-foreground mt-2">
                  {filteredLineItems.length} line items
                </p>
              </div>
              {renderColumnFilter('lineItems')}
            </div>

            <div className="overflow-x-auto border border-primary/20 rounded-lg">
              {Array.isArray(filteredLineItems) && filteredLineItems.length > 0 ? (
                <Table>
                  <TableHeader>
                    <TableRow className="bg-primary/10">
                      {renderTableHeaders('lineItems')}
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredLineItems.map((item: any, index: number) => (
                      <TableRow key={index} className="hover:bg-primary/5">
                        {renderTableCells('lineItems', item)}
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              ) : (
                <div className="p-8 text-center text-muted-foreground">
                  No line items available. Please upload a file with P&L data.
                </div>
              )}
            </div>
          </div>
        )
      })()}
    </div>
  )
}

