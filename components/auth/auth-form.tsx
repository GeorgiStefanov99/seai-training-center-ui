"use client"

import { useState, useEffect } from "react"
import { useAuth } from "@/hooks/useAuth"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { toast } from "sonner"

export function AuthForm() {
  const { login } = useAuth()
  const [isLoading, setIsLoading] = useState(false)

  // Check if user is already authenticated and redirect if needed
  useEffect(() => {
    // Get auth state from localStorage
    const authState = localStorage.getItem('seai_auth_state');
    if (authState) {
      try {
        const parsedState = JSON.parse(authState);
        if (parsedState.isAuthenticated) {
          // User is already authenticated, redirect to dashboard
          window.location.href = '/dashboard/';
        }
      } catch (e) {
        // Invalid auth state, ignore
        console.error("Error parsing auth state:", e);
      }
    }
  }, []);

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    setIsLoading(true)

    const formData = new FormData(e.currentTarget)
    const email = formData.get("email") as string
    const password = formData.get("password") as string

    try {
      const response = await fetch("https://api.seai.co/api/v1/training-centers/authentication", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ email, password }),
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.message || "Authentication failed")
      }

      // Use login function to set cookies and localStorage
      await login(data.manningAgentId, data.accessToken, email)
      toast.success("Login successful")
      
      // Use direct navigation instead of router for better static export compatibility
      window.location.href = '/dashboard/';
    } catch (error) {
      console.error("Login error:", error)
      toast.error("Failed to login. Please check your credentials.")
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="mx-auto flex w-full flex-col justify-center space-y-6 sm:w-[350px]">
      <div className="flex flex-col space-y-2 text-center">
        <h1 className="text-2xl font-semibold tracking-tight">Manning Agent Login</h1>
        <p className="text-sm text-muted-foreground">Enter your credentials to continue</p>
      </div>
      <form onSubmit={handleSubmit}>
        <div className="grid gap-4">
          <div className="grid gap-2">
            <Label htmlFor="email">Email</Label>
            <Input
              id="email"
              name="email"
              placeholder="name@example.com"
              type="email"
              autoCapitalize="none"
              autoComplete="email"
              autoCorrect="off"
              disabled={isLoading}
              required
            />
          </div>
          <div className="grid gap-2">
            <Label htmlFor="password">Password</Label>
            <Input
              id="password"
              name="password"
              type="password"
              autoCapitalize="none"
              autoComplete="current-password"
              autoCorrect="off"
              disabled={isLoading}
              required
            />
          </div>
          <Button type="submit" disabled={isLoading}>
            {isLoading && (
              <span className="mr-2 h-4 w-4 animate-spin">⌛</span>
            )}
            Sign In
          </Button>
        </div>
      </form>
    </div>
  )
}
