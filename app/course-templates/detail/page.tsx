"use client"

import React, { useState, useEffect } from "react"
import { useSearchParams } from "next/navigation"
import { PageLayout } from "@/components/page-layout"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { CourseTemplate, ActiveCourse } from "@/types/course-template"
import { getCourseTemplateById, getActiveCoursesForTemplate } from "@/services/courseTemplateService"
import { useAuth } from "@/hooks/useAuth"
import { Loader2, Edit, ArrowLeft, Calendar, CalendarPlus, Users, DollarSign, BookOpen, Trash2, UserPlus, MoreHorizontal, ClipboardList } from "lucide-react"
import { toast } from "sonner"
import { deleteCourse } from "@/services/courseService"
import { getWaitlistRecordsByTemplate, deleteWaitlistRecord } from "@/services/waitlistService"
import { WaitlistRecord } from "@/types/course-template"
import { CourseTemplateDialog } from "@/components/dialogs/course-template-dialog"
import { CourseSchedulingDialog } from "@/components/dialogs/course-scheduling-dialog"
import { CourseEditDialog } from "@/components/dialogs/course-edit-dialog"
import { DeleteConfirmationDialog } from "@/components/dialogs/delete-confirmation-dialog"
import { WaitlistRecordDialog } from "@/components/dialogs/waitlist-record-dialog"
import { WaitlistEditDialog } from "@/components/dialogs/waitlist-edit-dialog"
import { CourseAttendeesManagementDialog } from "@/components/dialogs/course-attendees-management-dialog"
import { useRouter } from "next/navigation"
import { format } from "date-fns"
import { Badge } from "@/components/ui/badge"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"

// Mock data for testing or when API is unavailable
const MOCK_TEMPLATES: Record<string, CourseTemplate> = {
  "1": {
    id: "1",
    name: "Basic Safety Training",
    price: 1200,
    currency: "USD",
    maxSeats: 20,
    description: "Comprehensive safety training course covering all essential aspects of maritime safety.",
    trainingCenterId: "1",
    createdAt: "2025-01-15T10:30:00Z",
    updatedAt: "2025-05-20T14:45:00Z"
  },
  "2": {
    id: "2",
    name: "Advanced Navigation",
    price: 1800,
    currency: "EUR",
    maxSeats: 15,
    description: "Advanced course on modern navigation techniques and equipment.",
    trainingCenterId: "1",
    createdAt: "2025-02-10T09:15:00Z",
    updatedAt: "2025-05-18T11:20:00Z"
  }
}

// Mock active courses for testing
const MOCK_ACTIVE_COURSES: Record<string, ActiveCourse[]> = {
  "1": [
    {
      id: "101",
      templateId: "1",
      name: "Basic Safety Training - June 2025",
      startDate: "2025-06-10T09:00:00Z",
      endDate: "2025-06-14T17:00:00Z",
      status: "SCHEDULED",
      maxSeats: 20,
      availableSeats: 8,
      enrolledAttendees: 12
    },
    {
      id: "102",
      templateId: "1",
      name: "Basic Safety Training - July 2025",
      startDate: "2025-07-15T09:00:00Z",
      endDate: "2025-07-19T17:00:00Z",
      status: "SCHEDULED",
      maxSeats: 20,
      availableSeats: 15,
      enrolledAttendees: 5
    }
  ],
  "2": [
    {
      id: "201",
      templateId: "2",
      name: "Advanced Navigation - August 2025",
      startDate: "2025-08-05T09:00:00Z",
      endDate: "2025-08-12T17:00:00Z",
      status: "SCHEDULED",
      maxSeats: 15,
      availableSeats: 7,
      enrolledAttendees: 8
    }
  ]
}

