"use client"

import React, { useEffect } from "react"
import { zodResolver } from "@hookform/resolvers/zod"
import { useForm } from "react-hook-form"
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
import { Contact } from "@/types/contact"

// Validation schema for contact form
const formSchema = z.object({
  nameOfOrganization: z
    .string()
    .min(1, "Organization name is required")
    .max(255, "Organization name must not exceed 255 characters"),
  firstName: z
    .string()
    .max(100, "First name must not exceed 100 characters")
    .optional()
    .or(z.literal("")),
  lastName: z
    .string()
    .max(100, "Last name must not exceed 100 characters")
    .optional()
    .or(z.literal("")),
  position: z
    .string()
    .max(100, "Position must not exceed 100 characters")
    .optional()
    .or(z.literal("")),
  email: z
    .string()
    .email("Please enter a valid email address")
    .max(255, "Email must not exceed 255 characters")
    .optional()
    .or(z.literal("")),
  phone: z
    .string()
    .max(20, "Phone number must not exceed 20 characters")
    .optional()
    .or(z.literal("")),
})

type FormData = z.infer<typeof formSchema>

interface ContactFormProps {
  contact?: Contact
  onSubmit: (data: FormData) => void
  onCancel: () => void
  isLoading?: boolean
  mode: "create" | "edit"
}

export function ContactForm({ 
  contact, 
  onSubmit, 
  onCancel, 
  isLoading = false, 
  mode 
}: ContactFormProps) {
  const form = useForm<FormData>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      nameOfOrganization: "",
      firstName: "",
      lastName: "",
      position: "",
      email: "",
      phone: "",
    },
  })

  // Reset form when contact data changes or dialog opens/closes
  useEffect(() => {
    const formValues = {
      nameOfOrganization: contact?.nameOfOrganization || "",
      firstName: contact?.firstName || "",
      lastName: contact?.lastName || "",
      position: contact?.position || "",
      email: contact?.email || "",
      phone: contact?.phone || "",
    }
    
    // Force reset with new values
    form.reset(formValues)
    
    // Clear any form state errors
    form.clearErrors()
  }, [contact, form, mode])

  const handleSubmit = (data: FormData) => {
    // Clean up empty strings to undefined for optional fields
    const cleanedData = {
      ...data,
      firstName: data.firstName?.trim() || undefined,
      lastName: data.lastName?.trim() || undefined,
      position: data.position?.trim() || undefined,
      email: data.email?.trim() || undefined,
      phone: data.phone?.trim() || undefined,
    }
    
    // Submit the cleaned data
    onSubmit(cleanedData)
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-4">
        {/* Organization Name Field */}
        <FormField
          control={form.control}
          name="nameOfOrganization"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Organization Name *</FormLabel>
              <FormControl>
                <Input
                  placeholder="Enter organization name"
                  {...field}
                  disabled={isLoading}
                />
              </FormControl>
              <FormDescription>
                The name of the organization or company
              </FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />

        {/* First Name Field */}
        <FormField
          control={form.control}
          name="firstName"
          render={({ field }) => (
            <FormItem>
              <FormLabel>First Name</FormLabel>
              <FormControl>
                <Input
                  placeholder="Enter first name"
                  {...field}
                  disabled={isLoading}
                />
              </FormControl>
              <FormDescription>
                Contact person's first name (optional)
              </FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />

        {/* Last Name Field */}
        <FormField
          control={form.control}
          name="lastName"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Last Name</FormLabel>
              <FormControl>
                <Input
                  placeholder="Enter last name"
                  {...field}
                  disabled={isLoading}
                />
              </FormControl>
              <FormDescription>
                Contact person's last name (optional)
              </FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />

        {/* Position Field */}
        <FormField
          control={form.control}
          name="position"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Position</FormLabel>
              <FormControl>
                <Input
                  placeholder="Enter position"
                  {...field}
                  disabled={isLoading}
                />
              </FormControl>
              <FormDescription>
                Contact person's position in the organization (optional)
              </FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />

        {/* Email Field */}
        <FormField
          control={form.control}
          name="email"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Email</FormLabel>
              <FormControl>
                <Input
                  type="email"
                  placeholder="Enter email address"
                  {...field}
                  disabled={isLoading}
                />
              </FormControl>
              <FormDescription>
                Contact email address (optional)
              </FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />

        {/* Phone Field */}
        <FormField
          control={form.control}
          name="phone"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Phone</FormLabel>
              <FormControl>
                <Input
                  type="tel"
                  placeholder="Enter phone number"
                  {...field}
                  disabled={isLoading}
                />
              </FormControl>
              <FormDescription>
                Contact phone number (optional)
              </FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />

        {/* Form Actions */}
        <div className="flex justify-end gap-2 pt-4">
          <Button
            type="button"
            variant="outline"
            onClick={onCancel}
            disabled={isLoading}
          >
            Cancel
          </Button>
          <Button
            type="submit"
            disabled={isLoading}
          >
            {isLoading 
              ? `${mode === "create" ? "Creating" : "Updating"}...` 
              : `${mode === "create" ? "Create" : "Update"} Contact`
            }
          </Button>
        </div>
      </form>
    </Form>
  )
} 