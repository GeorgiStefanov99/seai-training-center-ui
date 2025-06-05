"use client"

import React, { useState, useEffect } from "react"
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Calendar } from "@/components/ui/calendar"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { cn } from "@/lib/utils"
import { format, parse } from "date-fns"
import { CalendarIcon, Loader2, X, Upload, FileText, Check, Infinity } from "lucide-react"
import { Document, CreateDocumentRequest, DOCUMENT_TYPES } from "@/types/document"
import { FileUploader } from "@/components/file-uploader"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Switch } from "@/components/ui/switch"
import { toast } from "sonner"
import { createDocument, updateDocument } from "@/services/documentService"
import { uploadFile } from "@/services/fileService"

interface DocumentDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  trainingCenterId: string
  attendeeId: string
  document?: Document
  onSuccess: () => void
}

export function DocumentDialog({ 
  open, 
  onOpenChange, 
  trainingCenterId, 
  attendeeId,
  document,
  onSuccess 
}: DocumentDialogProps) {
  const isEditing = !!document

  // Form state
  const [name, setName] = useState("")
  const [number, setNumber] = useState("")
  const [issueDateStr, setIssueDateStr] = useState("")
  const [expiryDateStr, setExpiryDateStr] = useState("")
  const [isUnlimitedExpiry, setIsUnlimitedExpiry] = useState(false)
  const [verified, setVerified] = useState(false)
  
  // File upload state
  const [files, setFiles] = useState<File[]>([])
  const [fileUploading, setFileUploading] = useState(false)
  const [filePreviewUrls, setFilePreviewUrls] = useState<string[]>([])
  
  // Loading state
  const [isSubmitting, setIsSubmitting] = useState(false)

  // Initialize form with document data when editing
  useEffect(() => {
    if (document) {
      setName(document.name || "")
      setNumber(document.number || "")
      setIssueDateStr(document.issueDate ? format(new Date(document.issueDate), "dd/MM/yyyy") : "")
      setExpiryDateStr(document.expiryDate ? format(new Date(document.expiryDate), "dd/MM/yyyy") : "")
      setIsUnlimitedExpiry(!document.expiryDate)
      setVerified(document.isVerified || false)
    } else {
      // Reset form for new document
      setName("")
      setNumber("")
      setIssueDateStr("")
      setExpiryDateStr("")
      setIsUnlimitedExpiry(false)
      setVerified(false)
    }
    // Reset files when dialog opens/closes
    setFiles([])
    setFilePreviewUrls([])
  }, [document, open])

  const handleFileChange = (acceptedFiles: File[]) => {
    // Filter for supported file types
    const supportedFiles = acceptedFiles.filter(file => {
      const fileType = file.type.toLowerCase()
      return fileType.includes('image') || 
             fileType.includes('pdf') || 
             fileType.includes('word') || 
             fileType.includes('doc')
    })
    
    if (supportedFiles.length !== acceptedFiles.length) {
      toast.warning("Some files were not added. Only images, PDFs, and Word documents are supported.")
    }
    
    setFiles(prev => [...prev, ...supportedFiles])
    
    // Generate preview URLs for the files
    supportedFiles.forEach(file => {
      if (file.type.includes('image')) {
        const url = URL.createObjectURL(file)
        setFilePreviewUrls(prev => [...prev, url])
      } else {
        // For non-image files, we don't generate previews
        setFilePreviewUrls(prev => [...prev])
      }
    })
  }

  const removeFile = (index: number) => {
    const newFiles = [...files]
    newFiles.splice(index, 1)
    setFiles(newFiles)
    
    const newPreviewUrls = [...filePreviewUrls]
    if (newPreviewUrls[index]) {
      URL.revokeObjectURL(newPreviewUrls[index])
      newPreviewUrls.splice(index, 1)
      setFilePreviewUrls(newPreviewUrls)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsSubmitting(true)
    
    try {
      // Validate dates
      let issueDate: Date | undefined
      let expiryDate: Date | undefined

      if (issueDateStr) {
        try {
          issueDate = parse(issueDateStr, "dd/MM/yyyy", new Date())
        } catch (error) {
          toast.error("Invalid issue date format. Please use dd/MM/yyyy")
          setIsSubmitting(false)
          return
        }
      }

      if (!isUnlimitedExpiry && expiryDateStr) {
        try {
          expiryDate = parse(expiryDateStr, "dd/MM/yyyy", new Date())
          if (issueDate && expiryDate < issueDate) {
            toast.error("Expiry date must be after issue date")
            setIsSubmitting(false)
            return
          }
        } catch (error) {
          toast.error("Invalid expiry date format. Please use dd/MM/yyyy")
          setIsSubmitting(false)
          return
        }
      }

      const documentData: CreateDocumentRequest = {
        name,
        number: number || undefined,
        issueDate: issueDate ? format(issueDate, 'yyyy-MM-dd') : undefined,
        expiryDate: isUnlimitedExpiry ? undefined : (expiryDate ? format(expiryDate, 'yyyy-MM-dd') : undefined),
        verified
      }
      
      let savedDocument: Document
      
      if (isEditing && document) {
        // Update existing document
        savedDocument = await updateDocument(
          { trainingCenterId, attendeeId, documentId: document.id },
          documentData
        )
        toast.success("Document updated successfully")
      } else {
        // Create new document
        savedDocument = await createDocument(
          { trainingCenterId, attendeeId },
          documentData
        )
        toast.success("Document created successfully")
      }
      
      // Upload files if any
      if (files.length > 0) {
        setFileUploading(true)
        
        try {
          // Upload each file
          for (const file of files) {
            await uploadFile(
              { trainingCenterId, attendeeId, documentId: savedDocument.id },
              file
            )
          }
          toast.success(`${files.length} file(s) uploaded successfully`)
        } catch (error) {
          console.error("Error uploading files:", error)
          toast.error("Failed to upload some files. Please try again.")
        } finally {
          setFileUploading(false)
        }
      }
      
      // Clean up preview URLs
      filePreviewUrls.forEach(url => URL.revokeObjectURL(url))
      
      // Close dialog and refresh data
      onSuccess()
      onOpenChange(false)
    } catch (error) {
      console.error("Error saving document:", error)
      toast.error("Failed to save document. Please try again.")
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[600px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{isEditing ? "Edit Document" : "Add New Document"}</DialogTitle>
          <DialogDescription>
            {isEditing 
              ? "Update the document information below." 
              : "Enter the document details and upload any relevant files."}
          </DialogDescription>
        </DialogHeader>
        
        <form onSubmit={handleSubmit} className="space-y-4 py-4">
          {/* Document Name */}
          <div className="space-y-2">
            <Label htmlFor="name">Document Name</Label>
            <Input 
              id="name" 
              value={name} 
              onChange={(e) => setName(e.target.value)} 
              placeholder="Enter document name"
              required
            />
          </div>
          
          {/* Document Number */}
          <div className="space-y-2">
            <Label htmlFor="number">Document Number (Optional)</Label>
            <Input 
              id="number" 
              value={number} 
              onChange={(e) => setNumber(e.target.value)} 
              placeholder="Enter document number"
            />
          </div>
          
          {/* Issue Date */}
          <div className="space-y-2">
            <Label htmlFor="issueDate">Issue Date</Label>
            <Input 
              id="issueDate"
              value={issueDateStr}
              onChange={(e) => setIssueDateStr(e.target.value)}
              placeholder="dd/MM/yyyy"
              required
            />
          </div>
          
          {/* Expiry Date */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <Label htmlFor="expiryDate">Expiry Date</Label>
              <div className="flex items-center space-x-2">
                <Label htmlFor="unlimited-expiry" className="text-sm text-muted-foreground">
                  Unlimited
                </Label>
                <Switch
                  id="unlimited-expiry"
                  checked={isUnlimitedExpiry}
                  onCheckedChange={(checked) => {
                    setIsUnlimitedExpiry(checked)
                    if (checked) {
                      setExpiryDateStr("")
                    }
                  }}
                />
              </div>
            </div>
            <Input 
              id="expiryDate"
              value={expiryDateStr}
              onChange={(e) => setExpiryDateStr(e.target.value)}
              placeholder={isUnlimitedExpiry ? "Unlimited" : "dd/MM/yyyy"}
              disabled={isUnlimitedExpiry}
              required={!isUnlimitedExpiry}
            />
          </div>
          
          {/* Verified Status */}
          <div className="flex items-center justify-between space-x-2">
            <Label htmlFor="verified">Verified</Label>
            <Switch
              id="verified"
              checked={verified}
              onCheckedChange={setVerified}
            />
          </div>
          
          {/* File Upload */}
          <div className="space-y-2">
            <Label>Upload Files</Label>
            <FileUploader onFileAccepted={handleFileChange} />
            
            {/* File Preview */}
            {files.length > 0 && (
              <div className="mt-4 space-y-2">
                <Label>Selected Files</Label>
                <div className="grid grid-cols-1 gap-2">
                  {files.map((file, index) => (
                    <div key={index} className="flex items-center justify-between p-2 border rounded-md">
                      <div className="flex items-center space-x-2">
                        {file.type.includes('image') ? (
                          <img 
                            src={filePreviewUrls[index]} 
                            alt="Preview" 
                            className="h-10 w-10 object-cover rounded-md" 
                          />
                        ) : (
                          <FileText className="h-10 w-10 text-primary" />
                        )}
                        <div>
                          <p className="text-sm font-medium truncate max-w-[200px]">{file.name}</p>
                          <p className="text-xs text-muted-foreground">
                            {(file.size / 1024).toFixed(1)} KB
                          </p>
                        </div>
                      </div>
                      <Button 
                        type="button" 
                        variant="ghost" 
                        size="icon" 
                        onClick={() => removeFile(index)}
                      >
                        <X className="h-4 w-4" />
                      </Button>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
          
          <DialogFooter>
            <Button 
              type="button" 
              variant="outline" 
              onClick={() => onOpenChange(false)}
              disabled={isSubmitting || fileUploading}
            >
              Cancel
            </Button>
            <Button 
              type="submit" 
              disabled={isSubmitting || fileUploading}
              className="ml-2"
            >
              {(isSubmitting || fileUploading) && (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              )}
              {isEditing ? "Update Document" : "Create Document"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
