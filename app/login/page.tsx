"use client"

import { Anchor, ArrowLeft } from "lucide-react"
import { AuthForm } from "@/components/auth/auth-form"
import { Button } from "@/components/ui/button"

export default function LoginPage() {
  return (
    <div className="min-h-screen w-full bg-gradient-to-br from-primary to-secondary flex flex-col items-center justify-center p-4 relative">
      <a href="/" className="absolute top-6 right-6">
        <Button variant="secondary" className="flex items-center gap-2 bg-white/20 text-white hover:bg-white/30 border-0">
          <ArrowLeft className="h-4 w-4" />
          Back to Home
        </Button>
      </a>
      
      <div className="w-full max-w-md space-y-8">
        <div className="flex flex-col items-center text-center">
          <div className="flex items-center gap-2 text-3xl font-bold text-primary-foreground">
            <Anchor className="h-10 w-10" />
            <span>SeAI</span>
          </div>
          <h1 className="mt-6 text-3xl font-bold tracking-tight text-primary-foreground">Welcome aboard</h1>
          <p className="mt-2 text-sm text-primary-foreground/80">Sign in to your account to continue</p>
        </div>

        <AuthForm />
      </div>
    </div>
  )
}
