"use client"

import { useState, useEffect, Suspense } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { toast } from "sonner"
import { PasswordService } from "@/services/passwordService"
import { ForgotPasswordRequest } from "@/types/auth"
import { Eye, EyeOff, AlertCircle, CheckCircle } from "lucide-react"

function ResetPasswordContent() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const [isLoading, setIsLoading] = useState(false)
  const [isSuccess, setIsSuccess] = useState(false)
  const [token, setToken] = useState<string | null>(null)
  const [showPasswords, setShowPasswords] = useState({
    new: false,
    confirm: false
  })
  const [formData, setFormData] = useState<ForgotPasswordRequest>({
    newPassword: "",
    confirmPassword: ""
  })

  useEffect(() => {
    const tokenParam = searchParams.get('token')
    if (!tokenParam) {
      toast.error("Invalid reset link. Please request a new password reset.")
      router.push("/login")
      return
    }
    setToken(tokenParam)
  }, [searchParams, router])

  const handleInputChange = (field: keyof ForgotPasswordRequest, value: string) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }))
  }

  const togglePasswordVisibility = (field: 'new' | 'confirm') => {
    setShowPasswords(prev => ({
      ...prev,
      [field]: !prev[field]
    }))
  }

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    
    if (!token) {
      toast.error("Invalid reset token")
      return
    }

    // Client-side validation
    const validationError = PasswordService.validateResetPasswordRequest(formData)
    if (validationError) {
      toast.error(validationError)
      return
    }

    setIsLoading(true)

    try {
      const response = await PasswordService.resetPassword(token, formData)
      
      toast.success(response.message || "Password reset successfully")
      setIsSuccess(true)
      
      // Redirect to login after a delay
      setTimeout(() => {
        router.push("/login")
      }, 3000)
      
    } catch (error) {
      console.error("Reset password error:", error)
      
      if (error instanceof Error) {
        // Handle specific backend validation errors
        if (error.message.includes("expired") || error.message.includes("invalid")) {
          toast.error("Reset link has expired or is invalid. Please request a new password reset.")
        } else if (error.message.includes("Passwords do not match")) {
          toast.error("Passwords do not match. Please check and try again.")
        } else {
          toast.error(error.message)
        }
      } else {
        toast.error("Failed to reset password. Please try again.")
      }
    } finally {
      setIsLoading(false)
    }
  }

  if (isSuccess) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
        <div className="max-w-md w-full space-y-8">
          <Card>
            <CardHeader className="text-center">
              <div className="mx-auto flex items-center justify-center h-12 w-12 rounded-full bg-green-100">
                <CheckCircle className="h-6 w-6 text-green-600" />
              </div>
              <CardTitle className="text-2xl font-bold text-green-600">Password Reset Successful</CardTitle>
              <CardDescription>
                Your password has been successfully reset. You will be redirected to the login page shortly.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Button
                onClick={() => router.push("/login")}
                className="w-full"
              >
                Go to Login
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8">
        <div className="text-center">
          <h1 className="text-3xl font-bold">Reset Your Password</h1>
          <p className="text-muted-foreground mt-2">
            Enter your new password below
          </p>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Create New Password</CardTitle>
            <CardDescription>
              Your new password must be at least 6 characters long.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
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
                  disabled={isLoading || !token}
                  className="w-full"
                >
                  {isLoading && (
                    <span className="mr-2 h-4 w-4 animate-spin">⌛</span>
                  )}
                  Reset Password
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>

        <div className="mt-6 p-4 bg-blue-50 rounded-lg">
          <div className="flex">
            <AlertCircle className="h-5 w-5 text-blue-600 mr-2 flex-shrink-0 mt-0.5" />
            <div>
              <h3 className="font-medium text-blue-800">Password Requirements:</h3>
              <ul className="text-sm text-blue-700 mt-1 space-y-1">
                <li>• Must be at least 6 characters long</li>
                <li>• New password and confirm password must match</li>
                <li>• Use a strong password for better security</li>
              </ul>
            </div>
          </div>
        </div>

        <div className="text-center">
          <Button
            variant="link"
            onClick={() => router.push("/login")}
            className="text-sm"
          >
            Back to Login
          </Button>
        </div>
      </div>
    </div>
  )
}

export default function ResetPasswordPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading...</p>
        </div>
      </div>
    }>
      <ResetPasswordContent />
    </Suspense>
  )
} 