"use client"

import { useState, useCallback } from "react"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { toast } from "sonner"
import { Loader2, Share2, Link, AlertCircle, Copy, Check, Download } from "lucide-react"
import { API_BASE_URL } from "@/lib/config/api"
import { getAuthToken } from "@/services/courseTemplateService"
import { FileItem } from "@/types/document"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"

interface ShareFileDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  file: FileItem
  documentName?: string
  trainingCenterId: string
  attendeeId: string
  documentId: string
}

export function ShareFileDialog({
  open,
  onOpenChange,
  file,
  documentName,
  trainingCenterId,
  attendeeId,
  documentId,
}: ShareFileDialogProps) {
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [generatedLink, setGeneratedLink] = useState<{ url: string; fileName: string } | null>(null)
  const [copied, setCopied] = useState(false)
  const [activeTab, setActiveTab] = useState("share")

  const prepareFileForSharing = async (): Promise<File> => {
    if (!file || !file.id) {
      throw new Error("No valid file data provided")
    }

    const token = getAuthToken()
    if (!token) {
      throw new Error("Authentication token not available")
    }

    // Get the file content
    const url = `${API_BASE_URL}/api/v1/training-centers/${trainingCenterId}/attendees/${attendeeId}/documents/${documentId}/files/${encodeURIComponent(file.id)}`
    
    const response = await fetch(url, {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    })

    if (!response.ok) {
      throw new Error(`Failed to fetch file: ${response.status} ${response.statusText}`)
    }

    // Get the file as blob
    const blob = await response.blob()
    
    // Determine the correct file extension based on content type
    const contentType = file.contentType || 'application/octet-stream'
    let fileName = file.name || documentName || 'document'
    fileName = typeof fileName === 'string' ? fileName.replace(/[^a-zA-Z0-9.-]/g, '_') : 'document'

    // Ensure proper file extension
    if (!fileName.includes('.')) {
      if (contentType.includes('pdf')) {
        fileName += '.pdf'
      } else if (contentType.includes('jpeg') || contentType.includes('jpg')) {
        fileName += '.jpg'
      } else if (contentType.includes('png')) {
        fileName += '.png'
      } else if (contentType.includes('docx')) {
        fileName += '.docx'
      } else if (contentType.includes('xlsx')) {
        fileName += '.xlsx'
      } else if (contentType.includes('pptx')) {
        fileName += '.pptx'
      } else if (contentType.includes('txt')) {
        fileName += '.txt'
      }
    }

    // Create a File object with the correct type
    return new File([blob], fileName, { type: contentType })
  }

  const handleShare = async () => {
    setIsLoading(true)
    setError(null)
    const loadingToast = toast.loading("Preparing file for sharing...")

    try {
      // Prepare the file for sharing
      const fileToShare = await prepareFileForSharing()

      // Check if Web Share API is available
      if (navigator.share) {
        try {
          // Check if the browser supports sharing files
          if (navigator.canShare && !navigator.canShare({ files: [fileToShare] })) {
            throw new Error("Your browser doesn't support sharing this type of file")
          }

          // Prepare share data
          const shareData = {
            title: documentName || "Document",
            text: `Document: ${documentName || "Document"}`,
            files: [fileToShare]
          }

          // Attempt to share
          await navigator.share(shareData)
          toast.success("File shared successfully")
          onOpenChange(false)
          return
        } catch (err: any) {
          console.error("Web Share API error:", err)
          
          if (err.name === 'NotAllowedError') {
            toast.error("Sharing was cancelled or permission was denied")
          } else if (err.name === 'AbortError') {
            toast.error("Sharing was cancelled")
          } else if (err.name === 'TypeError') {
            toast.error("Your browser doesn't support sharing files")
          } else {
            toast.error("Failed to share file")
          }
          
          // Fallback to link generation
          await handleGenerateLink()
          return
        }
      } else {
        // If Web Share API is not available, generate a link
        await handleGenerateLink()
      }
    } catch (error: any) {
      console.error("Error sharing file:", error)
      setError(error.message || "Failed to share file")
      toast.error(error.message || "Failed to share file")
    } finally {
      setIsLoading(false)
      toast.dismiss(loadingToast)
    }
  }

  const handleGenerateLink = async () => {
    setIsLoading(true)
    setCopied(false)
    setActiveTab("link")
    const loadingToast = toast.loading("Generating share link...")

    try {
      const fileId = file.id
      
      if (!fileId) {
        throw new Error("Could not determine file ID")
      }

      const token = getAuthToken()
      if (!token) {
        throw new Error("Authentication token not available")
      }

      const url = `${API_BASE_URL}/api/v1/training-centers/${trainingCenterId}/attendees/${attendeeId}/documents/${documentId}/files/${encodeURIComponent(fileId)}/download-url`
      
      const response = await fetch(url, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      })

      if (!response.ok) {
        throw new Error(`Failed to generate link: ${response.status} ${response.statusText}`)
      }

      const downloadUrl = await response.text()
      
      if (!downloadUrl) {
        throw new Error(`No download URL received for ${file.name || fileId}`)
      }

      setGeneratedLink({
        url: downloadUrl,
        fileName: file.name || fileId
      })
      
      toast.dismiss(loadingToast)
      toast.success("Link generated successfully")
    } catch (error) {
      console.error("Error generating link:", error)
      toast.dismiss(loadingToast)
      toast.error(error instanceof Error ? error.message : "Failed to generate link")
    } finally {
      setIsLoading(false)
    }
  }

  const copyToClipboard = async () => {
    if (!generatedLink) return

    try {
      await navigator.clipboard.writeText(generatedLink.url)
      setCopied(true)
      toast.success("Link copied to clipboard")
      
      setTimeout(() => setCopied(false), 2000)
    } catch (error) {
      console.error("Failed to copy link:", error)
      toast.error("Failed to copy link to clipboard")
    }
  }

  const downloadFile = async () => {
    if (!generatedLink) return

    try {
      const response = await fetch(generatedLink.url)
      if (!response.ok) throw new Error('Failed to download file')
      
      const blob = await response.blob()
      const url = window.URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = generatedLink.fileName
      document.body.appendChild(a)
      a.click()
      window.URL.revokeObjectURL(url)
      document.body.removeChild(a)
      
      toast.success("Download started")
    } catch (error) {
      console.error("Failed to download file:", error)
      toast.error("Failed to download file")
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Share File</DialogTitle>
          <DialogDescription>
            Share this file via your device's share options or generate a download link
          </DialogDescription>
        </DialogHeader>

        {error && (
          <Alert variant="destructive" className="mt-4">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        <div className="mt-4 space-y-4">
          <div className="flex flex-col space-y-2">
            <Label>File Information</Label>
            <div className="p-3 bg-muted rounded-md">
              <p className="text-sm font-medium">{file.name || 'Unnamed file'}</p>
              <p className="text-xs text-muted-foreground">
                {file.contentType || 'Unknown type'} · {file.size ? `${Math.round(file.size / 1024)} KB` : 'Unknown size'}
              </p>
            </div>
          </div>

          <Tabs value={activeTab} onValueChange={setActiveTab}>
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="share">Share</TabsTrigger>
              <TabsTrigger value="link">Link</TabsTrigger>
            </TabsList>
            
            <TabsContent value="share" className="space-y-4">
              <div className="flex justify-end">
                <Button
                  onClick={handleShare}
                  disabled={isLoading}
                >
                  {isLoading ? (
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  ) : (
                    <Share2 className="h-4 w-4 mr-2" />
                  )}
                  Share File
                </Button>
              </div>
            </TabsContent>

            <TabsContent value="link" className="space-y-4">
              {generatedLink ? (
                <>
                  <div className="flex flex-col space-y-2">
                    <Label>Download Link</Label>
                    <div className="flex space-x-2">
                      <Input
                        value={generatedLink.url}
                        readOnly
                        className="flex-1"
                      />
                      <Button
                        variant="outline"
                        size="icon"
                        onClick={copyToClipboard}
                        disabled={isLoading}
                      >
                        {copied ? (
                          <Check className="h-4 w-4" />
                        ) : (
                          <Copy className="h-4 w-4" />
                        )}
                      </Button>
                    </div>
                  </div>
                  <div className="flex justify-end">
                    <Button
                      variant="outline"
                      onClick={downloadFile}
                      disabled={isLoading}
                    >
                      <Download className="h-4 w-4 mr-2" />
                      Download File
                    </Button>
                  </div>
                </>
              ) : (
                <div className="flex justify-end">
                  <Button
                    variant="outline"
                    onClick={handleGenerateLink}
                    disabled={isLoading}
                  >
                    {isLoading ? (
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    ) : (
                      <Link className="h-4 w-4 mr-2" />
                    )}
                    Generate Link
                  </Button>
                </div>
              )}
            </TabsContent>
          </Tabs>
        </div>
      </DialogContent>
    </Dialog>
  )
}
