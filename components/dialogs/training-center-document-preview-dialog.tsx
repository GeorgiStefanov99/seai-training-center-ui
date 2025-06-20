"use client"

import React, { useState, useEffect, useCallback } from 'react'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog'
import { FileItem, TrainingCenterDocument } from '@/types/document'
import { getTrainingCenterFileContent, deleteTrainingCenterFile, extractTrainingCenterFileIdOrName } from '@/services/trainingCenterFileService'
import { Loader2, FileText, File, Download, Trash2, ImageIcon, Share2 } from 'lucide-react'
import { toast } from 'sonner'


interface TrainingCenterDocumentPreviewDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  trainingCenterId: string
  document: TrainingCenterDocument | null
  onFileDeleted?: () => void
}

interface FileContentCache {
  content: string
  contentType: string
}

export function TrainingCenterDocumentPreviewDialog({
  open,
  onOpenChange,
  trainingCenterId,
  document,
  onFileDeleted
}: TrainingCenterDocumentPreviewDialogProps) {
  const [activeFileIndex, setActiveFileIndex] = useState(0)
  const [fileContents, setFileContents] = useState<Record<string, FileContentCache>>({})
  const [isLoading, setIsLoading] = useState<Record<string, boolean>>({})
  const [isDownloading, setIsDownloading] = useState<Record<string, boolean>>({})
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false)
  const [isDeleting, setIsDeleting] = useState(false)
  const [fileToDelete, setFileToDelete] = useState<FileItem | null>(null)


  const files = document?.documentFiles || []
  const documentId = document?.id
  const documentName = document?.name

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
    if (!file || !documentId) {
      console.error('Invalid file object or missing document ID')
      return
    }
    
    const fileId = extractTrainingCenterFileIdOrName(file) || file.id
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
      return
    }
    
    try {
      setIsLoading(prev => ({ ...prev, [fileId]: true }))
      
      const result = await getTrainingCenterFileContent({
        trainingCenterId,
        documentId,
        fileId
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
    if (!file || !documentId) {
      toast.error('Invalid file or missing document ID')
      return
    }
    
    const fileId = extractTrainingCenterFileIdOrName(file) || file.id
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
      
      if (fileContents[fileId]) {
        const { content, contentType } = fileContents[fileId]
        const blob = base64ToBlob(content, contentType)
        downloadBlob(blob, file.name || `file-${fileId}`)
        toast.success('Download started')
        return
      }
      
      const result = await getTrainingCenterFileContent({
        trainingCenterId,
        documentId,
        fileId
      })
      
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
    if (!fileToDelete || !documentId) {
      return
    }

    const fileId = extractTrainingCenterFileIdOrName(fileToDelete) || fileToDelete.id
    if (!fileId) {
      toast.error('Cannot delete file: Missing file identifier')
      return
    }

    try {
      setIsDeleting(true)
      
      await deleteTrainingCenterFile({
        trainingCenterId,
        documentId,
        fileId
      })
      
      // Update file contents cache
      setFileContents(prev => {
        const newContents = { ...prev }
        delete newContents[fileId]
        return newContents
      })
      
      // Reset active file index if needed
      if (activeFileIndex >= files.length - 1 && files.length > 1) {
        setActiveFileIndex(0)
      }
      
      toast.success('File deleted successfully')
      
      // Call the onFileDeleted callback to refresh the parent component
      if (onFileDeleted) {
        onFileDeleted()
      }
    } catch (error: any) {
      console.error('Error deleting file:', error)
      toast.error(`Failed to delete file: ${error.message || 'Unknown error'}`)
    } finally {
      setIsDeleting(false)
      setShowDeleteConfirm(false)
      setFileToDelete(null)
    }
  }

  const base64ToBlob = (base64: string, contentType: string): Blob => {
    try {
      const byteCharacters = atob(base64)
      const byteNumbers = new Array(byteCharacters.length)
      for (let i = 0; i < byteCharacters.length; i++) {
        byteNumbers[i] = byteCharacters.charCodeAt(i)
      }
      const byteArray = new Uint8Array(byteNumbers)
      return new Blob([byteArray], { type: contentType })
    } catch (error) {
      console.error('Error converting base64 to blob:', error)
      throw new Error('Failed to process file data')
    }
  }

  const downloadBlob = (blob: Blob, fileName: string) => {
    const url = window.URL.createObjectURL(blob)
    const link = window.document.createElement('a')
    link.href = url
    link.download = fileName
    window.document.body.appendChild(link)
    link.click()
    window.document.body.removeChild(link)
    window.URL.revokeObjectURL(url)
  }

  const getFileIcon = (contentType?: string) => {
    if (!contentType) return <FileText className="h-4 w-4" />
    
    if (contentType.includes('image')) {
      return <ImageIcon className="h-4 w-4" />
    } else if (contentType.includes('pdf')) {
      return <FileText className="h-4 w-4" />
    } else {
      return <File className="h-4 w-4" />
    }
  }

  if (!document) {
    return null
  }

  return (
    <>
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="sm:max-w-[95vw] sm:max-h-[95vh] h-[95vh] flex flex-col p-0">
          <DialogHeader className="flex-shrink-0 p-6 pb-2 border-b">
            <DialogTitle className="text-xl">
              {documentName || 'Training Center Document'}
            </DialogTitle>
          </DialogHeader>
          
          {files.length === 0 ? (
            <div className="flex-1 flex items-center justify-center p-6">
              <div className="text-center space-y-2">
                <FileText className="h-12 w-12 mx-auto text-muted-foreground" />
                <p className="text-sm text-muted-foreground">No files attached to this document</p>
              </div>
            </div>
          ) : (
            <div className="flex-1 flex flex-col overflow-hidden">
              <Tabs value={activeFileIndex.toString()} onValueChange={(value) => setActiveFileIndex(parseInt(value))} className="flex-1 flex flex-col overflow-hidden">
                <div className="flex-shrink-0 px-6 pt-2">
                  <TabsList className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-1 h-auto p-1 bg-muted/50">
                    {files.map((file, index) => {
                      const fileId = extractTrainingCenterFileIdOrName(file) || file.id || `file-${index}`
                      const isLoadingFile = isLoading[fileId]
                      const isDownloadingFile = isDownloading[fileId]
                      
                      return (
                        <TabsTrigger
                          key={fileId}
                          value={index.toString()}
                          className="flex flex-col items-center p-2 h-auto min-h-[60px] text-xs relative"
                        >
                          <div className="flex items-center space-x-1 mb-1">
                            {getFileIcon(file.contentType)}
                            <span className="truncate max-w-[100px]" title={file.name}>
                              {file.name || `File ${index + 1}`}
                            </span>
                          </div>
                          <div className="flex space-x-1">
                            <Button
                              variant="ghost"
                              size="sm"
                              className="h-6 w-6 p-0"
                              onClick={(e) => {
                                e.stopPropagation()
                                downloadFile(file)
                              }}
                              disabled={isDownloadingFile}
                              title="Download"
                            >
                              {isDownloadingFile ? (
                                <Loader2 className="h-3 w-3 animate-spin" />
                              ) : (
                                <Download className="h-3 w-3" />
                              )}
                            </Button>
                            <Button
                              variant="ghost"
                              size="sm"
                              className="h-6 w-6 p-0 text-destructive hover:text-destructive"
                              onClick={(e) => {
                                e.stopPropagation()
                                handleDeleteClick(file)
                              }}
                              title="Delete"
                            >
                              <Trash2 className="h-3 w-3" />
                            </Button>
                          </div>
                          {isLoadingFile && (
                            <div className="absolute inset-0 bg-background/80 flex items-center justify-center">
                              <Loader2 className="h-4 w-4 animate-spin" />
                            </div>
                          )}
                        </TabsTrigger>
                      )
                    })}
                  </TabsList>
                </div>
                
                {files.map((file, index) => {
                  const fileId = extractTrainingCenterFileIdOrName(file) || file.id || `file-${index}`
                  const fileContent = fileContents[fileId]
                  const isLoadingFile = isLoading[fileId]
                  
                  return (
                    <TabsContent 
                      key={fileId} 
                      value={index.toString()} 
                      className="flex-1 m-0 p-4 overflow-hidden"
                    >
                      <div className="h-full border rounded-lg overflow-hidden bg-background">
                        {isLoadingFile ? (
                          <div className="h-full flex items-center justify-center">
                            <div className="text-center space-y-2">
                              <Loader2 className="h-8 w-8 animate-spin mx-auto" />
                              <p className="text-sm text-muted-foreground">Loading file content...</p>
                            </div>
                          </div>
                        ) : fileContent ? (
                          <FilePreview content={fileContent.content} contentType={fileContent.contentType} />
                        ) : (
                          <div className="h-full flex items-center justify-center">
                            <div className="text-center space-y-2">
                              <FileText className="h-8 w-8 mx-auto text-muted-foreground" />
                              <p className="text-sm text-muted-foreground">Click to load file content</p>
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => loadFileContent(file)}
                              >
                                Load File
                              </Button>
                            </div>
                          </div>
                        )}
                      </div>
                    </TabsContent>
                  )
                })}
              </Tabs>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={showDeleteConfirm} onOpenChange={setShowDeleteConfirm}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete File</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete "{fileToDelete?.name}"? This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isDeleting}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={confirmDelete}
              disabled={isDeleting}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {isDeleting ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Deleting...
                </>
              ) : (
                'Delete File'
              )}
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
  if (contentType.includes('image')) {
    return (
      <div className="h-full flex items-center justify-center p-4">
        <img
          src={`data:${contentType};base64,${content}`}
          alt="Document preview"
          className="max-w-full max-h-full object-contain"
        />
      </div>
    )
  }

  if (contentType.includes('pdf')) {
    return (
      <div className="h-full">
        <iframe
          src={`data:${contentType};base64,${content}`}
          className="w-full h-full border-0"
          title="PDF Preview"
        />
      </div>
    )
  }

  // For other file types, show a download prompt
  return (
    <div className="h-full flex items-center justify-center p-4">
      <div className="text-center space-y-4">
        <FileText className="h-16 w-16 mx-auto text-muted-foreground" />
        <div>
          <p className="text-lg font-medium">Preview not available</p>
          <p className="text-sm text-muted-foreground">
            This file type cannot be previewed. Please download to view.
          </p>
        </div>
      </div>
    </div>
  )
} 