"use client"

import { DialogTrigger } from "@/components/ui/dialog"
import type React from "react"
import { Button } from "@/components/ui/button"
import { ArrowRight } from "lucide-react"
import TypewriterEffect from "./TypewriterEffect"
import { useState } from "react"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Label } from "@/components/ui/label"
import { Input } from "@/components/ui/input"
import { Calendar } from "@/components/ui/calendar"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { CalendarIcon } from "lucide-react"
import { format } from "date-fns"
import Link from "next/link"
import { useAuth } from "@/hooks/useAuth"

export default function Hero() {
  const [isDemoFormOpen, setIsDemoFormOpen] = useState(false)
  const [date, setDate] = useState<Date | undefined>(undefined)
  const { user } = useAuth()
  const isAuthenticated = user?.isAuthenticated

  const handleDemoSubmit = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    setIsDemoFormOpen(false)
  }

  return (
    <section className="container flex min-h-[calc(100vh-3.5rem)] max-w-screen-xl mx-auto flex-col items-center justify-center space-y-8 py-24 text-center md:py-32 px-4 md:px-6">
      <div className="space-y-4">
        <div className="h-8 mb-4">
          <TypewriterEffect text="Where the Sea meets the AI" delay={100} cycleDelay={60000} />
        </div>
        <h1 className="bg-gradient-to-br from-foreground from-30% via-foreground/90 to-foreground/70 bg-clip-text text-4xl font-bold tracking-tight text-transparent sm:text-5xl md:text-6xl lg:text-7xl">
          Innovate with
          <br />
          SeAI
        </h1>
        <p className="mx-auto max-w-[42rem] leading-normal text-muted-foreground sm:text-xl sm:leading-8">
          Empowering the maritime business with AI and data solutions
        </p>
      </div>
      <div className="flex gap-4">
        {isAuthenticated ? (
          <Link href="/dashboard">
            <Button
              size="lg"
              className="bg-[#0066FF] hover:bg-[#0066FF]/90 text-white"
            >
              Go to Dashboard
              <ArrowRight className="ml-2 h-4 w-4" />
            </Button>
          </Link>
        ) : (
          <Link href="/login">
            <Button
              size="lg"
              className="bg-[#0066FF] hover:bg-[#0066FF]/90 text-white"
            >
              Explore Solutions
              <ArrowRight className="ml-2 h-4 w-4" />
            </Button>
          </Link>
        )}
        <Dialog open={isDemoFormOpen} onOpenChange={setIsDemoFormOpen}>
          <DialogTrigger asChild>
            <Button variant="outline" size="lg">
              Schedule a Demo
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-[425px]">
            <DialogHeader>
              <DialogTitle className="text-navy">Request a Demo</DialogTitle>
              <DialogDescription className="text-navy/60">
                Fill out this form and we'll get back to you shortly.
              </DialogDescription>
            </DialogHeader>
            <form onSubmit={handleDemoSubmit} className="grid gap-4 py-4">
              <div className="grid gap-2">
                <Label htmlFor="demo-name" className="text-navy">
                  Name
                </Label>
                <Input id="demo-name" placeholder="John Doe" required />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="demo-email" className="text-navy">
                  Email
                </Label>
                <Input id="demo-email" type="email" placeholder="john@example.com" required />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="demo-company" className="text-navy">
                  Company
                </Label>
                <Input id="demo-company" placeholder="Acme Inc." required />
              </div>
              <div className="grid gap-2">
                <Label className="text-navy">Preferred Demo Date</Label>
                <Popover>
                  <PopoverTrigger asChild>
                    <Button variant="outline" className="w-full justify-start text-left font-normal">
                      <CalendarIcon className="mr-2 h-4 w-4" />
                      {date ? format(date, "PPP") : "Pick a date"}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0" align="start">
                    <Calendar mode="single" selected={date} onSelect={setDate} initialFocus />
                  </PopoverContent>
                </Popover>
              </div>
              <Button type="submit" className="bg-[#0066FF] hover:bg-[#0066FF]/90 text-white">
                Submit Request
              </Button>
            </form>
          </DialogContent>
        </Dialog>
      </div>
    </section>
  )
}
