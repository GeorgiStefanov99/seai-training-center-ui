import React from 'react';
import { FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { DateInput } from "@/components/ui/date-input";
import { UseFormReturn } from 'react-hook-form';

interface DateFieldsProps {
  form: UseFormReturn<any>;
  startDateName: string;
  endDateName: string;
  startDateLabel?: string;
  endDateLabel?: string;
}

export function DateFields({
  form,
  startDateName,
  endDateName,
  startDateLabel = "Start Date",
  endDateLabel = "End Date"
}: DateFieldsProps) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
      <FormField
        control={form.control}
        name={startDateName}
        render={({ field }) => (
          <FormItem className="flex flex-col">
            <FormLabel>{startDateLabel}</FormLabel>
            <FormControl>
              <DateInput
                value={field.value}
                onChange={field.onChange}
                onBlur={field.onBlur}
                name={field.name}
              />
            </FormControl>
            <FormMessage />
          </FormItem>
        )}
      />
      <FormField
        control={form.control}
        name={endDateName}
        render={({ field }) => (
          <FormItem className="flex flex-col">
            <FormLabel>{endDateLabel}</FormLabel>
            <FormControl>
              <DateInput
                value={field.value}
                onChange={field.onChange}
                onBlur={field.onBlur}
                name={field.name}
              />
            </FormControl>
            <FormMessage />
          </FormItem>
        )}
      />
    </div>
  );
}
