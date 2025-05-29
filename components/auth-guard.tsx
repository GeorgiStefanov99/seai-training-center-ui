"use client"

import { useEffect } from "react"
import { useAuth } from "@/hooks/useAuth"
import { useRouter, usePathname } from "next/navigation"

interface AuthGuardProps {
  children: React.ReactNode
}

// List of public routes that don't require authentication
const PUBLIC_ROUTES = ['/login', '/register', '/forgot-password', '/reset-password', '/']

export function AuthGuard({ children }: AuthGuardProps) {
  // For static exports, we'll disable all client-side redirects in the AuthGuard
  // Authentication checks will be handled directly in each page component
  // This prevents infinite refresh loops and ensures compatibility with static exports
  
  // Don't block rendering - always render children
  return <>{children}</>;
}
