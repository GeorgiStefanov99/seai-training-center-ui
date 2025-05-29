"use client"

import type React from "react"

import { useState } from "react"
import Link from "next/link"
import { Linkedin } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog"

export default function Footer() {
  const [showCareersDialog, setShowCareersDialog] = useState(false)

  const handleSubmit = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    const formData = new FormData(event.currentTarget)
    const data = {
      name: formData.get("name"),
      email: formData.get("email"),
      linkedin: formData.get("linkedin"),
      message: formData.get("message"),
      to: "contacts@seai.co", // Hardcoded recipient email
    }

    // Here you would typically send this data to your server
    console.log("Sending form data:", data)

    // For demonstration purposes, we're just logging the data
    // In a real application, you'd make an API call here

    setShowCareersDialog(false)
  }

  return (
    <footer className="border-t">
      <div className="container max-w-screen-xl mx-auto flex flex-col gap-8 py-8 md:flex-row md:py-12 px-4 md:px-6">
        <div className="flex-1 space-y-4">
          <h2 className="font-bold">SeAI</h2>
          <p className="text-sm text-muted-foreground">Pioneering AI solutions for the digital age.</p>
        </div>
        <div className="grid flex-1 grid-cols-2 gap-12 sm:grid-cols-3">
          <div className="space-y-4">
            <h3 className="text-sm font-medium">Solutions</h3>
            <ul className="space-y-3 text-sm">
              <li>
                <Link href="/dashboard" className="text-muted-foreground transition-colors hover:text-primary">
                  AI Analytics
                </Link>
              </li>
              <li>
                <Link href="/dashboard" className="text-muted-foreground transition-colors hover:text-primary">
                  Machine Learning
                </Link>
              </li>
            </ul>
          </div>
          <div className="space-y-4">
            <h3 className="text-sm font-medium">Company</h3>
            <ul className="space-y-3 text-sm">
              <li>
                <Link href="#top" className="text-muted-foreground transition-colors hover:text-primary">
                  Privacy Notice
                </Link>
              </li>
              <li>
                <button
                  onClick={() => setShowCareersDialog(true)}
                  className="text-muted-foreground transition-colors hover:text-primary"
                >
                  Careers
                </button>
              </li>
            </ul>
          </div>
          <div className="space-y-4">
            <h3 className="text-sm font-medium">Connect</h3>
            <div className="flex space-x-4">
              <Link
                href="https://www.linkedin.com/company/seaitechnology/?viewAsMember=true"
                className="text-muted-foreground transition-colors hover:text-primary"
                target="_blank"
                rel="noopener noreferrer"
              >
                <Linkedin className="h-5 w-5" />
                <span className="sr-only">LinkedIn</span>
              </Link>
            </div>
          </div>
        </div>
      </div>
      <div className="container max-w-screen-xl mx-auto border-t py-6 px-4 md:px-6">
        <p className="text-center text-sm text-muted-foreground">
          {new Date().getFullYear()} SeAI, Inc. All rights reserved.
        </p>
      </div>

      <Dialog open={showCareersDialog} onOpenChange={setShowCareersDialog}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>Join Our Team</DialogTitle>
            <DialogDescription>
              We're always looking for talented individuals to join our team. Fill out the form below to get in touch.
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleSubmit} className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label htmlFor="name">Name</Label>
              <Input id="name" name="name" placeholder="Enter your full name" required />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="email">Email</Label>
              <Input id="email" name="email" type="email" placeholder="Enter your email" required />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="linkedin">LinkedIn Profile URL</Label>
              <Input
                id="linkedin"
                name="linkedin"
                type="url"
                placeholder="https://linkedin.com/in/your-profile"
                required
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="message">Message</Label>
              <Textarea
                id="message"
                name="message"
                placeholder="Tell us about your experience and what interests you about SeAI"
                className="min-h-[100px]"
                required
              />
            </div>
            <Button type="submit" className="w-full">
              Submit Application
            </Button>
          </form>
        </DialogContent>
      </Dialog>
    </footer>
  )
}
