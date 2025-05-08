'use client';

import React from "react";
import { ClerkProvider } from "@clerk/nextjs";
import { ThemeProvider } from "./ThemeProvider";
import { WebSocketProvider } from "./WebSocketProvider";
import { FeatureFlagProvider } from "./FeatureFlagProvider";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { ReactQueryDevtools } from "@tanstack/react-query-devtools";
import { Toaster } from "@/components/ui/toaster";

// Create a client
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 60 * 1000, // 1 minute
      retry: 1,
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
          <FeatureFlagProvider 
            clientSideID={process.env.NEXT_PUBLIC_LAUNCHDARKLY_CLIENT_ID || ""} 
            user={getUserForFlags()}
          >
            <WebSocketProvider>
              {children}
              <Toaster />
            </WebSocketProvider>
          </FeatureFlagProvider>
          {process.env.NODE_ENV !== "production" && (
            <ReactQueryDevtools initialIsOpen={false} />
          )}
        </ThemeProvider>
      </QueryClientProvider>
    </ClerkProvider>
  );
} 