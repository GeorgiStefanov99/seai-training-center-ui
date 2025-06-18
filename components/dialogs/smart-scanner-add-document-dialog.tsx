import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Attendee } from "@/types/attendee"
import { Document } from "@/types/document"
import { useState, useEffect } from "react"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Switch } from "@/components/ui/switch"
import { toast } from "sonner"
import { Card } from "@/components/ui/card"
import { formatDateForDisplay, formatDateForApi, formatDateValue, isValidDate } from "@/lib/date-utils"
import { RANK_LABELS } from "@/lib/rank-labels"

// Helper functions for date conversion
const formatDateForInput = (dateStr: string): string => {
  if (!dateStr) return '';
  
  // If it's already in YYYY-MM-DD format, return as is
  if (/^\d{4}-\d{2}-\d{2}$/.test(dateStr)) {
    return dateStr;
  }
  
  // If it's in DD/MM/YYYY format, convert to YYYY-MM-DD
  if (/^\d{2}\/\d{2}\/\d{4}$/.test(dateStr)) {
    const [day, month, year] = dateStr.split('/');
    return `${year}-${month}-${day}`;
  }
  
  return '';
}

const formatDateFromInput = (dateStr: string): string => {
  if (!dateStr || !/^\d{4}-\d{2}-\d{2}$/.test(dateStr)) return '';
  
  const [year, month, day] = dateStr.split('-');
  return `${day}/${month}/${year}`;
}
import { Checkbox } from "@/components/ui/checkbox"
import { ZoomIn, ZoomOut, RotateCcw } from "lucide-react"
import { FilePreviewItem } from "@/components/ui/file-upload-preview"

interface SmartScannerAddDocumentDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onSave: (data: Partial<Document>, files?: File[]) => void
  onCancel?: () => void
  attendees: Attendee[]
  hideSailorSelection?: boolean
  initialData?: Partial<Document>
  selectedAttendee?: Attendee | null
  initialFilePreview?: FilePreviewItem
}

