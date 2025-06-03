"use client"

import { useState, useEffect } from "react"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import * as z from "zod"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form"
import { Textarea } from "@/components/ui/textarea"
import { toast } from "sonner"
import { useAuth } from "@/hooks/useAuth"
import { Remark } from "@/types/remark"
import { createRemark, updateRemark, getAttendeeRemarks } from "@/services/remarkService"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { format } from "date-fns"

// Define the form schema with validation
const formSchema = z.object({
  remarkText: z.string().min(1, "Remark text is required"),
});

// Define the form values type
type FormValues = z.infer<typeof formSchema>;

// Define the component props
interface RemarkDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  mode: "create" | "edit";
  attendeeId: string;
  remark?: Remark;
  onSuccess: () => void;
}

export function RemarkDialog({
  open,
  onOpenChange,
  mode,
  attendeeId,
  remark,
  onSuccess
}: RemarkDialogProps) {
  const { user } = useAuth();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [existingRemarks, setExistingRemarks] = useState<Remark[]>([]);
  const [isLoadingRemarks, setIsLoadingRemarks] = useState(false);
  
  // Get training center ID from the authenticated user
  const trainingCenterId = user?.userId || "";
  
  // Fetch existing remarks when the dialog opens
  useEffect(() => {
    if (open && attendeeId && trainingCenterId) {
      fetchExistingRemarks();
    }
  }, [open, attendeeId, trainingCenterId]);
  
  // Function to fetch existing remarks
  const fetchExistingRemarks = async () => {
    if (!attendeeId || !trainingCenterId) return;
    
    setIsLoadingRemarks(true);
    try {
      const remarks = await getAttendeeRemarks({ trainingCenterId, attendeeId });
      setExistingRemarks(remarks);
    } catch (error) {
      console.error("Error fetching remarks:", error);
      toast.error("Failed to load existing remarks");
    } finally {
      setIsLoadingRemarks(false);
    }
  };

  // Initialize the form with values from the remark if in edit mode
  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: mode === "edit" && remark ? {
      remarkText: remark.remarkText,
    } : {
      remarkText: "",
    },
  });

  // Handle form submission
  const onSubmit = async (data: FormValues) => {
    if (!trainingCenterId) {
      toast.error("Training center ID is required");
      return;
    }

    if (!attendeeId) {
      toast.error("Attendee ID is required");
      return;
    }

    setIsSubmitting(true);

    try {
      if (mode === "create") {
        // Create new remark
        await createRemark(
          { trainingCenterId, attendeeId },
          { remarkText: data.remarkText }
        );
        toast.success("Remark created successfully");
      } else if (mode === "edit" && remark) {
        // Update existing remark
        await updateRemark(
          { trainingCenterId, attendeeId, remarkId: remark.id },
          { remarkText: data.remarkText }
        );
        toast.success("Remark updated successfully");
      }

      // Call the success callback before closing the dialog
      await onSuccess();
      
      // Reset form and close dialog
      form.reset();
      onOpenChange(false);
    } catch (error) {
      console.error("Error submitting remark:", error);
      toast.error("Failed to save remark. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[600px] max-h-[85vh] overflow-y-auto my-4">
        <DialogHeader>
          <DialogTitle>
            {mode === "create" ? "Add Remark" : "Edit Remark"}
          </DialogTitle>
          <DialogDescription>
            {mode === "create" 
              ? "Add a new remark for this attendee." 
              : "Update the remark for this attendee."}
          </DialogDescription>
        </DialogHeader>
        
        {/* Existing Remarks Section */}
        <div className="mb-6">
          <h3 className="text-sm font-medium mb-2">Previous Remarks</h3>
          {isLoadingRemarks ? (
            <div className="flex items-center justify-center p-4">
              <div className="h-6 w-6 animate-spin rounded-full border-2 border-current border-t-transparent"></div>
              <span className="ml-2 text-sm text-muted-foreground">Loading remarks...</span>
            </div>
          ) : existingRemarks.length > 0 ? (
            <div className="space-y-3 max-h-[200px] overflow-y-auto pr-1">
              {existingRemarks.map((existingRemark) => (
                <Card key={existingRemark.id} className="shadow-sm">
                  <CardHeader className="py-3 px-4">
                    <div className="flex justify-between items-start">
                      <CardTitle className="text-sm font-medium">Remark</CardTitle>
                      <CardDescription className="text-xs">
                        {existingRemark.createdAt ? format(new Date(existingRemark.createdAt), 'MMM d, yyyy HH:mm') : 'Unknown date'}
                      </CardDescription>
                    </div>
                  </CardHeader>
                  <CardContent className="py-2 px-4">
                    <p className="text-sm">{existingRemark.remarkText}</p>
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : (
            <p className="text-sm text-muted-foreground">No previous remarks found.</p>
          )}
        </div>

        {form && (
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
              <FormField
                control={form.control}
                name="remarkText"
                render={({ field }) => (
                  <FormItem>
                    <div className="flex justify-between items-center">
                      <FormLabel>Remark</FormLabel>
                      {mode === "edit" && remark?.lastUpdatedAt && (
                        <span className="text-xs text-muted-foreground">
                          Last updated: {format(new Date(remark.lastUpdatedAt), 'MMM d, yyyy HH:mm')}
                        </span>
                      )}
                    </div>
                    <FormControl>
                      <Textarea 
                        placeholder="Enter remark text..." 
                        className="min-h-[100px]" 
                        {...field} 
                      />
                    </FormControl>
                    <FormDescription>
                      Add any important notes or comments about this attendee.
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <DialogFooter>
                <Button type="button" variant="outline" onClick={() => onOpenChange(false)} disabled={isSubmitting}>
                  Cancel
                </Button>
                <Button type="submit" disabled={isSubmitting}>
                  {isSubmitting ? (
                    <>
                      <div className="mr-2 h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent"></div>
                      {mode === "create" ? "Creating..." : "Updating..."}
                    </>
                  ) : (
                    mode === "create" ? "Create" : "Update"
                  )}
                </Button>
              </DialogFooter>
            </form>
          </Form>
        )}
      </DialogContent>
    </Dialog>
  );
}

// Delete Remark Dialog component
interface DeleteRemarkDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  remark?: Remark;
  onConfirm: (remark: Remark) => void;
  isDeleting: boolean;
}

export function DeleteRemarkDialog({
  open,
  onOpenChange,
  remark,
  onConfirm,
  isDeleting
}: DeleteRemarkDialogProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Delete Remark</DialogTitle>
          <DialogDescription>
            Are you sure you want to delete this remark? This action cannot be undone.
          </DialogDescription>
        </DialogHeader>
        
        {remark && (
          <div className="py-4">
            <p className="text-sm font-medium mb-2">Remark Text:</p>
            <p className="text-sm text-muted-foreground bg-muted p-2 rounded">{remark.remarkText}</p>
          </div>
        )}
        
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={isDeleting}>
            Cancel
          </Button>
          <Button 
            variant="destructive" 
            onClick={() => remark && onConfirm(remark)} 
            disabled={isDeleting || !remark}
          >
            {isDeleting ? (
              <>
                <div className="mr-2 h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent"></div>
                Deleting...
              </>
            ) : (
              "Delete"
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
