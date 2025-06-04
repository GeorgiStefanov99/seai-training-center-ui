"use client"

import React, { useState, useEffect, Suspense } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import { PageLayout } from "@/components/page-layout"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { 
  Plus, 
  Search, 
  Loader2, 
  Filter, 
  Edit, 
  Trash2, 
  Eye, 
  MoreHorizontal,
  MessageSquare,
  ChevronDown,
  ChevronUp,
  ArrowRightCircle,
  ArrowLeftCircle,
  CheckCircle2,
  Clock,
  ClipboardList
} from "lucide-react"
import { useAuth } from "@/hooks/useAuth"
import { getWaitlistRecords, deleteWaitlistRecord, updateWaitlistRecord } from "@/services/waitlistService"
import { getCourseTemplateById } from "@/services/courseTemplateService"
import { WaitlistRecord, CourseTemplate } from "@/types/course-template"
import { toast } from "sonner"
import { DeleteConfirmationDialog } from "@/components/dialogs/delete-confirmation-dialog"
import { WaitlistEditDialog } from "@/components/dialogs/waitlist-edit-dialog"
import { 
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger
} from "@/components/ui/dropdown-menu"
import { Badge } from "@/components/ui/badge"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Remark } from "@/types/remark"
import { getAttendeeRemarks, createRemark, updateRemark, deleteRemark } from "@/services/remarkService"
import { RemarkDialog, DeleteRemarkDialog } from "@/components/dialogs/remark-dialog"
import { format } from "date-fns"
import { WaitlistAddDialog } from "@/components/dialogs/waitlist-add-dialog"

