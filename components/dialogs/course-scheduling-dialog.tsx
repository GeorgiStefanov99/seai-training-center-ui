"use client"

import { useState, useEffect } from "react"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import * as z from "zod"
import { format, addDays, parse } from "date-fns"
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
import { Label } from "@/components/ui/label"
import { DateFields } from "@/components/dialogs/date-fields"
import { Textarea } from "@/components/ui/textarea"
import { Badge } from "@/components/ui/badge"
import { Checkbox } from "@/components/ui/checkbox"
import { toast } from "sonner"
import { createCourse, updateCourse } from "@/services/courseService"
import { CourseTemplate, WaitlistRecord } from "@/types/course-template"
import { CreateCourseRequest, Course, UpdateCourseRequest } from "@/types/course"
import { useAuth } from "@/hooks/useAuth"
import { getWaitlistRecordsByTemplate, deleteWaitlistRecord } from "@/services/waitlistService"
import { assignAttendeeToCourse } from "@/services/courseAttendeeService"

// Define the form schema with validation
const formSchema = z.object({
  name: z.string().min(2, "Name must be at least 2 characters"),
  startDateStr: z.string().min(1, "Start date is required")
    .refine(val => {
      try {
        parse(val, "dd/MM/yyyy", new Date());
        return true;
      } catch (e) {
        return false;
      }
    }, { message: "Invalid date format (dd/MM/yyyy)" }),
  endDateStr: z.string().min(1, "End date is required")
    .refine(val => {
      try {
        parse(val, "dd/MM/yyyy", new Date());
        return true;
      } catch (e) {
        return false;
      }
    }, { message: "Invalid date format (dd/MM/yyyy)" }),
  startTime: z.string().min(1, "Start time is required")
    .refine(val => /^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/.test(val), { 
      message: "Invalid time format (HH:MM)" 
    }),
  endTime: z.string().min(1, "End time is required")
    .refine(val => /^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/.test(val), { 
      message: "Invalid time format (HH:MM)" 
    }),
  price: z.coerce.number().min(0, "Price cannot be negative"),
  currency: z.string().min(1, "Currency is required"),
  maxSeats: z.coerce.number().min(1, "Maximum seats must be at least 1"),
  description: z.string().optional(),
}).refine(data => {
  const startDate = parse(data.startDateStr, "dd/MM/yyyy", new Date());
  const endDate = parse(data.endDateStr, "dd/MM/yyyy", new Date());
  return endDate >= startDate;
}, {
  message: "End date must be after start date",
  path: ["endDateStr"],
});

// Define the form values type
type FormValues = z.infer<typeof formSchema>;

// Define the component props
interface CourseSchedulingDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  template: CourseTemplate | null;
  onSuccess: () => void;
  existingCourse?: Course;
}

