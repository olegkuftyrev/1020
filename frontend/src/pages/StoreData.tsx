import { useState, useRef, useMemo, useEffect } from 'react'
import useSWR from 'swr'
import { Link } from 'react-router-dom'
import { toast } from 'sonner'
import { parsePDF, parseProductRows, ProductData, applyConversionData } from '@/utils/pdfParser'
import { ProductsTable } from '@/components/ProductsTable'
import { productsFetcher, pdfMetadataFetcher, syncProducts } from '@/utils/productsApi'
import { Dropzone } from '@/components/ui/dropzone'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { AlertTriangle, AlertCircle, Check, ChevronDown, ChevronUp } from 'lucide-react'

// Function to get anomaly level (same logic as in ProductsTable)
function getAnomalyLevel(product: ProductData): 'none' | 'anomaly' | 'extreme' {
  const w38 = parseFloat(product.w38) || 0
  const w39 = parseFloat(product.w39) || 0
  const w40 = parseFloat(product.w40) || 0
  const w41 = parseFloat(product.w41) || 0
  
  const values = [w38, w39, w40, w41]
  const max = Math.max(...values)
  const min = Math.min(...values)
  const difference = max - min
  
  if (difference > 3) {
    return 'extreme'
  } else if (difference > 1) {
    return 'anomaly'
  }
  
  return 'none'
}

