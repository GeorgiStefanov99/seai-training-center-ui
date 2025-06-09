import React from "react"

export interface Column {
  key: string;
  header: React.ReactNode;
  accessorKey?: string;
  cell?: (row: any, index: number) => React.ReactNode;
  sortable?: boolean;
  cellClassName?: string;
}
