import axios, { AxiosInstance } from 'axios';
import { proxyService } from '@/lib/proxy/proxy-service';
import { logger } from '@/lib/logger';

// Fansly API base URL
export const FANSLY_API_BASE_URL = 'https://apiv3.fansly.com';

// Default headers for Fansly API requests
export const DEFAULT_HEADERS = {
  'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/94.0.4606.81 Safari/537.36',
  'Accept': 'application/json',
  'Content-Type': 'application/json',
  'Origin': 'https://fansly.com',
  'Referer': 'https://fansly.com/',
};

// Create Axios instance with proxy support and retry logic
export const createFanslyApiClient = (sessionToken?: string): AxiosInstance => {
  const baseConfig = {
    baseURL: FANSLY_API_BASE_URL,
    timeout: 30000,
    headers: {
      ...DEFAULT_HEADERS,
      ...(sessionToken ? { 'Authorization': `Bearer ${sessionToken}` } : {})
    }
  };
  
  return proxyService.createProxiedAxios(baseConfig);
};

/**
 * Format date object for Fansly API
 */
export const formatDateForFansly = (date: Date): string => {
  return date.toISOString();
};

/**
 * Parse account stats from Fansly API response
 */
export const parseAccountStats = (data: any) => {
  try {
    // This is a placeholder for the actual parsing logic
    // In a real implementation, this would parse the actual Fansly API response
    return {
      followers: data?.followersCount || 0,
      totalIncome: data?.totalEarnings || 0,
      currency: data?.currency || 'USD',
      tierBreakdown: (data?.subscriptionTiers || []).map((tier: any) => ({
        tierId: tier.id,
        tierName: tier.name,
        tierAmount: tier.price,
        supporterCount: tier.subscriberCount
      })),
      lastUpdated: new Date()
    };
  } catch (error) {
    logger.error('Failed to parse Fansly account stats', { error });
    throw new Error('Failed to parse Fansly account stats');
  }
};

/**
 * Parse subscriber data from Fansly API
 */
export const parseSubscribers = (data: any) => {
  try {
    // This is a placeholder for the actual parsing logic
    // In a real implementation, this would parse the actual Fansly API response
    return (data?.subscribers || []).map((sub: any) => ({
      userId: sub.userId,
      username: sub.username,
      tierId: sub.tierId,
      tierName: sub.tierName,
      joinedAt: new Date(sub.joinedAt)
    }));
  } catch (error) {
    logger.error('Failed to parse Fansly subscribers', { error });
    throw new Error('Failed to parse Fansly subscribers');
  }
};

/**
 * Check if the API response indicates an authentication error
 */
export const isAuthError = (error: any): boolean => {
  return error?.response?.status === 401 || 
         error?.response?.data?.error === 'unauthorized' ||
         error?.response?.data?.message?.includes('auth');
};

/**
 * Generate appropriate request signature for Fansly API
 * This is usually required for unofficial/reverse-engineered APIs
 */
export const generateRequestSignature = (endpoint: string, data: any = null): string => {
  // This is a placeholder for the actual signature generation logic
  // In a real implementation, this would generate the required signature
  return 'signature-placeholder';
};

/**
 * Add required signature and timestamp to requests
 */
export const prepareRequestBody = (data: any = {}): any => {
  const timestamp = Date.now();
  const signature = generateRequestSignature(data.endpoint, data);
  
  return {
    ...data,
    timestamp,
    signature
  };
}; 