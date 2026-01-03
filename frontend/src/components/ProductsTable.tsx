"use client"

import * as React from "react"
import {
  flexRender,
  getCoreRowModel,
  getSortedRowModel,
  useReactTable,
  type ColumnDef,
  type SortingState,
  type VisibilityState,
} from "@tanstack/react-table"
import { Settings2 } from "lucide-react"

import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuCheckboxItem,
  DropdownMenuContent,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { ProductData } from "@/utils/pdfParser"
import { updateProductConversion, getSetting, setSetting } from "@/utils/productsApi"
import { cn } from "@/lib/utils"

// Check if product has anomaly and return severity level
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

// Create columns function that accepts onConversionChange callback
const createColumns = (onConversionChange?: (productNumber: string, conversion: string) => Promise<void>): ColumnDef<ProductData>[] => [
  {
    accessorKey: "productNumber",
    header: "Product #",
    cell: ({ row }) => (
      <div className="font-mono text-primary">{row.getValue("productNumber")}</div>
    ),
    enableHiding: false,
  },
  {
    accessorKey: "productName",
    header: "Product Name",
    cell: ({ row }) => <div>{row.getValue("productName")}</div>,
  },
  {
    accessorKey: "conversion",
    header: "Conversion",
    cell: ({ row }) => {
      const product = row.original
      const [value, setValue] = React.useState(product.conversion || '')
      const [isUpdating, setIsUpdating] = React.useState(false)

      const handleBlur = async () => {
        if (value !== (product.conversion || '')) {
          setIsUpdating(true)
          try {
            if (onConversionChange) {
              await onConversionChange(product.productNumber, value)
            } else {
              await updateProductConversion(product.productNumber, value)
            }
            // Update local state
            product.conversion = value
          } catch (error) {
            // Revert on error
            setValue(product.conversion || '')
            console.error('Failed to update conversion:', error)
          } finally {
            setIsUpdating(false)
          }
        }
      }

      const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
        if (e.key === 'Enter') {
          e.currentTarget.blur()
        }
      }

      return (
        <div className="text-left">
          <Input
            value={value}
            onChange={(e) => setValue(e.target.value)}
            onBlur={handleBlur}
            onKeyDown={handleKeyDown}
            disabled={isUpdating}
            className="w-20 h-8 text-left text-sm"
            placeholder="-"
          />
        </div>
      )
    },
  },
  {
    accessorKey: "unit",
    header: "Unit",
    cell: ({ row }) => (
      <div className="text-left text-muted-foreground">{row.getValue("unit")}</div>
    ),
  },
  {
    accessorKey: "w38",
    header: "W38 '25",
    cell: ({ row }) => (
      <div className="text-left font-medium">{row.getValue("w38")}</div>
    ),
  },
  {
    accessorKey: "w39",
    header: "W39 '25",
    cell: ({ row }) => (
      <div className="text-left font-medium">{row.getValue("w39")}</div>
    ),
  },
  {
    accessorKey: "w40",
    header: "W40 '25",
    cell: ({ row }) => (
      <div className="text-left font-medium">{row.getValue("w40")}</div>
    ),
  },
  {
    accessorKey: "w41",
    header: "W41 '25",
    cell: ({ row }) => (
      <div className="text-left font-medium">{row.getValue("w41")}</div>
    ),
  },
  {
    id: "avg4",
    header: "AVG4",
    cell: ({ row }) => {
      const w38 = parseFloat(row.original.w38) || 0
      const w39 = parseFloat(row.original.w39) || 0
      const w40 = parseFloat(row.original.w40) || 0
      const w41 = parseFloat(row.original.w41) || 0
      const avg = (w38 + w39 + w40 + w41) / 4
      return (
        <div className="text-left font-medium">
          {avg.toFixed(2)}
        </div>
      )
    },
  },
  {
    id: "csPer1k",
    header: "CS per 1k",
    cell: ({ row }) => {
      const w38 = parseFloat(row.original.w38) || 0
      const w39 = parseFloat(row.original.w39) || 0
      const w40 = parseFloat(row.original.w40) || 0
      const w41 = parseFloat(row.original.w41) || 0
      const avg = (w38 + w39 + w40 + w41) / 4
      const conversion = parseFloat(row.original.conversion || '0') || 0
      
      if (conversion === 0) {
        return (
          <div className="text-left text-muted-foreground">-</div>
        )
      }
      
      const csPer1k = avg / conversion
      return (
        <div className="text-left font-medium">
          {csPer1k.toFixed(2)}
        </div>
      )
    },
  },
]

