"use client"

import { useState } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { useAuth } from "@/hooks/useAuth"
import { LogoutConfirmationDialog } from "@/components/ui/logout-confirmation-dialog"
import { Menu } from "lucide-react"

interface TopNavProps {
  onMobileMenuToggle?: () => void
}

export function TopNav({ onMobileMenuToggle }: TopNavProps) {
  const { user, logout } = useAuth()
  const router = useRouter()
  const [showLogoutConfirmation, setShowLogoutConfirmation] = useState(false)

  const handleLoginClick = () => {
    router.push("/login")
  }

  const handleLogoutClick = () => {
    setShowLogoutConfirmation(true)
  }

  const handleConfirmLogout = () => {
    logout()
  }

  return (
    <nav className="fixed top-0 left-0 right-0 z-50 flex h-12 items-center justify-between bg-primary px-4 shadow-md text-sm">
      <div className="flex items-center gap-3">
        {/* Mobile Menu Button */}
        {user && onMobileMenuToggle && (
          <Button
            variant="ghost"
            size="icon"
            onClick={onMobileMenuToggle}
            className="md:hidden text-primary-foreground hover:bg-primary-foreground/10 h-8 w-8"
          >
            <Menu className="h-5 w-5" />
          </Button>
        )}
        <Link href="/" className="flex items-center gap-2 font-semibold text-primary-foreground">
          <span className="text-lg">SeAI</span>
        </Link>
      </div>
      {user ? (
        <div className="flex items-center gap-4">
          <span className="text-sm font-medium text-primary-foreground">{user.email}</span>
          <Button variant="secondary" size="sm" className="rounded-full" onClick={handleLogoutClick}>
            Logout
          </Button>
          
          <LogoutConfirmationDialog 
            isOpen={showLogoutConfirmation}
            onClose={() => setShowLogoutConfirmation(false)}
            onConfirm={handleConfirmLogout}
          />
        </div>
      ) : (
        <Button variant="secondary" size="sm" onClick={handleLoginClick} className="rounded-full">
          Login
        </Button>
      )}
    </nav>
  )
}
