"use client"

import React, { useState, useEffect } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import { PageLayout } from "@/components/page-layout"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
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
  MoreHorizontal 
} from "lucide-react"
import { useAuth } from "@/hooks/useAuth"
import { getWaitlistRecords, deleteWaitlistRecord } from "@/services/waitlistService"
import { WaitlistRecord } from "@/types/course-template"
import { toast } from "sonner"
import { DeleteConfirmationDialog } from "@/components/dialogs/delete-confirmation-dialog"
import { WaitlistRecordDialog } from "@/components/dialogs/waitlist-record-dialog"
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

export default function WaitlistPage() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const { user } = useAuth()
  
  const [waitlistRecords, setWaitlistRecords] = useState<WaitlistRecord[]>([])
  const [filteredRecords, setFilteredRecords] = useState<WaitlistRecord[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState("")
  const [statusFilter, setStatusFilter] = useState<string>("ALL")
  const [error, setError] = useState<string | null>(null)
  
  // Dialog states
  const [createDialogOpen, setCreateDialogOpen] = useState(false)
  const [editDialogOpen, setEditDialogOpen] = useState(false)
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false)
  const [selectedRecord, setSelectedRecord] = useState<WaitlistRecord | null>(null)
  
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
      const data = await getWaitlistRecords({ trainingCenterId })
      setWaitlistRecords(data)
      setError(null)
    } catch (err) {
      console.error("Error fetching waitlist records:", err)
      setError("Failed to load waitlist records. Please try again.")
    } finally {
      setIsLoading(false)
    }
  }
  
  // Load waitlist records on component mount
  useEffect(() => {
    fetchWaitlistRecords()
  }, [trainingCenterId])
  
  // Filter records when search query or status filter changes
  useEffect(() => {
    const filteredRecords = waitlistRecords.filter(record => {
      const fullName = `${record.attendeeResponse.name} ${record.attendeeResponse.surname}`.toLowerCase();
      const email = record.attendeeResponse.email.toLowerCase();
      const rank = record.attendeeResponse.rank.toLowerCase();
      const query = searchQuery.toLowerCase();
      
      // Apply status filter
      if (statusFilter !== "ALL" && record.status !== statusFilter) {
        return false;
      }
      
      return fullName.includes(query) || email.includes(query) || rank.includes(query);
    });
    
    setFilteredRecords(filteredRecords)
  }, [searchQuery, statusFilter, waitlistRecords])
  
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
      fetchWaitlistRecords()
    } catch (err) {
      console.error("Error deleting waitlist record:", err)
      toast.error("Failed to delete waitlist record. Please try again.")
      throw err
    }
  }
  
  // Handle record edit
  const handleEditRecord = (record: WaitlistRecord) => {
    setSelectedRecord(record)
    setEditDialogOpen(true)
  }
  
  // Handle view record details
  const handleViewRecord = (record: WaitlistRecord) => {
    // Navigate to course template detail page
    router.push(`/course-templates/detail?id=${record.templateId}`)
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
            
            <div className="flex flex-col sm:flex-row gap-3 pt-4">
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
                      <TableHead>Rank</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredRecords.map((record) => (
                      <TableRow key={record.id}>
                        <TableCell>
                          {record.attendeeResponse.name} {record.attendeeResponse.surname}
                        </TableCell>
                        <TableCell>{record.attendeeResponse.email}</TableCell>
                        <TableCell>
                          {record.attendeeResponse.rank.replace(/_/g, " ")}
                        </TableCell>
                        <TableCell>
                          <Badge variant={getStatusBadgeVariant(record.status)}>
                            {record.status}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-right">
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button variant="ghost" size="icon">
                                <MoreHorizontal className="h-4 w-4" />
                                <span className="sr-only">Open menu</span>
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                              <DropdownMenuItem onClick={() => handleViewRecord(record)}>
                                <Eye className="mr-2 h-4 w-4" />
                                View Course
                              </DropdownMenuItem>
                              <DropdownMenuItem onClick={() => handleEditRecord(record)}>
                                <Edit className="mr-2 h-4 w-4" />
                                Edit Record
                              </DropdownMenuItem>
                              <DropdownMenuItem 
                                onClick={() => handleDeleteRecord(record)}
                                className="text-destructive focus:text-destructive"
                              >
                                <Trash2 className="mr-2 h-4 w-4" />
                                Delete Record
                              </DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </TableCell>
                      </TableRow>
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
        <WaitlistRecordDialog
          open={createDialogOpen}
          onOpenChange={setCreateDialogOpen}
          mode="create"
          onSuccess={fetchWaitlistRecords}
        />
        
        {/* Edit Waitlist Record Dialog */}
        {selectedRecord && (
          <WaitlistRecordDialog
            open={editDialogOpen}
            onOpenChange={setEditDialogOpen}
            mode="edit"
            record={selectedRecord}
            onSuccess={fetchWaitlistRecords}
          />
        )}
      </div>
    </PageLayout>
  )
}
