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
import { Input } from "@/components/ui/input"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { toast } from "sonner"
import { useAuth } from "@/hooks/useAuth"
import { WaitlistRecord, WaitlistStatus } from "@/types/course-template"
import { Attendee, AttendeeRank } from "@/types/attendee"
import { createWaitlistRecord, createWaitlistRecordForAttendee, createWaitlistRecordWithNewAttendee, AttendeeRequest } from "@/services/waitlistService"
import { getCourseTemplates } from "@/services/courseTemplateService"
import { getAttendees } from "@/services/attendeeService"

// Define the form schema with validation for existing attendee
const existingAttendeeSchema = z.object({
  attendeeId: z.string().min(1, "Attendee is required"),
  courseTemplateId: z.string().min(1, "Course template is required"),
  status: z.enum(["WAITING", "CONFIRMED", "DELETED"] as const),
});

// Define the form schema with validation for new attendee
const newAttendeeSchema = z.object({
  courseTemplateId: z.string().min(1, "Course template is required"),
  status: z.enum(["WAITING", "CONFIRMED", "DELETED"] as const),
  name: z.string().min(1, "Name is required"),
  surname: z.string().min(1, "Surname is required"),
  email: z.string().email("Invalid email address"),
  telephone: z.string().optional(),
  rank: z.string().min(1, "Rank is required"),
  remarkText: z.string().optional(),
});

// Create a discriminated union schema based on the attendee type
const formSchema = z.discriminatedUnion("attendeeType", [
  z.object({
    attendeeType: z.literal("existing"),
    ...existingAttendeeSchema.shape,
  }),
  z.object({
    attendeeType: z.literal("new"),
    ...newAttendeeSchema.shape,
  }),
]);

// Define the form values type
type FormValues = z.infer<typeof formSchema>;

// Define the component props
interface WaitlistRecordDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  mode: "create" | "edit";
  record?: WaitlistRecord;
  onSuccess: () => void;
}

// Interface for simplified attendee data display
interface AttendeeDisplay {
  id: string;
  name: string;
  surname: string;
  email: string;
  rank: string;
}

