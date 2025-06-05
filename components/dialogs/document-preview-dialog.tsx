"use client"

import React, { useState, useEffect } from "react"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { FileItem } from "@/types/document"
import { getFileContent, deleteFile, getFileDownloadUrl, extractFileIdOrName } from "@/services/fileService"
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog"
import { Download, Loader2, Trash2, FileText, Image as ImageIcon, File, X } from "lucide-react"
import { toast } from "sonner"

interface DocumentPreviewDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  trainingCenterId: string
  attendeeId: string
  documentId: string
  files: FileItem[]
  onFileDeleted?: () => void
}

export function DocumentPreviewDialog({
  open,
  onOpenChange,
  trainingCenterId,
  attendeeId,
  documentId,
  files,
  onFileDeleted
}: DocumentPreviewDialogProps) {
  const [activeTab, setActiveTab] = useState<string>('0')
  const [fileContents, setFileContents] = useState<Record<string, { content: string, contentType: string }>>({})  
  const [isLoading, setIsLoading] = useState<Record<string, boolean>>({})
  const [isDownloading, setIsDownloading] = useState<Record<string, boolean>>({})
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false)
  const [fileToDelete, setFileToDelete] = useState<FileItem | null>(null)
  const [isDeleting, setIsDeleting] = useState(false)

  // Load file content when tab changes or dialog opens
  useEffect(() => {
    if (open && files && files.length > 0) {
      const tabIndex = parseInt(activeTab);
      if (isNaN(tabIndex) || tabIndex < 0 || tabIndex >= files.length) {
        console.warn('Invalid tab index:', activeTab, 'defaulting to 0');
        setActiveTab('0');
        loadFileContent(files[0]);
      } else {
        loadFileContent(files[tabIndex]);
      }
    }
  }, [open, activeTab, files])

  const loadFileContent = async (file: FileItem) => {
    if (!file) {
      console.error('Invalid file object')
      return
    }
    
    // Extract file ID using our robust helper function
    // This will handle both regular file objects and raw API responses
    const fileId = extractFileIdOrName(file) || file.id
    if (!fileId) {
      console.error('Missing file ID', file)
      
      // If we have the original response object, try to extract more debug info
      if ((file as any)._originalResponse) {
        const originalResponse = (file as any)._originalResponse
        console.error('Original file response:', originalResponse)
        console.error('Headers:', originalResponse.headers)
        
        // Try to show a preview of the body for debugging
        if (typeof originalResponse.body === 'string') {
          console.error('Body preview:', originalResponse.body.substring(0, 100))
        }
      }
      
      toast.error('Cannot preview file: Missing file identifier')
      return
    }
    
    // Skip if we already have the content
    if (fileContents[fileId]) {
      console.log(`Using cached content for file ${fileId}`)
      return
    }
    
    try {
      console.log(`Loading content for file ${fileId}`, {
        trainingCenterId,
        attendeeId,
        documentId,
        fileId,
        fileName: file.name,
        contentType: file.contentType,
        originalFile: file
      })
      
      setIsLoading(prev => ({ ...prev, [fileId]: true }))
      
      const result = await getFileContent({
        trainingCenterId,
        attendeeId,
        documentId,
        fileId
      })
      
      console.log(`Content loaded successfully for file ${fileId}`, {
        contentLength: result.content?.length || 0,
        contentType: result.contentType
      })
      
      if (!result.content) {
        console.warn(`Empty content received for file ${fileId}`)
        toast.warning('File appears to be empty')
      }
      
      setFileContents(prev => ({
        ...prev,
        [fileId]: {
          content: result.content || '',
          contentType: result.contentType || file.contentType || 'application/octet-stream'
        }
      }))
    } catch (error: any) {
      console.error('Error loading file content:', error)
      
      // Provide more specific error messages based on the error
      if (error?.response?.status === 404) {
        toast.error('File not found on the server')
      } else if (error?.response?.status === 403) {
        toast.error('You do not have permission to access this file')
      } else if (error?.response?.status === 401) {
        toast.error('Authentication error. Please log in again')
      } else {
        toast.error(`Failed to load file content: ${error.message || 'Unknown error'}`)
      }
    } finally {
      setIsLoading(prev => ({ ...prev, [fileId]: false }))
    }
  }

  const downloadFile = async (file: FileItem) => {
    if (!file) {
      toast.error('Invalid file')
      return
    }
    
    // Extract file ID using our robust helper function
    const fileId = extractFileIdOrName(file) || file.id
    if (!fileId) {
      console.error('Missing file ID for download', file)
      
      // If we have the original response object, try to extract more debug info
      if ((file as any)._originalResponse) {
        const originalResponse = (file as any)._originalResponse
        console.error('Original file response for download:', originalResponse)
        console.error('Headers:', originalResponse.headers)
      }
      
      toast.error('Cannot download file: Missing file identifier')
      return
    }
    
    try {
      setIsDownloading(prev => ({ ...prev, [fileId]: true }))
      console.log(`Generating download URL for file ${fileId}`)
      
      const downloadUrl = await getFileDownloadUrl({
        trainingCenterId,
        attendeeId,
        documentId,
        fileId
      })
      
      console.log(`Download URL generated: ${downloadUrl}`)
      
      // Create a temporary anchor element to trigger the download
      const link = document.createElement('a')
      link.href = downloadUrl
      link.download = file.name || `file-${fileId}`
      link.target = '_blank' // Open in new tab in case direct download doesn't work
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)
      
      toast.success('Download started')
    } catch (error) {
      console.error('Error downloading file:', error)
      toast.error(`Failed to download file: ${error instanceof Error ? error.message : 'Unknown error'}`)
    } finally {
      setIsDownloading(prev => ({ ...prev, [fileId]: false }))
    }
  }

  const handleDeleteClick = (file: FileItem) => {
    setFileToDelete(file)
    setDeleteDialogOpen(true)
  }

  const confirmDelete = async () => {
    if (!fileToDelete) return
    
    try {
      setIsDeleting(true)
      
      await deleteFile({
        trainingCenterId,
        attendeeId,
        documentId,
        fileId: fileToDelete.id
      })
      
      toast.success('File deleted successfully')
      setDeleteDialogOpen(false)
      
      // Remove from local state
      const newFileContents = { ...fileContents }
      delete newFileContents[fileToDelete.id]
      setFileContents(newFileContents)
      
      // Call the callback to refresh documents
      if (onFileDeleted) {
        onFileDeleted()
      }
      
      // Close the dialog if no files left
      if (files.length <= 1) {
        onOpenChange(false)
      }
    } catch (error) {
      console.error('Error deleting file:', error)
      toast.error('Failed to delete file')
    } finally {
      setIsDeleting(false)
    }
  }

  // Helper function to convert base64 to blob
  const base64ToBlob = (base64: string, contentType: string): Blob => {
    const byteCharacters = atob(base64)
    const byteArrays = []

    for (let offset = 0; offset < byteCharacters.length; offset += 512) {
      const slice = byteCharacters.slice(offset, offset + 512)
      const byteNumbers = new Array(slice.length)
      
      for (let i = 0; i < slice.length; i++) {
        byteNumbers[i] = slice.charCodeAt(i)
      }
      
      const byteArray = new Uint8Array(byteNumbers)
      byteArrays.push(byteArray)
    }

    return new Blob(byteArrays, { type: contentType })
  }

  // Helper function to download a blob
  const downloadBlob = (blob: Blob, fileName: string) => {
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = fileName
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    URL.revokeObjectURL(url)
  }

  // Determine file type icon
  const getFileIcon = (contentType?: string) => {
    if (!contentType) {
      return <File className="h-5 w-5" />
    }
    
    if (contentType.startsWith('image/')) {
      return <ImageIcon className="h-5 w-5" />
    } else if (contentType.includes('pdf')) {
      return <FileText className="h-5 w-5" />
    } else {
      return <File className="h-5 w-5" />
    }
  }

  return (
    <>
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-hidden flex flex-col">
          <DialogHeader>
            <DialogTitle>Document Preview</DialogTitle>
          </DialogHeader>
          
          {files.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12">
              <FileText className="h-16 w-16 text-muted-foreground mb-4" />
              <p className="text-muted-foreground">No files available for this document</p>
            </div>
          ) : files.length === 1 ? (
            // Single file view
            <div className="flex flex-col flex-1 overflow-hidden">
              <div className="flex justify-between items-center mb-4">
                <div className="flex items-center">
                  {getFileIcon(files[0].contentType)}
                  <span className="ml-2 font-medium">{files[0].name}</span>
                </div>
                <div className="flex space-x-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => downloadFile(files[0])}
                    disabled={isDownloading[files[0]?.id]}
                  >
                    {isDownloading[files[0]?.id] ? (
                      <Loader2 className="h-4 w-4 animate-spin mr-2" />
                    ) : (
                      <Download className="h-4 w-4 mr-2" />
                    )}
                    Download
                  </Button>
                  <Button
                    variant="destructive"
                    size="sm"
                    onClick={() => handleDeleteClick(files[0])}
                  >
                    <Trash2 className="h-4 w-4 mr-2" />
                    Delete
                  </Button>
                </div>
              </div>
              
              <div className="flex-1 overflow-auto border rounded-md">
                {isLoading[files[0].id] ? (
                  <div className="flex items-center justify-center h-full">
                    <Loader2 className="h-8 w-8 animate-spin" />
                  </div>
                ) : fileContents[files[0].id] ? (
                  <FilePreview
                    content={fileContents[files[0].id].content}
                    contentType={fileContents[files[0].id].contentType}
                  />
                ) : (
                  <div className="flex items-center justify-center h-full">
                    <p className="text-muted-foreground">Failed to load file content</p>
                  </div>
                )}
              </div>
            </div>
          ) : (
            // Multiple files view with tabs
            <div className="flex flex-col flex-1 overflow-hidden">
              <Tabs
                value={activeTab}
                onValueChange={setActiveTab}
                className="flex flex-col flex-1 overflow-hidden"
              >
                <TabsList className="mb-4">
                  {files.map((file, index) => (
                    <TabsTrigger key={file.id} value={index.toString()} className="flex items-center">
                      {getFileIcon(file.contentType)}
                      <span className="ml-2 truncate max-w-[100px]">{file.name}</span>
                    </TabsTrigger>
                  ))}
                </TabsList>
                
                {files.map((file, index) => (
                  <TabsContent
                    key={file.id}
                    value={index.toString()}
                    className="flex-1 overflow-hidden flex flex-col"
                  >
                    <div className="flex justify-between items-center mb-4">
                      <div className="flex items-center">
                        {getFileIcon(file.contentType)}
                        <span className="ml-2 font-medium">{file.name}</span>
                      </div>
                      <div className="flex space-x-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => downloadFile(file)}
                          disabled={isDownloading[file?.id]}
                        >
                          {isDownloading[file?.id] ? (
                            <Loader2 className="h-4 w-4 animate-spin mr-2" />
                          ) : (
                            <Download className="h-4 w-4 mr-2" />
                          )}
                          Download
                        </Button>
                        <Button
                          variant="destructive"
                          size="sm"
                          onClick={() => handleDeleteClick(file)}
                        >
                          <Trash2 className="h-4 w-4 mr-2" />
                          Delete
                        </Button>
                      </div>
                    </div>
                    
                    <div className="flex-1 overflow-auto border rounded-md">
                      {isLoading[file.id] ? (
                        <div className="flex items-center justify-center h-full">
                          <Loader2 className="h-8 w-8 animate-spin" />
                        </div>
                      ) : fileContents[file.id] ? (
                        <FilePreview
                          content={fileContents[file.id].content}
                          contentType={fileContents[file.id].contentType}
                        />
                      ) : (
                        <div className="flex items-center justify-center h-full">
                          <p className="text-muted-foreground">Failed to load file content</p>
                        </div>
                      )}
                    </div>
                  </TabsContent>
                ))}
              </Tabs>
            </div>
          )}
        </DialogContent>
      </Dialog>
      
      {/* Delete confirmation dialog */}
      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete File</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete this file? This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isDeleting}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={confirmDelete}
              disabled={isDeleting}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {isDeleting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  )
}

