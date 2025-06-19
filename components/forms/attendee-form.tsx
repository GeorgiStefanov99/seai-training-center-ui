"use client"

import React from "react"
import { zodResolver } from "@hookform/resolvers/zod"
import { useForm } from "react-hook-form"
import * as z from "zod"
import { AttendeeRank } from "@/types/attendee"
import { RANK_LABELS } from "@/lib/rank-labels"
import { Button } from "@/components/ui/button"
import {
  Form,
  FormControl,
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

// Form schema with validation
const formSchema = z.object({
  name: z.string().optional().or(z.literal("")),
  surname: z.string().optional().or(z.literal("")),
  email: z.string().email({
    message: "Please enter a valid email address.",
  }).optional().or(z.literal("")),
  telephone: z.string().optional().or(z.literal("")),
  rank: z.enum([...Object.keys(RANK_LABELS)] as [AttendeeRank, ...AttendeeRank[]]).optional(),
  remark: z.string().optional(),
  windaId: z.string()
    .max(10, { message: "Wind ID must not exceed 10 characters" })
    .regex(/^[a-zA-Z0-9]*$/, { message: "Wind ID must be alphanumeric" })
    .optional()
    .or(z.literal("")),
  fatherName: z.string()
    .optional()
    .or(z.literal("")),
  presentEmployer: z.string()
    .optional()
    .or(z.literal("")),
})

export type AttendeeFormValues = z.infer<typeof formSchema>

interface AttendeeFormProps {
  defaultValues?: Partial<AttendeeFormValues>
  onSubmit: (values: AttendeeFormValues) => void
  onCancel: () => void
  isSubmitting?: boolean
  showRemark?: boolean
}

export function AttendeeForm({
  defaultValues = {
    name: "",
    surname: "",
    email: "",
    telephone: "",
    rank: "CAPTAIN" as AttendeeRank,
    remark: "",
    windaId: "",
    fatherName: "",
    presentEmployer: "",
  },
  onSubmit,
  onCancel,
  isSubmitting = false,
  showRemark = true,
}: AttendeeFormProps) {
  const form = useForm<AttendeeFormValues>({
    resolver: zodResolver(formSchema),
    defaultValues,
  })

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <FormField
            control={form.control}
            name="name"
            render={({ field }) => (
              <FormItem>
                <FormLabel>First Name</FormLabel>
                <FormControl>
                  <Input placeholder="Enter first name" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="fatherName"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Father Name</FormLabel>
                <FormControl>
                  <Input 
                    placeholder="Enter father's name" 
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
            name="surname"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Last Name</FormLabel>
                <FormControl>
                  <Input placeholder="Enter last name" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="presentEmployer"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Present Employer</FormLabel>
                <FormControl>
                  <Input 
                    placeholder="Enter current employer (optional)" 
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
            name="email"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Email</FormLabel>
                <FormControl>
                  <Input type="email" placeholder="Enter email address (optional)" {...field} />
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
                <FormLabel>Telephone</FormLabel>
                <FormControl>
                  <Input placeholder="Enter telephone number (optional)" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        <FormField
          control={form.control}
          name="rank"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Rank</FormLabel>
              <Select onValueChange={field.onChange} defaultValue={field.value}>
                <FormControl>
                  <SelectTrigger>
                    <SelectValue placeholder="Select a rank (optional)" />
                  </SelectTrigger>
                </FormControl>
                <SelectContent className="max-h-[300px]">
                  {Object.entries(RANK_LABELS).map(([value, label]) => (
                    <SelectItem key={value} value={value}>
                      {label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="windaId"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Wind ID</FormLabel>
              <FormControl>
                <Input 
                  placeholder="Enter Wind ID (optional, max 10 alphanumeric characters)" 
                  maxLength={10}
                  {...field} 
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        {showRemark && (
          <FormField
            control={form.control}
            name="remark"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Remarks</FormLabel>
                <FormControl>
                  <Textarea
                    placeholder="Enter any additional information or remarks"
                    className="resize-none"
                    {...field}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        )}

        <div className="flex justify-end space-x-2 pt-4">
          <Button
            type="button"
            variant="outline"
            onClick={onCancel}
            disabled={isSubmitting}
          >
            Cancel
          </Button>
          <Button type="submit" disabled={isSubmitting}>
            {isSubmitting ? "Saving..." : "Save"}
          </Button>
        </div>
      </form>
    </Form>
  )
}