function WaitlistContent() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const { user } = useAuth()
  
  const [waitlistRecords, setWaitlistRecords] = useState<WaitlistRecord[]>([])
  const [filteredRecords, setFilteredRecords] = useState<WaitlistRecord[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState("")
  const [statusFilter, setStatusFilter] = useState<string>("ALL")
  const [templateFilter, setTemplateFilter] = useState<string>("ALL")
  const [courseTemplates, setCourseTemplates] = useState<Record<string, CourseTemplate>>({}) // Map of template ID to template
  const [isLoadingTemplates, setIsLoadingTemplates] = useState(false)
  const [error, setError] = useState<string | null>(null)
  
  // Dialog states
  const [createDialogOpen, setCreateDialogOpen] = useState(false)
  const [editDialogOpen, setEditDialogOpen] = useState(false)
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false)
  const [selectedRecord, setSelectedRecord] = useState<WaitlistRecord | null>(null)
  const [updatingWaitlistRecordId, setUpdatingWaitlistRecordId] = useState<string | null>(null)
  
  // Remark states
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
  
  // Fetch waitlist records
  const fetchWaitlistRecords = async () => {
    if (!trainingCenterId) {
      setError("Training center ID is required")
      setIsLoading(false)
      return
    }
    
    try {
      setIsLoading(true)
      // Force cache invalidation by adding a timestamp parameter
      const timestamp = new Date().getTime()
      console.log('Fetching waitlist records with timestamp:', timestamp)
      
      // Clear existing records before fetching to avoid stale data
      setWaitlistRecords([])
      
      const data = await getWaitlistRecords({ trainingCenterId, timestamp })
      console.log('Fetched waitlist records:', data)
      
      // Log detailed information about each record
      data.forEach(record => {
        console.log(`Record ID: ${record.id}, Status: ${record.status}, Template ID: ${record.templateId}`)
      })
      
      setWaitlistRecords(data)
      setError(null)
      
      // After fetching waitlist records, fetch remarks for each attendee
      if (data.length > 0) {
        await fetchAllWaitlistRemarks(data)
        // Also fetch course templates for all records
        await fetchAllCourseTemplates(data)
      }
    } catch (err) {
      console.error("Error fetching waitlist records:", err)
      setError("Failed to load waitlist records. Please try again.")
    } finally {
      setIsLoading(false)
    }
  }
  
  // Fetch course template details for a specific template ID
  const fetchCourseTemplateDetails = async (templateId: string) => {
    if (!trainingCenterId || !templateId) return null;
    
    try {
      // Check if we already have this template in state
      if (courseTemplates[templateId]) {
        return courseTemplates[templateId];
      }
      
      const template = await getCourseTemplateById({ 
        trainingCenterId, 
        courseTemplateId: templateId 
      });
      
      // Update the templates state
      setCourseTemplates(prev => ({
        ...prev,
        [templateId]: template
      }));
      
      return template;
    } catch (error) {
      console.error(`Error fetching template ${templateId}:`, error);
      return null;
    }
  };
  
  // Fetch course templates for all waitlist records
  const fetchAllCourseTemplates = async (records: WaitlistRecord[]) => {
    if (!trainingCenterId || records.length === 0) return;
    
    setIsLoadingTemplates(true);
    
    try {
      // Get unique template IDs
      const templateIds = Array.from(new Set(
        records
          .map(record => record.courseTemplateId || record.templateId)
          .filter(Boolean) as string[]
      ));
      
      // Fetch each template in parallel
      await Promise.all(templateIds.map(fetchCourseTemplateDetails));
    } catch (error) {
      console.error("Error fetching course templates:", error);
    } finally {
      setIsLoadingTemplates(false);
    }
  };
  
  // Load waitlist records on component mount
  useEffect(() => {
    fetchWaitlistRecords()
  }, [trainingCenterId])
  
  // Filter records when search query, status filter, or template filter changes
  useEffect(() => {
    const filteredRecords = waitlistRecords.filter(record => {
      const fullName = `${record.attendeeResponse.name} ${record.attendeeResponse.surname}`.toLowerCase();
      const email = record.attendeeResponse.email.toLowerCase();
      const rank = record.attendeeResponse.rank.toLowerCase();
      const query = searchQuery.toLowerCase();
      const templateId = record.courseTemplateId || record.templateId;
      
      // Apply status filter
      if (statusFilter !== "ALL" && record.status !== statusFilter) {
        return false;
      }
      
      // Apply template filter
      if (templateFilter !== "ALL" && templateId !== templateFilter) {
        return false;
      }
      
      return fullName.includes(query) || email.includes(query) || rank.includes(query);
    });
    
    setFilteredRecords(filteredRecords);
  }, [waitlistRecords, searchQuery, statusFilter, templateFilter])
  
  // Handle record deletion
  const handleDeleteRecord = (record: WaitlistRecord) => {
    setSelectedRecord(record)
    setDeleteDialogOpen(true)
  }
  
  // Confirm record deletion
  const confirmDeleteRecord = async () => {
    if (!trainingCenterId || !selectedRecord) return
    
    try {
      await deleteWaitlistRecord({
        trainingCenterId,
        waitlistRecordId: selectedRecord.id
      })
      
      toast.success("Waitlist record deleted successfully")
      // First refresh the data
      await fetchWaitlistRecords()
      // Then close the dialog with a slight delay to ensure state updates properly
      setTimeout(() => {
        setDeleteDialogOpen(false)
        setSelectedRecord(null)
      }, 100)
    } catch (error) {
      console.error("Error deleting waitlist record:", error)
      toast.error("Failed to delete waitlist record. Please try again.")
    }
  }
  
  // Handle record edit
  const handleEditRecord = (record: WaitlistRecord) => {
    setSelectedRecord(record)
    // Use setTimeout to ensure state is updated before opening dialog
    setTimeout(() => {
      setEditDialogOpen(true)
    }, 10)
  }
  
  // Handle updating waitlist record status
  const handleUpdateWaitlistStatus = async (record: WaitlistRecord, newStatus: "WAITING" | "CONFIRMED") => {
    if (!trainingCenterId || !record.id) return
    
    try {
      setUpdatingWaitlistRecordId(record.id)
      
      // Prepare the update data
      const updateData = {
        status: newStatus
      }
      
      // Call the API to update the waitlist record
      await updateWaitlistRecord(
        { trainingCenterId, waitlistRecordId: record.id },
        updateData
      )
      
      // Update the local state
      setWaitlistRecords(prev => 
        prev.map(item => 
          item.id === record.id ? { ...item, status: newStatus } : item
        )
      )
      
      // Show success message
      toast.success(`Waitlist record ${newStatus === "CONFIRMED" ? "confirmed" : "returned to waiting"} successfully`)
    } catch (error) {
      console.error(`Error updating waitlist record status:`, error)
      toast.error(`Failed to update waitlist record status`)
    } finally {
      setUpdatingWaitlistRecordId(null)
    }
  }
  
  // Handle view record details
  const handleViewRecord = (record: WaitlistRecord) => {
    router.push(`/course-templates/detail?id=${record.templateId}`)
  }
  
  // Function to fetch remarks for a specific attendee
  const fetchAttendeeRemarks = async (attendeeId: string) => {
    if (!trainingCenterId) return []
    
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
        try {
          const remarks = await fetchAttendeeRemarks(record.attendeeResponse.id)
          remarksMap[record.attendeeResponse.id] = remarks
        } catch (err) {
          console.error(`Error fetching remarks for attendee ${record.attendeeResponse.id}:`, err)
        }
      })
      
      await Promise.all(remarkPromises)
      setWaitlistRemarks(remarksMap)
    } catch (error) {
      console.error('Error fetching all waitlist remarks:', error)
    } finally {
      setIsLoadingRemarks(false)
    }
  }
  
  // Handle opening the create remark dialog or toggling remarks visibility
  const handleCreateRemark = (record: WaitlistRecord) => {
    const attendeeId = record.attendeeResponse.id
    
    // Toggle remarks visibility
    if (expandedRemarkAttendeeId === attendeeId) {
      setExpandedRemarkAttendeeId(null) // Hide remarks if already expanded
    } else {
      setExpandedRemarkAttendeeId(attendeeId) // Show remarks for this attendee
    }
    
    // Set selected attendee for potential remark creation
    setSelectedAttendeeForRemark({
      id: attendeeId,
      name: `${record.attendeeResponse.name} ${record.attendeeResponse.surname}`
    })
  }
  
  // Handle adding a new remark
  const handleAddRemark = () => {
    if (selectedAttendeeForRemark) {
      setCreateRemarkDialogOpen(true)
    }
  }
  
  // Handle editing a remark
  const handleEditRemark = (remark: Remark) => {
    setSelectedRemark(remark)
    setTimeout(() => {
      setEditRemarkDialogOpen(true)
    }, 10)
  }
  
  // Delete functionality has been removed
  // Placeholder functions to maintain code structure
  const handleDeleteRemark = () => {}
  const confirmDeleteRemark = () => {}
  
  // Handle remark success (create/edit)
  const handleRemarkSuccess = async () => {
    if (!selectedAttendeeForRemark) return
    
    // Refresh remarks for this attendee
    const updatedRemarks = await fetchAttendeeRemarks(selectedAttendeeForRemark.id)
    setWaitlistRemarks(prev => ({
      ...prev,
      [selectedAttendeeForRemark.id]: updatedRemarks
    }))
  }
  
  // Format status badge
  const getStatusBadgeVariant = (status: string) => {
    switch (status) {
      case "WAITING":
        return "secondary"
      case "CONFIRMED":
        return "success"
      case "DELETED":
        return "destructive"
      default:
        return "outline"
    }
  }
  
  return (
    <PageLayout>
      <div className="container py-6 space-y-6">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div className="flex flex-col sm:flex-row w-full sm:max-w-xl items-start sm:items-center gap-2">
            <Input
              placeholder="Search waitlist records..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="h-9 w-full sm:w-auto"
            />
            <div className="flex items-center space-x-2">
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger className="h-9 w-[150px]">
                  <SelectValue placeholder="Filter by status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="ALL">All</SelectItem>
                  <SelectItem value="WAITING">Waiting</SelectItem>
                  <SelectItem value="CONFIRMED">Confirmed</SelectItem>
                  <SelectItem value="DELETED">Deleted</SelectItem>
                </SelectContent>
              </Select>
              
              <Select value={templateFilter} onValueChange={setTemplateFilter}>
                <SelectTrigger className="h-9 w-[180px]">
                  <SelectValue placeholder="Filter by course" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="ALL">All Courses</SelectItem>
                  {Object.entries(courseTemplates).map(([id, template]) => (
                    <SelectItem key={id} value={id}>
                      {template.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
          <Button onClick={() => setCreateDialogOpen(true)} className="w-full sm:w-auto">
            <Plus className="mr-2 h-4 w-4" /> Add Waitlist Record
          </Button>
        </div>
        
        <Card>
          <CardHeader className="pb-3">
            <CardTitle>All Waitlist Records</CardTitle>
            <CardDescription>
              View and manage all waitlist records across all course templates
            </CardDescription>
            
            <div className="flex flex-col space-y-4 pt-4">
              <div className="relative flex-1">
                <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input
                  type="search"
                  placeholder="Search by name, email or rank..."
                  className="pl-8"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
              </div>
              
              <div className="flex">
                <Tabs value={statusFilter} onValueChange={setStatusFilter} className="w-full">
                  <TabsList className="grid w-full grid-cols-3 max-w-md">
                    <TabsTrigger value="ALL" className="flex items-center gap-2">
                      <ClipboardList className="h-4 w-4" />
                      All
                    </TabsTrigger>
                    <TabsTrigger value="WAITING" className="flex items-center gap-2">
                      <Clock className="h-4 w-4" />
                      Waiting
                    </TabsTrigger>
                    <TabsTrigger value="CONFIRMED" className="flex items-center gap-2">
                      <CheckCircle2 className="h-4 w-4" />
                      Confirmed
                    </TabsTrigger>
                  </TabsList>
                </Tabs>
              </div>
            </div>
          </CardHeader>
          
          <CardContent>
            {isLoading ? (
              <div className="flex justify-center items-center py-8">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
              </div>
            ) : error ? (
              <div className="text-center py-8 text-muted-foreground">
                {error}
              </div>
            ) : filteredRecords.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                {searchQuery ? "No matching waitlist records found" : "No waitlist records yet"}
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
                      <TableHead>Course</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredRecords.map((record) => (
                      <React.Fragment key={record.id}>
                        <TableRow>
                          <TableCell>
                            {record.attendeeResponse.name} {record.attendeeResponse.surname}
                          </TableCell>
                          <TableCell>{record.attendeeResponse.email}</TableCell>
                          <TableCell>{record.attendeeResponse.telephone || "N/A"}</TableCell>
                          <TableCell>
                            {record.attendeeResponse.rank.replace(/_/g, " ")}
                          </TableCell>
                          <TableCell>
                            {(() => {
                              const templateId = record.courseTemplateId || record.templateId;
                              const template = templateId ? courseTemplates[templateId] : null;
                              return template ? (
                                <div className="flex flex-col">
                                  <span className="font-medium">{template.name}</span>
                                  <span className="text-xs text-muted-foreground">{template.description?.substring(0, 30)}{template.description?.length > 30 ? '...' : ''}</span>
                                </div>
                              ) : (
                                <span className="text-muted-foreground">Loading...</span>
                              );
                            })()}
                          </TableCell>
                          <TableCell>
                            <Badge variant={getStatusBadgeVariant(record.status)}>
                              {record.status}
                            </Badge>
                          </TableCell>
                          <TableCell className="text-right">
                            <div className="flex justify-end space-x-2">
                              {/* Status update buttons */}
                              {record.status === "WAITING" && (
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  onClick={() => handleUpdateWaitlistStatus(record, "CONFIRMED")}
                                  title="Confirm Waitlist Record"
                                  disabled={updatingWaitlistRecordId === record.id}
                                >
                                  {updatingWaitlistRecordId === record.id ? (
                                    <Loader2 className="h-4 w-4 animate-spin" />
                                  ) : (
                                    <ArrowRightCircle className="h-4 w-4 text-green-500" />
                                  )}
                                </Button>
                              )}
                              {record.status === "CONFIRMED" && (
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  onClick={() => handleUpdateWaitlistStatus(record, "WAITING")}
                                  title="Return to Waiting"
                                  disabled={updatingWaitlistRecordId === record.id}
                                >
                                  {updatingWaitlistRecordId === record.id ? (
                                    <Loader2 className="h-4 w-4 animate-spin" />
                                  ) : (
                                    <ArrowLeftCircle className="h-4 w-4 text-amber-500" />
                                  )}
                                </Button>
                              )}
                              <Button 
                                variant="ghost" 
                                size="icon" 
                                onClick={() => handleCreateRemark(record)}
                                title="View/Add Remarks"
                              >
                                <MessageSquare className="h-4 w-4" />
                              </Button>
                              <Button 
                                variant="ghost" 
                                size="icon" 
                                onClick={() => handleViewRecord(record)}
                                title="View Course"
                              >
                                <Eye className="h-4 w-4" />
                              </Button>
                              <Button 
                                variant="ghost" 
                                size="icon"
                                onClick={() => handleEditRecord(record)}
                                title="Edit Record"
                              >
                                <Edit className="h-4 w-4" />
                              </Button>
                              <Button 
                                variant="ghost" 
                                size="icon"
                                onClick={() => handleDeleteRecord(record)}
                                className="text-destructive hover:text-destructive"
                                title="Delete Record"
                              >
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            </div>
                          </TableCell>
                        </TableRow>
                        
                        {/* Remarks section - only shown when expanded */}
                        {expandedRemarkAttendeeId === record.attendeeResponse.id && (
                          <TableRow>
                            <TableCell colSpan={5} className="bg-muted/30 p-4">
                              <div className="space-y-4">
                                <div className="flex justify-between items-center">
                                  <h4 className="text-sm font-medium">Remarks for {record.attendeeResponse.name} {record.attendeeResponse.surname}</h4>
                                  <Button 
                                    size="sm" 
                                    variant="outline" 
                                    onClick={handleAddRemark}
                                    className="flex items-center gap-1"
                                  >
                                    <Plus className="h-3 w-3" /> Add Remark
                                  </Button>
                                </div>
                                
                                {isLoadingRemarks ? (
                                  <div className="flex justify-center py-4">
                                    <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
                                  </div>
                                ) : waitlistRemarks[record.attendeeResponse.id]?.length > 0 ? (
                                  <div className="space-y-3">
                                    {waitlistRemarks[record.attendeeResponse.id].map((remark) => (
                                      <Card key={remark.id} className="overflow-hidden">
                                        <CardHeader className="py-2 px-4 bg-muted/50 flex flex-row justify-between items-center">
                                          <div>
                                            <CardTitle className="text-sm font-medium">Remark</CardTitle>
                                            <CardDescription className="text-xs">
                                              Created: {remark.createdAt ? format(new Date(remark.createdAt), 'MMM d, yyyy HH:mm') : 'Unknown date'}
                                              {remark.lastUpdatedAt && remark.lastUpdatedAt !== remark.createdAt && (
                                                <span className="block">Updated: {format(new Date(remark.lastUpdatedAt), 'MMM d, yyyy HH:mm')}</span>
                                              )}
                                            </CardDescription>
                                          </div>
                                          <div className="flex gap-1">
                                            <Button variant="ghost" size="icon" onClick={() => handleEditRemark(remark)}>
                                              <Edit className="h-3 w-3" />
                                            </Button>
                                          </div>
                                        </CardHeader>
                                        <CardContent className="py-2 px-4">
                                          <p className="text-sm">{remark.remarkText}</p>
                                        </CardContent>
                                      </Card>
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
                    ))}
                  </TableBody>
                </Table>
              </div>
            )}
          </CardContent>
        </Card>
        
        {/* Delete Confirmation Dialog */}
        <DeleteConfirmationDialog
          open={deleteDialogOpen}
          onOpenChange={setDeleteDialogOpen}
          title="Delete Waitlist Record"
          description={`Are you sure you want to delete the waitlist record for ${selectedRecord?.attendeeResponse.name || ''} ${selectedRecord?.attendeeResponse.surname || ''}? This action cannot be undone.`}
          onConfirm={confirmDeleteRecord}
        />
        
        {/* Create Waitlist Record Dialog */}
        <WaitlistAddDialog
          open={createDialogOpen}
          onOpenChange={setCreateDialogOpen}
          onSuccess={fetchWaitlistRecords}
          courseTemplateId={selectedRecord?.courseTemplateId || null}
        />

        {/* Edit Waitlist Record Dialog */}
        {selectedRecord && (
          <WaitlistEditDialog
            open={editDialogOpen}
            onOpenChange={setEditDialogOpen}
            waitlistRecord={selectedRecord}
            onSuccess={fetchWaitlistRecords}
          />
        )}
        
        {/* Create Remark Dialog */}
        {selectedAttendeeForRemark && (
          <RemarkDialog
            open={createRemarkDialogOpen}
            onOpenChange={setCreateRemarkDialogOpen}
            mode="create"
            attendeeId={selectedAttendeeForRemark.id}
            onSuccess={handleRemarkSuccess}
          />
        )}
        
        {/* Edit Remark Dialog */}
        {selectedRemark && selectedAttendeeForRemark && (
          <RemarkDialog
            open={editRemarkDialogOpen}
            onOpenChange={setEditRemarkDialogOpen}
            mode="edit"
            attendeeId={selectedAttendeeForRemark.id}
            remark={selectedRemark}
            onSuccess={handleRemarkSuccess}
          />
        )}
        
        {/* Delete Remark functionality has been removed */}
      </div>
    </PageLayout>
  )
}

export default function WaitlistPage() {
  return (
    <Suspense fallback={<div className="flex items-center justify-center h-screen">Loading...</div>}>
      <WaitlistContent />
    </Suspense>
  )
}