export function SmartScannerAddDocumentDialog({
  open,
  onOpenChange,
  onSave,
  onCancel,
  attendees,
  hideSailorSelection = false,
  initialData,
  selectedAttendee,
  initialFilePreview
}: SmartScannerAddDocumentDialogProps) {
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [isVerified, setIsVerified] = useState(initialData?.isVerified || false)
  const [formData, setFormData] = useState<Partial<Document>>(initialData || {})
  const [noExpiryDate, setNoExpiryDate] = useState<boolean>(!initialData?.expiryDate)
  const [zoomLevel, setZoomLevel] = useState(1)
  const [filePreviewItems, setFilePreviewItems] = useState<FilePreviewItem[]>([])
  const [issueDate, setIssueDate] = useState<string>('')
  const [expiryDate, setExpiryDate] = useState<string>('')

  // Reset form state when dialog opens or closes
  useEffect(() => {
    if (open) {
      console.log("SmartScannerAddDocumentDialog opened")
      console.log("Initial data:", initialData)
      console.log("Initial issueDate raw:", initialData?.issueDate)
      console.log("Initial expiryDate raw:", initialData?.expiryDate)
      
      // Convert dates for HTML date inputs
      // initialData comes from the parent with dates already in DD/MM/YYYY format
      const inputIssueDate = formatDateForInput(initialData?.issueDate || '')
      const inputExpiryDate = formatDateForInput(initialData?.expiryDate || '')
      
      console.log("Date conversion process:")
      console.log("Issue - Raw:", initialData?.issueDate, "Input:", inputIssueDate)
      console.log("Expiry - Raw:", initialData?.expiryDate, "Input:", inputExpiryDate)
      
      setIsVerified(initialData?.isVerified || false)
      setFilePreviewItems(initialFilePreview ? [initialFilePreview] : [])
      setFormData(initialData || {})
      setIssueDate(inputIssueDate)
      setExpiryDate(inputExpiryDate)
      setNoExpiryDate(!initialData?.expiryDate)
      
      console.log("State set - issueDate:", inputIssueDate, "expiryDate:", inputExpiryDate)
    } else {
      console.log("SmartScannerAddDocumentDialog closed")
      // Clean up any file preview URLs
      filePreviewItems.forEach(item => {
        if (item.url) URL.revokeObjectURL(item.url)
      })
    }
  }, [open, initialData, initialFilePreview])

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    setIsSubmitting(true)

    try {
      const formDataObj = new FormData(e.currentTarget)
      const data: Partial<Document> = {
        name: formDataObj.get('name') as string,
        number: formDataObj.get('number') as string,
        issueDate: issueDate ? formatDateFromInput(issueDate) : undefined,
        expiryDate: noExpiryDate ? undefined : (expiryDate ? formatDateFromInput(expiryDate) : undefined),
        id: initialData?.id,
        attendeeId: selectedAttendee?.id || initialData?.attendeeId,
        isVerified: isVerified
      }

      console.log("Submitting document data:", data)
      console.log("Date conversion for save:")
      console.log("Issue - Input:", issueDate, "→ Display:", data.issueDate)
      console.log("Expiry - Input:", expiryDate, "→ Display:", data.expiryDate)

      try {
        // Call the parent component's save handler
        console.log('Calling parent onSave function')
        const result = await onSave(data)
        console.log('Parent onSave function completed successfully', result)
        
        // Show success message
        toast.success(data.id ? 'Document updated successfully' : 'Document added successfully')
        
        // Only close the dialog if the save was successful
        console.log('Closing dialog after successful save')
        return true
      } catch (saveError) {
        console.error('Error from parent save handler:', saveError)
        throw saveError
      }
    } catch (error) {
      console.error('Error submitting form:', error)
      toast.error(error instanceof Error ? error.message : 'Failed to save document')
      return false
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleCancel = () => {
    // Clear any form state
    setIsSubmitting(false)
    
    // Call the parent's onCancel if provided
    if (onCancel) {
      onCancel()
    } else {
      // Otherwise just close the dialog
      onOpenChange(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={(isOpen) => {
      console.log("SmartScannerAddDocumentDialog onOpenChange:", isOpen)
      if (!isOpen && !isSubmitting) {
        handleCancel()
      }
      onOpenChange(isOpen)
    }}>
      <DialogContent className="w-[95vw] sm:max-w-[1200px] h-[95vh] sm:h-[90vh] p-3 sm:p-6">
        <DialogHeader className="pb-3 sm:pb-6">
          <DialogTitle className="text-lg sm:text-xl">Add New Document</DialogTitle>
          <DialogDescription className="text-sm">
            Enter the document details below. All fields are required.
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4 sm:space-y-6 h-full flex flex-col">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6 flex-1 min-h-0">
            {/* Left Column - Document Preview */}
            <div className="space-y-3 sm:space-y-4 h-full flex flex-col order-2 lg:order-1">
              <Label className="text-base sm:text-sm">Document Preview</Label>
              <div className="flex-1 relative border rounded-lg overflow-hidden bg-gray-50 min-h-[200px] lg:min-h-0">
                {filePreviewItems[0] && (
                  <div className="w-full h-full flex flex-col">
                    <div className="flex-1 flex items-center justify-center p-2 sm:p-4 overflow-auto">
                      {filePreviewItems[0].type.startsWith('image/') ? (
                        <img
                          src={filePreviewItems[0].url}
                          alt={filePreviewItems[0].name}
                          style={{
                            maxWidth: '100%',
                            maxHeight: '100%',
                            objectFit: 'contain',
                            transform: `scale(${zoomLevel})`,
                          }}
                        />
                      ) : filePreviewItems[0].type === 'application/pdf' ? (
                        <iframe
                          src={filePreviewItems[0].url}
                          className="w-full h-full rounded"
                          style={{ border: 'none' }}
                          title={filePreviewItems[0].name}
                        />
                      ) : (
                        <div className="flex items-center justify-center h-full">
                          <p className="text-muted-foreground text-center px-4">
                            Preview not available for this file type
                          </p>
                        </div>
                      )}
                    </div>
                    {filePreviewItems[0].type.startsWith('image/') && (
                      <div className="flex items-center justify-center gap-2 p-2 sm:p-4 border-t bg-white">
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          onClick={() => setZoomLevel(prev => Math.max(prev - 0.25, 0.5))}
                          disabled={zoomLevel <= 0.5}
                          className="h-8 w-8 sm:h-auto sm:w-auto sm:px-3 touch-manipulation"
                        >
                          <ZoomOut className="h-4 w-4" />
                          <span className="sr-only sm:not-sr-only sm:ml-1">Out</span>
                        </Button>
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          onClick={() => setZoomLevel(1)}
                          className="h-8 w-8 sm:h-auto sm:w-auto sm:px-3 touch-manipulation"
                        >
                          <RotateCcw className="h-4 w-4" />
                          <span className="sr-only sm:not-sr-only sm:ml-1">Reset</span>
                        </Button>
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          onClick={() => setZoomLevel(prev => Math.min(prev + 0.25, 3))}
                          disabled={zoomLevel >= 3}
                          className="h-8 w-8 sm:h-auto sm:w-auto sm:px-3 touch-manipulation"
                        >
                          <ZoomIn className="h-4 w-4" />
                          <span className="sr-only sm:not-sr-only sm:ml-1">In</span>
                        </Button>
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>

            {/* Right Column - Document Details Form */}
            <div className="space-y-3 sm:space-y-4 overflow-y-auto order-1 lg:order-2">
              <div className="space-y-2">
                <Label htmlFor="name" className="text-base sm:text-sm font-medium">Document Name *</Label>
                <Input
                  id="name"
                  name="name"
                  placeholder="Enter document name"
                  defaultValue={initialData?.name || ''}
                  required
                  className="h-12 sm:h-10 text-base sm:text-sm"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="number" className="text-base sm:text-sm font-medium">Document Number</Label>
                <Input
                  id="number"
                  name="number"
                  placeholder="Enter document number"
                  defaultValue={initialData?.number || ''}
                  className="h-12 sm:h-10 text-base sm:text-sm"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="issueDate" className="text-base sm:text-sm font-medium">Issue Date</Label>
                <Input
                  id="issueDate"
                  name="issueDate"
                  type="date"
                  value={issueDate}
                  onChange={(e) => setIssueDate(e.target.value)}
                  className="h-12 sm:h-10 text-base sm:text-sm"
                />
              </div>

              <div className="space-y-2">
                <div className="flex items-center space-x-3">
                  <Checkbox
                    id="noExpiryDate"
                    checked={noExpiryDate}
                    onCheckedChange={(checked) => {
                      setNoExpiryDate(checked as boolean)
                      if (checked) {
                        setExpiryDate('')
                      }
                    }}
                    className="h-5 w-5"
                  />
                  <Label htmlFor="noExpiryDate" className="text-base sm:text-sm font-medium">No expiry date</Label>
                </div>
              </div>

              {!noExpiryDate && (
                <div className="space-y-2">
                  <Label htmlFor="expiryDate" className="text-base sm:text-sm font-medium">Expiry Date</Label>
                  <Input
                    id="expiryDate"
                    name="expiryDate"
                    type="date"
                    value={expiryDate}
                    onChange={(e) => setExpiryDate(e.target.value)}
                    className="h-12 sm:h-10 text-base sm:text-sm"
                  />
                </div>
              )}

              <div className="flex items-center space-x-3">
                <Switch
                  id="verified"
                  checked={isVerified}
                  onCheckedChange={setIsVerified}
                />
                <Label htmlFor="verified" className="text-base sm:text-sm font-medium">Verified</Label>
              </div>

              {!hideSailorSelection && (
                <div className="space-y-2">
                  <Label htmlFor="attendeeId">Attendee</Label>
                  <Select name="attendeeId" defaultValue={selectedAttendee?.id || initialData?.attendeeId}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select attendee" />
                    </SelectTrigger>
                    <SelectContent>
                      {attendees.map((attendee) => (
                        <SelectItem key={attendee.id} value={attendee.id}>
                          {attendee.name} {attendee.surname} - {RANK_LABELS[attendee.rank] || attendee.rank}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              )}
            </div>
          </div>

          <DialogFooter className="flex-col sm:flex-row gap-3 sm:gap-2 pt-4 sm:pt-6">
            <Button 
              type="button" 
              variant="outline" 
              onClick={handleCancel} 
              disabled={isSubmitting}
              className="w-full sm:w-auto h-12 sm:h-10 text-base sm:text-sm font-medium touch-manipulation order-2 sm:order-1"
            >
              Cancel
            </Button>
            <Button 
              type="submit" 
              disabled={isSubmitting}
              className="w-full sm:w-auto h-12 sm:h-10 text-base sm:text-sm font-medium touch-manipulation order-1 sm:order-2"
            >
              {isSubmitting ? 'Saving...' : 'Save Document'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
} 