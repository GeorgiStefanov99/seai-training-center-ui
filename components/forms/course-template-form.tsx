"use client"

import { useState } from "react"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import * as z from "zod"
import { Button } from "@/components/ui/button"
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { CourseTemplate, Currency } from "@/types/course-template"

// Define the form schema with validation
const formSchema = z.object({
  name: z.string().min(2, "Name must be at least 2 characters"),
  price: z.coerce.number().min(0, "Price cannot be negative"),
  currency: z.enum(["USD", "EUR", "BGN"] as const),
  maxSeats: z.coerce.number().min(1, "Maximum seats must be at least 1"),
  description: z.string().optional(),
})

// Define the form values type
type FormValues = z.infer<typeof formSchema>

// Define the component props
interface CourseTemplateFormProps {
  template?: CourseTemplate
  onSubmit: (data: FormValues) => void
  isSubmitting: boolean
}

export function CourseTemplateForm({ template, onSubmit, isSubmitting }: CourseTemplateFormProps) {
  // Initialize the form with default values or existing template data
  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: template?.name || "",
      price: template?.price || 0,
      currency: template?.currency || "USD",
      maxSeats: template?.maxSeats || 10,
      description: template?.description || "",
    },
  })

  // Currency options
  const currencies: Currency[] = ["USD", "EUR", "BGN"]
  
  // Currency symbols for display
  const currencySymbols: Record<Currency, string> = {
    USD: "$",
    EUR: "€",
    BGN: "лв"
  }

  return (
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
                The name of the course template
              </FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
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
                <FormDescription>
                  The price of the course
                </FormDescription>
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
                <Select 
                  onValueChange={field.onChange} 
                  defaultValue={field.value}
                >
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue placeholder="Select currency" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    {currencies.map((currency) => (
                      <SelectItem key={currency} value={currency}>
                        {currencySymbols[currency]} {currency}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <FormDescription>
                  The currency for the price
                </FormDescription>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>
        
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
              <FormDescription>
                The maximum number of attendees for this course
              </FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />
        
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
              <FormDescription>
                A detailed description of the course template
              </FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />
        
        <Button type="submit" disabled={isSubmitting}>
          {isSubmitting ? "Saving..." : "Save Course Template"}
        </Button>
      </form>
    </Form>
  )
}
