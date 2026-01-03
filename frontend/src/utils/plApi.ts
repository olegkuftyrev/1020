import axios from 'axios'
import { PlReportData } from './plExcelParser'
import { API_BASE_URL } from '@/config/api'

// Create axios instance with base config
const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
})

export interface PlReport {
  id: string
  year: number
  period: number
  storeName: string
  company: string
  periodString: string
  translationCurrency: string
  fileName: string | null
  lineItems: any[]
  summaryData: any
  createdAt: string
  updatedAt: string
}

/**
 * Save P&L report to backend
 */
export async function savePlReport(
  year: number,
  period: number,
  plReportData: PlReportData,
  fileName?: string
): Promise<PlReport> {
  try {
    console.log('Saving P&L report:', { year, period, fileName })
    
    const response = await api.post('/pl/sync', {
      year,
      period,
      plReportData,
      fileName,
    })
    
    console.log('P&L report saved successfully:', response.data)
    return response.data.data || response.data
  } catch (error: any) {
    console.error('Error saving P&L report:', error)
    if (error.response) {
      throw new Error(
        error.response.data?.error ||
        error.response.data?.message ||
        'Failed to save P&L report'
      )
    }
    throw error
  }
}

/**
 * Get P&L report for a specific year and period
 */
export async function getPlReport(year: number, period: number): Promise<PlReport> {
  try {
    const response = await api.get(`/pl/${year}/${period}`)
    return response.data
  } catch (error: any) {
    console.error('Error fetching P&L report:', error)
    if (error.response) {
      throw new Error(
        error.response.data?.error ||
        error.response.data?.message ||
        'Failed to fetch P&L report'
      )
    }
    throw error
  }
}

/**
 * Get all P&L reports for a specific year
 */
export async function getPlReportsForYear(year: number): Promise<PlReport[]> {
  try {
    const response = await api.get(`/pl/${year}`)
    return response.data
  } catch (error: any) {
    console.error('Error fetching P&L reports:', error)
    if (error.response) {
      throw new Error(
        error.response.data?.error ||
        error.response.data?.message ||
        'Failed to fetch P&L reports'
      )
    }
    throw error
  }
}

/**
 * Get list of years with P&L data
 */
export async function getPlYears(): Promise<number[]> {
  try {
    const response = await api.get('/pl/years')
    return response.data.years || []
  } catch (error: any) {
    console.error('Error fetching P&L years:', error)
    if (error.response) {
      throw new Error(
        error.response.data?.error ||
        error.response.data?.message ||
        'Failed to fetch P&L years'
      )
    }
    throw error
  }
}

/**
 * Get periods for a specific year
 */
export async function getPlPeriods(year: number): Promise<Array<{ period: number; fileName: string | null; updatedAt: string; keyMetrics?: any }>> {
  try {
    const response = await api.get(`/pl/${year}/periods`)
    return response.data.periods || []
  } catch (error: any) {
    console.error('Error fetching P&L periods:', error)
    if (error.response) {
      throw new Error(
        error.response.data?.error ||
        error.response.data?.message ||
        'Failed to fetch P&L periods'
      )
    }
    throw error
  }
}

/**
 * Delete P&L report for a specific year and period
 */
export async function deletePlReport(year: number, period: number): Promise<void> {
  try {
    console.log('Deleting P&L report:', { year, period })
    await api.delete(`/pl/${year}/${period}`)
    console.log('P&L report deleted successfully')
  } catch (error: any) {
    console.error('Error deleting P&L report:', error)
    if (error.response) {
      throw new Error(
        error.response.data?.error ||
        error.response.data?.message ||
        'Failed to delete P&L report'
      )
    }
    throw error
  }
}

/**
 * SWR fetcher for P&L periods
 */
export const plPeriodsFetcher = async (url: string): Promise<Array<{ period: number; fileName: string | null; updatedAt: string; keyMetrics?: any }>> => {
  try {
    // URL format: /pl/2025/periods
    const response = await api.get(url)
    console.log('plPeriodsFetcher response:', response.data)
    return response.data.periods || []
  } catch (error: any) {
    // If 404 or empty, return empty array (no periods yet)
    if (error.response?.status === 404) {
      return []
    }
    console.error('Error in plPeriodsFetcher:', error)
    return []
  }
}

/**
 * SWR fetcher for P&L report
 */
export const plReportFetcher = async (url: string): Promise<PlReport> => {
  const parts = url.split('/')
  const year = parseInt(parts[parts.length - 2])
  const period = parseInt(parts[parts.length - 1])
  return getPlReport(year, period)
}

/**
 * Get latest available P&L period with key metrics
 */
export async function getLatestPlPeriod(): Promise<{
  year: number
  period: number
  periodString: string
  storeName: string
  company: string
  keyMetrics: any
  updatedAt: string
}> {
  try {
    console.log('Fetching latest P&L period from /api/pl/latest')
    const response = await api.get('/pl/latest')
    console.log('Latest P&L period received:', {
      year: response.data.year,
      period: response.data.period,
      periodString: response.data.periodString,
      hasKeyMetrics: !!response.data.keyMetrics,
      keyMetricsKeys: response.data.keyMetrics ? Object.keys(response.data.keyMetrics) : []
    })
    return response.data
  } catch (error: any) {
    // If 404, return null instead of throwing (no data available)
    if (error.response?.status === 404) {
      console.log('No P&L reports found (404)')
      throw error // Let SWR handle it as "no data"
    }
    console.error('Error fetching latest P&L period:', error)
    if (error.response) {
      throw new Error(
        error.response.data?.error ||
        error.response.data?.message ||
        'Failed to fetch latest P&L period'
      )
    }
    throw error
  }
}

