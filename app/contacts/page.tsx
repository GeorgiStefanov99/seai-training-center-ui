"use client"

import React, { useState, useEffect, useMemo } from "react"
import { PageLayout } from "@/components/page-layout"
import { CustomTable } from "@/components/ui/custom-table"
import { Column } from "@/types/table"
import { Contact } from '@/types/contact';
import { getAllContacts, createContact, updateContact, deleteContact } from "@/services/contactService"
import { Button } from "@/components/ui/button"
import { PlusCircle, Pencil, Trash2, Search, Mail, Phone, Building } from "lucide-react"
import { useAuth } from "@/hooks/useAuth"
import { ContactDialog, DeleteContactDialog } from "@/components/dialogs/contact-dialog"
import { toast } from "sonner"
import { Input } from "@/components/ui/input"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { MoreHorizontal, Edit } from "lucide-react"

export default function ContactsPage() {
  const { user } = useAuth()
  const [contacts, setContacts] = useState<Contact[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [searchQuery, setSearchQuery] = useState("")
  
  // Dialog states
  const [createDialogOpen, setCreateDialogOpen] = useState(false)
  const [editDialogOpen, setEditDialogOpen] = useState(false)
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false)
  const [selectedContact, setSelectedContact] = useState<Contact | undefined>(undefined)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [isDeleting, setIsDeleting] = useState(false)
  
  // Get training center ID from the authenticated user
  const trainingCenterId = user?.userId || ""
  
  // Pagination state (client-side)
  const [currentPage, setCurrentPage] = useState(1)
  const ITEMS_PER_PAGE = 50
  
  // Client-side filtering for search
  const filteredContacts = useMemo(() => {
    if (!searchQuery.trim()) return contacts;
    
    const query = searchQuery.toLowerCase().trim();
    return contacts.filter(contact => {
      return (
        contact.nameOfOrganization?.toLowerCase().includes(query) ||
        contact.firstName?.toLowerCase().includes(query) ||
        contact.lastName?.toLowerCase().includes(query) ||
        contact.position?.toLowerCase().includes(query) ||
        contact.email?.toLowerCase().includes(query) ||
        contact.phone?.toLowerCase().includes(query) ||
        false
      );
    });
  }, [contacts, searchQuery]);
  
  // Apply pagination to filtered contacts
  const paginatedContacts = useMemo(() => {
    const startIndex = (currentPage - 1) * ITEMS_PER_PAGE;
    const endIndex = startIndex + ITEMS_PER_PAGE;
    return filteredContacts.slice(startIndex, endIndex);
  }, [filteredContacts, currentPage, ITEMS_PER_PAGE]);
  
  // Calculate total pages
  const totalPages = useMemo(() => {
    return Math.ceil(filteredContacts.length / ITEMS_PER_PAGE);
  }, [filteredContacts, ITEMS_PER_PAGE]);

  // Fetch contacts
  useEffect(() => {
    const fetchContacts = async () => {
      if (!trainingCenterId) {
        setError("Training center ID is required")
        setIsLoading(false)
        return
      }
      
      try {
        setIsLoading(true)
        const response = await getAllContacts(trainingCenterId)
        setContacts(response)
        setError(null)
      } catch (err) {
        console.error('Error fetching contacts:', err)
        setError('Failed to load contacts. Please try again later.')
        setContacts([])
      } finally {
        setIsLoading(false)
      }
    }

    fetchContacts()
  }, [trainingCenterId])

  // Refresh contacts list
  const refreshContacts = async () => {
    if (!trainingCenterId) return
    
    try {
      const response = await getAllContacts(trainingCenterId)
      setContacts(response)
      setError(null)
    } catch (err) {
      console.error('Error refreshing contacts:', err)
      setError('Failed to refresh contacts')
      throw err // Re-throw to allow calling function to handle
    }
  }

  // Handle add new contact
  const handleAddNew = () => {
    setSelectedContact(undefined)
    setCreateDialogOpen(true)
  }

  // Handle edit contact
  const handleEdit = (contact: Contact) => {
    setSelectedContact(contact)
    setEditDialogOpen(true)
  }

  // Handle delete contact
  const handleDelete = (contact: Contact) => {
    setSelectedContact(contact)
    setDeleteDialogOpen(true)
  }

  // Handle create contact
  const handleCreateSubmit = async (data: any) => {
    try {
      setIsSubmitting(true)
      
      // Create the contact
      await createContact({ trainingCenterId }, data)
      
      // Refresh contacts first
      await refreshContacts()
      
      // Show success message and close dialog after successful creation and refresh
      toast.success('Contact created successfully')
      setCreateDialogOpen(false)
    } catch (error) {
      console.error('Error creating contact:', error)
      toast.error('Failed to create contact')
    } finally {
      setIsSubmitting(false)
    }
  }

  // Handle update contact
  const handleUpdateSubmit = async (data: any) => {
    if (!selectedContact) return
    
    try {
      setIsSubmitting(true)
      
      // Update the contact
      await updateContact({ trainingCenterId, contactId: selectedContact.id }, data)
      
      // Show success message
      toast.success('Contact updated successfully')
      
      // Refresh the page to ensure clean state
      window.location.reload()
      
    } catch (error) {
      console.error('Error updating contact:', error)
      toast.error('Failed to update contact')
      setIsSubmitting(false)
    }
    // Note: No finally block needed since page will refresh on success
  }

  // Handle delete confirmation
  const handleDeleteConfirm = async () => {
    if (!selectedContact) return
    
    try {
      setIsDeleting(true)
      
      // Delete the contact
      await deleteContact({ trainingCenterId, contactId: selectedContact.id })
      
      // Refresh contacts first
      await refreshContacts()
      
      // Show success message and close dialog after successful deletion and refresh
      toast.success('Contact deleted successfully')
      setDeleteDialogOpen(false)
      setSelectedContact(undefined)
    } catch (error) {
      console.error('Error deleting contact:', error)
      toast.error('Failed to delete contact')
    } finally {
      setIsDeleting(false)
    }
  }

  // Define table columns
  const columns: Column[] = [
    {
      key: "nameOfOrganization",
      header: "Organization",
      accessorKey: "nameOfOrganization",
      cell: (row: Contact) => (
        <div className="font-medium">{row.nameOfOrganization}</div>
      ),
    },
    {
      key: "contactPerson",
      header: "Contact Person",
      accessorKey: "firstName",
      cell: (row: Contact) => {
        const firstName = row.firstName;
        const lastName = row.lastName;
        if (firstName || lastName) {
          return (
            <div>
              {[firstName, lastName].filter(Boolean).join(" ")}
            </div>
          );
        }
        return <span className="text-muted-foreground">Not provided</span>;
      },
    },
    {
      key: "position",
      header: "Position",
      accessorKey: "position",
      cell: (row: Contact) => {
        const position = row.position;
        if (position) {
          return <div>{position}</div>;
        }
        return <span className="text-muted-foreground">Not provided</span>;
      },
    },
    {
      key: "email",
      header: "Email",
      accessorKey: "email",
      cell: (row: Contact) => (
        <div className="flex items-center">
          {row.email ? (
            <>
              <Mail className="mr-2 h-4 w-4 text-muted-foreground" />
              {row.email}
            </>
          ) : (
            <span className="text-muted-foreground">Not provided</span>
          )}
        </div>
      ),
    },
    {
      key: "phone",
      header: "Phone",
      accessorKey: "phone",
      cell: (row: Contact) => (
        <div className="flex items-center gap-2">
          <Phone className="h-4 w-4 text-muted-foreground" />
          <span>{row.phone || "-"}</span>
        </div>
      ),
    },
    {
      key: "actions",
      header: "Actions",
      cell: (row: Contact) => (
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" className="h-8 w-8 p-0">
              <span className="sr-only">Open menu</span>
              <MoreHorizontal className="h-4 w-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuLabel>Actions</DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={() => handleEdit(row)}>
              <Edit className="mr-2 h-4 w-4" />
              Edit
            </DropdownMenuItem>
            <DropdownMenuItem 
              onClick={() => handleDelete(row)}
              className="text-destructive"
            >
              <Trash2 className="mr-2 h-4 w-4" />
              Delete
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      ),
    },
  ]

  if (error) {
    return (
      <PageLayout title="Contacts">
        <div className="flex h-40 w-full items-center justify-center">
          <p className="text-sm text-destructive">{error}</p>
        </div>
      </PageLayout>
    );
  }

  return (
    <PageLayout title="Contacts">
      <div className="space-y-4">
        <p className="text-muted-foreground">Manage your training center contacts</p>
        
        {/* Header with search and add button */}
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <div className="relative">
              <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search contacts..."
                value={searchQuery}
                onChange={(e) => {
                  setSearchQuery(e.target.value)
                  setCurrentPage(1) // Reset to first page when searching
                }}
                className="pl-8 w-[250px]"
              />
            </div>
          </div>
          <Button onClick={handleAddNew}>
            <PlusCircle className="mr-2 h-4 w-4" />
            Add Contact
          </Button>
        </div>

        {/* Contacts table */}
        <CustomTable
          data={paginatedContacts}
          columns={columns}
          isLoading={isLoading}
          emptyState={<p className="text-sm text-muted-foreground">No contacts found</p>}
        />
        
        {/* Pagination info */}
        {filteredContacts.length > 0 && (
          <div className="flex justify-between items-center text-sm text-muted-foreground">
            <div>
              Showing {((currentPage - 1) * ITEMS_PER_PAGE) + 1} to {Math.min(currentPage * ITEMS_PER_PAGE, filteredContacts.length)} of {filteredContacts.length} contacts
            </div>
            {totalPages > 1 && (
              <div className="flex items-center space-x-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
                  disabled={currentPage === 1}
                >
                  Previous
                </Button>
                <span className="px-2">Page {currentPage} of {totalPages}</span>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setCurrentPage(Math.min(totalPages, currentPage + 1))}
                  disabled={currentPage === totalPages}
                >
                  Next
                </Button>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Create Contact Dialog */}
      <ContactDialog
        open={createDialogOpen}
        onOpenChange={setCreateDialogOpen}
        onSubmit={handleCreateSubmit}
        isLoading={isSubmitting}
        mode="create"
      />

      {/* Edit Contact Dialog */}
      <ContactDialog
        open={editDialogOpen}
        onOpenChange={(open) => {
          setEditDialogOpen(open)
          if (!open) {
            // Clear selected contact when dialog closes to prevent state issues
            setSelectedContact(undefined)
          }
        }}
        contact={selectedContact}
        onSubmit={handleUpdateSubmit}
        isLoading={isSubmitting}
        mode="edit"
      />

      {/* Delete Contact Dialog */}
      <DeleteContactDialog
        open={deleteDialogOpen}
        onOpenChange={setDeleteDialogOpen}
        contact={selectedContact}
        onConfirm={handleDeleteConfirm}
        isLoading={isDeleting}
      />
    </PageLayout>
  )
} 