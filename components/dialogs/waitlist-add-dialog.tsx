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
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { toast } from "sonner"
import { useAuth } from "@/hooks/useAuth"
import { Attendee, AttendeeRank } from "@/types/attendee"
import { CourseTemplate } from "@/types/courseTemplate"
import { createWaitlistRecordForAttendee } from "@/services/waitlistService"
import { getAttendees, createAttendee } from "@/services/attendeeService"
import { getCourseTemplates } from "@/services/courseTemplateService"
import { Loader2, Plus, UserPlus, Users } from "lucide-react"
import { AttendeeForm } from "@/components/forms/attendee-form"

// Define the form schema with validation for when courseTemplateId is provided
const baseFormSchema = {
  attendeeId: z.string().min(1, "Attendee is required"),
  status: z.enum(["WAITING", "CONFIRMED", "DELETED"] as const),
};

// Extended schema when courseTemplateId is not provided
const formSchemaWithCourseTemplate = z.object({
  ...baseFormSchema,
  courseTemplateId: z.string().min(1, "Course template is required"),
});

// Basic schema when courseTemplateId is provided
const formSchemaWithoutCourseTemplate = z.object(baseFormSchema);

// Define the form values type
type FormValues = z.infer<typeof formSchemaWithCourseTemplate>;