interface FilePreviewProps {
  content: string
  contentType: string
}

function FilePreview({ content, contentType }: FilePreviewProps) {
  // Handle empty content
  if (!content) {
    return (
      <div className="flex items-center justify-center h-full">
        <p className="text-muted-foreground">No content available</p>
      </div>
    )
  }

  // Handle missing content type
  if (!contentType) {
    console.warn('Missing content type in FilePreview, defaulting to generic preview')
    return (
      <div className="flex flex-col items-center justify-center h-full p-8 text-center">
        <FileText className="h-16 w-16 text-primary mb-4" />
        <h3 className="text-lg font-medium mb-2">Preview not available</h3>
        <p className="text-muted-foreground mb-4">
          Unable to determine file type. Please download the file to view its contents.
        </p>
      </div>
    )
  }

  try {
    // Handle image files
    if (contentType.startsWith('image/')) {
      return (
        <div className="flex items-center justify-center h-full p-4">
          <img
            src={`data:${contentType};base64,${content}`}
            alt="Document preview"
            className="max-w-full max-h-full object-contain"
            onError={(e) => {
              console.error('Error loading image:', e)
              e.currentTarget.src = ''
              e.currentTarget.alt = 'Image preview failed'
              e.currentTarget.className = 'hidden'
              e.currentTarget.parentElement!.innerHTML = '<p class="text-destructive">Failed to load image preview</p>'
            }}
          />
        </div>
      )
    }

    // Handle PDF files
    if (contentType === 'application/pdf') {
      return (
        <div className="h-full w-full">
          <iframe
            src={`data:${contentType};base64,${content}`}
            className="w-full h-full"
            title="PDF Preview"
            onError={(e) => {
              console.error('Error loading PDF:', e)
              const container = e.currentTarget.parentElement
              if (container) {
                container.innerHTML = '<div class="flex flex-col items-center justify-center h-full p-8 text-center"><p class="text-destructive">Failed to load PDF preview</p></div>'
              }
            }}
          />
        </div>
      )
    }

    // For other file types (Word, Excel, etc.)
    return (
      <div className="flex flex-col items-center justify-center h-full p-8 text-center">
        <FileText className="h-16 w-16 text-primary mb-4" />
        <h3 className="text-lg font-medium mb-2">Preview not available</h3>
        <p className="text-muted-foreground mb-4">
          This file type ({contentType}) cannot be previewed. Please download the file to view its contents.
        </p>
      </div>
    )
  } catch (error) {
    console.error('Error in FilePreview:', error)
    return (
      <div className="flex flex-col items-center justify-center h-full p-8 text-center">
        <FileText className="h-16 w-16 text-destructive mb-4" />
        <h3 className="text-lg font-medium mb-2">Preview error</h3>
        <p className="text-muted-foreground mb-4">
          An error occurred while trying to preview this file. Please try downloading it instead.
        </p>
      </div>
    )
  }
}
