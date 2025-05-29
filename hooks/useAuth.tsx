"use client"

import type React from "react"
import { createContext, useContext, useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import Cookies from 'js-cookie'

interface User {
  userId: string | null
  accessToken: string | null
  email: string | null
  isAuthenticated: boolean
}

interface AuthContextType {
  user: User | null
  login: (newId: string, newAccessToken: string, newEmail: string) => void
  logout: () => void
  isLoading: boolean
}

// Set default context to avoid the "must be used within Provider" error
const defaultContext: AuthContextType = {
  user: null,
  login: () => {},
  logout: () => {},
  isLoading: true
}

const AuthContext = createContext<AuthContextType>(defaultContext)

// Cookie configuration
const COOKIE_CONFIG = {
  expires: 30, // 30 days
  path: '/',
  sameSite: 'lax' as const,
  secure: process.env.NODE_ENV === 'production'
}

// Storage keys
const STORAGE_KEYS = {
  USER_ID: 'seai_user_id',
  ACCESS_TOKEN: 'seai_access_token',
  EMAIL: 'seai_email',
  AUTH_STATE: 'seai_auth_state'
}

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const router = useRouter()
  const [user, setUser] = useState<User | null>(null)
  const [loading, setLoading] = useState(true)

  // Load user from storage on initial load
  useEffect(() => {
    const loadUserFromStorage = () => {
      try {
        // First try localStorage (more reliable for static exports)
        let userId = localStorage.getItem(STORAGE_KEYS.USER_ID)
        let accessToken = localStorage.getItem(STORAGE_KEYS.ACCESS_TOKEN)
        let email = localStorage.getItem(STORAGE_KEYS.EMAIL)
        
        // If not in localStorage, try cookies as fallback
        if (!userId || !accessToken || !email) {
          userId = Cookies.get('userId') ?? null
          accessToken = Cookies.get('accessToken') ?? null
          email = Cookies.get('email') ?? null
          
          // If found in cookies but not localStorage, sync to localStorage
          if (userId && accessToken && email) {
            localStorage.setItem(STORAGE_KEYS.USER_ID, userId)
            localStorage.setItem(STORAGE_KEYS.ACCESS_TOKEN, accessToken)
            localStorage.setItem(STORAGE_KEYS.EMAIL, email)
          }
        }
        
  

        if (userId && accessToken && email) {
          // Save complete auth state object in localStorage
          const authState = {
            userId,
            accessToken,
            email,
            isAuthenticated: true
          }
          
          localStorage.setItem(STORAGE_KEYS.AUTH_STATE, JSON.stringify(authState))
          
          setUser(authState)
        } else {
          // Make sure user is properly set to unauthenticated if no credentials found
          setUser({
            userId: null,
            accessToken: null,
            email: null,
            isAuthenticated: false
          })
        }
      } catch (error) {
        console.error('Error loading auth state:', error)
        setUser({
          userId: null,
          accessToken: null,
          email: null,
          isAuthenticated: false
        })
      } finally {
        setLoading(false)
      }
    }

    loadUserFromStorage()
    
    // Add event listener for storage changes (helps with multi-tab synchronization)
    const handleStorageChange = (e: StorageEvent) => {
      if (Object.values(STORAGE_KEYS).includes(e.key || '')) {
        loadUserFromStorage()
      }
    }
    
    window.addEventListener('storage', handleStorageChange)
    return () => window.removeEventListener('storage', handleStorageChange)
  }, [])

  const login = (newId: string, newAccessToken: string, newEmail: string) => {
    try {
      
      
      // Create auth state object
      const authState = {
        userId: newId,
        accessToken: newAccessToken,
        email: newEmail,
        isAuthenticated: true
      }
      
      // Store in localStorage (primary storage for static exports)
      localStorage.setItem(STORAGE_KEYS.USER_ID, newId)
      localStorage.setItem(STORAGE_KEYS.ACCESS_TOKEN, newAccessToken)
      localStorage.setItem(STORAGE_KEYS.EMAIL, newEmail)
      localStorage.setItem(STORAGE_KEYS.AUTH_STATE, JSON.stringify(authState))
      
      // Also set cookies as backup
      Cookies.set('userId', newId, COOKIE_CONFIG)
      Cookies.set('accessToken', newAccessToken, COOKIE_CONFIG)
      Cookies.set('email', newEmail, COOKIE_CONFIG)
      
      // Update state
      setUser(authState)

      // Verify storage was set correctly
      const storageCheck = {
        localStorage: {
          userId: localStorage.getItem(STORAGE_KEYS.USER_ID),
          accessToken: localStorage.getItem(STORAGE_KEYS.ACCESS_TOKEN),
          email: localStorage.getItem(STORAGE_KEYS.EMAIL),
          authState: localStorage.getItem(STORAGE_KEYS.AUTH_STATE)
        },
        cookies: {
          userId: Cookies.get('userId'),
          accessToken: Cookies.get('accessToken'),
          email: Cookies.get('email')
        }
      }

      // Don't use router.replace - let the calling code handle navigation
    } catch (error) {
      console.error('Error during login:', error)
    }
  }

  const logout = () => {
    try {
      // Clear localStorage
      localStorage.removeItem(STORAGE_KEYS.USER_ID)
      localStorage.removeItem(STORAGE_KEYS.ACCESS_TOKEN)
      localStorage.removeItem(STORAGE_KEYS.EMAIL)
      localStorage.removeItem(STORAGE_KEYS.AUTH_STATE)
      
      // Clear cookies
      Cookies.remove('userId', { path: '/' })
      Cookies.remove('accessToken', { path: '/' })
      Cookies.remove('email', { path: '/' })
      
      // Clear user state
      setUser({
        userId: null,
        accessToken: null,
        email: null,
        isAuthenticated: false
      })
      
      // Use direct navigation instead of router.replace
      window.location.href = '/login/';
    } catch (error) {
      console.error('Error during logout:', error)
    }
  }

  // Always render the provider with the current context
  return (
    <AuthContext.Provider value={{ user, login, logout, isLoading: loading }}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  return useContext(AuthContext)
}
