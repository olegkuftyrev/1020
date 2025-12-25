import { useEffect, useState } from 'react'
import { parsePDF, ParsedPDFData, parseProductRows, ProductData, applyConversionData } from '@/utils/pdfParser'
import { ProductsTable } from '@/components/ProductsTable'

export function StoreData() {
  const [pdfData, setPdfData] = useState<ParsedPDFData | null>(null)
  const [products, setProducts] = useState<ProductData[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const loadPDF = async () => {
      try {
        setLoading(true)
        // Загружаем PDF из папки public
        const data = await parsePDF('/1k.pdf')
        setPdfData(data)
        
        // Парсим продукты из строк
        const parsedProducts = parseProductRows(data.rows)
        
        // Применяем данные конверсии
        let productsWithConversion = applyConversionData(parsedProducts)
        
        // Загружаем сохраненные значения conversion из localStorage если есть (приоритет над статичными данными)
        const savedData = localStorage.getItem('products-conversion-data')
        if (savedData) {
          try {
            const savedProducts = JSON.parse(savedData) as ProductData[]
            // Сопоставляем сохраненные данные с текущими продуктами по ID
            // Важно: всегда используем группу из productsWithConversion, чтобы группировка работала правильно
            productsWithConversion = productsWithConversion.map(product => {
              const saved = savedProducts.find(p => p.id === product.id)
              if (saved && saved.conversion) {
                // Сохраняем conversion из localStorage, но группу всегда берем из текущих данных
                return { 
                  ...product, 
                  conversion: saved.conversion,
                  group: product.group // Группа всегда из applyConversionData
                }
              }
              return product
            })
          } catch (e) {
            // Если ошибка парсинга, используем данные с конверсией
          }
        }
        
        setProducts(productsWithConversion)
        
        setError(null)
      } catch (err: any) {
        setError(err.message || 'Failed to load PDF')
        console.error('PDF loading error:', err)
      } finally {
        setLoading(false)
      }
    }

    loadPDF()
  }, [])

  return (
    <div className="flex flex-col gap-6">
      <div className="rounded-xl border border-primary/20 bg-card/40 backdrop-blur-sm p-6 md:p-8 shadow-lg">
        <h2 className="text-2xl md:text-3xl font-bold mb-2 text-foreground iron-text-glow">
          Store Data
        </h2>
        <div className="h-1 w-24 bg-primary/60 rounded-full iron-glow mb-6"></div>
        
        {loading && (
          <div className="flex items-center justify-center py-12">
            <div className="text-muted-foreground">Loading PDF data...</div>
          </div>
        )}
        
        {error && (
          <div className="rounded-lg border border-red-500/50 bg-red-950/20 p-4 text-red-400">
            Error: {error}
          </div>
        )}
        
        {pdfData && !loading && (
          <div className="space-y-4">
            <div className="flex items-center gap-4 text-sm text-muted-foreground">
              <span>Total Products: {products.length}</span>
              <span>Pages: {pdfData.pageCount}</span>
              {pdfData.metadata?.Title && (
                <span>Title: {pdfData.metadata.Title}</span>
              )}
            </div>
            
            {products.length > 0 ? (
              <ProductsTable 
                data={products} 
                onDataChange={(updatedProducts) => {
                  setProducts(updatedProducts)
                  // Можно также сохранить в localStorage для персистентности
                  localStorage.setItem('products-conversion-data', JSON.stringify(updatedProducts))
                }}
              />
            ) : (
              <div className="rounded-lg border border-primary/20 bg-card/60 p-6">
                <p className="text-muted-foreground">No products found. Showing raw data:</p>
                <div className="mt-4 max-h-[400px] overflow-y-auto">
                  <pre className="whitespace-pre-wrap text-sm text-foreground font-mono leading-relaxed">
                    {pdfData.text}
                  </pre>
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  )
}
