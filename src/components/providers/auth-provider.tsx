'use client'

import * as React from 'react'
import { useAuth } from '@clerk/nextjs'

interface AuthContextValue {
  isAuthenticated: boolean
  isLoading: boolean
  userId: string | null | undefined
  sessionId: string | null | undefined
  orgId: string | null | undefined
  orgRole: string | null | undefined
}

const AuthContext = React.createContext<AuthContextValue | undefined>(undefined)

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const { isLoaded, isSignedIn, userId, sessionId, orgId, orgRole } = useAuth()

  const value = React.useMemo(
    () => ({
      isAuthenticated: isSignedIn ?? false,
      isLoading: !isLoaded,
      userId,
      sessionId,
      orgId,
      orgRole,
    }),
    [isLoaded, isSignedIn, userId, sessionId, orgId, orgRole]
  )

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export function useAuthContext() {
  const context = React.useContext(AuthContext)
  if (context === undefined) {
    throw new Error('useAuthContext must be used within an AuthProvider')
  }
  return context
}