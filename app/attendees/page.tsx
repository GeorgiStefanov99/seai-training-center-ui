"use client"

import React, { useState, useEffect, useMemo } from "react"
import { PageLayout } from "@/components/page-layout"
import { CustomTable } from "@/components/ui/custom-table"
import { Column } from "@/types/table"
import { Attendee } from "@/types/attendee"
import { getAttendees, deleteAttendee } from "@/services/attendeeService"
import { RANK_LABELS } from "@/lib/rank-labels"
import { Button } from "@/components/ui/button"
import { PlusCircle, Pencil, Trash2, Search, ChevronRight } from "lucide-react"
import { useAuth } from "@/hooks/useAuth"
import { AttendeeDialog, DeleteAttendeeDialog } from "@/components/dialogs/attendee-dialog"
import { toast } from "sonner"
import { Input } from "@/components/ui/input"
import { useRouter } from "next/navigation"

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

  // Define table columns
  const columns: Column[] = [
    {
      key: "index",
      header: "#",
      cell: (_, index) => index + 1
    },
    {
      key: "name",
      header: "Name",
      accessorKey: "name"
    },
    {
      key: "surname",
      header: "Surname",
      accessorKey: "surname"
    },
    {
      key: "email",
      header: "Email",
      accessorKey: "email"
    },
    {
      key: "telephone",
      header: "Telephone",
      accessorKey: "telephone"
    },
    {
      key: "rank",
      header: "Rank",
      cell: (row: Attendee) => RANK_LABELS[row.rank] || row.rank
    },
    {
      key: "remark",
      header: "Remark",
      accessorKey: "remark"
    },
    {
      key: "actions",
      header: "Actions",
      cell: (row: Attendee) => (
        <div className="flex space-x-2">
          <Button variant="ghost" size="icon" onClick={() => handleEdit(row)}>
            <Pencil className="h-4 w-4" />
          </Button>
          <Button variant="ghost" size="icon" onClick={() => handleDelete(row)}>
            <Trash2 className="h-4 w-4" />
          </Button>
        </div>
      )
    }
  ]

  // Refresh the attendees list
  const refreshAttendees = async () => {
    if (!trainingCenterId) return
    
    try {
      setIsLoading(true)
      const data = await getAttendees(trainingCenterId)
      setAttendees(data)
      setError(null)
    } catch (err) {
      console.error('Error refreshing attendees:', err)
      toast.error('Failed to refresh attendees list')
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
    if (!trainingCenterId || !attendee.id) return
    
    setIsDeleting(true)
    try {
      await deleteAttendee({
        trainingCenterId,
        attendeeId: attendee.id
      })
      toast.success(`${attendee.name} ${attendee.surname} has been deleted`)
      await refreshAttendees()
      setDeleteDialogOpen(false)
    } catch (error) {
      console.error('Error deleting attendee:', error)
      toast.error('Failed to delete attendee. Please try again.')
    } finally {
      setIsDeleting(false)
    }
  }

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
              className="h-10 cursor-pointer hover:bg-muted/50 transition-colors"
              onClick={() => navigateToAttendeeDetail(row)}
            >
              {columns.map((column) => (
                <td key={column.key} className="px-2 py-1 text-xs">
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
      </div>
    </PageLayout>
  )
}
