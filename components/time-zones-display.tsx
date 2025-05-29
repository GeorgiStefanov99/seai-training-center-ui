"use client"

import { useState, useEffect } from "react"
import { Clock, Plus, X } from "lucide-react"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { 
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter,
  DialogClose
} from "@/components/ui/dialog"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Badge } from "@/components/ui/badge"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"

// Common time zones with their UTC offsets and locations
const TIME_ZONES = [
  { id: "utc", name: "UTC", offset: 0, location: "Coordinated Universal Time" },
  { id: "london", name: "London", offset: 0, location: "United Kingdom" },
  { id: "new_york", name: "New York", offset: -5, location: "United States" },
  { id: "los_angeles", name: "Los Angeles", offset: -8, location: "United States" },
  { id: "tokyo", name: "Tokyo", offset: 9, location: "Japan" },
  { id: "sydney", name: "Sydney", offset: 10, location: "Australia" },
  { id: "dubai", name: "Dubai", offset: 4, location: "UAE" },
  { id: "moscow", name: "Moscow", offset: 3, location: "Russia" },
  { id: "paris", name: "Paris", offset: 1, location: "France" },
  { id: "singapore", name: "Singapore", offset: 8, location: "Singapore" },
  { id: "mumbai", name: "Mumbai", offset: 5.5, location: "India" },
  { id: "sao_paulo", name: "São Paulo", offset: -3, location: "Brazil" },
  { id: "cairo", name: "Cairo", offset: 2, location: "Egypt" },
  { id: "auckland", name: "Auckland", offset: 12, location: "New Zealand" },
  { id: "hong_kong", name: "Hong Kong", offset: 8, location: "China" },
  { id: "istanbul", name: "Istanbul", offset: 3, location: "Turkey" },
  { id: "berlin", name: "Berlin", offset: 1, location: "Germany" },
  { id: "johannesburg", name: "Johannesburg", offset: 2, location: "South Africa" },
  { id: "rio", name: "Rio de Janeiro", offset: -3, location: "Brazil" },
  { id: "bangkok", name: "Bangkok", offset: 7, location: "Thailand" },
]

// Format the time for a specific timezone with seconds
const formatTimeForTimezone = (offset: number) => {
  const date = new Date()
  const utcDate = date.getTime() + (date.getTimezoneOffset() * 60000)
  const newDate = new Date(utcDate + (3600000 * offset))
  
  return {
    hours: newDate.getHours(),
    minutes: newDate.getMinutes(),
    seconds: newDate.getSeconds(),
    ampm: newDate.getHours() >= 12 ? 'PM' : 'AM',
    hours12: newDate.getHours() % 12 || 12,
    formattedTime: newDate.toLocaleTimeString('en-US', { 
      hour: '2-digit', 
      minute: '2-digit',
      second: '2-digit',
      hour12: true
    })
  }
}

// Format the date for a specific timezone
const formatDateForTimezone = (offset: number) => {
  const date = new Date()
  const utcDate = date.getTime() + (date.getTimezoneOffset() * 60000)
  const newDate = new Date(utcDate + (3600000 * offset))
  
  return newDate.toLocaleDateString('en-US', { 
    month: 'short',
    day: 'numeric',
    year: 'numeric'
  })
}

// Get the UTC offset string (e.g., UTC+8, UTC-5)
const getUtcOffsetString = (offset: number) => {
  const sign = offset >= 0 ? '+' : ''
  return `UTC${sign}${offset}`
}

// Calculate clock hand angles
const getClockHandAngles = (hours: number, minutes: number, seconds: number) => {
  // Hour hand makes a full 360° rotation in 12 hours (30° per hour)
  // Plus a small additional rotation based on minutes (30° / 60 = 0.5° per minute)
  const hourAngle = (hours % 12) * 30 + minutes * 0.5
  
  // Minute hand makes a full 360° rotation in 60 minutes (6° per minute)
  // Plus a small additional rotation based on seconds (6° / 60 = 0.1° per second)
  const minuteAngle = minutes * 6 + seconds * 0.1
  
  // Second hand makes a full 360° rotation in 60 seconds (6° per second)
  const secondAngle = seconds * 6
  
  return { hourAngle, minuteAngle, secondAngle }
}

type TimeZoneDisplayProps = {
  className?: string
}

