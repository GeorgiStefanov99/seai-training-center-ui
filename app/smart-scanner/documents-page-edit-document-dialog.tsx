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
import { AttendeeWithDetails } from "@/types/attendee"
import { Document } from "@/types/document"
import { useState, useEffect } from "react"
import { Switch } from "@/components/ui/switch"
import { toast } from "sonner"
import { formatDateForDisplay } from "@/lib/date-utils"

// Helper function to convert DD/MM/YYYY to YYYY-MM-DD for HTML date input
const formatDateForInput = (dateStr: string): string => {
  console.log('formatDateForInput called with:', dateStr);
  
  if (!dateStr) return '';
  
  // If it's already in YYYY-MM-DD format, return as is
  if (/^\d{4}-\d{2}-\d{2}$/.test(dateStr)) {
    console.log('Already in YYYY-MM-DD format:', dateStr);
    return dateStr;
  }
  
  // If it's in DD/MM/YYYY format, convert to YYYY-MM-DD
  if (/^\d{2}\/\d{2}\/\d{4}$/.test(dateStr)) {
    const [day, month, year] = dateStr.split('/');
    const result = `${year}-${month.padStart(2, '0')}-${day.padStart(2, '0')}`;
    console.log(`Converting ${dateStr} to ${result}`);
    return result;
  }
  
  // Try to parse any other format
  try {
    const date = new Date(dateStr);
    if (isNaN(date.getTime())) {
      console.log('Invalid date:', dateStr);
      return '';
    }
    const result = date.toISOString().split('T')[0];
    console.log(`Parsed ${dateStr} to ${result}`);
    return result;
  } catch {
    console.log('Error parsing date:', dateStr);
    return '';
  }
};

// Helper function to convert YYYY-MM-DD from HTML input to DD/MM/YYYY
const formatDateFromInput = (dateStr: string): string => {
  if (!dateStr) return '';
  
  // If it's in YYYY-MM-DD format, convert to DD/MM/YYYY
  if (/^\d{4}-\d{2}-\d{2}$/.test(dateStr)) {
    const [year, month, day] = dateStr.split('-');
    return `${day}/${month}/${year}`;
  }
  
  return dateStr;
};
import { Checkbox } from "@/components/ui/checkbox"

interface EditDocumentDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onSave: (data: Partial<Document>, files?: File[] | File | null) => void
  certificate: Document
  attendees?: AttendeeWithDetails[]
  hideSailorSelection?: boolean
  selectedAttendee?: AttendeeWithDetails | null
  allowMultipleFiles?: boolean
}

export function DocumentsPageEditDocumentDialog({
  open,
  onOpenChange,
  onSave,
  certificate: initialDocument,
  attendees = [],
  hideSailorSelection = false,
  selectedAttendee,
  allowMultipleFiles = false
}: EditDocumentDialogProps) {
  const [document, setDocument] = useState<Document>(initialDocument || {} as Document)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [isVerified, setIsVerified] = useState(initialDocument?.isVerified || false)
  const [noExpiryDate, setNoExpiryDate] = useState<boolean>(!initialDocument?.expiryDate)
  const [issueDate, setIssueDate] = useState<string>(formatDateForInput(formatDateForDisplay(initialDocument?.issueDate || '')))
  const [expiryDate, setExpiryDate] = useState<string>(formatDateForInput(formatDateForDisplay(initialDocument?.expiryDate || '')))

  // Update document state when initialDocument changes
  useEffect(() => {
    if (!open || !initialDocument) return;
    
    // Only update if the document ID has changed or if this is the first time opening with this document
    const shouldUpdate = document.id !== initialDocument.id || 
                        !document.id; // Also update if document is empty
    
    if (shouldUpdate) {
      console.log("[EditDialog] Updating document state:", {
        oldId: document.id,
        newId: initialDocument.id
      });
      
      setDocument(initialDocument);
      setIsVerified(initialDocument.isVerified || false);
      setNoExpiryDate(!initialDocument.expiryDate);
      setIssueDate(formatDateForInput(formatDateForDisplay(initialDocument.issueDate || '')));
      setExpiryDate(formatDateForInput(formatDateForDisplay(initialDocument.expiryDate || '')));
    }
  }, [initialDocument, open]);

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      const form = e.currentTarget;
      const formDataObj = new FormData(form);
      
      const data: Partial<Document> = {
        id: document.id,
        name: formDataObj.get('name') as string,
        number: formDataObj.get('number') as string,
        issueDate: issueDate ? formatDateFromInput(issueDate) : undefined,
        expiryDate: noExpiryDate ? undefined : (expiryDate ? formatDateFromInput(expiryDate) : undefined),
        isVerified: isVerified,
        attendeeId: selectedAttendee?.id || document.attendeeId
      };

      console.log("Updating document with data:", data);

      await onSave(data, null);
      
      toast.success('Document updated successfully');
      onOpenChange(false);
    } catch (error) {
      console.error('Error updating document:', error);
      toast.error(error instanceof Error ? error.message : 'Failed to update document');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[600px]">
        <DialogHeader>
          <DialogTitle>Edit Document</DialogTitle>
          <DialogDescription>
            Update document details
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="name">Document Name *</Label>
              <Input
                id="name"
                name="name"
                placeholder="Enter document name"
                defaultValue={document?.name || ''}
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="number">Document Number</Label>
              <Input
                id="number"
                name="number"
                placeholder="Enter document number"
                defaultValue={document?.number || ''}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="issueDate">Issue Date</Label>
              <Input
                id="issueDate"
                name="issueDate"
                type="date"
                value={issueDate}
                onChange={(e) => setIssueDate(e.target.value)}
              />
            </div>

            <div className="space-y-2">
              <div className="flex items-center space-x-2">
                <Checkbox
                  id="noExpiryDate"
                  checked={noExpiryDate}
                  onCheckedChange={(checked) => {
                    setNoExpiryDate(checked as boolean)
                    if (checked) {
                      setExpiryDate('')
                    }
                  }}
                />
                <Label htmlFor="noExpiryDate">No expiry date</Label>
              </div>
            </div>

            {!noExpiryDate && (
              <div className="space-y-2">
                <Label htmlFor="expiryDate">Expiry Date</Label>
                <Input
                  id="expiryDate"
                  name="expiryDate"
                  type="date"
                  value={expiryDate}
                  onChange={(e) => setExpiryDate(e.target.value)}
                />
              </div>
            )}

            <div className="flex items-center space-x-2">
              <Switch
                id="verified"
                checked={isVerified}
                onCheckedChange={setIsVerified}
              />
              <Label htmlFor="verified">Verified</Label>
            </div>
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)} disabled={isSubmitting}>
              Cancel
            </Button>
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting ? 'Updating...' : 'Update Document'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
} 