// Define the component props
interface WaitlistAddDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  courseTemplateId: string | null;
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
  const [courseTemplates, setCourseTemplates] = useState<CourseTemplate[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isLoadingTemplates, setIsLoadingTemplates] = useState(courseTemplateId === null);
  const [activeTab, setActiveTab] = useState<"existing" | "new">("existing");
  const [isCreatingAttendee, setIsCreatingAttendee] = useState(false);
  const [newAttendeeId, setNewAttendeeId] = useState<string | null>(null);
  
  // Get training center ID from the authenticated user
  const trainingCenterId = user?.userId || "";

  // Choose the appropriate form schema based on whether courseTemplateId is provided
  const schema = courseTemplateId ? formSchemaWithoutCourseTemplate : formSchemaWithCourseTemplate;

  // Initialize the form with default values
  const form = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: {
      attendeeId: "",
      status: "CONFIRMED",
      ...(courseTemplateId === null && { courseTemplateId: "" }),
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

  // Fetch course templates when the dialog opens and courseTemplateId is not provided
  useEffect(() => {
    if (open && trainingCenterId && courseTemplateId === null) {
      setIsLoadingTemplates(true);
      
      getCourseTemplates(trainingCenterId)
        .then(templatesData => {
          setCourseTemplates(templatesData);
        })
        .catch(err => {
          console.error("Error fetching course templates:", err);
          toast.error("Failed to load course templates. Please try again.");
        })
        .finally(() => {
          setIsLoadingTemplates(false);
        });
    }
  }, [open, trainingCenterId, courseTemplateId]);

  // Handle form submission for existing attendee
  const onSubmit = async (data: FormValues) => {
    if (!trainingCenterId) {
      toast.error("Missing training center ID");
      return;
    }

    // Use the provided courseTemplateId or the one selected in the form
    const templateId = courseTemplateId || data.courseTemplateId;
    
    if (!templateId) {
      toast.error("Course template is required");
      return;
    }

    // Use either the selected existing attendee or the newly created one
    const attendeeId = activeTab === "existing" ? data.attendeeId : newAttendeeId;
    
    if (!attendeeId) {
      toast.error("Attendee is required");
      return;
    }

    setIsSubmitting(true);

    try {
      // Create a new waitlist record for the attendee
      // For existing attendees, the API only expects a simple status payload
      const payload = {
        status: data.status
      };
      
      console.log('Creating waitlist record with status:', payload);
      
      await createWaitlistRecordForAttendee({
        trainingCenterId,
        attendeeId,
        courseTemplateId: templateId
      }, payload);
      
      toast.success("Attendee added to waitlist successfully");
      form.reset();
      setActiveTab("existing");
      setNewAttendeeId(null);
      onSuccess();
      onOpenChange(false);
    } catch (error) {
      console.error("Error adding attendee to waitlist:", error);
      toast.error("Failed to add attendee to waitlist. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };
  
  // Handle new attendee submission
  const handleNewAttendeeSubmit = async (attendeeData: any) => {
    if (!trainingCenterId) {
      toast.error("Missing training center ID");
      return;
    }
    
    setIsCreatingAttendee(true);
    
    try {
      // Create a new attendee
      const newAttendee = await createAttendee(
        { trainingCenterId }, 
        attendeeData
      );
      
      // Update the attendees list
      setAttendees(prev => [...prev, newAttendee]);
      
      // Set the new attendee ID for the waitlist record
      setNewAttendeeId(newAttendee.id);
      
      toast.success("New attendee created successfully");
      
      // Switch back to the main form to complete adding to waitlist
      setActiveTab("existing");
      
      // Pre-select the newly created attendee
      form.setValue("attendeeId", newAttendee.id);
    } catch (error) {
      console.error("Error creating new attendee:", error);
      toast.error("Failed to create new attendee. Please try again.");
    } finally {
      setIsCreatingAttendee(false);
    }
  };

  // Format rank for display
  const formatRank = (rank: string) => {
    return rank.replace(/_/g, " ");
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[600px]">
        <DialogHeader>
          <DialogTitle>Add to Waitlist</DialogTitle>
          <DialogDescription>
            Add an attendee to the waitlist for this course template.
          </DialogDescription>
        </DialogHeader>
        
        {isLoading || isLoadingTemplates ? (
          <div className="flex justify-center items-center py-8">
            <div className="flex items-center space-x-2">
              <Loader2 className="h-4 w-4 animate-spin" />
              <p className="text-sm text-muted-foreground">
                {isLoading ? "Loading attendees..." : "Loading course templates..."}
              </p>
            </div>
          </div>
        ) : (
          <Tabs value={activeTab} onValueChange={(value) => setActiveTab(value as "existing" | "new")} defaultValue="existing">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="existing" disabled={isSubmitting || isCreatingAttendee}>
                <Users className="mr-2 h-4 w-4" />
                Existing Attendee
              </TabsTrigger>
              <TabsTrigger value="new" disabled={isSubmitting || isCreatingAttendee}>
                <UserPlus className="mr-2 h-4 w-4" />
                New Attendee
              </TabsTrigger>
            </TabsList>
            
            <TabsContent value="existing">
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
                          value={newAttendeeId ? newAttendeeId : field.value}
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
                  
                  {courseTemplateId === null && (
                    <FormField
                      control={form.control}
                      name="courseTemplateId"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Course Template</FormLabel>
                          <Select 
                            onValueChange={field.onChange} 
                            defaultValue={field.value}
                            disabled={isSubmitting}
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
                            The course template for this waitlist record
                          </FormDescription>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  )}
                  
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
            </TabsContent>
            
            <TabsContent value="new">
              <div className="space-y-4">
                <div className="bg-muted/50 p-4 rounded-md mb-4">
                  <h3 className="text-sm font-medium">Create New Attendee</h3>
                  <p className="text-sm text-muted-foreground mt-1">
                    Fill in the details to create a new attendee and add them to the waitlist.
                  </p>
                </div>
                
                <AttendeeForm
                  defaultValues={{
                    name: "",
                    surname: "",
                    email: "",
                    telephone: "", // Changed from phoneNumber to telephone to match the type
                    rank: "PRIVATE" as AttendeeRank,
                    remark: ""
                  }}
                  onSubmit={handleNewAttendeeSubmit}
                  onCancel={() => setActiveTab("existing")}
                  isSubmitting={isCreatingAttendee}
                  showRemark={true}
                />
              </div>
            </TabsContent>
          </Tabs>
        )}
      </DialogContent>
    </Dialog>
  );
}