export function TimeZonesDisplay({ className }: TimeZoneDisplayProps) {
  // Default to showing UTC, local time, and one other popular timezone
  const [selectedTimeZones, setSelectedTimeZones] = useState<string[]>(['utc', 'new_york', 'tokyo'])
  const [timeData, setTimeData] = useState<Record<string, ReturnType<typeof formatTimeForTimezone>>>({})
  const [currentDate, setCurrentDate] = useState<Record<string, string>>({})
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false)
  
  // Update times every second
  useEffect(() => {
    const updateTimes = () => {
      const times: Record<string, ReturnType<typeof formatTimeForTimezone>> = {}
      const dates: Record<string, string> = {}
      
      TIME_ZONES.forEach(zone => {
        times[zone.id] = formatTimeForTimezone(zone.offset)
        dates[zone.id] = formatDateForTimezone(zone.offset)
      })
      
      setTimeData(times)
      setCurrentDate(dates)
    }
    
    // Initial update
    updateTimes()
    
    // Set interval for updates
    const interval = setInterval(updateTimes, 1000)
    
    // Cleanup
    return () => clearInterval(interval)
  }, [])
  
  const handleAddTimeZone = (id: string) => {
    if (!selectedTimeZones.includes(id)) {
      setSelectedTimeZones([...selectedTimeZones, id])
    }
    setIsAddDialogOpen(false)
  }
  
  const handleRemoveTimeZone = (id: string) => {
    if (selectedTimeZones.length > 1) {
      setSelectedTimeZones(selectedTimeZones.filter(zone => zone !== id))
    }
  }
  
  // Get available time zones (not already selected)
  const availableTimeZones = TIME_ZONES.filter(zone => !selectedTimeZones.includes(zone.id))
  
  return (
    <div className={`mb-6 ${className || ''}`}>
      <div className="flex flex-wrap gap-4">
        {selectedTimeZones.map(id => {
          const zone = TIME_ZONES.find(z => z.id === id)
          if (!zone) return null
          
          const time = timeData[zone.id]
          const date = currentDate[zone.id]
          
          // Calculate clock hand angles
          const angles = time ? getClockHandAngles(time.hours, time.minutes, time.seconds) : { hourAngle: 0, minuteAngle: 0, secondAngle: 0 }
          
          return (
            <Card key={zone.id} className="flex-1 min-w-[200px] max-w-[300px] bg-card/50 backdrop-blur-sm border-muted hover:shadow-md transition-shadow duration-200">
              <CardContent className="p-4">
                <div className="flex justify-between items-start">
                  <div className="flex flex-col">
                    <div className="flex items-center gap-1.5">
                      <Clock className="h-4 w-4 text-muted-foreground" />
                      <span className="font-medium">{zone.name}</span>
                    </div>
                    <span className="text-xs text-muted-foreground">{getUtcOffsetString(zone.offset)}</span>
                  </div>
                  <div className="flex items-center">
                    <TooltipProvider>
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <Button 
                            variant="ghost" 
                            size="icon" 
                            className="h-6 w-6" 
                            onClick={() => handleRemoveTimeZone(zone.id)}
                            disabled={selectedTimeZones.length <= 1}
                          >
                            <X className="h-3.5 w-3.5" />
                          </Button>
                        </TooltipTrigger>
                        <TooltipContent>
                          <p>Remove time zone</p>
                        </TooltipContent>
                      </Tooltip>
                    </TooltipProvider>
                  </div>
                </div>
                
                <div className="mt-3 flex items-center gap-4">
                  {/* Analog Clock */}
                  <div className="relative w-[80px] h-[80px] rounded-full border border-border bg-background flex items-center justify-center overflow-hidden">
                    {/* Hour hand */}
                    <div 
                      className="absolute w-1 h-[25px] bg-foreground rounded-full origin-bottom"
                      style={{ transform: `translateY(-12.5px) rotate(${angles.hourAngle}deg)` }}
                    />
                    
                    {/* Minute hand */}
                    <div 
                      className="absolute w-0.5 h-[32px] bg-foreground rounded-full origin-bottom"
                      style={{ transform: `translateY(-16px) rotate(${angles.minuteAngle}deg)` }}
                    />
                    
                    {/* Second hand */}
                    <div 
                      className="absolute w-0.5 h-[36px] bg-red-500 rounded-full origin-bottom"
                      style={{ transform: `translateY(-18px) rotate(${angles.secondAngle}deg)` }}
                    />
                    
                    {/* Center dot */}
                    <div className="absolute w-2 h-2 bg-foreground rounded-full" />
                  </div>
                  
                  {/* Digital Time */}
                  <div className="flex flex-col">
                    <div className="text-xl font-mono font-bold tracking-wider">
                      {time ? time.formattedTime : '--:--:--'}
                    </div>
                    <div className="text-xs text-muted-foreground">{date || '--'}</div>
                  </div>
                </div>
              </CardContent>
            </Card>
          )
        })}
        
        {selectedTimeZones.length < 5 && (
          <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
            <DialogTrigger asChild>
              <Button 
                variant="outline" 
                className="flex-1 min-w-[200px] max-w-[300px] h-[132px] border-dashed"
              >
                <Plus className="mr-2 h-4 w-4" />
                Add Time Zone
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-md">
              <DialogHeader>
                <DialogTitle>Add Time Zone</DialogTitle>
              </DialogHeader>
              <div className="py-2">
                <Select onValueChange={handleAddTimeZone}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select a time zone" />
                  </SelectTrigger>
                  <SelectContent className="max-h-[200px] overflow-y-auto">
                    {availableTimeZones.map(zone => (
                      <SelectItem key={zone.id} value={zone.id} className="py-1">
                        <div className="flex items-center justify-between w-full">
                          <span>{zone.name}</span>
                          <Badge variant="outline" className="ml-2">
                            {getUtcOffsetString(zone.offset)}
                          </Badge>
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <DialogFooter className="mt-2">
                <DialogClose asChild>
                  <Button variant="outline">Cancel</Button>
                </DialogClose>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        )}
      </div>
    </div>
  )
}