interface ProductsTableProps {
  data: ProductData[]
  onDataChange?: () => void // SWR mutate function
  onReplaceFile?: (file: File) => void // Handler for file replacement
}

// Порядок категорий
const CATEGORY_ORDER: Record<string, number> = {
  'WIF': 0,
  'Appetizers': 1,
  'Sides': 2,
  'Sauce Cart': 3,
  'Condements': 4,
  'Vegetables': 5,
  'BIBs': 6,
  'PCB': 7,
  'Bottles': 8,
  'FoH Packaging': 9,
  'Cups & lids': 10,
  'Prep Area': 11,
  'FoH': 12,
  'Others': 13,
}

function CategoryTable({
  category,
  products,
  dynamicColumns,
  columnVisibility,
}: {
  category: string
  products: ProductData[]
  dynamicColumns: ColumnDef<ProductData>[]
  columnVisibility: VisibilityState
}) {
  // Сортируем по последней колонке (periodColumn) по убыванию по умолчанию
  const [sorting, setSorting] = React.useState<SortingState>([
    { id: 'periodColumn', desc: true }
  ])

  const table = useReactTable({
    data: products,
    columns: dynamicColumns,
    onSortingChange: setSorting,
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
    state: {
      sorting,
      columnVisibility,
    },
  })

  if (products.length === 0) return null

  return (
    <div className="space-y-4">
      <h3 className="text-xl font-bold text-primary iron-text-glow">{category}</h3>
      <div className="overflow-hidden rounded-lg border border-primary/20">
        <Table>
          <TableHeader>
            {table.getHeaderGroups().map((headerGroup) => (
              <TableRow key={headerGroup.id} className="bg-primary/10">
                {headerGroup.headers.map((header) => {
                  return (
                    <TableHead key={header.id}>
                      {header.isPlaceholder
                        ? null
                        : flexRender(
                            header.column.columnDef.header,
                            header.getContext()
                          )}
                    </TableHead>
                  )
                })}
              </TableRow>
            ))}
          </TableHeader>
          <TableBody>
            {table.getRowModel().rows?.length ? (
              table.getRowModel().rows.map((row) => {
                const anomalyLevel = getAnomalyLevel(row.original)
                return (
                  <TableRow
                    key={row.id}
                    data-state={row.getIsSelected() && "selected"}
                    className={cn(
                      "hover:bg-primary/5",
                      anomalyLevel === 'anomaly' && "bg-yellow-500/10 border-l-4 border-l-yellow-500",
                      anomalyLevel === 'extreme' && "bg-red-500/10 border-l-4 border-l-red-500"
                    )}
                  >
                    {row.getVisibleCells().map((cell) => (
                      <TableCell key={cell.id}>
                        {flexRender(
                          cell.column.columnDef.cell,
                          cell.getContext()
                        )}
                      </TableCell>
                    ))}
                  </TableRow>
                )
              })
            ) : (
              <TableRow>
                <TableCell
                  colSpan={dynamicColumns.length}
                  className="h-24 text-center"
                >
                  No results.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>
      <div className="px-2">
        <div className="text-sm text-muted-foreground">
          Total: {products.length} products
        </div>
      </div>
    </div>
  )
}

export function ProductsTable({ data, onDataChange, onReplaceFile }: ProductsTableProps) {
  const [periodMultiplier, setPeriodMultiplier] = React.useState<string>("12")
  const [isLoadingMultiplier, setIsLoadingMultiplier] = React.useState(true)
  const [isSavingMultiplier, setIsSavingMultiplier] = React.useState(false)
  const [searchQuery, setSearchQuery] = React.useState<string>("")
  const [selectedCategoryFilter, setSelectedCategoryFilter] = React.useState<string>("all")
  const [showPasswordDialog, setShowPasswordDialog] = React.useState(false)
  const [password, setPassword] = React.useState('')
  const [passwordError, setPasswordError] = React.useState<string | null>(null)
  const fileInputRef = React.useRef<HTMLInputElement>(null)
  
  const [columnVisibility, setColumnVisibility] = React.useState<VisibilityState>({
    conversion: false,
    unit: false,
    w38: false,
    w39: false,
    w40: false,
    w41: false,
    avg4: false,
  })

  // Load period multiplier from database on mount
  React.useEffect(() => {
    const loadPeriodMultiplier = async () => {
      try {
        setIsLoadingMultiplier(true)
        const setting = await getSetting('periodMultiplier')
        console.log('Loaded period multiplier:', setting.value)
        if (setting && setting.value) {
          setPeriodMultiplier(setting.value)
        }
      } catch (error: any) {
        console.error('Failed to load period multiplier:', error)
        // Keep default value of "12" if loading fails
        // This is expected on first load when setting doesn't exist yet
        if (error.response?.status !== 404) {
          console.warn('Unexpected error loading period multiplier, using default value 12')
        }
      } finally {
        setIsLoadingMultiplier(false)
      }
    }
    loadPeriodMultiplier()
  }, [])

  // Local state for input value (allows typing without immediate save)
  const [multiplierInputValue, setMultiplierInputValue] = React.useState<string>("12")

  // Sync local input value with loaded multiplier
  React.useEffect(() => {
    setMultiplierInputValue(periodMultiplier)
  }, [periodMultiplier])

  // Save period multiplier to database
  const handleMultiplierSave = async () => {
    const numValue = parseInt(multiplierInputValue, 10)
    
    // Validate and save if it's a valid integer between 1 and 30000
    if (multiplierInputValue !== '' && !isNaN(numValue) && Number.isInteger(numValue) && numValue >= 1 && numValue <= 30000) {
      const previousValue = periodMultiplier
      
      // Only save if value actually changed
      if (multiplierInputValue !== previousValue) {
        try {
          setIsSavingMultiplier(true)
          console.log('Saving period multiplier:', multiplierInputValue)
          await setSetting('periodMultiplier', multiplierInputValue)
          setPeriodMultiplier(multiplierInputValue)
          console.log('Period multiplier saved successfully')
        } catch (error: any) {
          console.error('Failed to save period multiplier:', error)
          // Revert on error
          setPeriodMultiplier(previousValue)
          setMultiplierInputValue(previousValue)
          alert(`Failed to save period multiplier: ${error.message || 'Unknown error'}`)
        } finally {
          setIsSavingMultiplier(false)
        }
      }
    } else {
      // Revert to previous value if invalid
      console.warn('Invalid period multiplier value, reverting:', multiplierInputValue)
      setMultiplierInputValue(periodMultiplier)
    }
  }

  const handleMultiplierChange = (value: string) => {
    // Allow typing any value, validate on save
    // Only allow integers between 1 and 30000
    const numValue = parseInt(value, 10)
    if (value === '' || (!isNaN(numValue) && numValue >= 1 && numValue <= 30000 && Number.isInteger(numValue))) {
      setMultiplierInputValue(value)
    }
  }

  const handleMultiplierKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      e.currentTarget.blur()
    }
  }

  // Handle conversion update with SWR revalidation
  const handleConversionChange = async (productNumber: string, conversion: string) => {
    await updateProductConversion(productNumber, conversion)
    // Revalidate SWR cache
    if (onDataChange) {
      onDataChange()
    }
  }

  // Динамические колонки в зависимости от множителя периода
  // Use multiplierInputValue for real-time calculations, periodMultiplier for saved value
  const dynamicColumns: ColumnDef<ProductData>[] = React.useMemo(() => {
    const multiplier = parseFloat(multiplierInputValue) || 0
    // Format number: remove trailing zeros and decimal point if not needed
    const formattedMultiplier = multiplier % 1 === 0 
      ? multiplier.toString() 
      : multiplier.toString().replace(/\.?0+$/, '')
    const headerText = multiplier > 0 ? `$${formattedMultiplier}K` : '$0K'
    
    return [
      ...createColumns(handleConversionChange),
      {
        id: "periodColumn",
        header: headerText,
        accessorFn: (row) => {
          const w38 = parseFloat(row.w38) || 0
          const w39 = parseFloat(row.w39) || 0
          const w40 = parseFloat(row.w40) || 0
          const w41 = parseFloat(row.w41) || 0
          const avg = (w38 + w39 + w40 + w41) / 4
          const conversion = parseFloat(row.conversion || '0') || 0
          
          if (conversion === 0 || multiplier === 0) {
            return 0
          }
          
          const csPer1k = avg / conversion
          return csPer1k * multiplier
        },
        cell: ({ row }) => {
          const w38 = parseFloat(row.original.w38) || 0
          const w39 = parseFloat(row.original.w39) || 0
          const w40 = parseFloat(row.original.w40) || 0
          const w41 = parseFloat(row.original.w41) || 0
          const avg = (w38 + w39 + w40 + w41) / 4
          const conversion = parseFloat(row.original.conversion || '0') || 0
          
          if (conversion === 0 || multiplier === 0) {
            return (
              <div className="text-left text-muted-foreground">-</div>
            )
          }
          
          const csPer1k = avg / conversion
          const result = csPer1k * multiplier
          
          return (
            <div className="text-left font-medium">
              {result.toFixed(2)}
            </div>
          )
        },
      },
    ]
  }, [multiplierInputValue, handleConversionChange])

  // Получаем список всех категорий
  const availableCategories = React.useMemo(() => {
    const categories = new Set<string>()
    data.forEach(product => {
      categories.add(product.group || 'Others')
    })
    return Array.from(categories).sort((a, b) => {
      const orderA = CATEGORY_ORDER[a] ?? 999
      const orderB = CATEGORY_ORDER[b] ?? 999
      return orderA - orderB
    })
  }, [data])

  // Фильтруем данные по поисковому запросу и категории
  const filteredData = React.useMemo(() => {
    let filtered = data

    // Фильтр по категории
    if (selectedCategoryFilter !== 'all') {
      filtered = filtered.filter(product => (product.group || 'Others') === selectedCategoryFilter)
    }

    // Фильтр по поисковому запросу
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase().trim()
      filtered = filtered.filter(product => {
        const productNumber = product.productNumber.toLowerCase()
        const productName = product.productName.toLowerCase()
        return productNumber.includes(query) || productName.includes(query)
      })
    }

    return filtered
  }, [data, searchQuery, selectedCategoryFilter])

  // Группируем продукты по категориям
  const groupedByCategory = React.useMemo(() => {
    const groups: Record<string, ProductData[]> = {}
    
    filteredData.forEach(product => {
      const category = product.group || 'Others'
      if (!groups[category]) {
        groups[category] = []
      }
      groups[category].push(product)
    })

    // Сортируем продукты внутри каждой категории по productNumber
    Object.keys(groups).forEach(category => {
      groups[category].sort((a, b) => a.productNumber.localeCompare(b.productNumber))
    })

    // Сортируем категории по порядку
    const sortedCategories = Object.keys(groups).sort((a, b) => {
      const orderA = CATEGORY_ORDER[a] ?? 999
      const orderB = CATEGORY_ORDER[b] ?? 999
      return orderA - orderB
    })

    return sortedCategories.map(category => ({
      category,
      products: groups[category],
    }))
  }, [filteredData])

  // Создаем временную таблицу для управления видимостью колонок
  const tempTable = useReactTable({
    data: data.slice(0, 1), // Используем один элемент для получения структуры колонок
    columns: dynamicColumns,
    getCoreRowModel: getCoreRowModel(),
    onColumnVisibilityChange: setColumnVisibility,
    state: {
      columnVisibility,
    },
  })

  return (
    <div className="w-full space-y-6">
      {/* Search and Filters */}
      <div className="flex flex-col sm:flex-row gap-3">
        <Input
          type="text"
          placeholder="Search by product number or name..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="flex-1 iron-border"
        />
        <Select value={selectedCategoryFilter} onValueChange={setSelectedCategoryFilter}>
          <SelectTrigger className="w-full sm:w-[200px] iron-border">
            <SelectValue placeholder="All categories" />
          </SelectTrigger>
          <SelectContent className="bg-card border-primary/20">
            <SelectItem value="all">All Categories</SelectItem>
            {availableCategories.map(category => (
              <SelectItem key={category} value={category}>{category}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Results count */}
      {(searchQuery || selectedCategoryFilter !== 'all') && (
        <div className="text-sm text-muted-foreground">
          Showing {filteredData.length} of {data.length} product{data.length !== 1 ? 's' : ''}
          {searchQuery && ` matching "${searchQuery}"`}
          {selectedCategoryFilter !== 'all' && ` in ${selectedCategoryFilter}`}
        </div>
      )}

      {/* Controls */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div className="flex items-center gap-3 flex-wrap">
          {onReplaceFile && (
            <>
              <Button
                onClick={() => {
                  setShowPasswordDialog(true)
                  setPassword('')
                  setPasswordError(null)
                }}
                variant="outline"
                size="sm"
                className="iron-border hover:iron-glow"
              >
                Replace
              </Button>
              <input
                ref={fileInputRef}
                type="file"
                accept=".pdf,application/pdf"
                onChange={(e) => {
                  const file = e.target.files?.[0]
                  console.log('File selected:', file?.name)
                  if (file && onReplaceFile) {
                    console.log('Calling onReplaceFile with:', file.name)
                    onReplaceFile(file)
                  }
                  // Reset input so the same file can be selected again
                  if (fileInputRef.current) {
                    fileInputRef.current.value = ''
                  }
                }}
                className="hidden"
              />
            </>
          )}
          
          <div className="flex items-center gap-2">
            <label htmlFor="period-multiplier" className="text-sm text-muted-foreground whitespace-nowrap">
              <span className="hidden sm:inline">Period Multiplier:</span>
              <span className="sm:hidden">Multiplier:</span>
            </label>
            <div className="relative">
              <Input
                id="period-multiplier"
                type="number"
                min="1"
                max="30000"
                step="1"
                value={multiplierInputValue}
                onChange={(e) => handleMultiplierChange(e.target.value)}
                onBlur={handleMultiplierSave}
                onKeyDown={handleMultiplierKeyDown}
                disabled={isLoadingMultiplier || isSavingMultiplier}
                className="w-[100px] sm:w-[120px] iron-border"
                placeholder="12"
              />
              {(isLoadingMultiplier || isSavingMultiplier) && (
                <span className="absolute right-2 top-1/2 -translate-y-1/2 text-xs text-muted-foreground">
                  {isLoadingMultiplier ? '...' : 'Saving...'}
                </span>
              )}
            </div>
            <span className="text-sm text-muted-foreground">K</span>
          </div>
        </div>
        
        {/* Password Dialog */}
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
                  fileInputRef.current?.click()
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
        
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button
              variant="outline"
              size="sm"
              className="iron-border hover:iron-glow"
            >
              <Settings2 className="mr-2 h-4 w-4" />
              <span className="hidden sm:inline">Columns</span>
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="bg-card border-primary/20">
            <DropdownMenuLabel>Toggle columns</DropdownMenuLabel>
            <DropdownMenuSeparator />
            {tempTable
              .getAllColumns()
              .filter((column) => column.getCanHide())
              .map((column) => {
                const columnNames: Record<string, string> = {
                  productName: "Product Name",
                  productNumber: "Product #",
                  unit: "Unit",
                  w38: "W38 '25",
                  w39: "W39 '25",
                  w40: "W40 '25",
                  w41: "W41 '25",
                  conversion: "Conversion",
                  avg4: "AVG4",
                  csPer1k: "CS per 1k",
                  periodColumn: (() => {
                    const mult = parseFloat(multiplierInputValue) || 0
                    const formatted = mult % 1 === 0 ? mult.toString() : mult.toString().replace(/\.?0+$/, '')
                    return mult > 0 ? `$${formatted}K` : "$0K"
                  })(),
                }
                
                return (
                  <DropdownMenuCheckboxItem
                    key={column.id}
                    checked={column.getIsVisible()}
                    onCheckedChange={(value) =>
                      column.toggleVisibility(!!value)
                    }
                  >
                    {columnNames[column.id] || column.id}
                  </DropdownMenuCheckboxItem>
                )
              })}
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      {/* No results message */}
      {groupedByCategory.length === 0 && (
        <div className="rounded-lg border border-primary/20 bg-card/60 p-8 text-center">
          <p className="text-muted-foreground">
            No products found matching your search criteria.
          </p>
          {(searchQuery || selectedCategoryFilter !== 'all') && (
            <Button
              variant="outline"
              size="sm"
              className="mt-4 iron-border"
              onClick={() => {
                setSearchQuery('')
                setSelectedCategoryFilter('all')
              }}
            >
              Clear Filters
            </Button>
          )}
        </div>
      )}

      {groupedByCategory.map(({ category, products }) => (
        <CategoryTable
          key={category}
          category={category}
          products={products}
          dynamicColumns={dynamicColumns}
          columnVisibility={columnVisibility}
        />
      ))}
    </div>
  )
}
