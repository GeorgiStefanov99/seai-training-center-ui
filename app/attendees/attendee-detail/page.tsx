"use client"

import React, { useState, useEffect } from "react"
import { useSearchParams } from "next/navigation"
import { PageLayout } from "@/components/page-layout"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { Button } from "@/components/ui/button"
import { Attendee } from "@/types/attendee"
import { getAttendeeById } from "@/services/attendeeService"
import { RANK_LABELS } from "@/lib/rank-labels"
import { useAuth } from "@/hooks/useAuth"
import { Loader2, Mail, Phone, Award, Edit, MessageSquare, Plus, RefreshCw, Calendar, Trash2 } from "lucide-react"
import { toast } from "sonner"
import { AttendeeDialog } from "@/components/dialogs/attendee-dialog"
import { RemarkDialog } from "@/components/dialogs/remark-dialog"
import { useRouter } from "next/navigation"
import { Remark } from "@/types/remark"
import { getAttendeeRemarks } from "@/services/remarkService"
import { format } from "date-fns"
import { Course } from "@/types/course"
import { getAttendeeEnrolledCourses, removeAttendeeFromCourse } from "@/services/attendeeCourseService"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog"

export default function AttendeeDetailPage() {
  const searchParams = useSearchParams()
  const router = useRouter()
  const { user } = useAuth()
  const [attendee, setAttendee] = useState<Attendee | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [editDialogOpen, setEditDialogOpen] = useState(false)
  
  // Remarks state
  const [remarks, setRemarks] = useState<Remark[]>([])
  const [isLoadingRemarks, setIsLoadingRemarks] = useState(false)
  const [createRemarkDialogOpen, setCreateRemarkDialogOpen] = useState(false)
  const [editRemarkDialogOpen, setEditRemarkDialogOpen] = useState(false)
  const [selectedRemark, setSelectedRemark] = useState<Remark | undefined>(undefined)
  
  // Courses state
  const [enrolledCourses, setEnrolledCourses] = useState<Course[]>([])
  const [isLoadingCourses, setIsLoadingCourses] = useState(false)
  const [removeCourseDialogOpen, setRemoveCourseDialogOpen] = useState(false)
  const [selectedCourse, setSelectedCourse] = useState<Course | null>(null)
  
  // Get training center ID from the authenticated user
  const trainingCenterId = user?.userId || ""
  const attendeeId = searchParams.get("id")

  // Function to fetch remarks for the attendee
  const fetchRemarks = async () => {
    if (!trainingCenterId || !attendeeId) {
      return
    }
    
    setIsLoadingRemarks(true)
    try {
      const data = await getAttendeeRemarks({ trainingCenterId, attendeeId })
      // Sort remarks by creation date (newest first)
      const sortedRemarks = data.sort((a, b) => {
        return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
      })
      setRemarks(sortedRemarks)
    } catch (err) {
      console.error('Error fetching remarks:', err)
      toast.error('Failed to load remarks. Please try again.')
    } finally {
      setIsLoadingRemarks(false)
    }
  }

  // Function to fetch enrolled courses for the attendee
  const fetchEnrolledCourses = async () => {
    if (!trainingCenterId || !attendeeId) {
      return
    }
    
    setIsLoadingCourses(true)
    try {
      const data = await getAttendeeEnrolledCourses({ trainingCenterId, attendeeId })
      setEnrolledCourses(data)
    } catch (err) {
      console.error('Error fetching enrolled courses:', err)
      toast.error('Failed to load enrolled courses. Please try again.')
    } finally {
      setIsLoadingCourses(false)
    }
  }

  // Handle removing attendee from a course
  const handleRemoveFromCourse = (course: Course) => {
    setSelectedCourse(course)
    setRemoveCourseDialogOpen(true)
  }

  // Confirm removal of attendee from course
  const confirmRemoveFromCourse = async () => {
    if (!trainingCenterId || !attendeeId || !selectedCourse) {
      return
    }

    try {
      await removeAttendeeFromCourse({
        trainingCenterId,
        attendeeId,
        courseId: selectedCourse.id
      })
      
      toast.success(`Attendee removed from ${selectedCourse.name}`)
      fetchEnrolledCourses() // Refresh the courses list
    } catch (err) {
      console.error('Error removing attendee from course:', err)
      toast.error('Failed to remove attendee from course. Please try again.')
    } finally {
      setRemoveCourseDialogOpen(false)
      setSelectedCourse(null)
    }
  }

  useEffect(() => {
    const fetchAttendee = async () => {
      // Debug: Log the parameters we're using for the API call
      console.log('DEBUG - Attendee Detail - Fetch params:', { trainingCenterId, attendeeId })
      
      if (!trainingCenterId || !attendeeId) {
        console.log('DEBUG - Attendee Detail - Missing required params')
        setIsLoading(false)
        setError("Missing required information to fetch attendee details")
        return
      }
      
      try {
        setIsLoading(true)
        console.log('DEBUG - Attendee Detail - Calling API with params:', { trainingCenterId, attendeeId })
        
        const data = await getAttendeeById({
          trainingCenterId,
          attendeeId
        })
        
        console.log('DEBUG - Attendee Detail - API response:', data)
        setAttendee(data)
        setError(null)
        
        // After fetching attendee, fetch their remarks and courses
        await Promise.all([
          fetchRemarks(),
          fetchEnrolledCourses()
        ])
      } catch (err) {
        console.error('DEBUG - Attendee Detail - Error fetching details:', err)
        setError('Failed to load attendee details. Please try again later.')
      } finally {
        setIsLoading(false)
      }
    }

    fetchAttendee()
  }, [trainingCenterId, attendeeId])

  const handleEditSuccess = async () => {
    if (!trainingCenterId || !attendeeId) return
    
    try {
      setIsLoading(true)
      const data = await getAttendeeById({
        trainingCenterId,
        attendeeId
      })
      setAttendee(data)
      toast.success("Attendee information updated successfully")
    } catch (err) {
      console.error('Error refreshing attendee details:', err)
    } finally {
      setIsLoading(false)
    }
  }
  
  // Handle remark operations
  const handleAddRemark = () => {
    setSelectedRemark(undefined)
    // Use setTimeout to ensure state is set before opening dialog
    setTimeout(() => {
      setCreateRemarkDialogOpen(true)
    }, 0)
  }
  
  const handleEditRemark = (remark: Remark) => {
    setSelectedRemark(remark)
    // Use setTimeout to ensure state is set before opening dialog
    setTimeout(() => {
      setEditRemarkDialogOpen(true)
    }, 0)
  }
  
  const handleRemarkSuccess = async () => {
    // Refresh remarks after successful operation
    await fetchRemarks()
    toast.success("Remarks updated successfully")
  }

  const getInitials = (name?: string, surname?: string) => {
    if (!name && !surname) return "?"
    return `${name?.[0] || ""}${surname?.[0] || ""}`
  }

  if (isLoading) {
    return (
      <PageLayout title="Attendee Details">
        <div className="flex h-[400px] w-full items-center justify-center">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      </PageLayout>
    )
  }

  if (error || !attendee) {
    return (
      <PageLayout title="Attendee Details">
        <div className="bg-destructive/10 text-destructive p-4 rounded-md">
          {error || "Failed to load attendee details"}
        </div>
        <Button 
          variant="outline" 
          className="mt-4"
          onClick={() => router.push('/attendees')}
        >
          Back to Attendees
        </Button>
      </PageLayout>
    )
  }

  return (
    <PageLayout title={`${attendee.name} ${attendee.surname}`}>
      <div className="space-y-6">
        {/* Profile Header */}
        <div className="flex flex-col md:flex-row gap-6 items-start md:items-center">
          <Avatar className="h-24 w-24 border-2 border-primary/20">
            <AvatarFallback className="text-xl">
              {getInitials(attendee.name, attendee.surname)}
            </AvatarFallback>
          </Avatar>
          
          <div className="flex-1 space-y-2">
            <div className="flex flex-col md:flex-row md:items-center gap-2 md:gap-4">
              <h1 className="text-2xl font-bold">{attendee.name} {attendee.surname}</h1>
              <div className="bg-primary/10 text-primary px-3 py-1 rounded-full text-sm font-medium">
                {RANK_LABELS[attendee.rank] || attendee.rank}
              </div>
            </div>
            
            <div className="flex flex-col gap-1">
              <div className="flex items-center gap-2 text-muted-foreground">
                <Mail className="h-4 w-4" />
                <span>{attendee.email}</span>
              </div>
              <div className="flex items-center gap-2 text-muted-foreground">
                <Phone className="h-4 w-4" />
                <span>{attendee.telephone}</span>
              </div>
            </div>
          </div>
          
          <Button onClick={() => setEditDialogOpen(true)} className="shrink-0">
            <Edit className="mr-2 h-4 w-4" />
            Edit Profile
          </Button>
        </div>
        
        {/* Tabs */}
        <Tabs defaultValue="overview" className="w-full">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="overview">Overview</TabsTrigger>
            <TabsTrigger value="remarks">Remarks</TabsTrigger>
            <TabsTrigger value="courses">Courses</TabsTrigger>
            <TabsTrigger value="quizzes">Quiz Attempts</TabsTrigger>
          </TabsList>
          
          {/* Overview Tab */}
          <TabsContent value="overview" className="space-y-4 mt-6">
            <Card>
              <CardHeader>
                <CardTitle>Personal Information</CardTitle>
                <CardDescription>Basic information about the attendee</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <h3 className="text-sm font-medium text-muted-foreground">Full Name</h3>
                    <p>{attendee.name} {attendee.surname}</p>
                  </div>
                  <div>
                    <h3 className="text-sm font-medium text-muted-foreground">Email</h3>
                    <p>{attendee.email}</p>
                  </div>
                  <div>
                    <h3 className="text-sm font-medium text-muted-foreground">Phone</h3>
                    <p>{attendee.telephone}</p>
                  </div>
                  <div>
                    <h3 className="text-sm font-medium text-muted-foreground">Rank</h3>
                    <div className="flex items-center gap-2">
                      <Award className="h-4 w-4 text-primary" />
                      <span>{RANK_LABELS[attendee.rank] || attendee.rank}</span>
                    </div>
                  </div>
                </div>
                
                {attendee.remark && (
                  <div>
                    <h3 className="text-sm font-medium text-muted-foreground">Remarks</h3>
                    <p className="whitespace-pre-line">{attendee.remark}</p>
                  </div>
                )}
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader>
                <CardTitle>Progress Summary</CardTitle>
                <CardDescription>Overview of courses and quiz performance</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="bg-primary/5 p-4 rounded-lg">
                    <h3 className="text-sm font-medium text-muted-foreground">Courses Enrolled</h3>
                    <p className="text-2xl font-bold">{enrolledCourses?.length || 0}</p>
                  </div>
                  <div className="bg-primary/5 p-4 rounded-lg">
                    <h3 className="text-sm font-medium text-muted-foreground">Courses Completed</h3>
                    <p className="text-2xl font-bold">{enrolledCourses?.filter(course => course.status === 'COMPLETED').length || 0}</p>
                  </div>
                  <div className="bg-primary/5 p-4 rounded-lg">
                    <h3 className="text-sm font-medium text-muted-foreground">Quiz Average Score</h3>
                    <p className="text-2xl font-bold">N/A</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Remarks Tab */}
          <TabsContent value="remarks" className="mt-6">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between">
                <div>
                  <CardTitle>Remarks</CardTitle>
                  <CardDescription>Notes and comments about this attendee</CardDescription>
                </div>
                <div className="flex space-x-2">
                  <Button variant="outline" size="sm" onClick={fetchRemarks}>
                    <RefreshCw className="h-4 w-4 mr-2" />
                    Refresh
                  </Button>
                  <Button size="sm" onClick={handleAddRemark}>
                    <Plus className="h-4 w-4 mr-2" />
                    Add Remark
                  </Button>
                </div>
              </CardHeader>
              <CardContent>
                {isLoadingRemarks ? (
                  <div className="flex justify-center py-8">
                    <Loader2 className="h-6 w-6 animate-spin text-primary" />
                  </div>
                ) : remarks.length === 0 ? (
                  <div className="flex flex-col items-center justify-center py-8 text-center">
                    <div className="rounded-full bg-muted p-3">
                      <MessageSquare className="h-6 w-6 text-muted-foreground" />
                    </div>
                    <h3 className="mt-4 text-lg font-medium">No Remarks Yet</h3>
                    <p className="mt-2 text-sm text-muted-foreground max-w-sm">
                      There are no remarks for this attendee yet. Add a remark to keep track of important information.
                    </p>
                    <Button className="mt-4" onClick={handleAddRemark}>
                      <Plus className="h-4 w-4 mr-2" />
                      Add First Remark
                    </Button>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {remarks.map((remark) => (
                      <Card key={remark.id} className="overflow-hidden">
                        <CardHeader className="bg-muted/50 py-3 px-4">
                          <div className="flex justify-between items-center">
                            <div>
                              <p className="text-xs text-muted-foreground">
                                Created: {remark.createdAt ? format(new Date(remark.createdAt), 'MMM d, yyyy HH:mm') : 'Unknown date'}
                              </p>
                              <p className="text-xs text-muted-foreground">
                                Last updated: {remark.lastUpdatedAt ? format(new Date(remark.lastUpdatedAt), 'MMM d, yyyy HH:mm') : 'Unknown date'}
                              </p>
                            </div>
                            <Button variant="ghost" size="sm" onClick={() => handleEditRemark(remark)}>
                              <Edit className="h-3 w-3 mr-1" />
                              Edit
                            </Button>
                          </div>
                        </CardHeader>
                        <CardContent className="py-3 px-4">
                          <p className="whitespace-pre-line text-sm">{remark.remarkText}</p>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>
          
          {/* Courses Tab */}
          <TabsContent value="courses" className="mt-6">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between">
                <div>
                  <CardTitle>Enrolled Courses</CardTitle>
                  <CardDescription>Courses the attendee is currently enrolled in or has completed</CardDescription>
                </div>
                <Button variant="outline" size="sm" onClick={fetchEnrolledCourses} disabled={isLoadingCourses}>
                  {isLoadingCourses ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <RefreshCw className="h-4 w-4 mr-1" />
                  )}
                  {isLoadingCourses ? "Loading..." : "Refresh"}
                </Button>
              </CardHeader>
              <CardContent>
                {isLoadingCourses ? (
                  <div className="flex justify-center py-8">
                    <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
                  </div>
                ) : enrolledCourses.length === 0 ? (
                  <div className="flex flex-col items-center justify-center py-8 text-center">
                    <div className="rounded-full bg-muted p-3">
                      <Award className="h-6 w-6 text-muted-foreground" />
                    </div>
                    <h3 className="mt-4 text-lg font-medium">No Courses Yet</h3>
                    <p className="mt-2 text-sm text-muted-foreground max-w-sm">
                      This attendee is not enrolled in any courses yet. Courses will appear here once they are assigned.
                    </p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {enrolledCourses.map((course) => (
                      <Card key={course.id} className="overflow-hidden">
                        <CardHeader className="bg-muted/50 py-3 px-4">
                          <div className="flex justify-between items-start">
                            <div>
                              <CardTitle className="text-base">{course.name}</CardTitle>
                            </div>
                            <Button 
                              variant="ghost" 
                              size="sm" 
                              className="text-destructive hover:text-destructive hover:bg-destructive/10"
                              onClick={() => handleRemoveFromCourse(course)}
                            >
                              <Trash2 className="h-4 w-4 mr-1" />
                              Remove
                            </Button>
                          </div>
                        </CardHeader>
                        <CardContent className="py-3 px-4">
                          <div className="grid grid-cols-2 gap-4 text-sm">
                            <div>
                              <p className="font-medium flex items-center">
                                <Calendar className="h-4 w-4 mr-2 text-muted-foreground" />
                                Start
                              </p>
                              <p className="text-muted-foreground">
                                {course.startDate ? format(new Date(course.startDate), 'MMM d, yyyy') : 'Not scheduled'}
                              </p>
                              {course.startTime && (
                                <p className="text-muted-foreground text-xs mt-1">
                                  at {course.startTime}
                                </p>
                              )}
                            </div>
                            <div>
                              <p className="font-medium flex items-center">
                                <Calendar className="h-4 w-4 mr-2 text-muted-foreground" />
                                End
                              </p>
                              <p className="text-muted-foreground">
                                {course.endDate ? format(new Date(course.endDate), 'MMM d, yyyy') : 'Not scheduled'}
                              </p>
                              {course.endTime && (
                                <p className="text-muted-foreground text-xs mt-1">
                                  at {course.endTime}
                                </p>
                              )}
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>
          
          {/* Quiz Attempts Tab */}
          <TabsContent value="quizzes" className="mt-6">
            <Card>
              <CardHeader>
                <CardTitle>Quiz Attempts</CardTitle>
                <CardDescription>History of quiz attempts and results</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="flex flex-col items-center justify-center py-8 text-center">
                  <div className="rounded-full bg-muted p-3">
                    <Award className="h-6 w-6 text-muted-foreground" />
                  </div>
                  <h3 className="mt-4 text-lg font-medium">No Quiz Attempts</h3>
                  <p className="mt-2 text-sm text-muted-foreground max-w-sm">
                    This attendee has not attempted any quizzes yet. Quiz results will appear here once they are completed.
                  </p>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
      
      {/* Edit Attendee Dialog */}
      <AttendeeDialog
        open={editDialogOpen}
        onOpenChange={setEditDialogOpen}
        attendee={attendee}
        onSuccess={handleEditSuccess}
        mode="edit"
      />

      {/* Create Remark Dialog */}
      {attendeeId && (
        <RemarkDialog
          open={createRemarkDialogOpen}
          onOpenChange={setCreateRemarkDialogOpen}
          mode="create"
          attendeeId={attendeeId}
          onSuccess={handleRemarkSuccess}
        />
      )}
      
      {/* Edit Remark Dialog */}
      {attendeeId && selectedRemark && (
        <RemarkDialog
          open={editRemarkDialogOpen}
          onOpenChange={setEditRemarkDialogOpen}
          mode="edit"
          attendeeId={attendeeId}
          remark={selectedRemark}
          onSuccess={handleRemarkSuccess}
        />
      )}
      
      {/* Remove Course Confirmation Dialog */}
      <AlertDialog open={removeCourseDialogOpen} onOpenChange={setRemoveCourseDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Remove from Course</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to remove this attendee from the course "{selectedCourse?.name}"?
              This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={confirmRemoveFromCourse} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
              Remove
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </PageLayout>
  )
}
