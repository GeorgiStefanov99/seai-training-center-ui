"use client"

import React, { useState, useEffect, Suspense } from "react"
import { useSearchParams } from "next/navigation"
import { PageLayout } from "@/components/page-layout"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { Button } from "@/components/ui/button"
import { Attendee, AttendeeApiParams } from "@/types/attendee"
import { Course } from "@/types/course"
import { getAttendeeById } from "@/services/attendeeService"
import { RANK_LABELS } from "@/lib/rank-labels"
import { useAuth } from "@/hooks/useAuth"
import { Loader2, Mail, Phone, Award, Edit, MessageSquare, Plus, RefreshCw, Calendar, Trash2, ArrowLeft, Clock, ExternalLink, FileText, Check, Eye } from "lucide-react"
import { toast } from "sonner"
import { AttendeeDialog } from "@/components/dialogs/attendee-dialog"
import { RemarkDialog } from "@/components/dialogs/remark-dialog"
import { useRouter } from "next/navigation"
import { Remark } from '@/types/remark'
import { WaitlistRecord, CourseTemplate } from '@/types/course-template'
import { getAttendeeRemarks } from "@/services/remarkService"
import { format } from "date-fns"
import { getAttendeeEnrolledCourses, removeAttendeeFromCourse, getAttendeePastCourses } from "@/services/attendeeCourseService"
import { getWaitlistRecordsByAttendee } from "@/services/waitlistService"
import { getCourseTemplateById } from "@/services/courseTemplateService"
import { WaitlistEditDialog } from "@/components/dialogs/waitlist-edit-dialog"
import { Document, FileItem } from "@/types/document"
import { getAttendeeDocuments, createDocument, updateDocument, deleteDocument } from "@/services/documentService"
import { getDocumentFiles, getFileDownloadUrl, uploadFile, deleteFile } from "@/services/fileService"
import { DocumentDialog } from "@/components/dialogs/document-dialog"
import { DocumentPreviewDialog } from "@/components/dialogs/document-preview-dialog"
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
import { Table, TableBody, TableHead, TableHeader, TableRow, TableCell } from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"

// Utility to get badge variant for course status (available globally in this file)
const getStatusBadgeVariant = (status?: string) => {
  if (!status) return "outline";
  switch (status) {
    case "SCHEDULED":
      return "outline";
    case "IN_PROGRESS":
      return "default";
    case "COMPLETED":
      return "success";
    case "CANCELLED":
      return "destructive";
    default:
      return "outline";
  }
};

