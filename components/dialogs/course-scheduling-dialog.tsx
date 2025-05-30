"use client"

import { useState } from "react"
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
import { Textarea } from "@/components/ui/textarea"
import { toast } from "sonner"
import { createCourse } from "@/services/courseService"
import { CourseTemplate } from "@/types/course-template"
import { CreateCourseRequest } from "@/types/course"
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
interface CourseSchedulingDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  template: CourseTemplate;
  onSuccess: () => void;
}

export function CourseSchedulingDialog({
  open,
  onOpenChange,
  template,
  onSuccess
}: CourseSchedulingDialogProps) {
  const { user } = useAuth();
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  // Get training center ID from the authenticated user
  const trainingCenterId = user?.userId || "";

  // Initialize the form with default values from the template
  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: template.name || "",
      startDateStr: format(new Date(), "yyyy-MM-dd"),
      endDateStr: format(addDays(new Date(), 5), "yyyy-MM-dd"),
      startTime: "09:00",
      endTime: "17:00",
      price: template.price || 0,
      currency: template.currency || "USD",
      maxSeats: template.maxSeats || 10,
      description: template.description || "",
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

      // Create course request payload
      const courseData: CreateCourseRequest = {
        name: data.name,
        startDate: startDate.toISOString(),
        endDate: endDate.toISOString(),
        startTime: startTimeFormatted,
        endTime: endTimeFormatted,
        price: data.price,
        currency: data.currency,
        maxSeats: data.maxSeats,
        description: data.description || "",
        templateId: template.id
      };

      // Call API to create course
      await createCourse({ trainingCenterId }, courseData);
      
      toast.success("Course scheduled successfully");
      onSuccess();
      onOpenChange(false);
    } catch (error) {
      console.error("Error scheduling course:", error);
      toast.error("Failed to schedule course. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[600px]">
        <DialogHeader>
          <DialogTitle>Schedule New Course</DialogTitle>
          <DialogDescription>
            Schedule a new course based on the "{template.name}" template.
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
                        min={format(new Date(), "yyyy-MM-dd")}
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
                        min={form.getValues("startDateStr")}
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
                {isSubmitting ? "Scheduling..." : "Schedule Course"}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
