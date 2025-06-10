import React from "react"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { Column } from "@/types/table"
import { Loader2 } from "lucide-react"

interface CustomTableProps<T> {
  columns: Column[]
  data: T[]
  isLoading?: boolean
  rowRender?: (row: T, index: number) => React.ReactNode
  emptyState?: React.ReactNode
  headerRender?: (column: Column) => React.ReactNode
  footerContent?: React.ReactNode
}

export function CustomTable<T>({
  columns,
  data,
  isLoading = false,
  rowRender,
  emptyState,
  headerRender,
  footerContent,
}: CustomTableProps<T>) {
  if (isLoading) {
    return (
      <div className="flex h-40 w-full items-center justify-center">
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
      </div>
    )
  }

  if (!data.length) {
    return (
      <div className="flex h-40 w-full items-center justify-center">
        {emptyState || (
          <p className="text-sm text-muted-foreground">No data available</p>
        )}
      </div>
    )
  }

  return (
    <div className="rounded-md border">
      <div className="overflow-x-auto">
        <Table className="w-full min-w-[900px]">
          <TableHeader>
            <TableRow className="bg-muted/50">
              {columns.map((column) => (
                <TableHead 
                  key={column.key} 
                  className="px-2 py-2 text-sm font-medium h-10 whitespace-nowrap"
                >
                  {headerRender ? headerRender(column) : column.header}
                </TableHead>
              ))}
            </TableRow>
          </TableHeader>
          <TableBody>
            {rowRender
              ? data.map((row, index) => rowRender(row, index))
              : data.map((row, index) => (
                  <TableRow key={index} className="h-10">
                    {columns.map((column) => (
                      <TableCell key={column.key} className="px-2 py-1 text-xs">
                        {column.cell
                          ? column.cell(row, index)
                          : (column.accessorKey ? (row as any)[column.accessorKey] : null)}
                      </TableCell>
                    ))}
                  </TableRow>
                ))}
          </TableBody>
        </Table>
      </div>
      {footerContent && (
        <div className="border-t">
          {footerContent}
        </div>
      )}
    </div>
  )
}
