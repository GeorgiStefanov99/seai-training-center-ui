"use client"

import { useState, useEffect } from "react"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import * as z from "zod"
import { format, parse } from "date-fns"
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
import { Textarea } from "@/components/ui/textarea"
import { toast } from "sonner"
import { updateCourse } from "@/services/courseService"
import { getCourseTemplateById } from "@/services/courseTemplateService"
import { ActiveCourse, CourseTemplate } from "@/types/course-template"
import { UpdateCourseRequest } from "@/types/course"
import { useAuth } from "@/hooks/useAuth"

// Define the form schema with validation
const formSchema = z.object({
  name: z.string().min(2, "Name must be at least 2 characters"),
  startDateStr: z.string().min(1, "Start date is required")
    .refine(val => {
      try {
        parse(val, "yyyy-MM-dd", new Date());
        return true;
      } catch (e) {
        return false;
      }
    }, { message: "Invalid date format" }),
  endDateStr: z.string().min(1, "End date is required")
    .refine(val => {
      try {
        parse(val, "yyyy-MM-dd", new Date());
        return true;
      } catch (e) {
        return false;
      }
    }, { message: "Invalid date format" }),
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
  const startDate = parse(data.startDateStr, "yyyy-MM-dd", new Date());
  const endDate = parse(data.endDateStr, "yyyy-MM-dd", new Date());
  return endDate >= startDate;
}, {
  message: "End date must be after start date",
  path: ["endDateStr"],
});

// Define the form values type
type FormValues = z.infer<typeof formSchema>;

// Define the component props
interface CourseEditDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  course: ActiveCourse;
  onSuccess: () => void;
}

export function CourseEditDialog({
  open,
  onOpenChange,
  course,
  onSuccess
}: CourseEditDialogProps) {
  const { user } = useAuth();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [template, setTemplate] = useState<CourseTemplate | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  
  // Get training center ID from the authenticated user
  const trainingCenterId = user?.userId || "";

  // Extract time from ISO string (format: "HH:mm")
  const extractTime = (timeStr: string) => {
    if (!timeStr) return "09:00"; // Default time if not available
    return timeStr.substring(0, 5); // Get first 5 chars (HH:mm)
  };
  
  // Fetch template details to get missing properties
  useEffect(() => {
    if (open && trainingCenterId && course.templateId) {
      setIsLoading(true);
      getCourseTemplateById({
        trainingCenterId,
        courseTemplateId: course.templateId
      })
        .then(data => {
          setTemplate(data);
          // Update form with template data
          form.setValue("price", data.price);
          form.setValue("currency", data.currency);
          form.setValue("maxSeats", data.maxSeats);
          form.setValue("description", data.description || "");
        })
        .catch(err => {
          console.error("Error fetching template details:", err);
        })
        .finally(() => {
          setIsLoading(false);
        });
    }
  }, [open, trainingCenterId, course.templateId]);

  // Initialize the form with values from the course
  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: course.name || "",
      startDateStr: format(new Date(course.startDate), "yyyy-MM-dd"),
      endDateStr: format(new Date(course.endDate), "yyyy-MM-dd"),
      startTime: "09:00", // Default values that will be updated when template loads
      endTime: "17:00",
      price: 0,
      currency: "USD",
      maxSeats: 10,
      description: "",
    },
  });

  // Handle form submission
  const onSubmit = async (data: FormValues) => {
    if (!trainingCenterId) {
      toast.error("Training center ID is required");
      return;
    }

    setIsSubmitting(true);

    try {
      // Parse dates from strings
      const startDate = parse(data.startDateStr, "yyyy-MM-dd", new Date());
      const endDate = parse(data.endDateStr, "yyyy-MM-dd", new Date());
      
      // Format times with seconds as required by the backend
      const startTimeFormatted = `${data.startTime}:00`;
      const endTimeFormatted = `${data.endTime}:00`;

      // Create course update payload
      const courseData: UpdateCourseRequest = {
        name: data.name,
        startDate: startDate.toISOString(),
        endDate: endDate.toISOString(),
        startTime: startTimeFormatted,
        endTime: endTimeFormatted,
        price: data.price,
        currency: data.currency,
        maxSeats: data.maxSeats,
        description: data.description || "",
      };

      // Call API to update course
      await updateCourse({ 
        trainingCenterId, 
        courseId: course.id 
      }, courseData);
      
      toast.success("Course updated successfully");
      onSuccess();
      onOpenChange(false);
    } catch (error) {
      console.error("Error updating course:", error);
      toast.error("Failed to update course. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[600px]">
        <DialogHeader>
          <DialogTitle>Edit Course</DialogTitle>
          <DialogDescription>
            Update the details for "{course.name}".
          </DialogDescription>
        </DialogHeader>
        
        {isLoading && (
          <div className="flex justify-center items-center py-8">
            <div className="flex items-center space-x-2">
              <div className="h-4 w-4 animate-spin rounded-full border-2 border-primary border-t-transparent"></div>
              <p className="text-sm text-muted-foreground">Loading course details...</p>
            </div>
          </div>
        )}
        
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
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="startDateStr"
                render={({ field }) => (
                  <FormItem className="flex flex-col">
                    <FormLabel>Start Date</FormLabel>
                    <FormControl>
                      <Input 
                        type="date" 
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="endDateStr"
                render={({ field }) => (
                  <FormItem className="flex flex-col">
                    <FormLabel>End Date</FormLabel>
                    <FormControl>
                      <Input 
                        type="date" 
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
            
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
            
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
                Cancel
              </Button>
              <Button type="submit" disabled={isSubmitting}>
                {isSubmitting ? "Updating..." : "Update Course"}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
