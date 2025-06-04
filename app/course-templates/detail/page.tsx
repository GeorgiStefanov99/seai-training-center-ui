"use client"

import React, { Fragment, useState, useEffect, Suspense } from "react"
import { useSearchParams } from "next/navigation"
import { PageLayout } from "@/components/page-layout"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { CourseTemplate, ActiveCourse } from "@/types/course-template"
import { getCourseTemplateById, getActiveCoursesForTemplate } from "@/services/courseTemplateService"
import { createRemark, updateRemark, deleteRemark, getAttendeeRemarks } from "@/services/remarkService"
import { useAuth } from "@/hooks/useAuth"
import { Loader2, Edit, ArrowLeft, Calendar, CalendarPlus, Users, DollarSign, BookOpen, Trash2, UserPlus, MoreHorizontal, ClipboardList, MessageSquare } from "lucide-react"
import { toast } from "sonner"
import { deleteCourse } from "@/services/courseService"
import { getWaitlistRecordsByTemplate, deleteWaitlistRecord } from "@/services/waitlistService"
import { WaitlistRecord } from "@/types/course-template"
import { Remark } from "@/types/remark"
import { CourseTemplateDialog } from "@/components/dialogs/course-template-dialog"
import { CourseSchedulingDialog } from "@/components/dialogs/course-scheduling-dialog"
import { CourseEditDialog } from "@/components/dialogs/course-edit-dialog"
import { DeleteConfirmationDialog } from "@/components/dialogs/delete-confirmation-dialog"
import { WaitlistEditDialog } from "@/components/dialogs/waitlist-edit-dialog"
import { WaitlistAddDialog } from "@/components/dialogs/waitlist-add-dialog"
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
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"

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

