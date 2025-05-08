import { UserRole } from '@prisma/client';

// Define the feature flags interface
interface FeatureFlags {
  // Model-only features
  MODEL_GOOGLE_DRIVE: UserRole[];
  MODEL_CALENDAR_UPLOAD: UserRole[];
  MODEL_CHATBOT_PERSONA: UserRole[];
  
  // Manager-only features
  MANAGER_ANALYTICS: UserRole[];
  MANAGER_METRICS: UserRole[];

  // Both roles
  UNIFIED_MESSAGING: UserRole[];
  VOICE_API: UserRole[];
}

// Define which roles can access which features
const FEATURE_CONFIG: FeatureFlags = {
  // Model-only features
  MODEL_GOOGLE_DRIVE: ['MODEL', 'ADMIN'],
  MODEL_CALENDAR_UPLOAD: ['MODEL', 'MANAGER', 'ADMIN'],
  MODEL_CHATBOT_PERSONA: ['MODEL', 'ADMIN'],
  
  // Manager-only features
  MANAGER_ANALYTICS: ['MANAGER', 'ADMIN'],
  MANAGER_METRICS: ['MANAGER', 'ADMIN'],
  
  // Both roles
  UNIFIED_MESSAGING: ['MODEL', 'MANAGER', 'ADMIN'],
  VOICE_API: ['MODEL', 'MANAGER', 'ADMIN'],
};

/**
 * Hook to check if a feature is enabled for a specific role
 * @param role The user's role
 * @param feature The feature to check
 * @returns Boolean indicating if the feature is available for the role
 */
export function useFeatureFlag(
  role: UserRole | undefined, 
  feature: keyof FeatureFlags
): boolean {
  // If no role provided, feature is disabled
  if (!role) return false;
  
  // Get allowed roles for the feature
  const allowedRoles = FEATURE_CONFIG[feature];
  
  // Check if user's role is in the allowed roles
  return allowedRoles.includes(role as any);
}

/**
 * Hook to get all available features for a specific role
 * @param role The user's role
 * @returns Array of feature names available for the role
 */
export function useAvailableFeatures(
  role: UserRole | undefined
): Array<keyof FeatureFlags> {
  // If no role provided, no features available
  if (!role) return [];
  
  // Filter features based on role
  return Object.entries(FEATURE_CONFIG)
    .filter(([_, roles]) => roles.includes(role as any))
    .map(([feature]) => feature as keyof FeatureFlags);
}

export type { FeatureFlags }; 