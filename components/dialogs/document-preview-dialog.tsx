"use client"

import React, { useState, useEffect } from "react"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { FileItem } from "@/types/document"
import { getFileContent, deleteFile, extractFileIdOrName } from "@/services/fileService"
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog"
import { Download, Loader2, Trash2, FileText, Image as ImageIcon, File, X } from "lucide-react"
import { toast } from "sonner"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"

interface DocumentPreviewDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  trainingCenterId: string
  attendeeId: string
  documentId: string
  files: FileItem[]
  onFileDeleted?: () => void
}

interface FileContentCache {
  content: string
  contentType: string
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
  const [activeFileIndex, setActiveFileIndex] = useState(0)
  const [fileContents, setFileContents] = useState<Record<string, FileContentCache>>({})
  const [isLoading, setIsLoading] = useState<Record<string, boolean>>({})
  const [isDownloading, setIsDownloading] = useState<Record<string, boolean>>({})
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false)
  const [isDeleting, setIsDeleting] = useState(false)
  const [fileToDelete, setFileToDelete] = useState<FileItem | null>(null)
  
  // Get the active file based on the current index
  const activeFile = files && files.length > activeFileIndex ? files[activeFileIndex] : null

  // Load file content when active file changes or dialog opens
  useEffect(() => {
    if (open && files && files.length > 0) {
      const tabIndex = parseInt(activeFileIndex.toString());
      if (isNaN(tabIndex) || tabIndex < 0 || tabIndex >= files.length) {
        console.warn('Invalid tab index:', activeFileIndex, 'defaulting to 0');
        setActiveFileIndex(0);
        loadFileContent(files[0]);
      } else {
        loadFileContent(files[tabIndex]);
      }
    }
  }, [open, activeFileIndex, files])

  const loadFileContent = async (file: FileItem) => {
    if (!file) {
      console.error('Invalid file object')
      return
    }
    
    const fileId = extractFileIdOrName(file) || file.id
    if (!fileId) {
      console.error('Missing file ID', file)
      
      if ((file as any)._originalResponse) {
        const originalResponse = (file as any)._originalResponse
        console.error('Original file response:', originalResponse)
        console.error('Headers:', originalResponse.headers)
        
        if (typeof originalResponse.body === 'string') {
          console.error('Body preview:', originalResponse.body.substring(0, 100))
        }
      }
      
      toast.error('Cannot preview file: Missing file identifier')
      return
    }
    
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
    
    const fileId = extractFileIdOrName(file) || file.id
    if (!fileId) {
      console.error('Missing file ID for download', file)
      
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
      console.log(`Downloading file ${fileId}`)
      
      if (fileContents[fileId]) {
        console.log(`Using cached content for download of file ${fileId}`)
        const { content, contentType } = fileContents[fileId]
        const blob = base64ToBlob(content, contentType)
        downloadBlob(blob, file.name || `file-${fileId}`)
        toast.success('Download started')
        return
      }
      
      const result = await getFileContent({
        trainingCenterId,
        attendeeId,
        documentId,
        fileId
      })
      
      console.log(`File content fetched for download: ${fileId}`)
      
      const blob = base64ToBlob(result.content, result.contentType)
      downloadBlob(blob, file.name || `file-${fileId}`)
      
      setFileContents(prev => ({
        ...prev,
        [fileId]: {
          content: result.content,
          contentType: result.contentType
        }
      }))
      
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
    setShowDeleteConfirm(true)
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
      setShowDeleteConfirm(false)
      
      const newFileContents = { ...fileContents }
      delete newFileContents[fileToDelete.id]
      setFileContents(newFileContents)
      
      if (onFileDeleted) {
        onFileDeleted()
      }
      
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
        <DialogContent className="sm:max-w-[95vw] w-[95vw] h-[90vh] max-h-[90vh] flex flex-col overflow-hidden p-4">
          <DialogHeader>
            <DialogTitle>Document Preview</DialogTitle>
          </DialogHeader>
          
          {files.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12">
              <FileText className="h-16 w-16 text-muted-foreground mb-4" />
              <p className="text-muted-foreground">No files available for this document</p>
            </div>
          ) : (
            <Tabs value={activeFileIndex.toString()} onValueChange={(value) => setActiveFileIndex(parseInt(value))}>
              <div className="flex flex-1 overflow-hidden">
                {/* Left sidebar with file list */}
                <div className="w-72 border-r p-2 overflow-y-auto bg-muted/30">
                  <div className="mb-2 px-2 py-1 text-sm font-medium text-muted-foreground">
                    Files ({files.length})
                  </div>
                  <TabsList className="flex flex-col h-auto bg-transparent gap-1">
                    {files.map((file, index) => (
                      <TabsTrigger
                        key={file.id || index}
                        value={`${index}`}
                        className="flex items-center justify-start gap-2 px-2 py-2 h-auto w-full text-left"
                      >
                        {getFileIcon(file.contentType)}
                        <div className="flex flex-col overflow-hidden">
                          <span className="truncate max-w-[180px] font-medium">
                            {file.name || `File ${index + 1}`}
                          </span>
                          <span className="text-xs text-muted-foreground truncate">
                            {file.contentType?.split('/')[1] || 'unknown'} · {file.size ? `${Math.round(file.size / 1024)} KB` : 'Unknown size'}
                          </span>
                        </div>
                      </TabsTrigger>
                    ))}
                  </TabsList>
                </div>

                {/* Main content area */}
                <div className="flex-1 flex flex-col overflow-hidden max-w-[calc(100%-18rem)] ml-2">
                  {/* File action toolbar */}
                  {activeFile && (
                    <div className="flex justify-between items-center p-2 border-b bg-muted/20">
                      <div className="flex items-center gap-2">
                        {getFileIcon(activeFile.contentType)}
                        <div className="flex flex-col">
                          <span className="font-medium">{activeFile.name || `File ${activeFileIndex + 1}`}</span>
                          <span className="text-xs text-muted-foreground">
                            {activeFile.contentType} · {activeFile.size ? `${Math.round(activeFile.size / 1024)} KB` : 'Unknown size'}
                          </span>
                        </div>
                      </div>

                      <div className="flex gap-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => downloadFile(activeFile)}
                          disabled={isDownloading[activeFile.id || '']}
                        >
                          {isDownloading[activeFile.id || ''] ? (
                            <>
                              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                              Downloading...
                            </>
                          ) : (
                            <>
                              <Download className="h-4 w-4 mr-2" />
                              Download
                            </>
                          )}
                        </Button>

                        <Button
                          variant="destructive"
                          size="sm"
                          onClick={() => handleDeleteClick(activeFile)}
                          disabled={isDeleting}
                        >
                          {isDeleting ? (
                            <>
                              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                              Deleting...
                            </>
                          ) : (
                            <>
                              <Trash2 className="h-4 w-4 mr-2" />
                              Delete
                            </>
                          )}
                        </Button>
                      </div>
                    </div>
                  )}

                  {/* File content area */}
                  {files.map((file, index) => (
                    <TabsContent
                      key={file.id || index}
                      value={`${index}`}
                      className="flex-1 overflow-auto data-[state=active]:flex data-[state=active]:flex-col p-4"
                    >
                      {isLoading[file.id || ''] ? (
                        <div className="flex-1 flex items-center justify-center">
                          <Loader2 className="h-8 w-8 animate-spin" />
                          <span className="ml-2">Loading file content...</span>
                        </div>
                      ) : fileContents[file.id || ''] ? (
                        <div className="flex-1 overflow-auto bg-white rounded-md shadow-md border h-full">
                          <FilePreview
                            content={fileContents[file.id || ''].content}
                            contentType={fileContents[file.id || ''].contentType}
                          />
                        </div>
                      ) : (
                        <div className="flex-1 flex items-center justify-center flex-col">
                          <FileText className="h-16 w-16 text-gray-300 mb-4" />
                          <p className="text-gray-500">No preview available</p>
                          <Button
                            variant="outline"
                            size="sm"
                            className="mt-4"
                            onClick={() => loadFileContent(file)}
                          >
                            Load Preview
                          </Button>
                        </div>
                      )}
                    </TabsContent>
                  ))}
                </div>
              </div>
            </Tabs>
          )}

          <AlertDialog open={showDeleteConfirm} onOpenChange={setShowDeleteConfirm}>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>Are you sure?</AlertDialogTitle>
                <AlertDialogDescription>
                  This action cannot be undone. This will permanently delete the file.
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>Cancel</AlertDialogCancel>
                <AlertDialogAction onClick={confirmDelete}>Delete</AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        </DialogContent>
      </Dialog>
    </>
  )
}

