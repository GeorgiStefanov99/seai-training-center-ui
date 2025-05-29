/**
 * Table utilities for the Seafarer Management System
 * 
 * This file contains centralized table-related functions and constants used across the application
 * to ensure consistent table styling and behavior.
 */

/**
 * Standard column width definitions for consistent table layouts
 */
export const columnWidths = {
  // Entity identifiers
  id: "min-w-[80px]",
  displayId: "min-w-[80px]",
  
  // Names and titles
  name: "min-w-[150px]",
  sailorName: "min-w-[150px]",
  documentName: "min-w-[150px]",
  vesselName: "min-w-[100px]",
  
  // Classifications
  type: "min-w-[80px]",
  rank: "min-w-[80px]",
  flag: "min-w-[80px]",
  vesselType: "min-w-[80px]",
  
  // Locations
  port: "min-w-[120px]",
  route: "min-w-[120px]",
  
  // Time periods
  date: "min-w-[100px]",
  period: "min-w-[100px]",
  dateRange: "min-w-[180px]",
  duration: "min-w-[100px]",
  
  // Actions
  actions: "min-w-[80px]",
  actionsWide: "min-w-[120px]"
};

/**
 * Standard CSS classes for table cells
 */
export const tableCellClasses = {
  base: "px-2 py-2 text-xs whitespace-nowrap",
  header: "px-2 py-2 text-sm font-medium whitespace-nowrap",
  truncate: "truncate max-w-[200px]",
  center: "text-center",
  right: "text-right"
};

/**
 * Standard CSS classes for table rows
 */
export const tableRowClasses = {
  base: "h-10 border-b transition-colors hover:bg-muted/50",
  clickable: "cursor-pointer"
};

/**
 * Standard CSS classes for table containers
 */
export const tableContainerClasses = {
  wrapper: "rounded-md border",
  scrollContainer: "overflow-x-auto",
  table: "w-full min-w-[900px] caption-bottom text-sm"
};

/**
 * Interface for pagination state
 */
export interface PaginationState {
  pageIndex: number;
  pageSize: number;
  pageCount: number;
  total: number;
}

/**
 * Creates a pagination info text (e.g., "Showing 1 to 10 of 100")
 * @param pagination The pagination state
 * @returns Formatted pagination info text
 */
export function getPaginationInfoText(pagination: PaginationState): string {
  const start = pagination.pageIndex * pagination.pageSize + 1;
  const end = Math.min((pagination.pageIndex + 1) * pagination.pageSize, pagination.total);
  
  return `Showing ${start} to ${end} of ${pagination.total}`;
}

/**
 * Generates an array of page numbers for pagination display
 * @param currentPage Current page index (0-based)
 * @param totalPages Total number of pages
 * @param maxPages Maximum number of page buttons to show
 * @returns Array of page numbers to display
 */
export function getPageNumbers(currentPage: number, totalPages: number, maxPages: number = 5): number[] {
  if (totalPages <= maxPages) {
    return Array.from({ length: totalPages }, (_, i) => i);
  }
  
  // Always include first and last page
  const pages: number[] = [];
  
  // Calculate range of pages to show
  const halfMax = Math.floor(maxPages / 2);
  let startPage = Math.max(0, currentPage - halfMax);
  let endPage = Math.min(totalPages - 1, currentPage + halfMax);
  
  // Adjust if we're near the beginning or end
  if (startPage === 0) {
    endPage = Math.min(totalPages - 1, maxPages - 1);
  } else if (endPage === totalPages - 1) {
    startPage = Math.max(0, totalPages - maxPages);
  }
  
  // Add pages to array
  for (let i = startPage; i <= endPage; i++) {
    pages.push(i);
  }
  
  // Add ellipsis indicators
  if (startPage > 0) {
    pages.unshift(-1); // -1 represents ellipsis
    pages.unshift(0);  // Always include first page
  }
  
  if (endPage < totalPages - 1) {
    pages.push(-1); // -1 represents ellipsis
    pages.push(totalPages - 1); // Always include last page
  }
  
  return pages;
}

/**
 * Creates a sorting function for table data
 * @param key The object key to sort by
 * @param direction The sort direction ('asc' or 'desc')
 * @returns A sorting function for array.sort()
 */
export function createSortFunction<T>(key: keyof T, direction: 'asc' | 'desc' = 'asc'): (a: T, b: T) => number {
  return (a: T, b: T) => {
    const valueA = a[key];
    const valueB = b[key];
    
    // Handle null/undefined values
    if (valueA == null && valueB == null) return 0;
    if (valueA == null) return direction === 'asc' ? -1 : 1;
    if (valueB == null) return direction === 'asc' ? 1 : -1;
    
    // Compare based on value type
    if (typeof valueA === 'string' && typeof valueB === 'string') {
      return direction === 'asc' 
        ? valueA.localeCompare(valueB) 
        : valueB.localeCompare(valueA);
    }
    
    if (typeof valueA === 'number' && typeof valueB === 'number') {
      return direction === 'asc' 
        ? valueA - valueB 
        : valueB - valueA;
    }
    
    if (valueA instanceof Date && valueB instanceof Date) {
      return direction === 'asc' 
        ? valueA.getTime() - valueB.getTime() 
        : valueB.getTime() - valueA.getTime();
    }
    
    // Convert to string for other types
    const strA = String(valueA);
    const strB = String(valueB);
    
    return direction === 'asc' 
      ? strA.localeCompare(strB) 
      : strB.localeCompare(strA);
  };
}
