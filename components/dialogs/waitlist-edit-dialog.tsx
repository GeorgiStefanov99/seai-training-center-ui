"use client"

import { useState } from "react"
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { toast } from "sonner"
import { useAuth } from "@/hooks/useAuth"
import { WaitlistRecord } from "@/types/course-template"
import { updateWaitlistRecord } from "@/services/waitlistService"
import { Loader2 } from "lucide-react"

// Define the form schema with validation
const formSchema = z.object({
  status: z.enum(["WAITING", "CONFIRMED", "DELETED"] as const),
});

// Define the form values type
type FormValues = z.infer<typeof formSchema>;

// Define the component props
interface WaitlistEditDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  waitlistRecord: WaitlistRecord | null;
  onSuccess: () => void;
}

export function WaitlistEditDialog({
  open,
  onOpenChange,
  waitlistRecord,
  onSuccess
}: WaitlistEditDialogProps) {
  const { user } = useAuth();
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  // Get training center ID from the authenticated user
  const trainingCenterId = user?.userId || "";
  
  // Handle dialog close to ensure proper cleanup
  const handleDialogChange = (newOpenState: boolean) => {
    // Directly call the parent's onOpenChange function without delay
    // This ensures the dialog state is properly managed
    onOpenChange(newOpenState);
  };

  // Initialize the form with default values from the waitlist record
  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      status: "WAITING",
    },
    // Update form values when waitlist record changes
    values: {
      status: (waitlistRecord?.status as "WAITING" | "CONFIRMED" | "DELETED") || "WAITING",
    },
  });

  // Handle form submission
  const onSubmit = async (data: FormValues) => {
    if (!trainingCenterId || !waitlistRecord) {
      toast.error("Missing required information");
      return;
    }

    setIsSubmitting(true);

    try {
      // The API only expects the status field in the request body
      const updatePayload = {
        status: data.status
      };

      // Update the waitlist record status
      const updatedRecord = await updateWaitlistRecord({
        trainingCenterId,
        waitlistRecordId: waitlistRecord.id
      }, updatePayload);
      
      console.log('API response after update:', updatedRecord);
      toast.success("Waitlist record updated successfully");
      // First call onSuccess to refresh data
      onSuccess();
      // Then immediately close the dialog
      onOpenChange(false);
    } catch (error) {
      console.error("Error updating waitlist record:", error);
      toast.error("Failed to update waitlist record. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={handleDialogChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>Edit Waitlist Record</DialogTitle>
          <DialogDescription>
            Update the status of this waitlist record.
          </DialogDescription>
        </DialogHeader>
        
        {waitlistRecord && (
          <div className="mb-4">
            <p className="text-sm font-medium">Attendee</p>
            {waitlistRecord.attendeeResponse ? (
              <>
                <p className="text-sm text-muted-foreground">
                  {waitlistRecord.attendeeResponse.name} {waitlistRecord.attendeeResponse.surname}
                </p>
                <p className="text-sm text-muted-foreground mt-1">
                  {waitlistRecord.attendeeResponse.email}
                </p>
              </>
            ) : (
              <p className="text-sm text-muted-foreground">
                Attendee details not available
              </p>
            )}
          </div>
        )}
        
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            <FormField
              control={form.control}
              name="status"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Status</FormLabel>
                  <Select onValueChange={field.onChange} defaultValue={field.value}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Select status" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value="WAITING">Waiting</SelectItem>
                      <SelectItem value="CONFIRMED">Confirmed</SelectItem>
                      <SelectItem value="DELETED">Deleted</SelectItem>
                    </SelectContent>
                  </Select>
                  <FormDescription>
                    The current status of this waitlist record
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
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Updating...
                  </>
                ) : "Update Status"}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
