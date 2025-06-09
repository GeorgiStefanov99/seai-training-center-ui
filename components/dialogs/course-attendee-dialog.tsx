"use client"

import { useState, useEffect, useMemo } from "react"
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
import { WaitlistRecord, WaitlistAttendeeResponse } from "@/types/course-template"
import { getAttendees, createAttendee } from "@/services/attendeeService"
import { assignAttendeeToCourse } from "@/services/courseAttendeeService"
import { getWaitlistRecordsByTemplate, deleteWaitlistRecord } from "@/services/waitlistService"
import { Loader2, Search, UserPlus, Users } from "lucide-react"
import { Input } from "@/components/ui/input"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Badge } from "@/components/ui/badge"
import { AttendeeForm, AttendeeFormValues } from "@/components/forms/attendee-form"

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
  templateId?: string; // Optional template ID for fetching waitlist records
  onSuccess: () => void;
}

export function CourseAttendeeDialog({
  open,
  onOpenChange,
  courseId,
  templateId,
  onSuccess
}: CourseAttendeeDialogProps) {
  const { user } = useAuth();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [attendees, setAttendees] = useState<Attendee[]>([]);
  const [filteredAttendees, setFilteredAttendees] = useState<Attendee[]>([]);
  const [waitlistRecords, setWaitlistRecords] = useState<WaitlistRecord[]>([]);
  const [waitlistSearchQuery, setWaitlistSearchQuery] = useState("");
  const [selectedWaitlistRecord, setSelectedWaitlistRecord] = useState<WaitlistRecord | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [activeTab, setActiveTab] = useState<"existing" | "new" | "waitlist">("existing");
  const [isCreatingAttendee, setIsCreatingAttendee] = useState(false);
  const [newAttendeeId, setNewAttendeeId] = useState<string | null>(null);
  
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
      
      // Fetch waitlist records if templateId is provided
      if (templateId) {
        fetchWaitlistRecords();
      }
    }
  }, [open, trainingCenterId, templateId]);
  
  // Function to fetch waitlist records for the specific template
  const fetchWaitlistRecords = async () => {
    if (!templateId || !trainingCenterId) return;
    
    try {
      const records = await getWaitlistRecordsByTemplate({
        trainingCenterId,
        courseTemplateId: templateId
      });
      setWaitlistRecords(records);
    } catch (error) {
      console.error("Error fetching waitlist records:", error);
      toast.error("Failed to load waitlist records. Please try again.");
    }
  };

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
  
  // Filter waitlist records based on search query
  const filteredWaitlistRecords = useMemo(() => {
    if (!waitlistSearchQuery) return waitlistRecords;
    
    const query = waitlistSearchQuery.toLowerCase();
    return waitlistRecords.filter(record => {
      const { name, surname, email } = record.attendeeResponse;
      return (
        name.toLowerCase().includes(query) ||
        surname.toLowerCase().includes(query) ||
        email.toLowerCase().includes(query)
      );
    });
  }, [waitlistRecords, waitlistSearchQuery]);
  
  // Find waitlist record by attendee ID
  const findWaitlistRecordByAttendeeId = (attendeeId: string): WaitlistRecord | undefined => {
    return waitlistRecords.find(record => record.attendeeResponse.id === attendeeId);
  };

  // Handle form submission for existing attendee
  const onSubmit = async (data: FormValues) => {
    try {
      setIsSubmitting(true);
      
      // Assign the selected attendee to the course
      await assignAttendeeToCourse({
        trainingCenterId: user?.userId || "",
        courseId,
        attendeeId: data.attendeeId,
      });
      
      // If assigning from waitlist, remove the waitlist record
      if (activeTab === "waitlist" && user?.userId) {
        // Find the waitlist record for this attendee
        const waitlistRecord = findWaitlistRecordByAttendeeId(data.attendeeId);
        
        if (waitlistRecord) {
          try {
            await deleteWaitlistRecord({
              trainingCenterId: user.userId,
              waitlistRecordId: waitlistRecord.id
            });
            toast.success("Attendee assigned to course and removed from waitlist successfully.");
          } catch (waitlistError) {
            console.error("Error removing from waitlist:", waitlistError);
            toast.error("Attendee was assigned to course but could not be removed from waitlist.");
          }
        } else {
          toast.success("Attendee assigned to course successfully.");
        }
      } else {
        toast.success("Attendee assigned to course successfully.");
      }
      
      try {
        onSuccess();
      } catch (successError) {
        console.error("Error in onSuccess callback:", successError);
      }
      
      // Ensure the dialog closes even if there was an error in onSuccess
      onOpenChange(false);
    } catch (error) {
      console.error("Error assigning attendee to course:", error);
      toast.error("Failed to assign attendee to course. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };
  
  // Handle new attendee submission
  const handleNewAttendeeSubmit = async (attendeeData: AttendeeFormValues) => {
    if (!trainingCenterId) {
      toast.error("Training center ID is required");
      return;
    }

    if (!courseId) {
      toast.error("Course ID is required");
      return;
    }

    setIsCreatingAttendee(true);

    try {
      // First create the attendee
      const newAttendee = await createAttendee(
        { trainingCenterId },
        attendeeData
      );
      
      // Then assign the new attendee to the course
      await assignAttendeeToCourse({
        trainingCenterId,
        courseId,
        attendeeId: newAttendee.id,
      });
      
      toast.success("New attendee created and assigned to course successfully");
      
      // Call onSuccess and handle any errors that might occur
      try {
        await onSuccess();
      } catch (successError) {
        console.error("Error in onSuccess callback:", successError);
      }
      
      // Ensure the dialog closes even if there was an error in onSuccess
      onOpenChange(false);
    } catch (error) {
      console.error("Error creating and assigning new attendee:", error);
      toast.error("Failed to create and assign new attendee. Please try again.");
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
          <DialogTitle>Assign Attendee to Course</DialogTitle>
          <DialogDescription>
            Select an existing attendee or create a new one to assign to this course.
          </DialogDescription>
        </DialogHeader>
        
        {isLoading ? (
          <div className="flex justify-center py-8">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
          </div>
        ) : (
          <Tabs value={activeTab} onValueChange={(value) => setActiveTab(value as "existing" | "new" | "waitlist")} className="w-full">
            <TabsList className="grid w-full grid-cols-3">
              <TabsTrigger value="existing" className="flex items-center">
                <Users className="mr-2 h-4 w-4" />
                Existing Attendee
              </TabsTrigger>
              <TabsTrigger value="new" className="flex items-center">
                <UserPlus className="mr-2 h-4 w-4" />
                New Attendee
              </TabsTrigger>
                <TabsTrigger value="waitlist" className="flex items-center">
                  <Users className="mr-2 h-4 w-4" />
                  From Waitlist
                </TabsTrigger>
            </TabsList>
            
            <TabsContent value="existing" className="space-y-4 pt-4">
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
                            <ScrollArea className={`${filteredAttendees.length > 5 ? 'h-72' : 'max-h-72'}`}>
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
            </TabsContent>
            
            <TabsContent value="new" className="space-y-4 pt-4">
              <div className="bg-muted/50 p-4 rounded-md mb-4">
                <h3 className="text-sm font-medium">Create New Attendee</h3>
                <p className="text-sm text-muted-foreground mt-1">
                  Fill in the details to create a new attendee and assign them to this course.
                </p>
              </div>
              
              <AttendeeForm
                defaultValues={{
                  name: "",
                  surname: "",
                  email: "",
                  telephone: "",
                  rank: "PRIVATE" as AttendeeRank,
                  remark: ""
                }}
                onSubmit={handleNewAttendeeSubmit}
                onCancel={() => setActiveTab("existing")}
                isSubmitting={isCreatingAttendee}
                showRemark={true}
              />
            </TabsContent>
            
            <TabsContent value="waitlist" className="space-y-4 pt-4">
              <div className="bg-muted/50 p-4 rounded-md mb-4">
                <h3 className="text-sm font-medium">Select from Waitlist</h3>
                <p className="text-sm text-muted-foreground mt-1">
                  Assign an attendee from the course waitlist to this course.
                </p>
              </div>
              
              {!templateId ? (
                <div className="p-4 text-center text-sm text-muted-foreground border rounded-md">
                  This feature is only available for courses created from a template. The waitlist functionality is tied to specific course templates.
                </div>
              ) : (
                <Form {...form}>
                  <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                    {/* Search input */}
                    <div className="relative">
                      <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                      <Input
                        placeholder="Search waitlist..."
                        className="pl-9"
                        value={waitlistSearchQuery}
                        onChange={(e) => setWaitlistSearchQuery(e.target.value)}
                      />
                    </div>
                    
                    <FormField
                      control={form.control}
                      name="attendeeId"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Waitlisted Attendee</FormLabel>
                          <Select 
                            onValueChange={(value) => {
                              field.onChange(value);
                              // Store the selected waitlist record
                              const record = findWaitlistRecordByAttendeeId(value);
                              if (record) {
                                setSelectedWaitlistRecord(record);
                              }
                            }} 
                            defaultValue={field.value}
                          >
                            <FormControl>
                              <SelectTrigger>
                                <SelectValue placeholder="Select from waitlist" />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              <ScrollArea className={`${filteredWaitlistRecords.length > 5 ? 'h-72' : 'max-h-72'}`}>
                                {filteredWaitlistRecords.length > 0 ? (
                                  filteredWaitlistRecords.map((record: WaitlistRecord) => (
                                    <SelectItem key={record.attendeeResponse.id} value={record.attendeeResponse.id} className="flex items-center justify-between">
                                      <div className="flex items-center justify-between w-full pr-2">
                                        <span>{`${record.attendeeResponse.name} ${record.attendeeResponse.surname} (${record.attendeeResponse.email}) - ${formatRank(record.attendeeResponse.rank)}`}</span>
                                        <Badge className={record.status === "CONFIRMED" ? "bg-green-500 hover:bg-green-600 ml-2" : "ml-2"} variant={record.status === "CONFIRMED" ? "default" : "outline"}>
                                          {record.status}
                                        </Badge>
                                      </div>
                                    </SelectItem>
                                  ))
                                ) : (
                                  <div className="p-2 text-center text-sm text-muted-foreground">
                                    No waitlisted attendees found
                                  </div>
                                )}
                              </ScrollArea>
                            </SelectContent>
                          </Select>
                          <FormDescription>
                            The waitlisted attendee to assign to this course
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
                          "Assign from Waitlist"
                        )}
                      </Button>
                    </DialogFooter>
                  </form>
                </Form>
              )}
            </TabsContent>
          </Tabs>
        )}
      </DialogContent>
    </Dialog>
  );
}
