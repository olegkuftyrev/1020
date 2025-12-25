import { useState, useMemo } from 'react'
import useSWR from 'swr'
import { getCategorySummary, type CategorySummary } from '@/utils/productsApi'
import { productsFetcher } from '@/utils/productsApi'
import { ProductData } from '@/utils/pdfParser'
import { Button } from '@/components/ui/button'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Skeleton } from '@/components/ui/skeleton'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'

function exportToCSV(data: any[], filename: string) {
  if (data.length === 0) return

  const headers = Object.keys(data[0])
  const csvContent = [
    headers.join(','),
    ...data.map(row => headers.map(header => {
      const value = row[header]
      return typeof value === 'string' && value.includes(',') ? `"${value}"` : value
    }).join(','))
  ].join('\n')

  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' })
  const link = document.createElement('a')
  const url = URL.createObjectURL(blob)
  link.setAttribute('href', url)
  link.setAttribute('download', filename)
  link.style.visibility = 'hidden'
  document.body.appendChild(link)
  link.click()
  document.body.removeChild(link)
}

function exportToJSON(data: any[], filename: string) {
  const jsonContent = JSON.stringify(data, null, 2)
  const blob = new Blob([jsonContent], { type: 'application/json' })
  const link = document.createElement('a')
  const url = URL.createObjectURL(blob)
  link.setAttribute('href', url)
  link.setAttribute('download', filename)
  link.style.visibility = 'hidden'
  document.body.appendChild(link)
  link.click()
  document.body.removeChild(link)
}

