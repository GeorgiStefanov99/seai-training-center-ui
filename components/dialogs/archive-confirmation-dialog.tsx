import React, { useState } from "react"
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { AlertCircle } from "lucide-react"

interface ArchiveConfirmationDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onConfirm: (remark: string) => void
  courseName: string
  endDate: string
  isLoading?: boolean
}

export function ArchiveConfirmationDialog({
  open,
  onOpenChange,
  onConfirm,
  courseName,
  endDate,
  isLoading = false
}: ArchiveConfirmationDialogProps) {
  const [confirmationText, setConfirmationText] = useState("")
  const [remark, setRemark] = useState("")
  const [error, setError] = useState<string | null>(null)
  
  const currentDate = new Date()
  const courseEndDate = new Date(endDate)
  const isEndDatePassed = courseEndDate < currentDate
  
  const handleConfirm = () => {
    if (confirmationText.toLowerCase() !== "archive") {
      setError("Please type 'archive' to confirm")
      return
    }
    onConfirm(remark)
  }
  
  const handleOpenChange = (newOpen: boolean) => {
    if (!newOpen) {
      setConfirmationText("")
      setRemark("")
      setError(null)
    }
    onOpenChange(newOpen)
  }
  
  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Archive Course</DialogTitle>
          <DialogDescription>
            Are you sure you want to archive the course "{courseName}"?
          </DialogDescription>
        </DialogHeader>
        
        {isEndDatePassed && (
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>
              This course has already ended. Archiving it will move it to the archive section.
            </AlertDescription>
          </Alert>
        )}
        
        <div className="space-y-4">
          <div>
            <p className="text-sm text-muted-foreground mb-2">
              Type "archive" to confirm:
            </p>
            <Input
              value={confirmationText}
              onChange={(e) => {
                setConfirmationText(e.target.value)
                setError(null)
              }}
              className={error && confirmationText.toLowerCase() !== "archive" ? "border-destructive" : ""}
            />
          </div>
          <div>
            <p className="text-sm text-muted-foreground mb-2">
              Finish Remark (required):
            </p>
            <Input
              value={remark}
              onChange={e => {
                setRemark(e.target.value)
                setError(null)
              }}
              placeholder="Enter a finish remark for this course"
              className={error && !remark.trim() ? "border-destructive" : ""}
            />
          </div>
          {error && (
            <p className="text-sm text-destructive mt-1">{error}</p>
          )}
        </div>
        
        <DialogFooter>
          <Button
            variant="outline"
            onClick={() => handleOpenChange(false)}
            disabled={isLoading}
          >
            Cancel
          </Button>
          <Button
            variant="default"
            onClick={handleConfirm}
            disabled={isLoading || confirmationText.toLowerCase() !== "archive"}
          >
            {isLoading ? "Archiving..." : "Archive Course"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
} 