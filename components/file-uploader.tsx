"use client"

import React, { useCallback } from "react"
import { useDropzone } from "react-dropzone"
import { cn } from "@/lib/utils"
import { Upload } from "lucide-react"

interface FileUploaderProps {
  onFileAccepted: (files: File[]) => void
  maxFiles?: number
  maxSize?: number // in bytes
  accept?: Record<string, string[]>
  className?: string
}

export function FileUploader({
  onFileAccepted,
  maxFiles = 5,
  maxSize = 5 * 1024 * 1024, // 5MB default
  accept = {
    'image/*': ['.jpeg', '.jpg', '.png'],
    'application/pdf': ['.pdf'],
    'application/msword': ['.doc'],
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document': ['.docx']
  },
  className
}: FileUploaderProps) {
  const onDrop = useCallback((acceptedFiles: File[]) => {
    onFileAccepted(acceptedFiles)
  }, [onFileAccepted])

  const { getRootProps, getInputProps, isDragActive, isDragReject } = useDropzone({
    onDrop,
    maxFiles,
    maxSize,
    accept
  })

  return (
    <div
      {...getRootProps()}
      className={cn(
        "border-2 border-dashed rounded-md p-6 cursor-pointer transition-colors",
        isDragActive ? "border-primary bg-primary/5" : "border-muted-foreground/20",
        isDragReject && "border-destructive bg-destructive/5",
        className
      )}
    >
      <input {...getInputProps()} />
      <div className="flex flex-col items-center justify-center space-y-2 text-center">
        <Upload className="h-8 w-8 text-muted-foreground" />
        <div className="space-y-1">
          <p className="text-sm font-medium">
            {isDragActive ? "Drop the files here" : "Drag & drop files here or click to select"}
          </p>
          <p className="text-xs text-muted-foreground">
            Supports images, PDFs, and Word documents (max {maxFiles} files, {maxSize / 1024 / 1024}MB each)
          </p>
        </div>
      </div>
    </div>
  )
}
