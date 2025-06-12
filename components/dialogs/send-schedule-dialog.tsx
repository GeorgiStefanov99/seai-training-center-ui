"use client"

import React, { useState, useEffect } from "react"
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Checkbox } from "@/components/ui/checkbox"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Loader2, Plus, X } from "lucide-react"
import { useAuth } from "@/hooks/useAuth"
import { getPaginatedAttendees } from "@/services/attendeeService"
import { sendCourseSchedule, SendCourseScheduleRequest } from "@/services/courseService"
import { Attendee } from "@/types/attendee"
import { toast } from "sonner"

interface SendScheduleDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
}

export function SendScheduleDialog({ open, onOpenChange }: SendScheduleDialogProps) {
  const { user } = useAuth()
  const trainingCenterId = user?.userId || ""
  
  const [attendees, setAttendees] = useState<Attendee[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [isSending, setIsSending] = useState(false)
  const [selectedAttendees, setSelectedAttendees] = useState<Record<string, boolean>>({})
  const [customEmails, setCustomEmails] = useState<string[]>([])
  const [newCustomEmail, setNewCustomEmail] = useState("")
  const [searchTerm, setSearchTerm] = useState("")
  
  // Fetch attendees when dialog opens
  useEffect(() => {
    if (open && trainingCenterId) {
      fetchAttendees()
    }
  }, [open, trainingCenterId])
  
  // Reset state when dialog closes
  useEffect(() => {
    if (!open) {
      setSelectedAttendees({})
      setCustomEmails([])
      setNewCustomEmail("")
      setSearchTerm("")
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
  
  // Filter attendees based on search term
  const filteredAttendees = attendees.filter(attendee => {
    const fullName = `${attendee.name} ${attendee.surname}`.toLowerCase()
    const email = attendee.email.toLowerCase()
    const query = searchTerm.toLowerCase()
    
    return fullName.includes(query) || email.includes(query)
  })
  
  // Handle attendee selection
  const handleAttendeeSelect = (attendeeId: string, checked: boolean) => {
    setSelectedAttendees(prev => ({
      ...prev,
      [attendeeId]: checked
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
        return attendee ? attendee.email : null
      })
      .filter(Boolean) as string[]
    
    // Combine with custom emails
    const allEmails = [...selectedAttendeeEmails, ...customEmails]
    
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
              placeholder="Search attendees..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full"
              disabled={isLoading}
            />
          </div>
          
          {/* Attendees list */}
          <div className="space-y-2">
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
                        <span className="font-medium">{attendee.name} {attendee.surname}</span>
                        <span className="text-sm text-muted-foreground block">{attendee.email}</span>
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
          </div>
          
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
        
        <DialogFooter>
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
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
