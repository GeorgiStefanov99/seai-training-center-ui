"use client"

import React, { useState, useEffect, useMemo } from "react"
import { PageLayout } from "@/components/page-layout"
import { CustomTable } from "@/components/ui/custom-table"
import { Column } from "@/types/table"
import { Attendee } from "@/types/attendee"
import { getAttendees, deleteAttendee } from "@/services/attendeeService"
import { getAttendeeEnrolledCourses, getAttendeePastCourses } from "@/services/attendeeCourseService"
import { getWaitlistRecordsByAttendee } from "@/services/waitlistService"
import { createRemark, updateRemark, deleteRemark, getAttendeeRemarks } from "@/services/remarkService"
import { RANK_LABELS } from "@/lib/rank-labels"
import { Button } from "@/components/ui/button"
import { PlusCircle, Pencil, Trash2, Search, ChevronRight, MessageSquare, MoreHorizontal, Edit, Plus, BookOpen, Clock } from "lucide-react"
import { useAuth } from "@/hooks/useAuth"
import { AttendeeDialog, DeleteAttendeeDialog } from "@/components/dialogs/attendee-dialog"
import { RemarkDialog, DeleteRemarkDialog } from "@/components/dialogs/remark-dialog"
import { toast } from "sonner"
import { Input } from "@/components/ui/input"
import { useRouter } from "next/navigation"
import { Remark } from "@/types/remark"
import { Badge } from "@/components/ui/badge"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"

