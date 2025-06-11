"use client"

import * as React from "react"
import { format } from "date-fns"
import { Calendar as CalendarIcon } from "lucide-react"
import { DateRange } from "react-day-picker"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { Calendar } from "@/components/ui/calendar"
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover"

interface DateRangePickerProps {
  value?: DateRange
  onChange?: (date: DateRange | undefined) => void
  disabled?: (date: Date) => boolean
  placeholder?: string
  className?: string
}

export function DateRangePicker({
  value,
  onChange,
  disabled,
  placeholder = "Select date range",
  className,
}: DateRangePickerProps) {
  const [calendarOpen, setCalendarOpen] = React.useState(false);
  const [selectionStep, setSelectionStep] = React.useState<'start' | 'end'>('start');
  const [tempRange, setTempRange] = React.useState<DateRange | undefined>(value);

  // Reset selection step when calendar opens/closes
  React.useEffect(() => {
    if (calendarOpen) {
      setTempRange(value);
      setSelectionStep('start');
    }
  }, [calendarOpen, value]);

  // Handle calendar selection
  const handleSelect = (selectedDate: Date | undefined) => {
    if (!selectedDate) return;
    
    if (selectionStep === 'start') {
      // Set start date and move to end date selection
      setTempRange({ from: selectedDate, to: undefined });
      setSelectionStep('end');
    } else {
      // Complete the range selection
      if (tempRange?.from && selectedDate >= tempRange.from) {
        const newRange = { from: tempRange.from, to: selectedDate };
        setTempRange(newRange);
        if (onChange) {
          onChange(newRange);
        }
        setCalendarOpen(false);
      } else if (tempRange?.from && selectedDate < tempRange.from) {
        // If end date is before start date, swap them
        const newRange = { from: selectedDate, to: tempRange.from };
        setTempRange(newRange);
        if (onChange) {
          onChange(newRange);
        }
        setCalendarOpen(false);
      }
    }
  };

  // Get display text for the button
  const getButtonText = () => {
    if (value?.from) {
      if (value.to) {
        return (
          <>
            {format(value.from, "PPP")} - {format(value.to, "PPP")}
          </>
        );
      } else {
        return format(value.from, "PPP");
      }
    } else {
      return <span>{placeholder}</span>;
    }
  };

  // Get helper text for the calendar
  const getHelperText = () => {
    if (selectionStep === 'start') {
      return "Select start date";
    } else {
      return "Select end date";
    }
  };

  return (
    <Popover open={calendarOpen} onOpenChange={setCalendarOpen}>
      <PopoverTrigger asChild>
        <Button
          variant={"outline"}
          className={cn(
            "w-full justify-start text-left font-normal",
            !value?.from && "text-muted-foreground",
            className
          )}
        >
          <CalendarIcon className="mr-2 h-4 w-4" />
          {getButtonText()}
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-auto p-0 rounded-md shadow-md border border-border" align="start">
        <div className="p-3 border-b bg-muted/30">
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium">{getHelperText()}</span>
            {selectionStep === 'end' && tempRange?.from && (
              <span className="text-xs text-muted-foreground">
                From: {format(tempRange.from, "MMM d, yyyy")}
              </span>
            )}
          </div>
        </div>
        <Calendar
          initialFocus
          mode="range"
          defaultMonth={value?.from || new Date()}
          selected={selectionStep === 'start' ? 
            (tempRange?.from ? { from: tempRange.from, to: tempRange.from } : undefined) : 
            tempRange
          }
          onSelect={(range) => {
            if (!range) return;
            
            if (selectionStep === 'start' && range.from) {
              // Set start date and move to end date selection
              setTempRange({ from: range.from, to: undefined });
              setSelectionStep('end');
            } else if (selectionStep === 'end' && range.to) {
              // Complete the range selection
              const newRange = { from: tempRange?.from || range.from, to: range.to };
              setTempRange(newRange);
              if (onChange) {
                onChange(newRange);
              }
              setCalendarOpen(false);
            }
          }}
          disabled={disabled}
          numberOfMonths={2}
          className="rounded-md"
          classNames={{
            day_selected: "bg-primary text-primary-foreground hover:bg-primary hover:text-primary-foreground focus:bg-primary focus:text-primary-foreground",
            day_range_start: "bg-primary text-primary-foreground rounded-l-md",
            day_range_end: "bg-primary text-primary-foreground rounded-r-md",
            day_range_middle: "bg-primary/20 text-primary-foreground"
          }}
        />
      </PopoverContent>
    </Popover>
  )
}
