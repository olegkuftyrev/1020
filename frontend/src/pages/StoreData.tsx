import { useState, useRef } from 'react'
import useSWR from 'swr'
import { parsePDF, ParsedPDFData, parseProductRows, ProductData, applyConversionData } from '@/utils/pdfParser'
import { ProductsTable } from '@/components/ProductsTable'
import { productsFetcher, pdfMetadataFetcher, syncProducts } from '@/utils/productsApi'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'

export function StoreData() {
  const [isParsing, setIsParsing] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)

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

  // Handle file upload and parsing
  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (!file) return

    // Check if it's a PDF
    if (file.type !== 'application/pdf' && !file.name.endsWith('.pdf')) {
      setError('Please upload a PDF file')
      return
    }

    try {
      setIsParsing(true)
      setError(null)

      console.log('Starting PDF parsing from uploaded file...')
      
      // Create a FileReader to read the file
      const fileReader = new FileReader()
      
      fileReader.onload = async (e) => {
        try {
          const arrayBuffer = e.target?.result as ArrayBuffer
          if (!arrayBuffer) {
            throw new Error('Failed to read file')
          }

          // Parse PDF from ArrayBuffer
          const data = await parsePDF(arrayBuffer)
          console.log('PDF parsed, pages:', data.pageCount, 'rows:', data.rows.length)

          // Parse products from rows
          const parsedProducts = parseProductRows(data.rows)
          console.log('Products parsed:', parsedProducts.length)

          // Apply conversion data
          const productsWithConversion = applyConversionData(parsedProducts)
          console.log('Conversion data applied, total products:', productsWithConversion.length)

          // Save to database
          console.log('Saving to database...')
          await syncProducts(productsWithConversion, {
            pageCount: data.pageCount,
            title: data.metadata?.Title,
            metadata: data.metadata,
          })
          console.log('Saved to database successfully')

          // Revalidate SWR cache to get fresh data
          console.log('Revalidating SWR cache...')
          await mutateProducts()
          await mutatePdfMetadata()
          console.log('SWR cache revalidated')

          // Reset file input
          if (fileInputRef.current) {
            fileInputRef.current.value = ''
          }
        } catch (err: any) {
          const errorMessage = err.message || err.response?.data?.error || 'Failed to parse PDF'
          setError(errorMessage)
          console.error('PDF parsing error:', err)
          console.error('Error details:', {
            message: err.message,
            response: err.response?.data,
            status: err.response?.status,
          })
        } finally {
          setIsParsing(false)
        }
      }

      fileReader.onerror = () => {
        setError('Failed to read file')
        setIsParsing(false)
      }

      // Read file as ArrayBuffer
      fileReader.readAsArrayBuffer(file)
    } catch (err: any) {
      const errorMessage = err.message || 'Failed to process file'
      setError(errorMessage)
      console.error('File upload error:', err)
      setIsParsing(false)
    }
  }

  const loading = isLoadingProducts || isParsing

  return (
    <div className="flex flex-col gap-6">
      <div className="rounded-xl border border-primary/20 bg-card/40 backdrop-blur-sm p-6 md:p-8 shadow-lg">
        <h2 className="text-2xl md:text-3xl font-bold mb-2 text-foreground iron-text-glow">
          $1000 Usage
        </h2>
        <div className="h-1 w-24 bg-primary/60 rounded-full iron-glow mb-6"></div>
        
        {/* File upload section */}
        <div className="mb-6 p-4 rounded-lg border border-primary/20 bg-card/60">
          <label className="block text-sm font-medium text-foreground mb-2">
            Upload PDF File
          </label>
          <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4">
            <Input
              ref={fileInputRef}
              type="file"
              accept=".pdf,application/pdf"
              onChange={handleFileUpload}
              disabled={isParsing}
              className="cursor-pointer flex-1"
            />
            {isParsing && (
              <div className="text-sm text-muted-foreground">
                Processing...
              </div>
            )}
          </div>
          <p className="text-xs text-muted-foreground mt-2">
            Upload a PDF file to parse and save product data to the database. You can upload a new file to update the data.
          </p>
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
            
            {products.length > 0 ? (
              <ProductsTable 
                data={products}
                onDataChange={mutateProducts}
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
    </div>
  )
}