export function StoreData() {
  const [isParsing, setIsParsing] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [forceShowDropzone, setForceShowDropzone] = useState(false)
  const [showPasswordDialog, setShowPasswordDialog] = useState(false)
  const [password, setPassword] = useState('')
  const [passwordError, setPasswordError] = useState<string | null>(null)
  const replaceFileInputRef = useRef<HTMLInputElement>(null)
  const [isCardExpanded, setIsCardExpanded] = useState(false)

  // Load products from database using SWR
  const { data: products = [], mutate: mutateProducts, isLoading: isLoadingProducts, error: productsError } = useSWR<ProductData[]>(
    '/products',
    productsFetcher,
    {
      revalidateOnFocus: false,
      revalidateOnReconnect: true,
      onError: (error) => {
        console.error('SWR error loading products:', error)
        // Don't set error state here - let it try to parse PDF if products fail to load
      },
    }
  )

  // Load PDF metadata from database
  const { data: pdfMetadata, mutate: mutatePdfMetadata } = useSWR(
    '/products/metadata/pdf',
    pdfMetadataFetcher,
    {
      revalidateOnFocus: false,
    }
  )

  // Simple logic: if file exists, show file info, otherwise show dropzone
  const hasFile = !!pdfMetadata?.fileName
  const showDropzone = !hasFile || forceShowDropzone

  // Handle file upload and parsing
  const handleFileSelect = async (file: File) => {
    // Check if it's a PDF
    if (file.type !== 'application/pdf' && !file.name.endsWith('.pdf')) {
      toast.error('Please upload a PDF file')
      setError('Please upload a PDF file')
      return
    }

    // Reset force show dropzone
    setForceShowDropzone(false)

    // Show loading toast
    const toastId = toast.loading('Загрузка файла...', {
      description: `Обработка ${file.name}`,
    })

    try {
      setIsParsing(true)
      setError(null)

      console.log('Starting PDF parsing from uploaded file...')
      
      // Create a FileReader to read the file
      const fileReader = new FileReader()
      
      fileReader.onload = async (e) => {
        try {
          toast.loading('Чтение файла...', {
            id: toastId,
            description: `Парсинг PDF файла`,
          })

          const arrayBuffer = e.target?.result as ArrayBuffer
          if (!arrayBuffer) {
            throw new Error('Failed to read file')
          }

          // Parse PDF from ArrayBuffer
          const data = await parsePDF(arrayBuffer)
          console.log('PDF parsed, pages:', data.pageCount, 'rows:', data.rows.length)

          toast.loading('Парсинг данных...', {
            id: toastId,
            description: `Найдено ${data.rows.length} строк`,
          })

          // Parse products from rows
          const parsedProducts = parseProductRows(data.rows)
          console.log('Products parsed:', parsedProducts.length)

          // Apply conversion data
          const productsWithConversion = applyConversionData(parsedProducts)
          console.log('Conversion data applied, total products:', productsWithConversion.length)

          toast.loading('Сохранение в базу данных...', {
            id: toastId,
            description: `Обработано ${productsWithConversion.length} продуктов`,
          })

          // Save to database
          console.log('Saving to database...')
          await syncProducts(productsWithConversion, {
            pageCount: data.pageCount,
            title: data.storeTitle || data.metadata?.Title,
            fileName: file.name,
            metadata: data.metadata,
          })
          console.log('Saved to database successfully')

          // Revalidate SWR cache to get fresh data
          console.log('Revalidating SWR cache...')
          await mutateProducts()
          await mutatePdfMetadata()
          setForceShowDropzone(false) // Reset after successful upload
          console.log('SWR cache revalidated')

          // Show success toast
          toast.success('Файл успешно обновлен', {
            id: toastId,
            description: `Загружено ${productsWithConversion.length} продуктов из ${file.name}`,
          })
        } catch (err: any) {
          const errorMessage = err.message || err.response?.data?.error || 'Failed to parse PDF'
          setError(errorMessage)
          console.error('PDF parsing error:', err)
          console.error('Error details:', {
            message: err.message,
            response: err.response?.data,
            status: err.response?.status,
          })
          toast.error('Ошибка при обработке файла', {
            id: toastId,
            description: errorMessage,
          })
        } finally {
          setIsParsing(false)
        }
      }

      fileReader.onerror = () => {
        const errorMsg = 'Failed to read file'
        setError(errorMsg)
        setIsParsing(false)
        toast.error('Ошибка чтения файла', {
          id: toastId,
          description: 'Не удалось прочитать файл',
        })
      }

      // Read file as ArrayBuffer
      fileReader.readAsArrayBuffer(file)
    } catch (err: any) {
      const errorMessage = err.message || 'Failed to process file'
      setError(errorMessage)
      console.error('File upload error:', err)
      setIsParsing(false)
      toast.error('Ошибка при загрузке файла', {
        id: toastId,
        description: errorMessage,
      })
    }
  }

  const loading = isLoadingProducts || isParsing

  // Count rows by color across all products
  const colorCounts = useMemo(() => {
    let yellowCount = 0
    let redCount = 0
    let regularCount = 0

    products.forEach(product => {
      const anomalyLevel = getAnomalyLevel(product)
      if (anomalyLevel === 'extreme') {
        redCount++
      } else if (anomalyLevel === 'anomaly') {
        yellowCount++
      } else {
        regularCount++
      }
    })

    return { yellowCount, redCount, regularCount }
  }, [products])

  // Set initial expanded state based on whether there are red or yellow rows
  useEffect(() => {
    if (colorCounts.redCount > 0 || colorCounts.yellowCount > 0) {
      setIsCardExpanded(true)
    } else {
      setIsCardExpanded(false)
    }
  }, [colorCounts.redCount, colorCounts.yellowCount])

  return (
    <div className="flex flex-col gap-6">
      <div className="rounded-xl border border-primary/20 bg-card/40 backdrop-blur-sm p-6 md:p-8 shadow-lg">
        <h2 className="text-2xl md:text-3xl font-bold mb-2 text-foreground iron-text-glow">
          $1000 Usage
        </h2>
        <div className="h-1 w-24 bg-primary/60 rounded-full iron-glow mb-6"></div>
        
        {/* File upload section */}
        <div className="mb-6">
          {showDropzone && (
            <label className="block text-sm font-medium text-foreground mb-2">
              Upload PDF File
            </label>
          )}
          
          {showDropzone ? (
            <>
              <Dropzone
                onFileSelect={handleFileSelect}
                accept=".pdf,application/pdf"
                disabled={isParsing}
                className="iron-border"
              />
              <p className="text-xs text-muted-foreground mt-2">
                Drag and drop a PDF file here, or click to browse. The file will be parsed and product data will be saved to the database.
              </p>
            </>
          ) : null}
        </div>
        
        {loading && (
          <div className="flex flex-col items-center justify-center py-12 gap-4">
            <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-primary"></div>
            <div className="text-muted-foreground">
              {isParsing ? 'Parsing PDF and saving to database...' : 'Loading data...'}
            </div>
          </div>
        )}
        
        {error && (
          <div className="rounded-lg border border-red-500/50 bg-red-950/20 p-4">
            <div className="flex items-start gap-3">
              <div className="flex-1">
                <h4 className="font-semibold text-red-400 mb-1">Error</h4>
                <p className="text-sm text-red-300">{error}</p>
              </div>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setError(null)}
                className="text-red-400 hover:text-red-300"
              >
                Dismiss
              </Button>
            </div>
          </div>
        )}

        {productsError && !error && (
          <div className="rounded-lg border border-yellow-500/50 bg-yellow-950/20 p-4">
            <div className="flex items-start gap-3">
              <div className="flex-1">
                <h4 className="font-semibold text-yellow-400 mb-1">Warning</h4>
                <p className="text-sm text-yellow-300">
                  Failed to load products from database. You can still upload a new PDF file.
                </p>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => mutateProducts()}
                  className="mt-2 iron-border"
                >
                  Retry
                </Button>
              </div>
            </div>
          </div>
        )}
        
        {!loading && (
          <div className="space-y-4">
            <div className="flex items-center gap-4 text-sm text-muted-foreground">
              <span>Total Products: {products.length}</span>
              {pdfMetadata && (
                <span>Pages: {pdfMetadata.pageCount || 0}</span>
              )}
              {pdfMetadata?.title && (
                <span>Title: {pdfMetadata.title}</span>
              )}
            </div>

            {/* Color Counts Card */}
            {products.length > 0 && (
              <Card className="border-primary/20 bg-card/60">
                <CardHeader 
                  className="cursor-pointer hover:bg-card/20 transition-colors"
                  onClick={() => setIsCardExpanded(!isCardExpanded)}
                >
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-xl font-bold text-foreground">Manual Validation required</CardTitle>
                    {isCardExpanded ? (
                      <ChevronUp className="h-5 w-5 text-muted-foreground" />
                    ) : (
                      <ChevronDown className="h-5 w-5 text-muted-foreground" />
                    )}
                  </div>
                </CardHeader>
                {isCardExpanded && (
                  <CardContent>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      <div className="rounded-lg border border-red-500/30 bg-red-500/10 p-4">
                        <div className="flex items-center justify-center gap-2 text-sm text-muted-foreground mb-1">
                          <AlertTriangle className="h-4 w-4 text-red-500" />
                          <span>Critical</span>
                        </div>
                        <div className="text-2xl font-bold text-red-500 text-center">{colorCounts.redCount}</div>
                        <p className="text-xs text-muted-foreground text-center mt-2">
                          AVG &gt; 3 Between 4 weeks
                        </p>
                      </div>
                      <div className="rounded-lg border border-yellow-500/30 bg-yellow-500/10 p-4">
                        <div className="flex items-center justify-center gap-2 text-sm text-muted-foreground mb-1">
                          <AlertCircle className="h-4 w-4 text-yellow-500" />
                          <span>Attention Required</span>
                        </div>
                        <div className="text-2xl font-bold text-yellow-500 text-center">{colorCounts.yellowCount}</div>
                        <p className="text-xs text-muted-foreground text-center mt-2">
                          AVG 1-3 Between 4 weeks
                        </p>
                      </div>
                      <div className="rounded-lg border border-green-500/30 bg-green-500/10 p-4">
                        <div className="flex items-center justify-center gap-2 text-sm text-muted-foreground mb-1">
                          <Check className="h-4 w-4 text-green-500" />
                          <span>No discrepancies</span>
                        </div>
                        <div className="text-2xl font-bold text-green-500 text-center">{colorCounts.regularCount}</div>
                        <p className="text-xs text-muted-foreground text-center mt-2">
                          AVG ≤ 1 Between 4 weeks
                        </p>
                      </div>
                    </div>
                    <div className="mt-4 pt-4 border-t border-primary/20">
                      <p className="text-sm text-muted-foreground mb-2">
                        <strong>How it works:</strong> The system compares the weekly values across 4 weeks for each product. 
                        It calculates the average (AVG) between the weekly values.
                      </p>
                      <div className="text-sm text-muted-foreground space-y-1">
                        <p><strong className="text-red-400">Critical</strong> indicate extreme variations (AVG &gt; 3)</p>
                        <p><strong className="text-yellow-400">Attention Required</strong> indicate moderate variations (AVG 1-3)</p>
                        <p><strong className="text-green-400">No discrepancies</strong> show consistent values (AVG ≤ 1)</p>
                      </div>
                    </div>
                  </CardContent>
                )}
              </Card>
            )}
            
            {products.length > 0 ? (
              <ProductsTable 
                data={products}
                onDataChange={mutateProducts}
                onReplaceFile={handleFileSelect}
              />
            ) : (
              <div className="rounded-lg border border-primary/20 bg-card/60 p-6">
                <p className="text-muted-foreground">
                  No products found. Please upload a PDF file to get started.
                </p>
              </div>
            )}
          </div>
        )}
      </div>
      
      {/* Buttons at bottom */}
      <div className="flex justify-center items-center gap-3 mt-6">
        <Button
          onClick={() => {
            setShowPasswordDialog(true)
            setPassword('')
            setPasswordError(null)
          }}
          variant="outline"
          size="lg"
          className="iron-border"
        >
          Replace
        </Button>
        <input
          ref={replaceFileInputRef}
          type="file"
          accept=".pdf,application/pdf"
          onChange={(e) => {
            const file = e.target.files?.[0]
            if (file) {
              handleFileSelect(file)
            }
            // Reset input so the same file can be selected again
            if (replaceFileInputRef.current) {
              replaceFileInputRef.current.value = ''
            }
          }}
          className="hidden"
        />
        <Link to="/reports">
          <Button variant="outline" size="lg" className="iron-border">
            View Reports
          </Button>
        </Link>
      </div>

      {/* Password Dialog for Replace */}
      {showPasswordDialog && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
          <div className="rounded-lg border border-primary/20 bg-card/95 backdrop-blur-sm p-6 shadow-lg w-full max-w-md mx-4">
            <h4 className="text-lg font-semibold mb-4 text-foreground">Enter Password</h4>
            <form onSubmit={(e) => {
              e.preventDefault()
              if (password === '1337') {
                setShowPasswordDialog(false)
                setPassword('')
                setPasswordError(null)
                replaceFileInputRef.current?.click()
              } else {
                setPasswordError('Incorrect password')
                setPassword('')
              }
            }} className="space-y-4">
              <div>
                <Label htmlFor="replace-password" className="mb-2">Password</Label>
                <Input
                  id="replace-password"
                  type="password"
                  value={password}
                  onChange={(e) => {
                    setPassword(e.target.value)
                    setPasswordError(null)
                  }}
                  placeholder="Enter password"
                  autoFocus
                  className="iron-border"
                />
                {passwordError && (
                  <p className="text-sm text-red-400 mt-2">{passwordError}</p>
                )}
              </div>
              <div className="flex gap-2 justify-end">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => {
                    setShowPasswordDialog(false)
                    setPassword('')
                    setPasswordError(null)
                  }}
                  className="iron-border"
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  variant="default"
                  className="iron-border"
                >
                  Submit
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
