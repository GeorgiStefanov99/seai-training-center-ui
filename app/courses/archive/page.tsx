"use client"

import React, { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { PageLayout } from "@/components/page-layout"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { CustomTable } from "@/components/ui/custom-table"
import { 
  Search, 
  Loader2, 
  Filter, 
  Calendar,
  ArrowLeft,
  ChevronLeft,
  ChevronRight
} from "lucide-react"
import { useAuth } from "@/hooks/useAuth"
import { getArchivedCourses } from "@/services/courseService"
import { getArchivedCourseAttendees } from "@/services/courseAttendeeService"
import { Course } from "@/types/course"
import { toast } from "sonner"
import { Badge } from "@/components/ui/badge"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { format } from "date-fns"

export default function ArchivedCoursesPage() {
  const router = useRouter()
  const { user } = useAuth()
  
  const [courses, setCourses] = useState<Course[]>([])
  const [filteredCourses, setFilteredCourses] = useState<Course[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState("")
  const [error, setError] = useState<string | null>(null)
  const [enrolledCounts, setEnrolledCounts] = useState<Record<string, number>>({})
  const [isLoadingEnrolled, setIsLoadingEnrolled] = useState(false)
  
  // Pagination state
  const ITEMS_PER_PAGE = 20;
  const [currentPage, setCurrentPage] = useState(1);
  
  // Get training center ID from the authenticated user
  const trainingCenterId = user?.userId || ""
  
  // Fetch archived courses
  const fetchArchivedCourses = async () => {
    if (!trainingCenterId) {
      setError("Training center ID is required")
      setIsLoading(false)
      return
    }
    
    try {
      setIsLoading(true)
      const data = await getArchivedCourses(trainingCenterId)
      setCourses(data)
      setError(null)
      // Fetch enrolled counts for each course
      setIsLoadingEnrolled(true)
      const counts: Record<string, number> = {}
      await Promise.all(
        data.map(async (course) => {
          try {
            const attendees = await getArchivedCourseAttendees({ trainingCenterId, courseId: course.id })
            counts[course.id] = attendees.length
          } catch {
            counts[course.id] = 0
          }
        })
      )
      setEnrolledCounts(counts)
      setIsLoadingEnrolled(false)
    } catch (error) {
      console.error("Error fetching archived courses:", error)
      setError("Failed to fetch archived courses. Please try again.")
    } finally {
      setIsLoading(false)
    }
  }
  
  // Initial data fetch
  useEffect(() => {
    fetchArchivedCourses()
  }, [trainingCenterId])
  
  // Filter courses based on search query
  useEffect(() => {
    // Reset pagination when filters change
    setCurrentPage(1);
    if (courses.length === 0) {
      setFilteredCourses([])
      return
    }
    
    let filtered = [...courses]
    
    // Apply search filter
    if (searchQuery) {
      const query = searchQuery.toLowerCase()
      filtered = filtered.filter(course => 
        course.name.toLowerCase().includes(query) ||
        course.description?.toLowerCase().includes(query)
      )
    }
    
    setFilteredCourses(filtered)
  }, [courses, searchQuery])
  
  // Format date for display
  const formatDate = (dateString: string) => {
    try {
      const date = new Date(dateString)
      return format(date, "dd/MM/yyyy")
    } catch (e) {
      return ""
    }
  }
  
  // Format time for display
  const formatTime = (timeString?: string) => {
    if (!timeString) return ""
    try {
      if (typeof timeString === 'string') {
        const parts = timeString.split(':')
        if (parts.length >= 2) {
          return `${parts[0]}:${parts[1]}`
        }
        return timeString
      }
      return ""
    } catch (e) {
      return ""
    }
  }
  
  // Go back to courses page
  const handleGoBack = () => {
    router.push("/courses")
  }
  
  return (
    <PageLayout title="Archived Courses">
      <div className="space-y-6">
        {error && (
          <div className="bg-destructive/10 text-destructive p-4 rounded-md">
            {error}
          </div>
        )}
        
        <div className="flex flex-col space-y-4">
          <div className="flex justify-between items-center">
            <div className="flex items-center gap-4">
              <Button variant="outline" onClick={handleGoBack} className="gap-1">
                <ArrowLeft className="h-4 w-4" />
                Back to Courses
              </Button>
              <div>
                <h2 className="text-xl font-semibold">Archived Courses</h2>
                <p className="text-muted-foreground">View all your archived courses</p>
              </div>
            </div>
          </div>
          
          <div className="flex flex-col sm:flex-row gap-4">
            {/* Search bar */}
            <div className="relative flex-1">
              <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search archived courses..."
                value={searchQuery}
                onChange={(e) => {
                  setSearchQuery(e.target.value);
                  setCurrentPage(1); // Reset to first page when searching
                }}
                className="pl-8"
              />
            </div>
          </div>
        </div>
        
        <Card>
          <CardHeader>
            <CardTitle>Archived Courses</CardTitle>
            <CardDescription>
              {filteredCourses.length} archived course{filteredCourses.length !== 1 ? 's' : ''} found
            </CardDescription>
          </CardHeader>
          <CardContent>
            {/* Calculate pagination values */}
            {(() => {
              const totalItems = filteredCourses.length;
              const totalPages = Math.max(1, Math.ceil(totalItems / ITEMS_PER_PAGE));
              const startIndex = (currentPage - 1) * ITEMS_PER_PAGE;
              const endIndex = Math.min(startIndex + ITEMS_PER_PAGE, totalItems);
              const currentPageItems = filteredCourses.slice(startIndex, endIndex);
              
              return (
                <CustomTable
                    columns={[
                      {
                        key: "index",
                        header: "#",
                        cell: (_, index) => index + 1,
                        cellClassName: "text-center font-medium"
                      },
                      {
                        key: "name",
                        header: "Name",
                        accessorKey: "name",
                        cellClassName: "text-center font-medium"
                      },
                      {
                        key: "startDate",
                        header: "Start Date",
                        cell: (row) => formatDate(row.startDate),
                        cellClassName: "text-center"
                      },
                      {
                        key: "startTime",
                        header: "Start Time",
                        cell: (row) => formatTime(row.startTime),
                        cellClassName: "text-center"
                      },
                      {
                        key: "endDate",
                        header: "End Date",
                        cell: (row) => formatDate(row.endDate),
                        cellClassName: "text-center"
                      },
                      {
                        key: "endTime",
                        header: "End Time",
                        cell: (row) => formatTime(row.endTime),
                        cellClassName: "text-center"
                      },
                      {
                        key: "remark",
                        header: "Remark",
                        cell: (row) => row.finishRemark || '-',
                        cellClassName: "text-center"
                      },
                      {
                        key: "enrolled",
                        header: "Enrolled",
                        cell: (row) => (
                          <div className="flex items-center justify-center gap-1">
                            {isLoadingEnrolled ? (
                              <Loader2 className="h-4 w-4 animate-spin text-primary" />
                            ) : (
                              <span>{enrolledCounts[row.id] ?? 0} / {row.maxSeats}</span>
                            )}
                          </div>
                        ),
                        cellClassName: "text-center"
                      }
                    ]}
                    data={currentPageItems}
                    isLoading={isLoading}
                    rowRender={(row, index) => (
                      <tr 
                        key={row.id || index} 
                        className={`h-10 cursor-pointer hover:bg-muted/50 transition-colors ${index % 2 === 1 ? 'bg-muted/30' : ''}`}
                        onClick={() => router.push(`/courses/archive/detail?id=${row.id}`)}
                      >
                        <td className="px-3 py-2 text-xs text-center">{index + 1}</td>
                        <td className="px-3 py-2 text-xs text-center font-medium">{row.name}</td>
                        <td className="px-3 py-2 text-xs text-center">{formatDate(row.startDate)}</td>
                        <td className="px-3 py-2 text-xs text-center">{formatTime(row.startTime)}</td>
                        <td className="px-3 py-2 text-xs text-center">{formatDate(row.endDate)}</td>
                        <td className="px-3 py-2 text-xs text-center">{formatTime(row.endTime)}</td>
                        <td className="px-3 py-2 text-xs text-center">{row.finishRemark || '-'}</td>
                        <td className="px-3 py-2 text-xs text-center">
                          <div className="flex items-center justify-center gap-1">
                            {isLoadingEnrolled ? (
                              <Loader2 className="h-4 w-4 animate-spin text-primary" />
                            ) : (
                              <span>{enrolledCounts[row.id] ?? 0} / {row.maxSeats}</span>
                            )}
                          </div>
                        </td>
                      </tr>
                    )}
                    emptyState={
                      <div className="text-center py-8">
                        <Calendar className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                        <h3 className="text-lg font-medium">No archived courses found</h3>
                        <p className="text-muted-foreground mb-4">
                          {courses.length === 0
                            ? "You haven't archived any courses yet."
                            : "No courses match your search criteria."}
                        </p>
                      </div>
                    }
                  footerContent={
                    totalItems > 0 ? (
                      <div className="flex items-center justify-between px-2 py-4">
                        <div className="text-sm text-muted-foreground">
                          Showing {startIndex + 1} to {endIndex} of {totalItems} records
                        </div>
                        <div className="flex items-center space-x-6">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => setCurrentPage(page => Math.max(1, page - 1))}
                            disabled={currentPage === 1}
                          >
                            <ChevronLeft className="h-4 w-4 mr-1" />
                            Previous
                          </Button>
                          
                          <div className="text-sm font-medium">
                            Page {currentPage} of {totalPages}
                          </div>
                          
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => setCurrentPage(page => Math.min(totalPages, page + 1))}
                            disabled={currentPage === totalPages}
                          >
                            Next
                            <ChevronRight className="h-4 w-4 ml-1" />
                          </Button>
                        </div>
                      </div>
                    ) : null
                  }
                />
              );
            })()}
          </CardContent>
        </Card>
      </div>
    </PageLayout>
  )
}