"use client"

import React, { useState } from "react"
import { Attendee } from "@/types/attendee"
import { AttendeeForm, AttendeeFormValues } from "@/components/forms/attendee-form"
import { createAttendee, updateAttendee } from "@/services/attendeeService"
import { useAuth } from "@/hooks/useAuth"
import { toast } from "sonner"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
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

interface AttendeeDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  attendee?: Attendee
  onSuccess: () => void
  mode: "create" | "edit"
}

export function AttendeeDialog({
  open,
  onOpenChange,
  attendee,
  onSuccess,
  mode,
}: AttendeeDialogProps) {
  const { user } = useAuth()
  const [isSubmitting, setIsSubmitting] = useState(false)
  const trainingCenterId = user?.userId || ""
  
  const title = mode === "create" ? "Add New Attendee" : "Edit Attendee"
  const description = mode === "create" 
    ? "Add a new attendee to the training center." 
    : "Update the attendee's information."

  const handleSubmit = async (values: AttendeeFormValues) => {
    if (!trainingCenterId) {
      toast.error("Training center ID not found. Please log in again.")
      return
    }

    setIsSubmitting(true)
    try {
      if (mode === "create") {
        await createAttendee(
          { trainingCenterId },
          values
        )
        toast.success("Attendee created successfully")
      } else if (attendee?.id) {
        await updateAttendee(
          { trainingCenterId, attendeeId: attendee.id },
          values
        )
        toast.success("Attendee updated successfully")
      }
      onSuccess()
      onOpenChange(false)
    } catch (error) {
      console.error(`Error ${mode === "create" ? "creating" : "updating"} attendee:`, error)
      toast.error(`Failed to ${mode === "create" ? "create" : "update"} attendee. Please try again.`)
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleCancel = () => {
    onOpenChange(false)
  }

  // Prepare default values for the form
  const defaultValues = attendee
    ? {
        name: attendee.name,
        surname: attendee.surname,
        email: attendee.email,
        telephone: attendee.telephone,
        rank: attendee.rank,
        remark: attendee.remark || "",
      }
    : undefined

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[600px]">
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
          <DialogDescription>{description}</DialogDescription>
        </DialogHeader>
        <AttendeeForm
          defaultValues={defaultValues}
          onSubmit={handleSubmit}
          onCancel={handleCancel}
          isSubmitting={isSubmitting}
        />
      </DialogContent>
    </Dialog>
  )
}

interface DeleteAttendeeDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  attendee?: Attendee
  onConfirm: (attendee: Attendee) => Promise<void>
  isDeleting: boolean
}

export function DeleteAttendeeDialog({
  open,
  onOpenChange,
  attendee,
  onConfirm,
  isDeleting,
}: DeleteAttendeeDialogProps) {
  if (!attendee) return null

  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Delete Attendee</AlertDialogTitle>
          <AlertDialogDescription>
            Are you sure you want to delete {attendee.name} {attendee.surname}? This action cannot be undone.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel disabled={isDeleting}>Cancel</AlertDialogCancel>
          <AlertDialogAction
            onClick={() => attendee && onConfirm(attendee)}
            disabled={isDeleting}
            className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
          >
            {isDeleting ? "Deleting..." : "Delete"}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  )
}