export function Reports() {
  const [selectedCategory, setSelectedCategory] = useState<string>('all')
  const [reportType, setReportType] = useState<'summary' | 'detailed'>('summary')

  const { data: categorySummary, isLoading: categoryLoading } = useSWR<CategorySummary[]>(
    '/products/category-summary',
    getCategorySummary,
    { revalidateOnFocus: false }
  )

  const { data: allProducts, isLoading: productsLoading } = useSWR<ProductData[]>(
    '/products',
    productsFetcher,
    { revalidateOnFocus: false }
  )

  const filteredSummary = useMemo(() => {
    if (!categorySummary) return []
    if (selectedCategory === 'all') return categorySummary
    return categorySummary.filter(cat => cat.group === selectedCategory)
  }, [categorySummary, selectedCategory])

  const filteredProducts = useMemo(() => {
    if (!allProducts) return []
    if (selectedCategory === 'all') return allProducts
    return allProducts.filter(p => (p.group || 'Others') === selectedCategory)
  }, [allProducts, selectedCategory])

  const categories = useMemo(() => {
    if (!categorySummary) return []
    return categorySummary.map(cat => cat.group)
  }, [categorySummary])

  const handleExportCSV = () => {
    if (reportType === 'summary') {
      exportToCSV(filteredSummary, `reports-summary-${selectedCategory}-${new Date().toISOString().split('T')[0]}.csv`)
    } else {
      const exportData = filteredProducts.map(p => ({
        'Product Number': p.productNumber,
        'Product Name': p.productName,
        'Unit': p.unit,
        'W38': p.w38,
        'W39': p.w39,
        'W40': p.w40,
        'W41': p.w41,
        'Conversion': p.conversion || '',
        'Group': p.group || 'Others',
        'AVG4': ((parseFloat(p.w38) + parseFloat(p.w39) + parseFloat(p.w40) + parseFloat(p.w41)) / 4).toFixed(2),
        'CS per 1k': p.conversion ? ((parseFloat(p.w38) + parseFloat(p.w39) + parseFloat(p.w40) + parseFloat(p.w41)) / 4 / parseFloat(p.conversion)).toFixed(2) : '',
      }))
      exportToCSV(exportData, `reports-detailed-${selectedCategory}-${new Date().toISOString().split('T')[0]}.csv`)
    }
  }

  const handleExportJSON = () => {
    if (reportType === 'summary') {
      exportToJSON(filteredSummary, `reports-summary-${selectedCategory}-${new Date().toISOString().split('T')[0]}.json`)
    } else {
      exportToJSON(filteredProducts, `reports-detailed-${selectedCategory}-${new Date().toISOString().split('T')[0]}.json`)
    }
  }

  const isLoading = categoryLoading || productsLoading

  return (
    <div className="flex flex-col gap-6">
      {/* Header */}
      <div className="rounded-xl border border-primary/20 bg-card/40 backdrop-blur-sm p-6 md:p-8 shadow-lg">
        <div className="mb-6">
          <h2 className="text-2xl md:text-3xl font-bold mb-2 text-foreground iron-text-glow">
            Reports & Analytics
          </h2>
          <div className="h-1 w-24 bg-primary/60 rounded-full iron-glow"></div>
        </div>

        {/* Filters */}
        <div className="flex flex-col sm:flex-row gap-4 mb-6">
          <div className="flex-1">
            <label className="block text-sm font-medium text-foreground mb-2">
              Category Filter
            </label>
            <Select value={selectedCategory} onValueChange={setSelectedCategory}>
              <SelectTrigger className="iron-border">
                <SelectValue placeholder="Select category" />
              </SelectTrigger>
              <SelectContent className="bg-card border-primary/20">
                <SelectItem value="all">All Categories</SelectItem>
                {categories.map(cat => (
                  <SelectItem key={cat} value={cat}>{cat}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="flex-1">
            <label className="block text-sm font-medium text-foreground mb-2">
              Report Type
            </label>
            <Select value={reportType} onValueChange={(value: 'summary' | 'detailed') => setReportType(value)}>
              <SelectTrigger className="iron-border">
                <SelectValue placeholder="Select report type" />
              </SelectTrigger>
              <SelectContent className="bg-card border-primary/20">
                <SelectItem value="summary">Category Summary</SelectItem>
                <SelectItem value="detailed">Detailed Products</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        {/* Export Buttons */}
        <div className="flex gap-3">
          <Button
            onClick={handleExportCSV}
            disabled={isLoading || (reportType === 'summary' ? filteredSummary.length === 0 : filteredProducts.length === 0)}
            variant="outline"
            className="iron-border"
          >
            Export CSV
          </Button>
          <Button
            onClick={handleExportJSON}
            disabled={isLoading || (reportType === 'summary' ? filteredSummary.length === 0 : filteredProducts.length === 0)}
            variant="outline"
            className="iron-border"
          >
            Export JSON
          </Button>
        </div>
      </div>

      {/* Summary Report */}
      {reportType === 'summary' && (
        <div className="rounded-xl border border-primary/20 bg-card/40 backdrop-blur-sm p-6 md:p-8 shadow-lg">
          <h3 className="text-xl font-bold text-foreground mb-4">Category Summary Report</h3>
          
          {isLoading ? (
            <div className="space-y-3">
              {[1, 2, 3].map(i => (
                <Skeleton key={i} className="h-16 w-full" />
              ))}
            </div>
          ) : filteredSummary.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              No data available
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow className="bg-primary/10">
                    <TableHead>Category</TableHead>
                    <TableHead className="text-right">Products</TableHead>
                    <TableHead className="text-right">Avg Usage</TableHead>
                    <TableHead className="text-right">Avg CS/1k</TableHead>
                    <TableHead className="text-right">With Conversion</TableHead>
                    <TableHead className="text-right">Conversion Rate</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredSummary.map((category) => (
                    <TableRow key={category.group} className="hover:bg-primary/5">
                      <TableCell className="font-medium">{category.group}</TableCell>
                      <TableCell className="text-right">{category.productCount}</TableCell>
                      <TableCell className="text-right">{category.averageUsage.toFixed(2)}</TableCell>
                      <TableCell className="text-right">
                        {category.averageCsPer1k > 0 ? category.averageCsPer1k.toFixed(2) : '-'}
                      </TableCell>
                      <TableCell className="text-right">{category.productsWithConversion}</TableCell>
                      <TableCell className="text-right">
                        <div className="flex items-center justify-end gap-2">
                          <span>{category.conversionRate.toFixed(1)}%</span>
                          <div className="w-16 bg-primary/10 rounded-full h-2">
                            <div
                              className="bg-primary h-2 rounded-full"
                              style={{ width: `${Math.min(category.conversionRate, 100)}%` }}
                            />
                          </div>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </div>
      )}

      {/* Detailed Report */}
      {reportType === 'detailed' && (
        <div className="rounded-xl border border-primary/20 bg-card/40 backdrop-blur-sm p-6 md:p-8 shadow-lg">
          <h3 className="text-xl font-bold text-foreground mb-4">
            Detailed Products Report
            {selectedCategory !== 'all' && ` - ${selectedCategory}`}
          </h3>
          
          {isLoading ? (
            <div className="space-y-3">
              {[1, 2, 3, 4, 5].map(i => (
                <Skeleton key={i} className="h-12 w-full" />
              ))}
            </div>
          ) : filteredProducts.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              No products found for selected category
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow className="bg-primary/10">
                    <TableHead>Product #</TableHead>
                    <TableHead>Product Name</TableHead>
                    <TableHead className="text-right">Unit</TableHead>
                    <TableHead className="text-right">W38</TableHead>
                    <TableHead className="text-right">W39</TableHead>
                    <TableHead className="text-right">W40</TableHead>
                    <TableHead className="text-right">W41</TableHead>
                    <TableHead className="text-right">AVG4</TableHead>
                    <TableHead className="text-right">Conversion</TableHead>
                    <TableHead className="text-right">CS/1k</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredProducts.map((product) => {
                    const w38 = parseFloat(product.w38) || 0
                    const w39 = parseFloat(product.w39) || 0
                    const w40 = parseFloat(product.w40) || 0
                    const w41 = parseFloat(product.w41) || 0
                    const avg = (w38 + w39 + w40 + w41) / 4
                    const conversion = parseFloat(product.conversion || '0') || 0
                    const csPer1k = conversion > 0 ? avg / conversion : 0

                    return (
                      <TableRow key={product.productNumber} className="hover:bg-primary/5">
                        <TableCell className="font-mono text-primary">{product.productNumber}</TableCell>
                        <TableCell>{product.productName}</TableCell>
                        <TableCell className="text-right text-muted-foreground">{product.unit}</TableCell>
                        <TableCell className="text-right">{w38.toFixed(2)}</TableCell>
                        <TableCell className="text-right">{w39.toFixed(2)}</TableCell>
                        <TableCell className="text-right">{w40.toFixed(2)}</TableCell>
                        <TableCell className="text-right">{w41.toFixed(2)}</TableCell>
                        <TableCell className="text-right font-medium">{avg.toFixed(2)}</TableCell>
                        <TableCell className="text-right">{conversion > 0 ? conversion : '-'}</TableCell>
                        <TableCell className="text-right font-medium">
                          {csPer1k > 0 ? csPer1k.toFixed(2) : '-'}
                        </TableCell>
                      </TableRow>
                    )
                  })}
                </TableBody>
              </Table>
            </div>
          )}

          {!isLoading && filteredProducts.length > 0 && (
            <div className="mt-4 text-sm text-muted-foreground">
              Showing {filteredProducts.length} product{filteredProducts.length !== 1 ? 's' : ''}
            </div>
          )}
        </div>
      )}
    </div>
  )
}

