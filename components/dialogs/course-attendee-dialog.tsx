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
import { getAttendees } from "@/services/attendeeService"
import { assignAttendeeToCourse } from "@/services/courseAttendeeService"
import { Loader2, Search } from "lucide-react"
import { Input } from "@/components/ui/input"
import { ScrollArea } from "@/components/ui/scroll-area"

// Define the form schema
const formSchema = z.object({
  attendeeId: z.string().min(1, "Attendee is required"),
});

// Define the form values type
type FormValues = z.infer<typeof formSchema>;

// Define the component props
interface CourseAttendeeDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  courseId: string;
  onSuccess: () => void;
}

export function CourseAttendeeDialog({
  open,
  onOpenChange,
  courseId,
  onSuccess
}: CourseAttendeeDialogProps) {
  const { user } = useAuth();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [attendees, setAttendees] = useState<Attendee[]>([]);
  const [filteredAttendees, setFilteredAttendees] = useState<Attendee[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  
  // Get training center ID from the authenticated user
  const trainingCenterId = user?.userId || "";

  // Initialize the form
  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      attendeeId: "",
    },
  });

  // Fetch attendees when the dialog opens
  useEffect(() => {
    if (open && trainingCenterId) {
      setIsLoading(true);
      
      const fetchAttendees = async () => {
        try {
          const data = await getAttendees(trainingCenterId);
          setAttendees(data);
          setFilteredAttendees(data);
        } catch (error) {
          console.error("Error fetching attendees:", error);
          toast.error("Failed to load attendees. Please try again.");
        } finally {
          setIsLoading(false);
        }
      };
      
      fetchAttendees();
    }
  }, [open, trainingCenterId]);

  // Filter attendees based on search query
  useEffect(() => {
    if (searchQuery.trim() === "") {
      setFilteredAttendees(attendees);
    } else {
      const query = searchQuery.toLowerCase();
      const filtered = attendees.filter(
        (attendee) =>
          attendee.name?.toLowerCase().includes(query) ||
          attendee.surname?.toLowerCase().includes(query) ||
          attendee.email?.toLowerCase().includes(query) ||
          attendee.rank?.toLowerCase().includes(query)
      );
      setFilteredAttendees(filtered);
    }
  }, [searchQuery, attendees]);

  // Handle form submission
  const onSubmit = async (data: FormValues) => {
    if (!trainingCenterId) {
      toast.error("Training center ID is required");
      return;
    }

    if (!courseId) {
      toast.error("Course ID is required");
      return;
    }

    setIsSubmitting(true);

    try {
      await assignAttendeeToCourse({
        trainingCenterId,
        courseId,
        attendeeId: data.attendeeId,
      });
      
      toast.success("Attendee assigned to course successfully");
      await onSuccess();
      form.reset();
      onOpenChange(false);
    } catch (error) {
      console.error("Error assigning attendee to course:", error);
      toast.error("Failed to assign attendee to course. Please try again.");
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
          <DialogTitle>Assign Attendee to Course</DialogTitle>
          <DialogDescription>
            Select an attendee to assign to this course.
          </DialogDescription>
        </DialogHeader>
        
        {isLoading ? (
          <div className="flex justify-center py-8">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
          </div>
        ) : (
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
              {/* Search input */}
              <div className="relative">
                <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search attendees..."
                  className="pl-9"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
              </div>
              
              <FormField
                control={form.control}
                name="attendeeId"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Attendee</FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select an attendee" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <ScrollArea className="h-72">
                          {filteredAttendees.length > 0 ? (
                            filteredAttendees.map((attendee) => (
                              <SelectItem key={attendee.id} value={attendee.id}>
                                {`${attendee.name} ${attendee.surname} (${attendee.email}) - ${formatRank(attendee.rank)}`}
                              </SelectItem>
                            ))
                          ) : (
                            <div className="p-2 text-center text-sm text-muted-foreground">
                              No attendees found
                            </div>
                          )}
                        </ScrollArea>
                      </SelectContent>
                    </Select>
                    <FormDescription>
                      The attendee to assign to this course
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
                      Assigning...
                    </>
                  ) : (
                    "Assign Attendee"
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
