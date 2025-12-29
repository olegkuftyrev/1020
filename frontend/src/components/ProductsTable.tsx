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
import { ProductData } from "@/utils/pdfParser"
import { updateProductConversion } from "@/utils/productsApi"
import { cn } from "@/lib/utils"

// Check if product has anomaly (difference between weeks > 0.5)
function hasAnomaly(product: ProductData): boolean {
  const w38 = parseFloat(product.w38) || 0
  const w39 = parseFloat(product.w39) || 0
  const w40 = parseFloat(product.w40) || 0
  const w41 = parseFloat(product.w41) || 0
  
  const values = [w38, w39, w40, w41]
  const max = Math.max(...values)
  const min = Math.min(...values)
  
  return (max - min) > 0.5
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
                const isAnomaly = hasAnomaly(row.original)
                return (
                  <TableRow
                    key={row.id}
                    data-state={row.getIsSelected() && "selected"}
                    className={cn(
                      "hover:bg-primary/5",
                      isAnomaly && "bg-yellow-500/10 border-l-4 border-l-yellow-500"
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

export function ProductsTable({ data, onDataChange }: ProductsTableProps) {
  const [selectedPeriod, setSelectedPeriod] = React.useState<string>("daily")
  const [searchQuery, setSearchQuery] = React.useState<string>("")
  const [selectedCategoryFilter, setSelectedCategoryFilter] = React.useState<string>("all")
  
  const [columnVisibility, setColumnVisibility] = React.useState<VisibilityState>({
    conversion: false,
    unit: false,
    w38: false,
    w39: false,
    w40: false,
    w41: false,
    avg4: false,
  })

  // Handle conversion update with SWR revalidation
  const handleConversionChange = async (productNumber: string, conversion: string) => {
    await updateProductConversion(productNumber, conversion)
    // Revalidate SWR cache
    if (onDataChange) {
      onDataChange()
    }
  }

  // Динамические колонки в зависимости от выбранного периода
  const dynamicColumns: ColumnDef<ProductData>[] = React.useMemo(() => [
    ...createColumns(handleConversionChange),
    {
      id: "periodColumn",
      header: selectedPeriod === "daily" ? "$12K" : "$82K",
      accessorFn: (row) => {
        const w38 = parseFloat(row.w38) || 0
        const w39 = parseFloat(row.w39) || 0
        const w40 = parseFloat(row.w40) || 0
        const w41 = parseFloat(row.w41) || 0
        const avg = (w38 + w39 + w40 + w41) / 4
        const conversion = parseFloat(row.conversion || '0') || 0
        
        if (conversion === 0) {
          return 0
        }
        
        const csPer1k = avg / conversion
        const multiplier = selectedPeriod === "daily" ? 12 : 82
        return csPer1k * multiplier
      },
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
        const multiplier = selectedPeriod === "daily" ? 12 : 82
        const result = csPer1k * multiplier
        
        return (
          <div className="text-left font-medium">
            {result.toFixed(2)}
          </div>
        )
      },
    },
  ], [selectedPeriod])

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
      <div className="flex items-center justify-end gap-3">
        <Select value={selectedPeriod} onValueChange={setSelectedPeriod}>
          <SelectTrigger className="w-[180px] iron-border">
            <SelectValue placeholder="Select period" />
          </SelectTrigger>
          <SelectContent className="bg-card border-primary/20">
            <SelectItem value="daily">Daily $12K</SelectItem>
            <SelectItem value="weekly">Weekly $82K</SelectItem>
          </SelectContent>
        </Select>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button
              variant="outline"
              size="sm"
              className="iron-border hover:iron-glow"
            >
              <Settings2 className="mr-2 h-4 w-4" />
              Columns
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
                  periodColumn: selectedPeriod === "daily" ? "$12K" : "$82K",
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
