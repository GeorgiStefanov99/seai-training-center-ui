"use client"

import { useEffect } from 'react'
import { useAuth } from '@/hooks/useAuth'

/**
 * This component sets a custom header for server-side authentication checks
 * It helps the middleware detect authentication from localStorage
 * This solves the issue with page refreshes redirecting to dashboard
 */
export function AuthHeaderProvider() {
  const { user, isLoading } = useAuth()

  useEffect(() => {
    // Only run on client-side
    if (typeof window === 'undefined') return

    // Create a function to set the auth header
    const setAuthHeader = () => {
      // Check if user is authenticated via localStorage
      const userId = localStorage.getItem('seai_user_id')
      const accessToken = localStorage.getItem('seai_access_token')
      const isAuthenticated = userId && accessToken

      // Create a meta tag to communicate auth state to middleware
      let meta = document.querySelector('meta[name="x-auth-state"]')
      
      if (!meta) {
        meta = document.createElement('meta')
        meta.setAttribute('name', 'x-auth-state')
        document.head.appendChild(meta)
      }
      
      // Set the content attribute based on authentication state
      meta.setAttribute('content', isAuthenticated ? 'authenticated' : 'unauthenticated')
    }

    // Set the auth header initially
    if (!isLoading) {
      setAuthHeader()
    }

    // Set up a storage event listener to update the header when auth state changes
    const handleStorageChange = () => {
      setAuthHeader()
    }

    window.addEventListener('storage', handleStorageChange)
    
    return () => {
      window.removeEventListener('storage', handleStorageChange)
    }
  }, [user, isLoading])

  // This component doesn't render anything
  return null
}
