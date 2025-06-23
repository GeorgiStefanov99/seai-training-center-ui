"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { toast } from "sonner"
import { useAuth } from "@/hooks/useAuth"
import { PasswordService } from "@/services/passwordService"
import { ChangePasswordRequest } from "@/types/auth"
import { ArrowLeft, Eye, EyeOff } from "lucide-react"

export default function ChangePasswordPage() {
  const router = useRouter()
  const { user } = useAuth()
  const [isLoading, setIsLoading] = useState(false)
  const [showPasswords, setShowPasswords] = useState({
    old: false,
    new: false,
    confirm: false
  })
  const [formData, setFormData] = useState<ChangePasswordRequest>({
    oldPassword: "",
    newPassword: "",
    confirmPassword: ""
  })

  const handleInputChange = (field: keyof ChangePasswordRequest, value: string) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }))
  }

  const togglePasswordVisibility = (field: 'old' | 'new' | 'confirm') => {
    setShowPasswords(prev => ({
      ...prev,
      [field]: !prev[field]
    }))
  }

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    
    if (!user?.userId) {
      toast.error("You must be logged in to change your password")
      router.push("/login")
      return
    }

    console.log("Change password request:", {
      userId: user.userId,
      userEmail: user.email,
      isAuthenticated: user.isAuthenticated,
      hasAccessToken: !!user.accessToken
    });

    // Client-side validation
    const validationError = PasswordService.validateChangePasswordRequest(formData)
    if (validationError) {
      toast.error(validationError)
      return
    }

    setIsLoading(true)

    try {
      const response = await PasswordService.changePassword(
        user.userId,
        formData
      )
      
      toast.success(response.message || "Password changed successfully")
      
      // Clear form
      setFormData({
        oldPassword: "",
        newPassword: "",
        confirmPassword: ""
      })
      
      // Redirect to dashboard after success
      setTimeout(() => {
        router.push("/dashboard")
      }, 2000)
      
    } catch (error) {
      console.error("Change password error:", error)
      
      if (error instanceof Error) {
        // Handle specific backend validation errors
        if (error.message.includes("Old password is incorrect")) {
          toast.error("Your current password is incorrect. Please try again.")
        } else if (error.message.includes("Passwords do not match")) {
          toast.error("New passwords do not match. Please check and try again.")
        } else {
          toast.error(error.message)
        }
      } else {
        toast.error("Failed to change password. Please try again.")
      }
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="container mx-auto max-w-2xl py-8 px-4">
      <div className="mb-6">
        <Button
          variant="ghost"
          onClick={() => router.back()}
          className="mb-4"
        >
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back
        </Button>
        <h1 className="text-3xl font-bold">Change Password</h1>
        <p className="text-muted-foreground mt-2">
          Update your password to keep your account secure
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Change Your Password</CardTitle>
          <CardDescription>
            Enter your current password and choose a new one.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="oldPassword">Current Password</Label>
              <div className="relative">
                <Input
                  id="oldPassword"
                  type={showPasswords.old ? "text" : "password"}
                  value={formData.oldPassword}
                  onChange={(e) => handleInputChange("oldPassword", e.target.value)}
                  disabled={isLoading}
                  required
                  placeholder="Enter your current password"
                />
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
                  onClick={() => togglePasswordVisibility("old")}
                >
                  {showPasswords.old ? (
                    <EyeOff className="h-4 w-4" />
                  ) : (
                    <Eye className="h-4 w-4" />
                  )}
                </Button>
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="newPassword">New Password</Label>
              <div className="relative">
                <Input
                  id="newPassword"
                  type={showPasswords.new ? "text" : "password"}
                  value={formData.newPassword}
                  onChange={(e) => handleInputChange("newPassword", e.target.value)}
                  disabled={isLoading}
                  required
                  placeholder="Enter your new password"
                />
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
                  onClick={() => togglePasswordVisibility("new")}
                >
                  {showPasswords.new ? (
                    <EyeOff className="h-4 w-4" />
                  ) : (
                    <Eye className="h-4 w-4" />
                  )}
                </Button>
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="confirmPassword">Confirm New Password</Label>
              <div className="relative">
                <Input
                  id="confirmPassword"
                  type={showPasswords.confirm ? "text" : "password"}
                  value={formData.confirmPassword}
                  onChange={(e) => handleInputChange("confirmPassword", e.target.value)}
                  disabled={isLoading}
                  required
                  placeholder="Confirm your new password"
                />
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
                  onClick={() => togglePasswordVisibility("confirm")}
                >
                  {showPasswords.confirm ? (
                    <EyeOff className="h-4 w-4" />
                  ) : (
                    <Eye className="h-4 w-4" />
                  )}
                </Button>
              </div>
            </div>

            <div className="pt-4">
              <Button
                type="submit"
                disabled={isLoading}
                className="w-full"
              >
                {isLoading && (
                  <span className="mr-2 h-4 w-4 animate-spin">⌛</span>
                )}
                Change Password
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>

      <div className="mt-6 p-4 bg-muted rounded-lg">
        <h3 className="font-medium mb-2">Password Requirements:</h3>
        <ul className="text-sm text-muted-foreground space-y-1">
          <li>• Must be at least 6 characters long</li>
          <li>• New password must be different from your current password</li>
          <li>• New password and confirm password must match</li>
        </ul>
      </div>
    </div>
  )
} 