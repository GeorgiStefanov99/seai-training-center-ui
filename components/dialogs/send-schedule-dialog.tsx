"use client"

import React, { useState, useEffect } from "react"
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Checkbox } from "@/components/ui/checkbox"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Loader2, Plus, X, User, Users, Building } from "lucide-react"
import { useAuth } from "@/hooks/useAuth"
import { getPaginatedAttendees } from "@/services/attendeeService"
import { getAllContacts } from "@/services/contactService"
import { sendCourseSchedule, SendCourseScheduleRequest } from "@/services/courseService"
import { Attendee } from "@/types/attendee"
import { Contact } from "@/types/contact"
import { toast } from "sonner"

interface SendScheduleDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
}

export function SendScheduleDialog({ open, onOpenChange }: SendScheduleDialogProps) {
  const { user } = useAuth()
  const trainingCenterId = user?.userId || ""
  
  const [attendees, setAttendees] = useState<Attendee[]>([])
  const [contacts, setContacts] = useState<Contact[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [isSending, setIsSending] = useState(false)
  const [selectedAttendees, setSelectedAttendees] = useState<Record<string, boolean>>({})
  const [selectedContacts, setSelectedContacts] = useState<Record<string, boolean>>({})
  const [customEmails, setCustomEmails] = useState<string[]>([])
  const [newCustomEmail, setNewCustomEmail] = useState("")
  const [searchTerm, setSearchTerm] = useState("")
  const [activeTab, setActiveTab] = useState<'attendees' | 'contacts'>('attendees')
  
  // Fetch attendees and contacts when dialog opens
  useEffect(() => {
    if (open && trainingCenterId) {
      fetchAttendees()
      fetchContacts()
    }
  }, [open, trainingCenterId])
  
  // Reset state when dialog closes
  useEffect(() => {
    if (!open) {
      setSelectedAttendees({})
      setSelectedContacts({})
      setCustomEmails([])
      setNewCustomEmail("")
      setSearchTerm("")
      setActiveTab('attendees')
    }
  }, [open])
  
  // Fetch attendees from API
  const fetchAttendees = async () => {
    if (!trainingCenterId) return
    
    try {
      setIsLoading(true)
      const data = await getPaginatedAttendees(trainingCenterId)
      setAttendees(data.attendees)
    } catch (error) {
      console.error("Error fetching attendees:", error)
      toast.error("Failed to fetch attendees")
    } finally {
      setIsLoading(false)
    }
  }

  // Fetch contacts from API
  const fetchContacts = async () => {
    if (!trainingCenterId) return
    
    try {
      const data = await getAllContacts(trainingCenterId)
      setContacts(data)
    } catch (error) {
      console.error("Error fetching contacts:", error)
      toast.error("Failed to fetch contacts")
    }
  }
  
  // Filter attendees based on search term
  const filteredAttendees = attendees.filter(attendee => {
    const fullName = `${attendee.name || ''} ${attendee.surname || ''}`.toLowerCase()
    const email = attendee.email?.toLowerCase() || ''
    const query = searchTerm.toLowerCase()
    
    return fullName.includes(query) || email.includes(query)
  })

  // Filter contacts based on search term
  const filteredContacts = contacts.filter(contact => {
    const orgName = contact.nameOfOrganization?.toLowerCase() || ''
    const email = contact.email?.toLowerCase() || ''
    const phone = contact.phone?.toLowerCase() || ''
    const query = searchTerm.toLowerCase()
    
    return orgName.includes(query) || email.includes(query) || phone.includes(query)
  })
  
  // Handle attendee selection
  const handleAttendeeSelect = (attendeeId: string, checked: boolean) => {
    setSelectedAttendees(prev => ({
      ...prev,
      [attendeeId]: checked
    }))
  }

  // Handle contact selection
  const handleContactSelect = (contactId: string, checked: boolean) => {
    setSelectedContacts(prev => ({
      ...prev,
      [contactId]: checked
    }))
  }
  
  // Handle adding custom email
  const handleAddCustomEmail = () => {
    if (!newCustomEmail) return
    
    // Simple email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    if (!emailRegex.test(newCustomEmail)) {
      toast.error("Please enter a valid email address")
      return
    }
    
    if (!customEmails.includes(newCustomEmail)) {
      setCustomEmails(prev => [...prev, newCustomEmail])
      setNewCustomEmail("")
    } else {
      toast.error("This email is already added")
    }
  }
  
  // Handle removing custom email
  const handleRemoveCustomEmail = (email: string) => {
    setCustomEmails(prev => prev.filter(e => e !== email))
  }
  
  // Handle sending schedule
  const handleSendSchedule = async () => {
    // Get selected attendee emails
    const selectedAttendeeEmails = Object.entries(selectedAttendees)
      .filter(([_, isSelected]) => isSelected)
      .map(([attendeeId]) => {
        const attendee = attendees.find(a => a.id === attendeeId)
        return attendee?.email || null
      })
      .filter((email): email is string => Boolean(email))

    // Get selected contact emails
    const selectedContactEmails = Object.entries(selectedContacts)
      .filter(([_, isSelected]) => isSelected)
      .map(([contactId]) => {
        const contact = contacts.find(c => c.id === contactId)
        return contact?.email || null
      })
      .filter((email): email is string => Boolean(email))
    
    // Combine all emails
    const allEmails = [...selectedAttendeeEmails, ...selectedContactEmails, ...customEmails]
    
    if (allEmails.length === 0) {
      toast.error("Please select at least one recipient")
      return
    }
    
    try {
      setIsSending(true)
      
      // Format request body
      const recipients: SendCourseScheduleRequest[] = allEmails.map(email => ({ email }))
      
      await sendCourseSchedule(trainingCenterId, recipients)
      
      toast.success("Course schedule sent successfully")
      onOpenChange(false)
    } catch (error) {
      console.error("Error sending course schedule:", error)
      toast.error("Failed to send course schedule")
    } finally {
      setIsSending(false)
    }
  }
  
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px] max-h-[90vh] flex flex-col">
        <DialogHeader>
          <DialogTitle>Send Course Schedule</DialogTitle>
          <DialogDescription>
            Select recipients to send the course schedule to.
          </DialogDescription>
        </DialogHeader>
        
        <div className="space-y-4 flex-1 overflow-hidden">
          {/* Search input */}
          <div className="relative">
            <Input
              placeholder="Search recipients..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full"
              disabled={isLoading}
            />
          </div>
          
          {/* Recipients tabs */}
          <Tabs value={activeTab} onValueChange={(value) => setActiveTab(value as 'attendees' | 'contacts')} className="w-full">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="attendees" className="flex items-center gap-2">
                <User className="h-4 w-4" />
                Attendees
              </TabsTrigger>
              <TabsTrigger value="contacts" className="flex items-center gap-2">
                <Building className="h-4 w-4" />
                Contacts
              </TabsTrigger>
            </TabsList>
            
            <TabsContent value="attendees" className="space-y-2">
              <Label>Select Attendees</Label>
              <ScrollArea className="h-[200px] border rounded-md p-2">
                {isLoading ? (
                  <div className="flex justify-center items-center h-full">
                    <Loader2 className="h-6 w-6 animate-spin text-primary" />
                  </div>
                ) : filteredAttendees.length > 0 ? (
                  <div className="space-y-2">
                    {filteredAttendees.map((attendee) => (
                      <div key={attendee.id} className="flex items-center space-x-2 py-1">
                        <Checkbox
                          id={`attendee-${attendee.id}`}
                          checked={selectedAttendees[attendee.id] || false}
                          onCheckedChange={(checked) => handleAttendeeSelect(attendee.id, checked === true)}
                        />
                        <Label htmlFor={`attendee-${attendee.id}`} className="flex-1 cursor-pointer">
                          <span className="font-medium">{attendee.name || ''} {attendee.surname || ''}</span>
                          <span className="text-sm text-muted-foreground block">{attendee.email || 'No email'}</span>
                        </Label>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-4 text-muted-foreground">
                    {searchTerm ? "No matching attendees found" : "No attendees found"}
                  </div>
                )}
              </ScrollArea>
            </TabsContent>
            
            <TabsContent value="contacts" className="space-y-2">
              <Label>Select Contacts</Label>
              <ScrollArea className="h-[200px] border rounded-md p-2">
                {isLoading ? (
                  <div className="flex justify-center items-center h-full">
                    <Loader2 className="h-6 w-6 animate-spin text-primary" />
                  </div>
                ) : filteredContacts.length > 0 ? (
                  <div className="space-y-2">
                    {filteredContacts.map((contact) => (
                      <div key={contact.id} className="flex items-center space-x-2 py-1">
                        <Checkbox
                          id={`contact-${contact.id}`}
                          checked={selectedContacts[contact.id] || false}
                          onCheckedChange={(checked) => handleContactSelect(contact.id, checked === true)}
                          disabled={!contact.email}
                        />
                        <Label htmlFor={`contact-${contact.id}`} className={`flex-1 cursor-pointer ${!contact.email ? 'opacity-50' : ''}`}>
                          <span className="font-medium">{contact.nameOfOrganization}</span>
                          <span className="text-sm text-muted-foreground block">
                            {contact.email || 'No email available'}
                          </span>
                          {contact.phone && (
                            <span className="text-xs text-muted-foreground block">{contact.phone}</span>
                          )}
                        </Label>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-4 text-muted-foreground">
                    {searchTerm ? "No matching contacts found" : "No contacts found"}
                  </div>
                )}
              </ScrollArea>
            </TabsContent>
          </Tabs>
          
          {/* Custom email input */}
          <div className="space-y-2">
            <Label>Add Custom Recipient</Label>
            <div className="flex space-x-2">
              <Input
                placeholder="Enter email address..."
                value={newCustomEmail}
                onChange={(e) => setNewCustomEmail(e.target.value)}
                className="flex-1"
                onKeyDown={(e) => e.key === 'Enter' && handleAddCustomEmail()}
              />
              <Button type="button" onClick={handleAddCustomEmail} size="sm">
                <Plus className="h-4 w-4" />
              </Button>
            </div>
          </div>
          
          {/* Custom emails list */}
          {customEmails.length > 0 && (
            <div className="space-y-2">
              <Label>Custom Recipients</Label>
              <div className="border rounded-md p-2 max-h-[100px] overflow-y-auto">
                <div className="flex flex-wrap gap-2">
                  {customEmails.map((email, index) => (
                    <div
                      key={index}
                      className="bg-secondary text-secondary-foreground px-2 py-1 rounded-md flex items-center gap-1 text-sm"
                    >
                      <span>{email}</span>
                      <button
                        type="button"
                        onClick={() => handleRemoveCustomEmail(email)}
                        className="text-muted-foreground hover:text-foreground"
                      >
                        <X className="h-3 w-3" />
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}
        </div>
        
        <DialogFooter className="flex-col sm:flex-row gap-2">
          {/* Recipients summary */}
          <div className="flex-1 text-sm text-muted-foreground">
            {(() => {
              const attendeeCount = Object.values(selectedAttendees).filter(Boolean).length
              const contactCount = Object.values(selectedContacts).filter(Boolean).length
              const customCount = customEmails.length
              const total = attendeeCount + contactCount + customCount
              
              if (total === 0) return "No recipients selected"
              
              const parts = []
              if (attendeeCount > 0) parts.push(`${attendeeCount} attendee${attendeeCount !== 1 ? 's' : ''}`)
              if (contactCount > 0) parts.push(`${contactCount} contact${contactCount !== 1 ? 's' : ''}`)
              if (customCount > 0) parts.push(`${customCount} custom email${customCount !== 1 ? 's' : ''}`)
              
              return `Selected: ${parts.join(', ')}`
            })()}
          </div>
          
          <div className="flex gap-2">
            <Button variant="outline" onClick={() => onOpenChange(false)} disabled={isSending}>
              Cancel
            </Button>
            <Button onClick={handleSendSchedule} disabled={isSending}>
              {isSending ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Sending...
                </>
              ) : (
                "Send Schedule"
              )}
            </Button>
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
