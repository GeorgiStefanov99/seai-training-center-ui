"use client"

import type React from "react"
import { usePathname, useRouter } from "next/navigation"
import { SidebarProvider } from "@/components/ui/sidebar"
import { Sidebar } from "@/components/sidebar"
import { TopNav } from "@/components/top-nav"
import { AuthGuard } from "@/components/auth-guard"
import { useAuth } from "@/hooks/useAuth"
import { useEffect } from "react"

// List of public routes that don't require navigation
const PUBLIC_ROUTES = ['/login', '/register', '/forgot-password', '/reset-password']

export function RootLayoutContent({ children }: { children: React.ReactNode }) {
  const pathname = usePathname()
  const router = useRouter()
  const { user } = useAuth()
  const isPublicRoute = PUBLIC_ROUTES.some(route => pathname === route || pathname?.startsWith(route))
  const isRootRoute = pathname === '/'
  
  // Show navigation when authenticated, even on the root route
  const showNavigation = user?.isAuthenticated && (!isPublicRoute || isRootRoute)

  useEffect(() => {
    // Handle client-side routing for static export
    if (user?.isAuthenticated && !isPublicRoute) {
      const currentPath = window.location.pathname
      if (currentPath !== pathname) {
        router.push(currentPath)
      }
    }
  }, [user?.isAuthenticated, isPublicRoute, pathname, router])

  return (
    <AuthGuard>
      <SidebarProvider defaultOpen={false}>
        <div className={`flex justify-center items-center min-h-screen w-full bg-background ${!isRootRoute ? 'wave-pattern' : ''}`}>
          {showNavigation ? (
            <>
              <Sidebar />
              <div className="flex flex-col flex-1 overflow-hidden">
                <TopNav />
                <main className="flex-1 overflow-y-auto p-4 md:p-6 pt-16">{children}</main>
              </div>
            </>
          ) : (
            <main className="flex-1">{children}</main>
          )}
        </div>
      </SidebarProvider>
    </AuthGuard>
  )
}
