"use client"

import { useState, useRef, useEffect, useMemo } from "react"
import type { Attendee, AttendeeWithDetails } from "@/types/attendee"
import type { Document} from "@/types/document"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Scan, Upload, Camera } from "lucide-react"
import { useCamera } from "@/hooks/use-camera"
import { useRouter } from "next/navigation"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { useAuth } from "@/hooks/useAuth"
import { toast } from "sonner"
import { DocumentsPageEditDocumentDialog } from "@/components/dialogs/documents-page-edit-document-dialog"
import { getPaginatedAttendees } from "@/services/attendeeService"
import { FileUploadPreview, FilePreviewItem } from "@/components/ui/file-upload-preview"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog"
import { ZoomIn, ZoomOut, RotateCcw } from "lucide-react"
import { SmartScannerAddDocumentDialog } from "@/components/dialogs/smart-scanner-add-document-dialog"
import { API_BASE_URL } from "@/lib/config/api"
import { formatDateForDisplay, formatDateForApi } from "@/lib/date-utils"

interface DocumentWithAuthority extends Required<Pick<Document, 'id'>> {
  issuingAuthority?: string;
  fileUrl?: string;
  [key: string]: any;
}

export default function SmartScanner() {
  const [file, setFile] = useState<File | null>(null)
  const [scanning, setScanning] = useState(false)
  const [attendees, setAttendees] = useState<AttendeeWithDetails[]>([])
  const [selectedAttendee, setSelectedAttendee] = useState<Attendee | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false)
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false)
  const [scannedDocument, setScannedDocument] = useState<Partial<Document>>()
  const [documentSaved, setDocumentSaved] = useState(false)
  const [isSaving, setIsSaving] = useState(false)
  const [isPreviewOpen, setIsPreviewOpen] = useState(false)
  const [previewFile, setPreviewFile] = useState<FilePreviewItem | null>(null)
  const [zoomLevel, setZoomLevel] = useState(1)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const { takePhoto } = useCamera()
  const router = useRouter()
  const { user } = useAuth()

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    if (event.target.files && event.target.files[0]) {
      const newFile = event.target.files[0]
      setFile(newFile)
      
      // Create preview item
      setPreviewFile({
        name: newFile.name,
        type: newFile.type,
        url: URL.createObjectURL(newFile),
        isNew: true
      })
    }
  }

  const handleRemoveFile = () => {
    if (previewFile?.url) {
      URL.revokeObjectURL(previewFile.url)
    }
    setFile(null)
    setPreviewFile(null)
    if (fileInputRef.current) {
      fileInputRef.current.value = ''
    }
  }

  const handlePreviewFile = (file: FilePreviewItem) => {
    setPreviewFile(file)
    setIsPreviewOpen(true)
    setZoomLevel(1)
  }

  const handleScan = async (file: File) => {
    if (!selectedAttendee || !user?.userId || !user?.accessToken) {
      toast.error("Please select an attendee first")
      return
    }

    let loadingToast: string | number | undefined;
    try {
      setIsLoading(true)
      const formData = new FormData()
      formData.append('file', file)

      // Create a local preview URL for the file that we can use immediately
      const localPreviewUrl = URL.createObjectURL(file)

      // Show loading message with appropriate duration info
      const loadingMessage = file.type === 'application/pdf' 
        ? "Processing PDF document... This may take up to 2 minutes."
        : "Processing document... This may take up to 1 minute."
      loadingToast = toast.loading(loadingMessage)

      // Create an AbortController for timeout
      // PDFs need more time to process than images
      const timeoutDuration = file.type === 'application/pdf' ? 120000 : 60000; // 2 minutes for PDFs, 1 minute for images
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), timeoutDuration);

      console.log('Starting OCR request with file:', {
        name: file.name,
        type: file.type,
        size: file.size,
        timeout: timeoutDuration / 1000 + ' seconds'
      });

      try {
        const response = await fetch(
          `${API_BASE_URL}/api/v1/training-centers/${user.userId}/attendees/${selectedAttendee.id}/ocr`,
          {
            method: 'POST',
            headers: {
              'Authorization': `Bearer ${user.accessToken}`,
            },
            body: formData,
            signal: controller.signal
          }
        )

        clearTimeout(timeoutId);

        // Handle different error cases
        if (!response.ok) {
          // Try to get the error details
          const errorData = await response.json().catch(() => null);
          console.error('OCR API error:', {
            status: response.status,
            statusText: response.statusText,
            error: errorData
          });

          // Handle specific error cases
          if (response.status === 400) {
            throw new Error('Document may already exist or could not be processed. Please try manual input.');
          } else if (response.status === 413) {
            const sizeLimit = file.type === 'application/pdf' ? '10MB' : '5MB';
            throw new Error(`File size is too large. Please upload a ${file.type === 'application/pdf' ? 'PDF' : 'image'} smaller than ${sizeLimit}.`);
          } else if (response.status === 415) {
            throw new Error('Unsupported file type. Please upload a JPEG, PNG, or PDF file.');
          } else if (response.status === 504) {
            throw new Error('The server is taking too long to respond. Please try again.');
          }
          
          throw new Error('Failed to scan document');
        }

        const data = await response.json()
        console.log('Scanned document response:', data)
        
        // Debug: Test date conversion
        console.log('Testing date conversion:')
        console.log('Original issueDate:', data.issueDate)
        console.log('Converted issueDate:', data.issueDate ? formatDateForDisplay(data.issueDate) : 'undefined')
        console.log('Original expiryDate:', data.expiryDate)
        console.log('Converted expiryDate:', data.expiryDate ? formatDateForDisplay(data.expiryDate) : 'undefined')

        // Create a base document with the file
        const baseDocument: Partial<Document> = {
          id: data.id,
          attendeeId: selectedAttendee.id,
          path: data.path
        }

        // Generate both a local preview URL and an API URL
        // Local preview URL is used for immediate display
        // API URL is stored for future reference
        const apiFileUrl = `${API_BASE_URL}/api/v1/training-centers/${user.userId}/attendees/${selectedAttendee.id}/documents/${data.id}/files?t=${Date.now()}`

        // Create a FilePreviewItem for the dialog
        const filePreviewItem: FilePreviewItem = {
          name: file.name,
          type: file.type,
          url: localPreviewUrl,
          isNew: true
        };

        // Create the document object first
        const documentToSet = {
          ...baseDocument,
          name: data.name || '',
          number: data.number || '',
          issueDate: data.issueDate ? formatDateForDisplay(data.issueDate) : undefined,
          expiryDate: data.expiryDate ? formatDateForDisplay(data.expiryDate) : undefined,
          isVerified: false,
          fileUrl: localPreviewUrl,
          apiFileUrl: apiFileUrl,
          filePreviewItem: filePreviewItem
        }

        console.log('Document to set:')
        console.log('- issueDate:', documentToSet.issueDate)
        console.log('- expiryDate:', documentToSet.expiryDate)
        console.log('- Full document:', documentToSet)

        // If OCR was successful, add the extracted data
        if (data.name || data.number || data.issueDate || data.expiryDate) {
          setScannedDocument(documentToSet as Document & { filePreviewItem?: FilePreviewItem })
          
          toast.dismiss(loadingToast);
          toast.success('Document scanned successfully')
        } else {
          // If OCR failed, just use the base document with file
          setScannedDocument({
            ...baseDocument,
            name: '',  // Empty string for manual input
            number: '', // Empty string for manual input
            fileUrl: localPreviewUrl,
            apiFileUrl: apiFileUrl,
            filePreviewItem: filePreviewItem,
            isVerified: false
          } as Document)
          
          toast.dismiss(loadingToast);
          toast.success('Document uploaded successfully. Please enter the details manually.')
        }
        
        // Open the add document dialog after setting the state
        setIsAddDialogOpen(true)
        setScanning(false)

      } catch (fetchError) {
        clearTimeout(timeoutId);
        
        if (fetchError instanceof Error && fetchError.name === 'AbortError') {
          const timeoutMessage = file.type === 'application/pdf' 
            ? 'PDF processing timed out after 2 minutes. The file may be too complex or large. Please try a simpler PDF or manual input.'
            : 'Document processing timed out after 1 minute. Please try again or use manual input.'
          throw new Error(timeoutMessage);
        }
        
        throw fetchError;
      }

    } catch (error) {
      console.error('Error scanning document:', error)
      
      if (loadingToast) {
        toast.dismiss(loadingToast);
      }
      
      const errorMessage = error instanceof Error ? error.message : 'Failed to scan document'
      toast.error(errorMessage)
      setScanning(false)
    } finally {
      setIsLoading(false)
    }
  }

  const handleCameraCapture = async () => {
    if (!selectedAttendee) {
      toast.error("Please select an attendee first")
      return
    }

    try {
      const capturedImage = await takePhoto()
      if (capturedImage) {
        // Convert CameraPhoto to File
        const response = await fetch(capturedImage.webPath)
        const blob = await response.blob()
        const file = new File([blob], 'camera-capture.jpg', {
          type: 'image/jpeg'
        })
        handleScan(file)
      }
    } catch (error) {
      console.error('Error capturing photo:', error)
      toast.error('Failed to capture photo')
    }
  }

  const handleDocumentSave = async (data: Partial<Document>) => {
    if (!selectedAttendee || !user?.userId || !user?.accessToken) {
      toast.error("Missing required information")
      return
    }

    setIsSaving(true)
    
    try {
      let response;
      
      // If we have scannedDocument with an ID, update it
      if (scannedDocument?.id) {
        const updateData = {
          name: data.name,
          number: data.number,
          issueDate: data.issueDate ? formatDateForApi(data.issueDate) : undefined,
          expiryDate: data.expiryDate ? formatDateForApi(data.expiryDate) : undefined,
          isVerified: data.isVerified || false
        }

        console.log('Updating document with data:', updateData)

        response = await fetch(
          `${API_BASE_URL}/api/v1/training-centers/${user.userId}/attendees/${selectedAttendee.id}/documents/${scannedDocument.id}`,
          {
            method: 'PUT',
            headers: {
              'Content-Type': 'application/json',
              'Authorization': `Bearer ${user.accessToken}`,
            },
            body: JSON.stringify(updateData)
          }
        )
      } else {
        // Create new document
        const createData = {
          name: data.name,
          number: data.number,
          issueDate: data.issueDate ? formatDateForApi(data.issueDate) : undefined,
          expiryDate: data.expiryDate ? formatDateForApi(data.expiryDate) : undefined,
          isVerified: data.isVerified || false
        }

        console.log('Creating document with data:', createData)

        response = await fetch(
          `${API_BASE_URL}/api/v1/training-centers/${user.userId}/attendees/${selectedAttendee.id}/documents`,
          {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'Authorization': `Bearer ${user.accessToken}`,
            },
            body: JSON.stringify(createData)
          }
        )
      }

      if (!response.ok) {
        const errorData = await response.json().catch(() => null);
        console.error('Document save error:', {
          status: response.status,
          statusText: response.statusText,
          error: errorData
        });
        throw new Error('Failed to save document');
      }

      const savedDocument = await response.json()
      console.log('Document saved successfully:', savedDocument)

      setDocumentSaved(true)
      toast.success('Document saved successfully')
      
      // Close the dialog
      setIsAddDialogOpen(false)
      
      // Reset the form
      setScannedDocument(undefined)
      setFile(null)
      setPreviewFile(null)
      if (fileInputRef.current) {
        fileInputRef.current.value = ''
      }

    } catch (error) {
      console.error('Error saving document:', error)
      toast.error(error instanceof Error ? error.message : 'Failed to save document')
    } finally {
      setIsSaving(false)
    }
  }

  const handleAddDocumentSave = async (data: Partial<Document>, files?: File[] | File | null) => {
    if (!selectedAttendee || !user?.userId || !user?.accessToken) {
      toast.error("Missing required information")
      return
    }

    try {
      console.log('Saving new document:', data)
      
      // If this is from OCR, update the existing document
      if (scannedDocument?.id) {
        await handleDocumentSave(data as DocumentWithAuthority)
        return
      }

      // Otherwise create a new document
      const createData = {
        ...data,
        issueDate: data.issueDate ? formatDateForApi(data.issueDate) : undefined,
        expiryDate: data.expiryDate ? formatDateForApi(data.expiryDate) : undefined,
      }

      const response = await fetch(
        `${API_BASE_URL}/api/v1/training-centers/${user.userId}/attendees/${selectedAttendee.id}/documents`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${user.accessToken}`,
          },
          body: JSON.stringify(createData)
        }
      )

      if (!response.ok) {
        throw new Error('Failed to create document')
      }

      const newDocument = await response.json()
      console.log('Document created successfully:', newDocument)

      toast.success('Document created successfully')
      setIsAddDialogOpen(false)

    } catch (error) {
      console.error('Error creating document:', error)
      toast.error(error instanceof Error ? error.message : 'Failed to create document')
    }
  }

  const handleAttendeeSelect = (attendee: Attendee | null) => {
    setSelectedAttendee(attendee)
    setDocumentSaved(false)
  }

  const handleCancel = async () => {
    if (!scannedDocument?.id || !selectedAttendee || !user?.userId || !user?.accessToken) {
      setIsAddDialogOpen(false)
      return
    }

    try {
      // Delete the uploaded document since user cancelled
      const response = await fetch(
        `${API_BASE_URL}/api/v1/training-centers/${user.userId}/attendees/${selectedAttendee.id}/documents/${scannedDocument.id}`,
        {
          method: 'DELETE',
          headers: {
            'Authorization': `Bearer ${user.accessToken}`,
          }
        }
      )

      if (!response.ok) {
        console.error('Failed to delete cancelled document:', response.status, response.statusText)
        // Don't show error to user since they're cancelling anyway
      } else {
        console.log('Cancelled document deleted successfully')
      }

    } catch (error) {
      console.error('Error deleting cancelled document:', error)
      // Don't show error to user since they're cancelling anyway
    } finally {
      // Clean up state regardless of deletion success
      setScannedDocument(undefined)
      setFile(null)
      setPreviewFile(null)
      if (fileInputRef.current) {
        fileInputRef.current.value = ''
      }
      setIsAddDialogOpen(false)
    }
  }

  const handleDialogClose = () => {
    if (scannedDocument && !documentSaved) {
      // If there's a scanned document that hasn't been saved, show confirmation
      if (confirm('Are you sure you want to close? Any unsaved changes will be lost.')) {
        handleCancel()
      }
    } else {
      setIsAddDialogOpen(false)
    }
  }

  const handleEditDocument = (document: Document) => {
    setScannedDocument(document)
    setIsEditDialogOpen(true)
  }

  // Debug: Log when scannedDocument changes
  useEffect(() => {
    console.log('scannedDocument state changed:', scannedDocument)
    if (scannedDocument) {
      console.log('scannedDocument dates:', {
        issueDate: scannedDocument.issueDate,
        expiryDate: scannedDocument.expiryDate
      })
    }
  }, [scannedDocument])

  // Load attendees on component mount
  useEffect(() => {
    const loadAttendees = async () => {
      if (!user?.userId) {
        setIsLoading(false)
        return
      }
      
      try {
        const response = await getPaginatedAttendees(user.userId)
        setAttendees(response.attendees)
      } catch (error) {
        console.error('Error loading attendees:', error)
        toast.error('Failed to load attendees')
      } finally {
        setIsLoading(false)
      }
    }

    loadAttendees()
  }, [user?.userId])

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="text-center space-y-2">
        <h1 className="text-3xl font-bold text-gray-900">Smart Document Scanner</h1>
        <p className="text-gray-600">Scan and process attendee documents with OCR technology</p>
      </div>

      <div className="flex flex-col items-center space-y-6">
        <div className="w-full max-w-md">
          <Card>
            <CardHeader>
              <CardTitle className="text-center">Select Attendee</CardTitle>
            </CardHeader>
            <CardContent>
              <Select 
                onValueChange={(value) => {
                  const attendee = attendees.find(s => s.id === value) || null
                  handleAttendeeSelect(attendee)
                }}
                disabled={isLoading}
              >
                <SelectTrigger>
                  <SelectValue placeholder={isLoading ? "Loading attendees..." : "Choose an attendee"} />
                </SelectTrigger>
                <SelectContent>
                  {attendees.map((attendee) => (
                    <SelectItem key={attendee.id} value={attendee.id}>
                      {attendee.name} {attendee.surname} - {attendee.rank}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </CardContent>
          </Card>
        </div>

        <div className="w-full max-w-md">
          <Card>
            <CardHeader>
              <CardTitle className="text-center">Upload Document</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid w-full items-center gap-1.5">
                <Label htmlFor="document" className="text-center text-gray-600">
                </Label>
                <div className="flex items-center justify-center gap-4">
                  {previewFile ? (
                    <div className="w-full">
                      <FileUploadPreview
                        files={[previewFile]}
                        onAdd={() => {}}
                        onRemove={handleRemoveFile}
                        onPreview={handlePreviewFile}
                        allowMultiple={false}
                        accept="image/*,.pdf"
                        showRemoveButton={true}
                      />
                    </div>
                  ) : (
                    <Label
                      htmlFor="document"
                      className="flex h-32 w-full cursor-pointer items-center justify-center rounded-lg border-2 border-dashed border-gray-300 px-4 transition-colors hover:border-blue-500/50 hover:bg-blue-50/50"
                    >
                      <div className="space-y-2 text-center">
                        <Upload className="mx-auto h-8 w-8 text-gray-400" />
                        <span className="text-sm text-gray-500">Click to upload</span>
                      </div>
                    </Label>
                  )}
                  <Input 
                    id="document" 
                    type="file" 
                    ref={fileInputRef}
                    accept="image/*,.pdf"
                    onChange={handleFileChange}
                    disabled={!!previewFile}
                    className="hidden" 
                  />
                </div>
              </div>
              
              <div className="flex flex-col space-y-3">
                <Button
                  onClick={() => file && handleScan(file)}
                  disabled={!file || scanning || !selectedAttendee || isLoading}
                  size="lg"
                  className="min-w-[200px] transition-all hover:scale-105"
                >
                  {scanning ? (
                    <>
                      <Scan className="mr-2 h-4 w-4 animate-spin" />
                      Scanning...
                    </>
                  ) : (
                    <>
                      <Scan className="mr-2 h-4 w-4" />
                      Scan Document
                    </>
                  )}
                </Button>
                <Button
                  onClick={handleCameraCapture}
                  disabled={scanning || !selectedAttendee || isLoading}
                  size="lg"
                  variant="outline"
                  className="min-w-[200px] transition-all hover:scale-105"
                >
                  <Camera className="mr-2 h-4 w-4" />
                  Use Camera
                </Button>
              </div>
            </CardContent>
          </Card>

          <div className="text-center text-sm text-gray-500">Supported formats: JPEG, PNG, PDF</div>
        </div>
      </div>

      {/* Preview Dialog */}
      <Dialog open={isPreviewOpen} onOpenChange={setIsPreviewOpen}>
        <DialogContent className="sm:max-w-[900px] h-[80vh]">
          <DialogHeader>
            <DialogTitle>Document Preview</DialogTitle>
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

      {/* Add Document Dialog */}
      <SmartScannerAddDocumentDialog
        open={isAddDialogOpen}
        onOpenChange={setIsAddDialogOpen}
        onSave={handleAddDocumentSave}
        onCancel={handleCancel}
        attendees={attendees}
        hideSailorSelection={true}
        initialData={scannedDocument}
        selectedAttendee={selectedAttendee}
        initialFilePreview={(scannedDocument as any)?.filePreviewItem}
      />

      {/* Edit Document Dialog */}
      {scannedDocument && (
        <DocumentsPageEditDocumentDialog
          open={isEditDialogOpen}
          onOpenChange={setIsEditDialogOpen}
          onSave={handleDocumentSave}
          certificate={scannedDocument as Document}
          attendees={attendees}
          hideSailorSelection={true}
          selectedAttendee={selectedAttendee}
        />
      )}
    </div>
  )
} 