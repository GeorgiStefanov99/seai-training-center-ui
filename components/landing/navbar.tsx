"use client"

import type React from "react"
import { useState } from "react"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Calendar } from "@/components/ui/calendar"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { CalendarIcon, Users, GraduationCap, Anchor, Compass, Bot, BarChart } from "lucide-react"
import { format } from "date-fns"
import { useAuth } from "@/hooks/useAuth"

const serviceItems = [
  {
    title: "Manning",
    description: "AI driven crew management",
    href: "/dashboard",
    icon: Users,
  },
  {
    title: "Training",
    description: "Comprehensive maritime education and certification programs",
    href: "/training",
    icon: GraduationCap,
  },
  {
    title: "Shipowners",
    description: "Complete vessel management and operational solutions",
    href: "/vessels",
    icon: Anchor,
  },
  {
    title: "Seafarers",
    description: "Career development and support services for maritime professionals",
    href: "/seafarers",
    icon: Compass,
  },
  {
    title: "AI Assistant",
    description: "Most powerful maritime AI expert",
    href: "/ai-assistant",
    icon: Bot,
  },
  {
    title: "Data Insights",
    description: "Your data upside down for best insights and decisions",
    href: "/dashboard",
    icon: BarChart,
  },
]

export default function Navbar() {
  const [isDemoFormOpen, setIsDemoFormOpen] = useState(false)
  const [isContactFormOpen, setIsContactFormOpen] = useState(false)
  const [date, setDate] = useState<Date | undefined>(undefined)
  const { user } = useAuth()
  const isAuthenticated = user?.isAuthenticated

  const handleDemoSubmit = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    setIsDemoFormOpen(false)
  }

  const handleContactSubmit = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    setIsContactFormOpen(false)
  }

  return (
    <>
      <header className="sticky top-0 z-50 w-full border-b border-gray-100 bg-white">
        <div className="container flex h-16 max-w-screen-xl mx-auto items-center px-4 md:px-6">
          <Link
            href="/"
            className="mr-6 flex items-center space-x-2"
            onClick={() => {
              window.scrollTo({ top: 0, behavior: "smooth" })
            }}
          >
            <span className="text-xl font-bold text-navy">SeAI</span>
          </Link>
          <nav className="flex flex-1 items-center space-x-6 text-sm font-medium">
            <Popover>
              <PopoverTrigger asChild>
                <button className="text-navy hover:text-navy/80">Products</button>
              </PopoverTrigger>
              <PopoverContent className="w-[720px] p-6" align="start">
                <div className="grid grid-cols-3 gap-4">
                  {serviceItems.map((item) => {
                    const Icon = item.icon
                    return (
                      <Link
                        key={item.title}
                        href={item.href}
                        className="group flex items-start gap-4 rounded-lg p-3 transition-colors hover:bg-gray-50"
                      >
                        <div className="mt-1 bg-[#0066FF]/10 p-2 rounded-lg group-hover:bg-[#0066FF]/20">
                          <Icon className="h-5 w-5 text-[#0066FF]" />
                        </div>
                        <div>
                          <div className="font-semibold text-navy group-hover:text-[#0066FF]">{item.title}</div>
                          <div className="text-sm text-muted-foreground">{item.description}</div>
                        </div>
                      </Link>
                    )
                  })}
                </div>
              </PopoverContent>
            </Popover>
            <Link href="/about" className="text-navy hover:text-navy/80">
              About Us
            </Link>
          </nav>
          <div className="flex items-center space-x-4">
            <Dialog open={isContactFormOpen} onOpenChange={setIsContactFormOpen}>
              <DialogTrigger asChild>
                <Button variant="ghost" size="sm" className="text-navy">
                  Contact
                </Button>
              </DialogTrigger>
              <DialogContent className="sm:max-w-[425px]">
                <DialogHeader>
                  <DialogTitle className="text-navy">Contact Us</DialogTitle>
                  <DialogDescription className="text-navy/60">
                    Send us a message and we'll get back to you as soon as possible.
                  </DialogDescription>
                </DialogHeader>
                <form onSubmit={handleContactSubmit} className="grid gap-4 py-4">
                  <div className="grid gap-2">
                    <Label htmlFor="contact-name" className="text-navy">
                      Name
                    </Label>
                    <Input id="contact-name" placeholder="John Doe" required />
                  </div>
                  <div className="grid gap-2">
                    <Label htmlFor="contact-email" className="text-navy">
                      Email
                    </Label>
                    <Input id="contact-email" type="email" placeholder="john@example.com" required />
                  </div>
                  <div className="grid gap-2">
                    <Label htmlFor="contact-message" className="text-navy">
                      Message
                    </Label>
                    <Textarea id="contact-message" placeholder="Your message here..." required />
                  </div>
                  <Button type="submit" className="bg-[#0066FF] hover:bg-[#0066FF]/90 text-white">
                    Send Message
                  </Button>
                </form>
              </DialogContent>
            </Dialog>
            <Dialog open={isDemoFormOpen} onOpenChange={setIsDemoFormOpen}>
              <DialogTrigger asChild>
                <Button size="sm" className="bg-[#0066FF] text-white hover:bg-[#0066FF]/90">
                  Get a demo →
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
            {isAuthenticated ? (
              <Link href="/dashboard">
                <Button variant="outline" size="sm" className="text-navy ml-4">
                  Dashboard
                </Button>
              </Link>
            ) : (
              <Link href="/login">
                <Button variant="outline" size="sm" className="text-navy ml-4">
                  Login
                </Button>
              </Link>
            )}
          </div>
        </div>
      </header>
    </>
  )
}