export default function AttendeesPage() {
  const router = useRouter()
  const { user } = useAuth()
  const [attendees, setAttendees] = useState<Attendee[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [searchQuery, setSearchQuery] = useState("")
  
  // Dialog states
  const [createDialogOpen, setCreateDialogOpen] = useState(false)
  const [editDialogOpen, setEditDialogOpen] = useState(false)
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false)
  const [selectedAttendee, setSelectedAttendee] = useState<Attendee | undefined>(undefined)
  const [isDeleting, setIsDeleting] = useState(false)
  
  // Course and waitlist counts
  const [activeCourseCount, setActiveCourseCount] = useState<Record<string, number>>({})
  const [pastCourseCount, setPastCourseCount] = useState<Record<string, number>>({})
  const [waitlistCount, setWaitlistCount] = useState<Record<string, number>>({})
  const [isLoadingCounts, setIsLoadingCounts] = useState(false)
  
  // Remark dialog states
  const [createRemarkDialogOpen, setCreateRemarkDialogOpen] = useState(false)
  const [editRemarkDialogOpen, setEditRemarkDialogOpen] = useState(false)
  const [deleteRemarkDialogOpen, setDeleteRemarkDialogOpen] = useState(false)
  const [selectedRemark, setSelectedRemark] = useState<Remark | undefined>(undefined)
  const [isDeletingRemark, setIsDeletingRemark] = useState(false)
  
  // Remarks data
  const [attendeeRemarks, setAttendeeRemarks] = useState<Record<string, Remark[]>>({})
  const [isLoadingRemarks, setIsLoadingRemarks] = useState(false)
  
  // Get training center ID from the authenticated user
  const trainingCenterId = user?.userId || ""
  
  // Filter attendees based on search query
  const filteredAttendees = useMemo(() => {
    if (!searchQuery.trim()) return attendees;
    
    const query = searchQuery.toLowerCase().trim();
    return attendees.filter(attendee => {
      // Search in all text fields
      return (
        attendee.name?.toLowerCase().includes(query) ||
        attendee.surname?.toLowerCase().includes(query) ||
        attendee.email?.toLowerCase().includes(query) ||
        attendee.telephone?.toLowerCase().includes(query) ||
        RANK_LABELS[attendee.rank]?.toLowerCase().includes(query) ||
        attendee.remark?.toLowerCase().includes(query)
      );
    });
  }, [attendees, searchQuery]);

  // Function to fetch remarks for an attendee
  const fetchAttendeeRemarks = async (attendeeId: string) => {
    if (!trainingCenterId || !attendeeId) return [];
    
    try {
      return await getAttendeeRemarks({ trainingCenterId, attendeeId });
    } catch (error) {
      console.error(`Error fetching remarks for attendee ${attendeeId}:`, error);
      return [];
    }
  };
  
  // Function to fetch all remarks for all attendees
  const fetchAllRemarks = async (attendeesList: Attendee[]) => {
    if (!trainingCenterId || attendeesList.length === 0) return;
    
    setIsLoadingRemarks(true);
    const remarksMap: Record<string, Remark[]> = {};
    
    try {
      // Create an array of promises for fetching remarks for each attendee
      const remarkPromises = attendeesList.map(async (attendee) => {
        if (attendee.id) {
          const remarks = await fetchAttendeeRemarks(attendee.id);
          remarksMap[attendee.id] = remarks;
        }
      });
      
      // Wait for all promises to resolve
      await Promise.all(remarkPromises);
      setAttendeeRemarks(remarksMap);
    } catch (error) {
      console.error('Error fetching all remarks:', error);
    } finally {
      setIsLoadingRemarks(false);
    }
  };

  useEffect(() => {
    const fetchAttendees = async () => {
      // Don't attempt to fetch if no training center ID is available
      if (!trainingCenterId) {
        setIsLoading(false)
        return
      }
      
      try {
        setIsLoading(true)
        const data = await getAttendees(trainingCenterId)
        setAttendees(data)
        setError(null)
        
        // Fetch remarks for all attendees
        await fetchAllRemarks(data);
        
        // Fetch course and waitlist counts for all attendees
        console.log('Calling fetchAllCounts after attendees loaded');
        await fetchAllCounts(data);
      } catch (err) {
        console.error('Error fetching attendees:', err)
        setError('Failed to load attendees. Please try again later.')
        setAttendees([])
      } finally {
        setIsLoading(false)
      }
    }

    fetchAttendees()
  }, [trainingCenterId])

  // Function to fetch all counts for all attendees
  const fetchAllCounts = async (attendeesList: Attendee[]) => {
    if (!trainingCenterId || attendeesList.length === 0) return;
    
    setIsLoadingCounts(true);
    const courseCounts: Record<string, number> = {};
    const pastCourseCounts: Record<string, number> = {};
    const waitlistCounts: Record<string, number> = {};
    
    try {
      // Process each attendee sequentially
      for (const attendee of attendeesList) {
        if (attendee.id) {
          try {
            // Get enrolled courses
            const courses = await getAttendeeEnrolledCourses({
              trainingCenterId,
              attendeeId: attendee.id
            });
            courseCounts[attendee.id] = courses.length;
            
            // Get past courses
            const pastCourses = await getAttendeePastCourses({
              trainingCenterId,
              attendeeId: attendee.id
            });
            pastCourseCounts[attendee.id] = pastCourses.length;
            
            // Get waitlist records
            const waitlistRecords = await getWaitlistRecordsByAttendee({
              trainingCenterId,
              attendeeId: attendee.id
            });
            waitlistCounts[attendee.id] = waitlistRecords.length;
            
          } catch (err) {
            console.error(`Error fetching data for attendee ${attendee.id}:`, err);
            courseCounts[attendee.id] = 0;
            pastCourseCounts[attendee.id] = 0;
            waitlistCounts[attendee.id] = 0;
          }
        }
      }
      
      setActiveCourseCount(courseCounts);
      setPastCourseCount(pastCourseCounts);
      setWaitlistCount(waitlistCounts);
    } catch (error) {
      console.error("Error fetching attendee counts:", error);
    } finally {
      setIsLoadingCounts(false);
    }
  };
  
  // Function to fetch all attendees
  const fetchAttendees = async () => {
    if (!trainingCenterId) {
      setError("Training center ID is required")
      setIsLoading(false)
      return
    }
    
    try {
      setIsLoading(true)
      const data = await getAttendees(trainingCenterId)
      setAttendees(data)
      setError(null)
      
      // Also refresh remarks
      await fetchAllRemarks(data);
      
      // Fetch course and waitlist counts
      await fetchAllCounts(data);
    } catch (err) {
      console.error("Error fetching attendees:", err)
      setError("Failed to load attendees. Please try again.")
    } finally {
      setIsLoading(false)
    }
  }

  // Refresh the attendees list
  const refreshAttendees = async () => {
    if (!trainingCenterId) {
      toast.error("Training center ID is required")
      return
    }
    
    try {
      setIsLoading(true)
      const data = await getAttendees(trainingCenterId)
      setAttendees(data)
      setError(null)
      
      // Also refresh remarks
      await fetchAllRemarks(data);
      
      // Fetch course and waitlist counts
      await fetchAllCounts(data);
      
      toast.success("Attendees list refreshed")
    } catch (err) {
      console.error('Error refreshing attendees:', err)
      toast.error('Failed to refresh attendees. Please try again later.')
    } finally {
      setIsLoading(false)
    }
  }

  // Handler functions
  const handleAddNew = () => {
    setSelectedAttendee(undefined)
    setCreateDialogOpen(true)
  }
  
  // Navigate to attendee detail page
  const navigateToAttendeeDetail = (attendee: Attendee) => {
    console.log('DEBUG - Navigation - Attendee clicked:', attendee)
    if (attendee.id) {
      console.log('DEBUG - Navigation - Navigating to:', `/attendees/attendee-detail?id=${attendee.id}`)
      router.push(`/attendees/attendee-detail?id=${attendee.id}`)
    } else {
      console.log('DEBUG - Navigation - Missing attendee ID, cannot navigate')
    }
  }

  const handleEdit = (attendee: Attendee) => {
    setSelectedAttendee(attendee)
    setEditDialogOpen(true)
  }

  const handleDelete = (attendee: Attendee) => {
    setSelectedAttendee(attendee)
    setDeleteDialogOpen(true)
  }
  
  // Handle delete confirmation
  const handleDeleteConfirm = async (attendee: Attendee) => {
    if (!trainingCenterId) {
      toast.error("Training center ID is required")
      return
    }
    
    setIsDeleting(true)
    try {
      await deleteAttendee({
        trainingCenterId,
        attendeeId: attendee.id
      })
      toast.success(`${attendee.name} ${attendee.surname} has been deleted`)
      
      // First close the dialog
      setDeleteDialogOpen(false)
      
      // Then refresh data
      await refreshAttendees()
    } catch (error) {
      console.error('Error deleting attendee:', error)
      toast.error('Failed to delete attendee. Please try again.')
    } finally {
      setIsDeleting(false)
    }
  }

  // Remark handler functions
  const handleAddRemark = (attendee: Attendee) => {
    // First set the selected attendee
    setSelectedAttendee(attendee)
    // Then open the dialog with a slight delay to ensure state is set
    setTimeout(() => {
      setCreateRemarkDialogOpen(true)
    }, 0)
  }

  const handleEditRemark = (attendee: Attendee, remark: Remark) => {
    // First set the selected attendee and remark
    setSelectedAttendee(attendee)
    setSelectedRemark(remark)
    // Then open the dialog with a slight delay to ensure state is set
    setTimeout(() => {
      setEditRemarkDialogOpen(true)
    }, 0)
  }

  const handleDeleteRemark = (attendee: Attendee, remark: Remark) => {
    setSelectedAttendee(attendee)
    setSelectedRemark(remark)
    setDeleteRemarkDialogOpen(true)
  }

  // Handle delete remark confirmation
  const handleDeleteRemarkConfirm = async (remark: Remark) => {
    if (!trainingCenterId || !selectedAttendee) {
      toast.error("Training center ID and attendee are required")
      return
    }
    
    setIsDeletingRemark(true)
    try {
      await deleteRemark({
        trainingCenterId,
        attendeeId: selectedAttendee.id,
        remarkId: remark.id
      })
      toast.success("Remark has been deleted")
      
      // First close the dialog
      setDeleteRemarkDialogOpen(false)
      
      // Then refresh data
      await refreshAttendees()
      
      // Reset state
      setSelectedRemark(undefined)
    } catch (error) {
      console.error('Error deleting remark:', error)
      toast.error('Failed to delete remark. Please try again.')
    } finally {
      setIsDeletingRemark(false)
    }
  }

  // Define table columns
  const columns: Column[] = [
    {
      key: "index",
      header: <div className="text-center w-full">#</div>,
      cell: (_, index) => index + 1,
      cellClassName: "text-center"
    },
    {
      key: "name",
      header: <div className="text-center w-full">Name</div>,
      accessorKey: "name",
      cellClassName: "text-center"
    },
    {
      key: "surname",
      header: <div className="text-center w-full">Surname</div>,
      accessorKey: "surname",
      cellClassName: "text-center"
    },
    {
      key: "email",
      header: <div className="text-center w-full">Email</div>,
      accessorKey: "email",
      cellClassName: "text-center"
    },
    {
      key: "telephone",
      header: <div className="text-center w-full">Telephone</div>,
      accessorKey: "telephone",
      cellClassName: "text-center"
    },
    {
      key: "rank",
      header: <div className="text-center w-full">Rank</div>,
      cell: (row: Attendee) => RANK_LABELS[row.rank] || row.rank,
      cellClassName: "text-center"
    },
    {
      key: "courses",
      header: <div className="text-center w-full">Active Courses</div>,
      cell: (row: Attendee) => {
        if (!row.id) {
          return <span className="text-muted-foreground text-xs text-center w-full block">No ID</span>;
        }
        if (isLoadingCounts) {
          return <span className="text-muted-foreground text-xs text-center w-full block">Loading...</span>;
        }
        const count = activeCourseCount[row.id] || 0;
        return (
          <div className="flex justify-center w-full">
            <Badge variant={count > 0 ? "default" : "outline"} className="whitespace-nowrap">
              <BookOpen className="h-3 w-3 mr-1" />
              {count}
            </Badge>
          </div>
        );
      },
      cellClassName: "text-center"
    },
    {
      key: "pastCourses",
      header: <div className="text-center w-full">Past Courses</div>,
      cell: (row: Attendee) => {
        if (!row.id) {
          return <span className="text-muted-foreground text-xs text-center w-full block">No ID</span>;
        }
        if (isLoadingCounts) {
          return <span className="text-muted-foreground text-xs text-center w-full block">Loading...</span>;
        }
        const count = pastCourseCount[row.id] || 0;
        return (
          <div className="flex justify-center w-full">
            <Badge variant={count > 0 ? "secondary" : "outline"} className="whitespace-nowrap">
              <BookOpen className="h-3 w-3 mr-1" />
              {count}
            </Badge>
          </div>
        );
      },
      cellClassName: "text-center"
    },
    {
      key: "waitlist",
      header: <div className="text-center w-full">Waitlist</div>,
      cell: (row: Attendee) => {
        if (!row.id) {
          return <span className="text-muted-foreground text-xs text-center w-full block">No ID</span>;
        }
        
        if (isLoadingCounts) {
          return <span className="text-muted-foreground text-xs text-center w-full block">Loading...</span>;
        }
        
        const count = waitlistCount[row.id] || 0;
        return (
          <Badge variant={count > 0 ? "success" : "outline"} className="whitespace-nowrap">
            <Clock className="h-3 w-3 mr-1" />
            {count}
          </Badge>
        );
      },
      cellClassName: "text-center"
    },
    {
      key: "remarks",
      header: <div className="text-center w-full">Remarks</div>,
      cell: (row: Attendee) => {
        if (!row.id) {
          return <span className="text-muted-foreground text-xs text-center w-full block">No ID</span>;
        }
        
        if (isLoadingRemarks) {
          return <span className="text-muted-foreground text-xs text-center w-full block">Loading...</span>;
        }
        
        const remarks = attendeeRemarks[row.id] || [];
        
        if (remarks.length === 0) {
          return <span className="text-muted-foreground text-xs text-center w-full block">No remarks</span>;
        }
        
        // Show the most recent remark with a count
        const latestRemark = remarks[0];
        return (
          <div className="max-w-[200px] truncate text-center w-full">
            <span className="text-xs font-medium">
              {remarks.length > 1 ? `(${remarks.length}) ` : ''}
              {latestRemark.remarkText}
            </span>
          </div>
        );
      },
      cellClassName: "text-center"
    },
    {
      key: "actions",
      header: <div className="text-center w-full">Actions</div>,
      cell: (row: Attendee) => {
        const remarks = row.id ? attendeeRemarks[row.id] || [] : [];
        
        return (
          <div className="flex space-x-2 justify-center">
            <Button variant="ghost" size="icon" onClick={() => handleEdit(row)}>
              <Pencil className="h-4 w-4" />
            </Button>
            
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="icon">
                  <MessageSquare className="h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-[200px]">
                <DropdownMenuLabel>Manage Remarks</DropdownMenuLabel>
                <DropdownMenuItem onClick={() => handleAddRemark(row)}>
                  <Plus className="mr-2 h-4 w-4" />
                  Add new remark
                </DropdownMenuItem>
                
                {remarks.length > 0 && (
                  <>
                    <DropdownMenuSeparator />
                    <DropdownMenuLabel className="text-xs text-muted-foreground">
                      Edit existing remarks
                    </DropdownMenuLabel>
                    
                    {remarks.slice(0, 5).map((remark) => (
                      <DropdownMenuItem 
                        key={remark.id} 
                        onClick={() => handleEditRemark(row, remark)}
                        className="flex justify-between items-center"
                      >
                        <span className="truncate max-w-[120px] text-xs">
                          {remark.remarkText}
                        </span>
                        <Edit className="h-3 w-3 ml-2 flex-shrink-0" />
                      </DropdownMenuItem>
                    ))}
                    
                    {remarks.length > 5 && (
                      <DropdownMenuItem 
                        onClick={() => handleAddRemark(row)}
                        className="text-xs text-muted-foreground"
                      >
                        View all {remarks.length} remarks...
                      </DropdownMenuItem>
                    )}
                  </>
                )}
              </DropdownMenuContent>
            </DropdownMenu>
            
            <Button variant="ghost" size="icon" onClick={() => handleDelete(row)}>
              <Trash2 className="h-4 w-4" />
            </Button>
          </div>
        );
      },
      cellClassName: "text-center"
    }
  ]

  return (
    <PageLayout title="Attendees">
      <div className="space-y-6">
        {error && (
          <div className="bg-destructive/10 text-destructive p-4 rounded-md">
            {error}
          </div>
        )}
        
        <div className="flex flex-col space-y-4">
          <div className="flex justify-between items-center">
            <div>
              <h2 className="text-xl font-semibold">Manage Attendees</h2>
              <p className="text-muted-foreground">View and manage all attendees in the training center</p>
            </div>
            <Button onClick={handleAddNew}>
              <PlusCircle className="mr-2 h-4 w-4" />
              Add Attendee
            </Button>
          </div>
          
          {/* Search bar */}
          <div className="relative">
            <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search attendees by name, email, rank, etc..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-8 w-full md:w-[300px]"
            />
          </div>
        </div>
        
        <CustomTable
          columns={columns}
          data={filteredAttendees}
          isLoading={isLoading}
          rowRender={(row, index) => (
            <tr 
              key={row.id || index} 
              className={`h-10 cursor-pointer hover:bg-muted/50 transition-colors ${index % 2 === 0 ? '' : 'bg-muted/30'}`}
              onClick={() => navigateToAttendeeDetail(row)}
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
              <p className="text-muted-foreground mb-2">No attendees found</p>
              <Button variant="outline" onClick={handleAddNew}>
                Add your first attendee
              </Button>
            </div>
          }
        />
        
        {/* Create Attendee Dialog */}
        <AttendeeDialog
          open={createDialogOpen}
          onOpenChange={setCreateDialogOpen}
          onSuccess={refreshAttendees}
          mode="create"
        />
        
        {/* Edit Attendee Dialog */}
        <AttendeeDialog
          open={editDialogOpen}
          onOpenChange={setEditDialogOpen}
          attendee={selectedAttendee}
          onSuccess={refreshAttendees}
          mode="edit"
        />
        
        {/* Delete Attendee Dialog */}
        <DeleteAttendeeDialog
          open={deleteDialogOpen}
          onOpenChange={setDeleteDialogOpen}
          attendee={selectedAttendee}
          onConfirm={handleDeleteConfirm}
          isDeleting={isDeleting}
        />

        {/* Create Remark Dialog */}
        {selectedAttendee && (
          <RemarkDialog
            open={createRemarkDialogOpen}
            onOpenChange={setCreateRemarkDialogOpen}
            mode="create"
            attendeeId={selectedAttendee.id}
            onSuccess={refreshAttendees}
          />
        )}
        
        {/* Edit Remark Dialog */}
        {selectedAttendee && selectedRemark && (
          <RemarkDialog
            open={editRemarkDialogOpen}
            onOpenChange={setEditRemarkDialogOpen}
            mode="edit"
            attendeeId={selectedAttendee.id}
            remark={selectedRemark}
            onSuccess={refreshAttendees}
          />
        )}
        
        {/* Delete Remark Dialog */}
        {selectedRemark && (
          <DeleteRemarkDialog
            open={deleteRemarkDialogOpen}
            onOpenChange={setDeleteRemarkDialogOpen}
            remark={selectedRemark}
            onConfirm={handleDeleteRemarkConfirm}
            isDeleting={isDeletingRemark}
          />
        )}
      </div>
    </PageLayout>
  )
}
