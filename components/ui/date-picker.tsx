"use client"

import * as React from "react"
import { format } from "date-fns"
import { Calendar as CalendarIcon } from "lucide-react"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { Calendar } from "@/components/ui/calendar"
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover"

interface DatePickerProps {
  value?: Date
  onChange?: (date?: Date) => void
  disabled?: (date: Date) => boolean
}

export function DatePicker({ value, onChange, disabled }: DatePickerProps) {
  const [calendarOpen, setCalendarOpen] = React.useState(false);
  const yearsToShow = 10; // Show 10 years before and after current year
  
  const currentYear = new Date().getFullYear();
  const years = Array.from({ length: yearsToShow * 2 + 1 }, (_, i) => currentYear - yearsToShow + i);
  
  // Function to handle year change
  const handleYearChange = (year: number) => {
    if (value) {
      const newDate = new Date(value);
      newDate.setFullYear(year);
      onChange?.(newDate);
    } else {
      // If no date is selected, create a new date with the selected year and current month/day
      const newDate = new Date();
      newDate.setFullYear(year);
      onChange?.(newDate);
    }
  };

  return (
    <Popover open={calendarOpen} onOpenChange={setCalendarOpen}>
      <PopoverTrigger asChild>
        <Button
          variant={"outline"}
          className={cn(
            "w-full justify-start text-left font-normal",
            !value && "text-muted-foreground"
          )}
        >
          <CalendarIcon className="mr-2 h-4 w-4" />
          {value ? format(value, "PPP") : <span>Pick a date</span>}
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-auto p-0 rounded-md shadow-md border border-border" align="start">
        <div className="flex justify-between items-center p-3 border-b bg-muted/30">
          <div className="flex items-center space-x-2">
            <CalendarIcon className="h-4 w-4 text-muted-foreground" />
            <span className="text-sm font-medium">
              {value ? format(value, "MMMM") : format(new Date(), "MMMM")}
            </span>
          </div>
          <select 
            className="text-sm bg-transparent border rounded-md px-2 py-1 focus:outline-none focus:ring-1 focus:ring-primary cursor-pointer"
            value={value ? value.getFullYear() : new Date().getFullYear()}
            onChange={(e) => handleYearChange(parseInt(e.target.value))}
            aria-label="Select year"
          >
            {years.map((year) => (
              <option key={year} value={year}>
                {year}
              </option>
            ))}
          </select>
        </div>
        <Calendar
          mode="single"
          selected={value}
          onSelect={onChange}
          disabled={disabled}
          initialFocus
          className="rounded-b-md"
        />
      </PopoverContent>
    </Popover>
  )
}
