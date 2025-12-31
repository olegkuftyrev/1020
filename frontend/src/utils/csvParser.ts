import Papa from 'papaparse'

export interface ParsedCSVData {
  data: Record<string, string>[]
  headers: string[]
  errors: Papa.ParseError[]
}

export interface NormalizedMetrics {
  overallSatisfaction?: string
  tasteOfFood?: string
  accuracyOfOrders?: string
  [key: string]: string | undefined
}

/**
 * Normalize CSV headers - shorten long headers, clean up names
 */
function normalizeHeader(header: string): string {
  let normalized = header.trim()
  
  // Handle comparison headers like "Comparison: 11/30/2025 - 12/27/2025, Last Year (Same Period): 11/30/2024 - 12/27/2024"
  if (normalized.includes('Comparison:')) {
    const comparisonMatch = normalized.match(/Comparison:\s*([^,]+)/)
    if (comparisonMatch) {
      const dates = comparisonMatch[1].trim()
      // Extract just the date range, e.g., "11/30/2025 - 12/27/2025"
      return dates || 'Current Period'
    }
  }
  
  // Handle "Last Year (Same Period)" patterns
  if (normalized.includes('Last Year')) {
    const lastYearMatch = normalized.match(/Last Year[^:]*:\s*([^,]+)/)
    if (lastYearMatch) {
      const dates = lastYearMatch[1].trim()
      return `Prior Year: ${dates}` || 'Prior Year'
    }
  }
  
  // Remove extra whitespace and normalize
  normalized = normalized.replace(/\s+/g, ' ')
  
  // If header is too long, truncate it
  if (normalized.length > 50) {
    normalized = normalized.substring(0, 47) + '...'
  }
  
  return normalized
}

/**
 * Normalize CSV data - clean values, handle empty strings
 */
function normalizeData(data: Record<string, string>[], headers: string[]): Record<string, string>[] {
  return data.map(row => {
    const normalizedRow: Record<string, string> = {}
    headers.forEach(header => {
      const value = row[header]
      // Convert empty strings to dash, trim whitespace
      normalizedRow[header] = value?.trim() || '-'
    })
    return normalizedRow
  })
}

/**
 * Parse CSV file content and normalize headers and data
 */
export async function parseCSVFile(file: File): Promise<ParsedCSVData> {
  return new Promise((resolve, reject) => {
    Papa.parse(file, {
      header: true,
      skipEmptyLines: true,
      complete: (results) => {
        const originalHeaders = results.meta.fields || []
        
        // Normalize headers
        const normalizedHeaders = originalHeaders.map(normalizeHeader)
        
        // Create a mapping from original to normalized headers
        const headerMap: Record<string, string> = {}
        originalHeaders.forEach((orig, index) => {
          headerMap[orig] = normalizedHeaders[index]
        })
        
        // Transform data to use normalized headers
        const normalizedData = (results.data as Record<string, string>[]).map(row => {
          const newRow: Record<string, string> = {}
          originalHeaders.forEach(origHeader => {
            const normalizedHeader = headerMap[origHeader]
            newRow[normalizedHeader] = row[origHeader]?.trim() || '-'
          })
          return newRow
        })
        
        // Remove first row and first 3 columns
        const filteredHeaders = normalizedHeaders.slice(3) // Remove first 3 columns
        const filteredData = normalizedData.slice(1).map(row => { // Remove first row
          const filteredRow: Record<string, string> = {}
          filteredHeaders.forEach(header => {
            filteredRow[header] = row[header] || '-'
          })
          return filteredRow
        })
        
        resolve({
          data: filteredData,
          headers: filteredHeaders,
          errors: results.errors || []
        })
      },
      error: (error) => {
        reject(error)
      }
    })
  })
}

/**
 * Extract and normalize key metrics from CSV data
 * Assumes first column contains metric names and subsequent columns contain values
 */
export function extractMetrics(csvData: ParsedCSVData): NormalizedMetrics {
  const metrics: NormalizedMetrics = {}
  
  if (!csvData.data || csvData.data.length === 0 || csvData.headers.length === 0) {
    return metrics
  }
  
  // Find the first column which likely contains metric names
  const firstColumn = csvData.headers[0]
  
  // Find the first "current" period column (not prior year)
  // Look for columns that don't contain "prior" or "last year", prefer those with dates
  const currentPeriodColumn = csvData.headers.find(header => {
    const lower = header.toLowerCase()
    return !lower.includes('prior') && !lower.includes('last year')
  }) || csvData.headers[1] // Fallback to second column if no date found
  
  if (!currentPeriodColumn || !firstColumn) {
    return metrics
  }
  
  // Iterate through all rows to extract all metrics
  csvData.data.forEach(row => {
    const metricName = (row[firstColumn] || '').trim()
    const value = row[currentPeriodColumn] || '-'
    
    // Skip empty rows
    if (!metricName || value === '-') return
    
    // Store all metrics by their original name
    metrics[metricName] = value
    
    // Also store with normalized keys for special cases (for easier access)
    const metricNameLower = metricName.toLowerCase()
    if (metricNameLower.includes('overall') && metricNameLower.includes('satisfaction')) {
      metrics.overallSatisfaction = value
    } else if ((metricNameLower.includes('taste') || metricNameLower.includes('food')) && !metricNameLower.includes('overall')) {
      metrics.tasteOfFood = value
    } else if (metricNameLower.includes('accuracy') || (metricNameLower.includes('order') && !metricNameLower.includes('taste'))) {
      metrics.accuracyOfOrders = value
    }
  })
  
  return metrics
}
