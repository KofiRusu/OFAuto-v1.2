'use client';

import React, { useState } from "react";
import { ClerkProvider } from "@clerk/nextjs";
import { ThemeProvider } from "./ThemeProvider";
import { WebSocketProvider } from "./WebSocketProvider";
import { FeatureFlagProvider } from "./FeatureFlagProvider";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { ReactQueryDevtools } from "@tanstack/react-query-devtools";
import { Toaster } from "@/components/ui/toaster";
import { AuthProvider } from '@/components/providers/auth-provider'
import { ToastProvider } from '@/components/providers/toast-provider'

// Create a client
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 60 * 1000, // 1 minute
      gcTime: 10 * 60 * 1000, // 10 minutes
      retry: 1,
      refetchOnWindowFocus: false,
    },
  },
});

interface RootProviderProps {
  children: React.ReactNode;
}

export function RootProvider({ children }: RootProviderProps) {
  // Get feature flag user data from Clerk
  const getUserForFlags = () => {
    // In a real app, we would get this data from Clerk's session
    // For now, use a placeholder
    return {
      key: process.env.NEXT_PUBLIC_LAUNCHDARKLY_USER_KEY || "anonymous",
      role: "user",
    };
  };

  return (
    <ClerkProvider>
      <QueryClientProvider client={queryClient}>
        <ThemeProvider
          attribute="class"
          defaultTheme="system"
          enableSystem
          disableTransitionOnChange
        >
          <AuthProvider>
            <ToastProvider>
              <FeatureFlagProvider 
                clientSideID={process.env.NEXT_PUBLIC_LAUNCHDARKLY_CLIENT_ID || ""} 
                user={getUserForFlags()}
              >
                <WebSocketProvider>
                  {children}
                  <Toaster />
                </WebSocketProvider>
              </FeatureFlagProvider>
            </ToastProvider>
          </AuthProvider>
          {process.env.NODE_ENV === 'development' && <ReactQueryDevtools />}
        </ThemeProvider>
      </QueryClientProvider>
    </ClerkProvider>
  );
} 