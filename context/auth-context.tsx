"use client"

import { createContext, useContext, useState, ReactNode } from "react"
import type { AuthContextType, AuthState } from "@/types/auth"

const initialState: AuthState = {
  userId: null,
  accessToken: null,
  isAuthenticated: false,
}

export const AuthContext = createContext<AuthContextType>({
  ...initialState,
  login: () => {},
  logout: () => {},
})

export function AuthProvider({ children }: { children: ReactNode }) {
  const [authState, setAuthState] = useState<AuthState>(initialState)

  const login = (token: string, userId: string) => {
    setAuthState({
      userId,
      accessToken: token,
      isAuthenticated: true,
    })
  }

  const logout = () => {
    setAuthState(initialState)
  }

  return (
    <AuthContext.Provider
      value={{
        ...authState,
        login,
        logout,
      }}
    >
      {children}
    </AuthContext.Provider>
  )
}

export const useAuth = () => useContext(AuthContext)