function CourseTemplateDetailContent() {
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
  const [deleteWaitlistDialogOpen, setDeleteWaitlistDialogOpen] = useState(false)
  
  // Waitlist record remarks state
  const [waitlistRemarks, setWaitlistRemarks] = useState<Record<string, Remark[]>>({})
  const [isLoadingRemarks, setIsLoadingRemarks] = useState(false)
  const [createRemarkDialogOpen, setCreateRemarkDialogOpen] = useState(false)
  const [editRemarkDialogOpen, setEditRemarkDialogOpen] = useState(false)
  const [deleteRemarkDialogOpen, setDeleteRemarkDialogOpen] = useState(false)
  const [selectedRemark, setSelectedRemark] = useState<Remark | null>(null)
  const [selectedAttendeeForRemark, setSelectedAttendeeForRemark] = useState<{ id: string; name: string } | null>(null)
  const [expandedRemarkAttendeeId, setExpandedRemarkAttendeeId] = useState<string | null>(null)
  
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
      // Clear existing records before fetching to avoid stale data
      setWaitlistRecords([])
      setIsLoadingWaitlist(true)
      
      // Add timestamp to prevent caching issues
      const timestamp = new Date().getTime()
      console.log(`Fetching waitlist records at ${timestamp} for template ${templateId}`)
      
      // Add timestamp to URL to prevent caching
      const data = await getWaitlistRecordsByTemplate({
        trainingCenterId,
        courseTemplateId: `${templateId}?_t=${timestamp}`
      })
      
      console.log(`Received ${data.length} waitlist records:`, data)
      setWaitlistRecords(data)
      
      // After fetching waitlist records, fetch remarks for each attendee
      if (data.length > 0) {
        await fetchAllWaitlistRemarks(data)
      }
    } catch (error) {
      console.error("Error fetching waitlist records:", error)
      toast.error("Failed to load waitlist records")
      setWaitlistRecords([])
    } finally {
      setIsLoadingWaitlist(false)
    }
  }
  
  // Function to fetch remarks for a specific attendee
  const fetchAttendeeRemarks = async (attendeeId: string) => {
    if (!trainingCenterId || !attendeeId) return []
    
    try {
      return await getAttendeeRemarks({ trainingCenterId, attendeeId })
    } catch (error) {
      console.error(`Error fetching remarks for attendee ${attendeeId}:`, error)
      return []
    }
  }
  
  // Function to fetch all remarks for all waitlist record attendees
  const fetchAllWaitlistRemarks = async (waitlistRecordsList: WaitlistRecord[]) => {
    if (!trainingCenterId || waitlistRecordsList.length === 0) return
    
    setIsLoadingRemarks(true)
    const remarksMap: Record<string, Remark[]> = {}
    
    try {
      // Create an array of promises for fetching remarks for each attendee
      const remarkPromises = waitlistRecordsList.map(async (record) => {
        if (record.attendeeResponse.id) {
          const remarks = await fetchAttendeeRemarks(record.attendeeResponse.id)
          remarksMap[record.attendeeResponse.id] = remarks
        }
      })
      
      // Wait for all promises to resolve
      await Promise.all(remarkPromises)
      setWaitlistRemarks(remarksMap)
    } catch (error) {
      console.error('Error fetching all waitlist remarks:', error)
    } finally {
      setIsLoadingRemarks(false)
    }
  }
  
  // Handle editing a waitlist record
  const handleEditWaitlistRecord = (record: WaitlistRecord) => {
    setSelectedWaitlistRecord(record)
    // Use setTimeout to ensure state is updated before opening dialog
    setTimeout(() => {
      setWaitlistEditDialogOpen(true)
    }, 10)
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
  
  // Function to open the course attendees management dialog
  const handleManageAttendees = (course: ActiveCourse) => {
    if (course) {
      setSelectedCourseForAttendees(course)
      setCourseAttendeesDialogOpen(true)
    }
  }
  
  // Handle opening the create remark dialog or toggling remarks visibility
  const handleCreateRemark = (record: WaitlistRecord) => {
    const attendeeId = record.attendeeResponse.id;
    
    // Toggle remarks visibility
    if (expandedRemarkAttendeeId === attendeeId) {
      setExpandedRemarkAttendeeId(null); // Hide remarks if already expanded
    } else {
      setExpandedRemarkAttendeeId(attendeeId); // Show remarks for this attendee
    }
    
    // Set selected attendee for potential remark creation
    setSelectedAttendeeForRemark({
      id: attendeeId,
      name: `${record.attendeeResponse.name} ${record.attendeeResponse.surname}`
    })
  }
  
  // Handle submitting a new remark
  const handleRemarkSubmit = async (remarkText: string) => {
    if (!trainingCenterId || !selectedAttendeeForRemark) return
    
    try {
      await createRemark(
        { trainingCenterId, attendeeId: selectedAttendeeForRemark.id },
        { remarkText }
      )
      
      // Refresh remarks for this attendee
      const updatedRemarks = await fetchAttendeeRemarks(selectedAttendeeForRemark.id)
      setWaitlistRemarks(prev => ({
        ...prev,
        [selectedAttendeeForRemark.id]: updatedRemarks
      }))
      
      toast.success("Remark added successfully")
      setCreateRemarkDialogOpen(false)
    } catch (error) {
      console.error('Error creating remark:', error)
      toast.error("Failed to add remark")
    }
  }
  
  // Handle opening the edit remark dialog
  const handleEditRemark = (remark: Remark, attendeeId: string, attendeeName: string) => {
    setSelectedRemark(remark)
    setSelectedAttendeeForRemark({ id: attendeeId, name: attendeeName })
    setEditRemarkDialogOpen(true)
  }
  
  // Handle updating a remark
  const handleRemarkUpdate = async (remarkText: string) => {
    if (!trainingCenterId || !selectedAttendeeForRemark || !selectedRemark) return
    
    try {
      await updateRemark(
        { 
          trainingCenterId, 
          attendeeId: selectedAttendeeForRemark.id,
          remarkId: selectedRemark.id 
        },
        { remarkText }
      )
      
      // Refresh remarks for this attendee
      const updatedRemarks = await fetchAttendeeRemarks(selectedAttendeeForRemark.id)
      setWaitlistRemarks(prev => ({
        ...prev,
        [selectedAttendeeForRemark.id]: updatedRemarks
      }))
      
      toast.success("Remark updated successfully")
      setEditRemarkDialogOpen(false)
    } catch (error) {
      console.error('Error updating remark:', error)
      toast.error("Failed to update remark")
    }
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
      const date = new Date(dateString);
      return format(date, "dd/MM/yyyy");
    } catch (e) {
      return dateString
    }
  }
  
  // Format time for display from date string
  const formatTime = (dateString: string) => {
    try {
      const date = new Date(dateString);
      return format(date, "HH:mm");
    } catch (e) {
      return ""
    }
  }
  
  // Format time string for display
  const formatLocalTime = (time?: string) => {
    if (!time) return "";
    try {
      // If it's a string in HH:mm:ss format, extract just HH:mm
      if (typeof time === 'string') {
        // Split by colon and take the first two parts (hours and minutes)
        const parts = time.split(':');
        if (parts.length >= 2) {
          return `${parts[0]}:${parts[1]}`;
        }
        return time;
      }
      return "";
    } catch (e) {
      return "";
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
                        <TableHead>Start Time</TableHead>
                        <TableHead>End Date</TableHead>
                        <TableHead>End Time</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead>Enrolled</TableHead>
                        <TableHead className="text-right">Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {activeCourses.map((course) => (
                        <TableRow 
                          key={course.id} 
                          className="cursor-pointer hover:bg-muted/50"
                          onClick={() => router.push(`/courses/detail?id=${course.id}`)}
                        >
                          <TableCell className="font-medium">{course.name}</TableCell>
                          <TableCell>{formatDate(course.startDate)}</TableCell>
                          <TableCell>{formatLocalTime(course.startTime)}</TableCell>
                          <TableCell>{formatDate(course.endDate)}</TableCell>
                          <TableCell>{formatLocalTime(course.endTime)}</TableCell>
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
                                title="Manage Course Attendees"
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
                          <TableHead>Telephone</TableHead>
                          <TableHead>Rank</TableHead>
                          <TableHead>Status</TableHead>
                          <TableHead className="text-right">Actions</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {waitlistRecords.map((record) => {
                          // Get remarks for this attendee
                          const attendeeId = record.attendeeResponse.id;
                          const attendeeName = `${record.attendeeResponse.name} ${record.attendeeResponse.surname}`;
                          const remarks = attendeeId ? waitlistRemarks[attendeeId] || [] : [];
                          const hasRemarks = remarks.length > 0;
                          
                          return (
                            <React.Fragment key={record.id}>
                              <TableRow>
                                <TableCell>
                                  {attendeeName}
                                </TableCell>
                                <TableCell>{record.attendeeResponse.email}</TableCell>
                                <TableCell>{record.attendeeResponse.telephone || "N/A"}</TableCell>
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
                                      onClick={() => handleCreateRemark(record)}
                                      title={hasRemarks ? "View/Add Remarks" : "Add Remark"}
                                    >
                                      <div className="relative">
                                        <MessageSquare className="h-4 w-4" />
                                        {hasRemarks && (
                                          <Badge 
                                            variant="secondary" 
                                            className="absolute -top-2 -right-2 h-4 w-4 p-0 flex items-center justify-center text-[10px]"
                                          >
                                            {remarks.length}
                                          </Badge>
                                        )}
                                      </div>
                                    </Button>
                                    <DropdownMenu>
                                      <DropdownMenuTrigger asChild>
                                        <Button variant="ghost" size="icon">
                                          <MoreHorizontal className="h-4 w-4" />
                                        </Button>
                                      </DropdownMenuTrigger>
                                      <DropdownMenuContent align="end">
                                        <DropdownMenuLabel>Actions</DropdownMenuLabel>
                                        <DropdownMenuSeparator />
                                        <DropdownMenuItem onClick={() => handleEditWaitlistRecord(record)}>
                                          <Edit className="h-4 w-4 mr-2" />
                                          Edit Record
                                        </DropdownMenuItem>
                                        <DropdownMenuItem 
                                          onClick={() => handleDeleteWaitlistRecord(record)}
                                          className="text-destructive"
                                        >
                                          <Trash2 className="h-4 w-4 mr-2" />
                                          Delete Record
                                        </DropdownMenuItem>
                                      </DropdownMenuContent>
                                    </DropdownMenu>
                                  </div>
                                </TableCell>
                              </TableRow>
                              
                              {/* Remarks section - only shown when expanded */}
                              {expandedRemarkAttendeeId === attendeeId && (
                                <TableRow className="bg-muted/50">
                                  <TableCell colSpan={5} className="p-2">
                                    <div className="rounded-md border bg-background p-3">
                                      <div className="flex justify-between items-center mb-3">
                                        <h4 className="text-sm font-medium">Remarks</h4>
                                        <Button 
                                          size="sm" 
                                          variant="outline" 
                                          onClick={() => {
                                            setCreateRemarkDialogOpen(true)
                                          }}
                                        >
                                          <MessageSquare className="h-3 w-3 mr-1" />
                                          Add Remark
                                        </Button>
                                      </div>
                                      
                                      {hasRemarks ? (
                                        <div className="space-y-2">
                                          {remarks.map((remark) => (
                                            <div key={remark.id} className="flex items-start justify-between gap-2 border-b pb-2">
                                              <div className="flex-1">
                                                <p className="text-sm whitespace-pre-wrap">{remark.remarkText}</p>
                                                <div className="flex gap-4 text-xs text-muted-foreground mt-1">
                                                  <p>Created: {new Date(remark.createdAt).toLocaleString()}</p>
                                                  <p>Updated: {new Date(remark.lastUpdatedAt).toLocaleString()}</p>
                                                </div>
                                              </div>
                                              <div className="flex gap-1">
                                                <Button
                                                  variant="ghost"
                                                  size="icon"
                                                  className="h-6 w-6"
                                                  onClick={() => handleEditRemark(remark, attendeeId, attendeeName)}
                                                >
                                                  <Edit className="h-3 w-3" />
                                                </Button>
                                              </div>
                                            </div>
                                          ))}
                                        </div>
                                      ) : (
                                        <p className="text-sm text-muted-foreground">No remarks yet. Click 'Add Remark' to create one.</p>
                                      )}
                                    </div>
                                  </TableCell>
                                </TableRow>
                              )}
                            </React.Fragment>
                          );
                        })}
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
      {template && (
        <CourseTemplateDialog
          open={templateEditDialogOpen}
          onOpenChange={setTemplateEditDialogOpen}
          template={template}
          onSuccess={handleEditSuccess}
          mode="edit"
        />
      )}
      
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
      
      {/* Waitlist Add Dialog */}
      {templateId && (
        <WaitlistAddDialog
          open={waitlistRecordDialogOpen}
          onOpenChange={setWaitlistRecordDialogOpen}
          courseTemplateId={templateId}
          onSuccess={() => {
            fetchWaitlistRecords()
            toast.success("Waitlist record created successfully")
          }}
        />
      )}
      
      {/* Waitlist Edit Dialog */}
      {selectedWaitlistRecord && (
        <WaitlistEditDialog
          open={waitlistEditDialogOpen}
          onOpenChange={(open) => {
            setWaitlistEditDialogOpen(open);
            // If dialog is closing, clear the selected record after a short delay
            if (!open) {
              setTimeout(() => {
                setSelectedWaitlistRecord(null);
              }, 100);
            }
          }}
          waitlistRecord={selectedWaitlistRecord}
          onSuccess={() => {
            // Fetch waitlist records and then reset dialog state
            fetchWaitlistRecords();
          }}
        />
      )}
      
      {/* Course Attendees Management Dialog */}
      {selectedCourseForAttendees && (
        <CourseAttendeesManagementDialog
          open={courseAttendeesDialogOpen}
          onOpenChange={setCourseAttendeesDialogOpen}
          courseId={selectedCourseForAttendees.id}
          courseName={selectedCourseForAttendees.name}
          templateId={templateId || undefined}
          refreshData={refreshActiveCourses}
        />
      )}
      
      {/* Create Remark Dialog */}
      <Dialog open={createRemarkDialogOpen} onOpenChange={setCreateRemarkDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Add Remark</DialogTitle>
            <DialogDescription>
              {selectedAttendeeForRemark ? `Add a new remark for ${selectedAttendeeForRemark.name}` : 'Add a new remark'}
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={(e) => {
            e.preventDefault()
            const form = e.target as HTMLFormElement
            const formData = new FormData(form)
            const remarkText = formData.get('remarkText') as string
            if (remarkText) {
              handleRemarkSubmit(remarkText)
            }
          }}>
            <div className="space-y-4 py-2">
              <div className="space-y-2">
                <Label htmlFor="remarkText">Remark</Label>
                <Textarea
                  id="remarkText"
                  name="remarkText"
                  placeholder="Enter your remark here..."
                  className="min-h-[100px]"
                  required
                />
              </div>
            </div>
            <DialogFooter className="mt-4">
              <Button type="button" variant="outline" onClick={() => setCreateRemarkDialogOpen(false)}>Cancel</Button>
              <Button type="submit">Save Remark</Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
      
      {/* Edit Remark Dialog */}
      <Dialog open={editRemarkDialogOpen} onOpenChange={setEditRemarkDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit Remark</DialogTitle>
            <DialogDescription>
              {selectedAttendeeForRemark ? `Edit remark for ${selectedAttendeeForRemark.name}` : 'Edit remark'}
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={(e) => {
            e.preventDefault()
            const form = e.target as HTMLFormElement
            const formData = new FormData(form)
            const remarkText = formData.get('remarkText') as string
            if (remarkText) {
              handleRemarkUpdate(remarkText)
            }
          }}>
            <div className="space-y-4 py-2">
              <div className="space-y-2">
                <Label htmlFor="remarkText">Remark</Label>
                <Textarea
                  id="remarkText"
                  name="remarkText"
                  placeholder="Enter your remark here..."
                  className="min-h-[100px]"
                  required
                  defaultValue={selectedRemark?.remarkText || ''}
                />
              </div>
            </div>
            <DialogFooter className="mt-4">
              <Button type="button" variant="outline" onClick={() => setEditRemarkDialogOpen(false)}>Cancel</Button>
              <Button type="submit">Update Remark</Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
      
      {/* Note: Delete Remark Dialog removed as per requirements */}
    </PageLayout>
  )
}

export default function CourseTemplateDetailPage() {
  return (
    <Suspense fallback={<div className="flex items-center justify-center h-screen">Loading...</div>}>
      <CourseTemplateDetailContent />
    </Suspense>
  )
}
