'use client';

import React, { createContext, useContext, useEffect, useState } from "react";
import { LDClient, LDFlagSet, initialize } from "launchdarkly-js-client-sdk";

// Feature flag defaults when LaunchDarkly is not available
const DEFAULT_FLAGS = {
  // Core features
  ENABLE_NEW_DASHBOARD: false,
  ENABLE_BETA_FEATURES: false,
  ENABLE_AI_SUGGESTIONS: false,
  
  // UI modules
  ENABLE_CONTENT_CALENDAR: true, 
  ENABLE_ANALYTICS_DASHBOARD: true,
  ENABLE_ADVANCED_TARGETING: false,
  ENABLE_BULK_MESSAGING: false,
  
  // Platform integrations
  ENABLE_INSTAGRAM_INTEGRATION: true,
  ENABLE_TWITTER_INTEGRATION: true,
  ENABLE_TIKTOK_INTEGRATION: false,
  
  // Performance features
  ENABLE_PERFORMANCE_METRICS: false,
  ENABLE_REALTIME_NOTIFICATIONS: false,
};

type FeatureFlagContextType = {
  flags: LDFlagSet;
  client: LDClient | null;
  isInitialized: boolean;
  isEnabled: (flagKey: string) => boolean;
};

// Create context with default values
const FeatureFlagContext = createContext<FeatureFlagContextType>({
  flags: DEFAULT_FLAGS,
  client: null,
  isInitialized: false,
  isEnabled: () => false,
});

/**
 * Custom hook for using feature flags
 * @returns Feature flag context with flag values and utility functions
 */
export const useFeatureFlags = () => useContext(FeatureFlagContext);

interface FeatureFlagProviderProps {
  clientSideID: string;
  user: {
    key: string;
    email?: string;
    name?: string;
    role?: string;
    groups?: string[];
  };
  children: React.ReactNode;
}

/**
 * Provider component for LaunchDarkly feature flags
 * Initializes the LaunchDarkly client and provides flag values to all child components
 */
export const FeatureFlagProvider: React.FC<FeatureFlagProviderProps> = ({
  clientSideID,
  user,
  children,
}) => {
  const [client, setClient] = useState<LDClient | null>(null);
  const [isInitialized, setIsInitialized] = useState(false);
  const [flags, setFlags] = useState<LDFlagSet>(DEFAULT_FLAGS);

  useEffect(() => {
    // Only initialize if we have both client ID and user key
    if (!clientSideID || !user.key) {
      console.warn("LaunchDarkly client ID or user key is missing");
      return;
    }

    // Initialize LaunchDarkly client
    const ldClient = initialize(clientSideID, {
      key: user.key,
      email: user.email,
      name: user.name,
      custom: {
        role: user.role || "user",
        groups: user.groups || [],
      },
    });

    // Set up event listeners
    ldClient.on("ready", () => {
      console.log("LaunchDarkly client initialized");
      setIsInitialized(true);
      setFlags(ldClient.allFlags());
    });

    ldClient.on("change", (changes) => {
      console.log("Feature flag changes detected", changes);
      setFlags(ldClient.allFlags());
    });

    ldClient.on("error", (error) => {
      console.error("LaunchDarkly error:", error);
    });

    // Save client to state
    setClient(ldClient);

    // Cleanup function
    return () => {
      ldClient.close();
    };
  }, [clientSideID, user]);

  // Helper function to check if a flag is enabled
  const isEnabled = (flagKey: string): boolean => {
    return !!flags[flagKey];
  };

  return (
    <FeatureFlagContext.Provider value={{ flags, client, isInitialized, isEnabled }}>
      {children}
    </FeatureFlagContext.Provider>
  );
};

/**
 * Feature-flagged component wrapper
 * Only renders its children if the specified feature flag is enabled
 */
export const FeatureFlag: React.FC<{
  flag: string;
  fallback?: React.ReactNode;
  children: React.ReactNode;
}> = ({ flag, fallback = null, children }) => {
  const { isEnabled } = useFeatureFlags();
  return isEnabled(flag) ? <>{children}</> : <>{fallback}</>;
}; 