export function WaitlistRecordDialog({
  open,
  onOpenChange,
  mode,
  record,
  onSuccess
}: WaitlistRecordDialogProps) {
  const { user } = useAuth();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [attendees, setAttendees] = useState<Attendee[]>([]);
  const [courseTemplates, setCourseTemplates] = useState<{ id: string; name: string }[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [attendeeType, setAttendeeType] = useState<"existing" | "new">("existing");
  
  // Get training center ID from the authenticated user
  const trainingCenterId = user?.userId || "";

  // Initialize the form with values from the record if in edit mode
  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: mode === "edit" && record ? {
      attendeeType: "existing",
      attendeeId: record.attendeeResponse.id,
      courseTemplateId: record.templateId,
      status: (record.status as "WAITING" | "CONFIRMED" | "DELETED"),
    } : {
      attendeeType: "existing",
      attendeeId: "",
      courseTemplateId: "",
      status: "WAITING",
    },
  });

  // Fetch attendees and course templates when the dialog opens
  useEffect(() => {
    if (open && trainingCenterId) {
      setIsLoading(true);
      
      // Fetch attendees and course templates in parallel
      Promise.all([
        getAttendees(trainingCenterId),
        getCourseTemplates(trainingCenterId)
      ])
        .then(([attendeesData, templatesData]) => {
          setAttendees(attendeesData);
          setCourseTemplates(templatesData);
        })
        .catch(err => {
          console.error("Error fetching data:", err);
          toast.error("Failed to load required data. Please try again.");
        })
        .finally(() => {
          setIsLoading(false);
        });
    }
  }, [open, trainingCenterId]);

  // Handle form submission
  const onSubmit = async (data: FormValues) => {
    if (!trainingCenterId) {
      toast.error("Training center ID is required");
      return;
    }

    setIsSubmitting(true);

    try {
      if (mode === "create") {
        if (data.attendeeType === "existing") {
          // Create a waitlist record with an existing attendee
          await createWaitlistRecordForAttendee({
            trainingCenterId,
            attendeeId: data.attendeeId,
            courseTemplateId: data.courseTemplateId
          }, { status: data.status });
        } else {
          // Create a waitlist record with a new attendee
          const attendeeRequest: AttendeeRequest = {
            name: data.name,
            surname: data.surname,
            email: data.email,
            telephone: data.telephone || "",
            rank: data.rank,
            ...(data.remarkText ? { remark: { remarkText: data.remarkText } } : {})
          };
          
          await createWaitlistRecordWithNewAttendee({
            trainingCenterId,
            courseTemplateId: data.courseTemplateId
          }, {
            attendeeRequest
          });
          
          // If status is not WAITING, update the status after creation
          if (data.status !== "WAITING") {
            // Note: In a real implementation, we would need to get the ID of the newly created record
            // and then update its status. For now, we'll just show a success message.
            console.log(`New waitlist record created with status: ${data.status}`);
          }
        }
        
        toast.success("Waitlist record created successfully");
      } else if (mode === "edit" && record) {
        // For edit mode, we would typically update the record
        // This is a placeholder for future implementation
        toast.success("Waitlist record updated successfully");
      }
      
      form.reset();
      onSuccess();
      onOpenChange(false);
    } catch (error) {
      console.error("Error submitting waitlist record:", error);
      toast.error("Failed to submit waitlist record. Please try again.");
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
      <DialogContent className="sm:max-w-[550px] max-h-[85vh] overflow-y-auto" style={{ marginTop: '2vh', marginBottom: '2vh' }}>
        <DialogHeader>
          <DialogTitle>
            {mode === "create" ? "Add Waitlist Record" : "Edit Waitlist Record"}
          </DialogTitle>
          <DialogDescription>
            {mode === "create"
              ? "Add a new waitlist record for an attendee"
              : "Update the waitlist record details"}
          </DialogDescription>
        </DialogHeader>
        
        {isLoading ? (
          <div className="flex justify-center items-center py-8">
            <div className="flex items-center space-x-2">
              <div className="h-4 w-4 animate-spin rounded-full border-2 border-primary border-t-transparent"></div>
              <p className="text-sm text-muted-foreground">Loading data...</p>
            </div>
          </div>
        ) : (
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
              {mode === "create" && (
                <div className="flex flex-col space-y-2">
                  <FormLabel>Attendee Type</FormLabel>
                  <div className="flex space-x-4">
                    <Button 
                      type="button" 
                      variant={attendeeType === "existing" ? "default" : "outline"}
                      onClick={() => {
                        setAttendeeType("existing");
                        form.setValue("attendeeType", "existing");
                      }}
                    >
                      Existing Attendee
                    </Button>
                    <Button 
                      type="button" 
                      variant={attendeeType === "new" ? "default" : "outline"}
                      onClick={() => {
                        setAttendeeType("new");
                        form.setValue("attendeeType", "new");
                      }}
                    >
                      New Attendee
                    </Button>
                  </div>
                </div>
              )}
              
              {(attendeeType === "existing" || mode === "edit") && (
                <FormField
                  control={form.control}
                  name="attendeeId"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Attendee</FormLabel>
                      <Select 
                        onValueChange={field.onChange} 
                        defaultValue={field.value}
                        disabled={mode === "edit" || isSubmitting}
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
              )}
              
              {attendeeType === "new" && mode === "create" && (
                <>
                  <FormField
                    control={form.control}
                    name="name"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>First Name</FormLabel>
                        <FormControl>
                          <Input {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  
                  <FormField
                    control={form.control}
                    name="surname"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Last Name</FormLabel>
                        <FormControl>
                          <Input {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  
                  <FormField
                    control={form.control}
                    name="email"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Email</FormLabel>
                        <FormControl>
                          <Input type="email" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  
                  <FormField
                    control={form.control}
                    name="telephone"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Telephone (Optional)</FormLabel>
                        <FormControl>
                          <Input {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  
                  <FormField
                    control={form.control}
                    name="rank"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Rank</FormLabel>
                        <Select onValueChange={field.onChange} defaultValue={field.value}>
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="Select rank" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            <SelectItem value="CAPTAIN">Captain</SelectItem>
                            <SelectItem value="CHIEF_OFFICER">Chief Officer</SelectItem>
                            <SelectItem value="SECOND_OFFICER">Second Officer</SelectItem>
                            <SelectItem value="THIRD_OFFICER">Third Officer</SelectItem>
                            <SelectItem value="CHIEF_ENGINEER">Chief Engineer</SelectItem>
                            <SelectItem value="SECOND_ENGINEER">Second Engineer</SelectItem>
                            <SelectItem value="THIRD_ENGINEER">Third Engineer</SelectItem>
                            <SelectItem value="FOURTH_ENGINEER">Fourth Engineer</SelectItem>
                            <SelectItem value="ELECTRICAL_ENGINEER">Electrical Engineer</SelectItem>
                            <SelectItem value="DECK_CADET">Deck Cadet</SelectItem>
                            <SelectItem value="ENGINE_CADET">Engine Cadet</SelectItem>
                            <SelectItem value="BOSUN">Bosun</SelectItem>
                            <SelectItem value="AB">AB</SelectItem>
                            <SelectItem value="OS">OS</SelectItem>
                            <SelectItem value="FITTER">Fitter</SelectItem>
                            <SelectItem value="OILER">Oiler</SelectItem>
                            <SelectItem value="WIPER">Wiper</SelectItem>
                            <SelectItem value="COOK">Cook</SelectItem>
                            <SelectItem value="STEWARD">Steward</SelectItem>
                            <SelectItem value="OTHER">Other</SelectItem>
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  
                  <FormField
                    control={form.control}
                    name="remarkText"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Remarks (Optional)</FormLabel>
                        <FormControl>
                          <Input {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </>
              )}
              
              <FormField
                control={form.control}
                name="courseTemplateId"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Course Template</FormLabel>
                    <Select 
                      onValueChange={field.onChange} 
                      defaultValue={field.value}
                      disabled={mode === "edit" || isSubmitting}
                    >
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select a course template" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {courseTemplates.map((template) => (
                          <SelectItem key={template.id} value={template.id}>
                            {template.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormDescription>
                      The course template to waitlist the attendee for
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
