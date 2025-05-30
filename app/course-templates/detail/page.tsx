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
import { Loader2, Edit, ArrowLeft, Calendar, Users, DollarSign, BookOpen } from "lucide-react"
import { toast } from "sonner"
import { CourseTemplateDialog } from "@/components/dialogs/course-template-dialog"
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
      enrolledAttendees: 12
    },
    {
      id: "102",
      templateId: "1",
      name: "Basic Safety Training - July 2025",
      startDate: "2025-07-15T09:00:00Z",
      endDate: "2025-07-19T17:00:00Z",
      status: "SCHEDULED",
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
  const [editDialogOpen, setEditDialogOpen] = useState(false)
  
  // Get training center ID from the authenticated user
  const trainingCenterId = user?.userId || ""
  const templateId = searchParams.get("id")

  useEffect(() => {
    const fetchTemplateData = async () => {
      // Debug: Log the parameters we're using for the API call
      console.log('DEBUG - Template Detail - Fetch params:', { trainingCenterId, templateId })
      
      if (!templateId) {
        console.log('DEBUG - Template Detail - Missing template ID')
        setIsLoading(false)
        setError("Missing template ID")
        return
      }
      
      try {
        setIsLoading(true)
        
        // For static site generation and Jamstack architecture, use mock data if available
        if (MOCK_TEMPLATES[templateId]) {
          console.log('DEBUG - Template Detail - Using mock data for ID:', templateId)
          setTimeout(() => {
            setTemplate(MOCK_TEMPLATES[templateId])
            setActiveCourses(MOCK_ACTIVE_COURSES[templateId] || [])
            setError(null)
            setIsLoading(false)
          }, 500) // Simulate API delay
          return
        }
        
        // If no mock data or we want to try the real API
        if (trainingCenterId) {
          console.log('DEBUG - Template Detail - Calling API with params:', { trainingCenterId, templateId })
          
          // Fetch template details and active courses in parallel
          const [templateData, coursesData] = await Promise.all([
            getCourseTemplateById({
              trainingCenterId,
              courseTemplateId: templateId
            }),
            getActiveCoursesForTemplate({
              trainingCenterId,
              courseTemplateId: templateId
            })
          ])
          
          console.log('DEBUG - Template Detail - API responses:', { templateData, coursesData })
          setTemplate(templateData)
          setActiveCourses(coursesData)
          setError(null)
        } else {
          throw new Error('Training center ID is required')
        }
      } catch (err) {
        console.error('DEBUG - Template Detail - Error fetching details:', err)
        
        // Fallback to mock data if API call fails
        if (MOCK_TEMPLATES[templateId]) {
          console.log('DEBUG - Template Detail - Falling back to mock data for ID:', templateId)
          setTemplate(MOCK_TEMPLATES[templateId])
          setActiveCourses(MOCK_ACTIVE_COURSES[templateId] || [])
          setError(null)
        } else {
          setError('Failed to load course template details. Please try again later.')
        }
      } finally {
        setIsLoading(false)
      }
    }

    fetchTemplateData()
  }, [trainingCenterId, templateId])

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

  // Format currency for display
  const formatCurrency = (price: number, currency: string) => {
    const formatter = new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: currency,
      minimumFractionDigits: 0,
      maximumFractionDigits: 2
    })
    
    return formatter.format(price)
  }

  // Format date for display
  const formatDate = (dateString: string) => {
    try {
      return format(new Date(dateString), 'MMM d, yyyy')
    } catch (e) {
      return dateString
    }
  }

  // Get status badge variant
  const getStatusBadgeVariant = (status: string) => {
    switch (status) {
      case 'SCHEDULED':
        return 'secondary'
      case 'IN_PROGRESS':
        return 'default'
      case 'COMPLETED':
        return 'success'
      case 'CANCELLED':
        return 'destructive'
      default:
        return 'outline'
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
    <PageLayout title={template.name}>
      <div className="space-y-6">
        {/* Header with back button */}
        <div className="flex items-center gap-2">
          <Button 
            variant="outline" 
            size="sm"
            onClick={() => router.push('/course-templates')}
          >
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Course Templates
          </Button>
        </div>
        
        {/* Template Header */}
        <div className="flex flex-col md:flex-row gap-6 items-start md:items-center">
          <div className="flex-1 space-y-2">
            <div className="flex flex-col md:flex-row md:items-center gap-2 md:gap-4">
              <h1 className="text-2xl font-bold">{template.name}</h1>
              <div className="bg-primary/10 text-primary px-3 py-1 rounded-full text-sm font-medium">
                {formatCurrency(template.price, template.currency)}
              </div>
            </div>
            
            <p className="text-muted-foreground">
              {template.description || "No description provided"}
            </p>
          </div>
          
          <Button onClick={() => setEditDialogOpen(true)} className="shrink-0">
            <Edit className="mr-2 h-4 w-4" />
            Edit Template
          </Button>
        </div>
        
        {/* Tabs */}
        <Tabs defaultValue="overview" className="w-full">
          <TabsList className="grid w-full grid-cols-2 lg:w-[400px]">
            <TabsTrigger value="overview">Overview</TabsTrigger>
            <TabsTrigger value="courses">Active Courses</TabsTrigger>
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
          <TabsContent value="courses" className="mt-6">
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
                              {course.status.replace('_', ' ')}
                            </Badge>
                          </TableCell>
                          <TableCell>
                            <div className="flex items-center gap-1">
                              <Users className="h-3 w-3" />
                              <span>{course.enrolledAttendees} / {template.maxSeats}</span>
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
                <Button className="w-full sm:w-auto">
                  <Calendar className="mr-2 h-4 w-4" />
                  Schedule New Course
                </Button>
              </CardFooter>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
      
      {/* Edit Course Template Dialog */}
      <CourseTemplateDialog
        open={editDialogOpen}
        onOpenChange={setEditDialogOpen}
        template={template}
        onSuccess={handleEditSuccess}
        mode="edit"
      />
    </PageLayout>
  )
}