interface FilePreviewProps {
  content: string
  contentType: string
}

function FilePreview({ content, contentType }: FilePreviewProps) {
  if (!content) {
    return (
      <div className="flex items-center justify-center h-full">
        <p className="text-muted-foreground">No content available</p>
      </div>
    )
  }

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
    if (contentType.startsWith('image/')) {
      return (
        <div className="flex items-center justify-center h-full w-full p-2 bg-gray-50 rounded-md">
          <img
            src={`data:${contentType};base64,${content}`}
            alt="Preview"
            className="max-h-[75vh] max-w-full object-contain shadow-md rounded-sm"
            style={{ objectFit: 'contain' }}
            onError={(e) => {
              console.error('Error loading image:', e);
              e.currentTarget.alt = 'Image preview failed';
              e.currentTarget.parentElement!.innerHTML += '<p class="text-destructive mt-4">Failed to load image preview</p>';
            }}
          />
        </div>
      )
    }

    if (contentType === 'application/pdf') {
      return (
        <div className="h-full w-full bg-gray-50 p-2">
          <iframe
            src={`data:${contentType};base64,${content}`}
            className="h-full w-full border-0 shadow-md rounded-sm"
            title="PDF Preview"
            style={{ minHeight: '70vh' }}
            onError={(e) => {
              console.error('Error loading PDF:', e);
              const container = e.currentTarget.parentElement;
              if (container) {
                container.innerHTML = '<div class="flex flex-col items-center justify-center h-full p-8 text-center"><FileText className="h-16 w-16 text-gray-300 mb-4" /><p class="text-destructive">Failed to load PDF preview</p></div>';
              }
            }}
          />
        </div>
      )
    }

    return (
      <div className="flex flex-col items-center justify-center h-full p-8 text-center bg-gray-50">
        <FileText className="h-20 w-20 text-primary mb-4" />
        <p className="text-lg font-medium mb-2">No preview available for this file type</p>
        <p className="text-muted-foreground mb-4">You can download the file to view it in its native application.</p>
        <div className="text-sm text-muted-foreground mt-2">
          <p>File type: {contentType || 'Unknown'}</p>
        </div>
      </div>
    )
  } catch (error) {
    console.error('Error rendering preview:', error)
    return (
      <div className="flex flex-col items-center justify-center h-full p-8 text-center bg-gray-50">
        <FileText className="h-20 w-20 text-destructive mb-4" />
        <p className="text-lg font-medium mb-2">Preview error</p>
        <p className="text-muted-foreground mb-4">
          An error occurred while trying to preview this file.
        </p>
      </div>
    )
  }
}
