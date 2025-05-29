import { useState, useEffect } from "react"

interface UsePaginationProps<T> {
  items: T[]
  itemsPerPage: number
  searchTerm?: string
}

interface UsePaginationReturn<T> {
  currentPage: number
  setCurrentPage: (page: number) => void
  paginatedItems: T[]
  totalPages: number
  totalItems: number
  startIndex: number
  endIndex: number
}

const usePagination = <T>({
  items,
  itemsPerPage,
  searchTerm,
}: UsePaginationProps<T>): UsePaginationReturn<T> => {
  const [currentPage, setCurrentPage] = useState(1)

  // Reset to first page when search changes
  useEffect(() => {
    setCurrentPage(1)
  }, [searchTerm])

  // Calculate pagination values
  const totalItems = items.length
  const totalPages = Math.max(1, Math.ceil(totalItems / itemsPerPage))
  const startIndex = (currentPage - 1) * itemsPerPage
  const endIndex = Math.min(startIndex + itemsPerPage, totalItems)
  const paginatedItems = items.slice(startIndex, endIndex)

  return {
    currentPage,
    setCurrentPage,
    paginatedItems,
    totalPages,
    totalItems,
    startIndex,
    endIndex,
  }
}

export default usePagination