"use client"

import { useState } from "react"
import { 
  Dialog, 
  DialogContent, 
  DialogDescription, 
  DialogHeader, 
  DialogTitle,
  DialogFooter
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { CourseTemplateForm } from "@/components/forms/course-template-form"
import { CourseTemplate } from "@/types/course-template"
import { useAuth } from "@/hooks/useAuth"
import { createCourseTemplate, updateCourseTemplate, deleteCourseTemplate } from "@/services/courseTemplateService"
import { toast } from "sonner"
import { AlertTriangle } from "lucide-react"

// Props for the course template dialog
interface CourseTemplateDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  template?: CourseTemplate
  onSuccess: () => void
  mode: "create" | "edit"
}

// Props for the delete dialog
interface DeleteCourseTemplateDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  template?: CourseTemplate
  onConfirm: (template: CourseTemplate) => void
  isDeleting: boolean
}

// Course Template Dialog for creating and editing templates
export function CourseTemplateDialog({
  open,
  onOpenChange,
  template,
  onSuccess,
  mode
}: CourseTemplateDialogProps) {
  const { user } = useAuth()
  const [isSubmitting, setIsSubmitting] = useState(false)
  const trainingCenterId = user?.userId || ""
  
  const title = mode === "create" ? "Add New Course Template" : "Edit Course Template"
  const description = mode === "create" 
    ? "Create a new course template for your training center" 
    : "Update the details of this course template"

  const handleSubmit = async (data: any) => {
    if (!trainingCenterId) {
      toast.error("Training center ID is required")
      return
    }
    
    setIsSubmitting(true)
    
    try {
      if (mode === "create") {
        await createCourseTemplate({ trainingCenterId }, data)
        toast.success("Course template created successfully")
      } else if (template?.id) {
        await updateCourseTemplate({ 
          trainingCenterId, 
          courseTemplateId: template.id 
        }, data)
        toast.success("Course template updated successfully")
      }
      
      onOpenChange(false)
      onSuccess()
    } catch (error) {
      console.error(`Error ${mode === "create" ? "creating" : "updating"} course template:`, error)
      toast.error(`Failed to ${mode === "create" ? "create" : "update"} course template. Please try again.`)
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[600px]">
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
          <DialogDescription>{description}</DialogDescription>
        </DialogHeader>
        
        <CourseTemplateForm 
          template={template} 
          onSubmit={handleSubmit} 
          isSubmitting={isSubmitting} 
        />
      </DialogContent>
    </Dialog>
  )
}

// Delete Course Template Dialog
export function DeleteCourseTemplateDialog({
  open,
  onOpenChange,
  template,
  onConfirm,
  isDeleting
}: DeleteCourseTemplateDialogProps) {
  if (!template) return null
  
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-destructive">
            <AlertTriangle className="h-5 w-5" />
            Delete Course Template
          </DialogTitle>
          <DialogDescription>
            Are you sure you want to delete the course template "{template.name}"? This action cannot be undone.
          </DialogDescription>
        </DialogHeader>
        
        <div className="bg-destructive/10 text-destructive p-3 rounded-md text-sm">
          <p>Warning: Deleting this template may affect any courses that are based on it.</p>
        </div>
        
        <DialogFooter className="gap-2 sm:gap-0">
          <Button
            variant="outline"
            onClick={() => onOpenChange(false)}
            disabled={isDeleting}
          >
            Cancel
          </Button>
          <Button
            variant="destructive"
            onClick={() => onConfirm(template)}
            disabled={isDeleting}
          >
            {isDeleting ? "Deleting..." : "Delete Template"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