export function CourseSchedulingDialog({
  open,
  onOpenChange,
  template,
  onSuccess,
  existingCourse
}: CourseSchedulingDialogProps) {
  const { user } = useAuth();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [waitlistRecords, setWaitlistRecords] = useState<WaitlistRecord[]>([]);
  const [selectedWaitlistAttendees, setSelectedWaitlistAttendees] = useState<string[]>([]);
  const [isLoadingWaitlist, setIsLoadingWaitlist] = useState(false);
  
  // Determine if we're in edit mode
  const isEditMode = !!existingCourse;
  
  // Get training center ID from the authenticated user
  const trainingCenterId = user?.userId || "";
  
  // Helper function to format time from HH:mm:ss to HH:mm
  const formatTime = (timeString: string) => {
    if (!timeString) return "";
    const parts = timeString.split(':');
    if (parts.length >= 2) {
      return `${parts[0]}:${parts[1]}`;
    }
    return timeString;
  };

  // Initialize the form with default values from the template or existing course
  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: existingCourse?.name || template?.name || "",
      startDateStr: existingCourse ? format(new Date(existingCourse.startDate), "dd/MM/yyyy") : format(new Date(), "dd/MM/yyyy"),
      endDateStr: existingCourse ? format(new Date(existingCourse.endDate), "dd/MM/yyyy") : format(addDays(new Date(), 5), "dd/MM/yyyy"),
      startTime: existingCourse?.startTime ? formatTime(existingCourse.startTime) : "09:00",
      endTime: existingCourse?.endTime ? formatTime(existingCourse.endTime) : "17:00",
      price: existingCourse?.price || template?.price || 0,
      currency: existingCourse?.currency || template?.currency || "USD",
      maxSeats: existingCourse?.maxSeats || template?.maxSeats || 10,
      description: existingCourse?.description || template?.description || "",
    },
  });

  // Fetch waitlist records for the template
  const fetchWaitlistRecords = async () => {
    if (!template || !template.id || isEditMode) return;
    
    try {
      setIsLoadingWaitlist(true);
      const records = await getWaitlistRecordsByTemplate({
        trainingCenterId,
        courseTemplateId: template.id,
      });
      setWaitlistRecords(records);
    } catch (error) {
      console.error("Error fetching waitlist records:", error);
      toast.error("Failed to fetch waitlist records");
    } finally {
      setIsLoadingWaitlist(false);
    }
  };

  // Fetch waitlist records when dialog opens
  useEffect(() => {
    if (open && template && template.id && trainingCenterId) {
      fetchWaitlistRecords();
    } else {
      // Reset selected attendees when dialog closes
      setSelectedWaitlistAttendees([]);
    }
  }, [open, template, template?.id, trainingCenterId]);

  // Toggle selection of waitlist attendee
  const toggleWaitlistAttendee = (attendeeId: string) => {
    setSelectedWaitlistAttendees(prev => {
      if (prev.includes(attendeeId)) {
        return prev.filter(id => id !== attendeeId);
      } else {
        return [...prev, attendeeId];
      }
    });
  };

  // Handle form submission
  const onSubmit = async (data: FormValues) => {
    if (!trainingCenterId) {
      toast.error("Training center ID is required");
      return;
    }
    
    try {
      setIsSubmitting(true);
      
      // Parse dates from dd/MM/yyyy format
      const startDate = parse(data.startDateStr, "dd/MM/yyyy", new Date());
      const endDate = parse(data.endDateStr, "dd/MM/yyyy", new Date());
      
      // Format dates as ISO strings (yyyy-MM-dd)
      const startDateFormatted = format(startDate, "yyyy-MM-dd");
      const endDateFormatted = format(endDate, "yyyy-MM-dd");
      
      // Extract hours and minutes from time strings
      const [startHours, startMinutes] = data.startTime.split(':');
      const [endHours, endMinutes] = data.endTime.split(':');
      
      // Format times with leading zeros and seconds
      const startTimeFormatted = `${startHours.padStart(2, '0')}:${startMinutes.padStart(2, '0')}:00`;
      const endTimeFormatted = `${endHours.padStart(2, '0')}:${endMinutes.padStart(2, '0')}:00`;
      
      if (isEditMode && existingCourse) {
        // Prepare update course request
        const updateRequest: UpdateCourseRequest = {
          name: data.name,
          description: data.description || "",
          startDate: startDateFormatted,
          endDate: endDateFormatted,
          startTime: startTimeFormatted,
          endTime: endTimeFormatted,
          price: data.price,
          currency: data.currency,
          maxSeats: data.maxSeats,
          templateId: existingCourse.templateId || ""
        };
        
        console.log("Updating course with data:", updateRequest);
        
        // Update the course
        await updateCourse({ 
          trainingCenterId, 
          courseId: existingCourse.id 
        }, updateRequest);
        
        toast.success(`Course "${data.name}" has been updated`);
      } else {
        // Prepare create course request
        const courseRequest: CreateCourseRequest = {
          name: data.name,
          description: data.description || "",
          startDate: startDateFormatted,
          endDate: endDateFormatted,
          startTime: startTimeFormatted,
          endTime: endTimeFormatted,
          price: data.price,
          currency: data.currency,
          maxSeats: data.maxSeats,
          templateId: template?.id || "",
        };
        
        console.log("Creating course with data:", courseRequest);
        
        // Create the course
        const createdCourse = await createCourse({ trainingCenterId }, courseRequest);
        
        // If there are selected waitlist attendees, assign them to the course
        if (selectedWaitlistAttendees.length > 0) {
          await Promise.all(
            selectedWaitlistAttendees.map(async (attendeeId) => {
              try {
                // Assign attendee to course
                await assignAttendeeToCourse({
                  trainingCenterId,
                  courseId: createdCourse.id,
                  attendeeId,
                });
                
                // Find the waitlist record for this attendee
                const waitlistRecord = waitlistRecords.find(
                  record => record.attendeeResponse.id === attendeeId
                );
                
                // Delete the waitlist record
                if (waitlistRecord) {
                  await deleteWaitlistRecord({
                    trainingCenterId,
                    waitlistRecordId: waitlistRecord.id,
                  });
                }
              } catch (error) {
                console.error(`Error processing attendee ${attendeeId}:`, error);
                // Continue with other attendees even if one fails
              }
            })
          );
        }
      }
      
      toast.success("Course scheduled successfully");
      onSuccess(); // Trigger the success callback
      onOpenChange(false); // Close the dialog
    } catch (error) {
      console.error("Error scheduling course:", error);
      toast.error("Failed to schedule course");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[600px]">
        <DialogHeader>
          <DialogTitle>{isEditMode ? 'Edit Course' : 'Schedule New Course'}</DialogTitle>
          <DialogDescription>
            {isEditMode 
              ? `Edit course details for "${existingCourse?.name}".`
              : template?.name 
                ? `Create a new course based on the "${template.name}" template.` 
                : 'Create a new course.'}
          </DialogDescription>
        </DialogHeader>
        
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            <FormField
              control={form.control}
              name="name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Course Name</FormLabel>
                  <FormControl>
                    <Input placeholder="Enter course name" {...field} />
                  </FormControl>
                  <FormDescription>
                    The name of the course
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />
            
            <DateFields
              form={form}
              startDateName="startDateStr"
              endDateName="endDateStr"
            />
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="startTime"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Start Time</FormLabel>
                    <FormControl>
                      <Input
                        type="time"
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="endTime"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>End Time</FormLabel>
                    <FormControl>
                      <Input
                        type="time"
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <FormField
                control={form.control}
                name="price"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Price</FormLabel>
                    <FormControl>
                      <Input 
                        type="number" 
                        min="0" 
                        step="0.01" 
                        placeholder="0.00" 
                        {...field} 
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <FormField
                control={form.control}
                name="currency"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Currency</FormLabel>
                    <FormControl>
                      <Input {...field} disabled />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <FormField
                control={form.control}
                name="maxSeats"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Maximum Seats</FormLabel>
                    <FormControl>
                      <Input 
                        type="number" 
                        min="1" 
                        step="1" 
                        placeholder="10" 
                        {...field} 
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
            
            <FormField
              control={form.control}
              name="description"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Description</FormLabel>
                  <FormControl>
                    <Textarea 
                      placeholder="Enter course description" 
                      className="min-h-[100px]" 
                      {...field} 
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            
            {/* Waitlist Attendees Section */}
            {waitlistRecords.length > 0 && (
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <h3 className="text-lg font-medium">Waitlist Attendees</h3>
                  <span className="text-sm text-muted-foreground">
                    {selectedWaitlistAttendees.length} of {waitlistRecords.length} selected
                  </span>
                </div>
                <div className="border rounded-md p-4 space-y-2 max-h-[200px] overflow-y-auto">
                  {isLoadingWaitlist ? (
                    <div className="flex justify-center items-center py-4">
                      <p>Loading waitlist records...</p>
                    </div>
                  ) : waitlistRecords.length === 0 ? (
                    <p className="text-sm text-muted-foreground py-2">No waitlist records found for this template.</p>
                  ) : (
                    waitlistRecords.map((record) => {
                      const attendee = record.attendeeResponse;
                      return (
                        <div key={record.id} className="flex items-center space-x-2 py-1">
                          <Checkbox
                            id={`waitlist-${record.id}`}
                            checked={selectedWaitlistAttendees.includes(attendee.id)}
                            onCheckedChange={() => toggleWaitlistAttendee(attendee.id)}
                          />
                          <label
                            htmlFor={`waitlist-${record.id}`}
                            className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 cursor-pointer flex-1"
                          >
                            <div className="flex justify-between items-center">
                              <span>{attendee.name} {attendee.surname}</span>
                              <div className="flex items-center gap-2">
                                <Badge className={record.status === "CONFIRMED" ? "bg-green-500 hover:bg-green-600" : ""} variant={record.status === "CONFIRMED" ? "default" : "outline"}>
                                  {record.status}
                                </Badge>
                                <span className="text-xs text-muted-foreground">{attendee.rank}</span>
                              </div>
                            </div>
                            <div className="text-xs text-muted-foreground mt-1">
                              {attendee.email} • {attendee.telephone || "N/A"}
                            </div>
                          </label>
                        </div>
                      );
                    })
                  )}
                </div>
                <p className="text-sm text-muted-foreground">
                  Selected attendees will be automatically enrolled in the course and removed from the waitlist.
                </p>
              </div>
            )}
            
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
                Cancel
              </Button>
              <Button type="submit" disabled={isSubmitting}>
                {isSubmitting 
                  ? (isEditMode ? "Updating..." : "Scheduling...") 
                  : (isEditMode ? "Update Course" : "Schedule Course")}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
