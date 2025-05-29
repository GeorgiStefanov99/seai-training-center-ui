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
import { Loader2, Mail, Phone, Award, Edit } from "lucide-react"
import { toast } from "sonner"
import { AttendeeDialog } from "@/components/dialogs/attendee-dialog"
import { useRouter } from "next/navigation"

export default function AttendeeDetailPage() {
  const searchParams = useSearchParams()
  const router = useRouter()
  const { user } = useAuth()
  const [attendee, setAttendee] = useState<Attendee | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [editDialogOpen, setEditDialogOpen] = useState(false)
  
  // Get training center ID from the authenticated user
  const trainingCenterId = user?.userId || ""
  const attendeeId = searchParams.get("id")

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
          <TabsList className="grid w-full grid-cols-3 lg:w-[400px]">
            <TabsTrigger value="overview">Overview</TabsTrigger>
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
                    <p className="text-2xl font-bold">0</p>
                  </div>
                  <div className="bg-primary/5 p-4 rounded-lg">
                    <h3 className="text-sm font-medium text-muted-foreground">Courses Completed</h3>
                    <p className="text-2xl font-bold">0</p>
                  </div>
                  <div className="bg-primary/5 p-4 rounded-lg">
                    <h3 className="text-sm font-medium text-muted-foreground">Quiz Average Score</h3>
                    <p className="text-2xl font-bold">N/A</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
          
          {/* Courses Tab */}
          <TabsContent value="courses" className="mt-6">
            <Card>
              <CardHeader>
                <CardTitle>Enrolled Courses</CardTitle>
                <CardDescription>Courses the attendee is currently enrolled in or has completed</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="flex flex-col items-center justify-center py-8 text-center">
                  <div className="rounded-full bg-muted p-3">
                    <Award className="h-6 w-6 text-muted-foreground" />
                  </div>
                  <h3 className="mt-4 text-lg font-medium">No Courses Yet</h3>
                  <p className="mt-2 text-sm text-muted-foreground max-w-sm">
                    This attendee is not enrolled in any courses yet. Courses will appear here once they are assigned.
                  </p>
                </div>
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
    </PageLayout>
  )
}
