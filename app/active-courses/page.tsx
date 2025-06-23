"use client"

import React, { useState, useEffect, useMemo, useContext } from "react"
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
  Calendar, 
  Edit, 
  Users, 
  Archive, 
  Trash2, 
  MoreHorizontal,
  Filter,
  ChevronRight,
  UserPlus,
  Mail
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
import { format, parse, parseISO, startOfWeek, endOfWeek, eachWeekOfInterval, addWeeks, isSameWeek, startOfMonth, endOfMonth, isWithinInterval } from "date-fns"
import { CourseSchedulingDialog } from "@/components/dialogs/course-scheduling-dialog"
import { CourseAttendeesManagementDialog } from "@/components/dialogs/course-attendees-management-dialog"
import { SendScheduleDialog } from "@/components/dialogs/send-schedule-dialog"

// Create a context for course actions
const CourseActionsContext = React.createContext<{
  setCreateDialogOpen: React.Dispatch<React.SetStateAction<boolean>>
  setEditCourseData: React.Dispatch<React.SetStateAction<Course | null>>
  setSelectedCourseForAttendees: React.Dispatch<React.SetStateAction<Course | null>>
  setManageAttendeesDialogOpen: React.Dispatch<React.SetStateAction<boolean>>
  setCourseToDelete: React.Dispatch<React.SetStateAction<Course | null>>
  setArchiveDialogOpen: React.Dispatch<React.SetStateAction<boolean>>
  setIsDeleteDialogOpen: React.Dispatch<React.SetStateAction<boolean>>
}>({} as any)

// Weekly Preview Component
interface WeeklyPreviewProps {
  courses: Course[]
  isLoading: boolean
}

