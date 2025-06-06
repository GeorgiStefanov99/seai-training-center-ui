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
import { 
  Search, 
  Loader2, 
  Filter, 
  Calendar,
  ArrowLeft
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
                onChange={(e) => setSearchQuery(e.target.value)}
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
            {isLoading ? (
              <div className="flex justify-center items-center py-8">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
              </div>
            ) : filteredCourses.length === 0 ? (
              <div className="text-center py-8">
                <Calendar className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                <h3 className="text-lg font-medium">No archived courses found</h3>
                <p className="text-muted-foreground mb-4">
                  {courses.length === 0
                    ? "You haven't archived any courses yet."
                    : "No courses match your search criteria."}
                </p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="text-center w-12">#</TableHead>
                      <TableHead className="text-center">Name</TableHead>
                      <TableHead className="text-center">Start Date</TableHead>
                      <TableHead className="text-center">Start Time</TableHead>
                      <TableHead className="text-center">End Date</TableHead>
                      <TableHead className="text-center">End Time</TableHead>
                      <TableHead className="text-center">Enrolled</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredCourses.map((course, idx) => (
                      <TableRow 
                        key={course.id} 
                        className="cursor-pointer hover:bg-muted/50"
                        onClick={() => router.push(`/courses/archive/detail?id=${course.id}`)}
                      >
                        <TableCell className="text-center font-medium">{idx + 1}</TableCell>
                        <TableCell className="text-center font-medium">{course.name}</TableCell>
                        <TableCell className="text-center">{formatDate(course.startDate)}</TableCell>
                        <TableCell className="text-center">{formatTime(course.startTime)}</TableCell>
                        <TableCell className="text-center">{formatDate(course.endDate)}</TableCell>
                        <TableCell className="text-center">{formatTime(course.endTime)}</TableCell>
                        <TableCell className="text-center">
                          <div className="flex items-center justify-center gap-1">
                            {isLoadingEnrolled ? (
                              <Loader2 className="h-4 w-4 animate-spin text-primary" />
                            ) : (
                              <span>{enrolledCounts[course.id] ?? 0} / {course.maxSeats}</span>
                            )}
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </PageLayout>
  )
} 