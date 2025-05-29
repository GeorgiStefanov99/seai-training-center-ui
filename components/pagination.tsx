import {
  Pagination,
  PaginationContent,
  PaginationEllipsis,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from "@/components/ui/pagination"

interface PaginationProps {
  currentPage: number
  totalPages: number
  onPageChange: (page: number) => void
}

export function PaginationComponent({ currentPage, totalPages, onPageChange }: PaginationProps) {
  const getPageNumbers = () => {
    const pages = []
    const maxVisiblePages = 5
    const halfVisible = Math.floor(maxVisiblePages / 2)

    // Always show first page
    pages.push(1)

    // Calculate range of visible pages
    let start = Math.max(2, currentPage - halfVisible)
    let end = Math.min(totalPages - 1, currentPage + halfVisible)

    // Adjust if we're near the start
    if (currentPage <= halfVisible + 1) {
      end = Math.min(totalPages - 1, maxVisiblePages - 1)
    }

    // Adjust if we're near the end
    if (currentPage >= totalPages - halfVisible) {
      start = Math.max(2, totalPages - maxVisiblePages + 1)
    }

    // Add ellipsis after first page if needed
    if (start > 2) {
      pages.push('ellipsis1')
    }

    // Add visible page numbers
    for (let i = start; i <= end; i++) {
      pages.push(i)
    }

    // Add ellipsis before last page if needed
    if (end < totalPages - 1) {
      pages.push('ellipsis2')
    }

    // Always show last page if there is more than one page
    if (totalPages > 1) {
      pages.push(totalPages)
    }

    return pages
  }

  return (
    <Pagination>
      <PaginationContent>
        <PaginationItem>
          <PaginationPrevious
            href="#"
            onClick={(e) => {
              e.preventDefault()
              if (currentPage > 1) onPageChange(currentPage - 1)
            }}
          />
        </PaginationItem>

        {getPageNumbers().map((pageNum, index) => (
          <PaginationItem key={`${pageNum}-${index}`}>
            {pageNum === 'ellipsis1' || pageNum === 'ellipsis2' ? (
              <PaginationEllipsis />
            ) : (
              <PaginationLink
                href="#"
                isActive={pageNum === currentPage}
                onClick={(e) => {
                  e.preventDefault()
                  onPageChange(pageNum as number)
                }}
              >
                {pageNum}
              </PaginationLink>
            )}
          </PaginationItem>
        ))}

        <PaginationItem>
          <PaginationNext
            href="#"
            onClick={(e) => {
              e.preventDefault()
              if (currentPage < totalPages) onPageChange(currentPage + 1)
            }}
          />
        </PaginationItem>
      </PaginationContent>
    </Pagination>
  )
}
