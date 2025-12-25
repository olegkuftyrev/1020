"use client"

import * as React from "react"
import {
  flexRender,
  getCoreRowModel,
  useReactTable,
  type ColumnDef,
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
import { ProductData } from "@/utils/pdfParser"

const columns: ColumnDef<ProductData>[] = [
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
      const value = row.getValue("conversion") as string
      return (
        <div className="text-center text-muted-foreground">
          {value || '-'}
        </div>
      )
    },
  },
  {
    accessorKey: "unit",
    header: "Unit",
    cell: ({ row }) => (
      <div className="text-center text-muted-foreground">{row.getValue("unit")}</div>
    ),
  },
  {
    accessorKey: "w38",
    header: "W38 '25",
    cell: ({ row }) => (
      <div className="text-right font-medium">{row.getValue("w38")}</div>
    ),
  },
  {
    accessorKey: "w39",
    header: "W39 '25",
    cell: ({ row }) => (
      <div className="text-right font-medium">{row.getValue("w39")}</div>
    ),
  },
  {
    accessorKey: "w40",
    header: "W40 '25",
    cell: ({ row }) => (
      <div className="text-right font-medium">{row.getValue("w40")}</div>
    ),
  },
  {
    accessorKey: "w41",
    header: "W41 '25",
    cell: ({ row }) => (
      <div className="text-right font-medium">{row.getValue("w41")}</div>
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
        <div className="text-right font-medium">
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
          <div className="text-right text-muted-foreground">-</div>
        )
      }
      
      const csPer1k = avg / conversion
      return (
        <div className="text-right font-medium">
          {csPer1k.toFixed(2)}
        </div>
      )
    },
  },
]

interface ProductsTableProps {
  data: ProductData[]
  onDataChange?: (updatedData: ProductData[]) => void
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
  const table = useReactTable({
    data: products,
    columns: dynamicColumns,
    getCoreRowModel: getCoreRowModel(),
    state: {
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
              table.getRowModel().rows.map((row) => (
                <TableRow
                  key={row.id}
                  data-state={row.getIsSelected() && "selected"}
                  className="hover:bg-primary/5"
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
              ))
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

export function ProductsTable({ data }: ProductsTableProps) {
  const [selectedPeriod, setSelectedPeriod] = React.useState<string>("daily")
  
  const [columnVisibility, setColumnVisibility] = React.useState<VisibilityState>({
    conversion: false,
    unit: false,
    w38: false,
    w39: false,
    w40: false,
    w41: false,
    avg4: false,
  })

  // Динамические колонки в зависимости от выбранного периода
  const dynamicColumns: ColumnDef<ProductData>[] = React.useMemo(() => [
    ...columns,
    {
      id: "periodColumn",
      header: selectedPeriod === "daily" ? "$12K" : "$82K",
      cell: ({ row }) => {
        const w38 = parseFloat(row.original.w38) || 0
        const w39 = parseFloat(row.original.w39) || 0
        const w40 = parseFloat(row.original.w40) || 0
        const w41 = parseFloat(row.original.w41) || 0
        const avg = (w38 + w39 + w40 + w41) / 4
        const conversion = parseFloat(row.original.conversion || '0') || 0
        
        if (conversion === 0) {
          return (
            <div className="text-right text-muted-foreground">-</div>
          )
        }
        
        const csPer1k = avg / conversion
        const multiplier = selectedPeriod === "daily" ? 12 : 82
        const result = csPer1k * multiplier
        
        return (
          <div className="text-right font-medium">
            {result.toFixed(2)}
          </div>
        )
      },
    },
  ], [selectedPeriod])

  // Группируем продукты по категориям
  const groupedByCategory = React.useMemo(() => {
    const groups: Record<string, ProductData[]> = {}
    
    data.forEach(product => {
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
      const orderA = CATEGORY_ORDER[a] ?? 9
      const orderB = CATEGORY_ORDER[b] ?? 9
      return orderA - orderB
    })

    return sortedCategories.map(category => ({
      category,
      products: groups[category],
    }))
  }, [data])

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
