"use client"

import React, { useState, useEffect, useMemo } from "react"
import { useRouter } from "next/navigation"
import { PageLayout } from "@/components/page-layout"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { CustomTable } from "@/components/ui/custom-table"
import { Column } from "@/types/table"
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
  Calendar,
  Archive,
  ChevronRight
} from "lucide-react"
import { useAuth } from "@/hooks/useAuth"
import { getCourses, deleteCourse, archiveCourse } from "@/services/courseService"
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
import { ArchiveConfirmationDialog } from "@/components/dialogs/archive-confirmation-dialog"

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
  const [archiveDialogOpen, setArchiveDialogOpen] = useState(false)
  const [isArchiving, setIsArchiving] = useState(false)
  
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
  
  // Handle archive course
  const handleArchiveCourse = (course: Course) => {
    setSelectedCourse(course)
    setArchiveDialogOpen(true)
  }
  
  // Confirm archive course
  const confirmArchiveCourse = async (remark: string) => {
    if (!selectedCourse || !trainingCenterId) return
    
    try {
      setIsArchiving(true)
      await archiveCourse(
        { trainingCenterId, courseId: selectedCourse.id },
        { finishRemark: remark }
      )
      
      toast.success("Course archived successfully")
      fetchCourses() // Refresh the list
      setArchiveDialogOpen(false)
    } catch (error) {
      console.error("Error archiving course:", error)
      toast.error("Failed to archive course. Please try again.")
    } finally {
      setIsArchiving(false)
    }
  }
  
  const columns: Column[] = [
    {
      key: "index",
      header: <div className="text-center w-full">#</div>,
      cell: (_, index) => index + 1,
      cellClassName: "text-center"
    },
    {
      key: "name",
      header: <div className="text-center w-full">Name</div>,
      accessorKey: "name",
      cellClassName: "text-center"
    },
    {
      key: "startDate",
      header: <div className="text-center w-full">Start Date</div>,
      cell: (row) => formatDate(row.startDate),
      cellClassName: "text-center"
    },
    {
      key: "startTime",
      header: <div className="text-center w-full">Start Time</div>,
      cell: (row) => formatTime(row.startTime),
      cellClassName: "text-center"
    },
    {
      key: "endDate",
      header: <div className="text-center w-full">End Date</div>,
      cell: (row) => formatDate(row.endDate),
      cellClassName: "text-center"
    },
    {
      key: "endTime",
      header: <div className="text-center w-full">End Time</div>,
      cell: (row) => formatTime(row.endTime),
      cellClassName: "text-center"
    },
    {
      key: "status",
      header: <div className="text-center w-full">Status</div>,
      cell: (row) => (
        <Badge variant={getStatusBadgeVariant(row.status)}>
          {row.status ? row.status.replace('_', ' ') : 'Unknown'}
        </Badge>
      ),
      cellClassName: "text-center"
    },
    {
      key: "enrolled",
      header: <div className="text-center w-full">Enrolled</div>,
      cell: (row) => (
        <div className="flex items-center justify-center gap-1">
          <Users className="h-3 w-3" />
          <span>{row.maxSeats - row.availableSeats} / {row.maxSeats}</span>
        </div>
      ),
      cellClassName: "text-center"
    },
    {
      key: "actions",
      header: <div className="text-center w-full">Actions</div>,
      cell: (row) => (
        <div className="flex items-center justify-center gap-1">
          <Button
            variant="ghost"
            size="icon"
            onClick={(e) => {
              e.stopPropagation();
              handleEditCourse(row);
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
              handleManageAttendees(row);
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
              handleArchiveCourse(row);
            }}
            title="Archive Course"
          >
            <Archive className="h-4 w-4" />
          </Button>
          <Button
            variant="ghost"
            size="icon"
            onClick={(e) => {
              e.stopPropagation();
              handleDeleteCourse(row);
            }}
            title="Delete Course"
            className="text-destructive hover:text-destructive/90 hover:bg-destructive/10"
          >
            <Trash2 className="h-4 w-4" />
          </Button>
        </div>
      ),
      cellClassName: "text-center"
    }
  ]
  
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
            <div className="flex gap-2">
              <Button variant="outline" onClick={() => router.push("/courses/archive")}>
                <Calendar className="mr-2 h-4 w-4" />
                View Archive
              </Button>
              <Button onClick={() => setCreateDialogOpen(true)}>
                <Plus className="mr-2 h-4 w-4" />
                Schedule Course
              </Button>
            </div>
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
            <CustomTable
              columns={columns}
              data={filteredCourses}
              isLoading={isLoading}
              rowRender={(row, index) => (
                <tr 
                  key={row.id || index} 
                  className={`h-10 cursor-pointer hover:bg-muted/50 transition-colors ${index % 2 === 0 ? '' : 'bg-muted/30'}`}
                  onClick={() => router.push(`/courses/detail?id=${row.id}`)}
                >
                  {columns.map((column) => (
                    <td key={column.key} className={`px-2 py-1 text-xs ${column.cellClassName || ""}`}>
                      {column.key === 'actions' ? (
                        // For the actions column, we want to prevent the row click event
                        <div onClick={(e) => e.stopPropagation()}>
                          {column.cell ? column.cell(row, index) : null}
                        </div>
                      ) : (
                        column.cell
                          ? column.cell(row, index)
                          : (column.accessorKey ? (row as any)[column.accessorKey] : null)
                      )}
                    </td>
                  ))}
                  <td className="px-2 py-1 text-xs text-muted-foreground">
                    <ChevronRight className="h-4 w-4" />
                  </td>
                </tr>
              )}
              emptyState={
                <div className="text-center">
                  <p className="text-muted-foreground mb-2">No courses found</p>
                  <Button variant="outline" onClick={() => setCreateDialogOpen(true)}>
                    Schedule Your First Course
                  </Button>
                </div>
              }
            />
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

        {/* Add the Archive Confirmation Dialog */}
        {selectedCourse && (
          <ArchiveConfirmationDialog
            open={archiveDialogOpen}
            onOpenChange={setArchiveDialogOpen}
            onConfirm={confirmArchiveCourse}
            courseName={selectedCourse.name}
            endDate={selectedCourse.endDate}
            isLoading={isArchiving}
          />
        )}
      </div>
    </PageLayout>
  )
}
