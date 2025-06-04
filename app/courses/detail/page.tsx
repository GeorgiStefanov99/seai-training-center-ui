"use client"

import React, { useState, useEffect } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import { PageLayout } from "@/components/page-layout"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { 
  Edit, 
  Trash2, 
  UserPlus, 
  Loader2,
  Calendar,
  Clock,
  DollarSign,
  Users,
  ArrowLeft,
  UserMinus,
  ClipboardList,
  MessageSquare
} from "lucide-react"
import { useAuth } from "@/hooks/useAuth"
import { getCourseById, deleteCourse } from "@/services/courseService"
import { getCourseAttendees, removeAttendeeFromCourse } from "@/services/courseAttendeeService"
import { createWaitlistRecordForAttendee } from "@/services/waitlistService"
import { Course } from "@/types/course"
import { Attendee, AttendeeRank } from "@/types/attendee"
import { toast } from "sonner"
import { DeleteConfirmationDialog } from "@/components/dialogs/delete-confirmation-dialog"
import { Badge } from "@/components/ui/badge"
import { format, parse } from "date-fns"
import { CourseSchedulingDialog } from "@/components/dialogs/course-scheduling-dialog"
import { CourseAttendeesManagementDialog } from "@/components/dialogs/course-attendees-management-dialog"
import { CourseAttendeeDialog } from "@/components/dialogs/course-attendee-dialog"
import { 
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"

export default function CourseDetailPage() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const courseId = searchParams.get("id")
  const { user } = useAuth()
  
  const [course, setCourse] = useState<Course | null>(null)
  const [attendees, setAttendees] = useState<Attendee[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [isLoadingAttendees, setIsLoadingAttendees] = useState(false)
  const [activeTab, setActiveTab] = useState("overview")
  const [error, setError] = useState<string | null>(null)
  
  // Dialog states
  const [editDialogOpen, setEditDialogOpen] = useState(false)
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false)
  const [attendeesDialogOpen, setAttendeesDialogOpen] = useState(false)
  const [attendeeAssignDialogOpen, setAttendeeAssignDialogOpen] = useState(false)
  const [remarksDialogOpen, setRemarksDialogOpen] = useState(false)
  const [removeAttendeeDialogOpen, setRemoveAttendeeDialogOpen] = useState(false)
  const [returnToWaitlistDialogOpen, setReturnToWaitlistDialogOpen] = useState(false)
  const [selectedAttendee, setSelectedAttendee] = useState<Attendee | null>(null)
  const [processingAttendeeId, setProcessingAttendeeId] = useState<string | null>(null)
  
  // Get training center ID from the authenticated user
  const trainingCenterId = user?.userId || ""
  
  // Format rank for display
  const formatRank = (rank: string) => {
    // Convert underscores to spaces and capitalize each word
    if (!rank) return "";
    return rank
      .split("_")
      .map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
      .join(" ");
  };

  // Fetch course details
  const fetchCourseDetails = async () => {
    if (!trainingCenterId || !courseId) {
      setError("Required information is missing")
      setIsLoading(false)
      return
    }
    
    try {
      setIsLoading(true)
      const courseData = await getCourseById({ trainingCenterId, courseId })
      setCourse(courseData)
      setError(null)
    } catch (error) {
      console.error("Error fetching course details:", error)
      setError("Failed to fetch course details. Please try again.")
    } finally {
      setIsLoading(false)
    }
  }
  
  // Fetch course attendees
  const fetchAttendees = async () => {
    if (!trainingCenterId || !courseId) return
    
    try {
      setIsLoadingAttendees(true)
      const attendeeData = await getCourseAttendees({ trainingCenterId, courseId })
      setAttendees(attendeeData)
    } catch (error) {
      console.error("Error fetching course attendees:", error)
      toast.error("Failed to load attendees. Please try again.")
    } finally {
      setIsLoadingAttendees(false)
    }
  }
  
  // Initial data fetch
  useEffect(() => {
    if (courseId) {
      fetchCourseDetails()
      fetchAttendees()
    }
  }, [trainingCenterId, courseId])
  
  // Format date for display
  const formatDate = (dateString: string) => {
    try {
      return format(new Date(dateString), "MMM d, yyyy")
    } catch (error) {
      return dateString
    }
  }
  
  // Format time for display
  const formatTime = (timeString: string) => {
    try {
      const parsedTime = parse(timeString, "HH:mm:ss", new Date())
      return format(parsedTime, "h:mm a")
    } catch (error) {
      return timeString
    }
  }
  
  // Get badge variant based on status
  const getStatusBadgeVariant = (status: string | undefined) => {
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
        return "secondary"
    }
  }
  
  // Handle edit course
  const handleEditCourse = () => {
    setEditDialogOpen(true)
  }
  
  // Handle delete course
  const handleDeleteCourse = () => {
    setDeleteDialogOpen(true)
  }
  
  // Confirm delete course
  const confirmDeleteCourse = async () => {
    if (!trainingCenterId || !course?.id) return
    
    try {
      await deleteCourse({ trainingCenterId, courseId: course.id })
      toast.success("Course deleted successfully")
      router.push("/courses")
    } catch (error) {
      console.error("Error deleting course:", error)
      toast.error("Failed to delete course. Please try again.")
    } finally {
      setDeleteDialogOpen(false)
    }
  }
  
  // Handle manage course attendees
  const handleManageAttendees = () => {
    setAttendeeAssignDialogOpen(true)
  }
  
  // Prompt for removing an attendee from the course
  const promptRemoveAttendee = (attendee: Attendee) => {
    setSelectedAttendee(attendee)
    setRemoveAttendeeDialogOpen(true)
  }
  
  // Handle removing an attendee from the course after confirmation
  const handleRemoveAttendee = async () => {
    if (!trainingCenterId || !courseId || !selectedAttendee?.id) {
      setRemoveAttendeeDialogOpen(false)
      return
    }
    
    try {
      setProcessingAttendeeId(selectedAttendee.id)
      await removeAttendeeFromCourse({ trainingCenterId, courseId, attendeeId: selectedAttendee.id })
      toast.success("Attendee removed from course successfully")
      fetchAttendees() // Refresh the attendees list
    } catch (error) {
      console.error("Error removing attendee from course:", error)
      toast.error("Failed to remove attendee from course. Please try again.")
    } finally {
      setProcessingAttendeeId(null)
      setRemoveAttendeeDialogOpen(false)
      setSelectedAttendee(null)
    }
  }
  
  // Prompt for returning an attendee to the waitlist
  const promptReturnToWaitlist = (attendee: Attendee) => {
    setSelectedAttendee(attendee)
    setReturnToWaitlistDialogOpen(true)
  }
  
  // Handle returning an attendee to the waitlist after confirmation
  const handleReturnToWaitlist = async () => {
    if (!trainingCenterId || !courseId || !course?.templateId || !selectedAttendee?.id) {
      setReturnToWaitlistDialogOpen(false)
      return
    }
    
    try {
      setProcessingAttendeeId(selectedAttendee.id)
      
      // First create a waitlist record for the attendee
      await createWaitlistRecordForAttendee({
        trainingCenterId,
        attendeeId: selectedAttendee.id,
        courseTemplateId: course.templateId
      }, { status: "WAITING" }) // Default status is WAITING
      
      // Then remove the attendee from the course
      await removeAttendeeFromCourse({ trainingCenterId, courseId, attendeeId: selectedAttendee.id })
      
      toast.success("Attendee returned to waitlist successfully")
      fetchAttendees() // Refresh the attendees list
    } catch (error) {
      console.error("Error returning attendee to waitlist:", error)
      toast.error("Failed to return attendee to waitlist. Please try again.")
    } finally {
      setProcessingAttendeeId(null)
      setReturnToWaitlistDialogOpen(false)
      setSelectedAttendee(null)
    }
  }
  
  // Handle adding remarks for an attendee
  const handleAddRemarks = (attendee: Attendee) => {
    setSelectedAttendee(attendee)
    setRemarksDialogOpen(true)
  }
  
  // Go back to courses page
  const handleGoBack = () => {
    router.push("/courses")
  }
  
  return (
    <PageLayout>
      <div className="flex flex-col gap-6">
        {/* Header with back button */}
        <div className="flex items-center">
          <Button variant="outline" onClick={handleGoBack} className="gap-1">
            <ArrowLeft className="h-4 w-4" />
            Back to Courses
          </Button>
        </div>
        
        {error && (
          <div className="bg-destructive/10 text-destructive p-4 rounded-md">
            {error}
          </div>
        )}
        
        {isLoading ? (
          <div className="flex justify-center items-center py-16">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
          </div>
        ) : !courseId ? (
          <div className="text-center py-16">
            <Calendar className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
            <h3 className="text-lg font-medium">No course selected</h3>
            <p className="text-muted-foreground mb-4">
              Please select a course from the courses page.
            </p>
            <Button onClick={handleGoBack}>
              Back to Courses
            </Button>
          </div>
        ) : course ? (
          <>
            {/* Course header */}
            <div className="flex flex-col gap-6">
              <div className="flex flex-col md:flex-row justify-between items-start gap-4">
                <div className="space-y-4">
                  <h1 className="text-3xl font-bold tracking-tight">{course.name}</h1>
                  
                  <div className="flex flex-wrap gap-4">
                    <Badge variant={getStatusBadgeVariant(course.status)} className="text-sm">
                      {course.status ? course.status.replace('_', ' ') : 'Unknown'}
                    </Badge>
                    
                    <div className="flex items-center text-muted-foreground">
                      <Calendar className="mr-2 h-4 w-4" />
                      {formatDate(course.startDate)} - {formatDate(course.endDate)}
                    </div>
                    
                    <div className="flex items-center text-muted-foreground">
                      <Clock className="mr-2 h-4 w-4" />
                      {formatTime(course.startTime)} - {formatTime(course.endTime)}
                    </div>
                    
                    <div className="flex items-center text-muted-foreground">
                      <Users className="mr-2 h-4 w-4" />
                      {course.enrolledAttendees} / {course.maxSeats} seats
                    </div>
                  </div>
                  
                  {course.description && (
                    <p className="text-muted-foreground">
                      {course.description}
                    </p>
                  )}
                </div>
                
                <div className="flex flex-col sm:flex-row gap-3">
                  <Button onClick={handleEditCourse} className="shrink-0">
                    <Edit className="mr-2 h-4 w-4" />
                    Edit Course
                  </Button>
                  <Button onClick={handleManageAttendees} className="shrink-0">
                    <UserPlus className="mr-2 h-4 w-4" />
                    Add Attendee
                  </Button>
                  <Button variant="destructive" onClick={handleDeleteCourse} className="shrink-0">
                    <Trash2 className="mr-2 h-4 w-4" />
                    Delete Course
                  </Button>
                </div>
              </div>
            </div>
            
            {/* Tabs */}
            <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
              <TabsList className="grid w-full grid-cols-2">
                <TabsTrigger value="overview">Overview</TabsTrigger>
                <TabsTrigger value="attendees">Attendees</TabsTrigger>
              </TabsList>
              
              {/* Overview Tab */}
              <TabsContent value="overview" className="space-y-4 mt-6">
                <Card>
                  <CardHeader>
                    <CardTitle>Course Information</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      <div className="bg-primary/5 p-4 rounded-lg flex items-center gap-3">
                        <Calendar className="h-5 w-5 text-primary" />
                        <div>
                          <h3 className="text-sm font-medium text-muted-foreground">Date</h3>
                          <p className="text-xl font-bold">{formatDate(course.startDate)}</p>
                          <p className="text-xs text-muted-foreground">to {formatDate(course.endDate)}</p>
                        </div>
                      </div>
                      
                      <div className="bg-primary/5 p-4 rounded-lg flex items-center gap-3">
                        <Clock className="h-5 w-5 text-primary" />
                        <div>
                          <h3 className="text-sm font-medium text-muted-foreground">Time</h3>
                          <p className="text-xl font-bold">{formatTime(course.startTime)}</p>
                          <p className="text-xs text-muted-foreground">to {formatTime(course.endTime)}</p>
                        </div>
                      </div>
                      
                      <div className="bg-primary/5 p-4 rounded-lg flex items-center gap-3">
                        <Users className="h-5 w-5 text-primary" />
                        <div>
                          <h3 className="text-sm font-medium text-muted-foreground">Capacity</h3>
                          <p className="text-xl font-bold">{course.enrolledAttendees} / {course.maxSeats}</p>
                          <p className="text-xs text-muted-foreground">{course.availableSeats} seats available</p>
                        </div>
                      </div>
                    </div>
                    
                    {course.price && (
                      <div className="bg-primary/5 p-4 rounded-lg flex items-center gap-3 w-full md:w-1/3">
                        <DollarSign className="h-5 w-5 text-primary" />
                        <div>
                          <h3 className="text-sm font-medium text-muted-foreground">Price</h3>
                          <p className="text-xl font-bold">{course.price} {course.currency || 'USD'}</p>
                        </div>
                      </div>
                    )}
                    
                    {course.description && (
                      <div>
                        <h3 className="text-sm font-medium text-muted-foreground mb-2">Description</h3>
                        <div className="bg-muted/50 p-4 rounded-md">
                          <p className="whitespace-pre-line">{course.description}</p>
                        </div>
                      </div>
                    )}
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {course.createdAt && (
                        <div>
                          <h3 className="text-sm font-medium text-muted-foreground">Created</h3>
                          <p>{formatDate(course.createdAt)}</p>
                        </div>
                      )}
                      {course.updatedAt && (
                        <div>
                          <h3 className="text-sm font-medium text-muted-foreground">Last Updated</h3>
                          <p>{formatDate(course.updatedAt)}</p>
                        </div>
                      )}
                    </div>
                    
                    {course.templateId && (
                      <div>
                        <h3 className="text-sm font-medium text-muted-foreground">Template ID</h3>
                        <p className="font-mono text-xs bg-muted p-1 rounded inline-block">{course.templateId}</p>
                      </div>
                    )}
                  </CardContent>
                </Card>
              </TabsContent>
              
              {/* Attendees Tab */}
              <TabsContent value="attendees" className="space-y-4 mt-6">
                <div className="flex justify-between items-center mb-4">
                  <div>
                    <h3 className="text-lg font-medium">Enrolled Attendees</h3>
                    <p className="text-sm text-muted-foreground">
                      {isLoadingAttendees ? "Loading..." : 
                        `${attendees.length} ${attendees.length === 1 ? "attendee" : "attendees"} enrolled in this course`}
                    </p>
                  </div>
                  <Button onClick={handleManageAttendees} className="shrink-0">
                    <UserPlus className="mr-2 h-4 w-4" />
                    Add Attendee
                  </Button>
                </div>
                
                <Card>
                  <CardContent className="p-0">
                    {isLoadingAttendees ? (
                      <div className="flex justify-center items-center py-16">
                        <Loader2 className="h-8 w-8 animate-spin text-primary" />
                      </div>
                    ) : attendees.length === 0 ? (
                      <div className="text-center py-12">
                        <Users className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                        <h3 className="text-lg font-medium">No attendees enrolled</h3>
                        <p className="text-muted-foreground mb-4">
                          This course doesn't have any attendees yet.
                        </p>
                        <Button onClick={handleManageAttendees}>
                          <UserPlus className="mr-2 h-4 w-4" />
                          Assign Your First Attendee
                        </Button>
                      </div>
                    ) : (
                      <div className="overflow-x-auto">
                        <Table>
                          <TableHeader>
                            <TableRow>
                              <TableHead>Name</TableHead>
                              <TableHead>Email</TableHead>
                              <TableHead>Rank</TableHead>
                              <TableHead>Telephone</TableHead>
                              <TableHead className="text-right">Actions</TableHead>
                            </TableRow>
                          </TableHeader>
                          <TableBody>
                            {attendees.map((attendee) => (
                              <TableRow key={attendee.id}>
                                <TableCell className="font-medium">{`${attendee.name} ${attendee.surname}`}</TableCell>
                                <TableCell>{attendee.email}</TableCell>
                                <TableCell>{formatRank(attendee.rank)}</TableCell>
                                <TableCell>{attendee.telephone || "N/A"}</TableCell>
                                <TableCell className="text-right space-x-2">
                                  <Button 
                                    variant="outline" 
                                    size="icon" 
                                    onClick={() => handleAddRemarks(attendee)}
                                    title="Add Remarks"
                                  >
                                    <MessageSquare className="h-4 w-4" />
                                  </Button>
                                  <Button 
                                    variant="outline" 
                                    size="icon"
                                    onClick={() => promptReturnToWaitlist(attendee)}
                                    disabled={processingAttendeeId === attendee.id || !course?.templateId}
                                    title="Return to Waitlist"
                                  >
                                    {processingAttendeeId === attendee.id ? 
                                      <Loader2 className="h-4 w-4 animate-spin" /> : 
                                      <ClipboardList className="h-4 w-4" />}
                                  </Button>
                                  <Button 
                                    variant="outline" 
                                    size="icon"
                                    onClick={() => promptRemoveAttendee(attendee)}
                                    disabled={processingAttendeeId === attendee.id}
                                    title="Remove from Course"
                                  >
                                    {processingAttendeeId === attendee.id ? 
                                      <Loader2 className="h-4 w-4 animate-spin" /> : 
                                      <UserMinus className="h-4 w-4" />}
                                  </Button>
                                </TableCell>
                              </TableRow>
                            ))}
                          </TableBody>
                        </Table>
                      </div>
                    )}
                  </CardContent>
                </Card>
              </TabsContent>
            </Tabs>
          </>
        ) : (
          <div className="text-center py-16">
            <Calendar className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
            <h3 className="text-lg font-medium">Course not found</h3>
            <p className="text-muted-foreground mb-4">
              The course you're looking for doesn't exist or you don't have permission to view it.
            </p>
            <Button onClick={handleGoBack}>
              Back to Courses
            </Button>
          </div>
        )}
        
        {/* Edit Course Dialog */}
        {course && (
          <CourseSchedulingDialog
            open={editDialogOpen}
            onOpenChange={setEditDialogOpen}
            onSuccess={fetchCourseDetails}
            template={null}
            existingCourse={course}
          />
        )}
        
        {/* Delete Confirmation Dialog */}
        <DeleteConfirmationDialog
          open={deleteDialogOpen}
          onOpenChange={setDeleteDialogOpen}
          title="Delete Course"
          description={`Are you sure you want to delete the course "${course?.name || ''}"? This action cannot be undone.`}
          onConfirm={confirmDeleteCourse}
        />
        
        {/* Course attendees management dialog */}
        {course && (
          <CourseAttendeesManagementDialog
            open={attendeesDialogOpen}
            onOpenChange={setAttendeesDialogOpen}
            courseId={course.id}
            courseName={course.name}
            templateId={course.templateId}
            refreshData={fetchAttendees}
          />
        )}
        
        {/* Direct course attendee assignment dialog */}
        {course && (
          <CourseAttendeeDialog
            open={attendeeAssignDialogOpen}
            onOpenChange={setAttendeeAssignDialogOpen}
            courseId={course.id}
            templateId={course.templateId}
            onSuccess={fetchAttendees}
          />
        )}
        
        {/* Remove Attendee Confirmation Dialog */}
        <DeleteConfirmationDialog
          open={removeAttendeeDialogOpen}
          onOpenChange={setRemoveAttendeeDialogOpen}
          title="Remove Attendee"
          description={`Are you sure you want to remove ${selectedAttendee?.name} ${selectedAttendee?.surname} from this course? This action cannot be undone.`}
          onConfirm={handleRemoveAttendee}
        />
        
        {/* Return to Waitlist Confirmation Dialog */}
        <DeleteConfirmationDialog
          open={returnToWaitlistDialogOpen}
          onOpenChange={setReturnToWaitlistDialogOpen}
          title="Return to Waitlist"
          description={`Are you sure you want to return ${selectedAttendee?.name} ${selectedAttendee?.surname} to the waitlist? They will be removed from this course.`}
          onConfirm={handleReturnToWaitlist}
        />
      </div>
    </PageLayout>
  )
}
