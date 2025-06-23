"use client"

import React, { useState, useEffect, Suspense } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import { PageLayout } from "@/components/page-layout"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { 
  Loader2,
  Calendar,
  Clock,
  DollarSign,
  Users,
  ArrowLeft,
  ClipboardList
} from "lucide-react"
import { useAuth } from "@/hooks/useAuth"
import { getArchivedCourseById } from "@/services/courseService"
import { getArchivedCourseAttendees } from "@/services/courseAttendeeService"
import { Course } from "@/types/course"
import { Attendee } from "@/types/attendee"
import { toast } from "sonner"
import { Badge } from "@/components/ui/badge"
import { format } from "date-fns"
import { 
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"

// Loading fallback component
function ArchivedCourseDetailLoading() {
  return (
    <PageLayout>
      <div className="flex items-center justify-center h-screen">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
        <span className="ml-2">Loading archived course details...</span>
      </div>
    </PageLayout>
  );
}

// Main component content
function ArchivedCourseDetailContent() {
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
  
  // Get training center ID from the authenticated user
  const trainingCenterId = user?.userId || ""
  
  // Format rank for display
  const formatRank = (rank: string) => {
    if (!rank) return "";
    return rank
      .split("_")
      .map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
      .join(" ");
  };

  // Fetch archived course details
  const fetchArchivedCourseDetails = async () => {
    if (!trainingCenterId || !courseId) {
      setError("Required information is missing")
      setIsLoading(false)
      return
    }
    
    try {
      setIsLoading(true)
      const courseData = await getArchivedCourseById({ trainingCenterId, courseId })
      setCourse(courseData)
      setError(null)
    } catch (error) {
      console.error("Error fetching archived course details:", error)
      setError("Failed to fetch archived course details. Please try again.")
    } finally {
      setIsLoading(false)
    }
  }
  
  // Fetch course attendees
  const fetchAttendees = async () => {
    if (!trainingCenterId || !courseId) return
    
    try {
      setIsLoadingAttendees(true)
      const attendeeData = await getArchivedCourseAttendees({ trainingCenterId, courseId })
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
      fetchArchivedCourseDetails()
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
      const parts = timeString.split(':')
      if (parts.length >= 2) {
        return `${parts[0]}:${parts[1]}`
      }
      return timeString
    } catch (error) {
      return timeString
    }
  }
  
  // Go back to archive page
  const handleGoBack = () => {
            router.push("/active-courses/archive")
  }
  
  return (
    <PageLayout>
      <div className="flex flex-col gap-6">
        {/* Header with back button */}
        <div className="flex items-center">
          <Button variant="outline" onClick={handleGoBack} className="gap-1">
            <ArrowLeft className="h-4 w-4" />
            Back to Archive
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
              Please select a course from the archive page.
            </p>
            <Button onClick={handleGoBack}>
              Back to Archive
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
                    <Badge variant="secondary" className="text-sm">
                      Archived
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
                      {attendees.length} / {course.maxSeats} seats
                    </div>
                  </div>
                  
                  {course.description && (
                    <p className="text-muted-foreground">
                      {course.description}
                    </p>
                  )}
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
                          <h3 className="text-sm font-medium text-muted-foreground">Enrolled</h3>
                          <p className="text-xl font-bold">{attendees.length} / {course.maxSeats}</p>
                          <p className="text-xs text-muted-foreground">{course.availableSeats} seats remaining</p>
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
                          This course didn't have any attendees.
                        </p>
                      </div>
                    ) : (
                      <div className="overflow-x-auto">
                        <Table>
                          <TableHeader>
                            <TableRow>
                              <TableHead className="text-center w-12">#</TableHead>
                              <TableHead className="text-center">Name</TableHead>
                              <TableHead className="text-center">Email</TableHead>
                              <TableHead className="text-center">Rank</TableHead>
                              <TableHead className="text-center">Telephone</TableHead>
                            </TableRow>
                          </TableHeader>
                          <TableBody>
                            {attendees.map((attendee, idx) => (
                              <TableRow key={attendee.id}>
                                <TableCell className="text-center font-medium">{idx + 1}</TableCell>
                                <TableCell className="text-center font-medium">
                                  <a
                                    href={`/attendees/attendee-detail?id=${attendee.id}`}
                                    className="text-primary underline hover:text-primary/80 transition-colors"
                                    onClick={e => e.stopPropagation()}
                                  >
                                    {`${attendee.name} ${attendee.surname}`}
                                  </a>
                                </TableCell>
                                <TableCell className="text-center">{attendee.email}</TableCell>
                                <TableCell className="text-center">{formatRank(attendee.rank)}</TableCell>
                                <TableCell className="text-center">{attendee.telephone || "N/A"}</TableCell>
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
              The archived course you're looking for doesn't exist or you don't have permission to view it.
            </p>
            <Button onClick={handleGoBack}>
              Back to Archive
            </Button>
          </div>
        )}
      </div>
    </PageLayout>
  )
}

// Export the main component wrapped with Suspense
export default function ArchivedCourseDetailPage() {
  return (
    <Suspense fallback={<ArchivedCourseDetailLoading />}>
      <ArchivedCourseDetailContent />
    </Suspense>
  )
} 