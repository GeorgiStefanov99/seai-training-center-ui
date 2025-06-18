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
import { useState, useMemo, useEffect, useCallback, useRef } from "react"
import { Switch } from "@/components/ui/switch"
import { toast } from "sonner"
import { Card } from "@/components/ui/card"
import { useAuth } from "@/hooks/useAuth"
import { formatDateForDisplay, formatDateForApi, formatDateValue, isValidDate } from "@/lib/date-utils"
import { Checkbox } from "@/components/ui/checkbox"
import { Loader2 } from "lucide-react"
import { Upload, FileText, Trash2 } from "lucide-react"
import { FileUploadPreview, FilePreviewItem } from "@/components/ui/file-upload-preview"
import { ZoomOut, RotateCcw, ZoomIn } from "lucide-react"
import { API_BASE_URL } from "@/lib/config/api"

interface EditDocumentDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onSave: (data: Partial<Document>, files?: File[] | File | null) => void
  certificate: Document
  attendees?: Attendee[]
  hideSailorSelection?: boolean
  selectedAttendee?: Attendee | null
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
  const [selectedFiles, setSelectedFiles] = useState<File[]>([])
  const [filesToDelete, setFilesToDelete] = useState<string[]>([])
  const [filePreviewItems, setFilePreviewItems] = useState<FilePreviewItem[]>([])
  const [isLoadingImage, setIsLoadingImage] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [isVerified, setIsVerified] = useState(initialDocument?.isVerified || false)
  const [noExpiryDate, setNoExpiryDate] = useState<boolean>(!initialDocument?.expiryDate)
  const [issueDate, setIssueDate] = useState<string>(formatDateForDisplay(initialDocument?.issueDate || ''))
  const [expiryDate, setExpiryDate] = useState<string>(formatDateForDisplay(initialDocument?.expiryDate || ''))
  const [isPdfDocument, setIsPdfDocument] = useState(false)
  const { user } = useAuth()
  const [previewFile, setPreviewFile] = useState<FilePreviewItem | null>(null)
  const [isPreviewOpen, setIsPreviewOpen] = useState(false)
  const [zoomLevel, setZoomLevel] = useState(1)

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
      setIssueDate(formatDateForDisplay(initialDocument.issueDate || ''));
      setExpiryDate(formatDateForDisplay(initialDocument.expiryDate || ''));
    }
  }, [initialDocument, open]);

  // Get the API URL for document file
  const documentFileUrl = useMemo(() => {
    if (!user?.userId || !document.id || !document.attendeeId) {
      return null;
    }
    
    return `${API_BASE_URL}/api/v1/training-centers/${user.userId}/attendees/${document.attendeeId}/documents/${document.id}/files`;
  }, [user?.userId, document.id, document.attendeeId]);

  // Fetch document when dialog opens if document has a file
  const fetchDocument = useCallback(async () => {
    if (!documentFileUrl || !user?.accessToken || isLoadingImage) {
      return;
    }
    
    setIsLoadingImage(true);
    try {
      const response = await fetch(documentFileUrl, {
        headers: { Authorization: `Bearer ${user.accessToken}` },
      });
      
      if (!response.ok) {
        throw new Error(`Failed to fetch document: ${response.status} ${response.statusText}`);
      }
      
      const contentType = response.headers.get('content-type');
      
      if (contentType && contentType.includes('application/json')) {
        const data = await response.json();
        const files = Array.isArray(data) ? data : [data];
        const newFilePreviewItems: FilePreviewItem[] = [];
        
        for (const fileData of files) {
          if (fileData && fileData.body && fileData.headers && fileData.headers['Content-Type']) {
            try {
              const byteCharacters = atob(fileData.body);
              const byteNumbers = new Array(byteCharacters.length);
              for (let i = 0; i < byteCharacters.length; i++) byteNumbers[i] = byteCharacters.charCodeAt(i);
              const byteArray = new Uint8Array(byteNumbers);
              const fileContentType = Array.isArray(fileData.headers['Content-Type'])
                ? fileData.headers['Content-Type'][0]
                : fileData.headers['Content-Type'];
              const fileName = fileData.fileName || fileData.fileId || `file-${Date.now()}`;
              const blob = new Blob([byteArray], { type: fileContentType });
              const objectUrl = URL.createObjectURL(blob);
              newFilePreviewItems.push({
                name: fileName,
                type: fileContentType,
                url: objectUrl,
                isNew: false,
                fileId: fileData.fileId
              });
            } catch (error) {
              console.error("Error processing file:", error);
              toast.error(`Failed to process file data for ${fileData.fileName || fileData.fileId}`);
            }
          } else if (fileData && fileData.fileId) {
            // Handle case where we have a fileId but no body (direct file reference)
            const fileUrl = `${documentFileUrl}/${fileData.fileId}`;
            try {
              const fileResponse = await fetch(fileUrl, {
                headers: { Authorization: `Bearer ${user.accessToken}` },
              });
              if (fileResponse.ok) {
                const blob = await fileResponse.blob();
                const objectUrl = URL.createObjectURL(blob);
                newFilePreviewItems.push({
                  name: fileData.fileName || fileData.fileId,
                  type: blob.type || 'application/octet-stream',
                  url: objectUrl,
                  isNew: false,
                  fileId: fileData.fileId
                });
              }
            } catch (error) {
              console.error("Error fetching file:", error);
              toast.error(`Failed to fetch file: ${fileData.fileName || fileData.fileId}`);
            }
          }
        }
        setFilePreviewItems(newFilePreviewItems);
        return;
      }
      
      // If we get here, it's a direct file response
      const blob = await response.blob();
      const objectUrl = URL.createObjectURL(blob);
      const fileName = document.name || `file-${Date.now()}`;
      const fileType = blob.type || (fileName.toLowerCase().endsWith('.pdf') ? 'application/pdf' : 'image/jpeg');
      
      setFilePreviewItems([{
        name: fileName,
        type: fileType,
        url: objectUrl,
        isNew: false
      }]);
    } catch (error) {
      console.error("[EditDialog] Error fetching document:", error);
      toast.error("Failed to load document: " + (error instanceof Error ? error.message : String(error)));
    } finally {
      setIsLoadingImage(false);
    }
  }, [documentFileUrl, user?.accessToken, document.name, setFilePreviewItems, setIsLoadingImage]);

  // Reset state when dialog opens/closes
  useEffect(() => {
    if (!open) {
      // Clean up blob URLs when dialog closes
      setFilePreviewItems((prev: FilePreviewItem[]) => {
        prev.forEach(item => { 
          if (item.url) URL.revokeObjectURL(item.url); 
        });
        return [];
      });
      return;
    }

    // Clear any previously selected files
    setSelectedFiles([]);
    setFilesToDelete([]);
    setFilePreviewItems([]);
    setIsLoadingImage(false);
    
    const documentId = document?.id;
    
    // Check if the document has a file to display
    if (documentId && document.path && documentFileUrl && !isLoadingImage) {
      fetchDocument();
    }
  }, [open, document?.id, document.path, documentFileUrl, fetchDocument, isLoadingImage]);

  // Add files handler
  const handleAddFiles = (files: File[]) => {
    setSelectedFiles(prev => [...prev, ...files]);
    const newPreviewItems: FilePreviewItem[] = files.map(file => ({
      name: file.name,
      type: file.type,
      url: URL.createObjectURL(file),
      isNew: true
    }));
    setFilePreviewItems(prev => [...prev, ...newPreviewItems]);
  };

  const handleRemoveFile = (file: FilePreviewItem) => {
    if (file.isNew) {
      setSelectedFiles(prev => prev.filter((_, index) => index !== filePreviewItems.filter(f => f.isNew).indexOf(file)));
    } else if (file.fileId) {
      setFilesToDelete(prev => [...prev, file.fileId!]);
    }
    setFilePreviewItems(prev => prev.filter(f => f !== file));
    if (file.url) URL.revokeObjectURL(file.url);
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      const formData = new FormData(e.currentTarget);
      const data: Partial<Document> = {
        id: document.id,
        name: formData.get('name') as string,
        number: formData.get('number') as string,
        issueDate: issueDate || undefined,
        expiryDate: noExpiryDate ? undefined : (expiryDate || undefined),
        isVerified: isVerified,
        attendeeId: selectedAttendee?.id || document.attendeeId
      };

      console.log("Updating document with data:", data);

      await onSave(data, selectedFiles.length > 0 ? selectedFiles : null);
      
      toast.success('Document updated successfully');
      onOpenChange(false);
    } catch (error) {
      console.error('Error updating document:', error);
      toast.error(error instanceof Error ? error.message : 'Failed to update document');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handlePreviewFile = (file: FilePreviewItem) => {
    setPreviewFile(file);
    setIsPreviewOpen(true);
    setZoomLevel(1);
  };

  return (
    <>
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

      {/* File Preview Dialog */}
      <Dialog open={isPreviewOpen} onOpenChange={setIsPreviewOpen}>
        <DialogContent className="sm:max-w-[900px] h-[80vh]">
          <DialogHeader>
            <DialogTitle>File Preview</DialogTitle>
            <DialogDescription>
              {previewFile?.name}
            </DialogDescription>
          </DialogHeader>
          <div className="flex-1 flex flex-col">
            <div className="flex-1 flex items-center justify-center overflow-auto">
              {previewFile && (
                <>
                  {previewFile.type.startsWith('image/') ? (
                    <img
                      src={previewFile.url}
                      alt={previewFile.name}
                      style={{
                        maxWidth: '100%',
                        maxHeight: '100%',
                        objectFit: 'contain',
                        transform: `scale(${zoomLevel})`,
                      }}
                    />
                  ) : previewFile.type === 'application/pdf' ? (
                    <iframe
                      src={previewFile.url}
                      className="w-full h-full"
                      style={{ border: 'none' }}
                      title={previewFile.name}
                    />
                  ) : (
                    <div className="flex items-center justify-center h-full">
                      <p className="text-muted-foreground">
                        Preview not available for this file type
                      </p>
                    </div>
                  )}
                </>
              )}
            </div>
            {previewFile?.type.startsWith('image/') && (
              <div className="flex items-center justify-center gap-2 p-4 border-t">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setZoomLevel(prev => Math.max(prev - 0.25, 0.5))}
                  disabled={zoomLevel <= 0.5}
                >
                  <ZoomOut className="h-4 w-4" />
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setZoomLevel(1)}
                >
                  <RotateCcw className="h-4 w-4" />
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setZoomLevel(prev => Math.min(prev + 0.25, 3))}
                  disabled={zoomLevel >= 3}
                >
                  <ZoomIn className="h-4 w-4" />
                </Button>
              </div>
            )}
          </div>
        </DialogContent>
      </Dialog>
    </>
  )
} 