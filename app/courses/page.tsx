"use client"

import React, { useState, useEffect, useMemo } from "react"
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
  Plus, 
  Search, 
  Loader2, 
  Filter, 
  Edit, 
  Trash2, 
  UserPlus, 
  MoreHorizontal,
  Users,
  Calendar
} from "lucide-react"
import { useAuth } from "@/hooks/useAuth"
import { getCourses, deleteCourse } from "@/services/courseService"
import { Course } from "@/types/course"
import { toast } from "sonner"
import { DeleteConfirmationDialog } from "@/components/dialogs/delete-confirmation-dialog"
import { Badge } from "@/components/ui/badge"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { format, parse } from "date-fns"
import { CourseSchedulingDialog } from "@/components/dialogs/course-scheduling-dialog"
import { CourseAttendeesManagementDialog } from "@/components/dialogs/course-attendees-management-dialog"
import { 
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger
} from "@/components/ui/dropdown-menu"

export default function CoursesPage() {
  const router = useRouter()
  const { user } = useAuth()
  
  const [courses, setCourses] = useState<Course[]>([])
  const [filteredCourses, setFilteredCourses] = useState<Course[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState("")
  const [statusFilter, setStatusFilter] = useState<string>("ALL")
  const [error, setError] = useState<string | null>(null)
  
  // Dialog states
  const [createDialogOpen, setCreateDialogOpen] = useState(false)
  const [editDialogOpen, setEditDialogOpen] = useState(false)
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false)
  const [attendeesDialogOpen, setAttendeesDialogOpen] = useState(false)
  const [selectedCourse, setSelectedCourse] = useState<Course | null>(null)
  
  // Get training center ID from the authenticated user
  const trainingCenterId = user?.userId || ""
  
  // Fetch courses
  const fetchCourses = async () => {
    if (!trainingCenterId) {
      setError("Training center ID is required")
      setIsLoading(false)
      return
    }
    
    try {
      setIsLoading(true)
      const data = await getCourses(trainingCenterId)
      setCourses(data)
      setError(null)
    } catch (error) {
      console.error("Error fetching courses:", error)
      setError("Failed to fetch courses. Please try again.")
    } finally {
      setIsLoading(false)
    }
  }
  
  // Initial data fetch
  useEffect(() => {
    fetchCourses()
  }, [trainingCenterId])
  
  // Filter courses based on search query and status filter
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
        course.description.toLowerCase().includes(query)
      )
    }
    
    // Apply status filter
    if (statusFilter !== "ALL") {
      filtered = filtered.filter(course => course.status === statusFilter)
    }
    
    setFilteredCourses(filtered)
  }, [courses, searchQuery, statusFilter])
  
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
      // If it's a string in HH:mm:ss format, extract just HH:mm
      if (typeof timeString === 'string') {
        // Split by colon and take the first two parts (hours and minutes)
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
  
  // Get status badge variant
  const getStatusBadgeVariant = (status?: string) => {
    if (!status) return "outline"
    
    switch (status) {
      case "SCHEDULED":
        return "outline"
      case "IN_PROGRESS":
        return "default"
      case "COMPLETED":
        return "success"
      case "CANCELLED":
        return "destructive"
      default:
        return "outline"
    }
  }
  
  // Handle course deletion
  const handleDeleteCourse = (course: Course) => {
    setSelectedCourse(course)
    setDeleteDialogOpen(true)
  }
  
  // Confirm course deletion
  const confirmDeleteCourse = async () => {
    if (!selectedCourse || !trainingCenterId) return
    
    try {
      await deleteCourse({
        trainingCenterId,
        courseId: selectedCourse.id
      })
      
      toast.success("Course deleted successfully")
      fetchCourses() // Refresh the list
      setDeleteDialogOpen(false)
    } catch (error) {
      console.error("Error deleting course:", error)
      toast.error("Failed to delete course. Please try again.")
    }
  }
  
  // Handle course edit
  const handleEditCourse = (course: Course) => {
    setSelectedCourse(course)
    setEditDialogOpen(true)
  }
  
  // Handle manage course attendees
  const handleManageAttendees = (course: Course) => {
    setSelectedCourse(course)
    setAttendeesDialogOpen(true)
  }
  
  return (
    <PageLayout title="Courses">
      <div className="space-y-6">
        {error && (
          <div className="bg-destructive/10 text-destructive p-4 rounded-md">
            {error}
          </div>
        )}
        
        <div className="flex flex-col space-y-4">
          <div className="flex justify-between items-center">
            <div>
              <h2 className="text-xl font-semibold">Active Courses</h2>
              <p className="text-muted-foreground">Manage all your active courses</p>
            </div>
            <Button onClick={() => setCreateDialogOpen(true)}>
              <Plus className="mr-2 h-4 w-4" />
              Schedule Course
            </Button>
          </div>
          
          <div className="flex flex-col sm:flex-row gap-4">
            {/* Search bar */}
            <div className="relative flex-1">
              <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search courses..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-8"
              />
            </div>
            
            {/* Status filter */}
            <div className="w-full sm:w-[200px]">
              <Select
                value={statusFilter}
                onValueChange={setStatusFilter}
              >
                <SelectTrigger>
                  <div className="flex items-center">
                    <Filter className="mr-2 h-4 w-4" />
                    <SelectValue placeholder="Filter by status" />
                  </div>
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="ALL">All Statuses</SelectItem>
                  <SelectItem value="SCHEDULED">Scheduled</SelectItem>
                  <SelectItem value="IN_PROGRESS">In Progress</SelectItem>
                  <SelectItem value="COMPLETED">Completed</SelectItem>
                  <SelectItem value="CANCELLED">Cancelled</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </div>
        
        <Card>
          <CardHeader>
            <CardTitle>Courses</CardTitle>
            <CardDescription>
              {filteredCourses.length} course{filteredCourses.length !== 1 ? 's' : ''} found
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
                <h3 className="text-lg font-medium">No courses found</h3>
                <p className="text-muted-foreground mb-4">
                  {courses.length === 0
                    ? "You haven't scheduled any courses yet."
                    : "No courses match your search criteria."}
                </p>
                {courses.length === 0 && (
                  <Button onClick={() => setCreateDialogOpen(true)}>
                    <Plus className="mr-2 h-4 w-4" />
                    Schedule Your First Course
                  </Button>
                )}
              </div>
            ) : (
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Name</TableHead>
                      <TableHead>Start Date</TableHead>
                      <TableHead>Start Time</TableHead>
                      <TableHead>End Date</TableHead>
                      <TableHead>End Time</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Enrolled</TableHead>
                      <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredCourses.map((course) => (
                      <TableRow 
                        key={course.id} 
                        className="cursor-pointer hover:bg-muted/50"
                        onClick={() => router.push(`/courses/detail?id=${course.id}`)}
                      >
                        <TableCell className="font-medium">{course.name}</TableCell>
                        <TableCell>{formatDate(course.startDate)}</TableCell>
                        <TableCell>{formatTime(course.startTime)}</TableCell>
                        <TableCell>{formatDate(course.endDate)}</TableCell>
                        <TableCell>{formatTime(course.endTime)}</TableCell>
                        <TableCell>
                          <Badge variant={getStatusBadgeVariant(course.status)}>
                            {course.status ? course.status.replace('_', ' ') : 'Unknown'}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-1">
                            <Users className="h-3 w-3" />
                            <span>{course.availableSeats} / {course.maxSeats}</span>
                          </div>
                        </TableCell>
                        <TableCell className="text-right">
                          <div className="flex items-center justify-end gap-2">
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={(e) => {
                                e.stopPropagation();
                                handleEditCourse(course);
                              }}
                              title="Edit Course"
                            >
                              <Edit className="h-4 w-4" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={(e) => {
                                e.stopPropagation();
                                handleManageAttendees(course);
                              }}
                              title="Assign Seafarer"
                            >
                              <UserPlus className="h-4 w-4" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={(e) => {
                                e.stopPropagation();
                                handleDeleteCourse(course);
                              }}
                              title="Delete Course"
                              className="text-destructive hover:text-destructive/90 hover:bg-destructive/10"
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
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
        
        {/* Delete Confirmation Dialog */}
        <DeleteConfirmationDialog
          open={deleteDialogOpen}
          onOpenChange={setDeleteDialogOpen}
          title="Delete Course"
          description={`Are you sure you want to delete the course "${selectedCourse?.name || ''}"? This action cannot be undone.`}
          onConfirm={confirmDeleteCourse}
        />
        
        {/* Create Course Dialog */}
        <CourseSchedulingDialog
          open={createDialogOpen}
          onOpenChange={setCreateDialogOpen}
          onSuccess={fetchCourses}
          template={null}
        />
        
        {/* Edit Course Dialog - Note: We would need to create a course edit dialog component */}
        {/* Course scheduling dialog for editing */}
        {selectedCourse && (
          <CourseSchedulingDialog
            open={editDialogOpen}
            onOpenChange={setEditDialogOpen}
            onSuccess={fetchCourses}
            template={null}
            existingCourse={selectedCourse}
          />
        )}

        {/* Course attendees management dialog */}
        {selectedCourse && (
          <CourseAttendeesManagementDialog
            open={attendeesDialogOpen}
            onOpenChange={setAttendeesDialogOpen}
            courseId={selectedCourse.id}
            courseName={selectedCourse.name}
            templateId={selectedCourse.templateId}
            refreshData={fetchCourses}
          />
        )}
      </div>
    </PageLayout>
  )
}