const WeeklyPreview: React.FC<WeeklyPreviewProps> = ({ courses, isLoading }) => {
  const router = useRouter()
  // Access the parent component's state setters via props
  const { setCreateDialogOpen, setEditCourseData, setSelectedCourseForAttendees, setManageAttendeesDialogOpen, setCourseToDelete, setArchiveDialogOpen, setIsDeleteDialogOpen } = useContext(CourseActionsContext)
  
  // Get current month's start and end dates
  const currentDate = new Date()
  const startOfCurrentMonth = startOfMonth(currentDate)
  const endOfCurrentMonth = endOfMonth(currentDate)
  
  // Get all weeks in the current month
  const weeksInMonth = eachWeekOfInterval({
    start: startOfCurrentMonth,
    end: endOfCurrentMonth
  })
  
  // Group courses by week
  const coursesByWeek = weeksInMonth.map(weekStart => {
    const weekEnd = endOfWeek(weekStart)
    const coursesInWeek = courses.filter(course => {
      const courseStartDate = parseISO(course.startDate)
      return isWithinInterval(courseStartDate, { start: weekStart, end: weekEnd })
    })
    
    return {
      weekStart,
      weekEnd,
      courses: coursesInWeek
    }
  })
  
  if (isLoading) {
    return (
      <div className="flex justify-center items-center p-8">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    )
  }
  
  return (
    <div className="space-y-6">
      {coursesByWeek.map((week, weekIndex) => (
        <Card key={weekIndex} className="overflow-hidden">
          <CardHeader className="bg-muted/30 py-2">
            <CardTitle className="text-sm">
              Week {weekIndex + 1}: {format(week.weekStart, 'MMM d')} - {format(week.weekEnd, 'MMM d, yyyy')}
            </CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            {week.courses.length > 0 ? (
              <table className="w-full">
                <thead>
                  <tr className="border-b">
                    <th className="px-2 py-1 text-xs text-center">#</th>
                    <th className="px-2 py-1 text-xs text-center">Name</th>
                    <th className="px-2 py-1 text-xs text-center">Start Date/Time</th>
                    <th className="px-2 py-1 text-xs text-center">End Date/Time</th>
                    <th className="px-2 py-1 text-xs text-center">Status</th>
                    <th className="px-2 py-1 text-xs text-center">Enrolled</th>
                    <th className="px-2 py-1 text-xs text-center">Actions</th>
                    <th className="px-2 py-1 text-xs"></th>
                  </tr>
                </thead>
                <tbody>
                  {week.courses.map((course, index) => (
                    <tr 
                      key={course.id || index} 
                      className={`h-10 cursor-pointer hover:bg-muted/50 transition-colors ${index % 2 === 0 ? '' : 'bg-muted/30'}`}
                      onClick={() => router.push(`/active-courses/detail?id=${course.id}`)}
                    >
                      <td className="px-2 py-1 text-xs text-center">{index + 1}</td>
                      <td className="px-2 py-1 text-xs text-center">{course.name}</td>
                      <td className="px-2 py-1 text-xs text-center">{format(parseISO(course.startDate), 'MMM d, yyyy HH:mm')}</td>
                      <td className="px-2 py-1 text-xs text-center">{format(parseISO(course.endDate), 'MMM d, yyyy HH:mm')}</td>
                      <td className="px-2 py-1 text-xs text-center">
                        <Badge 
                          variant={course.status === 'SCHEDULED' ? 'outline' : 
                                 course?.status === 'IN_PROGRESS' ? 'default' : 
                                 course?.status === 'COMPLETED' ? 'success' : 'destructive'}
                          className="text-xs"
                        >
                          {course?.status ? course.status.replace('_', ' ') : 'UNKNOWN'}
                        </Badge>
                      </td>
                      <td className="px-2 py-1 text-xs text-center">
                        <div className="flex items-center justify-center">
                          <Users className="h-3 w-3 mr-1" />
                          {course.enrolledAttendees || 0}
                        </div>
                      </td>
                      <td className="px-2 py-1 text-xs text-center">
                        <div className="flex items-center justify-center space-x-1" onClick={(e) => e.stopPropagation()}>
                          <Button 
                            variant="ghost" 
                            size="icon" 
                            className="h-7 w-7" 
                            onClick={(e) => {
                              e.stopPropagation()
                              // Make sure to clone the course object to avoid reference issues
                              setEditCourseData({...course})
                              setCreateDialogOpen(true)
                            }}
                          >
                            <Edit className="h-3.5 w-3.5" />
                          </Button>
                          <Button 
                            variant="ghost" 
                            size="icon" 
                            className="h-7 w-7" 
                            onClick={(e) => {
                              e.stopPropagation()
                              setSelectedCourseForAttendees(course)
                              setManageAttendeesDialogOpen(true)
                            }}
                          >
                            <Users className="h-3.5 w-3.5" />
                          </Button>
                          <Button 
                            variant="ghost" 
                            size="icon" 
                            className="h-7 w-7" 
                            onClick={(e) => {
                              e.stopPropagation()
                              setCourseToDelete(course)
                              setArchiveDialogOpen(true)
                            }}
                          >
                            <Archive className="h-3.5 w-3.5" />
                          </Button>
                          <Button 
                            variant="ghost" 
                            size="icon" 
                            className="h-7 w-7 text-destructive hover:text-destructive" 
                            onClick={(e) => {
                              e.stopPropagation()
                              setCourseToDelete(course)
                              setIsDeleteDialogOpen(true)
                            }}
                          >
                            <Trash2 className="h-3.5 w-3.5" />
                          </Button>
                        </div>
                      </td>
                      <td className="px-2 py-1 text-xs text-muted-foreground">
                        <ChevronRight className="h-4 w-4" />
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            ) : (
              <div className="p-4 text-center text-muted-foreground text-sm">
                No courses scheduled for this week
              </div>
            )}
          </CardContent>
        </Card>
      ))}
      
      {courses.length === 0 && (
        <div className="text-center p-8">
          <p className="text-muted-foreground mb-2">No courses found</p>
          <Button variant="outline" onClick={() => setCreateDialogOpen(true)}>
            Schedule Your First Course
          </Button>
        </div>
      )}
    </div>
  )
}
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
  
  const [isLoading, setIsLoading] = useState(false)
  const [courses, setCourses] = useState<Course[]>([])
  const [filteredCourses, setFilteredCourses] = useState<Course[]>([])
  const [searchTerm, setSearchTerm] = useState("")
  const [statusFilter, setStatusFilter] = useState<string | undefined>(undefined)
  const [currentPage, setCurrentPage] = useState(1)
  const ITEMS_PER_PAGE = 20
  const [createDialogOpen, setCreateDialogOpen] = useState(false)
  const [editCourseData, setEditCourseData] = useState<Course | null>(null)
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false)
  const [courseToDelete, setCourseToDelete] = useState<Course | null>(null)
  const [manageAttendeesDialogOpen, setManageAttendeesDialogOpen] = useState(false)
  const [selectedCourseForAttendees, setSelectedCourseForAttendees] = useState<Course | null>(null)
  const [viewMode, setViewMode] = useState<'list' | 'weekly'>('list')
  const [archiveDialogOpen, setArchiveDialogOpen] = useState(false)
  const [isArchiving, setIsArchiving] = useState(false)
  const [sendScheduleDialogOpen, setSendScheduleDialogOpen] = useState(false)
  const [error, setError] = useState<string | null>(null)
  
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
    if (searchTerm) {
      const query = searchTerm.toLowerCase()
      filtered = filtered.filter(course => 
        course.name.toLowerCase().includes(query) ||
        course.description.toLowerCase().includes(query)
      )
    }
    
    // Apply status filter
    if (statusFilter && statusFilter !== "ALL") {
      filtered = filtered.filter(course => course.status === statusFilter)
    }
    
    // Sort courses by start date in ascending order
    filtered = filtered.sort((a, b) => {
      const dateA = new Date(a.startDate).getTime()
      const dateB = new Date(b.startDate).getTime()
      return dateA - dateB
    })
    
    setFilteredCourses(filtered)
  }, [courses, searchTerm, statusFilter])
  
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
    setCourseToDelete(course)
    setIsDeleteDialogOpen(true)
  }
  
  // Confirm course deletion
  const confirmDeleteCourse = async () => {
    if (!courseToDelete || !trainingCenterId) return
    
    try {
      await deleteCourse({
        trainingCenterId,
        courseId: courseToDelete.id
      })
      
      toast.success("Course deleted successfully")
      fetchCourses() // Refresh the list
      setIsDeleteDialogOpen(false)
    } catch (error) {
      console.error("Error deleting course:", error)
      toast.error("Failed to delete course. Please try again.")
    }
  }
  
  // Handle course edit
  const handleEditCourse = (course: Course) => {
    setEditCourseData(course)
    setCreateDialogOpen(true)
  }
  
  // Handle manage course attendees
  const handleManageAttendees = (course: Course) => {
    setSelectedCourseForAttendees(course)
    setManageAttendeesDialogOpen(true)
  }
  
  // Handle archive course
  const handleArchiveCourse = (course: Course) => {
    setCourseToDelete(course)
    setArchiveDialogOpen(true)
  }
  
  // Confirm archive course
  const confirmArchiveCourse = async (remark: string) => {
    if (!courseToDelete || !trainingCenterId) return
    
    try {
      setIsArchiving(true)
      await archiveCourse(
        { trainingCenterId, courseId: courseToDelete.id },
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
  
  // Handle adding a new course
  const handleAddNew = () => {
    setEditCourseData(null)
    setCreateDialogOpen(true)
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
            <div className="flex gap-2">
                              <Button variant="outline" onClick={() => router.push("/active-courses/archive")}>
                <Calendar className="mr-2 h-4 w-4" />
                View Archive
              </Button>
              <Button variant="outline" onClick={() => setSendScheduleDialogOpen(true)}>
                <Mail className="mr-2 h-4 w-4" />
                Send Schedule
              </Button>
              <div className="flex items-center space-x-2 mr-4">
                <Button 
                  variant={viewMode === 'list' ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => setViewMode('list')}
                  className="px-3"
                >
                  List View
                </Button>
                <Button 
                  variant={viewMode === 'weekly' ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => setViewMode('weekly')}
                  className="px-3"
                >
                  Weekly View
                </Button>
              </div>
              <Button onClick={handleAddNew}>
                <Plus className="mr-2 h-4 w-4" />
                Create Course
              </Button>
            </div>
          </div>
          
          <div className="flex flex-col sm:flex-row gap-4">
            {/* Search bar */}
            <div className="relative flex-1">
              <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search courses..."
                value={searchTerm}
                onChange={(e) => {
                  setSearchTerm(e.target.value);
                  setCurrentPage(1); // Reset to first page when searching
                }}
                className="pl-8"
              />
            </div>
            
            {/* Status filter */}
            <div className="w-full sm:w-[200px]">
              <Select
                value={statusFilter || "ALL"}
                onValueChange={(value) => {
                  setStatusFilter(value === "ALL" ? undefined : value);
                  setCurrentPage(1); // Reset to first page when filtering
                }}
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
            <CardTitle>Active Courses</CardTitle>
            <CardDescription>
              {filteredCourses.length} course{filteredCourses.length !== 1 ? 's' : ''} found
            </CardDescription>
          </CardHeader>
          <CardContent>
            {viewMode === 'list' ? (
              <CustomTable
                columns={columns}
                data={filteredCourses.slice((currentPage - 1) * ITEMS_PER_PAGE, currentPage * ITEMS_PER_PAGE)}
                isLoading={isLoading}
                rowRender={(row, index) => (
                  <tr 
                    key={row.id || index} 
                    className={`h-10 cursor-pointer hover:bg-muted/50 transition-colors ${index % 2 === 0 ? '' : 'bg-muted/30'}`}
                                            onClick={() => router.push(`/active-courses/detail?id=${row.id}`)}
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
            ) : (
              <CourseActionsContext.Provider value={{
                setCreateDialogOpen,
                setEditCourseData,
                setSelectedCourseForAttendees,
                setManageAttendeesDialogOpen,
                setCourseToDelete,
                setArchiveDialogOpen,
                setIsDeleteDialogOpen
              }}>
                <WeeklyPreview courses={filteredCourses} isLoading={isLoading} />
              </CourseActionsContext.Provider>
            )}
          </CardContent>
          <div className="flex items-center justify-between border-t px-6 py-4">
            <div className="text-sm text-muted-foreground">
              Showing {Math.min(ITEMS_PER_PAGE, filteredCourses.length - (currentPage - 1) * ITEMS_PER_PAGE)} of {filteredCourses.length} courses
            </div>
            <div className="flex items-center space-x-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setCurrentPage((prev) => Math.max(prev - 1, 1))}
                disabled={currentPage <= 1}
              >
                Previous
              </Button>
              <div className="px-3 py-1 font-medium text-sm text-center min-w-[80px] bg-muted rounded-md">
                Page {currentPage} of {Math.ceil(filteredCourses.length / ITEMS_PER_PAGE) || 1}
              </div>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setCurrentPage((prev) => prev + 1)}
                disabled={currentPage * ITEMS_PER_PAGE >= filteredCourses.length}
              >
                Next
              </Button>
            </div>
          </div>
        </Card>
        
        {/* Delete Confirmation Dialog */}
        <DeleteConfirmationDialog
          open={isDeleteDialogOpen}
          onOpenChange={setIsDeleteDialogOpen}
          title="Delete Course"
          description={`Are you sure you want to delete the course "${courseToDelete?.name || ''}"? This action cannot be undone.`}
          onConfirm={confirmDeleteCourse}
        />
        
        {/* Create Course Dialog */}
        <CourseSchedulingDialog
          open={createDialogOpen}
          onOpenChange={setCreateDialogOpen}
          onSuccess={fetchCourses}
          template={null}
          existingCourse={editCourseData as Course | undefined}
        />
        
        {/* Course attendees management dialog */}
        {selectedCourseForAttendees && (
          <CourseAttendeesManagementDialog
            open={manageAttendeesDialogOpen}
            onOpenChange={setManageAttendeesDialogOpen}
            courseId={selectedCourseForAttendees.id}
            courseName={selectedCourseForAttendees.name}
            templateId={selectedCourseForAttendees.templateId}
            refreshData={fetchCourses}
          />
        )}

        {/* Add the Archive Confirmation Dialog */}
        {courseToDelete && (
          <ArchiveConfirmationDialog
            open={archiveDialogOpen}
            onOpenChange={setArchiveDialogOpen}
            onConfirm={confirmArchiveCourse}
            courseName={courseToDelete.name}
            endDate={courseToDelete.endDate}
            isLoading={isArchiving}
          />
        )}
        
        {/* Send Schedule Dialog */}
        <SendScheduleDialog
          open={sendScheduleDialogOpen}
          onOpenChange={setSendScheduleDialogOpen}
        />
      </div>
    </PageLayout>
  )
}
