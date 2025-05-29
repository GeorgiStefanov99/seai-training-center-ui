export interface Column {
  key: string;
  header: string;
  accessorKey?: string;
  cell?: (row: any, index: number) => React.ReactNode;
  sortable?: boolean;
}
