"use client"

import React, { useState, useEffect, Suspense } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import { PageLayout } from "@/components/page-layout"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { CustomTable } from "@/components/ui/custom-table"
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
  ClipboardList,
  ChevronRight
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
  
  const columns = [
    {
      key: "index",
      header: <div className="text-center w-full">#</div>,
      cell: (_, index) => index + 1,
      cellClassName: "text-center"
    },
    {
      key: "name",
      header: <div className="text-center w-full">Name</div>,
      cell: (row) => `${row.attendeeResponse.name} ${row.attendeeResponse.surname}`,
      cellClassName: "text-center"
    },
    {
      key: "email",
      header: <div className="text-center w-full">Email</div>,
      cell: (row) => row.attendeeResponse.email,
      cellClassName: "text-center"
    },
    {
      key: "telephone",
      header: <div className="text-center w-full">Telephone</div>,
      cell: (row) => row.attendeeResponse.telephone,
      cellClassName: "text-center"
    },
    {
      key: "course",
      header: <div className="text-center w-full">Course</div>,
      cell: (row) => (row.templateId && courseTemplates[row.templateId]?.name) || 'Unknown Course',
      cellClassName: "text-center"
    },
    {
      key: "rank",
      header: <div className="text-center w-full">Rank</div>,
      cell: (row) => {
        const rank = row.attendeeResponse.rank;
        return rank ? rank.replace(/_/g, ' ') : '-';
      },
      cellClassName: "text-center"
    },
    {
      key: "status",
      header: <div className="text-center w-full">Status</div>,
      cell: (row) => (
        <Badge variant={getStatusBadgeVariant(row.status)}>
          {row.status}
        </Badge>
      ),
      cellClassName: "text-center"
    },
    {
      key: "actions",
      header: <div className="text-center w-full">Actions</div>,
      cell: (row) => (
        <div className="flex items-center justify-center gap-1">
          {row.status === "WAITING" && (
            <Button
              variant="ghost"
              size="icon"
              onClick={(e) => { e.stopPropagation(); handleUpdateWaitlistStatus(row, "CONFIRMED") }}
              title="Confirm"
              disabled={updatingWaitlistRecordId === row.id}
            >
              {updatingWaitlistRecordId === row.id ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <ArrowRightCircle className="h-4 w-4 text-green-500" />
              )}
            </Button>
          )}
          {row.status === "CONFIRMED" && (
            <Button
              variant="ghost"
              size="icon"
              onClick={(e) => { e.stopPropagation(); handleUpdateWaitlistStatus(row, "WAITING") }}
              title="Return to Waiting"
              disabled={updatingWaitlistRecordId === row.id}
            >
              {updatingWaitlistRecordId === row.id ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <ArrowLeftCircle className="h-4 w-4 text-amber-500" />
              )}
            </Button>
          )}
          <Button 
            variant="ghost" 
            size="icon" 
            onClick={(e) => { e.stopPropagation(); handleCreateRemark(row) }}
            title="View/Add Remarks"
          >
            <MessageSquare className="h-4 w-4" />
          </Button>
          <Button 
            variant="ghost" 
            size="icon" 
            onClick={(e) => { e.stopPropagation(); handleViewRecord(row) }}
            title="View Course"
          >
            <Eye className="h-4 w-4" />
          </Button>
          <Button 
            variant="ghost" 
            size="icon"
            onClick={(e) => { e.stopPropagation(); handleEditRecord(row) }}
            title="Edit Record"
          >
            <Edit className="h-4 w-4" />
          </Button>
          <Button 
            variant="ghost" 
            size="icon"
            onClick={(e) => { e.stopPropagation(); handleDeleteRecord(row) }}
            className="text-destructive hover:text-destructive"
            title="Delete Record"
          >
            <Trash2 className="h-4 w-4" />
          </Button>
        </div>
      ),
      cellClassName: "text-center"
    }
  ]
  
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
            <CustomTable
              columns={columns}
              data={filteredRecords}
              isLoading={isLoading}
              rowRender={(row, index) => (
                <tr 
                  key={row.id || index} 
                  className={`h-10 cursor-pointer hover:bg-muted/50 transition-colors ${index % 2 === 0 ? '' : 'bg-muted/30'}`}
                  onClick={() => handleViewRecord(row)}
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
                  <p className="text-muted-foreground mb-2">No waitlist records found</p>
                  <Button variant="outline" onClick={() => setCreateDialogOpen(true)}>
                    Add your first waitlist record
                  </Button>
                </div>
              }
            />
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