export default function CourseTemplateDetailPage() {
  const searchParams = useSearchParams()
  const router = useRouter()
  const { user } = useAuth()
  const [template, setTemplate] = useState<CourseTemplate | null>(null)
  const [activeCourses, setActiveCourses] = useState<ActiveCourse[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [activeTab, setActiveTab] = useState("overview")
  const [templateEditDialogOpen, setTemplateEditDialogOpen] = useState(false)
  const [scheduleDialogOpen, setScheduleDialogOpen] = useState(false)
  const [courseEditDialogOpen, setCourseEditDialogOpen] = useState(false)
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false)
  const [selectedCourse, setSelectedCourse] = useState<ActiveCourse | null>(null)
  const [waitlistRecords, setWaitlistRecords] = useState<WaitlistRecord[]>([])
  const [isLoadingWaitlist, setIsLoadingWaitlist] = useState(false)
  const [waitlistRecordDialogOpen, setWaitlistRecordDialogOpen] = useState(false)
  const [waitlistEditDialogOpen, setWaitlistEditDialogOpen] = useState(false)
  const [courseAttendeesDialogOpen, setCourseAttendeesDialogOpen] = useState(false)
  const [selectedCourseForAttendees, setSelectedCourseForAttendees] = useState<ActiveCourse | null>(null)
  const [selectedWaitlistRecord, setSelectedWaitlistRecord] = useState<WaitlistRecord | null>(null)
  
  // Get training center ID from the authenticated user
  const trainingCenterId = user?.userId || ""
  const templateId = searchParams.get("id")

  // Function to fetch template data
  const fetchTemplateData = async () => {
    // Debug: Log the parameters we're using for the API call
    console.log('Fetching template with ID:', templateId, 'for training center:', trainingCenterId)
    
    if (!templateId || !trainingCenterId) {
      setError("Missing template ID or training center ID")
      setIsLoading(false)
      return
    }
    
    try {
      // Fetch course template details
      const data = await getCourseTemplateById({
        trainingCenterId,
        courseTemplateId: templateId
      })
      setTemplate(data)
      
      // Fetch active courses for this template
      const coursesData = await getActiveCoursesForTemplate({
        trainingCenterId,
        courseTemplateId: templateId
      })
      setActiveCourses(coursesData)
    } catch (err) {
      console.error('Error fetching template details:', err)
      setError("Failed to load template details. Please try again.")
      
      // Use mock data for development/testing
      if (process.env.NODE_ENV === 'development') {
        console.log('Using mock data for development')
        setTemplate(MOCK_TEMPLATES[templateId || ""] || null)
        setActiveCourses(MOCK_ACTIVE_COURSES[templateId || ""] || [])
      }
    } finally {
      setIsLoading(false)
    }
  }
  
  useEffect(() => {
    if (!templateId) {
      console.log('DEBUG - Template Detail - Missing template ID')
      router.push('/course-templates')
      return
    }
    
    if (!trainingCenterId) {
      console.log('DEBUG - Template Detail - Missing training center ID')
      setError("You must be logged in to view template details")
      setIsLoading(false)
      return
    }
    
    // Call fetchTemplateData when component mounts or dependencies change
    fetchTemplateData()
  }, [templateId, trainingCenterId, router])

  // Handle successful template edit
  const handleEditSuccess = async () => {
    if (!trainingCenterId || !templateId) return
    
    try {
      setIsLoading(true)
      const data = await getCourseTemplateById({
        trainingCenterId,
        courseTemplateId: templateId
      })
      setTemplate(data)
      toast.success("Course template updated successfully")
    } catch (err) {
      console.error('Error refreshing template details:', err)
    } finally {
      setIsLoading(false)
    }
  }
  
  // Refresh courses after edit or delete
  const refreshCourses = async () => {
    if (templateId) {
      // Fetch active courses for the template
      try {
        const data = await getActiveCoursesForTemplate({
          trainingCenterId,
          courseTemplateId: templateId
        });
        setActiveCourses(data);
      } catch (error) {
        console.error("Error fetching active courses:", error);
        // Fallback to mock data if API fails
        setActiveCourses(MOCK_ACTIVE_COURSES[templateId] || []);
      }
    }
  };
  
  // Refresh active courses after attendee operations
  const refreshActiveCourses = async () => {
    await refreshCourses();
    // Set active tab to "active-courses"
    setActiveTab("active-courses");
  };
  
  // Handle course edit
  const handleEditCourse = (course: ActiveCourse) => {
    setSelectedCourse(course)
    setCourseEditDialogOpen(true)
  }
  
  // Handle course delete
  const handleDeleteCourse = (course: ActiveCourse) => {
    setSelectedCourse(course)
    setDeleteDialogOpen(true)
  }
  
  // Confirm course deletion
  const confirmDeleteCourse = async () => {
    if (!trainingCenterId || !selectedCourse) return
    
    try {
      await deleteCourse({
        trainingCenterId,
        courseId: selectedCourse.id
      })
      
      toast.success("Course deleted successfully")
      refreshCourses()
    } catch (err) {
      console.error('Error deleting course:', err)
      toast.error("Failed to delete course. Please try again.")
      throw err // Re-throw to be caught by the confirmation dialog
    }
  }
  
  // Fetch waitlist records for the current template
  const fetchWaitlistRecords = async () => {
    if (!trainingCenterId || !templateId) return
    
    try {
      setIsLoadingWaitlist(true)
      const records = await getWaitlistRecordsByTemplate({
        trainingCenterId,
        courseTemplateId: templateId
      })
      setWaitlistRecords(records)
    } catch (err) {
      console.error('Error fetching waitlist records:', err)
      toast.error("Failed to load waitlist records. Please try again.")
    } finally {
      setIsLoadingWaitlist(false)
    }
  }
  
  // Handle editing a waitlist record
  const handleEditWaitlistRecord = (record: WaitlistRecord) => {
    setSelectedWaitlistRecord(record)
    setWaitlistEditDialogOpen(true)
  }
  
  // Handle deleting a waitlist record
  const handleDeleteWaitlistRecord = (record: WaitlistRecord) => {
    if (!trainingCenterId) return
    
    if (confirm(`Are you sure you want to delete the waitlist record for ${record.attendeeResponse.name} ${record.attendeeResponse.surname}?`)) {
      deleteWaitlistRecord({
        trainingCenterId,
        waitlistRecordId: record.id
      })
        .then(() => {
          toast.success("Waitlist record deleted successfully")
          fetchWaitlistRecords()
        })
        .catch(err => {
          console.error('Error deleting waitlist record:', err)
          toast.error("Failed to delete waitlist record. Please try again.")
        })
    }
  }
  
  // Handle adding a new waitlist record
  const handleAddWaitlistRecord = () => {
    setWaitlistRecordDialogOpen(true)
  }
  
  // Handle managing course attendees
  const handleManageCourseAttendees = (course: ActiveCourse) => {
    setSelectedCourseForAttendees(course)
    setCourseAttendeesDialogOpen(true)
  }

  // Format currency for display
  const formatCurrency = (price: number, currency: string) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: currency || 'USD',
    }).format(price)
  }
  


  // Format date for display
  const formatDate = (dateString: string) => {
    try {
      return format(new Date(dateString), 'MMM d, yyyy')
    } catch (e) {
      return dateString
    }
  }

  // Get status badge variant for both course status and waitlist status
  const getStatusBadgeVariant = (status?: string) => {
    if (!status) return "secondary"
    
    switch (status.toUpperCase()) {
      case "SCHEDULED":
      case "WAITING":
        return "secondary"
      case "IN_PROGRESS":
        return "default"
      case "COMPLETED":
      case "CONFIRMED":
        return "success"
      case "CANCELLED":
      case "DELETED":
        return "destructive"
      default:
        return "outline"
    }
  }

  if (isLoading) {
    return (
      <PageLayout title="Course Template Details">
        <div className="flex h-[400px] w-full items-center justify-center">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      </PageLayout>
    )
  }

  if (error || !template) {
    return (
      <PageLayout title="Course Template Details">
        <div className="bg-destructive/10 text-destructive p-4 rounded-md">
          {error || "Failed to load course template details"}
        </div>
        <Button 
          variant="outline" 
          className="mt-4"
          onClick={() => router.push('/course-templates')}
        >
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back to Course Templates
        </Button>
      </PageLayout>
    )
  }

  return (
    <PageLayout>
      <div className="container py-6 space-y-6">
        {/* Back button */}
        <Button
          variant="outline"
          className="mb-6"
          onClick={() => router.push('/course-templates')}
        >
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back to Templates
        </Button>

        {/* Template header */}
        <div className="flex flex-col md:flex-row justify-between items-start gap-4">
          <div className="space-y-4">
            <h1 className="text-3xl font-bold tracking-tight">
              {template?.name || "Loading template..."}
            </h1>
            
            <div className="flex flex-wrap gap-4">
              <div className="flex items-center text-muted-foreground">
                <Users className="mr-2 h-4 w-4" />
                {template?.maxSeats || 0} max seats
              </div>
              
              <div className="flex items-center text-muted-foreground">
                <DollarSign className="mr-2 h-4 w-4" />
                {formatCurrency(template?.price || 0, template?.currency || "USD")}
              </div>
            </div>
            
            <p className="text-muted-foreground">
              {template?.description || "No description provided"}
            </p>
          </div>
          
          <div className="flex flex-col sm:flex-row gap-3">
            <Button onClick={() => setScheduleDialogOpen(true)} className="shrink-0">
              <CalendarPlus className="mr-2 h-4 w-4" />
              Schedule New Course
            </Button>
            <Button onClick={() => setTemplateEditDialogOpen(true)} className="shrink-0">
              <Edit className="mr-2 h-4 w-4" />
              Edit Template
            </Button>
          </div>
        </div>

        {/* Tabs */}
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="grid w-full grid-cols-3 lg:w-[600px]">
            <TabsTrigger value="overview">Overview</TabsTrigger>
            <TabsTrigger value="active-courses">Active Courses</TabsTrigger>
            <TabsTrigger value="waitlist" onClick={() => fetchWaitlistRecords()}>Waitlist</TabsTrigger>
          </TabsList>
          
          {/* Overview Tab */}
          <TabsContent value="overview" className="space-y-4 mt-6">
            <Card>
              <CardHeader>
                <CardTitle>Template Information</CardTitle>
                <CardDescription>Details about this course template</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="bg-primary/5 p-4 rounded-lg flex items-center gap-3">
                    <DollarSign className="h-5 w-5 text-primary" />
                    <div>
                      <h3 className="text-sm font-medium text-muted-foreground">Price</h3>
                      <p className="text-xl font-bold">{formatCurrency(template.price, template.currency)}</p>
                    </div>
                  </div>
                  <div className="bg-primary/5 p-4 rounded-lg flex items-center gap-3">
                    <Users className="h-5 w-5 text-primary" />
                    <div>
                      <h3 className="text-sm font-medium text-muted-foreground">Max Seats</h3>
                      <p className="text-xl font-bold">{template.maxSeats}</p>
                    </div>
                  </div>
                  <div className="bg-primary/5 p-4 rounded-lg flex items-center gap-3">
                    <BookOpen className="h-5 w-5 text-primary" />
                    <div>
                      <h3 className="text-sm font-medium text-muted-foreground">Active Courses</h3>
                      <p className="text-xl font-bold">{activeCourses.length}</p>
                    </div>
                  </div>
                </div>
                
                {template.description && (
                  <div>
                    <h3 className="text-sm font-medium text-muted-foreground mb-2">Description</h3>
                    <div className="bg-muted/50 p-4 rounded-md">
                      <p className="whitespace-pre-line">{template.description}</p>
                    </div>
                  </div>
                )}
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {template.createdAt && (
                    <div>
                      <h3 className="text-sm font-medium text-muted-foreground">Created</h3>
                      <p>{formatDate(template.createdAt)}</p>
                    </div>
                  )}
                  {template.updatedAt && (
                    <div>
                      <h3 className="text-sm font-medium text-muted-foreground">Last Updated</h3>
                      <p>{formatDate(template.updatedAt)}</p>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          </TabsContent>
          
          {/* Active Courses Tab */}
          <TabsContent value="active-courses" className="mt-6">
            <Card>
              <CardHeader>
                <CardTitle>Active Courses</CardTitle>
                <CardDescription>Courses based on this template</CardDescription>
              </CardHeader>
              <CardContent>
                {activeCourses.length > 0 ? (
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Name</TableHead>
                        <TableHead>Start Date</TableHead>
                        <TableHead>End Date</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead>Enrolled</TableHead>
                        <TableHead className="text-right">Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {activeCourses.map((course) => (
                        <TableRow key={course.id}>
                          <TableCell className="font-medium">{course.name}</TableCell>
                          <TableCell>{formatDate(course.startDate)}</TableCell>
                          <TableCell>{formatDate(course.endDate)}</TableCell>
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
                                onClick={() => handleEditCourse(course)}
                                title="Edit Course"
                              >
                                <Edit className="h-4 w-4" />
                              </Button>
                              <Button
                                variant="ghost"
                                size="icon"
                                onClick={() => handleManageCourseAttendees(course)}
                                title="Manage Course Attendees"
                              >
                                <UserPlus className="h-4 w-4" />
                              </Button>
                              <Button
                                variant="ghost"
                                size="icon"
                                onClick={() => handleDeleteCourse(course)}
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
                ) : (
                  <div className="flex flex-col items-center justify-center py-8 text-center">
                    <div className="rounded-full bg-muted p-3">
                      <Calendar className="h-6 w-6 text-muted-foreground" />
                    </div>
                    <h3 className="mt-4 text-lg font-medium">No Active Courses</h3>
                    <p className="mt-2 text-sm text-muted-foreground max-w-sm">
                      There are no active courses based on this template yet. Create a new course to start enrolling attendees.
                    </p>
                  </div>
                )}
              </CardContent>
              <CardFooter>
                <Button 
                  className="w-full sm:w-auto" 
                  onClick={() => setScheduleDialogOpen(true)}
                >
                  <Calendar className="mr-2 h-4 w-4" />
                  Schedule New Course
                </Button>
              </CardFooter>
            </Card>
          </TabsContent>
          
          {/* Waitlist Tab */}
          <TabsContent value="waitlist">
            <Card>
              <CardHeader>
                <CardTitle className="text-xl">Waitlist Records</CardTitle>
                <CardDescription>
                  Manage waitlist records for this course template
                </CardDescription>
              </CardHeader>
              <CardContent>
                {isLoadingWaitlist ? (
                  <div className="flex justify-center items-center py-8">
                    <Loader2 className="h-8 w-8 animate-spin text-primary" />
                  </div>
                ) : waitlistRecords.length === 0 ? (
                  <div className="flex flex-col items-center justify-center py-8 text-center">
                    <div className="rounded-full bg-muted p-3">
                      <ClipboardList className="h-6 w-6 text-muted-foreground" />
                    </div>
                    <h3 className="mt-4 text-lg font-medium">No Waitlist Records</h3>
                    <p className="mt-2 text-sm text-muted-foreground max-w-sm">
                      There are no waitlist records for this course template yet.
                    </p>
                  </div>
                ) : (
                  <div className="rounded-md border">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Name</TableHead>
                          <TableHead>Email</TableHead>
                          <TableHead>Rank</TableHead>
                          <TableHead>Status</TableHead>
                          <TableHead className="text-right">Actions</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {waitlistRecords.map((record) => (
                          <TableRow key={record.id}>
                            <TableCell>
                              {record.attendeeResponse.name} {record.attendeeResponse.surname}
                            </TableCell>
                            <TableCell>{record.attendeeResponse.email}</TableCell>
                            <TableCell>
                              {record.attendeeResponse.rank.replace(/_/g, " ")}
                            </TableCell>
                            <TableCell>
                              <Badge variant={getStatusBadgeVariant(record.status)}>
                                {record.status}
                              </Badge>
                            </TableCell>
                            <TableCell className="text-right">
                              <div className="flex items-center justify-end gap-2">
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  onClick={() => handleEditWaitlistRecord(record)}
                                  title="Edit Waitlist Record"
                                >
                                  <Edit className="h-4 w-4" />
                                </Button>
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  onClick={() => handleDeleteWaitlistRecord(record)}
                                  title="Delete Waitlist Record"
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
              <CardFooter>
                <Button 
                  className="w-full sm:w-auto" 
                  onClick={() => handleAddWaitlistRecord()}
                >
                  <UserPlus className="mr-2 h-4 w-4" />
                  Add to Waitlist
                </Button>
              </CardFooter>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
      
      {/* Edit Course Template Dialog */}
      <CourseTemplateDialog
        open={templateEditDialogOpen}
        onOpenChange={setTemplateEditDialogOpen}
        template={template}
        onSuccess={handleEditSuccess}
        mode="edit"
      />
      
      {/* Course Scheduling Dialog */}
      {template && (
        <CourseSchedulingDialog
          open={scheduleDialogOpen}
          onOpenChange={setScheduleDialogOpen}
          template={template}
          onSuccess={fetchTemplateData}
        />
      )}
      
      {/* Course Edit Dialog */}
      {selectedCourse && (
        <CourseEditDialog
          open={courseEditDialogOpen}
          onOpenChange={setCourseEditDialogOpen}
          course={selectedCourse}
          onSuccess={refreshCourses}
        />
      )}
      
      {/* Delete Confirmation Dialog */}
      <DeleteConfirmationDialog
        open={deleteDialogOpen}
        onOpenChange={setDeleteDialogOpen}
        title="Delete Course"
        description={`Are you sure you want to delete the course "${selectedCourse?.name || ''}"? This action cannot be undone.`}
        onConfirm={confirmDeleteCourse}
      />
      
      {/* Waitlist Record Dialog */}
      {templateId && (
        <WaitlistRecordDialog
          open={waitlistRecordDialogOpen}
          onOpenChange={setWaitlistRecordDialogOpen}
          mode="create"
          courseTemplateId={templateId}
          onSuccess={fetchWaitlistRecords}
        />
      )}
      
      {/* Waitlist Edit Dialog */}
      <WaitlistEditDialog
        open={waitlistEditDialogOpen}
        onOpenChange={setWaitlistEditDialogOpen}
        waitlistRecord={selectedWaitlistRecord}
        onSuccess={fetchWaitlistRecords}
      />
      
      {/* Course Attendees Management Dialog */}
      {selectedCourseForAttendees && (
        <CourseAttendeesManagementDialog
          open={courseAttendeesDialogOpen}
          onOpenChange={setCourseAttendeesDialogOpen}
          courseId={selectedCourseForAttendees.id}
          courseName={selectedCourseForAttendees.name}
          refreshData={refreshActiveCourses}
        />
      )}
    </PageLayout>
  )
}
