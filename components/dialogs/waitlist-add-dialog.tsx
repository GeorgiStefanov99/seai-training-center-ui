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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { toast } from "sonner"
import { useAuth } from "@/hooks/useAuth"
import { Attendee } from "@/types/attendee"
import { createWaitlistRecordForAttendee } from "@/services/waitlistService"
import { getAttendees } from "@/services/attendeeService"
import { Loader2 } from "lucide-react"

// Define the form schema with validation
const formSchema = z.object({
  attendeeId: z.string().min(1, "Attendee is required"),
  status: z.enum(["WAITING", "CONFIRMED", "DELETED"] as const),
});

// Define the form values type
type FormValues = z.infer<typeof formSchema>;

// Define the component props
interface WaitlistAddDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  courseTemplateId: string;
  onSuccess: () => void;
}

export function WaitlistAddDialog({
  open,
  onOpenChange,
  courseTemplateId,
  onSuccess
}: WaitlistAddDialogProps) {
  const { user } = useAuth();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [attendees, setAttendees] = useState<Attendee[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  
  // Get training center ID from the authenticated user
  const trainingCenterId = user?.userId || "";

  // Initialize the form with default values
  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      attendeeId: "",
      status: "WAITING",
    },
  });

  // Fetch attendees when the dialog opens
  useEffect(() => {
    if (open && trainingCenterId) {
      setIsLoading(true);
      
      getAttendees(trainingCenterId)
        .then(attendeesData => {
          setAttendees(attendeesData);
        })
        .catch(err => {
          console.error("Error fetching attendees:", err);
          toast.error("Failed to load attendees. Please try again.");
        })
        .finally(() => {
          setIsLoading(false);
        });
    }
  }, [open, trainingCenterId]);

  // Handle form submission
  const onSubmit = async (data: FormValues) => {
    if (!trainingCenterId || !courseTemplateId) {
      toast.error("Missing required IDs");
      return;
    }

    setIsSubmitting(true);

    try {
      // Create a new waitlist record for the attendee
      await createWaitlistRecordForAttendee({
        trainingCenterId,
        attendeeId: data.attendeeId,
        courseTemplateId
      }, { status: data.status });
      
      toast.success("Attendee added to waitlist successfully");
      form.reset();
      onSuccess();
      onOpenChange(false);
    } catch (error) {
      console.error("Error adding attendee to waitlist:", error);
      toast.error("Failed to add attendee to waitlist. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  // Format rank for display
  const formatRank = (rank: string) => {
    return rank.replace(/_/g, " ");
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>Add to Waitlist</DialogTitle>
          <DialogDescription>
            Add an attendee to the waitlist for this course template.
          </DialogDescription>
        </DialogHeader>
        
        {isLoading ? (
          <div className="flex justify-center items-center py-8">
            <div className="flex items-center space-x-2">
              <Loader2 className="h-4 w-4 animate-spin" />
              <p className="text-sm text-muted-foreground">Loading attendees...</p>
            </div>
          </div>
        ) : (
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
              <FormField
                control={form.control}
                name="attendeeId"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Attendee</FormLabel>
                    <Select 
                      onValueChange={field.onChange} 
                      defaultValue={field.value}
                      disabled={isSubmitting}
                    >
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select an attendee" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {attendees.map((attendee) => (
                          <SelectItem key={attendee.id} value={attendee.id}>
                            {attendee.name} {attendee.surname} ({formatRank(attendee.rank)})
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormDescription>
                      The attendee to add to the waitlist
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
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
                      The initial status of this waitlist record
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
                      Adding...
                    </>
                  ) : "Add to Waitlist"}
                </Button>
              </DialogFooter>
            </form>
          </Form>
        )}
      </DialogContent>
    </Dialog>
  );
}