function AttendeeDetailContent() {
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
  const [activeCourses, setActiveCourses] = useState<Course[]>([])
  const [pastCourses, setPastCourses] = useState<Course[]>([])
  const [showPastCourses, setShowPastCourses] = useState(false)
  const [isLoadingActiveCourses, setIsLoadingActiveCourses] = useState(false)
  const [isLoadingPastCourses, setIsLoadingPastCourses] = useState(false)
  const [removeCourseDialogOpen, setRemoveCourseDialogOpen] = useState(false)
  const [selectedCourse, setSelectedCourse] = useState<Course | null>(null)
  
  // Waitlist state
  const [waitlistRecords, setWaitlistRecords] = useState<WaitlistRecord[]>([])
  const [isLoadingWaitlist, setIsLoadingWaitlist] = useState(false)
  const [waitlistEditDialogOpen, setWaitlistEditDialogOpen] = useState(false)
  const [selectedWaitlistRecord, setSelectedWaitlistRecord] = useState<WaitlistRecord | null>(null)
  const [courseTemplates, setCourseTemplates] = useState<{[key: string]: CourseTemplate}>({})
  
  // Documents state
  const [documents, setDocuments] = useState<Document[]>([])
  const [isLoadingDocuments, setIsLoadingDocuments] = useState(false)
  const [documentDialogOpen, setDocumentDialogOpen] = useState(false)
  const [selectedDocument, setSelectedDocument] = useState<Document | undefined>(undefined)
  const [documentFiles, setDocumentFiles] = useState<{[key: string]: FileItem[]}>({}) 
  const [previewDialogOpen, setPreviewDialogOpen] = useState(false)
  const [selectedDocumentId, setSelectedDocumentId] = useState<string | null>(null)
  
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
      const data = await getAttendeeRemarks({ trainingCenterId, attendeeId: attendeeId as string })
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
  const fetchActiveCourses = async () => {
    if (!trainingCenterId || !attendeeId) return
    try {
      setIsLoadingActiveCourses(true)
      const courses = await getAttendeeEnrolledCourses({ trainingCenterId, attendeeId })
      setActiveCourses(courses)
    } catch (error) {
      console.error("Error fetching active courses:", error)
    } finally {
      setIsLoadingActiveCourses(false)
    }
  }

  const fetchPastCourses = async () => {
    if (!trainingCenterId || !attendeeId) return
    try {
      setIsLoadingPastCourses(true)
      const courses = await getAttendeePastCourses({ trainingCenterId, attendeeId })
      setPastCourses(courses)
    } catch (error) {
      console.error("Error fetching past courses:", error)
    } finally {
      setIsLoadingPastCourses(false)
    }
  }
  
  // Function to fetch waitlist records for the attendee
  const fetchWaitlistRecords = async () => {
    if (!trainingCenterId || !attendeeId) {
      return
    }
    
    setIsLoadingWaitlist(true)
    try {
      // Fetch waitlist records for this attendee
      const records = await getWaitlistRecordsByAttendee({ trainingCenterId, attendeeId: attendeeId as string })
      
      // If we have no records, just set empty arrays and return
      if (!records || records.length === 0) {
        setWaitlistRecords([])
        setCourseTemplates({})
        setIsLoadingWaitlist(false)
        return
      }
      
      // Set the waitlist records immediately so UI can show loading state
      setWaitlistRecords(records)
      
      // Create a new templates object for each fetch
      const templates: {[key: string]: CourseTemplate} = {}
      
      // Process each record sequentially to avoid race conditions
      for (const record of records) {
        // Use courseTemplateId from the API response
        const templateId = record.courseTemplateId
        
        // Skip records without template ID
        if (!templateId) {
          continue
        }
        
        // Skip already processed templates
        if (templates[templateId]) {
          continue
        }
        
        try {
          
          // Fetch the template data
          const templateData = await getCourseTemplateById({
            trainingCenterId,
            courseTemplateId: templateId
          })
          
          if (templateData) {
            templates[templateId] = templateData
            
            // Update the state with each template as it's fetched
            // This creates a new object reference to trigger re-render
            setCourseTemplates(prevTemplates => ({
              ...prevTemplates,
              [templateId]: templateData
            }))
          } else {
            throw new Error('Template data is empty')
          }
        } catch (err) {
          console.error(`Error fetching template ${templateId}:`, err)
          
          // Create a fallback template with all required properties
          const fallbackTemplate: CourseTemplate = {
            id: templateId,
            name: 'Unknown Course',
            description: 'Could not load course details',
            trainingCenterId: trainingCenterId,
            // Required properties from CourseTemplateBase
            price: 0,
            currency: 'BGN',
            maxSeats: 0,
            // Optional properties
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString()
          }
          
          // Add the fallback to our templates object
          templates[templateId] = fallbackTemplate
          
          // Update the state with the fallback
          setCourseTemplates(prevTemplates => ({
            ...prevTemplates,
            [templateId]: fallbackTemplate
          }))
        }
      }
      

    } catch (err) {
      console.error('Error fetching waitlist records:', err)
      toast.error('Failed to load waitlist records. Please try again.')
    } finally {
      setIsLoadingWaitlist(false)
    }
  }

  // Function to fetch documents for the attendee
  const fetchDocuments = async () => {
    if (!trainingCenterId || !attendeeId) {
      return
    }
    
    setIsLoadingDocuments(true)
    try {
      const data = await getAttendeeDocuments({ trainingCenterId, attendeeId: attendeeId as string })
      setDocuments(data)
      
      // Fetch files for each document
      const filesMap: {[key: string]: FileItem[]} = {}
      
      for (const doc of data) {
        try {
          const files = await getDocumentFiles({ 
            trainingCenterId, 
            attendeeId: attendeeId as string,
            documentId: doc.id 
          })
          filesMap[doc.id] = files
        } catch (err) {
          console.error(`Error fetching files for document ${doc.id}:`, err)
          filesMap[doc.id] = []
        }
      }
      
      setDocumentFiles(filesMap)
    } catch (err) {
      console.error('Error fetching documents:', err)
      toast.error('Failed to load documents. Please try again.')
    } finally {
      setIsLoadingDocuments(false)
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
      fetchActiveCourses() // Refresh the courses list
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
      
      if (!trainingCenterId || !attendeeId) {
        setIsLoading(false)
        setError("Missing required information to fetch attendee details")
        return
      }
      
      try {
        setIsLoading(true)
        
        const data = await getAttendeeById({
          trainingCenterId,
          attendeeId
        })
        
        setAttendee(data)
        setError(null)
        
        // After fetching attendee, fetch their remarks, courses and documents
        await Promise.all([
          fetchRemarks(),
          fetchActiveCourses(),
          fetchWaitlistRecords(),
          fetchDocuments()
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

  // Always fetch active courses when attendee or training center changes
  useEffect(() => {
    if (attendeeId) {
      fetchActiveCourses();
    }
  }, [trainingCenterId, attendeeId]);

  // Only fetch past courses when toggled on
  useEffect(() => {
    if (attendeeId && showPastCourses) {
      fetchPastCourses();
    }
  }, [trainingCenterId, attendeeId, showPastCourses]);

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
  
  // Handle waitlist operations
  const handleEditWaitlist = (record: WaitlistRecord) => {
    // If attendeeResponse is missing, add it from the current attendee
    if (!record.attendeeResponse && attendee) {
      // Use type assertion to handle the AttendeeRank type mismatch
      const attendeeResponse = {
        id: attendee.id,
        name: attendee.name || '',
        surname: attendee.surname || '',
        email: attendee.email || '',
        telephone: attendee.telephone || '',
        rank: (attendee.rank || 'CAPTAIN') as any // Use type assertion to handle different rank enums
        
      }
      
      const enrichedRecord = {
        ...record,
        attendeeResponse
      }
      setSelectedWaitlistRecord(enrichedRecord)
    } else {
      setSelectedWaitlistRecord(record)
    }
    setWaitlistEditDialogOpen(true)
  }
  
  const handleWaitlistSuccess = async () => {
    // Refresh waitlist records after successful operation
    await fetchWaitlistRecords()
    toast.success("Waitlist record updated successfully")
  }
  
  // Navigate to course template details
  const navigateToCourseTemplate = (templateId: string) => {
    router.push(`/course-templates/detail?id=${templateId}`)
  }
  
  // Document management handlers
  const handleAddDocument = () => {
    setSelectedDocument(undefined)
    setDocumentDialogOpen(true)
  }
  
  const handleEditDocument = (document: Document) => {
    setSelectedDocument(document)
    setDocumentDialogOpen(true)
  }
  
  const handleDocumentSuccess = async () => {
    // Refresh documents after successful operation
    await fetchDocuments()
    toast.success("Document updated successfully")
  }
  
  const handlePreviewDocument = (documentId: string) => {
    setSelectedDocumentId(documentId)
    setPreviewDialogOpen(true)
  }
  
  const handleDeleteDocument = async (documentId: string) => {
    if (!trainingCenterId || !attendeeId) {
      return
    }
    
    try {
      await deleteDocument({
        trainingCenterId,
        attendeeId: attendeeId as string,
        documentId
      })
      
      // Refresh documents after deletion
      await fetchDocuments()
      toast.success("Document deleted successfully")
    } catch (err) {
      console.error('Error deleting document:', err)
      toast.error('Failed to delete document. Please try again.')
    }
  }

  const getInitials = (name?: string, surname?: string) => {
    if (!name && !surname) return "?"
    return `${name?.[0] || ""}${surname?.[0] || ""}`
  }

  const formatDate = (dateString: string) => {
    try {
      return format(new Date(dateString), "MMM d, yyyy")
    } catch (error) {
      return dateString
    }
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
    <PageLayout title={`${attendee.name || ''} ${attendee.surname || ''}`.trim() || 'Attendee Details'}>
      <div className="mb-6">
        <Button 
          variant="outline" 
          size="sm" 
          onClick={() => router.push('/attendees')}
          className="flex items-center gap-2"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to Attendees
        </Button>
      </div>
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
              <h1 className="text-2xl font-bold">{(attendee.name || '') + ' ' + (attendee.surname || '')}</h1>
              {attendee.rank && (
                <div className="bg-primary/10 text-primary px-3 py-1 rounded-full text-sm font-medium">
                  {RANK_LABELS[attendee.rank] || attendee.rank}
                </div>
              )}
            </div>
            
                          <div className="flex flex-col gap-1">
                {attendee.email && (
                  <div className="flex items-center gap-2 text-muted-foreground">
                    <Mail className="h-4 w-4" />
                    <span>{attendee.email}</span>
                  </div>
                )}
                {attendee.telephone && (
                  <div className="flex items-center gap-2 text-muted-foreground">
                    <Phone className="h-4 w-4" />
                    <span>{attendee.telephone}</span>
                  </div>
                )}
              </div>
          </div>
          
          <Button onClick={() => setEditDialogOpen(true)} className="shrink-0">
            <Edit className="mr-2 h-4 w-4" />
            Edit Profile
          </Button>
        </div>
        
        {/* Tabs */}
        <Tabs defaultValue="overview" className="w-full">
          <TabsList className="grid w-full grid-cols-6">
            <TabsTrigger value="overview">Overview</TabsTrigger>
            <TabsTrigger value="remarks">Remarks</TabsTrigger>
            <TabsTrigger value="courses">Courses</TabsTrigger>
            <TabsTrigger value="waitlist">Waitlist</TabsTrigger>
            <TabsTrigger value="documents">Documents</TabsTrigger>
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
                  {(attendee.name || attendee.surname) && (
                    <div>
                      <h3 className="text-sm font-medium text-muted-foreground">Full Name</h3>
                      <p>{(attendee.name || '') + ' ' + (attendee.surname || '')}</p>
                    </div>
                  )}
                  {attendee.email && (
                    <div>
                      <h3 className="text-sm font-medium text-muted-foreground">Email</h3>
                      <p>{attendee.email}</p>
                    </div>
                  )}
                  {attendee.telephone && (
                    <div>
                      <h3 className="text-sm font-medium text-muted-foreground">Phone</h3>
                      <p>{attendee.telephone}</p>
                    </div>
                  )}
                  {attendee.rank && (
                    <div>
                      <h3 className="text-sm font-medium text-muted-foreground">Rank</h3>
                      <div className="flex items-center gap-2">
                        <Award className="h-4 w-4 text-primary" />
                        <span>{RANK_LABELS[attendee.rank] || attendee.rank}</span>
                      </div>
                    </div>
                  )}
                  {attendee.windaId && (
                    <div>
                      <h3 className="text-sm font-medium text-muted-foreground">WINDA ID</h3>
                      <p className="font-mono">{attendee.windaId}</p>
                    </div>
                  )}
                  {attendee.fatherName && (
                    <div>
                      <h3 className="text-sm font-medium text-muted-foreground">Father Name</h3>
                      <p>{attendee.fatherName}</p>
                    </div>
                  )}
                  {attendee.presentEmployer && (
                    <div>
                      <h3 className="text-sm font-medium text-muted-foreground">Present Employer</h3>
                      <p>{attendee.presentEmployer}</p>
                    </div>
                  )}
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
                    <p className="text-2xl font-bold">{activeCourses?.length || 0}</p>
                  </div>
                  <div className="bg-primary/5 p-4 rounded-lg">
                    <h3 className="text-sm font-medium text-muted-foreground">Courses Completed</h3>
                    <p className="text-2xl font-bold">{activeCourses?.filter(course => course.status === 'COMPLETED').length || 0}</p>
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
                <Button variant="outline" size="sm" onClick={fetchActiveCourses} disabled={isLoadingActiveCourses}>
                  {isLoadingActiveCourses ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <RefreshCw className="h-4 w-4 mr-1" />
                  )}
                  {isLoadingActiveCourses ? "Loading..." : "Refresh"}
                </Button>
              </CardHeader>
              <CardContent>
                <div className="flex items-center gap-2 mb-2">
                  <h2 className="text-xl font-semibold">Courses</h2>
                  <Button
                    variant={showPastCourses ? "outline" : "default"}
                    size="sm"
                    onClick={() => setShowPastCourses(false)}
                  >
                    Active Courses
                  </Button>
                  <Button
                    variant={showPastCourses ? "default" : "outline"}
                    size="sm"
                    onClick={() => setShowPastCourses(true)}
                  >
                    Past Courses
                  </Button>
                </div>
                {showPastCourses ? (
                  <div>
                    {isLoadingPastCourses ? (
                      <div className="flex justify-center items-center py-8">
                        <Loader2 className="h-8 w-8 animate-spin text-primary" />
                      </div>
                    ) : pastCourses.length === 0 ? (
                      <div className="text-center py-8">
                        <Calendar className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                        <h3 className="text-lg font-medium">No past courses</h3>
                        <p className="text-muted-foreground mb-4">
                          This attendee hasn't completed any courses yet.
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
                              <TableHead className="text-center">End Date</TableHead>
                              <TableHead className="text-center">Status</TableHead>
                            </TableRow>
                          </TableHeader>
                          <TableBody>
                            {pastCourses.map((course, idx) => (
                              <TableRow
                                key={course.id}
                                className="cursor-pointer hover:bg-muted/50"
                                onClick={() => router.push(`/active-courses/archive/detail?id=${course.id}`)}
                              >
                                <TableCell className="text-center font-medium">{idx + 1}</TableCell>
                                <TableCell className="text-center font-medium">{course.name}</TableCell>
                                <TableCell className="text-center">{formatDate(course.startDate)}</TableCell>
                                <TableCell className="text-center">{formatDate(course.endDate)}</TableCell>
                                <TableCell className="text-center">
                                  <Badge variant={getStatusBadgeVariant(course.status)}>
                                    {course.status ? course.status.replace('_', ' ') : 'Unknown'}
                                  </Badge>
                                </TableCell>
                              </TableRow>
                            ))}
                          </TableBody>
                        </Table>
                      </div>
                    )}
                  </div>
                ) : (
                  <div>
                    {isLoadingActiveCourses ? (
                      <div className="flex justify-center items-center py-8">
                        <Loader2 className="h-8 w-8 animate-spin text-primary" />
                      </div>
                    ) : activeCourses.length === 0 ? (
                      <div className="text-center py-8">
                        <Calendar className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                        <h3 className="text-lg font-medium">No active courses</h3>
                        <p className="text-muted-foreground mb-4">
                          This attendee is not enrolled in any active courses.
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
                              <TableHead className="text-center">End Date</TableHead>
                              <TableHead className="text-center">Status</TableHead>
                              <TableHead className="text-center">Actions</TableHead>
                            </TableRow>
                          </TableHeader>
                          <TableBody>
                            {activeCourses.map((course, idx) => (
                              <TableRow key={course.id}>
                                <TableCell className="text-center font-medium">{idx + 1}</TableCell>
                                <TableCell className="text-center font-medium">{course.name}</TableCell>
                                <TableCell className="text-center">{formatDate(course.startDate)}</TableCell>
                                <TableCell className="text-center">{formatDate(course.endDate)}</TableCell>
                                <TableCell className="text-center">
                                  <Badge variant={getStatusBadgeVariant(course.status)}>
                                    {course.status ? course.status.replace('_', ' ') : 'Unknown'}
                                  </Badge>
                                </TableCell>
                                <TableCell className="text-center">
                                  <div className="flex justify-center gap-2">
                                    <Button
                                      variant="ghost"
                                      size="icon"
                                      onClick={() => router.push(`/active-courses/detail?id=${course.id}`)}
                                      title="View Course"
                                    >
                                      <Eye className="h-4 w-4" />
                                    </Button>
                                    <Button
                                      variant="ghost"
                                      size="icon"
                                      onClick={() => handleRemoveFromCourse(course)}
                                      title="Remove from Course"
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
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>
          
          {/* Waitlist Tab */}
          <TabsContent value="waitlist" className="mt-6">
            <Card>
              <CardHeader>
                <CardTitle>Waitlist Records</CardTitle>
                <CardDescription>Attendee is currently waitlisted for</CardDescription>
              </CardHeader>
              <CardContent>
                {isLoadingWaitlist ? (
                  <div className="flex justify-center py-8">
                    <Loader2 className="h-6 w-6 animate-spin text-primary" />
                  </div>
                ) : waitlistRecords.length === 0 ? (
                  <div className="flex flex-col items-center justify-center py-8 text-center">
                    <div className="rounded-full bg-muted p-3">
                      <Clock className="h-6 w-6 text-muted-foreground" />
                    </div>
                    <h3 className="mt-4 text-lg font-medium">No Waitlist Records</h3>
                    <p className="mt-2 text-sm text-muted-foreground max-w-sm">
                      This attendee is not currently on any waitlists.
                    </p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {waitlistRecords.map((record) => {
                      // Get the template ID from the record using courseTemplateId
                      const templateId = record.courseTemplateId;
                      const courseTemplate = courseTemplates[templateId]
                      return (
                        <Card key={record.id} className="overflow-hidden">
                          <CardHeader className="bg-muted/50 py-3 px-4">
                            <div className="flex justify-between items-start">
                              <div>
                                <CardTitle className="text-base">
                                  {courseTemplate ? courseTemplate.name : 'Loading course details...'}
                                </CardTitle>
                              </div>
                              <div className={`px-3 py-1 rounded-full text-sm font-medium ${record.status === 'WAITING' ? 'bg-yellow-100 text-yellow-800' : record.status === 'CONFIRMED' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
                                {record.status === 'WAITING' ? 'Waiting' : record.status === 'CONFIRMED' ? 'Confirmed' : 'Cancelled'}
                              </div>
                            </div>
                          </CardHeader>
                          <CardContent className="py-3 px-4">
                            {courseTemplate ? (
                              <>
                                {courseTemplate.description && (
                                  <div className="mb-4">
                                    <p className="text-sm text-muted-foreground">
                                      {courseTemplate.description.length > 150 ? 
                                        `${courseTemplate.description.substring(0, 150)}...` : 
                                        courseTemplate.description}
                                    </p>
                                  </div>
                                )}
                                <div className="flex justify-between items-center">
                                  <div className="flex space-x-2">
                                    <Button 
                                      variant="outline" 
                                      size="sm"
                                      onClick={() => navigateToCourseTemplate(templateId)}
                                    >
                                      <ExternalLink className="h-4 w-4 mr-2" />
                                      View Course
                                    </Button>
                                    <Button 
                                      variant="outline" 
                                      size="sm"
                                      onClick={() => handleEditWaitlist(record)}
                                    >
                                      <Edit className="h-4 w-4 mr-2" />
                                      Update Status
                                    </Button>
                                  </div>
                                </div>
                              </>
                            ) : (
                              <div className="flex flex-col items-center py-3 space-y-2">
                                <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
                                <p className="text-sm text-muted-foreground">Loading course details...</p>
                              </div>
                            )}
                          </CardContent>
                        </Card>
                      )
                    })}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>
          
          {/* Documents Tab */}
          <TabsContent value="documents" className="mt-6">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between">
                <div>
                  <CardTitle>Documents</CardTitle>
                  <CardDescription>Manage attendee documents and files</CardDescription>
                </div>
                <Button onClick={handleAddDocument}>
                  <Plus className="mr-2 h-4 w-4" />
                  Add Document
                </Button>
              </CardHeader>
              <CardContent>
                {isLoadingDocuments ? (
                  <div className="flex justify-center py-8">
                    <Loader2 className="h-8 w-8 animate-spin text-primary" />
                  </div>
                ) : documents.length === 0 ? (
                  <div className="flex flex-col items-center justify-center py-8 text-center">
                    <div className="rounded-full bg-muted p-3">
                      <FileText className="h-6 w-6 text-muted-foreground" />
                    </div>
                    <h3 className="mt-4 text-lg font-medium">No Documents</h3>
                    <p className="mt-2 text-sm text-muted-foreground max-w-sm">
                      This attendee has no documents yet. Add documents such as ID cards, passports, or certificates.
                    </p>
                    <Button onClick={handleAddDocument} className="mt-4">
                      <Plus className="mr-2 h-4 w-4" />
                      Add Document
                    </Button>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {documents.map((doc) => {
                      const files = documentFiles[doc.id] || []
                      const fileCount = files.length
                      const isExpired = doc.expiryDate && new Date(doc.expiryDate) < new Date()
                      
                      return (
                        <div key={doc.id} className="border rounded-lg overflow-hidden">
                          <div className="flex items-center justify-between p-4 bg-muted/30">
                            <div className="flex items-center space-x-4">
                              <div className="bg-primary/10 p-2 rounded-full">
                                <FileText className="h-5 w-5 text-primary" />
                              </div>
                              <div>
                                <h3 className="font-medium">{doc.name}</h3>
                                <p className="text-sm text-muted-foreground">#{doc.number}</p>
                              </div>
                              {doc.isVerified && (
                                <div className="bg-green-100 text-green-800 text-xs px-2 py-1 rounded-full flex items-center">
                                  <Check className="h-3 w-3 mr-1" />
                                  Verified
                                </div>
                              )}
                              {isExpired && (
                                <div className="bg-red-100 text-red-800 text-xs px-2 py-1 rounded-full">
                                  Expired
                                </div>
                              )}
                            </div>
                            <div className="flex items-center space-x-2">
                              <Button 
                                variant="outline" 
                                size="sm"
                                onClick={() => handleEditDocument(doc)}
                              >
                                <Edit className="h-4 w-4" />
                              </Button>
                              <Button 
                                variant="outline" 
                                size="sm"
                                onClick={() => handleDeleteDocument(doc.id)}
                                className="text-destructive hover:text-destructive"
                              >
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            </div>
                          </div>
                          
                          <div className="p-4 border-t">
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
                              {doc.issueDate && (
                                <div>
                                  <h4 className="text-sm font-medium text-muted-foreground">Issue Date</h4>
                                  <p>{format(new Date(doc.issueDate), 'dd/MM/yyyy')}</p>
                                </div>
                              )}
                              {doc.expiryDate && (
                                <div>
                                  <h4 className="text-sm font-medium text-muted-foreground">Expiry Date</h4>
                                  <p>{format(new Date(doc.expiryDate), 'dd/MM/yyyy')}</p>
                                </div>
                              )}
                              <div>
                                <h4 className="text-sm font-medium text-muted-foreground">Files</h4>
                                <p>{fileCount} attachment{fileCount !== 1 ? 's' : ''}</p>
                              </div>
                            </div>
                            
                            {fileCount > 0 ? (
                              <Button 
                                variant="secondary" 
                                onClick={() => handlePreviewDocument(doc.id)}
                              >
                                <ExternalLink className="mr-2 h-4 w-4" />
                                Preview Files
                              </Button>
                            ) : (
                              <p className="text-sm text-muted-foreground">No files attached</p>
                            )}
                          </div>
                        </div>
                      )
                    })}
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
        attendee={attendee || undefined}
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
      
      {/* Waitlist Edit Dialog */}
      {selectedWaitlistRecord && (
        <WaitlistEditDialog
          open={waitlistEditDialogOpen}
          onOpenChange={setWaitlistEditDialogOpen}
          waitlistRecord={selectedWaitlistRecord}
          onSuccess={handleWaitlistSuccess}
        />
      )}
      
      {/* Document Dialog */}
      {attendeeId && (
        <DocumentDialog
          open={documentDialogOpen}
          onOpenChange={setDocumentDialogOpen}
          document={selectedDocument}
          attendeeId={attendeeId}
          trainingCenterId={trainingCenterId}
          onSuccess={handleDocumentSuccess}
        />
      )}
      
      {/* Document Preview Dialog */}
      {attendeeId && selectedDocumentId && (
        <DocumentPreviewDialog
          open={previewDialogOpen}
          onOpenChange={setPreviewDialogOpen}
          attendeeId={attendeeId}
          documentId={selectedDocumentId}
          trainingCenterId={trainingCenterId}
          files={documentFiles[selectedDocumentId] || []}
          onFileDeleted={fetchDocuments}
        />
      )}
    </PageLayout>
  )
}

export default function AttendeeDetailPage() {
  return (
    <Suspense fallback={<div className="flex items-center justify-center h-screen">Loading...</div>}>
      <AttendeeDetailContent />
    </Suspense>
  )
}
