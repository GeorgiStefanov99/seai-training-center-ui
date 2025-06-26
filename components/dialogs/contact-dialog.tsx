"use client"

import React, { useEffect } from "react"
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
import { ContactForm } from "@/components/forms/contact-form"
import { Contact } from "@/types/contact"

interface ContactDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  contact?: Contact
  onSubmit: (data: any) => void
  isLoading?: boolean
  mode: "create" | "edit"
}

export function ContactDialog({
  open,
  onOpenChange,
  contact,
  onSubmit,
  isLoading = false,
  mode,
}: ContactDialogProps) {
  const title = mode === "create" ? "Add New Contact" : "Edit Contact"
  const description = mode === "create" 
    ? "Add a new contact to your training center."
    : "Update the contact information."

  // Handle dialog state change with proper cleanup
  const handleOpenChange = (newOpen: boolean) => {
    onOpenChange(newOpen)
  }

  // Force form remount when dialog opens by using open state in key
  const formKey = `${mode}-${contact?.id || 'new'}-${open ? 'open' : 'closed'}`

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
          <DialogDescription>{description}</DialogDescription>
        </DialogHeader>
        
        {open && (
          <ContactForm
            key={formKey}
            contact={contact}
            onSubmit={onSubmit}
            onCancel={() => handleOpenChange(false)}
            isLoading={isLoading}
            mode={mode}
          />
        )}
      </DialogContent>
    </Dialog>
  )
}

interface DeleteContactDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  contact?: Contact
  onConfirm: () => void
  isLoading?: boolean
}

export function DeleteContactDialog({
  open,
  onOpenChange,
  contact,
  onConfirm,
  isLoading = false,
}: DeleteContactDialogProps) {
  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Delete Contact</AlertDialogTitle>
          <AlertDialogDescription>
            Are you sure you want to delete the contact for{" "}
            <strong>{contact?.nameOfOrganization}</strong>? This action cannot be undone.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel disabled={isLoading}>Cancel</AlertDialogCancel>
          <AlertDialogAction
            onClick={onConfirm}
            disabled={isLoading}
            className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
          >
            {isLoading ? "Deleting..." : "Delete"}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  )
} 